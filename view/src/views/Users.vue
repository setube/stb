<template>
  <div class="users">
    <el-table :data="users" :scrollbar-always-on="true" fit v-loading="loading">
      <el-table-column prop="username" label="用户名" fixed />
      <el-table-column prop="name" label="IP地址">
        <template #default="{ row }">
          {{ row.ip.ipv4 || row.ip.ipv6 }}
        </template>
      </el-table-column>
      <el-table-column prop="email" label="注册邮箱" />
      <el-table-column prop="role" label="角色">
        <template #default="{ row }">
          {{ row.role === 'admin' ? '管理员' : '用户' }}
        </template>
      </el-table-column>
      <el-table-column prop="date" label="状态">
        <template #default="{ row }">
          <a-tag :color="row.status === 'active' ? 'green' : 'red'">
            {{ row.status === 'active' ? '活跃' : '禁用' }}
          </a-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="注册时间">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="lastLogin" label="最后登录">
        <template #default="{ row }">
          {{ formatDate(row.lastLogin) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right">
        <template #default="{ row }">
          <a-button type="link" @click="handleStatusChange(row)">
            {{ row.status === 'active' ? '禁用' : '启用' }}
          </a-button>
          <a-button type="link" @click="handleRoleChange(row)">
            {{ row.role === 'admin' ? '设为用户' : '设为管理员' }}
          </a-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/stores/axios'
import { formatDate } from '@/stores/formatDate'
import { message } from 'ant-design-vue'

const users = ref([])
const loading = ref(false)

const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await axios.post('/api/admin/users')
    users.value = response.data
  } catch (error) {
    message.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleStatusChange = async (record) => {
  try {
    const newStatus = record.status === 'active' ? 'disabled' : 'active'
    await axios.patch(`/api/admin/users/${record._id}/status`, { status: newStatus })
    message.success('状态更新成功')
    fetchUsers()
  } catch (error) {
    message.error(error?.response?.data?.error)
  }
}

const handleRoleChange = async (record) => {
  try {
    const newRole = record.role === 'admin' ? 'user' : 'admin'
    await axios.patch(`/api/admin/users/${record._id}/role`, { role: newRole })
    message.success('角色更新成功')
    fetchUsers()
  } catch (error) {
    message.error(error?.response?.data?.error)
  }
}

onMounted(fetchUsers)
</script>

<style scoped>
.users {
  padding: 20px;
}
</style>