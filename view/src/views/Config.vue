<template>
  <div class="config-container">
    <a-spin :spinning="loading">
      <a-form :model="formState" layout="vertical" @finish="handleSubmit">
        <a-collapse v-model:activeKey="activeKey" accordion :bordered="false" style="background: rgb(255, 255, 255)">
          <a-collapse-panel class="ant-collapse-item" key="1" header="站点设置">
            <a-form-item label="网站标题">
              <a-input v-model:value="formState.site.title" />
            </a-form-item>
            <a-form-item label="网站URL">
              <a-input v-model:value="formState.site.url" />
            </a-form-item>
            <a-form-item label="验证码">
              <a-switch v-model:checked="formState.site.captcha" checked-children="启用" un-checked-children="禁用" />
            </a-form-item>
          </a-collapse-panel>
          <a-collapse-panel class="ant-collapse-item" key="2" header="上传设置">
            <a-form-item label="允许的图片格式">
              <a-select v-model:value="formState.upload.allowedFormats" mode="multiple" placeholder="选择允许的图片格式">
                <a-select-option value="jpg">JPG</a-select-option>
                <a-select-option value="jpeg">JPEG</a-select-option>
                <a-select-option value="png">PNG</a-select-option>
                <a-select-option value="gif">GIF</a-select-option>
                <a-select-option value="webp">WEBP</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="最大文件大小(MB)">
              <a-input-number v-model:value="formState.upload.maxSize" :min="1" :max="100" />
            </a-form-item>
            <a-form-item label="最多同时上传图片数量">
              <a-input-number v-model:value="formState.upload.concurrentUploads" :min="1" />
            </a-form-item>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="最小宽度(px)">
                  <a-input-number v-model:value="formState.upload.minWidth" :min="0" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="最小高度(px)">
                  <a-input-number v-model:value="formState.upload.minHeight" :min="0" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="最大宽度(px)">
                  <a-input-number v-model:value="formState.upload.maxWidth" :min="0" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="最大高度(px)">
                  <a-input-number v-model:value="formState.upload.maxHeight" :min="0" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item label="转换格式">
              <a-select v-model:value="formState.upload.convertFormat" allowClear placeholder="选择转换格式">
                <a-select-option value="">不转换</a-select-option>
                <a-select-option value="jpeg">JPEG</a-select-option>
                <a-select-option value="png">PNG</a-select-option>
                <a-select-option value="webp">WEBP</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="图片质量">
              <a-slider v-model:value="formState.upload.quality" :min="1" :max="100" :marks="{
                1: '1%',
                25: '25%',
                50: '50%',
                75: '75%',
                100: '100%'
              }" />
            </a-form-item>
            <a-form-item label="每日上传限制">
              <a-input-number v-model:value="formState.upload.dailyLimit" :min="0" placeholder="0表示不限制" />
            </a-form-item>
          </a-collapse-panel>
          <a-collapse-panel class="ant-collapse-item" key="4" header="水印设置">
            <a-form-item>
              <a-switch v-model:checked="formState.watermark.enabled" checked-children="启用" un-checked-children="禁用" />
            </a-form-item>
            <template v-if="formState.watermark.enabled">
              <a-form-item label="水印类型">
                <a-radio-group v-model:value="formState.watermark.type">
                  <a-radio value="text">文字水印</a-radio>
                  <a-radio value="image">图片水印</a-radio>
                </a-radio-group>
              </a-form-item>
              <template v-if="formState.watermark.type === 'text'">
                <a-form-item label="水印文字">
                  <a-input v-model:value="formState.watermark.text.content" />
                </a-form-item>
                <a-form-item label="字体大小">
                  <a-input-number v-model:value="formState.watermark.text.fontSize" :min="12" :max="72" />
                </a-form-item>
                <a-form-item label="字体颜色">
                  <a-input v-model:value="formState.watermark.text.color" type="color" />
                </a-form-item>
              </template>
              <template v-else>
                <a-form-item label="上传水印">
                  <a-upload v-model:fileList="watermarkFileList" :beforeUpload="handleWatermarkUpload"
                    :showUploadList="false">
                    <a-button>选择水印图片</a-button>
                  </a-upload>
                </a-form-item>
                <a-form-item label="水印管理">
                  <a-button>删除水印图片</a-button>
                </a-form-item>
                <a-form-item label="水印图片" v-if="formState.watermark.image.path">
                  <a-image :src="userStore.config.site.url + formState.watermark.image.path" />
                </a-form-item>
                <a-form-item label="水印图片URL" v-if="formState.watermark.image.path">
                  <a-textarea v-model:value="formState.watermark.image.path" auto-size disabled />
                </a-form-item>
                <a-form-item label="透明度">
                  <a-slider v-model:value="formState.watermark.image.opacity" :min="0" :max="1" :step="0.1" />
                </a-form-item>
              </template>
              <a-form-item label="水印位置">
                <a-select v-model:value="formState.watermark[formState.watermark.type].position">
                  <a-select-option value="top-left">左上</a-select-option>
                  <a-select-option value="top-right">右上</a-select-option>
                  <a-select-option value="bottom-left">左下</a-select-option>
                  <a-select-option value="bottom-right">右下</a-select-option>
                  <a-select-option value="center">居中</a-select-option>
                </a-select>
              </a-form-item>
            </template>
          </a-collapse-panel>
          <a-collapse-panel class="ant-collapse-item" key="3" header="存储设置">
            <a-form-item label="存储类型">
              <a-select v-model:value="formState.storage.type">
                <a-select-option v-for="(item, index) in imageStoreArray" :value="item.value" :key="index">{{ item.label
                }}</a-select-option>
              </a-select>
            </a-form-item>
            <template v-if="formState.storage.type === 'local'">
              <a-form-item required label="储存目录">
                <a-input v-model:value="formState.storage.local.path" placeholder="输入储存目录，绝对路径" />
                <p>储存目录必须是绝对路径。</p>
              </a-form-item>
            </template>
            <template v-if="formState.storage.type === 'oss'">
              <a-form-item required label="AccessKey ID">
                <a-input v-model:value="formState.storage.oss.accessKeyId" placeholder="输入 AccessKeyId" />
              </a-form-item>
              <a-form-item required label="AccessKey Secret">
                <a-input-password v-model:value="formState.storage.oss.accessKeySecret"
                  placeholder="输入 AccessKeySecret" />
              </a-form-item>
              <a-form-item required label="OSS Bucket">
                <a-input v-model:value="formState.storage.oss.bucket" />
              </a-form-item>
              <a-form-item label="储存目录">
                <a-input v-model:value="formState.storage.oss.path" placeholder="输入储存目录，绝对路径" />
                <p>储存目录必须是绝对路径。</p>
              </a-form-item>
              <a-form-item label="OSS Region">
                <a-input v-model:value="formState.storage.oss.region" placeholder="输入 Region，例如：cn-shanghai" />
              </a-form-item>
              <a-form-item required label="外网 Endpoint">
                <a-input v-model:value="formState.storage.oss.endpoint"
                  placeholder="输入 Endpoint，例如：oss-cn-shanghai.aliyuncs.com" />
              </a-form-item>
              <a-form-item label="内网 Endpoint">
                <a-input v-model:value="formState.storage.oss.internal"
                  placeholder="输入内网 Endpoint，内网上传地址，填写即启用，例如：oss-cn-shanghai-internal.aliyuncs.com" />
              </a-form-item>
              <a-form-item label="Is Cname">
                <a-switch v-model:checked="formState.storage.oss.isCname" checked-children="是"
                  un-checked-children="否" />
                <p>若 Endpoint 为自定义域名，请打开此项。</p>
              </a-form-item>
            </template>
            <template v-if="formState.storage.type === 'cos'">
              <a-form-item required label="Secret Id">
                <a-input v-model:value="formState.storage.cos.secretId" placeholder="输入 Secret Id" />
              </a-form-item>
              <a-form-item required label="Secret Key">
                <a-input-password v-model:value="formState.storage.cos.secretKey" placeholder="输入 Secret Key" />
              </a-form-item>
              <a-form-item required label="Bucket">
                <a-input v-model:value="formState.storage.cos.bucket" placeholder="输入 Bucket" />
              </a-form-item>
              <a-form-item required label="Region">
                <a-input v-model:value="formState.storage.cos.region" placeholder="输入 Region，例如：ap-guangzhou" />
              </a-form-item>
              <a-form-item required label="储存目录">
                <a-input v-model:value="formState.storage.cos.filePath" placeholder="输入储存目录，绝对路径" />
                <p>储存目录必须是绝对路径。</p>
              </a-form-item>
            </template>
            <template v-if="formState.storage.type === 's3'">
              <a-form-item required label="储存目录">
                <a-input v-model:value="formState.storage.s3.directory" placeholder="输入储存目录，绝对路径" />
                <p>储存目录必须是绝对路径。</p>
              </a-form-item>
              <a-form-item required label="Endpoint">
                <a-input v-model:value="formState.storage.s3.endpoint"
                  placeholder="输入 Endpoint，例如：https://s3.amazonaws.com" />
              </a-form-item>
              <a-form-item required label="AccessKeyId">
                <a-input v-model:value="formState.storage.s3.accessKeyId" placeholder="输入 AccessKeyId" />
              </a-form-item>
              <a-form-item required label="SecretAccessKey">
                <a-input-password v-model:value="formState.storage.s3.secretAccessKey"
                  placeholder="输入 SecretAccessKey" />
              </a-form-item>
              <a-form-item label="Region">
                <a-input v-model:value="formState.storage.s3.region" placeholder="输入 Region，例如：us-east-1" />
              </a-form-item>
              <a-form-item label="Bucket">
                <a-input v-model:value="formState.storage.s3.bucket" placeholder="输入 Bucket" />
              </a-form-item>
            </template>
            <template v-if="formState.storage.type === 'r2'">
              <a-form-item required label="储存目录">
                <a-input v-model:value="formState.storage.r2.directory" placeholder="输入储存目录，绝对路径" />
                <p>储存目录必须是绝对路径。</p>
              </a-form-item>
              <a-form-item required label="AccountId">
                <a-input v-model:value="formState.storage.r2.accountId" placeholder="输入 AccountId" />
              </a-form-item>
              <a-form-item required label="AccessKeyId">
                <a-input v-model:value="formState.storage.r2.accessKeyId" placeholder="输入 AccessKeyId" />
              </a-form-item>
              <a-form-item required label="SecretAccessKey">
                <a-input-password v-model:value="formState.storage.r2.secretAccessKey"
                  placeholder="输入 SecretAccessKey" />
              </a-form-item>
              <a-form-item required label="公共URL">
                <a-input v-model:value="formState.storage.r2.publicUrl" placeholder="输入 公共URL" />
              </a-form-item>
              <a-form-item required label="Bucket">
                <a-input v-model:value="formState.storage.r2.bucket" placeholder="输入 Bucket" />
              </a-form-item>
            </template>
            <template v-if="formState.storage.type === 'qiniu'">
              <a-form-item required label="Access Key">
                <a-input v-model:value="formState.storage.qiniu.accessKey" placeholder="输入 Access Key" />
              </a-form-item>
              <a-form-item required label="Secret Key">
                <a-input-password v-model:value="formState.storage.qiniu.secretKey" placeholder="输入 Secret Key" />
              </a-form-item>
              <a-form-item required label="Bucket">
                <a-input v-model:value="formState.storage.qiniu.bucket" placeholder="输入 Bucket" />
              </a-form-item>
              <a-form-item required label="Bucket 域名">
                <a-input v-model:value="formState.storage.qiniu.domain" placeholder="输入 Bucket 域名" />
              </a-form-item>
            </template>
            <template v-if="formState.storage.type === 'upyun'">
              <a-form-item required label="又拍云服务名">
                <a-input v-model:value="formState.storage.upyun.service" placeholder="输入服务名" />
              </a-form-item>
              <a-form-item required label="又拍云操作员">
                <a-input v-model:value="formState.storage.upyun.operator" placeholder="输入操作员" />
              </a-form-item>
              <a-form-item required label="又拍云密码">
                <a-input-password v-model:value="formState.storage.upyun.password" placeholder="输入密码" />
              </a-form-item>
              <a-form-item required label="存储目录">
                <a-input v-model:value="formState.storage.upyun.directory" placeholder="输入储存目录，绝对路径" />
                <p>储存目录必须是绝对路径。</p>
              </a-form-item>
              <a-form-item required label="访问域名">
                <a-input v-model:value="formState.storage.upyun.domain" placeholder="输入访问域名, 例如: https://domain.com" />
              </a-form-item>
            </template>
            <template v-if="formState.storage.type === 'sftp'">
              <a-form-item required label="主机地址" placeholder="输入主机地址">
                <a-input v-model:value="formState.storage.sftp.host" />
              </a-form-item>
              <a-form-item required label="端口">
                <a-input v-model:value="formState.storage.sftp.port" placeholder="输入端口，默认为 22" />
              </a-form-item>
              <a-form-item required label="用户名">
                <a-input v-model:value="formState.storage.sftp.username" placeholder="输入用户名" />
              </a-form-item>
              <a-form-item required label="密码">
                <a-input-password v-model:value="formState.storage.sftp.password" placeholder="输入密码" />
              </a-form-item>
              <a-form-item required label="储存目录">
                <a-input v-model:value="formState.storage.sftp.directory" placeholder="输入储存目录，绝对路径" />
                <p>储存目录必须是绝对路径。</p>
              </a-form-item>
              <a-form-item required label="连接超时时间">
                <a-input v-model:value="formState.storage.sftp.connectTimeout" placeholder="输入连接超时时间，默认为 10 秒" />
              </a-form-item>
              <a-form-item required label="连接最大尝试次数">
                <a-input v-model:value="formState.storage.sftp.retries" placeholder="输入连接最大尝试次数，默认为 4 次" />
              </a-form-item>
              <a-form-item required label="访问域名">
                <a-input v-model:value="formState.storage.sftp.domain" placeholder="输入访问域名, 例如: https://domain.com" />
              </a-form-item>
              <a-form-item label="主机指纹">
                <a-input-password v-model:value="formState.storage.sftp.hostFingerprint" placeholder="输入主机指纹" />
              </a-form-item>
              <a-form-item label="使用 SSH 代理">
                <a-switch v-model:checked="formState.storage.sftp.useSSH" />
              </a-form-item>
              <template v-if="formState.storage.sftp.useSSH">
                <a-form-item label="私钥">
                  <a-textarea v-model:value="formState.storage.sftp.privateKey" placeholder="使用私钥连接请输入私钥"
                    :auto-size="{ minRows: 2, maxRows: 5 }" />
                </a-form-item>
                <a-form-item label="私钥口令">
                  <a-input-password v-model:value="formState.storage.sftp.passphrase" placeholder="使用私钥连接请输入私钥口令" />
                </a-form-item>
              </template>
            </template>
            <template v-if="formState.storage.type === 'ftp'">
              <a-form-item required label="储存目录">
                <a-input v-model:value="formState.storage.ftp.directory" placeholder="输入储存目录，绝对路径" />
                <p>储存目录必须是绝对路径。</p>
              </a-form-item>
              <a-form-item required label="主机地址">
                <a-input v-model:value="formState.storage.ftp.host" placeholder="输入主机地址" />
              </a-form-item>
              <a-form-item required label="用户名">
                <a-input v-model:value="formState.storage.ftp.username" placeholder="输入用户名" />
              </a-form-item>
              <a-form-item required label="密码">
                <a-input-password v-model:value="formState.storage.ftp.password" placeholder="输入密码" />
              </a-form-item>
              <a-form-item required label="端口">
                <a-input v-model:value="formState.storage.ftp.port" placeholder="输入端口，默认为 21" />
              </a-form-item>
              <a-form-item required label="传输模式">
                <a-select v-model:value="formState.storage.ftp.transferMode">
                  <a-select-option value="binary">FTP_BINARY</a-select-option>
                  <a-select-option value="ascii">FTP_ASCII</a-select-option>
                </a-select>
                <p>请选择传输模式，默认为 FTP_BINARY</p>
              </a-form-item>
              <a-form-item required label="连接超时时间">
                <a-input v-model:value="formState.storage.ftp.connectTimeout" placeholder="输入连接超时时间，默认为 90 秒" />
              </a-form-item>
              <a-form-item required label="访问域名">
                <a-input v-model:value="formState.storage.ftp.domain" placeholder="输入访问域名, 例如: https://domain.com" />
              </a-form-item>
              <a-form-item label="是否使用被动模式">
                <a-switch v-model:checked="formState.storage.ftp.passive" />
              </a-form-item>
              <a-form-item label="是否使用 SSL 连接">
                <a-switch v-model:checked="formState.storage.ftp.secure" />
              </a-form-item>
              <a-form-item label="是否忽略被动模式下的远程 IP 地址">
                <a-switch v-model:checked="formState.storage.ftp.ignorePassiveIP" />
              </a-form-item>
              <a-form-item label="是否启用 Unix 时间戳">
                <a-switch v-model:checked="formState.storage.ftp.useUnixTimestamp" />
              </a-form-item>
              <a-form-item label="是否启用 UTF-8 编码">
                <a-switch v-model:checked="formState.storage.ftp.useUTF8" />
              </a-form-item>
              <a-form-item label="是否手动递归">
                <a-switch v-model:checked="formState.storage.ftp.recursive" />
              </a-form-item>
            </template>
            <template v-if="formState.storage.type === 'webdav'">
              <a-form-item label="储存目录">
                <a-input v-model:value="formState.storage.webdav.directory" />
                <p>储存目录必须是绝对路径。</p>
              </a-form-item>
              <a-form-item required label="连接地址">
                <a-input v-model:value="formState.storage.webdav.url" placeholder="输入连接地址" />
              </a-form-item>
              <a-form-item required label="认证方式">
                <a-select v-model:value="formState.storage.webdav.authType">
                  <a-select-option value="auto">Auto</a-select-option>
                  <a-select-option value="basic">Basic</a-select-option>
                  <a-select-option value="digest">Digest</a-select-option>
                  <a-select-option value="ntlm">Ntlm</a-select-option>
                </a-select>
                <p>请选择认证方式，默认 Auto</p>
              </a-form-item>
              <a-form-item required label="用户名">
                <a-input v-model:value="formState.storage.webdav.username" placeholder="输入用户名" />
              </a-form-item>
              <a-form-item required label="密码">
                <a-input-password v-model:value="formState.storage.webdav.password" placeholder="输入密码" />
              </a-form-item>
              <a-form-item required label="访问域名">
                <a-input v-model:value="formState.storage.webdav.domain" placeholder="输入访问域名, 例如: https://domain.com" />
              </a-form-item>
            </template>
            <template v-if="formState.storage.type === 'telegram'">
              <a-form-item required label="BotToken">
                <a-input-password v-model:value="formState.storage.telegram.botToken" placeholder="输入 BotToken" />
              </a-form-item>
              <a-form-item required label="聊天ID">
                <a-input v-model:value="formState.storage.telegram.chatId" placeholder="输入聊天ID" />
              </a-form-item>
              <a-form-item label="禁用轮询">
                <a-switch v-model:checked="formState.storage.telegram.polling" />
              </a-form-item>
              <a-form-item label="连接超时时间">
                <a-input v-model:value="formState.storage.telegram.timeout" placeholder="输入连接超时时间，默认为 30 秒" />
              </a-form-item>
              <a-form-item label="代理地址">
                <a-input v-model:value="formState.storage.telegram.proxy" placeholder="输入代理地址" />
              </a-form-item>
            </template>
            <template v-if="formState.storage.type === 'github'">
              <a-form-item required label="GitHub 个人访问令牌">
                <a-input-password v-model:value="formState.storage.github.token" placeholder="输入 GitHub 个人访问令牌" />
              </a-form-item>
              <a-form-item required label="仓库所有者">
                <a-input v-model:value="formState.storage.github.owner" placeholder="输入仓库所有者" />
              </a-form-item>
              <a-form-item required label="仓库名称">
                <a-input v-model:value="formState.storage.github.repo" placeholder="输入仓库名称" />
              </a-form-item>
              <a-form-item required label="分支名称">
                <a-input v-model:value="formState.storage.github.branch" placeholder="输入分支名称" />
              </a-form-item>
              <a-form-item required label="存储目录">
                <a-input v-model:value="formState.storage.github.directory" placeholder="输入存储目录" />
                <p>存储目录必须是绝对路径。Github不允许文件路径以斜杠"/"开头</p>
              </a-form-item>
              <a-form-item required label="连接超时时间">
                <a-input v-model:value="formState.storage.github.timeout" placeholder="输入连接超时时间，默认为 30 秒" />
              </a-form-item>
              <a-form-item required label="重试次数">
                <a-input v-model:value="formState.storage.github.retries" placeholder="输入重试次数，默认为 3 次" />
              </a-form-item>
              <a-form-item required label="重试间隔时间">
                <a-input v-model:value="formState.storage.github.retryAfter" placeholder="输入重试次数，默认为 5 秒" />
              </a-form-item>
              <a-form-item label="开启自定义域名">
                <a-switch v-model:checked="formState.storage.github.customDomain" />
                <p>开启自定义域名后, 图片可访问状态以Github Pages build状态为准</p>
              </a-form-item>
              <a-form-item label="是否Github Pages" v-if="formState.storage.github.customDomain">
                <a-switch v-model:checked="formState.storage.github.isGithubPages" />
              </a-form-item>
              <a-form-item required label="自定义域名"
                v-if="formState.storage.github.customDomain && !formState.storage.github.isGithubPages">
                <a-input v-model:value="formState.storage.github.domain"
                  placeholder="输入自定义域名, 例如: https://domain.com" />
              </a-form-item>
              <a-form-item required label="Github Pages"
                v-if="formState.storage.github.customDomain && formState.storage.github.isGithubPages">
                <a-input v-model:value="formState.storage.github.githubPages"
                  placeholder="输入Github Pages, 例如: https://user.github.io" />
              </a-form-item>
            </template>
          </a-collapse-panel>
          <a-collapse-panel class="ant-collapse-item" key="5" header="IP设置">
            <a-tabs v-model:activeKey="activeTab">
              <a-tab-pane key="whitelist" tab="白名单">
                <a-form-item>
                  <a-switch v-model:checked="formState.ip.whitelistEnabled" checked-children="启用"
                    un-checked-children="禁用" />
                </a-form-item>
                <a-form-item label="IP白名单">
                  <a-textarea v-model:value="ipWhitelistText" :rows="4" placeholder="每行一个IP地址"
                    @change="handleIpWhitelistChange" />
                </a-form-item>
              </a-tab-pane>
              <a-tab-pane key="blacklist" tab="黑名单">
                <a-form-item>
                  <a-switch v-model:checked="formState.ip.blacklistEnabled" checked-children="启用"
                    un-checked-children="禁用" />
                </a-form-item>
                <a-form-item label="IP黑名单">
                  <a-textarea v-model:value="ipBlacklistText" :rows="4" placeholder="每行一个IP地址"
                    @change="handleIpBlacklistChange" />
                </a-form-item>
              </a-tab-pane>
            </a-tabs>
          </a-collapse-panel>
        </a-collapse>
        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="submitting">
            保存设置
          </a-button>
        </a-form-item>
      </a-form>
    </a-spin>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import axios from '@/stores/axios'
import { useUserStore } from '@/stores/user'
import { imageStoreType } from '@/stores/formatDate'

const userStore = useUserStore()
const loading = ref(false)
const submitting = ref(false)
const activeTab = ref('whitelist')
const watermarkFileList = ref([])
const ipWhitelistText = ref('')
const ipBlacklistText = ref('')
const activeKey = ref('1')
const imageStoreArray = Object.entries(imageStoreType)
  .filter(([key]) => key !== 'get') // 排除get方法
  .map(([value, label]) => ({ value, label }))

const formState = ref({
  site: {
    title: '网站标题',
    url: '',
    captcha: false
  },
  upload: {
    allowedFormats: [],
    maxSize: 5,
    minWidth: 0,
    minHeight: 0,
    maxWidth: 0,
    maxHeight: 0,
    convertFormat: '',
    quality: 80,
    dailyLimit: 100
  },
  storage: {
    type: 'local',
    local: {
      path: '/uploads'
    },
    oss: {
      accessKeyId: '',
      accessKeySecret: '',
      bucket: '',
      region: '',
      endpoint: '',
      internal: '',
      isCname: false
    },
    cos: {
      path: '',
      isCname: false,
      internal: '',
      accessKeyId: '',
      accessKeySecret: '',
      bucket: '',
      region: '',
      endpoint: ''
    },
    s3: {
      accessKeyId: '',
      secretAccessKey: '',
      bucket: '',
      region: '',
      endpoint: '',
      directory: ''
    },
    qiniu: {
      accessKey: '',
      secretKey: '',
      bucket: ''
    },
    // upyun: {
    //   serviceName: '',
    //   operator: '',
    //   password: '',
    //   region: '',
    //   path: ''
    // },
    // sftp: {
    //   host: '',
    //   port: 22,
    //   username: '',
    //   password: '',
    //   path: ''
    // },
    // ftp: {
    //   host: '',
    //   port: 21,
    //   username: '',
    //   password: '',
    //   path: ''
    // },
    // webdav: {
    //   host: '',
    //   port: 80,
    //   username: '',
    //   password: '',
    //   path: ''
    // }
  },
  watermark: {
    enabled: false,
    type: 'text',
    text: {
      content: '',
      fontSize: 24,
      color: '#ffffff',
      position: 'bottom-right'
    },
    image: {
      path: '',
      opacity: 0.5,
      position: 'bottom-right'
    }
  },
  ip: {
    blacklist: [],
    blacklistEnabled: false,
    enabled: false,
    whitelist: [],
    whitelistEnabled: false
  }
})

// 获取配置
const fetchConfig = async () => {
  loading.value = true
  try {
    const response = await axios.post('/api/admin/config')
    const { ip, site, storage, upload, watermark } = response.data
    formState.value = {
      site,
      storage,
      upload,
      watermark,
      ip
    }
    ipWhitelistText.value = ip.whitelist.join('\n')
    ipBlacklistText.value = ip.blacklist.join('\n')
  } catch (error) {
    message.error('获取配置失败')
  } finally {
    loading.value = false
  }
}

// 处理水印图片上传
const handleWatermarkUpload = async (file) => {
  try {
    const formData = new FormData()
    formData.append('image', file)
    const response = await axios.post('/api/admin/upload-watermark', formData)
    formState.value.watermark.image.path = response.data.path
    message.success('水印图片上传成功')
    return false
  } catch (error) {
    message.error('水印图片上传失败')
    return false
  }
}

// 处理IP白名单变化
const handleIpWhitelistChange = (e) => {
  formState.value.ip.whitelist = e.target.value
    .split('\n')
    .map(ip => ip.trim())
    .filter(ip => ip)
}

// 处理IP黑名单变化
const handleIpBlacklistChange = (e) => {
  formState.value.ip.blacklist = e.target.value
    .split('\n')
    .map(ip => ip.trim())
    .filter(ip => ip)
}

// 提交表单
const handleSubmit = async () => {
  submitting.value = true
  try {
    const res = await axios.put('/api/admin/config', formState.value)
    userStore.setConfig({
      site: formState.value.site
    })
    message.success(res.data.message)
  } catch (error) {
    message.error(error.response?.data?.error)
  } finally {
    submitting.value = false
  }
}

onMounted(fetchConfig)
</script>

<style scoped>
.config-container {
  padding: 24px;
}

p {
  margin-top: 8px;
}

.mb-4 {
  margin-bottom: 24px;
}

.ant-collapse-item {
  background: rgb(247, 247, 247);
  border-radius: 4px;
  margin-bottom: 24px;
  border: 0px;
  overflow: hidden;
}
</style>