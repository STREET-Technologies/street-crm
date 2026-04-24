import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export type ResearchInput = {
  name: string
  website?: string
  area?: string
}

const SHOPIFY_SIGNALS = ['cdn.shopify.com', 'disallow: /admin', '/checkouts/', '/cdn/shop/', 'shopify']

async function fetchRobotsTxt(website: string): Promise<string> {
  try {
    const base = website.replace(/\/+$/, '')
    const res = await fetch(`${base}/robots.txt`, { signal: AbortSignal.timeout(5000) })
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

  const shopifyBlock = shopifyStatus
    ? `SHOPIFY (already determined from robots.txt — do NOT re-search): "${shopifyStatus}"`
    : robotsTxtContent
    ? `SHOPIFY: robots.txt fetched, no Shopify signals found → use "No". Do NOT re-search.`
    : `SHOPIFY DETECTION — follow these steps exactly:
1. Find the retailer's website.
2. Fetch <website>/robots.txt.
3. Contains "cdn.shopify.com", "Disallow: /admin", "/checkouts/", "/cdn/shop/" → "Yes".
4. robots.txt exists but none of those → "No".
5. Only "Unknown" if the retailer has absolutely no website.`

  const prompt = `Research this London retailer and return a JSON object with exactly these fields:
{
  "retailer": "${input.name}",
  "category": "e.g. Vintage clothing / Activewear / etc",
  "shopify": "Yes | No | Unknown",
  "website": "full URL or empty string",
  "linkedin": "LinkedIn company page URL or empty string",
  "contact_email": "public contact email or empty string",
  "decision_maker": "Name (Role) — LinkedIn profile URL, or empty string",
  "notes": "1-2 sentence description including location if known",
  "robots_txt": "${input.website ? input.website.replace(/\/+$/, '') + '/robots.txt' : ''}",
  "area": "${input.area || ''}"
}

Retailer: ${input.name}
${input.website ? `Known website: ${input.website}` : ''}
${input.area ? `Area: ${input.area}, London` : 'Location: London, UK'}
${robotsTxtContent ? `\nrobots.txt content (pre-fetched, do not search for it again):\n${robotsTxtContent}\n` : ''}
${shopifyBlock}

For decision_maker: find the founder, owner, or head of ecommerce/retail by name. Include their LinkedIn URL.
Be efficient — use at most 4 web searches total. Return ONLY valid JSON. No markdown, no explanation.`

  const tools = [{ type: 'web_search_20250305', name: 'web_search' }] as any[]
  const messages: any[] = [{ role: 'user', content: prompt }]

  let message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    tools,
    messages,
  })

  // Proper agentic loop — Claude may need multiple tool-use cycles
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
    throw new Error('Claude hit token limit mid-response — research too long')
  }

  const textBlock = message.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') throw new Error('No text response from Claude')

  try {
    return JSON.parse(textBlock.text)
  } catch {
    const match = textBlock.text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error(`Could not parse JSON. Claude returned: ${textBlock.text.slice(0, 300)}`)
  }
}
