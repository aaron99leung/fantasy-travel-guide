# Fantasy Travel Guide

An AI-powered travel planner that generates personalised day-by-day itineraries and lets you refine them through natural conversation.

**<a href="https://fantasy-travel-guide.vercel.app/" target="_blank">🔗 Live Demo</a>**

---

## Features

- **AI itinerary generation** - enter a destination, dates, budget, and preferences; Claude returns a structured day-by-day plan with morning, afternoon, and evening activities
- **Multi-turn chat refinement** - after the itinerary is generated, a persistent chat thread lets you request changes in plain English ("make day 3 more relaxed", "add vegetarian restaurant options") with full undo support
- **Budget tracking** - estimated daily costs are summed against your stated budget with an animated progress bar showing over/under spend
- **Exploration style customisation** - choose interests (Food, History, Nature, etc.) and exploration styles (Iconic Landmarks, Hidden Gems, etc.) that are woven into the prompt
- **Destination showcase** - magnetic hover carousel of 10 destination images on desktop; native-swipe horizontal scroll on mobile
- **Mobile-responsive** - single-column form layout, touch-friendly carousel, hero text scaling

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + DaisyUI 5 |
| Animation | Motion (motion/react) |
| AI | Anthropic SDK (`@anthropic-ai/sdk`) |
| Hero background | Vanta.js CLOUDS + Three.js r134 |
| Icons | lucide-react |
| Utilities | clsx + tailwind-merge |

---

## Notable Technical Decisions

**Structured JSON output from Claude**\
The `/api/plan` route instructs Claude to return the itinerary as a strict JSON schema (`{ days: [{ day, date, morning, afternoon, evening, estimatedCost }] }`). Parsing structured output rather than prose means cost figures can be summed, cards can be rendered per-day, and the chat refinement step can surgically update specific days without re-generating everything.

**Conversation history for chat refinement**\
Each chat message appends to a `ChatMessage[]` array that is sent back to the API on every request, preserving the full exchange. The previous itinerary is also included in the system context so Claude knows what it is modifying. An undo stack saves the pre-edit itinerary and chat history so the user can revert a single refinement.

**Vanta.js Three.js version pin**\
Vanta CLOUDS depends on Three.js internals that changed in r155 (`ColorManagement.enabled` became opt-out). The project pins `three@^0.134.0` to maintain correct cloud colours. If WebGL is unavailable the `useEffect` that mounts Vanta simply does not fire, and the hero section falls back cleanly to its CSS background.

---

## Local Setup

**Prerequisites:** Node.js 18+, an [Anthropic API key](https://console.anthropic.com/)

```bash
# 1. Clone and install
git clone https://github.com/aaron99leung/fantasy-travel-guide.git
cd fantasy-travel-guide
npm install

# 2. Add your API key to your local environment variable
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Never commit `.env.local`** - it is already in `.gitignore`.
