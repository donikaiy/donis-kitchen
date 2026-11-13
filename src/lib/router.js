import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

// Позицията на скрола се пази за всеки запис в историята, за да може „Назад“
// да връща там, където е било. Новите страници се отварят най-горе.
const SCROLL_KEY = 'rc:scroll'
let positions = {}
try {
  positions = JSON.parse(sessionStorage.getItem(SCROLL_KEY)) ?? {}
} catch {
  /* няма sessionStorage */
}
const newKey = () => Math.random().toString(36).slice(2)

function ensureKey() {
  if (!history.state?.key) history.replaceState({ ...history.state, key: newKey() }, '')
  return history.state.key
}

function savePosition(key) {
  positions[key] = scrollY
  try {
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify(positions))
  } catch {
    /* няма sessionStorage */
  }
}

// Hash router с плавни View Transitions между страниците.
export function useRoute() {
  const [path, setPath] = useState(() => location.hash.slice(1) || '/')
  useEffect(() => {
    history.scrollRestoration = 'manual'
    let currentKey = ensureKey()
    // при презареждане на страницата
    if (positions[currentKey]) requestAnimationFrame(() => scrollTo({ top: positions[currentKey], behavior: 'instant' }))

    const onLeave = () => savePosition(currentKey)
    const onChange = () => {
      savePosition(currentKey)
      const returning = !!history.state?.key && history.state.key in positions
      currentKey = ensureKey()
      const update = () => {
        flushSync(() => setPath(location.hash.slice(1) || '/'))
        scrollTo({ top: returning ? positions[currentKey] : 0, behavior: 'instant' })
      }
      if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.startViewTransition(update)
      } else update()
    }
    addEventListener('hashchange', onChange)
    addEventListener('pagehide', onLeave)
    return () => {
      removeEventListener('hashchange', onChange)
      removeEventListener('pagehide', onLeave)
    }
  }, [])
  return path
}

export const go = path => {
  location.hash = path
}
