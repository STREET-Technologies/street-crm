import { NextRequest, NextResponse } from 'next/server'
import { getAllRetailers, Retailer } from '@/lib/db'

const HEADERS = ['Retailer','Category','Shopify','Website','LinkedIn','Contact Email','Decision-Maker (Name + LinkedIn)','Notes','Robots.txt','Area']

function toCSVRow(r: Retailer): string {
  const fields = [r.retailer, r.category, r.shopify, r.website, r.linkedin, r.contact_email, r.decision_maker, r.notes, r.robots_txt, r.area]
  return fields.map(f => `"${(f || '').replace(/"/g, '""')}"`).join(',')
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('auth')
  if (cookie?.value !== process.env.SITE_PASSWORD) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  const { rows } = await getAllRetailers()
  const csv = [HEADERS.join(','), ...rows.map(toCSVRow)].join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="retailers.csv"',
    },
  })
}
