# NYC Maid Platform — Chat Handoff (Feb 5, 2026)

## FIRST THING: Read the Platform Docs
Before doing ANY work, fetch the full platform documentation:
```
curl https://www.nycmaid.nyc/api/docs
```
This returns a JSON object with: stack, all pages/routes, database schema, email templates, payment methods, service types, cron jobs, env vars, and pending items.

The full human-readable docs are at: `nycmaid.nyc/dashboard/docs` (19 sections covering everything).

---

## Project Location
- **Local**: `~/Desktop/nycmaid`
- **Live**: https://www.nycmaid.nyc
- **GitHub**: https://github.com/thenycmaid/nycmaid
- **Vercel**: https://vercel.com/jeff-tuckers-projects/nycmaid
- **Supabase**: https://supabase.com/dashboard/project/ioppmvchszymwswtwsze

## Stack
- **Framework**: Next.js 16.1.6 (TypeScript)
- **Database**: Supabase PostgreSQL (RLS disabled on all tables)
- **Hosting**: Vercel (serverless functions + cron)
- **Email**: Resend (from: hello@nycmaid.nyc, no reply-to header)
- **Styling**: Tailwind CSS
- **Maps**: Leaflet (dashboard) + Google Maps (address autocomplete)
- **Calendar**: FullCalendar
- **SMS**: Telnyx (toll-free verification pending)
- **DNS/Email Hosting**: SiteGround (hello@nycmaid.nyc → hi@thenycmaid.com forwarding)

## Deploy Process
```bash
cd ~/Desktop/nycmaid
npm run build                    # Always build first
git add . && git commit -m "msg"
npx vercel --prod                # Deploy to production
git push origin main             # Backup to GitHub
```

---

## Architecture Overview

### 4 Portals
1. **Admin Dashboard** (`/dashboard/*`) — 10 pages, cookie auth via ADMIN_PASSWORD
2. **Client Portal** (`/book/*`) — 4 pages, email verification login
3. **Team Portal** (`/team/*`) — 3 pages, phone + 4-digit PIN login
4. **Referrer Portal** (`/referral/*`) — 2 pages, email login

### 20 Pages Total
**Public**: `/` (redirects to /book/new), `/login`
**Admin (10)**: dashboard, calendar, bookings, clients, cleaners, websites, leads, referrals, settings, docs
**Client (4)**: /book, /book/new, /book/dashboard, /book/reschedule/[id]
**Team (3)**: /team, /team/dashboard, /team/[token]
**Referral (2)**: /referral/signup, /referral

### 37+ API Routes
- Auth: login/logout (rate-limited 5/5min)
- Admin CRUD: bookings, clients, cleaners (all protected by protectAdminAPI)
- Client portal: check, send-code, verify-code, login, availability, book, bookings, reschedule
- Team portal: login, jobs, [token], check-in, check-out
- Referrals: referrers CRUD, referral-commissions, referral/track
- Leads: track (public), leads, attribution, domain-notes
- Cron: reminders (hourly), daily-summary (7pm EST), backup (midnight EST)
- Other: dashboard stats, notifications, client-analytics, send-booking-emails, test-emails, import-clients, docs

### 7 Database Tables
1. **clients** — id, name, email, phone, address, unit, notes, referrer_id, created_at
2. **bookings** — id, client_id, cleaner_id, start_time, end_time, service_type, price (cents), hourly_rate, status, payment_status, payment_method, notes, recurring_type, cleaner_token
3. **cleaners** — id, name, email, phone, working_days[], schedule (jsonb), pin, active
4. **referrers** — id, name, email, phone, code, zelle_info, payout_method, active
5. **referral_commissions** — id, referrer_id, booking_id, commission_amount, status, paid_via, paid_at
6. **referral_clicks** — referrer_id, domain, referrer_url, timestamp
7. **lead_clicks** — id, domain, action, lead_id, first_domain, last_domain, scroll_depth, time_on_page, engaged_30s, ref_code
8. **notifications** — id, type, message, read, created_at (10 types with color-coded icons)

### 7 Components
DashboardHeader, AdminHeader, NotificationBell, DashboardMap, WebsitesMap, AddressAutocomplete, RecurringOptions

### 7 Lib Files
supabase.ts, auth.ts (protectAdminAPI/protectCronAPI), email.ts, email-templates.ts (15 templates), format.ts, tokens.ts, attribution.ts

### 15 Email Templates (Google/Apple minimal style)
Client: confirmation, reminder tomorrow, reminder today/2hr, cancellation, verification code
Cleaner: job assignment, daily summary (jobs), daily summary (no jobs), cancellation, welcome
Referrer: welcome, commission earned
Admin: new referrer alert, new booking alert, daily backup

### 3 Cron Jobs (Vercel cron, CRON_SECRET protected)
- `/api/cron/reminders` — hourly — 7/3/1-day + 2-hour client reminders
- `/api/cron/daily-summary` — midnight UTC (7pm EST) — cleaner job summaries
- `/api/cron/backup` — 5am UTC (midnight EST) — CSV backup to admin email

---

## Security
- All admin APIs: `protectAdminAPI()` cookie check
- All cron routes: `protectCronAPI()` CRON_SECRET header
- Middleware: cookie check on /dashboard/* pages
- Team tokens: time-limited UUIDs for cleaner check-in/out
- Login: rate-limited 5 attempts per 5min per IP, httpOnly secure cookies, 24h expiry
- Public endpoints (intentional): /api/track, /api/referrers?code=X, /api/docs

---

## Key Business Logic

### Booking Statuses
pending → scheduled → confirmed → in_progress → completed
                                                → cancelled

### Payment
- Methods: Zelle, Apple Pay (Cash removed)
- Price stored in cents (15000 = $150)
- Hourly rates: $75 standard, $49 budget

### Referral Program
- 10% commission on completed services
- Flow: referrer signup → gets code → client books via /book?ref=CODE → checkout creates commission → referrer gets email → admin pays via Zelle/Apple Cash manually → marks paid
- Click tracking: tracks domain, referrer URL, timestamp per referrer

### Client Analytics
- LTV, retention rate, churn rate, booking frequency, referral rate
- Status: New (blue), Active (green, <45 days), At-Risk (yellow, 45-90), Churned (red, 90+)

### Lead Tracking
- 99 EMD domains (e.g., tribecamaid.com) with tracking scripts
- Tracks: visits, CTA clicks, scroll depth, time on page, lead IDs
- Revenue attribution: client zip → neighborhood → EMD domain

### Dashboard
- Sections: Revenue → Scheduled → Overview → Job Feeds → Map
- Excludes pending bookings (only confirmed/scheduled/in_progress)
- Map: Leaflet with NYC metro default view

---

## What Was Completed (All Previous Sessions)

### Core Features
- Full booking CRUD with edit modal (date, time, hours, service, rate, status, payment, cleaner, notes)
- Bookings search bar (client name, phone, address, cleaner)
- Client delete with active booking protection
- Dashboard restructured with 5 sections
- Map pins fixed with NYC metro default
- Calendar view (day/week/month)
- Recurring bookings (weekly, biweekly, monthly)

### Email System
- All 15 templates redesigned to Google/Apple style
- Test emails endpoint (/api/test-emails sends all 15 to admin)
- Email deliverability: DKIM/SPF/DMARC verified, reply-to mismatch removed
- Forwarding: hello@nycmaid.nyc → hi@thenycmaid.com (SiteGround MX)

### Notifications
- 10 types with color-coded icons (new_booking, cancelled, completed, payment, new_client, new_referrer, commission, lead, rescheduled, system)
- NotificationBell component with unread count badge + dropdown

### Referral System
- Referrer signup with welcome email + admin notification
- Analytics dashboard with click tracking, top referrers, activity feed
- Commission auto-creation on checkout

### Admin Tools
- Settings page with 4 tabs (General, Emails, Services, Tools)
- Manual cron triggers in Settings > Tools
- Documentation page with 19 sections + /api/docs JSON endpoint

### UX Polish
- SMS consent checkbox on booking form (CTIA compliant)
- Spam/junk folder notices on all confirmation screens
- Page titles on all 20 pages
- Rich color-coded notifications

---

## PENDING / NEXT TASKS

### Immediate (requested but not yet done)
1. **Edit booking modal: show client info** — Display client phone, email, address in edit modal with call/text buttons (mobile-friendly for field use)

### Pending Infrastructure
2. **Telnyx SMS** — Toll-free verification in progress, SMS consent checkbox already on form
3. **Push to GitHub** — 55 commits ahead of origin/main, need `git push origin main`

### Potential Improvements
4. **Email reputation** — Domain is new on Resend (Feb 2026), reputation builds over 1-2 weeks
5. **/api/docs endpoint** — Could be expanded with more detail as features are added
6. **Clean up temp files** — gen-docs.js, fix-docs.js, fix-sidebar.js, fix-layout.js, fix-layout2.js, old-docs-backup.tsx in project root

---

## Important Env Vars (Vercel)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- RESEND_API_KEY
- ADMIN_EMAIL
- ADMIN_PASSWORD
- CRON_SECRET
- NEXT_PUBLIC_GOOGLE_MAPS_KEY

---

## How to Start the Next Chat

Paste this to the new Claude chat:

> I'm building a cleaning business management platform (The NYC Maid). Before we start, please fetch `https://www.nycmaid.nyc/api/docs` to read the full platform documentation. The project is at `~/Desktop/nycmaid`. Here's the handoff doc from the previous session: [paste this file]

Then give the specific task, e.g.:
> First task: Add client phone, email, and address to the edit booking modal with call/text buttons for mobile use.
