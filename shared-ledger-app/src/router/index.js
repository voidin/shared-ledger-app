import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import { getToken } from '../utils/storage'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/login/index.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    name: 'Index',
    component: () => import('../pages/index/index.vue'),
    meta: { title: '首页', requiresAuth: true, tabbar: true }
  },
  {
    path: '/ledger/create',
    name: 'CreateLedger',
    component: () => import('../pages/ledger/create.vue'),
    meta: { title: '创建账本', requiresAuth: true }
  },
  {
    path: '/ledger/join',
    name: 'JoinLedger',
    component: () => import('../pages/ledger/join.vue'),
    meta: { title: '加入账本', requiresAuth: true }
  },
  {
    path: '/ledger/detail/:id',
    name: 'LedgerDetail',
    component: () => import('../pages/ledger/detail.vue'),
    meta: { title: '账本详情', requiresAuth: true }
  },
  {
    path: '/ledger/lock/:id',
    name: 'LedgerLock',
    component: () => import('../pages/ledger/lock.vue'),
    meta: { title: '账本锁定', requiresAuth: true }
  },
  {
    path: '/ledger/:id/settings',
    name: 'LedgerSettings',
    component: () => import('../pages/ledger/settings.vue'),
    meta: { title: '账本设置', requiresAuth: true }
  },
  {
    path: '/ledger/:id/members',
    name: 'LedgerMembers',
    component: () => import('../pages/ledger/members.vue'),
    meta: { title: '成员管理', requiresAuth: true }
  },
  {
    path: '/transaction/add',
    name: 'TransactionAdd',
    component: () => import('../pages/transaction/add.vue'),
    meta: { title: '记一笔', requiresAuth: true }
  },
  {
    path: '/transaction/edit/:id',
    name: 'TransactionEdit',
    component: () => import('../pages/transaction/add.vue'),
    meta: { title: '编辑账单', requiresAuth: true }
  },
  {
    path: '/transaction/detail/:id',
    name: 'TransactionDetail',
    component: () => import('../pages/transaction/detail.vue'),
    meta: { title: '账单详情', requiresAuth: true }
  },
  {
    path: '/virtual/list',
    name: 'VirtualList',
    component: () => import('../pages/virtual/list.vue'),
    meta: { title: '虚拟成员', requiresAuth: true }
  },
  {
    path: '/virtual/add',
    name: 'VirtualAdd',
    component: () => import('../pages/virtual/edit.vue'),
    meta: { title: '添加虚拟成员', requiresAuth: true }
  },
  {
    path: '/virtual/edit',
    name: 'VirtualEdit',
    component: () => import('../pages/virtual/edit.vue'),
    meta: { title: '编辑虚拟成员', requiresAuth: true }
  },
  {
    path: '/member/permission',
    name: 'MemberPermission',
    component: () => import('../pages/member/permission.vue'),
    meta: { title: '权限设置', requiresAuth: true }
  },
  {
    path: '/category/list',
    name: 'CategoryList',
    component: () => import('../pages/category/list.vue'),
    meta: { title: '分类管理', requiresAuth: true }
  },
  {
    path: '/export',
    name: 'Export',
    component: () => import('../pages/export/index.vue'),
    meta: { title: '数据导出', requiresAuth: true }
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: () => import('../pages/statistics/index.vue'),
    meta: { title: '统计分析', requiresAuth: true }
  },
  {
    path: '/mine',
    name: 'Mine',
    component: () => import('../pages/mine/index.vue'),
    meta: { title: '我的', requiresAuth: true }
  },
  {
    path: '/mine/profile',
    name: 'Profile',
    component: () => import('../pages/mine/profile.vue'),
    meta: { title: '个人资料', requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 共享记账` : '共享记账'
  
  if (to.meta.requiresAuth) {
    const token = getToken()
    if (!token) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    const userStore = useUserStore()
    if (!userStore.userInfo) {
      try {
        await userStore.getUserInfo()
      } catch (error) {
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
        return
      }
    }
  }
  
  next()
})

export default router
