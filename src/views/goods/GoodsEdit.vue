<template>
  <div class="goods-edit-page">
    <div class="container">
      <h1 class="page-title">굿즈 수정</h1>

      <div v-if="loading" class="loading">로딩 중...</div>
      <form v-else @submit.prevent="handleSubmit" class="edit-form">
        <!-- 기존 이미지 및 새 이미지 업로드 -->
        <div class="form-section">
          <label class="section-label">굿즈 이미지</label>
          <div class="image-upload-area">
            <div
              v-for="(image, index) in existingImages"
              :key="`existing-${index}`"
              class="image-preview"
            >
              <img :src="image" :alt="`이미지 ${index + 1}`" />
              <button type="button" @click="removeExistingImage(index)" class="remove-image-btn">×</button>
            </div>
            <div
              v-for="(image, index) in form.images"
              :key="`new-${index}`"
              class="image-preview"
            >
              <img :src="image.preview" :alt="`새 이미지 ${index + 1}`" />
              <button type="button" @click="removeImage(index)" class="remove-image-btn">×</button>
            </div>
            <label v-if="(existingImages.length + form.images.length) < 10" class="upload-btn">
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

        <!-- 애니메이션 (수정 불가) -->
        <div class="form-section">
          <label class="section-label">애니메이션</label>
          <input
            :value="goods.animeTitle"
            type="text"
            disabled
            class="form-input disabled"
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

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div class="form-actions">
          <router-link :to="`/goods/${goods.id}`" class="btn-outline">취소</router-link>
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

const route = useRoute()
const router = useRouter()
const goodsStore = useGoodsStore()

const categories = computed(() => goodsStore.categories.filter(c => c !== 'ALL'))

const loading = ref(true)
const errorMessage = ref('')
const goods = ref(null)
const existingImages = ref([])

const form = ref({
  images: [],
  characterName: '',
  category: '',
  description: ''
})

async function fetchGoods() {
  loading.value = true
  const result = await goodsStore.fetchGoodsDetail(route.params.id)
  if (result.success) {
    goods.value = goodsStore.currentGoods
    existingImages.value = [...(goods.value.images || [])]
    form.value = {
      images: [],
      characterName: goods.value.characterName || '',
      category: goods.value.category || '',
      description: goods.value.description || ''
    }
  } else {
    errorMessage.value = result.message
  }
  loading.value = false
}

function handleImageUpload(event) {
  const files = Array.from(event.target.files)
  files.forEach(file => {
    if ((existingImages.value.length + form.value.images.length) >= 10) return
    
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

function removeExistingImage(index) {
  existingImages.value.splice(index, 1)
}

async function handleSubmit() {
  if (existingImages.value.length === 0 && form.value.images.length === 0) {
    errorMessage.value = '이미지를 최소 1개 이상 업로드해주세요.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  const goodsData = {
    ...form.value,
    images: form.value.images.map(img => img.file),
    existingImages: existingImages.value
  }

  const result = await goodsStore.updateGoods(route.params.id, goodsData)

  if (result.success) {
    alert('굿즈가 수정되었습니다.')
    router.push(`/goods/${route.params.id}`)
  } else {
    errorMessage.value = result.message
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
  flex-wrap: wrap;
  gap: 16px;
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

