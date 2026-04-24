'use client'
import { useEffect, useRef, useState } from 'react'
import RetailerCard from './RetailerCard'
import RetailerDetailModal from './RetailerDetailModal'
import type { Retailer } from './SavedTab'

export default function SingleTab() {
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [area, setArea] = useState('')
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [duplicate, setDuplicate] = useState<Retailer | null>(null)
  const [viewingDuplicate, setViewingDuplicate] = useState(false)
  const [savedRetailers, setSavedRetailers] = useState<Retailer[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load saved retailers once for duplicate checking
  useEffect(() => {
    fetch('/api/retailers').then(r => r.ok ? r.json() : []).then(setSavedRetailers)
  }, [])

  // Debounced duplicate check on name change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setDuplicate(null)
    if (name.trim().length < 3) return
    debounceRef.current = setTimeout(() => {
      const match = savedRetailers.find(r =>
        r.retailer.toLowerCase() === name.trim().toLowerCase()
      )
      setDuplicate(match ?? null)
    }, 400)
  }, [name, savedRetailers])

  async function research() {
    setLoading(true); setError(''); setResult(null); setElapsed(0)
    const timer = setInterval(() => setElapsed(s => s + 1), 1000)
    const res = await fetch('/api/research', {
      method: 'POST',
      body: JSON.stringify({ name, website, area }),
      headers: { 'Content-Type': 'application/json' },
    })
    clearInterval(timer)
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Research failed')
    else {
      setResult(data)
      // Refresh saved list so duplicate check stays current
      fetch('/api/retailers').then(r => r.ok ? r.json() : []).then(setSavedRetailers)
    }
    setLoading(false)
  }

  const inputClass = "w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#CDFF00] transition-colors duration-200"

  const lastResearched = duplicate?.last_researched_at
    ? new Date(duplicate.last_researched_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <>
      <div className="space-y-4">
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1">
              <label className="text-xs text-[#6b7280] block mb-1.5 tracking-wide">Retailer name *</label>
              <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jaadu Boutique" />
            </div>
            <div>
              <label className="text-xs text-[#6b7280] block mb-1.5 tracking-wide">Website *</label>
              <input className={inputClass} value={website} onChange={e => setWebsite(e.target.value)} placeholder="e.g. formse15.com" />
            </div>
            <div>
              <label className="text-xs text-[#6b7280] block mb-1.5 tracking-wide">Area</label>
              <input className={inputClass} value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. Brixton" />
            </div>
          </div>

          {duplicate && (
            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5 text-xs">
              <span className="text-amber-400">
                Already researched{lastResearched ? ` on ${lastResearched}` : ''}.
              </span>
              <button
                onClick={() => setViewingDuplicate(true)}
                className="text-amber-400 underline hover:no-underline cursor-pointer ml-3 shrink-0"
              >
                View saved →
              </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={research}
              disabled={!name || !website || loading}
              className="bg-[#CDFF00] text-black px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#b8e600] disabled:opacity-40 transition-colors duration-200 cursor-pointer"
            >
              {loading ? `Researching… ${elapsed}s` : duplicate ? 'Research again →' : 'Research →'}
            </button>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>

        {result && <RetailerCard data={result} onDiscard={() => setResult(null)} />}
      </div>

      {viewingDuplicate && duplicate && (
        <RetailerDetailModal retailer={duplicate} onClose={() => setViewingDuplicate(false)} />
      )}
    </>
  )
}
