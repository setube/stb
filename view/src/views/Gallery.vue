<template>
  <div class="gallery-container">
    <div style="margin-bottom: 20px; text-align: center;">
      <a-select v-model:value="searchTags" mode="tags" style="width: 300px;" placeholder="按标签搜索" @change="handleTagSearch" />
    </div>
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
            <div class="image-item-tags">
              <a-tag v-for="tag in item.tags" :key="tag" size="small" @click="clickTag(tag)">
                {{ tag }}
              </a-tag>
            </div>
          </template>
        </Waterfall>
        <a-result v-else-if="is404 && !loading" title="图片广场空空如也" sub-title="快来上传你的第一张图片吧~">
          <template #icon>
            <img :src="erro404" class="ant-result-icon ant-result-image" />
          </template>
        </a-result>
        <a-result v-else-if="images.length === 0 && !loading && searchTags.length > 0" title="没有找到匹配的图片" sub-title="请尝试其他标签">
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

// 标签搜索状态
const searchTags = ref([])

// 获取图片信息
const setImageInfo = (image, index) => {
  imageInfo.value = image
  modalOpen.value = true
  imageKey.value = index
}

// 获取图片列表
const fetchImages = async () => {
  if (!loading.value && images.value.length >= total.value && total.value > 0) {
    return
  }
  loading.value = true
  is404.value = false // 重置状态
  try {
    const { data } = await axios.post('/api/images', qs.stringify({
      page: page.value,
      limit: 20,
      tags: searchTags.value
    }))
    total.value = data.total
    if (page.value === 1) {
      images.value = data.images
    } else {
      images.value.push(...data.images)
    }
    page.value++ // 准备下一页
    // 判断是否为空
    if (images.value.length === 0 && total.value === 0 && searchTags.value.length === 0) {
      is404.value = true
    } else {
      is404.value = false
    }
  } catch (error) {
    console.error('获取图片列表失败:', error)
    message.error('获取图片列表失败')
    is404.value = true
  } finally {
    loading.value = false
  }
}

const clickTag = (tag) => {
  searchTags.value.push(...[tag])
  handleTagSearch()
}

// 处理标签搜索
const handleTagSearch = () => {
  page.value = 1 // 搜索时重置页码到第一页
  total.value = 0 // 重置总数
  images.value = [] // 清空当前图片列表
  fetchImages() // 重新获取图片列表
}

onMounted(() => {
  // 初始加载时，先设置page为1，然后调用fetchImages
  page.value = 1
  fetchImages()
})
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

.waterfall-list {
  background-color: transparent;
}

/* 添加图片下方标签样式 */
.image-item-tags {
  margin-top: 5px;
  text-align: center;
  /* 或 left */
}
</style>