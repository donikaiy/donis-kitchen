import { useEffect, useState } from 'react'
import Header from './components/Header'
import Home from './components/Home'
import RecipePage from './components/RecipePage'
import SearchPalette from './components/SearchPalette'
import ShoppingPage from './components/ShoppingPage'
import TimerDock from './components/TimerDock'
import Toaster from './components/Toaster'
import { useRoute } from './lib/router'
import { TimerProvider } from './lib/timers'

function Page({ path }) {
  const [, section, param] = path.split('/')
  if (section === 'recipe') return <RecipePage key={param} slug={decodeURIComponent(param ?? '')} />
  if (section === 'shopping') return <ShoppingPage />
  if (section === 'category') return <Home key={param} initialCategory={param} />
  return <Home key="all" />
}

export default function App() {
  const path = useRoute()
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const onKey = e => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)
      if ((e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        setSearching(true)
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  return (
    <TimerProvider>
      <Header path={path} onSearch={() => setSearching(true)} />
      <Page path={path} />
      {searching && <SearchPalette onClose={() => setSearching(false)} />}
      <TimerDock />
      <Toaster />
    </TimerProvider>
  )
}
