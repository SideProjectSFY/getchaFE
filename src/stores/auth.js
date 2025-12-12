import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)

  //토큰과 사용자 정보가 둘 다 있을 때만 !
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  //서버에 로그인 요청
  async function login(credentials) {
    try {
      const response = await api.post('/auth/login', {
        email: credentials.email,
        password: credentials.password
      })
      //백엔드 응답 형식
      const payload = response.data?.data || response.data || {}
      //백엔드 응답 중 토큰 형식
      token.value = payload.accessToken || payload.token || payload.jwt || null
      //백엔드 응답 중 사용자 정보 객체를 user 상태에 저장
      user.value = payload.user || null

      if (!token.value || !user.value) {
        return { success: false, message: 'ID, 비밀번호가 일치하지 않습니다.' }
      }

      // 토큰 로컬스토리지 저장 + 새로고침 시 유지
      localStorage.setItem('token', token.value)
      // 헤더 형식 지정
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '로그인에 실패했습니다.' }
    }
  }

  async function register(userData) {
    try {
      await api.post('/auth/signup', userData)
      // 회원가입 성공 후 자동 로그인
      const loginResult = await login({ email: userData.email, password: userData.password })
      if (loginResult.success) {
        return { success: true }
      }
      return { success: false, message: '회원가입은 완료되었으나 로그인에 실패했습니다.' }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '회원가입에 실패했습니다.' }
    }
  }

  async function checkAuth() {
    if (!token.value) return false
    
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      const response = await api.get('/user/me')
      const payload = response.data?.data || response.data || null
      if (!payload) {
        logout()
        return false
      }
      user.value = payload
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
      const payload = response.data?.data || response.data || null
      if (payload) {
        user.value = payload
      }
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

