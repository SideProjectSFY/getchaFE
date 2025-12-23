<template>
  <header class="header">
    <div class="header-container">
      <router-link to="/" class="logo">
        <div class="logo-wrapper">
          <img 
            :src="logoPath" 
            alt="Getcha" 
            class="logo-image" 
            @error="handleLogoError"
            @load="handleLogoLoad"
          />
          <div v-if="!logoExists" class="logo-fallback">
            <span class="logo-pill"></span>
            <span class="logo-text getcha-brand-text">Getcha</span>
          </div>
        </div>
      </router-link>

      <nav class="nav">
        <router-link to="/" class="nav-brand-link">
          <div class="nav-brand getcha-brand-text">
            <span class="nav-brand-emoji orbit-left" aria-hidden="true"></span>
            <span class="nav-brand-text">Getcha</span>
            <span class="nav-brand-emoji orbit-right" aria-hidden="true"></span>
          </div>
        </router-link>
      </nav>

      <div class="header-actions">
        <NotificationBell v-if="isAuthenticated" />
        
        <div v-if="isAuthenticated" class="user-menu">
          <router-link to="/mypage/profile" class="nav-link">마이페이지</router-link>
          <router-link to="/mypage/wishlist" class="wishlist-button" aria-label="Wishlist">
            <svg viewBox="0 0 24 24" class="wishlist-icon" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span v-if="wishlistCount > 0" class="badge">{{ wishlistCount }}</span>
          </router-link>
          <button @click="handleLogout" class="btn-outline logout-btn">로그아웃</button>
        </div>
        
        <div v-else class="guest-menu">
          <router-link to="/login" class="btn-outline auth-btn">로그인</router-link>
          <router-link to="/register" class="btn-primary auth-btn primary-auth-btn">회원가입</router-link>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useGoodsStore } from '../../stores/goods'
import { useWishStore } from '../../stores/wish'
import NotificationBell from '../NotificationBell.vue'

const logoExists = ref(true)
const logoPath = ref('/logo.png')

// 로고 이미지 존재 여부 확인 및 찜 목록 불러오기
onMounted(async () => {
  const img = new Image()
  img.onload = () => {
    logoExists.value = true
  }
  img.onerror = () => {
    logoExists.value = false
  }
  img.src = logoPath.value
  // 강제로 이미지 로드 시도
  setTimeout(() => {
    if (!logoExists.value) {
      logoExists.value = true
    }
  }, 100)
  
  // 로그인 시 찜 목록 불러오기
  if (isAuthenticated.value) {
    await wishStore.fetchWishlist()
  }
})

// 로고 이미지 로드 성공
function handleLogoLoad() {
  logoExists.value = true
}

// 로고 이미지 에러 처리
function handleLogoError(event) {
  logoExists.value = false
  if (event.target) {
    event.target.style.display = 'none'
  }
}

const router = useRouter()
const authStore = useAuthStore()
const goodsStore = useGoodsStore()
const wishStore = useWishStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const wishlistCount = computed(() => wishStore.wishlistData.length)

// 로그인 상태 변경 감지하여 찜 목록 불러오기
watch(() => isAuthenticated.value, async (newValue) => {
  if (newValue) {
    await wishStore.fetchWishlist()
  } else {
    wishStore.wishlistData = []
  }
})

async function handleLogout() {
  await authStore.logout()
  wishStore.wishlistData = []
  router.push('/')
}
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #FFFFFF;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  z-index: 1000;
  height: 100px;
  border-bottom: 1px solid #E8E8E8;
}

.header-container {
  max-width: 100%;
  margin: 0;
  padding: 0 24px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  transition: var(--transition);
  height: 100%;
  padding: 5px 0;
  position: absolute;
  left: 0;
  padding-left: 0;
  z-index: 10;
}

.logo:hover {
  opacity: 0.9;
}

.logo-image {
  height: 100px;
  width: auto;
  max-width: 800px;
  min-width: 450px;
  object-fit: contain;
  display: block;
  background: transparent;
  /* 이미지 품질 향상 */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  opacity: 1;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  height: 100%;
  position: relative;
  overflow: visible;
}

.logo-fallback {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-pill {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ff4d6d, #ff8fa3);
  box-shadow: 0 8px 20px rgba(255, 77, 109, 0.4);
}

.logo-text {
  font-size: 32px;
  font-weight: 900;
  font-family: 'Rubik Bubbles', 'Modak', 'Rubik', 'Inter', 'Noto Sans KR', sans-serif;
  color: var(--primary-red);
  letter-spacing: -0.5px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.logo-emoji {
  font-size: 28px;
  margin-right: 8px;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  position: relative;
  margin-left: 250px;
  z-index: 1;
}

.nav-brand-link {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.nav-brand {
  font-size: 52px;
  font-weight: 400;
  letter-spacing: 2px;
  font-family: 'Rubik Bubbles', 'Modak', 'Rubik', 'Inter', 'Noto Sans KR', sans-serif;
  text-transform: none;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 32px;
  color: #FF0000;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  animation: jelly-bean-bounce 2.5s ease-in-out infinite;
  cursor: pointer;
  transition: var(--transition);
}

.nav-brand-text {
  position: relative;
  z-index: 1;
}

.nav-brand-emoji {
  position: absolute;
  bottom: 10px;
  width: 32px;
  height: 32px;
  pointer-events: none;
}

.nav-brand-emoji.orbit-left {
  left: -12px;
}

.nav-brand-emoji.orbit-right {
  right: -12px;
}

.nav-brand-emoji::before {
  content: '🎰';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 26px;
}

.nav-brand-emoji.orbit-left::before,
.nav-brand-emoji.orbit-right::before {
  animation: orbit-tiny-cw 3.5s linear infinite;
}

@keyframes orbit-tiny-cw {
  0% {
    transform: translate(-50%, -50%) rotate(0deg) translateX(6px) rotate(-0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg) translateX(6px) rotate(-360deg);
  }
}

.nav-brand-link:hover .nav-brand {
  transform: scale(1.05);
}

@keyframes jelly-bean-bounce {
  0%, 100% {
    transform: scale(1) rotate(0deg);
  }
  25% {
    transform: scale(1.04) rotate(-0.5deg);
  }
  50% {
    transform: scale(1.08) rotate(0deg);
  }
  75% {
    transform: scale(1.04) rotate(0.5deg);
  }
}

.nav-link {
  color: var(--text-dark);
  font-weight: 500;
  font-size: 15px;
  transition: var(--transition);
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-link:hover {
  color: var(--text-gray);
}

.nav-link.router-link-active {
  color: var(--text-dark);
  font-weight: 600;
}

.wishlist-link {
  position: relative;
}

.badge {
  background: var(--primary-red);
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  position: absolute;
  top: -8px;
  right: -12px;
}

.wishlist-button .badge {
  top: -4px;
  right: -4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-menu,
.guest-menu {
  display: flex;
  align-items: center;
  gap: 20px;
}

.auth-btn {
  min-width: 90px;
  text-align: center;
  padding: 10px 20px;
  font-weight: 600;
}

.primary-auth-btn {
  padding: 10px 20px;
}

.wishlist-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 0;
  background: transparent;
  border: none;
}

.wishlist-button:hover .wishlist-icon {
  transform: scale(1.08);
}

.wishlist-icon {
  width: 24px;
  height: 24px;
  fill: #ff3366;
  transition: var(--transition);
}

.logout-btn {
  margin-left: 8px;
}

@media (max-width: 768px) {
  .nav {
    display: none;
  }
  
  .header-container {
    padding: 0 16px;
  }
  
  .logo {
    left: 0;
    padding-left: 0;
  }
  
  .logo-image {
    height: 70px;
    max-width: 300px;
    min-width: 200px;
  }
  
  .nav {
    margin-left: 150px;
  }
  
  .nav-brand {
    font-size: 32px;
  }
  
  .nav-brand-emoji {
    font-size: 22px;
  }
}
</style>

₩