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
  commercial_contact: string
  notes: string
  robots_txt: string
  area: string
  last_researched_at?: string
}

// Idempotent schema check — adds commercial_contact column on first call per cold start
let schemaEnsured = false
async function ensureSchema() {
  if (schemaEnsured) return
  try {
    await sql`ALTER TABLE retailers ADD COLUMN IF NOT EXISTS commercial_contact TEXT DEFAULT ''`
    schemaEnsured = true
  } catch { /* best effort — table may not exist yet on first setup */ }
}

export async function upsertRetailer(r: Retailer) {
  await ensureSchema()
  return sql`
    INSERT INTO retailers (retailer, category, shopify, website, linkedin, contact_email, decision_maker, commercial_contact, notes, robots_txt, area, last_researched_at)
    VALUES (${r.retailer}, ${r.category}, ${r.shopify}, ${r.website}, ${r.linkedin}, ${r.contact_email}, ${r.decision_maker}, ${r.commercial_contact ?? ''}, ${r.notes}, ${r.robots_txt}, ${r.area}, NOW())
    ON CONFLICT (retailer, area) DO UPDATE SET
      category = EXCLUDED.category,
      shopify = EXCLUDED.shopify,
      website = EXCLUDED.website,
      linkedin = EXCLUDED.linkedin,
      contact_email = EXCLUDED.contact_email,
      decision_maker = EXCLUDED.decision_maker,
      commercial_contact = EXCLUDED.commercial_contact,
      notes = EXCLUDED.notes,
      robots_txt = EXCLUDED.robots_txt,
      last_researched_at = NOW()
    RETURNING *
  `
}

export async function getAllRetailers() {
  await ensureSchema()
  return sql<Retailer>`SELECT * FROM retailers ORDER BY created_at DESC`
}

export async function deleteRetailer(id: number) {
  return sql`DELETE FROM retailers WHERE id = ${id}`
}
