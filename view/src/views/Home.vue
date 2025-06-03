<template>
  <div class="home-container" @paste="handlePaste">
    <!-- 上传区域 -->
    <a-card class="upload-card">
      <p class="ant-upload-hint">
        您单次最多可以上传{{ userStore.config?.upload?.concurrentUploads }}张图片, 最大文件大小：{{ userStore.config?.upload?.maxSize }}MB
      </p>
      <!-- 上传区域 -->
      <a-upload-dragger :beforeUpload="beforeUpload" :accept="formats" multiple :maxCount="userStore.config?.upload?.concurrentUploads" :showUploadList="false">
        <p class="ant-upload-drag-icon">
          <CloudUploadOutlined />
        </p>
        <p class="ant-upload-text">点击、拖拽或粘贴图片上传</p>
        <p class="ant-upload-hint">
          支持格式：{{ mimeTypes }}
        </p>
      </a-upload-dragger>
      <!-- 文件列表 -->
      <div class="file-list" v-if="fileList.length > 0">
        <div class="file-list-header">
          <span>文件列表 ({{ fileList.length }})</span>
          <div class="file-list-actions">
            <a-button type="primary" @click="startUpload" :loading="uploading" :disabled="!fileList.some(f => f.status === 'waiting')">
              批量上传
            </a-button>
            <a-button @click="clearList" :disabled="!fileList.some(f => f.status === 'waiting' || f.status === 'uploading')">
              清空列表
            </a-button>
          </div>
        </div>
        <div class="file-items">
          <div v-for="file in fileList" :key="file.uid" class="file-item">
            <div class="file-preview">
              <img :src="file.preview" :alt="file.name" />
            </div>
            <div class="file-info">
              <div class="file-name">{{ file.name }}</div>
              <div class="file-size">{{ formatFileSize(file.size) }}</div>
              <div class="file-status">
                <template v-if="file.status === 'uploading'">
                  <a-progress :percent="file.percent" size="small" />
                </template>
                <template v-else-if="file.status === 'success'">
                  <span class="success-text">上传成功</span>
                </template>
                <template v-else-if="file.status === 'error'">
                  <span class="error-text">{{ file.error }}</span>
                </template>
              </div>
            </div>
            <div class="file-actions">
              <a-tooltip title="上传" v-if="file.status === 'waiting'">
                <a-button type="text" @click="uploadSingleFile(file)">
                  <UploadOutlined />
                </a-button>
              </a-tooltip>
              <a-tooltip title="删除">
                <a-button type="text" danger @click="removeFile(file)" :disabled="file.status === 'uploading'">
                  <DeleteOutlined />
                </a-button>
              </a-tooltip>
            </div>
          </div>
        </div>
      </div>
    <div v-if="uploadedImages[activeTab].length > 0" class="result-panel">
      <!-- 复制按钮 -->
      <a-button class="copyAll" type="primary" @click="copyImages">一键复制</a-button>
      <!-- 格式切换 -->
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane v-for="item in tabList" :key="item.key" :tab="item.tab" class="link-items">
          <div v-for="(img, idx) in uploadedImages[activeTab]" :key="idx" class="link-item">
            <div class="link-content" @click="copySingleLink('.link-content', img)">
              {{ img }}
            </div>
            <a-tooltip title="复制">
              <a-button type="link" class="link" @click="copySingleLink('.link', img)">
                <template #icon>
                  <CopyOutlined />
                </template>
              </a-button>
            </a-tooltip>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ClipboardJS from 'clipboard'
import {
  CloudUploadOutlined,
  DeleteOutlined,
  CheckOutlined,
  CopyOutlined,
  UploadOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import axios from '@/stores/axios'
import { formatFileSize } from '@/stores/formatDate'

const userStore = useUserStore()
const fileList = ref([])
const images = ref([])
const uploadedImages = ref({
  url: [],
  html: [],
  bbcode: [],
  markdown: []
})
const currentIndex = ref(0)
const activeTab = ref('url')
const tabList = [
  {
    key: 'url',
    tab: 'URL'
  },
  {
    key: 'html',
    tab: 'HTML'
  },
  {
    key: 'bbcode',
    tab: 'BBCode'
  },
  {
    key: 'markdown',
    tab: 'Markdown'
  }
]
const uploading = ref(false)

// 一键复制所有图片链接
const copyImages = () => {
  const clipboard = new ClipboardJS('.copyAll', {
    text: () => {
      return uploadedImages.value[activeTab.value].join('\n')
    }
  })
  clipboard.on('success', (e) => {
    images.value = []
    fileList.value = []
    uploadedImages.value = {
      url: [],
      html: [],
      bbcode: [],
      markdown: []
    }
    currentIndex.value = 0
    e.clearSelection()
    message.success('链接已复制到剪贴板')
    clipboard.destroy()
  })
  clipboard.on('error', (e) => {
    message.error('复制失败, 请手动复制')
    clipboard.destroy()
  })
}

// 上传成功后调用此方法
const onUploadSuccess = (name, uri) => {
  const { url, html, bbcode, markdown } = uploadedImages.value
  url.push(uri)
  html.push(`<img src="${uri}" alt="${name}" />`)
  bbcode.push(`[img]${uri}[/img]`)
  markdown.push(`![${name}](${uri})`)
  currentIndex.value = uploadedImages.value[activeTab.value].length - 1
}

// 生成MIME类型字符串
const formats = computed(() => {
  const allowedFormats = userStore.config?.upload?.allowedFormats
  if (!allowedFormats?.length) {
    return 'image/*'
  }
  return allowedFormats.map(f => `image/${f}`).join(',')
})

// 生成文件扩展名字符串
const mimeTypes = computed(() => {
  const allowedFormats = userStore.config?.upload?.allowedFormats
  if (!allowedFormats?.length) {
    return 'all'
  }
  return allowedFormats.join(', ').toUpperCase()
})

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    message.error('只能上传图片文件！')
    return false
  }
  // 创建文件预览
  fileList.value.push({
    uid: Date.now() + Math.random().toString(36).slice(2),
    name: file.name,
    size: file.size,
    file,
    preview: URL.createObjectURL(file),
    status: 'waiting',
    percent: 0,
    error: ''
  })
  return false // 阻止自动上传
}

// 通用的上传函数
const uploadImage = async (file, onProgress) => {
  try {
    const { ip, config, token } = userStore
    const formData = new FormData()
    formData.append('image', file)
    formData.append('ip', ip?.ipv4 ? ip?.ipv4 : ip?.ipv6)
    const isTourist = config?.site?.anonymousUpload && !token ? '/api/tourist/upload' : '/api/upload'
    const { data } = await axios.post(isTourist, formData, {
      onUploadProgress: (e) => {
        if (onProgress) {
          onProgress({ percent: Math.round((e.loaded / e.total) * 100) })
        }
      }
    })
    const { url, type, filename } = data
    images.value.unshift(data)
    onUploadSuccess(filename, type == 'local' ? config?.site?.url + url : url)
    return data
  } catch (error) {
    throw error
  }
}

// 处理粘贴上传
const handlePaste = async (event) => {
  const items = (event.clipboardData || window.Clipboard).items
  const imageFiles = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      const preview = URL.createObjectURL(file)
      imageFiles.push({
        uid: Date.now() + i,
        name: file.name,
        size: file.size,
        file,
        preview
      })
    }
  }
  if (imageFiles.length > 0) {
    fileList.value.push(...imageFiles)
  }
}

// 开始上传
const startUpload = async () => {
  const waitingFiles = fileList.value.filter(f => f.status === 'waiting')
  if (waitingFiles.length === 0) return

  uploading.value = true
  for (const file of waitingFiles) {
    await uploadSingleFile(file)
  }
  uploading.value = false
}

// 移除文件
const removeFile = (file) => {
  const index = fileList.value.findIndex(f => f.uid === file.uid)
  if (index > -1) {
    fileList.value.splice(index, 1)
  }
}

// 清空列表
const clearList = () => {
  fileList.value = fileList.value.filter(f => f.status === 'success' || f.status === 'error')
}

// 复制单个链接
const copySingleLink = (event, link) => {
  const clipboard = new ClipboardJS(event, {
    text: () => link
  })
  clipboard.on('success', (e) => {
    e.clearSelection()
    message.success('链接已复制到剪贴板')
    clipboard.destroy()
  })
  clipboard.on('error', (e) => {
    message.error('复制失败, 请手动复制')
    clipboard.destroy()
  })
}

// 单个文件上传
const uploadSingleFile = async (file) => {
  const index = fileList.value.findIndex(f => f.uid === file.uid)
  if (index === -1) return
  fileList.value[index].status = 'uploading'
  fileList.value[index].percent = 0
  try {
    const result = await uploadImage(file.file, (progress) => {
      const idx = fileList.value.findIndex(f => f.uid === file.uid)
      if (idx > -1) {
        fileList.value[idx].percent = progress.percent
      }
    })
    fileList.value[index].status = 'success'
    fileList.value[index].url = result.type == 'local' ? userStore.config?.site?.url + result.url : result.url
    fileList.value[index].thumb = userStore.config?.site?.url + result.thumb
  } catch (error) {
    fileList.value[index].status = 'error'
    fileList.value[index].error = error.message || '上传失败'
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

.custom-upload-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  margin-bottom: 8px;
}

.upload-item-preview {
  width: 48px;
  height: 48px;
  margin-right: 12px;
  border-radius: 4px;
  overflow: hidden;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-item-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-item-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 20px;
}

.upload-item-info {
  flex: 1;
  min-width: 0;
}

.upload-item-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.upload-item-status {
  font-size: 12px;
  color: #999;
}

.upload-item-actions {
  margin-left: 12px;
}

:deep(.ant-upload-list) {
  margin-top: 16px;
}

:deep(.ant-upload-list-item) {
  padding: 0;
  border: none;
  margin-bottom: 8px;
}

:deep(.ant-upload-list-item-info) {
  padding: 0;
}

:deep(.ant-upload-list-item-actions) {
  display: none;
}

:deep(.ant-btn) {
  margin-right: 10px;
}

.link-items {
  max-height: 220px;
  overflow: auto;
}

.link-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  margin-bottom: 8px;
  border-radius: 4px;
}

.link-content {
  flex: 1;
  margin-right: 12px;
  padding: 4px 8px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-content:hover {
  border-color: #40a9ff;
}

:deep(.ant-btn-link) {
  padding: 4px 8px;
  height: auto;
}

:deep(.ant-btn-link:hover) {
  background: #f0f0f0;
  border-radius: 4px;
}

.file-list {
  margin-top: 16px;
  margin-bottom: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.file-list-actions {
  display: flex;
}

.file-items {
  padding: 8px;
  max-height: 340px;
  overflow: auto;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.file-item:hover {
  background-color: #f5f5f5;
}

.file-preview {
  width: 48px;
  height: 48px;
  margin-right: 12px;
  border-radius: 4px;
  overflow: hidden;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.file-status {
  font-size: 12px;
}

.success-text {
  color: #52c41a;
}

.error-text {
  color: #ff4d4f;
}

.file-actions {
  margin-left: 12px;
}

.result-panel {
  margin-top: 10px;
}
</style>