<template>
  <div class="role-groups-container">
    <a-spin :spinning="loading">
      <div class="header">
        <a-button type="primary" @click="showRoleGroupModal('', false)">创建角色组</a-button>
      </div>
      <el-table :data="roleGroups" scrollbar-always-on fit>
        <el-table-column prop="name" label="名称" fixed />
        <el-table-column prop="description" label="描述" />
        <el-table-column label="管理组">
          <template #default="{ row }">
            <a-tag :color="row.isAdmin ? 'green' : 'default'">
              {{ row.isAdmin ? '是' : '否' }}
            </a-tag>
          </template>
        </el-table-column>
        <el-table-column label="默认组">
          <template #default="{ row }">
            <a-tag :color="row.isDefault ? 'green' : 'default'">
              {{ row.isDefault ? '是' : '否' }}
            </a-tag>
          </template>
        </el-table-column>
        <el-table-column label="游客组">
          <template #default="{ row }">
            <a-tag :color="row.isGuest ? 'green' : 'default'">
              {{ row.isGuest ? '是' : '否' }}
            </a-tag>
          </template>
        </el-table-column>
        <el-table-column prop="maxCapacity" sortable label="可用容量">
          <template #default="{ row }">{{ row.maxCapacity }}MB</template>
        </el-table-column>
        <el-table-column prop="createdAt" sortable label="创建时间">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" sortable label="编辑时间">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right">
          <template #default="{ row }">
            <a-button type="link" @click="showRoleGroupModal(row._id, true)">编辑</a-button>
            <a-popconfirm title="确定要删除这个角色组吗？" @confirm="handleDelete(row)">
              <a-button type="link" danger>删除</a-button>
            </a-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <a-modal
        class="RoleGroups-model"
        v-model:open="modalVisible"
        :title="editingRoleGroup ? '编辑角色组' : '创建角色组'"
        @ok="handleSubmit"
        :confirmLoading="submitting"
        :key="modalVisible"
      >
        <a-form :model="formState" layout="vertical">
          <a-form-item label="名称" required>
            <a-input v-model:value="formState.name" placeholder="输入角色组名称" />
          </a-form-item>
          <a-form-item label="描述">
            <a-textarea v-model:value="formState.description" placeholder="输入角色组描述" />
          </a-form-item>
          <a-form-item label="是否为管理组">
            <a-switch v-model:checked="formState.isAdmin" />
          </a-form-item>
          <a-form-item label="是否为默认组">
            <a-switch v-model:checked="formState.isDefault" />
          </a-form-item>
          <a-form-item label="是否为游客组">
            <a-switch v-model:checked="formState.isGuest" />
          </a-form-item>
          <a-form-item label="可用容量(MB)" v-if="!formState.isGuest" required>
            <a-input-number style="width: 100%" v-model:value="formState.maxCapacity" />
            <p>该设置项在游客组下无效</p>
          </a-form-item>
          <a-form-item label="存储类型">
            <a-select v-model:value="formState.upload.storageType">
              <a-select-option v-for="(item, index) in imageStoreArray" :value="item.value" :key="index">
                {{ item.label }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-collapse v-model:activeKey="activeKey">
            <a-collapse-panel key="1" header="上传设置">
              <a-form-item label="允许的图片格式" required>
                <a-select
                  v-model:value="formState.upload.allowedFormats"
                  mode="multiple"
                  placeholder="选择允许的图片格式"
                >
                  <a-select-option :value="item" v-for="item in imageExitType" :key="item">
                    {{ item.toUpperCase() }}
                  </a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="最大文件大小(MB)" required>
                <a-input-number style="width: 100%" v-model:value="formState.upload.maxSize" :min="1" :max="100" />
              </a-form-item>
              <a-form-item label="最多同时上传图片数量" required>
                <a-input-number style="width: 100%" v-model:value="formState.upload.concurrentUploads" :min="1" />
              </a-form-item>
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="最小宽度(px)" required>
                    <a-input-number v-model:value="formState.upload.minWidth" :min="0" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="最小高度(px)" required>
                    <a-input-number v-model:value="formState.upload.minHeight" :min="0" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="最大宽度(px)" required>
                    <a-input-number v-model:value="formState.upload.maxWidth" :min="0" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="最大高度(px)" required>
                    <a-input-number v-model:value="formState.upload.maxHeight" :min="0" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-form-item label="转换格式" required>
                <a-select v-model:value="formState.upload.convertFormat" allowClear placeholder="选择转换格式">
                  <a-select-option value="">不转换</a-select-option>
                  <a-select-option :value="item" v-for="item in imageExitType" :key="item">
                    {{ item.toUpperCase() }}
                  </a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="图片压缩" required>
                <a-switch
                  v-model:checked="formState.upload.qualityOpen"
                  checked-children="启用"
                  un-checked-children="禁用"
                />
              </a-form-item>
              <a-form-item label="图片质量" required v-if="formState.upload.qualityOpen">
                <a-slider
                  v-model:value="formState.upload.quality"
                  :min="1"
                  :max="100"
                  :marks="{
                    1: '1%',
                    25: '25%',
                    50: '50%',
                    75: '75%',
                    100: '100%'
                  }"
                />
              </a-form-item>
              <a-form-item label="每日上传限制" required>
                <a-input-number
                  style="width: 100%"
                  v-model:value="formState.upload.dailyLimit"
                  :min="0"
                  placeholder="0表示不限制"
                />
                <p>该功能仅限制已登录用户, 游客模式下无效</p>
              </a-form-item>
              <a-form-item label="文件目录命名规则" required>
                <a-input v-model:value="formState.upload.catalogue" placeholder="输入文件目录命名规则" />
                <p>目录命名规则不能以"/"结尾, 不能包含"\"</p>
              </a-form-item>
              <a-form-item label="文件名命名规则" required>
                <a-input v-model:value="formState.upload.namingRule" placeholder="输入文件命名规则" />
                <p>文件名命名规则中不能含有"/"和"\"</p>
                <p>如果设置了"格式转换", 文件后缀将以"转换后"的格式为准</p>
              </a-form-item>
              <a-collapse class="namingRule-collapse">
                <a-collapse-panel header="支持的命名规则">
                  <el-table :data="namingRuleData">
                    <el-table-column
                      :prop="item.prop"
                      :label="item.label"
                      v-for="(item, index) in namingRuleColumns"
                      :key="index"
                    />
                  </el-table>
                </a-collapse-panel>
              </a-collapse>
            </a-collapse-panel>
            <a-collapse-panel key="2" header="水印设置">
              <a-form-item>
                <a-switch
                  v-model:checked="formState.watermark.enabled"
                  checked-children="启用"
                  un-checked-children="禁用"
                />
              </a-form-item>
              <template v-if="formState.watermark.enabled">
                <a-form-item label="水印类型">
                  <a-radio-group v-model:value="formState.watermark.type">
                    <a-radio value="text">文字水印</a-radio>
                    <a-radio value="image">图片水印</a-radio>
                  </a-radio-group>
                </a-form-item>
                <template v-if="formState.watermark.type === 'text'">
                  <a-form-item label="水印文字" required>
                    <a-input v-model:value="formState.watermark.text.content" />
                  </a-form-item>
                  <a-form-item label="字体大小" required>
                    <a-input-number
                      style="width: 100%"
                      v-model:value="formState.watermark.text.fontSize"
                      :min="12"
                      :max="72"
                    />
                  </a-form-item>
                  <a-form-item label="字体颜色" required>
                    <a-input v-model:value="formState.watermark.text.color" type="color" />
                  </a-form-item>
                </template>
                <template v-else>
                  <a-form-item label="上传水印">
                    <a-upload
                      v-model:fileList="watermarkFileList"
                      :beforeUpload="handleWatermarkUpload"
                      :showUploadList="false"
                    >
                      <a-button>选择水印图片</a-button>
                    </a-upload>
                  </a-form-item>
                  <template v-if="formState.watermark.image.path">
                    <a-form-item label="水印管理">
                      <a-button @click="deleteWatermark">删除水印图片</a-button>
                    </a-form-item>
                    <a-form-item label="水印图片">
                      <a-image :src="userStore?.config?.site?.url + formState.watermark.image.path" />
                    </a-form-item>
                    <a-form-item label="水印图片URL">
                      <a-input v-model:value="formState.watermark.image.path" disabled />
                    </a-form-item>
                  </template>
                </template>
                <a-form-item label="透明度" required>
                  <a-slider
                    v-model:value="formState.watermark[formState.watermark.type].opacity"
                    :min="0"
                    :max="1"
                    :step="0.1"
                  />
                </a-form-item>
                <a-form-item label="水印位置" required>
                  <a-select v-model:value="formState.watermark[formState.watermark.type].position">
                    <a-select-option :value="item.key" v-for="item in positionS" :key="item.key">
                      {{ item.value }}
                    </a-select-option>
                  </a-select>
                </a-form-item>
                <a-form-item label="距顶部边缘的像素偏移">
                  <a-input-number
                    style="width: 100%"
                    v-model:value="formState.watermark[formState.watermark.type].top"
                  />
                  <p>设置之后将会覆盖"水印位置"设置项</p>
                </a-form-item>
                <a-form-item label="距左边缘的像素偏移">
                  <a-input-number
                    style="width: 100%"
                    v-model:value="formState.watermark[formState.watermark.type].left"
                  />
                  <p>设置之后将会覆盖"水印位置"设置项</p>
                </a-form-item>
                <a-form-item label="是否平铺水印">
                  <a-switch
                    v-model:checked="formState.watermark.tile"
                    checked-children="启用"
                    un-checked-children="禁用"
                  />
                  <p>本功能仅支持: jpg、jpeg、png 或 webp</p>
                  <p>开启后水印将会铺满整张图片</p>
                </a-form-item>
              </template>
            </a-collapse-panel>
          </a-collapse>
        </a-form>
      </a-modal>
    </a-spin>
  </div>
</template>

<script setup>
  import { ref, onMounted, computed } from 'vue'
  import { message } from 'ant-design-vue'
  import axios from '@/stores/axios'
  import { useUserStore } from '@/stores/user'
  import { imageStoreType, imageExitType, formatDate } from '@/stores/formatDate'

  const userStore = useUserStore()
  const loading = ref(false)
  const submitting = ref(false)
  const modalVisible = ref(false)
  const editingRoleGroup = ref(null)
  const roleGroups = ref([])
  const activeKey = ref('')
  const watermarkFileList = ref([])

  const imageStoreArray = Object.entries(imageStoreType)
    .filter(([key]) => key !== 'get')
    .map(([value, label]) => ({ value, label }))

  const formState = ref({
    name: '',
    description: '',
    isAdmin: false,
    isDefault: false,
    isGuest: false,
    upload: {}
  })

  const positionS = computed(() => {
    const obj = {
      northwest: '左上',
      west: '左中',
      southwest: '左下',
      northeast: '右上',
      east: '右中',
      southeast: '右下',
      north: '上中',
      center: '居中',
      south: '下中'
    }
    return Object.keys(obj).map(key => ({
      key,
      value: obj[key]
    }))
  })

  const namingRuleColumns = [
    { label: '变量', prop: 'variable' },
    { label: '说明', prop: 'description' },
    { label: '示例', prop: 'example' }
  ]

  const namingRuleData = [
    { variable: '{Y}', description: '年份（4位）', example: '2024' },
    { variable: '{y}', description: '年份（2位）', example: '24' },
    { variable: '{m}', description: '月份', example: '03' },
    { variable: '{d}', description: '日期', example: '15' },
    { variable: '{Ymd}', description: '年月日', example: '20240315' },
    { variable: '{filename}', description: '原始文件名', example: 'image' },
    { variable: '{ext}', description: '文件扩展名', example: 'jpg' },
    { variable: '{time}', description: '时间戳', example: '1748695143942' },
    { variable: '{uniqid}', description: '唯一ID', example: 'a1b2c3d4' },
    { variable: '{md5}', description: '文件MD5值', example: 'd41d8cd98f00b204e9800998ecf8427e' },
    { variable: '{sha1}', description: '文件SHA1值', example: 'da39a3ee5e6b4b0d3255bfef95601890afd80709' },
    { variable: '{uuid}', description: 'UUID', example: '550e8400-e29b-41d4-a716-446655440000' },
    { variable: '{uid}', description: '用户ID（仅登录用户）', example: '123456' }
  ]

  // 获取指定角色组
  const showRoleGroupModal = async (id, show) => {
    try {
      if (show) {
        formState.value = roleGroups.value.find(item => item._id === id)
      } else {
        formState.value = {
          name: '',
          description: '',
          isAdmin: false,
          isDefault: false,
          isGuest: false,
          upload: {}
        }
      }
      editingRoleGroup.value = show
      modalVisible.value = true
    } catch ({ response }) {
      message.error(response?.data?.error)
    }
  }

  // 获取角色组列表
  const fetchRoleGroups = async () => {
    loading.value = true
    try {
      const { data } = await axios.post('/api/admin/role-groups')
      roleGroups.value = data
    } catch ({ response }) {
      message.error(response?.data?.error)
    } finally {
      loading.value = false
    }
  }

  // 提交表单
  const handleSubmit = async () => {
    submitting.value = true
    try {
      if (editingRoleGroup.value) {
        await axios.put(`/api/admin/role-groups/${formState.value._id}`, formState.value)
        message.success('更新成功')
      } else {
        await axios.post('/api/admin/role-groups/create', formState.value)
        message.success('创建成功')
      }
      modalVisible.value = false
      fetchRoleGroups()
    } catch ({ response }) {
      message.error(response?.data?.error)
    } finally {
      submitting.value = false
    }
  }

  // 处理水印图片上传
  const handleWatermarkUpload = async file => {
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('id', formState.value._id)
      const { data } = await axios.post('/api/admin/upload-watermark', formData)
      formState.value.watermark.image.path = data.path
      message.success('水印图片上传成功')
      return false
    } catch ({ response }) {
      message.error(response?.data?.error)
      return false
    }
  }

  // 删除水印图片
  const deleteWatermark = async () => {
    try {
      await axios.delete(`/api/admin/delete-watermark/${encodeURIComponent(formState.value.watermark.image.path)}`)
      formState.value.watermark.image.path = ''
      message.success('水印图片删除成功')
    } catch ({ response }) {
      message.error(response?.data?.error)
    }
  }

  // 删除角色组
  const handleDelete = async record => {
    try {
      await axios.delete(`/api/admin/role-groups/${record._id}`)
      message.success('删除成功')
      fetchRoleGroups()
    } catch ({ response }) {
      message.error(response?.data?.error)
    }
  }

  onMounted(() => {
    fetchRoleGroups()
  })
</script>

<style scoped>
  .role-groups-container {
    padding: 24px;
  }

  .header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 24px;
  }

  .namingRule-collapse {
    margin-top: 10px;
  }
</style>

<style>
  .RoleGroups-model p {
    margin-top: 8px;
  }
</style>
