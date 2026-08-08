'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CloudSun, Sun, MoonStar, ChevronDown } from 'lucide-react'
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
  const isChatUpdateRef = useRef(false)

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
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (itinerary) {
      itineraryRef.current?.scrollIntoView({ behavior: 'smooth' })
      if (!isChatUpdateRef.current) {
        const initial = itinerary.length < 7
          ? new Set(itinerary.map(d => d.day))
          : new Set<number>()
        setExpandedDays(initial)
      }
      isChatUpdateRef.current = false
    }
  }, [itinerary])

  function toggleDay(day: number) {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

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
      const changedDayNums = (data.days as ItineraryDay[])
        .filter(newDay => {
          const old = snapshotItinerary.find(d => d.day === newDay.day)
          return !old
            || old.morning !== newDay.morning
            || old.afternoon !== newDay.afternoon
            || old.evening !== newDay.evening
            || old.estimatedCost !== newDay.estimatedCost
        })
        .map(d => d.day)
      isChatUpdateRef.current = true
      setExpandedDays(new Set(changedDayNums))
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
                animate={
                  loading
                    ? { backgroundColor: ['#fcd34d', '#f59e0b', '#fcd34d'] }
                    : { backgroundColor: '#d97706' }
                }
                transition={
                  loading
                    ? { backgroundColor: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } }
                    : { backgroundColor: { duration: 0.3 }, type: 'spring', stiffness: 500, damping: 30 }
                }
                whileHover={!loading ? { backgroundColor: '#b45309' } : {}}
                whileTap={!loading ? { scale: 0.96 } : {}}
                className="w-full text-white font-semibold py-3 px-8 rounded-full"
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
              className="mt-10 flex flex-col items-center gap-3 text-white"
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
        <section ref={itineraryRef} className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-6 py-20">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Your Itinerary
            </h2>
            <motion.div
              key={itineraryVersion}
              className="space-y-6"
              variants={cardContainer}
              initial="hidden"
              animate="visible"
            >
              {itinerary.map((day) => {
                const isExpanded = expandedDays.has(day.day)
                const prevDay = previousItinerary?.find(d => d.day === day.day) ?? null
                const changed = {
                  morning:       prevDay !== null && prevDay.morning       !== day.morning,
                  afternoon:     prevDay !== null && prevDay.afternoon     !== day.afternoon,
                  evening:       prevDay !== null && prevDay.evening       !== day.evening,
                  estimatedCost: prevDay !== null && prevDay.estimatedCost !== day.estimatedCost,
                }
                const anyChanged = Object.values(changed).some(Boolean)
                return (
                  <motion.div
                    key={day.day}
                    variants={cardItem}
                    className="bg-slate-800 border border-slate-700 rounded-2xl shadow-lg overflow-hidden"
                  >
                    {/* Clickable header */}
                    <button
                      onClick={() => toggleDay(day.day)}
                      className="w-full bg-slate-700/50 px-6 py-4 flex items-center justify-between text-left hover:bg-slate-700/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-white font-bold text-lg">Day {day.day}</p>
                          <p className="text-slate-400 text-sm">{formatDate(day.date)}</p>
                        </div>
                        {anyChanged && (
                          <span className="text-xs font-semibold text-sky-400 bg-sky-400/10 border border-sky-400/30 px-2 py-0.5 rounded-full">
                            Updated
                          </span>
                        )}
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 0 : -90 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                      >
                        <ChevronDown size={18} className="text-slate-400" />
                      </motion.div>
                    </button>

                    {/* Collapsible body */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          style={{ overflow: 'hidden' }}
                        >
                          <motion.div
                            className="divide-y divide-slate-700"
                            initial="hidden"
                            animate="visible"
                            variants={{
                              hidden: {},
                              visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
                            }}
                          >
                            {[
                              { label: 'Morning',   content: day.morning,   color: 'text-amber-400', Icon: CloudSun, key: 'morning'   as const },
                              { label: 'Afternoon', content: day.afternoon, color: 'text-sky-400',   Icon: Sun,      key: 'afternoon' as const },
                              { label: 'Evening',   content: day.evening,   color: 'text-indigo-400',Icon: MoonStar, key: 'evening'   as const },
                            ].map(({ label, content, color, Icon, key }) => (
                              <motion.div key={label} variants={rowVariants} className="px-6 py-4">
                                <div className={`flex items-center gap-1.5 mb-1 ${color}`}>
                                  <Icon size={13} strokeWidth={2.5} />
                                  <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
                                </div>
                                <p className={`text-sm leading-relaxed ${changed[key] ? 'text-white font-bold' : 'text-slate-200'}`}>{content}</p>
                              </motion.div>
                            ))}
                          </motion.div>
                          {/* Estimated daily cost footer */}
                          <div className="px-6 py-3 bg-slate-900/50 border-t border-slate-700 flex justify-between items-center">
                            <p className="text-xs font-medium text-slate-400">Estimated daily cost</p>
                            <p className={`text-sm text-amber-400 ${changed.estimatedCost ? 'font-extrabold' : 'font-semibold'}`}>£{day.estimatedCost ?? '—'}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </motion.div>

            {/* Budget vs actual summary */}
            {(() => {
              const total = itinerary.reduce((sum, d) => sum + (d.estimatedCost ?? 0), 0)
              const budget = parseInt(form.budget) || 0
              const over = budget > 0 && total > budget
              return (
                <div className="mt-4 bg-slate-800 border border-slate-700 rounded-2xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-semibold text-slate-200">Total estimated cost</p>
                    <p className={`font-bold text-lg ${over ? 'text-red-400' : 'text-amber-400'}`}>£{total}</p>
                  </div>
                  {budget > 0 && (
                    <>
                      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden mb-1.5">
                        <motion.div
                          className={`h-2 rounded-full ${over ? 'bg-red-400' : 'bg-amber-500'}`}
                          initial={{ width: '0%' }}
                          whileInView={{ width: `${Math.min((total / budget) * 100, 100)}%` }}
                          viewport={{ once: false, amount: 0.5 }}
                          transition={{ duration: 1.5, ease: 'easeOut' as const, delay: 0.3 }}
                        />
                      </div>
                      <p className="text-xs text-right text-white">
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
              className="mt-8 w-full border-2 border-sky-400 text-sky-400 hover:bg-sky-400 hover:text-white disabled:opacity-40 font-semibold py-3 px-8 rounded-full transition-colors"
            >
              Regenerate Itinerary
            </motion.button>

            {/* ── Chat section ── */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-semibold text-sky-400">Refine Your Itinerary</h3>
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
              <p className="text-sm text-slate-400 mb-4">
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
                  className="flex-1 border border-slate-600 bg-slate-800 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-900"
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
      <footer className="bg-black text-gray-400 py-6 px-6">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <span className="text-gray-300 font-medium">Aaron Leung</span>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/aaron99leung/fantasy-travel-guide"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/aaronleungkachun/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M20.447 20.452H16.89v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a1.98 1.98 0 01-1.979-1.98 1.98 1.98 0 011.979-1.98 1.98 1.98 0 011.979 1.98 1.98 1.98 0 01-1.979 1.98zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
