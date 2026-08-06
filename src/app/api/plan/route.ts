import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  const { destination, startDate, endDate, budget, travelers, interests, explorationStyle } =
    await request.json()

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    messages: [
      {
        role: 'user',
        content: `Plan a travel itinerary and return it as a JSON object only — no explanation, no markdown fences, just raw valid JSON.

Destination: ${destination}
Start Date: ${startDate}
End Date: ${endDate}
Budget: £${budget}
Number of Travelers: ${travelers}
Interests: ${interests.length > 0 ? interests.join(', ') : 'General sightseeing'}
Exploration style: ${explorationStyle && explorationStyle.length > 0 ? explorationStyle.join(', ') : 'Balanced mix — include both famous sights and local experiences'}

Use this exact JSON structure:
{
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "morning": "Specific morning activities and places",
      "afternoon": "Specific afternoon activities and places",
      "evening": "Specific evening activities and dinner recommendations",
      "estimatedCost": 120
    }
  ]
}

One entry per day for the full trip duration. Be specific with place names, activities, food recommendations, and practical travel tips. estimatedCost is a realistic number in £ for that day covering accommodation, meals, activities, and local transport — aim to keep the total across all days close to the user's stated budget.`,
      },
    ],
  })

  const textBlock = response.content.find(block => block.type === 'text')
  const raw = textBlock && 'text' in textBlock ? textBlock.text.trim() : ''

  // Claude sometimes wraps JSON in ```json ... ``` — strip those if present.
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  const itinerary = JSON.parse(cleaned)

  return Response.json(itinerary)
}
