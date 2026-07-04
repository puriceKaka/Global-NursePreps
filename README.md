# Global NursePrep

A multi-page nursing learning platform with public marketing pages, student dashboard screens, admin course management, and optional backend scaffolding for auth and progress data.

## Features

- **Public Site**: Marketing, contact, policy, and support pages
- **Student Area**: Dashboard, courses, exams, profiles, and learning progress
- **Admin Tools**: Course management and learning content scaffolding
- **Static Deployment**: Works on Vercel without a backend
- **Optional Backend**: Firebase/Supabase-ready client and server stubs

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A modern web browser with WebRTC support

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

1. Start the signaling server:
   ```bash
   npm start
   ```

2. Open your browser and navigate to `http://localhost:3000`

## Firebase Backend (Optional / DB-Ready Scaffold)

This repo ships with an optional API scaffold in `server.js` that can persist learning progress to Firestore **if** you configure Firebase Admin SDK.

1. Copy `.env.example` → `.env` and fill in your Firebase service account values.
2. Install the admin SDK:
   ```bash
   npm i firebase-admin
   ```
3. Start the server:
   ```bash
   npm start
   ```

Endpoints:
- `GET /api/health`
- `GET /api/ready`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/verify` with `Authorization: Bearer <token>`
- `GET /api/learning/state?userId=...`
- `PUT /api/learning/state` with JSON `{ "userId": "...", "state": { ... } }`

Database starter schema:
- `data/database-schema.sql`

Production notes:
- `docs/production-readiness.md`
- `js/api-client.js` provides a token-aware API client for future backend calls.
- The admin layer falls back to browser storage when `/api/admin/*` is not available, so the static Vercel deployment still runs.

Frontend deployment:
- The site is static-friendly and can be deployed to Vercel without a build step.
- Public course browsing works without login.
- Enrollment, workspace access, and progress tracking remain locked to authenticated users.
- Admin access is cookie-based and server-verified. Configure `ADMIN_SETUP_KEY` in `.env` before creating the first admin account.
- Deploy the repository root directly as a static site.
- Keep `vercel.json` for clean URLs only.
- Do not set an output directory for the frontend. The HTML, CSS, JS, and images already live in the root tree.
- If Supabase env vars are omitted, the committed fallback config keeps the site working in local-storage mode.

Supabase migration note:
- The current frontend still persists learning state in browser storage.
- To move to Supabase, connect the auth and learning flows to a backend service and replace the local storage adapters.
- Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` before deploying if you want the login/register and learning sync code to use Supabase.

## Troubleshooting

### Camera/Microphone Not Working
- Check browser permissions
- Ensure HTTPS (required for media access in some browsers)
- Try refreshing the page

### Connection Issues
- Make sure the signaling server is running
- Check firewall settings
- Try a different network

### Screen Sharing Not Working
- Screen sharing requires HTTPS
- Check browser support
- Some browsers require user gesture to start screen sharing
