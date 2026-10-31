/* 登录页：微信一键登录 / 手机号验证码 / 邮箱验证码 / WorkBuddy 登录
   登录态一律由 SDK 会话决定，本页不写任何假的登录标记 */
const store = require('../../utils/store.js')
const U = require('../../utils/util.js')
const { cloud } = require('../../utils/cloud.js')

const PHONE_RE = /^1\d{10}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const RESEND_SECONDS = 60

const VIA_TEXT = {
  wechat: '微信登录',
  workbuddy: 'WorkBuddy 登录',
  phone: '手机号登录',
  email: '邮箱登录'
}

// 只记 stage 和 message：code / session / 错误对象原文一律不进日志
function logFailure(stage, error) {
  const raw = (error && (error.message || error.error_description)) || (error && error.errMsg)
  const message = typeof raw === 'string' ? raw.slice(0, 200) : 'unknown'
  console.error('[Auth] login failed', JSON.stringify({ stage: stage, message: message }))
}

function errorText(error, fallback) {
  const message = error && (error.message || error.error_description)
  if (!message) return fallback || '操作失败，请稍后重试'
  if (/network|fetch|Failed to fetch|超时|timeout/i.test(message)) return '网络好像不太顺畅，检查一下连接再试'
  if (/rate|too many|429|频繁/i.test(message)) return '操作太频繁啦，等一会儿再试'
  return String(message).slice(0, 100)
}

function wxLogin() {
  return new Promise(function (resolve, reject) {
    wx.login({ success: resolve, fail: reject })
  })
}

function identifierOf(user) {
  if (!user) return ''
  return user.email || user.phone || user.name || user.id || ''
}

Page({
  data: {
    logged: false,
    accountName: '',
    accountDesc: '',

    channel: 'phone',
    isPhone: true,
    phone: '',
    email: '',
    code: '',
    phoneError: '',
    emailError: '',
    codeError: '',

    msgType: '',
    msgText: '',

    busy: false,
    sending: false,
    countdown: 0,
    sent: false
  },

  onLoad() {
    this.syncAccount()
  },

  async onShow() {
    // WorkBuddy 授权跳转回来时，App.onShow 里已经把 code 换成会话了
    const app = getApp()
    if (app && app.authReady) {
      try { await app.authReady; } catch (e) { /* 按普通启动继续 */ }
    }
    try { await store.refreshSession(); } catch (e) { /* 保持未登录 */ }
    this.syncAccount()

    if (this._awaitWorkBuddy) {
      this._awaitWorkBuddy = false
      const user = store.getAuthUser()
      if (user) {
        this.afterSignedIn()
      } else {
        this.setError('WorkBuddy 授权没有完成，可以再试一次')
      }
    }
  },

  onUnload() {
    this.stopCountdown()
  },

  syncAccount() {
    const user = store.getAuthUser()
    if (!user) {
      this.setData({ logged: false, accountName: '', accountDesc: '' })
      return
    }
    const name = identifierOf(user)
    this.setData({
      logged: true,
      accountName: name || '已登录',
      accountDesc: (VIA_TEXT[user.provider] || '已登录') + ' · ' + store.getSyncText()
    })
  },

  setError(text) {
    this.setData({ msgType: 'error', msgText: text })
  },

  setOk(text) {
    this.setData({ msgType: 'ok', msgText: text })
  },

  /* ---------- 输入 ---------- */
  onChannelSwitch(e) {
    const channel = e.currentTarget.dataset.channel
    if (!channel || channel === this.data.channel) return
    this._pending = null
    this.setData({
      channel: channel,
      isPhone: channel === 'phone',
      phoneError: '', emailError: '', codeError: '',
      msgType: '', msgText: '', sent: false
    })
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value, phoneError: '' })
  },

  onEmailInput(e) {
    this.setData({ email: e.detail.value, emailError: '' })
  },

  onCodeInput(e) {
    this.setData({ code: e.detail.value, codeError: '' })
  },

  currentIdentifier() {
    if (this.data.channel === 'phone') {
      // 用户输什么就发什么，不在这层补 +86
      return { kind: 'phone', value: String(this.data.phone || '').replace(/[\s-]/g, ''), label: '手机号' }
    }
    return { kind: 'email', value: String(this.data.email || '').trim().toLowerCase(), label: '邮箱' }
  },

  validateIdentifier(id) {
    if (id.kind === 'phone') {
      if (PHONE_RE.test(id.value)) {
        if (this.data.phoneError) this.setData({ phoneError: '' })
        return true
      }
      this.setData({ phoneError: '请输入正确的 11 位手机号', msgType: '', msgText: '' })
      return false
    }
    if (EMAIL_RE.test(id.value)) {
      if (this.data.emailError) this.setData({ emailError: '' })
      return true
    }
    this.setData({ emailError: '请输入正确的邮箱地址', msgType: '', msgText: '' })
    return false
  },

  /* ---------- 验证码 ---------- */
  async onSendCode() {
    if (this.data.busy || this.data.sending || this.data.countdown > 0) return
    const id = this.currentIdentifier()
    if (!this.validateIdentifier(id)) return

    this.setData({ sending: true, msgType: '', msgText: '' })
    try {
      const res = await cloud.auth.sendOtp(id.kind === 'phone' ? { phone: id.value } : { email: id.value })
      if (res.error) {
        logFailure('sendOtp', res.error)
        this.setError(errorText(res.error, '验证码没发出去，稍后再试'))
        return
      }
      this._pending = {
        kind: id.kind,
        value: id.value,
        verificationId: res.data.verificationId,
        isExistingUser: res.data.isExistingUser
      }
      this.setData({ sent: true, codeError: '' })
      this.setOk(id.kind === 'phone' ? '验证码已发送，注意查收短信' : '验证码已发送，请查收邮箱（含垃圾箱）')
      this.startCountdown(RESEND_SECONDS)
    } catch (e) {
      logFailure('sendOtp', e)
      this.setError('验证码没发出去，检查一下网络再试')
    } finally {
      this.setData({ sending: false })
    }
  },

  async onSubmit() {
    if (this.data.busy) return
    const id = this.currentIdentifier()
    if (!this.validateIdentifier(id)) return

    const pending = this._pending
    if (!pending || pending.kind !== id.kind || pending.value !== id.value) {
      this.setError('请先点「获取验证码」，验证这个' + id.label)
      return
    }
    const token = String(this.data.code || '').trim()
    if (!token) {
      this.setData({ codeError: '请输入收到的验证码' })
      return
    }

    this.setData({ busy: true, codeError: '', msgType: '', msgText: '' })
    try {
      const params = {
        verificationId: pending.verificationId,
        isExistingUser: pending.isExistingUser,
        token: token
      }
      if (id.kind === 'phone') params.phone = id.value
      else params.email = id.value

      const res = await cloud.auth.verifyOtp(params)
      if (res.error) {
        logFailure('verifyOtp', res.error)
        this.setError(errorText(res.error, '验证码不对或已过期'))
        return
      }
      await this.afterSignedIn()
    } catch (e) {
      logFailure('verifyOtp', e)
      this.setError('登录失败，请稍后再试')
    } finally {
      this.setData({ busy: false })
    }
  },

  /* ---------- 微信一键登录 ---------- */
  async onWechatLogin() {
    if (this.data.busy) return
    this.setData({ busy: true, msgType: '', msgText: '' })
    try {
      let appId = ''
      try { appId = wx.getAccountInfoSync().miniProgram.appId; } catch (e) { appId = '' }
      const loginRes = await wxLogin()
      const code = loginRes && loginRes.code
      if (!code) {
        logFailure('wx.login', { message: 'no code' })
        this.setError('微信登录没成功，请稍后再试')
        return
      }
      const res = await cloud.auth.signInWithWechat(code, appId)
      if (res.error) {
        logFailure('signInWithWechat', res.error)
        this.setError(errorText(res.error, '微信登录没成功，请稍后再试'))
        return
      }
      await this.afterSignedIn()
    } catch (e) {
      logFailure('signInWithWechat', e)
      this.setError('微信登录没成功，请稍后再试')
    } finally {
      this.setData({ busy: false })
    }
  },

  /* ---------- WorkBuddy 登录 ---------- */
  async onWorkBuddyLogin() {
    if (this.data.busy) return
    if (typeof cloud.auth.signInWithWorkBuddyMiniProgram !== 'function') {
      this.setError('当前 SDK 版本不支持 WorkBuddy 登录，请换一种方式')
      return
    }
    this.setData({ busy: true, msgType: '', msgText: '' })
    try {
      const res = await cloud.auth.signInWithWorkBuddyMiniProgram({ redirectPath: 'pages/account/account' })
      if (res.error) {
        logFailure('signInWithWorkBuddyMiniProgram', res.error)
        this.setError(errorText(res.error, 'WorkBuddy 登录没成功，请稍后再试'))
        return
      }
      // 到这里只是「发起跳转」，真正的登录结果由 App.onShow 里的回调处理
      this._awaitWorkBuddy = true
      U.toast('正在跳转 WorkBuddy 授权…')
    } catch (e) {
      logFailure('signInWithWorkBuddyMiniProgram', e)
      this.setError('WorkBuddy 登录没成功，请稍后再试')
    } finally {
      this.setData({ busy: false })
    }
  },

  /* ---------- 登录成功后：刷会话 + 双向合并 ---------- */
  async afterSignedIn() {
    try { await store.refreshSession(); } catch (e) { /* 下面按未登录处理 */ }
    const user = store.getAuthUser()
    if (!user) {
      this.setError('登录没成功，请再试一次')
      return
    }
    this.stopCountdown()
    wx.showLoading({ title: '同步中…', mask: true })
    let merged = false
    try {
      await store.pullAndMerge()
      merged = true
    } catch (e) {
      // 合并失败不拦着用户，记录停留在本地，下次进「我的」还能再同步
      logFailure('pullAndMerge', e)
    }
    wx.hideLoading()
    this._pending = null
    this.syncAccount()
    U.toast(merged ? '登录成功，进度已合并' : '登录成功，同步稍后再试')
    this.finish()
  },

  finish() {
    const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({ url: '/pages/dashboard/dashboard' })
    }
  },

  /* ---------- 退出登录 ---------- */
  onSignOut() {
    wx.showModal({
      title: '退出登录',
      content: '退出后本机学习档案会清空，云端备份不会丢，重新登录即可拉回。',
      confirmText: '退出登录',
      confirmColor: '#EF5B65',
      success: (res) => {
        if (!res.confirm) return
        wx.showLoading({ title: '正在退出…', mask: true })
        store.signOut().then(() => {
          wx.hideLoading()
          U.toast('已退出登录')
          this._pending = null
          this.setData({ sent: false, code: '', msgType: '', msgText: '' })
          this.syncAccount()
        }).catch(() => {
          wx.hideLoading()
          this.syncAccount()
        })
      }
    })
  },

  /* ---------- 重发倒计时 ---------- */
  startCountdown(seconds) {
    this.stopCountdown()
    this.setData({ countdown: seconds })
    this._timer = setInterval(() => {
      const left = this.data.countdown - 1
      if (left <= 0) {
        this.stopCountdown()
        this.setData({ countdown: 0 })
        return
      }
      this.setData({ countdown: left })
    }, 1000)
  },

  stopCountdown() {
    if (this._timer) {
      clearInterval(this._timer)
      this._timer = null
    }
  },

  goBack() {
    this.finish()
  }
})
