import YAML from 'yaml'
import { marked } from 'marked'
import { findCategory } from '../categories'
import { parseIngredient } from './quantity'

// Всеки .md файл в src/recipes е една рецепта. Името на файла е адресът ѝ.
const files = import.meta.glob('../recipes/*.md', { query: '?raw', import: 'default', eager: true })

const ING_TITLE = /^(продукти|съставки|ingredients)/i
const STEP_TITLE = /^(стъпки|приготвяне|начин на приготвяне|steps|method)/i

function parseFrontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!m) return { data: {}, body: src }
  return { data: YAML.parse(m[1]) ?? {}, body: m[2] }
}

function splitSections(body) {
  const sections = []
  let cur = { title: '', lines: [] }
  for (const line of body.split(/\r?\n/)) {
    const h = line.match(/^##\s+(.+?)\s*$/)
    if (h) {
      sections.push(cur)
      cur = { title: h[1], lines: [] }
    } else cur.lines.push(line)
  }
  sections.push(cur)
  return sections
}

function parseIngredients(lines) {
  const groups = []
  let group = { name: '', items: [] }
  for (const line of lines) {
    const h = line.match(/^###\s+(.+)/)
    if (h) {
      if (group.items.length) groups.push(group)
      group = { name: h[1].trim(), items: [] }
      continue
    }
    const li = line.match(/^\s*[-*+]\s+(.+)/)
    if (li) group.items.push(parseIngredient(li[1].trim()))
  }
  if (group.items.length) groups.push(group)
  return groups
}

// Стъпките може да са разделени на групи с ### (напр. „### Каймата“).
function parseSteps(lines) {
  const steps = []
  let group = ''
  for (const line of lines) {
    const h = line.match(/^###\s+(.+)/)
    if (h) {
      group = h[1].trim()
      continue
    }
    const li = line.match(/^\s*\d+[.)]\s+(.+)/)
    if (li) steps.push({ text: li[1].trim(), group })
    else if (line.trim() && steps.length && /^\s{2,}/.test(line)) steps[steps.length - 1].text += ' ' + line.trim()
  }
  return steps
}

// Временна картинка, докато рецептата няма снимка.
function placeholder(category) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${category.color}' stop-opacity='.35'/><stop offset='1' stop-color='${category.color}' stop-opacity='.8'/></linearGradient></defs><rect width='800' height='600' fill='#fbf7f1'/><rect width='800' height='600' fill='url(#g)'/><text x='400' y='300' font-size='220' text-anchor='middle' dominant-baseline='central'>${category.emoji}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// Външните линкове се отварят в нов раздел, за да не се напуска сайтът.
const md = text => marked.parse(text).replaceAll('<a href="http', '<a target="_blank" rel="noopener" href="http')

function toRecipe(path, src) {
  const slug = path.split('/').pop().replace(/\.md$/, '')
  const { data, body } = parseFrontmatter(src)
  const sections = splitSections(body)
  const ing = sections.find(s => ING_TITLE.test(s.title))
  const steps = sections.find(s => STEP_TITLE.test(s.title))
  const extras = sections
    .filter(s => s.title && s !== ing && s !== steps)
    .map(s => ({ title: s.title, html: md(s.lines.join('\n')) }))
  const prep = Number(data.prep) || 0
  const cook = Number(data.cook) || 0
  const ingredients = ing ? parseIngredients(ing.lines) : []
  const category = findCategory(data.category)
  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? '',
    image: data.image ? withBase(data.image) : placeholder(category),
    source: data.source ?? '',
    category,
    prep,
    cook,
    time: Number(data.time) || prep + cook,
    servings: Number(data.servings) || 1,
    difficulty: data.difficulty ?? 'Лесно',
    tags: data.tags ?? [],
    intro: md(sections[0].lines.join('\n')),
    ingredients,
    steps: steps ? parseSteps(steps.lines) : [],
    extras,
    titleWords: toWords(data.title ?? slug),
  }
}

const toWords = text => text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean)

// Колко добре заглавието на рецептата отговаря на търсенето (0 = никак).
// Търси по началото на думите, за да не намира „ти“ в „домати“.
export function searchScore(recipe, query) {
  const words = toWords(query)
  if (!words.length) return 1
  let total = 0
  for (const w of words) {
    const word = recipe.titleWords.find(t => t.startsWith(w))
    if (!word) return 0
    total += word === w ? 120 : 100
  }
  if (recipe.title.toLowerCase().startsWith(query.trim().toLowerCase())) total += 200
  return total
}

export const RECIPES = Object.entries(files)
  .map(([path, src]) => toRecipe(path, src))
  .sort((a, b) => a.title.localeCompare(b.title, 'bg'))

export const getRecipe = slug => RECIPES.find(r => r.slug === slug)

// Локалните снимки (/snimka.webp от public/) трябва да минат през base пътя —
// в GitHub Pages сайтът е под /donis-kitchen/, а не в корена.
function withBase(url) {
  if (!url.startsWith('/') || url.startsWith('//')) return url
  return import.meta.env.BASE_URL + url.slice(1)
}

export function img(url, w) {
  if (!url.includes('images.unsplash.com')) return url
  return url.replace(/([?&])w=\d+/, `$1w=${w}`)
}

export const inline = md => marked.parseInline(md)

export function formatTime(min) {
  if (!min) return '—'
  if (min < 60) return `${min} мин`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} ч ${m} мин` : `${h} ч`
}
