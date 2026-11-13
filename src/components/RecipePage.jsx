import { useEffect, useMemo, useState } from 'react'
import { formatTime, getRecipe, img, RECIPES } from '../lib/recipes'
import { scaledText } from '../lib/quantity'
import { toast, useChecked, useShopping } from '../lib/store'
import RecipeCard, { Difficulty } from './RecipeCard'
import StepText from './StepText'

export default function RecipePage({ slug }) {
  const recipe = getRecipe(slug)
  const [servings, setServings] = useState(recipe?.servings ?? 1)
  const [checkedAll, setCheckedAll] = useChecked()
  const [, setShopping] = useShopping()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - innerHeight
      setProgress(h > 0 ? scrollY / h : 0)
    }
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (recipe) document.title = `${recipe.title} · Doni’s Kitchen`
    return () => {
      document.title = 'Doni’s Kitchen · Рецепти'
    }
  }, [recipe])

  if (!recipe) {
    return (
      <main className="empty-state page">
        <div className="empty-emoji">🍳</div>
        <h3>Рецептата не е намерена</h3>
        <a className="btn" href="#/">
          Към всички рецепти
        </a>
      </main>
    )
  }

  const factor = servings / recipe.servings
  const state = checkedAll[slug] ?? { ing: [], steps: [] }
  const setState = fn => setCheckedAll(all => ({ ...all, [slug]: fn(all[slug] ?? { ing: [], steps: [] }) }))
  const toggleIn = (key, id) => setState(s => ({ ...s, [key]: s[key].includes(id) ? s[key].filter(x => x !== id) : [...s[key], id] }))

  const totalIng = recipe.ingredients.reduce((n, g) => n + g.items.length, 0)
  const doneSteps = state.steps.length
  const nextStep = recipe.steps.findIndex((_, i) => !state.steps.includes(i))

  const addToShopping = () => {
    const items = recipe.ingredients.flatMap((g, gi) =>
      g.items
        .filter((_, ii) => !state.ing.includes(`${gi}-${ii}`))
        .map(i => {
          const s = scaledText(i, factor)
          return { id: crypto.randomUUID(), text: `${s.qty} ${s.rest}`.trim(), recipe: recipe.slug, recipeTitle: recipe.title, done: false }
        }),
    )
    setShopping(list => [...list.filter(x => x.recipe !== recipe.slug || x.done), ...items])
    toast(`${items.length} продукта добавени в списъка`, '🛒')
  }

  const share = async () => {
    const data = { title: recipe.title, text: recipe.description, url: location.href }
    try {
      if (navigator.share) await navigator.share(data)
      else {
        await navigator.clipboard.writeText(location.href)
        toast('Линкът е копиран', '🔗')
      }
    } catch {
      /* отказано */
    }
  }

  return (
    <main className="recipe" style={{ '--cat': recipe.category.color }}>
      <div className="read-progress" style={{ transform: `scaleX(${progress})` }} />

      <section className="recipe-hero">
        <img src={img(recipe.image, 1800)} alt={recipe.title} />
        <div className="recipe-hero-overlay" />
        <div className="recipe-hero-content">
          <nav className="crumbs">
            <a href="#/">Рецепти</a> <span>›</span> <a href={`#/category/${recipe.category.slug}`}>{recipe.category.emoji} {recipe.category.name}</a>
          </nav>
          <h1>{recipe.title}</h1>
          <p>{recipe.description}</p>
          {recipe.source && (
            <a className="source-link" href={recipe.source} target="_blank" rel="noopener">
              📖 Източник: {new URL(recipe.source).hostname.replace(/^www\./, '')} ↗
            </a>
          )}
          <div className="hero-actions">
            <button type="button" className="icon-btn glass" onClick={share} aria-label="Сподели" title="Сподели">
              🔗
            </button>
            <button type="button" className="icon-btn glass" onClick={() => print()} aria-label="Печат" title="Печат">
              🖨️
            </button>
          </div>
        </div>
      </section>

      <div className="stats">
        <Stat icon="🔪" label="Подготовка" value={formatTime(recipe.prep)} />
        <Stat icon="🔥" label="Готвене" value={formatTime(recipe.cook)} />
        <Stat icon="⏱" label="Общо" value={formatTime(recipe.time)} />
        <Stat icon="👤" label="Порции" value={servings} />
        <Stat icon="📊" label="Трудност" value={<Difficulty level={recipe.difficulty} />} />
      </div>

      <div className="recipe-layout">
        <aside className="ingredients panel">
          <div className="panel-head">
            <h2>Продукти</h2>
            <span className="pill">
              {state.ing.length}/{totalIng}
            </span>
          </div>

          <div className="servings">
            <span>Порции</span>
            <div className="stepper">
              <button type="button" onClick={() => setServings(s => Math.max(1, s - 1))} aria-label="По-малко порции">
                −
              </button>
              <output key={servings}>{servings}</output>
              <button type="button" onClick={() => setServings(s => Math.min(99, s + 1))} aria-label="Повече порции">
                +
              </button>
            </div>
            {servings !== recipe.servings && (
              <button type="button" className="link-btn" onClick={() => setServings(recipe.servings)}>
                нулирай
              </button>
            )}
          </div>

          {recipe.ingredients.map((g, gi) => (
            <div key={gi} className="ing-group">
              {g.name && <h4>{g.name}</h4>}
              <ul>
                {g.items.map((item, ii) => {
                  const id = `${gi}-${ii}`
                  const on = state.ing.includes(id)
                  const s = scaledText(item, factor)
                  return (
                    <li key={id}>
                      <label className={`check ${on ? 'on' : ''}`}>
                        <input type="checkbox" checked={on} onChange={() => toggleIn('ing', id)} />
                        <span className="box" aria-hidden />
                        <span className="ing-text">
                          {s.qty && <strong key={s.qty}>{s.qty}</strong>} {s.rest}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}

          <div className="panel-actions">
            <button type="button" className="btn btn-block" onClick={addToShopping}>
              🛒 Добави в списъка за пазаруване
            </button>
            {state.ing.length > 0 && (
              <button type="button" className="link-btn" onClick={() => setState(s => ({ ...s, ing: [] }))}>
                Размаркирай всички
              </button>
            )}
          </div>
        </aside>

        <div className="recipe-main">
          {recipe.intro.trim() && <div className="prose intro" dangerouslySetInnerHTML={{ __html: recipe.intro }} />}

          <div className="steps-head">
            <h2>Приготвяне</h2>
            <div className="steps-progress">
              <div className="bar">
                <div style={{ width: `${(doneSteps / recipe.steps.length) * 100 || 0}%` }} />
              </div>
              <span>
                {doneSteps}/{recipe.steps.length}
              </span>
            </div>
          </div>
          <p className="hint">Натиснете стъпка, за да я отбележите. Натиснете ⏱ за таймер.</p>

          <ol className="steps">
            {recipe.steps.map((step, i) => {
              const done = state.steps.includes(i)
              const groupStart = step.group && step.group !== recipe.steps[i - 1]?.group
              return [
                groupStart && (
                  <li key={`g${i}`} className="step-group" aria-hidden>
                    {step.group}
                  </li>
                ),
                <li
                  key={i}
                  className={`step ${done ? 'done' : ''} ${i === nextStep ? 'current' : ''}`}
                  onClick={() => toggleIn('steps', i)}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggleIn('steps', i))}
                  tabIndex={0}
                  role="checkbox"
                  aria-checked={done}
                >
                  <span className="step-num">{done ? '✓' : i + 1}</span>
                  <div className="step-text">
                    <StepText text={step.text} label={step.group ? `${step.group} · стъпка ${i + 1}` : `Стъпка ${i + 1}`} />
                  </div>
                </li>,
              ]
            })}
          </ol>

          {doneSteps === recipe.steps.length && recipe.steps.length > 0 && (
            <div className="done-banner">
              <span>🎉</span>
              <div>
                <strong>Браво! Готово е.</strong>
                <p>Добър апетит!</p>
              </div>
              <button type="button" className="link-btn" onClick={() => setState(s => ({ ...s, steps: [] }))}>
                Започни отначало
              </button>
            </div>
          )}

          {recipe.extras.map(x => (
            <section key={x.title} className="extra">
              <h2>{x.title}</h2>
              <div className="prose" dangerouslySetInnerHTML={{ __html: x.html }} />
            </section>
          ))}

        </div>
      </div>

      <Related recipe={recipe} />

    </main>
  )
}

function Stat({ icon, label, value }) {
  return (
    <div className="stat">
      <span className="stat-icon">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  )
}

function Related({ recipe }) {
  const related = useMemo(() => {
    const others = RECIPES.filter(r => r.slug !== recipe.slug)
    return [...others.filter(r => r.category.slug === recipe.category.slug), ...others.filter(r => r.category.slug !== recipe.category.slug)].slice(0, 3)
  }, [recipe])
  if (!related.length) return null
  return (
    <section className="section related">
      <h2>Може да харесате още</h2>
      <div className="grid">
        {related.map((r, i) => (
          <RecipeCard key={r.slug} recipe={r} index={i} />
        ))}
      </div>
    </section>
  )
}
