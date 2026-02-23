import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectAdminAPI } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { sendSMS } from '@/lib/sms'
import { smsNewApplication } from '@/lib/sms-templates'


// Rate limiting: 3 applications per 10 minutes per IP
const rateLimits = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimits.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 })
    return false
  }
  entry.count++
  return entry.count > 3
}

// GET - List all applications (admin only)
export async function GET() {
  const authError = await protectAdminAPI()
  if (authError) return authError

  const { data, error } = await supabaseAdmin
    .from('cleaner_applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// POST - Submit new application (public)
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many submissions. Try again later.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { name, email, phone, address, unit, experience, availability, notes, photo_url } = body

    if (!name || !phone || !address || !photo_url) {
      return NextResponse.json({ error: 'Name, phone, address, and photo are required' }, { status: 400 })
    }

    const fullAddress = unit ? `${address}, ${unit}` : address

    // Check for duplicate by phone
    const cleanPhone = phone.replace(/\D/g, '')
    const { data: existing } = await supabaseAdmin
      .from('cleaner_applications')
      .select('id')
      .eq('phone', cleanPhone)
      .eq('status', 'pending')
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'You already have a pending application' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('cleaner_applications')
      .insert({
        name,
        email: email || null,
        phone: cleanPhone,
        address: fullAddress,
        experience: experience || null,
        availability: availability || null,
        notes: notes || null,
        photo_url: photo_url || null,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    // Notify admin
    await supabaseAdmin.from('notifications').insert({
      type: 'cleaner_application',
      title: 'New Cleaner Application',
      message: `${name} applied to join the team`
    })

    // Email admin
    if (process.env.ADMIN_EMAIL) {
      const html = `
        <div style="font-family: sans-serif; max-width: 500px;">
          <h2 style="color: #000;">New Cleaner Application</h2>
          ${photo_url ? `<div style="margin: 16px 0;"><img src="${photo_url}" alt="${name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #eee;" /></div>` : ''}
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Email:</strong> ${email || 'Not provided'}</p>
          <p><strong>Address:</strong> ${fullAddress}</p>
          <p><strong>Experience:</strong> ${experience || 'Not provided'}</p>
          <p><strong>Availability:</strong> ${availability || 'Not provided'}</p>
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
          <p style="margin-top: 20px;"><a href="https://www.thenycmaid.com/admin/cleaners" style="color: #2563eb;">Review in Dashboard →</a></p>
        </div>
      `
      await sendEmail(process.env.ADMIN_EMAIL, `New Cleaner Application: ${name}`, html)
    }

    // No admin SMS — notifications via email + dashboard only

    // Email applicant confirmation
    if (email) {
      const applicantHtml = `
        <div style="font-family: sans-serif; max-width: 500px;">
          <h2 style="color: #000;">Application Received! / ¡Solicitud Recibida!</h2>
          <p>Hi ${name.split(' ')[0]},</p>
          <p>Thanks for applying to join The NYC Maid team! We've received your application and will review it shortly.</p>
          <p>Gracias por solicitar unirse al equipo de The NYC Maid. Hemos recibido su solicitud y la revisaremos pronto.</p>
          <p style="margin-top: 20px; color: #666;">Questions? / ¿Preguntas?<br><a href="tel:2122028400" style="color: #000;">(212) 202-8400</a></p>
        </div>
      `
      await sendEmail(email, 'Application Received / Solicitud Recibida – The NYC Maid', applicantHtml)
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    console.error('Cleaner application error:', err)
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
  }
}

// PUT - Update application status (admin only)
export async function PUT(request: Request) {
  const authError = await protectAdminAPI()
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('cleaner_applications')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error('Application update error:', err)
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
  }
}

// DELETE - Delete application (admin only)
export async function DELETE(request: Request) {
  const authError = await protectAdminAPI()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('cleaner_applications')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Application delete error:', err)
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 })
  }
}
