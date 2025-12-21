import { ref, onMounted, onUnmounted, computed } from 'vue'
import { calculateTimeRemaining } from '../utils/format'

/**
 * 경매 남은 시간을 실시간으로 계산하는 Composable
 * @param {Object} options - 옵션 객체
 * @param {string|Ref<string>|Computed<string>} options.auctionEndAt - 경매 종료 시간
 * @param {string|Ref<string>|Computed<string>} options.auctionStatus - 경매 상태 (PROCEEDING, WAIT, COMPLETED, STOPPED)
 * @returns {Object} { timeRemaining, updateTimeRemaining, startTimer, stopTimer }
 */
export function useTimeRemaining(options) {
  const { auctionEndAt, auctionStatus } = options
  const timeRemaining = ref(0)
  let intervalId = null

  // auctionEndAt과 auctionStatus가 ref/computed인지 일반 값인지 확인
  const getAuctionEndAt = () => {
    if (typeof auctionEndAt === 'object' && auctionEndAt !== null) {
      // ref 또는 computed인 경우
      if ('value' in auctionEndAt) {
        return auctionEndAt.value
      }
    }
    return auctionEndAt
  }

  const getAuctionStatus = () => {
    if (typeof auctionStatus === 'object' && auctionStatus !== null) {
      // ref 또는 computed인 경우
      if ('value' in auctionStatus) {
        return auctionStatus.value
      }
    }
    return auctionStatus
  }

  // 남은 시간 계산 함수
  function updateTimeRemaining() {
    const endAt = getAuctionEndAt()
    const status = getAuctionStatus()
    
    if (!endAt || 
        status === 'COMPLETED' || 
        status === 'STOPPED') {
      timeRemaining.value = 0
      return
    }
    
    timeRemaining.value = calculateTimeRemaining(endAt)
  }

  // 타이머 시작
  function startTimer() {
    if (intervalId) {
      clearInterval(intervalId)
    }

    const status = getAuctionStatus()
    
    // WAIT 또는 PROCEEDING 상태일 때만 타이머 실행
    if (status === 'PROCEEDING' || status === 'WAIT') {
      // 초기 계산
      updateTimeRemaining()
      
      intervalId = setInterval(() => {
        updateTimeRemaining()
        // 시간이 0이 되면 타이머 중지
        if (timeRemaining.value <= 0) {
          clearInterval(intervalId)
          intervalId = null
        }
      }, 1000)
    } else {
      // 다른 상태면 초기 계산만 수행
      updateTimeRemaining()
    }
  }

  // 타이머 정리
  function stopTimer() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  onMounted(() => {
    startTimer()
  })

  onUnmounted(() => {
    stopTimer()
  })

  return {
    timeRemaining,
    updateTimeRemaining,
    startTimer,
    stopTimer
  }
}

