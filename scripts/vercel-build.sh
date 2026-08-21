#!/usr/bin/env bash
# Vercel build script — runs Prisma migrations + conditional seeding before Next.js build.
#
# This script:
# 1. Generates the Prisma Client (required for the app to work)
# 2. Pushes the schema to the database (creates/updates tables — idempotent)
# 3. Checks if the DB is empty (no users) — if so, runs the seeder (first-build only)
# 4. Builds the Next.js app
#
# Set these env vars in Vercel Project Settings:
#   DATABASE_URL      — your PostgreSQL connection string (Supabase/Neon)
#   DIRECT_URL        — direct connection for migrations (Supabase only)
#   NEXTAUTH_SECRET   — random string for JWT signing
#   (plus any provider keys: RESEND_API_KEY, SMS_*, WHATSAPP_*, CRON_SECRET)

set -e

echo "=========================================="
echo "  Vercel Build — Prisma Migrate + Seed"
echo "=========================================="

# Step 1: Generate Prisma Client
echo ""
echo "[1/4] Generating Prisma Client..."
bun run db:generate
echo "  ✓ Prisma Client generated"

# Step 2: Push schema to database (creates/updates tables — idempotent)
echo ""
echo "[2/4] Pushing schema to database..."
if [ -z "$DATABASE_URL" ]; then
  echo "  ⚠️  DATABASE_URL not set — skipping db push (using build-time SQLite)"
else
  bun run db:push 2>&1 | tail -5
  echo "  ✓ Schema pushed to database"
fi

# Step 3: Seed if database is empty (first build only)
echo ""
echo "[3/4] Checking if database needs seeding..."
SEED_CHECK=$(bun -e "
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
(async () => {
  try {
    const userCount = await db.user.count();
    const officeCount = await db.office.count();
    if (userCount === 0 && officeCount === 0) {
      console.log('EMPTY');
    } else {
      console.log('POPULATED:' + userCount + ' users, ' + officeCount + ' offices');
    }
  } catch (e) {
    // If tables don't exist yet, the DB is effectively empty
    console.log('EMPTY');
  } finally {
    await db.\$disconnect();
  }
})();
" 2>&1 | grep -E "EMPTY|POPULATED" | head -1)

if [ "$SEED_CHECK" = "EMPTY" ]; then
  echo "  → Database is empty — running seeder..."
  bun run scripts/seed.ts 2>&1 | tail -5
  echo "  ✓ Database seeded with demo data"
  echo ""
  echo "  ┌─────────────────────────────────────────────────────────────┐"
  echo "  │  DEMO ACCOUNTS (password: Password@123)                    │"
  echo "  │  • admin@educare.com       (Super Admin)                   │"
  echo "  │  • caller@educare.com       (Caller)                       │"
  echo "  │  • counsellor@educare.com   (Counsellor)                   │"
  echo "  │  • accounts@educare.com     (Accounts)                     │"
  echo "  │  • placement@educare.com    (Placement Executive)          │"
  echo "  │  • trainer@educare.com      (Trainer)                       │"
  echo "  │  • hr@educare.com          (HR)                            │"
  echo "  └─────────────────────────────────────────────────────────────┘"
else
  echo "  ✓ Database already has data ($SEED_CHECK) — skipping seed"
fi

# Step 4: Build the Next.js app
echo ""
echo "[4/4] Building Next.js application..."
bun run build
echo "  ✓ Next.js build complete"

echo ""
echo "=========================================="
echo "  Build complete! 🎉"
echo "=========================================="
