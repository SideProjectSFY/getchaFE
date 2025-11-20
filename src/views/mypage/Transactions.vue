<template>
  <div class="transactions-page">
    <h1 class="page-title">거래 내역</h1>
    
    <div v-if="loading" class="loading">로딩 중...</div>
    <div v-else-if="transactions.length > 0" class="transactions-list">
      <div
        v-for="transaction in paginatedTransactions"
        :key="transaction.id"
        class="transaction-item"
      >
        <div class="transaction-info">
          <div class="transaction-type">
            <span :class="['type-badge', `type-${transaction.type.toLowerCase()}`]">
              {{ getTransactionTypeLabel(transaction.type) }}
            </span>
          </div>
          <div class="transaction-details">
            <p class="transaction-description">{{ transaction.description }}</p>
            <span class="transaction-date">{{ formatDate(transaction.createdAt) }}</span>
          </div>
        </div>
        <div class="transaction-amount" :class="{ positive: transaction.amount > 0, negative: transaction.amount < 0 }">
          {{ transaction.amount > 0 ? '+' : '' }}{{ formatPrice(Math.abs(transaction.amount)) }}
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>거래 내역이 없습니다.</p>
    </div>
    <div v-if="totalPages > 1" class="pagination">
      <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
        이전
      </button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
        다음
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { formatPrice, formatDate } from '../../utils/format'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { mockTransactions } from '../../data/mockData'

const authStore = useAuthStore()
const loading = ref(true)
const transactions = ref([])
const currentPage = ref(1)
const ITEMS_PER_PAGE = 5

function getTransactionTypeLabel(type) {
  const typeMap = {
    BID: '입찰',
    BID_LOCK: '예치금 Lock',
    BID_UNLOCK: '예치금 Unlock',
    WIN: '낙찰',
    LOSE: '패찰',
    REFUND: '환불'
  }
  return typeMap[type] || type
}

function loadMockTransactions() {
  const userId = authStore.user?.id
  const fallback = mockTransactions[userId] || mockTransactions.default || []
  transactions.value = [...fallback]
}

async function fetchTransactions() {
  loading.value = true
  try {
    const response = await api.get('/wallet/transactions')
    if (Array.isArray(response.data) && response.data.length > 0) {
      transactions.value = response.data
    } else {
      loadMockTransactions()
    }
  } catch (error) {
    console.error('거래 내역 로딩 실패:', error)
    loadMockTransactions()
  }
  loading.value = false
}

const totalPages = computed(() => Math.max(1, Math.ceil(transactions.value.length / ITEMS_PER_PAGE)))

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  return transactions.value.slice(start, start + ITEMS_PER_PAGE)
})

function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

watch(transactions, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})

onMounted(() => {
  fetchTransactions()
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
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  color: white;
}

.type-bid,
.type-bid_lock {
  background: var(--primary-red);
}

.type-bid_unlock,
.type-refund {
  background: #4CAF50;
}

.type-win {
  background: #FF9800;
}

.type-lose {
  background: var(--text-gray);
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
}

.transaction-amount.positive {
  color: #4CAF50;
}

.transaction-amount.negative {
  color: var(--primary-red);
}

.loading,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-light);
  font-size: 16px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.page-btn {
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: white;
  font-weight: 600;
  transition: var(--transition);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-btn:not(:disabled):hover {
  border-color: var(--primary-red);
  color: var(--primary-red);
}

.page-info {
  font-weight: 700;
  color: var(--text-dark);
}
</style>

