import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '数据仪表盘', icon: 'DataBoard' } },
  { path: '/input', name: 'InputPanel', component: () => import('@/views/InputPanel.vue'), meta: { title: '作息录入', icon: 'EditPen' } },
  { path: '/calendar', name: 'CalendarView', component: () => import('@/views/CalendarView.vue'), meta: { title: '日历视图', icon: 'Calendar' } },
  { path: '/sleep', name: 'SleepDetail', component: () => import('@/views/SleepDetail.vue'), meta: { title: '睡眠详情', icon: 'Moon' } },
  { path: '/import', name: 'ImportView', component: () => import('@/views/ImportView.vue'), meta: { title: '数据导入', icon: 'Upload' } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
