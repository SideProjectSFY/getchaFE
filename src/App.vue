<template>
  <div id="app">
    <Header />
    <main class="main-content">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import Header from './components/layout/Header.vue'
import Footer from './components/layout/Footer.vue'

const authStore = useAuthStore()

onMounted(() => {
  // 토큰이 있으면 자동 로그인 시도
  const token = localStorage.getItem('token')
  if (token) {
    authStore.checkAuth()
  }
})
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: 100px; /* 헤더 높이만큼 */
  background: #FFFFFF;
}
</style>

