<template>
  <div class="goods-list-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title title-heading">굿즈 둘러보기</h1>
        <router-link v-if="isAuthenticated" to="/goods/register" class="btn-primary register-btn">
          굿즈 등록
        </router-link>
      </div>

      <!-- 필터 섹션 -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group filter-compact">
            <label>상태</label>
            <select v-model="filters.auctionStatus" class="filter-select">
              <option value="">전체</option>
              <option value="WAIT">대기</option>
              <option value="PROCEEDING">진행중</option>
              <option value="COMPLETED">완료</option>
              <option value="STOPPED">종료</option>
            </select>
          </div>

          <div class="filter-group filter-compact">
            <label>카테고리</label>
            <select v-model="filters.category" class="filter-select">
              <option value="">전체</option>
              <option v-for="option in categoryOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </div>

          <div class="filter-group filter-compact">
            <label>정렬</label>
            <select v-model="filters.sort" class="filter-select">
              <option value="createdAt">최신순(default)</option>
              <option value="auctionEndAt">종료 임박순</option>
              <option value="price">가격순</option>
              <option value="wish">찜순</option>
            </select>
          </div>

          <div class="filter-group filter-search">
            <label>검색</label>
            <input
              v-model="filters.searchName"
              type="text"
              placeholder="애니메이션 제목, 굿즈명 검색..."
              class="filter-input"
            />
          </div>
        </div>

        <button @click="applyFilters()" class="filter-btn">필터 적용</button>
      </div>

      <!-- 굿즈 그리드 -->
      <div v-if="loading" class="loading">로딩 중...</div>
      <div v-else-if="goodsList.length > 0" class="goods-grid">
        <GoodsCard
          v-for="goods in goodsList"
          :key="goods.goodsId"
          :goods="goods"
        />
      </div>
      <div v-else class="empty-state">
        <p>등록된 굿즈가 없습니다.</p>
      </div>

      <!-- 무한 스크롤 로딩 인디케이터 -->
      <div v-if="isLoadingMore" class="loading-more">
        <p>더 많은 굿즈를 불러오는 중...</p>
      </div>
      <div v-else-if="!hasMore && goodsList.length > 0" class="no-more">
        <p>모든 굿즈를 불러왔습니다.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useGoodsStore } from '../../stores/goods'
import { useScrollPagination } from '../../composables/useScrollPagination'
import GoodsCard from '../../components/GoodsCard.vue'

const route = useRoute()
const authStore = useAuthStore()
const goodsStore = useGoodsStore()

/**
 * 인증 상태를 확인하는 computed 속성
 */
const isAuthenticated = computed(() => authStore.isAuthenticated)

/**
 * 카테고리 옵션 목록을 반환하는 computed 속성
 */
const categoryOptions = computed(() => goodsStore.categoryOptions)

const pageSize = ref(20)

const filters = ref({
  auctionStatus: route.query.auctionStatus || '',
  category: goodsStore.convertCategoryToEnglish(route.query.category || ''),
  sort: route.query.sort || 'createdAt',
  searchName: route.query.searchName || ''
})

// 스크롤 페이징 composable 사용
const {
  loading,
  isLoadingMore,
  hasMore,
  items: goodsList,
  initialize,
  updateParams
} = useScrollPagination(
  async (page, append, params) => {
    const result = await goodsStore.fetchGoodsList(
      { ...filters.value, ...params },
      page,
      pageSize.value,
      append
    )
    
    if (result.success) {
      return {
        items: goodsStore.goodsList,
        currentPage: goodsStore.pagination.currentPage,
        totalPages: goodsStore.pagination.totalPages,
        totalCount: goodsStore.pagination.totalCount
      }
    } else {
      throw new Error(result.message || '굿즈 목록을 불러오는데 실패했습니다.')
    }
  },
  {
    initialPage: 1,
    pageSize: pageSize.value,
    scrollThreshold: 200,
    params: {}
  }
)

/**
 * 필터를 적용하는 함수
 * updateParams와 initialize를 호출하여 필터 변경 후 첫 페이지부터 다시 로드
 */
function applyFilters() {
  updateParams({})
  initialize()
}

onMounted(() => {
  initialize()
})

/**
 * 라우트 쿼리 파라미터 변경 감지 watcher
 * 쿼리 파라미터가 변경되면 필터를 업데이트하고 applyFilters 호출
 */
watch(() => route.query, (newQuery) => {
  filters.value = {
    auctionStatus: newQuery.auctionStatus || '',
    category: goodsStore.convertCategoryToEnglish(newQuery.category || ''),
    sort: newQuery.sort || 'createdAt',
    searchName: newQuery.searchName || ''
  }
  // 필터 변경 시 첫 페이지부터 다시 시작
  applyFilters()
})
</script>

<style scoped>
.goods-list-page {
  padding: 40px 0;
  min-height: calc(100vh - 100px);
  background: var(--bg-gradient);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.page-title {
  font-size: 36px;
  font-weight: 900;
  color: var(--text-dark);
}

.register-btn {
  white-space: nowrap;
}

.filters-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: var(--card-shadow);
  margin-bottom: 32px;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-compact {
  max-width: 200px;
}

.filter-search {
  grid-column: span 2;
}

.filter-group label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dark);
}

.filter-select,
.filter-input {
  height: 44px;
  padding: 0 14px;
  border: 1px solid #eeeeee;
  border-radius: 10px;
  font-size: 14px;
  transition: var(--transition);
  background: #ffffff;
  color: var(--text-dark);
}

.filter-select {
  background-image: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.filter-select:focus,
.filter-input:focus {
  border-color: var(--primary-red);
  outline: none;
  background: white;
}

.filter-btn {
  width: 100%;
  padding: 12px;
  border-radius: 999px;
  border: 1px solid var(--primary-red);
  background: white;
  color: var(--primary-red);
  font-weight: 700;
  font-size: 15px;
  transition: var(--transition);
  box-shadow: none;
}

.filter-btn:hover {
  background: rgba(220, 20, 60, 0.08);
}

.goods-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.loading,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-light);
  font-size: 16px;
}

.loading-more,
.no-more {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-light);
  font-size: 14px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .page-title {
    font-size: 28px;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .filter-search {
    grid-column: span 1;
  }

  .goods-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
}
</style>

