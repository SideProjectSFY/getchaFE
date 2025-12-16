<template>
  <div class="comment-list">
    <div v-if="isAuthenticated" class="comment-form">
      <textarea
        v-model="newComment"
        placeholder="댓글을 입력하세요..."
        class="comment-input"
        rows="3"
      ></textarea>
      <button @click="submitComment" class="submit-btn">댓글 작성</button>
    </div>

    <div v-if="comments.length > 0" class="comments">
      <CommentItem
        v-for="comment in comments"
        :key="comment.commentId"
        :comment="comment"
        :goods-id="goodsId"
        :seller-id="sellerId"
        @reply="handleReply"
        @delete="handleDelete"
      />
    </div>
    <div v-else class="empty-comments">
      댓글이 없습니다.
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import CommentItem from './CommentItem.vue'
import api from '../services/api'

const props = defineProps({
  goodsId: {
    type: [String, Number],
    required: true
  },
  sellerId: {
    type: [String, Number],
    default: null
  }
})

const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)

const comments = ref([])
const newComment = ref('')

async function fetchComments() {
  try {
    const response = await api.get(`/comment?goodsId=${props.goodsId}`)
    comments.value = response.data.data || []
  } catch (error) {
    console.error('댓글 로딩 실패:', error)
    comments.value = []
  }
}

async function submitComment() {
  if (!newComment.value.trim()) return

  try {
    const response = await api.post('/comment', {
      goodsId: props.goodsId,
      content: newComment.value
    })
    // 백엔드 응답 구조: { status, message, data: { commentId, parentId } }
    const responseData = response.data.data || response.data
    // 댓글 목록 새로고침하여 전체 댓글 구조 유지
    await fetchComments()
    newComment.value = ''
  } catch (error) {
    if (error.response?.status === 404) {
      alert('존재하지 않는 굿즈 글입니다.')
    } else if (error.response?.status === 500) {
      alert('댓글 등록에 실패하였습니다.')
    } else {
      alert('댓글 작성에 실패했습니다.')
    }
  }
}

function handleReply(parentId, content) {
  // 대댓글 추가 로직
  fetchComments()
}

async function handleDelete(commentId) {
  // 삭제 후 댓글 목록 새로고침 (soft delete, hard delete 상태 반영)
  await fetchComments()
}

onMounted(() => {
  fetchComments()
})
</script>

<style scoped>
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.comment-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-input {
  padding: 12px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  transition: var(--transition);
}

.comment-input:focus {
  border-color: var(--primary-red);
  outline: none;
}

.submit-btn {
  align-self: flex-end;
  padding: 10px 28px;
  border-radius: 12px;
  border: 1.5px solid var(--primary-red);
  background: #fff;
  color: var(--primary-red);
  font-weight: 700;
  transition: var(--transition);
  box-shadow: none;
}

.submit-btn:hover {
  background: rgba(220, 20, 60, 0.05);
}

.comments {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-comments {
  text-align: center;
  padding: 40px;
  color: var(--text-light);
  font-size: 14px;
}
</style>

