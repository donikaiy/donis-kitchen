import { useEffect, useState } from 'react'
import { onToast } from '../lib/store'

export default function Toaster() {
  const [items, setItems] = useState([])
  useEffect(
    () =>
      onToast(t => {
        setItems(list => [...list.slice(-2), t])
        setTimeout(() => setItems(list => list.filter(x => x.id !== t.id)), 2600)
      }),
    [],
  )
  return (
    <div className="toaster" role="status">
      {items.map(t => (
        <div key={t.id} className="toast">
          <span>{t.icon}</span> {t.message}
        </div>
      ))}
    </div>
  )
}
