import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'
import { backupEmail } from '@/lib/email-templates'
import { protectCronAPI } from '@/lib/auth'
import { trackError } from '@/lib/error-tracking'

export async function GET(request: Request) {
  // Protect cron route
  const authError = protectCronAPI(request)
  if (authError) return authError

  try {
  const { data: clients } = await supabaseAdmin.from('clients').select('*').order('name', { ascending: true })
  
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  
  const { data: bookings } = await supabaseAdmin
    .from('bookings')
    .select('*, clients(name, email, phone, address), cleaners(name)')
    .gte('start_time', sixMonthsAgo.toISOString())
    .order('start_time', { ascending: false })
  
  const esc = (s: string) => (s || '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ')
  const clientsCsv = ['Name,Email,Phone,Address,Notes,Created',
    ...(clients || []).map(c => `"${esc(c.name)}","${esc(c.email)}","${esc(c.phone)}","${esc(c.address)}","${esc(c.notes)}","${c.created_at}"`)
  ].join('\n')
  
  const bookingsCsv = ['Date,Time,Client,Email,Phone,Address,Cleaner,Service,Price,Status,Payment,Method,Notes',
    ...(bookings || []).map(b => {
      const date = new Date(b.start_time).toLocaleDateString()
      const time = new Date(b.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      return `"${date}","${time}","${esc(b.clients?.name)}","${esc(b.clients?.email)}","${esc(b.clients?.phone)}","${esc(b.clients?.address)}","${esc(b.cleaners?.name)}","${esc(b.service_type)}","$${(b.price/100).toFixed(2)}","${b.status}","${b.payment_status}","${b.payment_method || ''}","${esc(b.notes)}"`
    })
  ].join('\n')
  
  const email = backupEmail(clients?.length || 0, bookings?.length || 0)
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    return NextResponse.json({ error: 'ADMIN_EMAIL not configured' }, { status: 500 })
  }
  
  await sendEmail(adminEmail, email.subject, email.html, [
    { filename: `clients-${new Date().toISOString().split('T')[0]}.csv`, content: Buffer.from(clientsCsv).toString('base64') },
    { filename: `bookings-${new Date().toISOString().split('T')[0]}.csv`, content: Buffer.from(bookingsCsv).toString('base64') }
  ])
  
  return NextResponse.json({ success: true, clients: clients?.length || 0, bookings: bookings?.length || 0 })
  } catch (err) {
    await trackError(err, { source: 'cron/backup', severity: 'critical' })
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
