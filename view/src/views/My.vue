<template>
  <div class="my-images">
    <a-card>
      <template #title>
        <div class="card-title">
          <span>我的图片</span>
          <div>
            <a-button style="margin-right: 10px" @click="showCreateAlbumModal">创建相册</a-button>
            <a-button type="primary">
              <router-link to="/">
                <upload-outlined />
                上传图片
              </router-link>
            </a-button>
          </div>
        </div>
      </template>
      <a-spin :spinning="loadingImages || loadingAlbums">
        <div class="album-list-overview">
          <a-card hoverable @click="selectAlbum(null)">
            <a-card-meta title="独立图片">
              <template #description>共 {{ standaloneCount }} 张</template>
            </a-card-meta>
          </a-card>
          <a-card hoverable v-for="album in albums" :key="album._id" @click="selectAlbum(album)">
            <template #cover>
              <a-image
                v-if="album.coverImage"
                :src="userStore.config.site.url + album.coverImage.thumb"
                :preview="false"
              />
              <div v-else class="none-cover">无封面</div>
            </template>
            <a-card-meta :title="album.name">
              <template #description>权限: {{ album.permission === 'public' ? '公开' : '私有' }}</template>
            </a-card-meta>
            <template #actions>
              <a-button type="link" @click.stop="showEditAlbumModal(album)">编辑</a-button>
              <a-button type="link" danger @click.stop="deleteAlbum(album)">删除</a-button>
            </template>
          </a-card>
        </div>
        <h2>
          {{ selectedAlbum ? selectedAlbum.name : '独立图片' }}
          <small v-if="selectedAlbum">({{ selectedAlbum.permission === 'public' ? '公开' : '私有' }})</small>
        </h2>
        <a-empty v-if="images.length === 0 && !loadingImages" description="暂无图片" />
        <div v-else class="image-grid">
          <div v-for="(image, key) in images" :key="key" class="image-item">
            <a-card hoverable>
              <template #cover>
                <a-image
                  :src="userStore.config.site.url + image.thumb"
                  :preview="{ visible: false }"
                  @click="showImageInfo(image, key)"
                />
              </template>
              <a-card-meta>
                <template #title>{{ image.filename }}</template>
                <template #description>
                  <div class="image-info">
                    <span>{{ formatFileSize(image.size) }}</span>
                    <span>{{ formatDate(image.date) }}</span>
                  </div>
                  <div class="image-tags">
                    <a-tag v-for="tag in image.tags" :key="tag">{{ tag }}</a-tag>
                  </div>
                </template>
              </a-card-meta>
              <template #actions>
                <a-button type="link" @click="copyImages($event, image, userStore)">
                  <LinkOutlined />
                  复制
                </a-button>
                <a-dropdown>
                  <a class="ant-dropdown-link" @click.prevent>
                    <DownOutlined />
                    更多
                  </a>
                  <template #overlay>
                    <a-menu>
                      <a-sub-menu key="album" title="修改相册">
                        <a-menu-item :disabled="!image.album" @click="handleMoveImage(image._id, null)">
                          独立图片
                        </a-menu-item>
                        <a-menu-item
                          v-for="album in albums"
                          :key="album._id"
                          :disabled="image.album === album._id"
                          @click="handleMoveImage(image._id, album._id)"
                        >
                          {{ album.name }}
                        </a-menu-item>
                      </a-sub-menu>
                      <a-menu-item @click="showEditImageTagsModal(image)">
                        {{ image.tags.length ? '修改标签' : '添加标签' }}
                      </a-menu-item>
                      <a-menu-item @click="deleteImage(image)">删除图片</a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </template>
            </a-card>
          </div>
        </div>
        <div class="pagination">
          <a-pagination v-model:current="current" :total="total" :page-size="pageSize" @change="handlePageChange" />
        </div>
      </a-spin>
    </a-card>
    <ImageInfoModal v-model="modalOpen" v-model:imageInfo="imageInfo" v-model:imageKey="imageKey" :images="images" />
    <a-modal
      v-model:open="albumModalVisible"
      :title="isEditAlbum ? '编辑相册' : '创建相册'"
      @ok="handleSaveAlbum"
      @cancel="albumModalVisible = false"
    >
      <a-form :model="albumForm" :rules="albumRules" ref="albumFormRef" layout="vertical">
        <a-form-item label="相册名称" name="name">
          <a-input v-model:value="albumForm.name" placeholder="请输入相册名称" />
        </a-form-item>
        <a-form-item label="权限" name="permission">
          <a-select v-model:value="albumForm.permission" placeholder="请选择相册权限">
            <a-select-option value="public">公开</a-select-option>
            <a-select-option value="private">私有</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item v-if="isEditAlbum" label="封面图片">
          <a-button type="primary" style="margin-right: 10px" @click="showImageSelectModal">选择图片</a-button>
          <a-button type="primary" danger @click="removeCoverImage" v-if="albumForm.coverImage">移除封面</a-button>
          <div v-if="albumForm.coverImage" style="margin-top: 10px">
            <a-image :src="userStore.config.site.url + albumForm.coverImage.thumb" :height="200" />
          </div>
        </a-form-item>
      </a-form>
    </a-modal>
    <a-modal
      v-model:open="editImageTagsModalVisible"
      title="标签"
      @ok="handleUpdateImageTags"
      @cancel="editImageTagsModalVisible = false"
    >
      <a-select
        v-model:value="imageToEditTags.tags"
        mode="tags"
        placeholder="输入标签，按回车键添加"
        style="width: 100%"
      />
    </a-modal>
    <a-modal v-model:open="imageSelectModalVisible" title="选择相册封面" width="80%" :footer="null">
      <a-spin :spinning="loadingImagesSelect">
        <a-empty v-if="imagesSelect.length === 0 && !loadingImagesSelect" description="暂无图片可选" />
        <div v-else class="image-select-grid">
          <div
            v-for="image in imagesSelect"
            :key="image._id"
            class="image-select-item"
            @click="selectCoverImage(image)"
          >
            <a-card hoverable :bodyStyle="{ padding: '5px' }">
              <img
                :src="userStore.config.site.url + image.thumb"
                :alt="image.filename"
                style="width: 100%; height: 120px; object-fit: cover"
              />
              <p
                style="
                  text-align: center;
                  margin-top: 5px;
                  font-size: 12px;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                "
              >
                {{ image.filename }}
              </p>
            </a-card>
          </div>
        </div>
        <div class="pagination" style="margin-top: 20px">
          <a-pagination
            v-model:current="currentSelect"
            :total="totalSelect"
            :page-size="pageSizeSelect"
            @change="fetchImagesSelect"
          />
        </div>
      </a-spin>
    </a-modal>
  </div>
</template>

<script setup>
  import qs from 'qs'
  import { ref, onMounted } from 'vue'
  import { message, Modal } from 'ant-design-vue'
  import { formatDate, formatFileSize, copyImages } from '@/stores/formatDate'
  import { UploadOutlined, DeleteOutlined, LinkOutlined, DownOutlined } from '@ant-design/icons-vue'
  import { useUserStore } from '@/stores/user'
  import axios from '@/stores/axios'
  import ImageInfoModal from '@/components/ImageInfoModal.vue'

  const userStore = useUserStore()
  const loadingImages = ref(false)
  const loadingAlbums = ref(false)
  const images = ref([])
  const total = ref(0)
  const current = ref(1)
  const pageSize = ref(12)
  const modalOpen = ref(false)
  const imageInfo = ref({})
  const imageKey = ref(0)

  const albums = ref([])
  const standaloneCount = ref(0)
  const selectedAlbum = ref(null)

  const albumModalVisible = ref(false)
  const isEditAlbum = ref(false)
  const albumFormRef = ref(null)
  const albumForm = ref({
    _id: null,
    name: '',
    permission: 'public',
    coverImage: null
  })
  const albumRules = {
    name: [{ required: true, message: '请输入相册名称', trigger: 'blur' }],
    permission: [{ required: true, message: '请选择权限', trigger: 'change' }]
  }
  const editImageTagsModalVisible = ref(false)
  const imageToEditTags = ref(null)

  const imageSelectModalVisible = ref(false)
  const loadingImagesSelect = ref(false)
  const imagesSelect = ref([])
  const totalSelect = ref(0)
  const currentSelect = ref(1)
  const pageSizeSelect = ref(20)

  const getMyImages = async () => {
    loadingImages.value = true
    try {
      const params = {
        page: current.value,
        limit: pageSize.value
      }
      if (selectedAlbum.value !== undefined && selectedAlbum.value !== null) {
        params.albumId = selectedAlbum.value._id
      } else {
        params.albumId = 'standalone'
      }
      const { data } = await axios.post('/api/auth/my', qs.stringify(params))
      images.value = data.images
      total.value = data.total
    } catch ({ response }) {
      message.error(response?.data?.error)
    } finally {
      loadingImages.value = false
    }
  }

  const getMyAlbums = async () => {
    loadingAlbums.value = true
    try {
      const { data } = await axios.post('/api/auth/albums/my')
      albums.value = data.albums || []
      standaloneCount.value = data.standaloneCount || 0
    } catch ({ response }) {
      message.error(response?.data?.error)
    } finally {
      loadingAlbums.value = false
    }
  }

  const fetchImagesSelect = async () => {
    loadingImagesSelect.value = true
    try {
      const { data } = await axios.post(
        '/api/auth/my',
        qs.stringify({
          page: currentSelect.value,
          limit: pageSizeSelect.value
        })
      )
      imagesSelect.value = data.images
      totalSelect.value = data.total
    } catch ({ response }) {
      message.error(response?.data?.error)
    } finally {
      loadingImagesSelect.value = false
    }
  }

  const deleteImage = async image => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除图片 "${image.filename}" 吗？`,
      async onOk() {
        try {
          await axios.delete(`/api/auth/images/${image._id}`)
          message.success('删除成功')
          getMyImages()
          if (!selectedAlbum.value) {
            getMyAlbums()
          }
        } catch ({ response }) {
          message.error(response?.data?.error)
        }
      }
    })
  }

  const showImageInfo = (image, index) => {
    imageInfo.value = image
    modalOpen.value = true
    imageKey.value = index
  }

  const handlePageChange = page => {
    current.value = page
    getMyImages()
  }

  const selectAlbum = album => {
    selectedAlbum.value = album
    current.value = 1
    total.value = 0
    images.value = []
    getMyImages()
  }

  const showCreateAlbumModal = () => {
    isEditAlbum.value = false
    albumForm.value = { _id: null, name: '', permission: 'public', tags: [], coverImage: null }
    albumModalVisible.value = true
    if (albumFormRef.value) {
      albumFormRef.value.resetFields()
    }
  }

  const showEditAlbumModal = album => {
    isEditAlbum.value = true
    albumForm.value = {
      _id: album._id,
      name: album.name,
      permission: album.permission,
      tags: album.tags || [],
      coverImage: album.coverImage || null
    }
    albumModalVisible.value = true
    if (albumFormRef.value) {
      albumFormRef.value.resetFields()
    }
  }

  const handleSaveAlbum = async () => {
    try {
      await albumFormRef.value.validate()
      const submitData = {
        name: albumForm.value.name,
        permission: albumForm.value.permission,
        coverImage: albumForm.value.coverImage ? albumForm.value.coverImage._id : null
      }
      if (isEditAlbum.value) {
        await axios.patch(`/api/auth/albums/${albumForm.value._id}`, submitData)
        message.success('相册更新成功')
      } else {
        await axios.post('/api/auth/albums', submitData)
        message.success('相册创建成功')
      }
      albumModalVisible.value = false
      getMyAlbums()
      if (isEditAlbum.value && selectedAlbum.value && selectedAlbum.value._id === albumForm.value._id) {
        const index = albums.value.findIndex(a => a._id === albumForm.value._id)
        if (index !== -1) {
          getMyAlbums()
        }
      }
    } catch ({ response }) {
      message.error(response?.data?.error)
    }
  }

  const deleteAlbum = album => {
    Modal.confirm({
      title: '确认删除相册',
      content: `确定要删除相册 "${album.name}" 吗？相册内的图片将被移出相册，但不会被删除。`,
      async onOk() {
        try {
          await axios.delete(`/api/auth/albums/${album._id}`)
          message.success('相册已删除，图片已移出')
          getMyAlbums()
          if (selectedAlbum.value && selectedAlbum.value._id === album._id) {
            selectAlbum(null)
          }
        } catch ({ response }) {
          message.error(response?.data?.error)
        }
      }
    })
  }

  const handleMoveImage = async (imageId, albumId) => {
    try {
      await axios.patch(`/api/auth/images/${imageId}/album`, { albumId })
      message.success(albumId ? '图片已添加到相册' : '图片已移出相册')
      getMyImages()
      getMyAlbums()
    } catch ({ response }) {
      message.error(response?.data?.error)
    }
  }

  const showEditImageTagsModal = image => {
    imageToEditTags.value = image
    editImageTagsModalVisible.value = true
  }

  const handleUpdateImageTags = async () => {
    if (!imageToEditTags.value) return
    try {
      const imageId = imageToEditTags.value._id
      await axios.patch(`/api/auth/images/${imageId}/tags`, {
        tags: imageToEditTags.value.tags
      })
      message.success('图片标签更新成功')
      editImageTagsModalVisible.value = false
      getMyImages()
    } catch ({ response }) {
      message.error(response?.data?.error)
    }
  }

  const showImageSelectModal = () => {
    currentSelect.value = 1
    imagesSelect.value = []
    totalSelect.value = 0
    fetchImagesSelect()
    imageSelectModalVisible.value = true
  }

  const selectCoverImage = image => {
    albumForm.value.coverImage = image
    imageSelectModalVisible.value = false
  }

  const removeCoverImage = () => {
    albumForm.value.coverImage = null
  }

  onMounted(() => {
    getMyAlbums()
    selectAlbum(null)
  })
</script>

<style scoped>
  .my-images {
    padding: 20px;
  }

  .card-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
  }

  .card-title > * {
    margin-bottom: 5px;
  }

  .album-list-overview,
  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
  }

  .album-list-overview .ant-card {
    width: 200px;
    margin-bottom: 20px;
    display: inline-block;
    margin-right: 10px;
  }

  .none-cover {
    height: 100px;
    background-color: #f0f0f0;
    text-align: center;
    line-height: 100px;
  }

  .image-tags {
    margin-top: 8px;
  }

  .image-item {
    width: 100%;
  }

  .image-info {
    display: flex;
    justify-content: space-between;
    color: rgba(0, 0, 0, 0.45);
  }

  :deep(.ant-card-cover),
  :deep(.ant-image-img) {
    height: 150px;
  }

  .image-item :deep(.ant-card-meta-description) {
    white-space: normal;
  }

  .pagination {
    text-align: center;
    margin-top: 20px;
  }

  :deep(.ant-image) {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  :deep(.ant-image-mask) {
    border-radius: 8px 8px 0 0;
  }

  .image-select-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
    max-height: 50vh;
    overflow-y: auto;
    padding-right: 10px;
  }

  .image-select-item {
    cursor: pointer;
  }
</style>
