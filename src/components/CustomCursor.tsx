import { useEffect, useRef } from 'react'
import './CustomCursor.css'

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const cursor = cursorRef.current
    const label = labelRef.current
    if (!cursor || !label) return

    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let enabled = false
    let frame = 0
    let x = -100
    let y = -100
    let currentLabel = ''

    const syncAvailability = () => {
      enabled = pointer.matches && !reducedMotion.matches
      document.documentElement.classList.toggle('has-custom-cursor', enabled)
      if (!enabled) cursor.classList.remove('site-cursor--visible')
    }

    const paint = () => {
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`
      frame = 0
    }

    const onMove = (event: PointerEvent) => {
      if (!enabled || event.pointerType !== 'mouse') return
      x = event.clientX
      y = event.clientY
      if (!frame) frame = window.requestAnimationFrame(paint)

      const target = event.target instanceof Element ? event.target : null
      const native = Boolean(target?.closest('input, textarea, select, [contenteditable="true"]'))
      const interactive = Boolean(target?.closest('a, button, [role="tab"]'))
      const nextLabel = target?.closest<HTMLElement>('[data-cursor]')?.dataset.cursor ?? ''

      if (nextLabel !== currentLabel) {
        label.textContent = nextLabel
        currentLabel = nextLabel
      }

      cursor.classList.toggle('site-cursor--native', native)
      cursor.classList.toggle('site-cursor--interactive', interactive)
      cursor.classList.toggle('site-cursor--labeled', Boolean(nextLabel))
      cursor.classList.add('site-cursor--visible')
    }

    const onDown = () => cursor.classList.add('site-cursor--pressed')
    const onUp = () => cursor.classList.remove('site-cursor--pressed')
    const onLeave = () => cursor.classList.remove('site-cursor--visible')

    syncAvailability()
    pointer.addEventListener('change', syncAvailability)
    reducedMotion.addEventListener('change', syncAvailability)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    document.addEventListener('pointerleave', onLeave)

    return () => {
      document.documentElement.classList.remove('has-custom-cursor')
      window.cancelAnimationFrame(frame)
      pointer.removeEventListener('change', syncAvailability)
      reducedMotion.removeEventListener('change', syncAvailability)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <div ref={cursorRef} className="site-cursor" aria-hidden="true">
      <div className="site-cursor__ring">
        <span ref={labelRef} className="site-cursor__label" />
      </div>
    </div>
  )
}
