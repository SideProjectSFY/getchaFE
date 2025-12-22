import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/auth/Register.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/goods',
    name: 'Goods',
    component: () => import('../views/goods/GoodsRouter.vue')
  },
  {
    path: '/goods/register',
    name: 'GoodsRegister',
    component: () => import('../views/goods/GoodsRegister.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/goods/edit/:id',
    name: 'GoodsEdit',
    component: () => import('../views/goods/GoodsEdit.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/mypage',
    name: 'MyPage',
    component: () => import('../views/mypage/MyPage.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/mypage/wishlist'
      },
      {
        path: 'wishlist',
        name: 'Wishlist',
        component: () => import('../views/mypage/Wishlist.vue')
      },
      {
        path: 'registered',
        name: 'RegisteredAuctions',
        component: () => import('../views/mypage/RegisteredAuctions.vue')
      },
      {
        path: 'participated',
        name: 'ParticipatedAuctions',
        component: () => import('../views/mypage/ParticipatedAuctions.vue')
      },
      {
        path: 'transactions',
        name: 'Transactions',
        component: () => import('../views/mypage/Transactions.vue')
      },
      {
        path: 'wallet',
        name: 'Wallet',
        component: () => import('../views/mypage/Wallet.vue')
      },
      {
        path: 'favorites',
        name: 'FavoriteAnimes',
        component: () => import('../views/mypage/FavoriteAnimes.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/mypage/Profile.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // 이전 위치를 그대로 유지하도록 설정
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return false
  }
})

let authChecked = false

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  // Pinia에서 로그인 정보 없을때 localStoreage에서 토큰 값 가져오기
  const hasToken = !!(authStore.token || localStorage.getItem('token'))

  // 새로고침 후 토큰만 남아 있고 user가 비어 있을 때 복구
  if (!authChecked && hasToken && !authStore.user) {
    authChecked = true
    await authStore.checkAuth()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router

