'use client'
import { useState } from 'react'
import SingleTab from './components/SingleTab'
import BatchTab from './components/BatchTab'

export default function Home() {
  const [tab, setTab] = useState<'single' | 'batch'>('single')

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <h1 className="font-semibold tracking-wide">STREET CRM — Retailer Research</h1>
        <a href="/api/export" className="text-sm bg-white text-black px-3 py-1.5 rounded hover:bg-gray-100">
          Export CSV
        </a>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex gap-2 mb-6">
          {(['single', 'batch'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded text-sm font-medium ${tab === t ? 'bg-black text-white' : 'bg-white text-gray-600 border'}`}
            >
              {t === 'single' ? 'Single Retailer' : 'Batch'}
            </button>
          ))}
        </div>

        {tab === 'single' ? <SingleTab /> : <BatchTab />}
      </div>
    </main>
  )
}
