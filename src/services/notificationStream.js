import api from './api'

let pollTimer = null
const POLL_INTERVAL = 1000 // 1초 간격 재호출

async function poll(onData) {
  try {
    const res = await api.get('/notification/stream')
    const payload = res.data?.data || res.data || []
    if (res.status === 200 && Array.isArray(payload) && payload.length) {
      onData(payload)
    }
  } catch (e) {
    // 오류 시에도 간격을 유지하며 재시도
  } finally {
    pollTimer = setTimeout(() => poll(onData), POLL_INTERVAL)
  }
}

// 롱폴링 시작
export function initNotificationPolling(_token, onData) {
  stopNotificationPolling()
  poll(onData)
  return null
}

export function stopNotificationPolling() {
  if (pollTimer) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
}

