<template>
  <div class="goods-edit-page">
    <div class="container">
      <h1 class="page-title title-heading">굿즈 수정</h1>

      <div v-if="loading" class="loading">로딩 중...</div>
      <form v-else @submit.prevent="handleSubmit" class="edit-form">
        <!-- 제목 -->
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

        <!-- 이미지 업로드 (등록 폼과 동일 구조) -->
        <div class="form-section">
          <label class="section-label">사진 등록 <span class="required">*</span></label>
          <div class="image-upload-area">
            <div class="main-image-panel" :class="{ empty: !currentMainImage }">
              <template v-if="currentMainImage">
                <img :src="currentMainImage.url" alt="선택된 이미지" class="main-image" />
                <button
                  type="button"
                  class="remove-image-btn"
                  @click="removeByMainIndex"
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
              <label v-if="allImages.length < 5" class="upload-btn large-upload">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  @change="handleImageUpload"
                  class="file-input"
                />
                <span>+ 이미지 추가</span>
              </label>

              <div class="thumbnail-strip" v-if="allImages.length">
                <button
                  v-for="(thumb, index) in allImages"
                  :key="`thumb-${index}`"
                  type="button"
                  class="thumbnail-button"
                  :class="{ active: index === safeMainIndex }"
                  @click="selectMainImage(index)"
                >
                  <img :src="thumb.url" :alt="`이미지 ${index + 1}`" />
                  <span class="thumb-remove" @click.stop="removeByIndex(index)">×</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 애니메이션 선택 -->
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
              <label>경매 기간 (일)</label>
              <input
                v-model.number="form.duration"
                type="number"
                min="2"
                max="14"
                class="form-input"
              />
              <span class="input-note">2일 ~ 14일 </span>
            </div>
          </div>
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div class="form-actions">
          <router-link to="/goods" class="btn-outline">취소</router-link>
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? '수정 중...' : '수정하기' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGoodsStore } from '../../stores/goods'
import AnimeSearch from '../../components/AnimeSearch.vue'
import { readFilesAsDataURL, validateFileSizes } from '../../utils/imageFile'
import { CATEGORY_REVERSE_MAP } from '../../utils/category'

const route = useRoute()
const router = useRouter()
const goodsStore = useGoodsStore()

/**
 * 'ALL' 카테고리를 제외한 카테고리 목록을 반환하는 computed 속성
 */
const categories = computed(() => goodsStore.categories.filter(c => c !== 'ALL'))

const loading = ref(true)
const errorMessage = ref('')
const goods = ref(null)
// existingImages: [{ imageId, filePath, sortOrder }, ...] 형태로 저장
const existingImages = ref([])
// 원본 이미지 정보 (삭제 추적용)
const originalImageList = ref([])
const mainImageIndex = ref(-1)
const selectedAnime = ref([])

const form = ref({
  title: '',
  images: [],
  animeId: null,
  animeTitle: '',
  category: '',
  description: '',
  startPrice: null,
  maxPrice: null,
  duration: null
})

/**
 * 기존 이미지와 새로 업로드한 이미지를 합친 전체 이미지 목록을 반환하는 computed 속성
 * 각 이미지는 type('existing' 또는 'new')과 url을 포함
 */
const allImages = computed(() => [
  ...existingImages.value.map(img => ({ type: 'existing', url: img.filePath || img.url, imageId: img.imageId })),
  ...form.value.images.map(img => ({ type: 'new', url: img.preview }))
])

/**
 * 안전한 메인 이미지 인덱스를 반환하는 computed 속성
 * 인덱스가 유효하지 않으면 마지막 이미지 인덱스를 반환
 */
const safeMainIndex = computed(() => {
  if (!allImages.value.length) return -1
  if (mainImageIndex.value >= 0 && mainImageIndex.value < allImages.value.length) {
    return mainImageIndex.value
  }
  return allImages.value.length - 1
})

/**
 * 현재 선택된 메인 이미지를 반환하는 computed 속성
 */
const currentMainImage = computed(() => {
  const idx = safeMainIndex.value
  return idx >= 0 ? allImages.value[idx] : null
})

/**
 * 서버에서 굿즈 상세 정보를 가져와서 폼에 채우는 함수
 * 이미지 정보를 existingImages와 originalImageList에 초기화
 * 카테고리를 한글로 변환하고 폼 데이터를 설정
 */
async function fetchGoods() {
  loading.value = true
  const result = await goodsStore.fetchGoodsDetail(route.params.id)

  if (result.success && goodsStore.currentGoods) {
    goods.value = goodsStore.currentGoods
  } else {
    errorMessage.value = result.message || '굿즈 정보를 불러오는데 실패했습니다.'
    loading.value = false
    return
  }

  // imageListInfo를 사용하여 existingImages 초기화 (imageId, sortOrder 포함)
  if (goods.value.imageListInfo && Array.isArray(goods.value.imageListInfo)) {
    existingImages.value = goods.value.imageListInfo.map(img => ({
      imageId: img.imageId,
      filePath: img.filePath,
      sortOrder: img.sortOrder || 0
    }))
    originalImageList.value = [...goods.value.imageListInfo]
  } else {
    // 하위 호환성: imageListInfo가 없으면 기존 방식 사용
    existingImages.value = (goods.value.images || []).map((url, index) => ({
      imageId: null, // imageId가 없는 경우
      filePath: url,
      sortOrder: index
    }))
    originalImageList.value = [...existingImages.value]
  }

  // 카테고리가 영어로 들어오면 한글로 변환
  const categoryValue = goods.value.category || ''
  const categoryDisplay = CATEGORY_REVERSE_MAP[categoryValue] || categoryValue

  // instantBuyPrice가 null이 아니고 값이 있으면 maxPrice로 설정
  const instantBuyPrice = goods.value.instantBuyPrice !== null && goods.value.instantBuyPrice !== undefined 
    ? goods.value.instantBuyPrice 
    : null

  form.value = {
    title: goods.value.title || '',
    images: [],
    animeId: goods.value.animeId || null,
    animeTitle: goods.value.animeTitle || '',
    category: categoryDisplay,
    description: goods.value.description || '',
    startPrice: goods.value.startPrice || 0,
    maxPrice: instantBuyPrice || goods.value.maxPrice || null,
    duration: goods.value.duration || null
  }
  selectedAnime.value = [
    {
      id: goods.value.animeId || 0,
      title: { romaji: goods.value.animeTitle, english: goods.value.animeTitle },
      coverImage: { medium: goods.value.animePosterUrl || '/placeholder.png' }
    }
  ]

  loading.value = false
}

/**
 * 이미지 파일 업로드 처리 함수
 * 최대 5장까지 업로드 가능하며, readFilesAsDataURL을 사용하여 미리보기 생성
 * 업로드된 이미지는 form.value.images에 추가됨
 * 파일당 최대 10MB, 여러 파일 업로드 시 전체 합계 최대 20MB 제한
 */
async function handleImageUpload(event) {
  const files = Array.from(event.target.files)
  const remainingSlots = 5 - (existingImages.value.length + form.value.images.length)
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
    mainImageIndex.value = allImages.value.length - 1
    errorMessage.value = '' // 성공 시 에러 메시지 초기화
  } catch (error) {
    errorMessage.value = '이미지 파일을 읽는 중 오류가 발생했습니다.'
  }
}

/**
 * 새로 업로드한 이미지를 제거하는 함수
 * form.value.images에서 해당 인덱스의 이미지를 삭제하고 메인 이미지 인덱스 조정
 */
function removeImage(index) {
  form.value.images.splice(index, 1)
  adjustMainAfterRemove(existingImages.value.length + index)
}

/**
 * 기존 이미지를 제거하는 함수
 * existingImages에서 해당 인덱스의 이미지를 삭제하고 메인 이미지 인덱스 조정
 */
function removeExistingImage(index) {
  existingImages.value.splice(index, 1)
  adjustMainAfterRemove(index)
}

/**
 * 인덱스에 따라 기존 이미지 또는 새 이미지를 제거하는 통합 함수
 * 인덱스가 existingImages 길이보다 작으면 기존 이미지, 그 외에는 새 이미지 제거
 */
function removeByIndex(index) {
  if (index < existingImages.value.length) {
    removeExistingImage(index)
  } else {
    removeImage(index - existingImages.value.length)
  }
}

/**
 * 현재 선택된 메인 이미지를 제거하는 함수
 * safeMainIndex를 기준으로 해당 이미지를 제거
 */
function removeByMainIndex() {
  if (safeMainIndex.value >= 0) {
    removeByIndex(safeMainIndex.value)
  }
}

/**
 * 이미지 제거 후 메인 이미지 인덱스를 조정하는 함수
 * 제거된 인덱스가 메인 이미지 인덱스보다 작거나 같으면 인덱스를 조정
 */
function adjustMainAfterRemove(removedIndex) {
  if (!allImages.value.length) {
    mainImageIndex.value = -1
    return
  }
  if (removedIndex < mainImageIndex.value) {
    mainImageIndex.value -= 1
  } else if (removedIndex === mainImageIndex.value) {
    mainImageIndex.value = Math.min(mainImageIndex.value, allImages.value.length - 1)
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
 * 입력값 유효성 검사 후, 삭제된 이미지 ID 추적 및 existingImages 정리
 * goodsStore.updateGoods를 호출하여 서버에 수정 요청
 * 성공 시 굿즈 상세 페이지로 이동
 */
async function handleSubmit() {
  // 기본적인 UI 레벨 검증 (빠른 피드백 제공)
  if (!form.value.title.trim()) {
    errorMessage.value = '경매 글 제목을 입력해주세요.'
    return
  }

  if (existingImages.value.length === 0 && form.value.images.length === 0) {
    errorMessage.value = '이미지를 최소 1개 이상 유지하거나 업로드해주세요.'
    return
  }

  if (!form.value.category) {
    errorMessage.value = '굿즈 종류를 선택해주세요.'
    return
  }

  if (!form.value.animeId) {
    errorMessage.value = '애니메이션을 선택해주세요.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  // 삭제된 이미지 ID 추적 (원본에 있지만 현재 existingImages에 없는 이미지)
  const currentImageIds = new Set(existingImages.value.map(img => img.imageId).filter(id => id !== null))
  const deleteImageIds = originalImageList.value
    .filter(img => img.imageId && !currentImageIds.has(img.imageId))
    .map(img => img.imageId)

  // existingImages를 sortOrder와 함께 정리 (현재 순서대로, 1부터 시작)
  const existingImagesWithOrder = existingImages.value.map((img, index) => ({
    imageId: img.imageId,
    sortOrder: index + 1
  }))

  // 서비스 레이어로 데이터 전달 (금액 검증 등은 서비스 레이어에서 처리)
  const goodsData = {
    ...form.value,
    title: form.value.title.trim(),
    newImages: form.value.images.map(img => img.file),
    existingImages: existingImagesWithOrder,
    deleteImageIds: deleteImageIds.length > 0 ? deleteImageIds : undefined,
    maxPrice: form.value.maxPrice || null,
    animeTitle: form.value.animeTitle,
    animeId: form.value.animeId
  }

  const result = await goodsStore.updateGoods(route.params.id, goodsData)

  if (result.success) {
    alert('굿즈가 수정되었습니다.')
    router.push({ path: '/goods', query: { goodsId: route.params.id } })
  } else {
    errorMessage.value = result.message || '굿즈 수정에 실패했습니다.'
  }

  loading.value = false
}

onMounted(() => {
  fetchGoods()
})
</script>

<style scoped>
.goods-edit-page {
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

.edit-form {
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

.thumb-remove,
.remove-image-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 14px;
  line-height: 24px;
  text-align: center;
  border: none;
  cursor: pointer;
}

.remove-image-btn {
  top: 8px;
  right: 8px;
}

.thumb-remove:hover,
.remove-image-btn:hover {
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

.form-input.disabled {
  background: var(--bg-light);
  cursor: not-allowed;
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

.loading {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-light);
  font-size: 16px;
}
</style>

