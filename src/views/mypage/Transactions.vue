<template>
  <div class="transactions-page">
    <h1 class="page-title">거래 내역</h1>
    
    <!-- 날짜 필터 -->
    <div class="date-filter-section">
      <div class="date-filter-group">
        <label for="startDate">시작일자</label>
        <input
          id="startDate"
          v-model="dateFilters.startDate"
          type="date"
          class="date-input"
        />
      </div>
      <div class="date-filter-group">
        <label for="endDate">종료일자</label>
        <input
          id="endDate"
          v-model="dateFilters.endDate"
          type="date"
          class="date-input"
        />
      </div>
      <button @click="applyDateFilters" class="filter-apply-btn">적용</button>
      <button @click="clearDateFilters" class="filter-clear-btn">초기화</button>
    </div>
    
    <div v-if="loading" class="loading">로딩 중...</div>
    <div v-else-if="transactions.length > 0" class="transactions-list">
      <div
        v-for="transaction in transactions"
        :key="transaction.id"
        class="transaction-item"
      >
        <div class="transaction-info">
          <div class="transaction-type">
            <span :class="['type-badge', getTransactionTypeClass(transaction.transactionType)]">
              {{ getTransactionTypeLabel(transaction.transactionType) }}
            </span>
          </div>
          <div class="transaction-details">
            <p class="transaction-description">{{ transaction.description }}</p>
            <span class="transaction-date">{{ formatDate(transaction.createdAt) }}</span>
          </div>
        </div>
        <div class="transaction-amount" :class="getAmountClass(transaction)">
          <span v-html="getDisplayAmount(transaction)"></span>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>거래 내역이 없습니다.</p>
    </div>
    
    <!-- 무한 스크롤 로딩 인디케이터 -->
    <div v-if="isLoadingMore" class="loading-more">
      <p>더 많은 거래 내역을 불러오는 중...</p>
    </div>
    <div v-else-if="!hasMore && transactions.length > 0" class="no-more">
      <p>모든 거래 내역을 불러왔습니다.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { formatDate } from '../../utils/format'
import api from '../../services/api'
import { extractResponseData } from '../../utils/responseApi'
import { useScrollPagination } from '../../composables/useScrollPagination'

const dateFilters = ref({
  startDate: '',
  endDate: ''
})

const pageSize = ref(10)

// 스크롤 페이징 composable 사용
const {
  loading,
  isLoadingMore,
  hasMore,
  items: transactions,
  initialize,
  updateParams
} = useScrollPagination(
  async (page, append, params) => {
    const requestParams = {
      page,
      size: pageSize.value,
      ...params
    }
    
    // 빈 값은 파라미터에서 제외
    if (!requestParams.startDate) delete requestParams.startDate
    if (!requestParams.endDate) delete requestParams.endDate
    
    const response = await api.get('/wallet/history', { params: requestParams })
    const data = extractResponseData(response, { items: [], currentPage: 1, totalPages: 1, totalCount: 0 })
    
    return {
      items: data.items || [],
      currentPage: data.currentPage || page,
      totalPages: data.totalPages || 1,
      totalCount: data.totalCount || 0
    }
  },
  {
    initialPage: 1,
    pageSize: pageSize.value,
    scrollThreshold: 200,
    params: {}
  }
)

function applyDateFilters() {
  updateParams({
    startDate: dateFilters.value.startDate || undefined,
    endDate: dateFilters.value.endDate || undefined
  })
}

function clearDateFilters() {
  dateFilters.value.startDate = ''
  dateFilters.value.endDate = ''
  updateParams({
    startDate: undefined,
    endDate: undefined
  })
}

function getTransactionTypeLabel(transactionType) {
  const typeMap = {
    CHARGE: '충전',
    BIDLOCK: '입찰',
    BIDUNLOCK: '환불',
    INCOME: '입금',
    EXPENSE: '출금'
  }
  return typeMap[transactionType] || transactionType
}

function getTransactionTypeClass(transactionType) {
  const classMap = {
    CHARGE: 'type-charge',
    BIDLOCK: 'type-bidlock',
    BIDUNLOCK: 'type-refund',
    INCOME: 'type-income',
    EXPENSE: 'type-expense'
  }
  return classMap[transactionType] || 'type-default'
}

function getAmountClass(transaction) {
  const { transactionType } = transaction
  
  if (transactionType === 'CHARGE' || transactionType === 'BIDUNLOCK' || transactionType === 'INCOME') {
    return 'amount-positive'
  }
  if (transactionType === 'BIDLOCK') {
    return 'amount-negative'
  }
  if (transactionType === 'EXPENSE') {
    return 'amount-expense'
  }
  return 'amount-neutral'
}

function getDisplayAmount(transaction) {
  const { transactionType, amount } = transaction
  const formattedAmount = new Intl.NumberFormat('ko-KR').format(Math.abs(amount || 0))
  
  // 출금(EXPENSE)인 경우: "정산완료 (금액)" 형식
  if (transactionType === 'EXPENSE') {
    return `정산완료 <span class="amount-value">(${formattedAmount})</span> <span class="amount-unit">골드</span>`
  }
  
  // 나머지 경우: 증감 형태 표시
  let sign = ''
  if (transactionType === 'CHARGE' || transactionType === 'BIDUNLOCK' || transactionType === 'INCOME') {
    sign = '+'
  } else if (transactionType === 'BIDLOCK') {
    sign = '-'
  }
  
  return `${sign}<span class="amount-value">${formattedAmount}</span> <span class="amount-unit">골드</span>`
}

onMounted(() => {
  initialize()
})
</script>

<style scoped>
.transactions-page {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 900;
  color: var(--text-dark);
}

.date-filter-section {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: var(--card-shadow);
  flex-wrap: wrap;
}

.date-filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-filter-group label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dark);
}

.date-input {
  height: 44px;
  padding: 0 14px;
  border: 1px solid #eeeeee;
  border-radius: 10px;
  font-size: 14px;
  transition: var(--transition);
  background: #ffffff;
  color: var(--text-dark);
  min-width: 180px;
}

.date-input:focus {
  border-color: var(--primary-red);
  outline: none;
}

.filter-apply-btn,
.filter-clear-btn {
  height: 44px;
  padding: 0 20px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  transition: var(--transition);
  white-space: nowrap;
}

.filter-apply-btn {
  border: 1px solid var(--primary-red);
  background: var(--primary-red);
  color: white;
}

.filter-apply-btn:hover {
  background: rgba(220, 20, 60, 0.9);
}

.filter-clear-btn {
  border: 1px solid #eeeeee;
  background: white;
  color: var(--text-dark);
}

.filter-clear-btn:hover {
  border-color: var(--primary-red);
  color: var(--primary-red);
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: var(--bg-light);
  border-radius: 12px;
  transition: var(--transition);
}

.transaction-item:hover {
  background: rgba(230, 57, 70, 0.05);
}

.transaction-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.type-badge {
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  color: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  /* white-space: nowrap; */
}

.type-charge {
  background: linear-gradient(135deg, #008364d3 0%, #00a780 100%);
  box-shadow: 0 2px 8px rgba(30, 154, 76, 0.3);
}

.type-bidlock {
  background: linear-gradient(135deg, #e63946 0%, #ff4d6d 100%);
  box-shadow: 0 2px 8px rgba(230, 57, 70, 0.3);
}

.type-refund {
  background: linear-gradient(135deg, #1E9A4C 0%, #2db86b 100%);
  box-shadow: 0 2px 8px rgba(30, 154, 76, 0.3);
}

.type-income {
  background: linear-gradient(135deg, #1E9A4C 0%, #2db86b 100%);
  box-shadow: 0 2px 8px rgba(30, 154, 76, 0.3);
}

.type-expense {
  background: linear-gradient(135deg, #ff961e 0%, #f39c12 100%);
  box-shadow: 0 2px 8px rgba(243, 156, 18, 0.3);
}

.type-default {
  background: linear-gradient(135deg, #6c757d 0%, #868e96 100%);
  box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3);
}

.transaction-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.transaction-description {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-dark);
}

.transaction-date {
  font-size: 13px;
  color: var(--text-light);
}

.transaction-amount {
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.transaction-amount.amount-positive {
  color: #1E9A4C;
  text-shadow: 0 1px 4px rgba(30, 154, 76, 0.2);
}

.transaction-amount.amount-negative {
  color: #e63946;
  text-shadow: 0 1px 4px rgba(230, 57, 70, 0.2);
}

.transaction-amount.amount-expense {
  color: #f39c12;
  text-shadow: 0 1px 4px rgba(243, 156, 18, 0.2);
}

.transaction-amount.amount-neutral {
  color: #555;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.amount-value {
  font-weight: 800;
}

.amount-unit {
  color: #000000;
  font-weight: 700;
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
  .date-filter-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .date-filter-group {
    width: 100%;
  }
  
  .date-input {
    width: 100%;
    min-width: auto;
  }
  
  .filter-apply-btn,
  .filter-clear-btn {
    width: 100%;
  }
}
</style>
