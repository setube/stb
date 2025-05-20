<template>
  <div class="images">
    <el-table :data="images" :scrollbar-always-on="true" fit>
      <el-table-column prop="url" label="预览" fixed>
        <template #default="{ row }">
          <a-image :src="userStore.config.site.url + row.url" :alt="row.name" style="max-width: 100px" />
        </template>
      </el-table-column>
      <el-table-column prop="name" label="文件名" />
      <el-table-column prop="size" label="大小">
        <template #default="{ row }">
          {{ formatFileSize(row.size) }}
        </template>
      </el-table-column>
      <el-table-column prop="name" label="上传者">
        <template #default="{ row }">
          {{ row.user.username  }}
        </template>
      </el-table-column>
      <el-table-column prop="date" label="上传时间" />
      <el-table-column label="操作" fixed="right">
        <template #default="{ row }">
          <a-button type="link" danger @click="handleDelete(row._id)">
            删除
          </a-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/stores/axios'
import { message, Modal } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const images = ref([])
const loading = ref(false)

const fetchImages = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/admin/images')
    images.value = response.data
  } catch (error) {
    message.error('获取图片列表失败')
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

const handleDelete = (id) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这张图片吗？',
    async onOk() {
      try {
        await axios.delete(`/api/admin/images/${id}`)
        message.success('删除成功')
        fetchImages()
      } catch (error) {
        message.error('删除失败')
      }
    }
  })
}

onMounted(fetchImages)
</script>

<style scoped>
.images {
  padding: 20px;
}
</style>