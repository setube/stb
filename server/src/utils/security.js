import fs from 'fs/promises'
import OSS from 'ali-oss'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import RPCClient from '@alicloud/pop-core'
import tencentcloud from 'tencentcloud-sdk-nodejs'
import { Config } from '../models/Config.js'

// 腾讯云内容安全检测函数
export const tencentCheckImageSecurity = async filePath => {
  try {
    // 导入内容安全客户端
    const ImsClient = tencentcloud.ims.v20201229.Client
    // 获取配置
    const { ai } = await Config.findOne()
    if (!ai.enabled) {
      throw new Error('鉴黄开关功能未启用')
    }
    const { secretId, secretKey, region, endpoint, bizType } = ai.tencent
    if (!secretId || !secretKey) {
      throw new Error('未配置腾讯云密钥')
    }
    // 读取文件并转换为Base64
    const fileBuffer = await fs.readFile(filePath)
    const base64Content = fileBuffer.toString('base64')
    // 创建客户端实例
    const client = new ImsClient({
      credential: {
        secretId,
        secretKey
      },
      region,
      profile: {
        httpProfile: {
          endpoint
        }
      }
    })
    // 发送请求
    const { Label, Suggestion } = await client.ImageModeration({
      FileContent: base64Content,
      DataId: Date.now().toString(), // 数据标识
      BizType: bizType // 业务类型
    })
    // 处理结果
    return {
      safe: Suggestion,
      Label
    }
  } catch ({ message }) {
    throw new Error(`图片内容安全检测失败: ${message}`)
  }
}

// 阿里云内容安全检测函数
export const aliyunCheckImageSecurity = async filePath => {
  try {
    // 获取配置
    const { ai } = await Config.findOne()
    if (!ai.enabled) {
      throw new Error('鉴黄开关功能未启用')
    }
    const { accessKeyId, accessKeySecret, region, service } = ai.aliyun
    if (!accessKeyId || !accessKeySecret) {
      throw new Error('未配置阿里云密钥')
    }
    // 创建客户端
    const client = new RPCClient({
      accessKeyId,
      accessKeySecret,
      endpoint: `https://green-cip.${region}.aliyuncs.com`,
      apiVersion: '2022-03-02'
    })
    // 获取上传文件token
    const tokenResponse = await client.request('DescribeUploadToken', '', {
      method: 'POST',
      formatParams: false
    })
    const tokenData = tokenResponse.Data
    // 创建OSS客户端
    const ossClient = new OSS({
      accessKeyId: tokenData.AccessKeyId,
      accessKeySecret: tokenData.AccessKeySecret,
      stsToken: tokenData.SecurityToken,
      endpoint: tokenData.OssInternetEndPoint,
      bucket: tokenData.BucketName
    })
    // 生成文件名
    const split = filePath.split('.')
    const objectName =
      split.length > 1
        ? `${tokenData.FileNamePrefix}${uuidv4()}.${split[split.length - 1]}`
        : `${tokenData.FileNamePrefix}${uuidv4()}`
    // 上传文件到OSS
    await ossClient.put(objectName, path.normalize(filePath))
    // 调用检测接口
    const { Code, Data, Msg } = await client.request(
      'ImageModeration',
      {
        Service: service,
        ServiceParameters: JSON.stringify({
          ossBucketName: tokenData.BucketName,
          ossObjectName: objectName
        })
      },
      { method: 'POST', formatParams: false }
    )
    // 处理结果
    if (Code === 200) {
      // 检查数据结构
      if (!Data || !Data.Result || !Array.isArray(Data.Result)) {
        throw new Error('返回数据格式不正确')
      }
      const result = Data.Result[0]
      if (!result) {
        throw new Error('未获取到检测结果')
      }
      return {
        safe: Data.RiskLevel,
        label: result.Description || result.Label
      }
    }
    throw new Error(`阿里云内容安全检测失败: ${Msg}`)
  } catch ({ message }) {
    throw new Error(`阿里云图片内容安全检测失败: ${message}`)
  }
}

// NsfwJs内容安全检测函数
export const nsfwjsCheckImageSecurity = async filePath => {
  try {
    // 获取配置
    const { ai } = await Config.findOne()
    if (!ai.enabled) {
      throw new Error('鉴黄开关功能未启用')
    }
    const { apiUrl, threshold = 60 } = ai.nsfwjs
    if (!apiUrl) {
      throw new Error('未配置NsfwJs API地址')
    }
    // 读取文件内容
    const fileBuffer = await fs.readFile(filePath)
    const fileName = path.basename(filePath)
    // 创建 FormData
    const formData = new FormData()
    formData.append('image', new Blob([fileBuffer]), fileName)
    // 发送请求到NsfwJs API
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      timeout: 180000 // 180秒超时
    })
    const { ok, status, statusText } = response
    if (!ok) {
      if (status === 500) {
        throw new Error('NsfwJs可能不支持该格式的图片')
      }
      throw new Error(`API请求失败: ${status} ${statusText}`)
    }
    const { hentai, porn, sexy } = await response.json()
    const ratio = threshold / 100
    // 检查各个分类的阈值
    let flag = false
    if (hentai >= ratio) flag = true
    if (porn >= ratio) flag = true
    if (sexy >= ratio) flag = true
    // 根据结果设置类型
    let type = 'Pass'
    if (flag) {
      // 如果任何一项超过阈值，设置为 Block
      type = 'Block'
    } else if (sexy >= ratio * 0.7) {
      // 如果 sexy 超过阈值的 70%，设置为 Review
      type = 'Review'
    }
    return {
      safe: type,
      label: flag ? 'unsafe' : 'safe'
    }
  } catch ({ message }) {
    throw new Error(`NsfwJs图片内容安全检测失败: ${message}`)
  }
}
