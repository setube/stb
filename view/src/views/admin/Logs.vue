<template>
  <div class="logs-container">
    <!-- 搜索和过滤 -->
    <div class="search-bar">
      <a-form layout="inline">
        <a-form-item label="日期范围" class="range-picker">
          <a-range-picker v-model:value="dateRange" :locale="locale" />
        </a-form-item>
        <a-form-item label="用户名">
          <a-input v-model:value="username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="IP地址">
          <a-input v-model:value="ip" placeholder="请输入IP地址" />
        </a-form-item>
        <a-form-item class="search-button">
          <a-button type="primary" :disabled="!dateRange.length && !username && !ip" @click="handleSearch">
            搜索
          </a-button>
          <a-button style="margin-left: 8px" :disabled="!dateRange.length" @click="handleReset">重置</a-button>
          <a-button type="primary" danger style="margin-left: 8px" @click="handleClearAll">清空日志</a-button>
        </a-form-item>
      </a-form>
    </div>
    <a-spin :spinning="loading">
      <el-table :data="logs" :scrollbar-always-on="true" fit>
        <el-table-column label="用户名" fixed>
          <template #default="{ row }">
            {{ row?.user?.username || '游客' }}
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP地址" />
        <el-table-column prop="createdAt" label="上传时间">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="originalName" label="文件名" />
        <el-table-column label="文件大小">
          <template #default="{ row }">
            {{ formatFileSize(row.size) }}
          </template>
        </el-table-column>
        <el-table-column label="图片尺寸">
          <template #default="{ row }">{{ row.width }}x{{ row.height }}</template>
        </el-table-column>
        <el-table-column prop="format" label="图片格式" />
        <el-table-column label="操作" fixed="right">
          <template #default="{ row }">
            <a-button type="link" danger @click="handleDelete(row._id)">删除</a-button>
          </template>
        </el-table-column>
      </el-table>
    </a-spin>
    <a-pagination
      v-model:current="current"
      v-model:page-size="pageSize"
      :total="total"
      show-size-changer
      @change="fetchLogs"
    />
  </div>
  <div class="stats-card">
    <a-card title="每日上传统计">
      <div ref="dailyChartRef" style="height: 300px"></div>
    </a-card>
    <a-card title="IP分布统计">
      <div ref="ipChartRef" style="height: 300px"></div>
    </a-card>
    <a-card title="用户上传统计">
      <div ref="userChartRef" style="height: 300px"></div>
    </a-card>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { message, Modal } from 'ant-design-vue'
  import axios from '@/stores/axios'
  import { formatDate, formatFileSize } from '@/stores/formatDate'
  import locale from 'ant-design-vue/es/date-picker/locale/zh_CN'
  import * as echarts from 'echarts'
  import qs from 'qs'

  // 状态变量
  const loading = ref(false)
  const logs = ref([])
  const dateRange = ref([])

  // 分页配置
  const current = ref(1)
  const pageSize = ref(10)
  const total = ref(0)

  // 搜索条件
  const username = ref('')
  const ip = ref('')

  // 图表引用
  const dailyChartRef = ref(null)
  const ipChartRef = ref(null)
  const userChartRef = ref(null)

  // 添加图表实例变量
  const dailyChart = ref(null)
  const ipChart = ref(null)
  const userChart = ref(null)

  // 获取日志列表
  const fetchLogs = async () => {
    loading.value = true
    try {
      const { data } = await axios.post(
        '/api/admin/logs',
        qs.stringify({
          page: current.value,
          limit: pageSize.value,
          startDate: dateRange.value[0]?.format('YYYY-MM-DD'),
          endDate: dateRange.value[1]?.format('YYYY-MM-DD'),
          ip: ip.value,
          username: username.value
        })
      )
      logs.value = data.logs
      total.value = data.total
    } catch ({ response }) {
      message.error(response?.data?.error)
    } finally {
      loading.value = false
    }
  }

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const { data } = await axios.post(
        '/api/admin/logs/stats',
        qs.stringify({
          startDate: dateRange.value[0]?.format('YYYY-MM-DD'),
          endDate: dateRange.value[1]?.format('YYYY-MM-DD')
        })
      )
      initCharts(data)
    } catch ({ response }) {
      message.error(response?.data?.error)
    }
  }

  // 初始化图表
  const initCharts = data => {
    // 销毁旧的图表实例
    if (dailyChart.value) {
      dailyChart.value.dispose()
    }
    if (ipChart.value) {
      ipChart.value.dispose()
    }
    if (userChart.value) {
      userChart.value.dispose()
    }
    // 创建新的图表实例
    dailyChart.value = echarts.init(dailyChartRef.value)
    ipChart.value = echarts.init(ipChartRef.value)
    userChart.value = echarts.init(userChartRef.value)
    // 设置图表配置
    dailyChart.value.setOption({
      tooltip: {
        trigger: 'item',
        formatter: params => {
          return `${params.seriesName}: ${params.value}`
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.dailyStats.map(item => `${item._id.year}-${item._id.month}-${item._id.day}`),
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: '上传数量'
      },
      series: [
        {
          data: data.dailyStats.map(item => item.count),
          type: 'line',
          smooth: true,
          name: '上传数量',
          itemStyle: {
            color: '#1890ff'
          }
        }
      ]
    })
    ipChart.value.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      series: [
        {
          type: 'pie',
          radius: '50%',
          data: data.ipStats.map(item => ({
            name: item._id || '未知IP',
            value: item.count
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    })
    userChart.value.setOption({
      tooltip: {
        trigger: 'item',
        formatter: function (params) {
          return `上传数量: ${params.value}`
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.userStats.map(item => item.username || '未知用户'),
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: '上传数量'
      },
      series: [
        {
          data: data.userStats.map(item => item.count),
          type: 'bar',
          name: '上传数量',
          itemStyle: {
            color: '#1890ff'
          },
          emphasis: {
            itemStyle: {
              color: '#40a9ff'
            }
          }
        }
      ]
    })
  }
  // 组件挂载时添加事件监听
  onMounted(() => {
    fetchLogs()
    fetchStats()
  })

  // 搜索
  const handleSearch = () => {
    current.value = 1
    fetchLogs()
    if (dateRange.value.length) {
      fetchStats()
    }
  }

  // 重置
  const handleReset = () => {
    if (dateRange.value.length) {
      handleSearch()
    }
    dateRange.value = []
    username.value = ''
    ip.value = ''
  }

  // 删除指定日志
  const handleDelete = async id => {
    try {
      await axios.delete(`/api/admin/logs/${id}`)
      message.success('删除成功')
      // 刷新列表
      fetchLogs()
    } catch ({ response }) {
      message.error(response?.data?.error)
    }
  }

  // 清空所有日志
  const handleClearAll = async () => {
    try {
      Modal.confirm({
        title: '确认清空',
        content: '确定要清空所有日志吗？此操作不可恢复！',
        okText: '确定',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          await axios.delete('/api/admin/logs')
          message.success('所有日志已清空')
          // 刷新列表
          fetchLogs()
        }
      })
    } catch ({ response }) {
      message.error(response?.data?.error)
    }
  }
</script>

<style scoped>
  .logs-container {
    padding: 24px;
  }

  .search-bar {
    margin-bottom: 24px;
  }

  .stats-card {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    padding: 0 10px;
  }

  .ant-card {
    width: calc(33.333% - 15px);
    margin-right: 15px;
  }

  .ant-pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .ant-card:last-child {
    margin-right: 0;
  }

  @media (max-width: 768px) {
    .ant-card {
      width: 100%;
      margin-top: 10px;
      margin-right: 0;
    }

    .ant-form {
      justify-content: center;
    }

    .ant-form-item {
      width: 100%;
    }

    .search-button {
      margin-top: 10px;
    }

    .range-picker {
      display: none;
    }
  }
</style>
