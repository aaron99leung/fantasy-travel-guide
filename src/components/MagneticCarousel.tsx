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
    src: '/images/marrakech.jpg',
    label: 'Marrakech',
    description: 'A labyrinth of souks, spice stalls, and rooftop terraces - Morocco\'s most intoxicating city',
  },
  {
    src: '/images/bukchon.jpg',
    label: 'Seoul',
    description: 'A living hanok village nestled between Seoul\'s palaces, where traditional Korea breathes on the streets of a modern metropolis',
  },
  {
    src: '/images/fukuoka.jpg',
    label: 'Fukuoka',
    description: 'Japan\'s most liveable city - famous for ramen, yatai street stalls, and a relaxed coastal energy',
  },
  {
    src: '/images/lauterbrunnen.jpg',
    label: 'Lauterbrunnen',
    description: 'Seventy-two waterfalls pour down sheer cliffs into a valley the Swiss Alps seem to have built for dreams',
  },
  {
    src: '/images/milos.jpg',
    label: 'Milos',
    description: 'Volcanic rock formations, chalky white villages, and some of the Aegean\'s most striking beaches',
  },
  {
    src: '/images/canyon.jpg',
    label: 'Grand Canyon',
    description: 'Vast carved walls of sandstone and silence - one of nature\'s most humbling landscapes',
  },
  {
    src: '/images/hong-kong.jpg',
    label: 'Hong Kong',
    description: 'A vertical city of dizzying skylines, dim sum mornings, and harbour lights that never dim',
  },
  {
    src: '/images/lapland.jpg',
    label: 'Lapland',
    description: 'Aurora-lit skies, frozen lakes, and reindeer trails through the world\'s quietest wilderness',
  },
  {
    src: '/images/portofino.jpg',
    label: 'Portofino',
    description: 'Pastel-coloured houses, bobbing yachts, and the unhurried pace of the Italian Riviera at its finest',
  },
  {
    src: '/images/siargao.jpg',
    label: 'Siargao',
    description: 'The surfing capital of the Philippines - coconut palms, cloud 9 breaks, and island-hopping by bangka',
  },
]

const DUR = 0.4
const EASE = 'cubic-bezier(0.44, 0, 0.56, 1)'
const OPEN_TRANSITION = `width ${DUR}s ${EASE}, height ${DUR}s ${EASE}, filter ${DUR}s ${EASE}, opacity ${DUR}s ${EASE}`

export default function MagneticCarousel({
  images = DEFAULT_IMAGES,
  collapsedWidth = 100,
  hoverWidth = 240,
  collapsedHeight = 420,
  hoverHeight = 520,
  openSize = 620,
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
