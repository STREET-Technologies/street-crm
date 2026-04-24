'use client'
import { useEffect, useState } from 'react'
import RetailerCard from './RetailerCard'

type Status = { message: string; done: boolean; error?: boolean; startedAt?: number; finishedAt?: number }

export default function BatchTab() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [statuses, setStatuses] = useState<Record<number, Status>>({})
  const [total, setTotal] = useState(0)
  const [tick, setTick] = useState(0)
  const [validationError, setValidationError] = useState('')

  // Tick every second so the elapsed timers re-render live
  useEffect(() => {
    if (!loading) return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [loading])

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

    // Enforce mandatory website — dramatically improves result quality
    const missing = retailers.filter(r => !r.website).map(r => r.name)
    if (missing.length) {
      setValidationError(`Website is required for all retailers. Missing: ${missing.join(', ')}`)
      return
    }

    setValidationError('')
    setLoading(true)
    setResults([])
    setTotal(retailers.length)

    const now = Date.now()
    const initial: Record<number, Status> = {}
    retailers.forEach((_, i) => { initial[i] = { message: 'Researching…', done: false, startedAt: now } })
    setStatuses(initial)

    await Promise.all(
      retailers.map(async (r, i) => {
        await new Promise(res => setTimeout(res, i * 500))
        setStatuses(prev => ({ ...prev, [i]: { ...prev[i], startedAt: Date.now() } }))
        try {
          const res = await fetch('/api/research', {
            method: 'POST',
            body: JSON.stringify(r),
            headers: { 'Content-Type': 'application/json' },
          })
          const text = await res.text()
          let data: any
          try { data = JSON.parse(text) } catch { throw new Error(`Server error ${res.status}: ${text.slice(0, 120)}`) }
          if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
          setResults(prev => [...prev, data])
          setStatuses(prev => ({ ...prev, [i]: { ...prev[i], message: 'Done', done: true, finishedAt: Date.now() } }))
        } catch (err) {
          const errMsg = String(err)
          setResults(prev => [...prev, { retailer: r.name, error: errMsg }])
          setStatuses(prev => ({ ...prev, [i]: { ...prev[i], message: errMsg, done: true, error: true, finishedAt: Date.now() } }))
        }
      })
    )

    setLoading(false)
  }

  const completed = Object.values(statuses).filter(s => s.done).length
  const lineCount = input.split('\n').filter(l => l.trim()).length
  const parsedRetailers = parseLines(input)

  function elapsed(s?: Status) {
    if (!s?.startedAt) return ''
    const end = s.finishedAt ?? Date.now()
    return `${Math.floor((end - s.startedAt) / 1000)}s`
  }

  // Reference tick to re-render while loading (avoids unused-var warning)
  void tick

  return (
    <div className="space-y-4">
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 space-y-4">
        <div>
          <label className="text-xs text-[#6b7280] block mb-1.5 tracking-wide">
            One per line — <span className="text-[#CDFF00]">website required</span>.{' '}
            <code className="text-[#CDFF00] bg-[#0a0a0a] px-1.5 py-0.5 rounded text-xs">Name https://url</code>
            {' '}or{' '}
            <code className="text-[#CDFF00] bg-[#0a0a0a] px-1.5 py-0.5 rounded text-xs">Name, website, area</code>
          </label>
          <textarea
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4b5563] font-mono h-36 focus:outline-none focus:border-[#CDFF00] transition-colors duration-200 resize-none"
            value={input}
            onChange={e => { setInput(e.target.value); setValidationError('') }}
            placeholder={"Bidhaar https://bidhaar.com\nForm SE15 https://www.formse15.com\nPhilip Normal https://philipnormal.store"}
          />
          {validationError && <p className="text-red-400 text-xs mt-2">{validationError}</p>}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={researchAll}
            disabled={!input.trim() || loading}
            className="bg-[#CDFF00] text-black px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#b8e600] disabled:opacity-40 transition-colors duration-200 cursor-pointer shrink-0"
          >
            {loading
              ? `Researching… ${completed}/${total} done`
              : `Research ${lineCount > 0 ? lineCount : ''} ${lineCount === 1 ? 'retailer' : 'retailers'} →`}
          </button>

          {loading && (
            <div className="flex-1 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#CDFF00] transition-all duration-500"
                style={{ width: total > 0 ? `${(completed / total) * 100}%` : '0%' }}
              />
            </div>
          )}
        </div>

        {loading && (
          <div className="space-y-1.5 pt-1">
            {parsedRetailers.map((r, i) => {
              const s = statuses[i]
              return (
                <div key={i} className="flex items-center gap-2 text-xs font-mono">
                  <span className={`shrink-0 w-4 ${s?.done ? (s.error ? 'text-red-400' : 'text-[#CDFF00]') : 'text-[#4b5563]'}`}>
                    {s?.done ? (s.error ? '✗' : '✓') : '→'}
                  </span>
                  <span className="text-[#6b7280] shrink-0">{r.name}</span>
                  <span className={`truncate flex-1 ${s?.done ? (s.error ? 'text-red-400/70' : 'text-[#CDFF00]/60') : 'text-[#4b5563]'}`}>
                    {s?.message ?? ''}
                  </span>
                  {s && (
                    <span className="text-[#4b5563] shrink-0 tabular-nums">{elapsed(s)}</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
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
