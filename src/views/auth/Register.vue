<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <h1 class="register-title getcha-brand-text">Getcha</h1>
          <p class="register-subtitle">회원가입하고 시작하세요</p>
        </div>

        <form @submit.prevent="handleRegister" class="register-form">
          <!-- 프로필 이미지 미리보기 -->
          <div class="form-group profile-group">
            <label>프로필 이미지</label>
            <div class="profile-preview">
              <img v-if="profileImage" :src="profileImage" alt="프로필" class="profile-img" />
              <div v-else class="profile-placeholder">이미지 없음</div>
              <p class="profile-note">관심 애니메이션을 선택하면 자동으로 설정됩니다</p>
            </div>
          </div>

          <!-- 이메일 + 이메일 인증 버튼 + 인증 코드 입력 -->
          <div class="form-group">
            <label for="email">이메일 <span class="required">*</span></label>
            <div class="email-input-group">
              <input
                id="email"
                v-model="form.email"
                type="email"
                required
                placeholder="이메일을 입력하세요"
                class="form-input"
              />
              <button
                type="button"
                @click="sendEmailVerification"
                :disabled="!form.email || sendingCode"
                class="btn-outline verify-btn"
              >
                <!-- 이메일 보냈으면 인증 코드 재발송 또는 인증 코드 확인 -->
                {{ emailSent ? '재발송' : '인증하기' }}
              </button>
            </div>
            <!-- emailSent 상태일때만 인증 코드 입력 창 활성화 -->
            <input
              v-if="emailSent"
              v-model="form.verificationCode"
              type="text"
              placeholder="인증 코드를 입력하세요"
              class="form-input verification-input"
            />
          </div>

          <!-- 비밀번호 입력 -->
          <div class="form-group">
            <label for="password">비밀번호 <span class="required">*</span></label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              placeholder="비밀번호를 입력하세요"
              class="form-input"
            />
          </div>

          <!-- 이름 입력 -->
          <div class="form-group">
            <label for="name">이름 <span class="required">*</span></label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              placeholder="이름을 입력하세요"
              class="form-input"
            />
          </div>

          <!-- 닉네임 입력 -->
          <div class="form-group">
            <label for="nickname">닉네임 <span class="required">*</span></label>
            <input
              id="nickname"
              v-model="form.nickname"
              type="text"
              required
              placeholder="닉네임을 입력하세요"
              class="form-input"
            />
          </div>

          <!-- 관심 애니메이션 검색 및 선택 -->
          <div class="form-group">
            <label>관심 애니메이션 <span class="required">*</span> (3개 필수)</label>
            <AnimeSearch
              v-model="form.favoriteAnimes"
              :max="3"
              @anime-selected="handleAnimeSelected"
            />
          </div>

          <!-- 계좌 정보 (환불용) -->
          <div class="form-row account-row">
            <div class="account-field">
              <label for="bank">계좌은행 <span class="required">*</span></label>
              <select
                id="bank"
                v-model="form.accountBank"
                class="form-input select-input"
                required
              >
                <option value="" disabled>은행을 선택하세요</option>
                <option v-for="bank in bankOptions" :key="bank" :value="bank">
                  {{ bank }}
                </option>
              </select>
              <input
                v-if="form.accountBank === '직접입력'"
                v-model="form.customBank"
                type="text"
                placeholder="은행명을 직접 입력하세요"
                class="form-input"
                required
              />
            </div>
            <div class="account-field">
              <label for="accountNumber">계좌번호 <span class="required">*</span></label>
              <input
                id="accountNumber"
                v-model="form.accountNumber"
                type="text"
                inputmode="numeric"
                required
                placeholder="숫자만 입력"
                class="form-input"
              />
            </div>
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <button
            type="submit"
            class="btn-primary register-btn"
            :disabled="loading || !emailVerified || form.favoriteAnimes.length !== 3"
          >
            {{ loading ? '가입 중...' : '회원가입' }}
          </button>
        </form>

        <div class="register-footer">
          <p>이미 계정이 있으신가요?</p>
          <router-link to="/login" class="login-link">로그인</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import AnimeSearch from '../../components/AnimeSearch.vue'
import api from '../../services/api'

const router = useRouter()
const authStore = useAuthStore()

// 회원가입 폼 데이터
const form = ref({
  nickname: '',
  name: '',
  password: '',
  email: '',
  verificationCode: '',
  favoriteAnimes: [],
  accountBank: '',
  accountNumber: '',
  customBank: ''
})

// UI 상태값
const loading = ref(false) // 회원가입 요청 중
const errorMessage = ref('') // 에러 메시지 표시용
const emailSent = ref(false) // 인증코드 이메일로 전송 여부
const emailVerified = ref(false) // 이메일 인증 완료 여부
const sendingCode = ref(false) // 인증코드 전송 중 상태인지
const profileImage = ref('') // 프로필 이미지

const bankOptions = [
  '국민은행',
  '신한은행',
  '우리은행',
  '하나은행',
  '농협은행',
  '기업은행',
  '카카오뱅크',
  '토스뱅크',
  '직접입력'
]

// 관심 애니 선택 시 프로필 이미지 채우기
function handleAnimeSelected(anime) {
  if (!profileImage.value && anime.coverImage?.large) {
    profileImage.value = anime.coverImage.large
  }
}

// 관심 애니 목록이 변하면 첫 번째 이미지로 미리보기 설정
watch(
  () => form.value.favoriteAnimes,
  (animes) => {
    if (animes.length > 0) {
      const first = animes[0]
      profileImage.value = first.coverImage?.large || first.coverImage?.medium || profileImage.value
    } else {
      profileImage.value = ''
    }
  },
  { deep: true, immediate: true }
)

// 이메일 인증 코드 발송
async function sendEmailVerification() {
  // 이미 전송 중이면 종료
  if (sendingCode.value) return
  if (!form.value.email) {
    errorMessage.value = '이메일을 입력해주세요.'
    return
  }
  sendingCode.value = true
  try {
    await api.post('/auth/send-code', { email: form.value.email })
    emailSent.value = true
    alert('인증 코드가 이메일로 전송되었습니다.')
  } catch (error) {
    errorMessage.value = error.response?.data?.message || '이메일 인증 전송에 실패했습니다.'
  } finally {
    sendingCode.value = false
  }
}

// 회원가입 처리
async function handleRegister() {
  if (!emailVerified.value) {
    errorMessage.value = '이메일 인증을 완료해주세요.'
    return
  }

  if (form.value.favoriteAnimes.length !== 3) {
    errorMessage.value = '관심 애니메이션을 3개 모두 선택해주세요.'
    return
  }

  if (!form.value.accountBank) {
    errorMessage.value = '계좌은행을 선택해주세요.'
    return
  }

  const bankName = form.value.accountBank === '직접입력'
    ? form.value.customBank.trim()
    : form.value.accountBank

  if (!bankName) {
    errorMessage.value = '계좌은행을 선택하거나 입력해주세요.'
    return
  }

  if (!form.value.accountNumber.trim()) {
    errorMessage.value = '계좌번호를 입력해주세요.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  const sanitizedAccountNumber = form.value.accountNumber.replace(/\D/g, '')
  if (!sanitizedAccountNumber) {
    errorMessage.value = '계좌번호는 숫자만 입력해주세요.'
    loading.value = false
    return
  }

  // 백엔드 DTO(SignUpRequestDto) 형식으로 변환
  const registerData = {
    nickname: form.value.nickname,
    name: form.value.name,
    email: form.value.email,
    password: form.value.password,
    likedAnimeIds: form.value.favoriteAnimes.map(anime => anime.id),
    accountNum: sanitizedAccountNumber,
    accountBank: bankName,
    profileImage: profileImage.value || (form.value.favoriteAnimes[0]?.coverImage?.large || '')
  }

  const result = await authStore.register(registerData)

  if (result.success) {
    router.push('/')
  } else {
    errorMessage.value = result.message
  }

  loading.value = false
}

// 이메일 인증코드 검증 요청
async function verifyEmailCode() {
  if (!form.value.verificationCode) {
    errorMessage.value = '인증 코드를 입력해주세요.'
    return
  }
  try {
    await api.post('/auth/verify-email', {
      email: form.value.email,
      code: form.value.verificationCode
    })
    emailVerified.value = true
    alert('이메일 인증이 완료되었습니다.')
  } catch (error) {
    emailVerified.value = false
    errorMessage.value = error.response?.data?.message || '인증 코드가 올바르지 않습니다.'
  }
}

// 코드 입력 시 서버 검증 (길이 4 이상)
watch(() => form.value.verificationCode, (code) => {
  // 코드가 입력될 때마다 서버 검증
  if (code && code.length >= 4) {
    verifyEmailCode()
  } else {
    emailVerified.value = false
  }
})
</script>

<style scoped>
.register-page {
  min-height: calc(100vh - 100px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--bg-gradient);
  position: relative;
  overflow: hidden;
}


.register-container {
  width: 100%;
  max-width: 600px;
}

.register-card {
  background: white;
  border-radius: 20px;
  padding: 48px 40px;
  box-shadow: 0 8px 32px rgba(230, 57, 70, 0.1);
}

.register-header {
  text-align: center;
  margin-bottom: 40px;
}

.register-title {
  font-size: 42px;
  font-weight: 900;
  color: var(--primary-red);
  margin-bottom: 12px;
}

.register-subtitle {
  font-size: 16px;
  color: var(--text-gray);
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dark);
}

.required {
  color: var(--primary-red);
}

.form-input {
  padding: 14px 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  font-size: 15px;
  background: #ffffff;
  transition: var(--transition);
}

.form-input:focus {
  border-color: rgba(255, 71, 87, 0.5);
  box-shadow: 0 0 0 3px rgba(255, 71, 87, 0.12);
}

.profile-group {
  align-items: center;
}

.profile-preview {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.profile-img,
.profile-placeholder {
  width: 140px;
  height: 140px;
  border-radius: 24px;
  object-fit: cover;
  border: 2px solid rgba(0, 0, 0, 0.08);
  margin-bottom: 12px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-light);
}

.profile-note {
  font-size: 12px;
  color: var(--text-light);
}

.email-input-group {
  display: flex;
  gap: 8px;
}

.email-input-group .form-input {
  flex: 1;
}

.verify-btn {
  white-space: nowrap;
  padding: 14px 20px;
}

.verification-input {
  margin-top: 8px;
}

.category-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 8px;
}

.form-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.form-row.account-row {
  display: grid;
  grid-template-columns: minmax(160px, 0.35fr) minmax(220px, 0.65fr);
  gap: 20px;
  width: 100%;
}

.account-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (max-width: 640px) {
  .form-row.account-row {
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 400;
  font-size: 14px;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
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

.register-btn {
  width: 100%;
  margin-top: 8px;
}

.register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-footer {
  margin-top: 32px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-gray);
}

.login-link {
  color: var(--primary-red);
  font-weight: 600;
  text-decoration: none;
  transition: var(--transition);
}

.login-link:hover {
  text-decoration: underline;
}
</style>

