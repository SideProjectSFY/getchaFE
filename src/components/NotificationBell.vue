<template>
  <div class="notification-container">
    <button @click="toggleNotifications" class="notification-btn">
      <svg class="bell-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
    </button>
    
    <div v-if="showNotifications" class="notification-dropdown">
      <div class="notification-header">
        <h3>알림</h3>
        <button @click="markAllAsRead" class="mark-read-btn">전체 읽음</button>
      </div>
      
      <div class="notification-list">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="['notification-item', { unread: !notification.read }]"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-content">
            <p class="notification-message">{{ notification.message }}</p>
            <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
          </div>
        </div>
        
        <div v-if="notifications.length === 0" class="empty-notifications">
          알림이 없습니다.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNotificationStore } from '../stores/notification.js'
import { formatDate } from '../utils/format.js'

const notificationStore = useNotificationStore()

const showNotifications = ref(false)

const notifications = computed(() => notificationStore.notifications)
const unreadCount = computed(() => notificationStore.unreadCount)

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
}

function handleNotificationClick(notification) {
  if (!notification.read) {
    notificationStore.markAsRead(notification.id)
  }
  
  // 알림 타입에 따라 라우팅
  if (notification.type === 'AUCTION_ENDING' || notification.type === 'BID_UPDATE') {
    // 굿즈 상세 페이지로 이동
    window.location.href = `/goods/${notification.goodsId}`
  }
  
  showNotifications.value = false
}

function markAllAsRead() {
  notificationStore.markAllAsRead()
}

function formatTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`
  
  return formatDate(dateString)
}

function handleClickOutside(event) {
  if (!event.target.closest('.notification-container')) {
    showNotifications.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  notificationStore.fetchNotifications()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.notification-container {
  position: relative;
}

.notification-btn {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dark);
  border-radius: 50%;
  width: 40px;
  height: 40px;
}

.notification-btn:hover {
  background: #F5F5F5;
  transform: scale(1.05);
}

.notification-btn:active {
  transform: scale(0.95);
}

.bell-icon {
  width: 24px;
  height: 24px;
  stroke: currentColor;
  transition: var(--transition);
}

.notification-btn:hover .bell-icon {
  stroke: var(--primary-red);
}

.notification-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--primary-red);
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}

.notification-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 360px;
  max-height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1000;
}

.notification-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-dark);
}

.mark-read-btn {
  background: none;
  border: none;
  color: var(--primary-red);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
}

.mark-read-btn:hover {
  text-decoration: underline;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: var(--transition);
}

.notification-item:hover {
  background: var(--bg-light);
}

.notification-item.unread {
  background: rgba(230, 57, 70, 0.05);
}

.notification-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification-message {
  font-size: 14px;
  color: var(--text-dark);
  line-height: 1.5;
}

.notification-time {
  font-size: 12px;
  color: var(--text-light);
}

.empty-notifications {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-light);
  font-size: 14px;
}
</style>

