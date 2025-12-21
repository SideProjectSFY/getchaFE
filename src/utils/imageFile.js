/**
 * 이미지 파일 관련 공통 유틸리티 함수
 */

/**
 * FormData에 JSON 데이터 추가 (내부 함수)
 * @param {FormData} formData - FormData 객체
 * @param {string} fieldName - 필드명 (예: 'goodsRegister', 'goodsModify')
 * @param {Object} data - JSON으로 변환할 데이터 객체
 */
function appendJsonToFormData(formData, fieldName, data) {
  formData.append(
    fieldName,
    new Blob([JSON.stringify(data)], { type: 'application/json' })
  )
}

/**
 * FormData에 이미지 파일들 추가 (내부 함수)
 * @param {FormData} formData - FormData 객체
 * @param {string} fieldName - 필드명 (예: 'imageFiles', 'newImageFiles')
 * @param {Array<File>} imageFiles - 이미지 파일 배열
 */
function appendImagesToFormData(formData, fieldName, imageFiles) {
  if (Array.isArray(imageFiles) && imageFiles.length > 0) {
    imageFiles.forEach(file => {
      formData.append(fieldName, file)
    })
  }
}

/**
 * 굿즈 등록/수정용 FormData 생성
 * @param {Object} jsonData - JSON 데이터 (goodsRegister 또는 goodsModify)
 * @param {string} jsonFieldName - JSON 필드명
 * @param {Array<File>} imageFiles - 이미지 파일 배열
 * @param {string} imageFieldName - 이미지 필드명
 * @returns {FormData}
 */
export function createGoodsFormData(jsonData, jsonFieldName, imageFiles = [], imageFieldName = 'imageFiles') {
  const formData = new FormData()
  
  // JSON 데이터 추가
  appendJsonToFormData(formData, jsonFieldName, jsonData)
  
  // 이미지 파일 추가
  appendImagesToFormData(formData, imageFieldName, imageFiles)
  
  return formData
}

/**
 * FileReader를 사용하여 파일을 Base64로 변환 (미리보기용, 내부 함수)
 * @param {File} file - 파일 객체
 * @returns {Promise<string>} Base64 문자열
 */
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}

/**
 * 파일 크기 검증
 * @param {Array<File>} files - 파일 배열
 * @param {number} maxSizePerFile - 파일당 최대 크기 (바이트 단위, 기본값: 10MB)
 * @param {number} maxTotalSize - 전체 파일 합계 최대 크기 (바이트 단위, 기본값: null, null이면 제한 없음)
 * @returns {{valid: boolean, oversizedFiles?: Array<File>, totalSize?: number, message?: string}}
 */
export function validateFileSizes(files, maxSizePerFile = 10 * 1024 * 1024, maxTotalSize = null) {
  if (!Array.isArray(files) || files.length === 0) {
    return { valid: true }
  }

  const oversizedFiles = files.filter(file => file.size > maxSizePerFile)
  
  // 파일당 크기 검증
  if (oversizedFiles.length > 0) {
    const maxSizeMB = (maxSizePerFile / 1024 / 1024).toFixed(0)
    return {
      valid: false,
      oversizedFiles,
      message: `파일 크기가 너무 큽니다. 각 파일은 최대 ${maxSizeMB}MB까지 업로드 가능합니다.`
    }
  }

  // 전체 크기 검증 (여러 파일 업로드 시)
  if (maxTotalSize !== null) {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    if (totalSize > maxTotalSize) {
      const maxTotalSizeMB = (maxTotalSize / 1024 / 1024).toFixed(0)
      const currentTotalSizeMB = (totalSize / 1024 / 1024).toFixed(1)
      return {
        valid: false,
        totalSize,
        message: `전체 파일 크기가 너무 큽니다. (현재: ${currentTotalSizeMB}MB / 최대: ${maxTotalSizeMB}MB)`
      }
    }
  }

  return { valid: true }
}

/**
 * 여러 파일을 Base64로 변환 (미리보기용)
 * @param {Array<File>} files - 파일 배열
 * @returns {Promise<Array<{file: File, preview: string}>>}
 */
export async function readFilesAsDataURL(files) {
  const results = await Promise.all(
    files.map(async (file) => ({
      file,
      preview: await readFileAsDataURL(file)
    }))
  )
  return results
}

