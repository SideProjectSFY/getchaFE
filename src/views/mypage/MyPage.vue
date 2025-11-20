<template>
  <div class="mypage">
    <div class="container">
      <div class="mypage-layout">
        <aside class="sidebar">
          <div class="user-profile">
            <img
              :src="user?.profileImage || '/placeholder.png'"
              :alt="user?.nickname"
              class="profile-image"
            />
            <h2 class="profile-name getcha-brand-text">{{ user?.nickname }}</h2>
            <p class="profile-email">{{ user?.email }}</p>
          </div>

          <nav class="sidebar-nav">
            <router-link
              v-for="item in menuItems"
              :key="item.to"
              :to="item.to"
              class="nav-item"
            >
              <span class="nav-gachaball">
                <span class="ball-top"></span>
                <span class="ball-bottom"></span>
                <span class="ball-button"></span>
              </span>
              <span class="nav-label">{{ item.label }}</span>
            </router-link>
          </nav>
        </aside>

        <main class="content">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const user = computed(() => authStore.user)

const menuItems = [
  { to: '/mypage/wishlist', label: '찜 리스트' },
  { to: '/mypage/registered', label: '등록 경매' },
  { to: '/mypage/participated', label: '참여 경매' },
  { to: '/mypage/transactions', label: '거래 내역' },
  { to: '/mypage/wallet', label: '자산 현황' },
  { to: '/mypage/favorites', label: '관심 애니메이션' },
  { to: '/mypage/profile', label: '정보 수정' }
]
</script>

<style scoped>
.mypage {
  padding: 60px 0;
  min-height: calc(100vh - 100px);
  background: #fdfdfd;
}

.container {
  position: relative;
}

.mypage-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 32px;
}

.sidebar {
  background: white;
  border-radius: 24px;
  padding: 32px;
  box-shadow: var(--card-shadow);
  height: fit-content;
  position: sticky;
  top: 100px;
}

.user-profile {
  text-align: center;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
}

.profile-image {
  width: 96px;
  height: 96px;
  border-radius: 24px;
  object-fit: cover;
  border: 3px solid rgba(255, 71, 87, 0.2);
  margin-bottom: 16px;
}

.profile-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 8px;
}

.profile-email {
  font-size: 13px;
  color: var(--text-light);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 20px;
  color: var(--text-dark);
  font-weight: 600;
  transition: var(--transition);
  text-decoration: none;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid transparent;
}

.nav-item:hover {
  background: rgba(255, 71, 87, 0.05);
  border-color: rgba(255, 71, 87, 0.1);
  color: var(--primary-red);
}

.nav-item.router-link-active {
  background: rgba(255, 71, 87, 0.08);
  border-color: rgba(255, 71, 87, 0.2);
  color: var(--primary-red);
}

.nav-gachaball {
  position: relative;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  pointer-events: none;
}

.ball-top,
.ball-bottom {
  position: absolute;
  left: 0;
  width: 100%;
  height: 52%;
  background: #ffe7f3;
  border-radius: 14px 14px 0 0;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
}

.ball-bottom {
  top: 48%;
  border-radius: 0 0 14px 14px;
  background: #ffb6d3;
}

.ball-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.nav-item:hover .ball-top {
  transform: translateY(-2px);
}

.nav-item.router-link-active .ball-top {
  transform: translateY(-5px);
}

.nav-item.router-link-active .ball-bottom {
  transform: translateY(3px);
}

.nav-label {
  flex: 1;
}

.content {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 28px;
  padding: 40px;
  box-shadow: var(--card-shadow-hover);
  min-height: 600px;
}

@media (max-width: 968px) {
  .mypage-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
    top: auto;
  }
}
</style>

