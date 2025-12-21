export function formatPrice(price) {
  return new Intl.NumberFormat('ko-KR').format(price) + ' 골드'
}

export function formatDate(dateString) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

/**
 * auctionEndAt으로부터 남은 시간(초) 계산
 * @param {string} auctionEndAt - 경매 종료 시간 (ISO 문자열)
 * @returns {number} 남은 시간(초), 이미 종료되었거나 잘못된 값이면 0
 */
export function calculateTimeRemaining(auctionEndAt) {
  if (!auctionEndAt) return 0
  
  const endTime = new Date(auctionEndAt).getTime()
  const now = new Date().getTime()
  const diff = Math.floor((endTime - now) / 1000) // 초 단위
  return Math.max(0, diff)
}

export function formatTimeRemaining(seconds) {
  if (seconds <= 0) return '종료됨'
  
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (days > 0) {
    return `${days}일 ${hours}시간 ${minutes}분`
  } else if (hours > 0) {
    return `${hours}시간 ${minutes}분 ${secs}초`
  } else if (minutes > 0) {
    return `${minutes}분 ${secs}초`
  } else {
    return `${secs}초`
  }
}

export function formatAuctionStatus(status) {
  const statusMap = {
    WAIT: '경매 대기',
    PROCEEDING: '진행 중',
    COMPLETED: '종료',
    STOPPED: '거래 중지'
  }
  return statusMap[status] || status
}

import { CATEGORY_REVERSE_MAP } from './category'

/**
 * 카테고리 영문값을 한글로 변환
 */
export function formatCategory(category) {
  return CATEGORY_REVERSE_MAP[category] || category
}

/**
 * 굿즈 가격 표시 로직
 * currentBidAmount가 null이고 auctionStatus가 WAIT 또는 STOPPED일 경우 startPrice를 반환
 * 그 외의 경우 currentBidAmount 또는 startPrice를 반환
 */
export function getDisplayPrice(goods) {
  if (!goods) return 0
  
  const { currentBidAmount, startPrice, auctionStatus } = goods
  
  // currentBidAmount가 null이고 auctionStatus가 WAIT 또는 STOPPED일 경우 startPrice 반환
  if (currentBidAmount === null && (auctionStatus === 'WAIT' || auctionStatus === 'STOPPED')) {
    return startPrice
  }
  
  // 그 외의 경우 currentBidAmount 또는 startPrice 반환
  return currentBidAmount || startPrice || 0
}


