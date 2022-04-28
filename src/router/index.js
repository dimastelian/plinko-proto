import Vue from 'vue'
import VueRouter from 'vue-router'
import PlinkoView from '../views/PlinkoView.vue'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  base: import.meta.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'plinko',
      component: PlinkoView
    }
  ]
})

export default router
