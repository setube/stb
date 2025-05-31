<template>
  <div class="api-docs">
    <a-card class="api-card">
      <template #title>
        <h2>API 接口文档</h2>
      </template>
      <a-collapse v-model:activeKey="activeKeys" accordion :bordered="false">
        <a-collapse-panel key="users" header="用户相关接口">
          <a-collapse accordion :bordered="false">
            <a-collapse-panel key="login" header="登录接口">
              <a-descriptions bordered>
                <a-descriptions-item label="接口路径">/api/auth/login</a-descriptions-item>
                <a-descriptions-item label="请求方式">POST</a-descriptions-item>
                <a-descriptions-item label="接口说明">用户登录</a-descriptions-item>
              </a-descriptions>
              <h3>请求参数</h3>
              <a-table :columns="paramColumns" :data-source="loginParams" :pagination="false" />
              <h3>返回参数</h3>
              <a-table :columns="responseColumns" :data-source="loginResponse" :pagination="false" />
              <h3>响应码说明</h3>
              <a-table :columns="codeColumns" :data-source="loginCodes" :pagination="false" />
            </a-collapse-panel>
            <a-collapse-panel key="register" header="注册接口">
              <a-descriptions bordered>
                <a-descriptions-item label="接口路径">/api/auth/register</a-descriptions-item>
                <a-descriptions-item label="请求方式">POST</a-descriptions-item>
                <a-descriptions-item label="接口说明">用户注册</a-descriptions-item>
              </a-descriptions>
              <h3>请求参数</h3>
              <a-table :columns="paramColumns" :data-source="registerParams" :pagination="false" />
              <h3>返回参数</h3>
              <a-table :columns="responseColumns" :data-source="registerResponse" :pagination="false" />
              <h3>响应码说明</h3>
              <a-table :columns="codeColumns" :data-source="registerCodes" :pagination="false" />
            </a-collapse-panel>
            <a-collapse-panel key="userInfo" header="获取当前登录用户信息">
              <a-descriptions bordered>
                <a-descriptions-item label="接口路径">/api/auth/info</a-descriptions-item>
                <a-descriptions-item label="请求方式">POST</a-descriptions-item>
                <a-descriptions-item label="接口说明">获取当前登录用户信息</a-descriptions-item>
                <a-descriptions-item label="需要认证">是</a-descriptions-item>
              </a-descriptions>
              <h3>请求参数</h3>
              <a-table :columns="paramColumns" :data-source="userInfoParams" :pagination="false" />
              <h3>返回参数</h3>
              <a-table :columns="responseColumns" :data-source="userInfoResponse" :pagination="false" />
              <h3>响应码说明</h3>
              <a-table :columns="codeColumns" :data-source="userInfoCodes" :pagination="false" />
            </a-collapse-panel>
            <a-collapse-panel key="myImages" header="获取我的图片列表">
              <a-descriptions bordered>
                <a-descriptions-item label="接口路径">/api/auth/my</a-descriptions-item>
                <a-descriptions-item label="请求方式">POST</a-descriptions-item>
                <a-descriptions-item label="接口说明">获取当前登录用户的图片列表</a-descriptions-item>
                <a-descriptions-item label="需要认证">是</a-descriptions-item>
              </a-descriptions>
              <h3>请求参数</h3>
              <a-table :columns="paramColumns" :data-source="myImagesParams" :pagination="false" />
              <h3>返回参数</h3>
              <a-table :columns="responseColumns" :data-source="myImagesResponse" :pagination="false" />
              <h3>响应码说明</h3>
              <a-table :columns="codeColumns" :data-source="myImagesCodes" :pagination="false" />
            </a-collapse-panel>
            <a-collapse-panel key="deleteMyImage" header="删除我的图片">
              <a-descriptions bordered>
                <a-descriptions-item label="接口路径">/api/auth/images/:id</a-descriptions-item>
                <a-descriptions-item label="请求方式">DELETE</a-descriptions-item>
                <a-descriptions-item label="接口说明">删除当前登录用户的指定图片</a-descriptions-item>
                <a-descriptions-item label="需要认证">是</a-descriptions-item>
              </a-descriptions>
              <h3>请求参数</h3>
              <a-table :columns="paramColumns" :data-source="deleteMyImageParams" :pagination="false" />
              <h3>返回参数</h3>
              <a-table :columns="responseColumns" :data-source="deleteMyImageResponse" :pagination="false" />
              <h3>响应码说明</h3>
              <a-table :columns="codeColumns" :data-source="deleteMyImageCodes" :pagination="false" />
            </a-collapse-panel>
          </a-collapse>
        </a-collapse-panel>
        <a-collapse-panel key="config" header="获取站点配置">
          <a-descriptions bordered>
            <a-descriptions-item label="接口路径">/api/auth/config</a-descriptions-item>
            <a-descriptions-item label="请求方式">POST</a-descriptions-item>
            <a-descriptions-item label="接口说明">获取站点配置信息</a-descriptions-item>
          </a-descriptions>
          <h3>请求参数</h3>
          <a-table :columns="paramColumns" :data-source="configParams" :pagination="false" />
          <h3>返回参数</h3>
          <a-table :columns="responseColumns" :data-source="configResponse" :pagination="false" />
          <h3>响应码说明</h3>
          <a-table :columns="codeColumns" :data-source="configCodes" :pagination="false" />
        </a-collapse-panel>
        <a-collapse-panel key="images" header="图片相关接口">
          <a-collapse accordion :bordered="false">
            <a-collapse-panel key="userUpload" header="用户上传图片">
              <a-descriptions bordered>
                <a-descriptions-item label="接口路径">/api/upload</a-descriptions-item>
                <a-descriptions-item label="请求方式">POST</a-descriptions-item>
                <a-descriptions-item label="接口说明">用户上传图片（需要登录）</a-descriptions-item>
                <a-descriptions-item label="需要认证">是</a-descriptions-item>
              </a-descriptions>
              <h3>请求参数</h3>
              <a-table :columns="paramColumns" :data-source="userUploadParams" :pagination="false" />
              <h3>返回参数</h3>
              <a-table :columns="responseColumns" :data-source="userUploadResponse" :pagination="false" />
              <h3>响应码说明</h3>
              <a-table :columns="codeColumns" :data-source="userUploadCodes" :pagination="false" />
            </a-collapse-panel>
            <a-collapse-panel key="touristUpload" header="游客上传图片">
              <a-descriptions bordered>
                <a-descriptions-item label="接口路径">/api/tourist/upload</a-descriptions-item>
                <a-descriptions-item label="请求方式">POST</a-descriptions-item>
                <a-descriptions-item label="接口说明">游客上传图片（无需登录）</a-descriptions-item>
              </a-descriptions>
              <h3>请求参数</h3>
              <a-table :columns="paramColumns" :data-source="touristUploadParams" :pagination="false" />
              <h3>返回参数</h3>
              <a-table :columns="responseColumns" :data-source="touristUploadResponse" :pagination="false" />
              <h3>响应码说明</h3>
              <a-table :columns="codeColumns" :data-source="touristUploadCodes" :pagination="false" />
            </a-collapse-panel>
            <a-collapse-panel key="imageList" header="获取图片广场数据">
              <a-descriptions bordered>
                <a-descriptions-item label="接口路径">/api/images</a-descriptions-item>
                <a-descriptions-item label="请求方式">POST</a-descriptions-item>
                <a-descriptions-item label="接口说明">获取图片广场数据</a-descriptions-item>
              </a-descriptions>
              <h3>请求参数</h3>
              <a-table :columns="paramColumns" :data-source="imageListParams" :pagination="false" />
              <h3>返回参数</h3>
              <a-table :columns="responseColumns" :data-source="imageListResponse" :pagination="false" />
              <h3>响应码说明</h3>
              <a-table :columns="codeColumns" :data-source="imageListCodes" :pagination="false" />
            </a-collapse-panel>
            <a-collapse-panel key="deleteImage" header="删除图片">
              <a-descriptions bordered>
                <a-descriptions-item label="接口路径">/api/images/:id</a-descriptions-item>
                <a-descriptions-item label="请求方式">DELETE</a-descriptions-item>
                <a-descriptions-item label="接口说明">删除指定图片</a-descriptions-item>
                <a-descriptions-item label="需要认证">是</a-descriptions-item>
              </a-descriptions>
              <h3>请求参数</h3>
              <a-table :columns="paramColumns" :data-source="deleteImageParams" :pagination="false" />
              <h3>返回参数</h3>
              <a-table :columns="responseColumns" :data-source="deleteImageResponse" :pagination="false" />
              <h3>响应码说明</h3>
              <a-table :columns="codeColumns" :data-source="deleteImageCodes" :pagination="false" />
            </a-collapse-panel>
          </a-collapse>
        </a-collapse-panel>
        <a-collapse-panel key="admin" header="管理相关接口">
          <!-- 获取用户列表 -->
          <a-collapse accordion :bordered="false">
            <a-collapse-panel key="adminUsers" header="获取用户列表">
              <a-descriptions bordered>
                <a-descriptions-item label="接口路径">/api/admin/users</a-descriptions-item>
                <a-descriptions-item label="请求方式">POST</a-descriptions-item>
                <a-descriptions-item label="接口说明">获取所有用户列表</a-descriptions-item>
                <a-descriptions-item label="需要认证">是</a-descriptions-item>
                <a-descriptions-item label="需要权限">admin</a-descriptions-item>
              </a-descriptions>
              <h3>请求参数</h3>
              <a-table :columns="paramColumns" :data-source="adminUsersParams" :pagination="false" />
              <h3>返回参数</h3>
              <a-table :columns="responseColumns" :data-source="adminUsersResponse" :pagination="false" />
              <h3>响应码说明</h3>
              <a-table :columns="codeColumns" :data-source="adminUsersCodes" :pagination="false" />
            </a-collapse-panel>
            <a-collapse-panel key="updateUserStatus" header="更新用户状态">
              <a-descriptions bordered>
                <a-descriptions-item label="接口路径">/api/admin/users/:id/status</a-descriptions-item>
                <a-descriptions-item label="请求方式">PATCH</a-descriptions-item>
                <a-descriptions-item label="接口说明">更新用户状态</a-descriptions-item>
                <a-descriptions-item label="需要认证">是</a-descriptions-item>
                <a-descriptions-item label="需要权限">admin</a-descriptions-item>
              </a-descriptions>
              <h3>请求参数</h3>
              <a-table :columns="paramColumns" :data-source="updateUserStatusParams" :pagination="false" />
              <h3>返回参数</h3>
              <a-table :columns="responseColumns" :data-source="updateUserStatusResponse" :pagination="false" />
              <h3>响应码说明</h3>
              <a-table :columns="codeColumns" :data-source="updateUserStatusCodes" :pagination="false" />
            </a-collapse-panel>
            <a-collapse-panel key="updateUserRole" header="更新用户角色">
              <a-descriptions bordered>
                <a-descriptions-item label="接口路径">/api/admin/users/:id/role</a-descriptions-item>
                <a-descriptions-item label="请求方式">PATCH</a-descriptions-item>
                <a-descriptions-item label="接口说明">更新用户角色</a-descriptions-item>
                <a-descriptions-item label="需要认证">是</a-descriptions-item>
                <a-descriptions-item label="需要权限">admin</a-descriptions-item>
              </a-descriptions>
              <h3>请求参数</h3>
              <a-table :columns="paramColumns" :data-source="updateUserRoleParams" :pagination="false" />
              <h3>返回参数</h3>
              <a-table :columns="responseColumns" :data-source="updateUserRoleResponse" :pagination="false" />
              <h3>响应码说明</h3>
              <a-table :columns="codeColumns" :data-source="updateUserRoleCodes" :pagination="false" />
            </a-collapse-panel>
            <a-collapse-panel key="systemStats" header="获取系统统计信息">
              <a-descriptions bordered>
                <a-descriptions-item label="接口路径">/api/admin/stats</a-descriptions-item>
                <a-descriptions-item label="请求方式">POST</a-descriptions-item>
                <a-descriptions-item label="接口说明">获取系统统计信息</a-descriptions-item>
                <a-descriptions-item label="需要认证">是</a-descriptions-item>
                <a-descriptions-item label="需要权限">admin</a-descriptions-item>
              </a-descriptions>
              <h3>请求参数</h3>
              <a-table :columns="paramColumns" :data-source="systemStatsParams" :pagination="false" />
              <h3>返回参数</h3>
              <a-table :columns="responseColumns" :data-source="systemStatsResponse" :pagination="false" />
              <h3>响应码说明</h3>
              <a-table :columns="codeColumns" :data-source="systemStatsCodes" :pagination="false" />
            </a-collapse-panel>
          </a-collapse>
        </a-collapse-panel>
        <a-collapse-panel key="logs" header="日志管理相关接口">
          <!-- 获取上传日志列表 -->
          <a-collapse accordion :bordered="false">
            <a-collapse-panel key="getLogs" header="获取上传日志列表">
              <a-descriptions bordered>
                <a-descriptions-item label="接口路径">/api/admin/logs</a-descriptions-item>
                <a-descriptions-item label="请求方式">POST</a-descriptions-item>
                <a-descriptions-item label="接口说明">获取上传日志列表</a-descriptions-item>
                <a-descriptions-item label="需要认证">是</a-descriptions-item>
                <a-descriptions-item label="需要权限">admin</a-descriptions-item>
              </a-descriptions>
              <h3>请求参数</h3>
              <a-table :columns="paramColumns" :data-source="getLogsParams" :pagination="false" />
              <h3>返回参数</h3>
              <a-table :columns="responseColumns" :data-source="getLogsResponse" :pagination="false" />
              <h3>响应码说明</h3>
              <a-table :columns="codeColumns" :data-source="getLogsCodes" :pagination="false" />
            </a-collapse-panel>
            <a-collapse-panel key="getLogsStats" header="获取日志统计信息">
              <a-descriptions bordered>
                <a-descriptions-item label="接口路径">/api/admin/logs/stats</a-descriptions-item>
                <a-descriptions-item label="请求方式">POST</a-descriptions-item>
                <a-descriptions-item label="接口说明">获取日志统计信息</a-descriptions-item>
                <a-descriptions-item label="需要认证">是</a-descriptions-item>
                <a-descriptions-item label="需要权限">admin</a-descriptions-item>
              </a-descriptions>
              <h3>请求参数</h3>
              <a-table :columns="paramColumns" :data-source="getLogsStatsParams" :pagination="false" />
              <h3>返回参数</h3>
              <a-table :columns="responseColumns" :data-source="getLogsStatsResponse" :pagination="false" />
              <h3>响应码说明</h3>
              <a-table :columns="codeColumns" :data-source="getLogsStatsCodes" :pagination="false" />
            </a-collapse-panel>
            <a-collapse-panel key="deleteLog" header="删除指定日志">
              <a-descriptions bordered>
                <a-descriptions-item label="接口路径">/api/admin/logs/:id</a-descriptions-item>
                <a-descriptions-item label="请求方式">DELETE</a-descriptions-item>
                <a-descriptions-item label="接口说明">删除指定日志</a-descriptions-item>
                <a-descriptions-item label="需要认证">是</a-descriptions-item>
                <a-descriptions-item label="需要权限">admin</a-descriptions-item>
              </a-descriptions>
              <h3>请求参数</h3>
              <a-table :columns="paramColumns" :data-source="deleteLogParams" :pagination="false" />
              <h3>返回参数</h3>
              <a-table :columns="responseColumns" :data-source="deleteLogResponse" :pagination="false" />
              <h3>响应码说明</h3>
              <a-table :columns="codeColumns" :data-source="deleteLogCodes" :pagination="false" />
            </a-collapse-panel>
            <a-collapse-panel key="clearLogs" header="清空所有日志">
              <a-descriptions bordered>
                <a-descriptions-item label="接口路径">/api/admin/logs</a-descriptions-item>
                <a-descriptions-item label="请求方式">DELETE</a-descriptions-item>
                <a-descriptions-item label="接口说明">清空所有日志</a-descriptions-item>
                <a-descriptions-item label="需要认证">是</a-descriptions-item>
                <a-descriptions-item label="需要权限">admin</a-descriptions-item>
              </a-descriptions>
              <h3>请求参数</h3>
              <a-table :columns="paramColumns" :data-source="clearLogsParams" :pagination="false" />
              <h3>返回参数</h3>
              <a-table :columns="responseColumns" :data-source="clearLogsResponse" :pagination="false" />
              <h3>响应码说明</h3>
              <a-table :columns="codeColumns" :data-source="clearLogsCodes" :pagination="false" />
            </a-collapse-panel>
          </a-collapse>
        </a-collapse-panel>
      </a-collapse>
    </a-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeKeys = ref(['login'])

// 表格列定义
const paramColumns = [
  {
    title: '参数名',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
  },
  {
    title: '必填',
    dataIndex: 'required',
    key: 'required',
  },
  {
    title: '说明',
    dataIndex: 'description',
    key: 'description',
  },
]

const responseColumns = [
  {
    title: '字段名',
    dataIndex: 'field',
    key: 'field',
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
  },
  {
    title: '说明',
    dataIndex: 'description',
    key: 'description',
  },
]

const codeColumns = [
  {
    title: '响应码',
    dataIndex: 'code',
    key: 'code',
  },
  {
    title: '说明',
    dataIndex: 'description',
    key: 'description',
  },
]

// 登录接口数据
const loginParams = [
  {
    key: '1',
    name: 'username',
    type: 'string',
    required: '是',
    description: '用户名',
  },
  {
    key: '2',
    name: 'password',
    type: 'string',
    required: '是',
    description: '密码',
  },
]

const loginResponse = [
  {
    key: '1',
    field: 'token',
    type: 'string',
    description: 'JWT认证令牌',
  },
  {
    key: '2',
    field: 'user',
    type: 'object',
    description: '用户信息对象',
  },
  {
    key: '3',
    field: 'user._id',
    type: 'string',
    description: '用户ID',
  },
  {
    key: '4',
    field: 'user.username',
    type: 'string',
    description: '用户名',
  },
  {
    key: '5',
    field: 'user.role',
    type: 'string',
    description: '用户角色(admin/user)',
  },
  {
    key: '6',
    field: 'user.status',
    type: 'string',
    description: '用户状态',
  },
  {
    key: '7',
    field: 'user.email',
    type: 'string',
    description: '用户邮箱',
  },
  {
    key: '8',
    field: 'user.founder',
    type: 'boolean',
    description: '是否为创始人',
  },
]

const loginCodes = [
  {
    key: '1',
    code: '200',
    description: '登录成功',
  },
  {
    key: '2',
    code: '400',
    description: '用户名或密码错误',
  },
  {
    key: '3',
    code: '400',
    description: '账号已被禁用',
  },
]

// 注册接口数据
const registerParams = [
  {
    key: '1',
    name: 'username',
    type: 'string',
    required: '是',
    description: '用户名',
  },
  {
    key: '2',
    name: 'password',
    type: 'string',
    required: '是',
    description: '密码',
  },
  {
    key: '3',
    name: 'email',
    type: 'string',
    required: '是',
    description: '邮箱',
  },
]

const registerResponse = [
  {
    key: '1',
    field: 'token',
    type: 'string',
    description: 'JWT认证令牌',
  },
  {
    key: '2',
    field: 'user',
    type: 'object',
    description: '用户信息对象',
  },
]

const registerCodes = [
  {
    key: '1',
    code: '201',
    description: '注册成功',
  },
  {
    key: '2',
    code: '400',
    description: '用户名已存在',
  },
  {
    key: '3',
    code: '403',
    description: '注册已关闭',
  },
]

// 用户信息接口数据
const userInfoParams = [
  {
    key: '1',
    name: 'Authorization',
    type: 'string',
    required: '是',
    description: 'Bearer token',
  },
]

const userInfoResponse = [
  {
    key: '1',
    field: '_id',
    type: 'string',
    description: '用户ID',
  },
  {
    key: '2',
    field: 'username',
    type: 'string',
    description: '用户名',
  },
  {
    key: '3',
    field: 'role',
    type: 'string',
    description: '用户角色',
  },
  {
    key: '4',
    field: 'status',
    type: 'string',
    description: '用户状态',
  },
  {
    key: '5',
    field: 'email',
    type: 'string',
    description: '用户邮箱',
  },
  {
    key: '6',
    field: 'founder',
    type: 'boolean',
    description: '是否为创始人',
  },
  {
    key: '7',
    field: 'lastLogin',
    type: 'number',
    description: '最后登录时间戳',
  },
]

const userInfoCodes = [
  {
    key: '1',
    code: '200',
    description: '获取成功',
  },
  {
    key: '2',
    code: '401',
    description: '未认证',
  },
  {
    key: '3',
    code: '404',
    description: '用户不存在',
  },
]

// 站点配置接口数据
const configParams = []

const configResponse = [
  {
    key: '1',
    field: 'upload',
    type: 'object',
    description: '上传配置',
  },
  {
    key: '2',
    field: 'site',
    type: 'object',
    description: '站点配置',
  },
  {
    key: '3',
    field: 'ai',
    type: 'object',
    description: '鉴黄配置',
  }
]

const configCodes = [
  {
    key: '1',
    code: '200',
    description: '获取成功',
  },
  {
    key: '2',
    code: '404',
    description: '配置不存在',
  },
  {
    key: '3',
    code: '500',
    description: '服务器错误',
  },
]

// 用户上传图片接口数据
const userUploadParams = [
  {
    key: '1',
    name: 'image',
    type: 'File',
    required: '是',
    description: '图片文件',
  },
  {
    key: '2',
    name: 'md5',
    type: 'string',
    required: '否',
    description: '文件MD5值',
  },
  {
    key: '3',
    name: 'ip',
    type: 'string',
    required: '否',
    description: '客户端IP地址',
  },
]

const userUploadResponse = [
  {
    key: '1',
    field: 'name',
    type: 'string',
    description: '原始文件名',
  },
  {
    key: '2',
    field: 'url',
    type: 'string',
    description: '图片访问地址',
  },
  {
    key: '3',
    field: 'thumb',
    type: 'string',
    description: '缩略图地址',
  },
  {
    key: '4',
    field: 'md5',
    type: 'string',
    description: '文件MD5值',
  },
  {
    key: '5',
    field: 'sha1',
    type: 'string',
    description: '文件SHA1值',
  },
  {
    key: '6',
    field: 'safe',
    type: 'string',
    description: '图片安全检测结果',
  },
  {
    key: '7',
    field: 'label',
    type: 'array',
    description: '图片标签',
  },
  {
    key: '8',
    field: 'type',
    type: 'string',
    description: '存储类型',
  },
  {
    key: '9',
    field: 'user',
    type: 'string',
    description: '上传用户ID',
  },
  {
    key: '10',
    field: 'width',
    type: 'number',
    description: '图片宽度',
  },
  {
    key: '11',
    field: 'height',
    type: 'number',
    description: '图片高度',
  },
  {
    key: '12',
    field: 'date',
    type: 'number',
    description: '上传时间戳',
  },
  {
    key: '13',
    field: 'ip',
    type: 'string',
    description: '上传IP',
  },
  {
    key: '14',
    field: 'size',
    type: 'number',
    description: '文件大小(字节)',
  },
  {
    key: '15',
    field: 'filePath',
    type: 'string',
    description: '文件存储路径',
  },
  {
    key: '16',
    field: 'filename',
    type: 'string',
    description: '文件名',
  },
]

const userUploadCodes = [
  {
    key: '1',
    code: '201',
    description: '上传成功',
  },
  {
    key: '2',
    code: '400',
    description: '上传失败',
  },
  {
    key: '3',
    code: '400',
    description: '图片中包含敏感内容',
  },
  {
    key: '4',
    code: '400',
    code: '当前上传IP已被拉黑',
  },
  {
    key: '5',
    code: '401',
    description: '未认证',
  },
]

// 游客上传图片接口数据
const touristUploadParams = userUploadParams
const touristUploadResponse = userUploadResponse
const touristUploadCodes = [
  {
    key: '1',
    code: '201',
    description: '上传成功',
  },
  {
    key: '2',
    code: '400',
    description: '上传失败',
  },
  {
    key: '3',
    code: '400',
    description: '图片中包含敏感内容',
  },
  {
    key: '4',
    code: '400',
    description: '当前上传IP已被拉黑',
  },
]

// 获取图片列表接口数据
const imageListParams = [
  {
    key: '1',
    name: 'page',
    type: 'number',
    required: '是',
    description: '页码',
  },
  {
    key: '2',
    name: 'limit',
    type: 'number',
    required: '是',
    description: '每页数量',
  },
]

const imageListResponse = [
  {
    key: '1',
    field: 'images',
    type: 'array',
    description: '图片列表',
  },
  {
    key: '2',
    field: 'total',
    type: 'number',
    description: '总数量',
  },
]

const imageListCodes = [
  {
    key: '1',
    code: '200',
    description: '获取成功',
  },
  {
    key: '2',
    code: '500',
    description: '服务器错误',
  },
]

// 删除图片接口数据
const deleteImageParams = [
  {
    key: '1',
    name: 'id',
    type: 'string',
    required: '是',
    description: '图片ID',
  },
  {
    key: '2',
    name: 'Authorization',
    type: 'string',
    required: '是',
    description: 'Bearer token',
  },
]

const deleteImageResponse = [
  {
    key: '1',
    field: 'message',
    type: 'string',
    description: '删除成功',
  },
]

const deleteImageCodes = [
  {
    key: '1',
    code: '200',
    description: '删除成功',
  },
  {
    key: '2',
    code: '401',
    description: '未认证',
  },
  {
    key: '3',
    code: '404',
    description: '图片不存在',
  },
  {
    key: '4',
    code: '500',
    description: '服务器错误',
  },
]

// 获取用户列表接口数据
const adminUsersParams = [
  {
    key: '1',
    name: 'page',
    type: 'number',
    required: '是',
    description: '页码',
  },
  {
    key: '2',
    name: 'limit',
    type: 'number',
    required: '是',
    description: '每页数量',
  },
]

const adminUsersResponse = [
  {
    key: '1',
    field: 'users',
    type: 'array',
    description: '用户列表',
  },
  {
    key: '2',
    field: 'total',
    type: 'number',
    description: '总数量',
  },
]

const adminUsersCodes = [
  {
    key: '1',
    code: '200',
    description: '获取成功',
  },
  {
    key: '2',
    code: '401',
    description: '未认证',
  },
  {
    key: '3',
    code: '403',
    description: '无权限',
  },
  {
    key: '4',
    code: '500',
    description: '服务器错误',
  },
]

// 更新用户状态接口数据
const updateUserStatusParams = [
  {
    key: '1',
    name: 'id',
    type: 'string',
    required: '是',
    description: '用户ID',
  },
  {
    key: '2',
    name: 'status',
    type: 'string',
    required: '是',
    description: '用户状态(active/disabled)',
  },
]

const updateUserStatusResponse = [
  {
    key: '1',
    field: '_id',
    type: 'string',
    description: '用户ID',
  },
  {
    key: '2',
    field: 'username',
    type: 'string',
    description: '用户名',
  },
  {
    key: '3',
    field: 'role',
    type: 'string',
    description: '用户角色',
  },
  {
    key: '4',
    field: 'status',
    type: 'string',
    description: '用户状态',
  },
  {
    key: '5',
    field: 'email',
    type: 'string',
    description: '用户邮箱',
  },
  {
    key: '6',
    field: 'founder',
    type: 'boolean',
    description: '是否为创始人',
  },
]

const updateUserStatusCodes = [
  {
    key: '1',
    code: '200',
    description: '更新成功',
  },
  {
    key: '2',
    code: '401',
    description: '未认证',
  },
  {
    key: '3',
    code: '403',
    description: '无权限或无法修改创始人状态',
  },
  {
    key: '4',
    code: '404',
    description: '用户不存在',
  },
  {
    key: '5',
    code: '500',
    description: '服务器错误',
  },
]

// 更新用户角色接口数据
const updateUserRoleParams = [
  {
    key: '1',
    name: 'id',
    type: 'string',
    required: '是',
    description: '用户ID',
  },
  {
    key: '2',
    name: 'role',
    type: 'string',
    required: '是',
    description: '用户角色(admin/user)',
  },
]

const updateUserRoleResponse = updateUserStatusResponse
const updateUserRoleCodes = updateUserStatusCodes

// 获取系统统计信息接口数据
const systemStatsParams = []

const systemStatsResponse = [
  {
    key: '1',
    field: 'stats',
    type: 'array',
    description: '统计信息',
  },
  {
    key: '2',
    field: 'stats[].name',
    type: 'string',
    description: '统计项名称',
  },
  {
    key: '3',
    field: 'stats[].value',
    type: 'string/number',
    description: '统计项值',
  },
  {
    key: '4',
    field: 'system',
    type: 'array',
    description: '系统信息',
  },
  {
    key: '5',
    field: 'system[].name',
    type: 'string',
    description: '系统信息项名称',
  },
  {
    key: '6',
    field: 'system[].value',
    type: 'string',
    description: '系统信息项值',
  },
]

const systemStatsCodes = [
  {
    key: '1',
    code: '200',
    description: '获取成功',
  },
  {
    key: '2',
    code: '401',
    description: '未认证',
  },
  {
    key: '3',
    code: '403',
    description: '无权限',
  },
  {
    key: '4',
    code: '500',
    description: '服务器错误',
  },
]

// 获取上传日志列表接口数据
const getLogsParams = [
  {
    key: '1',
    name: 'page',
    type: 'number',
    required: '是',
    description: '页码',
  },
  {
    key: '2',
    name: 'limit',
    type: 'number',
    required: '是',
    description: '每页数量',
  },
  {
    key: '3',
    name: 'startDate',
    type: 'string',
    required: '否',
    description: '开始日期',
  },
  {
    key: '4',
    name: 'endDate',
    type: 'string',
    required: '否',
    description: '结束日期',
  },
  {
    key: '5',
    name: 'username',
    type: 'string',
    required: '否',
    description: '用户名(模糊搜索)',
  },
  {
    key: '6',
    name: 'ip',
    type: 'string',
    required: '否',
    description: 'IP地址(模糊搜索)',
  },
]

const getLogsResponse = [
  {
    key: '1',
    field: 'logs',
    type: 'array',
    description: '日志列表',
  },
  {
    key: '2',
    field: 'total',
    type: 'number',
    description: '总数量',
  },
  {
    key: '3',
    field: 'page',
    type: 'number',
    description: '当前页码',
  },
  {
    key: '4',
    field: 'limit',
    type: 'number',
    description: '每页数量',
  },
]

const getLogsCodes = [
  {
    key: '1',
    code: '200',
    description: '获取成功',
  },
  {
    key: '2',
    code: '401',
    description: '未认证',
  },
  {
    key: '3',
    code: '403',
    description: '无权限',
  },
  {
    key: '4',
    code: '500',
    description: '服务器错误',
  },
]

// 获取日志统计信息接口数据
const getLogsStatsParams = [
  {
    key: '1',
    name: 'startDate',
    type: 'string',
    required: '否',
    description: '开始日期',
  },
  {
    key: '2',
    name: 'endDate',
    type: 'string',
    required: '否',
    description: '结束日期',
  },
]

const getLogsStatsResponse = [
  {
    key: '1',
    field: 'dailyStats',
    type: 'array',
    description: '每日统计信息',
  },
  {
    key: '2',
    field: 'dailyStats[]._id',
    type: 'object',
    description: '日期信息',
  },
  {
    key: '3',
    field: 'dailyStats[]._id.year',
    type: 'number',
    description: '年份',
  },
  {
    key: '4',
    field: 'dailyStats[]._id.month',
    type: 'number',
    description: '月份',
  },
  {
    key: '5',
    field: 'dailyStats[]._id.day',
    type: 'number',
    description: '日期',
  },
  {
    key: '6',
    field: 'dailyStats[].count',
    type: 'number',
    description: '上传数量',
  },
  {
    key: '7',
    field: 'dailyStats[].totalSize',
    type: 'number',
    description: '总大小(字节)',
  },
  {
    key: '8',
    field: 'ipStats',
    type: 'array',
    description: 'IP统计信息',
  },
  {
    key: '9',
    field: 'ipStats[]._id',
    type: 'string',
    description: 'IP地址',
  },
  {
    key: '10',
    field: 'ipStats[].count',
    type: 'number',
    description: '上传次数',
  },
  {
    key: '11',
    field: 'userStats',
    type: 'array',
    description: '用户统计信息',
  },
  {
    key: '12',
    field: 'userStats[]._id',
    type: 'string',
    description: '用户ID',
  },
  {
    key: '13',
    field: 'userStats[].username',
    type: 'string',
    description: '用户名',
  },
  {
    key: '14',
    field: 'userStats[].count',
    type: 'number',
    description: '上传次数',
  },
  {
    key: '15',
    field: 'userStats[].totalSize',
    type: 'number',
    description: '总大小(字节)',
  },
]

const getLogsStatsCodes = [
  {
    key: '1',
    code: '200',
    description: '获取成功',
  },
  {
    key: '2',
    code: '401',
    description: '未认证',
  },
  {
    key: '3',
    code: '403',
    description: '无权限',
  },
  {
    key: '4',
    code: '500',
    description: '服务器错误',
  },
]

// 删除指定日志接口数据
const deleteLogParams = [
  {
    key: '1',
    name: 'id',
    type: 'string',
    required: '是',
    description: '日志ID',
  },
]

const deleteLogResponse = [
  {
    key: '1',
    field: 'message',
    type: 'string',
    description: '删除成功',
  },
]

const deleteLogCodes = [
  {
    key: '1',
    code: '200',
    description: '删除成功',
  },
  {
    key: '2',
    code: '401',
    description: '未认证',
  },
  {
    key: '3',
    code: '403',
    description: '无权限',
  },
  {
    key: '4',
    code: '404',
    description: '日志不存在',
  },
  {
    key: '5',
    code: '500',
    description: '服务器错误',
  },
]

// 清空所有日志接口数据
const clearLogsParams = []

const clearLogsResponse = [
  {
    key: '1',
    field: 'message',
    type: 'string',
    description: '所有日志已清空',
  },
]

const clearLogsCodes = [
  {
    key: '1',
    code: '200',
    description: '清空成功',
  },
  {
    key: '2',
    code: '401',
    description: '未认证',
  },
  {
    key: '3',
    code: '403',
    description: '无权限',
  },
  {
    key: '4',
    code: '500',
    description: '服务器错误',
  },
]

// 获取我的图片列表接口数据
const myImagesParams = [
  {
    key: '1',
    name: 'page',
    type: 'number',
    required: '是',
    description: '页码',
  },
  {
    key: '2',
    name: 'limit',
    type: 'number',
    required: '是',
    description: '每页数量',
  },
]

const myImagesResponse = [
  {
    key: '1',
    field: 'images',
    type: 'array',
    description: '图片列表',
  },
  {
    key: '2',
    field: 'total',
    type: 'number',
    description: '总数量',
  },
]

const myImagesCodes = [
  {
    key: '1',
    code: '200',
    description: '获取成功',
  },
  {
    key: '2',
    code: '401',
    description: '未认证',
  },
  {
    key: '3',
    code: '500',
    description: '服务器错误',
  },
]

// 删除我的图片接口数据
const deleteMyImageParams = [
  {
    key: '1',
    name: 'id',
    type: 'string',
    required: '是',
    description: '图片ID',
  },
]

const deleteMyImageResponse = [
  {
    key: '1',
    field: 'message',
    type: 'string',
    description: '删除成功',
  },
]

const deleteMyImageCodes = [
  {
    key: '1',
    code: '200',
    description: '删除成功',
  },
  {
    key: '2',
    code: '401',
    description: '未认证',
  },
  {
    key: '3',
    code: '404',
    description: '图片不存在',
  },
  {
    key: '4',
    code: '500',
    description: '服务器错误',
  },
]
</script>

<style scoped>
.api-docs {
  padding: 20px;
}

.api-card {
  margin-bottom: 20px;
}

h3 {
  margin: 16px 0;
  font-weight: 500;
}

:deep(.ant-descriptions) {
  margin-bottom: 16px;
}

:deep(.ant-collapse) {
  background: rgb(255, 255, 255);
}

:deep(.ant-collapse-item .ant-collapse-content-box) {
  padding-top: 16px !important;
  background: rgb(255, 255, 255);
}


:deep(.ant-collapse-item) {
  background: rgb(247, 247, 247);
  border-radius: 4px;
  margin-bottom: 24px;
  border: 0px;
  overflow: hidden;
}
</style>

<style>
/* .ant-collapse-item .ant-collapse-content-box {
  background: rgb(255, 255, 255);
} */
</style>