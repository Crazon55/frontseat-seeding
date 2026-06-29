# Frontseat Seeding — PRD

## Original Problem Statement
Build an internal web dashboard called **Frontseat Seeding** — an internal operating system for tracking brand brief inflow, admin approval, fulfillment execution, live links, views, payment status, and admin-only revenue visibility. Not a CRM/P&L/invoicing tool. V1 must let BD submit a brief in under 60 seconds.

## User Roles
- **Admin** — full access, approval rights, revenue/payment visibility, user/page management
- **BD** (4 teams: Snoball / Hooc / OWLED Core / AY) — submits briefs, scoped to own team's data only
- **Fulfillment** — executes approved deals; no access to price / revenue / payment
- **Pending** — locked screen until admin assigns role

## Architecture
- Backend: FastAPI single-file `/app/backend/server.py`, all routes under `/api`
- Frontend: React + Tailwind + shadcn components, react-router, axios
- Database: MongoDB (collections: users, user_sessions, business_teams, monetisable_pages, deals, deliverables, fulfillment_outputs, internal_notes, client_feedback, payments, files)
- Auth: Emergent-managed Google OAuth restricted to `@owledmedia.com`; pre-seeded admin (`jaskaran.sethi@owledmedia.com`); first-login of any other email = role `pending`
- Files: Emergent object storage for client-feedback images/attachments

## What's Implemented (2026-02 / iteration 3 — Outputs ↔ Comments restructure)
- Fulfillment Outputs are now reviewable cards, each with its own per-output comments thread
- New `status` field on outputs: `Draft / Shared with BD / Changes Requested / Updated / Approved / Final`
- BD users do NOT see Draft outputs (visibility gated by status + visible_to_bd)
- New `output_id` field on comments so each comment is anchored to a specific output (or null for general deal comments)
- Comment authors enriched with role + team for clarity in the thread
- Permissions:
  - POST /api/outputs — fulfillment or admin
  - PUT/DELETE /api/outputs/{id} — author (fulfillment) or admin only
  - POST /api/feedback — admin, BD (own team only), or **fulfillment now allowed** (so fulfillment can reply to comments)
  - PUT /api/feedback/{id} — author or admin for content edits; ANYONE with deal access for status (resolve/reopen)
  - DELETE /api/feedback/{id} — author or admin only
  - Deleting an output cascade-deletes all its comments
- Frontend: replaced the two old separate sections with a unified "Outputs & changes" section. Each `OutputCard` renders status select (editor only), edit/delete buttons, an inline `Comment` thread with avatar + role/team chips, and a `CommentComposer` for replies (text + image + file + reference link). A small "General deal comments" section at the bottom handles orphan comments.
- Seed updated to include realistic per-output sample comments on the Notion in-progress deal

Tested: 17/17 dedicated pytest tests passed (including the critical "other fulfillment user can't edit Om's output" author-rule boundary and cascade-delete of comments). Frontend e2e verified across all 3 roles.

## What's Implemented (2026-02 / iteration 2 — View-As-Role)
- Admin-only "Preview as Role" / impersonation mode
- Backend `X-Impersonate-As` header support inside `get_current_user` — only swaps identity if real session user is `admin`; non-admin headers are silently ignored
- Separate `get_real_user` dependency for the new `GET /api/admin/preview-targets` endpoint (so the targets list is gated by real admin identity, not by the impersonated identity)
- Admin DB record is never mutated by impersonation (verified across 4-role cycle in tests)
- Seeded `pending.test@owledmedia.com` as a pending sample user so admins can preview the locked screen
- Frontend `AuthContext` exposes `enterPreview(email)` / `exitPreview()`, persists choice in `localStorage`, axios interceptor sends the header on every request
- Sticky amber `PreviewBanner` at app root with role label, real-admin tag, "Switch role" dropdown, and "Exit Preview" button
- `PreviewLauncher` dropdown in admin sidebar (only visible to real admins, hidden during preview)
- `PendingApproval` screen swaps its "Sign out" CTA for "Exit preview" when impersonating, so admins don't accidentally log themselves out
- Hard-nav after enter/exit so `RoleHome` re-evaluates role cleanly
- `/api/deals` and `/api/deliverables` now return 403 for pending role (real or impersonated), matching spec

Tested: 16/16 backend impersonation tests passed; 9/9 frontend preview flow steps passed (data-testids covered).

## What's Implemented (2026-02 / iteration 1 — MVP)
- Google OAuth login + AuthCallback + ProtectedRoute role gating
- `/api/auth/dev-session` testing helper (gateable via `ENABLE_DEV_SESSION` env)
- Pending approval screen for new users
- Admin Overview dashboard with month-default date range filter, revenue/payment/views cards, team-wise revenue & views breakdown, briefs-waiting-for-approval and active-deals lists
- Admin Approval Queue with Approve / Needs More Info (with required comment) / Reject / Cancel actions
- Admin Users & Roles panel (assign role + team + active toggle)
- Admin Monetisable Pages panel (CRUD + active/inactive toggle)
- BD Dashboard (gallery view of own team's briefs, filter pills, stat cards, "needs more info" surfaced inline)
- Submit Brief form with multi-page deliverable spec (auto-expands to individual deliverable rows)
- Notion-style Deal Detail page (Original Brief → Deliverables → Fulfillment Output → Client Feedback → Payment → Revenue → Internal Notes)
- Fulfillment Dashboard with Gallery, Kanban (by deliverable status), Timeline (by go-live) views
- Fulfillment Output box (writeups, links of all types), Internal Notes (admin+fulfillment only)
- Client Feedback Notion-style block (text + image + file via object storage + reference link)
- Payment status tracker with last-updated-by chip + overdue warning
- Backend role enforcement on every endpoint (BD scoped to own team_id; Fulfillment scoped to approved only; price/payment fields stripped from fulfillment responses)
- Auto-seed at startup: 4 teams, 7 monetisable pages, 6 users, 5 sample deals (Submitted/Needs Info/Rejected/Approved In-Progress/Approved Completed) with deliverables + payments + outputs + notes
- Tested: 22/22 backend pytest passed; frontend e2e on all 3 role flows passed

## Test Credentials
See `/app/memory/test_credentials.md` — six seeded user emails minted via `POST /api/auth/dev-session`.

## Backlog (V1.x)
- P1: per-deal change-request flow for additional deliverables (currently handled as a new brief)
- P1: revenue chart over time on overview (line/bar instead of bar list)
- P2: notification dot on sidebar for new pending briefs
- P2: assigning specific deliverables to specific fulfillment users in the UI (backend already supports it)
- P2: hardened CORS allow_origins for production deployment
- P2: per-feedback comment threading + resolved/in-progress UI
- P2: split `server.py` into routers/* modules for maintainability

## V1 Non-goals (per spec)
P&L, burn tracking, salaries, software expenses, invoice generation, GST/TDS, page pricing engine, inventory availability, client login, WhatsApp/email notifications, creator tracking, advanced reporting, mobile app, CSV import/export, complex automation/approval workflows.
