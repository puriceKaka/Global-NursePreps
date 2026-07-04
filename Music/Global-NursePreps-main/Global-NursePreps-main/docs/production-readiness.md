# Global NursePrep Production Readiness

This project is ready to run as a static Vercel frontend with Supabase for data.

## Database files

- `data/supabase-schema.sql` is the main SQL file for Supabase.
- `data/database-schema.sql` is the older starter schema kept for reference.

## Deployment

- Use the repository root as the Vercel project root.
- Build command: `npm run build`
- Output directory: `dist`
- Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Vercel.

## Storage

- Keep uploads in Supabase Storage, not in HTML or JSON.
- Use the `course-videos` bucket for lecture videos.
- Use `course-documents` for PDFs and study files.

## Security

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Use the anon key in frontend pages only.
