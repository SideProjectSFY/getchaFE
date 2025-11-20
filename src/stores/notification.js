import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { initSocket, getSocket, disconnectSocket } from '../services/websocket'
import { useAuthStore } from './auth'
import { getUserById } from '../data/mockUsers'

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

    // 실제 API 호출로 대체 가능, 현재는 목 데이터 사용
    const mockUser = getUserById(userId)
    if (mockUser?.notifications) {
      notifications.value = mockUser.notifications.map((notification, index) => ({
        id: notification.id ?? Date.now() + index,
        ...notification
      }))
    } else {
      notifications.value = []
    }
  }

  function initWebSocket() {
    const authStore = useAuthStore()
    if (authStore.token) {
      const socket = initSocket(authStore.token)
      
      socket.on('notification', (data) => {
        addNotification({
          id: Date.now(),
          type: data.type,
          message: data.message,
          goodsId: data.goodsId,
          read: false,
          createdAt: new Date().toISOString()
        })
      })
    }
  }

  function disconnectWebSocket() {
    disconnectSocket()
  }

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    initWebSocket,
    disconnectWebSocket
  }
})

