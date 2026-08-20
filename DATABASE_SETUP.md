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

1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo.
3. In **Environment Variables**, set the same values from your `.env` (Supabase or Neon connection string, `NEXTAUTH_SECRET`, `RESEND_API_KEY`, etc.).
4. **Important**: Vercel needs `prisma generate` to run at build time. The `postinstall` script in `package.json` already does this automatically (via `prisma generate`).
5. Deploy. Vercel will detect Next.js automatically.

### Vercel Cron (for EMI reminders)

Add to `vercel.json` (already provided in this repo):
```json
{
  "crons": [
    { "path": "/api/v1/cron/emi-reminders?secret=YOUR_CRON_SECRET", "schedule": "0 9 * * *" }
  ]
}
```

This runs daily at 9 AM UTC, sending reminders for all EMIs due in the next 7 days or overdue.

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
