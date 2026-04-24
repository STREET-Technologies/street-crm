'use client'
import { useState } from 'react'
import SingleTab from './components/SingleTab'
import BatchTab from './components/BatchTab'

export default function Home() {
  const [tab, setTab] = useState<'single' | 'batch'>('single')

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-[#2a2a2a] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold tracking-widest text-sm uppercase">STREET</span>
          <span className="text-[#2a2a2a]">/</span>
          <span className="text-[#6b7280] text-sm">Retailer Research</span>
        </div>
        <a
          href="/api/export"
          className="text-xs text-[#6b7280] border border-[#2a2a2a] px-3 py-1.5 rounded-lg hover:border-[#CDFF00] hover:text-[#CDFF00] transition-colors duration-200 cursor-pointer"
        >
          Export CSV
        </a>
      </header>

      <div className="max-w-3xl mx-auto p-6">
        <div className="flex gap-1 mb-8 bg-[#111111] border border-[#2a2a2a] rounded-lg p-1 w-fit">
          {(['single', 'batch'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                tab === t
                  ? 'bg-[#CDFF00] text-black'
                  : 'text-[#6b7280] hover:text-white'
              }`}
            >
              {t === 'single' ? 'Single' : 'Batch'}
            </button>
          ))}
        </div>

        {tab === 'single' ? <SingleTab /> : <BatchTab />}
      </div>
    </main>
  )
}
