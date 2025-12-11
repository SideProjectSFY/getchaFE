<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1 class="login-title getcha-brand-text">Getcha</h1>
          <p class="login-subtitle">로그인 후 겟챠 하세요</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="email">이메일</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              placeholder="이메일을 입력하세요"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="password">비밀번호</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              placeholder="비밀번호를 입력하세요"
              class="form-input"
            />
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <button type="submit" class="btn-primary login-btn" :disabled="loading">
            {{ loading ? '로그인 중...' : '로그인' }}
          </button>
        </form>

        <div class="login-footer">
          <p>계정이 없으신가요?</p>
          <router-link to="/register" class="register-link">회원가입</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: ''
})

const loading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  loading.value = true
  errorMessage.value = ''

  const result = await authStore.login(form.value)

  if (result.success) {
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } else {
    errorMessage.value = result.message
  }

  loading.value = false
}
</script>

<style scoped>
.login-page {
  min-height: calc(100vh - 100px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--bg-gradient);
  position: relative;
  overflow: hidden;
}


.login-container {
  width: 100%;
  max-width: 440px;
}

.login-card {
  background: white;
  border-radius: 20px;
  padding: 48px 40px;
  box-shadow: 0 8px 32px rgba(230, 57, 70, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-title {
  font-size: 42px;
  font-weight: 900;
  color: var(--primary-red);
  margin-bottom: 12px;
}

.login-subtitle {
  font-size: 16px;
  color: var(--text-gray);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dark);
}

.form-input {
  padding: 14px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 15px;
  transition: var(--transition);
}

.form-input:focus {
  border-color: var(--primary-red);
  box-shadow: 0 0 0 3px rgba(230, 57, 70, 0.1);
}

.error-message {
  padding: 12px;
  background: rgba(230, 57, 70, 0.1);
  color: var(--primary-red);
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
}

.login-btn {
  width: 100%;
  margin-top: 8px;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  margin-top: 32px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-gray);
}

.register-link {
  color: var(--primary-red);
  font-weight: 600;
  text-decoration: none;
  transition: var(--transition);
}

.register-link:hover {
  text-decoration: underline;
}
</style>

