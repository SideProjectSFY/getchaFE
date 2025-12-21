<template>
  <div class="goods-detail-page">
    <div v-if="loading" class="loading">로딩 중...</div>
    <div v-else-if="goods" class="container">
      <!-- 상단 액션 버튼 -->
      <div class="action-buttons">
        <div v-if="isOwner" class="owner-actions">
          <router-link
            v-if="isAuthenticated && goods.checkSeller && goods.auctionStatus === 'WAIT'"
            :to="`/goods/edit/${goods.goodsId}`"
            class="btn-outline"
          >
            수정
          </router-link>
          <button
            v-if="isAuthenticated && goods.checkSeller && goods.auctionStatus !== 'PROCEEDING'"
            @click="handleDelete"
            class="btn-outline delete-btn"
          >
            삭제
          </button>
        </div>
        <button 
          v-if="isAuthenticated && !goods.checkSeller"
          @click="handleReport" 
          class="btn-outline report-btn"
        >
          신고
        </button>
      </div>

      <div class="detail-content">
        <!-- 이미지 갤러리 -->
        <div class="image-gallery">
          <div class="main-image" :class="{ completed: goods.auctionStatus === 'COMPLETED' || goods.auctionStatus === 'STOPPED' }">
            <img :src="currentImage || goods.images?.[0] || '/placeholder.png'" :alt="goods.title" />
            <div v-if="goods.auctionStatus === 'COMPLETED'" class="status-badge completed-badge">완료</div>
            <div v-else-if="goods.auctionStatus === 'PROCEEDING'" class="status-badge ongoing-badge">진행중</div>
            <div v-else-if="goods.auctionStatus === 'STOPPED'" class="status-badge stopped-badge">종료</div>
            <div v-if="goods.auctionStatus === 'COMPLETED'" class="detail-soldout">
              <span class="soldout-pill">SOLD OUT</span>
            </div>
            <div v-if="goods.auctionStatus === 'STOPPED'" class="detail-soldout">
              <span class="stopped-pill">STOPPED</span>
            </div>
          </div>
          <div v-if="goods.images && goods.images.length > 1" class="thumbnail-list">
            <img
              v-for="(image, index) in goods.images"
              :key="index"
              :src="image"
              :alt="`${goods.title} ${index + 1}`"
              @click="currentImage = image"
              :class="{ active: currentImage === image || (!currentImage && index === 0), completed: goods.auctionStatus === 'COMPLETED' || goods.auctionStatus === 'STOPPED' }"
              class="thumbnail"
            />
          </div>
        </div>

        <!-- 상품 정보 -->
        <div class="goods-info">
          <div class="goods-header">
            <h1 class="goods-title">{{ goods.title }}</h1>
            <div class="goods-meta">
              <div class="seller-info">
                <img 
                  v-if="goods.sellerProfileFilePath" 
                  :src="getImageUrl(goods.sellerProfileFilePath)" 
                  :alt="goods.sellerNickName"
                  class="seller-profile-image"
                />
                <span class="seller-name">{{ goods.sellerNickName }}</span>
                <button 
                  v-if="!goods.checkSeller" 
                  @click="handleReportUser" 
                  class="report-user-btn"
                >
                  신고
                </button>
              </div>
              <div class="meta-right">
                <span :class="['status-badge', `status-${goods.auctionStatus.toLowerCase()}`]">
                  {{ formatAuctionStatus(goods.auctionStatus) }}
                </span>
              </div>
            </div>
          </div>

          <div class="auction-info">
            <div class="price-section">
              <div class="price-item">
                <span class="price-label">시작가</span>
                <span class="price-value">{{ formatPrice(goods.startPrice) }}</span>
              </div>
              <div v-if="!(goods.currentBidAmount === null && (goods.auctionStatus === 'WAIT' || goods.auctionStatus === 'STOPPED'))" class="price-item">
                <span class="price-label">현재 입찰가</span>
                <span class="price-value highlight">{{ formatPrice(goods.currentBidAmount || goods.startPrice) }}</span>
              </div>
              <div v-if="goods.instantBuyPrice" class="price-item">
                <span class="price-label">즉시구매가</span>
                <span class="price-value">{{ formatPrice(goods.instantBuyPrice) }}</span>
              </div>
            </div>

            <div class="timer-section">
              <span class="timer-label">남은 시간</span>
              <span class="timer-value">{{ formatTimeRemaining(timeRemaining) }}</span>
            </div>
          </div>

          <div class="action-section">
            <button
              v-if="!goods.checkSeller && (goods.auctionStatus === 'PROCEEDING' || goods.auctionStatus === 'WAIT') && isAuthenticated"
              @click="handleBid"
              class="btn-primary bid-btn"
            >
              입찰하기
            </button>
            <button
              v-if="goods.auctionStatus === 'PROCEEDING' && isAuthenticated && goods.checkSeller"
              @click="handleStopAuction"
              class="btn-secondary stop-btn"
            >
              경매 중지
            </button>
            <button
              v-if="!goods.checkSeller"
              @click="toggleWishlist"
              :class="['wishlist-btn', { active: isWishlisted }]"
            >
              <span class="heart-icon-detail" :class="{ filled: isWishlisted }">
                <svg v-if="isWishlisted" width="20" height="20" viewBox="0 0 24 24" fill="#FF0000" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </span>
              <span>{{ isWishlisted ? '찜 해제' : '찜하기' }}</span>
            </button>
          </div>

          <div class="goods-details">
            <div class="detail-item">
              <span class="detail-label">애니메이션</span>
              <span class="detail-value">{{ goods.animeTitle }}</span>
            </div>
            <div v-if="goods.characterName" class="detail-item">
              <span class="detail-label">캐릭터</span>
              <span class="detail-value">{{ goods.characterName }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">카테고리</span>
              <span class="detail-value">{{ categoryDisplay }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">찜 수</span>
              <span class="detail-value">{{ goods.wishCount || 0 }}</span>
            </div>
          </div>

          <div class="description-section">
            <h3 class="section-title">상품 설명</h3>
            <p class="description">{{ goods.description }}</p>
          </div>

          <!-- 참여자 리스트 -->
          <div v-if="goods.bidders && goods.bidders.length > 0" class="bidders-section">
            <h3 class="section-title">경매 참여자 ({{ goods.bidders.length }}명)</h3>
            <div class="bidders-list">
              <div
                v-for="(bidder, index) in goods.bidders"
                :key="bidder.id"
                class="bidder-item"
                :class="{ winner: bidder.highest }"
              >
                <div class="bidder-left">
                  <span class="bidder-rank">{{ bidder.rank || (index + 1) }}위</span>
                  <div class="user-info">
                    <img 
                      v-if="bidder.profileFilePath" 
                      :src="getImageUrl(bidder.profileFilePath)" 
                      :alt="bidder.nickname"
                      class="profile-image"
                    />
                    <span class="bidder-name">{{ bidder.nickname }}</span>
                  </div>
                </div>
                <span class="bidder-price">{{ formatPrice(bidder.bidAmount) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 댓글 섹션 -->
      <div class="comments-section">
        <h3 class="section-title">댓글</h3>
        <CommentList :goods-id="goods.goodsId" :seller-id="goods.sellerId" />
      </div>
    </div>
    <div v-else class="error-state">
      <p>굿즈를 찾을 수 없습니다.</p>
    </div>

    <!-- 경매 중지 모달 -->
    <div v-if="showStopModal" class="bid-modal-backdrop" @click.self="closeStopModal">
      <div class="bid-modal">
        <div class="bid-header">
          <h3>경매 중지</h3>
          <button class="close-btn" @click="closeStopModal">×</button>
        </div>
        <div class="stop-warning">
          <p class="warning-title">⚠️ 경매를 중지하시겠습니까?</p>
          <p class="warning-text">경매를 중지하면 참여자들에게 예치금이 환원됩니다.</p>
          <p class="warning-text">이 작업은 되돌릴 수 없습니다.</p>
        </div>
        <div class="bid-actions">
          <button class="btn-outline cancel-btn" @click="closeStopModal">취소</button>
          <button class="btn-primary confirm-btn stop-confirm-btn" :disabled="stoppingAuction" @click="confirmStopAuction">
            {{ stoppingAuction ? '처리 중...' : '경매 중지' }}
          </button>
        </div>
        <p v-if="stopErrorMessage" class="error-message">{{ stopErrorMessage }}</p>
      </div>
    </div>

    <!-- 입찰 모달 -->
    <div v-if="showBidModal" class="bid-modal-backdrop" @click.self="closeBidModal">
      <div class="bid-modal">
        <div class="bid-header">
          <h3>입찰하기</h3>
          <button class="close-btn" @click="closeBidModal">×</button>
        </div>
        <div class="bid-info">
          <div class="bid-info-item">
            <span class="bid-info-label">시작가</span>
            <span class="bid-info-value">{{ formatPrice(goods?.startPrice || 0) }}</span>
          </div>
          <div v-if="goods && !(goods.currentBidAmount === null && (goods.auctionStatus === 'WAIT' || goods.auctionStatus === 'STOPPED'))" class="bid-info-item">
            <span class="bid-info-label">현재 입찰가</span>
            <span class="bid-info-value highlight">{{ formatPrice(goods.currentBidAmount || goods.startPrice) }}</span>
          </div>
          <div class="bid-info-item">
            <span class="bid-info-label">최소 입찰가</span>
            <span class="bid-info-value required">{{ formatPrice(minBidAmount) }}</span>
          </div>
        </div>
        <p class="bid-warning">입찰 후 취소할 수 없습니다. 신중하게 결정해주세요.</p>
        <div class="bid-input-group">
          <label for="bidAmount">입찰 금액 (골드)</label>
          <input
            id="bidAmount"
            type="number"
            :min="minBidAmount"
            v-model.number="bidAmount"
            placeholder="입찰 금액을 입력하세요"
            class="bid-input"
          />
        </div>
        <div class="bid-actions">
          <button class="btn-outline cancel-btn" @click="closeBidModal">취소</button>
          <button class="btn-primary confirm-btn" :disabled="submittingBid" @click="confirmBid">
            {{ submittingBid ? '입찰 중...' : '입찰하기' }}
          </button>
        </div>
        <p v-if="bidErrorMessage" class="error-message">{{ bidErrorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useGoodsStore } from '../../stores/goods'
import { formatPrice, formatTimeRemaining, formatAuctionStatus} from '../../utils/format'
import { getImageUrl } from '../../utils/image'
import CommentList from '../../components/CommentList.vue'
import { useTimeRemaining } from '../../composables/useTimeRemaining'
import { submitBid } from '../../services/bid'
import { CATEGORY_REVERSE_MAP } from '../../utils/category'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const goodsStore = useGoodsStore()

const loading = ref(true)
const goods = ref(null)
const currentImage = ref(null)

// 입찰 모달 관련 상태
const showBidModal = ref(false)
const bidAmount = ref(null)
const bidErrorMessage = ref('')
const submittingBid = ref(false)

// 경매 중지 모달 관련 상태
const showStopModal = ref(false)
const stopErrorMessage = ref('')
const stoppingAuction = ref(false)

/**
 * 인증 상태를 확인하는 computed 속성
 */
const isAuthenticated = computed(() => authStore.isAuthenticated)

/**
 * 현재 사용자가 굿즈 소유자인지 확인하는 computed 속성
 */
const isOwner = computed(() => goods.value?.checkSeller || false)

/**
 * 현재 굿즈가 찜 목록에 있는지 확인하는 computed 속성
 */
const isWishlisted = computed(() => goods.value?.checkWish || false)

/**
 * 최소 입찰 금액을 계산하는 computed 속성
 * 첫 입찰인 경우 시작가, 그 외에는 현재 입찰가보다 높은 금액(천원 단위로 올림)
 */
const minBidAmount = computed(() => {
  if (!goods.value) return 0
  
  const isFirstBid = goods.value.auctionStatus === 'WAIT' && 
                     (goods.value.currentBidAmount === null || goods.value.currentBidAmount === undefined)
  
  if (isFirstBid) {
    return goods.value.startPrice || 0
  } else {
    // 현재 입찰가보다 높아야 함 (천원 단위로 올림)
    const current = goods.value.currentBidAmount || goods.value.startPrice || 0
    // 천원 단위로 올림: (현재가 + 1000)을 천원 단위로 내림한 후 천원 더하기
    return Math.floor((current + 1000) / 1000) * 1000
  }
})

/**
 * 카테고리 영문값을 한글로 변환하는 computed 속성
 */
const categoryDisplay = computed(() => {
  if (!goods.value?.category) return ''
  return CATEGORY_REVERSE_MAP[goods.value.category] || goods.value.category
})

// 실시간으로 계산된 남은 시간 (composable 사용)
const { timeRemaining, startTimer } = useTimeRemaining({
  auctionEndAt: computed(() => goods.value?.auctionEndAt),
  auctionStatus: computed(() => goods.value?.auctionStatus)
})

/**
 * 굿즈 상세 정보를 서버에서 가져오는 함수
 * 로그인이 필요한 경우(403 에러) 로그인 페이지로 리다이렉트
 * 성공 시 goods 상태를 업데이트하고 타이머를 재시작
 */
async function fetchGoodsDetail() {
  loading.value = true
  const result = await goodsStore.fetchGoodsDetail(route.query.goodsId)

  // 403 에러 발생 시 (로그인 필요)
  if (result.requiresAuth) {
    loading.value = false
    alert(result.message || '로그인이 필요합니다. 로그인 후 다시 시도해주세요.')
    router.push({ 
      name: 'Login', 
      query: { redirect: route.fullPath } 
    })
    return
  }

  if (result.success && goodsStore.currentGoods) {
    goods.value = goodsStore.currentGoods
    currentImage.value = goods.value.images?.[0]
    
    // goods가 업데이트된 후 타이머 재시작
    startTimer()
  } else {
    loading.value = false
    return
  }
  
  loading.value = false
}

/**
 * 입찰 모달을 여는 함수
 * 로그인하지 않은 경우 로그인 페이지로 리다이렉트
 * 모달이 열리면 최소 입찰 금액으로 초기화하고 입력 필드에 포커스
 */
async function openBidModal() {
  if (!isAuthenticated.value) {
    alert('로그인이 필요합니다.')
    router.push('/login')
    return
  }
  
  showBidModal.value = true
  bidAmount.value = minBidAmount.value
  bidErrorMessage.value = ''
  
  // 모달이 열린 후 입력 필드에 포커스
  await nextTick()
  const input = document.getElementById('bidAmount')
  if (input) {
    input.focus()
    input.select()
  }
}

/**
 * 입찰 모달을 닫는 함수
 * 모달 상태와 입력값, 에러 메시지를 초기화
 */
function closeBidModal() {
  showBidModal.value = false
  bidAmount.value = null
  bidErrorMessage.value = ''
}

/**
 * 입찰을 확정하는 함수
 * 입력값 유효성 검사 후 submitBid 서비스를 통해 입찰 처리
 * 성공 시 모달을 닫고 상세 정보를 새로고침
 * 실패 시 에러 메시지를 표시
 */
async function confirmBid() {
  if (!bidAmount.value || bidAmount.value <= 0) {
    bidErrorMessage.value = '올바른 금액을 입력해주세요.'
    return
  }

  const amount = parseInt(bidAmount.value)
  if (isNaN(amount) || amount <= 0) {
    bidErrorMessage.value = '올바른 금액을 입력해주세요.'
    return
  }

  // 최소 입찰 금액 검증
  if (amount < minBidAmount.value) {
    bidErrorMessage.value = `최소 입찰가(${formatPrice(minBidAmount.value)}) 이상의 금액을 입력해주세요.`
    return
  }

  submittingBid.value = true
  bidErrorMessage.value = ''

  // bid.js의 submitBid 함수를 사용하여 입찰 처리 (유효성 검사 및 API 호출 포함)
  const result = await submitBid(goods.value.goodsId, amount, {
    currentBidAmount: goods.value.currentBidAmount,
    startPrice: goods.value.startPrice,
    auctionStatus: goods.value.auctionStatus
  })

  submittingBid.value = false

  if (result.success) {
    closeBidModal()
    alert('입찰이 완료되었습니다.')
    await fetchGoodsDetail()
  } else {
    bidErrorMessage.value = result.message || '입찰에 실패했습니다.'
  }
}

/**
 * 입찰하기 버튼 클릭 핸들러
 * 입찰 모달을 여는 함수를 호출
 */
function handleBid() {
  openBidModal()
}

/**
 * 찜하기/찜 해제 토글 함수
 * 로그인하지 않은 경우 로그인 페이지로 리다이렉트
 * goodsStore의 toggleWishlist를 호출하여 찜 상태를 변경
 * 성공 시 상세 정보를 새로고침하여 최신 상태 반영
 */
async function toggleWishlist() {
  if (!isAuthenticated.value) {
    alert('로그인이 필요합니다.')
    router.push('/login')
    return
  }

  // 현재 checkWish 상태를 전달하여 올바른 요청(POST/DELETE)이 가도록 함
  const result = await goodsStore.toggleWishlist(goods.value.goodsId, goods.value.checkWish)
  
  if (result.success) {
    // API 응답의 checkWish 값으로 상태 업데이트
    if (goods.value) {
      goods.value.checkWish = result.checkWish
    }
    // 상세 정보 다시 불러오기 (최신 상태 반영)
    await fetchGoodsDetail()
  } else {
    alert(result.message || '찜하기 처리에 실패했습니다.')
  }
}

/**
 * 굿즈 삭제 처리 함수
 * 사용자 확인 후 goodsStore의 deleteGoods를 호출하여 삭제
 * 성공 시 굿즈 목록 페이지로 이동
 */
async function handleDelete() {
  if (!confirm('정말 삭제하시겠습니까?')) return

  const result = await goodsStore.deleteGoods(goods.value.goodsId)
  if (result.success) {
    alert('삭제되었습니다.')
    router.push('/goods')
  } else {
    alert(result.message)
  }
}

/**
 * 경매 중지 모달을 여는 함수
 * 모달 상태를 표시하고 에러 메시지를 초기화
 */
function openStopModal() {
  showStopModal.value = true
  stopErrorMessage.value = ''
}

/**
 * 경매 중지 모달을 닫는 함수
 * 모달 상태와 에러 메시지를 초기화
 */
function closeStopModal() {
  showStopModal.value = false
  stopErrorMessage.value = ''
}

/**
 * 경매 중지를 확정하는 함수
 * goodsStore의 stopAuction을 호출하여 경매를 중지
 * 성공 시 모달을 닫고 상세 정보를 새로고침
 * 실패 시 에러 메시지를 표시
 */
async function confirmStopAuction() {
  stoppingAuction.value = true
  stopErrorMessage.value = ''

  const result = await goodsStore.stopAuction(goods.value.goodsId)
  
  stoppingAuction.value = false

  if (result.success) {
    closeStopModal()
    alert('경매가 중지되었습니다.')
    await fetchGoodsDetail()
  } else {
    stopErrorMessage.value = result.message || '경매 중지에 실패했습니다.'
  }
}

/**
 * 경매 중지 버튼 클릭 핸들러
 * 경매 중지 모달을 여는 함수를 호출
 */
function handleStopAuction() {
  openStopModal()
}

/**
 * 굿즈 신고 처리 함수
 * 현재는 알림만 표시 (추후 구현 예정)
 */
function handleReport() {
  alert('신고가 접수되었습니다.')
}

/**
 * 사용자 신고 처리 함수
 * 현재는 알림만 표시 (추후 구현 예정)
 */
function handleReportUser() {
  alert('신고가 접수되었습니다.')
}

onMounted(() => {
  fetchGoodsDetail()
})
</script>

<style scoped>
.goods-detail-page {
  padding: 40px 0;
  min-height: calc(100vh - 100px);
  background: var(--bg-gradient);
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.owner-actions {
  display: flex;
  gap: 12px;
}

.detail-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-bottom: 60px;
}

.image-gallery {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-image {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-light);
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: var(--transition);
}

.main-image.completed img {
  filter: grayscale(0.75) brightness(0.8);
}

.status-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  color: white;
  z-index: 2;
}

.completed-badge {
  background: var(--text-gray);
}

.ongoing-badge {
  background: var(--primary-red);
}

.stopped-badge {
  background: #6c757d;
}

.detail-soldout {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 1;
}

.soldout-pill, .stopped-pill {
  color: white;
  padding: 12px 28px;
  border-radius: 999px;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.soldout-pill {
  background: rgba(248, 0, 45, 0.75);
  box-shadow: 0 10px 30px rgba(248, 0, 45, 0.35);
}

.stopped-pill {
  background: rgba(148, 140, 142, 0.75);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

.thumbnail-list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
}

.thumbnail {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: var(--transition);
}

.thumbnail:hover,
.thumbnail.active {
  border-color: var(--primary-red);
  transform: scale(1.05);
}

.thumbnail.completed {
  filter: grayscale(0.7);
  opacity: 0.75;
}

.goods-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.goods-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.goods-title {
  font-size: 32px;
  font-weight: 900;
  color: var(--text-dark);
}

.goods-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.meta-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 공통 사용자 정보 스타일 */
.user-info,
.seller-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 공통 프로필 이미지 스타일 */
.profile-image,
.seller-profile-image {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-color);
  flex-shrink: 0;
}

.seller-name {
  font-size: 16px;
  color: var(--text-gray);
  font-weight: 500;
}

.report-user-btn {
  background: none;
  border: none;
  color: var(--text-light);
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
}

.status-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 700;
  color: white;
}

.status-wait,
.status-waiting {
  background: var(--text-light);
}

.status-proceeding,
.status-ongoing {
  background: var(--primary-red);
}

.status-completed {
  background: var(--text-gray);
}

.status-stopped {
  background: #6c757d;
}

.auction-info {
  background: var(--bg-light);
  padding: 24px;
  border-radius: 12px;
}

.price-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-label {
  font-size: 14px;
  color: var(--text-gray);
}

.price-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-dark);
}

.price-value.highlight {
  color: var(--primary-red);
  font-size: 28px;
}

.timer-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.timer-label {
  font-size: 14px;
  color: var(--text-gray);
}

.timer-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-red);
}

.action-section {
  display: flex;
  gap: 12px;
}

.bid-btn {
  flex: 1;
  padding: 16px;
  font-size: 18px;
  font-weight: 700;
}

.wishlist-btn {
  padding: 16px 24px;
  border: 2px solid var(--primary-red);
  background: white;
  color: var(--primary-red);
  border-radius: 8px;
  font-weight: 600;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 8px;
}

.wishlist-btn.active {
  background: var(--primary-red);
  color: white;
}

.heart-icon-detail {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.heart-icon-detail svg {
  width: 100%;
  height: 100%;
  transition: var(--transition);
}

.heart-icon-detail.filled svg {
  animation: heart-pop 0.3s ease-out;
}

@keyframes heart-pop {
  0% {
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.goods-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 24px;
  background: var(--bg-light);
  border-radius: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: var(--text-light);
}

.detail-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-dark);
}

.description-section {
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: var(--card-shadow);
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 16px;
}

.description {
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-gray);
  white-space: pre-wrap;
}

.bidders-section {
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: var(--card-shadow);
}

.bidders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bidder-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-light);
  border-radius: 8px;
  justify-content: space-between;
}

.bidder-item.winner {
  background: rgba(230, 57, 70, 0.1);
  border: 2px solid var(--primary-red);
}

.bidder-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.bidder-rank {
  font-weight: 700;
  color: var(--primary-red);
  min-width: 40px;
  font-size: 16px;
}

.bidder-name {
  font-weight: 500;
  color: var(--text-dark);
  font-size: 16px;
}

.bidder-price {
  font-weight: 700;
  color: var(--primary-red);
  margin-left: auto;
  font-size: 18px;
}

.comments-section {
  margin-top: 40px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: var(--card-shadow);
}

.loading,
.error-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-light);
  font-size: 16px;
}

/* 입찰 모달 스타일 */
.bid-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1500;
  padding: 16px;
}

.bid-modal {
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.bid-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.bid-header h3 {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-dark);
  margin: 0;
}

.close-btn {
  border: none;
  background: none;
  font-size: 28px;
  cursor: pointer;
  color: var(--text-dark);
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: var(--transition);
}

.close-btn:hover {
  background: var(--bg-light);
}

.bid-info {
  background: var(--bg-light);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bid-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bid-info-label {
  font-size: 14px;
  color: var(--text-gray);
  font-weight: 500;
}

.bid-info-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-dark);
}

.bid-info-value.highlight {
  color: var(--primary-red);
  font-size: 20px;
}

.bid-info-value.required {
  color: var(--primary-red);
  font-size: 20px;
}

.bid-warning {
  font-size: 13px;
  color: var(--text-gray);
  line-height: 1.6;
  padding: 12px;
  background: rgba(255, 71, 87, 0.08);
  border-radius: 8px;
  border-left: 3px solid var(--primary-red);
}

.bid-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bid-input-group label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dark);
}

.bid-input {
  width: 100%;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 14px 16px;
  font-size: 16px;
  font-weight: 600;
  transition: var(--transition);
}

.bid-input:focus {
  outline: none;
  border-color: var(--primary-red);
  box-shadow: 0 0 0 3px rgba(255, 71, 87, 0.1);
}

.bid-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.cancel-btn {
  flex: 1;
  padding: 14px;
  border: 2px solid var(--border-color);
  background: white;
  color: var(--text-dark);
  border-radius: 10px;
  font-weight: 700;
  transition: var(--transition);
}

.cancel-btn:hover {
  background: var(--bg-light);
}

.confirm-btn {
  flex: 2;
  padding: 14px;
  border: none;
  border-radius: 10px;
  font-weight: 800;
  font-size: 16px;
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: var(--primary-red);
  font-size: 13px;
  text-align: center;
  margin-top: -8px;
}

/* 경매 중지 모달 스타일 */
.stop-warning {
  padding: 20px;
  background: rgba(255, 71, 87, 0.1);
  border-radius: 12px;
  border: 2px solid rgba(255, 71, 87, 0.3);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.warning-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--primary-red);
  margin: 0;
  text-align: center;
}

.warning-text {
  font-size: 14px;
  color: var(--text-gray);
  line-height: 1.6;
  margin: 0;
  text-align: center;
}

.stop-confirm-btn {
  background: var(--primary-red);
}

.stop-confirm-btn:hover:not(:disabled) {
  background: #d32f2f;
}

@media (max-width: 968px) {
  .detail-content {
    grid-template-columns: 1fr;
  }
}
</style>

