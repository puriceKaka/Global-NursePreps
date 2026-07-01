# Google Meet Clone

A complete video conferencing application similar to Google Meet, built with WebRTC, Socket.IO, and PeerJS.

## Features

- **Video Calling**: Real-time video communication using WebRTC
- **Audio Calling**: High-quality audio with echo cancellation
- **Screen Sharing**: Share your screen with other participants
- **Real-time Chat**: Send messages during meetings
- **Room Management**: Create and join meetings with unique codes
- **Participant Management**: See who's in the meeting
- **Meeting Controls**: Mute/unmute mic, turn camera on/off, leave meeting
- **Responsive Design**: Works on desktop and mobile devices

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
- `GET /api/admin/status`
- `POST /api/admin/bootstrap`
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/me`
- `GET /api/admin/state`
- `PUT /api/admin/state`
- `GET /api/admin/courses`
- `PUT /api/admin/courses`
- `DELETE /api/admin/courses/:courseId`
- `GET /api/learning/state?userId=...`
- `PUT /api/learning/state` with JSON `{ "userId": "...", "state": { ... } }`

Database starter schema:
- `data/database-schema.sql`

Production notes:
- `docs/production-readiness.md`
- `js/api-client.js` provides a token-aware API client for future backend calls.
- `npm run build` regenerates `js/supabase-config.js` from `SUPABASE_URL` and `SUPABASE_ANON_KEY` during Vercel deploys.
- The admin layer falls back to browser storage when `/api/admin/*` is not available, so the static Vercel deployment still runs.

Frontend deployment:
- The site is static-friendly and can be deployed to Vercel without a build step.
- Public course browsing works without login.
- Enrollment, workspace access, and progress tracking remain locked to authenticated users.
- Admin access is cookie-based and server-verified. Configure `ADMIN_SETUP_KEY` in `.env` before creating the first admin account.

Supabase migration note:
- The current frontend still persists learning state in browser storage.
- To move to Supabase, connect the auth and learning flows to a backend service and replace the local storage adapters.
- Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` before deploying if you want the login/register and learning sync code to use Supabase.

3. To create a new meeting:
   - Click "New meeting"
   - Enter a meeting title
   - Click "Start meeting"

4. To join an existing meeting:
   - Click "Join meeting"
   - Enter the meeting code or paste the meeting link
   - Enter your name
   - Click "Join"

## How It Works

### Architecture

- **Frontend**: HTML, CSS, JavaScript
- **WebRTC**: Peer-to-peer video/audio communication
- **PeerJS**: Simplified WebRTC connections
- **Socket.IO**: Signaling server for room management and chat
- **Express**: Web server

### Signaling Server

The signaling server handles:
- Room creation and joining
- User connection/disconnection events
- Chat message broadcasting
- WebRTC signaling (through PeerJS)

### WebRTC Flow

1. User requests access to camera and microphone
2. PeerJS establishes peer connections
3. Socket.IO handles signaling for WebRTC handshake
4. Video/audio streams are exchanged directly between peers
5. Screen sharing replaces video stream when activated

## Browser Support

- Chrome 72+
- Firefox 66+
- Safari 12+
- Edge 79+

## Security Notes

This is a demo implementation. For production use, consider:
- HTTPS for secure connections
- User authentication
- Room access controls
- Encrypted signaling
- Rate limiting

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
