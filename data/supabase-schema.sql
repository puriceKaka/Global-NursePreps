-- Global NursePrep Supabase schema
-- PostgreSQL + Supabase Storage
-- This schema is meant to be imported into the Supabase SQL editor.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create or replace function public.has_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
    select exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role = any(required_roles)
    );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
    select public.has_role(array['admin', 'lecturer', 'support', 'finance', 'super_admin']);
$$;

create or replace function public.can_view_course(target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
    select exists (
        select 1
        from public.courses c
        where c.id = target_course_id
          and (
              c.status = 'published'
              or public.is_staff()
              or exists (
                  select 1
                  from public.enrollments e
                  where e.course_id = c.id
                    and e.user_id = auth.uid()
                    and e.status in ('enrolled', 'active', 'completed')
              )
          )
    );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    raw_role text;
begin
    raw_role := coalesce(new.raw_user_meta_data->>'role', 'student');
    if raw_role not in ('student', 'lecturer', 'admin', 'support', 'finance', 'super_admin') then
        raw_role := 'student';
    end if;

    insert into public.profiles (
        id,
        full_name,
        email,
        role,
        phone,
        country,
        institution,
        specialty,
        student_number,
        lecturer_code,
        metadata
    )
    values (
        new.id,
        coalesce(
            new.raw_user_meta_data->>'full_name',
            new.raw_user_meta_data->>'name',
            split_part(coalesce(new.email, ''), '@', 1)
        ),
        coalesce(new.email, ''),
        raw_role,
        nullif(new.raw_user_meta_data->>'phone', ''),
        nullif(new.raw_user_meta_data->>'country', ''),
        nullif(new.raw_user_meta_data->>'institution', ''),
        nullif(new.raw_user_meta_data->>'specialty', ''),
        nullif(new.raw_user_meta_data->>'student_number', ''),
        nullif(new.raw_user_meta_data->>'lecturer_code', ''),
        coalesce(new.raw_user_meta_data, '{}'::jsonb)
    )
    on conflict (id) do update set
        full_name = excluded.full_name,
        email = excluded.email,
        role = excluded.role,
        phone = excluded.phone,
        country = excluded.country,
        institution = excluded.institution,
        specialty = excluded.specialty,
        student_number = excluded.student_number,
        lecturer_code = excluded.lecturer_code,
        metadata = excluded.metadata,
        updated_at = now();

    return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Core identity data
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    email text not null unique,
    role text not null default 'student' check (
        role in ('student', 'lecturer', 'admin', 'support', 'finance', 'super_admin')
    ),
    phone text,
    country text,
    institution text,
    specialty text,
    student_number text,
    lecturer_code text,
    avatar_url text,
    bio text,
    metadata jsonb not null default '{}'::jsonb,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_email on public.profiles(email);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Courses and learning content
-- ---------------------------------------------------------------------------

create table if not exists public.courses (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    title text not null,
    description text,
    summary text,
    category text not null default 'Nursing',
    subcategory text,
    level text not null default 'Beginner',
    badge text not null default 'New',
    access_type text not null default 'free' check (
        access_type in ('free', 'paid', 'premium', 'sponsored')
    ),
    price_kes numeric(12,2) not null default 0,
    duration_hours integer not null default 0,
    question_count integer not null default 0,
    exam_count integer not null default 0,
    thumbnail_url text,
    cover_image_url text,
    hero_image_url text,
    course_video_url text,
    course_video_name text,
    course_video_source text,
    source_document_name text,
    source_document_path text,
    lesson_background_image_url text,
    document_cover_image_url text,
    content_notes text,
    module_titles jsonb not null default '[]'::jsonb,
    generated_lessons jsonb not null default '[]'::jsonb,
    tags text[] not null default '{}'::text[],
    lecturer_id uuid references public.profiles(id) on delete set null,
    created_by uuid references public.profiles(id) on delete set null,
    source text not null default 'admin',
    status text not null default 'draft' check (
        status in ('draft', 'published', 'archived', 'hidden')
    ),
    published_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_courses_category on public.courses(category);
create index if not exists idx_courses_status on public.courses(status);
create index if not exists idx_courses_lecturer on public.courses(lecturer_id);

drop trigger if exists trg_courses_updated_at on public.courses;
create trigger trg_courses_updated_at
before update on public.courses
for each row execute function public.set_updated_at();

create table if not exists public.course_modules (
    id uuid primary key default gen_random_uuid(),
    course_id uuid not null references public.courses(id) on delete cascade,
    title text not null,
    description text,
    order_index integer not null default 1,
    lesson_count integer not null default 0,
    metadata jsonb not null default '{}'::jsonb,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (course_id, order_index)
);

create index if not exists idx_course_modules_course on public.course_modules(course_id);

drop trigger if exists trg_course_modules_updated_at on public.course_modules;
create trigger trg_course_modules_updated_at
before update on public.course_modules
for each row execute function public.set_updated_at();

create table if not exists public.lectures (
    id uuid primary key default gen_random_uuid(),
    course_id uuid not null references public.courses(id) on delete cascade,
    module_id uuid references public.course_modules(id) on delete set null,
    title text not null,
    subtitle text,
    lecture_type text not null default 'video' check (
        lecture_type in ('video', 'document', 'quiz', 'live_session', 'note', 'exam')
    ),
    order_index integer not null default 1,
    duration_minutes integer not null default 0,
    objectives jsonb not null default '[]'::jsonb,
    body text,
    summary text,
    transcript text,
    notes_markdown text,
    status text not null default 'draft' check (
        status in ('draft', 'published', 'archived', 'hidden')
    ),
    metadata jsonb not null default '{}'::jsonb,
    created_by uuid references public.profiles(id) on delete set null,
    updated_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (course_id, order_index)
);

create index if not exists idx_lectures_course on public.lectures(course_id);
create index if not exists idx_lectures_module on public.lectures(module_id);

drop trigger if exists trg_lectures_updated_at on public.lectures;
create trigger trg_lectures_updated_at
before update on public.lectures
for each row execute function public.set_updated_at();

create table if not exists public.media_assets (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid references public.profiles(id) on delete set null,
    course_id uuid references public.courses(id) on delete cascade,
    lecture_id uuid references public.lectures(id) on delete cascade,
    bucket_name text not null,
    storage_path text not null unique,
    public_url text,
    file_name text,
    file_kind text not null check (
        file_kind in ('video', 'document', 'image', 'audio', 'avatar', 'certificate', 'attachment')
    ),
    mime_type text,
    size_bytes bigint,
    checksum text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_media_assets_course on public.media_assets(course_id);
create index if not exists idx_media_assets_lecture on public.media_assets(lecture_id);
create index if not exists idx_media_assets_bucket on public.media_assets(bucket_name);

-- ---------------------------------------------------------------------------
-- Student data, payments, and progress
-- ---------------------------------------------------------------------------

create table if not exists public.enrollments (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    course_id uuid not null references public.courses(id) on delete cascade,
    status text not null default 'locked' check (
        status in ('locked', 'enrolled', 'active', 'completed', 'suspended', 'expired')
    ),
    progress_percent numeric(5,2) not null default 0,
    last_accessed_at timestamptz,
    enrolled_at timestamptz not null default now(),
    expires_at timestamptz,
    source text not null default 'payment',
    metadata jsonb not null default '{}'::jsonb,
    unique (user_id, course_id)
);

create index if not exists idx_enrollments_user on public.enrollments(user_id);
create index if not exists idx_enrollments_course on public.enrollments(course_id);

create table if not exists public.lesson_progress (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    course_id uuid not null references public.courses(id) on delete cascade,
    lecture_id uuid not null references public.lectures(id) on delete cascade,
    progress_percent numeric(5,2) not null default 0,
    last_position_seconds integer not null default 0,
    completed boolean not null default false,
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    last_accessed_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    unique (user_id, lecture_id)
);

create index if not exists idx_lesson_progress_user on public.lesson_progress(user_id);
create index if not exists idx_lesson_progress_course on public.lesson_progress(course_id);

create table if not exists public.payments (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    course_id uuid references public.courses(id) on delete set null,
    gateway text not null,
    reference text not null unique,
    amount_kes numeric(12,2) not null,
    currency text not null default 'KES',
    status text not null default 'pending' check (
        status in ('pending', 'initiated', 'paid', 'verified', 'failed', 'refunded')
    ),
    payer_name text,
    payer_phone text,
    payload jsonb not null default '{}'::jsonb,
    verified_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_payments_user_status on public.payments(user_id, status);
create index if not exists idx_payments_course on public.payments(course_id);

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create table if not exists public.certificates (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    course_id uuid not null references public.courses(id) on delete cascade,
    certificate_number text not null unique,
    certificate_url text,
    status text not null default 'issued' check (
        status in ('issued', 'revoked', 'expired')
    ),
    issued_at timestamptz not null default now(),
    verified_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    unique (user_id, course_id)
);

create index if not exists idx_certificates_user on public.certificates(user_id);
create index if not exists idx_certificates_course on public.certificates(course_id);

create table if not exists public.support_requests (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete set null,
    request_type text not null default 'general' check (
        request_type in ('technical', 'payment', 'research', 'course', 'licensing', 'exam', 'general')
    ),
    subject text not null,
    message text not null,
    status text not null default 'open' check (
        status in ('open', 'in_review', 'resolved', 'closed')
    ),
    priority text not null default 'normal' check (
        priority in ('low', 'normal', 'high', 'urgent')
    ),
    assigned_to uuid references public.profiles(id) on delete set null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_support_requests_user on public.support_requests(user_id);
create index if not exists idx_support_requests_status on public.support_requests(status);

drop trigger if exists trg_support_requests_updated_at on public.support_requests;
create trigger trg_support_requests_updated_at
before update on public.support_requests
for each row execute function public.set_updated_at();

create table if not exists public.learning_states (
    user_id uuid primary key references public.profiles(id) on delete cascade,
    state jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
);

drop trigger if exists trg_learning_states_updated_at on public.learning_states;
create trigger trg_learning_states_updated_at
before update on public.learning_states
for each row execute function public.set_updated_at();

create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    actor_id uuid references public.profiles(id) on delete set null,
    action text not null,
    entity_type text not null,
    entity_id uuid,
    details jsonb not null default '{}'::jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.lectures enable row level security;
alter table public.media_assets enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.payments enable row level security;
alter table public.certificates enable row level security;
alter table public.support_requests enable row level security;
alter table public.learning_states enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "profiles_select_own_or_staff" on public.profiles;
create policy "profiles_select_own_or_staff"
on public.profiles
for select
using (auth.uid() = id or public.is_staff());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id or public.is_staff());

drop policy if exists "profiles_update_own_or_staff" on public.profiles;
create policy "profiles_update_own_or_staff"
on public.profiles
for update
using (auth.uid() = id or public.is_staff())
with check (auth.uid() = id or public.is_staff());

drop policy if exists "profiles_delete_staff" on public.profiles;
create policy "profiles_delete_staff"
on public.profiles
for delete
using (public.is_staff());

drop policy if exists "courses_select_published_or_staff" on public.courses;
create policy "courses_select_published_or_staff"
on public.courses
for select
using (status = 'published' or public.is_staff());

drop policy if exists "courses_staff_write" on public.courses;
create policy "courses_staff_write"
on public.courses
for all
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "course_modules_view" on public.course_modules;
create policy "course_modules_view"
on public.course_modules
for select
using (public.can_view_course(course_id));

drop policy if exists "course_modules_staff_write" on public.course_modules;
create policy "course_modules_staff_write"
on public.course_modules
for all
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "lectures_view" on public.lectures;
create policy "lectures_view"
on public.lectures
for select
using (public.can_view_course(course_id));

drop policy if exists "lectures_staff_write" on public.lectures;
create policy "lectures_staff_write"
on public.lectures
for all
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "media_assets_view" on public.media_assets;
create policy "media_assets_view"
on public.media_assets
for select
using (
    bucket_name in ('avatars', 'course-images', 'lesson-backgrounds')
    or auth.role() = 'authenticated'
);

drop policy if exists "media_assets_staff_or_owner_write" on public.media_assets;
create policy "media_assets_staff_or_owner_write"
on public.media_assets
for insert
with check (
    public.is_staff()
    or (
        bucket_name in ('avatars', 'support-attachments')
        and auth.uid() = owner_id
    )
);

drop policy if exists "media_assets_update" on public.media_assets;
create policy "media_assets_update"
on public.media_assets
for update
using (
    public.is_staff()
    or (
        bucket_name in ('avatars', 'support-attachments')
        and auth.uid() = owner_id
    )
)
with check (
    public.is_staff()
    or (
        bucket_name in ('avatars', 'support-attachments')
        and auth.uid() = owner_id
    )
);

drop policy if exists "media_assets_delete" on public.media_assets;
create policy "media_assets_delete"
on public.media_assets
for delete
using (
    public.is_staff()
    or (
        bucket_name in ('avatars', 'support-attachments')
        and auth.uid() = owner_id
    )
);

drop policy if exists "enrollments_select_own_or_staff" on public.enrollments;
create policy "enrollments_select_own_or_staff"
on public.enrollments
for select
using (auth.uid() = user_id or public.is_staff());

drop policy if exists "enrollments_insert_own_or_staff" on public.enrollments;
create policy "enrollments_insert_own_or_staff"
on public.enrollments
for insert
with check (auth.uid() = user_id or public.is_staff());

drop policy if exists "enrollments_update_own_or_staff" on public.enrollments;
create policy "enrollments_update_own_or_staff"
on public.enrollments
for update
using (auth.uid() = user_id or public.is_staff())
with check (auth.uid() = user_id or public.is_staff());

drop policy if exists "enrollments_delete_staff" on public.enrollments;
create policy "enrollments_delete_staff"
on public.enrollments
for delete
using (public.is_staff());

drop policy if exists "lesson_progress_select_own_or_staff" on public.lesson_progress;
create policy "lesson_progress_select_own_or_staff"
on public.lesson_progress
for select
using (auth.uid() = user_id or public.is_staff());

drop policy if exists "lesson_progress_own_or_staff" on public.lesson_progress;
create policy "lesson_progress_own_or_staff"
on public.lesson_progress
for all
using (auth.uid() = user_id or public.is_staff())
with check (auth.uid() = user_id or public.is_staff());

drop policy if exists "payments_select_own_or_staff" on public.payments;
create policy "payments_select_own_or_staff"
on public.payments
for select
using (auth.uid() = user_id or public.is_staff());

drop policy if exists "payments_insert_own_or_staff" on public.payments;
create policy "payments_insert_own_or_staff"
on public.payments
for insert
with check (auth.uid() = user_id or public.is_staff());

drop policy if exists "payments_update_staff" on public.payments;
create policy "payments_update_staff"
on public.payments
for update
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "payments_delete_staff" on public.payments;
create policy "payments_delete_staff"
on public.payments
for delete
using (public.is_staff());

drop policy if exists "certificates_select_own_or_staff" on public.certificates;
create policy "certificates_select_own_or_staff"
on public.certificates
for select
using (auth.uid() = user_id or public.is_staff());

drop policy if exists "certificates_staff_write" on public.certificates;
create policy "certificates_staff_write"
on public.certificates
for all
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "support_requests_select_own_or_staff" on public.support_requests;
create policy "support_requests_select_own_or_staff"
on public.support_requests
for select
using (auth.uid() = user_id or public.is_staff());

drop policy if exists "support_requests_insert_own" on public.support_requests;
create policy "support_requests_insert_own"
on public.support_requests
for insert
with check (auth.uid() = user_id or auth.uid() is not null);

drop policy if exists "support_requests_staff_update" on public.support_requests;
create policy "support_requests_staff_update"
on public.support_requests
for update
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "learning_states_select_own_or_staff" on public.learning_states;
create policy "learning_states_select_own_or_staff"
on public.learning_states
for select
using (auth.uid() = user_id or public.is_staff());

drop policy if exists "learning_states_own_or_staff" on public.learning_states;
create policy "learning_states_own_or_staff"
on public.learning_states
for all
using (auth.uid() = user_id or public.is_staff())
with check (auth.uid() = user_id or public.is_staff());

drop policy if exists "audit_logs_staff_only" on public.audit_logs;
create policy "audit_logs_staff_only"
on public.audit_logs
for all
using (public.is_staff())
with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
    ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
    ('course-images', 'course-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
    ('lesson-backgrounds', 'lesson-backgrounds', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
    ('course-documents', 'course-documents', false, 52428800, array['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
    ('course-videos', 'course-videos', false, 1073741824, array['video/mp4', 'video/webm', 'video/quicktime']),
    ('certificates', 'certificates', false, 10485760, array['application/pdf']),
    ('support-attachments', 'support-attachments', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set
    name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read public assets" on storage.objects;
create policy "Public read public assets"
on storage.objects
for select
using (bucket_id in ('avatars', 'course-images', 'lesson-backgrounds'));

drop policy if exists "Authenticated read private assets" on storage.objects;
create policy "Authenticated read private assets"
on storage.objects
for select
using (
    bucket_id in ('course-documents', 'course-videos', 'certificates', 'support-attachments')
    and auth.role() = 'authenticated'
);

drop policy if exists "Staff or owners upload assets" on storage.objects;
create policy "Staff or owners upload assets"
on storage.objects
for insert
with check (
    (
        bucket_id in ('course-images', 'lesson-backgrounds', 'course-documents', 'course-videos', 'certificates')
        and public.is_staff()
    )
    or (
        bucket_id in ('avatars', 'support-attachments')
        and auth.uid() = owner
    )
);

drop policy if exists "Staff or owners update assets" on storage.objects;
create policy "Staff or owners update assets"
on storage.objects
for update
using (
    public.is_staff()
    or (
        bucket_id in ('avatars', 'support-attachments')
        and auth.uid() = owner
    )
)
with check (
    public.is_staff()
    or (
        bucket_id in ('avatars', 'support-attachments')
        and auth.uid() = owner
    )
);

drop policy if exists "Staff or owners delete assets" on storage.objects;
create policy "Staff or owners delete assets"
on storage.objects
for delete
using (
    public.is_staff()
    or (
        bucket_id in ('avatars', 'support-attachments')
        and auth.uid() = owner
    )
);

-- ---------------------------------------------------------------------------
-- Optional public helper view
-- ---------------------------------------------------------------------------

create or replace view public.course_public_catalog as
select
    c.id,
    c.slug,
    c.title,
    c.description,
    c.summary,
    c.category,
    c.subcategory,
    c.level,
    c.badge,
    c.access_type,
    c.price_kes,
    c.duration_hours,
    c.question_count,
    c.exam_count,
    c.thumbnail_url,
    c.cover_image_url,
    c.hero_image_url,
    c.status,
    c.published_at,
    coalesce(p.full_name, 'Global NursePrep') as lecturer_name,
    coalesce(mods.module_count, 0) as module_count,
    coalesce(lessons.lecture_count, 0) as lecture_count
from public.courses c
left join public.profiles p on p.id = c.lecturer_id
left join (
    select course_id, count(*)::int as module_count
    from public.course_modules
    group by course_id
) mods on mods.course_id = c.id
left join (
    select course_id, count(*)::int as lecture_count
    from public.lectures
    group by course_id
) lessons on lessons.course_id = c.id
where c.status = 'published';
