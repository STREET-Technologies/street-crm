'use client'
import { useEffect, useState } from 'react'
import RetailerCard from './RetailerCard'

type Status = { message: string; done: boolean; error?: boolean; startedAt?: number; finishedAt?: number }
type Row = { name: string; website: string; area: string }

const emptyRow = (): Row => ({ name: '', website: '', area: '' })
const MAX_ROWS = 5

export default function BatchTab() {
  const [rows, setRows] = useState<Row[]>([emptyRow(), emptyRow(), emptyRow()])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [statuses, setStatuses] = useState<Record<number, Status>>({})
  const [total, setTotal] = useState(0)
  const [tick, setTick] = useState(0)
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (!loading) return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [loading])

  function updateRow(i: number, field: keyof Row, value: string) {
    setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: value } : row))
    setValidationError('')
  }

  function addRow() { setRows(r => r.length >= MAX_ROWS ? r : [...r, emptyRow()]) }
  function removeRow(i: number) { setRows(r => r.filter((_, idx) => idx !== i)) }

  function handlePaste(i: number, e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text')
    // Trigger structured parse if pasted text looks like CSV/TSV (has newline, tab, or comma)
    if (!text.includes('\n') && !text.includes('\t') && !text.includes(',')) return
    e.preventDefault()
    const pasted = text.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
      const parts = line.split(/\t|,/).map(s => s.trim())
      const urlMatch = line.match(/https?:\/\/\S+/)
      if (urlMatch && parts.length < 2) {
        return { name: line.replace(urlMatch[0], '').trim(), website: urlMatch[0], area: '' }
      }
      return { name: parts[0] || '', website: parts[1] || '', area: parts[2] || '' }
    })
    setRows(prev => {
      const next = [...prev]
      pasted.forEach((p, offset) => { if (i + offset < MAX_ROWS) next[i + offset] = p })
      return next.slice(0, MAX_ROWS)
    })
  }

  async function researchAll() {
    const retailers = rows
      .map(r => ({ name: r.name.trim(), website: r.website.trim(), area: r.area.trim() }))
      .filter(r => r.name)

    if (!retailers.length) { setValidationError('Add at least one retailer.'); return }
    const missing = retailers.filter(r => !r.website).map(r => r.name)
    if (missing.length) { setValidationError(`Website required. Missing: ${missing.join(', ')}`); return }

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
  const filledRetailers = rows.filter(r => r.name.trim())

  function elapsed(s?: Status) {
    if (!s?.startedAt) return ''
    const end = s.finishedAt ?? Date.now()
    return `${Math.floor((end - s.startedAt) / 1000)}s`
  }

  void tick
  const inputClass = "w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#CDFF00] transition-colors duration-200"

  return (
    <div className="space-y-4">
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 space-y-4">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_1.3fr_0.7fr_auto] gap-2 px-1">
          <label className="text-xs text-[#6b7280] tracking-wide">Retailer *</label>
          <label className="text-xs text-[#6b7280] tracking-wide">Website *</label>
          <label className="text-xs text-[#6b7280] tracking-wide">Area</label>
          <span className="w-6" />
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_1.3fr_0.7fr_auto] gap-2 items-center">
              <input
                className={inputClass}
                value={row.name}
                onChange={e => updateRow(i, 'name', e.target.value)}
                onPaste={e => handlePaste(i, e)}
                placeholder="Jaadu Boutique"
                disabled={loading}
              />
              <input
                className={inputClass}
                value={row.website}
                onChange={e => updateRow(i, 'website', e.target.value)}
                onPaste={e => handlePaste(i, e)}
                placeholder="https://jaaduboutique.com"
                disabled={loading}
              />
              <input
                className={inputClass}
                value={row.area}
                onChange={e => updateRow(i, 'area', e.target.value)}
                onPaste={e => handlePaste(i, e)}
                placeholder="Dulwich"
                disabled={loading}
              />
              <button
                onClick={() => removeRow(i)}
                disabled={loading || rows.length === 1}
                className="w-6 h-6 text-[#4b5563] hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors duration-150 text-lg leading-none"
                title="Remove row"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={addRow}
            disabled={loading || rows.length >= MAX_ROWS}
            className="text-xs text-[#6b7280] border border-[#2a2a2a] px-3 py-1.5 rounded-lg hover:border-[#CDFF00] hover:text-[#CDFF00] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
          >
            + Add row
          </button>
          <span className="text-xs text-[#4b5563]">
            {rows.length}/{MAX_ROWS} rows · paste CSV or tab-separated text to auto-fill
          </span>
        </div>

        {validationError && <p className="text-red-400 text-xs">{validationError}</p>}

        <div className="flex items-center gap-4 pt-2 border-t border-[#2a2a2a]">
          <button
            onClick={researchAll}
            disabled={!filledRetailers.length || loading}
            className="bg-[#CDFF00] text-black px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#b8e600] disabled:opacity-40 transition-colors duration-200 cursor-pointer shrink-0"
          >
            {loading
              ? `Researching… ${completed}/${total} done`
              : `Research ${filledRetailers.length || ''} ${filledRetailers.length === 1 ? 'retailer' : 'retailers'} →`}
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
            {filledRetailers.map((r, i) => {
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
                  {s && <span className="text-[#4b5563] shrink-0 tabular-nums">{elapsed(s)}</span>}
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
