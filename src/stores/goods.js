import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { categoryImages } from '../data/categoryImages'
import { calculateTimeRemaining } from '../utils/format'
import { CATEGORY_MAP } from '../utils/category'
import { placeBid as bidServicePlaceBid, stopAuction as bidServiceStopAuction } from '../services/bid'
import { 
  deleteGoods as goodsServiceDeleteGoods,
  fetchGoodsList as goodsServiceFetchGoodsList,
  fetchGoodsDetail as goodsServiceFetchGoodsDetail,
  registerGoods as goodsServiceRegisterGoods,
  updateGoods as goodsServiceUpdateGoods
} from '../services/goods'

export const useGoodsStore = defineStore('goods', () => {
  const goodsList = ref([])
  const currentGoods = ref(null)
  
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
  // checkWish, wishCount 등 모든 속성은 ...item으로 자동 포함됨
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
      
      // 서비스 레이어 호출 (API 호출만 수행)
      const result = await goodsServiceFetchGoodsList(filters, page, size)
      
      if (!result.success) {
        if (append) {
          isLoadingMore.value = false
        }
        return result
      }
      
      // 서비스에서 받은 데이터 처리 (상태 관리)
      const responseData = result.data || {}
      const items = responseData.items || []
      
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
      return { success: false, message: '굿즈 목록을 불러오는데 실패했습니다.' }
    }
  }

  async function fetchGoodsDetail(id) {
    try {
      // 서비스 레이어 호출 (API 호출만 수행)
      const result = await goodsServiceFetchGoodsDetail(id)
      
      if (!result.success) {
        // 403 에러는 로그인이 필요한 경우
        if (result.requiresAuth) {
          return {
            success: false,
            requiresAuth: true,
            message: result.message || '로그인이 필요합니다. 로그인 후 다시 시도해주세요.'
          }
        }
        return result
      }
      
      // 서비스에서 받은 데이터 처리 (데이터 변환 및 상태 관리)
      const responseData = result.data || {}
      
      // 백엔드 응답 형식 변환
      const goodDetail = responseData?.goodDetail || {}
      const imageList = responseData?.imageList || []
      const participants = responseData?.participants || []
      
      // 이미지 리스트를 sortOrder 기준으로 정렬
      const sortedImageList = [...imageList]
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))

      // 프론트엔드에서 사용할 형식으로 변환
      currentGoods.value = {
        ...goodDetail,
        // 이미지 URL 배열 (기존 호환성 유지)
        images: sortedImageList.map(img => img.filePath),
        // 이미지 전체 정보 (수정 시 imageId, sortOrder 필요)
        imageListInfo: sortedImageList.map(img => ({
          imageId: img.imageId,
          filePath: img.filePath,
          sortOrder: img.sortOrder || 0
        })),
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
      return { success: false, message: '굿즈 정보를 불러오는데 실패했습니다.' }
    }
  }

  async function registerGoods(goodsData) {
    // 서비스 레이어 호출 (FormData 생성 및 API 호출 포함)
    return await goodsServiceRegisterGoods(goodsData)
  }

  async function updateGoods(id, goodsData) {
    // 서비스 레이어 호출 (FormData 생성 및 API 호출 포함)
    return await goodsServiceUpdateGoods(id, goodsData)
  }

  async function deleteGoods(id) {
    // goods.js 서비스를 사용하여 굿즈 삭제 처리
    return await goodsServiceDeleteGoods(id)
  }

  // 찜 관련 기능은 wishStore에서 처리
  // 이 함수는 wishStore의 toggleWishlist를 호출하고 goodsList/currentGoods를 업데이트하기 위한 래퍼
  async function toggleWishlist(goodsId, currentCheckWish = null) {
    const { useWishStore } = await import('./wish')
    const wishStore = useWishStore()
    
    return await wishStore.toggleWishlist(goodsId, currentCheckWish, {
      goodsList,
      currentGoods
    })
  }

  async function placeBid(goodsId, bidAmount) {
    // bid.js 서비스를 사용하여 입찰 처리
    return await bidServicePlaceBid(goodsId, bidAmount)
  }

  async function stopAuction(goodsId) {
    // bid.js 서비스를 사용하여 경매 중지 처리
    return await bidServiceStopAuction(goodsId)
  }

  function getCategoryImage(category) {
    return categoryImages[category] || categoryImages['기타']
  }

  return {
    goodsList,
    currentGoods,
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
    placeBid,
    stopAuction
  }
})

