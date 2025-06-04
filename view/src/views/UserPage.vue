<template>
  <div class="user-page">
    <a-card class="user-info-card">
      <a-spin :spinning="loadingUser">
        <div v-if="user" class="user-profile">
          <a-avatar :src="userStore?.config?.site?.url + user.avatar" :size="80" :icon="UserOutlined" />
          <div class="user-details">
            <h2>{{ user.username }}</h2>
            <p>注册时间: {{ formatDate(user.createdAt) }}</p>
          </div>
        </div>
        <a-empty v-else description="用户不存在" />
      </a-spin>
    </a-card>
    <a-card class="public-albums-card" v-if="user">
      <h3>{{ user?.username === userStore?.user?.username ? '我' : user?.username }}的公开相册</h3>
      <a-spin :spinning="loadingAlbums">
        <a-empty v-if="albums.length === 0 && !loadingAlbums" description="暂无公开相册" />
        <div v-else class="album-grid">
          <div v-for="album in albums" :key="album._id" class="album-item">
            <a-card hoverable @click="router.push(`/user/${userId}/album/${album._id}`)">
              <template #cover>
                <a-image v-if="album.coverImage" :src="userStore?.config?.site?.url + album.coverImage.thumb" :preview="false" />
                <div v-else class="none-cover">无封面</div>
              </template>
              <a-card-meta :title="album.name" />
            </a-card>
          </div>
        </div>
      </a-spin>
      <div class="pagination" v-if="totalAlbums > pageSizeAlbums">
        <a-pagination v-model:current="currentAlbums" :total="totalAlbums" :page-size="pageSizeAlbums" @change="handleAlbumsPageChange" />
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import axios from '@/stores/axios'
import { formatDate } from '@/stores/formatDate'
import { UserOutlined } from '@ant-design/icons-vue'
import qs from 'qs' // 引入 qs

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const userId = ref(null)
const user = ref(null)
const albums = ref([])
const loadingUser = ref(false)
const loadingAlbums = ref(false)

// 公开相册分页状态
const currentAlbums = ref(1)
const pageSizeAlbums = ref(10)
const totalAlbums = ref(0)

// 获取用户基本信息
const fetchUserInfo = async (id) => {
  loadingUser.value = true
  user.value = null
  try {
    const { data } = await axios.post(`/api/public/users/${id}`, {})
    user.value = data
  } catch ({ response }) {
    message.error(response?.data?.error || '获取用户信息失败')
  } finally {
    loadingUser.value = false
  }
}

// 获取用户公开相册列表
const fetchPublicAlbums = async (id) => {
  loadingAlbums.value = true
  albums.value = []
  totalAlbums.value = 0
  try {
    const { data } = await axios.post(`/api/public/users/${id}/albums`, qs.stringify({
      page: currentAlbums.value,
      limit: pageSizeAlbums.value
    }))
    albums.value = data.albums || []
    totalAlbums.value = data.total || 0 
  } catch ({ response }) {
    message.error(response?.data?.error || '获取公开相册列表失败')
  } finally {
    loadingAlbums.value = false
  }
}

// 处理公开相册列表分页变化
const handleAlbumsPageChange = (page) => {
  currentAlbums.value = page
  fetchPublicAlbums(userId.value)
}

onMounted(() => {
  userId.value = route.params.userId
  fetchUserInfo(userId.value)
  currentAlbums.value = 1
  fetchPublicAlbums(userId.value)
})
</script>

<style scoped>
.user-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.user-info-card {
  margin-bottom: 20px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-details h2 {
  margin: 0 0 5px 0;
  font-size: 1.5em;
}

.user-details p {
  margin: 0;
  color: rgba(0, 0, 0, 0.65);
}

.public-albums-card h3 {
  margin-top: 0;
  margin-bottom: 15px;
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
}

.album-item .ant-card-cover {
  height: 120px;
  overflow: hidden;
}

.album-item .ant-image,
.album-item .none-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.none-cover {
  background-color: #f0f0f0;
  text-align: center;
  line-height: 120px;
  color: rgba(0, 0, 0, 0.45);
}

.album-item :deep(.ant-card-meta-title) {
  font-size: 1em;
  margin-bottom: 5px;
  overflow: hidden;
  /* Prevent title overflow */
  text-overflow: ellipsis;
  white-space: nowrap;
}

.album-item :deep(.ant-card-meta-description) {
  font-size: 0.9em;
  color: rgba(0, 0, 0, 0.45);
}

.pagination {
  margin-top: 20px;
  text-align: center;
}
</style>