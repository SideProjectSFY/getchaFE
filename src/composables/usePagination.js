import { ref, computed, watch } from 'vue'

/**
 * 클라이언트 사이드 페이징을 위한 composable
 * @param {number} itemsPerPage - 페이지당 아이템 수
 * @param {import('vue').Ref} items - 아이템 배열
 * @returns {object} 페이징 관련 상태와 함수
 */
export function usePagination(itemsPerPage = 5, items = ref([])) {
  const currentPage = ref(1)

  const totalPages = computed(() => {
    return Math.max(1, Math.ceil(items.value.length / itemsPerPage))
  })

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return items.value.slice(start, start + itemsPerPage)
  })

  function changePage(page) {
    if (page < 1 || page > totalPages.value) return
    currentPage.value = page
  }

  function goToFirstPage() {
    currentPage.value = 1
  }

  function goToLastPage() {
    currentPage.value = totalPages.value
  }

  function goToNextPage() {
    if (currentPage.value < totalPages.value) {
      currentPage.value++
    }
  }

  function goToPrevPage() {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }

  // 아이템이 변경되면 현재 페이지가 유효한 범위인지 확인
  watch(items, () => {
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  })

  return {
    currentPage,
    totalPages,
    paginatedItems,
    changePage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPrevPage
  }
}

