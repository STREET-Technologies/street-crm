'use client'
import { useState } from 'react'
import RetailerCard from './RetailerCard'

export default function SingleTab() {
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [area, setArea] = useState('')
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

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
    else setResult(data)
    setLoading(false)
  }

  const inputClass = "w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#CDFF00] transition-colors duration-200"

  return (
    <div className="space-y-4">
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-3 sm:col-span-1">
            <label className="text-xs text-[#6b7280] block mb-1.5 tracking-wide">Retailer name *</label>
            <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jaadu Boutique" />
          </div>
          <div>
            <label className="text-xs text-[#6b7280] block mb-1.5 tracking-wide">Website hint</label>
            <input className={inputClass} value={website} onChange={e => setWebsite(e.target.value)} placeholder="optional" />
          </div>
          <div>
            <label className="text-xs text-[#6b7280] block mb-1.5 tracking-wide">Area</label>
            <input className={inputClass} value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. Brixton" />
          </div>
        </div>
        <button
          onClick={research}
          disabled={!name || loading}
          className="bg-[#CDFF00] text-black px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#b8e600] disabled:opacity-40 transition-colors duration-200 cursor-pointer"
        >
          {loading ? `Researching… ${elapsed}s` : 'Research →'}
        </button>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>

      {result && <RetailerCard data={result} onDiscard={() => setResult(null)} />}
    </div>
  )
}
