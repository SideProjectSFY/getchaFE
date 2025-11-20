import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'
import { validateUser, getUserById } from '../data/mockUsers'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  async function login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials)
      token.value = response.data.token
      user.value = response.data.user
      localStorage.setItem('token', token.value)
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      return { success: true }
    } catch (error) {
      // API 실패 시 목 데이터에서 검증
      const foundUser = validateUser(credentials.username, credentials.password)
      if (foundUser) {
        const { password, ...userWithoutPassword } = foundUser
        token.value = `mock_token_${foundUser.id}`
        user.value = userWithoutPassword
        localStorage.setItem('token', token.value)
        return { success: true }
      }
      return { success: false, message: error.response?.data?.message || '로그인에 실패했습니다.' }
    }
  }

  async function register(userData) {
    try {
      const response = await api.post('/auth/register', userData)
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
      const response = await api.get('/auth/me')
      user.value = response.data
      return true
    } catch (error) {
      // API 실패 시 목 데이터에서 확인
      if (token.value.startsWith('mock_token_')) {
        const userId = parseInt(token.value.replace('mock_token_', ''))
        const foundUser = getUserById(userId)
        if (foundUser) {
          const { password, ...userWithoutPassword } = foundUser
          user.value = userWithoutPassword
          return true
        }
      }
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
      const response = await api.put('/auth/profile', profileData)
      user.value = response.data
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '프로필 수정에 실패했습니다.' }
    }
  }

  async function withdraw() {
    try {
      await api.delete('/auth/withdraw')
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

