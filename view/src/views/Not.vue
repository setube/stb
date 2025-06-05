<template>
  <a-result title="404" sub-title="页面不存在">
    <template #icon>
      <img :src="erro404" class="ant-result-icon ant-result-image" />
    </template>
  </a-result>
</template>

<script setup>
  import erro404 from '@/assets/404.svg'
</script>
