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
    WAITING: '경매 대기',
    ONGOING: '진행 중',
    COMPLETED: '완료',
    STOPPED: '거래 중지'
  }
  return statusMap[status] || status
}

