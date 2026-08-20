#!/usr/bin/env bash
# Switch Prisma provider between SQLite / Supabase / Neon
# Usage: ./scripts/switch-db.sh [sqlite|supabase|neon]
#
# After switching, you must update .env with the correct DATABASE_URL
# (and DIRECT_URL for Supabase), then run `bun run db:push`.

set -e

TARGET="${1:-sqlite}"
SCHEMA="prisma/schema.prisma"

case "$TARGET" in
  sqlite)
    cat > /tmp/datasource.txt <<EOF
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
EOF
    echo "✓ Switched Prisma provider to SQLite"
    echo "  → Update .env: DATABASE_URL=\"file:./db/custom.db\""
    echo "  → Run: bun run db:push && bun run scripts/seed.ts"
    ;;
  supabase)
    cat > /tmp/datasource.txt <<EOF
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
EOF
    echo "✓ Switched Prisma provider to PostgreSQL (Supabase)"
    echo "  → Update .env:"
    echo "      DATABASE_URL=\"postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true\""
    echo "      DIRECT_URL=\"postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres\""
    echo "  → Run: bun run db:push && bun run scripts/seed.ts"
    ;;
  neon)
    cat > /tmp/datasource.txt <<EOF
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
EOF
    echo "✓ Switched Prisma provider to PostgreSQL (Neon)"
    echo "  → Update .env:"
    echo "      DATABASE_URL=\"postgresql://[USER]:[PASS]@[HOST]-pooler.neon.tech/[DB]?sslmode=require\""
    echo "  → Run: bun run db:push && bun run scripts/seed.ts"
    ;;
  *)
    echo "Usage: $0 [sqlite|supabase|neon]"
    exit 1
    ;;
esac

# Replace the datasource block in schema.prisma
python3 <<PYEOF
import re
with open("$SCHEMA") as f:
    content = f.read()
with open("/tmp/datasource.txt") as f:
    new_ds = f.read().rstrip()
# Replace the existing datasource block
pattern = r'datasource db \{[^}]*\}'
content = re.sub(pattern, new_ds, content, count=1)
with open("$SCHEMA", "w") as f:
    f.write(content)
print("✓ Updated", "$SCHEMA")
PYEOF
