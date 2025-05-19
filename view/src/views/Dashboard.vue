<template>
  <div class="dashboard">
    <a-row :gutter="16">
      <a-col :span="8">
        <a-card>
          <template #title>用户总数</template>
          <h2>{{ stats.userCount }}</h2>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card>
          <template #title>图片总数</template>
          <h2>{{ stats.imageCount }}</h2>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card>
          <template #title>活跃用户</template>
          <h2>{{ stats.activeUsers }}</h2>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/stores/axios'

const stats = ref({
  userCount: 0,
  imageCount: 0,
  activeUsers: 0
})

const fetchStats = async () => {
  try {
    const response = await axios.get('/api/admin/stats')
    stats.value = response.data
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

onMounted(fetchStats)
</script>

<style scoped>
.dashboard {
  padding: 24px;
}
</style> 