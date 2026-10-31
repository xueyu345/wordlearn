/* 我的：账号与同步 + 学习偏好 + 年级教材 + 数据与备份 + 关于 */
const store = require('../../utils/store.js')
const U = require('../../utils/util.js')

const GRADE_NAMES = store.GRADES.map(function (g) { return U.gradeLabel(g); })
const GOAL_CHOICES = store.GOAL_CHOICES
const ROUND_CHOICES = store.ROUND_CHOICES
const GOAL_NAMES = GOAL_CHOICES.map(function (n) { return n + ' 个单词'; })
const ROUND_NAMES = ROUND_CHOICES.map(function (n) { return n + ' 题'; })

const VIA_TEXT = {
  wechat: '微信登录',
  workbuddy: 'WorkBuddy 登录',
  phone: '手机号登录',
  email: '邮箱登录'
}

function identifierOf(user) {
  if (!user) return ''
  return user.email || user.phone || user.name || user.id || ''
}

Page({
  data: {
    // 账号与同步
    logged: false,
    avatarText: '👤',
    accountName: '还没登录',
    accountDesc: '现在记录只存在这台设备上。登录后自动同步到云端，换设备也能接着学。',
    syncBadge: '仅本机',
    syncBusy: false,

    // 学习偏好
    goalNames: GOAL_NAMES,
    goalIndex: 1,
    roundNames: ROUND_NAMES,
    roundIndex: 1,
    sound: true,
    strictCase: false,

    // 年级与教材
    gradeNames: GRADE_NAMES,
    gradeIndex: 2,
    enBookNames: [],
    enBookIndex: 0,
    enBookNote: '',
    mathBookNames: [],
    mathBookIndex: 0,
    mathBookNote: '',

    // 数据与备份
    dataSummary: '',
    noteText: '',

    // 关于
    version: 'v' + store.APP_VERSION,
    profileText: '',
    cloudStateText: '仅本机'
  },

  onLoad() {
    this._onStoreChange = this.refresh.bind(this)
    store.onChange(this._onStoreChange)
    this.refresh()
  },

  onShow() {
    this.refresh()
  },

  onUnload() {
    store.offChange(this._onStoreChange)
  },

  refresh() {
    const user = store.getAuthUser()
    const syncState = store.getSyncState()
    const syncText = store.getSyncText()
    const grade = store.getGrade()
    const prefs = store.prefs()

    const enBookId = store.getEnBook()
    const enBooks = store.enBooksForGrade(grade)
    const enNames = enBooks.map(function (book) {
      return book.name + '（' + store.unitCountOfBook(book.id, grade) + ' 单元）';
    })
    const enIndex = Math.max(0, enBooks.findIndex(function (b) { return b.id === enBookId; }))

    const mathBooks = store.MATH_BOOKS
    const mathNames = mathBooks.map(function (book) { return book.name; })
    const mathBookId = store.getMathBook()
    const mathIndex = Math.max(0, mathBooks.findIndex(function (b) { return b.id === mathBookId; }))

    const enMeta = store.enBookMeta(enBookId)
    const mathMeta = store.mathBookMeta(mathBookId)
    const stats = store.localDataStats()

    const next = {
      logged: !!user,
      syncBusy: syncState === 'busy',
      syncBadge: user ? (syncState === 'error' ? '同步失败' : '已同步') : '仅本机',
      goalIndex: Math.max(0, GOAL_CHOICES.indexOf(prefs.dailyGoal)),
      roundIndex: Math.max(0, ROUND_CHOICES.indexOf(prefs.roundSize)),
      sound: prefs.sound,
      strictCase: prefs.strictCase,
      gradeIndex: Math.max(0, store.GRADES.indexOf(grade)),
      enBookNames: enNames,
      enBookIndex: enIndex,
      enBookNote: (enMeta && enMeta.note) || '',
      mathBookNames: mathNames,
      mathBookIndex: mathIndex,
      mathBookNote: (mathMeta && mathMeta.note) || '',
      dataSummary: '本机学习记录约占 ' + stats.text + '（不含错题图片' + (stats.images ? '，另有 ' + stats.images + ' 张图' : '') + '）。',
      profileText: U.gradeLabel(grade) + ' · 英语 ' + ((enMeta && enMeta.name) || '全国通用版')
        + ' · 数学 ' + ((mathMeta && mathMeta.name) || '全国通用版'),
      cloudStateText: user ? '本机 + 云端' : '仅本机'
    }

    if (user) {
      const name = identifierOf(user)
      next.avatarText = String(name || '🙂').trim().charAt(0).toUpperCase() || '🙂'
      next.accountName = name || '已登录'
      next.accountDesc = (VIA_TEXT[user.provider] || '已登录') + ' · ' + (syncState === 'busy' ? '正在同步…' : syncText)
    } else {
      next.avatarText = '👤'
      next.accountName = '还没登录'
      next.accountDesc = '现在记录只存在这台设备上。登录后自动同步到云端，换设备也能接着学。'
    }

    this.setData(next)
  },

  /* ---------- 账号与同步 ---------- */
  goLogin() {
    wx.navigateTo({ url: '/pages/account/account' })
  },

  goPaper() {
    wx.navigateTo({ url: '/pages/paper/paper' })
  },

  async onSyncNow() {
    const user = store.getAuthUser()
    if (!user) {
      U.toast('登录后才能同步')
      return
    }
    wx.showLoading({ title: '同步中…', mask: true })
    try {
      await store.pushLocal()
      const state = store.getSyncState()
      U.toast(state === 'error' ? '同步失败，可重试' : '已同步')
    } catch (e) {
      U.toast('同步失败，可重试')
    }
    wx.hideLoading()
    this.refresh()
  },

  onSignOut() {
    wx.showModal({
      title: '退出登录',
      content: '退出后本机学习档案会清空，避免下一个人看到你的进度；云端备份不会丢，重新登录即可拉回。',
      confirmText: '退出登录',
      confirmColor: '#EF5B65',
      success: (res) => {
        if (!res.confirm) return
        wx.showLoading({ title: '正在退出…', mask: true })
        store.signOut().then(() => {
          wx.hideLoading()
          U.toast('已退出登录')
          this.refresh()
        }).catch(() => {
          wx.hideLoading()
          this.refresh()
        })
      }
    })
  },

  /* ---------- 学习偏好 ---------- */
  onGoalChange(e) {
    const value = GOAL_CHOICES[Number(e.detail.value)]
    if (!value) return
    store.setPref('dailyGoal', value)
    this.refresh()
  },

  onRoundChange(e) {
    const value = ROUND_CHOICES[Number(e.detail.value)]
    if (!value) return
    store.setPref('roundSize', value)
    this.refresh()
  },

  onSoundChange(e) {
    store.setPref('sound', !!e.detail.value)
    this.refresh()
  },

  onStrictCaseChange(e) {
    store.setPref('strictCase', !!e.detail.value)
    this.refresh()
  },

  /* ---------- 年级与教材 ---------- */
  onGradeChange(e) {
    const grade = store.GRADES[Number(e.detail.value)]
    if (!grade) return
    store.setGrade(grade)
    this.refresh()
  },

  onEnBookChange(e) {
    const books = store.enBooksForGrade(store.getGrade())
    const book = books[Number(e.detail.value)]
    if (!book) return
    store.setEnBook(book.id)
    this.refresh()
  },

  onMathBookChange(e) {
    const book = store.MATH_BOOKS[Number(e.detail.value)]
    if (!book) return
    store.setMathBook(book.id)
    this.refresh()
  },

  /* ---------- 数据与备份 ---------- */
  onExport() {
    const payload = store.backupPayload()
    const keys = Object.keys(payload.profiles).filter(function (k) { return !!payload.profiles[k]; })
    if (keys.length === 0) {
      U.toast('本机还没有学习记录可以导出')
      return
    }
    let text = ''
    try {
      text = JSON.stringify(payload)
    } catch (e) {
      U.toast('导出失败：数据读取出错')
      return
    }
    const stamp = U.dateKey().replace(/-/g, '')
    const filePath = wx.env.USER_DATA_PATH + '/studyhub-backup-' + stamp + '.json'
    wx.showLoading({ title: '正在导出…', mask: true })
    wx.getFileSystemManager().writeFile({
      filePath: filePath,
      data: text,
      encoding: 'utf8',
      success: () => {
        wx.hideLoading()
        this.shareBackupFile(filePath, text, keys.length)
      },
      fail: () => {
        wx.hideLoading()
        U.toast('导出失败，存储空间可能不够了')
      }
    })
  },

  // 小程序没有「下载到手机」，用转发文件的形式把备份交给用户（发给自己 / 存到聊天）
  shareBackupFile(filePath, text, count) {
    if (typeof wx.shareFileMessage !== 'function') {
      this.copyBackup(text, count)
      return
    }
    wx.shareFileMessage({
      filePath: filePath,
      success: () => {
        U.toast('已导出 ' + count + ' 份档案')
        this.setData({ noteText: '上次导出：' + U.dateKey() + '（' + count + ' 份档案，已生成备份文件）' })
      },
      fail: (err) => {
        const msg = String((err && err.errMsg) || '')
        if (msg.indexOf('cancel') >= 0) {
          U.toast('已取消，可重新导出')
          return
        }
        this.copyBackup(text, count)
      }
    })
  },

  // 兜底：备份不大时直接复制文本，用户可以自己粘贴到记事本保存
  copyBackup(text, count) {
    if (text.length > 20000) {
      U.toast('备份太大，请先减少错题图片再导出')
      return
    }
    wx.setClipboardData({
      data: text,
      success: () => {
        U.toast('已复制 ' + count + ' 份档案')
        this.setData({ noteText: '上次导出：' + U.dateKey() + '（' + count + ' 份档案，已复制到剪贴板）' })
      },
      fail: () => { U.toast('导出失败，请稍后再试') }
    })
  },

  onImport() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['json', 'txt'],
      success: (res) => {
        const file = (res.tempFiles && res.tempFiles[0]) || null
        if (!file) return
        let text = ''
        try {
          text = wx.getFileSystemManager().readFileSync(file.path, 'utf8')
        } catch (e) {
          U.toast('文件读不出来，换一个备份文件试试')
          return
        }
        let payload = null
        try {
          payload = JSON.parse(text)
        } catch (e) {
          U.toast('这不是有效的备份文件')
          return
        }
        if (!payload || payload.version !== 2 || !payload.profiles) {
          U.toast('这不是学习通的备份文件')
          return
        }
        const keys = Object.keys(payload.profiles).filter(function (k) { return !!payload.profiles[k]; })
        if (keys.length === 0) {
          U.toast('备份文件是空的')
          return
        }
        const when = payload.exportedAt ? String(payload.exportedAt).replace('T', ' ').slice(0, 16) : '未知时间'
        wx.showModal({
          title: '导入备份',
          content: '要用这份备份覆盖本机数据吗？\n\n导出于：' + when + '\n档案数量：' + keys.length
            + '\n\n本机现有记录会被覆盖（建议先导出一次当前数据）。',
          confirmText: '覆盖导入',
          confirmColor: '#EF5B65',
          success: (r) => {
            if (!r.confirm) return
            try {
              store.restorePayload(payload)
            } catch (err) {
              U.toast('导入失败：' + ((err && err.message) || '备份格式不对'))
              return
            }
            this.refresh()
            this.setData({ noteText: '已导入 ' + keys.length + ' 份档案（备份时间：' + when + '）。' })
            U.toast('导入完成，进度已恢复')
          }
        })
      },
      fail: () => { /* 用户取消选择 */ }
    })
  },

  onWipe() {
    const stats = store.localDataStats()
    wx.showModal({
      title: '清空本机数据',
      content: '会删除本机全部英语学习记录和数学错题（含图片），约占 ' + stats.text
        + '。清空后无法恢复，建议先导出一次备份。确定继续吗？',
      confirmText: '下一步',
      confirmColor: '#EF5B65',
      success: (res) => {
        if (!res.confirm) return
        wx.showModal({
          title: '真的确定吗？',
          content: '这一步不能撤销。确定要清空本机学习数据吗？',
          confirmText: '确认清空',
          confirmColor: '#EF5B65',
          success: (r2) => {
            if (!r2.confirm) return
            try {
              store.wipeLocalData()
            } catch (e) {
              U.toast('清空失败，请稍后再试')
              return
            }
            this.refresh()
            this.setData({ noteText: '已清空于 ' + U.dateKey() + '。' })
            U.toast('本机学习数据已清空')
          }
        })
      }
    })
  }
})
