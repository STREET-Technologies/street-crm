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
    { key: 'linkedin', label: 'LinkedIn' }, { key: 'contact_email', label: 'Email' },
    { key: 'decision_maker', label: 'Decision-Maker' }, { key: 'commercial_contact', label: 'Commercial Contact' },
    { key: 'area', label: 'Area' },
    { key: 'notes', label: 'Notes' }, { key: 'robots_txt', label: 'Robots.txt' },
  ]

  if ((data as any).error) {
    return (
      <div className="bg-[#111111] border border-red-500/20 rounded-xl p-5">
        <p className="text-sm font-medium text-white mb-1">{(data as any).retailer}</p>
        <p className="text-xs text-red-400">{(data as any).error}</p>
      </div>
    )
  }

  return (
    <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 space-y-2.5">
      {fields.map(({ key, label }) => (
        <div key={key} className="flex gap-4 items-center">
          <span className="text-xs text-[#6b7280] w-28 shrink-0 tracking-wide">{label}</span>
          <input
            className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#CDFF00] transition-colors duration-200"
            value={form[key] as string || ''}
            onChange={e => update(key, e.target.value)}
          />
        </div>
      ))}
      <div className="flex gap-2 pt-3 border-t border-[#2a2a2a] mt-3">
        {!saved ? (
          <>
            <button
              onClick={save}
              disabled={saving}
              className="bg-[#CDFF00] text-black px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-[#b8e600] disabled:opacity-40 transition-colors duration-200 cursor-pointer"
            >
              {saving ? 'Saving…' : 'Save to DB'}
            </button>
            <button
              onClick={onDiscard}
              className="border border-[#2a2a2a] text-[#6b7280] px-4 py-1.5 rounded-lg text-sm hover:border-[#4b5563] hover:text-white transition-colors duration-200 cursor-pointer"
            >
              Discard
            </button>
          </>
        ) : (
          <span className="text-[#CDFF00] text-sm font-medium">✓ Saved</span>
        )}
      </div>
    </div>
  )
}
