import { useShopping } from '../lib/store'

export default function Header({ path, onSearch }) {
  const [shopping] = useShopping()
  const open = shopping.filter(i => !i.done).length

  const active = p => (p === '/' ? path === '/' || path.startsWith('/category') : path.startsWith(p)) ? 'active' : ''

  return (
    <header className="header">
      <div className="header-inner">
        <a href="#/" className="logo">
          <span className="logo-mark">🍲</span>
          <span>
            Doni’s Kitchen<em>.</em>
          </span>
        </a>
        <button type="button" className="search-trigger" onClick={onSearch}>
          <span aria-hidden>🔍</span>
          <span className="search-trigger-text">Търси рецепта…</span>
          <kbd>Ctrl K</kbd>
        </button>
        <nav className="nav">
          <a href="#/" className={active('/')}>
            <span aria-hidden>📖</span>
            <span className="nav-label">Рецепти</span>
          </a>
          <a href="#/shopping" className={active('/shopping')}>
            <span aria-hidden>🛒</span>
            <span className="nav-label">Пазаруване</span>
            {open > 0 && (
              <b className="badge" key={open}>
                {open}
              </b>
            )}
          </a>
        </nav>
      </div>
    </header>
  )
}
