'use client'
import { useState } from 'react'
import { Retailer } from '@/lib/db'

type Props = { data: Partial<Retailer>; onSave?: () => void; onDiscard?: () => void }

export default function RetailerCard({ data, onSave, onDiscard }: Props) {
  const [form, setForm] = useState<Partial<Retailer>>(data)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function update(field: keyof Retailer, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function save() {
    setSaving(true)
    await fetch('/api/retailers', { method: 'POST', body: JSON.stringify(form), headers: { 'Content-Type': 'application/json' } })
    setSaving(false)
    setSaved(true)
    onSave?.()
  }

  const fields: { key: keyof Retailer; label: string }[] = [
    { key: 'retailer', label: 'Retailer' }, { key: 'category', label: 'Category' },
    { key: 'shopify', label: 'Shopify' }, { key: 'website', label: 'Website' },
    { key: 'linkedin', label: 'LinkedIn' }, { key: 'contact_email', label: 'Contact Email' },
    { key: 'decision_maker', label: 'Decision-Maker' }, { key: 'area', label: 'Area' },
    { key: 'notes', label: 'Notes' }, { key: 'robots_txt', label: 'Robots.txt' },
  ]

  return (
    <div className="bg-white rounded-xl border p-6 space-y-3">
      {fields.map(({ key, label }) => (
        <div key={key} className="flex gap-3 items-start">
          <span className="text-xs text-gray-500 w-32 pt-2 shrink-0">{label}</span>
          <input
            className="flex-1 border rounded px-2 py-1 text-sm"
            value={form[key] as string || ''}
            onChange={e => update(key, e.target.value)}
          />
        </div>
      ))}
      <div className="flex gap-2 pt-2">
        {!saved ? (
          <>
            <button onClick={save} disabled={saving} className="bg-black text-white px-4 py-1.5 rounded text-sm">
              {saving ? 'Saving…' : 'Save to DB'}
            </button>
            <button onClick={onDiscard} className="border px-4 py-1.5 rounded text-sm text-gray-600">Discard</button>
          </>
        ) : (
          <span className="text-green-600 text-sm font-medium">✓ Saved</span>
        )}
      </div>
    </div>
  )
}
