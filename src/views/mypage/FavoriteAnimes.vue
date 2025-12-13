<template>
  <div class="favorite-animes-page">
    <h1 class="page-title">관심 애니메이션</h1>
    
    <div v-if="loading" class="loading">로딩 중...</div>
    <div v-else-if="favoriteAnimes.length > 0" class="animes-grid">
      <div
        v-for="anime in favoriteAnimes"
        :key="anime.id"
        class="anime-card"
      >
        <img
          :src="anime.coverImage?.large || '/placeholder.png'"
          :alt="anime.title.romaji"
          class="anime-cover"
        />
        <div class="anime-info">
          <h3 class="anime-title">{{ anime.title.romaji || anime.title.english }}</h3>
          <p class="anime-genres">{{ anime.genres?.slice(0, 3).join(', ') }}</p>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>관심 애니메이션이 없습니다.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'

const authStore = useAuthStore()
const loading = ref(true)
const favoriteAnimes = ref([])

async function fetchFavoriteAnimes() {
  loading.value = true
  try {
    const response = await api.get('/auth/favorite-animes')
    const payload = response.data?.data || response.data || []
    favoriteAnimes.value = mapAnimes(payload)
  } catch (error) {
    // API 실패 시 내 정보에 저장된 관심 애니로 대체
    favoriteAnimes.value = mapAnimes(authStore.user?.likedAnimes || [])
    console.error('관심 애니메이션 로딩 실패:', error)
  }
  loading.value = false
}

function mapAnimes(list) {
  if (!Array.isArray(list)) return []
  return list.map(anime => ({
    id: anime.animeId ?? anime.id,
    title: {
      romaji: anime.title,
      english: anime.title,
      native: anime.title
    },
    coverImage: {
      large: anime.postUrl || anime.posterUrl || anime.poster_url,
      medium: anime.postUrl || anime.posterUrl || anime.poster_url
    },
    genres: anime.genres || []
  }))
}

onMounted(() => {
  fetchFavoriteAnimes()
})
</script>

<style scoped>
.favorite-animes-page {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 900;
  color: var(--text-dark);
}

.animes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
}

.anime-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--card-shadow);
  transition: var(--transition);
}

.anime-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-shadow-hover);
}

.anime-cover {
  width: 100%;
  aspect-ratio: 3/4;
  object-fit: cover;
}

.anime-info {
  padding: 16px;
}

.anime-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.anime-genres {
  font-size: 12px;
  color: var(--text-light);
}

.loading,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-light);
  font-size: 16px;
}
</style>

