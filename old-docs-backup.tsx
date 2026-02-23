'use client'
import DashboardHeader from '@/components/DashboardHeader'
import {useState, useEffect } from 'react'

export default function DocsPage() {
  useEffect(() => { document.title = 'Documentation | The NYC Maid' }, []);
  const [activeSection, setActiveSection] = useState('overview')

  const companySections = [
    { id: 'about', label: 'About' },
    { id: 'services', label: 'Services' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'policies', label: 'Policies' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'business-plan', label: 'Business Plan' },
    { id: 'valuation', label: 'Valuation' },
    { id: 'contact', label: 'Contact' },
  ]

  const platformSections = [
    { id: 'overview', label: 'Overview' },
    { id: 'stack', label: 'Tech Stack' },
    { id: 'files', label: 'File Structure' },
    { id: 'database', label: 'Database Schema' },
    { id: 'pages', label: 'Pages (19)' },
    { id: 'api', label: 'API Routes (37)' },
    { id: 'components', label: 'Components (7)' },
    { id: 'lib', label: 'Library Files (7)' },
    { id: 'security', label: 'Security' },
    { id: 'referrals', label: 'Referral Program' },
    { id: 'analytics', label: 'Client Analytics' },
    { id: 'leads', label: 'Lead Tracking' },
    { id: 'cron', label: 'Cron Jobs' },
    { id: 'emails', label: 'Email System' },
    { id: 'portals', label: 'User Portals' },
    { id: 'env', label: 'Environment Variables' },
    { id: 'deployment', label: 'Deployment' },
    { id: 'troubleshooting', label: 'Troubleshooting' },
  ]

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader currentPage="docs" />

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-gray-200 min-h-[calc(100vh-73px)] p-4 overflow-y-auto">
          <div className="text-xs text-gray-400 mb-4">Last Updated: February 4, 2026</div>
          
          <h2 className="font-semibold text-black mb-2 text-sm uppercase tracking-wide">Company Docs</h2>
          <nav className="space-y-1 mb-6">
            {companySections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                  activeSection === section.id
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>

          <h2 className="font-semibold text-black mb-2 text-sm uppercase tracking-wide">Platform Docs</h2>
          <nav className="space-y-1">
            {platformSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                  activeSection === section.id
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-8 max-w-5xl overflow-y-auto">
          
          {/* ==================== COMPANY DOCS ==================== */}
          
          {activeSection === 'about' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">About The NYC Maid</h1>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="text-gray-600 italic">Company information to be added...</p>
              </div>
            </div>
          )}

          {activeSection === 'services' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Services</h1>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="text-gray-600 italic">Service offerings to be added...</p>
              </div>
            </div>
          )}

          {activeSection === 'pricing' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Pricing</h1>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="text-gray-600 italic">Pricing structure to be added...</p>
              </div>
            </div>
          )}

          {activeSection === 'policies' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Policies</h1>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="text-gray-600 italic">Company policies to be added...</p>
              </div>
            </div>
          )}

          {activeSection === 'marketing' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Marketing</h1>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="text-gray-600 italic">Marketing strategy to be added...</p>
              </div>
            </div>
          )}

          {activeSection === 'business-plan' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Business Plan</h1>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="text-gray-600 italic">Business plan to be added...</p>
              </div>
            </div>
          )}

          {activeSection === 'valuation' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Valuation</h1>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="text-gray-600 italic">Company valuation to be added...</p>
              </div>
            </div>
          )}

          {activeSection === 'contact' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Contact</h1>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="text-gray-600 italic">Contact information to be added...</p>
              </div>
            </div>
          )}

          {/* ==================== PLATFORM DOCS ==================== */}

          {activeSection === 'overview' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Platform Overview</h1>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800"><strong>Live Site:</strong> <a href="https://www.nycmaid.nyc" className="underline">www.nycmaid.nyc</a></p>
                <p className="text-blue-800"><strong>GitHub:</strong> <a href="https://github.com/thenycmaid/nycmaid" className="underline">github.com/thenycmaid/nycmaid</a></p>
                <p className="text-blue-800"><strong>Vercel:</strong> <a href="https://vercel.com/jeff-tuckers-projects/nycmaid" className="underline">vercel.com/jeff-tuckers-projects/nycmaid</a></p>
                <p className="text-blue-800"><strong>Supabase:</strong> <a href="https://supabase.com/dashboard/project/ioppmvchszymwswtwsze" className="underline">supabase.com/dashboard/project/ioppmvchszymwswtwsze</a></p>
              </div>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">What This Platform Does</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Admin Dashboard</strong> — Manage bookings, clients, team members, calendar view, revenue tracking</li>
                <li><strong>Client Portal</strong> — Clients book services, view/reschedule appointments via phone verification</li>
                <li><strong>Team Portal</strong> — Cleaners login with PIN, view daily jobs, check in/out</li>
                <li><strong>Referral Program</strong> — 10% commission tracking, referrer portal, auto-payouts via Zelle/Apple Cash</li>
                <li><strong>Client Analytics</strong> — LTV, churn rate, retention, at-risk client tracking</li>
                <li><strong>Lead Tracking</strong> — 99 EMD domains, revenue attribution, traffic sources</li>
                <li><strong>Automated Emails</strong> — Booking confirmations, 7/3/1-day and 2-hour reminders, daily job summaries</li>
                <li><strong>Automated Backups</strong> — Nightly CSV export of all clients and 6 months of bookings</li>
              </ul>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Key URLs</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">URL</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Purpose</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Access</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/</td><td className="border border-gray-300 px-4 py-2">Home page</td><td className="border border-gray-300 px-4 py-2">Public</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/login</td><td className="border border-gray-300 px-4 py-2">Admin login</td><td className="border border-gray-300 px-4 py-2">Public</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/dashboard</td><td className="border border-gray-300 px-4 py-2">Admin dashboard</td><td className="border border-gray-300 px-4 py-2">Admin only</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/dashboard/leads</td><td className="border border-gray-300 px-4 py-2">Lead tracking & attribution</td><td className="border border-gray-300 px-4 py-2">Admin only</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/dashboard/referrals</td><td className="border border-gray-300 px-4 py-2">Referral management & payouts</td><td className="border border-gray-300 px-4 py-2">Admin only</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/book</td><td className="border border-gray-300 px-4 py-2">Client portal entry</td><td className="border border-gray-300 px-4 py-2">Public</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/referral/signup</td><td className="border border-gray-300 px-4 py-2">Referrer signup</td><td className="border border-gray-300 px-4 py-2">Public</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/referral</td><td className="border border-gray-300 px-4 py-2">Referrer portal</td><td className="border border-gray-300 px-4 py-2">Referrers</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/team</td><td className="border border-gray-300 px-4 py-2">Team login</td><td className="border border-gray-300 px-4 py-2">Public</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'stack' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Tech Stack</h1>
              
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Component</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Technology</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Version</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2">Framework</td><td className="border border-gray-300 px-4 py-2">Next.js</td><td className="border border-gray-300 px-4 py-2">16.1.6</td><td className="border border-gray-300 px-4 py-2">React framework with API routes</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">Language</td><td className="border border-gray-300 px-4 py-2">TypeScript</td><td className="border border-gray-300 px-4 py-2">5.x</td><td className="border border-gray-300 px-4 py-2">Type-safe JavaScript</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">Database</td><td className="border border-gray-300 px-4 py-2">Supabase</td><td className="border border-gray-300 px-4 py-2">PostgreSQL</td><td className="border border-gray-300 px-4 py-2">Data storage, real-time</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">Styling</td><td className="border border-gray-300 px-4 py-2">Tailwind CSS</td><td className="border border-gray-300 px-4 py-2">3.x</td><td className="border border-gray-300 px-4 py-2">Utility-first CSS</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">Hosting</td><td className="border border-gray-300 px-4 py-2">Vercel</td><td className="border border-gray-300 px-4 py-2">-</td><td className="border border-gray-300 px-4 py-2">Deployment, cron jobs, edge</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">Email</td><td className="border border-gray-300 px-4 py-2">Resend</td><td className="border border-gray-300 px-4 py-2">-</td><td className="border border-gray-300 px-4 py-2">Transactional emails</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">Maps</td><td className="border border-gray-300 px-4 py-2">Leaflet</td><td className="border border-gray-300 px-4 py-2">-</td><td className="border border-gray-300 px-4 py-2">Interactive maps</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">Calendar</td><td className="border border-gray-300 px-4 py-2">FullCalendar</td><td className="border border-gray-300 px-4 py-2">-</td><td className="border border-gray-300 px-4 py-2">Calendar views</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'files' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">File Structure</h1>
              
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`~/Desktop/nycmaid/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Home page
│   │   ├── login/page.tsx              # Admin login
│   │   │
│   │   ├── dashboard/                  # Admin dashboard (8 pages)
│   │   │   ├── page.tsx                # Main dashboard
│   │   │   ├── bookings/page.tsx       # Booking management
│   │   │   ├── calendar/page.tsx       # Calendar view
│   │   │   ├── cleaners/page.tsx       # Team management
│   │   │   ├── clients/page.tsx        # Client management + analytics
│   │   │   ├── websites/page.tsx       # EMD portfolio
│   │   │   ├── leads/page.tsx          # Lead tracking & attribution
│   │   │   ├── referrals/page.tsx      # Referral program management
│   │   │   └── docs/page.tsx           # This documentation
│   │   │
│   │   ├── book/                       # Client portal
│   │   │   ├── page.tsx                # Entry/login
│   │   │   ├── dashboard/page.tsx      # Client dashboard
│   │   │   ├── new/page.tsx            # New booking
│   │   │   └── reschedule/[id]/page.tsx
│   │   │
│   │   ├── team/                       # Team portal
│   │   │   ├── page.tsx                # PIN login
│   │   │   ├── dashboard/page.tsx      # Job list
│   │   │   └── [token]/page.tsx        # Token access
│   │   │
│   │   ├── referral/                   # Referrer portal
│   │   │   ├── page.tsx                # Referrer dashboard
│   │   │   └── signup/page.tsx         # Referrer signup
│   │   │
│   │   └── api/                        # 37 API routes
│   │       ├── auth/                   # Admin auth
│   │       ├── bookings/               # Booking CRUD
│   │       ├── clients/                # Client CRUD
│   │       ├── cleaners/               # Team CRUD
│   │       ├── referrers/              # Referrer CRUD
│   │       ├── referral-commissions/   # Commission management
│   │       ├── client-analytics/       # Analytics API
│   │       ├── leads/                  # Lead data
│   │       ├── track/                  # Tracking pixel
│   │       ├── attribution/            # Revenue attribution
│   │       ├── client/                 # Client portal APIs
│   │       ├── team/                   # Team portal APIs
│   │       ├── cron/                   # Scheduled jobs
│   │       └── ...
│   │
│   ├── components/                     # 7 components
│   │   ├── DashboardHeader.tsx
│   │   ├── AdminHeader.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── DashboardMap.tsx
│   │   ├── WebsitesMap.tsx
│   │   ├── AddressAutocomplete.tsx
│   │   └── RecurringOptions.tsx
│   │
│   └── lib/                            # 7 utilities
│       ├── supabase.ts
│       ├── auth.ts
│       ├── email.ts
│       ├── email-templates.ts
│       ├── format.ts
│       ├── tokens.ts
│       └── attribution.ts
│
├── public/                             # Static assets
├── .env.local                          # Local env vars
├── vercel.json                         # Cron config
├── package.json
└── tsconfig.json`}
              </pre>
            </div>
          )}

          {activeSection === 'database' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Database Schema</h1>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800"><strong>Supabase Dashboard:</strong> <a href="https://supabase.com/dashboard/project/ioppmvchszymwswtwsze" className="underline">Open Dashboard</a></p>
                <p className="text-yellow-800 text-sm mt-1">RLS is disabled on all tables</p>
              </div>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Core Tables</h2>

              <h3 className="text-lg font-semibold text-black mt-4 mb-2">cleaners</h3>
              <p className="text-gray-600 mb-2">Team members who perform cleaning services</p>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Column</th><th className="border border-gray-300 px-4 py-2 text-left">Type</th><th className="border border-gray-300 px-4 py-2 text-left">Notes</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">id</td><td className="border border-gray-300 px-4 py-2">uuid</td><td className="border border-gray-300 px-4 py-2">Primary key</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">name</td><td className="border border-gray-300 px-4 py-2">text</td><td className="border border-gray-300 px-4 py-2">Full name</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">email</td><td className="border border-gray-300 px-4 py-2">text</td><td className="border border-gray-300 px-4 py-2">For daily job summary emails</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">phone</td><td className="border border-gray-300 px-4 py-2">text</td><td className="border border-gray-300 px-4 py-2">Contact number</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">pin</td><td className="border border-gray-300 px-4 py-2">text</td><td className="border border-gray-300 px-4 py-2">4-digit login PIN</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">active</td><td className="border border-gray-300 px-4 py-2">boolean</td><td className="border border-gray-300 px-4 py-2">true = active</td></tr>
                </tbody>
              </table>

              <h3 className="text-lg font-semibold text-black mt-4 mb-2">clients</h3>
              <p className="text-gray-600 mb-2">Customers who book cleaning services</p>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Column</th><th className="border border-gray-300 px-4 py-2 text-left">Type</th><th className="border border-gray-300 px-4 py-2 text-left">Notes</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">id</td><td className="border border-gray-300 px-4 py-2">uuid</td><td className="border border-gray-300 px-4 py-2">Primary key</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">name</td><td className="border border-gray-300 px-4 py-2">text</td><td className="border border-gray-300 px-4 py-2">Full name</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">email</td><td className="border border-gray-300 px-4 py-2">text</td><td className="border border-gray-300 px-4 py-2">For confirmations & reminders</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">phone</td><td className="border border-gray-300 px-4 py-2">text</td><td className="border border-gray-300 px-4 py-2">For verification</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">address</td><td className="border border-gray-300 px-4 py-2">text</td><td className="border border-gray-300 px-4 py-2">Service address</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">referrer_id</td><td className="border border-gray-300 px-4 py-2">uuid</td><td className="border border-gray-300 px-4 py-2">FK → referrers.id (nullable)</td></tr>
                </tbody>
              </table>

              <h3 className="text-lg font-semibold text-black mt-4 mb-2">bookings</h3>
              <p className="text-gray-600 mb-2">Scheduled cleaning appointments</p>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Column</th><th className="border border-gray-300 px-4 py-2 text-left">Type</th><th className="border border-gray-300 px-4 py-2 text-left">Notes</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">id</td><td className="border border-gray-300 px-4 py-2">uuid</td><td className="border border-gray-300 px-4 py-2">Primary key</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">client_id</td><td className="border border-gray-300 px-4 py-2">uuid</td><td className="border border-gray-300 px-4 py-2">FK → clients.id</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">cleaner_id</td><td className="border border-gray-300 px-4 py-2">uuid</td><td className="border border-gray-300 px-4 py-2">FK → cleaners.id</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">start_time</td><td className="border border-gray-300 px-4 py-2">timestamp</td><td className="border border-gray-300 px-4 py-2">Appointment start</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">price</td><td className="border border-gray-300 px-4 py-2">integer</td><td className="border border-gray-300 px-4 py-2">Price in cents (15000 = $150)</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">status</td><td className="border border-gray-300 px-4 py-2">text</td><td className="border border-gray-300 px-4 py-2">scheduled, completed, cancelled</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">referrer_id</td><td className="border border-gray-300 px-4 py-2">uuid</td><td className="border border-gray-300 px-4 py-2">FK → referrers.id (for attribution)</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">ref_code</td><td className="border border-gray-300 px-4 py-2">text</td><td className="border border-gray-300 px-4 py-2">Referral code used at booking</td></tr>
                </tbody>
              </table>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Referral Tables</h2>

              <h3 className="text-lg font-semibold text-black mt-4 mb-2">referrers</h3>
              <p className="text-gray-600 mb-2">People who refer clients for 10% commission</p>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Column</th><th className="border border-gray-300 px-4 py-2 text-left">Type</th><th className="border border-gray-300 px-4 py-2 text-left">Notes</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">id</td><td className="border border-gray-300 px-4 py-2">uuid</td><td className="border border-gray-300 px-4 py-2">Primary key</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">name</td><td className="border border-gray-300 px-4 py-2">text</td><td className="border border-gray-300 px-4 py-2">Full name</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">email</td><td className="border border-gray-300 px-4 py-2">text</td><td className="border border-gray-300 px-4 py-2">UNIQUE - for login</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">ref_code</td><td className="border border-gray-300 px-4 py-2">text</td><td className="border border-gray-300 px-4 py-2">UNIQUE - e.g., JOHN123</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">total_earned</td><td className="border border-gray-300 px-4 py-2">integer</td><td className="border border-gray-300 px-4 py-2">Total commissions earned (cents)</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">total_paid</td><td className="border border-gray-300 px-4 py-2">integer</td><td className="border border-gray-300 px-4 py-2">Total paid out (cents)</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">preferred_payout</td><td className="border border-gray-300 px-4 py-2">text</td><td className="border border-gray-300 px-4 py-2">zelle or apple_cash</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">active</td><td className="border border-gray-300 px-4 py-2">boolean</td><td className="border border-gray-300 px-4 py-2">Default true</td></tr>
                </tbody>
              </table>

              <h3 className="text-lg font-semibold text-black mt-4 mb-2">referral_commissions</h3>
              <p className="text-gray-600 mb-2">Commission records for each completed booking</p>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Column</th><th className="border border-gray-300 px-4 py-2 text-left">Type</th><th className="border border-gray-300 px-4 py-2 text-left">Notes</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">id</td><td className="border border-gray-300 px-4 py-2">uuid</td><td className="border border-gray-300 px-4 py-2">Primary key</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">booking_id</td><td className="border border-gray-300 px-4 py-2">uuid</td><td className="border border-gray-300 px-4 py-2">FK → bookings.id</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">referrer_id</td><td className="border border-gray-300 px-4 py-2">uuid</td><td className="border border-gray-300 px-4 py-2">FK → referrers.id</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">gross_amount</td><td className="border border-gray-300 px-4 py-2">integer</td><td className="border border-gray-300 px-4 py-2">Booking price (cents)</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">commission_amount</td><td className="border border-gray-300 px-4 py-2">integer</td><td className="border border-gray-300 px-4 py-2">10% commission (cents)</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">status</td><td className="border border-gray-300 px-4 py-2">text</td><td className="border border-gray-300 px-4 py-2">pending or paid</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">paid_via</td><td className="border border-gray-300 px-4 py-2">text</td><td className="border border-gray-300 px-4 py-2">zelle or apple_cash</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">paid_at</td><td className="border border-gray-300 px-4 py-2">timestamp</td><td className="border border-gray-300 px-4 py-2">When paid out</td></tr>
                </tbody>
              </table>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Lead Tracking Tables</h2>

              <h3 className="text-lg font-semibold text-black mt-4 mb-2">lead_clicks</h3>
              <p className="text-gray-600 mb-2">Tracks all visitor activity from 99 EMD domains</p>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Column</th><th className="border border-gray-300 px-4 py-2 text-left">Type</th><th className="border border-gray-300 px-4 py-2 text-left">Notes</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">id</td><td className="border border-gray-300 px-4 py-2">uuid</td><td className="border border-gray-300 px-4 py-2">Primary key</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">domain</td><td className="border border-gray-300 px-4 py-2">text</td><td className="border border-gray-300 px-4 py-2">Source domain (e.g., tribecamaid.com)</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">action</td><td className="border border-gray-300 px-4 py-2">text</td><td className="border border-gray-300 px-4 py-2">visit, call, text, book</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">lead_id</td><td className="border border-gray-300 px-4 py-2">text</td><td className="border border-gray-300 px-4 py-2">Deterministic ID (LID_xxx)</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">first_domain</td><td className="border border-gray-300 px-4 py-2">text</td><td className="border border-gray-300 px-4 py-2">First-touch attribution</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">last_domain</td><td className="border border-gray-300 px-4 py-2">text</td><td className="border border-gray-300 px-4 py-2">Last-touch attribution</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">scroll_depth</td><td className="border border-gray-300 px-4 py-2">integer</td><td className="border border-gray-300 px-4 py-2">Max scroll percentage</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">time_on_page</td><td className="border border-gray-300 px-4 py-2">integer</td><td className="border border-gray-300 px-4 py-2">Seconds on page</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">engaged_30s</td><td className="border border-gray-300 px-4 py-2">boolean</td><td className="border border-gray-300 px-4 py-2">Stayed 30+ seconds</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">ref_code</td><td className="border border-gray-300 px-4 py-2">text</td><td className="border border-gray-300 px-4 py-2">Referral code if present</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'security' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Security</h1>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 font-semibold">✅ All admin APIs are protected (as of Feb 4, 2026)</p>
              </div>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Authentication Layers</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Layer</th><th className="border border-gray-300 px-4 py-2 text-left">Method</th><th className="border border-gray-300 px-4 py-2 text-left">Protects</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2">Middleware</td><td className="border border-gray-300 px-4 py-2">Cookie check</td><td className="border border-gray-300 px-4 py-2">/dashboard/* pages</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">protectAdminAPI()</td><td className="border border-gray-300 px-4 py-2">Cookie check</td><td className="border border-gray-300 px-4 py-2">All admin API routes</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">protectCronAPI()</td><td className="border border-gray-300 px-4 py-2">CRON_SECRET header</td><td className="border border-gray-300 px-4 py-2">/api/cron/* routes</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">Team tokens</td><td className="border border-gray-300 px-4 py-2">Time-limited UUID</td><td className="border border-gray-300 px-4 py-2">Cleaner check-in/out</td></tr>
                </tbody>
              </table>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">API Protection Status</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Route</th><th className="border border-gray-300 px-4 py-2 text-left">Status</th><th className="border border-gray-300 px-4 py-2 text-left">Access</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/bookings</td><td className="border border-gray-300 px-4 py-2">✅ Protected</td><td className="border border-gray-300 px-4 py-2">Admin only</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/clients</td><td className="border border-gray-300 px-4 py-2">✅ Protected</td><td className="border border-gray-300 px-4 py-2">Admin only</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/cleaners</td><td className="border border-gray-300 px-4 py-2">✅ Protected</td><td className="border border-gray-300 px-4 py-2">Admin only</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/dashboard</td><td className="border border-gray-300 px-4 py-2">✅ Protected</td><td className="border border-gray-300 px-4 py-2">Admin only</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/leads</td><td className="border border-gray-300 px-4 py-2">✅ Protected</td><td className="border border-gray-300 px-4 py-2">Admin only</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/notifications</td><td className="border border-gray-300 px-4 py-2">✅ Protected</td><td className="border border-gray-300 px-4 py-2">Admin only</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/client-analytics</td><td className="border border-gray-300 px-4 py-2">✅ Protected</td><td className="border border-gray-300 px-4 py-2">Admin only</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/referrers (list)</td><td className="border border-gray-300 px-4 py-2">✅ Protected</td><td className="border border-gray-300 px-4 py-2">Admin only</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/referrers?code=X</td><td className="border border-gray-300 px-4 py-2">🔓 Public</td><td className="border border-gray-300 px-4 py-2">Referrer portal lookup</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/cron/*</td><td className="border border-gray-300 px-4 py-2">✅ Protected</td><td className="border border-gray-300 px-4 py-2">CRON_SECRET required</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/track</td><td className="border border-gray-300 px-4 py-2">🔓 Public</td><td className="border border-gray-300 px-4 py-2">Tracking pixel (intentional)</td></tr>
                </tbody>
              </table>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Login Security</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li><strong>Rate limiting:</strong> 5 attempts per 5 minutes per IP</li>
                <li><strong>Cookies:</strong> httpOnly, secure, sameSite strict, 24h expiry</li>
                <li><strong>Password:</strong> Stored in ADMIN_PASSWORD env var (not in DB)</li>
              </ul>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Environment Variables Required</h2>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`ADMIN_PASSWORD=xxx          # Admin login password
CRON_SECRET=xxx             # Protects cron endpoints`}
              </pre>
            </div>
          )}

          {activeSection === 'referrals' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Referral Program</h1>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800"><strong>Commission Rate:</strong> 10% of completed service</p>
                <p className="text-green-800"><strong>Payout Methods:</strong> Zelle or Apple Cash (manual)</p>
              </div>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">How It Works</h2>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700 mb-6">
                <li>Referrer signs up at <code className="bg-gray-200 px-1 rounded">/referral/signup</code></li>
                <li>Gets unique ref code (e.g., JOHN123) and link: <code className="bg-gray-200 px-1 rounded">nycmaid.nyc/book?ref=JOHN123</code></li>
                <li>Client books using the referral link</li>
                <li>Client is tagged with referrer_id</li>
                <li>When cleaner checks out → commission auto-created</li>
                <li>Referrer gets email notification</li>
                <li>Admin marks as paid in <code className="bg-gray-200 px-1 rounded">/dashboard/referrals</code></li>
              </ol>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">URLs</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">URL</th><th className="border border-gray-300 px-4 py-2 text-left">Purpose</th><th className="border border-gray-300 px-4 py-2 text-left">Access</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/referral/signup</td><td className="border border-gray-300 px-4 py-2">Referrer signup form</td><td className="border border-gray-300 px-4 py-2">Public</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/referral?code=XXX</td><td className="border border-gray-300 px-4 py-2">Referrer dashboard (login by email)</td><td className="border border-gray-300 px-4 py-2">Referrers</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/dashboard/referrals</td><td className="border border-gray-300 px-4 py-2">Admin payout queue + management</td><td className="border border-gray-300 px-4 py-2">Admin</td></tr>
                </tbody>
              </table>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Admin Payout Flow</h2>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700 mb-6">
                <li>Go to <code className="bg-gray-200 px-1 rounded">/dashboard/referrals</code></li>
                <li>See pending commissions in payout queue</li>
                <li>Send money via Zelle/Apple Cash manually</li>
                <li>Click "Zelle ✓" or "Apple ✓" to mark as paid</li>
              </ol>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Commission Email</h2>
              <p className="text-gray-700 mb-2">When checkout triggers commission, referrer receives:</p>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`Subject: 💰 You earned $18.40 from your referral!

Service Total: $184.00
Your Commission (10%): $18.40
Pending Balance: $42.60

[View Your Dashboard] button
Share your link: nycmaid.nyc/book?ref=JOHN123`}
              </pre>
            </div>
          )}

          {activeSection === 'analytics' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Client Analytics</h1>
              
              <p className="text-gray-700 mb-4">View at: <code className="bg-gray-200 px-1 rounded">/dashboard/clients</code></p>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Metrics Tracked</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Metric</th><th className="border border-gray-300 px-4 py-2 text-left">Definition</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-semibold">LTV</td><td className="border border-gray-300 px-4 py-2">Lifetime Value - total revenue from client</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-semibold">Retention Rate</td><td className="border border-gray-300 px-4 py-2">% of clients who book again within 90 days</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-semibold">Churn Rate</td><td className="border border-gray-300 px-4 py-2">% of clients inactive 90+ days</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-semibold">Booking Frequency</td><td className="border border-gray-300 px-4 py-2">Avg days between bookings</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-semibold">Referral Rate</td><td className="border border-gray-300 px-4 py-2">% of clients from referrals</td></tr>
                </tbody>
              </table>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Client Status</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Status</th><th className="border border-gray-300 px-4 py-2 text-left">Color</th><th className="border border-gray-300 px-4 py-2 text-left">Definition</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2">New</td><td className="border border-gray-300 px-4 py-2">🔵 Blue</td><td className="border border-gray-300 px-4 py-2">No completed bookings yet</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">Active</td><td className="border border-gray-300 px-4 py-2">🟢 Green</td><td className="border border-gray-300 px-4 py-2">Booked within last 45 days</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">At-Risk</td><td className="border border-gray-300 px-4 py-2">🟡 Yellow</td><td className="border border-gray-300 px-4 py-2">45-90 days since last booking</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">Churned</td><td className="border border-gray-300 px-4 py-2">🔴 Red</td><td className="border border-gray-300 px-4 py-2">90+ days inactive</td></tr>
                </tbody>
              </table>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">API Endpoint</h2>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`GET /api/client-analytics

Returns:
{
  overview: { totalClients, totalRevenue, avgLTV, retentionRate, churnRate },
  statusCounts: { new, active, atRisk, churned },
  topClients: [...],
  atRiskClients: [...],
  allClients: [...]
}`}
              </pre>
            </div>
          )}

          {activeSection === 'leads' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Lead Tracking</h1>
              
              <p className="text-gray-700 mb-4">View at: <code className="bg-gray-200 px-1 rounded">/dashboard/leads</code></p>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">99 EMD Domains</h2>
              <p className="text-gray-700 mb-4">Each neighborhood has an Exact Match Domain (EMD) pointing to a landing page with tracking.</p>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Tracking Script</h2>
              <p className="text-gray-700 mb-4">Each EMD includes a tracking script that sends data to <code className="bg-gray-200 px-1 rounded">/api/track</code>:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
                <li>Page visits</li>
                <li>CTA clicks (call, text, book)</li>
                <li>Scroll depth</li>
                <li>Time on page</li>
                <li>First/last touch attribution</li>
                <li>Lead ID for deterministic tracking</li>
                <li>Referral code capture</li>
              </ul>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Revenue Attribution</h2>
              <p className="text-gray-700 mb-4">The <code className="bg-gray-200 px-1 rounded">/api/attribution</code> endpoint matches bookings to EMD domains:</p>
              <ol className="list-decimal pl-6 space-y-1 text-gray-700 mb-4">
                <li>Extract zip code from client address</li>
                <li>Match zip to neighborhood</li>
                <li>Match neighborhood to EMD domain</li>
                <li>Attribute revenue to that domain</li>
              </ol>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Lead ID Flow</h2>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`1. Visitor lands on tribecamaid.com
2. Script stores: first_domain = "tribecamaid.com"
3. Clicks "Text Us" → generates lead_id = "LID_abc123"
4. SMS link becomes: sms:+1212...?body=Hi! [LID_abc123]
5. Text received with [LID_abc123] visible
6. Match lead_id to booking for attribution`}
              </pre>
            </div>
          )}

          {activeSection === 'pages' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Pages (19 Total)</h1>
              
              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Public Pages (2)</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">File</th><th className="border border-gray-300 px-4 py-2 text-left">Route</th><th className="border border-gray-300 px-4 py-2 text-left">Purpose</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">app/page.tsx</td><td className="border border-gray-300 px-4 py-2">/</td><td className="border border-gray-300 px-4 py-2">Home/landing page</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">app/login/page.tsx</td><td className="border border-gray-300 px-4 py-2">/login</td><td className="border border-gray-300 px-4 py-2">Admin login form</td></tr>
                </tbody>
              </table>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Admin Dashboard (9 pages)</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">File</th><th className="border border-gray-300 px-4 py-2 text-left">Route</th><th className="border border-gray-300 px-4 py-2 text-left">Purpose</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">dashboard/page.tsx</td><td className="border border-gray-300 px-4 py-2">/dashboard</td><td className="border border-gray-300 px-4 py-2">Revenue stats, today's jobs, map</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">dashboard/calendar/page.tsx</td><td className="border border-gray-300 px-4 py-2">/dashboard/calendar</td><td className="border border-gray-300 px-4 py-2">Day/week/month calendar views</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">dashboard/bookings/page.tsx</td><td className="border border-gray-300 px-4 py-2">/dashboard/bookings</td><td className="border border-gray-300 px-4 py-2">Create/edit/manage bookings</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">dashboard/clients/page.tsx</td><td className="border border-gray-300 px-4 py-2">/dashboard/clients</td><td className="border border-gray-300 px-4 py-2">Client management + analytics</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">dashboard/cleaners/page.tsx</td><td className="border border-gray-300 px-4 py-2">/dashboard/cleaners</td><td className="border border-gray-300 px-4 py-2">Team members, PIN management</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">dashboard/websites/page.tsx</td><td className="border border-gray-300 px-4 py-2">/dashboard/websites</td><td className="border border-gray-300 px-4 py-2">99 EMD domains with map</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">dashboard/leads/page.tsx</td><td className="border border-gray-300 px-4 py-2">/dashboard/leads</td><td className="border border-gray-300 px-4 py-2">Lead tracking & revenue attribution</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">dashboard/referrals/page.tsx</td><td className="border border-gray-300 px-4 py-2">/dashboard/referrals</td><td className="border border-gray-300 px-4 py-2">Referral program management</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">dashboard/docs/page.tsx</td><td className="border border-gray-300 px-4 py-2">/dashboard/docs</td><td className="border border-gray-300 px-4 py-2">This documentation</td></tr>
                </tbody>
              </table>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Client Portal (4 pages)</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">File</th><th className="border border-gray-300 px-4 py-2 text-left">Route</th><th className="border border-gray-300 px-4 py-2 text-left">Purpose</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">book/page.tsx</td><td className="border border-gray-300 px-4 py-2">/book</td><td className="border border-gray-300 px-4 py-2">Phone entry, verification</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">book/dashboard/page.tsx</td><td className="border border-gray-300 px-4 py-2">/book/dashboard</td><td className="border border-gray-300 px-4 py-2">Client's appointments</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">book/new/page.tsx</td><td className="border border-gray-300 px-4 py-2">/book/new</td><td className="border border-gray-300 px-4 py-2">New booking flow</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">book/reschedule/[id]/page.tsx</td><td className="border border-gray-300 px-4 py-2">/book/reschedule/:id</td><td className="border border-gray-300 px-4 py-2">Reschedule booking</td></tr>
                </tbody>
              </table>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Team Portal (3 pages)</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">File</th><th className="border border-gray-300 px-4 py-2 text-left">Route</th><th className="border border-gray-300 px-4 py-2 text-left">Purpose</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">team/page.tsx</td><td className="border border-gray-300 px-4 py-2">/team</td><td className="border border-gray-300 px-4 py-2">4-digit PIN login</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">team/dashboard/page.tsx</td><td className="border border-gray-300 px-4 py-2">/team/dashboard</td><td className="border border-gray-300 px-4 py-2">Today's jobs</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">team/[token]/page.tsx</td><td className="border border-gray-300 px-4 py-2">/team/:token</td><td className="border border-gray-300 px-4 py-2">Token-based access</td></tr>
                </tbody>
              </table>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Referrer Portal (2 pages)</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">File</th><th className="border border-gray-300 px-4 py-2 text-left">Route</th><th className="border border-gray-300 px-4 py-2 text-left">Purpose</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">referral/signup/page.tsx</td><td className="border border-gray-300 px-4 py-2">/referral/signup</td><td className="border border-gray-300 px-4 py-2">New referrer signup</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">referral/page.tsx</td><td className="border border-gray-300 px-4 py-2">/referral</td><td className="border border-gray-300 px-4 py-2">Referrer dashboard</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'api' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">API Routes (37 Total)</h1>
              
              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Authentication (2)</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Endpoint</th><th className="border border-gray-300 px-4 py-2 text-left">Method</th><th className="border border-gray-300 px-4 py-2 text-left">Purpose</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/auth/login</td><td className="border border-gray-300 px-4 py-2">POST</td><td className="border border-gray-300 px-4 py-2">Admin login (rate-limited)</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/auth/logout</td><td className="border border-gray-300 px-4 py-2">POST</td><td className="border border-gray-300 px-4 py-2">Admin logout</td></tr>
                </tbody>
              </table>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Admin CRUD (6) - Protected</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Endpoint</th><th className="border border-gray-300 px-4 py-2 text-left">Methods</th><th className="border border-gray-300 px-4 py-2 text-left">Purpose</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/bookings</td><td className="border border-gray-300 px-4 py-2">GET, POST</td><td className="border border-gray-300 px-4 py-2">List all / Create new</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/bookings/[id]</td><td className="border border-gray-300 px-4 py-2">PUT, DELETE</td><td className="border border-gray-300 px-4 py-2">Update / Delete single</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/clients</td><td className="border border-gray-300 px-4 py-2">GET, POST</td><td className="border border-gray-300 px-4 py-2">List all / Create new</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/clients/[id]</td><td className="border border-gray-300 px-4 py-2">GET, PUT, DELETE</td><td className="border border-gray-300 px-4 py-2">Read / Update / Delete</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/cleaners</td><td className="border border-gray-300 px-4 py-2">GET, POST</td><td className="border border-gray-300 px-4 py-2">List all / Create new</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/cleaners/[id]</td><td className="border border-gray-300 px-4 py-2">PUT, DELETE</td><td className="border border-gray-300 px-4 py-2">Update / Delete</td></tr>
                </tbody>
              </table>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Referral Program (3)</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Endpoint</th><th className="border border-gray-300 px-4 py-2 text-left">Methods</th><th className="border border-gray-300 px-4 py-2 text-left">Purpose</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/referrers</td><td className="border border-gray-300 px-4 py-2">GET, POST, PUT</td><td className="border border-gray-300 px-4 py-2">Referrer CRUD</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/referral-commissions</td><td className="border border-gray-300 px-4 py-2">GET, POST, PUT</td><td className="border border-gray-300 px-4 py-2">Commission management</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/client-analytics</td><td className="border border-gray-300 px-4 py-2">GET</td><td className="border border-gray-300 px-4 py-2">LTV, churn, retention stats</td></tr>
                </tbody>
              </table>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Lead Tracking (4)</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Endpoint</th><th className="border border-gray-300 px-4 py-2 text-left">Method</th><th className="border border-gray-300 px-4 py-2 text-left">Purpose</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/track</td><td className="border border-gray-300 px-4 py-2">POST</td><td className="border border-gray-300 px-4 py-2">Tracking pixel (public)</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/leads</td><td className="border border-gray-300 px-4 py-2">GET</td><td className="border border-gray-300 px-4 py-2">Lead analytics (protected)</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/attribution</td><td className="border border-gray-300 px-4 py-2">GET</td><td className="border border-gray-300 px-4 py-2">Revenue attribution</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/domain-notes</td><td className="border border-gray-300 px-4 py-2">GET, PUT</td><td className="border border-gray-300 px-4 py-2">Notes per domain</td></tr>
                </tbody>
              </table>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Client Portal (9)</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Endpoint</th><th className="border border-gray-300 px-4 py-2 text-left">Method</th><th className="border border-gray-300 px-4 py-2 text-left">Purpose</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/client/check</td><td className="border border-gray-300 px-4 py-2">POST</td><td className="border border-gray-300 px-4 py-2">Check if client exists</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/client/send-code</td><td className="border border-gray-300 px-4 py-2">POST</td><td className="border border-gray-300 px-4 py-2">Send SMS verification</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/client/verify-code</td><td className="border border-gray-300 px-4 py-2">POST</td><td className="border border-gray-300 px-4 py-2">Verify SMS code</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/client/login</td><td className="border border-gray-300 px-4 py-2">POST</td><td className="border border-gray-300 px-4 py-2">Client login</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/client/availability</td><td className="border border-gray-300 px-4 py-2">GET</td><td className="border border-gray-300 px-4 py-2">Get available slots</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/client/book</td><td className="border border-gray-300 px-4 py-2">POST</td><td className="border border-gray-300 px-4 py-2">Create booking (captures ref_code)</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/client/bookings</td><td className="border border-gray-300 px-4 py-2">GET</td><td className="border border-gray-300 px-4 py-2">Get client's bookings</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/client/booking/[id]</td><td className="border border-gray-300 px-4 py-2">GET</td><td className="border border-gray-300 px-4 py-2">Get single booking</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/client/reschedule/[id]</td><td className="border border-gray-300 px-4 py-2">PUT</td><td className="border border-gray-300 px-4 py-2">Reschedule booking</td></tr>
                </tbody>
              </table>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Team Portal (5)</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Endpoint</th><th className="border border-gray-300 px-4 py-2 text-left">Method</th><th className="border border-gray-300 px-4 py-2 text-left">Purpose</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/team/login</td><td className="border border-gray-300 px-4 py-2">POST</td><td className="border border-gray-300 px-4 py-2">Team login (PIN)</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/team/jobs</td><td className="border border-gray-300 px-4 py-2">GET</td><td className="border border-gray-300 px-4 py-2">Get cleaner's jobs</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/team/[token]</td><td className="border border-gray-300 px-4 py-2">GET</td><td className="border border-gray-300 px-4 py-2">Token-based job access</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/team/[token]/check-in</td><td className="border border-gray-300 px-4 py-2">POST</td><td className="border border-gray-300 px-4 py-2">Record job start</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/team/[token]/check-out</td><td className="border border-gray-300 px-4 py-2">POST</td><td className="border border-gray-300 px-4 py-2">Record job end + create commission</td></tr>
                </tbody>
              </table>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Cron Jobs (3) - Protected</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Endpoint</th><th className="border border-gray-300 px-4 py-2 text-left">Method</th><th className="border border-gray-300 px-4 py-2 text-left">Purpose</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/cron/reminders</td><td className="border border-gray-300 px-4 py-2">GET</td><td className="border border-gray-300 px-4 py-2">Send client reminders</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/cron/daily-summary</td><td className="border border-gray-300 px-4 py-2">GET</td><td className="border border-gray-300 px-4 py-2">Send cleaners tomorrow's jobs</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/cron/backup</td><td className="border border-gray-300 px-4 py-2">GET</td><td className="border border-gray-300 px-4 py-2">Email CSV backup</td></tr>
                </tbody>
              </table>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Other (5)</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Endpoint</th><th className="border border-gray-300 px-4 py-2 text-left">Method</th><th className="border border-gray-300 px-4 py-2 text-left">Purpose</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/dashboard</td><td className="border border-gray-300 px-4 py-2">GET</td><td className="border border-gray-300 px-4 py-2">Dashboard stats</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/notifications</td><td className="border border-gray-300 px-4 py-2">GET, PUT</td><td className="border border-gray-300 px-4 py-2">Notification management</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/import-clients</td><td className="border border-gray-300 px-4 py-2">POST</td><td className="border border-gray-300 px-4 py-2">Bulk import clients</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/send-booking-emails</td><td className="border border-gray-300 px-4 py-2">POST</td><td className="border border-gray-300 px-4 py-2">Send confirmation emails</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'components' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Components (7 Total)</h1>
              
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Component</th><th className="border border-gray-300 px-4 py-2 text-left">File</th><th className="border border-gray-300 px-4 py-2 text-left">Purpose</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-semibold">DashboardHeader</td><td className="border border-gray-300 px-4 py-2 font-mono text-xs">DashboardHeader.tsx</td><td className="border border-gray-300 px-4 py-2">Main nav header (Dashboard, Calendar, Bookings, Clients, Team, Websites, Leads, Referrals, Docs)</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-semibold">AdminHeader</td><td className="border border-gray-300 px-4 py-2 font-mono text-xs">AdminHeader.tsx</td><td className="border border-gray-300 px-4 py-2">Alternative header component</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-semibold">NotificationBell</td><td className="border border-gray-300 px-4 py-2 font-mono text-xs">NotificationBell.tsx</td><td className="border border-gray-300 px-4 py-2">Bell icon with unread count, dropdown</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-semibold">DashboardMap</td><td className="border border-gray-300 px-4 py-2 font-mono text-xs">DashboardMap.tsx</td><td className="border border-gray-300 px-4 py-2">Leaflet map for today's jobs</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-semibold">WebsitesMap</td><td className="border border-gray-300 px-4 py-2 font-mono text-xs">WebsitesMap.tsx</td><td className="border border-gray-300 px-4 py-2">Leaflet map for 99 EMD domains</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-semibold">AddressAutocomplete</td><td className="border border-gray-300 px-4 py-2 font-mono text-xs">AddressAutocomplete.tsx</td><td className="border border-gray-300 px-4 py-2">Address input with suggestions</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-semibold">RecurringOptions</td><td className="border border-gray-300 px-4 py-2 font-mono text-xs">RecurringOptions.tsx</td><td className="border border-gray-300 px-4 py-2">Recurring booking selector</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'lib' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Library Files (7 Total)</h1>
              
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">File</th><th className="border border-gray-300 px-4 py-2 text-left">Purpose</th><th className="border border-gray-300 px-4 py-2 text-left">Key Exports</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">supabase.ts</td><td className="border border-gray-300 px-4 py-2">Supabase client</td><td className="border border-gray-300 px-4 py-2 font-mono text-xs">supabase</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">auth.ts</td><td className="border border-gray-300 px-4 py-2">Auth utilities</td><td className="border border-gray-300 px-4 py-2 font-mono text-xs">protectAdminAPI, protectCronAPI</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">email.ts</td><td className="border border-gray-300 px-4 py-2">Resend email sending</td><td className="border border-gray-300 px-4 py-2 font-mono text-xs">sendEmail</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">email-templates.ts</td><td className="border border-gray-300 px-4 py-2">HTML email templates</td><td className="border border-gray-300 px-4 py-2 font-mono text-xs">clientReminderEmail, cleanerDailySummaryEmail</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">format.ts</td><td className="border border-gray-300 px-4 py-2">Formatting utilities</td><td className="border border-gray-300 px-4 py-2 font-mono text-xs">formatPrice, formatDate</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">tokens.ts</td><td className="border border-gray-300 px-4 py-2">Token generation</td><td className="border border-gray-300 px-4 py-2 font-mono text-xs">generateToken</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">attribution.ts</td><td className="border border-gray-300 px-4 py-2">Revenue attribution</td><td className="border border-gray-300 px-4 py-2 font-mono text-xs">getNeighborhoodFromZip, zipToNeighborhood</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'cron' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Cron Jobs</h1>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800"><strong>⚠️ Requires CRON_SECRET</strong> - All cron routes now require authorization header</p>
              </div>

              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Job</th><th className="border border-gray-300 px-4 py-2 text-left">Cron</th><th className="border border-gray-300 px-4 py-2 text-left">UTC</th><th className="border border-gray-300 px-4 py-2 text-left">NYC (EST)</th><th className="border border-gray-300 px-4 py-2 text-left">What It Does</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/cron/reminders</td><td className="border border-gray-300 px-4 py-2 font-mono text-xs">0 * * * *</td><td className="border border-gray-300 px-4 py-2">Every hour</td><td className="border border-gray-300 px-4 py-2">Every hour</td><td className="border border-gray-300 px-4 py-2">7/3/1-day and 2-hour reminders</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/cron/daily-summary</td><td className="border border-gray-300 px-4 py-2 font-mono text-xs">0 0 * * *</td><td className="border border-gray-300 px-4 py-2">Midnight</td><td className="border border-gray-300 px-4 py-2">7pm</td><td className="border border-gray-300 px-4 py-2">Email cleaners tomorrow's jobs</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/cron/backup</td><td className="border border-gray-300 px-4 py-2 font-mono text-xs">0 5 * * *</td><td className="border border-gray-300 px-4 py-2">5am</td><td className="border border-gray-300 px-4 py-2">Midnight</td><td className="border border-gray-300 px-4 py-2">Email admin CSV backup</td></tr>
                </tbody>
              </table>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">vercel.json</h2>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto mb-6">
{`{
  "crons": [
    { "path": "/api/cron/reminders", "schedule": "0 * * * *" },
    { "path": "/api/cron/daily-summary", "schedule": "0 0 * * *" },
    { "path": "/api/cron/backup", "schedule": "0 5 * * *" }
  ]
}`}
              </pre>
            </div>
          )}

          {activeSection === 'emails' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Email System</h1>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-gray-700"><strong>Provider:</strong> Resend</p>
                <p className="text-gray-700"><strong>From:</strong> hello@nycmaid.nyc</p>
              </div>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Email Types</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Email</th><th className="border border-gray-300 px-4 py-2 text-left">To</th><th className="border border-gray-300 px-4 py-2 text-left">When</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2">Booking Confirmation</td><td className="border border-gray-300 px-4 py-2">Client</td><td className="border border-gray-300 px-4 py-2">On booking creation</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">Cleaner Assignment</td><td className="border border-gray-300 px-4 py-2">Cleaner</td><td className="border border-gray-300 px-4 py-2">On booking creation</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">7/3/1-Day Reminder</td><td className="border border-gray-300 px-4 py-2">Client</td><td className="border border-gray-300 px-4 py-2">Before appointment (7pm EST)</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">2-Hour Reminder</td><td className="border border-gray-300 px-4 py-2">Client</td><td className="border border-gray-300 px-4 py-2">2 hours before service</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">Daily Job Summary</td><td className="border border-gray-300 px-4 py-2">Cleaner</td><td className="border border-gray-300 px-4 py-2">7pm EST daily</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">Backup Report</td><td className="border border-gray-300 px-4 py-2">Admin</td><td className="border border-gray-300 px-4 py-2">Midnight EST daily</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">Commission Notification</td><td className="border border-gray-300 px-4 py-2">Referrer</td><td className="border border-gray-300 px-4 py-2">On checkout (when commission created)</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">Cancellation</td><td className="border border-gray-300 px-4 py-2">Client + Cleaner</td><td className="border border-gray-300 px-4 py-2">On booking cancellation</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'portals' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">User Portals</h1>
              
              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Admin Dashboard</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-gray-700"><strong>URL:</strong> /dashboard</p>
                <p className="text-gray-700"><strong>Login:</strong> /login (password from ADMIN_PASSWORD)</p>
              </div>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Client Portal</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-gray-700"><strong>URL:</strong> /book</p>
                <p className="text-gray-700"><strong>Login:</strong> Phone number → SMS verification code</p>
              </div>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Team Portal</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-gray-700"><strong>URL:</strong> /team</p>
                <p className="text-gray-700"><strong>Login:</strong> 4-digit PIN</p>
              </div>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Referrer Portal</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-gray-700"><strong>Signup:</strong> /referral/signup</p>
                <p className="text-gray-700"><strong>Dashboard:</strong> /referral (login by email)</p>
                <p className="text-gray-700"><strong>Features:</strong> View earnings, copy referral link, see referral history</p>
              </div>
            </div>
          )}

          {activeSection === 'env' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Environment Variables</h1>
              
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Variable</th><th className="border border-gray-300 px-4 py-2 text-left">Required</th><th className="border border-gray-300 px-4 py-2 text-left">Purpose</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</td><td className="border border-gray-300 px-4 py-2">✅</td><td className="border border-gray-300 px-4 py-2">Supabase project URL</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</td><td className="border border-gray-300 px-4 py-2">✅</td><td className="border border-gray-300 px-4 py-2">Supabase public anon key</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">RESEND_API_KEY</td><td className="border border-gray-300 px-4 py-2">✅</td><td className="border border-gray-300 px-4 py-2">Resend email API key</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">ADMIN_PASSWORD</td><td className="border border-gray-300 px-4 py-2">✅</td><td className="border border-gray-300 px-4 py-2">Admin login password</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">CRON_SECRET</td><td className="border border-gray-300 px-4 py-2">✅</td><td className="border border-gray-300 px-4 py-2">Protects cron endpoints</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">ADMIN_EMAIL</td><td className="border border-gray-300 px-4 py-2">Optional</td><td className="border border-gray-300 px-4 py-2">Email for backup reports</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'deployment' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Deployment</h1>
              
              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Standard Deploy Process</h2>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto mb-6">
{`# 1. Build locally first
npm run build

# 2. If build passes, commit and deploy
git add .
git commit -m "Description of changes"
npx vercel --prod

# 3. Push to GitHub for backup
git push origin main`}
              </pre>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Important Links</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-semibold">Live Site</td><td className="border border-gray-300 px-4 py-2"><a href="https://www.nycmaid.nyc" className="text-blue-600 underline">www.nycmaid.nyc</a></td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-semibold">Vercel Dashboard</td><td className="border border-gray-300 px-4 py-2"><a href="https://vercel.com/jeff-tuckers-projects/nycmaid" className="text-blue-600 underline">vercel.com/jeff-tuckers-projects/nycmaid</a></td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-semibold">GitHub Repo</td><td className="border border-gray-300 px-4 py-2"><a href="https://github.com/thenycmaid/nycmaid" className="text-blue-600 underline">github.com/thenycmaid/nycmaid</a></td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-semibold">Supabase</td><td className="border border-gray-300 px-4 py-2"><a href="https://supabase.com/dashboard/project/ioppmvchszymwswtwsze" className="text-blue-600 underline">supabase.com/dashboard/project/...</a></td></tr>
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'troubleshooting' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Troubleshooting</h1>
              
              <h2 className="text-xl font-semibold text-black mt-6 mb-3">401 Unauthorized on API</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-gray-700"><strong>Cause:</strong> Not logged in as admin</p>
                <p className="text-gray-700"><strong>Fix:</strong> Go to /login and authenticate</p>
              </div>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Cron Jobs Not Running</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-gray-700"><strong>Cause:</strong> CRON_SECRET not set or doesn't match</p>
                <p className="text-gray-700"><strong>Fix:</strong> Set CRON_SECRET in Vercel env vars</p>
              </div>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Commission Not Created</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-gray-700"><strong>Cause:</strong> Client doesn't have referrer_id set</p>
                <p className="text-gray-700"><strong>Fix:</strong> Ensure client was linked to referrer when booking</p>
              </div>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Referrer Portal Not Loading</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-gray-700"><strong>Cause:</strong> Invalid ref code or email</p>
                <p className="text-gray-700"><strong>Fix:</strong> Check referrer exists and is active in database</p>
              </div>

              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Useful Debug Commands</h2>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`# Check Vercel logs
vercel logs --follow

# Test API endpoint (need auth cookie)
curl -b "admin_authenticated=true" https://www.nycmaid.nyc/api/dashboard

# Check build errors
npm run build 2>&1 | head -50`}
              </pre>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
