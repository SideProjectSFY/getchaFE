<template>
  <div class="comment-item">
    <div class="comment-header">
      <span class="comment-author">{{ comment.authorNickname }}</span>
      <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
      <button
        v-if="isOwner"
        @click="handleDelete"
        class="delete-comment-btn"
      >
        삭제
      </button>
    </div>
    <p class="comment-content">{{ comment.content }}</p>
    
    <div v-if="comment.replies && comment.replies.length > 0" class="replies">
      <CommentItem
        v-for="reply in comment.replies"
        :key="reply.id"
        :comment="reply"
        :goods-id="goodsId"
        @delete="$emit('delete', $event)"
      />
    </div>

    <div v-if="!comment.parentId && (!comment.replies || comment.replies.length < 2)" class="comment-actions">
      <button @click="showReplyForm = !showReplyForm" class="reply-btn">
        답글
      </button>
      <div v-if="showReplyForm" class="reply-form">
        <textarea
          v-model="replyContent"
          placeholder="답글을 입력하세요..."
          class="reply-input"
          rows="2"
        ></textarea>
        <button @click="submitReply" class="btn-primary reply-submit-btn">작성</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { formatDate } from '../utils/format'
import api from '../services/api'

const props = defineProps({
  comment: {
    type: Object,
    required: true,
    default: () => ({ replies: [] })
  },
  goodsId: {
    type: [String, Number],
    required: true
  }
})

const emit = defineEmits(['reply', 'delete'])

const authStore = useAuthStore()
const showReplyForm = ref(false)
const replyContent = ref('')

const isOwner = computed(() => {
  return authStore.user && props.comment.authorId === authStore.user.id
})

async function submitReply() {
  if (!replyContent.value.trim()) return

  try {
    const response = await api.post(`/goods/${props.goodsId}/comments`, {
      content: replyContent.value,
      parentId: props.comment.id
    })
    emit('reply', props.comment.id, replyContent.value)
    showReplyForm.value = false
    replyContent.value = ''
  } catch (error) {
    alert('답글 작성에 실패했습니다.')
  }
}

async function handleDelete() {
  if (!confirm('댓글을 삭제하시겠습니까?')) return

  try {
    await api.delete(`/goods/${props.goodsId}/comments/${props.comment.id}`)
    emit('delete', props.comment.id)
  } catch (error) {
    alert('댓글 삭제에 실패했습니다.')
  }
}
</script>

<style scoped>
.comment-item {
  padding: 16px;
  background: var(--bg-light);
  border-radius: 8px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 600;
  color: var(--text-dark);
}

.comment-date {
  font-size: 12px;
  color: var(--text-light);
}

.delete-comment-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--text-light);
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
}

.comment-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-dark);
  margin-bottom: 12px;
}

.replies {
  margin-left: 32px;
  margin-top: 12px;
  padding-left: 16px;
  border-left: 2px solid var(--border-color);
}

.comment-actions {
  margin-top: 8px;
}

.reply-btn {
  background: none;
  border: none;
  color: var(--primary-red);
  font-size: 13px;
  cursor: pointer;
  font-weight: 500;
}

.reply-form {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reply-input {
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 13px;
  resize: vertical;
}

.reply-submit-btn {
  align-self: flex-end;
  padding: 6px 16px;
  font-size: 13px;
}
</style>

