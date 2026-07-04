# Supabase Setup

This project is ready to use with Supabase as the database, auth, and storage layer.

## What goes where

- Student and staff accounts: `public.profiles`
- Course catalog: `public.courses`
- Course chapters or sections: `public.course_modules`
- Lessons, lectures, quizzes, and notes: `public.lectures`
- Uploaded files and media metadata: `public.media_assets`
- Enrollments and course access: `public.enrollments`
- Lesson watch/read progress: `public.lesson_progress`
- Payments and payment references: `public.payments`
- Certificates: `public.certificates`
- Support tickets: `public.support_requests`
- Saved UI or app state: `public.learning_states`
- Audit trail for admin actions: `public.audit_logs`

## Storage buckets

- `avatars` - profile photos
- `course-images` - course cards, banners, and thumbnails
- `lesson-backgrounds` - lesson hero and background images
- `course-documents` - PDFs, handouts, and study files
- `course-videos` - lecture and lesson videos
- `certificates` - generated certificate files
- `support-attachments` - screenshots and documents attached to support requests

## Setup steps

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `data/supabase-schema.sql`.
4. Create the buckets if you want to manage them manually, or let the SQL file create them.
5. Add your project URL and anon key to the frontend environment.
6. Add the service role key only to server-side environment variables.

## Environment variables

Set these values in your deployment platform and local `.env` file:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` if you also run the Node/SQL scaffold directly

## Frontend behavior

- The frontend reads `js/supabase-config.js`.
- `scripts/generate-supabase-config.js` writes that file during build if Supabase env vars are present.
- If the env vars are missing, the app keeps running in its local-storage fallback mode.

## Security notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` out of browser code.
- Use the anon key in client-side pages only.
- Store large videos in `course-videos` instead of embedding them in HTML or JSON.
- Use `media_assets` for the metadata and paths, not for the binary files themselves.
