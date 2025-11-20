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
    name: 'GoodsList',
    component: () => import('../views/goods/GoodsList.vue')
  },
  {
    path: '/goods/:id',
    name: 'GoodsDetail',
    component: () => import('../views/goods/GoodsDetail.vue')
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
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router

