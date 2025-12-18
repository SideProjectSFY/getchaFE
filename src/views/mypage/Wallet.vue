<template>
  <div class="wallet-page">
    <h1 class="page-title">자산 현황</h1>
    
    <div v-if="loading" class="loading">로딩 중...</div>
    <div v-else class="wallet-content">
      <div class="wallet-shell">
        <div class="wallet-strap">
          <span class="strap-notch"></span>
          <span class="strap-notch second"></span>
        </div>
        <div class="wallet-face">
          <div class="wallet-toggle">
            <button
              v-for="tab in walletTabs"
              :key="tab.key"
              :class="['wallet-tab', { active: selectedStat === tab.key }]"
              type="button"
              @click="selectedStat = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
          <div class="wallet-divider"></div>
          <div class="wallet-display">
            <div class="wallet-currency">
              <span class="coin-stack">
                <span class="coin"></span>
                <span class="coin second"></span>
              </span>
            </div>
            <p class="stat-label">{{ displayLabel }}</p>
            <p class="stat-value">{{ formatPrice(displayAmount) }}</p>
          </div>
        </div>
      </div>

      <div class="wallet-actions">
        <button class="btn-primary open-charge-btn" @click="toggleCharge">
          골드 충전하기
        </button>
      </div>

      <div v-if="showCharge" class="charge-modal-backdrop" @click.self="toggleCharge">
        <div class="charge-modal">
          <div class="charge-header">
            <h3>골드 충전</h3>
            <button class="close-btn" @click="toggleCharge">×</button>
          </div>
          <p class="info-text">10,000 골드 단위로만 충전할 수 있습니다.</p>
          <div class="amount-buttons">
            <button
              v-for="opt in amountOptions"
              :key="opt"
              type="button"
              class="amount-btn"
              :class="{ active: selectedAmount === opt }"
              @click="selectAmount(opt)"
            >
              {{ formatPrice(opt) }}
            </button>
          </div>
          <div class="custom-input">
            <label for="customAmount">직접 입력 (10,000 단위)</label>
            <input
              id="customAmount"
              type="number"
              min="10000"
              step="10000"
              v-model.number="customAmount"
              placeholder="예: 10000"
            />
          </div>
          <button
            class="btn-primary charge-btn"
            :disabled="charging"
            @click="handleCharge"
          >
            {{ charging ? '결제 진행 중...' : '결제하기' }}
          </button>
          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
          <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
        </div>
      </div>

      <div class="wallet-info">
        <strong>알림</strong>
        <p class="info-text">
          입찰 시 예치금이 Lock되며, 낙찰 또는 패찰 시 자동으로 해제됩니다. 모든 내역은 자산 현황에서 실시간으로 확인할 수 있습니다.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { formatPrice } from '../../utils/format'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'

const loading = ref(true)
const wallet = ref({
  balance: 0,
  lockedAmount: 0
})
const selectedStat = ref('balance')
const amountOptions = [10000, 30000, 100000, 200000]
const selectedAmount = ref(10000)
const customAmount = ref(null)
const charging = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const authStore = useAuthStore()
const showCharge = ref(false)

const walletTabs = [
  { key: 'balance', label: '잔액' },
  { key: 'lockedAmount', label: '예치금' },
  { key: 'total', label: '총 자산' }
]

const displayAmount = computed(() => {
  if (selectedStat.value === 'balance') return wallet.value.balance || 0
  if (selectedStat.value === 'lockedAmount') return wallet.value.lockedAmount || 0
  return (wallet.value.balance || 0) + (wallet.value.lockedAmount || 0)
})

const displayLabel = computed(() => {
  const tab = walletTabs.find(tab => tab.key === selectedStat.value)
  return tab ? tab.label : ''
})

async function fetchWallet() {
  loading.value = true
  try {
    const response = await api.get('/wallet')
    const payload = response.data?.data || response.data || {}
    wallet.value = payload
  } catch (error) {
    console.error('자산 현황 로딩 실패:', error)
  }
  loading.value = false
}

function selectAmount(amount) {
  selectedAmount.value = amount
  customAmount.value = null
  errorMessage.value = ''
  successMessage.value = ''
}

function toggleCharge() {
  showCharge.value = !showCharge.value
  errorMessage.value = ''
  successMessage.value = ''
}

function getFinalAmount() {
  const custom = customAmount.value
  if (custom && Number.isFinite(custom)) {
    return custom
  }
  return selectedAmount.value
}

async function loadPortOneScript() {
  if (window.IMP) return
  await new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.iamport.kr/js/iamport.payment-1.2.0.js'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

async function handleCharge() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!authStore.isAuthenticated) {
    errorMessage.value = '로그인이 필요합니다.'
    return
  }

  const amount = getFinalAmount()
  if (!amount || amount < 10000 || amount % 10000 !== 0) {
    errorMessage.value = '10,000 골드 단위로 입력해주세요.'
    return
  }

  charging.value = true
  try {
    await loadPortOneScript()
    const { IMP } = window
    const merchantId = import.meta.env.VITE_PORTONE_MERCHANT_ID || 'imp00000000'

    // 1) 결제 준비: 서버가 merchantUid 발급
    const prepareRes = await api.post('/payments/wallet/prepare', { amount })
    const preparePayload = prepareRes.data?.data || prepareRes.data || {}
    const merchantUid = preparePayload.merchantUid

    if (!merchantUid) {
      throw new Error('merchantUid를 받을 수 없습니다.')
    }

    // 2) 포트원 결제창 호출
    IMP.init(merchantId)
    await new Promise((resolve, reject) => {
      IMP.request_pay(
        {
          pg: 'html5_inicis', // KG이니시스 결제
          pay_method: 'card',
          merchant_uid: merchantUid,
          name: '골드 충전',
          amount,
          buyer_email: authStore.user?.email,
          buyer_name: authStore.user?.nickname
        },
        async (rsp) => {
          if (!rsp.success) {
            reject(new Error(rsp.error_msg || '결제가 취소되었거나 실패했습니다.'))
            return
          }
          try {
            // 3) 결제 완료 검증
            const completeRes = await api.post('/payments/wallet/complete', {
              merchantUid,
              impUid: rsp.imp_uid
            })
            const completePayload = completeRes.data?.data || completeRes.data || {}
            if (completePayload.status !== 'PAID') {
              reject(new Error(completePayload.failReason || '결제 검증에 실패했습니다.'))
              return
            }
            successMessage.value = `충전 완료! 현재 잔액: ${formatPrice(completePayload.walletBalance || 0)}`
            await fetchWallet()
            resolve()
          } catch (err) {
            reject(err)
          }
        }
      )
    })
  } catch (err) {
    console.error(err)
    errorMessage.value = err?.message || '결제 처리 중 오류가 발생했습니다.'
  } finally {
    charging.value = false
  }
}

onMounted(() => {
  fetchWallet()
})
</script>

<style scoped>
.wallet-page {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 900;
  color: var(--text-dark);
}

.wallet-shell {
  position: relative;
  background: #ffffff;
  border-radius: 36px;
  padding: 48px 42px 32px;
  color: var(--text-dark);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.wallet-strap {
  position: absolute;
  top: 22px;
  left: 46px;
  right: 46px;
  height: 10px;
  background: #ffe3ec;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.strap-notch {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
}

.strap-notch.second {
  opacity: 0.4;
}

.wallet-face {
  background: #fdfcfc;
  border-radius: 24px;
  padding: 64px 32px 32px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.wallet-toggle {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.wallet-tab {
  flex: 1;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 18px;
  padding: 12px;
  background: #fff;
  font-weight: 600;
  color: var(--text-gray);
  transition: var(--transition);
}

.wallet-tab.active {
  border-color: rgba(255, 71, 87, 0.4);
  color: var(--primary-red);
  box-shadow: inset 0 0 0 1px rgba(255, 71, 87, 0.2);
}

.wallet-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.05);
  margin: 24px 0;
}

.wallet-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.wallet-currency {
  display: flex;
  align-items: center;
  gap: 12px;
}

.coin-stack {
  position: relative;
  width: 32px;
  height: 32px;
}

.coin {
  position: absolute;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #ffe08a, #ffc107);
  border: 1px solid rgba(255, 193, 7, 0.6);
  box-shadow: 0 6px 12px rgba(255, 193, 7, 0.35);
}

.coin::after {
  content: 'G';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: 800;
  color: #a35400;
  font-size: 14px;
}

.coin.second {
  top: 4px;
  left: 6px;
  opacity: 0.7;
}

.stat-label {
  font-size: 14px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--text-gray);
  margin-bottom: 6px;
}

.stat-value {
  font-size: 32px;
  font-weight: 800;
  color: var(--text-dark);
}

.wallet-info {
  margin-top: 32px;
  padding: 24px;
  border-radius: 16px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: var(--card-shadow);
}

.wallet-info strong {
  display: block;
  margin-bottom: 8px;
  color: var(--text-dark);
  font-size: 15px;
  letter-spacing: 0.5px;
}

.info-text {
  font-size: 14px;
  color: var(--text-gray);
  line-height: 1.7;
}

.wallet-actions {
  margin-top: 32px;
}

.charge-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1500;
  padding: 16px;
}

.charge-modal {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.charge-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.close-btn {
  border: none;
  background: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-dark);
}

.charge-card {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.amount-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.amount-btn {
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #ffffff 0%, #fff7f9 100%);
  font-weight: 800;
  color: var(--text-dark);
  transition: var(--transition);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.06);
  text-align: left;
}

.amount-btn.active {
  border-color: rgba(255, 71, 87, 0.4);
  color: var(--primary-red);
  box-shadow: 0 8px 18px rgba(255, 71, 87, 0.15);
  background: linear-gradient(135deg, #fff0f4 0%, #ffe6ec 100%);
}

.amount-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
}

.custom-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.custom-input input {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
}

.charge-btn {
  width: 100%;
  border: none;
  border-radius: 12px;
  padding: 12px;
  font-weight: 800;
}

.error-message {
  color: var(--primary-red);
  font-size: 13px;
}

.success-message {
  color: #00b85e;
  font-size: 13px;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-light);
  font-size: 16px;
}
</style>

