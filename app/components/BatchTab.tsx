'use client'
import { useState } from 'react'
import RetailerCard from './RetailerCard'

export default function BatchTab() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [completed, setCompleted] = useState(0)
  const [total, setTotal] = useState(0)

  function parseLines(raw: string) {
    return raw.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
      const urlMatch = l.match(/https?:\/\/\S+/)
      if (urlMatch) {
        const website = urlMatch[0]
        const rest = l.replace(website, '').replace(/,+/g, ',').replace(/^,|,$/g, '').trim()
        const [name, area] = rest.split(',').map(s => s.trim())
        return { name, website, area }
      }
      const [name, website, area] = l.split(',').map(s => s.trim())
      return { name, website, area }
    })
  }

  async function researchAll() {
    const retailers = parseLines(input)
    setLoading(true)
    setResults([])
    setCompleted(0)
    setTotal(retailers.length)

    const res = await fetch('/api/research/batch', {
      method: 'POST',
      body: JSON.stringify({ retailers }),
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok || !res.body) { setLoading(false); return }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const data = JSON.parse(line.slice(6))
          setResults(prev => [...prev, data])
          setCompleted(prev => prev + 1)
        } catch { /* malformed chunk */ }
      }
    }

    setLoading(false)
  }

  const lineCount = input.split('\n').filter(l => l.trim()).length

  return (
    <div className="space-y-4">
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 space-y-4">
        <div>
          <label className="text-xs text-[#6b7280] block mb-1.5 tracking-wide">
            One per line — name only,{' '}
            <code className="text-[#CDFF00] bg-[#0a0a0a] px-1.5 py-0.5 rounded text-xs">Name https://url</code>
            , or{' '}
            <code className="text-[#CDFF00] bg-[#0a0a0a] px-1.5 py-0.5 rounded text-xs">Name, website, area</code>
          </label>
          <textarea
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4b5563] font-mono h-36 focus:outline-none focus:border-[#CDFF00] transition-colors duration-200 resize-none"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={"Bidhaar\nForm SE15 https://www.formse15.com\nJaadu Boutique, , Dulwich"}
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={researchAll}
            disabled={!input.trim() || loading}
            className="bg-[#CDFF00] text-black px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#b8e600] disabled:opacity-40 transition-colors duration-200 cursor-pointer"
          >
            {loading
              ? `Researching… ${completed}/${total} done`
              : `Research ${lineCount > 0 ? lineCount : ''} ${lineCount === 1 ? 'retailer' : 'retailers'} →`}
          </button>

          {loading && completed > 0 && (
            <div className="flex-1 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#CDFF00] transition-all duration-500"
                style={{ width: `${(completed / total) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {results.map((r, i) => (
        <div key={i}>
          <p className="text-xs text-[#4b5563] mb-2 font-mono tracking-wide">{i + 1} / {total}</p>
          <RetailerCard data={r} />
        </div>
      ))}
    </div>
  )
}
