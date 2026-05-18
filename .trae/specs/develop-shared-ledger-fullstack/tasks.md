# Tasks - 共享记账报销小程序完整开发

## 前置准备

- [x] 任务0.1: 创建后端项目结构 (shared-ledger-api)
- [x] 任务0.2: 创建前端项目结构 (shared-ledger-app)
- [x] 任务0.3: 编写数据库初始化脚本 (SQL)

## 后端开发

### 1. 基础架构
- [x] 任务1.1: 后端项目初始化 - package.json, 依赖安装
- [x] 任务1.2: 后端配置文件 - .env.example, database.js, jwt.js
- [x] 任务1.3: 后端中间件 - auth, error, cors, logger
- [x] 任务1.4: 后端工具函数 - response.js, validate.js

### 2. 数据库层
- [x] 任务2.1: 数据库连接与ORM封装
- [x] 任务2.2: 数据库初始化脚本 - 9张表+预设数据

### 3. 用户模块
- [x] 任务3.1: 用户注册/登录API (手机号+验证码)
- [x] 任务3.2: 用户信息API (获取/更新个人信息)

### 4. 账本模块
- [x] 任务4.1: 账本CRUD API (创建/获取/更新/删除)
- [x] 任务4.2: 邀请码生成与加入账本API
- [x] 任务4.3: 账本成员管理API (列表/移除/角色设置)

### 5. 记账模块
- [x] 任务5.1: 账目录入API (添加/修改/删除)
- [x] 任务5.2: 账目列表与详情API
- [x] 任务5.3: 报销状态修改API

### 6. 虚拟成员模块
- [x] 任务6.1: 虚拟成员CRUD API
- [x] 任务6.2: 收支人列表API (真实+虚拟成员合并)

### 7. 权限模块
- [x] 任务7.1: 权限管理API (获取/更新成员权限)
- [x] 任务7.2: 权限校验中间件 (核心 - 所有写操作校验)

### 8. 账本锁定模块
- [x] 任务8.1: 锁定/解锁API
- [x] 任务8.2: 自动锁定定时任务 (node-cron)

### 9. 分类模块
- [x] 任务9.1: 分类管理API (CRUD)

### 10. 图片上传模块
- [x] 任务10.1: 图片上传API (本地存储)

### 11. 统计模块
- [x] 任务11.1: 统计API (汇总/按成员/按分类)

### 12. 导出模块
- [x] 任务12.1: Excel导出API (使用exceljs)

### 13. 路由整合
- [x] 任务13.1: 后端路由汇总与入口文件

## 前端开发

### 1. 基础架构
- [x] 任务1.1: 前端项目初始化 - UniApp + Vue3 + Vite + Pinia
- [x] 任务1.2: 路由配置 - pages.json
- [x] 任务1.3: 请求封装 - request.js
- [x] 任务1.4: Pinia Store - user, ledger, app

### 2. 用户模块
- [x] 任务2.1: 登录页 (pages/login/login)
- [x] 任务2.2: 个人中心页 (pages/mine/index)
- [x] 任务2.3: 个人信息编辑页 (pages/mine/profile)

### 3. 账本模块
- [x] 任务3.1: 首页/账本列表 (pages/index/index)
- [x] 任务3.2: 创建账本页 (pages/ledger/create)
- [x] 任务3.3: 加入账本页 (pages/ledger/join)
- [x] 任务3.4: 账本设置页 (pages/ledger/settings)
- [x] 任务3.5: 成员管理页 (pages/ledger/members)

### 4. 记账模块
- [x] 任务4.1: 账本详情页 (pages/ledger/detail)
- [x] 任务4.2: 添加账目页 (pages/transaction/add)
- [x] 任务4.3: 账目详情页 (pages/transaction/detail)

### 5. 虚拟成员模块
- [x] 任务5.1: 虚拟成员列表页 (pages/virtual/list)
- [x] 任务5.2: 编辑虚拟成员页 (pages/virtual/edit)
- [x] 任务5.3: 收支人选择组件 (PayeePicker)

### 6. 权限模块
- [x] 任务6.1: 权限设置页 (pages/member/permission)

### 7. 账本锁定模块
- [x] 任务7.1: 账本锁定设置页 (pages/ledger/lock)
- [x] 任务7.2: 锁定状态提示组件 (LockBanner)

### 8. 分类模块
- [x] 任务8.1: 分类管理页 (pages/category/list)

### 9. 统计模块
- [x] 任务9.1: 统计报表页 (pages/statistics/index)

### 10. 导出模块
- [x] 任务10.1: 导出报表页 (pages/export/index)

### 11. 公共组件
- [x] 任务11.1: LedgerCard - 账本卡片
- [x] 任务11.2: TransactionItem - 账目项
- [x] 任务11.3: CategoryTag - 分类标签
- [x] 任务11.4: ImageUploader - 图片上传
- [x] 任务11.5: StatCard - 统计卡片
- [x] 任务11.6: EmptyState - 空状态

## 文档完善

- [x] 任务D1: 完善 README.md
  - 项目介绍
  - 功能特性
  - 技术栈
  - 项目结构
  - 环境要求
  - 安装部署
  - API接口文档
  - 数据库设计
