.input-wrapper {
  margin-top: 4px;
}
.form-row {
  display: flex;
  gap: 20px;
  flex-wrap: nowrap;
}

.flex-item {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (max-width: 640px) {
  .form-row {
    flex-direction: column;
    flex-wrap: wrap;
  }
}

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

      <!-- 기본 정보 -->
      <div class="form-section info-list">
        <div class="info-row">
          <span class="info-label">이름</span>
          <span class="info-value">{{ user?.name || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">로그인 이메일</span>
          <span class="info-value">{{ user?.email || '-' }}</span>
        </div>
      </div>

      <!-- 계좌 정보 -->
      <div class="form-section account-section">
        <label class="section-label">계좌 정보 <span class="required">*</span></label>
        <div class="account-row">
          <div class="account-field">
            <label for="profileBank">계좌은행 <span class="required">*</span></label>
            <select
              id="profileBank"
              v-model="form.accountBank"
              class="form-input select-input"
              required
            >
              <option value="" disabled>은행을 선택하세요</option>
              <option v-for="bank in bankOptions" :key="bank" :value="bank">
                {{ bank }}
              </option>
            </select>
          </div>
          <div class="account-field">
            <label for="profileAccount">계좌번호 <span class="required">*</span></label>
            <input
              id="profileAccount"
              v-model="form.accountNumber"
              type="text"
              inputmode="numeric"
              placeholder="숫자만 입력"
              class="form-input"
              required
            />
          </div>
        </div>
      </div>

      <!-- 관심 카테고리 (수정 가능) -->
      <div class="form-section">
        <label class="section-label">관심 카테고리 (선택)</label>
        <div class="category-checkboxes">
          <label
            v-for="category in categories"
            :key="category"
            class="checkbox-label"
          >
            <input
              type="checkbox"
              :value="category"
              v-model="form.favoriteCategories"
              class="checkbox-input"
            />
            <span>{{ category }}</span>
          </label>
        </div>
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
import { ref, computed, watch } from 'vue'
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
  favoriteAnimes: [],
  favoriteCategories: [],
  accountBank: '',
  accountNumber: ''
})

const categories = computed(() => goodsStore.categories.filter(c => c !== 'ALL'))
const bankOptions = [
  '국민은행',
  '신한은행',
  '우리은행',
  '하나은행',
  '농협은행',
  '기업은행',
  '카카오뱅크',
  '토스뱅크'
]

const formattedAccountNumber = computed(() => {
  const acct = user.value?.accountNumber
  if (!acct) return '-'
  if (acct.includes('-')) return acct
  if (acct.length >= 6) {
    const part1 = acct.slice(0, 3)
    const part2 = acct.slice(3, 7)
    const part3 = acct.slice(7)
    return [part1, part2, part3].filter(Boolean).join('-')
  }
  return acct
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

  if (!form.value.accountBank) {
    errorMessage.value = '계좌은행을 선택해주세요.'
    return
  }

  if (!form.value.accountNumber.trim()) {
    errorMessage.value = '계좌번호를 입력해주세요.'
    return
  }

  const sanitizedAccountNumber = form.value.accountNumber.replace(/\D/g, '')
  if (!sanitizedAccountNumber) {
    errorMessage.value = '계좌번호는 숫자만 입력해주세요.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  const profileData = {
    ...form.value,
    accountNumber: sanitizedAccountNumber,
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

watch(
  user,
  (newUser) => {
    if (!newUser) return
    form.value.nickname = newUser.nickname || ''
    form.value.favoriteAnimes = newUser.favoriteAnimes ? [...newUser.favoriteAnimes] : []
    form.value.favoriteCategories = newUser.favoriteCategories ? [...newUser.favoriteCategories] : []
    form.value.accountBank = newUser.accountBank || ''
    form.value.accountNumber = newUser.accountNumber || ''
    profileImage.value = newUser.profileImage || ''
  },
  { immediate: true }
)
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

.form-input:disabled {
  background: #f7f7f7;
  color: var(--text-gray);
  cursor: not-allowed;
  border-style: dashed;
}

.form-input:focus {
  border-color: rgba(255, 71, 87, 0.6);
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 71, 87, 0.12);
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #fff;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding-bottom: 10px;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.08);
}

.info-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-gray);
}

.info-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-dark);
  text-align: right;
}

.account-row {
  display: grid;
  grid-template-columns: minmax(160px, 0.35fr) minmax(220px, 0.65fr);
  gap: 20px;
  width: 100%;
  align-items: start;
}

.account-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (max-width: 640px) {
  .account-row {
    grid-template-columns: 1fr;
  }
}

.select-input {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 10px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #fff;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding-bottom: 10px;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.08);
}

.info-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-gray);
}

.info-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-dark);
  text-align: right;
}

.category-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  background: #fff;
  transition: var(--transition);
}

.checkbox-label:hover {
  border-color: rgba(255, 71, 87, 0.4);
}

.checkbox-input {
  width: 16px;
  height: 16px;
  accent-color: var(--primary-red);
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

