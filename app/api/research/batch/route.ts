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
  const send = (controller: ReadableStreamDefaultController, payload: object) =>
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))

  const stream = new ReadableStream({
    start(controller) {
      // Synchronous start — fire async work as a detached promise so the
      // stream is returned to the client immediately and events flush as they arrive
      Promise.all(
        retailers.map(async (r, i) => {
          try {
            const result = await researchRetailer(r, (msg) => {
              send(controller, { type: 'progress', index: i, retailer: r.name, message: msg })
            })
            send(controller, { type: 'result', index: i, ...result })
          } catch (err) {
            send(controller, { type: 'result', index: i, retailer: r.name, error: String(err) })
          }
        })
      ).then(() => controller.close()).catch(() => controller.close())
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
