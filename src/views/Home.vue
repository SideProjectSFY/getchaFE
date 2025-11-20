<template>
  <div class="home">
    <!-- AI 추천 섹션 -->
    <section class="recommendation-section">
      <div class="container">
        <h2 class="section-title">당신을 위한 추천</h2>
        <div v-if="isAuthenticated">
          <div v-if="recommendedGoods.length > 0" class="goods-grid">
            <GoodsCard
              v-for="goods in recommendedGoods"
              :key="goods.id"
              :goods="goods"
            />
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
            :key="goods.id"
            :goods="goods"
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
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useGoodsStore } from '../stores/goods'
import GoodsCard from '../components/GoodsCard.vue'
import api from '../services/api'
import { mockRecommendedGoods, mockPopularGoods } from '../data/mockData'

const authStore = useAuthStore()
const goodsStore = useGoodsStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const categories = computed(() => goodsStore.categories)

const recommendedGoods = ref([])
const popularGoods = ref([])

async function fetchRecommendedGoods() {
  if (!isAuthenticated.value) return
  
  try {
    const response = await api.get('/goods/recommended')
    recommendedGoods.value = response.data
  } catch (error) {
    // API 실패 시 목 데이터 사용
    console.error('추천 굿즈 로딩 실패:', error)
    recommendedGoods.value = mockRecommendedGoods
  }
}

async function fetchPopularGoods() {
  try {
    const response = await api.get('/goods/popular')
    popularGoods.value = response.data
  } catch (error) {
    // API 실패 시 목 데이터 사용
    console.error('인기 굿즈 로딩 실패:', error)
    popularGoods.value = mockPopularGoods
  }
}

function getCategoryImage(category) {
  return goodsStore.getCategoryImage(category)
}

onMounted(() => {
  fetchRecommendedGoods()
  fetchPopularGoods()
  
  // API가 없을 경우 목 데이터로 초기화
  if (recommendedGoods.value.length === 0 && isAuthenticated.value) {
    recommendedGoods.value = mockRecommendedGoods
  }
  if (popularGoods.value.length === 0) {
    popularGoods.value = mockPopularGoods
  }
})
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
}
</style>

