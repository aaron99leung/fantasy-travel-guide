'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CloudSun, Sun, MoonStar } from 'lucide-react'
import * as THREE from 'three'
import CLOUDS from 'vanta/dist/vanta.clouds.min'

const INTERESTS = ['Food', 'History', 'Nature', 'Nightlife', 'Adventure', 'Relaxation']
const EXPLORATION_STYLES = ['Iconic Landmarks', 'Local Neighborhoods', 'Hidden Gems', 'Avoid Tourist Traps']

interface FormValues {
  destination: string
  startDate: string
  endDate: string
  budget: string
  travelers: string
  interests: string[]
  explorationStyle: string[]
}

interface ItineraryDay {
  day: number
  date: string
  morning: string
  afternoon: string
  evening: string
  estimatedCost: number
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`
}

const heroContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}

const heroItem = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

const reveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: false },
  transition: { duration: 0.5, ease: 'easeOut' as const },
}

const LOADING_MESSAGES = [
  'AI is planning your trip…',
  'Checking local recommendations…',
  'Mapping out your days…',
  'Adding the finishing touches…',
]

const cardContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}
const cardItem = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}
// Each time-of-day row fades in after its card has appeared
const rowVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
}

export default function Home() {
  const formRef = useRef<HTMLElement>(null)
  const itineraryRef = useRef<HTMLElement>(null)
  const heroRef = useRef<HTMLElement>(null)

  const [loading, setLoading] = useState(false)
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null)
  const [error, setError] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [messageIndex, setMessageIndex] = useState(0)
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [itineraryVersion, setItineraryVersion] = useState(0)
  const [isPressed, setIsPressed] = useState(false)

  useEffect(() => {
    if (itinerary) {
      itineraryRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [itinerary])

  useEffect(() => {
    if (!loading) {
      setMessageIndex(0)
      return
    }
    const id = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length)
    }, 4000)
    return () => clearInterval(id)
  }, [loading])

  useEffect(() => {
    let effect: { destroy: () => void } | null = null
    if (heroRef.current) {
      effect = CLOUDS({
        el: heroRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        skyColor: 0x58bfff,
        cloudColor: 0xbebebe,
        cloudShadowColor: 0x3e3e59,
        sunColor: 0xff8e00,
        sunGlareColor: 0xf7612f,
        speed: 0.70
      })
    }
    return () => { effect?.destroy() }
  }, [])

  const [form, setForm] = useState<FormValues>({
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    travelers: '',
    interests: [],
    explorationStyle: [],
  })

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function toggleInterest(interest: string) {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  function toggleExploration(style: string) {
    setForm(prev => ({
      ...prev,
      explorationStyle: prev.explorationStyle.includes(style)
        ? prev.explorationStyle.filter(s => s !== style)
        : [...prev.explorationStyle, style],
    }))
  }

  async function generateItinerary() {
    setLoading(true)
    setItinerary(null)
    setError('')
    setChatHistory([])
    setChatInput('')

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      setItinerary(data.days)
      setItineraryVersion(v => v + 1)
    } catch {
      setError('Something went wrong. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    await generateItinerary()
  }

  async function sendChatMessage() {
    const message = chatInput.trim()
    if (!message || !itinerary || loading) return

    setChatInput('')
    setChatHistory(prev => [...prev, { role: 'user', content: message }])
    setLoading(true)
    setIsChatLoading(true)
    setError('')

    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary, chatHistory, message, explorationStyle: form.explorationStyle }),
      })
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()

      setItinerary(data.days)
      setItineraryVersion(v => v + 1)
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
      setIsChatLoading(false)
    }
  }

  return (
    <main>
      {/* ── Hero section ── */}
      <section ref={heroRef} className="flex min-h-screen flex-col items-center justify-center px-6 relative overflow-hidden">
        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="visible"
          className="text-center max-w-2xl"
        >
          <motion.h1 variants={heroItem} className="text-5xl text-sky-700 font-bold mb-4">
            Fantasy Travel Guide
          </motion.h1>
          <motion.p variants={heroItem} className="text-lg text-gray-600 mb-8">
            Tell us where you want to go and we&apos;ll build your perfect itinerary.
          </motion.p>

          <motion.div variants={heroItem}>
            <motion.button
              onClick={scrollToForm}
              onTapStart={() => setIsPressed(true)}
              onTap={() => setIsPressed(false)}
              onTapCancel={() => setIsPressed(false)}
              animate={isPressed ? { y: 0, scale: 0.95 } : { y: [0, -6, 0], scale: 1}}
              transition={isPressed ? { duration: 0.2 } : { y: { repeat: Infinity , duration: 2.5, ease: 'easeInOut' }}}
              className="bg-sky-600 hover:bg-amber-600 text-white font-semibold py-3 px-8 rounded-full transition-colors"
            >
              Start Planning
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Planner form section ── */}
      <section ref={formRef} className="min-h-screen bg-white px-6 py-20">
        <div className="max-w-2xl mx-auto">
          <motion.h2 {...reveal} className="text-3xl font-bold text-sky-700 mb-2 text-center">
            Plan Your Trip
          </motion.h2>
          <motion.p {...reveal} transition={{ ...reveal.transition, delay: 0.05 }} className="text-gray-500 text-center mb-10">
            Fill in the details and we&apos;ll create your perfect itinerary.
          </motion.p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Destination */}
            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
                Destination
              </label>
              <input
                id="destination"
                name="destination"
                type="text"
                placeholder="e.g. Tokyo"
                value={form.destination}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </motion.div>

            {/* Travel dates */}
            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.15 }} className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
            </motion.div>

            {/* Budget and travelers */}
            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.2 }} className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                  Budget (£)
                </label>
                <input
                  id="budget"
                  name="budget"
                  type="number"
                  min="0"
                  placeholder="e.g. 1000"
                  value={form.budget}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <div>
                <label htmlFor="travelers" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Travelers
                </label>
                <input
                  id="travelers"
                  name="travelers"
                  type="number"
                  min="1"
                  placeholder="e.g. 2"
                  value={form.travelers}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
            </motion.div>

            {/* Interests */}
            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.25 }}>
              <p className="block text-sm font-medium text-gray-700 mb-2">
                Interests
              </p>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(interest => (
                  <motion.button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    whileTap={{ scale: 1.12 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      form.interests.includes(interest)
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-sky-400'
                    }`}
                  >
                    {interest}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Exploration style */}
            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.3 }}>
              <p className="block text-sm font-medium text-gray-700 mb-1">
                Exploration Style
              </p>
              <p className="text-xs text-gray-400 mb-2">Pick any combination — or leave blank for a balanced mix.</p>
              <div className="flex flex-wrap gap-2">
                {EXPLORATION_STYLES.map(style => (
                  <motion.button
                    key={style}
                    type="button"
                    onClick={() => toggleExploration(style)}
                    whileTap={{ scale: 1.12 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      form.explorationStyle.includes(style)
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-sky-400'
                    }`}
                  >
                    {style}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.35 }}>
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={!loading ? { scale: 0.96 } : {}}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-semibold py-3 px-8 rounded-full transition-colors"
              >
                {loading ? 'Building your itinerary…' : 'Build My Itinerary'}
              </motion.button>
            </motion.div>
          </form>

          {/* Loading spinner */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="mt-10 flex flex-col items-center gap-3 text-sky-600"
            >
              <span className="loading loading-spinner loading-xl" />
              <AnimatePresence mode="wait">
                <motion.p
                  key={messageIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="text-sm font-medium"
                >
                  {LOADING_MESSAGES[messageIndex]}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          )}

          {/* Error message */}
          {error && (
            <p className="mt-6 text-center text-red-500 text-sm">{error}</p>
          )}
        </div>
      </section>

      {/* ── Itinerary section — one card per day ── */}
      {itinerary && (
        <section ref={itineraryRef} className="bg-sky-50 px-6 py-20">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-sky-700 mb-8 text-center">
              Your Itinerary
            </h2>
            <motion.div
              key={itineraryVersion}
              className="space-y-6"
              variants={cardContainer}
              initial="hidden"
              animate="visible"
            >
              {itinerary.map((day) => (
                <motion.div
                  key={day.day}
                  variants={cardItem}
                  whileHover={{
                    y: -5,
                    boxShadow: '0 16px 36px rgba(0,0,0,0.11)',
                    transition: { duration: 0.2 },
                  }}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden"
                >
                  {/* Card header */}
                  <div className="bg-sky-600 px-6 py-4">
                    <p className="text-white font-bold text-lg">Day {day.day}</p>
                    <p className="text-sky-100 text-sm">{formatDate(day.date)}</p>
                  </div>
                  <motion.div
                    className="divide-y divide-gray-100"
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
                    }}
                  >
                    {[
                      { label: 'Morning', content: day.morning, color: 'text-amber-600', Icon: CloudSun },
                      { label: 'Afternoon', content: day.afternoon, color: 'text-sky-600', Icon: Sun },
                      { label: 'Evening', content: day.evening, color: 'text-indigo-600', Icon: MoonStar },
                    ].map(({ label, content, color, Icon }) => (
                      <motion.div key={label} variants={rowVariants} className="px-6 py-4">
                        <div className={`flex items-center gap-1.5 mb-1 ${color}`}>
                          <Icon size={13} strokeWidth={2.5} />
                          <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{content}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                  {/* Estimated daily cost footer */}
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <p className="text-xs font-medium text-gray-500">Estimated daily cost</p>
                    <p className="text-sm font-semibold text-amber-600">£{day.estimatedCost ?? '—'}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Budget vs actual summary */}
            {(() => {
              const total = itinerary.reduce((sum, d) => sum + (d.estimatedCost ?? 0), 0)
              const budget = parseInt(form.budget) || 0
              const over = budget > 0 && total > budget
              return (
                <div className="mt-4 bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-semibold text-gray-700">Total estimated cost</p>
                    <p className={`font-bold text-lg ${over ? 'text-red-500' : 'text-amber-600'}`}>£{total}</p>
                  </div>
                  {budget > 0 && (
                    <>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-1.5">
                        <motion.div
                          className={`h-2 rounded-full ${over ? 'bg-red-400' : 'bg-amber-500'}`}
                          initial={{ width: '0%' }}
                          whileInView={{ width: `${Math.min((total / budget) * 100, 100)}%` }}
                          viewport={{ once: false, amount: 0.5 }}
                          transition={{ duration: 1.5, ease: 'easeOut' as const, delay: 0.3 }}
                        />
                      </div>
                      <p className="text-xs text-right text-gray-400">
                        {over ? `£${total - budget} over` : `£${budget - total} remaining`} from your £{budget} budget
                      </p>
                    </>
                  )}
                </div>
              )
            })()}

            {/* Regenerate button — outlined style so it reads as less important than the main button */}
            <motion.button
              onClick={generateItinerary}
              disabled={loading}
              whileTap={{ scale: 1.12 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              className="mt-8 w-full border-2 border-sky-600 text-sky-600 hover:bg-sky-300 disabled:opacity-40 font-semibold py-3 px-8 rounded-full transition-colors"
            >
              Regenerate Itinerary
            </motion.button>

            {/* ── Chat section ── */}
            <div className="mt-10">
              <h3 className="text-lg font-semibold text-sky-700 mb-1">Refine Your Itinerary</h3>
              <p className="text-sm text-gray-500 mb-4">
                Want to change it up? — e.g. &ldquo;make day 2 more relaxed&rdquo; or &ldquo;add vegetarian options&rdquo;.
              </p>

              {/* Message bubbles + typing indicator */}
              {(chatHistory.length > 0 || isChatLoading) && (
                <div className="space-y-3 mb-4">
                  <AnimatePresence initial={false}>
                    {chatHistory.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' as const }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-sky-600 text-white'
                            : 'bg-white text-gray-700 shadow-sm'
                        }`}>
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}

                    {isChatLoading && (
                      <motion.div
                        key="typing"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.25 }}
                        className="flex justify-start"
                      >
                        <div className="bg-white shadow-sm px-4 py-3.5 rounded-2xl flex gap-1.5 items-center">
                          {[0, 1, 2].map(i => (
                            <motion.span
                              key={i}
                              className="w-2 h-2 bg-gray-400 rounded-full block"
                              animate={{ y: [0, -5, 0] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.7,
                                delay: i * 0.15,
                                ease: 'easeInOut',
                              }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Input row */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendChatMessage() }}
                  placeholder='e.g. "make day 2 more relaxed"'
                  disabled={loading}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-gray-50"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={loading || !chatInput.trim()}
                  className="bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
