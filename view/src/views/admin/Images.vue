<template>
  <div class="images">
    <a-spin :spinning="loading">
      <el-table :data="images" :scrollbar-always-on="true" fit>
        <el-table-column label="预览" fixed>
          <template #default="{ row }">
            <a-image :src="userStore.config.site.url + row.thumb">
              <template #placeholder>
                <a-image :src="row.type == 'local' ? userStore.config.site.url + row.url : row.url" :preview="false" />
              </template>
            </a-image>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="文件名" />
        <el-table-column prop="md5" label="MD5" />
        <el-table-column prop="sha1" label="SHA-1" />
        <el-table-column sortable label="大小">
          <template #default="{ row }">
            {{ formatFileSize(row.size) }}
          </template>
        </el-table-column>
        <el-table-column label="类型">
          <template #default="{ row }">
            {{ imageStoreType[row.type] }}
          </template>
        </el-table-column>
        <template v-if="userStore.config?.ai?.enabled">
          <el-table-column label="健康状态">
            <template #default="{ row }">
              <a-tag :color="imageHealthStatus[row.safe]?.color">
                {{ imageHealthStatus[row.safe]?.text }}
              </a-tag>
            </template>
          </el-table-column>
          <el-table-column label="检测结果">
            <template #default="{ row }">
              <a-tag :color="imageCheckResult[row.label] ? imageCheckResult[row.label]?.color : imageHealthStatus[row.safe]?.color">
                {{ imageCheckResult[row.label] ? imageCheckResult[row.label]?.text : row.label }}
              </a-tag>
            </template>
          </el-table-column>
        </template>
        <el-table-column label="存储目录">
          <template #default="{ row }">
            {{ row.filePath }}
          </template>
        </el-table-column>
        <el-table-column label="上传者">
          <template #default="{ row }">
            {{ !row.user ? '游客' : row.user.username }}
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP地址" />
        <el-table-column sortable label="上传时间">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right">
          <template #default="{ row }">
            <a-button type="link" @click="copyImages($event, row, userStore)">
              复制
            </a-button>
            <a-button type="link" danger @click="handleDelete(row._id)">
              删除
            </a-button>
          </template>
        </el-table-column>
      </el-table>
    </a-spin>
    <a-pagination class="pagination" v-model:current="current" v-model:page-size="pageSizeRef" :total="total" show-size-changer @change="fetchImages">
    </a-pagination>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/stores/axios'
import { message, Modal } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import {
  formatDate, imageStoreType, formatFileSize,
  imageHealthStatus, imageCheckResult, copyImages
} from '@/stores/formatDate'
import ClipboardJS from 'clipboard'
import qs from 'qs'

const userStore = useUserStore()
const images = ref([])
const loading = ref(false)
const current = ref(1)
const pageSizeRef = ref(10)
const total = ref(0)

const fetchImages = async () => {
  loading.value = true
  images.value = []
  try {
    const { data } = await axios.post('/api/admin/images', qs.stringify({
      page: current.value,
      limit: pageSizeRef.value,
    }))
    total.value = data.total
    images.value.push(...data.images)
  } catch (error) {
    message.error('获取图片列表失败')
  } finally {
    loading.value = false
  }
}

const handleDelete = (id) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这张图片吗？',
    async onOk () {
      try {
        await axios.delete(`/api/admin/images/${id}`)
        message.success('删除成功')
        fetchImages()
      } catch (error) {
        message.error(error.response.data.error || '删除失败')
      }
    }
  })
}

onMounted(fetchImages)
</script>

<style scoped>
.images {
  padding: 20px;
  margin-bottom: 100px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>