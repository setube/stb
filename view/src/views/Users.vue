<template>
  <div class="users">
    <a-table :columns="columns" :data-source="users" :loading="loading" row-key="_id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 'active' ? 'green' : 'red'">
            {{ record.status === 'active' ? '活跃' : '禁用' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'role'">
          <a-tag :color="record.role === 'admin' ? 'blue' : 'default'">
            {{ record.role === 'admin' ? '管理员' : '用户' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" @click="handleStatusChange(record)">
              {{ record.status === 'active' ? '禁用' : '启用' }}
            </a-button>
            <a-button type="link" @click="handleRoleChange(record)">
              {{ record.role === 'admin' ? '设为用户' : '设为管理员' }}
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/stores/axios'
import { message } from 'ant-design-vue'

const users = ref([])
const loading = ref(false)

const columns = [
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username'
  },
  {
    title: 'IP地址',
    dataIndex: 'ip',
    key: 'ip'
  },
  {
    title: '注册邮箱',
    dataIndex: 'email',
    key: 'email'
  },
  {
    title: '角色',
    dataIndex: 'role',
    key: 'role'
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status'
  },
  {
    title: '注册时间',
    dataIndex: 'createdAt',
    key: 'createdAt'
  },
  {
    title: '最后登录',
    dataIndex: 'lastLogin',
    key: 'lastLogin'
  },
  {
    title: '操作',
    key: 'action'
  }
]

const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/admin/users')
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