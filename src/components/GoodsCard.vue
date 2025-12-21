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
      <div class="goods-header">
        <div class="goods-title-row">
          <h3 class="goods-title">{{ goods.title }}</h3>
        </div>
        <div class="goods-meta-row">
          <span v-if="goods.category" class="category-badge">{{ formatCategory(goods.category) }}</span>
          <span v-if="goods.animeTitle" class="anime-title">{{ goods.animeTitle }}</span>
        </div>
        <div class="seller-info">
          <span class="seller-label">판매자</span>
          <span class="seller-name">{{ goods.sellerNickname }}</span>
        </div>
      </div>
      <div class="goods-price">
        <span class="current-bid">{{ goods.currentBidAmount ? '현재 입찰가' : '시작가' }}</span>
        <span class="price">{{ formatPrice(goods.currentBidAmount || goods.startPrice) }}</span>
      </div>
      <div class="goods-footer">
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
import { formatPrice, formatTimeRemaining, formatCategory } from '../utils/format'
import { getImageUrl } from '../utils/image'
import { useTimeRemaining } from '../composables/useTimeRemaining'

const props = defineProps({
  goods: {
    type: Object,
    required: true
  },
  // 추가로 업데이트할 굿즈 리스트들 (예: popularGoods, recommendedGoods)
  additionalLists: {
    type: Array,
    default: () => []
  }
})

const router = useRouter()
const authStore = useAuthStore()
const goodsStore = useGoodsStore()

// 백엔드에서 받은 checkWish 값으로 찜 상태 확인
const isWishlisted = computed(() => {
  return props.goods.checkWish === true
})
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
  
  // 현재 checkWish 상태를 전달하여 올바른 요청(POST/DELETE)이 가도록 함
  // additionalLists가 있으면 wishStore를 직접 호출하여 추가 리스트도 업데이트
  if (props.additionalLists && props.additionalLists.length > 0) {
    const { useWishStore } = await import('../stores/wish')
    const wishStore = useWishStore()
    const { useGoodsStore } = await import('../stores/goods')
    const goodsStore = useGoodsStore()
    
    const result = await wishStore.toggleWishlist(props.goods.goodsId, props.goods.checkWish, {
      goodsList: goodsStore.goodsList,
      currentGoods: goodsStore.currentGoods,
      additionalLists: props.additionalLists
    })
    
    if (!result.success) {
      alert(result.message || '찜하기 처리에 실패했습니다.')
    }
  } else {
    const result = await goodsStore.toggleWishlist(props.goods.goodsId, props.goods.checkWish)
    
    if (!result.success) {
      alert(result.message || '찜하기 처리에 실패했습니다.')
    }
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

.goods-header {
  margin-bottom: 12px;
}

.goods-title-row {
  margin-bottom: 8px;
}

.goods-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-dark);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
  margin-bottom: 6px;
}

.goods-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.category-badge {
  font-size: 11px;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 4px 10px;
  border-radius: 12px;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.anime-title {
  font-size: 12px;
  color: var(--text-gray);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.seller-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-light);
}

.seller-label {
  font-weight: 500;
  color: var(--text-light);
}

.seller-name {
  font-weight: 600;
  color: var(--text-dark);
  position: relative;
  padding-left: 8px;
}

.seller-name::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--primary-red);
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

.goods-footer {
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

