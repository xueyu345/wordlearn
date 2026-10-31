/* 学习进度仪表盘：全部数据由 store.dashboardSnapshot() 算好，WXML 只负责摆 */
const store = require('../../utils/store.js')
const U = require('../../utils/util.js')

const GRADE_NAMES = store.GRADES.map(function (g) { return U.gradeLabel(g); })

// 柱状图最高柱高度（rpx）
const BAR_MAX = 120

Page({
  data: {
    gradeNames: GRADE_NAMES,
    gradeIndex: 2,

    scopeNote: '',
    quickEnDesc: '',
    quickMathDesc: '',

    ringRight: '',
    ringLeft: '',
    todayWords: 0,
    goal: 10,
    goalTitle: '',
    goalHint: '',
    metaPills: [],

    stats: [],
    trendNote: '',
    trend: [],
    units: [],
    unitsEmpty: true,
    math: { total: 0, done: 0, todo: 0, percent: 0 },
    mathKps: [],
    mathEmpty: true,
    weak: [],
    weakEmpty: true,
    badges: []
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
    const snap = store.dashboardSnapshot()
    const grade = store.getGrade()
    const enMeta = store.enBookMeta(store.getEnBook())
    const enName = (enMeta && enMeta.name) || '全国通用版'
    const mathMeta = store.mathBookMeta(store.getMathBook())
    const mathName = (mathMeta && mathMeta.name) || '全国通用版'

    // 环形进度：右半负责 0~50%，左半负责 50~100%
    const percent = Math.max(0, Math.min(100, snap.todayPercent))
    const deg = percent * 3.6 - 180
    const rightDeg = percent <= 50 ? deg : 0
    const leftDeg = percent > 50 ? deg : 0

    const trend = snap.trend.map(function (day, index) {
      const height = Math.max(6, Math.round((day.height / 100) * BAR_MAX))
      const showLabel = (index % 2 === 1 || index === snap.trend.length - 1)
      return {
        key: day.key,
        label: showLabel ? day.label : '',
        countText: day.count > 0 ? String(day.count) : '',
        count: day.count,
        today: day.today,
        barStyle: 'height:' + height + 'rpx;background:' + (day.today ? '#FF8A3D' : '#C9BDF6')
      }
    })

    const units = snap.units.map(function (unit) {
      return {
        id: unit.id,
        name: unit.name,
        emoji: unit.emoji,
        learned: unit.learned,
        total: unit.total,
        percent: unit.percent,
        ratioText: unit.learned + '/' + unit.total,
        barStyle: 'width:' + unit.percent + '%;background:' + unit.color
      }
    })

    const mathKps = snap.math.kps.map(function (row) {
      return {
        kp: row.kp,
        done: row.done,
        total: row.total,
        ratioText: row.done + '/' + row.total,
        barStyle: 'width:' + row.percent + '%;background:#27B8A8'
      }
    })

    const weak = snap.weak.map(function (item) {
      return {
        id: item.id,
        w: item.w,
        zh: item.zh,
        wrongText: '错 ' + item.wrong + ' 次'
      }
    })

    this.setData({
      gradeIndex: Math.max(0, store.GRADES.indexOf(grade)),
      scopeNote: U.gradeLabel(grade) + ' · 英语 ' + enName + ' · 数学 ' + mathName,
      quickEnDesc: U.gradeLabel(grade) + ' · ' + enName + ' · ' + store.units().length
        + ' 个主题、' + store.totalWords() + ' 个单词',
      quickMathDesc: '已记 ' + store.mathState().items.length + ' 道错题 · 解题挑战 + 抽题复习',

      ringRight: 'transform:rotate(' + rightDeg + 'deg)',
      ringLeft: 'transform:rotate(' + leftDeg + 'deg)',
      todayWords: snap.todayWords,
      goal: snap.goal,
      goalTitle: snap.todayPercent >= 100
        ? '今日目标已完成'
        : (snap.todayWords > 0 ? '今天学了 ' + snap.todayWords + ' 个单词' : '今天还没开始'),
      goalHint: snap.todayPercent >= 100
        ? '太棒了，奖励星星已经到手，想加练可以再去闯一关。'
        : '再学 ' + snap.restWords + ' 个单词就能拿到今日奖励星星。',
      metaPills: [
        '连续打卡 ' + snap.streak + ' 天',
        '累计 ' + snap.stars + ' 颗星',
        '错词本 ' + snap.wrongCount + ' 个'
      ],

      stats: [
        { value: String(snap.streak), unit: '天', label: '连续打卡', sub: snap.streak > 0 ? '保持住' : '今天开个头' },
        { value: String(snap.stars), unit: '颗', label: '累计星星', sub: snap.stars > 0 ? '继续攒' : '学了就有' },
        { value: snap.learned + '/' + snap.totalWords, unit: '', label: '认识单词', sub: '掌握 ' + snap.mastery + '%' },
        { value: String(snap.wrongCount), unit: '个', label: '错词本', sub: snap.wrongCount > 0 ? '该复习了' : '很干净' }
      ],
      trendNote: '最近 14 天共学 ' + snap.totalRecent + ' 个单词，' + snap.activeDays
        + ' 天有学习记录，单日最多 ' + snap.bestDay + ' 个。',
      trend: trend,
      units: units,
      unitsEmpty: units.length === 0,
      math: snap.math,
      mathKps: mathKps,
      mathEmpty: snap.math.total === 0,
      weak: weak,
      weakEmpty: weak.length === 0,
      badges: snap.badges.map(function (badge) {
        return { icon: badge.icon, name: badge.name, progress: badge.progress, got: badge.got }
      })
    })
  },

  onGradeChange(e) {
    const index = Number(e.detail.value)
    const grade = store.GRADES[index]
    if (!grade) return
    store.setGrade(grade)
    this.refresh()
  },

  goEnglish() {
    wx.switchTab({ url: '/pages/english/english' })
  },

  goMath() {
    wx.switchTab({ url: '/pages/math/math' })
  },

  goSolve() {
    wx.navigateTo({ url: '/pages/mathSolve/mathSolve' })
  },

  goWrong() {
    wx.navigateTo({ url: '/pages/wrong/wrong' })
  }
})
