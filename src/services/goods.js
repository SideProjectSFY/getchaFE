import api from './api'

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
 * 굿즈 등록 API 호출
 * @param {Object} goodsData - 굿즈 등록 데이터
 * @param {Array} goodsData.images - 이미지 파일 배열
 * @returns {Promise<{success: boolean, data?: any, message?: string, errorCode?: number}>}
 */
export async function registerGoods(goodsData) {
  try {
    const formData = new FormData()
    const { images, ...goodsRegister } = goodsData
    
    formData.append(
      'goodsRegister',
      new Blob([JSON.stringify(goodsRegister)], { type: 'application/json' })
    )
    
    if (Array.isArray(images)) {
      images.forEach(img => formData.append('imageFiles', img))
    }

    const response = await api.post('/goods', formData, {
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
      403: '굿즈 등록 권한이 없습니다.',
      500: '굿즈 등록에 실패했습니다.'
    })

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

