import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'
// 목데이터 의존 제거: 실제 백엔드만 사용

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  async function login(credentials) {
    try {
      const response = await api.post('/auth/login', {
        email: credentials.email,
        password: credentials.password
      })
      token.value = response.data.token
      user.value = response.data.user
      localStorage.setItem('token', token.value)
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '로그인에 실패했습니다.' }
    }
  }

  async function register(userData) {
    try {
      const response = await api.post('/auth/signup', userData)
      token.value = response.data.token
      user.value = response.data.user
      localStorage.setItem('token', token.value)
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '회원가입에 실패했습니다.' }
    }
  }

  async function checkAuth() {
    if (!token.value) return false
    
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      const response = await api.get('/user/me')
      user.value = response.data
      return true
    } catch (error) {
      logout()
      return false
    }
  }

  async function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
  }

  async function updateProfile(profileData) {
    try {
      const response = await api.put('/user/me', profileData)
      user.value = response.data
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '프로필 수정에 실패했습니다.' }
    }
  }

  async function withdraw() {
    try {
      await api.delete('/user/me')
      await logout()
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '탈퇴에 실패했습니다.' }
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    checkAuth,
    logout,
    updateProfile,
    withdraw
  }
})

