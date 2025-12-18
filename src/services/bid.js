import api from './api'

/**
 * 입찰 금액 유효성 검사 (클라이언트 사이드 검증)
 * @param {number} bidAmount - 입찰 금액
 * @param {number} currentBidAmount - 현재 입찰가 (null이면 입찰 없음)
 * @param {number} startPrice - 시작가
 * @param {string} auctionStatus - 경매 상태 (WAIT, PROCEEDING 등)
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateBidAmount(bidAmount, currentBidAmount = null, startPrice = 0, auctionStatus = null) {
  if (!bidAmount || bidAmount <= 0) {
    return { valid: false, message: '올바른 금액을 입력해주세요.' }
  }

  // WAIT 상태이고 현재 입찰가가 null인 경우: 시작가부터 입찰 가능 (같아도 됨)
  const isFirstBid = auctionStatus === 'WAIT' && (currentBidAmount === null || currentBidAmount === undefined)
  
  if (isFirstBid) {
    // 첫 입찰: 시작가 이상이어야 함
    if (bidAmount < startPrice) {
      return { 
        valid: false, 
        message: `시작가(${formatPrice(startPrice)}) 이상의 금액을 입력해주세요.` 
      }
    }
  } else {
    // 기존 입찰이 있는 경우: 현재 입찰가보다 높아야 함
    const minBidAmount = currentBidAmount || startPrice
    if (bidAmount <= minBidAmount) {
      return { 
        valid: false, 
        message: `현재 입찰가(${formatPrice(minBidAmount)})보다 높은 금액을 입력해주세요.` 
      }
    }
  }

  const MAX_BID_AMOUNT = 5000000 // 500만 골드
  if (bidAmount > MAX_BID_AMOUNT) {
    return { 
      valid: false, 
      message: `거래 제한 금액(500만 골드)을 초과할 수 없습니다.` 
    }
  }

  return { valid: true }
}

/**
 * 가격 포맷팅 헬퍼 함수 (유효성 검사에서 사용)
 * @param {number} price - 가격
 * @returns {string}
 */
function formatPrice(price) {
  return new Intl.NumberFormat('ko-KR').format(price) + '골드'
}

/**
 * 에러 응답에서 메시지 추출
 * @param {Error} error - Axios 에러 객체
 * @returns {string}
 */
function extractErrorMessage(error) {
  const status = error.response?.status
  const message = error.response?.data?.message || error.message

  // 에러 상태 코드에 따른 기본 메시지 설정
  if (!status) {
    return '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }

  switch (status) {
    case 400:
      // 400 에러의 경우 백엔드에서 전달된 메시지를 그대로 사용
      // 단, 메시지가 없는 경우 기본 메시지 반환
      return message || '잘못된 요청입니다.'
    
    case 403:
      return message || '판매자는 자신의 굿즈에 입찰할 수 없습니다.'
    
    case 404:
      return message || '존재하지 않는 굿즈 또는 이미 종료된 경매입니다.'
    
    case 500:
      // 500 에러의 경우 백엔드에서 전달된 메시지를 그대로 사용
      return message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    
    default:
      return message || '입찰 처리 중 오류가 발생했습니다.'
  }
}

/**
 * 입찰하기 API 호출
 * @param {number} goodsId - 굿즈 ID
 * @param {number} bidAmount - 입찰 금액
 * @returns {Promise<{success: boolean, data?: any, message?: string, errorCode?: number}>}
 */
export async function placeBid(goodsId, bidAmount) {
  try {
    // 요청 데이터 검증
    if (!goodsId || !bidAmount) {
      return {
        success: false,
        message: '굿즈 ID와 입찰 금액은 필수입니다.',
        errorCode: 400
      }
    }

    // 숫자 타입 검증
    const goodsIdNum = Number(goodsId)
    const bidAmountNum = Number(bidAmount)

    if (isNaN(goodsIdNum) || isNaN(bidAmountNum)) {
      return {
        success: false,
        message: '올바른 형식의 데이터를 입력해주세요.',
        errorCode: 400
      }
    }

    const response = await api.post('/bid', {
      goodsId: goodsIdNum,
      bidAmount: bidAmountNum
    })

    return {
      success: true,
      data: response.data?.data || response.data
    }
  } catch (error) {
    const status = error.response?.status
    const message = extractErrorMessage(error)

    return {
      success: false,
      message,
      errorCode: status
    }
  }
}

/**
 * 입찰하기 (유효성 검사 포함)
 * 전체 입찰 프로세스를 처리하는 통합 함수
 * @param {number} goodsId - 굿즈 ID
 * @param {number} bidAmount - 입찰 금액
 * @param {object} goodsInfo - 굿즈 정보 (currentBidAmount, startPrice, auctionStatus 포함)
 * @returns {Promise<{success: boolean, data?: any, message?: string, errorCode?: number}>}
 */
export async function submitBid(goodsId, bidAmount, goodsInfo = {}) {
  // 클라이언트 사이드 유효성 검사
  const validation = validateBidAmount(
    bidAmount,
    goodsInfo.currentBidAmount,
    goodsInfo.startPrice,
    goodsInfo.auctionStatus
  )

  if (!validation.valid) {
    return {
      success: false,
      message: validation.message,
      errorCode: 400
    }
  }

  // API 호출
  return await placeBid(goodsId, bidAmount)
}

/**
 * 경매 중지 API 호출
 * @param {number} goodsId - 굿즈 ID
 * @returns {Promise<{success: boolean, data?: any, message?: string, errorCode?: number}>}
 */
export async function stopAuction(goodsId) {
  try {
    if (!goodsId) {
      return {
        success: false,
        message: '굿즈 ID는 필수입니다.',
        errorCode: 400
      }
    }

    const goodsIdNum = Number(goodsId)
    if (isNaN(goodsIdNum)) {
      return {
        success: false,
        message: '올바른 형식의 굿즈 ID를 입력해주세요.',
        errorCode: 400
      }
    }

    const response = await api.put('/bid/stop-auction', null, { params: { goodsId: goodsIdNum } })

    return {
      success: true,
      data: response.data?.data || response.data
    }
  } catch (error) {
    const status = error.response?.status
    const message = extractErrorMessage(error)

    return {
      success: false,
      message: message || '경매 중지에 실패했습니다.',
      errorCode: status
    }
  }
}

/**
 * 에러 코드에 따른 사용자 메시지 처리
 * 400 에러의 경우 다양한 메시지를 처리할 수 있도록 개선
 * 
 * 문제점:
 * - 400 에러 하나로 여러 가지 다른 의미의 에러를 처리하는 것은 RESTful API 설계 관점에서 좋지 않습니다.
 * - 각 에러 상황에 대해 별도의 HTTP 상태 코드나 에러 코드를 제공하는 것이 더 명확합니다.
 * - 예: 400 (Bad Request)는 클라이언트 요청 자체가 잘못된 경우,
 *       409 (Conflict)는 현재 최고 입찰자 재입찰 금지와 같은 비즈니스 로직 충돌,
 *       402 (Payment Required)는 잔액 부족과 같은 결제 관련 문제
 * 
 * 권장사항:
 * - 백엔드에서 더 세분화된 HTTP 상태 코드 사용 (409, 402 등)
 * - 또는 에러 응답에 errorCode 필드를 추가하여 구체적인 에러 타입 식별
 * 
 * @param {number} errorCode - HTTP 상태 코드
 * @param {string} message - 백엔드에서 전달된 메시지
 * @returns {string}
 */
export function getBidErrorMessage(errorCode, message) {
  // 백엔드에서 전달된 메시지가 있으면 그대로 사용
  if (message) {
    return message
  }

  // 메시지가 없는 경우 상태 코드에 따른 기본 메시지
  switch (errorCode) {
    case 400:
      return '잘못된 요청입니다.'
    case 403:
      return '판매자는 자신의 굿즈에 입찰할 수 없습니다.'
    case 404:
      return '존재하지 않는 굿즈 또는 이미 종료된 경매입니다.'
    case 500:
      return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    default:
      return '입찰 처리 중 오류가 발생했습니다.'
  }
}

