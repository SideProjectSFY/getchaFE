<template>
  <div class="goods-register-page">
    <div class="container">
      <h1 class="page-title">굿즈 등록</h1>

      <form @submit.prevent="handleSubmit" class="register-form">
        <!-- 경매 글 제목 -->
        <div class="form-section">
          <label class="section-label">제목 <span class="required">*</span></label>
          <input
            v-model="form.title"
            type="text"
            placeholder="예: 주술회전 고죠 사토루 프리미엄 피규어"
            class="form-input"
            required
          />
        </div>

        <!-- 이미지 업로드 -->
        <div class="form-section">
          <label class="section-label">사진 등록 <span class="required">*</span></label>
          <div class="image-upload-area">
            <div class="main-image-panel" :class="{ empty: !currentMainImage }">
              <template v-if="currentMainImage">
                <img :src="currentMainImage.preview" alt="선택된 이미지" class="main-image" />
                <button
                  type="button"
                  @click="removeImage(safeMainIndex)"
                  class="remove-image-btn"
                >
                  ×
                </button>
              </template>
              <template v-else>
                <div class="main-placeholder">
                  <p>이미지를 업로드하면 크게 미리보기로 보여집니다.</p>
                  <span>최대 5장의 이미지를 등록할 수 있어요.</span>
                </div>
              </template>
            </div>
            <div class="upload-row">
              <label v-if="form.images.length < 5" class="upload-btn large-upload">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  @change="handleImageUpload"
                  class="file-input"
                />
                <span>+ 이미지 추가</span>
              </label>
              <div class="thumbnail-strip" v-if="form.images.length">
                <button
                  v-for="(image, index) in form.images"
                  :key="`thumb-${index}`"
                  type="button"
                  class="thumbnail-button"
                  :class="{ active: index === safeMainIndex }"
                  @click="selectMainImage(index)"
                >
                  <img :src="image.preview" :alt="`이미지 ${index + 1}`" />
                  <span class="thumb-remove" @click.stop="removeImage(index)">×</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 애니메이션 검색 -->
        <div class="form-section">
          <label class="section-label">애니메이션 <span class="required">*</span></label>
          <AnimeSearch
            v-model="selectedAnime"
            :max="1"
            @anime-selected="handleAnimeSelected"
          />
        </div>

        <!-- 굿즈 종류 -->
        <div class="form-section">
          <label class="section-label">굿즈 종류 <span class="required">*</span></label>
          <select v-model="form.category" class="form-select" required>
            <option value="">선택하세요</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <!-- 상품 설명 -->
        <div class="form-section">
          <label class="section-label">상품 설명 <span class="required">*</span></label>
          <textarea
            v-model="form.description"
            placeholder="상품에 대한 상세 설명을 입력하세요"
            rows="8"
            class="form-textarea"
            required
          ></textarea>
        </div>

        <!-- 경매 조건 -->
        <div class="form-section">
          <label class="section-label">경매 조건</label>
          <div class="auction-conditions">
            <div class="condition-item">
              <label>시작가 (골드) <span class="required">*</span></label>
              <input
                v-model.number="form.startPrice"
                type="number"
                min="1"
                max="5000000"
                placeholder="시작가를 입력하세요"
                class="form-input"
                required
              />
            </div>
            <div class="condition-item">
              <label>상한가/즉시구매가 (골드) (선택)</label>
              <input
                v-model.number="form.maxPrice"
                type="number"
                min="1"
                max="5000000"
                placeholder="즉시구매가를 입력하세요"
                class="form-input"
              />
            </div>
            <div class="condition-item">
              <label>경매 기간 (일) <span class="required">*</span></label>
              <input
                v-model.number="form.duration"
                type="number"
                min="2"
                max="14"
                placeholder="3"
                class="form-input"
                required
              />
              <span class="input-note">2일 ~ 14일 (기본값: 3일)</span>
            </div>
          </div>
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div class="form-actions">
          <router-link to="/goods" class="btn-outline">취소</router-link>
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? '등록 중...' : '등록하기' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGoodsStore } from '../../stores/goods'
import AnimeSearch from '../../components/AnimeSearch.vue'
import { readFilesAsDataURL, validateFileSizes } from '../../utils/imageFile'

const router = useRouter()
const goodsStore = useGoodsStore()

/**
 * 'ALL' 카테고리를 제외한 카테고리 목록을 반환하는 computed 속성
 */
const categories = computed(() => goodsStore.categories.filter(c => c !== 'ALL'))

const loading = ref(false)
const errorMessage = ref('')
const selectedAnime = ref([])

const mainImageIndex = ref(-1)

const form = ref({
  title: '',
  images: [],
  animeId: null,
  animeTitle: '',
  category: '',
  description: '',
  startPrice: null,
  maxPrice: null,
  duration: 3
})

/**
 * 안전한 메인 이미지 인덱스를 반환하는 computed 속성
 * 인덱스가 유효하지 않으면 마지막 이미지 인덱스를 반환
 */
const safeMainIndex = computed(() => {
  if (!form.value.images.length) return -1
  if (mainImageIndex.value >= 0 && mainImageIndex.value < form.value.images.length) {
    return mainImageIndex.value
  }
  return form.value.images.length - 1
})

/**
 * 현재 선택된 메인 이미지를 반환하는 computed 속성
 */
const currentMainImage = computed(() => {
  const idx = safeMainIndex.value
  return idx >= 0 ? form.value.images[idx] : null
})

/**
 * safeMainIndex 변경을 감지하여 mainImageIndex를 동기화하는 watcher
 */
watch(
  safeMainIndex,
  (idx) => {
    if (idx !== mainImageIndex.value) {
      mainImageIndex.value = idx
    }
  }
)

/**
 * 이미지 파일 업로드 처리 함수
 * 최대 5장까지 업로드 가능하며, readFilesAsDataURL을 사용하여 미리보기 생성
 * 업로드된 이미지는 form.value.images에 추가되고 메인 이미지로 설정
 * 파일당 최대 10MB, 여러 파일 업로드 시 전체 합계 최대 20MB 제한
 */
async function handleImageUpload(event) {
  const files = Array.from(event.target.files)
  const remainingSlots = 5 - form.value.images.length
  const filesToAdd = files.slice(0, remainingSlots)
  
  if (filesToAdd.length === 0) return

  // 파일 크기 검증 (파일당 10MB, 전체 합계 20MB)
  const MAX_SIZE_PER_FILE = 10 * 1024 * 1024 // 10MB
  const MAX_TOTAL_SIZE = filesToAdd.length > 1 ? 20 * 1024 * 1024 : null // 여러 파일일 때만 전체 합계 제한
  
  const validation = validateFileSizes(filesToAdd, MAX_SIZE_PER_FILE, MAX_TOTAL_SIZE)
  if (!validation.valid) {
    errorMessage.value = validation.message || '파일 크기가 너무 큽니다.'
    return
  }

  // 공통 로직 활용: readFilesAsDataURL 사용
  try {
    const newImagePreviews = await readFilesAsDataURL(filesToAdd)
    form.value.images.push(...newImagePreviews)
    mainImageIndex.value = form.value.images.length - 1
    errorMessage.value = '' // 성공 시 에러 메시지 초기화
  } catch (error) {
    errorMessage.value = '이미지 파일을 읽는 중 오류가 발생했습니다.'
  }
}

/**
 * 이미지를 제거하는 함수
 * form.value.images에서 해당 인덱스의 이미지를 삭제하고 메인 이미지 인덱스 조정
 */
function removeImage(index) {
  form.value.images.splice(index, 1)
  if (form.value.images.length === 0) {
    mainImageIndex.value = -1
  } else if (index === mainImageIndex.value) {
    mainImageIndex.value = Math.min(index, form.value.images.length - 1)
  } else if (index < mainImageIndex.value) {
    mainImageIndex.value -= 1
  }
}

/**
 * 메인 이미지를 선택하는 함수
 * 선택된 인덱스를 mainImageIndex에 저장
 */
function selectMainImage(index) {
  mainImageIndex.value = index
}

/**
 * 애니메이션 선택 핸들러
 * 선택된 애니메이션의 ID와 제목을 폼에 저장
 */
function handleAnimeSelected(anime) {
  form.value.animeId = anime.id
  form.value.animeTitle = anime.title.romaji || anime.title.english
}

/**
 * 폼 제출 처리 함수
 * 입력값 유효성 검사 후, goodsStore.registerGoods를 호출하여 서버에 등록 요청
 * 성공 시 굿즈 상세 페이지로 이동
 */
async function handleSubmit() {
  // 기본적인 UI 레벨 검증 (빠른 피드백 제공)
  if (!form.value.title.trim()) {
    errorMessage.value = '경매 글 제목을 입력해주세요.'
    return
  }

  if (form.value.images.length === 0) {
    errorMessage.value = '이미지를 최소 1개 이상 업로드해주세요.'
    return
  }

  if (!form.value.animeId) {
    errorMessage.value = '애니메이션을 선택해주세요.'
    return
  }

  if (!form.value.category) {
    errorMessage.value = '굿즈 종류를 선택해주세요.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  // 서비스 레이어로 데이터 전달 (금액 검증 등은 서비스 레이어에서 처리)
  const goodsData = {
    ...form.value,
    title: form.value.title.trim(),
    images: form.value.images.map(img => img.file),
    // maxPrice 필드를 그대로 전달 (서비스 레이어에서 instantBuyPrice로 변환)
    maxPrice: form.value.maxPrice || null
  }

  const result = await goodsStore.registerGoods(goodsData)

  if (result.success) {
    alert('굿즈가 등록되었습니다.')
    // 응답에서 goodsId를 받아서 상세 페이지로 이동
    router.push({ path: '/goods', query: { goodsId: result.data?.goodsId } })
  } else {
    errorMessage.value = result.message || '굿즈 등록에 실패했습니다.'
  }

  loading.value = false
}
</script>

<style scoped>
.goods-register-page {
  padding: 40px 0;
  min-height: calc(100vh - 80px);
}

.page-title {
  font-size: 36px;
  font-weight: 900;
  color: var(--text-dark);
  margin-bottom: 40px;
  text-align: center;
}

.register-form {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: var(--card-shadow);
}

.form-section {
  margin-bottom: 32px;
}

.section-label {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 12px;
}

.required {
  color: var(--primary-red);
}

.image-upload-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.main-image-panel {
  position: relative;
  width: 100%;
  padding-top: 58%;
  border-radius: 24px;
  overflow: hidden;
  border: 2px solid rgba(0, 0, 0, 0.06);
  background: #f9f9f9;
}

.main-image-panel.empty {
  border-style: dashed;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 0;
  min-height: 320px;
}

.main-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.main-placeholder {
  text-align: center;
  color: var(--text-light);
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
}

.upload-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.thumbnail-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.thumbnail-button {
  position: relative;
  width: 70px;
  height: 70px;
  border-radius: 14px;
  overflow: hidden;
  border: 2px solid transparent;
  padding: 0;
  background: transparent;
  cursor: pointer;
  transition: var(--transition);
}

.thumbnail-button img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumbnail-button.active {
  border-color: var(--primary-red);
  box-shadow: 0 6px 16px rgba(255, 71, 87, 0.25);
}

.thumb-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
}

.remove-image-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.remove-image-btn:hover,
.thumb-remove:hover {
  background: rgba(220, 20, 60, 0.85);
}

.upload-btn {
  border: 2px dashed var(--border-color);
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
  background: #fff;
  padding: 16px 24px;
  font-weight: 700;
  color: var(--primary-red);
}

.large-upload {
  align-self: flex-start;
}

.upload-btn:hover {
  border-color: var(--primary-red);
  background: rgba(255, 71, 87, 0.08);
}

.file-input {
  display: none;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  font-size: 15px;
  transition: var(--transition);
  font-family: inherit;
  background: #fff;
}

.form-select {
  height: 48px;
  padding-right: 44px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 18px center;
  background-size: 12px;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: var(--primary-red);
  outline: none;
  box-shadow: 0 0 0 3px rgba(230, 57, 70, 0.1);
}

.form-textarea {
  resize: vertical;
}

.auction-conditions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.condition-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.condition-item label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dark);
}

.input-note {
  font-size: 12px;
  color: var(--text-light);
}

.error-message {
  padding: 12px;
  background: rgba(230, 57, 70, 0.1);
  color: var(--primary-red);
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
  margin-bottom: 24px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.form-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

