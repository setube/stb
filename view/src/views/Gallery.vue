<template>
  <div class="gallery-container">
    <!-- 图片展示区域 -->
    <div class="gallery-content">
      <a-list :loading="loading" item-layout="horizontal" :data-source="images">
        <template #loadMore>
          <div class="loading-more" v-if="!loading && images.length < total">
            <a-button class="loading-more-button" @click="fetchImages">加载更多</a-button>
          </div>
        </template>
        <Waterfall :list="images" :animationDuration="100" :animationDelay="100" :breakpoints="breakpoints" v-if="images.length">
          <template #default="{ item, index }">
            <a-image :src="userStore.config.site.url + item.thumb" :preview="{ visible: false }" @click="setImageInfo(item, index)" />
          </template>
        </Waterfall>
        <a-result v-else-if="is404" title="图片广场空空如也" sub-title="快来上传你的第一张图片吧~">
          <template #icon>
            <img :src="erro404" class="ant-result-icon ant-result-image" />
          </template>
        </a-result>
      </a-list>
      <ImageInfoModal v-model="modalOpen" v-model:imageInfo="imageInfo" v-model:imageKey="imageKey" :images="images" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import axios from '@/stores/axios'
import qs from 'qs'
import { useUserStore } from '@/stores/user'
import { Waterfall } from 'vue-waterfall-plugin-next'
import 'vue-waterfall-plugin-next/dist/style.css'
import erro404 from '@/assets/404.svg'
import ImageInfoModal from '@/components/ImageInfoModal.vue'

const userStore = useUserStore()

// 状态变量
const images = ref([])
const page = ref(1)
const total = ref(0)
const loading = ref(false)
const is404 = ref(false)
const modalOpen = ref(false)
const imageInfo = ref({})
const imageKey = ref(0)
const breakpoints = {
  1920: {
    rowPerView: 5
  },
  1200: {
    rowPerView: 4
  },
  800: {
    rowPerView: 3
  },
  500: {
    rowPerView: 2
  }
}

// 获取图片信息
const setImageInfo = (image, index) => {
  imageInfo.value = image
  modalOpen.value = true
  imageKey.value = index
}

// 获取图片列表
const fetchImages = async () => {
  loading.value = true
  try {
    const { data } = await axios.post('/api/images', qs.stringify({
      page: page.value++,
      limit: 10,
    }))
    total.value = data.total
    images.value.push(...data.images)
    loading.value = false
    if (!images.value.length) is404.value = true
    if (images.value.length >= data.total || !data.images.length) loading.value = false
  } catch (error) {
    loading.value = false
    message.error('获取图片列表失败:', error)
  }
}

onMounted(fetchImages)
</script>

<style scoped>
.gallery-container {
  padding: 24px;
}

.loading-more {
  text-align: center;
  margin-top: 12px;
  height: 32px;
  line-height: 32px;
}

.loading-more-button {
  width: 100%;
}
</style>