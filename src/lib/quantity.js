const FRAC = { '½': 1 / 2, '¼': 1 / 4, '¾': 3 / 4, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 1 / 8 }
const NUM = String.raw`(?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?\s*[½¼¾⅓⅔⅛]?|[½¼¾⅓⅔⅛])`
const ING_RE = new RegExp(String.raw`^(${NUM})(?:\s*[-–]\s*(${NUM}))?\s*(.*)$`)

function toNumber(raw) {
  let s = raw.trim()
  let total = 0
  const fr = s.match(/[½¼¾⅓⅔⅛]/)
  if (fr) {
    total += FRAC[fr[0]]
    s = s.replace(fr[0], '').trim()
  }
  if (!s) return total
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixed) return total + Number(mixed[1]) + mixed[2] / mixed[3]
  const frac = s.match(/^(\d+)\/(\d+)$/)
  if (frac) return total + frac[1] / frac[2]
  return total + parseFloat(s.replace(',', '.'))
}

/** "1.5 кг тиква" -> { qty: 1.5, qty2: null, rest: "кг тиква" } */
export function parseIngredient(text) {
  const m = text.match(ING_RE)
  if (!m) return { text, qty: null, qty2: null, rest: text }
  return { text, qty: toNumber(m[1]), qty2: m[2] ? toNumber(m[2]) : null, rest: m[3] }
}

const NICE = [[0, ''], [1 / 4, '¼'], [1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'], [3 / 4, '¾'], [1, '']]

export function formatQty(n) {
  if (n == null || Number.isNaN(n)) return ''
  if (n >= 100) return String(Math.round(n / 5) * 5)
  if (n >= 10) return String(Math.round(n))
  const whole = Math.floor(n)
  const frac = n - whole
  let best = NICE[0]
  for (const f of NICE) if (Math.abs(frac - f[0]) < Math.abs(frac - best[0])) best = f
  if (Math.abs(frac - best[0]) > 0.06) return String(Math.round(n * 10) / 10).replace('.', ',')
  const w = whole + (best[0] === 1 ? 1 : 0)
  return `${w || ''}${best[1]}` || '0'
}

export function scaledText(ing, factor) {
  if (ing.qty == null) return { qty: '', rest: ing.text }
  const q = formatQty(ing.qty * factor)
  const q2 = ing.qty2 != null ? `–${formatQty(ing.qty2 * factor)}` : ''
  return { qty: q + q2, rest: ing.rest }
}
