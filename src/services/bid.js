import api from './api'
import { extractResponseData } from '../utils/responseApi'

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
 * 에러 응답에서 메시지 추출 (공통 로직)
 * @param {Error} error - Axios 에러 객체
 * @param {Object} defaultMessages - 상태 코드별 기본 메시지 객체
 * @returns {string}
 */
function extractErrorMessage(error, defaultMessages = {}) {
  const status = error.response?.status
  const message = error.response?.data?.message || error.message

  // 백엔드에서 전달된 메시지가 있으면 그대로 사용
  if (message) {
    return message
  }

  // 상태 코드에 따른 기본 메시지 반환
  if (status && defaultMessages[status]) {
    return defaultMessages[status]
  }

  // 네트워크 오류 등 상태 코드가 없는 경우
  if (!status) {
    return '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }

  return '요청 처리 중 오류가 발생했습니다.'
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
      data: extractResponseData(response)
    }
  } catch (error) {
    const status = error.response?.status

    // 입찰 관련 기본 에러 메시지
    const defaultMessages = {
      400: '잘못된 요청입니다.',
      403: '판매자는 자신의 굿즈에 입찰할 수 없습니다.',
      404: '존재하지 않는 굿즈 또는 이미 종료된 경매입니다.',
      500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    }

    const message = extractErrorMessage(error, defaultMessages)

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
 * @param {number} goodsId - 굿즈 ID (필수값)
 * @returns {Promise<{success: boolean, data?: any, message?: string, errorCode?: number}>}
 */
export async function stopAuction(goodsId) {
  try {
    // 요청 데이터 검증
    if (!goodsId) {
      return {
        success: false,
        message: '굿즈 ID는 필수입니다.',
        errorCode: 400
      }
    }

    // 숫자 타입 검증
    const goodsIdNum = Number(goodsId)
    if (isNaN(goodsIdNum)) {
      return {
        success: false,
        message: '올바른 형식의 굿즈 ID를 입력해주세요.',
        errorCode: 400
      }
    }

    // API 호출
    const response = await api.put('/bid/stop-auction', null, { params: { goodsId: goodsIdNum } })

    return {
      success: true,
      data: extractResponseData(response)
    }
  } catch (error) {
    const status = error.response?.status

    // 경매 중지 관련 기본 에러 메시지 (백엔드 메시지가 없을 때 사용)
    // 백엔드에서 전달된 메시지가 있으면 그대로 사용됨
    const defaultMessages = {
      403: '거래 중지 권한이 없습니다.',
      404: '존재하지 않는 굿즈 또는 이미 종료된 경매입니다.',
      500: '경매 중지에 실패했습니다.'
    }

    const message = extractErrorMessage(error, defaultMessages)

    return {
      success: false,
      message,
      errorCode: status
    }
  }
}


