import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'

interface Burst { id: number; x: number; y: number }
const colors = ['#879b89', '#b08a77', '#a2a5b1', '#b9aa86', '#66857a']
let nextId = 0

function FishBurst({ burst, onDone }: { burst: Burst; onDone: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 1350)
    return () => window.clearTimeout(timer)
  }, [onDone])
  return createPortal(
    <div className="fish-fireworks" aria-hidden="true" style={{ left: burst.x, top: burst.y }}>
      <span className="fish-fireworks-ring" />
      {Array.from({ length: 16 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 16
        const distance = i % 2 ? 100 : 145
        const x = Math.cos(angle) * distance
        const y = Math.sin(angle) * distance
        const style = {
          '--fish-x': `${x}px`, '--fish-y': `${y}px`,
          '--fish-mid-x': `${x * .58}px`, '--fish-mid-y': `${y * .58 - 14}px`,
          '--fish-rotation': `${(angle * 180) / Math.PI}deg`,
          '--fish-delay': `${(i % 4) * 22}ms`, color: colors[i % colors.length],
        } as CSSProperties
        return <span className="fish-fireworks-particle" style={style} key={i}>
          <svg viewBox="0 0 36 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M28 12C23 3 12 3 7 12c5 9 16 9 21 0Z" />
            <path d="m7 12-5-7v14l5-7ZM16 5l4-3 2 4M15 19l5 3 2-4" />
            <circle cx="23" cy="10" r="1" fill="currentColor" stroke="none" />
            <path d="M18 9c-2 2-2 4 0 6" />
          </svg>
        </span>
      })}
    </div>, document.body,
  )
}

export function useFishFireworks() {
  const [burst, setBurst] = useState<Burst | null>(null)
  const clear = useCallback(() => setBurst(null), [])
  const celebrate = useCallback((button: HTMLElement) => {
    if (!button.isConnected) return
    const rect = button.getBoundingClientRect()
    setBurst({ id: ++nextId, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
  }, [])
  return { celebrate, fireworks: burst ? <FishBurst key={burst.id} burst={burst} onDone={clear} /> : null }
}
