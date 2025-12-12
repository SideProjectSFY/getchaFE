<template>
  <div class="anime-search">
    <div class="search-input-wrapper">
      <input
        v-model="searchTerm"
        @input="handleSearch"
        @keydown.enter.prevent="handleEnter"
        type="text"
        placeholder="애니메이션 제목을 검색하세요..."
        class="search-input"
      />
    </div>

    <div v-if="searchResults.length > 0" class="search-results">
      <div
        v-for="anime in searchResults"
        :key="anime.id"
        @click="selectAnime(anime)"
        class="anime-result-item"
        :class="{ selected: isSelected(anime.id) }"
      >
        <img :src="anime.coverImage?.medium || '/placeholder.png'" :alt="anime.title.romaji" class="anime-cover" />
        <div class="anime-info">
          <h4 class="anime-title">{{ anime.title.romaji || anime.title.english }}</h4>
          <p class="anime-genres">{{ anime.genres?.slice(0, 3).join(', ') }}</p>
        </div>
        <span v-if="isSelected(anime.id)" class="selected-badge">✓</span>
      </div>
    </div>
    <div v-else-if="noResults && searchTerm" class="no-results">
      해당 애니메이션이 존재하지 않습니다.
    </div>

    <div v-if="selectedAnimes.length > 0" class="selected-animes">
      <h4 class="selected-title">선택된 애니메이션 ({{ selectedAnimes.length }}/{{ max }})</h4>
      <div class="selected-list">
        <div
          v-for="anime in selectedAnimes"
          :key="anime.id"
          class="selected-anime-item"
        >
          <img :src="anime.coverImage?.medium || '/placeholder.png'" :alt="anime.title.romaji" class="selected-cover" />
          <span class="selected-name">{{ anime.title.romaji || anime.title.english }}</span>
          <button @click="removeAnime(anime.id)" class="remove-btn">×</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import api from '../services/api'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  max: {
    type: Number,
    default: 3
  }
})

const emit = defineEmits(['update:modelValue', 'anime-selected'])

// 입력값, 검색 결과, 선택된 목록
const searchTerm = ref('')
const searchResults = ref([])
const selectedAnimes = ref([...props.modelValue])
const noResults = ref(false)

let searchTimeout = null

function matchesQuery(anime, query) {
  return ['romaji', 'english', 'native'].some((key) =>
    anime.title?.[key]?.toLowerCase().includes(query)
  )
}

// 백엔드에 keyword로 검색 요청
async function executeSearch() {
  const keyword = (searchTerm.value || '').trim()
  if (!keyword) {
    searchResults.value = []
    noResults.value = false
    return
  }
  try {
    const res = await api.get('/anime/search', { params: { keyword } })
    const results = (res.data || []).map((item) => ({
      id: item.animeId,
      title: { romaji: item.title, english: item.title, native: item.title },
      coverImage: { large: item.postUrl, medium: item.postUrl },
      description: item.title
    }))
    searchResults.value = results.slice(0, 10)
    noResults.value = searchResults.value.length === 0
  } catch (e) {
    searchResults.value = []
    noResults.value = true
  }
}

// 입력 중 debounce 300ms 후 검색
function handleSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (!searchTerm.value || searchTerm.value.length < 1) {
    searchResults.value = []
    noResults.value = false
    return
  }

  searchTimeout = setTimeout(async () => {
    await executeSearch()
  }, 300)
}

// 엔터 입력 시 즉시 검색
async function handleEnter() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (!searchTerm.value || searchTerm.value.length < 1) {
    noResults.value = false
    return
  }

  await executeSearch()
}

function selectAnime(anime) {
  if (isSelected(anime.id)) {
    removeAnime(anime.id)
    return
  }

  if (selectedAnimes.value.length >= props.max) {
    alert(`최대 ${props.max}개까지만 선택할 수 있습니다.`)
    return
  }

  selectedAnimes.value.push(anime)
  emit('update:modelValue', selectedAnimes.value)
  emit('anime-selected', anime)
  searchTerm.value = ''
  searchResults.value = []
}

function removeAnime(animeId) {
  selectedAnimes.value = selectedAnimes.value.filter(a => a.id !== animeId)
  emit('update:modelValue', selectedAnimes.value)
}

function isSelected(animeId) {
  return selectedAnimes.value.some(a => a.id === animeId)
}

watch(() => props.modelValue, (newValue) => {
  selectedAnimes.value = [...newValue]
})
</script>

<style scoped>
.anime-search {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-input-wrapper {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 15px;
  transition: var(--transition);
}

.search-input:focus {
  border-color: var(--primary-red);
  box-shadow: 0 0 0 3px rgba(230, 57, 70, 0.1);
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: white;
}

.anime-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  transition: var(--transition);
  border-bottom: 1px solid var(--border-color);
}

.anime-result-item:last-child {
  border-bottom: none;
}

.anime-result-item:hover {
  background: var(--bg-light);
}

.anime-result-item.selected {
  background: rgba(230, 57, 70, 0.1);
}

.anime-cover {
  width: 50px;
  height: 70px;
  object-fit: cover;
  border-radius: 4px;
}

.anime-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.anime-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dark);
}

.anime-genres {
  font-size: 12px;
  color: var(--text-light);
}

.selected-badge {
  color: var(--primary-red);
  font-size: 20px;
  font-weight: 700;
}

.no-results {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  background: white;
  color: var(--text-gray);
  text-align: center;
  font-size: 14px;
}

.selected-animes {
  margin-top: 8px;
}

.selected-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 12px;
}

.selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.selected-anime-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 71, 87, 0.06);
  border-radius: 10px;
  border: 1px solid rgba(255, 71, 87, 0.2);
}

.selected-cover {
  width: 40px;
  height: 56px;
  object-fit: cover;
  border-radius: 4px;
}

.selected-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-dark);
}

.remove-btn {
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
  transition: var(--transition);
}

.remove-btn:hover {
  background: var(--primary-red-dark);
  transform: scale(1.1);
}
</style>

