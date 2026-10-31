const store = require('./utils/store.js')
const { cloud } = require('./utils/cloud.js')

App({
  globalData: {
    // 结算页用的上一轮成绩（内存态，刷新即失效，与原网页一致）
    lastResult: null
  },

  onLaunch() {
    store.init()
    // 登录态变化后刷新各页面顶部展示
    try {
      cloud.auth.onAuthStateChange(() => {
        store.refreshSession()
      })
    } catch (e) { /* SDK 未就绪时忽略 */ }
  },

  onShow(options) {
    // 原生 WorkBuddy 授权会把结果带回 App.onShow，必须在任何登录守卫之前处理
    this.authReady = (async () => {
      try {
        const callback = await cloud.auth.handleWorkBuddyMiniProgramCallback(options)
        if (callback && callback.error) return callback
      } catch (e) {
        // 非 WorkBuddy 回调或 SDK 未暴露该方法时，按普通启动继续
      }
      return cloud.auth.getSession()
    })()
  }
})
