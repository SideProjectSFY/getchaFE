import api from './api'
import { CATEGORY_MAP } from '../utils/category'
import { createGoodsFormData } from '../utils/imageFile'

/**
 * 에러 응답에서 메시지 추출
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
 * 굿즈 목록 조회 API 호출
 * @param {Object} filters - 필터 조건
 * @param {number} page - 페이지 번호
 * @param {number} size - 페이지 크기
 * @returns {Promise<{success: boolean, data?: any, message?: string, errorCode?: number}>}
 */
export async function fetchGoodsList(filters = {}, page = 1, size = 10) {
  try {
    const params = { ...filters, page, size }
    const response = await api.get('/goods/list', { params })
    
    // 응답 구조: response.data.data.items 또는 response.data.items
    const responseData = response.data?.data || response.data
    
    return {
      success: true,
      data: responseData
    }
  } catch (error) {
    const status = error.response?.status
    const message = extractErrorMessage(error, {
      400: '잘못된 요청입니다.',
      500: '굿즈 목록을 불러오는데 실패했습니다.'
    })

    return {
      success: false,
      message,
      errorCode: status
    }
  }
}

/**
 * 굿즈 상세 조회 API 호출
 * @param {number} goodsId - 굿즈 ID
 * @returns {Promise<{success: boolean, data?: any, message?: string, errorCode?: number, requiresAuth?: boolean}>}
 */
export async function fetchGoodsDetail(goodsId) {
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

    const response = await api.get('/goods', { params: { goodsId: goodsIdNum } })
    const responseData = response.data?.data || response.data

    return {
      success: true,
      data: responseData
    }
  } catch (error) {
    const status = error.response?.status

    // 403 에러는 로그인이 필요한 경우
    if (status === 403) {
      return {
        success: false,
        requiresAuth: true,
        message: error.response?.data?.message || '로그인이 필요합니다. 로그인 후 다시 시도해주세요.',
        errorCode: status
      }
    }

    const message = extractErrorMessage(error, {
      400: '잘못된 요청입니다.',
      404: '존재하지 않는 굿즈입니다.',
      500: '굿즈 정보를 불러오는데 실패했습니다.'
    })

    return {
      success: false,
      message,
      errorCode: status
    }
  }
}

/**
 * 굿즈 등록 금액 검증
 * @param {number} startPrice - 시작가
 * @param {number|null} instantBuyPrice - 즉시구매가 (선택값)
 * @returns {{valid: boolean, message?: string}}
 */
export function validateGoodsPrices(startPrice, instantBuyPrice = null) {
  const MIN_PRICE = 1000 // 천원
  const MAX_PRICE = 5000000 // 500만원

  // 시작가 검증
  if (!startPrice || startPrice < MIN_PRICE) {
    return {
      valid: false,
      message: `시작가는 ${MIN_PRICE.toLocaleString()}원 이상이어야 합니다.`
    }
  }

  if (startPrice > MAX_PRICE) {
    return {
      valid: false,
      message: `시작가는 ${MAX_PRICE.toLocaleString()}원 이하여야 합니다.`
    }
  }

  // 즉시구매가 검증 (선택값이지만 입력된 경우)
  if (instantBuyPrice !== null && instantBuyPrice !== undefined) {
    if (instantBuyPrice < startPrice) {
      return {
        valid: false,
        message: '즉시구매가는 시작가 이상이어야 합니다.'
      }
    }

    if (instantBuyPrice > MAX_PRICE) {
      return {
        valid: false,
        message: `즉시구매가는 ${MAX_PRICE.toLocaleString()}원 이하여야 합니다.`
      }
    }
  }

  return { valid: true }
}

/**
 * 굿즈 등록 API 호출
 * @param {Object} goodsData - 굿즈 등록 데이터
 * @param {number} goodsData.animeId - 애니메이션 ID (필수)
 * @param {string} goodsData.category - 카테고리 (한글 또는 영문, 필수)
 * @param {string} goodsData.title - 제목 (필수)
 * @param {string} goodsData.description - 설명 (필수)
 * @param {number} goodsData.startPrice - 시작가 (필수, 천원 이상)
 * @param {number|null} goodsData.maxPrice - 상한가/즉시구매가 (선택)
 * @param {number} goodsData.duration - 경매 기간 (필수)
 * @param {Array<File>} goodsData.images - 이미지 파일 배열 (필수)
 * @returns {Promise<{success: boolean, data?: any, message?: string, errorCode?: number}>}
 */
export async function registerGoods(goodsData) {
  try {
    // 필수 필드 검증
    if (!goodsData.animeId || !goodsData.category || !goodsData.title || !goodsData.description || !goodsData.startPrice || !goodsData.duration) {
      return {
        success: false,
        message: '필수 항목을 모두 입력해주세요.',
        errorCode: 400
      }
    }

    // 이미지 파일 검증
    if (!Array.isArray(goodsData.images) || goodsData.images.length === 0) {
      return {
        success: false,
        message: '이미지를 최소 1개 이상 업로드해주세요.',
        errorCode: 400
      }
    }

    // 금액 검증
    const priceValidation = validateGoodsPrices(goodsData.startPrice, goodsData.maxPrice)
    if (!priceValidation.valid) {
      return {
        success: false,
        message: priceValidation.message,
        errorCode: 400
      }
    }

    // 카테고리 변환 (한글 -> 영문)
    const category = CATEGORY_MAP[goodsData.category] || goodsData.category

    // goodsRegister 객체 생성 (백엔드 요청 형식에 맞춤)
    const { images, maxPrice, ...rest } = goodsData
    const goodsRegister = {
      animeId: Number(goodsData.animeId),
      category: category,
      title: String(goodsData.title).trim(),
      description: String(goodsData.description).trim(),
      startPrice: Number(goodsData.startPrice),
      instantBuyPrice: maxPrice !== null && maxPrice !== undefined ? Number(maxPrice) : null,
      duration: Number(goodsData.duration)
    }

    // FormData 생성 (공통 함수 사용)
    const formData = createGoodsFormData(goodsRegister, 'goodsRegister', images, 'imageFiles')

    // API 호출
    const response = await api.post('/goods', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    // 응답 데이터 추출 (goodsId 반환)
    const responseData = response.data?.data || response.data

    return {
      success: true,
      data: {
        goodsId: responseData?.goodsId
      }
    }
  } catch (error) {
    const status = error.response?.status

    // 에러 메시지 처리 (백엔드 메시지 우선)
    const defaultMessages = {
      400: '잘못된 요청입니다.',
      401: '로그인이 필요합니다.',
      403: '굿즈 등록 권한이 없습니다.',
      500: '굿즈 등록에 실패하였습니다.'
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
 * 굿즈 수정 API 호출
 * @param {number} goodsId - 굿즈 ID
 * @param {Object} goodsData - 굿즈 수정 데이터
 * @param {Array} goodsData.newImages - 새로 추가할 이미지 파일 배열
 * @param {Array} goodsData.existingImages - 기존 이미지 URL 배열 (유지할 이미지)
 * @returns {Promise<{success: boolean, data?: any, message?: string, errorCode?: number}>}
 */
export async function updateGoods(goodsId, goodsData) {
  try {
    if (!goodsId) {
      return {
        success: false,
        message: '굿즈 ID는 필수입니다.',
        errorCode: 400
      }
    }

    const formData = new FormData()
    const { newImages, existingImages, ...goodsModify } = goodsData
    
    // 기존 이미지 정보도 함께 전송 (필요한 경우)
    if (existingImages && Array.isArray(existingImages)) {
      formData.append(
        'goodsModify',
        new Blob([JSON.stringify({ ...goodsModify, goodsId, existingImages })], { type: 'application/json' })
      )
    } else {
      formData.append(
        'goodsModify',
        new Blob([JSON.stringify({ ...goodsModify, goodsId })], { type: 'application/json' })
      )
    }
    
    if (Array.isArray(newImages)) {
      newImages.forEach(img => formData.append('newImageFiles', img))
    }

    const response = await api.put('/goods', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    return {
      success: true,
      data: response.data?.data || response.data
    }
  } catch (error) {
    const status = error.response?.status
    const message = extractErrorMessage(error, {
      400: '잘못된 요청입니다.',
      401: '로그인이 필요합니다.',
      403: '굿즈 수정 권한이 없습니다.',
      404: '존재하지 않는 굿즈입니다.',
      500: '굿즈 수정에 실패했습니다.'
    })

    return {
      success: false,
      message,
      errorCode: status
    }
  }
}

/**
 * 굿즈 삭제 API 호출
 * @param {number} goodsId - 굿즈 ID (필수값)
 * @returns {Promise<{success: boolean, data?: any, message?: string, errorCode?: number}>}
 */
export async function deleteGoods(goodsId) {
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
    await api.delete('/goods', { params: { goodsId: goodsIdNum } })

    return {
      success: true
    }
  } catch (error) {
    const status = error.response?.status

    // 상태 코드별 기본 메시지 정의
    const defaultMessages = {
      400: '경매 대기 또는 종료된 후에만 삭제가 가능합니다.',
      403: '삭제 권한이 없습니다.',
      404: '존재하지 않는 굿즈입니다.',
      500: '굿즈 삭제에 실패하였습니다.'
    }

    const message = extractErrorMessage(error, defaultMessages)

    return {
      success: false,
      message,
      errorCode: status
    }
  }
}

