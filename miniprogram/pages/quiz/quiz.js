const store = require('../../utils/store.js');
const U = require('../../utils/util.js');

const PRAISES = ['答对啦！+1 ⭐', '太棒了，记得真牢！', '答得漂亮，继续保持！', '这个单词难不倒你！'];
const KEYS = ['A', 'B', 'C', 'D'];

Page({
  data: {
    unitId: '',
    title: '',
    stepText: '',
    streakText: '🔥 连对 0',
    barPercent: 0,
    hearts: [],
    q: { label: '', emoji: '', word: '', ipa: '', zh: '', hint: '', number: 1 },
    options: [],
    feedback: { text: '', cls: '' }
  },

  onLoad(query) {
    this.timer = null;
    this.quiz = null;
    this.start((query && query.u) || '');
  },

  onUnload() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.quiz = null;
  },

  /* ---------- 开局 ---------- */
  start(unitId) {
    let name = '';
    let emoji = '🔤';
    let pool = [];
    if (unitId === 'all') {
      name = '混合大挑战';
      emoji = '🌟';
      pool = store.allWords().slice();
    } else if (unitId === 'wrong') {
      name = '错词挑战';
      emoji = '💪';
      const state = store.state() || {};
      pool = (state.wrong || []).map((id) => store.wordById(id));
      pool = pool.filter((w) => !!w);
      if (pool.length === 0) {
        U.toast('错词本是空的，先去学几个新单词吧～');
        this.goBack();
        return;
      }
    } else {
      const unit = store.getUnit(unitId);
      if (!unit) {
        wx.switchTab({ url: '/pages/english/english' });
        return;
      }
      name = unit.name;
      emoji = unit.emoji || '🔤';
      pool = (unit.words || []).slice();
    }
    if (pool.length === 0) {
      U.toast('这个主题还没有单词，换个主题试试～');
      this.goBack();
      return;
    }
    // 题量跟随设置里的「每轮题目数量」，但不超过题库实际长度
    const count = Math.max(1, Math.min(store.prefs().roundSize, pool.length));
    this.quiz = {
      unitId: unitId,
      name: name,
      emoji: emoji,
      pool: pool,
      words: U.shuffle(pool).slice(0, count),
      index: 0,
      correct: 0,
      wrong: 0,
      answered: 0,
      hearts: 3,
      streak: 0,
      bestStreak: 0,
      earned: 0,
      locked: false,
      finished: false,
      options: [],
      correctIndex: 0,
      records: []
    };
    this.setData({ unitId: unitId, title: name });
    this.render();
  },

  /* ---------- 题型轮换：英→中 / 中→英 / 看音标选词 ---------- */
  typeFor(index, word) {
    if (index % 3 === 1) return 'zh2en';
    // 网页版这里是「听音选词」，小程序没有 TTS，降级为「看音标选词」
    if (index % 3 === 2 && word && word.ipa) return 'ipa';
    return 'en2zh';
  },

  buildOptions(word, type) {
    const data = this.quiz;
    const isChinese = type === 'en2zh';
    const labelOf = (item) => (isChinese ? (item.zh || '') : (item.w || ''));
    const correctLabel = labelOf(word);
    const seen = {};
    seen[correctLabel] = true;
    const picked = [];
    const candidates = U.shuffle(data.pool).concat(U.shuffle(store.allWords()));
    for (let i = 0; i < candidates.length && picked.length < 3; i += 1) {
      const candidate = candidates[i];
      if (!candidate || candidate.id === word.id) continue;
      const label = labelOf(candidate);
      if (!label || seen[label]) continue;
      seen[label] = true;
      picked.push({ label: label, correct: false });
    }
    const options = U.shuffle([{ label: correctLabel, correct: true }].concat(picked));
    let correctIndex = 0;
    for (let i = 0; i < options.length; i += 1) {
      if (options[i].correct) { correctIndex = i; break; }
    }
    return { options: options, correctIndex: correctIndex };
  },

  /* ---------- 渲染 ---------- */
  render() {
    const data = this.quiz;
    if (!data || data.finished) return;
    if (data.index >= data.words.length) { this.finish(); return; }

    const word = data.words[data.index];
    const type = this.typeFor(data.index, word);
    const built = this.buildOptions(word, type);
    data.type = type;
    data.options = built.options;
    data.correctIndex = built.correctIndex;

    const q = {
      number: data.index + 1,
      label: '',
      emoji: '',
      word: '',
      ipa: '',
      zh: '',
      hint: ''
    };
    if (type === 'ipa') {
      q.label = '看音标，选出这个单词';
      q.ipa = word.ipa || '';
      q.hint = '小程序版暂不支持发音，看着音标读一读';
    } else if (type === 'zh2en') {
      q.label = '选出正确的英文单词';
      q.emoji = word.emoji || '';
      q.zh = word.zh || '';
      q.hint = '它的英文怎么说？';
    } else {
      q.label = '选出正确的中文意思';
      q.emoji = word.emoji || '';
      q.word = word.w || '';
      q.ipa = word.ipa || '';
    }

    const options = built.options.map((option, index) => ({
      key: 'opt' + index,
      keyText: KEYS[index] || String(index + 1),
      label: option.label,
      cls: '',
      mark: ''
    }));

    this.setData({
      stepText: '第 ' + (data.index + 1) + ' / ' + data.words.length + ' 题',
      streakText: '🔥 连对 ' + data.streak,
      barPercent: Math.round((data.index / data.words.length) * 100),
      q: q,
      options: options,
      feedback: { text: '', cls: '' },
      hearts: this.heartList(data.hearts)
    });
    data.locked = false;
  },

  heartList(hearts) {
    const list = [];
    for (let i = 0; i < 3; i += 1) {
      list.push({ key: 'h' + i, icon: i < hearts ? '❤️' : '🤍', lost: i >= hearts });
    }
    return list;
  },

  /* ---------- 作答 ---------- */
  onSelect(event) {
    const data = this.quiz;
    if (!data || data.locked || data.finished) return;
    const index = Number(event.currentTarget.dataset.index);
    if (isNaN(index)) return;
    const option = data.options ? data.options[index] : null;
    const view = this.data.options[index];
    if (!option || !view) return;

    data.locked = true;
    data.answered += 1;
    const word = data.words[data.index];

    const options = this.data.options.map((item, i) => {
      const copy = { key: item.key, keyText: item.keyText, label: item.label, cls: '', mark: '' };
      if (i === data.correctIndex) { copy.cls = 'is-correct'; copy.mark = '✓'; }
      else if (i === index) { copy.cls = 'is-wrong'; copy.mark = '✗'; }
      return copy;
    });

    let delay = 1100;
    let feedback = { text: '', cls: '' };
    if (option.correct) {
      data.correct += 1;
      data.streak += 1;
      if (data.streak > data.bestStreak) data.bestStreak = data.streak;
      data.earned += 1;
      store.addStars(1);
      store.markWord(word.id, true);
      if (store.prefs().sound) U.vibrate('medium');
      feedback = { text: PRAISES[Math.floor(Math.random() * PRAISES.length)], cls: 'ok' };
      data.records.push({ w: word.w, zh: word.zh || '', ok: true });
    } else {
      data.wrong += 1;
      data.hearts -= 1;
      data.streak = 0;
      store.markWord(word.id, false);
      if (store.prefs().sound) U.vibrate('heavy');
      feedback = { text: '没关系，正确答案是「' + data.options[data.correctIndex].label + '」，记住它！', cls: 'no' };
      delay = 1900;
      data.records.push({ w: word.w, zh: word.zh || '', ok: false });
    }

    this.setData({
      options: options,
      feedback: feedback,
      streakText: '🔥 连对 ' + data.streak,
      hearts: this.heartList(data.hearts)
    });

    if (this.timer) clearTimeout(this.timer);
    if (data.hearts <= 0) {
      this.timer = setTimeout(() => { this.finish(); }, delay + 250);
      return;
    }
    this.timer = setTimeout(() => {
      if (!this.quiz || this.quiz !== data) return;
      data.index += 1;
      if (data.index >= data.words.length) this.finish();
      else this.render();
    }, delay);
  },

  /* ---------- 结算 ---------- */
  finish() {
    const data = this.quiz;
    if (!data || data.finished) return;
    data.finished = true;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }

    const answered = data.answered || 0;
    const accuracy = answered ? Math.round((data.correct / answered) * 100) : 0;
    let rating = 0;
    if (accuracy >= 90 && data.hearts > 0) rating = 3;
    else if (accuracy >= 70) rating = 2;
    else if (accuracy >= 50) rating = 1;
    const bonus = rating;
    store.addStars(bonus);
    data.earned += bonus;

    const emoji = rating === 3 ? '🏆' : rating === 2 ? '🎉' : rating === 1 ? '👍' : '💪';
    const app = getApp();
    app.globalData.lastResult = {
      kind: 'quiz',
      unitId: data.unitId,
      unitName: data.name,
      emoji: emoji,
      total: data.words.length,
      correct: data.correct,
      wrong: data.wrong,
      stars: data.earned,
      seconds: 0,
      accuracy: accuracy,
      rating: rating,
      hearts: data.hearts,
      bestStreak: data.bestStreak,
      words: data.records
    };
    wx.redirectTo({ url: '/pages/result/result' });
  },

  onBack() {
    const data = this.quiz;
    if (data && !data.finished && data.answered > 0) {
      wx.showModal({
        title: '要离开吗？',
        content: '这一轮的成绩还没有结算，退出就丢啦～',
        confirmText: '确定退出',
        cancelText: '继续答题',
        success: (res) => { if (res.confirm) this.goBack(); }
      });
      return;
    }
    this.goBack();
  },

  goBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/english/english' });
      }
    });
  }
});
