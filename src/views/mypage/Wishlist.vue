<template>
  <div class="wishlist-page">
    <h1 class="page-title">찜 리스트</h1>
    
    <div v-if="loading" class="loading">로딩 중...</div>
    <div v-else-if="wishlistGoods.length > 0">
      <div class="mini-cards-grid">
        <div
          class="mini-card"
          v-for="goods in paginatedGoods"
          :key="goods.goodsId"
          @click="goDetail(goods.goodsId)"
        >
          <div class="mini-card-thumb">
            <img :src="getImageUrl(goods.mainFilePath)" :alt="goods.title" />
            <div v-if="goods.auctionStatus === 'COMPLETED'" class="status-badge completed-badge">완료</div>
            <div v-else-if="goods.auctionStatus === 'PROCEEDING'" class="status-badge ongoing-badge">진행중</div>
            <div v-else-if="goods.auctionStatus === 'STOPPED'" class="status-badge stopped-badge">종료</div>
            <div v-else-if="goods.auctionStatus === 'WAIT'" class="status-badge wait-badge">대기</div>
          </div>
          <div class="mini-card-body">
            <h3 class="mini-card-title">{{ goods.title }}</h3>
            <p class="mini-card-meta">{{ goods.animeTitle }} · {{ formatCategory(goods.category) }}</p>
            <p class="mini-card-price">{{ formatPrice(getDisplayPrice(goods)) }}</p>
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useWishStore } from '../../stores/wish'
import { usePagination } from '../../composables/usePagination'
import { formatPrice, formatCategory, getDisplayPrice, formatAuctionStatus } from '../../utils/format'
import { getImageUrl } from '../../utils/image'

const authStore = useAuthStore()
const router = useRouter()

const wishStore = useWishStore()
const loading = ref(true)
const wishlistGoods = ref([])
const ITEMS_PER_PAGE = 6

// 페이징 로직을 composable로 추출
const { currentPage, totalPages, paginatedItems: paginatedGoods, changePage } = usePagination(ITEMS_PER_PAGE, wishlistGoods)

async function fetchWishlist() {
  loading.value = true
  try {
    const result = await wishStore.fetchWishlist()
    
    wishlistGoods.value = result.data || []
  } catch (error) {
    console.error('찜 목록 로딩 실패:', error)
    wishlistGoods.value = []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  // 인증 완료 후 찜 목록 로드
  fetchWishlist()
})

function goDetail(goodsId) {
  router.push({ path: '/goods', query: { goodsId } })
}
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
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}

.mini-card {
  display: flex;
  gap: 14px;
  padding: 18px;
  border-radius: 20px;
  background: white;
  box-shadow: var(--card-shadow);
  cursor: pointer;
  transition: var(--transition);
}

.mini-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

.mini-card-thumb {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
}

.mini-card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.completed-badge {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
}

.ongoing-badge {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  animation: pulse 2s ease-in-out infinite;
}

.stopped-badge {
  background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
}

.wait-badge {
  background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
  color: #ffffff;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.05);
  }
}

.mini-card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mini-card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

