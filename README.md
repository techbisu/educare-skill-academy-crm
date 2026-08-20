# Educare Skill Academy — Production CRM Platform

A complete, production-ready multi-office CRM and business management platform built with **Next.js 16 + TypeScript + Prisma + NextAuth**. Manages the full customer lifecycle from Lead capture to Placement completion with backend-computed financials, immutable audit trails, and role-based access control.

![Status](https://img.shields.io/badge/status-production--ready-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![Tests](https://img.shields.io/badge/lint-passing-success)

## Live Preview

Open the Preview Panel — the app runs at `https://preview-<bot-id>.space-z.ai/`.

## Demo Accounts

All accounts share the same password: **`Password@123`**

| Role | Email | Scope |
|------|-------|-------|
| Super Admin | `admin@educare.com` | Full system access, all offices |
| Admin | `office.admin@educare.com` | Business admin, Bardhaman |
| HR | `hr@educare.com` | Employees, targets, performance |
| Caller | `caller@educare.com` | Leads, calls, follow-ups |
| Counsellor | `counsellor@educare.com` | Counselling, enrollments |
| Accounts | `accounts@educare.com` | Payments, EMI, finance |
| Placement Executive | `placement@educare.com` | Companies, jobs, placements |
| Trainer | `trainer@educare.com` | Batches, attendance |

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui + Recharts + TanStack Query + @dnd-kit (drag-and-drop)
- **Backend**: Next.js API Routes (RESTful `/api/v1/...`) + NextAuth.js (JWT session) + bcrypt password hashing
- **Database**: Prisma ORM — supports SQLite (dev), PostgreSQL (production via Supabase or Neon)
- **Auth/RBAC**: NextAuth credentials provider with custom JWT callback injecting roles/permissions/officeId
- **Notifications**: Pluggable providers — in-app, Resend (email), Twilio (SMS), WhatsApp Business Cloud API
- **Deployment**: GitHub Actions + Vercel (with Cron for EMI reminders)

## Modules

### Core Platform
- **Authentication** with bcrypt + JWT session + 8-role RBAC with 150+ permissions
- **Multi-office data isolation** — Super Admin/Admin see all; others see only their office. Enforced on the **backend** APIs, never trusted to the frontend
- **Audit log** for every sensitive action (create/update/delete/status change) — immutable, with old & new values
- **Atomic code generator** for entity codes (EDU-LEAD-000001, EDU-STU-000001, EDU-RCP-000001, etc.)
- **Global search** across leads, students, payments, companies, applications, and more

### CRM Pipeline
- **Lead Management** (50+ seeded leads)
  - Two view modes: **Table** (filterable paginated list) and **Pipeline** (Kanban with drag-and-drop status transitions)
  - Lead 360° drawer with 5 tabs: Overview, Timeline (immutable), Calls, Counselling, Assignments
  - **Quick Add Lead** modal — minimal fields (name + mobile), ideal for Callers
  - Lead assignment with history tracking, call recording, follow-up scheduling
  - Appointment booking, counselling sessions
  - Convert Lead → Student (reuses existing data, no re-entry)
  - Duplicate detection (mobile/whatsapp/email) with confirmation prompt
  - Bulk lead assignment
- **Student Management** (25+ seeded students)
  - Student 360° drawer with 7 tabs: Overview, Enrollments, Payments, College, Jobs, Placement, Documents
  - Multi-enrollment support (one student → many enrollments/services)
  - Document tracking with status (Pending/Uploaded/Verified/Rejected)

### Academics
- **Course Management** with categories, semesters, subjects
- **Enrollment Management** with backend-computed financials (Final Fee = Total − Discount; Paid = SUM(valid payments); Due = Final − Paid). Auto-generated EMI on enrollment creation.
- **Batch Management** with trainer assignment, capacity tracking, mode (Offline/Online/Hybrid)
- **Attendance** tracking per batch per student

### Finance
- **Payment Management** with auto-generated receipt numbers
- **EMI Schedule** with auto-overdue detection + **Send Reminder** action (in-app/email/SMS/WhatsApp)
- **Invoice Management** with configurable GST rates (CGST/SGST/IGST) — never hardcoded + **Send Invoice** action
- **Income/Expense** tracking with categories per office
- Financial dashboard: Revenue, Expense, Net Profit, Total Collection, Total Outstanding
- Soft-delete only for financial records (no hard delete) — reversal/refund workflow

### Placement Pipeline
- **Company Management** (10 seeded companies)
- **Job Openings** (20+ seeded jobs)
- **Job Applications** with status pipeline (Eligible → Job Shared → Applied → Interview → Selected → Offer → Joining)
- **Interviews** with multiple rounds (HR/Technical/Management)
- **Offers** with offer letter tracking
- **Placements** with verification before completion

### College Admission (Parallel Workflow)
- **College Master** (10 seeded colleges)
- **College Applications** with status pipeline (Interested → Application Started → Documents Pending → Application Submitted → Under Review → Selected → Admission Confirmed → Completed)
- **Semester Payments** (Admission Fee + Semester 1, 2, 3...)

### HR & Performance
- **Employee Management** with office assignment
- **Employee Targets** (Daily/Weekly/Monthly) for leads, calls, appointments, enrollments, collection, sales, placement
- **Incentive Rules** with configurable slabs (percentage, fixed, slab-based)

### System
- **Audit Logs** (immutable)
- **Notifications** — in-app + dispatchable via email/SMS/WhatsApp
- **Settings** — Organization details, GST rates, change password
- **Reports** — 7 report types with date/office/status filters + CSV export:
  - Lead reports (source, status funnel, conversion)
  - Payment reports (by mode, totals)
  - Enrollment reports (value, collected, due)
  - Placement reports (funnel, success rate)
  - Income/Expense reports (by category)
  - Student reports
- **Global Search** — search across 9 entity types by code, name, mobile, email

### Dashboard
- Real-time KPIs computed from database (Total Leads, Today's Calls/Follow-ups/Enrollments/Collection, Active Students, Placement Pending)
- Finance summary (Revenue, Expense, Net Profit, Collection, Outstanding)
- 6 charts: Monthly Revenue (Area), Monthly Enrollments (Bar), Lead Sources (Pie), Lead Status Funnel (Horizontal Bar), Office Performance (Multi-axis Bar), Placement Funnel (Horizontal Bar)
- 6 activity tables: Today's Follow-ups, Recent Enrollments, Recent Payments, Overdue EMI, Pending Placements, Top Employees
- Office filter (All Offices / Bardhaman / Magra)

## Architecture Highlights

- **Single-Page Application**: All views rendered through `/` route with hash-based navigation (`#dashboard`, `#leads`, `#students`, etc.) — this conforms to the constraint that only `/` is user-visible
- **Unified Data API**: `/api/v1/data/[entity]/[id]` handles all CRUD for 25+ entities with consistent pagination, search, sort, filtering, and office scoping
- **Action API**: `/api/v1/actions/[action]` handles 20+ business operations (lead.convert, enrollment.add-payment, emi.send-reminder, invoice.send, etc.) with backend-computed financials
- **360° Endpoints**: `/api/v1/lead-360/[id]` and `/api/v1/student-360/[id]` return complete records with all related data in one query (avoids N+1 on frontend)
- **Notification Provider**: Pluggable architecture in `src/lib/notification-providers.ts` — supports in-app, Resend (email), Twilio (SMS), WhatsApp Business Cloud API. Each provider is configured via env vars; missing providers gracefully degrade.
- **Cron Job**: `/api/v1/cron/emi-reminders` (protected by `CRON_SECRET`) runs daily via Vercel Cron to send EMI reminders for upcoming and overdue installments.
- **Code Generation**: Atomic counter pattern (`db.counter.upsert`) ensures unique sequential codes (EDU-LEAD-000001) under concurrent inserts
- **Office Scoping**: Two helpers — `officeScope(user)` for permission checks (returns null for Super Admin/Admin), `applyOfficeScope(user, where)` for query filters

## Database

The Prisma schema is fully portable across SQLite (dev) and PostgreSQL (production). Switch providers in one command:

```bash
./scripts/switch-db.sh sqlite      # default
./scripts/switch-db.sh supabase    # managed PostgreSQL
./scripts/switch-db.sh neon        # serverless PostgreSQL
```

See [`DATABASE_SETUP.md`](./DATABASE_SETUP.md) for detailed Supabase and Neon connection instructions.

## Notifications & Reminders

Configure providers in `.env` (see [`.env.example`](./.env.example)):

| Channel | Provider | Env Vars |
|---------|----------|----------|
| Email | [Resend](https://resend.com) | `RESEND_API_KEY`, `EMAIL_FROM` |
| SMS | Twilio-compatible | `SMS_ACCOUNT_SID`, `SMS_AUTH_TOKEN`, `SMS_FROM` |
| WhatsApp | WhatsApp Business Cloud API | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` |
| In-App | Always on | (none) |

**Send Reminder**: On the EMI module, click "Send Reminder" to dispatch a notification to the student across all configured channels.
**Send Invoice**: On the Invoices module, click "Send" to dispatch the invoice via email/SMS/WhatsApp.
**Automated EMI Reminders**: Vercel Cron calls `/api/v1/cron/emi-reminders?secret=...` daily at 9 AM UTC, sending reminders for all EMIs due in the next 7 days or overdue.

## Local Development

```bash
# Install dependencies
bun install

# Copy env template
cp .env.example .env
# → edit .env and set NEXTAUTH_SECRET

# Push schema to DB
bun run db:push

# Seed demo data (already seeded in this sandbox)
bun run scripts/seed.ts

# Start dev server (auto-runs in sandbox)
bun run dev

# Lint
bun run lint
```

## Production Deployment

### Prerequisites
1. PostgreSQL database on [Supabase](https://supabase.com) or [Neon](https://neon.tech) (free tiers work)
2. [Vercel](https://vercel.com) account
3. [Resend](https://resend.com) account (for email — optional)
4. GitHub repository

### Steps
1. Push this code to GitHub.
2. Import the repo into Vercel.
3. Set environment variables (from `.env.example`) in Vercel Project Settings.
4. Switch Prisma provider to PostgreSQL: `./scripts/switch-db.sh supabase` (or `neon`)
5. Run `bun run db:push` and `bun run scripts/seed.ts` locally to populate the production DB.
6. Deploy on Vercel. The GitHub Action in `.github/workflows/deploy.yml` handles automatic deployment on push to `main`.

### CI/CD
- `.github/workflows/ci.yml` — runs lint and Prisma generate on every PR.
- `.github/workflows/deploy.yml` — builds and deploys to Vercel on push to `main`.

### Vercel Cron
`vercel.json` configures a daily cron job at 9 AM UTC to send EMI reminders. Set `CRON_SECRET` in Vercel env vars and update the path in `vercel.json` to use your secret.

## File Structure

```
src/
├── app/
│   ├── api/v1/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── data/[entity]/route.ts            # Unified list/create
│   │   ├── data/[entity]/[id]/route.ts        # Unified get/update/delete
│   │   ├── actions/[action]/route.ts          # 20+ business actions
│   │   ├── cron/emi-reminders/route.ts        # Daily EMI reminder job
│   │   ├── dashboard/route.ts                 # Dashboard KPIs
│   │   ├── me/route.ts
│   │   ├── student-360/[id]/route.ts
│   │   ├── lead-360/[id]/route.ts
│   │   ├── global-search/route.ts
│   │   └── options/route.ts
│   ├── layout.tsx
│   └── page.tsx                               # SPA entry
├── components/
│   ├── crm/
│   │   ├── app-shell.tsx                      # Responsive sidebar + topbar
│   │   ├── login-screen.tsx                   # Modern split-screen login
│   │   ├── nav-config.ts
│   │   ├── data-table.tsx                     # Reusable DataTable
│   │   ├── kpi-card.tsx
│   │   ├── status-badge.tsx
│   │   ├── filter-bar.tsx
│   │   ├── form-modal.tsx
│   │   ├── layout.tsx
│   │   ├── providers.tsx
│   │   └── views/
│   │       ├── dashboard-view.tsx
│   │       ├── leads-view.tsx                 # Table + Kanban toggle
│   │       ├── lead-kanban-view.tsx           # Drag-and-drop pipeline
│   │       ├── students-view.tsx
│   │       ├── generic-views.tsx              # 20+ entity views
│   │       ├── reports-view.tsx
│   │       └── settings-view.tsx
│   └── ui/                                    # shadcn/ui components
├── lib/
│   ├── auth.ts                                # NextAuth options
│   ├── auth-utils.ts                          # officeScope, applyOfficeScope
│   ├── audit.ts                               # auditLog, createNotification
│   ├── code-generator.ts
│   ├── constants.ts                           # All statuses + RBAC config
│   ├── api-client.ts
│   ├── api.ts
│   ├── entity-map.ts
│   ├── notification-providers.ts              # Email/SMS/WhatsApp dispatch
│   └── db.ts
└── prisma/
    └── schema.prisma                          # 40+ models

scripts/
├── seed.ts                                    # Comprehensive seed
├── switch-db.sh                               # SQLite ↔ PostgreSQL
└── generate-user-manual.js                    # Generates the .docx manual

.github/workflows/
├── ci.yml                                     # PR lint + type check
└── deploy.yml                                 # Vercel auto-deploy

.env.example                                   # All env vars documented
vercel.json                                    # Vercel config + cron
DATABASE_SETUP.md                              # Supabase / Neon setup
README.md                                      # This file
```

## Documentation

- **[User Manual](./download/Educare-CRM-User-Manual.docx)** — comprehensive guide for all roles (15 chapters, ~25 pages)
- **[Database Setup Guide](./DATABASE_SETUP.md)** — Supabase, Neon, and local SQLite instructions
- **[.env.example](./.env.example)** — all environment variables documented

## Seeded Data

- 2 Offices (Bardhaman, Magra)
- 8 Roles with permission grants
- 13 Employees/Users (covering all roles in both offices)
- 5 Courses with semesters and subjects
- 10 Colleges
- 10 Companies with 20+ Job Openings
- 50 Leads across statuses and sources
- 25 Students (10 converted from leads)
- 25 Enrollments with auto-computed financials
- 10 Batches (5 courses × 2 offices)
- 7-day attendance records per batch student
- 35 Payments
- 20 EMI schedules (5 installments each = 100 EMI records)
- Calls, follow-ups, appointments, counselling sessions
- 5 College applications with semester payments
- 15 Job applications with interviews, offers, placements
- 20 Income + 15 Expense records
- Employee targets for all employees
- 2 Incentive rules (slab + percentage)
- Audit logs and notifications

## Definition of Done

All 35 criteria from the original spec are met. See `User Manual` chapter 12 for the role-by-role permission matrix.

## License

MIT
