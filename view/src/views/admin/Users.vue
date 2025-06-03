<template>
  <div class="users">
    <a-spin :spinning="loading">
      <el-table :data="users" :scrollbar-always-on="true" fit>
        <el-table-column prop="username" label="用户名" fixed />
        <el-table-column prop="name" label="IP地址">
          <template #default="{ row }">
            {{ row.ip?.ipv4 || row.ip?.ipv6 }}
          </template>
        </el-table-column>
        <el-table-column prop="email" label="注册邮箱" />
        <el-table-column prop="role" label="角色">
          <template #default="{ row }">
            {{ row.role === 'admin' ? '管理员' : '注册用户' }}
          </template>
        </el-table-column>
        <el-table-column prop="date" label="状态">
          <template #default="{ row }">
            <a-tag :color="row.status === 'active' ? 'green' : 'red'">
              {{ row.status === 'active' ? '正常' : '封号' }}
            </a-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" sortable label="注册时间">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="lastLogin" sortable label="最后登录">
          <template #default="{ row }">
            {{ formatDate(row.lastLogin) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right">
          <template #default="{ row }">
            <a-button type="link" @click="handleStatusChange(row)">
              {{ row.status === 'active' ? '封禁账号' : '解封账号' }}
            </a-button>
            <a-button type="link" @click="handleRoleChange(row)">
              {{ row.role === 'admin' ? '设为用户' : '设为管理' }}
            </a-button>
            <a-button type="link" danger @click="handleDeleteOne(row)">删除账号</a-button>
          </template>
        </el-table-column>
      </el-table>
    </a-spin>
    <a-pagination class="pagination" v-model:current="current" v-model:page-size="pageSizeRef" :total="total" show-size-changer @change="fetchUsers" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/stores/axios'
import { formatDate } from '@/stores/formatDate'
import { message, Modal } from 'ant-design-vue'
import qs from 'qs'

const users = ref([])
const loading = ref(false)
const current = ref(1)
const pageSizeRef = ref(10)
const total = ref(0)

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  users.value = []
  try {
    const { data } = await axios.post('/api/admin/users', qs.stringify({
      page: current.value,
      limit: pageSizeRef.value,
    }))
    total.value = data.total
    users.value.push(...data.users)
  } catch ({ response }) {
    message.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 更新用户状态
const handleStatusChange = async (record) => {
  try {
    const status = record.status === 'active' ? 'disabled' : 'active'
    await axios.patch(`/api/admin/users/${record._id}/status`, { status })
    message.success('状态更新成功')
    fetchUsers()
  } catch ({ response }) {
    message.error(response?.data?.error)
  }
}

// 更新用户权限
const handleRoleChange = async (record) => {
  try {
    const role = record.role === 'admin' ? 'user' : 'admin'
    await axios.patch(`/api/admin/users/${record._id}/role`, { role })
    message.success('权限更新成功')
    fetchUsers()
  } catch ({ response }) {
    message.error(response?.data?.error)
  }
}

const handleDeleteOne = async (record) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除该用户的账号吗？',
    async onOk () {
      try {
        await axios.delete(`/api/admin/users/${record._id}`)
        message.success('该账号已删除')
        fetchUsers()
      } catch ({ response }) {
        message.error(response?.data?.error)
      }
    }
  })
}

onMounted(fetchUsers)
</script>

<style scoped>
.users {
  padding: 20px;
  margin-bottom: 100px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>