<template>
  <div class="users">
    <div class="header">
      <a-input-search v-model:value="userName" allowClear placeholder="输入用户名搜索" @search="fetchUsers" />
      <a-button type="primary" @click="showCreateModal">创建用户</a-button>
    </div>
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
            <a-button type="link" @click="showEditModal(row)">编辑</a-button>
            <a-button type="link" danger @click="handleDeleteOne(row)" :disabled="row.founder">删除</a-button>
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
      @change="fetchUsers"
    />
    <a-modal v-model:open="createModalVisible" title="创建用户" @ok="handleCreate" @cancel="createModalVisible = false">
      <a-form :model="createForm" :rules="rules" layout="vertical" ref="createFormRef">
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="createForm.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="邮箱" name="email">
          <a-input v-model:value="createForm.email" placeholder="请输入邮箱" />
        </a-form-item>
        <a-form-item label="密码" name="password">
          <a-input-password v-model:value="createForm.password" placeholder="请输入密码" />
        </a-form-item>
        <a-form-item label="权限" name="role">
          <a-select v-model:value="createForm.role">
            <a-select-option value="user">用户</a-select-option>
            <a-select-option value="admin">管理员</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
    <a-modal v-model:open="editModalVisible" title="编辑用户" @ok="handleUpdate" @cancel="editModalVisible = false">
      <a-form :model="editForm" :rules="editRules" layout="vertical" ref="editFormRef">
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="editForm.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="邮箱" name="email">
          <a-input v-model:value="editForm.email" placeholder="请输入邮箱" />
        </a-form-item>
        <a-form-item label="权限" name="role">
          <a-select v-model:value="editForm.role" :disabled="editForm.founder">
            <a-select-option value="user">用户</a-select-option>
            <a-select-option value="admin">管理员</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-select v-model:value="editForm.status" :disabled="editForm.founder">
            <a-select-option value="active">正常</a-select-option>
            <a-select-option value="disabled">封号</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="新密码" name="password">
          <a-input-password v-model:value="editForm.password" placeholder="留空则不修改密码" />
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

  const users = ref([])
  const loading = ref(false)
  const current = ref(1)
  const pageSizeRef = ref(10)
  const total = ref(0)

  const userName = ref('')
  // 创建用户相关的状态
  const createModalVisible = ref(false)
  const createFormRef = ref(null)
  const createForm = ref({
    username: '',
    email: '',
    password: '',
    role: 'user'
  })

  // 编辑用户相关的状态
  const editModalVisible = ref(false)
  const editFormRef = ref(null)
  const editForm = ref({
    _id: '',
    username: '',
    email: '',
    role: '',
    status: '',
    founder: false,
    password: ''
  })

  // 表单验证规则
  const rules = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 3, max: 20, message: '用户名长度应在3-20个字符之间', trigger: 'blur' }
    ],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
    ],
    role: [{ required: true, message: '请选择角色', trigger: 'change' }]
  }

  // 编辑表单的验证规则
  const editRules = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 3, max: 20, message: '用户名长度应在3-20个字符之间', trigger: 'blur' }
    ],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    role: [{ required: true, message: '请选择角色', trigger: 'change' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
    password: [{ min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }]
  }

  // 获取用户列表
  const fetchUsers = async () => {
    loading.value = true
    users.value = []
    try {
      const { data } = await axios.post(
        '/api/admin/users',
        qs.stringify({
          page: current.value,
          limit: pageSizeRef.value,
          username: userName.value
        })
      )
      total.value = data.total
      users.value.push(...data.users)
    } catch ({ response }) {
      message.error(response?.data?.error)
    } finally {
      loading.value = false
    }
  }

  const handleDeleteOne = async record => {
    if (record.founder) {
      message.error('无法删除创始人账号')
      return
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 "${record.username}" 的账号吗？`,
      async onOk() {
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

  // 显示创建用户弹窗
  const showCreateModal = () => {
    createForm.value = {
      username: '',
      email: '',
      password: '',
      role: 'user'
    }
    createModalVisible.value = true
    if (createFormRef.value) {
      createFormRef.value.resetFields()
    }
  }

  // 处理创建用户
  const handleCreate = async () => {
    try {
      await createFormRef.value.validate()
      await axios.post('/api/admin/users/create', createForm.value)
      message.success('用户创建成功')
      createModalVisible.value = false
      fetchUsers()
    } catch ({ response }) {
      message.error(response?.data?.error)
    }
  }

  // 显示编辑用户弹窗并填充数据
  const showEditModal = record => {
    editForm.value = {
      _id: record._id,
      username: record.username,
      email: record.email,
      role: record.role,
      status: record.status,
      founder: record.founder,
      password: ''
    }
    editModalVisible.value = true
    if (editFormRef.value) {
      editFormRef.value.resetFields()
    }
  }

  // 处理更新用户数据
  const handleUpdate = async () => {
    try {
      await editFormRef.value.validate()
      const userId = editForm.value._id
      const updates = {
        username: editForm.value.username,
        email: editForm.value.email,
        role: editForm.value.role,
        status: editForm.value.status
      }
      if (editForm.value.password) {
        updates.password = editForm.value.password
      }
      if (editForm.value.founder) {
        delete updates.role
        delete updates.status
      }
      await axios.patch(`/api/admin/users/${userId}`, updates)
      message.success('用户数据更新成功')
      editModalVisible.value = false
      fetchUsers()
    } catch ({ response }) {
      message.error(response?.data?.error)
    }
  }

  onMounted(fetchUsers)
</script>

<style scoped>
  .users {
    padding: 20px;
    margin-bottom: 100px;
  }

  .header {
    margin-bottom: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .ant-input-search {
    width: 200px;
    margin-right: 10px;
  }
</style>
