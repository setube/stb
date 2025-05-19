<template>
  <div class="images">
    <a-table :columns="columns" :data-source="images" :loading="loading" row-key="_id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'preview'">
          <a-image :src="userStore.config.site.url + record.url" :alt="record.name" style="max-width: 100px" />
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" danger @click="handleDelete(record)">
            删除
          </a-button>
        </template>
      </template>
    </a-table>
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

const columns = [
  {
    title: '预览',
    key: 'preview'
  },
  {
    title: '文件名',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: '上传者',
    dataIndex: ['user', 'username'],
    key: 'username'
  },
  {
    title: '上传时间',
    dataIndex: 'createdAt',
    key: 'createdAt'
  },
  {
    title: '操作',
    key: 'action'
  }
]

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

const handleDelete = (record) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这张图片吗？',
    async onOk() {
      try {
        await axios.delete(`/api/admin/images/${record._id}`)
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