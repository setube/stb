import ClipboardJS from 'clipboard'
import { message } from 'ant-design-vue'

// 时间格式转换
export const formatDate = timestamp => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 图片大小转换
export const formatFileSize = bytes => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 复制链接
export const copyImages = (event, image, userStore) => {
  // 创建新的实例
  const clipboard = new ClipboardJS(event.target, {
    text: () => {
      return image.type == 'local' ? userStore.config.site.url + image.url : image.url
    }
  })
  clipboard.on('success', e => {
    e.clearSelection()
    message.success('链接已复制到剪贴板')
    clipboard.destroy()
  })
  clipboard.on('error', e => {
    message.error('复制失败, 请检查当前浏览器是否支持Clipboard.js')
    clipboard.destroy()
  })
}

// 图片所属存储类型
export const imageStoreType = {
  local: '本地存储',
  oss: '阿里云OSS',
  cos: '腾讯云COS',
  s3: 'AWS S3',
  r2: 'Cloudflare R2',
  qiniu: '七牛云 Kodo',
  upyun: '又拍云 USS',
  sftp: 'SFTP',
  ftp: 'FTP',
  webdav: 'WebDAV',
  telegram: 'Telegram',
  github: 'GitHub',
  get: key => imageStoreType[key] ?? '本地存储'
}

// 图片健康状态
export const imageHealthStatus = {
  Block: {
    color: 'red',
    text: '建议屏蔽'
  },
  Review: {
    color: 'orange',
    text: '建议人工审核'
  },
  Pass: {
    color: 'green',
    text: '建议通过'
  },
  high: {
    color: 'red',
    text: '高风险'
  },
  medium: {
    color: 'orange',
    text: '中风险'
  },
  low: {
    color: 'green',
    text: '低风险'
  },
  none: {
    color: 'gray',
    text: '无风险'
  }
}

// 图片检测结果
export const imageCheckResult = {
  Porn: {
    color: 'red',
    text: '色情'
  },
  Ad: {
    color: 'red',
    text: '广告'
  },
  Abuse: {
    color: 'red',
    text: '暴力'
  },
  Normal: {
    color: 'green',
    text: '正常'
  },
  unsafe: {
    color: 'red',
    text: '不安全'
  },
  safe: {
    color: 'green',
    text: '安全'
  }
}
