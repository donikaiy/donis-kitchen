import { useEffect, useMemo, useRef, useState } from 'react'
import { img, RECIPES, searchScore } from '../lib/recipes'
import { go } from '../lib/router'

export default function SearchPalette({ onClose }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const results = useMemo(() => {
    return RECIPES.map(r => ({ r, score: searchScore(r, q) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score || a.r.title.localeCompare(b.r.title, 'bg'))
      .map(x => x.r)
  }, [q])

  useEffect(() => inputRef.current?.focus(), [])
  useEffect(() => setSel(0), [q])
  useEffect(() => {
    listRef.current?.children[sel]?.scrollIntoView({ block: 'nearest' })
  }, [sel])

  const open = r => {
    onClose()
    go(`/recipe/${r.slug}`)
  }

  const onKey = e => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSel(s => Math.min(s + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSel(s => Math.max(s - 1, 0))
    } else if (e.key === 'Enter' && results[sel]) open(results[sel])
    else if (e.key === 'Escape') onClose()
  }

  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div className="palette" onMouseDown={e => e.stopPropagation()} role="dialog" aria-label="Търсене">
        <div className="palette-input">
          <span aria-hidden>🔍</span>
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey} placeholder="Търси рецепта…" />
          <kbd>Esc</kbd>
        </div>
        <ul ref={listRef} className="palette-list">
          {results.map((r, i) => (
            <li key={r.slug}>
              <button type="button" className={i === sel ? 'sel' : ''} onMouseEnter={() => setSel(i)} onClick={() => open(r)}>
                <img src={img(r.image, 120)} alt="" />
                <span>
                  <strong>{r.title}</strong>
                  <small>
                    {r.category.emoji} {r.category.name} · {r.time} мин
                  </small>
                </span>
                <span className="palette-go">↵</span>
              </button>
            </li>
          ))}
          {!results.length && <li className="palette-empty">Няма намерени рецепти за „{q}“ 🤷</li>}
        </ul>
        <div className="palette-foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> избор
          </span>
          <span>
            <kbd>↵</kbd> отвори
          </span>
        </div>
      </div>
    </div>
  )
}
