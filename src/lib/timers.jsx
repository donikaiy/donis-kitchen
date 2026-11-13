import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { toast } from './store'

const TimerCtx = createContext(null)

// "25 минути", "1 час", "30 секунди", "10-15 мин"
const UNITS = 'часа|час|ч\\.|минути|минута|мин\\.?|секунди|секунда|сек\\.?'
export const TIMER_RE = new RegExp(`(\\d+)(?:\\s*[-–]\\s*(\\d+))?\\s*(${UNITS})(?![а-яА-Я])`, 'gi')

export function unitSeconds(unit) {
  const u = unit.toLowerCase()
  if (u.startsWith('ч')) return 3600
  if (u.startsWith('с')) return 1
  return 60
}

function beep() {
  try {
    const ctx = new AudioContext()
    ;[0, 0.35, 0.7].forEach(t => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = 880
      g.gain.setValueAtTime(0.25, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3)
      o.connect(g).connect(ctx.destination)
      o.start(ctx.currentTime + t)
      o.stop(ctx.currentTime + t + 0.3)
    })
  } catch {
    /* няма звук */
  }
}

export function TimerProvider({ children }) {
  const [timers, setTimers] = useState([])
  const [now, setNow] = useState(Date.now())
  const fired = useRef(new Set())

  const running = timers.some(t => !t.paused && !t.done)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    for (const t of timers) {
      if (!t.paused && !t.done && t.endsAt <= now && !fired.current.has(t.id)) {
        fired.current.add(t.id)
        beep()
        navigator.vibrate?.([300, 100, 300])
        toast(`Времето изтече: ${t.label}`, '⏰')
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('⏰ Таймерът изтече', { body: t.label })
        }
        setTimers(ts => ts.map(x => (x.id === t.id ? { ...x, done: true } : x)))
      }
    }
  }, [now, timers])

  const start = useCallback((seconds, label) => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()
    const id = crypto.randomUUID()
    setNow(Date.now())
    setTimers(ts => [...ts, { id, label, total: seconds, endsAt: Date.now() + seconds * 1000, paused: false, remaining: seconds * 1000, done: false }])
    toast(`Таймер: ${label}`, '⏱️')
  }, [])

  const togglePause = useCallback(id => {
    setTimers(ts =>
      ts.map(t => {
        if (t.id !== id) return t
        if (t.paused) return { ...t, paused: false, endsAt: Date.now() + t.remaining }
        return { ...t, paused: true, remaining: Math.max(0, t.endsAt - Date.now()) }
      }),
    )
  }, [])

  const addMinute = useCallback(id => {
    fired.current.delete(id)
    setTimers(ts =>
      ts.map(t => {
        if (t.id !== id) return t
        const base = t.done ? Date.now() : t.endsAt
        return { ...t, done: false, total: t.total + 60, endsAt: base + 60000, remaining: t.remaining + 60000 }
      }),
    )
  }, [])

  const remove = useCallback(id => setTimers(ts => ts.filter(t => t.id !== id)), [])

  const left = t => (t.done ? 0 : t.paused ? t.remaining : Math.max(0, t.endsAt - now)) / 1000

  return <TimerCtx.Provider value={{ timers, start, togglePause, addMinute, remove, left }}>{children}</TimerCtx.Provider>
}

export const useTimers = () => useContext(TimerCtx)

export function formatClock(sec) {
  sec = Math.ceil(sec)
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const pad = n => String(n).padStart(2, '0')
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
