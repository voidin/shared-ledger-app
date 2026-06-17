# 共享记账报销小程序 - 完整项目开发规格

## Why
为解决团队/公司报销管理混乱、难以追踪的问题，开发一款支持多人协作的记账报销小程序。用户可创建报销账本，记录支出并标记报销状态，方便统一管理和统计。

## What Changes

### 技术栈选择
- **前端**: Vue3 + Vite + UniApp + Pinia（现代主流框架）
- **后端**: Node.js + Express + MySQL（成熟稳定的技术栈）
- **数据库**: MySQL 8.0
- **文件存储**: 本地存储（MVP阶段）/ 云存储（生产阶段）

### 开发范围
1. 用户模块（登录注册、个人信息）
2. 账本模块（CRUD、邀请码、成员管理）
3. 记账模块（账目录入、报销状态）
4. 虚拟成员模块
5. 权限管理模块
6. 账本锁定模块
7. 分类管理模块
8. 统计报表模块
9. Excel导出模块

## Impact
- 前端：全新创建 `/workspace/shared-ledger-app`
- 后端：全新创建 `/workspace/shared-ledger-api`
- README.md：完善项目文档

---

## ADDED Requirements

### Requirement: 项目初始化与基础架构
项目应包含完整的前后端分离架构：
- 前端：UniApp + Vue3 + Vite + Pinia
- 后端：Node.js + Express + MySQL
- 数据库：9张表（users, ledgers, ledger_members, ledger_permissions, virtual_members, categories, transactions, transaction_images, exports）

#### Scenario: 项目结构完整
- **WHEN** 开发者克隆项目并安装依赖
- **THEN** 能够正常启动前后端服务，数据库初始化脚本可执行

### Requirement: 用户认证系统
系统应支持多种登录方式：
- 手机号+验证码登录
- 微信授权登录（小程序端）
- JWT Token认证

#### Scenario: 用户登录成功
- **WHEN** 用户输入正确的手机号和验证码
- **THEN** 系统返回JWT Token，用户信息存入本地存储，跳转到首页

### Requirement: 账本管理
系统应支持账本的完整生命周期管理：
- 创建个人账本或报销账本
- 生成唯一邀请码
- 支持通过邀请码加入账本
- 成员角色管理（创建者/管理员/普通成员）

#### Scenario: 创建报销账本
- **WHEN** 用户填写账本名称、描述，选择报销账本类型
- **THEN** 系统生成6位邀请码，用户成为创建者

### Requirement: 记账功能
核心记账功能，包括：
- 金额、分类、日期、备注录入
- 收支人选择（真实成员+虚拟成员）
- 报销状态标记（仅报销账本）
- 凭证图片上传（最多6张）

#### Scenario: 添加报销账目
- **WHEN** 用户填写金额、选择分类、选择收支人
- **THEN** 账目录入成功，可在账目列表中查看

### Requirement: 虚拟成员管理
为账本创建虚拟角色，用于记账时的收支人：
- 创建虚拟成员（名称、头像）
- 虚拟成员与真实成员一起显示在收支人列表
- 统计报表中虚拟成员参与统计

#### Scenario: 记账时选择虚拟成员
- **WHEN** 用户记账时打开收支人选择器
- **THEN** 下拉列表同时显示真实成员和虚拟成员

### Requirement: 权限管理系统
精细化的成员权限控制：
- 权限项：添加账目、修改账目、删除账目、修改报销状态、导出报表
- 权限级别：全部 / 仅自己 / 不允许
- 默认权限配置合理

#### Scenario: 普通成员无法删除他人账目
- **WHEN** 普通成员（can_delete=2）尝试删除其他成员的账目
- **THEN** 后端返回403禁止操作

### Requirement: 账本锁定功能
锁定账本后禁止任何修改操作：
- 手动锁定：管理员可随时锁定
- 自动锁定：可配置7天/30天/90天/180天后自动锁定
- 锁定后任何人无法添加/修改/删除账目
- 仅创建者可解锁

#### Scenario: 已锁定账本无法记账
- **WHEN** 用户尝试向已锁定的账本添加账目
- **THEN** 后端返回403，前端显示锁定提示

### Requirement: 统计与导出
完整的统计和导出功能：
- 个人统计：待报销金额、已报销金额、按分类统计
- 团队统计：总支出、各成员报销情况
- Excel导出：支持时间范围和报销状态筛选

---

## MODIFIED Requirements

### Requirement: README文档
README应包含：
- 项目介绍
- 功能特性
- 技术栈
- 项目结构
- 环境要求
- 安装部署
- API接口文档
- 数据库设计

---

## Implementation Notes

### 前端项目结构
```
shared-ledger-app/
├── src/
│   ├── api/              # API接口
│   ├── components/       # 公共组件
│   ├── pages/            # 页面
│   ├── stores/           # Pinia状态
│   ├── utils/            # 工具
│   └── static/           # 静态资源
├── package.json
└── vite.config.js
```

### 后端项目结构
```
shared-ledger-api/
├── src/
│   ├── config/           # 配置
│   ├── controllers/      # 控制器
│   ├── models/           # 数据模型
│   ├── routes/           # 路由
│   ├── middleware/       # 中间件
│   ├── tasks/            # 定时任务
│   └── utils/            # 工具
├── scripts/              # 脚本
├── package.json
└── .env.example
```

### 数据库表（9张）
1. users - 用户表
2. ledgers - 账本表
3. ledger_members - 账本成员关联表
4. ledger_permissions - 成员权限表
5. virtual_members - 虚拟成员表
6. categories - 分类表
7. transactions - 账目表
8. transaction_images - 账目图片关联表
9. exports - 导出记录表
