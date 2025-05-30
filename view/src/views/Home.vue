<template>
  <div class="home-container" @paste="handlePaste">
    <!-- 上传区域 -->
    <a-card class="upload-card">
      <p class="ant-upload-hint">
        您单次最多可以上传{{ userStore.config?.upload?.concurrentUploads }}张图片, 最大文件大小：{{ userStore.config?.upload?.maxSize }}MB
      </p>
      <a-upload-dragger v-model:fileList="fileList" :beforeUpload="beforeUpload" :customRequest="customRequest"
        :accept="formats" multiple :maxCount="userStore.config?.upload?.concurrentUploads" :showUploadList="false">
        <p class="ant-upload-drag-icon">
          <CloudUploadOutlined />
        </p>
        <p class="ant-upload-text">点击、拖拽或粘贴图片上传</p>
        <p class="ant-upload-hint">
          支持格式：{{ mimeTypes }}
        </p>
      </a-upload-dragger>
    </a-card>
    <!-- 上传成功后展示图片链接和多种格式 -->
    <div v-if="uploadedImages[activeTab].length > 0" class="result-panel">
      <!-- 复制按钮 -->
      <a-button class="copyAll" type="primary" @click="copyImages">一键复制</a-button>
      <!-- 格式切换 -->
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane v-for="item in tabList" :key="item.key" :tab="item.tab">
          <a-input class="ant-input" v-for="(img, idx) in uploadedImages[activeTab]" :key="idx" :value="img" readonly
            @focus="inputFocus($event)" />
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SparkMD5 from 'spark-md5'
import ClipboardJS from 'clipboard'
import { CloudUploadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import axios from '@/stores/axios'

const userStore = useUserStore()
const fileList = ref([])
const images = ref([])
const currentClipboard = ref(null)
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

// 复制链接
const inputFocus = (event) => {
  // 如果存在之前的实例，先销毁它
  if (currentClipboard.value) {
    currentClipboard.value.destroy()
  }
  // 创建新的实例
  currentClipboard.value = new ClipboardJS(event.target, {
    text: () => {
      return event.target.value
    }
  })
  currentClipboard.value.on('success', (e) => {
    e.clearSelection()
    message.success('链接已复制到剪贴板')
  })
  currentClipboard.value.on('error', (e) => {
    message.error('复制失败, 请手动复制')
  })
}

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

// 通用的上传函数
const uploadImage = async (file) => {
  try {
    const { ip, config } = userStore
    const md5 = await calculateMD5(file)
    const formData = new FormData()
    formData.append('image', file)
    formData.append('md5', md5)
    formData.append('ip', ip?.ipv4 ? ip?.ipv4 : ip?.ipv6)
    const isTourist = config?.site?.anonymousUpload && !userStore.token ? '/api/tourist/upload' : '/api/upload'
    const { data } = await axios.post(isTourist, formData)
    const { url, type, filename, isDuplicate } = data
    images.value.unshift(data)
    if (!isDuplicate) {
      onUploadSuccess(filename, type == 'local' ? config?.site?.url + url : url)
    }
    return { ...data, isDuplicate }
  } catch (error) {
    throw error
  }
}

// 处理粘贴上传
const handlePaste = async (event) => {
  const items = (event.clipboardData || window.Clipboard).items
  // 收集所有图片文件
  const imageFiles = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      imageFiles.push(item.getAsFile())
    }
  }
  if (imageFiles.length > 0) {
    // 显示开始上传提示
    message.loading({ content: `正在上传 ${imageFiles.length} 张图片...`, key: 'uploading' })
    try {
      // 使用通用上传函数处理所有图片
      const results = await Promise.all(
        imageFiles.map(file => uploadImage(file))
      )
      // 统计重复和非重复的图片数量
      const duplicates = results.filter(r => r.isDuplicate).length
      const successCount = results.length - duplicates
      // 根据上传结果显示不同的提示
      if (successCount > 0 && duplicates > 0) {
        message.success({
          content: `上传完成！成功上传 ${successCount} 张图片，${duplicates} 张图片已存在`,
          key: 'uploading',
          duration: 3
        })
      } else if (successCount > 0) {
        message.success({
          content: `上传完成！成功上传 ${successCount} 张图片`,
          key: 'uploading',
          duration: 3
        })
      } else if (duplicates > 0) {
        message.warning({
          content: `所有图片都已存在，已添加到你的图片库`,
          key: 'uploading',
          duration: 3
        })
      }
    } catch (error) {
      message.error({
        content: error?.response?.data?.error || '粘贴上传失败',
        key: 'uploading',
        duration: 3
      })
    }
  } else {
    message.info('未从剪贴板检测到图片文件。')
  }
}

// 处理拖拽上传
const customRequest = async ({ file }) => {
  try {
    const { isDuplicate } = await uploadImage(file)
    if (isDuplicate) {
      message.warning('该图片已存在，已添加到你的图片库')
    } else {
      message.success('上传成功！')
    }
  } catch (error) {
    message.error(error?.response?.data?.error || '上传失败')
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