<template>
  <div class="registered-auctions-page">
    <h1 class="page-title">등록 경매</h1>
    
    <div v-if="loading" class="loading">로딩 중...</div>
    <div v-else-if="registeredGoods.length > 0">
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
            <span :class="['status-pill', goods.status === 'ONGOING' ? 'ongoing' : 'stopped']">
              {{ formatAuctionStatus(goods.status) }}
            </span>
          </div>
          <div class="mini-card-body">
            <h3 class="mini-card-title">{{ goods.title }}</h3>
            <p class="mini-card-meta">
              {{ goods.animeTitle }} · {{ goods.category }}
            </p>
            <p class="mini-card-price">{{ formatPrice(goods.currentBid || goods.startPrice) }}</p>
            <div class="card-actions">
              <router-link :to="`/goods/edit/${goods.id}`" class="btn-outline mini-action" @click.stop>수정</router-link>
              <button class="btn-outline mini-action danger" @click.stop="handleDelete(goods.id)">삭제</button>
              <button
                v-if="goods.status === 'ONGOING'"
                class="btn-secondary mini-action stop"
                @click.stop="handleStop(goods.id)"
              >
                경매 중지
              </button>
            </div>
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
      <p>등록한 경매가 없습니다.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useGoodsStore } from '../../stores/goods'
import { useRouter } from 'vue-router'
import api from '../../services/api'
import { formatPrice, formatAuctionStatus } from '../../utils/format'

const authStore = useAuthStore()
const goodsStore = useGoodsStore()
const router = useRouter()

const loading = ref(true)
const registeredGoods = ref([])
const currentPage = ref(1)
const ITEMS_PER_PAGE = 5

async function fetchRegisteredGoods() {
  loading.value = true
  try {
    const response = await api.get('/goods/registered')
    if (Array.isArray(response.data) && response.data.length > 0) {
      registeredGoods.value = response.data
    } else {
      registeredGoods.value = []
    }
  } catch (error) {
    console.error('등록 경매 로딩 실패:', error)
    registeredGoods.value = []
  }
  loading.value = false
}

const totalPages = computed(() => Math.max(1, Math.ceil(registeredGoods.value.length / ITEMS_PER_PAGE)))
const paginatedGoods = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  return registeredGoods.value.slice(start, start + ITEMS_PER_PAGE)
})

function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

watch(registeredGoods, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})

onMounted(() => {
  fetchRegisteredGoods()
})

function goDetail(id) {
  router.push(`/goods/${id}`)
}

function isEnded(status) {
  return status === 'COMPLETED' || status === 'STOPPED'
}

async function handleDelete(goodsId) {
  if (!confirm('이 경매글을 삭제하시겠습니까? 입찰 내역이 있는 경우 삭제가 제한될 수 있습니다.')) {
    return
  }

  const result = await goodsStore.deleteGoods(goodsId)
  if (result.success) {
    registeredGoods.value = registeredGoods.value.filter(item => item.id !== goodsId)
    alert('삭제가 완료되었습니다.')
  } else {
    alert(result.message || '삭제에 실패했습니다.')
  }
}

async function handleStop(goodsId) {
  if (!confirm('경매를 중지하시겠습니까? 참여자들의 예치금이 환불됩니다.')) {
    return
  }

  const result = await goodsStore.stopAuction(goodsId)
  if (result.success) {
    registeredGoods.value = registeredGoods.value.map(item =>
      item.id === goodsId ? { ...item, status: 'STOPPED' } : item
    )
    alert('경매가 중지되었습니다.')
  } else {
    alert(result.message || '경매 중지에 실패했습니다.')
  }
}
</script>

<style scoped>
.registered-auctions-page {
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
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
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

.status-pill.ongoing {
  color: var(--primary-red);
}

.status-pill.stopped {
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

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  align-items: center;
}

.mini-action {
  padding: 8px 12px;
  font-size: 12px;
  border-radius: 10px;
}

.mini-action.danger {
  color: var(--primary-red);
  border-color: var(--primary-red);
}

.mini-action.stop {
  background: var(--primary-red);
  color: white;
  border: none;
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

