import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export type ResearchInput = {
  name: string
  website?: string
  area?: string
}

const SHOPIFY_SIGNALS = ['cdn.shopify.com', 'disallow: /admin', '/checkouts/', '/cdn/shop/', 'shopify']

function normalizeUrl(url: string): string {
  return url.startsWith('http') ? url : 'https://' + url
}

function getOrigin(url: string): string {
  try { return new URL(normalizeUrl(url)).origin } catch { return normalizeUrl(url) }
}

async function fetchRobotsTxt(website: string): Promise<string> {
  try {
    const origin = getOrigin(website)
    const res = await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(5000) })
    if (res.ok) return (await res.text()).slice(0, 3000)
  } catch { /* ignore */ }
  return ''
}

function shopifyFromRobots(content: string): 'Yes' | 'No' | null {
  if (!content) return null
  const lower = content.toLowerCase()
  return SHOPIFY_SIGNALS.some(s => lower.includes(s)) ? 'Yes' : 'No'
}

export async function researchRetailer(input: ResearchInput) {
  const robotsTxtContent = input.website ? await fetchRobotsTxt(input.website) : ''
  const shopifyStatus = shopifyFromRobots(robotsTxtContent)

  const location = input.area ? `${input.area}, London` : 'London, UK'
  const websiteOrigin = input.website ? getOrigin(input.website) : ''

  // Build a targeted, numbered search plan based on what we already know.
  // If website + Shopify are pre-determined, Claude only needs 2 searches.
  const searches: string[] = []

  if (!input.website) {
    searches.push(`"${input.name} ${location}" official website — return the URL`)
    searches.push(`Fetch <website>/robots.txt — if it contains "cdn.shopify.com", "Disallow: /admin", "/checkouts/", or "/cdn/shop/" set shopify="Yes", else "No". Only "Unknown" if no website found.`)
  }

  searches.push(`"${input.name}" site:linkedin.com — return the company LinkedIn page URL`)
  searches.push(`"${input.name}" founder OR owner OR director — return their full name, role, and LinkedIn profile URL`)

  const searchPlan = searches.map((s, i) => `${i + 1}. ${s}`).join('\n')

  const known = [
    `Retailer: ${input.name}`,
    input.website ? `Website: ${input.website}` : null,
    `Location: ${location}`,
    shopifyStatus ? `Shopify: ${shopifyStatus} (confirmed via robots.txt — skip Shopify detection)` : null,
  ].filter(Boolean).join('\n')

  const prompt = `You are a retail researcher. Run the ${searches.length} searches below in order, then return a single JSON object.

KNOWN INFO:
${known}
${robotsTxtContent ? `\nrobots.txt (already fetched — do not search for it):\n${robotsTxtContent}\n` : ''}
SEARCH PLAN — run each in order, do not add extra searches:
${searchPlan}

Return ONLY this JSON object. No text before or after, no markdown, no code fences:
{
  "retailer": "${input.name}",
  "category": "infer from search results, e.g. Outdoor gear / Vintage clothing",
  "shopify": "${shopifyStatus ?? 'Yes | No | Unknown'}",
  "website": "${input.website ?? ''}",
  "linkedin": "",
  "contact_email": "",
  "decision_maker": "Name (Role) — LinkedIn URL, or empty string",
  "notes": "1-2 sentences about the retailer including location",
  "robots_txt": "${websiteOrigin ? websiteOrigin + '/robots.txt' : ''}",
  "area": "${input.area ?? ''}"
}`

  const tools = [{ type: 'web_search_20250305', name: 'web_search' }] as any[]
  const messages: any[] = [{ role: 'user', content: prompt }]

  let message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    tools,
    messages,
  })

  // Agentic loop — continues until Claude outputs a text response
  let iterations = 0
  while (message.stop_reason === 'tool_use' && iterations < 8) {
    iterations++
    messages.push({ role: 'assistant', content: message.content })
    message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      tools,
      messages,
    })
  }

  if (message.stop_reason === 'max_tokens') {
    throw new Error('Claude hit token limit — try a more specific retailer name')
  }

  let textBlock = message.content.find(b => b.type === 'text')

  // Rescue turn if Claude returned narration instead of JSON
  const hasJson = (text: string) => text.includes('{') && text.includes('}')
  if (!textBlock || textBlock.type !== 'text' || !hasJson(textBlock.text)) {
    messages.push({ role: 'assistant', content: message.content })
    messages.push({ role: 'user', content: 'Output ONLY the JSON object with your research findings. Raw JSON, no other text.' })
    const rescue = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages,
    })
    textBlock = rescue.content.find(b => b.type === 'text')
  }

  if (!textBlock || textBlock.type !== 'text') throw new Error('No text response from Claude')

  try {
    return JSON.parse(textBlock.text)
  } catch {
    const match = textBlock.text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error(`Could not parse JSON. Claude returned: ${textBlock.text.slice(0, 300)}`)
  }
}
