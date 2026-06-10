import { useRef, useEffect, useState } from 'react'
import './Preloader.css'

const PRELOADER_CMD = 'create-portfolio'

export default function Preloader({ onDone }: { onDone: () => void }) {
  const [cmdChars, setCmdChars] = useState(0)
  const [phase, setPhase] = useState<'typing' | 'output' | 'ready' | 'exiting'>('typing')
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCmdChars(PRELOADER_CMD.length)
      setPhase('ready')
    }
  }, [])

  useEffect(() => {
    if (phase !== 'typing') return
    if (cmdChars >= PRELOADER_CMD.length) {
      const t = setTimeout(() => setPhase('output'), 350)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setCmdChars(c => c + 1), 75)
    return () => clearTimeout(t)
  }, [phase, cmdChars])

  useEffect(() => {
    if (phase !== 'output') return
    const t = setTimeout(() => setPhase('ready'), 2000)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && phaseRef.current === 'ready') {
        setPhase('exiting')
        setTimeout(onDone, 480)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone])

  const handleClick = () => {
    if (phase !== 'ready') return
    setPhase('exiting')
    setTimeout(onDone, 480)
  }

  return (
    <div
      className={`preloader${phase === 'exiting' ? ' preloader--exit' : ''}`}
      onClick={handleClick}
      role="dialog"
      aria-label="Portfolio loading screen"
    >
      <div className="preloader__window">
        <div className="preloader__titlebar">
          <div className="preloader__dots">
            <span className="preloader__dot preloader__dot--red" />
            <span className="preloader__dot preloader__dot--yellow" />
            <span className="preloader__dot preloader__dot--green" />
          </div>
          <span className="preloader__wintitle">markian — bash</span>
        </div>

        <div className="preloader__content">
          <div className="preloader__prompt-line">
            <span className="preloader__user">markian</span>
            <span className="preloader__at">@</span>
            <span className="preloader__host">dev</span>
            <span className="preloader__sep">:</span>
            <span className="preloader__dir">~</span>
            <span className="preloader__dollar">$</span>
            <span className="preloader__cmd">&nbsp;{PRELOADER_CMD.slice(0, cmdChars)}</span>
            {phase === 'typing' && <span className="preloader__cursor" aria-hidden="true" />}
          </div>

          {phase !== 'typing' && (
            <div className="preloader__output-wrap">
              <p className="preloader__out preloader__out--1">Initializing portfolio...</p>
              <p className="preloader__out preloader__out--2"><span className="preloader__tick">✓</span> Projects loaded</p>
              <p className="preloader__out preloader__out--3"><span className="preloader__tick">✓</span> Essays synced</p>
              <p className="preloader__out preloader__out--4"><span className="preloader__tick">✓</span> Skills compiled</p>
            </div>
          )}

          {phase === 'ready' && (
            <>
              <div className="preloader__prompt-line preloader__prompt-line--second">
                <span className="preloader__user">markian</span>
                <span className="preloader__at">@</span>
                <span className="preloader__host">dev</span>
                <span className="preloader__sep">:</span>
                <span className="preloader__dir">~</span>
                <span className="preloader__dollar">$</span>
                <span className="preloader__cursor" aria-hidden="true" />
              </div>
              <p className="preloader__enter">Press ENTER to launch →</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
