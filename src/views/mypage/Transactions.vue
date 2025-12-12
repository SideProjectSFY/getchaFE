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
            <span :class="['type-badge', getTransactionCategory(transaction).className]">
              {{ getTransactionCategory(transaction).label }}
            </span>
          </div>
          <div class="transaction-details">
            <p class="transaction-description">{{ transaction.description }}</p>
            <span class="transaction-date">{{ formatDate(transaction.createdAt) }}</span>
          </div>
        </div>
        <div class="transaction-amount" :class="['transaction-amount', getDisplayAmount(transaction).className]">
          {{ getDisplayAmount(transaction).text }}
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

const authStore = useAuthStore()
const loading = ref(true)
const transactions = ref([])
const currentPage = ref(1)
const ITEMS_PER_PAGE = 5

async function fetchTransactions() {
  loading.value = true
  try {
    const response = await api.get('/wallet/transactions')
    if (Array.isArray(response.data)) {
      transactions.value = response.data
    } else {
      transactions.value = []
    }
  } catch (error) {
    console.error('거래 내역 로딩 실패:', error)
    transactions.value = []
  }
  loading.value = false
}

const totalPages = computed(() => Math.max(1, Math.ceil(transactions.value.length / ITEMS_PER_PAGE)))

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  return transactions.value.slice(start, start + ITEMS_PER_PAGE)
})

function getAmountClass(amount) {
  if (amount > 0) return 'positive'
  if (amount < 0) return 'negative'
  return 'neutral'
}

function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

function getTransactionCategory(transaction) {
  if (transaction.type === 'DEPOSIT') {
    return { label: '충전', className: 'type-charge' }
  }
  if (transaction.type === 'REFUND') {
    return { label: '환불', className: 'type-refund' }
  }
  if (transaction.amount > 0) {
    return { label: '입금', className: 'type-deposit' }
  }
  if (transaction.amount < 0) {
    return { label: '출금', className: 'type-withdraw' }
  }
  return { label: '입금', className: 'type-deposit' }
}

function getDisplayAmount(transaction) {
  if (transaction.type === 'WIN') {
    return { text: '정산 완료', className: 'neutral' }
  }
  const amount = transaction.amount || 0
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : ''
  return {
    text: `${sign}${formatPrice(Math.abs(amount))}`,
    className: getAmountClass(amount)
  }
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

.type-charge {
  background: #ff6b81;
}

.type-deposit {
  background: #00b894;
}

.type-withdraw {
  background: #e63946;
}

.type-refund {
  background: #6c5ce7;
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
  color: #1E9A4C;
}

.transaction-amount.negative {
  color: #E63946;
}

.transaction-amount.neutral {
  color: #555;
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

