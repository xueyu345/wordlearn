/* 解题挑战：先做题 → 判对错 → 看解析 → 只把做错的收进错题本
 * 规则与原网页 index.html 的 setupSolve / startSolve / renderSolve / checkSolve /
 * skipSolve / nextSolve / finishSolve / addSolveToWrongBook 一致。
 */
const store = require('../../utils/store.js');
const U = require('../../utils/util.js');
const BANK = require('../../utils/math-problems.js');

const MIX_LABEL = '🎲 混合练习（按当前年级随机）';
const COUNT_CHOICES = [5, 10, 15];

function click() {
  if (store.prefs().sound) U.vibrate('light');
}

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) wx.navigateBack();
  else wx.switchTab({ url: '/pages/math/math' });
}

Page({
  data: {
    pane: 'setup',
    // 设置
    kpOptions: [MIX_LABEL],
    kpIndex: 0,
    kpLabel: MIX_LABEL,
    countOptions: ['5 道', '10 道', '15 道'],
    countIndex: 1,
    countLabel: '10 道',
    stageNote: '',
    bankReady: false,
    // 答题
    solveTitle: '解题挑战',
    solveSub: '按当前年级出题',
    progressText: '1 / 5',
    barWidth: 0,
    cur: { kp: '', stage: '', q: '', tip: '' },
    input: '',
    inputDisabled: false,
    showCheck: true,
    showHint: true,
    showSkip: true,
    showTip: false,
    tipText: '',
    showResult: false,
    verdictClass: '',
    verdictText: '',
    steps: [],
    answerText: '',
    mineText: '',
    showMine: false,
    nextText: '下一题',
    // 结算
    summaryTitle: '',
    summarySub: '',
    score: [],
    pickList: [],
    hasFailed: false,
    addText: '把选中的收进错题本'
  },

  onLoad: function () {
    this.session = null;
    this.setup();
  },

  onUnload: function () {
    this.session = null;
  },

  setup: function () {
    const grade = store.getGrade();
    const book = store.getMathBook();
    const bookMeta = store.mathBookMeta(book);
    const stages = store.mathPresetKps(); // 知识点名单取自「当前教材 + 当前年级」
    const bankReady = Boolean(BANK && typeof BANK.makeSet === 'function');

    const preset = store.prefs().roundSize;
    const countIndex = COUNT_CHOICES.indexOf(preset) >= 0 ? COUNT_CHOICES.indexOf(preset) : 1;

    const patch = {
      pane: 'setup',
      bankReady: bankReady,
      kpOptions: [MIX_LABEL].concat(stages),
      kpIndex: 0,
      kpLabel: MIX_LABEL,
      countIndex: countIndex,
      countLabel: this.data.countOptions[countIndex]
    };

    if (!bankReady) {
      patch.stageNote = '题库没加载出来，刷新页面再试试。记错题不受影响。';
    } else {
      patch.stageNote = '当前是' + U.gradeLabel(grade) + '（' + bookMeta.name + '），'
        + (stages.length
          ? '会从这个阶段的知识点里出题：' + stages.join('、') + '。'
          : '这套教材暂时没有内置知识点，可以先加一个自定义知识点，或用混合练习。');
    }
    this.setData(patch);
  },

  onKpChange: function (event) {
    const index = Number(event.detail.value) || 0;
    const options = this.data.kpOptions;
    this.setData({ kpIndex: index, kpLabel: options[index] || MIX_LABEL });
  },

  onCountChange: function (event) {
    const index = Number(event.detail.value) || 0;
    this.setData({ countIndex: index, countLabel: this.data.countOptions[index] });
  },

  onStart: function () {
    if (!this.data.bankReady) {
      U.toast('题库没能加载出来，刷新一下再试试');
      return;
    }
    const options = this.data.kpOptions || [];
    const picked = options[this.data.kpIndex] || '';
    const kp = this.data.kpIndex === 0 ? '' : picked;
    const count = COUNT_CHOICES[this.data.countIndex] || 10;
    const queue = BANK.makeSet({ grade: store.getGrade(), kp: kp, count: count });
    if (!queue.length) {
      U.toast('这个知识点暂时出不了题，换一个试试');
      return;
    }
    this.session = {
      kp: kp,
      grade: store.getGrade(),
      queue: queue.map(function (item) {
        return Object.assign({}, item, { myAnswer: '', ok: false, checked: false, skipped: false });
      }),
      index: 0,
      right: 0,
      wrong: 0
    };
    this.setData({
      solveTitle: kp || '混合练习',
      solveSub: U.gradeLabel(store.getGrade()) + ' · 共 ' + queue.length + ' 道'
    });
    click();
    this.render();
  },

  current: function () {
    if (!this.session) return null;
    return this.session.queue[this.session.index] || null;
  },

  render: function () {
    const session = this.session;
    const item = this.current();
    if (!session || !item) { this.finish(); return; }
    const total = session.queue.length;
    this.setData({
      pane: 'play',
      progressText: (session.index + 1) + ' / ' + total,
      barWidth: Math.round((session.index / total) * 100),
      cur: {
        kp: item.kp || item.topicName || '',
        stage: item.stage || item.type || '',
        q: item.q || '',
        tip: item.tip || ''
      },
      input: '',
      inputDisabled: false,
      showCheck: true,
      showHint: true,
      showSkip: true,
      showTip: false,
      tipText: '',
      showResult: false,
      nextText: session.index + 1 >= total ? '看看这一轮战果' : '下一题'
    });
    wx.pageScrollTo({ scrollTop: 0, duration: 0 });
  },

  onInput: function (event) {
    const value = event.detail.value || '';
    this.setData({ input: value });
    const item = this.current();
    if (item && !item.checked) item.myAnswer = String(value).trim();
  },

  onHint: function () {
    const item = this.current();
    if (!item) return;
    click();
    this.setData({
      showTip: true,
      showHint: false,
      tipText: item.tip
        ? '💡 ' + item.tip
        : '💡 先把题目读两遍，找出已知条件和要求的问题。'
    });
  },

  onCheck: function () {
    const item = this.current();
    if (!item || item.checked) return;
    const value = String(this.data.input || '').trim();
    if (!value) {
      U.toast('先写上答案，不会的话点「给点提示」或「跳过」');
      return;
    }
    item.myAnswer = value;
    item.checked = true;
    item.ok = BANK.checkAnswer(value, item);
    if (item.ok) {
      this.session.right += 1;
      click();
      store.addStars(1);
    } else {
      this.session.wrong += 1;
      click();
    }
    this.setData({
      inputDisabled: true,
      showCheck: false,
      showHint: false,
      showSkip: false,
      showTip: false,
      showResult: true,
      verdictClass: item.ok ? 'ok' : 'no',
      verdictText: item.ok
        ? '✅ 答对了！做对一道 +1 ⭐'
        : '❌ 这题做错了，看一遍解析就懂了',
      steps: (item.steps || []).map(function (text, index) { return { key: 's' + index, text: text }; }),
      answerText: item.a || '',
      showMine: !item.ok,
      mineText: item.ok ? '' : value
    });
  },

  onSkip: function () {
    const item = this.current();
    if (!item || item.checked) return;
    item.checked = true;
    item.skipped = true;
    item.ok = false;
    item.myAnswer = item.myAnswer || '';
    this.session.wrong += 1;
    click();
    this.setData({
      inputDisabled: true,
      showCheck: false,
      showHint: false,
      showSkip: false,
      showTip: false,
      showResult: true,
      verdictClass: 'no',
      verdictText: '⏭️ 先跳过了，看看解析',
      steps: (item.steps || []).map(function (text, index) { return { key: 's' + index, text: text }; }),
      answerText: item.a || '',
      showMine: false,
      mineText: ''
    });
  },

  onNext: function () {
    const item = this.current();
    if (item && !item.checked) { this.onCheck(); return; }
    if (!this.session) return;
    this.session.index += 1;
    if (this.session.index >= this.session.queue.length) this.finish();
    else this.render();
    wx.pageScrollTo({ scrollTop: 0, duration: 0 });
  },

  finish: function () {
    const session = this.session;
    if (!session) return;
    const total = session.queue.length;
    const rate = total ? Math.round((session.right / total) * 100) : 0;

    let summaryTitle = '别急，把错的收进错题本慢慢啃';
    if (rate >= 90) summaryTitle = '太棒了，几乎全对！';
    else if (rate >= 60) summaryTitle = '做得不错，还有几道要练';

    const failed = session.queue.filter(function (item) { return !item.ok; });

    const score = [
      { value: String(total), label: '做了几道', cls: 'num' },
      { value: String(session.right), label: '做对', cls: 'num green' },
      { value: String(session.wrong), label: '做错/跳过', cls: 'num red' },
      { value: rate + '%', label: '正确率', cls: 'num purple' }
    ];

    const pickList = failed.map(function (item, index) {
      const ansLine = (item.myAnswer ? '你写的：' + item.myAnswer + '　' : '')
        + '正确答案：' + item.a;
      return {
        index: index,
        q: item.q,
        ansLine: ansLine,
        checked: true,
        cls: 'checked'
      };
    });

    this.setData({
      pane: 'summary',
      barWidth: 100,
      summaryTitle: summaryTitle,
      summarySub: '把这些题收进错题本后，就能在「抽题复习」里反复练了。',
      score: score,
      pickList: pickList,
      hasFailed: failed.length > 0,
      addText: '把选中的 ' + failed.length + ' 道收进错题本'
    });
    wx.pageScrollTo({ scrollTop: 0, duration: 0 });
  },

  onTogglePick: function (event) {
    const index = Number(event.currentTarget.dataset.index) || 0;
    const row = this.data.pickList[index];
    if (!row) return;
    const checked = !row.checked;
    const patch = {};
    patch['pickList[' + index + '].checked'] = checked;
    patch['pickList[' + index + '].cls'] = checked ? 'checked' : '';
    click();
    this.setData(patch);
  },

  // 把勾选的题收进错题本（已记过的只累加错误次数，不重复记一条）
  onAddToWrongBook: function () {
    const session = this.session;
    if (!session) return;
    const failed = session.queue.filter(function (item) { return !item.ok; });
    const pickList = this.data.pickList || [];
    const chosen = [];
    failed.forEach(function (item, index) {
      const row = pickList[index];
      if (!row || row.checked !== false) chosen.push(item);
    });
    if (!chosen.length) {
      U.toast('还没有勾选要收进错题本的题');
      return;
    }
    const items = store.mathState().items || [];
    const preset = store.mathPresetKps();
    let added = 0;
    let merged = 0;
    chosen.forEach(function (item) {
      const kp = item.kp || item.topicName || '未分类';
      let existing = null;
      for (let i = 0; i < items.length; i += 1) {
        if (items[i] && items[i].q === item.q) { existing = items[i]; break; }
      }
      if (existing) {
        store.updateMathItem(existing.id, {
          wrongCount: (Number(existing.wrongCount) || 1) + 1,
          done: false,
          a: existing.a || item.a,
          myAnswer: existing.myAnswer || item.myAnswer || '',
          steps: (existing.steps && existing.steps.length) ? existing.steps : (item.steps || []).slice()
        });
        merged += 1;
        return;
      }
      store.addMathItem({
        q: item.q,
        a: item.a,
        kp: kp,
        type: item.type || '',
        myAnswer: item.myAnswer || '',
        why: item.tip ? '易错提醒：' + item.tip : '',
        steps: (item.steps || []).slice(),
        images: []
      });
      added += 1;
      if (preset.indexOf(kp) < 0) store.addCustomKp(kp);
    });

    let text = '';
    if (added && merged) text = '收进 ' + added + ' 道，另有 ' + merged + ' 道之前记过，已累计错因';
    else if (added) text = '已把 ' + added + ' 道题收进错题本 📌';
    else text = '这 ' + merged + ' 道之前记过，错误次数已更新';

    U.toast(text);
    click();
    this.session = null;
    goBack();
  },

  onAgain: function () {
    this.session = null;
    this.onStart();
  },

  onQuit: function () {
    click();
    this.session = null;
    goBack();
  }
});
