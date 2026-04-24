CREATE TABLE IF NOT EXISTS retailers (
  id SERIAL PRIMARY KEY,
  retailer TEXT NOT NULL,
  category TEXT,
  shopify TEXT,
  website TEXT,
  linkedin TEXT,
  contact_email TEXT,
  decision_maker TEXT,
  notes TEXT,
  robots_txt TEXT,
  area TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_researched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS retailers_name_area_idx ON retailers (retailer, area);
