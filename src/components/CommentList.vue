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
import { extractArrayResponse } from '../utils/responseApi'

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

/**
 * 현재 사용자의 인증 상태
 * @type {import('vue').ComputedRef<boolean>}
 */
const isAuthenticated = computed(() => authStore.isAuthenticated)

// 댓글 목록
const comments = ref([])
// 새 댓글 작성 내용
const newComment = ref('')

/**
 * 서버에서 댓글 목록을 가져오는 함수
 * extractArrayResponse 유틸리티를 사용하여 백엔드 응답 구조에서 배열 데이터 추출
 */
async function fetchComments() {
  try {
    const response = await api.get(`/comment?goodsId=${props.goodsId}`)
    comments.value = extractArrayResponse(response)
  } catch (error) {
    console.error('댓글 로딩 실패:', error)
    comments.value = []
  }
}

/**
 * 새 댓글 작성 처리 함수
 * 백엔드에 댓글 등록 요청 후, 성공 시 댓글 목록을 새로고침하여 전체 댓글 구조 유지
 * 실패 시 상태 코드에 따른 에러 메시지 표시
 */
async function submitComment() {
  if (!newComment.value.trim()) return

  try {
    // 백엔드 응답 구조: { status, message, data: { commentId, parentId } }
    // 응답 데이터는 사용하지 않음 (댓글 목록 새로고침으로 처리)
    await api.post('/comment', {
      goodsId: props.goodsId,
      content: newComment.value
    })
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

/**
 * 대댓글 작성 완료 후 호출되는 핸들러
 * CommentItem에서 emit된 'reply' 이벤트를 받아 댓글 목록을 새로고침
 * @param {number} parentId - 부모 댓글 ID
 * @param {string} content - 대댓글 내용 (현재 사용하지 않음)
 */
function handleReply(parentId, content) {
  // 대댓글 추가 후 댓글 목록 새로고침
  fetchComments()
}

/**
 * 댓글 삭제 완료 후 호출되는 핸들러
 * CommentItem에서 emit된 'delete' 이벤트를 받아 댓글 목록을 새로고침
 * soft delete, hard delete 상태를 반영하기 위해 목록 새로고침 필요
 * @param {number} commentId - 삭제된 댓글 ID
 */
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

