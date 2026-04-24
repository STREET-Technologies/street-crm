import { sql } from '@vercel/postgres'

export type Retailer = {
  id?: number
  retailer: string
  category: string
  shopify: string
  website: string
  linkedin: string
  contact_email: string
  decision_maker: string
  notes: string
  robots_txt: string
  area: string
  last_researched_at?: string
}

export async function upsertRetailer(r: Retailer) {
  return sql`
    INSERT INTO retailers (retailer, category, shopify, website, linkedin, contact_email, decision_maker, notes, robots_txt, area, last_researched_at)
    VALUES (${r.retailer}, ${r.category}, ${r.shopify}, ${r.website}, ${r.linkedin}, ${r.contact_email}, ${r.decision_maker}, ${r.notes}, ${r.robots_txt}, ${r.area}, NOW())
    ON CONFLICT (retailer, area) DO UPDATE SET
      category = EXCLUDED.category,
      shopify = EXCLUDED.shopify,
      website = EXCLUDED.website,
      linkedin = EXCLUDED.linkedin,
      contact_email = EXCLUDED.contact_email,
      decision_maker = EXCLUDED.decision_maker,
      notes = EXCLUDED.notes,
      robots_txt = EXCLUDED.robots_txt,
      last_researched_at = NOW()
    RETURNING *
  `
}

export async function getAllRetailers() {
  return sql<Retailer>`SELECT * FROM retailers ORDER BY created_at DESC`
}
