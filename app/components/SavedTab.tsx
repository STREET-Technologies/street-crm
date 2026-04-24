'use client'
import { useEffect, useState } from 'react'

type Retailer = {
  id: number
  retailer: string
  category: string
  shopify: string
  area: string
  website: string
  decision_maker: string
  contact_email: string
  last_researched_at: string
}

export default function SavedTab() {
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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

  function shopifyBadge(shopify: string) {
    if (shopify === 'Yes') return 'bg-[#CDFF00]/10 text-[#CDFF00] border-[#CDFF00]/20'
    if (shopify === 'No') return 'bg-red-500/10 text-red-400 border-red-500/20'
    return 'bg-[#2a2a2a] text-[#6b7280] border-[#2a2a2a]'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          className="flex-1 bg-[#111111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#CDFF00] transition-colors duration-200"
          placeholder="Filter by name, area, category, Shopify status…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          onClick={load}
          className="text-xs text-[#6b7280] border border-[#2a2a2a] px-3 py-2 rounded-lg hover:border-[#4b5563] hover:text-white transition-colors duration-200 cursor-pointer shrink-0"
        >
          Refresh
        </button>
        <span className="text-xs text-[#4b5563] shrink-0">{filtered.length} retailers</span>
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
                {['Retailer', 'Category', 'Area', 'Shopify', 'Website', 'Decision-Maker'].map(h => (
                  <th key={h} className="text-left text-xs text-[#4b5563] font-medium px-4 py-3 tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} className={`border-b border-[#1a1a1a] hover:bg-[#161616] transition-colors duration-150 ${i === filtered.length - 1 ? 'border-b-0' : ''}`}>
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
                        className="text-[#6b7280] hover:text-[#CDFF00] truncate block transition-colors duration-150"
                        title={r.website}>
                        {r.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : <span className="text-[#4b5563]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[#6b7280] max-w-[180px] truncate" title={r.decision_maker}>
                    {r.decision_maker ? r.decision_maker.split('—')[0].trim() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
