// 阿里云OSS
import OSS from 'ali-oss'
// 腾讯云COS
import COS from 'cos-nodejs-sdk-v5'
// 七牛云
import qiniu from 'qiniu'
// S3 兼容存储
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
import { Octokit } from '@octokit/rest'
import fs from 'fs/promises'
import { createReadStream } from 'fs'
import { Config } from '../models/Config.js'
import path from 'path'
import axios from 'axios'

// 上传文件到COS
export const uploadToCOS = async (filePath, cosPath) => {
  // 如果是//
  if (cosPath.startsWith('//')) {
    cosPath = cosPath.substring(1)
  }
  try {
    const { storage } = await Config.findOne()
    const { secretId, secretKey, bucket, region } = storage.cos
    const cos = new COS({
      SecretId: secretId,
      SecretKey: secretKey
    })
    // 获取文件扩展名
    const ext = path.extname(filePath).toLowerCase()
    // 根据扩展名设置 Content-Type
    const ContentType =
      {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      }[ext] || 'application/octet-stream'
    return new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: bucket,
          Region: region,
          Key: cosPath, // 使用完整的存储路径
          Body: createReadStream(filePath),
          ContentType,
          Headers: {
            'Content-Disposition': 'inline'
          }
        },
        (err, data) => {
          if (err) {
            reject(err)
            return
          }
          // 构建访问URL
          const url = `https://${bucket}.cos.${region}.myqcloud.com${cosPath}`
          resolve(url)
        }
      )
    })
  } catch ({ message }) {
    throw new Error(message)
  }
}

// 从COS删除文件
export const deleteFromCOS = async cosPath => {
  try {
    const { storage } = await Config.findOne()
    const { secretId, secretKey, bucket, region } = storage.cos
    const cos = new COS({
      SecretId: secretId,
      SecretKey: secretKey
    })
    return new Promise((resolve, reject) => {
      cos.deleteObject(
        {
          Bucket: bucket,
          Region: region,
          Key: cosPath // 使用完整的存储路径
        },
        (err, data) => {
          if (err) {
            reject(err)
            return
          }
          resolve(data)
        }
      )
    })
  } catch ({ message }) {
    throw new Error(message)
  }
}

// 上传文件到OSS
export const uploadToOSS = async (filePath, ossPath) => {
  try {
    const { storage } = await Config.findOne()
    const { accessKeyId, accessKeySecret, bucket, region, endpoint, internal, isCname } = storage.oss
    const client = new OSS({
      accessKeyId, // 阿里云账号的AccessKey ID
      accessKeySecret, // 阿里云账号的AccessKey Secret
      bucket, // Bucket名称
      region, // Bucket所在地域
      endpoint, // 传输加速域名
      internal, // 是否使用内网传输加速域名
      isCname, // 是否使用自定义域名
      authorizationV4: true // 使用V4签名
    })
    const result = await client.put(ossPath, filePath)
    return result.url
  } catch ({ message }) {
    throw new Error(message)
  }
}

// 从OSS删除文件
export const deleteFromOSS = async ossPath => {
  try {
    const { storage } = await Config.findOne()
    const { accessKeyId, accessKeySecret, bucket, region, endpoint, internal, isCname } = storage.oss
    const client = new OSS({
      accessKeyId, // 阿里云账号的AccessKey ID
      accessKeySecret, // 阿里云账号的AccessKey Secret
      bucket, // Bucket名称
      region, // Bucket所在地域
      endpoint, // 传输加速域名
      internal, // 是否使用内网传输加速域名
      isCname, // 是否使用自定义域名
      authorizationV4: true // 使用V4签名
    })
    await client.delete(ossPath)
  } catch ({ message }) {
    throw new Error(message)
  }
}

// 上传到 S3
export const uploadToS3 = async (filePath, Key) => {
  try {
    const { storage } = await Config.findOne()
    const { region, accessKeyId, bucket, secretAccessKey, endpoint } = storage.s3
    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      },
      endpoint,
      forcePathStyle: true,
      sslEnabled: true
    })
    // 获取文件扩展名
    const ext = path.extname(filePath).toLowerCase()
    // 根据扩展名设置 Content-Type
    const contentType = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    }
    const stats = await fs.stat(filePath)
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key,
        Body: createReadStream(filePath),
        ContentType: contentType[ext],
        ContentLength: stats.size
      })
    )
    return `${endpoint}${Key}`
  } catch ({ message }) {
    throw new Error(message)
  }
}

// 从 S3 删除
export const deleteFromS3 = async Key => {
  try {
    const { storage } = await Config.findOne()
    const { region, accessKeyId, bucket, secretAccessKey, endpoint } = storage.s3
    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      },
      endpoint
    })
    const data = await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key
      })
    )
  } catch ({ message }) {
    throw new Error(message)
  }
}

// 生成七牛云上传凭证
export const getUploadToken = async () => {
  try {
    const { storage } = await Config.findOne()
    const { accessKey, secretKey, bucket } = storage.qiniu
    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: bucket
    })
    return putPolicy.uploadToken(mac)
  } catch ({ message }) {
    throw new Error(message)
  }
}

// 上传文件到七牛云
export const uploadToQiNiu = async (token, filePath, key) => {
  const { storage } = await Config.findOne()
  const { domain } = storage.qiniu
  return new Promise((resolve, reject) => {
    const conf = new qiniu.conf.Config()
    const formUploader = new qiniu.form_up.FormUploader(conf)
    const putExtra = new qiniu.form_up.PutExtra()
    formUploader.putFile(token, key, filePath, putExtra, (err, body, info) => {
      if (err) return reject(err)
      if (info.statusCode == 200) {
        resolve(`http://${domain}/${body.key}`)
      } else {
        reject(new Error(`七牛云上传失败: ${info.statusCode}`))
      }
    })
  })
}

// 从七牛云删除文件
export const deleteFromQiNiu = async key => {
  const { storage } = await Config.findOne()
  const { accessKey, secretKey, bucket } = storage.qiniu
  const qiniuConfig = new qiniu.conf.Config()
  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
  const bucketManager = new qiniu.rs.BucketManager(mac, qiniuConfig)
  return new Promise((resolve, reject) => {
    bucketManager.delete(bucket, key, (err, respBody, respInfo) => {
      if (err) return reject(err)
      if (respInfo.statusCode == 200) {
        resolve()
      } else {
        reject(new Error(`七牛云删除失败:${respInfo.data.error}`))
      }
    })
  })
}

// 上传到又拍云
export const uploadToUpyun = async filePath => {
  try {
    const { storage } = await Config.findOne()
    const { service, operator, password, directory, domain } = storage.upyun
    const newService = new upyun.Service(service, operator, password)
    const client = new upyun.Client(newService)
    const key = `${directory}/${filePath}`
    const result = await client.putFile(key, createReadStream(filePath))
    if (result) {
      // 构建访问URL
      return `${domain}/${key}`
    } else {
      throw new Error('又拍云上传失败')
    }
  } catch ({ message }) {
    throw new Error(message)
  }
}

// 从又拍云删除
export const deleteFromUpyun = async filename => {
  try {
    const { storage } = await Config.findOne()
    const { service, operator, password } = storage.upyun
    const newService = new upyun.Service(service, operator, password)
    const client = new upyun.Client(newService)
    const result = await client.deleteFile(filename)
    if (!result) {
      throw new Error('又拍云删除失败')
    }
  } catch ({ message }) {
    throw new Error(message)
  }
}

// 上传到 SFTP
export const uploadToSftp = async (filePath, key) => {
  try {
    const { storage } = await Config.findOne()
    const {
      host,
      port,
      username,
      useSSH,
      privateKey,
      passphrase,
      directory,
      domain,
      connectTimeout,
      retries,
      hostFingerprint
    } = storage.sftp
    const sftp = new SftpClient()
    const connectConfig = {
      host,
      port,
      username,
      connectTimeout: connectTimeout * 1000,
      retries,
      hostFingerprint
    }
    // 根据是否使用SSH选择认证方式
    if (useSSH) {
      connectConfig.privateKey = privateKey
      connectConfig.passphrase = passphrase
    } else {
      connectConfig.password = password
    }
    await sftp.connect(connectConfig)
    try {
      await sftp.mkdir(directory, true) // true 表示递归创建目录
    } catch (err) {
      // 如果目录已存在，忽略错误
      if (err.code !== 'EEXIST') {
        throw err
      }
    }
    // 使用文件路径创建读取流
    await sftp.put(createReadStream(filePath), `${directory}/${key}`)
    await sftp.end()
    // 构建访问URL
    return `${domain}/${directory}/${key}`
  } catch ({ message }) {
    throw new Error(message)
  }
}

// 从 SFTP 删除
export const deleteFromSftp = async filePath => {
  try {
    const { storage } = await Config.findOne()
    const { host, port, username, useSSH, privateKey, retries, passphrase, connectTimeout, hostFingerprint } =
      storage.sftp
    const sftp = new SftpClient()
    const connectConfig = {
      host,
      port,
      username,
      connectTimeout: connectTimeout * 1000,
      retries,
      hostFingerprint
    }
    // 根据是否使用SSH选择认证方式
    if (useSSH) {
      connectConfig.privateKey = privateKey
      connectConfig.passphrase = passphrase
    } else {
      connectConfig.password = password
    }
    await sftp.connect(connectConfig)
    await sftp.delete(filePath)
    await sftp.end()
  } catch ({ message }) {
    throw new Error(message)
  }
}

// 上传到 FTP
export const uploadToFtp = async (filePath, key) => {
  let client = null
  let retryCount = 0
  const maxRetries = 3
  while (retryCount < maxRetries) {
    try {
      const { storage } = await Config.findOne()
      const {
        host,
        port,
        username,
        password,
        secure,
        useUTF8,
        directory,
        domain,
        connectTimeout,
        transferMode,
        passive,
        recursive
      } = storage.ftp
      client = new ftp.Client()
      // 设置客户端选项
      client.ftp.verbose = true // 启用详细日志
      client.ftp.encoding = useUTF8 ? 'utf8' : 'latin1'
      // 设置更长的超时时间
      const accessOptions = {
        host,
        port,
        user: username,
        password: password,
        secure,
        passvTimeout: connectTimeout * 1000, // 增加被动模式超时时间到60秒
        keepalive: connectTimeout * 1000, // 增加保活时间到30秒
        timeout: connectTimeout * 1000 // 增加连接超时时间到60秒
      }
      await client.access(accessOptions)
      // 设置传输模式
      if (transferMode === 'binary') {
        await client.send('TYPE I')
      } else {
        await client.send('TYPE A')
      }
      // 设置被动模式
      if (passive) {
        await client.send('PASV')
      } else {
        client.ftp.passive = false
        await client.send('PORT')
      }
      // 确保目录存在
      if (recursive) {
        await client.ensureDir(directory)
      }
      await client.uploadFrom(createReadStream(filePath), `${directory}/${key}`)
      if (client) {
        client.close()
      }
      // 构建访问URL
      return `${domain}/${directory}/${key}`
    } catch ({ message }) {
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
        throw new Error(`FTP上传失败，已重试${maxRetries}次: ${message}`)
      }
    }
  }
}

// 从 FTP 删除
export const deleteFromFtp = async filePath => {
  try {
    const { storage } = await Config.findOne()
    const { host, port, username, password, secure, useUTF8, ignorePassiveIP, connectTimeout, transferMode, passive } =
      storage.ftp
    const client = new ftp.Client()
    // 设置客户端选项
    client.ftp.verbose = true
    client.ftp.encoding = useUTF8 ? 'utf8' : 'latin1'
    await client.access({
      host,
      port,
      user: username,
      password,
      secure,
      passvTimeout: connectTimeout * 1000,
      keepalive: connectTimeout * 1000
    })
    // 设置传输模式
    if (transferMode === 'binary') {
      await client.send('TYPE I')
    } else {
      await client.send('TYPE A')
    }
    // 设置被动模式
    if (passive) {
      await client.send('PASV')
    }
    // 忽略被动模式下的远程 IP
    if (ignorePassiveIP) {
      client.ftp.passive = false
    }
    await client.remove(filePath)
    client.close()
  } catch ({ message }) {
    throw new Error(message)
  }
}

// 上传到 WebDAV
export const uploadToWebdav = async (filePath, key) => {
  try {
    const { storage } = await Config.findOne()
    const { username, password, authType, directory, domain, url } = storage.webdav
    const client = createClient(url, { username, password, authType })
    await client.putFileContents(`${directory}/${key}`, createReadStream(filePath))
    // 构建访问URL
    return `${domain}/${directory}/${key}`
  } catch ({ message }) {
    throw new Error(message)
  }
}

// 从 WebDAV 删除
export const deleteFromWebdav = async filePath => {
  try {
    const { storage } = await Config.findOne()
    const { username, password, authType, url } = storage.webdav
    const client = createClient(url, { username, password, authType })
    await client.deleteFile(filePath)
  } catch ({ message }) {
    throw new Error(message)
  }
}

// 上传到 Telegram
export const uploadToTelegram = async (filePath, key, user) => {
  try {
    const { storage } = await Config.findOne()
    const { botToken, polling, timeout, proxy, chatId, channelId } = storage.telegram
    if (!channelId) {
      throw new Error('未设置频道ID, 无法上传')
    }
    // 创建 bot 实例
    const bot = new TelegramBot(botToken, {
      polling,
      request: {
        timeout: timeout * 1000,
        proxy,
        agentOptions: {
          keepAlive: true,
          family: 4,
          timeout: timeout * 1000
        }
      }
    })
    // 上传图片到频道
    const { message_id } = await bot.sendPhoto(chatId, filePath, {
      caption: `文件名: ${key}\n上传用户: ${user.username}\n用户ID: ${user._id}`,
      parse_mode: 'HTML'
    })
    // 获取图片URL
    const { data, status } = await axios.get(`https://post.tg.dev/${channelId}/${message_id}`)
    if (status !== 200) {
      await bot.deleteMessage(chatId, message_id)
      throw new Error('请确认环境网络能够访问post.tg.dev')
    }
    if (data.includes(`Channel with username <b>@${channelId}</b> not found`)) {
      await bot.deleteMessage(chatId, message_id)
      throw new Error(`请确认频道${channelId}是否为公开`)
    }
    // 使用正则匹配图片URL
    const match = data.match(/https:\/\/cdn\d+\.telesco\.pe\/file\/[^\s)'"]+/)
    if (!match) {
      await bot.deleteMessage(chatId, message_id)
      throw new Error(
        '无法获取图片URL, 请前往: https://github.com/setube/stb/issues/new?template=BUG%E5%8F%8D%E9%A6%88.md 反馈'
      )
    }
    return {
      url: match[0],
      fileId: message_id
    }
  } catch ({ message }) {
    if (message.includes('chat not found') || message.includes('bot is not a member')) {
      throw new Error('Bot 需要被添加到频道中并具有发送消息的权限')
    }
    if (message.includes('chat_write_forbidden')) {
      throw new Error('Bot 在频道中没有发送消息的权限')
    }
    throw new Error(message)
  }
}

// 从 Telegram 删除
export const deleteFromTelegram = async fileId => {
  try {
    const { storage } = await Config.findOne()
    const { botToken, polling, timeout, proxy, chatId } = storage.telegram
    const bot = new TelegramBot(botToken, {
      polling, // 禁用轮询
      request: {
        timeout: timeout * 1000, // 设置超时时间为30秒
        proxy, // 使用代理
        agentOptions: {
          keepAlive: true,
          family: 4, // 强制使用 IPv4
          timeout: timeout * 1000
        }
      }
    })
    await bot.deleteMessage(chatId, fileId)
  } catch ({ message }) {
    throw new Error(message)
  }
}

// 上传到 GitHub
export const uploadToGithub = async (filePath, key, user) => {
  let retryCount = 0
  const maxRetries = 3
  const retryDelay = 5000 // 5秒

  while (retryCount < maxRetries) {
    try {
      const { storage } = await Config.findOne()
      const {
        token,
        timeout,
        retries,
        repo,
        retryAfter,
        owner,
        branch,
        customDomain,
        isGithubPages,
        domain,
        githubPages
      } = storage.github
      // 创建 Octokit 实例，添加更多配置
      const octokit = new Octokit({
        auth: token,
        request: {
          timeout: timeout * 1000, // 30秒超时
          retries, // 重试3次
          retryAfter: retryAfter * 1000 // 5秒后重试
        }
      })
      // 读取文件内容
      const fileContent = await fs.readFile(filePath)
      const content = fileContent.toString('base64')
      // 上传文件
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: key,
        message: `用户: ${user.username} 上传文件: ${key}`,
        content,
        branch
      })
      // 开启自定义域名
      if (customDomain && !isGithubPages) {
        // 构建自定义域名URL
        return `${domain}/${key}`
      }
      if (customDomain && isGithubPages) {
        // 构建自定义域名URL
        return `${githubPages}/${repo}/${key}`
      }
      // 构建访问URL
      return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${key}`
    } catch ({ message }) {
      retryCount++
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      } else {
        throw new Error(`GitHub上传失败，已重试${maxRetries}次: ${message}`)
      }
    }
  }
}

// 从 GitHub 删除
export const deleteFromGithub = async filePath => {
  let retryCount = 0
  const maxRetries = 3
  const retryDelay = 5000 // 5秒

  while (retryCount < maxRetries) {
    try {
      const { storage } = await Config.findOne()
      const { token, repo, owner, branch } = storage.github
      // 创建 Octokit 实例
      const octokit = new Octokit({ auth: token })
      // 先获取文件的 SHA 值
      const { data: fileData } = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: branch
      })
      if (!fileData || !fileData.sha) {
        throw new Error('无法获取文件的 SHA 值')
      }
      // 删除文件
      await octokit.repos.deleteFile({
        owner,
        repo,
        path: filePath,
        message: `删除文件: ${filePath}`,
        sha: fileData.sha,
        branch
      })
    } catch ({ message }) {
      retryCount++
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      } else {
        throw new Error(`GitHub删除失败，已重试${maxRetries}次: ${message}`)
      }
      throw new Error(message)
    }
  }
}
