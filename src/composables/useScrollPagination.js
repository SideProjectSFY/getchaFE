import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 스크롤 기반 무한 스크롤 페이징을 위한 composable
 * @param {Function} fetchFunction - 데이터를 가져오는 함수 (page, append, params) => Promise
 * @param {Object} options - 옵션
 * @param {number} options.initialPage - 초기 페이지 (기본: 1)
 * @param {number} options.pageSize - 페이지당 아이템 수 (기본: 20)
 * @param {number} options.scrollThreshold - 스크롤 임계값 (기본: 200)
 * @param {Object} options.params - 추가 파라미터
 * @returns {object} 페이징 관련 상태와 함수
 */
export function useScrollPagination(fetchFunction, options = {}) {
  const {
    initialPage = 1,
    pageSize = 20,
    scrollThreshold = 200,
    params = {}
  } = options

  const loading = ref(false)
  const isLoadingMore = ref(false)
  const currentPage = ref(initialPage)
  const hasMore = ref(true)
  const items = ref([])

  /**
   * 데이터 가져오기
   * @param {number} page - 페이지 번호
   * @param {boolean} append - 기존 데이터에 추가할지 여부
   */
  async function fetchData(page, append = false) {
    if (loading.value || isLoadingMore.value) return

    if (append) {
      isLoadingMore.value = true
    } else {
      loading.value = true
    }

    try {
      const result = await fetchFunction(page, append, params)
      
      if (append) {
        items.value = [...items.value, ...(result.items || [])]
      } else {
        items.value = result.items || []
      }

      // 페이징 정보 업데이트
      if (result.currentPage !== undefined) {
        currentPage.value = result.currentPage
      }
      if (result.totalPages !== undefined) {
        hasMore.value = currentPage.value < result.totalPages
      } else {
        // totalPages가 없으면 items 길이로 판단
        hasMore.value = (result.items || []).length >= pageSize
      }

      return result
    } catch (error) {
      console.error('데이터 로딩 실패:', error)
      throw error
    } finally {
      loading.value = false
      isLoadingMore.value = false
    }
  }

  /**
   * 다음 페이지 로드
   */
  async function loadMore() {
    if (loading.value || isLoadingMore.value || !hasMore.value) return
    
    const nextPage = currentPage.value + 1
    await fetchData(nextPage, true)
  }

  /**
   * 스크롤 이벤트 핸들러
   */
  function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    
    // 하단 threshold 이내에 도달하면 더 불러오기
    if (scrollTop + windowHeight >= documentHeight - scrollThreshold) {
      loadMore()
    }
  }

  /**
   * 초기화 (첫 페이지 로드)
   */
  async function initialize() {
    currentPage.value = initialPage
    items.value = []
    hasMore.value = true
    await fetchData(initialPage, false)
  }

  /**
   * 파라미터 업데이트 및 재로드
   */
  async function updateParams(newParams) {
    Object.assign(params, newParams)
    await initialize()
  }

  // 스크롤 이벤트 리스너 등록/해제
  onMounted(() => {
    window.addEventListener('scroll', handleScroll)
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })

  return {
    loading,
    isLoadingMore,
    currentPage,
    hasMore,
    items,
    fetchData,
    loadMore,
    initialize,
    updateParams
  }
}

