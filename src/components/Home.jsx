import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES } from '../categories'
import { formatTime, img, RECIPES, searchScore } from '../lib/recipes'
import { go } from '../lib/router'
import RecipeCard, { Difficulty } from './RecipeCard'

const TIME_FILTERS = [
  { value: 0, label: 'Всяко време' },
  { value: 30, label: 'До 30 мин' },
  { value: 60, label: 'До 1 час' },
]
const LEVELS = ['Лесно', 'Средно', 'Трудно']
const SORTS = {
  az: { label: 'А → Я', fn: (a, b) => a.title.localeCompare(b.title, 'bg') },
  fast: { label: 'Най-бързи', fn: (a, b) => a.time - b.time },
  few: { label: 'Най-малко продукти', fn: (a, b) => count(a) - count(b) },
}
const UNITS = new Set(['малко', 'смесена', 'стъбла', 'стъбло', 'зелени', 'щипки', 'фина', 'фин', 'клонки', 'клонка', 'зърна', 'непълна', 'ч.ч.', 'студено', 'студена', 'пресни', 'течна', 'готварска', 'пакетчета', 'пакетче', 'кубчета', 'кубче', 'цели', 'неподсладен', 'неподсладена', 'връзка', 'връзки', 'големи', 'краве', 'пресен', 'пресна', 'настърган', 'настъргано', 'смляно', 'смляна', 'голям', 'сух', 'сухи', 'равна', 'равни', 'домашни', 'сладък', 'средни', 'около', 'сушен', 'сушена', 'смлян', 'смляна', 'кофичка', 'кофички', 'ситно', 'нарязан', 'нарязана', 'нарязани', 'топла', 'гореща', 'разтопено', 'разтопен', 'няколко', 'капки', 'капка', 'голяма', 'голям', 'среден', 'средна', 'малка', 'малък', 'г', 'кг', 'мл', 'л', 'с.л.', 'ч.л.', 'бр.', 'бр', 'скилидки', 'скилидка', 'глава', 'глави', 'щипка', 'шепи', 'шепа', 'парче', 'консерва', 'стрък', 'филии', 'филия', 'шушулка', 'чаша', 'чаши'])

const count = r => r.ingredients.reduce((n, g) => n + g.items.length, 0)
const stem = w => w.toLowerCase().trim().slice(0, Math.max(3, w.trim().length - 2))

// "сол и черен пипер на вкус" -> ["сол", "черен пипер"]; "1 парче джинджифил (около 2 см)" -> ["джинджифил"]
function ingredientNames(ing) {
  const words = ing.rest
    .replace(/\(.*?\)/g, '')
    .replace(/\s+(на вкус|по желание|за поднасяне)\s*$/i, '')
    .split(/\s+/)
    .filter(Boolean)
  while (words.length > 1 && UNITS.has(words[0])) words.shift()
  const parts = words
    .join(' ')
    .split(/\s+(?:и|или)\s+|,\s*/)
    .map(n => n.trim().replace(/[,.]$/, ''))
    .filter(Boolean)
  // "кафява или бяла захар" -> "кафява захар", "бяла захар"
  const noun = parts.at(-1)?.split(' ').at(-1)
  return parts.map(p => (!p.includes(' ') && p !== noun && parts.at(-1).includes(' ') ? `${p} ${noun}` : p))
}

// Различни форми на един продукт: "морков"/"моркова", "картоф"/"картофи", "жълтък"/"жълтъка".
const ALIASES = { белтъка: 'белтъци', белтък: 'белтъци', жълтъка: 'жълтъци', жълтък: 'жълтъци', яйце: 'яйца', 'цяло яйце': 'яйца' }
const ingredientKey = name =>
  name
    .toLowerCase()
    .split(' ')
    .map(w => w.replace(/(ът|ят|та|то|те)$/, '').replace(/[аяиоеъ]$/, ''))
    .join(' ')

// Продуктите, подредени по това в колко рецепти се срещат.
const ALL_INGREDIENTS = (() => {
  const groups = new Map()
  for (const r of RECIPES) {
    const names = new Set(r.ingredients.flatMap(g => g.items.flatMap(ingredientNames)).map(n => ALIASES[n.toLowerCase()] ?? n))
    const seen = new Set()
    for (const n of names) {
      const key = ingredientKey(n)
      const g = groups.get(key) ?? { names: new Map(), recipes: 0 }
      g.names.set(n, (g.names.get(n) ?? 0) + 1)
      if (!seen.has(key)) g.recipes++
      seen.add(key)
      groups.set(key, g)
    }
  }
  return [...groups.values()]
    .map(g => ({ name: [...g.names].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0][0], recipes: g.recipes }))
    .sort((a, b) => b.recipes - a.recipes || a.name.localeCompare(b.name, 'bg'))
    .map(x => x.name)
})()
const POPULAR_COUNT = 12

function fridgeMatch(recipe, fridge) {
  const items = recipe.ingredients.flatMap(g => g.items)
  const have = items.filter(i => fridge.some(f => i.text.toLowerCase().includes(stem(f)))).length
  return { have, total: items.length }
}

export default function Home({ initialCategory = 'all' }) {
  const [category, setCategory] = useState(initialCategory)
  const [query, setQuery] = useState('')
  const [maxTime, setMaxTime] = useState(0)
  const [levels, setLevels] = useState([])
  const [sort, setSort] = useState('az')
  const [fridgeOpen, setFridgeOpen] = useState(false)
  const [fridge, setFridge] = useState([])
  const [fridgeInput, setFridgeInput] = useState('')

  const counts = useMemo(() => Object.fromEntries(CATEGORIES.map(c => [c.slug, RECIPES.filter(r => r.category.slug === c.slug).length])), [])

  const results = useMemo(() => {
    let list = RECIPES.filter(
      r =>
        (category === 'all' || r.category.slug === category) &&
        (!maxTime || r.time <= maxTime) &&
        (!levels.length || levels.includes(r.difficulty)) &&
        searchScore(r, query) > 0,
    ).map(r => ({ recipe: r, match: fridge.length ? fridgeMatch(r, fridge) : null }))
    if (fridge.length) {
      list = list.filter(x => x.match.have > 0).sort((a, b) => b.match.have / b.match.total - a.match.have / a.match.total)
    } else list.sort((a, b) => SORTS[sort].fn(a.recipe, b.recipe))
    return list
  }, [category, query, maxTime, levels, sort, fridge])

  const activeFilters = (category !== 'all') + !!query + !!maxTime + levels.length + fridge.length
  const reset = () => {
    setCategory('all')
    setQuery('')
    setMaxTime(0)
    setLevels([])
    setFridge([])
  }

  const pickCategory = slug => {
    setCategory(slug)
    history.replaceState(history.state, '', slug === 'all' ? '#/' : `#/category/${slug}`)
  }

  const addFridge = name => {
    const n = name.trim()
    if (n && !fridge.includes(n)) setFridge(f => [...f, n])
    setFridgeInput('')
  }

  return (
    <main className="home">
      <Hero query={query} setQuery={setQuery} />

      <section className="section">
        <div className="section-head">
          <h2>Категории</h2>
          <span className="muted">
            {RECIPES.length} {RECIPES.length === 1 ? 'рецепта' : 'рецепти'} общо
          </span>
        </div>
        <div className="categories" role="tablist">
          <button type="button" role="tab" aria-selected={category === 'all'} className={`cat-tile ${category === 'all' ? 'active' : ''}`} style={{ '--cat': 'var(--accent)' }} onClick={() => pickCategory('all')}>
            <span className="cat-emoji">🍽️</span>
            <strong>Всички</strong>
            <small>{RECIPES.length}</small>
          </button>
          {CATEGORIES.map(c => (
            <button
              type="button"
              role="tab"
              aria-selected={category === c.slug}
              key={c.slug}
              className={`cat-tile ${category === c.slug ? 'active' : ''} ${counts[c.slug] ? '' : 'empty'}`}
              style={{ '--cat': c.color }}
              onClick={() => pickCategory(c.slug)}
            >
              <span className="cat-emoji">{c.emoji}</span>
              <strong>{c.name}</strong>
              <small>{counts[c.slug] || 'скоро'}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="section" id="recipes">
        <div className="toolbar">
          <div className="chips">
            {TIME_FILTERS.map(t => (
              <button type="button" key={t.value} className={`chip ${maxTime === t.value ? 'on' : ''}`} onClick={() => setMaxTime(t.value)}>
                {t.label}
              </button>
            ))}
            <span className="chip-sep" />
            {LEVELS.map(l => (
              <button type="button" key={l} className={`chip ${levels.includes(l) ? 'on' : ''}`} onClick={() => setLevels(ls => (ls.includes(l) ? ls.filter(x => x !== l) : [...ls, l]))}>
                {l}
              </button>
            ))}
            <span className="chip-sep" />
            <button type="button" className={`chip fridge-chip ${fridgeOpen || fridge.length ? 'on' : ''}`} onClick={() => setFridgeOpen(o => !o)}>
              🧊 Какво има в хладилника?
            </button>
          </div>
          <label className="sort">
            <span>Подреди:</span>
            <select value={sort} onChange={e => setSort(e.target.value)} disabled={fridge.length > 0}>
              {Object.entries(SORTS).map(([k, s]) => (
                <option key={k} value={k}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {fridgeOpen && (
          <div className="fridge">
            <p>
              Добавете продуктите, които имате, и ще ви покажем какво можете да сготвите. <span className="muted">Подредено по съвпадение.</span>
            </p>
            <div className="fridge-input">
              {fridge.map(f => (
                <span key={f} className="tag">
                  {f}
                  <button type="button" onClick={() => setFridge(fr => fr.filter(x => x !== f))} aria-label={`Премахни ${f}`}>
                    ✕
                  </button>
                </span>
              ))}
              <input
                value={fridgeInput}
                onChange={e => setFridgeInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addFridge(fridgeInput)
                  } else if (e.key === 'Backspace' && !fridgeInput) setFridge(f => f.slice(0, -1))
                }}
                placeholder={fridge.length ? 'Още…' : 'напр. тиква, лук, сметана'}
              />
            </div>
            <FridgeSuggestions fridge={fridge} input={fridgeInput} onAdd={addFridge} />
          </div>
        )}

        <div className="results-head">
          <span>
            <strong>{results.length}</strong> {results.length === 1 ? 'рецепта' : 'рецепти'}
          </span>
          {activeFilters > 0 && (
            <button type="button" className="link-btn" onClick={reset}>
              Изчисти филтрите ({activeFilters})
            </button>
          )}
        </div>

        {results.length ? (
          <div className="grid">
            {results.map(({ recipe, match }, i) => (
              <RecipeCard key={recipe.slug} recipe={recipe} index={i} match={match} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-emoji">🥄</div>
            <h3>Тук още няма рецепти</h3>
            <p>Опитайте с други филтри или изберете друга категория.</p>
            <button type="button" className="btn" onClick={reset}>
              Покажи всички
            </button>
          </div>
        )}
      </section>
    </main>
  )
}

function Hero({ query, setQuery }) {
  const featured = RECIPES.slice(0, 5)
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || featured.length < 2) return
    const id = setInterval(() => setIdx(i => (i + 1) % featured.length), 5000)
    return () => clearInterval(id)
  }, [paused, featured.length])

  const r = featured[idx]
  const hour = new Date().getHours()
  const greeting = hour < 11 ? 'Добро утро' : hour < 18 ? 'Добър ден' : 'Добър вечер'

  return (
    <section className="hero">
      <div className="hero-text">
        <span className="eyebrow">👋 {greeting}! Какво ще готвим днес?</span>
        <h1>
          Гответе с <span className="scribble">удоволствие</span>, стъпка по стъпка.
        </h1>
        <p className="lead">Рецепти с таймери, мащабиране на порциите и списък за пазаруване.</p>
        <form
          className="hero-search"
          onSubmit={e => {
            e.preventDefault()
            document.getElementById('recipes')?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          <span aria-hidden>🔍</span>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Мусака, тирамису, супа…" aria-label="Търсене" />
          {query && (
            <button type="button" className="clear" onClick={() => setQuery('')} aria-label="Изчисти">
              ✕
            </button>
          )}
          <button type="submit" className="btn">
            Търси
          </button>
        </form>
        <Surprise />
      </div>

      {r && (
        <div className="featured" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          {featured.map((f, i) => (
            <img key={f.slug} src={img(f.image, 1100)} alt="" className={i === idx ? 'show' : ''} aria-hidden={i !== idx} />
          ))}
          <a href={`#/recipe/${r.slug}`} className="featured-card" key={r.slug}>
            <span className="featured-label">⭐ Препоръчано</span>
            <h3>{r.title}</h3>
            <div className="card-meta">
              <span>⏱ {formatTime(r.time)}</span>
              <span>👤 {r.servings}</span>
              <Difficulty level={r.difficulty} />
            </div>
          </a>
          {featured.length > 1 && (
            <div className="dots">
              {featured.map((f, i) => (
                <button type="button" key={f.slug} className={i === idx ? 'on' : ''} onClick={() => setIdx(i)} aria-label={f.title} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

// „Изненадай ме“: първо пита за категория, после отваря случайна рецепта от нея.
function Surprise() {
  const [open, setOpen] = useState(false)
  const [rolling, setRolling] = useState(null)
  const ref = useRef(null)
  const options = [
    { slug: 'all', name: 'Каквото и да е', emoji: '🍽️', recipes: RECIPES },
    ...CATEGORIES.map(c => ({ ...c, recipes: RECIPES.filter(r => r.category.slug === c.slug) })).filter(c => c.recipes.length),
  ]

  useEffect(() => {
    if (!open) return
    const onDown = e => !ref.current?.contains(e.target) && setOpen(false)
    const onKey = e => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = option => {
    setRolling(option.slug)
    setTimeout(() => {
      const r = option.recipes[Math.floor(Math.random() * option.recipes.length)]
      go(`/recipe/${r.slug}`)
    }, 550)
  }

  return (
    <div className="surprise-wrap" ref={ref}>
      <button type="button" className={`surprise ${open ? 'open' : ''}`} onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className={`dice ${rolling ? 'rolling' : ''}`}>🎲</span> Изненадай ме
      </button>
      {open && (
        <div className="surprise-menu" role="menu">
          <p>От коя категория?</p>
          <div className="surprise-options">
            {options.map((o, i) => (
              <button
                type="button"
                role="menuitem"
                key={o.slug}
                className={`surprise-option ${rolling === o.slug ? 'picked' : ''}`}
                style={{ '--cat': o.color ?? 'var(--accent)', '--i': i }}
                disabled={!!rolling}
                onClick={() => pick(o)}
              >
                <span>{o.emoji}</span> {o.name}
                <small>{o.recipes.length}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FridgeSuggestions({ fridge, input, onAdd }) {
  const [showAll, setShowAll] = useState(false)
  const q = input.trim().toLowerCase()
  const available = ALL_INGREDIENTS.filter(n => !fridge.includes(n) && n.toLowerCase().includes(q))
  const limited = !q && !showAll
  const shown = limited ? available.slice(0, POPULAR_COUNT) : available
  return (
    <div className="fridge-suggest-wrap">
      <span className="muted small-label">{q ? 'Съвпадения:' : showAll ? 'Всички продукти:' : 'Най-често използвани:'}</span>
      <div className={`fridge-suggest ${showAll && !q ? 'expanded' : ''}`}>
        {shown.map(n => (
          <button type="button" key={n} className="chip small" onClick={() => onAdd(n)}>
            + {n}
          </button>
        ))}
        {!shown.length && <span className="muted">Няма такъв продукт в рецептите.</span>}
      </div>
      {!q && available.length > POPULAR_COUNT && (
        <button type="button" className="link-btn" onClick={() => setShowAll(v => !v)}>
          {showAll ? 'Покажи по-малко' : `Покажи всички (${available.length})`}
        </button>
      )}
    </div>
  )
}
