<template>
  <GoodsDetail v-if="route.query.goodsId" />
  <GoodsList v-else />
</template>

<script setup>
import { useRoute } from 'vue-router'
import GoodsList from './GoodsList.vue'
import GoodsDetail from './GoodsDetail.vue'

const route = useRoute()
</script>

