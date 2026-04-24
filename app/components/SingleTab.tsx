'use client'
import { useState } from 'react'
import RetailerCard from './RetailerCard'

export default function SingleTab() {
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [area, setArea] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  async function research() {
    setLoading(true); setError(''); setResult(null)
    const res = await fetch('/api/research', {
      method: 'POST',
      body: JSON.stringify({ name, website, area }),
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Research failed')
    else setResult(data)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-3 sm:col-span-1">
            <label className="text-xs text-gray-500 block mb-1">Retailer name *</label>
            <input className="w-full border rounded px-3 py-2 text-sm" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jaadu Boutique" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Website hint</label>
            <input className="w-full border rounded px-3 py-2 text-sm" value={website} onChange={e => setWebsite(e.target.value)} placeholder="optional" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Area</label>
            <input className="w-full border rounded px-3 py-2 text-sm" value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. Brixton" />
          </div>
        </div>
        <button onClick={research} disabled={!name || loading} className="bg-black text-white px-5 py-2 rounded text-sm disabled:opacity-40">
          {loading ? 'Researching…' : 'Research →'}
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      {result && <RetailerCard data={result} onDiscard={() => setResult(null)} />}
    </div>
  )
}
