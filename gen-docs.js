const fs = require('fs');

// Read old docs for reference sections we need to preserve
const sections = `'use client'

import { useState, useEffect } from 'react'
import DashboardHeader from '@/components/DashboardHeader'

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'stack', label: 'Tech Stack' },
  { id: 'pages', label: 'Pages (20)' },
  { id: 'api', label: 'API Routes (37+)' },
  { id: 'database', label: 'Database' },
  { id: 'components', label: 'Components' },
  { id: 'lib', label: 'Library Files' },
  { id: 'emails', label: 'Email System' },
  { id: 'security', label: 'Security' },
  { id: 'portals', label: 'User Portals' },
  { id: 'referrals', label: 'Referral Program' },
  { id: 'analytics', label: 'Client Analytics' },
  { id: 'leads', label: 'Lead Tracking' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'cron', label: 'Cron Jobs' },
  { id: 'settings', label: 'Settings' },
  { id: 'env', label: 'Environment' },
  { id: 'deployment', label: 'Deployment' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
]`;

// Strategy: take the old docs, remove company sections, add new sections
// Read old file
const old = fs.readFileSync('old-docs-backup.tsx', 'utf8');

// Extract platform sections from old docs (everything from activeSection === 'overview' to end)
// Then add new sections

// Build new file by:
// 1. New header with updated section list
// 2. Old platform sections (cleaned up) 
// 3. New sections (notifications, settings)

// Actually simpler: take old file, replace the section definitions, remove company sections
let newFile = old;

// Replace section definitions
const oldCompanySections = `const companySections = [
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
  ]`;

const newSections = `const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'stack', label: 'Tech Stack' },
    { id: 'files', label: 'File Structure' },
    { id: 'database', label: 'Database Schema' },
    { id: 'pages', label: 'Pages (20)' },
    { id: 'api', label: 'API Routes (37+)' },
    { id: 'components', label: 'Components (7)' },
    { id: 'lib', label: 'Library Files (7)' },
    { id: 'security', label: 'Security' },
    { id: 'referrals', label: 'Referral Program' },
    { id: 'analytics', label: 'Client Analytics' },
    { id: 'leads', label: 'Lead Tracking' },
    { id: 'cron', label: 'Cron Jobs' },
    { id: 'emails', label: 'Email System' },
    { id: 'portals', label: 'User Portals' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'settings', label: 'Settings' },
    { id: 'env', label: 'Environment Variables' },
    { id: 'deployment', label: 'Deployment' },
    { id: 'troubleshooting', label: 'Troubleshooting' },
  ]`;

newFile = newFile.replace(oldCompanySections, newSections);

// Replace the two-group navigation with single group
const oldNav = `          <div className="mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Company</p>
            {companySections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={\`block w-full text-left px-3 py-2 rounded-lg text-sm mb-1 \${
                  activeSection === section.id
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }\`}
              >
                {section.label}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Platform</p>
            {platformSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={\`block w-full text-left px-3 py-2 rounded-lg text-sm mb-1 \${
                  activeSection === section.id
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }\`}
              >
                {section.label}
              </button>
            ))}
          </div>`;

const newNav = `          <div className="flex gap-2 flex-wrap">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={\`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors \${
                  activeSection === section.id
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }\`}
              >
                {section.label}
              </button>
            ))}
          </div>`;

newFile = newFile.replace(oldNav, newNav);

// Remove all company section content (about through contact)
const companyIds = ['about', 'services', 'pricing', 'policies', 'marketing', 'business-plan', 'valuation', 'contact'];
for (const id of companyIds) {
  const regex = new RegExp(`\\{activeSection === '${id}' && \\([\\s\\S]*?\\n          \\)\\}`, 'g');
  newFile = newFile.replace(regex, '');
}

// Add notifications section before env
const notificationsSection = `
          {activeSection === 'notifications' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Notification System</h1>
              <p className="text-gray-700 mb-4">Bell icon in DashboardHeader with unread count badge. Click to see dropdown with mark-as-read.</p>
              <h2 className="text-xl font-semibold text-black mt-6 mb-3">10 Notification Types</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Type</th><th className="border border-gray-300 px-4 py-2 text-left">Icon</th><th className="border border-gray-300 px-4 py-2 text-left">Color</th><th className="border border-gray-300 px-4 py-2 text-left">Trigger</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2">new_booking</td><td className="border border-gray-300 px-4 py-2">📅</td><td className="border border-gray-300 px-4 py-2">Blue</td><td className="border border-gray-300 px-4 py-2">New booking created</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">booking_cancelled</td><td className="border border-gray-300 px-4 py-2">❌</td><td className="border border-gray-300 px-4 py-2">Red</td><td className="border border-gray-300 px-4 py-2">Booking cancelled</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">booking_completed</td><td className="border border-gray-300 px-4 py-2">✅</td><td className="border border-gray-300 px-4 py-2">Green</td><td className="border border-gray-300 px-4 py-2">Cleaner checked out</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">payment_received</td><td className="border border-gray-300 px-4 py-2">💰</td><td className="border border-gray-300 px-4 py-2">Green</td><td className="border border-gray-300 px-4 py-2">Payment marked paid</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">new_client</td><td className="border border-gray-300 px-4 py-2">👤</td><td className="border border-gray-300 px-4 py-2">Blue</td><td className="border border-gray-300 px-4 py-2">New client registered</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">new_referrer</td><td className="border border-gray-300 px-4 py-2">🤝</td><td className="border border-gray-300 px-4 py-2">Purple</td><td className="border border-gray-300 px-4 py-2">New referrer signed up</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">commission_created</td><td className="border border-gray-300 px-4 py-2">💸</td><td className="border border-gray-300 px-4 py-2">Yellow</td><td className="border border-gray-300 px-4 py-2">Commission auto-created</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">new_lead</td><td className="border border-gray-300 px-4 py-2">🎯</td><td className="border border-gray-300 px-4 py-2">Orange</td><td className="border border-gray-300 px-4 py-2">New lead from EMD domain</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">booking_rescheduled</td><td className="border border-gray-300 px-4 py-2">🔄</td><td className="border border-gray-300 px-4 py-2">Blue</td><td className="border border-gray-300 px-4 py-2">Client rescheduled</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2">system</td><td className="border border-gray-300 px-4 py-2">⚙️</td><td className="border border-gray-300 px-4 py-2">Gray</td><td className="border border-gray-300 px-4 py-2">System alerts</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'settings' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Settings Page</h1>
              <p className="text-gray-700 mb-4">Route: <code className="bg-gray-200 px-1 rounded">/dashboard/settings</code></p>
              <h2 className="text-xl font-semibold text-black mt-6 mb-3">4 Tabs</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                <thead><tr className="bg-gray-50"><th className="border border-gray-300 px-4 py-2 text-left">Tab</th><th className="border border-gray-300 px-4 py-2 text-left">Contents</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-300 px-4 py-2 font-semibold">General</td><td className="border border-gray-300 px-4 py-2">Business name, phone, email, address</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-semibold">Emails</td><td className="border border-gray-300 px-4 py-2">Email config, from address, DNS status (DKIM/SPF/DMARC), forwarding</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-semibold">Services</td><td className="border border-gray-300 px-4 py-2">Service types (Standard, Deep, Move In/Out, Post Construction), hourly rates ($75/$49)</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-semibold">Tools</td><td className="border border-gray-300 px-4 py-2">Manual triggers: Daily Summary, Reminders, Backup, Send Test Emails (all 15 templates)</td></tr>
                </tbody>
              </table>
              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Recent Additions</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li><strong>Booking Search:</strong> Full-text search on bookings page (client name, phone, address, cleaner name)</li>
                <li><strong>Booking Edit Modal:</strong> Edit all fields - date, time, hours, service type, rate, status, payment, cleaner, notes</li>
                <li><strong>SMS Consent:</strong> CTIA-compliant checkbox on booking form for Telnyx verification</li>
                <li><strong>Spam Notice:</strong> Check spam/junk notice on booking confirmation, referral signup, and client portal verification</li>
                <li><strong>Page Titles:</strong> All 20 pages have browser tab titles</li>
                <li><strong>Payment Methods:</strong> Zelle, Apple Pay (Cash removed)</li>
              </ul>
            </div>
          )}
`;

// Insert before the env section
newFile = newFile.replace(
  "{activeSection === 'env' && (",
  notificationsSection + "\n          {activeSection === 'env' && ("
);

// Update page title
newFile = newFile.replace(
  "document.title = 'Documentation | The NYC Maid'",
  "document.title = 'Documentation | The NYC Maid'"
);

// Add subtitle with /api/docs reference
newFile = newFile.replace(
  '<h1 className="text-2xl font-bold text-black mb-6">Platform Documentation</h1>',
  '<h1 className="text-2xl font-bold text-black mb-1">Platform Documentation</h1>\n        <p className="text-sm text-gray-500 mb-6">Last updated: Feb 5, 2026 &bull; Machine-readable: <code className="bg-gray-100 px-1 rounded">/api/docs</code></p>'
);

// Add /api/docs to the troubleshooting debug commands
newFile = newFile.replace(
  "# Check build errors\nnpm run build 2>&1 | head -50",
  "# Check build errors\nnpm run build 2>&1 | head -50\n\n# Read platform docs as JSON\ncurl https://www.nycmaid.nyc/api/docs | jq ."
);

// Add emails going to spam troubleshooting
newFile = newFile.replace(
  "{activeSection === 'troubleshooting' && (\n            <div>\n              <h1 className=\"text-2xl font-bold text-black mb-6\">Troubleshooting</h1>",
  `{activeSection === 'troubleshooting' && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-6">Troubleshooting</h1>
              
              <h2 className="text-xl font-semibold text-black mt-6 mb-3">Emails Going to Spam</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-gray-700"><strong>Cause:</strong> New sending domain reputation (domain started on Resend Feb 2026)</p>
                <p className="text-gray-700"><strong>Status:</strong> DKIM/SPF/DMARC verified. Reply-to mismatch removed. Reputation improves naturally over 1-2 weeks with real customer emails.</p>
              </div>`
);

// Add test-emails and docs to the API section
newFile = newFile.replace(
  `<tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/send-booking-emails</td><td className="border border-gray-300 px-4 py-2">POST</td><td className="border border-gray-300 px-4 py-2">Send confirmation emails</td></tr>
                </tbody>`,
  `<tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/send-booking-emails</td><td className="border border-gray-300 px-4 py-2">POST</td><td className="border border-gray-300 px-4 py-2">Send confirmation/assignment emails</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/test-emails</td><td className="border border-gray-300 px-4 py-2">POST</td><td className="border border-gray-300 px-4 py-2">Send all 15 test templates to admin</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">/api/docs</td><td className="border border-gray-300 px-4 py-2">GET</td><td className="border border-gray-300 px-4 py-2">JSON documentation (public, for AI agents)</td></tr>
                </tbody>`
);

// Update page count from 19 to 20
newFile = newFile.replace('Pages (19 Total)', 'Pages (20 Total)');
newFile = newFile.replace("Pages (19)'", "Pages (20)'");

// Add settings page to Admin Dashboard pages table
newFile = newFile.replace(
  `<tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">dashboard/docs/page.tsx</td><td className="border border-gray-300 px-4 py-2">/dashboard/docs</td><td className="border border-gray-300 px-4 py-2">This documentation</td></tr>`,
  `<tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">dashboard/settings/page.tsx</td><td className="border border-gray-300 px-4 py-2">/dashboard/settings</td><td className="border border-gray-300 px-4 py-2">4 tabs: General, Emails, Services, Tools</td></tr>
                  <tr><td className="border border-gray-300 px-4 py-2 font-mono text-xs">dashboard/docs/page.tsx</td><td className="border border-gray-300 px-4 py-2">/dashboard/docs</td><td className="border border-gray-300 px-4 py-2">This documentation</td></tr>`
);

// Update admin pages count
newFile = newFile.replace('Admin Dashboard (9 pages)', 'Admin Dashboard (10 pages)');

// Clean up any double blank lines
newFile = newFile.replace(/\n{3,}/g, '\n\n');

fs.writeFileSync('src/app/dashboard/docs/page.tsx', newFile);
console.log('Generated! Lines:', newFile.split('\n').length);
