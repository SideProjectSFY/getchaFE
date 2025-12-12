import api from './api'

let pollTimer = null
const POLL_INTERVAL = 1000 // 1초 간격 재호출

async function poll(onData) {
  try {
    const res = await api.get('/notification/stream')
    if (res.status === 200 && Array.isArray(res.data) && res.data.length) {
      onData(res.data)
    }
  } catch (e) {
    // 오류 시에도 간격을 유지하며 재시도
  } finally {
    pollTimer = setTimeout(() => poll(onData), POLL_INTERVAL)
  }
}

// 기존 socket 인터페이스를 유지하면서 롱폴링으로 대체
export function initSocket(_token, onData) {
  disconnectSocket()
  poll(onData)
  return null
}

export function disconnectSocket() {
  if (pollTimer) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
}

export function getSocket() {
  return null
}

