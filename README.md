<<<<<<< HEAD
# Auralis Product Landing Page

A polished, responsive full-stack landing page for **Auralis One**, a fictional premium wireless headphone. The experience keeps the original quiet-luxury direction—ink navy, warm oat, saffron accents, serif display typography—and now includes persistent contact inquiries and managed file attachments.

## Full-stack capabilities

- **Database:** MySQL/TiDB through Drizzle ORM.
- **Persistence:** The contact form writes `name`, `email`, `message`, status, timestamps, and optional attachment metadata to `contactSubmissions`.
- **File Storage:** Optional contact attachments are uploaded server-side through `storagePut()` to managed S3-compatible storage. The database stores the returned storage key and URL, never the file bytes.
- **Authentication:** Manus OAuth and the existing `users` table are enabled by the full-stack template.
- **Admin access:** `contact.list` is protected by `adminProcedure` for future inbox/dashboard work.
- **API:** tRPC procedures under `/api/trpc` with typed client bindings.

## Contact submission flow

The public `contact.submit` mutation validates the form input, accepts optional PNG/JPG/WEBP/PDF/MP3/WAV files up to 5 MB, uploads the file when present, then persists the inquiry and storage reference. The UI shows pending, success, and error states.

The storage helper returns URLs in the form `/manus-storage/{key}`. Attachments are uploaded from the server so storage credentials never reach the browser.

## Database

Schema source: `drizzle/schema.ts`

- `users` — auth identities and roles.
- `contactSubmissions` — public inquiries and optional storage metadata.

Migration source: `drizzle/0000_outgoing_baron_strucker.sql`

## Run locally

```bash
pnpm install
pnpm dev
```

Useful checks:

```bash
pnpm check
pnpm test
pnpm build
```

The contact form is wired to persistence in the configured WebDev environment. Database and storage credentials are injected by the platform; do not commit `.env` files or hard-code secrets.

## Admin inbox

The protected `/admin/inbox` route uses the full-stack dashboard layout and requires an authenticated admin user. It provides:

- Search across name, email, and message content.
- Status filtering for new, read, and replied inquiries.
- Sorting by newest, name, or status with ascending/descending direction.
- Detail view with attachment links and file metadata.
- Persisted response composer that records an admin reply and marks the inquiry as replied.
- Mailto shortcuts for opening a direct email reply.

## Contact-form UX

The public contact form now validates name, email, message length, and attachment type/size as the user interacts with the fields. Attachment preparation shows a progress bar and upload stage, while the submit action uses an animated loading state. Success and error announcements remain accessible via status/alert regions.
=======
# Auralis-Full-Stack
A full-stack responsive product website built with React, TypeScript, Express, tRPC, Drizzle ORM and MySQL.
>>>>>>> 0b8fa99c6508dbd7a360ef7a6cbdfb994c0aa05d
