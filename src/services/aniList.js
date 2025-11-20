// AniList API GraphQL 쿼리
const ANILIST_API = 'https://graphql.anilist.co'

export async function searchAnime(searchTerm) {
  const query = `
    query ($search: String) {
      Page {
        media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            medium
          }
          description
          genres
        }
      }
    }
  `

  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        query,
        variables: { search: searchTerm }
      })
    })

    const data = await response.json()
    return data.data?.Page?.media || []
  } catch (error) {
    console.error('AniList API Error:', error)
    return []
  }
}

export async function getAnimeById(id) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          medium
        }
        description
        genres
      }
    }
  `

  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        query,
        variables: { id }
      })
    })

    const data = await response.json()
    return data.data?.Media
  } catch (error) {
    console.error('AniList API Error:', error)
    return null
  }
}

