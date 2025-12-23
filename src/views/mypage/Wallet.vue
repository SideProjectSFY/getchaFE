<template>
  <div class="wallet-page">
    <h1 class="page-title">자산 현황</h1>
    
    <div v-if="loading" class="loading">로딩 중...</div>
    <div v-else-if="errorMessage" class="error-state">
      <p>{{ errorMessage }}</p>
    </div>
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
              <!-- Lottie 코인 이미지 (수동 play) -->
              <dotlottie-wc
                ref="walletLottie"
                class="wallet-lottie"
                src="https://lottie.host/cc19de9d-3878-4fdd-82de-913ca7db0443/qpAwk5i0Si.lottie"
                loop
                @ready="onLottieReady"
              ></dotlottie-wc>
            </div>
<!--            <p class="stat-label">{{ displayLabel }}</p> -->
            <p class="stat-value">{{ formatPrice(displayAmount) }}</p>
          </div>
        </div>
      </div>

      <div class="wallet-actions">
        <button class="btn-primary open-charge-btn" @click="toggleCharge">
          골드 충전하기
        </button>
      </div>

      <!--모달 띄우기 -->
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
import { extractResponseData } from '../../utils/responseApi'
import { useAuthStore } from '../../stores/auth'

//로딩 상태. default true(로딩중)
const loading = ref(true)
//지갑 데이터(잔액/예치금)
const wallet = ref({
  balance: 0,
  lockedBalance: 0
})
//탭 선택 영역. default 잔액
const selectedStat = ref('balance')
//고정 금액
const amountOptions = [10000, 30000, 100000, 200000]
//선택 금액
const selectedAmount = ref(10000)
const customAmount = ref(null)
//결제 진행
const charging = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
//로그인 정보
const authStore = useAuthStore()
//모달 열림/닫힘
const showCharge = ref(false)

const walletTabs = [
  { key: 'balance', label: '잔액' },
  { key: 'lockedBalance', label: '예치금' },
  { key: 'total', label: '총 자산' }
]

// Lottie 제어용 ref
const walletLottie = ref(null)

function onLottieReady() {
  walletLottie.value?.play?.()
}

// 잔액/예치금 계산
const displayAmount = computed(() => {
  if (selectedStat.value === 'balance') return wallet.value.balance || 0
  if (selectedStat.value === 'lockedBalance') return wallet.value.lockedBalance || 0
  // 총 자산: balance + lockedBalance
  return (wallet.value.balance || 0) + (wallet.value.lockedBalance || 0)
})

// 현재 선택한 탭의 label 반환
const displayLabel = computed(() => {
  const tab = walletTabs.find(tab => tab.key === selectedStat.value)
  return tab ? tab.label : ''
})

// 서버에서 지갑 정보 가져오기
async function fetchWallet() {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await api.get('/wallet')
    const data = extractResponseData(response, { balance: 0, lockedBalance: 0 })
    wallet.value = {
      balance: data.balance || 0,
      lockedBalance: data.lockedBalance || 0
    }
  } catch (error) {
    console.error('자산 현황 로딩 실패:', error)
    const status = error.response?.status
    if (status === 404) {
      errorMessage.value = '존재하지 않는 유저입니다. 지갑이 없습니다.'
    } else {
      errorMessage.value = '자산 현황을 불러오는데 실패했습니다.'
    }
  } finally {
    loading.value = false
  }
}

// 금액 버튼 눌렀을 경우 (고정 금액 선택 시!)
function selectAmount(amount) {
  selectedAmount.value = amount
  customAmount.value = null
  errorMessage.value = ''
  successMessage.value = ''
}

// 모달 열기/닫기
function toggleCharge() {
  showCharge.value = !showCharge.value
  errorMessage.value = ''
  successMessage.value = ''
}

// 최종 결제 금액
function getFinalAmount() {
  const custom = customAmount.value
  // 직접 입력했고, 숫자면 -> 직접 입력 값 사용
  if (custom && Number.isFinite(custom)) {
    return custom
  }
  return selectedAmount.value
}

// 결제 SDK 로드
async function loadPortOneScript() {
  if (window.IMP) return
  // 로딩 성공/실패
  await new Promise((resolve, reject) => {
    // script 생성해서 띄우기
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

  //로그인 체크
  if (!authStore.isAuthenticated) {
    errorMessage.value = '로그인이 필요합니다.'
    return
  }

  //금액 검증
  const amount = getFinalAmount()
  if (!amount || amount < 10000 || amount % 10000 !== 0) {
    errorMessage.value = '10,000 골드 단위로 입력해주세요.'
    return
  }

  charging.value = true

  // 결제 SDK 로딩 + 결제 준비
  try {
    await loadPortOneScript()
    const { IMP } = window
    const merchantId = 'imp00455537'

    // 1) 결제 준비: 백엔드 서버가 merchantUid 발급
    const prepareRes = await api.post('/payments/wallet/prepare', { amount })
    const preparePayload = prepareRes.data?.data || prepareRes.data || {}
    const merchantUid = preparePayload.merchantUid

    if (!merchantUid) {
      throw new Error('merchantUid를 받을 수 없습니다.')
    }

    // 2) 포트원 결제창 호출
    IMP.init(merchantId)
    await new Promise((resolve, reject) => {
      // 결제창
      IMP.request_pay(
        {
          // KG이니시스 테스트 PG 
          pg: 'html5_inicis.INIpayTest',
          pay_method: 'card',
          merchant_uid: merchantUid,
          name: '골드 충전',
          amount,
          buyer_email: authStore.user?.email,
          buyer_name: authStore.user?.nickname
        },
          // 결과
        async (rsp) => {
          if (!rsp.success) {
            reject(new Error(rsp.error_msg || '결제가 취소되었거나 실패했습니다.'))
            return
          }
          try {
            // 3) 성공이면 서버에 결제 검증
            const completeRes = await api.post('/payments/wallet/complete', {
              merchantUid,
              impUid: rsp.imp_uid //포트원 고유 결제 번호
            })
            const completePayload = completeRes.data?.data || completeRes.data || {}
            if (completePayload.status !== 'PAID') {
              reject(new Error(completePayload.failReason || '결제 검증에 실패했습니다.'))
              return
            }
            // 성공 UI + 잔액 재조회
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

// 처음 로딩 시 지갑 조회
onMounted(() => {
  // 이미 ready 상태라면 약간의 지연 후 play 재시도
  setTimeout(() => walletLottie.value?.play?.(), 50)
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

.wallet-lottie {
  width: 160px;
  height: 160px;
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

.loading,
.error-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-light);
  font-size: 16px;
}

.error-state {
  color: var(--primary-red);
}
</style>

