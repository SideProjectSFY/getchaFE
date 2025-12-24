import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './styles/main.css'

// 앱 부팅 시 토큰만 남아 있는 경우, 사용자 정보 복구
async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)

  // 새로고침 시 토큰만 남았을 때 사용자 정보를 먼저 복구
  const authStore = useAuthStore(pinia)
  if (localStorage.getItem('token')) {
    await authStore.checkAuth()
  }

  app.use(router)

  app.mount('#app')
}

bootstrap()