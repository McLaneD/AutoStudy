<template>
  <div class="main_app">
    <el-form
      ref="form"
      :model="form"
      :rules="rules"
      label-width="70px"
      size="medium"
    >
      <el-row>
        <el-col :span="24">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" show-password />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="13">
          <el-form-item label="验证码" prop="captcha">
            <el-input v-model="form.captcha" />
          </el-form-item>
        </el-col>
        <el-col :span="11" class="code-box">
          <img
            :src="form.captchaImgSrc"
            width="110px"
            height="37px"
            @click="nextCaptcha()"
            style="margin-left: 10px"
          />
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item>
            <el-button ref="login" type="primary" @click="login()"
              >登录</el-button
            >
            <el-button type="info" @click="cancel()">取消</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script>
import { v4 as uuidv4 } from 'uuid'
import JSEncrypt from 'jsencrypt'
import axios from 'axios'

export default {
  name: 'App',
  data () {
    return {
      captchaImgOrigin: 'https://www.hzzhdj.cn/hzdj-party-admin//index/getCaptch?loginName=',
      publicKey: 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCMI7H1yCTrBSoPpJSBjxbdnL+y++YJ33eAb8zMVfOweAmg50wlI01DJR+bWY48NV+rlM/LSJfJhduN6q84zXZ0Lku9v9cv9zlM+I12cH5hZVdvH12WmoTaDtz9ICRrAabsP2InJTviM9kR59IhgbzMl8sife8tic5xLpPK229XvQIDAQAB',
      form: {
        username: '',
        password: '',
        captcha: '',
        captchaImgSrc: ''
      },
      rules: {
        username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
        captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
      }
    }
  },
  mounted () {
    this.form.captchaImgSrc = this.captchaImgOrigin
  },
  methods: {
    login () {
      const encryptor = new JSEncrypt()
      encryptor.setPublicKey(this.publicKey)
      const password = encryptor.encrypt('123')
      console.log(password)
      console.log(axios)
      // this.$router.replace('Options')
      chrome.tabs.create({ url: 'chrome-extension://' + chrome.runtime.id + '/options.html' })
    },
    cancel () {
      window.close()
    },
    nextCaptcha () {
      this.form.captchaImgSrc = this.captchaImgOrigin + this.form.username + '&uuid=' + uuidv4()
    }
  }
}
</script>

<style>
html {
  width: 280px;
  height: 285px;
}
</style>
