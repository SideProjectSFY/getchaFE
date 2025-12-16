<template>
  <div class="comment-item">
    <div class="comment-header">
      <div class="author-info">
        <img 
          v-if="comment.writerProfileFilePath" 
          :src="getImageUrl(comment.writerProfileFilePath)" 
          :alt="comment.writerNickName"
          class="writer-profile-image"
        />
        <span class="comment-author">{{ comment.writerNickName }}</span>
        <span v-if="isSeller" class="seller-badge">판매자</span>
      </div>
      <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
      <div v-if="isOwner && !isDeleted" class="comment-actions-header">
        <button
          @click="handleEdit"
          class="edit-comment-btn"
        >
          수정
        </button>
        <button
          @click="handleDelete"
          class="delete-comment-btn"
        >
          삭제
        </button>
      </div>
      <!-- <button
        v-else-if="isOwner"
        @click="handleDelete"
        class="delete-comment-btn"
      >
        삭제
      </button> -->
    </div>
    <div v-if="!isEditing" class="comment-content-wrapper">
      <p class="comment-content">{{ comment.content }}</p>
    </div>
    <div v-else class="edit-form">
      <textarea
        v-model="editContent"
        class="edit-input"
        rows="3"
      ></textarea>
      <div class="edit-actions">
        <button @click="saveEdit" class="save-edit-btn">저장</button>
        <button @click="cancelEdit" class="cancel-edit-btn">취소</button>
      </div>
    </div>
    
    <div v-if="comment.replyList && comment.replyList.length > 0" class="replies">
      <CommentItem
        v-for="reply in visibleReplies"
        :key="reply.commentId"
        :comment="reply"
        :goods-id="goodsId"
        :seller-id="sellerId"
        @delete="$emit('delete', $event)"
      />
      <button
        v-if="hasMoreReplies"
        @click="showAllReplies = true"
        class="show-more-replies-btn"
      >
        답글 더보기 ({{ comment.replyList.length }}개)
      </button>
    </div>

    <div v-if="!comment.parentId" class="comment-actions">
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
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { formatDate } from '../utils/format'
import { getImageUrl } from '../utils/image'
import api from '../services/api'

const props = defineProps({
  comment: {
    type: Object,
    required: true,
    default: () => ({ replyList: [] })
  },
  goodsId: {
    type: [String, Number],
    required: true
  },
  sellerId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['reply', 'delete'])

const authStore = useAuthStore()
const showReplyForm = ref(false)
const replyContent = ref('')
const isEditing = ref(false)
const editContent = ref('')
const showAllReplies = ref(false)

const isOwner = computed(() => {
  return authStore.user && props.comment.writerId === authStore.user.id
})

const isSeller = computed(() => {
  return props.sellerId && props.comment.writerId === props.sellerId
})

// 삭제된 댓글인지 확인 (soft delete: 대댓글이 있는 상태에서 삭제된 경우)
const isDeleted = computed(() => {
  return props.comment.content === '(삭제된 댓글입니다.)' && 
         props.comment.replyList && 
         props.comment.replyList.length > 0
})

const hasMoreReplies = computed(() => {
  return props.comment.replyList && props.comment.replyList.length >= 5 && !showAllReplies.value
})

const visibleReplies = computed(() => {
  if (!props.comment.replyList) return []
  // 5개 미만이면 모두 보여줌
  if (props.comment.replyList.length < 5) {
    return props.comment.replyList
  }
  // 5개 이상이면 "더보기" 클릭 시에만 보여줌
  if (showAllReplies.value) {
    return props.comment.replyList
  }
  // 기본 상태(5개 이상이고 더보기 안 눌림): 아무것도 안 보여줌
  return []
})

// 대댓글이 추가되어 5개 이상이 되면 자동으로 "더보기" 상태 활성화
watch(
  () => props.comment.replyList?.length,
  (newLength, oldLength) => {
    // 대댓글이 추가되었고 5개 이상이 되면 자동으로 활성화
    if (newLength && oldLength && newLength > oldLength && newLength >= 5) {
      showAllReplies.value = true
    }
  }
)

async function submitReply() {
  if (!replyContent.value.trim()) return

  try {
    const response = await api.post('/comment', {
      goodsId: props.goodsId,
      parentId: props.comment.commentId,
      content: replyContent.value
    })
    // 백엔드 응답 구조: { status, message, data: { commentId, parentId } }
    emit('reply', props.comment.commentId, replyContent.value)
    showReplyForm.value = false
    replyContent.value = ''
  } catch (error) {
    if (error.response?.status === 404) {
      const errorMessage = error.response?.data?.message || ''
      if (errorMessage.includes('굿즈')) {
        alert('존재하지 않는 굿즈 글입니다.')
      } else if (errorMessage.includes('부모')) {
        alert('부모 댓글이 존재하지 않습니다.')
      } else {
        alert('존재하지 않는 굿즈 글입니다.')
      }
    } else if (error.response?.status === 500) {
      alert('대댓글 등록에 실패하였습니다.')
    } else {
      alert('답글 작성에 실패했습니다.')
    }
  }
}

function handleEdit() {
  editContent.value = props.comment.content
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
  editContent.value = ''
}

async function saveEdit() {
  if (!editContent.value.trim()) {
    alert('댓글 내용을 입력해주세요.')
    return
  }

  try {
    await api.put('/comment', {
      content: editContent.value,
      commentId: props.comment.commentId
    })
    props.comment.content = editContent.value
    isEditing.value = false
    editContent.value = ''
  } catch (error) {
    if (error.response?.status === 403) {
      alert('수정 권한이 없습니다.')
    } else if (error.response?.status === 404) {
      alert('존재하지 않는 댓글입니다.')
    } else if (error.response?.status === 500) {
      alert('댓글 or 대댓글 수정에 실패하였습니다.')
    } else {
      alert('댓글 수정에 실패했습니다.')
    }
  }
}

async function handleDelete() {
  if (!confirm('댓글을 삭제하시겠습니까?')) return

  try {
    const response = await api.delete(`/comment?commentId=${props.comment.commentId}`)
    // 백엔드 응답 구조: { status, message, data: { softDeletedId, hardDeletedIds } }
    // 응답 데이터는 사용하지 않음 (삭제 성공 후 목록 새로고침으로 처리)
    emit('delete', props.comment.commentId)
  } catch (error) {
    if (error.response?.status === 403) {
      alert('삭제 권한이 없습니다.')
    } else if (error.response?.status === 404) {
      alert('존재하지 않는 댓글입니다.')
    } else if (error.response?.status === 500) {
      alert('댓글 or 대댓글 삭제에 실패하였습니다.')
    } else {
      alert('댓글 삭제에 실패했습니다.')
    }
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

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.writer-profile-image {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-color);
  flex-shrink: 0;
}

.comment-author {
  font-weight: 600;
  color: var(--text-dark);
  font-size: 14px;
}

.seller-badge {
  display: inline-block;
  padding: 2px 8px;
  background: var(--primary-red);
  color: white;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
}

.comment-actions-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.comment-date {
  font-size: 12px;
  color: var(--text-light);
}

.edit-comment-btn,
.delete-comment-btn {
  background: none;
  border: none;
  color: var(--text-light);
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.edit-comment-btn:hover,
.delete-comment-btn:hover {
  color: var(--primary-red);
}

.comment-content-wrapper {
  margin-bottom: 12px;
}

.comment-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-dark);
}

.edit-form {
  margin-bottom: 12px;
}

.edit-input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
  margin-bottom: 8px;
}

.edit-input:focus {
  border-color: var(--primary-red);
  outline: none;
}

.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.save-edit-btn,
.cancel-edit-btn {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: var(--transition);
}

.save-edit-btn {
  background: var(--primary-red);
  color: white;
}

.save-edit-btn:hover {
  background: rgba(220, 20, 60, 0.9);
}

.cancel-edit-btn {
  background: var(--bg-light);
  color: var(--text-gray);
  border: 1px solid var(--border-color);
}

.cancel-edit-btn:hover {
  background: var(--border-color);
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

.show-more-replies-btn {
  margin-top: 8px;
  background: none;
  border: none;
  color: var(--primary-red);
  font-size: 13px;
  cursor: pointer;
  font-weight: 500;
  padding: 0;
  text-align: left;
}

.show-more-replies-btn:hover {
  text-decoration: underline;
}
</style>

