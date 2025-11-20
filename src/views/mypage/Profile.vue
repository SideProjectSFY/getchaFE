<template>
  <div class="profile-page">
    <h1 class="page-title">정보 수정</h1>
    
    <form @submit.prevent="handleSubmit" class="profile-form">
      <!-- 프로필 이미지 -->
      <div class="form-section">
        <label class="section-label">프로필 이미지</label>
        <div class="profile-image-section">
          <img
            :src="profileImage || user?.profileImage || '/placeholder.png'"
            :alt="form.nickname"
            class="profile-preview-img"
          />
          <p class="profile-note">관심 애니메이션을 수정하면 자동으로 변경됩니다</p>
        </div>
      </div>

      <!-- 닉네임 -->
      <div class="form-section">
        <label class="section-label">닉네임 <span class="required">*</span></label>
        <input
          v-model="form.nickname"
          type="text"
          required
          placeholder="닉네임을 입력하세요"
          class="form-input"
        />
      </div>

      <!-- 관심 애니메이션 -->
      <div class="form-section">
        <label class="section-label">관심 애니메이션 <span class="required">*</span> (3개 필수)</label>
        <AnimeSearch
          v-model="form.favoriteAnimes"
          :max="3"
          @anime-selected="handleAnimeSelected"
        />
      </div>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div class="form-actions">
        <button
          type="submit"
          class="btn-primary profile-submit-btn"
          :disabled="loading || form.favoriteAnimes.length !== 3"
        >
          {{ loading ? '수정 중...' : '수정하기' }}
        </button>
      </div>
    </form>

    <!-- 회원 탈퇴 -->
    <div class="withdraw-section">
      <h3 class="withdraw-title">회원 탈퇴</h3>
      <div class="withdraw-card">
        <p class="withdraw-description">
          탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.<br>
          경매 대기/진행 중이거나 예치금이 Lock 상태인 경우 탈퇴할 수 없습니다.
        </p>
        <button @click="handleWithdraw" class="btn-outline withdraw-btn">회원 탈퇴</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useGoodsStore } from '../../stores/goods'
import AnimeSearch from '../../components/AnimeSearch.vue'

const router = useRouter()
const authStore = useAuthStore()
const goodsStore = useGoodsStore()

const user = computed(() => authStore.user)

const loading = ref(false)
const errorMessage = ref('')
const profileImage = ref('')

const form = ref({
  nickname: '',
  favoriteAnimes: []
})

function handleAnimeSelected(anime) {
  if (!profileImage.value && anime.coverImage?.large) {
    profileImage.value = anime.coverImage.large
  }
}

watch(
  () => form.value.favoriteAnimes,
  (animes) => {
    if (animes.length > 0) {
      const first = animes[0]
      profileImage.value = first.coverImage?.large || first.coverImage?.medium || profileImage.value
    } else {
      profileImage.value = user.value?.profileImage || ''
    }
  },
  { deep: true, immediate: true }
)

async function handleSubmit() {
  if (form.value.favoriteAnimes.length !== 3) {
    errorMessage.value = '관심 애니메이션을 3개 모두 선택해주세요.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  const profileData = {
    ...form.value,
    profileImage: profileImage.value
  }

  const result = await authStore.updateProfile(profileData)

  if (result.success) {
    alert('프로필이 수정되었습니다.')
  } else {
    errorMessage.value = result.message
  }

  loading.value = false
}

async function handleWithdraw() {
  if (!confirm('정말 탈퇴하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다.')) {
    return
  }

  const result = await authStore.withdraw()
  if (result.success) {
    alert('탈퇴가 완료되었습니다.')
    router.push('/')
  } else {
    alert(result.message)
  }
}

onMounted(() => {
  if (user.value) {
    form.value = {
      nickname: user.value.nickname || '',
      favoriteAnimes: user.value.favoriteAnimes || []
    }
    profileImage.value = user.value.profileImage || ''
  }
})
</script>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.page-title {
  font-size: 28px;
  font-weight: 900;
  color: var(--text-dark);
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-label {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-dark);
}

.required {
  color: var(--primary-red);
}

.profile-image-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  border-radius: 20px;
  background: #ffffff;
}

.profile-preview-img {
  width: 140px;
  height: 140px;
  border-radius: 28px;
  object-fit: cover;
  border: 3px solid rgba(255, 71, 87, 0.25);
}

.profile-note {
  font-size: 13px;
  color: var(--text-light);
}

.form-input {
  padding: 14px 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 14px;
  font-size: 15px;
  background: #ffffff;
  transition: var(--transition);
}

.form-input:focus {
  border-color: rgba(255, 71, 87, 0.6);
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 71, 87, 0.12);
}

.error-message {
  padding: 12px;
  background: rgba(230, 57, 70, 0.1);
  color: var(--primary-red);
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.profile-submit-btn {
  background: linear-gradient(135deg, rgba(255, 71, 87, 0.18), rgba(255, 71, 87, 0.28));
  border: none;
  color: var(--primary-red);
  font-weight: 700;
  padding: 14px 32px;
  border-radius: 18px;
}

.form-actions button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.withdraw-section {
  margin-top: 8px;
}

.withdraw-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 12px;
}

.withdraw-card {
  padding: 28px;
  background: white;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: var(--card-shadow);
}

.withdraw-description {
  font-size: 14px;
  color: var(--text-gray);
  line-height: 1.7;
  margin-bottom: 20px;
}

.withdraw-btn {
  color: var(--primary-red);
  border-color: var(--primary-red);
  border-radius: 16px;
  padding: 12px 20px;
}

.withdraw-btn:hover {
  background: var(--primary-red);
  color: white;
}

:deep(.selected-list .selected-anime-item) {
  background: rgba(255, 71, 87, 0.06);
  border-color: rgba(255, 71, 87, 0.15);
}
</style>

