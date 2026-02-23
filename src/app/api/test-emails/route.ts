import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { protectAdminAPI } from '@/lib/auth'
import {
  clientConfirmationEmail,
  clientReminderEmail,
  clientCancellationEmail,
  cleanerAssignmentEmail,
  cleanerDailySummaryEmail,
  cleanerCancellationEmail,
  referralWelcomeEmail,
  referralCommissionEmail,
  newReferrerAdminEmail,
  newBookingAdminEmail,
  backupEmail,
  cleanerWelcomeEmail,
  verificationCodeEmail
} from '@/lib/email-templates'

const ADMIN_EMAIL = 'hi@thenycmaid.com'

export async function POST() {
  const authError = await protectAdminAPI()
  if (authError) return authError

  const sampleBooking = {
    id: 'test-123',
    start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    service_type: 'Standard Cleaning',
    price: 22500,
    hourly_rate: 75,
    recurring_type: 'Every Tuesday',
    notes: 'Doorman building, call when arriving.',
    ref_code: 'JOHN123',
    clients: {
      name: 'Sarah Johnson',
      email: 'test@example.com',
      phone: '(212) 555-1234',
      address: '123 West 72nd Street, Apt 4B, New York, NY 10023'
    },
    cleaners: {
      name: 'Maria Garcia',
      email: 'cleaner@example.com'
    }
  }

  const sampleReferrer = {
    name: 'John Smith',
    email: 'referrer@example.com',
    phone: '(917) 555-9876',
    ref_code: 'JOHN123',
    preferred_payout: 'zelle',
    zelle_email: 'john@zelle.com',
    total_earned: 15000,
    total_paid: 5000
  }

  const sampleCleaner = {
    name: 'Maria Garcia',
    email: 'cleaner@example.com',
    phone: '(646) 555-4321',
    pin: '4321'
  }

  const results: Array<{name: string, success: boolean, error?: string}> = []

  const templates = [
    { name: '1. Client Confirmation', fn: () => clientConfirmationEmail(sampleBooking) },
    { name: '2. Client Reminder', fn: () => clientReminderEmail(sampleBooking, 'tomorrow') },
    { name: '3. Client Cancellation', fn: () => clientCancellationEmail(sampleBooking) },
    { name: '4. Cleaner Assignment', fn: () => cleanerAssignmentEmail(sampleBooking) },
    { name: '5. Cleaner Daily Summary', fn: () => cleanerDailySummaryEmail('Maria Garcia', [sampleBooking]) },
    { name: '6. Cleaner Cancellation', fn: () => cleanerCancellationEmail(sampleBooking) },
    { name: '7. Cleaner Welcome', fn: () => cleanerWelcomeEmail(sampleCleaner) },
    { name: '8. Referral Welcome', fn: () => referralWelcomeEmail(sampleReferrer) },
    { name: '9. Referral Commission', fn: () => referralCommissionEmail(sampleReferrer, sampleBooking, 2250) },
    { name: '10. Admin New Referrer', fn: () => newReferrerAdminEmail(sampleReferrer) },
    { name: '11. Admin New Booking', fn: () => newBookingAdminEmail(sampleBooking) },
    { name: '12. Admin Backup', fn: () => backupEmail(208, 156) },
    { name: '13. Verification Code', fn: () => verificationCodeEmail('847291', 'Sarah Johnson') },
  ]

  for (const template of templates) {
    try {
      const email = template.fn()
      const result = await sendEmail(ADMIN_EMAIL, '[TEST] ' + template.name + ': ' + email.subject, email.html)
      results.push({ name: template.name, success: result.success })
    } catch (err: any) {
      results.push({ name: template.name, success: false, error: err.message || String(err) })
    }
    await new Promise(r => setTimeout(r, 300))
  }

  return NextResponse.json({ message: 'Sent ' + results.filter(r => r.success).length + ' of ' + templates.length + ' test emails', results })
}
