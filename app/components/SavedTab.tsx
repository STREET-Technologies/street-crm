'use client'
import { useEffect, useState } from 'react'
import RetailerDetailModal from './RetailerDetailModal'

export type Retailer = {
  id: number
  retailer: string
  category: string
  shopify: string
  area: string
  website: string
  linkedin: string
  contact_email: string
  decision_maker: string
  notes: string
  robots_txt: string
  last_researched_at: string
}

const CSV_HEADERS = ['Retailer', 'Category', 'Shopify', 'Website', 'LinkedIn', 'Contact Email', 'Decision-Maker (Name + LinkedIn)', 'Notes', 'Robots.txt', 'Area']

function csvEscape(v: string | undefined) {
  const s = v ?? ''
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function buildCsv(rows: Retailer[]) {
  const lines = [CSV_HEADERS.join(',')]
  for (const r of rows) {
    lines.push([
      r.retailer, r.category, r.shopify, r.website, r.linkedin,
      r.contact_email, r.decision_maker, r.notes, r.robots_txt, r.area,
    ].map(csvEscape).join(','))
  }
  return lines.join('\n')
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function SavedTab() {
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Retailer | null>(null)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [deleting, setDeleting] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/retailers')
    if (res.ok) setRetailers(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = retailers.filter(r =>
    !search || [r.retailer, r.category, r.area, r.shopify].some(v =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  )

  function toggle(id: number) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    const allFilteredSelected = filtered.every(r => checked.has(r.id))
    setChecked(prev => {
      const next = new Set(prev)
      if (allFilteredSelected) filtered.forEach(r => next.delete(r.id))
      else filtered.forEach(r => next.add(r.id))
      return next
    })
  }

  async function handleDelete(r: Retailer, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Delete "${r.retailer}"? This cannot be undone.`)) return
    setDeleting(r.id)
    const res = await fetch(`/api/retailers?id=${r.id}`, { method: 'DELETE' })
    if (res.ok) {
      setRetailers(prev => prev.filter(x => x.id !== r.id))
      setChecked(prev => { const next = new Set(prev); next.delete(r.id); return next })
    }
    setDeleting(null)
  }

  function exportSelected() {
    const toExport = checked.size > 0
      ? retailers.filter(r => checked.has(r.id))
      : filtered
    const csv = buildCsv(toExport)
    const date = new Date().toISOString().split('T')[0]
    const label = checked.size > 0 ? `selected-${checked.size}` : `all-${toExport.length}`
    downloadCsv(csv, `street-retailers-${label}-${date}.csv`)
  }

  function shopifyBadge(shopify: string) {
    if (shopify === 'Yes') return 'bg-[#CDFF00]/10 text-[#CDFF00] border-[#CDFF00]/20'
    if (shopify === 'No') return 'bg-red-500/10 text-red-400 border-red-500/20'
    return 'bg-[#2a2a2a] text-[#6b7280] border-[#2a2a2a]'
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every(r => checked.has(r.id))
  const someFilteredSelected = filtered.some(r => checked.has(r.id)) && !allFilteredSelected

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <input
            className="flex-1 min-w-[200px] bg-[#111111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#CDFF00] transition-colors duration-200"
            placeholder="Filter by name, area, category, Shopify status…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            onClick={exportSelected}
            disabled={filtered.length === 0}
            className="text-xs bg-[#CDFF00] text-black px-3 py-2 rounded-lg font-semibold hover:bg-[#b8e600] disabled:opacity-40 transition-colors duration-200 cursor-pointer shrink-0"
          >
            Export {checked.size > 0 ? `${checked.size} selected` : 'all'} CSV
          </button>
          <button
            onClick={load}
            className="text-xs text-[#6b7280] border border-[#2a2a2a] px-3 py-2 rounded-lg hover:border-[#4b5563] hover:text-white transition-colors duration-200 cursor-pointer shrink-0"
          >
            Refresh
          </button>
          <span className="text-xs text-[#4b5563] shrink-0">
            {checked.size > 0 ? `${checked.size} selected · ` : ''}{filtered.length} retailers
          </span>
        </div>

        {loading ? (
          <div className="text-[#4b5563] text-sm py-12 text-center">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-[#4b5563] text-sm py-12 text-center">
            {search ? 'No matches.' : 'No retailers saved yet.'}
          </div>
        ) : (
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      ref={el => { if (el) el.indeterminate = someFilteredSelected }}
                      onChange={toggleAll}
                      className="accent-[#CDFF00] cursor-pointer"
                      onClick={e => e.stopPropagation()}
                    />
                  </th>
                  {['Retailer', 'Category', 'Area', 'Shopify', 'Website', 'Decision-Maker'].map(h => (
                    <th key={h} className="text-left text-xs text-[#4b5563] font-medium px-4 py-3 tracking-wide">{h}</th>
                  ))}
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className={`border-b border-[#1a1a1a] hover:bg-[#161616] transition-colors duration-150 cursor-pointer ${i === filtered.length - 1 ? 'border-b-0' : ''} ${checked.has(r.id) ? 'bg-[#CDFF00]/5' : ''}`}
                  >
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checked.has(r.id)}
                        onChange={() => toggle(r.id)}
                        className="accent-[#CDFF00] cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{r.retailer}</td>
                    <td className="px-4 py-3 text-[#6b7280]">{r.category || '—'}</td>
                    <td className="px-4 py-3 text-[#6b7280]">{r.area || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded border ${shopifyBadge(r.shopify)}`}>
                        {r.shopify || '?'}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      {r.website ? (
                        <a href={r.website} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-[#6b7280] hover:text-[#CDFF00] truncate block transition-colors duration-150"
                          title={r.website}>
                          {r.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : <span className="text-[#4b5563]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[#6b7280] max-w-[180px] truncate" title={r.decision_maker}>
                      {r.decision_maker ? r.decision_maker.split('—')[0].trim() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={e => handleDelete(r, e)}
                        disabled={deleting === r.id}
                        title="Delete retailer"
                        className="text-[#4b5563] hover:text-red-400 disabled:opacity-40 transition-colors duration-150 cursor-pointer text-base leading-none"
                      >
                        {deleting === r.id ? '…' : '×'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <RetailerDetailModal retailer={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
