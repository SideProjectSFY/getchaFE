import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'
import { categoryImages } from '../data/categoryImages'

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
    '뱃지류',
    '기타'
  ])

  // 찜 목록 저장
  function saveWishlist() {
    localStorage.setItem('wishlist', JSON.stringify(wishlist.value))
  }

  async function fetchGoodsList(filters = {}) {
    try {
      const response = await api.get('/goods/list', { params: filters })
      goodsList.value = response.data?.items || []
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '굿즈 목록을 불러오는데 실패했습니다.' }
    }
  }

  async function fetchGoodsDetail(id) {
    try {
      const response = await api.get(`/goods`, { params: { goodsId: id } })
      currentGoods.value = response.data
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '굿즈 정보를 불러오는데 실패했습니다.' }
    }
  }

  async function registerGoods(goodsData) {
    try {
      const formData = new FormData()
      const { images, ...goodsRegister } = goodsData
      formData.append(
        'goodsRegister',
        new Blob([JSON.stringify(goodsRegister)], { type: 'application/json' })
      )
      if (Array.isArray(images)) {
        images.forEach(img => formData.append('imageFiles', img))
      }

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
      const { newImages, ...goodsModify } = goodsData
      formData.append(
        'goodsModify',
        new Blob([JSON.stringify({ ...goodsModify, goodsId: id })], { type: 'application/json' })
      )
      if (Array.isArray(newImages)) {
        newImages.forEach(img => formData.append('newImageFiles', img))
      }

      const response = await api.put(`/goods`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '굿즈 수정에 실패했습니다.' }
    }
  }

  async function deleteGoods(id) {
    try {
      await api.delete(`/goods`, { params: { goodsId: id } })
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '굿즈 삭제에 실패했습니다.' }
    }
  }

  async function toggleWishlist(goodsId) {
    // 백엔드 위시리스트 API 없음: 로컬 스토리지로만 처리
    const isWishlisted = wishlist.value.includes(goodsId)
    if (isWishlisted) {
      wishlist.value = wishlist.value.filter(id => id !== goodsId)
    } else {
      wishlist.value.push(goodsId)
    }
    saveWishlist()
    return { success: true, isWishlisted: !isWishlisted }
  }

  function isWishlisted(goodsId) {
    return wishlist.value.includes(goodsId)
  }

  async function placeBid(goodsId, bidAmount) {
    try {
      const response = await api.post(`/bid`, { goodsId, bidAmount })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '입찰에 실패했습니다.' }
    }
  }

  async function stopAuction(goodsId) {
    try {
      const response = await api.put(`/bid/stop-auction`, null, { params: { goodsId } })
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

