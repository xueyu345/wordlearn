/* 错题试卷：把数学错题本 + 英语错词本汇总成一张卷子，在线作答并自动判分
 * 路由参数：?from=math / ?from=en 决定默认勾选哪一本
 * 打印 / 存 PDF 只有网页版和桌面版有，这里不做。
 */
const store = require('../../utils/store.js');
const U = require('../../utils/util.js');
const paper = require('../../utils/paper.js');

const SCOPE_OPTIONS = ['待攻克', '全部错题', '已掌握'];
const SCOPE_VALUES = ['todo', 'all', 'done'];
const COUNT_OPTIONS = ['5 道', '10 道', '15 道', '20 道', '全部'];
const COUNT_VALUES = [5, 10, 15, 20, 0];
const MODE_OPTIONS = ['中译英（给中文写单词）', '英译中（给单词写意思）', '两种混合'];
const MODE_VALUES = ['zh2en', 'en2zh', 'mix'];

function click() {
  if (store.prefs().sound) U.vibrate('light');
}

Page({
  data: {
    stage: 'setup',
    title: '',
    mathOn: true,
    enOn: true,
    scopeOptions: SCOPE_OPTIONS,
    scopeIndex: 0,
    kpOptions: [],
    kpIndex: 0,
    countOptions: COUNT_OPTIONS,
    mathCountIndex: 1,
    enCountIndex: 1,
    modeOptions: MODE_OPTIONS,
    modeIndex: 0,
    note: '',
    // 卷子
    paperTitle: '',
    metaText: '',
    totalText: '',
    sections: [],
    graded: false,
    submitText: '✅ 交卷判分',
    hasScore: false,
    scoreJudged: 0,
    scoreRight: 0,
    scoreWrong: 0,
    scoreRate: 0,
    emptyTitle: '',
    emptyText: ''
  },

  onLoad: function (options) {
    const from = (options && options.from) || '';
    this.setData({
      mathOn: from !== 'en',
      enOn: from !== 'math',
      title: paper.defaultTitle()
    });
  },

  onShow: function () {
    if (this.data.stage === 'setup') this.refreshNote();
  },

  refreshNote: function () {
    const kps = [];
    (store.mathState().items || []).forEach(function (item) {
      const name = item.kp || '未分类';
      if (kps.indexOf(name) < 0) kps.push(name);
    });
    const kpOptions = ['全部知识点'].concat(kps);
    const mathCount = paper.mathPool(SCOPE_VALUES[this.data.scopeIndex], this.kpValue()).length;
    const enCount = paper.enPool().length;
    let note = '数学错题本里可以出 ' + mathCount + ' 道，英语错词本里可以出 ' + enCount + ' 道。';
    note += (mathCount || enCount)
      ? '题量选「全部」就是把符合条件的题一次放进来。'
      : '两边都还是空的，先去记几道错题或学几个新单词吧。';
    this.setData({ kpOptions: kpOptions, note: note });
  },

  kpValue: function () {
    const index = this.data.kpIndex;
    const options = this.data.kpOptions || [];
    return index > 0 && options[index] ? options[index] : '';
  },

  onTitle: function (event) {
    this.setData({ title: event.detail.value || '' });
  },

  onToggleMath: function (event) {
    this.setData({ mathOn: Boolean(event.detail.value) });
    click();
  },

  onToggleEn: function (event) {
    this.setData({ enOn: Boolean(event.detail.value) });
    click();
  },

  onScope: function (event) {
    this.setData({ scopeIndex: Number(event.detail.value) || 0 });
    click();
    this.refreshNote();
  },

  onKp: function (event) {
    this.setData({ kpIndex: Number(event.detail.value) || 0 });
    click();
    this.refreshNote();
  },

  onMathCount: function (event) {
    this.setData({ mathCountIndex: Number(event.detail.value) || 0 });
    click();
  },

  onEnCount: function (event) {
    this.setData({ enCountIndex: Number(event.detail.value) || 0 });
    click();
  },

  onMode: function (event) {
    this.setData({ modeIndex: Number(event.detail.value) || 0 });
    click();
  },

  onBuild: function () {
    click();
    const built = paper.build({
      title: this.data.title,
      useMath: this.data.mathOn,
      mathScope: SCOPE_VALUES[this.data.scopeIndex],
      mathKp: this.kpValue(),
      mathCount: COUNT_VALUES[this.data.mathCountIndex],
      useEn: this.data.enOn,
      enMode: MODE_VALUES[this.data.modeIndex],
      enCount: COUNT_VALUES[this.data.enCountIndex]
    });
    if (!built) {
      U.toast('没有可出的题，先去记几道错题或学几个单词吧');
      return;
    }
    this.paperData = built;
    this.render();
  },

  render: function () {
    const built = this.paperData;
    if (!built) return;
    const grade = store.getGrade();
    const mathBook = store.mathBookMeta(store.getMathBook());
    const metaText = U.gradeLabel(grade)
      + ' · 数学 ' + (mathBook.short || mathBook.name)
      + ' · 共 ' + built.total + ' 题';
    const view = paper.toView(built, built.graded);
    this.setData({
      stage: 'sheet',
      paperTitle: built.title,
      metaText: metaText,
      totalText: '共 ' + built.total + ' 题',
      sections: view.sections,
      graded: built.graded,
      submitText: built.graded ? '🔄 再来一份' : '✅ 交卷判分',
      hasScore: built.graded,
      scoreJudged: built.judged,
      scoreRight: built.right,
      scoreWrong: built.wrong,
      scoreRate: built.judged ? Math.round((built.right / built.judged) * 100) : 0
    });
    wx.pageScrollTo({ scrollTop: 0, duration: 0 });
  },

  onAnswer: function (event) {
    const si = Number(event.currentTarget.dataset.si) || 0;
    const qi = Number(event.currentTarget.dataset.qi) || 0;
    const sec = this.paperData && this.paperData.sections[si];
    if (!sec || !sec.items[qi]) return;
    sec.items[qi].userAnswer = event.detail.value || '';
  },

  onSubmit: function () {
    click();
    const built = this.paperData;
    if (!built) return;
    if (built.graded) {
      this.setData({
        stage: 'setup',
        sections: [],
        graded: false,
        hasScore: false,
        title: paper.defaultTitle()
      });
      this.paperData = null;
      this.refreshNote();
      return;
    }
    const answered = paper.flat(built).some(function (item) {
      return String(item.userAnswer || '').trim();
    });
    if (!answered) {
      U.toast('还没有写答案，先做几道再交卷～');
      return;
    }
    const result = paper.grade(built);
    paper.applyResult(built);
    this.render();
    let text = '交卷啦！做对 ' + result.right + ' / ' + result.judged + ' 道，正确率 ' + this.data.scoreRate + '%';
    if (result.blank) text += '，其中 ' + result.blank + ' 道没写答案';
    U.toast(text + '。答错的题已留在错题本里。');
  },

  onPreviewImage: function (event) {
    const url = event.currentTarget.dataset.src;
    if (url) wx.previewImage({ current: url, urls: [url] });
  },

  onBack: function () {
    const pages = getCurrentPages();
    if (pages.length > 1) wx.navigateBack();
    else wx.switchTab({ url: '/pages/math/math' });
  }
});
