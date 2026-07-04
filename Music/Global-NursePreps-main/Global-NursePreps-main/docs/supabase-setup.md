# Supabase Setup

This project is ready for Supabase as its database and storage layer.

## What stores what

- Student and admin identities: `public.profiles`
- Course catalog: `public.courses`
- Course sections: `public.course_modules`
- Lectures, videos, quizzes, and notes: `public.lectures`
- File metadata and paths: `public.media_assets`
- Enrollments: `public.enrollments`
- Learning progress: `public.lesson_progress` and `public.learning_states`
- Payments: `public.payments`
- Certificates: `public.certificates`
- Support tickets: `public.support_requests`
- Audit logs: `public.audit_logs`

## Storage buckets

- `avatars`
- `course-images`
- `lesson-backgrounds`
- `course-documents`
- `course-videos`
- `certificates`
- `support-attachments`

## How to set it up

1. Create a Supabase project.
2. Open the SQL editor.
3. Paste and run `data/supabase-schema.sql`.
4. Create the storage buckets if they do not exist already.
5. Put `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Vercel environment variables.
6. Keep `SUPABASE_SERVICE_ROLE_KEY` only in server-side secrets.

## Vercel settings

- Build command: `npm run build`
- Output directory: `dist`
- Root directory: project root

## Important note

The frontend uses `js/supabase-config.js`. During build, `scripts/generate-supabase-config.js` writes the Supabase URL and anon key into that file when the environment variables are present.
