<template>
  <div class="invite-codes">
    <div class="header">
      <a-button type="primary" @click="showGenerateModal">生成邀请码</a-button>
      <a-button @click="handleExport" :disabled="!codes.length">导出邀请码</a-button>
    </div>
    <a-spin :spinning="loading">
      <el-table :data="codes" :scrollbar-always-on="true" fit>
        <el-table-column prop="code" label="邀请码" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <a-tag :color="row.status === 'unused' ? 'green' : 'blue'">
              {{ row.status === 'unused' ? '未使用' : '已使用' }}
            </a-tag>
          </template>
        </el-table-column>
        <el-table-column prop="usedBy" label="使用人">
          <template #default="{ row }">
            {{ row.usedBy ? row.usedBy.username : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="usedAt" label="使用时间">
          <template #default="{ row }">
            {{ row.usedAt ? formatDate(row.usedAt) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="生成时间">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="100">
          <template #default="{ row }">
            <a-button type="link" danger @click="handleDeleteCode(row)">删除</a-button>
          </template>
        </el-table-column>
      </el-table>
    </a-spin>
    <a-pagination
      class="pagination"
      v-model:current="current"
      v-model:page-size="pageSize"
      :total="total"
      show-size-changer
      @change="fetchCodes"
    />
    <!-- 生成邀请码弹窗 -->
    <a-modal
      v-model:open="generateModalVisible"
      title="生成邀请码"
      @ok="handleGenerate"
      @cancel="generateModalVisible = false"
    >
      <a-form :model="generateForm" :rules="rules" ref="generateFormRef">
        <a-form-item label="生成数量" name="count">
          <a-input-number v-model:value="generateForm.count" :min="1" :max="100" placeholder="请输入生成数量" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import axios from '@/stores/axios'
  import { formatDate } from '@/stores/formatDate'
  import { message, Modal } from 'ant-design-vue'
  import qs from 'qs'

  const codes = ref([])
  const loading = ref(false)
  const current = ref(1)
  const pageSize = ref(10)
  const total = ref(0)

  // 生成邀请码相关的状态
  const generateModalVisible = ref(false)
  const generateFormRef = ref(null)
  const generateForm = ref({
    count: 1
  })

  // 表单验证规则
  const rules = {
    count: [
      { required: true, message: '请输入生成数量', trigger: 'blur' },
      { type: 'number', min: 1, max: 100, message: '数量应在1-100之间', trigger: 'blur' }
    ]
  }

  // 获取邀请码列表
  const fetchCodes = async () => {
    loading.value = true
    try {
      const { data } = await axios.post(
        '/api/admin/invite-codes',
        qs.stringify({
          page: current.value,
          limit: pageSize.value
        })
      )
      total.value = data.total
      codes.value = data.codes
    } catch ({ response }) {
      message.error(response?.data?.error)
    } finally {
      loading.value = false
    }
  }

  // 显示生成邀请码弹窗
  const showGenerateModal = () => {
    generateForm.value = { count: 1 }
    generateModalVisible.value = true
  }

  // 处理生成邀请码
  const handleGenerate = async () => {
    try {
      await generateFormRef.value.validate()
      await axios.post('/api/admin/invite-codes/generate', generateForm.value)
      message.success('邀请码生成成功')
      generateModalVisible.value = false
      fetchCodes()
    } catch ({ response }) {
      message.error(response?.data?.error)
    }
  }

  // 处理导出邀请码
  const handleExport = async () => {
    try {
      const response = await axios.get('/api/admin/invite-codes/export', {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'invite-codes.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch ({ response }) {
      message.error(response?.data?.error)
    }
  }

  // 处理删除邀请码
  const handleDeleteCode = record => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除邀请码 "${record.code}" 吗？`,
      async onOk() {
        try {
          await axios.delete(`/api/admin/invite-codes/${record._id}`)
          message.success('邀请码已删除')
          fetchCodes() // 刷新列表
        } catch ({ response }) {
          message.error(response?.data?.error)
        }
      }
    })
  }

  onMounted(fetchCodes)
</script>

<style scoped>
  .invite-codes {
    padding: 20px;
    margin-bottom: 100px;
  }

  .header {
    margin-bottom: 20px;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
</style>
