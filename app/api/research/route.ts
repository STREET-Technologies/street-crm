import { NextRequest, NextResponse } from 'next/server'
import { researchRetailer } from '@/lib/research'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get('auth')
  if (cookie?.value !== process.env.SITE_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, website, area } = await req.json()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  try {
    const result = await researchRetailer({ name, website, area })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
