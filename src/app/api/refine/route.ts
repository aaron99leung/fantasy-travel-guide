import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const client = new Anthropic()

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  const { itinerary, chatHistory, message, explorationStyle }: {
    itinerary: unknown
    chatHistory: ChatMessage[]
    message: string
    explorationStyle: string[]
  } = await request.json()

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    system: `You are a helpful travel planning assistant. The user wants to refine their itinerary.

Current itinerary (JSON):
${JSON.stringify(itinerary, null, 2)}

When the user asks for a change, update the itinerary and return a JSON object only — no explanation, no markdown fences, just raw valid JSON:
{
  "reply": "A short 1-2 sentence summary of what you changed",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "morning": "...",
      "afternoon": "...",
      "evening": "...",
      "estimatedCost": 120
    }
  ]
}

Keep all days in the response even if only some changed. Be specific with place names.

The user's exploration style preference is: ${explorationStyle && explorationStyle.length > 0 ? explorationStyle.join(', ') : 'Balanced mix of popular and local experiences'}. Honour this preference in any changes you make.`,
    messages: [
      ...chatHistory,
      { role: 'user', content: message },
    ],
  })

  const textBlock = response.content.find(block => block.type === 'text')
  const raw = textBlock && 'text' in textBlock ? textBlock.text.trim() : ''
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  const result = JSON.parse(cleaned)

  return Response.json(result)
}
