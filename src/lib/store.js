import { useCallback, useSyncExternalStore } from 'react'

// Малко глобално хранилище върху localStorage, споделено между всички компоненти.
const listeners = new Set()
const cache = {}

function read(key, init) {
  if (!(key in cache)) {
    try {
      const raw = localStorage.getItem(key)
      cache[key] = raw ? JSON.parse(raw) : init
    } catch {
      cache[key] = init
    }
  }
  return cache[key]
}

function subscribe(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function usePersisted(key, init) {
  const value = useSyncExternalStore(subscribe, () => read(key, init))
  const set = useCallback(
    update => {
      const next = typeof update === 'function' ? update(read(key, init)) : update
      cache[key] = next
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {
        /* частен режим – пазим само в паметта */
      }
      listeners.forEach(l => l())
    },
    // init е литерал при всяко извикване; ключът е достатъчен
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  )
  return [value, set]
}

const EMPTY_LIST = []
const EMPTY_MAP = {}

export const useShopping = () => usePersisted('rc:shopping', EMPTY_LIST)
export const useChecked = () => usePersisted('rc:checked', EMPTY_MAP)

// Тостове
const toastListeners = new Set()
export function toast(message, icon = '✓') {
  toastListeners.forEach(l => l({ id: Math.random(), message, icon }))
}
export function onToast(cb) {
  toastListeners.add(cb)
  return () => toastListeners.delete(cb)
}
