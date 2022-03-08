<template>
  <div class="main_app">
    <el-button type="danger" @click="msg()">123</el-button>
    <hello-world />
  </div>
</template>

<script>
import HelloWorld from '@/components/HelloWorld.vue'

export default {
  name: 'App',
  components: { HelloWorld },
  methods: {
    msg () {
      this.$msgbox.alert('确认继续操作?', '标题', {
        confirmButtonText: '确认',
        closeOnPressEscape: true,
        callback: action => {
          console.log(action)
          this.$router.replace({ path: '/popup.html' })
        }
      })
    }
  }
}
</script>

<style>
html {
  width: 400px;
  height: 400px;
}
</style>
