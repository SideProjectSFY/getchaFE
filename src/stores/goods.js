import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'
import { categoryImages } from '../data/mockData'

export const useGoodsStore = defineStore('goods', () => {
  const goodsList = ref([])
  const currentGoods = ref(null)
  const wishlist = ref(JSON.parse(localStorage.getItem('wishlist') || '[]'))
  const categories = ref([
    'ALL',
    '피규어',
    '포토카드',
    '아크릴 스탠드',
    '키링',
    '인형',
    '포스터',
    '그 외 굿즈',
    '기타'
  ])

  // 찜 목록 저장
  function saveWishlist() {
    localStorage.setItem('wishlist', JSON.stringify(wishlist.value))
  }

  async function fetchGoodsList(filters = {}) {
    try {
      const response = await api.get('/goods', { params: filters })
      goodsList.value = response.data
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '굿즈 목록을 불러오는데 실패했습니다.' }
    }
  }

  async function fetchGoodsDetail(id) {
    try {
      const response = await api.get(`/goods/${id}`)
      currentGoods.value = response.data
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '굿즈 정보를 불러오는데 실패했습니다.' }
    }
  }

  async function registerGoods(goodsData) {
    try {
      const formData = new FormData()
      Object.keys(goodsData).forEach(key => {
        if (key === 'images' && Array.isArray(goodsData[key])) {
          goodsData[key].forEach((image, index) => {
            formData.append(`images`, image)
          })
        } else {
          formData.append(key, goodsData[key])
        }
      })

      const response = await api.post('/goods', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '굿즈 등록에 실패했습니다.' }
    }
  }

  async function updateGoods(id, goodsData) {
    try {
      const formData = new FormData()
      Object.keys(goodsData).forEach(key => {
        if (key === 'images' && Array.isArray(goodsData[key])) {
          goodsData[key].forEach((image, index) => {
            formData.append(`images`, image)
          })
        } else {
          formData.append(key, goodsData[key])
        }
      })

      const response = await api.put(`/goods/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '굿즈 수정에 실패했습니다.' }
    }
  }

  async function deleteGoods(id) {
    try {
      await api.delete(`/goods/${id}`)
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '굿즈 삭제에 실패했습니다.' }
    }
  }

  async function toggleWishlist(goodsId) {
    try {
      const response = await api.post(`/goods/${goodsId}/wishlist`)
      const isWishlisted = wishlist.value.includes(goodsId)
      
      if (isWishlisted) {
        wishlist.value = wishlist.value.filter(id => id !== goodsId)
      } else {
        wishlist.value.push(goodsId)
      }
      
      saveWishlist()
      return { success: true, isWishlisted: !isWishlisted }
    } catch (error) {
      // API 실패 시 목 데이터로 동작
      const isWishlisted = wishlist.value.includes(goodsId)
      
      if (isWishlisted) {
        wishlist.value = wishlist.value.filter(id => id !== goodsId)
      } else {
        wishlist.value.push(goodsId)
      }
      
      saveWishlist()
      return { success: true, isWishlisted: !isWishlisted }
    }
  }

  function isWishlisted(goodsId) {
    return wishlist.value.includes(goodsId)
  }

  async function placeBid(goodsId, bidAmount) {
    try {
      const response = await api.post(`/goods/${goodsId}/bid`, { bidAmount })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '입찰에 실패했습니다.' }
    }
  }

  async function stopAuction(goodsId) {
    try {
      const response = await api.post(`/goods/${goodsId}/stop`)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '경매 중지에 실패했습니다.' }
    }
  }

  function getCategoryImage(category) {
    return categoryImages[category] || categoryImages['기타']
  }

  return {
    goodsList,
    currentGoods,
    wishlist,
    categories,
    getCategoryImage,
    fetchGoodsList,
    fetchGoodsDetail,
    registerGoods,
    updateGoods,
    deleteGoods,
    toggleWishlist,
    isWishlisted,
    placeBid,
    stopAuction
  }
})

