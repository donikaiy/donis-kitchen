import { inline } from '../lib/recipes'
import { TIMER_RE, unitSeconds, useTimers } from '../lib/timers'

// Текст на стъпка, в който времената („25 минути“) стават бутони за таймер.
export default function StepText({ text, label }) {
  const { start } = useTimers()
  const parts = []
  let last = 0
  for (const m of text.matchAll(TIMER_RE)) {
    let from = m.index
    let to = m.index + m[0].length
    const bold = text.slice(from - 2, from) === '**' && text.slice(to, to + 2) === '**'
    if (bold) {
      from -= 2
      to += 2
    }
    parts.push(<span key={`t${last}`} dangerouslySetInnerHTML={{ __html: inline(text.slice(last, from)) }} />)
    const seconds = Number(m[1]) * unitSeconds(m[3])
    parts.push(
      <button
        key={`b${from}`}
        type="button"
        className="timer-chip"
        title="Пусни таймер"
        onClick={e => {
          e.stopPropagation()
          start(seconds, `${label} · ${m[0]}`)
        }}
      >
        <span aria-hidden>⏱</span> {m[0]}
      </button>,
    )
    last = to
  }
  parts.push(<span key="end" dangerouslySetInnerHTML={{ __html: inline(text.slice(last)) }} />)
  return <>{parts}</>
}
