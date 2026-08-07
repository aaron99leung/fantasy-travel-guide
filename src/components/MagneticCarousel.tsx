'use client'

import { useEffect, useRef, useState } from 'react'

export interface CarouselImage {
  src: string
  label: string
  description?: string
}

interface Props {
  images?: CarouselImage[]
  collapsedWidth?: number
  hoverWidth?: number
  collapsedHeight?: number
  hoverHeight?: number
  openSize?: number
  gap?: number
  influence?: number
  blur?: number
}

const DEFAULT_IMAGES: CarouselImage[] = [
  {
    src: 'https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/612d1402-0ad9-4135-3bbc-a30a6a252b00/w=800',
    label: 'Tokyo',
    description: 'A city where ancient temples meet neon-lit streets — endlessly energetic, endlessly surprising.',
  },
  {
    src: 'https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/6d2ad64a-102d-4eab-0efe-31479e34b500/w=800',
    label: 'Bali',
    description: 'Terraced rice fields, sacred temples, and surf breaks — Indonesia\'s island of the gods.',
  },
  {
    src: 'https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/be854dd1-37aa-4fc7-f569-fdb948109300/w=800',
    label: 'Paris',
    description: 'The city of light, love, and impossibly good pastries. Every arrondissement tells a story.',
  },
  {
    src: 'https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/51984031-9176-484b-f5e0-4af9a8e9ed00/w=800',
    label: 'New York',
    description: 'Five boroughs, infinite neighbourhoods. The city that never sleeps and never runs out of things to do.',
  },
  {
    src: 'https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/34ce1842-4b7a-4d52-0302-38582c341700/w=800',
    label: 'Santorini',
    description: 'Whitewashed cliffs tumbling into a caldera, and sunsets that stop conversation mid-sentence.',
  },
  {
    src: 'https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/88369c6d-00cc-4ac9-74ca-0f0965e06300/w=800',
    label: 'Kyoto',
    description: 'Geisha districts, bamboo forests, and thousands of torii gates — Japan\'s cultural soul.',
  },
  {
    src: 'https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/aeaa0756-9647-4f6c-d900-204bd25e4a00/w=800',
    label: 'Maldives',
    description: 'Overwater bungalows, glass-clear lagoons, and coral reefs teeming with colour.',
  },
]

const DUR = 0.4
const EASE = 'cubic-bezier(0.44, 0, 0.56, 1)'
const OPEN_TRANSITION = `width ${DUR}s ${EASE}, height ${DUR}s ${EASE}, filter ${DUR}s ${EASE}, opacity ${DUR}s ${EASE}`

export default function MagneticCarousel({
  images = DEFAULT_IMAGES,
  collapsedWidth = 80,
  hoverWidth = 180,
  collapsedHeight = 320,
  hoverHeight = 380,
  openSize = 500,
  gap = 12,
  influence = 180,
  blur = 2,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [factors, setFactors] = useState<number[]>(() => images.map(() => 0))
  const [open, setOpen] = useState<number | null>(null)
  const [closing, setClosing] = useState(false)

  const targetRef = useRef<number[]>(images.map(() => 0))
  const curRef = useRef<number[]>(images.map(() => 0))
  const loopRef = useRef(0)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    targetRef.current = images.map(() => 0)
    curRef.current = images.map(() => 0)
    setFactors(images.map(() => 0))
  }, [images.length])

  useEffect(
    () => () => {
      cancelAnimationFrame(loopRef.current)
      if (closeTimer.current) clearTimeout(closeTimer.current)
    },
    []
  )

  function startLoop() {
    if (loopRef.current) return
    const step = () => {
      const tgt = targetRef.current
      const cur = curRef.current
      let moving = false
      for (let i = 0; i < cur.length; i++) {
        const d = (tgt[i] ?? 0) - cur[i]
        if (Math.abs(d) > 0.001) {
          cur[i] += d * 0.2
          moving = true
        } else {
          cur[i] = tgt[i] ?? 0
        }
      }
      setFactors([...cur])
      loopRef.current = moving ? requestAnimationFrame(step) : 0
    }
    loopRef.current = requestAnimationFrame(step)
  }

  function setTargetFromCursor(clientX: number) {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = clientX - rect.left
    const totalBase = images.length * collapsedWidth + (images.length - 1) * gap
    const startX = (rect.width - totalBase) / 2
    targetRef.current = images.map((_, i) => {
      const center = startX + i * (collapsedWidth + gap) + collapsedWidth / 2
      const dist = Math.abs(cx - center)
      const f = Math.max(0, 1 - dist / influence)
      return f * f * (3 - 2 * f) // smoothstep falloff
    })
    startLoop()
  }

  function onMove(e: React.MouseEvent) {
    if (open !== null) return
    setTargetFromCursor(e.clientX)
  }

  function onLeave() {
    if (open !== null) return
    targetRef.current = images.map(() => 0)
    startLoop()
  }

  function close() {
    targetRef.current = images.map(() => 0)
    curRef.current = images.map(() => 0)
    setFactors(images.map(() => 0))
    setClosing(true)
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setClosing(false), DUR * 1000)
    setOpen(null)
  }

  function sizeFor(i: number) {
    if (open !== null) {
      return i === open
        ? { width: openSize, height: openSize }
        : { width: collapsedWidth, height: collapsedHeight }
    }
    const f = factors[i] ?? 0
    return {
      width: collapsedWidth + (hoverWidth - collapsedWidth) * f,
      height: collapsedHeight + (hoverHeight - collapsedHeight) * f,
    }
  }

  const barTransition = open !== null || closing ? OPEN_TRANSITION : 'none'

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap,
        position: 'relative',
        overflow: 'visible',
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {/* Invisible backdrop — click anywhere outside open card to close */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: open !== null ? 'auto' : 'none',
        }}
        onClick={close}
      />

      {images.map((img, i) => {
        const { width, height } = sizeFor(i)
        const isOpen = open === i
        const blurred = open !== null && !isOpen

        return (
          <div
            key={i}
            onClick={(e) => {
              e.stopPropagation()
              if (isOpen) close()
              else setOpen(i)
            }}
            style={{
              flex: 'none',
              width,
              height,
              overflow: 'hidden',
              cursor: 'pointer',
              transition: barTransition,
              willChange: 'width, height',
              position: 'relative',
              zIndex: isOpen ? 3 : 2,
              filter: blurred ? `blur(${blur}px)` : 'none',
              opacity: blurred ? 0.55 : 1,
              backgroundImage: `url(${img.src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              borderRadius: 14,
              boxShadow: isOpen
                ? '0 20px 60px rgba(0,0,0,0.35)'
                : '0 4px 16px rgba(0,0,0,0.18)',
            }}
          >
            {/* Caption gradient overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: isOpen ? '40px 18px 18px' : '28px 8px 10px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)',
                opacity: isOpen ? 1 : 0,
                transition: `opacity ${DUR}s ${EASE}, padding ${DUR}s ${EASE}`,
              }}
            >
              <span
                style={{
                  display: 'block',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: isOpen ? 20 : 13,
                  letterSpacing: '0.02em',
                  textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  transition: barTransition !== 'none' ? `font-size ${DUR}s ${EASE}` : 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {img.label}
              </span>
              {img.description && (
                <span
                  style={{
                    display: 'block',
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: 15,
                    lineHeight: 1.6,
                    marginTop: 8,
                    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                    opacity: isOpen ? 1 : 0,
                    transition: `opacity ${DUR}s ${EASE} ${isOpen ? DUR * 0.6 : 0}s`,
                  }}
                >
                  {img.description}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
