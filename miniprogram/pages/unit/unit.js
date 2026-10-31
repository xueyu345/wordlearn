/* 英语主题页：单词列表 + 四种玩法入口 */
const store = require('../../utils/store.js');
const U = require('../../utils/util.js');

const MODES = [
  { key: 'learn', name: '学一学', desc: '翻卡片，认识新单词', emoji: '🃏', color: '#FF8A3D', soft: '#FFF0E3', path: '/pages/learn/learn' },
  { key: 'quiz', name: '选一选', desc: '四选一，检验记得牢不牢', emoji: '🎯', color: '#7057F5', soft: '#F0ECFF', path: '/pages/quiz/quiz' },
  { key: 'spell', name: '拼一拼', desc: '看中文，亲手拼出单词', emoji: '🔤', color: '#27B8A8', soft: '#E3FAF6', path: '/pages/spell/spell' },
  { key: 'match', name: '连一连', desc: '英文中文配配对，挑战记忆力', emoji: '🧩', color: '#F45D9E', soft: '#FFEAF5', path: '/pages/match/match' }
];

Page({
  data: {
    unitId: '',
    hasUnit: false,
    emoji: '🔤',
    name: '',
    en: '',
    enUpper: '',
    desc: '',
    count: 0,
    learned: 0,
    percent: 0,
    bannerStyle: '',
    barStyle: '',
    badgeStyle: '',
    modes: MODES,
    words: [],
    activeId: ''
  },

  onLoad(options) {
    this.setData({ unitId: options.u || '' });
    this.refresh();
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    if (!store.state()) store.init();
    store.ensureDaily();

    const unit = store.getUnit(this.data.unitId);
    if (!unit) {
      this.setData({ hasUnit: false });
      return;
    }

    const learned = store.unitLearned(unit);
    const total = unit.words.length;
    const percent = total ? Math.round((learned / total) * 100) : 0;
    const st = store.state();
    const activeId = this.data.activeId;

    const words = unit.words.map((word) => ({
      id: word.id,
      w: word.w,
      ipa: word.ipa || '',
      zh: word.zh || '',
      emoji: word.emoji || '🔤',
      en: word.en || '',
      cn: word.cn || '',
      learned: Boolean(st.learned[word.id]),
      open: Boolean(activeId) && activeId === word.id
    }));

    this.setData({
      hasUnit: true,
      emoji: unit.emoji,
      name: unit.name,
      en: unit.en || '',
      enUpper: (unit.en || '').toUpperCase(),
      desc: unit.desc || '',
      count: total,
      learned: learned,
      percent: percent,
      bannerStyle: 'background:' + unit.soft + ';border-color:' + unit.color + ';',
      barStyle: 'width:' + percent + '%;background:' + unit.color + ';',
      badgeStyle: 'background:' + unit.color + ';',
      words: words
    });
  },

  click() {
    if (store.prefs().sound) U.vibrate('light');
  },

  openMode(event) {
    this.click();
    const path = event.currentTarget.dataset.path;
    wx.navigateTo({ url: path + '?u=' + this.data.unitId });
  },

  /* 小程序没有朗读能力，点单词改为展开音标 + 例句 */
  toggleWord(event) {
    this.click();
    const id = event.currentTarget.dataset.id;
    const activeId = this.data.activeId === id ? '' : id;
    const words = this.data.words.map((w) => Object.assign({}, w, { open: Boolean(activeId) && w.id === activeId }));
    this.setData({ words: words, activeId: activeId });
  },

  goBack() {
    wx.navigateBack({
      fail: function () {
        wx.switchTab({ url: '/pages/english/english' });
      }
    });
  }
});
