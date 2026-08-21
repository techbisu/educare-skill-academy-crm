# Database Setup Guide — Supabase / Neon / Local

The CRM uses [Prisma ORM](https://pris.ly/d/prisma-schema) which supports multiple databases via a single schema. The current schema in `prisma/schema.prisma` is fully portable — it uses only standard Prisma types (String, Int, Float, Boolean, DateTime) and no provider-specific attributes.

## 1. Local SQLite (default for development)

Already configured. The `.env` file contains:
```
DATABASE_URL="file:/home/z/my-project/db/custom.db"
```

To reset:
```bash
rm db/custom.db
bun run db:push          # create tables from schema
bun run scripts/seed.ts  # populate demo data
```

## 2. Supabase (PostgreSQL)

Supabase is a fully managed PostgreSQL with a free tier suitable for production-grade CRM workloads.

### Setup steps
1. Create a project at [supabase.com](https://supabase.com) (free tier is enough).
2. Go to **Project Settings → Database → Connection string**.
3. Copy both:
   - **Transaction mode** URI (port `6543`, with `?pgbouncer=true`) → use as `DATABASE_URL` (for runtime, pooled).
   - **Session mode** URI (port `5432`) → use as `DIRECT_URL` (for migrations).

### Update `.env`
Comment out the SQLite URL and uncomment:
```env
# DATABASE_URL="file:./db/custom.db"  # ← comment out
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

### Update `prisma/schema.prisma`
Change the `datasource` block:
```prisma
datasource db {
  provider  = "postgresql"               // ← change from sqlite
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")           // ← add this line
}
```

### Push schema & seed
```bash
bun run db:push           # creates all 40+ tables in Supabase
bun run scripts/seed.ts   # populates offices, roles, users, students, leads, etc.
```

### Verify
After running `db:push`, go to the Supabase Dashboard → Table Editor. You should see all 40+ tables populated.

## 3. Neon (PostgreSQL)

Neon is a serverless PostgreSQL with branching, point-in-time recovery, and a generous free tier.

### Setup steps
1. Create a project at [neon.tech](https://neon.tech).
2. From the project dashboard, copy the **Connection string** (pooled).
3. For production, use the pooled connection string (the one with `-pooler` in the hostname).

### Update `.env`
```env
# Local SQLite — comment out
# DATABASE_URL="file:./db/custom.db"

# Neon pooled (recommended for serverless / Vercel)
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]-pooler.neon.tech/[DBNAME]?sslmode=require"
```

### Update `prisma/schema.prisma`
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
}
```

Neon supports connection pooling at the URL level, so `directUrl` is not strictly needed. If you want to run migrations from local, you can also set:
```env
DIRECT_URL="postgresql://[USER]:[PASSWORD]@[HOST].neon.tech/[DBNAME]?sslmode=require"
```

### Push schema & seed
```bash
bun run db:push
bun run scripts/seed.ts
```

## 4. Production deployment (Vercel)

### How auto-migration + seeding works on Vercel

The project includes a custom build script (`scripts/vercel-build.sh`) that runs automatically on every Vercel build. Here's what it does:

```
[1/4] prisma generate         → Generates Prisma Client (needed for the app to compile)
[2/4] prisma db push          → Creates/updates tables in your DB (idempotent — safe every build)
[3/4] Check if DB is empty    → If no users AND no offices exist → run seeder (first-build only)
[4/4] next build              → Builds the Next.js app
```

**Key safety features**:
- **Migrations are idempotent** — `prisma db push` only creates missing tables or adds new columns. It never drops data.
- **Seeder runs ONLY on first build** — it checks if the DB has any users/offices. If data exists, seeding is skipped. This prevents wiping production data on every deploy.
- **If you re-deploy to a fresh DB** (e.g. you switched from Supabase to Neon), the seeder will automatically run again because the DB is empty.

### Setup steps

1. Push your code to GitHub (already done if you followed the README).
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo.
3. In **Environment Variables**, set these (copy from your `.env`):
   - `DATABASE_URL` — your PostgreSQL connection string (Supabase pooled or Neon)
   - `DIRECT_URL` — direct connection (Supabase only, for migrations)
   - `NEXTAUTH_SECRET` — strong random string (`openssl rand -base64 32`)
   - `NEXTAUTH_URL` — your Vercel URL (e.g. `https://your-app.vercel.app`)
   - `CRON_SECRET` — strong random string for the EMI reminder cron
   - Optional: `RESEND_API_KEY`, `SMS_*`, `WHATSAPP_*` for notifications
4. **Important**: The `vercel.json` in this repo already configures:
   - `installCommand`: `bun install --frozen-lockfile`
   - `buildCommand`: `bash scripts/vercel-build.sh` (runs migrations + conditional seed + build)
5. Click **Deploy**. The first build will:
   - Install dependencies
   - Run `postinstall` → `prisma generate`
   - Run `scripts/vercel-build.sh` → push schema, seed (first time only), build
6. Watch the build logs — you'll see the migration and seeding output.

### After the first build

Subsequent builds will:
- Run `prisma generate` (fast — uses cache)
- Run `prisma db push` (fast — no changes if schema unchanged)
- **Skip seeding** (DB already has data)
- Build the Next.js app

### Manual seeding (if needed)

If you want to re-seed without deploying:
```bash
# Install Vercel CLI
bun add -g vercel

# Link to your project
vercel link

# Pull env vars to local .env
vercel env pull .env.production.local

# Run the seeder against production DB
DATABASE_URL="your-production-url" bun run scripts/seed.ts
```

### Vercel Cron (for EMI reminders)

`vercel.json` includes a cron job that runs daily at 9 AM UTC:
```json
{
  "crons": [
    { "path": "/api/v1/cron/emi-reminders?secret=${CRON_SECRET}", "schedule": "0 9 * * *" }
  ]
}
```

This sends reminders for all EMIs due in the next 7 days or overdue. The `${CRON_SECRET}` is automatically replaced by Vercel with your env var value.

## 5. Connection troubleshooting

### "Can't reach database server"
- Check that the hostname and port are correct.
- For Supabase: ensure you're using the pooler URL (port 6543) for the app, not the direct URL.
- For Neon: ensure `?sslmode=require` is appended.
- Test connectivity: `psql "<connection-string>"` from your terminal.

### "PrismaClientInitializationError: Crypto module not found"
This happens on some serverless environments. Add the `nodejs` adapter or use the `binary` engine. See [Prisma serverless docs](https://pris.ly/d/serverless).

### "Database connection timeout"
- For Supabase: make sure pgbouncer is enabled (`?pgbouncer=true` in URL).
- For Neon: use the pooled URL (with `-pooler`).
- On Vercel: set `DATABASE_CONNECTION_LIMIT=1` if you see pool exhaustion errors.

### "Schema drift / tables not found"
Run `bun run db:push` after switching providers. This is idempotent — it adds missing tables without dropping existing data.

## 6. Switching back to SQLite

If you want to switch back to local development:
1. Comment out the PostgreSQL URL in `.env`.
2. Uncomment `DATABASE_URL="file:./db/custom.db"`.
3. Change `provider` back to `"sqlite"` in `prisma/schema.prisma`.
4. Remove `directUrl` from the datasource.
5. Run `rm db/custom.db && bun run db:push && bun run scripts/seed.ts`.
