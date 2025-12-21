/**
 * 백엔드 이미지 경로를 프론트엔드에서 사용할 수 있는 형태로 변환
 * 백엔드: http://localhost:8080/images/..
 * 프론트엔드: /images/.. (Vite proxy가 자동으로 처리)
 */
export function getImageUrl(path) {
  if (!path) return '/placeholder.png'
  
  // 이미 완전한 URL인 경우 (http:// 또는 https://)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    // localhost:8080/images/.. 형식이면 /images/.. 로 변환
    if (path.includes('localhost:8080/images/')) {
      const match = path.match(/\/images\/.*$/)
      return match ? match[0] : '/placeholder.png'
    }
    return path
  }
  
  // /images/ 로 시작하면 그대로 사용 (프록시가 처리)
  if (path.startsWith('/images/')) {
    return path
  }
  
  // images/ 로 시작 (앞에 / 없음)
  if (path.startsWith('images/')) {
    return `/${path}`
  }
  
  // 그 외의 경우 (상대 경로 등) - 백엔드에서 /images/... 형식으로 올 것으로 가정
  // /로 시작하지 않으면 /images/ 접두사 추가
  if (!path.startsWith('/')) {
    return `/images/${path}`
  }
  
  // /로 시작하는 경우 그대로 사용 (백엔드가 /images/... 형식으로 주는 것으로 가정)
  return path
}

