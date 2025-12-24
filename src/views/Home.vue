<template>
  <div class="home">
    <!-- AI 추천 섹션 -->
    <section class="recommendation-section">
      <div class="container">
        <h2 class="section-title">당신을 위한 추천</h2>
        <div v-if="isAuthenticated">
          <div
              v-if="recommendedGoods.length > 0"
              class="carousel-shell"
              @mouseenter="stopCarousel"
              @mouseleave="startCarousel"
          >
            <button class="carousel-btn prev" type="button" @click="handleCarouselClick(-1)" aria-label="이전 추천 보기">
              ‹
            </button>
            <div class="carousel-track" ref="carouselRef">
              <div v-for="goods in recommendedGoods" :key="goods.goodsId" class="carousel-card">
                <GoodsCard :goods="goods" :additional-lists="additionalListsForRecommended" />
              </div>
            </div>
            <button class="carousel-btn next" type="button" @click="handleCarouselClick(1)" aria-label="다음 추천 보기">
              ›
            </button>
          </div>
          <div v-else-if="isLoadingRecommended" class="loading-state">
            <p>추천 시스템 가동 중 ... 🤖</p>
          </div>
          <div v-else class="empty-state">
            <p>아직 추천할 굿즈가 없습니다.</p>
          </div>
        </div>
        <div v-else class="login-prompt">
          <p>로그인하면 맞춤 추천 굿즈를 확인할 수 있습니다!</p>
          <router-link to="/login" class="btn-primary">로그인하기</router-link>
        </div>
      </div>
    </section>

    <!-- 카테고리 섹션 -->
    <section class="category-section">
      <div class="container">
        <h2 class="section-title">카테고리별 둘러보기</h2>
        <div class="category-grid">
          <router-link
              v-for="category in categories"
              :key="category"
              :to="category === 'ALL' ? '/goods' : `/goods?category=${encodeURIComponent(category)}`"
              class="category-card"
          >
            <div class="category-image-wrapper">
              <img :src="getCategoryImage(category)" :alt="category" class="category-image" />
              <div class="category-overlay"></div>
            </div>
            <h3 class="category-name">{{ category }}</h3>
          </router-link>
        </div>
      </div>
    </section>

    <!-- 인기 굿즈 섹션 -->
    <section class="popular-section">
      <div class="container">
        <h2 class="section-title">Hot</h2>
        <div v-if="popularGoods.length > 0" class="goods-grid">
          <GoodsCard
              v-for="goods in popularGoods"
              :key="goods.goodsId"
              :goods="goods"
              :additional-lists="additionalListsForPopular"
          />
        </div>
        <div v-else class="empty-state">
          <p>아직 인기 굿즈가 없습니다.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useGoodsStore } from '../stores/goods'
import { useWishStore } from '../stores/wish'
import GoodsCard from '../components/GoodsCard.vue'
import api from '../services/api'
import { categoryImages } from '../data/categoryImages'

const authStore = useAuthStore()
const goodsStore = useGoodsStore()
const wishStore = useWishStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const categories = computed(() => goodsStore.categories)

const recommendedGoods = ref([])
const popularGoods = ref([])
const isLoadingRecommended = ref(false)

// additionalLists를 computed로 생성하여 Vue 반응성 보장
const additionalListsForPopular = computed(() => [popularGoods])
const additionalListsForRecommended = computed(() => [recommendedGoods])
const carouselRef = ref(null)
let carouselTimer = null
let restartTimer = null

async function fetchRecommendedGoods() {
  if (!isAuthenticated.value) return

  isLoadingRecommended.value = true
  try {
    const response = await api.get('/recommend/goods')
    const payload = response.data?.data || response.data || {}
    const items = payload.items || (Array.isArray(payload) ? payload : [])
    // 백엔드 굿즈 데이터를 카드에서 바로 쓸 수 있는 형태로 변환
    const transformed = items.map(item => goodsStore.transformGoodsItem(item))
    recommendedGoods.value = transformed
  } catch (error) {
    console.error('추천 굿즈 로딩 실패:', error)
    recommendedGoods.value = []
  } finally {
    isLoadingRecommended.value = false
  }
}

async function fetchPopularGoods() {
  try {
    const response = await api.get('/goods/hot-goods')

    // 백엔드 응답 구조 확인 (response.data.data.items 또는 response.data.items 또는 response.data)
    const responseData = response.data?.data || response.data
    const items = responseData?.items || (Array.isArray(responseData) ? responseData : [])

    // 백엔드 데이터를 프론트엔드 형식으로 변환 (transformGoodsItem 사용)
    // transformGoodsItem은 ...item으로 모든 속성(checkWish 포함)을 그대로 전달
    const transformedItems = items.map(item => goodsStore.transformGoodsItem(item))

    // 페이징 처리 없이 최대 6개만 표시
    popularGoods.value = transformedItems.slice(0, 6)
  } catch (error) {
    console.error('인기 굿즈 로딩 실패:', error)
    popularGoods.value = []
  }
}

// 카테고리 이미지는 프론트엔드 내부 이미지 사용
function getCategoryImage(category) {
  return categoryImages[category] || categoryImages['기타']
}

function scrollCarousel(direction = 1, isManual = false) {
  const track = carouselRef.value
  if (!track || !recommendedGoods.value.length) return
  const scrollAmount = Math.max(track.clientWidth * 0.8, 260)
  const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 5
  const atStart = track.scrollLeft <= 5

  if (direction > 0) {
    if (atEnd) {
      track.scrollTo({ left: 0, behavior: 'smooth' })
    } else {
      track.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  } else {
    if (atStart) {
      track.scrollTo({ left: track.scrollWidth, behavior: 'auto' })
    }
    track.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
  }

  if (isManual) {
    restartCarousel()
  }
}

function startCarousel() {
  if (!isAuthenticated.value || !recommendedGoods.value.length) return
  stopCarousel()
  carouselTimer = setInterval(() => {
    scrollCarousel(1)
  }, 4000)
}

function stopCarousel() {
  if (carouselTimer) {
    clearInterval(carouselTimer)
    carouselTimer = null
  }
}

function restartCarousel() {
  stopCarousel()
  if (restartTimer) {
    clearTimeout(restartTimer)
    restartTimer = null
  }
  restartTimer = setTimeout(() => {
    startCarousel()
    restartTimer = null
  }, 3500)
}

function handleCarouselClick(direction) {
  scrollCarousel(direction, true)
}

onMounted(() => {
  fetchRecommendedGoods()
  fetchPopularGoods()

  nextTick(() => startCarousel())
})

onUnmounted(() => {
  stopCarousel()
  if (restartTimer) {
    clearTimeout(restartTimer)
    restartTimer = null
  }
})

watch(
    () => ({
      length: recommendedGoods.value.length,
      auth: isAuthenticated.value
    }),
    () => {
      nextTick(() => {
        if (isAuthenticated.value && recommendedGoods.value.length > 0) {
          startCarousel()
        } else {
          stopCarousel()
        }
      })
    }
)
</script>

<style scoped>
.home {
  padding: 40px 0;
}

.section-title {
  font-size: 32px;
  font-weight: 900;
  color: var(--text-dark);
  margin-bottom: 32px;
  text-align: center;
}

.recommendation-section {
  padding: 60px 0;
  background: #FFFFFF;
}

.carousel-shell {
  position: relative;
  padding: 20px 48px;
}

.carousel-track {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  padding-bottom: 12px;
}

.carousel-track::-webkit-scrollbar {
  display: none;
}

.carousel-card {
  flex: 0 0 320px;
  scroll-snap-align: start;
}

.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--text-dark);
  cursor: pointer;
  transition: var(--transition);
  z-index: 2;
}

.carousel-btn:hover {
  background: var(--primary-red);
  color: white;
  border-color: transparent;
}

.carousel-btn.prev {
  left: 0;
}

.carousel-btn.next {
  right: 0;
}

.carousel-shell::after {
  content: '';
  position: absolute;
  left: 48px;
  right: 48px;
  bottom: 0;
  height: 60px;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 100%);
}


.category-section {
  padding: 60px 0;
  position: relative;
}

.popular-section {
  padding: 60px 0;
  background: #F8F8F8;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.category-card {
  background: white;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: var(--card-shadow);
  transition: var(--transition);
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.category-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 75%; /* 4:3 비율 */
  overflow: hidden;
  background: var(--bg-light);
}

.category-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: var(--transition);
}

.category-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 100%);
  opacity: 0.5;
  transition: var(--transition);
}

.category-card:hover .category-image {
  transform: scale(1.1);
}

.category-card:hover .category-overlay {
  opacity: 0.7;
}

.category-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-dark);
  padding: 20px;
  text-align: center;
  background: white;
}

.goods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.login-prompt {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: var(--card-shadow);
}

.login-prompt p {
  font-size: 18px;
  color: var(--text-gray);
  margin-bottom: 24px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-light);
  font-size: 16px;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--primary-red);
  font-size: 18px;
  font-weight: 700;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

@media (max-width: 1200px) {
  .category-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .section-title {
    font-size: 24px;
  }

  .category-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .goods-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
  }

  .carousel-shell {
    padding: 10px 0;
  }

  .carousel-btn {
    display: none;
  }
}
</style>