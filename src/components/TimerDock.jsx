import { formatClock, useTimers } from '../lib/timers'

export default function TimerDock() {
  const { timers, togglePause, addMinute, remove, left } = useTimers()
  if (!timers.length) return null
  return (
    <div className="timer-dock" aria-live="polite">
      {timers.map(t => {
        const sec = left(t)
        const pct = t.total ? 1 - sec / t.total : 1
        return (
          <div key={t.id} className={`timer ${t.done ? 'done' : ''} ${t.paused ? 'paused' : ''}`}>
            <svg viewBox="0 0 36 36" className="timer-ring" aria-hidden>
              <circle cx="18" cy="18" r="15.9" className="bg" />
              <circle cx="18" cy="18" r="15.9" className="fg" style={{ strokeDashoffset: 100 - pct * 100 }} />
            </svg>
            <div className="timer-info">
              <strong>{t.done ? 'Готово!' : formatClock(sec)}</strong>
              <small title={t.label}>{t.label}</small>
            </div>
            <div className="timer-actions">
              {!t.done && (
                <button type="button" onClick={() => togglePause(t.id)} aria-label={t.paused ? 'Продължи' : 'Пауза'}>
                  {t.paused ? '▶' : '❚❚'}
                </button>
              )}
              <button type="button" onClick={() => addMinute(t.id)} aria-label="Добави минута">
                +1
              </button>
              <button type="button" onClick={() => remove(t.id)} aria-label="Затвори">
                ✕
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
