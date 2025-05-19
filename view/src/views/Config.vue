<template>
  <div class="config-container">
    <a-spin :spinning="loading">
      <a-form :model="formState" layout="vertical" @finish="handleSubmit">
        <!-- 站点设置 -->
        <a-card title="站点设置" class="mb-4">
          <a-form-item label="网站标题">
            <a-input v-model:value="formState.site.title" />
          </a-form-item>
          <a-form-item label="网站URL">
            <a-input v-model:value="formState.site.url" />
          </a-form-item>
        </a-card>
        <!-- 上传设置 -->
        <a-card title="上传设置" class="mb-4">
          <a-form-item label="允许的图片格式">
            <a-select v-model:value="formState.upload.allowedFormats" mode="multiple" placeholder="选择允许的图片格式">
              <a-select-option value="jpg">JPG</a-select-option>
              <a-select-option value="jpeg">JPEG</a-select-option>
              <a-select-option value="png">PNG</a-select-option>
              <a-select-option value="gif">GIF</a-select-option>
              <a-select-option value="webp">WEBP</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="最大文件大小(MB)">
            <a-input-number v-model:value="formState.upload.maxSize" :min="1" :max="100" />
          </a-form-item>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="最小宽度(px)">
                <a-input-number v-model:value="formState.upload.minWidth" :min="0" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="最小高度(px)">
                <a-input-number v-model:value="formState.upload.minHeight" :min="0" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="最大宽度(px)">
                <a-input-number v-model:value="formState.upload.maxWidth" :min="0" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="最大高度(px)">
                <a-input-number v-model:value="formState.upload.maxHeight" :min="0" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item label="转换格式">
            <a-select v-model:value="formState.upload.convertFormat" allowClear placeholder="选择转换格式">
              <a-select-option value="">不转换</a-select-option>
              <a-select-option value="jpeg">JPEG</a-select-option>
              <a-select-option value="png">PNG</a-select-option>
              <a-select-option value="webp">WEBP</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="图片质量">
            <a-slider v-model:value="formState.upload.quality" :min="1" :max="100" :marks="{
              1: '1%',
              25: '25%',
              50: '50%',
              75: '75%',
              100: '100%'
            }" />
          </a-form-item>
          <a-form-item label="每日上传限制">
            <a-input-number v-model:value="formState.upload.dailyLimit" :min="0" placeholder="0表示不限制" />
          </a-form-item>
        </a-card>
        <!-- 水印设置 -->
        <a-card title="水印设置" class="mb-4">
          <a-form-item>
            <a-switch v-model:checked="formState.watermark.enabled" checked-children="启用" un-checked-children="禁用" />
          </a-form-item>
          <template v-if="formState.watermark.enabled">
            <a-form-item label="水印类型">
              <a-radio-group v-model:value="formState.watermark.type">
                <a-radio value="text">文字水印</a-radio>
                <a-radio value="image">图片水印</a-radio>
              </a-radio-group>
            </a-form-item>
            <template v-if="formState.watermark.type === 'text'">
              <a-form-item label="水印文字">
                <a-input v-model:value="formState.watermark.text.content" />
              </a-form-item>
              <a-form-item label="字体大小">
                <a-input-number v-model:value="formState.watermark.text.fontSize" :min="12" :max="72" />
              </a-form-item>
              <a-form-item label="字体颜色">
                <a-input v-model:value="formState.watermark.text.color" type="color" />
              </a-form-item>
            </template>
            <template v-else>
              <a-form-item label="水印图片">
                <a-upload v-model:fileList="watermarkFileList" :beforeUpload="handleWatermarkUpload"
                  :showUploadList="false">
                  <a-button>选择水印图片</a-button>
                </a-upload>
              </a-form-item>
              <a-form-item label="透明度">
                <a-slider v-model:value="formState.watermark.image.opacity" :min="0" :max="1" :step="0.1" />
              </a-form-item>
            </template>
            <a-form-item label="水印位置">
              <a-select v-model:value="formState.watermark[formState.watermark.type].position">
                <a-select-option value="top-left">左上</a-select-option>
                <a-select-option value="top-right">右上</a-select-option>
                <a-select-option value="bottom-left">左下</a-select-option>
                <a-select-option value="bottom-right">右下</a-select-option>
                <a-select-option value="center">居中</a-select-option>
              </a-select>
            </a-form-item>
          </template>
        </a-card>
        <!-- 验证码设置 -->
        <a-card title="验证码设置" class="mb-4">
          <a-form-item>
            <a-switch v-model:checked="formState.site.captcha" checked-children="启用" un-checked-children="禁用" />
          </a-form-item>
        </a-card>
        <!-- IP设置 -->
        <a-card title="IP设置" class="mb-4">
          <a-tabs v-model:activeKey="activeTab">
            <a-tab-pane key="whitelist" tab="白名单">
              <a-form-item>
                <a-switch v-model:checked="formState.ip.whitelistEnabled" checked-children="启用"
                  un-checked-children="禁用" />
              </a-form-item>
              <a-form-item label="IP白名单">
                <a-textarea v-model:value="ipWhitelistText" :rows="4" placeholder="每行一个IP地址"
                  @change="handleIpWhitelistChange" />
              </a-form-item>
            </a-tab-pane>
            <a-tab-pane key="blacklist" tab="黑名单">
              <a-form-item>
                <a-switch v-model:checked="formState.ip.blacklistEnabled" checked-children="启用"
                  un-checked-children="禁用" />
              </a-form-item>
              <a-form-item label="IP黑名单">
                <a-textarea v-model:value="ipBlacklistText" :rows="4" placeholder="每行一个IP地址"
                  @change="handleIpBlacklistChange" />
              </a-form-item>
            </a-tab-pane>
          </a-tabs>
        </a-card>
        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="submitting">
            保存设置
          </a-button>
        </a-form-item>
      </a-form>
    </a-spin>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import axios from '@/stores/axios'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const loading = ref(false)
const submitting = ref(false)
const activeTab = ref('whitelist')
const watermarkFileList = ref([])
const ipWhitelistText = ref('')
const ipBlacklistText = ref('')

const formState = ref({
  site: {
    title: '网站标题',
    url: 'URL_ADDRESS.com',
    captcha: false
  },
  upload: {
    allowedFormats: [],
    maxSize: 5,
    minWidth: 0,
    minHeight: 0,
    maxWidth: 0,
    maxHeight: 0,
    convertFormat: '',
    quality: 80,
    dailyLimit: 100
  },
  watermark: {
    enabled: false,
    type: 'text',
    text: {
      content: '',
      fontSize: 24,
      color: '#ffffff',
      position: 'bottom-right'
    },
    image: {
      path: '',
      opacity: 0.5,
      position: 'bottom-right'
    }
  },
  ip: {
    blacklist: [],
    blacklistEnabled: false,
    enabled: false,
    whitelist: [],
    whitelistEnabled: false
  }
})

// 获取配置
const fetchConfig = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/admin/config')
    formState.value = response.data
    ipWhitelistText.value = response.data.ip.whitelist.join('\n')
    ipBlacklistText.value = response.data.ip.blacklist.join('\n')
  } catch (error) {
    message.error('获取配置失败')
  } finally {
    loading.value = false
  }
}

// 处理水印图片上传
const handleWatermarkUpload = async (file) => {
  try {
    const formData = new FormData()
    formData.append('image', file)
    const response = await axios.post('/api/admin/upload-watermark', formData)
    formState.value.watermark.image.path = response.data.path
    message.success('水印图片上传成功')
    return false
  } catch (error) {
    message.error('水印图片上传失败')
    return false
  }
}

// 处理IP白名单变化
const handleIpWhitelistChange = (e) => {
  formState.value.ip.whitelist = e.target.value
    .split('\n')
    .map(ip => ip.trim())
    .filter(ip => ip)
}

// 处理IP黑名单变化
const handleIpBlacklistChange = (e) => {
  formState.value.ip.blacklist = e.target.value
    .split('\n')
    .map(ip => ip.trim())
    .filter(ip => ip)
}

// 提交表单
const handleSubmit = async () => {
  submitting.value = true
  try {
    const res = await axios.put('/api/admin/config', formState.value)
    userStore.setConfig({
      site: formState.value.site
    })
    message.success(res.data.message)
  } catch (error) {
    message.error(error.response?.data?.error)
  } finally {
    submitting.value = false
  }
}

onMounted(fetchConfig)
</script>

<style scoped>
.config-container {
  padding: 24px;
}

.mb-4 {
  margin-bottom: 24px;
}
</style>