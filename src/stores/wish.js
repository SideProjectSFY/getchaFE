import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'
import { extractArrayResponse } from '../utils/responseApi'

export const useWishStore = defineStore('wish', () => {
  // 서버에서 받은 찜 목록 데이터
  const wishlistData = ref([])

  /**
   * 찜 등록/취소 토글
   * @param {number} goodsId - 굿즈 ID
   * @param {boolean|null} currentCheckWish - 현재 찜 상태 (필수)
   * @param {Object} options - 추가 옵션 (goodsList, currentGoods, additionalLists 업데이트용)
   * @returns {Promise<Object>} { success, checkWish, wishId, wishCount, message }
   */
  async function toggleWishlist(goodsId, currentCheckWish, options = {}) {
    try {
      const { goodsList, currentGoods, additionalLists = [] } = options
      
      // currentCheckWish는 필수 (서버 응답값 사용)
      if (currentCheckWish === null || currentCheckWish === undefined) {
        // currentGoods에서 확인 시도
        if (currentGoods?.value?.goodsId === goodsId && currentGoods?.value?.checkWish !== undefined) {
          currentCheckWish = currentGoods.value.checkWish
        } else {
          throw new Error('찜 상태를 확인할 수 없습니다.')
        }
      }
      
      const isWishlisted = currentCheckWish === true
      
      if (isWishlisted) {
        // 찜 취소 - DELETE 요청
        const response = await api.delete('/wish', { params: { goodsId } })
        const responseData = response.data?.data || response.data
        const checkWish = responseData?.checkWish || false
        const wishCount = responseData?.wishCount
        
        // wishlistData에서 해당 굿즈 제거
        wishlistData.value = wishlistData.value.filter(item => item.goodsId !== goodsId)
        
        // goodsList에서 해당 굿즈의 wishCount와 checkWish 업데이트
        if (goodsList?.value) {
          const goodsItem = goodsList.value.find(item => item.goodsId === goodsId)
          if (goodsItem) {
            goodsItem.checkWish = checkWish
            if (wishCount !== undefined) {
              goodsItem.wishCount = wishCount
            }
          }
        }
        
        // currentGoods도 업데이트
        if (currentGoods?.value?.goodsId === goodsId) {
          currentGoods.value.checkWish = checkWish
          if (wishCount !== undefined) {
            currentGoods.value.wishCount = wishCount
          }
        }
        
        // additionalLists (popularGoods 등) 업데이트
        additionalLists.forEach((list, listIndex) => {
          // list가 ref인 경우 (ref([]) 형태)
          if (list && typeof list === 'object' && 'value' in list) {
            const goodsItem = list.value.find(item => item.goodsId === goodsId)
            if (goodsItem) {
              // 객체의 속성을 직접 수정 (Vue 반응성 유지)
              // props.goods가 참조하는 객체를 직접 수정하므로 자동으로 반영됨
              goodsItem.checkWish = checkWish
              if (wishCount !== undefined) {
                goodsItem.wishCount = wishCount
              }
            }
          }
        })
        
        return { success: true, isWishlisted: checkWish, checkWish, wishCount }
      } else {
        // 찜 등록 - POST 요청
        const response = await api.post('/wish', null, { params: { goodsId } })
        const responseData = response.data?.data || response.data
        const checkWish = responseData?.checkWish || false
        const wishId = responseData?.wishId
        const wishCount = responseData?.wishCount
        
        // wishlistData에 해당 굿즈 추가 (이미 있으면 업데이트)
        const existingIndex = wishlistData.value.findIndex(item => item.goodsId === goodsId)
        if (existingIndex >= 0) {
          // 이미 있으면 업데이트
          wishlistData.value[existingIndex] = { ...wishlistData.value[existingIndex], checkWish }
        } else {
          // 없으면 추가 - goodsList, currentGoods, 또는 additionalLists에서 굿즈 정보 찾기
          let goodsItemToAdd = null
          
          // 1. currentGoods에서 찾기
          if (currentGoods?.value?.goodsId === goodsId) {
            goodsItemToAdd = { ...currentGoods.value, checkWish, wishId }
          }
          // 2. goodsList에서 찾기
          else if (goodsList?.value) {
            const found = goodsList.value.find(item => item.goodsId === goodsId)
            if (found) {
              goodsItemToAdd = { ...found, checkWish, wishId }
            }
          }
          // 3. additionalLists에서 찾기
          if (!goodsItemToAdd) {
            for (const list of additionalLists) {
              if (list && typeof list === 'object' && 'value' in list) {
                const found = list.value.find(item => item.goodsId === goodsId)
                if (found) {
                  goodsItemToAdd = { ...found, checkWish, wishId }
                  break
                }
              }
            }
          }
          
          // 찾은 굿즈 정보를 wishlistData에 추가
          if (goodsItemToAdd) {
            wishlistData.value.push(goodsItemToAdd)
          } else {
            // 굿즈 정보를 찾지 못한 경우 최소한의 정보로 추가 (Header 개수 업데이트용)
            wishlistData.value.push({ goodsId, wishId, checkWish })
          }
        }
        
        // goodsList에서 해당 굿즈의 wishCount와 checkWish 업데이트
        if (goodsList?.value) {
          const goodsItem = goodsList.value.find(item => item.goodsId === goodsId)
          if (goodsItem) {
            goodsItem.checkWish = checkWish
            if (wishCount !== undefined) {
              goodsItem.wishCount = wishCount
            }
          }
        }
        
        // currentGoods도 업데이트
        if (currentGoods?.value?.goodsId === goodsId) {
          currentGoods.value.checkWish = checkWish
          if (wishCount !== undefined) {
            currentGoods.value.wishCount = wishCount
          }
        }
        
        // additionalLists (popularGoods 등) 업데이트
        additionalLists.forEach((list, listIndex) => {
          // list가 ref인 경우 (ref([]) 형태)
          if (list && typeof list === 'object' && 'value' in list) {
            const goodsItem = list.value.find(item => item.goodsId === goodsId)
            if (goodsItem) {
              // 객체의 속성을 직접 수정 (Vue 반응성 유지)
              // props.goods가 참조하는 객체를 직접 수정하므로 자동으로 반영됨
              goodsItem.checkWish = checkWish
              if (wishCount !== undefined) {
                goodsItem.wishCount = wishCount
              }
            }
          }
        })
        
        return { success: true, isWishlisted: checkWish, checkWish, wishId, wishCount }
      }
    } catch (error) {
      const status = error.response?.status
      let message = '찜하기 처리에 실패했습니다.'
      
      // 에러 처리 시에도 동일한 로직으로 찜 상태 확인
      let isWishlistedForError = false
      if (currentCheckWish !== null && currentCheckWish !== undefined) {
        isWishlistedForError = currentCheckWish
      } else if (options.currentGoods?.value?.goodsId === goodsId && options.currentGoods?.value?.checkWish !== undefined) {
        isWishlistedForError = options.currentGoods.value.checkWish
      } else {
        // 찜 상태를 확인할 수 없으면 기본값 false
        isWishlistedForError = false
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

  /**
   * 사용자의 찜 목록 조회
   * @returns {Promise<Object>} { success, data, message }
   */
  async function fetchWishlist() {
    try {
      const response = await api.get('/user/me/wish')
      const data = extractArrayResponse(response)
      wishlistData.value = data || []
      return { 
        success: true, 
        data 
      }
    } catch (error) {
      // 401 에러는 인증이 필요한 경우 (토큰 만료 또는 유효하지 않음)
      if (error.response?.status === 401) {
        wishlistData.value = []
        return { 
          success: false, 
          requiresAuth: true,
          data: [],
          message: '로그인이 필요합니다. 로그인 후 다시 시도해주세요.' 
        }
      }
      console.error('찜 목록 로딩 실패:', error)
      wishlistData.value = []
      return { 
        success: false, 
        data: [],
        message: error.response?.data?.message || '찜 목록을 불러오는데 실패했습니다.' 
      }
    }
  }

  return {
    wishlistData,
    toggleWishlist,
    fetchWishlist
  }
})

