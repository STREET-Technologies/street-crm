'use client'
import { useState } from 'react'
import RetailerCard from './RetailerCard'

export default function BatchTab() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  async function researchAll() {
    const lines = input.split('\n').map(l => l.trim()).filter(Boolean)
    const retailers = lines.map(l => {
      const [name, website, area] = l.split(',').map(s => s.trim())
      return { name, website, area }
    })
    setLoading(true); setResults([])
    const res = await fetch('/api/research/batch', {
      method: 'POST',
      body: JSON.stringify({ retailers }),
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    setResults(data)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">
            One retailer per line. Format: <code className="bg-gray-100 px-1 rounded">Name, website (optional), area (optional)</code>
          </label>
          <textarea
            className="w-full border rounded px-3 py-2 text-sm h-36 font-mono"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={"Jaadu Boutique\nMabel, , Dulwich\nForm SE15, formse15.com, Peckham"}
          />
        </div>
        <button onClick={researchAll} disabled={!input.trim() || loading} className="bg-black text-white px-5 py-2 rounded text-sm disabled:opacity-40">
          {loading ? `Researching ${input.split('\n').filter(Boolean).length} retailers…` : 'Research All →'}
        </button>
      </div>

      {results.map((r, i) => (
        <div key={i}>
          <p className="text-xs text-gray-400 mb-1 font-mono">{i + 1} / {results.length}</p>
          <RetailerCard data={r} />
        </div>
      ))}
    </div>
  )
}
