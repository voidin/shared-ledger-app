# 共享记账报销小程序

一款支持多人协作的记账报销小程序，提供账本管理、记账报销、虚拟成员、权限控制和账本锁定等完整功能。

## 功能特性

### 核心功能
- **多账本管理** - 创建个人账本或报销账本，支持邀请码邀请成员加入
- **智能记账** - 支持支出/收入分类、收支人选择、凭证图片上传
- **报销状态跟踪** - 标记账目为"已报销"或"未报销"，方便追踪报销进度
- **虚拟成员** - 为领导、客户等非系统用户创建虚拟角色，作为记账时的收支人
- **精细权限控制** - 可配置每个成员的添加/修改/删除/报销状态/导出权限
- **账本锁定** - 支持手动锁定和自动锁定，锁定后任何人无法修改账目
- **统计分析** - 汇总统计、按成员统计、按分类统计
- **Excel导出** - 支持按时间范围和报销状态筛选导出

### 技术亮点
- JWT Token 认证
- 账本锁定状态强制校验
- "仅自己"权限精确控制
- 软删除设计，保留数据可追溯
- 自动锁定定时任务

## 技术栈

### 前端
- **框架**: Vue 3 + Vite
- **UI组件**: Vant 4 (移动端组件库)
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP**: Axios

### 后端
- **运行环境**: Node.js
- **框架**: Express
- **数据库**: MySQL 8.0
- **认证**: JWT (jsonwebtoken)
- **文件上传**: Multer
- **定时任务**: node-cron
- **Excel处理**: exceljs

## 项目结构

```
shared-ledger-app/          # 前端项目
├── src/
│   ├── api/               # API接口封装
│   ├── components/        # 公共组件
│   │   ├── LedgerCard.vue       # 账本卡片
│   │   ├── TransactionItem.vue  # 账目项
│   │   ├── CategoryTag.vue      # 分类标签
│   │   ├── ImageUploader.vue    # 图片上传
│   │   ├── StatCard.vue         # 统计卡片
│   │   ├── EmptyState.vue       # 空状态
│   │   ├── PayeePicker.vue      # 收支人选择器
│   │   ├── PermissionEditor.vue # 权限编辑器
│   │   ├── LockBanner.vue       # 锁定提示
│   │   └── UserAvatar.vue       # 用户头像
│   ├── pages/             # 页面
│   │   ├── index/        # 首页/账本列表
│   │   ├── login/        # 登录
│   │   ├── mine/         # 个人中心
│   │   ├── ledger/       # 账本相关
│   │   ├── member/       # 权限设置
│   │   ├── virtual/      # 虚拟成员
│   │   ├── transaction/  # 账目录入
│   │   ├── category/     # 分类管理
│   │   ├── statistics/   # 统计报表
│   │   └── export/       # 导出
│   ├── stores/           # Pinia状态
│   ├── utils/            # 工具函数
│   └── router/           # 路由配置
├── public/
├── .env.development
├── .env.production
├── vite.config.js
└── package.json

shared-ledger-api/          # 后端项目
├── src/
│   ├── config/           # 配置文件
│   │   ├── database.js   # 数据库配置
│   │   └── jwt.js       # JWT配置
│   ├── controllers/      # 控制器
│   │   ├── auth.js       # 认证
│   │   ├── user.js       # 用户
│   │   ├── ledger.js     # 账本
│   │   ├── transaction.js# 账目
│   │   ├── category.js   # 分类
│   │   ├── virtualMember.js # 虚拟成员
│   │   ├── permission.js # 权限
│   │   ├── lock.js       # 锁定
│   │   ├── statistics.js # 统计
│   │   ├── export.js     # 导出
│   │   └── upload.js     # 上传
│   ├── models/           # 数据模型
│   ├── routes/           # 路由
│   ├── middleware/       # 中间件
│   │   ├── auth.js       # 认证中间件
│   │   ├── error.js      # 错误处理
│   │   ├── permission.js # 权限校验
│   │   ├── cors.js       # 跨域
│   │   ├── logger.js     # 日志
│   │   └── upload.js     # 上传
│   ├── tasks/            # 定时任务
│   │   └── autoLock.js   # 自动锁定
│   ├── utils/            # 工具函数
│   └── app.js           # 应用入口
├── scripts/
│   └── init-db.sql      # 数据库初始化
├── uploads/             # 上传文件目录
├── package.json
└── .env.example
```

## 环境要求

- Node.js >= 16.0.0
- MySQL >= 8.0
- npm >= 8.0

## 安装部署

### 1. 克隆项目

```bash
git clone <repository-url>
cd shared-ledger
```

### 2. 后端部署

```bash
cd shared-ledger-api

# 安装依赖
npm install

# 复制环境变量配置
cp .env.example .env

# 编辑 .env 文件，配置数据库和JWT密钥
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=shared_ledger
# DB_USER=your_user
# DB_PASSWORD=your_password
# JWT_SECRET=your_jwt_secret

# 创建数据库并初始化表结构
mysql -u root -p < scripts/init-db.sql

# 启动开发服务器
npm run dev

# 或启动生产服务器
npm start
```

### 3. 前端部署

```bash
cd shared-ledger-app

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 4. Nginx 配置（生产环境）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/shared-ledger-app/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 上传文件访问
    location /uploads {
        alias /path/to/shared-ledger-api/uploads;
        expires 7d;
    }
}
```

## API 接口文档

### 认证模块

| 接口 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/auth/send-code` | POST | 发送验证码 | 否 |
| `/api/auth/login` | POST | 手机号+验证码登录 | 否 |
| `/api/auth/register` | POST | 用户注册 | 否 |
| `/api/auth/wechat-login` | POST | 微信登录 | 否 |

### 用户模块

| 接口 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/user/profile` | GET | 获取用户信息 | 是 |
| `/api/user/profile` | PUT | 更新用户信息 | 是 |

### 账本模块

| 接口 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/ledgers` | POST | 创建账本 | 是 |
| `/api/ledgers` | GET | 获取账本列表 | 是 |
| `/api/ledgers/:id` | GET | 获取账本详情 | 是 |
| `/api/ledgers/:id` | PUT | 更新账本 | 是 |
| `/api/ledgers/:id` | DELETE | 删除账本 | 是 |
| `/api/ledgers/join` | POST | 通过邀请码加入 | 是 |
| `/api/ledgers/:id/members` | GET | 获取成员列表 | 是 |
| `/api/ledgers/:id/members/:userId` | DELETE | 移除成员 | 是 |
| `/api/ledgers/:id/members/:userId` | PUT | 设置成员角色 | 是 |

### 账目模块

| 接口 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/ledgers/:id/transactions` | POST | 添加账目 | 是 |
| `/api/ledgers/:id/transactions` | GET | 获取账目列表 | 是 |
| `/api/transactions/:id` | GET | 获取账目详情 | 是 |
| `/api/transactions/:id` | PUT | 修改账目 | 是 |
| `/api/transactions/:id` | DELETE | 删除账目 | 是 |
| `/api/transactions/:id/reimburse` | PUT | 修改报销状态 | 是 |

### 虚拟成员模块

| 接口 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/ledgers/:id/virtual-members` | POST | 创建虚拟成员 | 是 |
| `/api/ledgers/:id/virtual-members` | GET | 获取虚拟成员列表 | 是 |
| `/api/ledgers/:id/virtual-members/:mid` | PUT | 修改虚拟成员 | 是 |
| `/api/ledgers/:id/virtual-members/:mid` | DELETE | 删除虚拟成员 | 是 |
| `/api/ledgers/:id/payees` | GET | 获取收支人列表 | 是 |

### 权限模块

| 接口 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/ledgers/:id/members/:memberId` | GET | 获取成员权限 | 是 |
| `/api/ledgers/:id/members/:memberId` | PUT | 更新成员权限 | 是 |

### 锁定模块

| 接口 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/ledgers/:id/lock-status` | GET | 获取锁定状态 | 是 |
| `/api/ledgers/:id/lock` | PUT | 锁定/解锁账本 | 是 |
| `/api/ledgers/:id/lock-settings` | PUT | 设置自动锁定 | 是 |

### 分类模块

| 接口 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/ledgers/:id/categories` | GET | 获取分类列表 | 是 |
| `/api/ledgers/:id/categories` | POST | 创建分类 | 是 |
| `/api/categories/:id` | PUT | 修改分类 | 是 |
| `/api/categories/:id` | DELETE | 删除分类 | 是 |

### 统计模块

| 接口 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/ledgers/:id/stats/summary` | GET | 汇总统计 | 是 |
| `/api/ledgers/:id/stats/by-member` | GET | 按成员统计 | 是 |
| `/api/ledgers/:id/stats/by-category` | GET | 按分类统计 | 是 |

### 导出模块

| 接口 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/ledgers/:id/export` | POST | 导出Excel | 是 |
| `/api/exports/:id/download` | GET | 下载导出文件 | 是 |
| `/api/ledgers/:id/export-history` | GET | 导出历史 | 是 |

### 上传模块

| 接口 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/upload/image` | POST | 上传图片 | 是 |
| `/api/upload/images` | POST | 批量上传 | 是 |

## 数据库设计

### 数据表

| 序号 | 表名 | 说明 |
|-----|------|------|
| 1 | users | 用户表 |
| 2 | ledgers | 账本表 |
| 3 | ledger_members | 账本成员关联表 |
| 4 | ledger_permissions | 成员权限表 |
| 5 | virtual_members | 虚拟成员表 |
| 6 | categories | 分类表 |
| 7 | transactions | 账目表 |
| 8 | transaction_images | 账目图片关联表 |
| 9 | exports | 导出记录表 |

详细表结构请参考 [数据库设计文档](./02-数据库设计.md)。

### 角色说明

| 角色 | 值 | 说明 |
|-----|---|------|
| 创建者 | 1 | 账本所有者，拥有最高权限 |
| 管理员 | 2 | 可管理成员和权限 |
| 成员 | 3 | 基础记账和查看权限 |

### 权限级别

| 级别 | 值 | 说明 |
|-----|---|------|
| 不允许 | 0 | 无权执行此操作 |
| 全部 | 1 | 可对所有账目执行操作 |
| 仅自己 | 2 | 仅可对自己创建的账目执行操作 |

## 页面清单

| 页面路径 | 页面名称 | 说明 |
|---------|---------|------|
| /pages/index/index | 首页 | 账本列表入口 |
| /pages/login/index | 登录 | 手机号+验证码登录 |
| /pages/ledger/create | 创建账本 | 新建账本页面 |
| /pages/ledger/join | 加入账本 | 输入邀请码加入 |
| /pages/ledger/detail | 账本详情 | 账目列表+统计Tab |
| /pages/ledger/members | 成员管理 | 查看/管理成员 |
| /pages/ledger/settings | 账本设置 | 修改账本信息 |
| /pages/ledger/lock | 账本锁定 | 锁定设置页面 |
| /pages/member/permission | 权限设置 | 成员权限配置 |
| /pages/virtual/list | 虚拟成员 | 虚拟成员管理 |
| /pages/virtual/edit | 编辑虚拟成员 | 添加/编辑虚拟成员 |
| /pages/transaction/add | 添加账目 | 记账页面 |
| /pages/transaction/detail | 账目详情 | 查看/编辑账目 |
| /pages/category/list | 分类管理 | 收支分类管理 |
| /pages/statistics/index | 统计报表 | 报销统计页面 |
| /pages/export/index | 导出报表 | 导出Excel配置 |
| /pages/mine/index | 我的 | 个人中心 |
| /pages/mine/profile | 个人资料 | 修改个人信息 |

## 开发指南

### 添加新功能

1. **后端开发**
   - 在 `src/models/` 添加数据模型
   - 在 `src/controllers/` 添加业务逻辑
   - 在 `src/routes/` 添加路由
   - 如需权限控制，在 `src/middleware/permission.js` 添加校验

2. **前端开发**
   - 在 `src/api/` 添加 API 封装
   - 在 `src/pages/` 添加页面组件
   - 在 `src/components/` 添加公共组件
   - 在 `src/router/index.js` 添加路由

### 代码规范

- 后端：ESLint + CommonJS
- 前端：ESLint + Vue 3 Composition API
- 命名：小写+下划线（后端）/ 大驼峰（Vue组件）/ 小写+连字符（页面）

## License

MIT License
