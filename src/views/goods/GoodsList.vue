<template>
  <div class="goods-list-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">굿즈 둘러보기</h1>
        <router-link v-if="isAuthenticated" to="/goods/register" class="btn-primary register-btn">
          굿즈 등록
        </router-link>
      </div>

      <!-- 필터 섹션 -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group filter-compact">
            <label>상태</label>
            <select v-model="filters.status" class="filter-select">
              <option value="">전체</option>
              <option value="WAITING">대기</option>
              <option value="ONGOING">진행중</option>
              <option value="COMPLETED">완료</option>
            </select>
          </div>

          <div class="filter-group filter-compact">
            <label>카테고리</label>
            <select v-model="filters.category" class="filter-select">
              <option value="">전체</option>
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>

          <div class="filter-group filter-compact">
            <label>정렬</label>
            <select v-model="filters.sortBy" class="filter-select">
              <option value="date">날짜순</option>
              <option value="price">가격순</option>
              <option value="wish">찜순</option>
            </select>
          </div>

          <div class="filter-group filter-search">
            <label>검색</label>
            <input
              v-model="filters.search"
              type="text"
              placeholder="애니메이션 제목, 굿즈명 검색..."
              class="filter-input"
            />
          </div>
        </div>

        <button @click="applyFilters" class="filter-btn">필터 적용</button>
      </div>

      <!-- 굿즈 그리드 -->
      <div v-if="loading" class="loading">로딩 중...</div>
      <div v-else-if="goodsList.length > 0" class="goods-grid">
        <GoodsCard
          v-for="goods in goodsList"
          :key="goods.id"
          :goods="goods"
        />
      </div>
      <div v-else class="empty-state">
        <p>등록된 굿즈가 없습니다.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useGoodsStore } from '../../stores/goods'
import GoodsCard from '../../components/GoodsCard.vue'

const route = useRoute()
const authStore = useAuthStore()
const goodsStore = useGoodsStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const categories = computed(() => goodsStore.categories.filter(c => c !== 'ALL'))
const goodsList = computed(() => goodsStore.goodsList)

const loading = ref(false)
const filters = ref({
  status: route.query.status || '',
  category: route.query.category || '',
  sortBy: route.query.sortBy || 'date',
  search: route.query.search || ''
})

async function applyFilters() {
  loading.value = true
  await goodsStore.fetchGoodsList(filters.value)
  loading.value = false
}

onMounted(async () => {
  loading.value = true
  await goodsStore.fetchGoodsList(filters.value)
  loading.value = false
})

watch(() => route.query, (newQuery) => {
  filters.value = {
    status: newQuery.status || '',
    category: newQuery.category || '',
    sortBy: newQuery.sortBy || 'date',
    search: newQuery.search || ''
  }
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
}

.loading,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-light);
  font-size: 16px;
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

