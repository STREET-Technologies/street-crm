import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export type ResearchInput = {
  name: string
  website?: string
  area?: string
}

export async function researchRetailer(input: ResearchInput) {
  const prompt = `Research this retailer and return a JSON object with exactly these fields:
{
  "retailer": "${input.name}",
  "category": "e.g. Vintage clothing / Activewear / etc",
  "shopify": "Yes | No | Unknown",
  "website": "full URL or empty string",
  "linkedin": "LinkedIn company page URL or empty string",
  "contact_email": "public contact email or empty string",
  "decision_maker": "Name (Role) — LinkedIn profile URL, or empty string",
  "notes": "1-2 sentence description including location if known",
  "robots_txt": "URL of robots.txt if website found, else empty string",
  "area": "${input.area || ''}"
}

Retailer: ${input.name}
${input.website ? `Known website: ${input.website}` : ''}
${input.area ? `Area: ${input.area}, London` : 'Location: London, UK'}

To determine Shopify: fetch the robots.txt of their website and look for cdn.shopify.com, /admin disallow, or explicit Shopify mentions. If no website, search for one first.

For decision_maker: find the founder, owner, or head of ecommerce/retail by name. Include their LinkedIn profile URL if findable.

Return ONLY valid JSON. No markdown, no explanation.`

  const tools = [{ type: 'web_search_20250305', name: 'web_search' }] as any[]
  const messages: any[] = [{ role: 'user', content: prompt }]

  let message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    tools,
    messages,
  })

  // If Claude stopped at tool_use without producing a text block, continue the conversation
  if (message.stop_reason === 'tool_use' && !message.content.find(b => b.type === 'text')) {
    messages.push({ role: 'assistant', content: message.content })
    message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      tools,
      messages,
    })
  }

  const textBlock = message.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') throw new Error('No text response from Claude')

  try {
    return JSON.parse(textBlock.text)
  } catch {
    const match = textBlock.text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('Could not parse JSON from Claude response')
  }
}
