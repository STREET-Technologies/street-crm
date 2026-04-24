import { NextRequest, NextResponse } from 'next/server'
import { upsertRetailer, getAllRetailers, deleteRetailer } from '@/lib/db'

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

export async function DELETE(req: NextRequest) {
  const cookie = req.cookies.get('auth')
  if (cookie?.value !== process.env.SITE_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = Number(req.nextUrl.searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await deleteRetailer(id)
  return NextResponse.json({ ok: true })
}
