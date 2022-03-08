import Vue from 'vue'
import router from '../router'
import App from './App.vue'
import { Row, Col, Form, FormItem, Input, Button } from 'element-ui'

Vue.use(Row)
Vue.use(Col)
Vue.use(Form)
Vue.use(FormItem)
Vue.use(Input)
Vue.use(Button)
/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  render: h => h(App)
})
