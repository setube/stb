<template>
  <a-modal :open="modelValue" @update:open="handleOpenChange" class="gallery-modal" :maskClosable="false" :closable="false" title=" ">
    <a-image class="modal-image" :src="imageInfo.type === 'local' ? userStore.config.site.url + imageInfo.url : imageInfo.url" :preview="false" />
    <a-descriptions bordered :column="1" size="middle">
      <a-descriptions-item label="上传用户">{{ imageInfo?.user?.username || '游客' }}</a-descriptions-item>
      <a-descriptions-item label="图片名称">{{ imageInfo.filename }}</a-descriptions-item>
      <a-descriptions-item label="原始名称">{{ imageInfo.name }}</a-descriptions-item>
      <a-descriptions-item label="图片大小">{{ formatFileSize(imageInfo.size) }}</a-descriptions-item>
      <a-descriptions-item label="物理路径">{{ imageInfo.filePath }}</a-descriptions-item>
      <a-descriptions-item label="图片类型">image/{{ imageInfo.filename.split('.').pop() }}</a-descriptions-item>
      <a-descriptions-item label="MD5">{{ imageInfo.md5 }}</a-descriptions-item>
      <a-descriptions-item label="SHA1">{{ imageInfo.sha1 }}</a-descriptions-item>
      <a-descriptions-item label="尺寸">{{ imageInfo.width }} x {{ imageInfo.height }}</a-descriptions-item>
      <a-descriptions-item label="上传 IP" v-if="userStore.user?.username === imageInfo.user?.username || userStore.user?.founder">
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
import { LeftOutlined, RightOutlined } from '@ant-design/icons-vue'
import { formatDate, formatFileSize, copyImages } from '@/stores/formatDate'

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
</script>

<style scoped></style>

<style>
.gallery-modal {
  position: relative;
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