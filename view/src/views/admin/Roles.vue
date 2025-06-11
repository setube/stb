<template>
  <div>
    <a-card title="角色管理">
      <a-form layout="inline" @submit.prevent="searchRoles">
        <a-form-item>
          <a-input v-model:value="searchKeyword" placeholder="搜索角色名" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="searchRoles">搜索</a-button>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="showCreateModal = true">新建角色</a-button>
        </a-form-item>
      </a-form>
      <a-table :dataSource="roles" :rowKey="r => r._id" style="margin-top: 16px">
        <a-table-column title="角色名" dataIndex="name" />
        <a-table-column title="描述" dataIndex="description" />
        <a-table-column title="上传方式" dataIndex="storageType" />
        <a-table-column title="默认角色" :customRender="(_, r) => (r.isDefault ? '是' : '否')" />
        <a-table-column title="操作" :customRender="(_, r) => actionRender(r)" />
      </a-table>
    </a-card>
    <!-- 新建角色弹窗 -->
    <a-modal v-model:visible="showCreateModal" title="新建角色" @ok="createRole">
      <a-form :model="createForm">
        <a-form-item label="角色名" required>
          <a-input v-model:value="createForm.name" />
        </a-form-item>
        <a-form-item label="描述">
          <a-input v-model:value="createForm.description" />
        </a-form-item>
        <a-form-item label="上传方式" required>
          <a-select v-model:value="createForm.storageType">
            <a-select-option v-for="item in storageTypes" :key="item.value" :value="item.value">
              {{ item.label }}
            </a-select-option>
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

  const roles = ref([])
  const searchKeyword = ref('')
  const showCreateModal = ref(false)
  const createForm = ref({
    name: '',
    description: '',
    storageType: 'local'
  })

  const storageTypes = [
    { value: 'local', label: '本地存储' },
    { value: 'oss', label: '阿里云OSS' },
    { value: 'cos', label: '腾讯云COS' },
    { value: 's3', label: 'S3兼容存储' },
    { value: 'qiniu', label: '七牛云' },
    { value: 'upyun', label: '又拍云' },
    { value: 'sftp', label: 'SFTP' },
    { value: 'ftp', label: 'FTP' },
    { value: 'webdav', label: 'WebDAV' },
    { value: 'telegram', label: 'Telegram' },
    { value: 'github', label: 'GitHub' }
  ]

  const fetchRoles = async () => {
    const { data } = await axios.get('/api/role')
    roles.value = data.roles
  }

  const searchRoles = async () => {
    const { data } = await axios.get('/api/role/search', { params: { keyword: searchKeyword.value } })
    roles.value = data.roles
  }

  const createRole = async () => {
    if (!createForm.value.name) {
      message.error('角色名不能为空')
      return
    }
    await axios.post('/api/role', createForm.value)
    message.success('角色创建成功')
    showCreateModal.value = false
    fetchRoles()
  }

  const deleteRole = async id => {
    Modal.confirm({
      title: '确认删除该角色？',
      onOk: async () => {
        await axios.delete(`/api/role/${id}`)
        message.success('删除成功')
        fetchRoles()
      }
    })
  }

  const setDefaultRole = async id => {
    await axios.post('/api/role/default', { roleId: id })
    message.success('默认角色设置成功')
    fetchRoles()
  }

  // const actionRender = r => [
  //   <a @click={() => setDefaultRole(r._id)} disabled={r.isDefault}>设为默认</a>,
  //   <a-divider type="vertical" />,
  //   <a @click={() => deleteRole(r._id)}>删除</a>
  // ]

  onMounted(fetchRoles)
</script>
