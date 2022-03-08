import Vue from 'vue'
import router from '../router'
import App from './App.vue'
import { Button, MessageBox } from 'element-ui'
import store from '../store'

Vue.use(Button)
Vue.prototype.$msgbox = MessageBox
/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})
