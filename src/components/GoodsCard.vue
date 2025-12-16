<template>
  <router-link :to="{ path: '/goods', query: { goodsId: goods.goodsId } }" class="goods-card" :class="{ completed: goods.auctionStatus === 'COMPLETED' || goods.auctionStatus === 'STOPPED' }">
    <div class="goods-image-wrapper">
      <img :src="getImageUrl(goods.images?.[0] || goods.mainFilePath)" :alt="goods.title" class="goods-image" />
      <div class="goods-overlay">
        <div class="wishlist-btn" @click.prevent="toggleWishlist" :class="{ active: isWishlisted }">
          <span class="heart-icon" :class="{ filled: isWishlisted }">
            <svg v-if="isWishlisted" width="20" height="20" viewBox="0 0 24 24" fill="#FF0000" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </span>
        </div>
      </div>
      <div v-if="goods.auctionStatus === 'COMPLETED'" class="status-badge completed-badge">완료</div>
      <div v-else-if="goods.auctionStatus === 'PROCEEDING'" class="status-badge ongoing-badge">진행중</div>
      <div v-else-if="goods.auctionStatus === 'STOPPED'" class="status-badge stopped-badge">종료</div>
      <div v-if="goods.auctionStatus === 'COMPLETED'" class="soldout-overlay">
        <span class="soldout-pill">SOLD OUT</span>
      </div>
      <div v-if="goods.auctionStatus === 'STOPPED'" class="soldout-overlay">
        <span class="stopped-pill">STOPPED</span>
      </div>
    </div>
    
    <div class="goods-info">
      <div class="goods-title-row">
        <h3 class="goods-title">{{ goods.title }}</h3>
        <span class="goods-seller">{{ goods.sellerNickname }}</span>
      </div>
      <div class="goods-price">
        <span class="current-bid">{{ goods.currentBidAmount ? '현재 입찰가' : '시작가' }}</span>
        <span class="price">{{ formatPrice(goods.currentBidAmount || goods.startPrice) }}</span>
      </div>
      <div class="goods-meta">
        <span class="timer">{{ formatTimeRemaining(timeRemaining) }}</span>
        <span class="wish-count">찜 {{ goods.wishCount || 0 }}</span>
      </div>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useGoodsStore } from '../stores/goods'
import { formatPrice, formatTimeRemaining } from '../utils/format'
import { getImageUrl } from '../utils/image'
import { useTimeRemaining } from '../composables/useTimeRemaining'

const props = defineProps({
  goods: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const authStore = useAuthStore()
const goodsStore = useGoodsStore()

const isWishlisted = computed(() => goodsStore.isWishlisted(props.goods.goodsId))
const isAuthenticated = computed(() => authStore.isAuthenticated)

// 실시간으로 계산된 남은 시간 (composable 사용)
const { timeRemaining } = useTimeRemaining({
  auctionEndAt: computed(() => props.goods.auctionEndAt),
  auctionStatus: computed(() => props.goods.auctionStatus)
})

async function toggleWishlist() {
  if (!isAuthenticated.value) {
    alert('로그인이 필요합니다.')
    router.push('/login')
    return
  }
  
  const result = await goodsStore.toggleWishlist(props.goods.goodsId)
  
  if (!result.success) {
    alert(result.message || '찜하기 처리에 실패했습니다.')
  }
}
</script>

<style scoped>
.goods-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--card-shadow);
  transition: var(--transition);
  text-decoration: none;
  color: inherit;
  display: block;
  border: 2px solid transparent;
  position: relative;
}


.goods-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.goods-card.completed {
  opacity: 0.6;
  background: #f5f5f5;
}

.soldout-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.soldout-pill, .stopped-pill {
  color: white;
  padding: 12px 28px;
  border-radius: 999px;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.soldout-pill {
  background: rgba(248, 0, 45, 0.75);
  box-shadow: 0 10px 30px rgba(248, 0, 45, 0.35);
}

.stopped-pill {
  background: rgba(148, 140, 142, 0.75);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

.goods-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 100%; /* 1:1 비율 */
  overflow: hidden;
  background: var(--bg-light);
}

.goods-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: var(--transition);
}

.goods-card:hover .goods-image {
  transform: scale(1.05);
}

.goods-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0);
  transition: var(--transition);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 12px;
  opacity: 0;
}

.goods-card:hover .goods-overlay {
  background: rgba(0, 0, 0, 0.1);
  opacity: 1;
}

.wishlist-btn {
  background: white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: var(--transition);
}

.wishlist-btn:hover {
  transform: scale(1.1);
  background: #FFF5F5;
}

.wishlist-btn.active {
  background: #FFE5E5;
  box-shadow: 0 2px 12px rgba(220, 20, 60, 0.2);
}

.wishlist-btn.active:hover {
  background: #FFD5D5;
}

.heart-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.heart-icon svg {
  width: 100%;
  height: 100%;
  transition: var(--transition);
}

.heart-icon.filled svg {
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

.status-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  color: white;
}

.completed-badge {
  background: var(--text-gray);
}

.ongoing-badge {
  background: var(--primary-red);
}

.stopped-badge {
  background: #6c757d;
}

.goods-info {
  padding: 16px;
}

.goods-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.goods-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-dark);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.goods-seller {
  font-size: 12px;
  font-weight: 600;
  color: #856404;
  background: #fff3cd;
  padding: 4px 10px;
  border-radius: 12px;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(133, 100, 4, 0.15);
}

.goods-price {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.current-bid {
  font-size: 12px;
  color: var(--text-light);
}

.price {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary-red);
}

.goods-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-gray);
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.timer {
  font-weight: 600;
  color: var(--primary-red);
}
</style>

