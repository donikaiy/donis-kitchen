import { useState } from 'react'
import { toast, useShopping } from '../lib/store'

export default function ShoppingPage() {
  const [items, setItems] = useShopping()
  const [text, setText] = useState('')

  const groups = items.reduce((acc, it) => {
    const key = it.recipeTitle || 'Други'
    ;(acc[key] ??= []).push(it)
    return acc
  }, {})
  const doneCount = items.filter(i => i.done).length

  const add = e => {
    e.preventDefault()
    if (!text.trim()) return
    setItems(list => [...list, { id: crypto.randomUUID(), text: text.trim(), recipe: null, recipeTitle: 'Други', done: false }])
    setText('')
  }

  const copy = async () => {
    const out = Object.entries(groups)
      .map(([g, list]) => `${g}:\n${list.map(i => `${i.done ? '☑' : '☐'} ${i.text}`).join('\n')}`)
      .join('\n\n')
    try {
      await navigator.clipboard.writeText(out)
      toast('Списъкът е копиран', '📋')
    } catch {
      toast('Копирането не успя', '⚠️')
    }
  }

  return (
    <main className="page narrow">
      <div className="page-head">
        <div>
          <h1>🛒 Списък за пазаруване</h1>
          <p className="muted">
            {items.length ? `${items.length - doneCount} оставащи · ${doneCount} взети` : 'Добавете продукти от някоя рецепта или ръчно.'}
          </p>
        </div>
        {items.length > 0 && (
          <div className="page-actions">
            <button type="button" className="btn ghost small" onClick={copy}>
              📋 Копирай
            </button>
            {doneCount > 0 && (
              <button type="button" className="btn ghost small" onClick={() => setItems(l => l.filter(i => !i.done))}>
                Махни взетите
              </button>
            )}
            <button
              type="button"
              className="btn ghost small danger"
              onClick={() => {
                if (confirm('Да изчистя ли целия списък?')) setItems([])
              }}
            >
              Изчисти
            </button>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="bar big">
          <div style={{ width: `${(doneCount / items.length) * 100}%` }} />
        </div>
      )}

      <form className="add-item" onSubmit={add}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Добави продукт, напр. 1 л мляко" />
        <button type="submit" className="btn">
          Добави
        </button>
      </form>

      {Object.entries(groups).map(([title, list]) => (
        <section key={title} className="panel shop-group">
          <div className="panel-head">
            <h3>
              {list[0].recipe ? <a href={`#/recipe/${list[0].recipe}`}>{title}</a> : title}
            </h3>
            <span className="pill">
              {list.filter(i => i.done).length}/{list.length}
            </span>
          </div>
          <ul>
            {list.map(it => (
              <li key={it.id} className="shop-item">
                <label className={`check ${it.done ? 'on' : ''}`}>
                  <input type="checkbox" checked={it.done} onChange={() => setItems(l => l.map(x => (x.id === it.id ? { ...x, done: !x.done } : x)))} />
                  <span className="box" aria-hidden />
                  <span className="ing-text">{it.text}</span>
                </label>
                <button type="button" className="remove" onClick={() => setItems(l => l.filter(x => x.id !== it.id))} aria-label="Премахни">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {!items.length && (
        <div className="empty-state">
          <div className="empty-emoji">🧺</div>
          <h3>Списъкът е празен</h3>
          <a className="btn" href="#/">
            Разгледай рецептите
          </a>
        </div>
      )}
    </main>
  )
}
