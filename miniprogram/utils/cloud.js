/* 云服务客户端：全工程唯一实例，Auth / Database 共用 */
const { createMiniProgramWorkBuddyCloud } = require('@tencent-ai/workbuddy-cloud-sdk/miniprogram')
const { createDiagnosticWx } = require('./workbuddy-cloud-diagnostics')

// publicConfig 由 workbuddy_cloud_service 激活时下发，endpoint 必填（小程序没有同源回退）
const publicConfig = {
  endpoint: 'https://mp-api.app.workbuddy.host',
  publishableKey: 'wbpk_1d3qGfRWMu1sNovi8V501X_CPd4Q0f3l5CRtqSnfohnEPP6XX8H8p36',
  workBuddyOAuthClientId: 'cb_jq6QyEPkOkJXPcpz0JxS_wbapp_1d3qGfRWMu1sNovi8V501X'
}

const cloud = createMiniProgramWorkBuddyCloud({
  endpoint: publicConfig.endpoint,
  publishableKey: publicConfig.publishableKey,
  workBuddyOAuthClientId: publicConfig.workBuddyOAuthClientId,
  wx: createDiagnosticWx(wx)
})

const CLOUD_TABLE = 'study_progress'

module.exports = { cloud, publicConfig, CLOUD_TABLE }
