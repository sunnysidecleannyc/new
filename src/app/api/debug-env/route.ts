import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasTelnyxKey: !!process.env.TELNYX_API_KEY,
    telnyxKeyPrefix: process.env.TELNYX_API_KEY?.slice(0, 6) || 'NOT SET',
    telnyxFrom: process.env.TELNYX_FROM_NUMBER || 'NOT SET',
    hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasAdminPhone: !!process.env.ADMIN_PHONE,
    nodeEnv: process.env.NODE_ENV,
  })
}
