<template>
  <div class="participated-auctions-page">
    <h1 class="page-title">참여 경매</h1>
    
    <div v-if="loading" class="loading">로딩 중...</div>
    <div v-else-if="participatedGoods.length > 0">
      <div class="mini-cards-grid">
        <div
          class="mini-card"
          v-for="goods in paginatedGoods"
          :key="goods.id"
          @click="goDetail(goods.id)"
        >
          <div class="mini-card-thumb" :class="{ faded: isEnded(goods.status) }">
            <img :src="goods.images?.[0] || '/placeholder.png'" :alt="goods.title" />
          </div>
          <div class="status-under-img">
            <span class="status-pill" :class="{ end: isEnded(goods.status) }">{{ displayStatus(goods.status) }}</span>
          </div>
          <div class="mini-card-body">
            <h3 class="mini-card-title">{{ goods.title }}</h3>
            <p class="mini-card-meta">{{ goods.animeTitle }} · {{ goods.category }}</p>
            <p class="mini-card-price">{{ formatPrice(goods.currentBid || goods.startPrice) }}</p>
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
      <p>참여한 경매가 없습니다.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'
import { getGoodsByIds } from '../../data/mockData'
import { formatPrice } from '../../utils/format'

const authStore = useAuthStore()
const router = useRouter()

const loading = ref(true)
const participatedGoods = ref([])
const currentPage = ref(1)
const ITEMS_PER_PAGE = 5

function loadMockParticipated() {
  const ids = authStore.user?.participatedAuctionIds || []
  participatedGoods.value = getGoodsByIds(ids)
}

async function fetchParticipatedGoods() {
  loading.value = true
  try {
    const response = await api.get('/goods/participated')
    if (Array.isArray(response.data) && response.data.length > 0) {
      participatedGoods.value = response.data
    } else {
      loadMockParticipated()
    }
  } catch (error) {
    console.error('참여 경매 로딩 실패:', error)
    loadMockParticipated()
  }
  loading.value = false
}

const totalPages = computed(() => Math.max(1, Math.ceil(participatedGoods.value.length / ITEMS_PER_PAGE)))
const paginatedGoods = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  return participatedGoods.value.slice(start, start + ITEMS_PER_PAGE)
})

function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

watch(participatedGoods, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})

onMounted(() => {
  fetchParticipatedGoods()
})

function goDetail(id) {
  router.push(`/goods/${id}`)
}

function isEnded(status) {
  return status === 'COMPLETED' || status === 'STOPPED'
}

function displayStatus(status) {
  if (status === 'COMPLETED') return '종료'
  if (status === 'STOPPED') return '중지'
  return '입찰'
}
</script>

<style scoped>
.participated-auctions-page {
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
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
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
  flex-direction: column;
}

.mini-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

.mini-card-thumb {
  width: 100%;
  aspect-ratio: 4/2;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.mini-card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: var(--transition);
}

.mini-card-thumb.faded img {
  filter: grayscale(0.8);
  opacity: 0.7;
}

.status-under-img {
  margin-top: 6px;
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
  max-width: 100%;
}

.mini-card-meta {
  font-size: 12px;
  color: var(--text-light);
}

.status-pill {
  background: var(--bg-light);
  color: var(--primary-red);
  border: 1px solid rgba(230, 57, 70, 0.2);
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
}

.status-pill.end {
  color: var(--text-gray);
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
  margin-top: 12px;
}

.page-btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: white;
}

.loading,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-light);
  font-size: 16px;
}
</style>

