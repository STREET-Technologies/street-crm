import { NextRequest, NextResponse } from 'next/server'
import { researchRetailer, ResearchInput } from '@/lib/research'

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get('auth')
  if (cookie?.value !== process.env.SITE_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { retailers } = await req.json() as { retailers: ResearchInput[] }
  if (!retailers?.length) return NextResponse.json({ error: 'retailers array required' }, { status: 400 })

  const results = await Promise.allSettled(
    retailers.map(r => researchRetailer(r))
  )

  return NextResponse.json(
    results.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : { retailer: retailers[i].name, error: r.reason?.message || 'Research failed' }
    )
  )
}
