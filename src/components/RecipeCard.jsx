import { formatTime, img } from '../lib/recipes'

export function Difficulty({ level }) {
  const n = { Лесно: 1, Средно: 2, Трудно: 3 }[level] ?? 1
  return (
    <span className="difficulty" title={level}>
      {[1, 2, 3].map(i => (
        <i key={i} className={i <= n ? 'on' : ''} />
      ))}
      {level}
    </span>
  )
}

export default function RecipeCard({ recipe, index = 0, match }) {
  return (
    <a href={`#/recipe/${recipe.slug}`} className="card" style={{ '--i': index, '--cat': recipe.category.color }}>
      <div className="card-img">
        <img
          src={img(recipe.image, 700)}
          alt={recipe.title}
          loading="lazy"
          onLoad={e => e.currentTarget.classList.add('loaded')}
        />
        <span className="card-cat">
          {recipe.category.emoji} {recipe.category.name}
        </span>
        {match && (
          <span className={`card-match ${match.have === match.total ? 'full' : ''}`}>
            🧊 {match.have} от {match.total} продукта
          </span>
        )}
      </div>
      <div className="card-body">
        <h3>{recipe.title}</h3>
        <p>{recipe.description}</p>
        <div className="card-meta">
          <span>⏱ {formatTime(recipe.time)}</span>
          <span>👤 {recipe.servings}</span>
          <Difficulty level={recipe.difficulty} />
        </div>
      </div>
    </a>
  )
}
