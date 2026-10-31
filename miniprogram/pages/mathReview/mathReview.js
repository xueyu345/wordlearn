/* 抽题复习：按知识点抽题（未掌握优先、错得多的靠前），一轮最多 10 道
 * 流程：先自己做 → 看答案 → 这次做对了吗
 *   答对：标记已掌握并 +1⭐；答错：wrongCount + 1 并退回待攻克
 * 规则与原网页 index.html 的 startMathReview / ensureReviewSession /
 * renderReview / revealReviewAnswer / judgeReview / finishReview 一致。
 */
const store = require('../../utils/store.js');
const U = require('../../utils/util.js');

const MAX_PER_ROUND = 10;
const GOT_FEEDBACK = ['攻克一道！+1 ⭐', '又拿下一道，厉害！', '这道题被你收服了！'];
const MISSED_FEEDBACK = ['没关系，重点标记了，下次再来', '记住错因，比做对更值钱', '这道留在待攻克里，多练几次'];

function click() {
  if (store.prefs().sound) U.vibrate('light');
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

Page({
  data: {
    title: '抽题复习',
    sub: '按知识点抽题',
    progressText: '1 / 0',
    barWidth: 0,
    kp: '',
    type: '',
    q: '',
    images: [],
    hasImages: false,
    showMyAnswer: false,
    myAnswer: '',
    showAnswer: false,
    a: '',
    showWhy: false,
    why: '',
    showSteps: false,
    steps: [],
    showReveal: true,
    showJudge: false,
    finished: false,
    result: null
  },

  onLoad: function (query) {
    this.session = null;
    this.timer = null;
    const kp = (query && query.kp) || '';
    this.start(kp === 'all' ? '' : kp);
  },

  onUnload: function () {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.session = null;
  },

  onHide: function () {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  },

  start: function (kpFilter) {
    const items = store.mathState().items || [];
    const pool = items.filter(function (item) {
      return !kpFilter || item.kp === kpFilter;
    });
    if (!pool.length) {
      U.toast('这个知识点下还没有错题');
      this.setData({ finished: false, result: null });
      const pages = getCurrentPages();
      if (pages.length > 1) wx.navigateBack();
      else wx.switchTab({ url: '/pages/math/math' });
      return;
    }
    // 未掌握的优先，同一优先级里错得多的靠前
    const ranked = pool.slice().sort(function (a, b) {
      if (Boolean(a.done) !== Boolean(b.done)) return a.done ? 1 : -1;
      const diff = (Number(b.wrongCount) || 1) - (Number(a.wrongCount) || 1);
      if (diff !== 0) return diff;
      return (a.updatedAt || 0) - (b.updatedAt || 0);
    });
    const size = Math.min(Math.max(1, Math.min(store.prefs().roundSize, MAX_PER_ROUND)), ranked.length);
    this.session = {
      kpFilter: kpFilter || '',
      queue: ranked.slice(0, size),
      index: 0,
      got: 0,
      missed: 0,
      revealed: false,
      finished: false
    };
    this.setData({
      title: kpFilter || '全部知识点',
      sub: '抽题复习 · 共 ' + size + ' 道',
      finished: false,
      result: null
    });
    this.render();
  },

  render: function () {
    const session = this.session;
    if (!session || session.finished) return;
    if (session.index >= session.queue.length) { this.finish(); return; }
    const item = session.queue[session.index];
    session.revealed = false;
    const steps = (Array.isArray(item.steps) ? item.steps.filter(Boolean) : []).map(function (text, index) {
      return { key: 's' + index, text: text };
    });
    this.setData({
      progressText: (session.index + 1) + ' / ' + session.queue.length,
      barWidth: Math.round((session.index / session.queue.length) * 100),
      kp: item.kp || '未分类',
      type: item.type || '未分题型',
      q: item.q || '',
      images: (item.images || []).slice(),
      hasImages: (item.images || []).length > 0,
      showMyAnswer: Boolean(item.myAnswer),
      myAnswer: item.myAnswer || '',
      a: item.a || '（当时还没记正确答案，可以在编辑里补上）',
      showWhy: Boolean(item.why),
      why: item.why || '',
      steps: steps,
      showSteps: steps.length > 0,
      showAnswer: false,
      showJudge: false,
      showReveal: true
    });
    wx.pageScrollTo({ scrollTop: 0, duration: 0 });
  },

  onReveal: function () {
    const session = this.session;
    if (!session || session.finished) return;
    session.revealed = true;
    click();
    this.setData({ showAnswer: true, showReveal: false, showJudge: true });
  },

  judge: function (gotIt) {
    const session = this.session;
    if (!session || session.finished || !session.revealed) return;
    const item = session.queue[session.index];
    if (!item) return;
    // 判定后就锁住：延迟跳转前的这段时间里按钮还看得见，连点会重复计分甚至越界取到 undefined
    session.revealed = false;
    const target = store.mathItemById(item.id);
    if (gotIt) {
      session.got += 1;
      if (target) store.updateMathItem(item.id, { done: true });
      click();
      store.addStars(1);
    } else {
      session.missed += 1;
      if (target) {
        store.updateMathItem(item.id, {
          wrongCount: (Number(target.wrongCount) || 1) + 1,
          done: false
        });
      }
      click();
    }
    U.toast(pickRandom(gotIt ? GOT_FEEDBACK : MISSED_FEEDBACK));
    session.index += 1;
    if (this.timer) clearTimeout(this.timer);
    const self = this;
    this.timer = setTimeout(function () {
      self.timer = null;
      if (!self.session || self.session.finished) return;
      if (self.session.index >= self.session.queue.length) self.finish();
      else self.render();
    }, gotIt ? 520 : 900);
  },

  finish: function () {
    const session = this.session;
    if (!session || session.finished) return;
    session.finished = true;
    const total = session.queue.length;
    const accuracy = total ? Math.round((session.got / total) * 100) : 0;
    const rating = accuracy >= 100 ? 3 : accuracy >= 70 ? 2 : accuracy >= 40 ? 1 : 0;
    const result = {
      emoji: rating === 3 ? '🏆' : rating === 2 ? '🎉' : (rating >= 1 ? '👍' : '💪'),
      title: rating === 3
        ? '全部攻克，太强了！'
        : rating === 2 ? '干得漂亮！' : (rating >= 1 ? '有进步，继续加油' : '先看看错因，再练一轮'),
      desc: '这一轮复习了 ' + total + ' 道，做对 ' + session.got + ' 道，正确率 ' + accuracy + '%。'
    };
    this.setData({
      finished: true,
      result: result,
      barWidth: 100,
      kp: session.kpFilter || '全部知识点',
      type: '本轮完成',
      showAnswer: false,
      showJudge: false,
      showReveal: false
    });
    if (rating >= 2) {
      const self = this;
      if (self.timer) clearTimeout(self.timer);
      self.timer = setTimeout(function () {
        self.timer = null;
        click();
      }, 200);
    }
    wx.pageScrollTo({ scrollTop: 0, duration: 0 });
  },

  onGot: function () { this.judge(true); },

  onMissed: function () { this.judge(false); },

  onAgain: function () {
    const kp = this.session ? this.session.kpFilter : '';
    this.session = null;
    click();
    this.start(kp);
  },

  onBack: function () {
    click();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.session = null;
    const pages = getCurrentPages();
    if (pages.length > 1) wx.navigateBack();
    else wx.switchTab({ url: '/pages/math/math' });
  },

  onPreviewImage: function (event) {
    const index = Number(event.currentTarget.dataset.index) || 0;
    const urls = this.data.images.slice();
    if (!urls.length) return;
    wx.previewImage({ current: urls[index] || urls[0], urls: urls });
  }
});
