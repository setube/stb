<template>
  <div class="gallery-container">
    <!-- 图片展示区域 -->
    <div class="gallery-content">
      <Waterfall :list="images" v-infinite-scroll="fetchImages">
        <template #default="{ item }">
          <a-card hoverable>
            <template #cover>
              <a-image class="ant-image-img" :src="userStore.config.site.url + item.url" />
            </template>
          </a-card>
        </template>
      </Waterfall>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import axios from '@/stores/axios'
import qs from 'qs'
import { useUserStore } from '@/stores/user'
import { Waterfall } from 'vue-waterfall-plugin-next'
import 'vue-waterfall-plugin-next/dist/style.css'

const userStore = useUserStore()

// 状态变量
const images = ref([])
const page = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)

// 获取图片列表
const fetchImages = async () => {
  if (!hasMore.value) return
  try {
    const { data } = await axios.post('/api/images', qs.stringify({
      page: page.value,
      limit: pageSize.value,
    }))
    if (images.value.length >= data.total) {
      hasMore.value = false
    } else {
      images.value = [...images.value, ...data.images]
      page.value++
      hasMore.value = true
    }
  } catch (error) {
    message.error('获取图片列表失败:', error)
  }
}
</script>

<style scoped>
.gallery-container {
  padding: 24px;
}

@media (max-width: 768px) {
  .waterfall-container {
    column-count: 2;
  }
}
</style>