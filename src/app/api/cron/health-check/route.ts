import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'
import { protectCronAPI } from '@/lib/auth'

export async function GET(request: Request) {
  const authError = protectCronAPI(request)
  if (authError) return authError

  const issues: string[] = []

  // 1. Check Supabase connectivity
  try {
    const { error } = await supabaseAdmin.from('notifications').select('id', { count: 'exact', head: true })
    if (error) issues.push(`Supabase query failed: ${error.message}`)
  } catch (e) {
    issues.push(`Supabase unreachable: ${e instanceof Error ? e.message : String(e)}`)
  }

  // 2. Check for recent error notifications (spike detection)
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentErrors, error } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('type', 'error')
      .gte('created_at', oneHourAgo)

    if (!error && recentErrors && recentErrors.length >= 5) {
      issues.push(`Error spike: ${recentErrors.length} errors in the last hour`)
    }
  } catch (e) {
    // Non-critical, skip
  }

  // 3. Check Resend API key exists
  if (!process.env.RESEND_API_KEY) {
    issues.push('RESEND_API_KEY not configured')
  }

  // 4. Check critical env vars
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) issues.push('SUPABASE_URL missing')
  if (!process.env.ADMIN_EMAIL) issues.push('ADMIN_EMAIL missing')
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) issues.push('SUPABASE_SERVICE_ROLE_KEY missing')

  // If issues found, alert admin
  if (issues.length > 0) {
    const html = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 16px 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 16px;">🏥 Health Check Failed</h2>
        </div>
        <div style="background: #fff; border: 1px solid #e5e7eb; border-top: 0; padding: 20px; border-radius: 0 0 8px 8px;">
          <p style="color: #666; font-size: 14px; margin: 0 0 16px 0;">${issues.length} issue${issues.length !== 1 ? 's' : ''} detected:</p>
          ${issues.map(i => `<div style="background: #fef2f2; border-left: 3px solid #dc2626; padding: 10px 14px; margin: 0 0 8px 0; border-radius: 0 4px 4px 0;">
            <p style="color: #991b1b; font-size: 14px; margin: 0;">${i.replace(/</g, '&lt;')}</p>
          </div>`).join('')}
          <p style="color: #999; font-size: 12px; margin: 16px 0 0 0;">
            ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET
          </p>
        </div>
      </div>
    `

    await supabaseAdmin.from('notifications').insert({
      type: 'error',
      title: '🏥 Health Check Failed',
      message: issues.join('; ').slice(0, 200)
    })

    if (process.env.ADMIN_EMAIL) {
      try {
        await sendEmail(process.env.ADMIN_EMAIL, '🏥 Health Check Failed', html)
      } catch (e) {
        console.error('Health check alert email failed:', e)
      }
    }

    return NextResponse.json({ healthy: false, issues })
  }

  return NextResponse.json({ healthy: true })
}
