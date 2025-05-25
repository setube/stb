<template>
  <div class="dashboard">
    <a-spin :spinning="spinning">
      <div class="ant-row">
        <a-card class="ant-row-item" v-for="(item, index) in stats" :key="index">
          <template #title>{{ item.name }}</template>
          <h2>{{ item.value }}</h2>
        </a-card>
      </div>
      <div class="ant-row">
        <a-card class="ant-row-item-table">
          <template #title>系统信息</template>
          <el-table stripe :data="system" :show-header="false">
            <el-table-column prop="name" />
            <el-table-column prop="value" />
          </el-table>
        </a-card>
      </div>
    </a-spin>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/stores/axios'

const stats = ref([])
const system = ref([])
const spinning = ref(true)

const fetchStats = async () => {
  try {
    const response = await axios.post('/api/admin/stats')
    stats.value = response.data.stats
    system.value = response.data.system
    spinning.value = false
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

.ant-row {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 10px;
  justify-content: center;
}

.ant-row-item {
  width: calc(24% - 16px);
  margin: 8px;
  text-align: center;
}

.ant-row-item-table {
  width: 100%;
}

@media screen and (max-width: 768px) {
  .ant-row-item {
    width: calc(50% - 16px);
  }
}
</style>