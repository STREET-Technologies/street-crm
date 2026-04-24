import { NextRequest } from 'next/server'
import { researchRetailer, ResearchInput } from '@/lib/research'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get('auth')
  if (cookie?.value !== process.env.SITE_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { retailers } = await req.json() as { retailers: ResearchInput[] }
  if (!retailers?.length) {
    return new Response(JSON.stringify({ error: 'retailers array required' }), { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // All retailers research in parallel — results stream as each one finishes
      await Promise.all(
        retailers.map(async (r, i) => {
          try {
            const result = await researchRetailer(r)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ _index: i, ...result })}\n\n`))
          } catch (err) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ _index: i, retailer: r.name, error: String(err) })}\n\n`))
          }
        })
      )
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
