<template>
  <div class="goods-detail-page">
    <div v-if="loading" class="loading">로딩 중...</div>
    <div v-else-if="goods" class="container">
      <!-- 상단 액션 버튼 -->
      <div class="action-buttons">
        <div v-if="isOwner" class="owner-actions">
          <router-link
            v-if="goods.status === 'WAITING'"
            :to="`/goods/edit/${goods.id}`"
            class="btn-outline"
          >
            수정
          </router-link>
          <button
            v-if="goods.status === 'WAITING' && goods.bidCount === 0"
            @click="handleDelete"
            class="btn-outline delete-btn"
          >
            삭제
          </button>
          <button
            v-if="goods.status === 'ONGOING'"
            @click="handleStopAuction"
            class="btn-secondary stop-btn"
          >
            거래 중지
          </button>
        </div>
        <button @click="handleReport" class="btn-outline report-btn">신고</button>
      </div>

      <div class="detail-content">
        <!-- 이미지 갤러리 -->
        <div class="image-gallery">
          <div class="main-image" :class="{ completed: goods.status === 'COMPLETED' }">
            <img :src="currentImage || goods.images?.[0] || '/placeholder.png'" :alt="goods.title" />
            <div v-if="goods.status === 'COMPLETED'" class="detail-soldout">
              <span class="soldout-pill">SOLD OUT</span>
            </div>
          </div>
          <div v-if="goods.images && goods.images.length > 1" class="thumbnail-list">
            <img
              v-for="(image, index) in goods.images"
              :key="index"
              :src="image"
              :alt="`${goods.title} ${index + 1}`"
              @click="currentImage = image"
              :class="{ active: currentImage === image || (!currentImage && index === 0), completed: goods.status === 'COMPLETED' }"
              class="thumbnail"
            />
          </div>
        </div>

        <!-- 상품 정보 -->
        <div class="goods-info">
          <div class="goods-header">
            <h1 class="goods-title">{{ goods.title }}</h1>
            <div class="goods-meta">
              <span class="seller">판매자: {{ goods.sellerNickname }}</span>
              <button @click="handleReportUser" class="report-user-btn">신고</button>
            </div>
          </div>

          <div class="status-badge-wrapper">
            <span :class="['status-badge', `status-${goods.status.toLowerCase()}`]">
              {{ formatAuctionStatus(goods.status) }}
            </span>
          </div>

          <div class="auction-info">
            <div class="price-section">
              <div class="price-item">
                <span class="price-label">시작가</span>
                <span class="price-value">{{ formatPrice(goods.startPrice) }}</span>
              </div>
              <div class="price-item">
                <span class="price-label">현재 입찰가</span>
                <span class="price-value highlight">{{ formatPrice(goods.currentBid || goods.startPrice) }}</span>
              </div>
              <div v-if="goods.maxPrice" class="price-item">
                <span class="price-label">즉시구매가</span>
                <span class="price-value">{{ formatPrice(goods.maxPrice) }}</span>
              </div>
            </div>

            <div class="timer-section">
              <span class="timer-label">남은 시간</span>
              <span class="timer-value">{{ formatTimeRemaining(timeRemaining) }}</span>
            </div>
          </div>

          <div class="action-section">
            <button
              v-if="goods.status === 'ONGOING' && !isOwner"
              @click="handleBid"
              class="btn-primary bid-btn"
            >
              입찰하기
            </button>
            <button
              @click="toggleWishlist"
              :class="['wishlist-btn', { active: isWishlisted }]"
            >
              <span class="heart-icon-detail" :class="{ filled: isWishlisted }">
                <svg v-if="isWishlisted" width="20" height="20" viewBox="0 0 24 24" fill="#FF0000" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </span>
              <span>{{ isWishlisted ? '찜 해제' : '찜하기' }}</span>
            </button>
          </div>

          <div class="goods-details">
            <div class="detail-item">
              <span class="detail-label">애니메이션</span>
              <span class="detail-value">{{ goods.animeTitle }}</span>
            </div>
            <div v-if="goods.characterName" class="detail-item">
              <span class="detail-label">캐릭터</span>
              <span class="detail-value">{{ goods.characterName }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">카테고리</span>
              <span class="detail-value">{{ goods.category }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">찜 수</span>
              <span class="detail-value">{{ goods.wishCount || 0 }}</span>
            </div>
          </div>

          <div class="description-section">
            <h3 class="section-title">상품 설명</h3>
            <p class="description">{{ goods.description }}</p>
          </div>

          <!-- 참여자 리스트 -->
          <div v-if="goods.bidders && goods.bidders.length > 0" class="bidders-section">
            <h3 class="section-title">경매 참여자 ({{ goods.bidders.length }}명)</h3>
            <div class="bidders-list">
              <div
                v-for="(bidder, index) in goods.bidders"
                :key="bidder.id"
                class="bidder-item"
                :class="{ winner: index === 0 }"
              >
                <span class="bidder-rank">{{ index + 1 }}위</span>
                <span class="bidder-name">{{ bidder.nickname }}</span>
                <span class="bidder-price">{{ formatPrice(bidder.bidAmount) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 댓글 섹션 -->
      <div class="comments-section">
        <h3 class="section-title">댓글</h3>
        <CommentList :goods-id="goods.id" />
      </div>
    </div>
    <div v-else class="error-state">
      <p>굿즈를 찾을 수 없습니다.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useGoodsStore } from '../../stores/goods'
import { formatPrice, formatTimeRemaining, formatAuctionStatus } from '../../utils/format'
import CommentList from '../../components/CommentList.vue'
import api from '../../services/api'
import { mockGoods } from '../../data/mockData'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const goodsStore = useGoodsStore()

const loading = ref(true)
const goods = ref(null)
const currentImage = ref(null)
const timeRemaining = ref(0)

const isAuthenticated = computed(() => authStore.isAuthenticated)
const isOwner = computed(() => goods.value && authStore.user && goods.value.sellerId === authStore.user.id)
const isWishlisted = computed(() => goods.value ? goodsStore.isWishlisted(goods.value.id) : false)

let timerInterval = null

async function fetchGoodsDetail() {
  loading.value = true
  const result = await goodsStore.fetchGoodsDetail(route.params.id)
  
  // API 실패 시 목 데이터에서 찾기
  if (!result.success || !goodsStore.currentGoods) {
    const foundGoods = mockGoods.find(g => g.id === parseInt(route.params.id))
    if (foundGoods) {
      goods.value = foundGoods
      goodsStore.currentGoods = foundGoods
    } else {
      loading.value = false
      return
    }
  } else {
    goods.value = goodsStore.currentGoods
  }
  
  currentImage.value = goods.value.images?.[0]
  timeRemaining.value = goods.value.timeRemaining || 0
  
  // 타이머 시작
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--
    } else {
      clearInterval(timerInterval)
    }
  }, 1000)
  
  loading.value = false
}

async function handleBid() {
  if (!isAuthenticated.value) {
    alert('로그인이 필요합니다.')
    router.push('/login')
    return
  }

  const bidAmount = prompt('입찰 금액을 입력하세요 (골드)')
  if (!bidAmount) return

  const amount = parseInt(bidAmount)
  if (isNaN(amount) || amount <= 0) {
    alert('올바른 금액을 입력해주세요.')
    return
  }

  if (amount <= (goods.value.currentBid || goods.value.startPrice)) {
    alert('현재 입찰가보다 높은 금액을 입력해주세요.')
    return
  }

  if (amount > 5000000) {
    alert('거래 제한 금액(500만 골드)을 초과할 수 없습니다.')
    return
  }

  if (!confirm('입찰 후 취소할 수 없습니다. 정말 입찰하시겠습니까?')) {
    return
  }

  const result = await goodsStore.placeBid(goods.value.id, amount)
  if (result.success) {
    alert('입찰이 완료되었습니다.')
    await fetchGoodsDetail()
  } else {
    alert(result.message)
  }
}

async function toggleWishlist() {
  if (!isAuthenticated.value) {
    alert('로그인이 필요합니다.')
    router.push('/login')
    return
  }

  await goodsStore.toggleWishlist(goods.value.id)
}

async function handleDelete() {
  if (!confirm('정말 삭제하시겠습니까?')) return

  const result = await goodsStore.deleteGoods(goods.value.id)
  if (result.success) {
    alert('삭제되었습니다.')
    router.push('/goods')
  } else {
    alert(result.message)
  }
}

async function handleStopAuction() {
  if (!confirm('경매를 중지하시겠습니까? 참여자들에게 예치금이 환원됩니다.')) return

  const result = await goodsStore.stopAuction(goods.value.id)
  if (result.success) {
    alert('경매가 중지되었습니다.')
    await fetchGoodsDetail()
  } else {
    alert(result.message)
  }
}

function handleReport() {
  alert('신고가 접수되었습니다.')
}

function handleReportUser() {
  alert('신고가 접수되었습니다.')
}

onMounted(() => {
  fetchGoodsDetail()
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped>
.goods-detail-page {
  padding: 40px 0;
  min-height: calc(100vh - 100px);
  background: var(--bg-gradient);
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.owner-actions {
  display: flex;
  gap: 12px;
}

.detail-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-bottom: 60px;
}

.image-gallery {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-image {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-light);
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: var(--transition);
}

.main-image.completed img {
  filter: grayscale(0.75) brightness(0.8);
}

.detail-soldout {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.25);
  pointer-events: none;
}

.soldout-pill {
  background: rgba(20, 20, 20, 0.8);
  color: #fff;
  padding: 12px 32px;
  border-radius: 999px;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 2px;
  text-transform: uppercase;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3);
}

.thumbnail-list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
}

.thumbnail {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: var(--transition);
}

.thumbnail:hover,
.thumbnail.active {
  border-color: var(--primary-red);
  transform: scale(1.05);
}

.thumbnail.completed {
  filter: grayscale(0.7);
  opacity: 0.75;
}

.goods-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.goods-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.goods-title {
  font-size: 32px;
  font-weight: 900;
  color: var(--text-dark);
}

.goods-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.seller {
  font-size: 16px;
  color: var(--text-gray);
}

.report-user-btn {
  background: none;
  border: none;
  color: var(--text-light);
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
}

.status-badge-wrapper {
  margin-top: -8px;
}

.status-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 700;
  color: white;
}

.status-waiting {
  background: var(--text-light);
}

.status-ongoing {
  background: var(--primary-red);
}

.status-completed {
  background: var(--text-gray);
}

.auction-info {
  background: var(--bg-light);
  padding: 24px;
  border-radius: 12px;
}

.price-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-label {
  font-size: 14px;
  color: var(--text-gray);
}

.price-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-dark);
}

.price-value.highlight {
  color: var(--primary-red);
  font-size: 28px;
}

.timer-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.timer-label {
  font-size: 14px;
  color: var(--text-gray);
}

.timer-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-red);
}

.action-section {
  display: flex;
  gap: 12px;
}

.bid-btn {
  flex: 1;
  padding: 16px;
  font-size: 18px;
  font-weight: 700;
}

.wishlist-btn {
  padding: 16px 24px;
  border: 2px solid var(--primary-red);
  background: white;
  color: var(--primary-red);
  border-radius: 8px;
  font-weight: 600;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 8px;
}

.wishlist-btn.active {
  background: var(--primary-red);
  color: white;
}

.heart-icon-detail {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.heart-icon-detail svg {
  width: 100%;
  height: 100%;
  transition: var(--transition);
}

.heart-icon-detail.filled svg {
  animation: heart-pop 0.3s ease-out;
}

@keyframes heart-pop {
  0% {
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.goods-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 24px;
  background: var(--bg-light);
  border-radius: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: var(--text-light);
}

.detail-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-dark);
}

.description-section {
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: var(--card-shadow);
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 16px;
}

.description {
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-gray);
  white-space: pre-wrap;
}

.bidders-section {
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: var(--card-shadow);
}

.bidders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bidder-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-light);
  border-radius: 8px;
}

.bidder-item.winner {
  background: rgba(230, 57, 70, 0.1);
  border: 2px solid var(--primary-red);
}

.bidder-rank {
  font-weight: 700;
  color: var(--primary-red);
  min-width: 40px;
}

.bidder-name {
  flex: 1;
  font-weight: 500;
}

.bidder-price {
  font-weight: 700;
  color: var(--primary-red);
}

.comments-section {
  margin-top: 40px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: var(--card-shadow);
}

.loading,
.error-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-light);
  font-size: 16px;
}

@media (max-width: 968px) {
  .detail-content {
    grid-template-columns: 1fr;
  }
}
</style>

