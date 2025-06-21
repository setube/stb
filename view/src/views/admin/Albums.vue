<template>
  <div class="admin-albums">
    <!-- 搜索区域 -->
    <div class="search-area">
      <a-input-search v-model:value="userName" allowClear placeholder="输入用户名搜索" @search="fetchAlbums" />
      <a-input-search v-model:value="name" allowClear placeholder="输入相册名称" @search="fetchAlbums">
        <template #addonBefore>
          <a-select v-model:value="permission">
            <a-select-option value="">全部</a-select-option>
            <a-select-option value="public">公开</a-select-option>
            <a-select-option value="private">私有</a-select-option>
          </a-select>
        </template>
      </a-input-search>
      <a-button type="primary" @click="showCreateModal">新建相册</a-button>
    </div>
    <a-spin :spinning="loading">
      <el-table :data="albums" scrollbar-always-on fit>
        <el-table-column prop="_id" show-overflow-tooltip label="相册ID" />
        <el-table-column prop="name" show-overflow-tooltip label="相册名称" />
        <el-table-column label="所属用户">
          <template #default="{ row }">
            {{ row.user.username }}
          </template>
        </el-table-column>
        <el-table-column label="权限">
          <template #default="{ row }">
            {{ row.permission === 'public' ? '公开' : '私有' }}
          </template>
        </el-table-column>
        <el-table-column prop="imageCount" sortable label="图片数量" />
        <el-table-column prop="createdAt" show-overflow-tooltip sortable label="创建时间">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" show-overflow-tooltip sortable label="最后修改时间">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right">
          <template #default="{ row }">
            <a-button type="link" @click="showEditModal(row)">编辑</a-button>
            <a-button type="link" danger @click="showConfirm(row)">删除</a-button>
          </template>
        </el-table-column>
      </el-table>
      <a-pagination
        class="pagination"
        v-model:current="current"
        v-model:pageSize="limit"
        :total="total"
        show-size-changer
        @change="fetchAlbums"
      />
    </a-spin>
    <a-modal v-model:open="modalVisible" :title="modalType === 'create' ? '新建相册' : '编辑相册'" @ok="handleModalOk">
      <a-form :model="albumForm" :rules="rules" layout="vertical" ref="formRef">
        <a-form-item label="用户" name="userId" v-if="modalType === 'create'">
          <a-select
            v-model:value="albumForm.userId"
            show-search
            placeholder="请选择用户"
            :default-active-first-option="false"
            :show-arrow="false"
            :filter-option="false"
            :not-found-content="null"
            :loading="userSearchLoading"
            :options="userOptions"
            @search="searchUser"
          ></a-select>
        </a-form-item>
        <a-form-item label="相册名称" name="name">
          <a-input v-model:value="albumForm.name" show-count :maxlength="10" placeholder="请输入相册名称" />
        </a-form-item>
        <a-form-item label="权限" name="permission">
          <a-select v-model:value="albumForm.permission">
            <a-select-option value="public">公开</a-select-option>
            <a-select-option value="private">私有</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { message, Modal } from 'ant-design-vue'
  import axios from '@/stores/axios'
  import { formatDate } from '@/stores/formatDate'
  import qs from 'qs'

  // 状态变量
  const albums = ref([])
  const loading = ref(false)
  const modalVisible = ref(false)
  const modalType = ref('create')
  const formRef = ref(null)
  const userSearchLoading = ref(false)
  const userOptions = ref([])

  // 搜索相关状态
  const userName = ref('')
  const name = ref('')
  const permission = ref('')

  // 分页相关状态
  const current = ref(1)
  const total = ref(0)
  const limit = ref(10)

  // 表单数据
  const albumForm = ref({
    userId: undefined,
    name: '',
    permission: 'private'
  })

  // 表单验证规则
  const rules = {
    userId: [{ required: true, message: '请选择用户' }],
    name: [{ required: true, message: '请输入相册名称' }],
    permission: [{ required: true, message: '请选择权限' }]
  }

  // 获取相册列表
  const fetchAlbums = async () => {
    loading.value = true
    try {
      const { data } = await axios.post(
        '/api/admin/albums',
        qs.stringify({
          page: current.value,
          limit: limit.value,
          name: name.value,
          username: userName.value,
          permission: permission.value
        })
      )
      albums.value = data.albums
      total.value = data.total
    } catch ({ response }) {
      message.error(response?.data?.error)
    } finally {
      loading.value = false
    }
  }

  // 搜索用户
  const searchUser = async value => {
    if (!value) return
    userSearchLoading.value = true
    try {
      const { data } = await axios.post(
        '/api/admin/users/search',
        qs.stringify({
          username: value
        })
      )
      userOptions.value = data.users
    } catch ({ response }) {
      message.error(response?.data?.error)
    } finally {
      userSearchLoading.value = false
    }
  }

  // 显示新建弹窗
  const showCreateModal = () => {
    modalType.value = 'create'
    albumForm.value = {
      userId: undefined,
      name: '',
      permission: 'private'
    }
    modalVisible.value = true
  }

  // 显示编辑弹窗
  const showEditModal = record => {
    modalType.value = 'edit'
    albumForm.value = {
      ...record,
      userId: record.user._id
    }
    modalVisible.value = true
  }

  // 处理弹窗确认
  const handleModalOk = async () => {
    try {
      if (modalType.value === 'create') {
        await axios.post('/api/admin/albums/new', albumForm.value)
        message.success('创建相册成功')
      } else {
        await axios.put(`/api/admin/albums/${albumForm.value._id}`, albumForm.value)
        message.success('更新相册成功')
      }
      modalVisible.value = false
      fetchAlbums()
    } catch ({ response }) {
      message.error(response?.data?.error)
    }
  }

  // 处理删除
  const handleDelete = async record => {
    try {
      await axios.delete(`/api/admin/albums/${record._id}`)
      message.success('删除相册成功')
      fetchAlbums()
    } catch ({ response }) {
      message.error(response?.data?.error)
    }
  }

  const showConfirm = async record => {
    Modal.confirm({
      title: '确定要删除这个相册吗？',
      content: '删除相册不会删除相册内的图片的实际文件',
      async onOk() {
        try {
          await axios.delete(`/api/admin/albums/${record._id}`)
          message.success('删除相册成功')
          fetchAlbums()
        } catch ({ response }) {
          message.error(response?.data?.error)
        }
      }
    })
  }

  onMounted(fetchAlbums)
</script>

<style scoped>
  .admin-albums {
    padding: 24px;
  }

  .search-area {
    margin-bottom: 24px;
    display: flex;
    flex-wrap: wrap;
    justify-content: end;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .ant-input-search {
    width: 240px;
    margin: 0 10px 10px 0;
  }

  @media (max-width: 768px) {
    .ant-input-search {
      width: 100%;
    }
  }
</style>
