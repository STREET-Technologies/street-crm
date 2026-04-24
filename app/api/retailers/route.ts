import { NextRequest, NextResponse } from 'next/server'
import { upsertRetailer, getAllRetailers } from '@/lib/db'

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('auth')
  if (cookie?.value !== process.env.SITE_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { rows } = await getAllRetailers()
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get('auth')
  if (cookie?.value !== process.env.SITE_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const retailer = await req.json()
  const { rows } = await upsertRetailer(retailer)
  return NextResponse.json(rows[0])
}
