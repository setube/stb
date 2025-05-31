<template>
  <div class="my-images">
    <a-card>
      <template #title>
        <div class="card-title">
          <span>我的图片</span>
          <a-button type="primary">
            <router-link to="/">
              <upload-outlined />
              上传图片
            </router-link>
          </a-button>
        </div>
      </template>
      <a-spin :spinning="loading">
        <a-empty v-if="images.length === 0" description="暂无图片" />
        <div v-else class="image-grid">
          <div v-for="image in images" :key="image._id" class="image-item">
            <a-card hoverable>
              <template #cover>
                <a-image :src="userStore.config.site.url + image.thumb" :preview="{ visible: false }" @click="showImageInfo(image)" />
              </template>
              <a-card-meta>
                <template #title>{{ image.filename }}</template>
                <template #description>
                  <div class="image-info">
                    <span>{{ formatFileSize(image.size) }}</span>
                    <span>{{ formatDate(image.date) }}</span>
                  </div>
                </template>
              </a-card-meta>
              <template #actions>
                <a-button type="link" @click="copyImages($event, image, userStore)">
                  <LinkOutlined />
                  复制
                </a-button>
                <a-button type="link" danger @click="deleteImage(image)">
                  <delete-outlined />
                  删除
                </a-button>
              </template>
            </a-card>
          </div>
        </div>
        <div class="pagination">
          <a-pagination v-model:current="current" :total="total" :page-size="pageSize" @change="handlePageChange" />
        </div>
      </a-spin>
    </a-card>
    <!-- 图片信息弹窗 -->
    <ImageInfoModal v-model="modalOpen" v-model:imageInfo="imageInfo" v-model:imageKey="imageKey" :images="images" />
  </div>
</template>

<script setup>
import qs from 'qs'
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { formatDate, formatFileSize, copyImages } from '@/stores/formatDate'
import { UploadOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import axios from '@/stores/axios'
import ImageInfoModal from '@/components/ImageInfoModal.vue'

const userStore = useUserStore()
const loading = ref(false)
const images = ref([])
const total = ref(0)
const current = ref(1)
const pageSize = ref(12)
const modalOpen = ref(false)
const imageInfo = ref({})
const imageKey = ref(0)

// 获取我的图片列表
const getMyImages = async () => {
  loading.value = true
  try {
    const { data } = await axios.post('/api/auth/my', qs.stringify({
      page: current.value,
      limit: pageSize.value
    }))
    images.value = data.images
    total.value = data.total
  } catch (error) {
    message.error(error.response?.data?.error || '获取图片列表失败')
  } finally {
    loading.value = false
  }
}

// 删除图片
const deleteImage = async (image) => {
  try {
    await axios.delete(`/api/auth/images/${image._id}`)
    message.success('删除成功')
    getMyImages()
  } catch (error) {
    message.error(error.response?.data?.error || '删除失败')
  }
}

// 显示图片信息
const showImageInfo = (image) => {
  imageInfo.value = image
  modalOpen.value = true
}

// 页码改变
const handlePageChange = (page) => {
  current.value = page
  getMyImages()
}

onMounted(() => getMyImages())
</script>

<style scoped>
.my-images {
  padding: 20px;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.image-item {
  width: 100%;
}

.image-info {
  display: flex;
  justify-content: space-between;
  color: rgba(0, 0, 0, 0.45);
}

.pagination {
  text-align: center;
  margin-top: 20px;
}

:deep(.ant-card-cover) {
  height: 160px;
  overflow: hidden;
}

:deep(.ant-image) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

:deep(.ant-image-mask) {
  border-radius: 8px 8px 0 0;
}
</style>