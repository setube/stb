<template>
  <div class="announcements">
    <div class="header">
      <a-button type="primary" @click="showCreateDialog">创建公告</a-button>
    </div>
    <a-spin :spinning="spinning">
      <el-table :data="announcements" scrollbar-always-on fit>
        <el-table-column prop="title" label="标题" fixed />
        <el-table-column label="类型">
          <template #default="{ row }">
            {{ row.type === 'modal' ? '弹窗' : '提示' }}
          </template>
        </el-table-column>
        <el-table-column label="主题">
          <template #default="{ row }">
            <el-tag :type="row.effect" disable-transitions>{{ row.effect }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" sortable label="开始时间">
          <template #default="{ row }">
            {{ formatDate(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="endTime" sortable label="结束时间">
          <template #default="{ row }">
            {{ formatDate(row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="nextTime" sortable label="下次显示时间">
          <template #default="{ row }">{{ row.nextTime }}天</template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" disable-transitions>
              {{ row.isActive ? '有效' : '无效' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="showEditDialog(row)">编辑</el-button>
            <a-popconfirm title="确定要删除这条公告吗？" ok-text="确定" cancel-text="取消" @confirm="handleDelete(row)">
              <el-button type="danger" link>删除</el-button>
            </a-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </a-spin>
    <a-modal
      :title="dialogType === 'create' ? '创建公告' : '编辑公告'"
      v-model:open="dialogVisible"
      @ok="handleSubmit"
      @cancel="dialogVisible = false"
    >
      <a-form :model="form" layout="vertical">
        <a-form-item label="标题" required>
          <a-input v-model:value="form.title" placeholder="请输入公告标题" />
        </a-form-item>
        <a-form-item label="内容" required>
          <a-textarea
            v-model:value="form.content"
            placeholder="请输入公告内容, 支持HTML, 不支持输出<style>标签和<script>标签"
            :auto-size="{ minRows: 4 }"
          />
        </a-form-item>
        <a-form-item label="类型" required>
          <a-select v-model:value="form.type" placeholder="请选择公告类型">
            <a-select-option value="modal">弹窗</a-select-option>
            <a-select-option value="alert">提示</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="主题" required>
          <a-select v-model:value="form.effect" placeholder="请选择公告主题">
            <a-select-option v-for="item in effect" :value="item" :key="item">{{ item }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="开始时间" required>
          <a-date-picker style="width: 100%" v-model:value="form.startTime" format="YYYY/MM/DD HH:mm:ss" />
        </a-form-item>
        <a-form-item label="结束时间" required>
          <a-date-picker style="width: 100%" v-model:value="form.endTime" format="YYYY/MM/DD HH:mm:ss" />
        </a-form-item>
        <a-form-item label="关闭公告后多久显示" required>
          <a-input-number style="width: 100%" v-model:value="form.nextTime" placeholder="请输入天数" :min="1">
            <template #addonAfter>天</template>
          </a-input-number>
        </a-form-item>
        <a-form-item label="公告状态">
          <a-switch v-model:checked="form.isActive" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { message } from 'ant-design-vue'
  import axios from '@/stores/axios'
  import dayjs from 'dayjs'
  import { formatDate } from '@/stores/formatDate'

  const announcements = ref([])
  const dialogVisible = ref(false)
  const dialogType = ref('create')
  const spinning = ref(true)
  const form = ref({
    title: '',
    content: '',
    type: 'modal',
    startTime: null,
    endTime: null,
    nextTime: null,
    isActive: true
  })
  const effect = ['primary', 'success', 'info', 'warning', 'error']

  // 获取公告列表
  const fetchAnnouncements = async () => {
    spinning.value = true
    try {
      const { data } = await axios.post('/api/admin/announcements')
      announcements.value = data
    } catch ({ response }) {
      message.error(response?.data?.error)
    } finally {
      spinning.value = false
    }
  }

  // 显示创建对话框
  const showCreateDialog = () => {
    dialogType.value = 'create'
    form.value = {}
    dialogVisible.value = true
  }

  // 显示编辑对话框
  const showEditDialog = row => {
    dialogType.value = 'edit'
    form.value = row
    form.value.startTime = row.startTime ? dayjs(row.startTime) : null
    form.value.endTime = row.endTime ? dayjs(row.endTime) : null
    dialogVisible.value = true
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      if (dialogType.value === 'create') {
        await axios.post('/api/admin/announcements/new', form.value)
        message.success('创建成功')
      } else {
        await axios.put(`/api/admin/announcements/${form.value._id}`, form.value)
        message.success('更新成功')
      }
      dialogVisible.value = false
      fetchAnnouncements()
    } catch ({ response }) {
      message.error(response?.data?.error)
    }
  }

  // 删除公告
  const handleDelete = async row => {
    try {
      await axios.delete(`/api/admin/announcements/${row._id}`)
      message.success('删除成功')
      fetchAnnouncements()
    } catch ({ response }) {
      message.error(response?.data?.error)
    }
  }

  onMounted(() => {
    fetchAnnouncements()
  })
</script>

<style scoped>
  .announcements {
    padding: 20px;
  }

  .header {
    margin-bottom: 20px;
    display: flex;
    justify-content: flex-end;
  }
</style>
