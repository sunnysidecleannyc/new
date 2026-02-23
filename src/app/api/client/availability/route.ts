import { NextResponse } from 'next/server'
import { checkAvailability } from '@/lib/availability'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  if (!date) {
    return NextResponse.json({ error: 'Missing date' }, { status: 400 })
  }

  const result = await checkAvailability(date)
  return NextResponse.json(result)
}
