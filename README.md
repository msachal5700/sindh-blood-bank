# Sindh Blood Bank

A full-stack blood donation platform for Sindh, Pakistan — built as **one Next.js project**:
the public frontend, role dashboards, and the backend API routes all live in this repo,
backed by Postgres via Prisma.

## What it does

- **Public Find Blood (no login):** pick a blood group (O+, O-, A+, A-, B+, B-, AB+, AB-) and your
  city — results are ordered **nearest city first** (haversine on city coordinates). Every bank card
  shows stock per group split into **Free / Paid (Rs per unit) / Exchange**, with free units
  highlighted.
- **Patient / Recipient account:** register, request blood from a chosen bank (group, mode, units,
  hospital, urgency), track request statuses, cancel pending requests.
- **Donor account:** register, book a donation appointment at any branch, see appointments and
  donation history.
- **Blood Bank account (per branch):** dashboard scoped to its own branch only — edit its own
  stock, see incoming requests and **approve / reject / fulfil** them. Approving a request
  **decrements the matching stock in the database** in the same transaction.
- **Super Admin (Master Dashboard):** all 8 Sindh cities and 12 branches, demand vs free blood
  per city, stock by blood group, and the Free / Paid / Exchange split — all computed live
  from the database.

Auth is email + password with **bcrypt** hashing and a signed, httpOnly session cookie.

## Tech stack

- Next.js 15 (App Router, TypeScript) — frontend + API routes
- Prisma ORM — schema targets **PostgreSQL** (`prisma/schema.prisma`)
- bcryptjs password hashing, HMAC-signed session cookie (no paid services)

## Local run

```bash
npm install
cp .env.example .env          # set DATABASE_URL (Neon/Supabase Postgres) + SESSION_SECRET
npx prisma db push            # create tables
npm run seed                  # seed cities, branches, stock, requests, donations, test accounts
npm run dev                   # http://localhost:3000
npm run build && npm start    # production build
```

**Local SQLite option (offline testing only):** a mirrored schema is provided at
`prisma/schema.sqlite.prisma`. Point `DATABASE_URL` at `file:./dev.db` and run Prisma commands
with `--schema prisma/schema.sqlite.prisma`. The committed/production default is Postgres —
do not deploy the SQLite schema.

## Seed data & test accounts

The seed creates: 8 Sindh cities only (Karachi, Hyderabad, Sukkur, Ghotki, Larkana, Mirpurkhas,
Nawabshah, Khairpur), 12 branches, inventory for every branch × 8 blood groups (Free/Paid/Exchange
+ Rs price), ~14 requests in mixed statuses, 12 donations, and accounts for every role
(Super Admin, 4 branch accounts, 5 donors, 4 patients — emails are `@bloodbank.test`).

**Each seed account has its own unique password.** Passwords are written by the seed script to
`TEST_ACCOUNTS.local.md` in the project root, which is **git-ignored and must never be committed** —
they are provided to the project owner out-of-band. Change/remove these accounts before any
real-world launch.

## Deploy on Vercel

1. Push this repo to GitHub.
2. Create a free Postgres database (Neon or Supabase) and copy its connection string.
3. In Vercel: **Add New → Project**, import the GitHub repo (framework auto-detects as Next.js;
   `vercel.json` is included).
4. Add environment variables in the Vercel project:
   - `DATABASE_URL` — your Neon/Supabase Postgres URL
   - `SESSION_SECRET` — a long random string
5. Deploy. After the first deploy, run the migrations + seed once against the production DB
   from your machine:
   ```bash
   DATABASE_URL="<production url>" npx prisma db push
   DATABASE_URL="<production url>" npm run seed
   ```
6. Open the Vercel URL and sign in with the seeded accounts to verify all four roles.

## Project layout

- `app/` — pages (home, login, register, dashboard) and `app/api/` backend routes
  (`auth`, `public`, `requests`, `inventory`, `appointments`, `admin/stats`)
- `lib/` — Prisma client, auth/session helpers, shared data (blood groups, haversine)
- `prisma/schema.prisma` — Postgres schema · `prisma/seed.mjs` — seed script
