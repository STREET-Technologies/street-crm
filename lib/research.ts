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

export async function researchRetailer(
  input: ResearchInput,
  onProgress?: (msg: string) => void
) {
  const robotsTxtContent = input.website ? await fetchRobotsTxt(input.website) : ''
  const shopifyStatus = shopifyFromRobots(robotsTxtContent)
  // Only treat "Yes" as definitive — "No" just means no signals at the hint URL,
  // the real store may be at a different domain (e.g. philipnormal.co.uk vs philipnormal.store)
  const shopifyConfirmed = shopifyStatus === 'Yes'

  const location = input.area ? `${input.area}, London` : 'London, UK'
  const websiteOrigin = input.website ? getOrigin(input.website) : ''

  // Targeted search plan — number of searches depends on what we already know
  const searches: string[] = []

  if (!input.website) {
    searches.push(`"${input.name} ${location}" official website — return the URL`)
  } else if (!shopifyConfirmed) {
    // Hint provided but Shopify not confirmed — tell Claude to verify the actual store URL
    searches.push(`Verify "${input.website}" is the primary e-commerce URL for ${input.name}. If the store is at a different domain (e.g. a .store or Shopify subdomain), use that. Fetch the final URL's /robots.txt — if it contains "cdn.shopify.com", "Disallow: /admin", "/checkouts/", or "/cdn/shop/" set shopify="Yes", else "No".`)
  }

  if (!shopifyConfirmed && !input.website) {
    searches.push(`Fetch <website>/robots.txt — if it contains "cdn.shopify.com", "Disallow: /admin", "/checkouts/", "/cdn/shop/" set shopify="Yes", else "No". Only "Unknown" if no website found.`)
  }

  searches.push(`"${input.name}" site:linkedin.com — return the company LinkedIn page URL`)
  searches.push(`"${input.name}" founder OR owner OR director — return their full name, role, and LinkedIn profile URL`)
  searches.push(`"${input.name}" "head of retail" OR "head of wholesale" OR "head of buying" OR "head of partnerships" OR buyer — return name, role, and LinkedIn profile URL of any commercial/buying decision-maker. Return empty if the retailer is clearly a single-owner indie (same person as the founder).`)

  const searchPlan = searches.map((s, i) => `${i + 1}. ${s}`).join('\n')

  const known = [
    `Retailer: ${input.name}`,
    input.website ? `Website hint: ${input.website}` : null,
    `Location: ${location}`,
    shopifyConfirmed ? `Shopify: Yes (confirmed via robots.txt — do not re-check)` : null,
  ].filter(Boolean).join('\n')

  const prompt = `You are a retail researcher. Run the ${searches.length} searches below in order, then return a single JSON object.

KNOWN INFO:
${known}
${robotsTxtContent ? `\nrobots.txt from website hint (may not be the canonical store URL):\n${robotsTxtContent}\n` : ''}
SEARCH PLAN — run each in order, do not add extra searches:
${searchPlan}

Return ONLY this JSON object. No text before or after, no markdown, no code fences:
{
  "retailer": "${input.name}",
  "category": "infer from search results, e.g. Outdoor gear / Vintage clothing",
  "shopify": "${shopifyConfirmed ? 'Yes' : 'Yes | No | Unknown'}",
  "website": "canonical store URL — use the actual e-commerce URL, not just the hint",
  "linkedin": "",
  "contact_email": "",
  "decision_maker": "Name (Role) — LinkedIn URL, or empty string",
  "commercial_contact": "Name (Role) — LinkedIn URL for a commercial buyer / head of retail / head of wholesale, or empty string if the retailer is a single-owner indie where the founder fills this role",
  "notes": "1-2 sentences about the retailer including location",
  "robots_txt": "${websiteOrigin ? websiteOrigin + '/robots.txt' : ''}",
  "area": "${input.area ?? ''}"
}`

  const tools = [{ type: 'web_search_20250305', name: 'web_search' }] as any[]
  const messages: any[] = [{ role: 'user', content: prompt }]

  onProgress?.('Starting…')

  // Extract and emit search queries from any API response
  function emitSearches(content: any[]) {
    for (const block of content) {
      if (block.type === 'tool_use' && block.name === 'web_search') {
        const query = (block.input as any)?.query
        if (query) onProgress?.(`Searching: ${query}`)
      }
    }
  }

  let message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    tools,
    messages,
  })

  // Emit from first response (catches single-round searches where loop never runs)
  emitSearches(message.content)

  // Continue if Claude wants more rounds
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
    emitSearches(message.content)
  }

  if (message.stop_reason === 'max_tokens') {
    throw new Error('Claude hit token limit — try a more specific retailer name')
  }

  let textBlock = message.content.find(b => b.type === 'text')

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
