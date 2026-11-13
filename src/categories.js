// Категориите на сайта. В markdown файла `category:` може да е името или slug-а.
export const CATEGORIES = [
  { slug: 'zakuski', name: 'Закуски', emoji: '🥞', color: '#f4a259' },
  { slug: 'salati', name: 'Салати', emoji: '🥗', color: '#7fb069' },
  { slug: 'supi', name: 'Супи', emoji: '🍲', color: '#e9a03b' },
  { slug: 'osnovni', name: 'Основни', emoji: '🍖', color: '#c8553d' },
  { slug: 'pasta-pica', name: 'Паста и пица', emoji: '🍝', color: '#e07a5f' },
  { slug: 'deserti', name: 'Десерти', emoji: '🍰', color: '#b56576' },
  { slug: 'hlyab', name: 'Хляб и тестени', emoji: '🍞', color: '#a68a64' },
  { slug: 'sosove', name: 'Сосове', emoji: '🥣', color: '#d4a72c' },
]

const FALLBACK = { slug: 'drugi', name: 'Други', emoji: '🍽️', color: '#888' }

export function findCategory(value) {
  if (!value) return FALLBACK
  const v = String(value).trim().toLowerCase()
  return CATEGORIES.find(c => c.slug === v || c.name.toLowerCase() === v) ?? { ...FALLBACK, name: value }
}
