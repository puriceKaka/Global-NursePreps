# Global NursePrep Production Readiness

This project is prepared for a backend/database migration while still running as a static frontend.

## Authentication

- New passwords require at least 8 characters with uppercase, lowercase, number, and symbol.
- Password records use salted PBKDF2 hashes in the server scaffold.
- Registration redirects to login; users must officially log in after account creation.
- Frontend "Remember me" stores only email, not plaintext passwords.

## Fault Tolerance

- API routes use centralized async error handling.
- Responses include `requestId` for support tracing.
- Health endpoints:
  - `GET /api/health`
  - `GET /api/ready`
- The server handles `SIGINT` and `SIGTERM` for graceful shutdown.

## Scalability And Stateless Deployment

- Run multiple Node instances behind Nginx, AWS ALB, Render, Railway, or another load balancer.
- Store users, learning states, payments, and enrollments in PostgreSQL/MySQL/Firestore instead of in-memory fallback.
- Use Redis or a Socket.IO adapter for multi-instance live class rooms.
- Keep uploaded videos/PDFs in object storage such as S3, Firebase Storage, Cloudinary, or Azure Blob.
- Keep secrets in environment variables, never in frontend files.

## Database Ready Files

- `data/database-schema.sql` contains starter tables for users, courses, enrollments, payments, and learning states.
- `server.js` exposes scaffold endpoints for auth and learning state persistence.
