<template>
  <div class="goods-register-page">
    <div class="container">
      <h1 class="page-title">굿즈 등록</h1>

      <form @submit.prevent="handleSubmit" class="register-form">
        <!-- 이미지 업로드 -->
        <div class="form-section">
          <label class="section-label">굿즈 이미지 <span class="required">*</span></label>
          <div class="image-upload-area">
            <div
              v-for="(image, index) in form.images"
              :key="index"
              class="image-preview"
            >
              <img :src="image.preview" :alt="`이미지 ${index + 1}`" />
              <button type="button" @click="removeImage(index)" class="remove-image-btn">×</button>
            </div>
            <!-- 샘플 이미지 선택 -->
            <div v-if="form.images.length < 10" class="sample-images">
              <p class="sample-label">또는 샘플 이미지 선택:</p>
              <div class="sample-image-grid">
                <div
                  v-for="(sample, index) in sampleImages"
                  :key="index"
                  class="sample-image-item"
                  @click="selectSampleImage(sample)"
                >
                  <img :src="sample" :alt="`샘플 이미지 ${index + 1}`" />
                </div>
              </div>
            </div>
            <label v-if="form.images.length < 10" class="upload-btn">
              <input
                type="file"
                accept="image/*"
                multiple
                @change="handleImageUpload"
                class="file-input"
              />
              <span>+ 이미지 추가</span>
            </label>
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

        <!-- 캐릭터명 -->
        <div class="form-section">
          <label class="section-label">캐릭터명 (선택)</label>
          <input
            v-model="form.characterName"
            type="text"
            placeholder="캐릭터명을 입력하세요"
            class="form-input"
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGoodsStore } from '../../stores/goods'
import AnimeSearch from '../../components/AnimeSearch.vue'

const router = useRouter()
const goodsStore = useGoodsStore()

const categories = computed(() => goodsStore.categories.filter(c => c !== 'ALL'))

const loading = ref(false)
const errorMessage = ref('')
const selectedAnime = ref([])

// 샘플 이미지 목록
const sampleImages = [
  '/images/images/figure.jpg',
  '/images/images/figure-2.jpg',
  '/images/images/figure-3.jpg',
  '/images/images/photocard.jpg',
  '/images/images/photocard-1.jpg',
  '/images/images/acrylic-stand.jpg',
  '/images/images/keyring.jpg',
  '/images/images/plush.jpg',
  '/images/images/poster.jpg',
  '/images/images/jujutsu-kaisen-goods.jpg',
  '/images/images/demon-slayer-goods.jpg',
  '/images/images/attack-on-titan-goods.jpg'
]

const form = ref({
  images: [],
  animeId: null,
  animeTitle: '',
  characterName: '',
  category: '',
  description: '',
  startPrice: null,
  maxPrice: null,
  duration: 3
})

function handleImageUpload(event) {
  const files = Array.from(event.target.files)
  files.forEach(file => {
    if (form.value.images.length >= 10) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      form.value.images.push({
        file,
        preview: e.target.result
      })
    }
    reader.readAsDataURL(file)
  })
}

function removeImage(index) {
  form.value.images.splice(index, 1)
}

function handleAnimeSelected(anime) {
  form.value.animeId = anime.id
  form.value.animeTitle = anime.title.romaji || anime.title.english
}

async function handleSubmit() {
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

  if (form.value.startPrice > 5000000) {
    errorMessage.value = '거래 제한 금액(500만 골드)을 초과할 수 없습니다.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  const goodsData = {
    ...form.value,
    images: form.value.images.map(img => img.file)
  }

  const result = await goodsStore.registerGoods(goodsData)

  if (result.success) {
    alert('굿즈가 등록되었습니다.')
    router.push(`/goods/${result.data.id}`)
  } else {
    errorMessage.value = result.message
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
  flex-wrap: wrap;
  gap: 16px;
}

.sample-images {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8f8ff;
  border: 1px dashed rgba(255, 0, 0, 0.2);
  border-radius: 12px;
  padding: 16px;
}

.sample-label {
  font-size: 13px;
  color: var(--text-gray);
}

.sample-image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 10px;
}

.sample-image-item {
  width: 70px;
  height: 70px;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  transition: var(--transition);
}

.sample-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sample-image-item:hover {
  border-color: rgba(255, 0, 0, 0.3);
  transform: translateY(-2px);
}

.image-preview {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid var(--border-color);
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--primary-red);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.upload-btn {
  width: 120px;
  height: 120px;
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
  background: var(--bg-light);
}

.upload-btn:hover {
  border-color: var(--primary-red);
  background: rgba(230, 57, 70, 0.05);
}

.file-input {
  display: none;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 15px;
  transition: var(--transition);
  font-family: inherit;
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

