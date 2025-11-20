const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || ''
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

function buildPoster(path, size = 'w500') {
  if (!path) return ''
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

export async function searchTmdbAnime(query) {
  if (!TMDB_API_KEY) {
    console.warn('TMDB API key가 설정되어 있지 않습니다. VITE_TMDB_API_KEY를 확인하세요.')
    return []
  }

  try {
    const url = new URL(`${TMDB_BASE_URL}/search/tv`)
    url.searchParams.set('api_key', TMDB_API_KEY)
    url.searchParams.set('query', query)
    url.searchParams.set('language', 'ko-KR')
    url.searchParams.set('include_adult', 'false')
    url.searchParams.set('page', '1')

    const response = await fetch(url.toString())
    if (!response.ok) {
      console.error('TMDB API Error:', response.statusText)
      return []
    }

    const data = await response.json()
    return (data.results || []).map((item) => ({
      id: item.id,
      title: {
        romaji: item.name,
        english: item.original_name,
        native: item.name,
      },
      coverImage: {
        large: buildPoster(item.poster_path, 'w500'),
        medium: buildPoster(item.poster_path, 'w300'),
      },
      description: item.overview,
      genres: item.genre_ids || [],
      releaseDate: item.first_air_date,
    }))
  } catch (error) {
    console.error('TMDB API Error:', error)
    return []
  }
}

