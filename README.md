# FileShare — QR-Based File Sharing & Document Management

A full-stack application for uploading documents and sharing them instantly via a unique link and QR code. Recipients can view PDFs page-by-page, download individual pages, or download the full file — all without creating an account.

## Features

- **Authentication** — register/login/logout with JWT stored in an HTTP-only cookie; sessions are revoked immediately if the underlying user is deleted.
- **Google OAuth login** — "Continue with Google" on both Login and Register. A Google sign-in automatically links to an existing email/password account with the same verified email (one `User` row, never a duplicate); if no account exists, a new Google-only account is created.
- **File upload** — PDF, JPG, JPEG, PNG, WEBP, DOC, DOCX, TXT, with server-side MIME/extension validation, filename sanitization, and size limits.
- **QR sharing** — every upload gets a unique share link and QR code (downloadable PNG, copy-to-clipboard, Web Share API). The QR always encodes the real share URL; the owner can optionally set a custom display name (e.g. "My Important Documents") shown in its place — editable any time via the pencil icon, with the raw URL as fallback when no name is set.
- **PDF viewer** — every page rendered, zoom, fit-width, fullscreen, per-page download, full-PDF download. Individual pages are generated server-side with `pdf-lib` (never just the frontend slicing a preview).
- **Image viewer** — zoom, fullscreen, download.
- **Search** — debounced, server-side, paginated, scoped to the authenticated user only.
- **Sharing controls** — disable/enable public sharing, regenerate the share link (invalidates the old one instantly).
- **Dark/light mode** — persisted, applied across every page/modal/component.
- **Security** — Helmet, rate limiting, Zod validation, bcrypt password hashing, IDOR protection (ownership is always checked against `req.user.id`, never a client-supplied `userId`), storage-key path traversal protection, no credentials ever sent to the frontend.

## Architecture

```
qr-file-sharing/
├── frontend/   React + Vite + TypeScript + Tailwind
├── backend/    Node + Express + TypeScript + Prisma + MongoDB Atlas
├── storage/    Local file storage (dev fallback) — actual files live in Cloudflare R2
└── docker-compose.yml
```

The database is **MongoDB Atlas** — Prisma's `mongodb` connector, with `@db.ObjectId` ids and no SQL migrations (schema changes are applied with `prisma db push`, not `prisma migrate`).

The backend uses a small storage abstraction (`backend/src/services/storage.service.ts`) with two interchangeable drivers:

- **`local`** (default) — writes to `storage/uploads/` on disk. Zero external dependencies, works immediately.
- **`r2`** — talks to Cloudflare R2 (or any S3-compatible service) via the AWS SDK. Toggle with `STORAGE_DRIVER=r2` in `backend/.env` and fill in the `R2_*` variables. Only file *metadata* (name, size, MIME type, storage key) is ever stored in MongoDB — the actual file bytes always live in R2.

Nothing in the rest of the codebase (controllers, services, routes) knows or cares which storage driver is active — switching is a one-line env change.

## Tech Stack

**Frontend:** React, Vite, TypeScript, Tailwind CSS, React Router, Axios, Lucide React, react-hot-toast, react-pdf (PDF.js)

**Backend:** Node.js, Express, TypeScript, Prisma ORM, MongoDB Atlas, JWT + HTTP-only cookies, bcryptjs, google-auth-library (Google OAuth), pdf-lib, qrcode, multer, zod, helmet, express-rate-limit

**Storage:** Cloudflare R2 (production) with a local-disk fallback driver for offline dev

## Installation

### Prerequisites

- Node.js 20+
- A MongoDB Atlas cluster (free tier is fine) — see [MongoDB Atlas Setup](#mongodb-atlas-setup) below

### 1. Install dependencies (root workspace installs both apps)

```bash
npm install
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env`:

```env
PORT=8000
DATABASE_URL="mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/scaner?retryWrites=true&w=majority"
JWT_SECRET=<generate a long random string>
FRONTEND_URL=http://localhost:5173
STORAGE_DRIVER=local
```

Generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Google OAuth is optional for local dev — leave `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` blank and email/password auth works fully; the "Continue with Google" button will show a clear error until configured. See [Google OAuth Setup](#google-oauth-setup) below.

### 3. MongoDB Atlas Setup

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Database Access** → add a database user with a username/password.
3. **Network Access** → add your current IP (or `0.0.0.0/0` for quick local testing only — restrict this in production).
4. **Database → Connect → Drivers** → copy the connection string and paste it into `DATABASE_URL` in `backend/.env`, filling in your username/password and keeping `?retryWrites=true&w=majority`.
5. If you get a `Server selection timeout` / `invalid peer certificate: UnknownIssuer` error when connecting: this means something on your machine or network is intercepting TLS (a corporate proxy, or antivirus "web shield" HTTPS scanning — Avast, Kaspersky, etc. are common culprits). Prisma's MongoDB driver validates the certificate itself and rejects a locally-substituted one. Fix: disable HTTPS/web-traffic scanning in your antivirus (or add an exception for `*.mongodb.net`), then retry.

### 4. Sync the Prisma schema to MongoDB

MongoDB has no SQL migrations, so this project does **not** use `prisma migrate`. Instead, push the schema directly:

```bash
cd backend
npx prisma generate
npx prisma db push
```

`prisma db push` creates the `User` and `File` collections (and their indexes) to match `prisma/schema.prisma`. Re-run it any time you change the schema.

### 5. Start the app

From the project root, in two terminals:

```bash
npm run dev:backend    # http://localhost:8000
npm run dev:frontend   # http://localhost:5173
```

Register an account, upload a file, and you're live.

## Cloudflare R2 Setup (Production Storage)

1. Create an R2 bucket in the Cloudflare dashboard.
2. Create an R2 API token (Account → R2 → Manage API Tokens) with read/write access.
3. Set these in `backend/.env`:

```env
STORAGE_DRIVER=r2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=your-bucket-name
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://your-public-r2-domain (optional, only if bucket has public access enabled)
```

`R2_ENDPOINT` must be the bare account endpoint (no bucket path appended) — the bucket name is passed separately via `R2_BUCKET_NAME`.

R2 credentials live only in backend environment variables and are never sent to the frontend. The same driver works unmodified against AWS S3 (R2 is S3-API-compatible) — just point `R2_ENDPOINT` at `https://s3.<region>.amazonaws.com` and use AWS credentials.

## Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and create (or select) a project.
2. Configure the OAuth consent screen (External is fine for testing) — add your email as a test user if the app is still in "Testing" publishing status.
3. Create an **OAuth client ID** → Application type: **Web application**.
4. Add an **Authorized redirect URI**:
   - Local dev: `http://localhost:8000/api/auth/google/callback`
   - Production: `https://your-api-domain.com/api/auth/google/callback`
5. Copy the generated Client ID and Client Secret into `backend/.env`:

```env
GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxx
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback
```

6. Restart the backend. The "Continue with Google" button on `/login` and `/register` now redirects to Google, and back to `/dashboard` on success (or `/login?error=google_auth_failed` on failure).

**How account linking works:** the backend verifies the Google ID token server-side (`google-auth-library`), requires `email_verified: true`, then:
- If a user with that `googleId` already exists → logs them in.
- Else if a user with that **email** already exists (e.g. they registered with a password) → links the Google account to that same `User` row (sets `googleId`, keeps the existing `passwordHash` so both login methods keep working).
- Else → creates a new `User` with `authProvider: GOOGLE` and no password.

This guarantees one account per verified email, regardless of which login method was used first.

## Production Deployment

```bash
# Backend
cd backend
npm run build
npx prisma db push
npm start

# Frontend
cd frontend
npm run build   # outputs static files to frontend/dist
```

Serve `frontend/dist` from any static host or the provided Nginx Docker image, and point it at the deployed backend via `VITE_API_URL`.

### Docker

```bash
docker compose up -d --build
```

This builds and starts the backend (schema is pushed to MongoDB Atlas automatically on container start) and the frontend behind Nginx. MongoDB Atlas and R2 are both external managed services — set `DATABASE_URL` and the `R2_*` variables in `backend/.env` before building; no database container is included since Atlas is cloud-hosted.

## API Documentation

All responses follow `{ success: true, data }` or `{ success: false, message }`.

### Auth

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` → creates account, sets session cookie |
| POST | `/api/auth/login` | `{ email, password }` → sets session cookie |
| POST | `/api/auth/logout` | Clears session cookie |
| GET | `/api/auth/me` | Returns current authenticated user (401 if not logged in or user was deleted) |
| GET | `/api/auth/google` | Redirects to Google's OAuth consent screen (503 if not configured) |
| GET | `/api/auth/google/callback` | Handles Google's redirect, links/creates the account, sets session cookie, redirects to `/dashboard` |

### Files (all require auth)

| Method | Route | Description |
|---|---|---|
| POST | `/api/files/upload` | multipart `file` field → uploads, generates share ID + QR |
| GET | `/api/files?page=&limit=` | Paginated list of the caller's files |
| GET | `/api/files/search?q=&page=&limit=` | Server-side, case-insensitive filename search |
| GET | `/api/files/:id` | File metadata + QR code + share URL (owner only) |
| DELETE | `/api/files/:id` | Deletes from storage + DB, invalidates share link (owner only) |
| POST | `/api/files/:id/regenerate-share` | Issues a new share ID; old one immediately 404s (owner only) |
| PATCH | `/api/files/:id/sharing` | `{ isPublic: boolean }` — enable/disable public access (owner only) |
| PATCH | `/api/files/:id/display-name` | `{ displayName: string \| null }` — custom text shown in place of the raw share URL (owner only, max 120 chars, empty clears it) |

### Public Share (no auth)

| Method | Route | Description |
|---|---|---|
| GET | `/api/share/:shareId` | Public metadata (+ PDF page count if applicable) |
| GET | `/api/share/:shareId/download` | Downloads the original file |
| GET | `/api/share/:shareId/page/:pageNumber` | Generates and downloads a single-page PDF, on the fly, via `pdf-lib` |

## Security Notes

- Passwords hashed with bcrypt (12 rounds); JWTs stored in `httpOnly`, `sameSite=lax` cookies (never `localStorage`).
- Every protected request re-verifies the user still exists in the database — a deleted account's old JWT is rejected even before expiry.
- File ownership is enforced server-side via `req.user.id` from the verified JWT; the client can never supply a `userId` for authorization.
- Filenames are sanitized before being used in storage keys; storage keys are randomly generated and namespaced per user, preventing path traversal and enumeration.
- MIME type and file extension are both validated server-side; the client-supplied values are never trusted alone.
- Public share responses never include passwords, JWTs, storage credentials, or other users' data.
- Rate limiting is applied globally and more aggressively on `/api/auth/*` and `/api/files/upload`.

## Testing

```bash
cd backend
npm test
```

Covers: registration/login/logout/duplicate-email/invalid-credentials, protected-route auth, IDOR protection (cross-user file access + delete), search isolation between users, PDF page-count/extraction correctness (including out-of-range page numbers), full-PDF vs single-page download, share-link disable/regenerate/delete invalidation, Google account linking (existing-email linking, new-account creation, repeated-login idempotency, unverified-email rejection).

## Troubleshooting

- **"Missing required environment variable"** — copy `.env.example` to `.env` in both `backend/` and `frontend/`.
- **"DATABASE_URL must be a MongoDB connection string..."** — `DATABASE_URL` must start with `mongodb://` or `mongodb+srv://`; this project no longer supports PostgreSQL.
- **`Server selection timeout` / `invalid peer certificate: UnknownIssuer` when connecting to MongoDB** — something between your machine and Atlas is intercepting TLS (corporate proxy, or antivirus HTTPS/web-shield scanning — Avast and similar tools are common causes). Disable HTTPS scanning or add a `*.mongodb.net` exception, then retry. This is a network/OS-level issue, not a code or credentials problem.
- **"Index already exists in the model" from `prisma validate`** — MongoDB's Prisma connector auto-creates an index for any `@unique` field, so don't also add a matching `@@index` for that same single field.
- **CORS errors in the browser** — `FRONTEND_URL` in `backend/.env` must exactly match the origin the frontend is served from.
- **Uploads fail with 413** — the file exceeds `MAX_FILE_SIZE_MB` (default 25MB); raise it in `backend/.env` if needed.
- **QR / share links point to the wrong domain** — set `FRONTEND_URL` (backend) to your deployed frontend URL before generating new share links; existing QR codes are not regenerated automatically.

## Final Testing Checklist

- [x] Frontend builds (`npm run build` in `frontend/`)
- [x] Backend builds (`npm run build` in `backend/`)
- [x] `npx prisma validate` passes against the MongoDB schema
- [x] `npx prisma generate` succeeds
- [x] Register / login / logout / protected routes
- [x] Deleted-user JWT is rejected
- [x] File upload (PDF, image, txt) with MIME + extension validation
- [x] Unsupported file types rejected with 400
- [x] R2-compatible storage driver + local fallback
- [x] QR code generated on upload
- [x] Public share page works without login
- [x] PDF preview renders all pages
- [x] Individual PDF page download returns exactly one page
- [x] Full PDF download returns the complete file, byte-identical to the original
- [x] Search is server-side, case-insensitive, paginated, and scoped per user
- [x] Delete removes both the storage object and DB row, and 404s the old share link
- [x] Regenerate share link invalidates the old one
- [x] Disable/enable sharing toggles public access
- [x] IDOR protection verified (cross-user access + delete both blocked with 403)
- [x] Dark/light mode across all pages and components
- [x] Google login links to the same account as email/password for a matching verified email (no duplicates)
- [x] Automated test suite passing (32/32)
- [ ] Live end-to-end Google OAuth redirect (requires real `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` — account-linking logic and route wiring are verified, but the live consent-screen round trip needs credentials only you can provide)
