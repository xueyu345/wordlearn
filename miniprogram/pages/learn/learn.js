/* 学一学：3D 翻转单词卡 */
const store = require('../../utils/store.js');
const U = require('../../utils/util.js');

const FINISH_BONUS = 3;   // 翻完整组额外奖励，与原网页一致
const GRADE_DELAY = 420;  // 评分反馈停留时间

Page({
  data: {
    hasUnit: false,
    unitName: '',
    emoji: '🔤',
    countText: '0 / 0',
    barPercent: 0,
    flipped: false,
    cardClass: '',
    busy: false,
    word: null
  },

  order: null,
  pos: 0,
  reviewed: 0,
  known: 0,
  earned: 0,
  finished: false,
  results: [],
  startAt: 0,
  timer: null,
  unit: null,

  onLoad(options) {
    if (!store.state()) store.init();
    store.ensureDaily();
    const unit = store.getUnit(options.u || '');
    if (!unit) {
      U.toast('没有找到这个主题');
      this.toHome();
      return;
    }
    this.unit = unit;
    this.order = unit.words.slice();
    this.pos = 0;
    this.reviewed = 0;
    this.known = 0;
    this.earned = 0;
    this.finished = false;
    this.results = [];
    this.startAt = Date.now();
    this.setData({ hasUnit: true, unitName: unit.name, emoji: unit.emoji });
    wx.setNavigationBarTitle({ title: unit.name });
    this.renderCard();
  },

  onUnload() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  },

  renderCard() {
    const word = this.order[this.pos];
    if (!word) { this.finishLearn(); return; }
    this.setData({
      countText: (this.pos + 1) + ' / ' + this.order.length,
      barPercent: Math.round((this.pos / this.order.length) * 100),
      flipped: false,
      cardClass: '',
      busy: false,
      word: {
        w: word.w,
        ipa: word.ipa || '',
        zh: word.zh || '',
        emoji: word.emoji || '🔤',
        en: word.en || '',
        cn: word.cn || ''
      }
    });
  },

  flipCard() {
    if (!this.order || this.finished || this.data.busy) return;
    if (store.prefs().sound) U.vibrate('light');
    this.setData({ flipped: !this.data.flipped });
  },

  grade(known) {
    if (!this.order || this.finished || this.data.busy) return;
    const word = this.order[this.pos];
    if (!word) return;

    this.setData({ busy: true });
    const firstTime = !store.state().learned[word.id];
    store.markWord(word.id, known);
    this.reviewed += 1;
    this.results.push({ w: word.w, zh: word.zh || '', ok: !!known });

    if (known) {
      this.known += 1;
      if (store.prefs().sound) U.vibrate('light');
      if (firstTime) {
        store.addStars(1);
        this.earned += 1;
      }
      this.setData({ cardClass: 'card-good' });
    } else {
      if (store.prefs().sound) U.vibrate('heavy');
      this.setData({ cardClass: 'card-bad' });
    }

    const self = this;
    this.timer = setTimeout(function () {
      self.timer = null;
      if (!self.order || self.finished) return;
      self.pos += 1;
      if (self.pos >= self.order.length) {
        self.finishLearn();
      } else {
        self.renderCard();
      }
    }, GRADE_DELAY);
  },

  onKnown() { this.grade(true); },
  onUnknown() { this.grade(false); },

  finishLearn() {
    if (this.finished) return;
    this.finished = true;
    store.addStars(FINISH_BONUS);
    this.earned += FINISH_BONUS;
    if (store.prefs().sound) U.vibrate('medium');

    const unit = this.unit;
    getApp().globalData.lastResult = {
      kind: 'learn',
      unitId: unit.id,
      unitName: unit.name,
      emoji: unit.emoji,
      total: this.order.length,
      correct: this.known,
      wrong: this.reviewed - this.known,
      stars: this.earned,
      seconds: Math.max(1, Math.round((Date.now() - this.startAt) / 1000)),
      words: this.results.slice()
    };
    wx.navigateTo({ url: '/pages/result/result' });
  },

  goBack() {
    if (this.reviewed > 0) {
      const self = this;
      wx.showModal({
        title: '结束这一轮吗？',
        content: '已经学过的 ' + this.reviewed + ' 个单词会保留，但拿不到完成奖励哦。',
        confirmText: '结束',
        cancelText: '继续学',
        success(res) {
          if (res.confirm) self.toHome();
        }
      });
      return;
    }
    this.toHome();
  },

  toHome() {
    wx.navigateBack({
      fail: function () {
        wx.switchTab({ url: '/pages/english/english' });
      }
    });
  }
});
