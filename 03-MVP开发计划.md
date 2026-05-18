# 共享记账报销小程序 - MVP开发计划

## 1. 项目概述

### 1.1 MVP目标
在**5周**内完成最小可行产品，实现核心的报销记账功能，支持：
- 用户登录/注册
- 创建/加入报销账本
- 记录支出并标记报销状态
- 虚拟成员管理
- 成员权限管理
- 账本锁定功能
- 基础统计和导出

### 1.2 技术栈
- **前端**: UniApp 3.x + Vue3 + Pinia
- **后端**: Node.js + Express
- **数据库**: MySQL 8.0
- **定时任务**: node-cron（自动锁定检查）
- **部署**: 云服务器 + Nginx

---

## 2. 开发阶段规划

### 2.1 第一阶段：项目搭建（第1周）

#### 2.1.1 第1-2天：环境准备

**后端开发**:
- [ ] 服务器环境配置（Node.js、MySQL、Nginx）
- [ ] 初始化后端项目结构
- [ ] 配置数据库连接
- [ ] 搭建基础中间件（日志、错误处理、CORS）
- [ ] 配置node-cron定时任务框架

**前端开发**:
- [ ] 安装HBuilderX / VSCode
- [ ] 初始化UniApp项目
- [ ] 配置ESLint、Prettier
- [ ] 安装UI组件库（uView UI）

#### 2.1.2 第3-4天：数据库设计与实现

- [ ] 创建数据库和表结构（9张表）
- [ ] 编写数据库迁移脚本
- [ ] 插入系统预设分类数据
- [ ] 编写数据库操作层（ORM/DAO）

**交付物**:
- 可运行的后端服务框架
- 可运行的前端项目框架
- 完整的数据库表结构

#### 2.1.3 第5-7天：用户模块开发

**后端API**:
- [ ] POST /auth/login - 手机号登录
- [ ] POST /auth/wx-login - 微信登录
- [ ] GET /user/profile - 获取用户信息
- [ ] PUT /user/profile - 更新用户信息

**前端页面**:
- [ ] 登录页（pages/login/login）
- [ ] 个人中心页（pages/mine/index）
- [ ] 个人信息编辑页（pages/mine/profile）

**交付物**:
- 完整的用户登录/注册流程
- 用户信息管理功能

---

### 2.2 第二阶段：核心功能开发（第2-3周）

#### 2.2.1 第8-10天：账本模块

**后端API**:
- [ ] POST /ledgers - 创建账本
- [ ] GET /ledgers - 获取账本列表
- [ ] GET /ledgers/:id - 获取账本详情
- [ ] PUT /ledgers/:id - 更新账本
- [ ] DELETE /ledgers/:id - 删除账本
- [ ] POST /ledgers/:id/join - 加入账本
- [ ] GET /ledgers/:id/members - 获取成员列表
- [ ] DELETE /ledgers/:id/members/:userId - 移除成员
- [ ] PUT /ledgers/:id/members/:userId/role - 设置成员角色

**前端页面**:
- [ ] 首页/账本列表（pages/index/index）
- [ ] 创建账本页（pages/ledger/create）
- [ ] 加入账本页（pages/ledger/join）
- [ ] 账本设置页（pages/ledger/settings）
- [ ] 成员管理页（pages/ledger/members）

**交付物**:
- 完整的账本CRUD功能
- 邀请码加入机制
- 成员角色管理（创建者/管理员/成员）

#### 2.2.2 第11-14天：记账模块

**后端API**:
- [ ] POST /ledgers/:id/transactions - 添加账目
- [ ] GET /ledgers/:id/transactions - 获取账目列表
- [ ] GET /transactions/:id - 获取账目详情
- [ ] PUT /transactions/:id - 修改账目
- [ ] DELETE /transactions/:id - 删除账目
- [ ] PUT /transactions/:id/reimburse - 修改报销状态

**前端页面**:
- [ ] 账本详情页（pages/ledger/detail）
  - 账目列表（支持筛选：全部/未报销/已报销）
  - 统计卡片（本月支出/待报销）
  - 锁定状态提示
- [ ] 添加账目页（pages/transaction/add）
  - 收支人选择（含虚拟成员）
- [ ] 账目详情页（pages/transaction/detail）

**交付物**:
- 完整的记账功能
- 报销状态标记功能
- 锁定状态下的UI限制

#### 2.2.3 第15-17天：分类和图片模块

**后端API**:
- [ ] GET /ledgers/:id/categories - 获取分类列表
- [ ] POST /ledgers/:id/categories - 添加分类
- [ ] PUT /categories/:id - 修改分类
- [ ] DELETE /categories/:id - 删除分类
- [ ] POST /upload/image - 上传图片

**前端页面**:
- [ ] 分类管理页（pages/category/list）
- [ ] 图片上传组件

**交付物**:
- 分类管理功能
- 图片上传功能（凭证上传）

---

### 2.3 第三阶段：权限与虚拟成员（第4周）

#### 2.3.1 第18-20天：虚拟成员模块

**后端API**:
- [ ] POST /ledgers/:id/virtual-members - 创建虚拟成员
- [ ] GET /ledgers/:id/virtual-members - 获取虚拟成员列表
- [ ] PUT /ledgers/:id/virtual-members/:id - 修改虚拟成员
- [ ] DELETE /ledgers/:id/virtual-members/:id - 删除虚拟成员
- [ ] GET /ledgers/:id/payees - 获取收支人列表（真实+虚拟）

**前端页面**:
- [ ] 虚拟成员列表页（pages/virtual/list）
- [ ] 编辑虚拟成员页（pages/virtual/edit）
- [ ] 收支人选择组件（下拉列表含虚拟成员标识）

**交付物**:
- 虚拟成员CRUD功能
- 记账时可选虚拟成员为收支人

#### 2.3.2 第21-23天：权限管理模块

**后端API**:
- [ ] GET /ledgers/:id/members/:memberId/permissions - 获取成员权限
- [ ] PUT /ledgers/:id/members/:memberId/permissions - 更新成员权限
- [ ] 后端权限校验中间件（所有写操作强制校验）

**前端页面**:
- [ ] 权限设置页（pages/member/permission）
  - 添加账目：全部 / 不允许
  - 修改账目：全部 / 仅自己 / 不允许
  - 删除账目：全部 / 仅自己 / 不允许
  - 修改报销状态：全部 / 仅自己 / 不允许
  - 导出报表：全部 / 不允许

**后端权限中间件**:
- [ ] 账本锁定检查（锁定后拒绝所有写操作）
- [ ] 角色检查（创建者放行）
- [ ] 权限字段检查（查询ledger_permissions表）
- [ ] 数据归属检查（仅自己时检查user_id）

**交付物**:
- 完整的权限管理系统
- 后端权限校验中间件

#### 2.3.3 第24-25天：账本锁定模块

**后端API**:
- [ ] PUT /ledgers/:id/lock - 手动锁定/解锁账本
- [ ] PUT /ledgers/:id/lock-settings - 设置自动锁定规则
- [ ] 定时任务：自动锁定检查（每分钟执行）

**前端页面**:
- [ ] 账本锁定设置页（pages/ledger/lock）
  - 手动锁定/解锁开关
  - 自动锁定开关
  - 自动锁定时间选择（7天/30天/90天/180天/永不）
- [ ] 账本详情页锁定状态提示

**交付物**:
- 手动锁定/解锁功能
- 自动锁定定时任务
- 锁定状态UI提示

---

### 2.4 第四阶段：统计和导出（第5周）

#### 2.4.1 第26-28天：统计模块

**后端API**:
- [ ] GET /ledgers/:id/stats/summary - 获取汇总统计
- [ ] GET /ledgers/:id/stats/by-member - 按成员统计（含虚拟成员）
- [ ] GET /ledgers/:id/stats/by-category - 按分类统计

**前端页面**:
- [ ] 统计报表页（pages/statistics/index）
  - 个人报销统计
  - 团队报销统计（含虚拟成员）
  - 分类占比图表

**交付物**:
- 完整的统计功能

#### 2.4.2 第29-30天：导出模块

**后端API**:
- [ ] POST /ledgers/:id/export - 导出Excel
- [ ] GET /exports/:id - 下载导出文件

**前端页面**:
- [ ] 导出报表页（pages/export/index）

**交付物**:
- Excel导出功能

#### 2.4.3 第31-35天：测试和优化

- [ ] 权限系统测试（各角色各权限组合）
- [ ] 账本锁定测试（手动锁定、自动锁定、解锁）
- [ ] 虚拟成员测试（创建、记账、统计）
- [ ] 接口测试（Postman/Apifox）
- [ ] 前端功能测试
- [ ] 修复Bug
- [ ] 性能优化
- [ ] 代码审查

**交付物**:
- 测试报告
- 修复后的稳定版本

---

## 3. 详细任务清单

### 3.1 后端开发任务

| 模块 | 任务 | 预估工时 | 负责人 |
|-----|------|---------|-------|
| 基础框架 | 项目初始化 | 4h | 后端 |
| 基础框架 | 数据库配置 | 2h | 后端 |
| 基础框架 | 中间件开发 | 4h | 后端 |
| 基础框架 | 定时任务框架 | 2h | 后端 |
| 用户模块 | 登录/注册API | 6h | 后端 |
| 用户模块 | 用户信息API | 3h | 后端 |
| 账本模块 | 账本CRUD API | 8h | 后端 |
| 账本模块 | 成员管理API | 8h | 后端 |
| 账本模块 | 账本锁定API | 4h | 后端 |
| 账本模块 | 自动锁定定时任务 | 3h | 后端 |
| 记账模块 | 账目CRUD API | 8h | 后端 |
| 记账模块 | 报销状态API | 3h | 后端 |
| 权限模块 | 权限管理API | 6h | 后端 |
| 权限模块 | 权限校验中间件 | 8h | 后端 |
| 虚拟成员 | 虚拟成员CRUD API | 6h | 后端 |
| 虚拟成员 | 收支人列表API | 2h | 后端 |
| 分类模块 | 分类管理API | 6h | 后端 |
| 图片模块 | 图片上传API | 4h | 后端 |
| 统计模块 | 统计API（含虚拟成员） | 10h | 后端 |
| 导出模块 | Excel导出API | 6h | 后端 |
| **合计** | | **113h** | |

### 3.2 前端开发任务

| 模块 | 任务 | 预估工时 | 负责人 |
|-----|------|---------|-------|
| 基础框架 | 项目初始化 | 4h | 前端 |
| 基础框架 | 路由配置 | 2h | 前端 |
| 基础框架 | 状态管理(Pinia) | 4h | 前端 |
| 基础框架 | 请求封装 | 4h | 前端 |
| 用户模块 | 登录页 | 6h | 前端 |
| 用户模块 | 个人中心 | 4h | 前端 |
| 账本模块 | 首页/账本列表 | 8h | 前端 |
| 账本模块 | 创建/加入账本 | 6h | 前端 |
| 账本模块 | 账本设置 | 4h | 前端 |
| 账本模块 | 成员管理页 | 6h | 前端 |
| 账本模块 | 账本锁定设置页 | 4h | 前端 |
| 记账模块 | 账本详情页 | 12h | 前端 |
| 记账模块 | 添加/编辑账目 | 10h | 前端 |
| 权限模块 | 权限设置页 | 6h | 前端 |
| 虚拟成员 | 虚拟成员管理页 | 6h | 前端 |
| 虚拟成员 | 收支人选择组件 | 4h | 前端 |
| 分类模块 | 分类管理 | 6h | 前端 |
| 统计模块 | 统计报表页 | 10h | 前端 |
| 导出模块 | 导出页面 | 4h | 前端 |
| 组件开发 | 公共组件封装 | 10h | 前端 |
| **合计** | | **120h** | |

---

## 4. 项目目录结构

### 4.1 后端目录结构

```
shared-ledger-api/
├── src/
│   ├── config/              # 配置文件
│   │   ├── database.js      # 数据库配置
│   │   ├── jwt.js           # JWT配置
│   │   └── oss.js           # 对象存储配置
│   ├── controllers/         # 控制器
│   │   ├── auth.js          # 认证相关
│   │   ├── user.js          # 用户相关
│   │   ├── ledger.js        # 账本相关
│   │   ├── transaction.js   # 账目相关
│   │   ├── category.js      # 分类相关
│   │   ├── permission.js    # 权限相关
│   │   ├── virtualMember.js # 虚拟成员相关
│   │   ├── statistics.js    # 统计相关
│   │   └── export.js        # 导出相关
│   ├── models/              # 数据模型
│   │   ├── user.js
│   │   ├── ledger.js
│   │   ├── ledgerMember.js
│   │   ├── ledgerPermission.js
│   │   ├── virtualMember.js
│   │   ├── category.js
│   │   ├── transaction.js
│   │   ├── transactionImage.js
│   │   └── export.js
│   ├── routes/              # 路由
│   │   ├── index.js
│   │   ├── auth.js
│   │   ├── user.js
│   │   ├── ledger.js
│   │   ├── transaction.js
│   │   ├── category.js
│   │   ├── permission.js
│   │   ├── virtualMember.js
│   │   ├── statistics.js
│   │   └── export.js
│   ├── middleware/          # 中间件
│   │   ├── auth.js          # 认证中间件
│   │   ├── permission.js    # 权限校验中间件（核心）
│   │   ├── lock.js          # 账本锁定检查中间件
│   │   ├── error.js         # 错误处理
│   │   └── upload.js        # 文件上传
│   ├── tasks/               # 定时任务
│   │   └── autoLock.js      # 自动锁定检查任务
│   ├── utils/               # 工具函数
│   │   ├── response.js      # 统一响应格式
│   │   ├── validate.js      # 参数校验
│   │   ├── date.js          # 日期处理
│   │   ├── permission.js    # 权限判断工具
│   │   └── excel.js         # Excel操作
│   └── app.js               # 应用入口
├── tests/                   # 测试文件
├── scripts/                 # 脚本文件
│   └── init-db.js           # 数据库初始化
├── .env                     # 环境变量
├── .env.example             # 环境变量示例
├── package.json
└── README.md
```

### 4.2 前端目录结构

```
shared-ledger-app/
├── src/
│   ├── api/                 # API接口
│   │   ├── auth.js
│   │   ├── user.js
│   │   ├── ledger.js
│   │   ├── transaction.js
│   │   ├── category.js
│   │   ├── permission.js
│   │   ├── virtualMember.js
│   │   ├── statistics.js
│   │   └── export.js
│   ├── components/          # 公共组件
│   │   ├── LedgerCard/      # 账本卡片
│   │   ├── TransactionItem/ # 账目项
│   │   ├── CategoryTag/     # 分类标签
│   │   ├── ImageUploader/   # 图片上传
│   │   ├── StatCard/        # 统计卡片
│   │   ├── EmptyState/      # 空状态
│   │   ├── PayeePicker/     # 收支人选择器（含虚拟成员）
│   │   ├── PermissionEditor/# 权限编辑器
│   │   └── LockBanner/      # 锁定状态提示横幅
│   ├── pages/               # 页面
│   │   ├── index/           # 首页（账本列表）
│   │   ├── login/           # 登录
│   │   ├── mine/            # 我的
│   │   ├── ledger/          # 账本相关（含锁定设置）
│   │   ├── member/          # 权限设置
│   │   ├── virtual/         # 虚拟成员管理
│   │   ├── transaction/     # 账目相关
│   │   ├── category/        # 分类管理
│   │   ├── statistics/      # 统计报表
│   │   └── export/          # 导出
│   ├── stores/              # Pinia状态管理
│   │   ├── user.js
│   │   ├── ledger.js
│   │   └── app.js
│   ├── utils/               # 工具函数
│   │   ├── request.js       # 请求封装
│   │   ├── format.js        # 格式化
│   │   ├── validate.js      # 校验
│   │   ├── storage.js       # 本地存储
│   │   └── permission.js    # 前端权限判断
│   ├── static/              # 静态资源
│   │   ├── images/
│   │   └── icons/
│   ├── App.vue
│   ├── main.js
│   ├── manifest.json
│   ├── pages.json
│   └── uni.scss
├── .env.development
├── .env.production
├── vite.config.js
├── package.json
└── README.md
```

---

## 5. API接口清单

### 5.1 认证模块

| 接口 | 方法 | 路径 | 说明 |
|-----|------|------|------|
| 手机号登录 | POST | /api/auth/login | 手机号+验证码登录 |
| 微信登录 | POST | /api/auth/wx-login | 微信code换token |

### 5.2 用户模块

| 接口 | 方法 | 路径 | 说明 |
|-----|------|------|------|
| 获取用户信息 | GET | /api/user/profile | 获取当前用户信息 |
| 更新用户信息 | PUT | /api/user/profile | 修改昵称/头像 |

### 5.3 账本模块

| 接口 | 方法 | 路径 | 说明 |
|-----|------|------|------|
| 创建账本 | POST | /api/ledgers | 创建新账本 |
| 获取账本列表 | GET | /api/ledgers | 获取我的账本列表 |
| 获取账本详情 | GET | /api/ledgers/:id | 获取账本基本信息 |
| 更新账本 | PUT | /api/ledgers/:id | 修改账本信息 |
| 删除账本 | DELETE | /api/ledgers/:id | 删除账本（仅创建者） |
| 加入账本 | POST | /api/ledgers/join | 通过邀请码加入 |
| 获取成员列表 | GET | /api/ledgers/:id/members | 获取账本成员 |
| 移除成员 | DELETE | /api/ledgers/:id/members/:userId | 移除成员 |
| 设置成员角色 | PUT | /api/ledgers/:id/members/:userId/role | 设置角色（创建者/管理员/成员） |
| 手动锁定/解锁 | PUT | /api/ledgers/:id/lock | 锁定/解锁账本（仅创建者） |
| 设置锁定规则 | PUT | /api/ledgers/:id/lock-settings | 设置自动锁定规则 |

### 5.4 权限模块

| 接口 | 方法 | 路径 | 说明 |
|-----|------|------|------|
| 获取成员权限 | GET | /api/ledgers/:id/members/:memberId/permissions | 获取成员权限配置 |
| 更新成员权限 | PUT | /api/ledgers/:id/members/:memberId/permissions | 更新成员权限 |

**权限更新请求体**:
```json
{
  "can_add": 1,
  "can_edit": 2,
  "can_delete": 2,
  "can_reimburse": 0,
  "can_export": 1
}
```

### 5.5 虚拟成员模块

| 接口 | 方法 | 路径 | 说明 |
|-----|------|------|------|
| 创建虚拟成员 | POST | /api/ledgers/:id/virtual-members | 创建虚拟成员 |
| 获取虚拟成员列表 | GET | /api/ledgers/:id/virtual-members | 获取虚拟成员列表 |
| 修改虚拟成员 | PUT | /api/ledgers/:id/virtual-members/:id | 修改名称/头像 |
| 删除虚拟成员 | DELETE | /api/ledgers/:id/virtual-members/:id | 删除虚拟成员 |
| 获取收支人列表 | GET | /api/ledgers/:id/payees | 获取所有收支人（真实+虚拟） |

### 5.6 记账模块

| 接口 | 方法 | 路径 | 说明 |
|-----|------|------|------|
| 添加账目 | POST | /api/ledgers/:id/transactions | 新增账目 |
| 获取账目列表 | GET | /api/ledgers/:id/transactions | 分页获取账目 |
| 获取账目详情 | GET | /api/transactions/:id | 获取单条账目 |
| 修改账目 | PUT | /api/transactions/:id | 修改账目信息 |
| 删除账目 | DELETE | /api/transactions/:id | 删除账目 |
| 修改报销状态 | PUT | /api/transactions/:id/reimburse | 标记已/未报销 |

**添加账目请求体（新增字段）**:
```json
{
  "amount": 80.00,
  "type": 1,
  "category_id": 1,
  "transaction_date": "2024-01-15",
  "remark": "午餐",
  "payee_id": 123,
  "is_virtual_payee": false,
  "reimburse_status": 1,
  "images": ["url1", "url2"]
}
```

### 5.7 分类模块

| 接口 | 方法 | 路径 | 说明 |
|-----|------|------|------|
| 获取分类列表 | GET | /api/ledgers/:id/categories | 获取账本分类 |
| 添加分类 | POST | /api/ledgers/:id/categories | 新增分类 |
| 修改分类 | PUT | /api/categories/:id | 修改分类 |
| 删除分类 | DELETE | /api/categories/:id | 删除分类 |

### 5.8 统计模块

| 接口 | 方法 | 路径 | 说明 |
|-----|------|------|------|
| 获取汇总统计 | GET | /api/ledgers/:id/stats/summary | 收支汇总 |
| 按成员统计 | GET | /api/ledgers/:id/stats/by-member | 成员报销统计（含虚拟成员） |
| 按分类统计 | GET | /api/ledgers/:id/stats/by-category | 分类占比 |

### 5.9 导出模块

| 接口 | 方法 | 路径 | 说明 |
|-----|------|------|------|
| 导出Excel | POST | /api/ledgers/:id/export | 导出报销报表 |
| 下载文件 | GET | /api/exports/:id | 下载导出文件 |

### 5.10 上传模块

| 接口 | 方法 | 路径 | 说明 |
|-----|------|------|------|
| 上传图片 | POST | /api/upload/image | 上传凭证图片 |

---

## 6. 权限校验中间件设计

### 6.1 校验流程

```
请求进入
    │
    ▼
┌─────────────────┐
│ 1. 认证检查     │ → 未登录 → 401
│ (JWT Token)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. 账本锁定检查 │ → 已锁定 → 403（仅写操作）
│ (is_locked)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. 角色检查     │ → 创建者 → 放行
│ (ledger_members)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. 权限字段检查 │ → 不允许 → 403
│ (ledger_        │
│  permissions)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. 数据归属检查 │ → 非本人 → 403
│ (仅自己时)      │
└────────┬────────┘
         │
         ▼
    放行请求
```

### 6.2 权限校验映射表

| 操作 | 权限字段 | 仅自己时检查 |
|-----|---------|------------|
| 添加账目 | can_add | 无（全部或不允许） |
| 修改账目 | can_edit | 检查 user_id === 当前用户 |
| 删除账目 | can_delete | 检查 user_id === 当前用户 |
| 修改报销状态 | can_reimburse | 检查 user_id === 当前用户 |
| 导出报表 | can_export | 无（全部或不允许） |

---

## 7. 开发规范

### 7.1 代码规范

**后端**:
- 使用ESLint + Prettier
- 函数注释使用JSDoc
- API返回统一格式: `{ code: 0, data: {}, message: '' }`
- 权限校验统一使用中间件，不在控制器中重复校验

**前端**:
- 使用Vue3 Composition API
- 组件名使用大驼峰
- 页面名使用小写+连字符
- 权限相关UI使用工具函数统一控制显隐

### 7.2 Git规范

**分支管理**:
- main: 主分支，稳定版本
- develop: 开发分支
- feature/*: 功能分支
- bugfix/*: 修复分支

**提交规范**:
```
feat: 新功能
fix: 修复
docs: 文档
style: 格式
refactor: 重构
test: 测试
chore: 构建/工具
```

---

## 8. 测试计划

### 8.1 测试阶段

| 阶段 | 时间 | 内容 |
|-----|------|------|
| 单元测试 | 开发过程中 | 关键函数测试 |
| 接口测试 | 第4周末 | 所有API测试 |
| 权限测试 | 第4周末 | 各角色各权限组合 |
| 锁定测试 | 第4周末 | 手动/自动锁定场景 |
| 集成测试 | 第5周 | 前后端联调 |
| 验收测试 | 第5周末 | 功能验收 |

### 8.2 测试用例示例

**权限功能测试**:
1. 创建者修改任意账目 → 成功
2. 管理员修改自己账目（can_edit=2）→ 成功
3. 管理员修改他人账目（can_edit=2）→ 失败
4. 管理员修改报销状态（can_reimburse=0）→ 失败
5. 成员导出报表（can_export=0）→ 失败

**锁定功能测试**:
1. 创建者锁定账本 → 成功
2. 锁定后添加账目 → 失败
3. 锁定后修改账目 → 失败
4. 锁定后删除账目 → 失败
5. 锁定后查看账目 → 成功
6. 创建者解锁账本 → 成功
7. 自动锁定到期 → 账本自动锁定
8. 管理员尝试解锁 → 失败

**虚拟成员测试**:
1. 创建虚拟成员 → 成功
2. 记账时选择虚拟成员为收支人 → 成功
3. 统计中显示虚拟成员数据 → 成功
4. 删除有关联账目的虚拟成员 → 失败

---

## 9. 部署计划

### 9.1 部署环境

| 环境 | 用途 | 配置 |
|-----|------|------|
| 开发环境 | 日常开发 | 本地/内网服务器 |
| 测试环境 | 测试验证 | 云服务器1核2G |
| 生产环境 | 正式运行 | 云服务器2核4G |

### 9.2 部署步骤

1. **服务器准备**
   - 购买云服务器
   - 配置安全组（开放80/443/3306端口）
   - 配置域名解析

2. **环境安装**
   - 安装Node.js
   - 安装MySQL
   - 安装Nginx
   - 安装PM2

3. **应用部署**
   - 配置Nginx反向代理
   - 部署后端服务（PM2）
   - 部署前端静态文件
   - 配置SSL证书
   - 启动定时任务（node-cron随PM2启动）

4. **数据库部署**
   - 创建生产数据库
   - 执行初始化脚本
   - 配置定时备份

---

## 10. 风险与应对

| 风险 | 影响 | 应对措施 |
|-----|------|---------|
| 权限系统复杂 | 开发周期延长 | 优先实现基础权限，细化权限可迭代 |
| 锁定逻辑边界 | 误锁定影响使用 | 提供充分提示，仅创建者可解锁 |
| 开发延期 | 上线推迟 | 优先完成核心功能，非核心功能延后 |
| 接口联调问题 | 进度受阻 | 提前定义接口文档，Mock数据先行 |
| 性能问题 | 用户体验差 | 预留优化时间，提前做压力测试 |
| 第三方服务不稳定 | 功能异常 | 准备降级方案，如短信备用通道 |

---

## 11. 里程碑

| 里程碑 | 时间 | 交付物 |
|-------|------|-------|
| 项目启动 | 第1天 | 项目计划、环境搭建完成 |
| 基础框架完成 | 第7天 | 用户模块完成，可登录注册 |
| 核心功能完成 | 第17天 | 记账、报销状态功能可用 |
| 权限系统完成 | 第25天 | 权限管理、虚拟成员、账本锁定可用 |
| MVP完成 | 第35天 | 完整MVP版本，可测试验收 |

---

## 12. 后续迭代规划

### 12.1 V1.1版本（第6-7周）
- [ ] 图片压缩优化
- [ ] 统计图表可视化
- [ ] 账目搜索功能
- [ ] 数据导入功能

### 12.2 V1.2版本（第8-9周）
- [ ] 小程序审核发布
- [ ] 性能优化
- [ ] Bug修复
- [ ] 用户反馈收集

### 12.3 V2.0版本（后续）
- [ ] 多级审批流程
- [ ] 消息通知
- [ ] 数据备份
- [ ] 操作日志审计
