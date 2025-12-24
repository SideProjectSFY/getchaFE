<template>
  <div class="favorite-animes-page">
    <h1 class="page-title title-heading">관심 애니메이션</h1>
    
    <div v-if="loading" class="loading">로딩 중...</div>
    <!-- favoriteAnimes 배열에 1개 이상 있을 때의 애니 목록 -->
    <div v-else-if="favoriteAnimes.length > 0" class="animes-grid">
      <div
        v-for="anime in favoriteAnimes"
        :key="anime.id"
        class="anime-card"
      >
        <!-- 애니메이션 포스터 이미지 -->
        <img
          :src="anime.coverImage?.large || '/placeholder.png'"
          :alt="anime.title.romaji"
          class="anime-cover"
        />
        <!-- 애니메이션 정보 -->
        <div class="anime-info">
          <h3 class="anime-title">{{ anime.title.romaji || anime.title.english }}</h3>
          <p class="anime-genres">{{ anime.genres?.slice(0, 3).join(', ') }}</p>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>관심 애니메이션이 없습니다.</p>
    </div>

    <!-- 추천 애니메이션 섹션 -->
    <div v-if="!loading" class="recommended-section">
      <h2 class="section-title title-heading">추천 애니메이션</h2>
      <div v-if="isLoadingRecommended" class="recommend-loading-state">
        <p>추천 시스템 가동 중 ... 🤖</p>
      </div>
      <div v-else-if="recommendedAnimes.length > 0" class="animes-grid">
        <div
          v-for="anime in recommendedAnimes"
          :key="anime.animeId"
          class="anime-card recommended-card"
          @mouseenter="showRecommendInfo = anime.animeId"
          @mouseleave="showRecommendInfo = null"
        >
          <!-- 애니메이션 포스터 이미지 -->
          <img
            :src="anime.posterUrl || '/placeholder.png'"
            :alt="anime.animeTitle"
            class="anime-cover"
          />
          <!-- 호버 시 표시되는 추가 정보 -->
          <div v-if="showRecommendInfo === anime.animeId" class="recommend-overlay">
            <div class="recommend-info-content">
              <div v-if="anime.overview" class="recommend-overview">
                <p>{{ anime.overview }}</p>
              </div>
              <div class="recommend-stats">
                <div v-if="anime.matchRate !== undefined && anime.matchRate !== null" class="recommend-stat">
                  <span class="stat-label">매칭률</span>
                  <span class="stat-value">{{ Number(anime.matchRate) }}%</span>
                </div>
                <div v-if="anime.popularity !== undefined && anime.popularity !== null" class="recommend-stat">
                  <span class="stat-label">인기도</span>
                  <span class="stat-value">{{ Number(anime.popularity).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>
          <!-- 애니메이션 정보 -->
          <div class="anime-info">
            <h3 class="anime-title">{{ anime.animeTitle }}</h3>
            <div v-if="anime.matchRate !== undefined && anime.matchRate !== null" class="match-rate-badge">
              <span class="match-rate-value">{{ Number(anime.matchRate) }}%</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="recommend-empty-state">
        <p>추천 가능한 애니메이션이 없습니다.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'

const authStore = useAuthStore()
const loading = ref(true)
// 관심 애니메이션 목록
const favoriteAnimes = ref([])
// 추천 애니메이션 목록
const recommendedAnimes = ref([])
// 추천 애니메이션 로딩 상태
const isLoadingRecommended = ref(false)
// 호버 중인 추천 애니메이션 ID
const showRecommendInfo = ref(null)

// 관심 애니메이션 조회 함수
async function fetchFavoriteAnimes() {
  loading.value = true
  // user 응답의 likedAnimes 활용
  favoriteAnimes.value = mapAnimes(authStore.user?.likedAnimes || [])
  loading.value = false
}

// 추천 애니메이션 조회 함수
async function fetchRecommendedAnimes() {
  isLoadingRecommended.value = true
  try {
    const response = await api.get('/recommend/anime')
    const payload = response.data?.data || response.data || []
    recommendedAnimes.value = Array.isArray(payload) ? payload : []
  } catch (error) {
    console.error('추천 애니메이션 로딩 실패:', error)
    recommendedAnimes.value = []
  } finally {
    isLoadingRecommended.value = false
  }
}

// 서버에서 받은 애니 데이터 공통 형태로 반환
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
      large:  anime.posterUrl || anime.poster_url,
      medium: anime.posterUrl || anime.poster_url
    },
    genres: anime.genres || []
  }))
}

onMounted(async () => {
  await fetchFavoriteAnimes()
  await fetchRecommendedAnimes()
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

.recommended-section {
  margin-top: 48px;
}

.section-title {
  font-size: 24px;
  font-weight: 900;
  color: var(--text-dark);
  margin-bottom: 24px;
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
  position: relative;
}

.anime-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-shadow-hover);
}

.recommended-card {
  position: relative;
}

.anime-cover {
  width: 100%;
  aspect-ratio: 3/4;
  object-fit: cover;
}

.recommend-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 10;
  overflow-y: auto;
}

.recommend-info-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.recommend-overview {
  flex: 1;
  overflow-y: auto;
}

.recommend-overview p {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.recommend-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.recommend-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  color: white;
  font-weight: 700;
}

.anime-info {
  padding: 16px;
}

.recommended-card .anime-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
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

.recommended-card .anime-title {
  margin-bottom: 0;
  flex: 1;
  min-width: 0;
}

.anime-genres {
  font-size: 12px;
  color: var(--text-light);
}

.match-rate-badge {
  display: flex;
  align-items: center;
  padding: 4px 10px;
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  color: white;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(255, 107, 107, 0.3);
  flex-shrink: 0;
}

.match-rate-value {
  font-size: 12px;
  font-weight: 800;
}

.loading,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-light);
  font-size: 16px;
}

.recommend-loading-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--primary-red);
  font-size: 18px;
  font-weight: 700;
  animation: pulse 1.5s ease-in-out infinite;
}

.recommend-empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-light);
  font-size: 16px;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>

