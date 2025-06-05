<template>
  <div class="public-album-detail">
    <a-card>
      <template #title>
        <div class="card-title">
          <span>
            {{ user?.username === userStore?.user?.username ? '我' : user?.username }}的相册：{{ album?.name }}
          </span>
          <a-button @click="router.go(-1)">返回</a-button>
        </div>
      </template>
      <a-spin :spinning="loadingAlbum || loadingImages">
        <a-empty v-if="images.length === 0 && !loadingImages" description="暂无图片" />
        <div v-else class="image-grid">
          <div v-for="image in images" :key="image._id" class="image-item">
            <a-card hoverable>
              <template #cover>
                <a-image
                  :src="userStore?.config?.site?.url + image.thumb"
                  :preview="{
                    src: userStore?.config?.site?.url + image.url
                  }"
                />
              </template>
              <a-card-meta>
                <template #title>{{ image.filename }}</template>
                <template #description>
                  <div class="image-tags">
                    <a-tag v-for="tag in image.tags" :key="tag">{{ tag }}</a-tag>
                  </div>
                </template>
              </a-card-meta>
            </a-card>
          </div>
        </div>
      </a-spin>
      <div class="pagination" v-if="totalImages > pageSizeImages">
        <a-pagination
          v-model:current="currentImages"
          :total="totalImages"
          :page-size="pageSizeImages"
          @change="handleImagesPageChange"
        />
      </div>
    </a-card>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { message } from 'ant-design-vue'
  import { useUserStore } from '@/stores/user'
  import axios from '@/stores/axios'
  import qs from 'qs'

  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()

  const userId = ref(null)
  const albumId = ref(null)
  const user = ref(null)
  const album = ref(null)
  const images = ref([])
  const loadingAlbum = ref(false)
  const loadingImages = ref(false)

  // 图片列表分页状态
  const currentImages = ref(1)
  const pageSizeImages = ref(20)
  const totalImages = ref(0)

  // 获取相册所属用户基本信息
  const fetchUserInfo = async id => {
    try {
      const { data } = await axios.post(`/api/public/users/${id}`)
      user.value = data
    } catch ({ response }) {
      message.error(response?.data?.error)
    }
  }

  // 获取相册内的图片列表
  const fetchImagesInAlbum = async id => {
    loadingImages.value = true
    images.value = []
    totalImages.value = 0
    try {
      const { data } = await axios.post(
        `/api/public/albums/${id}/images`,
        qs.stringify({
          page: currentImages.value,
          limit: pageSizeImages.value
        })
      )
      images.value = data.images
      totalImages.value = data.total
      album.value = data.album
    } catch ({ response }) {
      message.error(response?.data?.error)
    } finally {
      loadingImages.value = false
    }
  }

  // 处理图片列表分页变化
  const handleImagesPageChange = page => {
    currentImages.value = page
    fetchImagesInAlbum(albumId.value)
  }

  onMounted(() => {
    userId.value = route.params.userId
    albumId.value = route.params.albumId
    currentImages.value = 1
    fetchUserInfo(userId.value)
    fetchImagesInAlbum(albumId.value)
  })
</script>

<style scoped>
  .public-album-detail {
    padding: 20px;
    max-width: 1000px;
    /* 可以适当放宽宽度 */
    margin: 0 auto;
  }

  .card-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
  }

  .card-title > span {
    flex-grow: 1;
    margin-right: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    /* 调整图片网格布局 */
    gap: 15px;
    margin-top: 15px;
  }

  .image-item .ant-card-cover {
    height: 150px;
    /* 调整图片封面高度 */
    overflow: hidden;
  }

  .image-item .ant-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-tags {
    margin-top: 8px;
  }

  .pagination {
    margin-top: 20px;
    text-align: center;
  }

  /* 可以从 My.vue 复制其他通用样式 */
  /* ... existing styles from My.vue if needed ... */
</style>
