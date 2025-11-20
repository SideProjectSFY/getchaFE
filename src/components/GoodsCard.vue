<template>
  <router-link :to="`/goods/${goods.id}`" class="goods-card" :class="{ completed: goods.status === 'COMPLETED' }">
    <div class="goods-image-wrapper">
      <img :src="goods.images?.[0] || '/placeholder.png'" :alt="goods.title" class="goods-image" />
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
      <div v-if="goods.status === 'COMPLETED'" class="status-badge completed-badge">완료</div>
      <div v-else-if="goods.status === 'ONGOING'" class="status-badge ongoing-badge">진행중</div>
    </div>
    
    <div class="goods-info">
      <h3 class="goods-title">{{ goods.title }}</h3>
      <p class="goods-seller">판매자: {{ goods.sellerNickname }}</p>
      <div class="goods-price">
        <span class="current-bid">현재 입찰가</span>
        <span class="price">{{ formatPrice(goods.currentBid || goods.startPrice) }}</span>
      </div>
      <div class="goods-meta">
        <span class="timer">{{ formatTimeRemaining(goods.timeRemaining) }}</span>
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

const props = defineProps({
  goods: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const authStore = useAuthStore()
const goodsStore = useGoodsStore()

const isWishlisted = computed(() => goodsStore.isWishlisted(props.goods.id))
const isAuthenticated = computed(() => authStore.isAuthenticated)

async function toggleWishlist() {
  if (!isAuthenticated.value) {
    alert('로그인이 필요합니다.')
    router.push('/login')
    return
  }
  
  await goodsStore.toggleWishlist(props.goods.id)
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

.goods-info {
  padding: 16px;
}

.goods-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.goods-seller {
  font-size: 13px;
  color: var(--text-light);
  margin-bottom: 12px;
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

