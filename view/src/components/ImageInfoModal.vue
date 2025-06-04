<template>
  <a-modal :open="modelValue" @update:open="handleOpenChange" :class="['gallery-modal', { isUser: userStore.token }]" :maskClosable="false" :closable="false" title=" ">
    <div class="modal-image-container">
      <a-image class="modal-image" placeholder :src="imageInfo.type === 'local' ? userStore.config.site.url + imageInfo.url : imageInfo.url" :preview="false" />
    </div>
    <a-descriptions bordered :column="1" size="middle" v-if="userStore.token">
      <a-descriptions-item label="上传用户">
        <span class="username" @click="goUserPage(imageInfo, 'user')">
          {{ imageInfo?.user?.username || '游客' }}
        </span>
      </a-descriptions-item>
      <a-descriptions-item label="所属相册">
        <span class="username" @click="goUserPage(imageInfo, 'album')">
          {{ imageInfo?.album?.name || '独立图片' }}
        </span>
      </a-descriptions-item>
      <a-descriptions-item label="图片名称">{{ imageInfo.filename }}</a-descriptions-item>
      <a-descriptions-item label="原始名称">{{ imageInfo.name }}</a-descriptions-item>
      <a-descriptions-item label="图片大小">{{ formatFileSize(imageInfo.size) }}</a-descriptions-item>
      <a-descriptions-item label="物理路径">{{ imageInfo.filePath }}</a-descriptions-item>
      <a-descriptions-item label="图片类型">image/{{ imageInfo.filename.split('.').pop() }}</a-descriptions-item>
      <a-descriptions-item label="MD5">{{ imageInfo.md5 }}</a-descriptions-item>
      <a-descriptions-item label="SHA1">{{ imageInfo.sha1 }}</a-descriptions-item>
      <a-descriptions-item label="尺寸">{{ imageInfo.width }} x {{ imageInfo.height }}</a-descriptions-item>
      <a-descriptions-item label="上传IP" v-if="userStore?.user && (userStore?.user?.username === imageInfo.user?.username || userStore.user?.founder)">
        {{ imageInfo.ip }} (仅自己与管理员可见)
      </a-descriptions-item>
      <a-descriptions-item label="上传时间">{{ formatDate(imageInfo.updatedAt) }}</a-descriptions-item>
    </a-descriptions>
    <template #footer>
      <a-button type="primary" @click="copyImages($event, imageInfo, userStore)">复制链接</a-button>
      <a-button type="primary" @click="handleClose">关闭弹窗</a-button>
    </template>
    <div v-if="imageKey > 0" class="ant-image-preview-switch-left" @click="prevImage">
      <span class="anticon anticon-left">
        <LeftOutlined />
      </span>
    </div>
    <div v-if="images.length > 1 && images.length > imageKey + 1" class="ant-image-preview-switch-right" @click="nextImage">
      <span class="anticon anticon-right">
        <RightOutlined />
      </span>
    </div>
  </a-modal>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { LeftOutlined, RightOutlined } from '@ant-design/icons-vue'
import { formatDate, formatFileSize, copyImages } from '@/stores/formatDate'

const router = useRouter()
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  imageInfo: {
    type: Object,
    required: true
  },
  imageKey: {
    type: Number,
    default: 0
  },
  images: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'update:imageInfo', 'update:imageKey'])

const userStore = useUserStore()

// 处理弹窗显示状态变化
const handleOpenChange = (value) => {
  emit('update:modelValue', value)
}

// 处理关闭
const handleClose = () => {
  emit('update:modelValue', false)
}

// 上一张图片
const prevImage = () => {
  if (props.imageKey > 0) {
    emit('update:imageInfo', props.images[props.imageKey - 1])
    emit('update:imageKey', props.imageKey - 1)
  }
}

// 下一张图片
const nextImage = () => {
  if (props.imageKey < props.images.length - 1) {
    emit('update:imageInfo', props.images[props.imageKey + 1])
    emit('update:imageKey', props.imageKey + 1)
  }
}

// 跳转到用户主页和相册信息页
const goUserPage = (imageInfo, type) => {
  if (type === 'user' && !imageInfo.user) return
  if (type === 'album' && !imageInfo.album) return
  router.push(type === 'user' ? `/user/${imageInfo.user._id}` : `/user/${imageInfo.user._id}/album/${imageInfo.album._id}`)
}
</script>

<style scoped></style>

<style>
.gallery-modal {
  position: relative;
}

.gallery-modal .ant-modal-content {
  background-color: transparent;
  box-shadow: none;
}

.gallery-modal.isUser .ant-modal-content {
  background-color: #fff;
  box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
}

.gallery-modal .modal-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.gallery-modal .ant-modal-content .ant-btn-primary {
  background-color: transparent;
  border: 1px solid #fff;
  box-shadow: none;
}

.gallery-modal.isUser .ant-modal-content .ant-btn-primary {
  background-color: #1677ff;
  border: 1px solid #fff;
}

.gallery-modal .modal-image {
  border-radius: 5px;
}

.gallery-modal .ant-descriptions {
  margin-top: 20px;
}

.gallery-modal .ant-image-preview-switch-right,
.gallery-modal .ant-image-preview-switch-left {
  position: absolute;
  color: rgba(255, 255, 255, 1);
  background: rgba(255, 255, 255, 0.3);

  &:hover {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.2);
  }
}

.gallery-modal .ant-image-preview-switch-right:hover,
.gallery-modal .ant-image-preview-switch-left:hover {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.2);
}

.gallery-modal .ant-image-preview-switch-right {
  right: -50px;
}

.gallery-modal .ant-image-preview-switch-left {
  left: -50px;
}

.gallery-modal .username:hover {
  color: #69b1ff;
  cursor: pointer;
}

@media (max-width: 768px) {

  .gallery-modal .ant-image-preview-switch-right,
  .gallery-modal .ant-image-preview-switch-left {
    background: rgba(0, 0, 0, 0.3);
  }

  .gallery-modal .ant-image-preview-switch-right:hover,
  .gallery-modal .ant-image-preview-switch-left:hover {
    background: rgba(0, 0, 0, 0.2);
  }

  .gallery-modal .ant-image-preview-switch-right {
    right: 0;
  }

  .gallery-modal .ant-image-preview-switch-left {
    left: 0;
  }
}
</style>