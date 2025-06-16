<template>
  <div class="images">
    <div class="header">
      <a-input-search
        v-model:value="searchQuery"
        placeholder="搜索文件名/MD5/SHA-1/备注/IP"
        style="width: 275px"
        @search="handleSearch"
        allow-clear
      />
    </div>
    <a-spin :spinning="loading">
      <el-table :data="images" scrollbar-always-on fit>
        <el-table-column label="预览" fixed>
          <template #default="{ row }">
            <a-image
              :src="userStore.config.site.url + row.thumb"
              :fallback="row.type === 'local' ? userStore.config.site.url + row.url : row.url"
              :preview="{
                src: row.type == 'local' ? userStore.config.site.url + row.url : row.url
              }"
            />
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
        <el-table-column prop="album" label="相册">
          <template #default="{ row }">
            {{ row.album?.name || '独立图片' }}
          </template>
        </el-table-column>
        <el-table-column prop="remarks" label="备注">
          <template #default="{ row }">
            {{ row.remarks || '暂无备注' }}
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
              <a-tag
                :color="
                  imageCheckResult[row.label] ? imageCheckResult[row.label]?.color : imageHealthStatus[row.safe]?.color
                "
              >
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
        <el-table-column prop="date" sortable label="上传时间">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="150">
          <template #default="{ row }">
            <a-button type="link" @click="copyImages($event, row, userStore)">复制</a-button>
            <a-button type="link" @click="showEditModal(row)">编辑</a-button>
            <a-button type="link" danger @click="handleDelete(row._id)">删除</a-button>
          </template>
        </el-table-column>
      </el-table>
    </a-spin>
    <a-pagination
      class="pagination"
      v-model:current="current"
      v-model:page-size="pageSizeRef"
      :total="total"
      show-size-changer
      @change="fetchImages"
    />
    <a-modal
      v-model:open="editModalVisible"
      title="编辑图片"
      @ok="handleUpdateImage"
      @cancel="editModalVisible = false"
    >
      <a-form :model="editForm" :rules="editRules" layout="vertical">
        <a-form-item label="备注" name="remarks">
          <a-textarea v-model:value="editForm.remarks" placeholder="添加图片备注" :rows="4" />
        </a-form-item>
        <a-form-item label="图片方向" name="orientation">
          <a-select v-model:value="editForm.orientation" style="width: 100%" :disabled="editForm.type !== 'local'">
            <a-select-option value="0">原始方向</a-select-option>
            <a-select-option value="90">顺时针旋转90°</a-select-option>
            <a-select-option value="-90">逆时针旋转90°</a-select-option>
            <a-select-option value="180">旋转180°</a-select-option>
            <a-select-option value="270">顺时针旋转270°</a-select-option>
            <a-select-option value="-270">逆时针旋转270°</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import axios from '@/stores/axios'
  import { message, Modal } from 'ant-design-vue'
  import { useUserStore } from '@/stores/user'
  import {
    formatDate,
    imageStoreType,
    formatFileSize,
    imageHealthStatus,
    imageCheckResult,
    copyImages
  } from '@/stores/formatDate'
  import qs from 'qs'

  const userStore = useUserStore()
  const images = ref([])
  const loading = ref(false)
  const current = ref(1)
  const pageSizeRef = ref(10)
  const total = ref(0)

  // 搜索和过滤相关的状态
  const searchQuery = ref('')

  // 编辑图片相关的状态
  const editModalVisible = ref(false)
  const editForm = ref({
    _id: '',
    remarks: '',
    orientation: '0'
  })

  // 编辑表单的验证规则
  const editRules = {
    remarks: [
      { max: 500, message: '备注不能超过500个字符', trigger: 'blur' } // 可选的长度限制
    ]
  }

  // 获取图片列表 (修改以包含搜索和过滤参数)
  const fetchImages = async () => {
    loading.value = true
    images.value = []
    try {
      const { data } = await axios.post(
        '/api/admin/images',
        qs.stringify({
          page: current.value,
          limit: pageSizeRef.value,
          searchQuery: searchQuery.value
        })
      )
      total.value = data.total
      images.value.push(...data.images)
    } catch ({ response }) {
      message.error(response?.data?.error)
    } finally {
      loading.value = false
    }
  }

  // 处理搜索
  const handleSearch = () => {
    current.value = 1
    fetchImages()
  }

  const handleDelete = id => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这张图片吗？',
      async onOk() {
        try {
          await axios.delete(`/api/admin/images/${id}`)
          message.success('删除成功')
          fetchImages()
        } catch ({ response }) {
          message.error(response?.data?.error)
        }
      }
    })
  }

  // 显示编辑图片弹窗并填充数据
  const showEditModal = record => {
    editForm.value = record
    editForm.value.orientation = '0'
    editModalVisible.value = true
  }

  // 处理更新图片数据
  const handleUpdateImage = async () => {
    try {
      const { _id, remarks, orientation } = editForm.value
      await axios.patch(`/api/admin/images/${_id}`, {
        remarks,
        orientation: parseInt(orientation)
      })
      message.success('图片数据更新成功')
      editModalVisible.value = false
      fetchImages()
    } catch ({ response }) {
      message.error(response?.data?.error)
    }
  }

  onMounted(fetchImages)
</script>

<style scoped>
  .images {
    padding: 20px;
    margin-bottom: 100px;
  }

  .header {
    margin-bottom: 20px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
</style>
