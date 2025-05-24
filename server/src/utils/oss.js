import { createReadStream } from 'fs'
import { Config } from '../models/Config.js'
// 阿里云OSS
import OSS from 'ali-oss'
// 腾讯云COS
import COS from 'cos-nodejs-sdk-v5'
// 七牛云
import qiniu from 'qiniu'
// AWS S3 和 CloudFlare R2
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
// 又拍云
import upyun from 'upyun'
// SFTP 相关
import SftpClient from 'ssh2-sftp-client'
// FTP 相关
import * as ftp from 'basic-ftp'
// WebDAV 相关
import { createClient } from 'webdav'
import TelegramBot from 'node-telegram-bot-api'
import fs from 'fs'
import { Octokit } from '@octokit/rest'
import { promisify } from 'util'
import { pipeline } from 'stream'

// 上传文件到COS
export const uploadToCOS = async (filePath, cosPath) => {
  // 如果是//
  if (cosPath.startsWith('//')) {
    cosPath = cosPath.substring(1)
  }
  try {
    const config = await Config.findOne()
    const cos = new COS({
      SecretId: config.storage.cos.secretId,
      SecretKey: config.storage.cos.secretKey,
    })
    return new Promise((resolve, reject) => {
      cos.putObject({
        Bucket: config.storage.cos.bucket,
        Region: config.storage.cos.region,
        Key: cosPath, // 使用完整的存储路径
        Body: createReadStream(filePath)
      }, function (err, data) {
        if (err) {
          console.error('COS上传失败1:', err)
          reject(err)
          return
        }
        // 构建访问URL
        const url = `https://${config.storage.cos.bucket}.cos.${config.storage.cos.region}.myqcloud.com${cosPath}`
        resolve(url)
      })
    })
  } catch (error) {
    console.error('COS上传失败2:', error)
    throw error
  }
}

// 从COS删除文件
export const deleteFromCOS = async (cosPath) => {
  try {
    const config = await Config.findOne()
    const cos = new COS({
      SecretId: config.storage.cos.secretId,
      SecretKey: config.storage.cos.secretKey,
    })
    return new Promise((resolve, reject) => {
      cos.deleteObject({
        Bucket: config.storage.cos.bucket,
        Region: config.storage.cos.region,
        Key: cosPath, // 使用完整的存储路径
      }, function (err, data) {
        if (err) {
          console.error('COS删除失败1:', err)
          reject(err)
          return
        }
        resolve(data)
      })
    })
  } catch (error) {
    console.error('COS删除失败2:', error)
    throw error
  }
}

// 上传文件到OSS
export const uploadToOSS = async (filePath, ossPath) => {
  try {
    const config = await Config.findOne()
    const client = new OSS({
      accessKeyId: config.storage.oss.accessKeyId, // 阿里云账号的AccessKey ID
      accessKeySecret: config.storage.oss.accessKeySecret, // 阿里云账号的AccessKey Secret
      bucket: config.storage.oss.bucket, // Bucket名称
      region: config.storage.oss.region, // Bucket所在地域
      endpoint: config.storage.oss.endpoint, // 传输加速域名
      internal: config.storage.oss.internal, // 是否使用内网传输加速域名
      isCname: config.storage.oss.isCname, // 是否使用自定义域名
      authorizationV4: true // 使用V4签名
    })
    const result = await client.put(ossPath, filePath)
    return result.url
  } catch (error) {
    console.error('OSS上传失败:', error)
    throw error
  }
}

// 从OSS删除文件
export const deleteFromOSS = async (ossPath) => {
  try {
    const config = await Config.findOne()
    const client = new OSS({
      accessKeyId: config.storage.oss.accessKeyId, // 阿里云账号的AccessKey ID
      accessKeySecret: config.storage.oss.accessKeySecret, // 阿里云账号的AccessKey Secret
      bucket: config.storage.oss.bucket, // Bucket名称
      region: config.storage.oss.region, // Bucket所在地域
      endpoint: config.storage.oss.endpoint, // 传输加速域名
      internal: config.storage.oss.internal, // 是否使用内网传输加速域名
      isCname: config.storage.oss.isCname, // 是否使用自定义域名
      authorizationV4: true // 使用V4签名
    })
    await client.delete(ossPath)
  } catch (error) {
    console.error('OSS删除失败:', error)
    throw error
  }
}

// 上传到 S3
export const uploadToS3 = async (filePath) => {
  try {
    const configInfo = await Config.findOne()
    const config = configInfo.storage.s3
    const s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      },
      ...(config.endpoint && { endpoint: config.endpoint })
    })
    const key = filePath
    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: createReadStream(filePath)
    })
    await s3Client.send(command)
    // 构建访问URL
    let url
    if (config.endpoint) {
      // 自定义域名
      url = `${config.endpoint}/${key}`
    } else {
      // AWS 标准域名
      url = `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`
    }
    return url
  } catch (error) {
    console.error('AWS S3上传失败:', error)
    throw error
  }
}

// 从 S3 删除
export const deleteFromS3 = async (filename) => {
  try {
    const configInfo = await Config.findOne()
    const config = configInfo.storage.s3
    const s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      },
      ...(config.endpoint && { endpoint: config.endpoint })
    })
    const command = new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: filename
    })
    await s3Client.send(command)
  } catch (error) {
    console.error('S3 delete error:', error)
    throw error
  }
}

// 上传到 R2
export const uploadToR2 = async (filePath) => {
  try {
    const configInfo = await Config.findOne()
    const config = configInfo.storage.r2
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    })
    const key = filePath
    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: createReadStream(filePath),
    })
    await s3Client.send(command)
    // 使用配置的公共URL
    return `${config.publicUrl}/${key}`
  } catch (error) {
    console.error('Cloudflare R2上传失败:', error)
    throw error
  }
}

// 从 R2 删除
export const deleteFromR2 = async (filePath) => {
  try {
    const configInfo = await Config.findOne()
    const config = configInfo.storage.r2
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    })
    const command = new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: filePath
    })
    await s3Client.send(command)
  } catch (error) {
    console.error('R2 delete error:', error)
    throw error
  }
}

// 生成七牛云上传凭证
export const getUploadToken = async () => {
  try {
    const configInfo = await Config.findOne()
    const config = configInfo.storage.qiniu
    const mac = new qiniu.auth.digest.Mac(config.accessKey, config.secretKey)
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: config.bucket
    })
    return putPolicy.uploadToken(mac)
  } catch (error) {
    console.error('七牛云上传凭证获取失败:', error)
    throw error
  }
}

// 上传文件到七牛云
export const uploadToQiNiu = async (token, filePath, key) => {
  const configInfo = await Config.findOne()
  const config = configInfo.storage.qiniu
  return new Promise((resolve, reject) => {
    const conf = new qiniu.conf.Config()
    const formUploader = new qiniu.form_up.FormUploader(conf)
    const putExtra = new qiniu.form_up.PutExtra()
    formUploader.putFile(token, key, filePath, putExtra, (err, body, info) => {
      if (err) return reject(err)
      if (info.statusCode == 200) {
        resolve(`http://${config.domain}/${body.key}`)
      } else {
        reject(new Error(`七牛云上传失败: ${info.statusCode}`))
      }
    })
  })
}

// 从七牛云删除文件
export const deleteFromQiNiu = async (key) => {
  const configInfo = await Config.findOne()
  const config = configInfo.storage.qiniu
  const qiniuConfig = new qiniu.conf.Config()
  const mac = new qiniu.auth.digest.Mac(config.accessKey, config.secretKey)
  const bucketManager = new qiniu.rs.BucketManager(mac, qiniuConfig)
  return new Promise((resolve, reject) => {
    bucketManager.delete(config.bucket, key, (err, respBody, respInfo) => {
      if (err) return reject(err)
      if (respInfo.statusCode == 200) {
        resolve()
      } else {
        console.log(respInfo)
        reject(new Error(`七牛云删除失败: ${respInfo}`))
      }
    })
  })
}

// 上传到又拍云
export const uploadToUpyun = async (filePath) => {
  try {
    const configInfo = await Config.findOne()
    const config = configInfo.storage.upyun
    const service = new upyun.Service(config.service, config.operator, config.password)
    const client = new upyun.Client(service)
    const key = `${config.directory}/${filePath}`
    const result = await client.putFile(key, createReadStream(filePath))
    if (result) {
      // 构建访问URL
      return `${config.domain}/${key}`
    } else {
      throw new Error('又拍云上传失败')
    }
  } catch (error) {
    console.error('又拍云上传失败:', error)
    throw error
  }
}

// 从又拍云删除
export const deleteFromUpyun = async (filename) => {
  try {
    const configInfo = await Config.findOne()
    const config = configInfo.storage.upyun
    const service = new upyun.Service(config.service, config.operator, config.password)
    const client = new upyun.Client(service)
    const result = await client.deleteFile(filename)
    if (!result) {
      throw new Error('又拍云删除失败')
    }
  } catch (error) {
    console.error('又拍云删除失败:', error)
    throw error
  }
}

// 上传到 SFTP
export const uploadToSftp = async (filePath, key) => {
  try {
    const configInfo = await Config.findOne()
    const config = configInfo.storage.sftp
    const sftp = new SftpClient()
    const connectConfig = {
      host: config.host,
      port: config.port,
      username: config.username,
      connectTimeout: config.connectTimeout * 1000,
      retries: config.retries,
      hostFingerprint: config.hostFingerprint
    }
    // 根据是否使用SSH选择认证方式
    if (config.useSSH) {
      connectConfig.privateKey = config.privateKey
      connectConfig.passphrase = config.passphrase
    } else {
      connectConfig.password = config.password
    }
    await sftp.connect(connectConfig)
    // 确保目录存在
    const dirPath = config.directory
    try {
      await sftp.mkdir(dirPath, true) // true 表示递归创建目录
    } catch (err) {
      // 如果目录已存在，忽略错误
      if (err.code !== 'EEXIST') {
        throw err
      }
    }
    // 使用文件路径创建读取流
    await sftp.put(createReadStream(filePath), `${dirPath}/${key}`)
    await sftp.end()
    // 构建访问URL
    return `${config.domain}/${dirPath}/${key}`
  } catch (error) {
    console.error('SFTP上传失败:', error)
    throw error
  }
}

// 从 SFTP 删除
export const deleteFromSftp = async (filePath) => {
  try {
    const configInfo = await Config.findOne()
    const config = configInfo.storage.sftp
    const sftp = new SftpClient()
    const connectConfig = {
      host: config.host,
      port: config.port,
      username: config.username,
      connectTimeout: config.connectTimeout * 1000,
      retries: config.retries,
      hostFingerprint: config.hostFingerprint
    }
    // 根据是否使用SSH选择认证方式
    if (config.useSSH) {
      connectConfig.privateKey = config.privateKey
      connectConfig.passphrase = config.passphrase
    } else {
      connectConfig.password = config.password
    }
    await sftp.connect(connectConfig)
    await sftp.delete(filePath)
    await sftp.end()
  } catch (error) {
    throw error
  }
}

// 上传到 FTP
export const uploadToFtp = async (filePath, key) => {
  let client = null
  let retryCount = 0
  const maxRetries = 3
  while (retryCount < maxRetries) {
    try {
      const configInfo = await Config.findOne()
      const config = configInfo.storage.ftp
      client = new ftp.Client()
      // 设置客户端选项
      client.ftp.verbose = true  // 启用详细日志
      client.ftp.encoding = config.useUTF8 ? 'utf8' : 'latin1'
      // 设置更长的超时时间
      const accessOptions = {
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        secure: config.secure,
        passvTimeout: config.connectTimeout * 1000, // 增加被动模式超时时间到60秒
        keepalive: config.connectTimeout * 1000, // 增加保活时间到30秒
        timeout: config.connectTimeout * 1000 // 增加连接超时时间到60秒
      }
      const dirPath = config.directory
      await client.access(accessOptions)
      // 设置传输模式
      if (config.transferMode === 'binary') {
        await client.send('TYPE I')
      } else {
        await client.send('TYPE A')
      }
      // 设置被动模式
      if (config.passive) {
        await client.send('PASV')
      } else {
        client.ftp.passive = false
        await client.send('PORT')
      }
      // 确保目录存在
      if (config.recursive) {
        await client.ensureDir(dirPath)
      }
      await client.uploadFrom(createReadStream(filePath), `${dirPath}/${key}`)
      if (client) {
        client.close()
      }
      // 构建访问URL
      return `${config.domain}/${dirPath}/${key}`
    } catch (error) {
      if (client) {
        try {
          client.close()
        } catch (closeError) {
          throw new Error('关闭FTP连接失败:', closeError)
        }
      }
      retryCount++
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 5000))
      } else {
        throw new Error(`FTP上传失败，已重试${maxRetries}次: ${error.message}`)
      }
    }
  }
}

// 从 FTP 删除
export const deleteFromFtp = async (filePath) => {
  try {
    const configInfo = await Config.findOne()
    const config = configInfo.storage.ftp
    const client = new ftp.Client()
    // 设置客户端选项
    client.ftp.verbose = true
    client.ftp.encoding = config.useUTF8 ? 'utf8' : 'latin1'
    await client.access({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      secure: config.secure,
      passvTimeout: config.connectTimeout * 1000,
      keepalive: config.connectTimeout * 1000
    })
    // 设置传输模式
    if (config.transferMode === 'binary') {
      await client.send('TYPE I')
    } else {
      await client.send('TYPE A')
    }
    // 设置被动模式
    if (config.passive) {
      await client.send('PASV')
    }
    // 忽略被动模式下的远程 IP
    if (config.ignorePassiveIP) {
      client.ftp.passive = false
    }
    await client.remove(filePath)
    client.close()
  } catch (error) {
    throw error
  }
}

// 上传到 WebDAV
export const uploadToWebdav = async (filePath, key) => {
  try {
    const configInfo = await Config.findOne()
    const config = configInfo.storage.webdav
    const client = createClient(config.url, {
      username: config.username,
      password: config.password,
      authType: config.authType
    })
    const dirPath = config.directory
    await client.putFileContents(`${dirPath}/${key}`, createReadStream(filePath))
    // 构建访问URL
    return `${config.domain}/${dirPath}/${key}`
  } catch (error) {
    throw error
  }
}

// 从 WebDAV 删除
export const deleteFromWebdav = async (filePath) => {
  try {
    const configInfo = await Config.findOne()
    const config = configInfo.storage.webdav
    const client = createClient(config.url, {
      username: config.username,
      password: config.password,
      authType: config.authType
    })
    await client.deleteFile(filePath)
  } catch (error) {
    throw error
  }
}

// 上传到 Telegram
export const uploadToTelegram = async (filePath, key, user) => {
  try {
    const configInfo = await Config.findOne()
    const config = configInfo.storage.telegram
    // 创建bot实例，添加更多网络配置
    const bot = new TelegramBot(config.botToken, {
      polling: config.polling,  // 禁用轮询
      request: {
        timeout: config.timeout * 1000,  // 设置超时时间为30秒
        proxy: config.proxy,  // 使用代理
        agentOptions: {
          keepAlive: true,
          family: 4,  // 强制使用 IPv4
          timeout: config.timeout * 1000
        }
      }
    })
    // 使用 sendPhoto 方法上传图片
    const result = await bot.sendPhoto(config.chatId, filePath, {
      caption: `文件名: ${key}\n上传用户: ${user.username}\n用户ID: ${user._id}`,
      parse_mode: 'HTML'
    })
    // 获取文件信息
    const fileId = result.photo[result.photo.length - 1].file_id
    return {
      url: await bot.getFileLink(fileId),
      fileId: result.message_id
    }
  } catch (error) {
    throw error
  }
}

// 从 Telegram 删除
export const deleteFromTelegram = async (fileId) => {
  try {
    const configInfo = await Config.findOne()
    const config = configInfo.storage.telegram
    const bot = new TelegramBot(config.botToken, {
      polling: config.polling,  // 禁用轮询
      request: {
        timeout: config.timeout * 1000,  // 设置超时时间为30秒
        proxy: config.proxy,  // 使用代理
        agentOptions: {
          keepAlive: true,
          family: 4,  // 强制使用 IPv4
          timeout: config.timeout * 1000
        }
      }
    })

    // 发送消息获取消息ID
    const message = await bot.sendMessage(config.chatId, '正在删除文件...')
    const messageId = message.message_id
    // 删除消息
    await bot.deleteMessage(config.chatId, messageId)
    await bot.deleteMessage(config.chatId, fileId)
  } catch (error) {
    throw error
  }
}

// 上传到 GitHub
export const uploadToGithub = async (filePath, key, user) => {
  let retryCount = 0
  const maxRetries = 3
  const retryDelay = 5000 // 5秒

  while (retryCount < maxRetries) {
    try {
      const configInfo = await Config.findOne()
      const config = configInfo.storage.github
      // 创建 Octokit 实例，添加更多配置
      const octokit = new Octokit({
        auth: config.token,
        request: {
          timeout: config.timeout * 1000, // 30秒超时
          retries: config.retries, // 重试3次
          retryAfter: config.retryAfter * 1000 // 5秒后重试
        }
      })
      // 读取文件内容
      const fileContent = await fs.promises.readFile(filePath)
      const content = fileContent.toString('base64')
      // 构建文件路径，移除开头的斜杠
      const path = `${config.directory}/${key}`
      // 上传文件
      await octokit.repos.createOrUpdateFileContents({
        owner: config.owner,
        repo: config.repo,
        path,
        message: `用户: ${user.username}, 上传文件: ${key}`,
        content: content,
        branch: config.branch
      })
      // 开启自定义域名
      if (config.customDomain && !config.isGithubPages) {
        // 构建自定义域名URL
        return `${config.domain}/${path}`
      }
      if (config.customDomain && config.isGithubPages) {
        // 构建自定义域名URL
        return `${config.githubPages}/${config.repo}/${path}`
      }
      // 构建访问URL
      return `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${path}`
    } catch (error) {
      retryCount++
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      } else {
        throw new Error(`GitHub上传失败，已重试${maxRetries}次: ${error.message}`)
      }
    }
  }
}

// 从 GitHub 删除
export const deleteFromGithub = async (filePath) => {
  try {
    const configInfo = await Config.findOne()
    const config = configInfo.storage.github
    // 创建 Octokit 实例
    const octokit = new Octokit({
      auth: config.token
    })
    // 先获取文件的 SHA 值
    const { data: fileData } = await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: filePath,
      ref: config.branch
    })
    if (!fileData || !fileData.sha) {
      throw new Error('无法获取文件的 SHA 值')
    }
    // 删除文件
    await octokit.repos.deleteFile({
      owner: config.owner,
      repo: config.repo,
      path: filePath,
      message: `删除文件: ${filePath}`,
      sha: fileData.sha,
      branch: config.branch
    })
  } catch (error) {
    throw error
  }
}