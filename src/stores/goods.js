import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'
import { categoryImages } from '../data/categoryImages'
import { calculateTimeRemaining } from '../utils/format'
import { CATEGORY_MAP } from '../utils/category'
import { extractArrayResponse } from '../utils/responseApi'

export const useGoodsStore = defineStore('goods', () => {
  const goodsList = ref([])
  const currentGoods = ref(null)
  const wishlist = ref(JSON.parse(localStorage.getItem('wishlist') || '[]'))
  
  // 페이징 정보
  const pagination = ref({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    size: 10
  })
  
  // 무한 스크롤을 위한 플래그
  const hasMore = ref(true)
  const isLoadingMore = ref(false)
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

  // 카테고리 매핑 (한글 -> 영문) - 공통 상수 사용
  const categoryMapping = CATEGORY_MAP

  // 카테고리 옵션: { 한글명, 영문값 } 배열 (드롭다운용)
  const categoryOptions = computed(() => {
    return categories.value
      .filter(c => c !== 'ALL')
      .map(korean => ({
        label: korean,
        value: categoryMapping[korean] || korean
      }))
  })

  // URL 쿼리에서 받은 카테고리 값을 영문으로 변환 (한글이면 변환, 이미 영문이면 그대로)
  function convertCategoryToEnglish(categoryValue) {
    if (!categoryValue) return ''
    // 한글 카테고리면 영문으로 변환
    if (categoryMapping[categoryValue]) {
      return categoryMapping[categoryValue]
    }
    // 이미 영문이거나 매핑되지 않은 값이면 그대로 반환
    return categoryValue
  }

  // 백엔드 응답 데이터 변환 (images만 배열로 변환, 나머지는 백엔드 변수명 그대로)
  function transformGoodsItem(item) {
    return {
      ...item,
      // mainFilePath를 images 배열로 변환 (기존 코드 호환을 위해)
      images: item.mainFilePath ? [item.mainFilePath] : [],
      // timeRemaining 계산
      timeRemaining: calculateTimeRemaining(item.auctionEndAt)
    }
  }

  async function fetchGoodsList(filters = {}, page = 1, size = 10, append = false) {
    try {
      // append 모드일 때는 로딩 플래그 설정
      if (append) {
        isLoadingMore.value = true
      }
      
      // filters에 이미 백엔드 형식으로 변환된 값들이 들어옴 (영문 카테고리 포함)
      const params = { ...filters, page, size }
      
      const response = await api.get('/goods/list', { params })
      
      // 응답 구조: response.data.data.items 또는 response.data.items
      const responseData = response.data?.data || response.data
      const items = responseData?.items || []
      
      // 백엔드 데이터를 프론트엔드 형식으로 변환
      const transformedItems = items.map(item => transformGoodsItem(item))
      
      // append 모드면 기존 리스트에 추가, 아니면 교체
      if (append) {
        goodsList.value = [...goodsList.value, ...transformedItems]
      } else {
        goodsList.value = transformedItems
      }
      
      // 페이징 정보 저장
      if (responseData) {
        pagination.value = {
          currentPage: responseData.currentPage || page,
          totalPages: responseData.totalPages || 1,
          totalCount: responseData.totalCount || items.length,
          size: responseData.size || size
        }
        
        // 무한 스크롤: 현재 페이지가 전체 페이지보다 작으면 더 있을 수 있음
        hasMore.value = (responseData.currentPage || page) < (responseData.totalPages || 1)
      } else {
        hasMore.value = false
      }
      
      if (append) {
        isLoadingMore.value = false
      }
      
      return { success: true }
    } catch (error) {
      if (append) {
        isLoadingMore.value = false
      }
      return { success: false, message: error.response?.data?.message || '굿즈 목록을 불러오는데 실패했습니다.' }
    }
  }

  async function fetchGoodsDetail(id) {
    try {
      const response = await api.get(`/goods`, { params: { goodsId: id } })
      const responseData = response.data?.data || response.data
      
      // 백엔드 응답 형식 변환
      const goodDetail = responseData?.goodDetail || {}
      const imageList = responseData?.imageList || []
      const participants = responseData?.participants || []
      
      // 프론트엔드에서 사용할 형식으로 변환
      currentGoods.value = {
        ...goodDetail,
        // 이미지 리스트를 sortOrder 기준으로 정렬하여 배열로 변환
        images: [...imageList]
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
          .map(img => img.filePath),
        // 참여자 리스트 변환
        bidders: participants.map(p => ({
          id: p.bidId,
          bidderId: p.bidderId,
          nickname: p.bidderNickName,
          profileFilePath: p.bidderProfileFilePath,
          bidAmount: p.bidAmount,
          rank: p.bidRank,
          highest: p.highest
        })).sort((a, b) => b.bidAmount - a.bidAmount)
      }
      
      return { success: true }
    } catch (error) {
      // 403 에러는 로그인이 필요한 경우
      if (error.response?.status === 403) {
        return { 
          success: false, 
          requiresAuth: true,
          message: '로그인이 필요합니다. 로그인 후 다시 시도해주세요.' 
        }
      }
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

  async function toggleWishlist(goodsId, currentCheckWish = null) {
    try {
      // currentCheckWish가 제공되면 우선 사용, 없으면 로컬 스토리지 확인
      // currentGoods가 있고 checkWish가 있으면 그것을 사용
      let isWishlisted = false
      if (currentCheckWish !== null) {
        isWishlisted = currentCheckWish
      } else if (currentGoods.value?.goodsId === goodsId && currentGoods.value?.checkWish !== undefined) {
        isWishlisted = currentGoods.value.checkWish
      } else {
        isWishlisted = wishlist.value.includes(goodsId)
      }
      
      if (isWishlisted) {
        // 찜 취소 - DELETE 요청
        const response = await api.delete('/wish', { params: { goodsId } })
        const responseData = response.data?.data || response.data
        const checkWish = responseData?.checkWish || false
        
        // 로컬 스토리지에서 제거
        wishlist.value = wishlist.value.filter(id => id !== goodsId)
        saveWishlist()
        
        return { success: true, isWishlisted: checkWish, checkWish }
      } else {
        // 찜 등록 - POST 요청
        const response = await api.post('/wish', null, { params: { goodsId } })
        const responseData = response.data?.data || response.data
        const checkWish = responseData?.checkWish || false
        const wishId = responseData?.wishId
        
        // 로컬 스토리지에 추가
        if (!wishlist.value.includes(goodsId)) {
          wishlist.value.push(goodsId)
        }
        saveWishlist()
        
        return { success: true, isWishlisted: checkWish, checkWish, wishId }
      }
    } catch (error) {
      const status = error.response?.status
      let message = '찜하기 처리에 실패했습니다.'
      
      // 에러 처리 시에도 동일한 로직으로 찜 상태 확인
      let isWishlistedForError = false
      if (currentCheckWish !== null) {
        isWishlistedForError = currentCheckWish
      } else if (currentGoods.value?.goodsId === goodsId && currentGoods.value?.checkWish !== undefined) {
        isWishlistedForError = currentGoods.value.checkWish
      } else {
        isWishlistedForError = wishlist.value.includes(goodsId)
      }
      
      if (isWishlistedForError) {
        // 찜 취소 시 에러 처리
        if (status === 404) {
          message = '존재하지 않는 굿즈입니다.'
        } else if (status === 500) {
          message = '찜 취소하는 것에 실패하였습니다.'
        } else {
          message = error.response?.data?.message || '찜 취소에 실패했습니다.'
        }
      } else {
        // 찜 등록 시 에러 처리
        if (status === 403) {
          message = '본인의 굿즈는 찜할 수 없습니다.'
        } else if (status === 404) {
          message = '존재하지 않는 굿즈입니다.'
        } else if (status === 409) {
          message = '이미 찜한 굿즈입니다.'
        } else if (status === 500) {
          message = '찜 등록에 실패하였습니다.'
        } else {
          message = error.response?.data?.message || '찜 등록에 실패했습니다.'
        }
      }
      
      return { 
        success: false, 
        message 
      }
    }
  }

  function isWishlisted(goodsId) {
    return wishlist.value.includes(goodsId)
  }

  async function fetchWishlist() {
    try {
      const response = await api.get('/user/me/wish')
      const data = extractArrayResponse(response)
      return { 
        success: true, 
        data 
      }
    } catch (error) {
      // 401 에러는 인증이 필요한 경우 (토큰 만료 또는 유효하지 않음)
      if (error.response?.status === 401) {
        return { 
          success: false, 
          requiresAuth: true,
          data: [],
          message: '로그인이 필요합니다. 로그인 후 다시 시도해주세요.' 
        }
      }
      console.error('찜 목록 로딩 실패:', error)
      return { 
        success: false, 
        data: [],
        message: error.response?.data?.message || '찜 목록을 불러오는데 실패했습니다.' 
      }
    }
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
    categoryOptions,
    pagination,
    hasMore,
    isLoadingMore,
    convertCategoryToEnglish,
    getCategoryImage,
    transformGoodsItem,
    fetchGoodsList,
    fetchGoodsDetail,
    registerGoods,
    updateGoods,
    deleteGoods,
    toggleWishlist,
    isWishlisted,
    fetchWishlist,
    placeBid,
    stopAuction
  }
})

