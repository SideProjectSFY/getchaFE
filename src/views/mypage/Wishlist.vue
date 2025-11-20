<template>
  <div class="wishlist-page">
    <h1 class="page-title">찜 리스트</h1>
    
    <div v-if="loading" class="loading">로딩 중...</div>
    <div v-else-if="wishlistGoods.length > 0">
      <div class="mini-cards-grid">
        <div class="mini-card" v-for="goods in paginatedGoods" :key="goods.id">
          <div class="mini-card-thumb">
            <img :src="goods.images?.[0] || '/placeholder.png'" :alt="goods.title" />
          </div>
          <div class="mini-card-body">
            <h3 class="mini-card-title">{{ goods.title }}</h3>
            <p class="mini-card-meta">{{ goods.animeTitle }} · {{ goods.category }}</p>
            <p class="mini-card-price">{{ formatPrice(goods.currentBid || goods.startPrice) }}</p>
            <router-link :to="`/goods/${goods.id}`" class="mini-card-link">자세히 보기</router-link>
          </div>
        </div>
      </div>
      <div v-if="totalPages > 1" class="pagination">
        <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">이전</button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">다음</button>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>찜한 굿즈가 없습니다.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'
import { getGoodsByIds, mockWishlistByUser } from '../../data/mockData'
import { formatPrice } from '../../utils/format'

const authStore = useAuthStore()

const loading = ref(true)
const wishlistGoods = ref([])
const currentPage = ref(1)
const ITEMS_PER_PAGE = 5

async function fetchWishlist() {
  loading.value = true
  try {
    const response = await api.get('/goods/wishlist')
    if (Array.isArray(response.data) && response.data.length > 0) {
      wishlistGoods.value = response.data
    } else {
      loadMockWishlist()
    }
  } catch (error) {
    console.error('찜 목록 로딩 실패:', error)
    loadMockWishlist()
  }
  loading.value = false
}

function loadMockWishlist() {
  const userId = authStore.user?.id
  const mockIds = mockWishlistByUser[userId] || mockWishlistByUser.default || []
  wishlistGoods.value = getGoodsByIds(mockIds)
}

const totalPages = computed(() => Math.max(1, Math.ceil(wishlistGoods.value.length / ITEMS_PER_PAGE)))
const paginatedGoods = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  return wishlistGoods.value.slice(start, start + ITEMS_PER_PAGE)
})

function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

watch(wishlistGoods, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})

onMounted(() => {
  fetchWishlist()
})
</script>

<style scoped>
.wishlist-page {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 900;
  color: var(--text-dark);
}

.mini-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 18px;
}

.mini-card {
  display: flex;
  gap: 14px;
  padding: 18px;
  border-radius: 20px;
  background: white;
  box-shadow: var(--card-shadow);
}

.mini-card-thumb {
  width: 70px;
  height: 70px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.mini-card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mini-card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mini-card-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-dark);
}

.mini-card-meta {
  font-size: 12px;
  color: var(--text-light);
}

.mini-card-price {
  font-size: 16px;
  font-weight: 800;
  color: var(--primary-red);
}

.mini-card-link {
  margin-top: auto;
  font-size: 12px;
  color: var(--text-gray);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

.page-btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: white;
  font-weight: 600;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-weight: 700;
  color: var(--text-dark);
}

.loading,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-light);
  font-size: 16px;
}
</style>

