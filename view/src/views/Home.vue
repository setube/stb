<template>
  <div class="home-container">
    <!-- 上传区域 -->
    <a-card class="upload-card">
      <p class="ant-upload-hint">
        您单次最多可以上传{{ userStore.config.upload.concurrentUploads }}张图片, 最大文件大小：{{ userStore.config.upload.maxSize }}MB
      </p>
      <a-upload-dragger v-model:fileList="fileList" :beforeUpload="beforeUpload" :customRequest="customRequest"
        :accept="formats" multiple :maxCount="userStore.config.upload.concurrentUploads" :showUploadList="false">
        <p class="ant-upload-drag-icon">
          <inbox-outlined />
        </p>
        <p class="ant-upload-text">点击或拖拽图片到此区域上传</p>
        <p class="ant-upload-hint">
          支持格式：{{ mimeTypes }}
        </p>
      </a-upload-dragger>
    </a-card>
    <!-- 上传成功后展示图片链接和多种格式 -->
    <div v-if="uploadedImages.length > 0" class="result-panel">
      <!-- 复制按钮 -->
      <a-button type="primary" @click="copyImages">一键复制</a-button>
      <!-- 格式切换 -->
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="url" tab="URL">
          <a-input class="ant-input" v-for="(img, idx) in uploadedImages" :key="img || idx" :value="img" readonly
            @focus="$event.target.select()" />
        </a-tab-pane>
        <a-tab-pane key="html" tab="HTML">
          <a-input class="ant-input" v-for="(img, idx) in uploadedImages" :key="img || idx"
            :value="`<img src='${img}' alt='' />`" readonly @focus="$event.target.select()" />
        </a-tab-pane>
        <a-tab-pane key="bbcode" tab="BBCode">
          <a-input class="ant-input" v-for="(img, idx) in uploadedImages" :key="img || idx" :value="`[img]${img}[/img]`"
            readonly @focus="$event.target.select()" />
        </a-tab-pane>
        <a-tab-pane key="markdown" tab="Markdown">
          <a-input class="ant-input" v-for="(img, idx) in uploadedImages" :key="img || idx" :value="`![](${img})`"
            readonly @focus="$event.target.select()" />
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import SparkMD5 from 'spark-md5'
import { InboxOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import axios from '@/stores/axios'

const userStore = useUserStore()

const fileList = ref([])
const images = ref([])

const uploadedImages = ref([]) // 存储所有上传成功的图片URL
const currentIndex = ref(0)
const activeTab = ref('url')

// 一键复制
const copyImages = () => {
  const urls = uploadedImages.value.join('\n')
  navigator.clipboard.writeText(urls)
  message.success('链接已复制到剪贴板')
}

// 上传成功后调用此方法
const onUploadSuccess = (urls) => {
  // 支持单张和多张
  if (Array.isArray(urls)) {
    uploadedImages.value.push(...urls)
    currentIndex.value = uploadedImages.value.length - 1
  } else if (typeof urls === 'string' && urls) {
    uploadedImages.value.push(urls)
    currentIndex.value = uploadedImages.value.length - 1
  }
  activeTab.value = 'url'
}

// 生成MIME类型字符串
const formats = computed(() => {
  const allowedFormats = userStore.config.upload.allowedFormats
  if (!allowedFormats.length) {
    return 'image/*'
  }
  return allowedFormats.map(f => `image/${f}`).join(',')
})

// 生成文件扩展名字符串
const mimeTypes = computed(() => {
  const allowedFormats = userStore.config.upload.allowedFormats
  if (!allowedFormats.length) {
    return 'all'
  }
  return allowedFormats.join(', ').toUpperCase()
})

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
    formData.append('ip', user.ip.ipv4 ? user.ip.ipv4 : user.ip.ipv6)
    const response = await axios.post('/api/upload', formData)
    images.value.unshift(response.data)
    if (response.data.isDuplicate) {
      message.warning('该图片已存在，已添加到你的图片库')
    } else {
      message.success('上传成功！')
      onUploadSuccess(userStore.config.site.url + response.data.url)
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

.ant-input {
  margin-bottom: 10px;
}
</style>