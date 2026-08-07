'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CloudSun, Sun, MoonStar } from 'lucide-react'
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card'
import MagneticCarousel from '@/components/MagneticCarousel'
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
  const showcaseRef = useRef<HTMLElement>(null)

  const [loading, setLoading] = useState(false)
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null)
  const [error, setError] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [messageIndex, setMessageIndex] = useState(0)
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [itineraryVersion, setItineraryVersion] = useState(0)
  const [isPressed, setIsPressed] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [previousItinerary, setPreviousItinerary] = useState<ItineraryDay[] | null>(null)
  const [previousChatHistory, setPreviousChatHistory] = useState<ChatMessage[] | null>(null)

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
        sunlightColor: 0xff8c21,
        sunGlareColor: 0xf7612f,
        speed: 0.70
      })
    }
    return () => { effect?.destroy() }
  }, [])

  const d = new Date()
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const [form, setForm] = useState<FormValues>({
    destination: '',
    startDate: today,
    endDate: '',
    budget: '',
    travelers: '',
    interests: [],
    explorationStyle: [],
  })

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function scrollToShowcase() {
    showcaseRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(prev => {
      const next = { ...prev, [name]: value }
      if (name === 'startDate' && next.endDate && next.endDate <= value) next.endDate = ''
      return next
    })
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

  const errors = {
    destination: !form.destination.trim() ? 'Destination is required' : '',
    startDate: !form.startDate ? 'Start date is required' : '',
    endDate: !form.endDate
      ? 'End date is required'
      : form.startDate && form.endDate <= form.startDate
      ? 'End date must be after start date'
      : '',
    budget: !form.budget || Number(form.budget) <= 0 ? 'Budget must be greater than 0' : '',
    travelers: !form.travelers || Number(form.travelers) < 1 ? 'At least 1 traveler is required' : '',
    interests: form.interests.length === 0 ? 'Select at least one interest' : '',
  }

  async function generateItinerary() {
    setSubmitAttempted(true)
    if (Object.values(errors).some(Boolean)) return
    setLoading(true)
    setItinerary(null)
    setError('')
    setChatHistory([])
    setChatInput('')
    setPreviousItinerary(null)
    setPreviousChatHistory(null)

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

  function handleUndo() {
    setItinerary(previousItinerary)
    setChatHistory(previousChatHistory!)
    setPreviousItinerary(null)
    setPreviousChatHistory(null)
    setItineraryVersion(v => v + 1)
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    await generateItinerary()
  }

  async function sendChatMessage() {
    const message = chatInput.trim()
    if (!message || !itinerary || loading) return

    const snapshotItinerary = itinerary
    const snapshotChatHistory = chatHistory

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

      setPreviousItinerary(snapshotItinerary)
      setPreviousChatHistory(snapshotChatHistory)
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
          className="text-left"
        >
          <motion.h1 variants={heroItem} className="text-5xl sm:text-6xl md:text-7xl lg:text-9xl text-amber-500 mb-4 font-array">
            Fantasy Travel Guide
          </motion.h1>
          <motion.p variants={heroItem} className="text-lg text-gray-600 mb-8">
            Tell us where you want to go and we&apos;ll build your perfect itinerary
          </motion.p>

          <motion.div variants={heroItem} className="flex gap-4">
            <motion.button
              onClick={scrollToShowcase}
              onTapStart={() => setIsPressed(true)}
              onTap={() => setIsPressed(false)}
              onTapCancel={() => setIsPressed(false)}
              animate={isPressed ? { y: 0, scale: 0.95 } : { y: [0, -6, 0], scale: 1}}
              transition={isPressed ? { duration: 0.2 } : { y: { repeat: Infinity , duration: 2.5, ease: 'easeInOut' }}}
              className="bg-sky-900 hover:bg-sky-600 text-white font-semibold py-3 px-8 rounded-full transition-colors"
            >
              Explore Destinations
            </motion.button>
            <motion.button
              onClick={scrollToForm}
              onTapStart={() => setIsPressed(true)}
              onTap={() => setIsPressed(false)}
              onTapCancel={() => setIsPressed(false)}
              animate={isPressed ? { y: 0, scale: 0.95 } : { y: [0, -6, 0], scale: 1}}
              transition={isPressed ? { duration: 0.2 } : { y: { repeat: Infinity , duration: 2.5, ease: 'easeInOut' }}}
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold py-3 px-8 rounded-full transition-colors"
            >
              Start Planning
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Destinations showcase section ── */}
      <section ref={showcaseRef} className="bg-slate-900 py-16 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 mb-10">
          <motion.h2 {...reveal} className="text-3xl font-bold text-white mb-2 text-center">
            Haven&apos;t decided where to go yet?
          </motion.h2>
          <motion.p {...reveal} transition={{ ...reveal.transition, delay: 0.05 }} className="text-slate-400 text-center">
            Here are some destinations to inspire your next adventure
          </motion.p>
        </div>
        <div style={{ height: 560 }} className="w-full">
          <MagneticCarousel />
        </div>
      </section>

      {/* ── Planner form section ── */}
      <section ref={formRef} className="min-h-screen bg-[url('/images/canyon.jpg')] bg-cover bg-center px-6 py-20 flex items-center justify-center">
        <GlassCard className="max-w-2xl mx-auto">
        <GlassCardContent className="px-6 pb-6">
          <motion.h2 {...reveal} className="text-3xl font-bold text-white mb-2 text-center">
            Plan Your Trip
          </motion.h2>
          <motion.p {...reveal} transition={{ ...reveal.transition, delay: 0.05 }} className="text-gray-300 text-center mb-10">
            Fill in the details and we&apos;ll create your perfect itinerary
          </motion.p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Destination */}
            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-200 mb-1">
                Destination
              </label>
              <input
                id="destination"
                name="destination"
                type="text"
                placeholder="e.g. Tokyo"
                value={form.destination}
                onChange={handleChange}
                onBlur={() => setTouched(prev => ({ ...prev, destination: true }))}
                className={`w-full border rounded-lg px-4 py-2.5 text-gray-800 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 ${(touched.destination || submitAttempted) && errors.destination ? 'border-red-400' : 'border-white/30'}`}
              />
              {(touched.destination || submitAttempted) && errors.destination && (
                <p className="text-red-500 text-xs mt-1">{errors.destination}</p>
              )}
            </motion.div>

            {/* Travel dates */}
            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.15 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-200 mb-1">
                  Start Date
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  min={today}
                  value={form.startDate}
                  onChange={handleChange}
                  onBlur={() => setTouched(prev => ({ ...prev, startDate: true }))}
                  className={`w-full border rounded-lg px-2 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-sky-400 ${(touched.startDate || submitAttempted) && errors.startDate ? 'border-red-400' : 'border-white/30'}`}
                />
                {(touched.startDate || submitAttempted) && errors.startDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>
                )}
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-200 mb-1">
                  End Date
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  min={form.startDate || today}
                  value={form.endDate}
                  onChange={handleChange}
                  onBlur={() => setTouched(prev => ({ ...prev, endDate: true }))}
                  className={`w-full border rounded-lg px-2 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-sky-400 ${(touched.endDate || submitAttempted) && errors.endDate ? 'border-red-400' : 'border-white/30'}`}
                />
                {(touched.endDate || submitAttempted) && errors.endDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>
                )}
              </div>
            </motion.div>

            {/* Budget and travelers */}
            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.2 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-200 mb-1">
                  Budget (£)
                </label>
                <input
                  id="budget"
                  name="budget"
                  type="number"
                  min="0"
                  step="50"
                  placeholder="e.g. 1000"
                  value={form.budget}
                  onChange={handleChange}
                  onBlur={() => setTouched(prev => ({ ...prev, budget: true }))}
                  className={`w-full border rounded-lg px-4 py-2.5 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 ${(touched.budget || submitAttempted) && errors.budget ? 'border-red-400' : 'border-white/30'}`}
                />
                {(touched.budget || submitAttempted) && errors.budget && (
                  <p className="text-red-500 text-xs mt-1">{errors.budget}</p>
                )}
              </div>
              <div>
                <label htmlFor="travelers" className="block text-sm font-medium text-gray-200 mb-1">
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
                  onBlur={() => setTouched(prev => ({ ...prev, travelers: true }))}
                  className={`w-full border rounded-lg px-4 py-2.5 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 ${(touched.travelers || submitAttempted) && errors.travelers ? 'border-red-400' : 'border-white/30'}`}
                />
                {(touched.travelers || submitAttempted) && errors.travelers && (
                  <p className="text-red-500 text-xs mt-1">{errors.travelers}</p>
                )}
              </div>
            </motion.div>

            {/* Interests */}
            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.25 }}>
              <p className="block text-sm font-medium text-gray-200 mb-2">
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
                        : 'bg-white/10 text-gray-200 border-white/30 hover:border-sky-400'
                    }`}
                  >
                    {interest}
                  </motion.button>
                ))}
              </div>
              {submitAttempted && errors.interests && (
                <p className="text-red-500 text-xs mt-2">{errors.interests}</p>
              )}
            </motion.div>

            {/* Exploration style */}
            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.3 }}>
              <p className="block text-sm font-medium text-gray-200 mb-1">
                Exploration Style
              </p>
              <p className="text-xs text-gray-300 mb-2">Pick any combination — or leave blank for a balanced mix (optional)</p>
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
                        : 'bg-white/10 text-gray-200 border-white/30 hover:border-sky-400'
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
              className="mt-10 flex flex-col items-center gap-3 text-sky-300"
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
        </GlassCardContent>
        </GlassCard>
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
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-semibold text-sky-700">Refine Your Itinerary</h3>
                {previousItinerary && (
                  <button
                    onClick={handleUndo}
                    disabled={loading}
                    className="text-xs bg-red-700 hover:bg-red-500 text-white disabled:opacity-40 transition-colors px-3 py-1 rounded-full"
                  >
                    Undo last change
                  </button>
                )}
              </div>
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
