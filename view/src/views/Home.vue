<template>
  <div class="home-container">
    <!-- 上传区域 -->
    <a-card class="upload-card">
      <a-upload-dragger v-model:fileList="fileList" :beforeUpload="beforeUpload" :customRequest="customRequest"
        accept="image/*" :showUploadList="false">
        <p class="ant-upload-drag-icon">
          <inbox-outlined />
        </p>
        <p class="ant-upload-text">点击或拖拽图片到此区域上传</p>
        <p class="ant-upload-hint">支持单个或批量上传</p>
      </a-upload-dragger>
    </a-card>
    <!-- 图片展示区域 -->
    <a-card class="gallery-card" title="我的图片">
      <a-spin :spinning="loading">
        <a-row :gutter="[16, 16]">
          <a-col :span="6" v-for="image in images" :key="image._id">
            <a-card hoverable>
              <template #cover>
                <a-image :src="userStore.config.site.url + image.url" :alt="image.name" />
              </template>
              <a-card-meta :title="image.name">
                <template #description>
                  <a-space>
                    <a-button type="link" @click="copyImageUrl(image.url)">
                      复制链接
                    </a-button>
                    <a-button type="link" danger @click="deleteImage(image._id)">
                      删除
                    </a-button>
                  </a-space>
                </template>
              </a-card-meta>
            </a-card>
          </a-col>
        </a-row>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SparkMD5 from 'spark-md5'
import { InboxOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import axios from '@/stores/axios'

const userStore = useUserStore()

const fileList = ref([])
const images = ref([])
const loading = ref(false)

onMounted(() => fetchImages())

const fetchImages = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/images')
    images.value = response.data.images
  } catch (error) {
    message.error('获取图片列表失败')
  } finally {
    loading.value = false
  }
}

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    message.error('只能上传图片文件！')
  }
  return isImage
}

const calculateMD5 = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const spark = new SparkMD5.ArrayBuffer()
      spark.append(e.target.result)
      resolve(spark.end())
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

const customRequest = async ({ file }) => {
  try {
    // 先计算 MD5
    const md5 = await calculateMD5(file)
    const user = userStore.user
    const formData = new FormData()
    formData.append('image', file)
    formData.append('md5', md5)
    formData.append('ip', user.ipv4 ? user.ipv4 : user.ipv6)
    const response = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    images.value.unshift(response.data)
    if (response.data.isDuplicate) {
      message.warning('该图片已存在，已添加到你的图片库')
    } else {
      message.success('上传成功！')
    }
  } catch (error) {
    message.error(error?.response?.data?.error)
  }
}

const copyImageUrl = (url) => {
  const fullUrl = userStore.config.site.url + url
  navigator.clipboard.writeText(fullUrl)
  message.success('链接已复制到剪贴板')
}

const deleteImage = async (id) => {
  try {
    await axios.delete(`/api/images/${id}`)
    images.value = images.value.filter(img => img._id !== id)
    message.success('删除成功')
  } catch (error) {
    message.error(error?.response?.data?.error)
  }
}
</script>

<style scoped>
.home-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.upload-card {
  margin-bottom: 24px;
}

.gallery-card {
  margin-top: 24px;
}

.ant-upload-drag-icon {
  font-size: 48px;
  color: #40a9ff;
}

.ant-upload-text {
  font-size: 16px;
  margin: 8px 0;
}

.ant-upload-hint {
  color: rgba(0, 0, 0, 0.45);
}
</style>