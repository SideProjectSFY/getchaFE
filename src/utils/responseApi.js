/**
 * 백엔드 공통 응답 구조에서 data 추출
 * @param {object} response - axios 응답 객체
 * @param {any} defaultValue - 기본값 (기본: [])
 * @returns {any} 추출된 data
 */
export function extractResponseData(response, defaultValue = []) {
  if (!response) return defaultValue
  return response.data?.data ?? response.data ?? defaultValue
}

/**
 * 배열 응답 데이터 추출 및 검증
 * @param {object} response - axios 응답 객체
 * @returns {array} 배열 데이터
 */
export function extractArrayResponse(response) {
  const data = extractResponseData(response, [])
  return Array.isArray(data) ? data : []
}

