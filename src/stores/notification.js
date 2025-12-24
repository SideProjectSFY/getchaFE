import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { initNotificationPolling, stopNotificationPolling } from '../services/notificationStream'
import { useAuthStore } from './auth'
import api from '../services/api'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])

  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.read).length
  })

  function addNotification(notification) {
    notifications.value.unshift(notification)
    if (notifications.value.length > 100) {
      notifications.value = notifications.value.slice(0, 100)
    }
  }

  function markAsRead(id) {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  function markAllAsRead() {
    notifications.value.forEach(n => n.read = true)
  }

  async function fetchNotifications() {
    const authStore = useAuthStore()
    const userId = authStore.user?.id
    if (!userId) {
      notifications.value = []
      return
    }

    try {
      const res = await api.get('/notification')
      const payload = res.data?.data || res.data || []
      notifications.value = (payload || []).map((notification, index) => ({
        id: notification.id ?? Date.now() + index,
        type: notification.type,
        message: notification.message,
        link: notification.link,
        goodsId: notification.goodsId,
        createdAt: notification.createdAt,
        readAt: notification.readAt,
        read: !!notification.readAt
      }))
    } catch (e) {
      notifications.value = []
    }
  }

  async function markAsReadServer(id) {
    try {
      await api.patch(`/notification/${id}`)
      markAsRead(id)
    } catch (_) {}
  }

  async function markAllAsReadServer() {
    try {
      await api.patch('/notification/read-all')
      markAllAsRead()
    } catch (_) {}
  }

  function initWebSocket() {
    const authStore = useAuthStore()
    if (!authStore.token) {
      return
    }

    // 롱폴링 스트림: 새 알림 목록을 받으면 하나씩 스토어에 추가
    initNotificationPolling(authStore.token, (incomingList) => {
      const list = Array.isArray(incomingList) ? incomingList : []
      list.forEach((data, idx) => {
        addNotification({
          id: data.id ?? Date.now() + idx,
          type: data.type,
          message: data.message,
          goodsId: data.goodsId,
          read: false,
          createdAt: data.createdAt ?? new Date().toISOString()
        })
      })
    })
  }

  function disconnectWebSocket() {
    stopNotificationPolling()
  }

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    markAsReadServer,
    markAllAsReadServer,
    fetchNotifications,
    initWebSocket,
    disconnectWebSocket
  }
})

