import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    platform: 'The NYC Maid',
    updated: '2026-02-05',
    stack: { framework: 'Next.js 16', language: 'TypeScript', database: 'Supabase PostgreSQL', hosting: 'Vercel', email: 'Resend', styling: 'Tailwind CSS' },
    domain: 'thenycmaid.com',
    email_from: 'hello@thenycmaid.com',
    email_forward: 'hello@thenycmaid.com → hi@thenycmaid.com (SiteGround)',
    dns: { provider: 'SiteGround', dkim: 'verified', spf: 'verified', dmarc: 'p=none' },
    pages: {
      admin: [
        { route: '/login', title: 'Admin Login' },
        { route: '/admin', title: 'Dashboard', description: 'Revenue, Scheduled, Overview, Job Feeds, Map' },
        { route: '/admin/bookings', title: 'Bookings', description: 'CRUD, search, filters, edit modal' },
        { route: '/admin/calendar', title: 'Calendar' },
        { route: '/admin/clients', title: 'Clients', description: 'Management, delete with booking protection' },
        { route: '/admin/cleaners', title: 'Team', description: 'Add/edit cleaners, schedule, PIN' },
        { route: '/admin/referrals', title: 'Referrals', description: 'Analytics, click tracking, payouts' },
        { route: '/admin/leads', title: 'Leads', description: '99 EMD domain tracking' },
        { route: '/admin/websites', title: 'Websites', description: 'Domain management' },
        { route: '/admin/settings', title: 'Settings', description: '4 tabs: General, Emails, Services, Tools' },
        { route: '/admin/docs', title: 'Documentation' },
      ],
      client: [
        { route: '/book', title: 'Client Portal', description: 'Email verification login' },
        { route: '/book/new', title: 'New Booking', description: '3-step form with SMS consent' },
        { route: '/book/dashboard', title: 'My Bookings' },
        { route: '/book/reschedule/[id]', title: 'Reschedule' },
      ],
      team: [
        { route: '/team', title: 'Team Login', description: 'Phone + PIN' },
        { route: '/team/dashboard', title: 'My Schedule' },
        { route: '/team/[token]', title: 'Job Details' },
      ],
      referral: [
        { route: '/referral', title: 'Referral Info' },
        { route: '/referral/signup', title: 'Referrer Signup' },
      ]
    },
    database_tables: {
      clients: 'id, name, email, phone, address, unit, notes, created_at',
      bookings: 'id, client_id, cleaner_id, start_time, end_time, service_type, price, hourly_rate, status, payment_status, payment_method, notes, recurring_type, cleaner_token',
      cleaners: 'id, name, email, phone, working_days, schedule, pin, active',
      referrers: 'id, name, email, phone, code, zelle_info, payout_method, active',
      referral_clicks: 'id, referrer_id, domain, referrer_url, timestamp',
      referral_commissions: 'id, referrer_id, booking_id, amount, status',
      leads: 'id, domain, referrer, page, timestamp',
      notifications: 'id, type, message, read, created_at',
    },
    email_templates: [
      '1. Client Confirmation', '2. Client Reminder (Tomorrow)', '3. Client Reminder (Today)',
      '4. Client Cancellation', '5. Client Verification Code',
      '6. Cleaner Assignment', '7. Cleaner Daily Summary (jobs)', '8. Cleaner Daily Summary (no jobs)',
      '9. Cleaner Cancellation', '10. Cleaner Welcome',
      '11. Referral Welcome', '12. Referral Commission',
      '13. Admin New Referrer', '14. Admin New Booking', '15. Admin Daily Backup',
    ],
    payment_methods: ['zelle', 'apple_pay'],
    service_types: ['Standard Cleaning', 'Deep Cleaning', 'Move In/Out', 'Post Construction'],
    hourly_rates: { standard: 75, budget: 49 },
    referral_commission: '10%',
    cron_jobs: [
      { endpoint: '/api/cron/daily-summary', description: 'Send tomorrow schedule to cleaners' },
      { endpoint: '/api/cron/reminders', description: 'Send client booking reminders' },
      { endpoint: '/api/cron/backup', description: 'CSV backup emailed to admin' },
    ],
    env_vars: [
      'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
      'RESEND_API_KEY', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'CRON_SECRET', 'NEXT_PUBLIC_GOOGLE_MAPS_KEY',
    ],
    pending: [
      'Telnyx SMS toll-free verification (in progress)',
      'CRON_SECRET needs adding to Vercel env vars',
      'Tracking script v2 deployment to 99 domains',
    ]
  })
}
