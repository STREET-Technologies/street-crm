'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ password }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      router.push('/')
    } else {
      setError(true)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <form onSubmit={handleSubmit} className="bg-[#111111] border border-[#2a2a2a] p-8 rounded-2xl w-80 space-y-5">
        <div>
          <h1 className="text-2xl tracking-wider text-white uppercase" style={{ fontFamily: 'var(--font-hanson)' }}>STREET</h1>
          <p className="text-xs text-[#6b7280] mt-0.5 tracking-wide">Retailer Research</p>
        </div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#CDFF00] transition-colors duration-200"
        />
        {error && <p className="text-red-400 text-xs">Incorrect password</p>}
        <button
          type="submit"
          className="w-full bg-[#CDFF00] text-black font-semibold rounded-lg py-2.5 text-sm hover:bg-[#b8e600] transition-colors duration-200 cursor-pointer"
        >
          Enter
        </button>
      </form>
    </main>
  )
}
