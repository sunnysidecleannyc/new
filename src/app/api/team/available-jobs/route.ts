import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'

// GET - List available jobs (status = 'available') for cleaners to claim
export async function GET() {
  const { data: jobs } = await supabaseAdmin
    .from('bookings')
    .select('id, start_time, end_time, service_type, notes, cleaner_pay_rate, clients(name, phone, address, notes)')
    .eq('status', 'available')
    .order('start_time', { ascending: true })

  return NextResponse.json(jobs || [])
}

// POST - Cleaner claims an available job
export async function POST(request: Request) {
  const body = await request.json()
  const { job_id, cleaner_id } = body

  if (!job_id || !cleaner_id) {
    return NextResponse.json({ error: 'Missing job_id or cleaner_id' }, { status: 400 })
  }

  // Check if job is still available
  const { data: job } = await supabaseAdmin
    .from('bookings')
    .select('*, clients(*)')
    .eq('id', job_id)
    .eq('status', 'available')
    .single()

  if (!job) {
    return NextResponse.json({ error: 'Job no longer available / Trabajo ya no disponible' }, { status: 400 })
  }

  // Get cleaner info
  const { data: cleaner } = await supabaseAdmin
    .from('cleaners')
    .select('*')
    .eq('id', cleaner_id)
    .single()

  if (!cleaner) {
    return NextResponse.json({ error: 'Cleaner not found' }, { status: 400 })
  }

  // Claim the job - assign cleaner and change status to scheduled
  const { error } = await supabaseAdmin
    .from('bookings')
    .update({
      cleaner_id,
      status: 'scheduled',
      notes: job.notes ? `${job.notes}\n\n[Claimed by ${cleaner.name}]` : `[Claimed by ${cleaner.name}]`
    })
    .eq('id', job_id)
    .eq('status', 'available') // Double check still available

  if (error) {
    return NextResponse.json({ error: 'Failed to claim job' }, { status: 500 })
  }

  // Notify admin
  await supabaseAdmin.from('notifications').insert({
    type: 'job_claimed',
    title: 'Emergency Job Claimed',
    message: `${cleaner.name} claimed ${job.clients?.name} job`
  })

  // Send confirmation email to cleaner
  if (cleaner.email) {
    const jobDate = new Date(job.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    const jobTime = new Date(job.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    const html = `
      <div style="font-family: sans-serif; max-width: 500px;">
        <h2 style="color: #16a34a;">Job Confirmed! / ¡Trabajo Confirmado!</h2>
        <p><strong>Client:</strong> ${job.clients?.name}</p>
        <p><strong>Date:</strong> ${jobDate} at ${jobTime}</p>
        <p><strong>Address:</strong> ${job.clients?.address}</p>
        <p><strong>Pay Rate:</strong> $${job.cleaner_pay_rate || 40}/hr</p>
        <p style="margin-top: 20px;">
          <a href="https://www.thenycmaid.com/team" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View in Portal</a>
        </p>
      </div>
    `
    await sendEmail(cleaner.email, `Job Confirmed: ${job.clients?.name} - ${jobDate}`, html)
  }

  return NextResponse.json({ success: true, message: 'Job claimed successfully / Trabajo reclamado exitosamente' })
}
