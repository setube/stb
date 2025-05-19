<template>
  <div class="gallery-container">
    <!-- 筛选和排序工具栏 -->
    <div class="toolbar">
      <a-space>
        <!-- 排序方式 -->
        <a-select v-model:value="sortBy" style="width: 120px">
          <a-select-option value="time">上传时间</a-select-option>
          <a-select-option value="resolution">分辨率</a-select-option>
          <a-select-option value="size">文件大小</a-select-option>
          <a-select-option value="user">上传用户</a-select-option>
        </a-select>
        <!-- 排序方向 -->
        <a-select v-model:value="sortOrder" style="width: 100px">
          <a-select-option value="desc">降序</a-select-option>
          <a-select-option value="asc">升序</a-select-option>
        </a-select>
        <!-- 展示方式 -->
        <a-radio-group v-model:value="viewMode" button-style="solid">
          <a-radio-button value="list">列表</a-radio-button>
          <a-radio-button value="waterfall">瀑布流</a-radio-button>
          <a-radio-button value="card">卡片</a-radio-button>
        </a-radio-group>
      </a-space>
    </div>
    <!-- 图片展示区域 -->
    <div class="gallery-content" :class="viewMode">
      <template v-if="viewMode === 'list'">
        <a-table :dataSource="images" :columns="columns" :loading="loading">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'preview'">
              <a-image :src="userStore.config.site.url + record.url" :alt="record.originalName" class="preview-image" />
            </template>
            <template v-if="column.key === 'size'">
              {{ formatFileSize(record.size) }}
            </template>
            <template v-if="column.key === 'resolution'">
              {{ record.width }} x {{ record.height }}
            </template>
            <template v-if="column.key === 'action'">
              <a-space>
                <a-button type="link" @click="copyUrl(record)">复制</a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </template>
      <template v-else-if="viewMode === 'waterfall'">
        <div class="waterfall-container" ref="waterfallContainer">
          <div v-for="image in images" :key="image._id" class="waterfall-item">
            <a-card hoverable>
              <template #cover>
                <a-image :src="userStore.config.site.url + image.url" :alt="image.originalName" />
              </template>
            </a-card>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="card-container">
          <a-row :gutter="[16, 16]">
            <a-col :span="6" v-for="image in images" :key="image._id">
              <a-card hoverable>
                <template #cover>
                  <a-image :src="userStore.config.site.url + image.url" :alt="image.originalName" />
                </template>
                <a-card-meta :title="image.originalName">
                  <template #description>
                    <div>{{ formatFileSize(image.size) }}</div>
                    <div>{{ image.width }} x {{ image.height }}</div>
                    <div>上传者: {{ image.user.username }}</div>
                  </template>
                </a-card-meta>
              </a-card>
            </a-col>
          </a-row>
        </div>
      </template>
    </div>
    <!-- 分页 -->
    <div class="pagination">
      <a-pagination v-model:current="current" :total="total" :pageSize="pageSize" @change="handlePageChange" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import axios from '@/stores/axios'
import { saveAs } from 'file-saver'
import { useUserStore } from '@/stores/user'
const userStore = useUserStore()

// 状态变量
const images = ref([])
const loading = ref(false)
const current = ref(1)
const pageSize = ref(20)
const total = ref(0)
const totalPages = ref(0)
const sortBy = ref('time')
const sortOrder = ref('desc')
const viewMode = ref('list')

// 表格列定义
const columns = [
  {
    title: '预览',
    key: 'preview',
    width: 100
  },
  {
    title: '文件名',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: '大小',
    key: 'size',
    width: 100
  },
  {
    title: '分辨率',
    key: 'resolution',
    width: 120
  },
  {
    title: '上传者',
    dataIndex: ['user', 'username'],
    key: 'user'
  },
  {
    title: '上传时间',
    dataIndex: 'date',
    key: 'date',
    width: 180
  },
  {
    title: '操作',
    key: 'action',
    width: 150
  }
]

// 获取图片列表
const fetchImages = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/images', {
      params: {
        page: current.value,
        limit: pageSize.value,
        sortBy: sortBy.value,
        sortOrder: sortOrder.value
      }
    })
    images.value = response.data.images
    total.value = response.data.total
    totalPages.value = response.data.totalPages
  } catch (error) {
    console.error('获取图片列表失败:', error)
    message.value = '获取图片列表失败'
  } finally {
    loading.value = false
  }
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 复制url
const copyUrl = async (image) => {
  try {
    const url = userStore.config.site.url + image.url
    await navigator.clipboard.writeText(url)
    message.success('复制成功')
  } catch (error) {
    message.error('复制失败')
  }
}

// 监听排序和筛选变化
watch([sortBy, sortOrder], () => {
  current.value = 1
  fetchImages()
})

// 页码变化
const handlePageChange = (page) => {
  if (page < 1 || page > totalPages.value) return
  current.value = page
  fetchImages()
}

onMounted(() => {
  fetchImages()
})
</script>

<style scoped>
.gallery-container {
  padding: 24px;
}

.toolbar {
  margin-bottom: 24px;
}

.gallery-content {
  margin-bottom: 24px;
}

.preview-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
}

.waterfall-container {
  column-count: 4;
  column-gap: 16px;
}

.waterfall-item {
  break-inside: avoid;
  margin-bottom: 16px;
}

.waterfall-item img {
  width: 100%;
  height: auto;
}

.card-container img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.pagination {
  text-align: center;
  margin-top: 24px;
}

@media (max-width: 768px) {
  .waterfall-container {
    column-count: 2;
  }

  .card-container .ant-col {
    width: 100%;
  }
}
</style>