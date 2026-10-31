const store = require('../../utils/store.js');
const U = require('../../utils/util.js');

Page({
  data: {
    title: '',
    stepText: '',
    lettersText: '',
    barPercent: 0,
    emoji: '',
    zh: '',
    mask: [],
    inputValue: '',
    inputDisabled: false,
    hintDisabled: false,
    showCheck: true,
    showNext: false,
    shakeCls: '',
    feedback: { text: '', cls: '' }
  },

  onLoad(query) {
    this.timer = null;
    this.shakeTimer = null;
    this.spell = null;
    this.start((query && query.u) || '');
  },

  onUnload() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.shakeTimer) { clearTimeout(this.shakeTimer); this.shakeTimer = null; }
    this.spell = null;
  },

  /* ---------- 开局 ---------- */
  start(unitId) {
    const unit = store.getUnit(unitId);
    if (!unit) {
      wx.switchTab({ url: '/pages/english/english' });
      return;
    }
    const words = (unit.words || []).slice();
    if (words.length === 0) {
      U.toast('这个主题还没有单词，换个主题试试～');
      wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/english/english' }) });
      return;
    }
    const count = Math.max(1, Math.min(store.prefs().roundSize, words.length));
    this.spell = {
      unit: unit,
      words: U.shuffle(words).slice(0, count),
      index: 0,
      correct: 0,
      wrong: 0,
      attempts: 0,
      hintLevel: 0,
      earned: 0,
      locked: false,
      finished: false,
      recordedWrong: false,
      records: []
    };
    this.setData({ title: unit.name });
    this.render();
  },

  /* ---------- 渲染 ---------- */
  render() {
    const data = this.spell;
    if (!data || data.finished) return;
    if (data.index >= data.words.length) { this.finish(); return; }

    const word = data.words[data.index];
    data.attempts = 0;
    data.hintLevel = 0;
    data.locked = false;
    data.recordedWrong = false;

    this.setData({
      stepText: (data.index + 1) + ' / ' + data.words.length,
      barPercent: Math.round((data.index / data.words.length) * 100),
      emoji: word.emoji || '🔤',
      zh: word.zh || '',
      lettersText: '共 ' + String(word.w || '').replace(/\s/g, '').length + ' 个字母',
      inputValue: '',
      inputDisabled: false,
      hintDisabled: false,
      showCheck: true,
      showNext: false,
      feedback: { text: '', cls: '' },
      mask: this.maskList()
    });
  },

  maskList() {
    const data = this.spell;
    const word = data.words[data.index];
    const characters = String(word.w || '').split('');
    return characters.map((character, index) => {
      if (character === ' ') return { key: 'm' + index, ch: '', cls: 'space' };
      const shown = index < data.hintLevel;
      return { key: 'm' + index, ch: shown ? character : '', cls: shown ? 'show' : '' };
    });
  },

  shake() {
    this.setData({ shakeCls: 'shake' });
    if (this.shakeTimer) clearTimeout(this.shakeTimer);
    this.shakeTimer = setTimeout(() => { this.setData({ shakeCls: '' }); }, 450);
  },

  onInput(event) {
    this.setData({ inputValue: event.detail.value });
  },

  /* ---------- 提示 ---------- */
  onHint() {
    const data = this.spell;
    if (!data || data.locked) return;
    const word = data.words[data.index];
    const characters = String(word.w || '').split('');
    if (data.hintLevel >= characters.length) {
      U.toast('已经全部提示啦，试着把它拼出来吧！');
      return;
    }
    data.hintLevel += 1;
    if (store.prefs().sound) U.vibrate('light');
    const visible = characters.slice(0, data.hintLevel).join('');
    this.setData({
      mask: this.maskList(),
      feedback: { text: '提示：开头是「' + visible + '」', cls: '' }
    });
  },

  /* ---------- 检查 ---------- */
  onCheck() {
    const data = this.spell;
    if (!data || data.locked || data.finished) return;
    const word = data.words[data.index];
    const answer = this.data.inputValue || '';
    if (!String(answer).trim()) {
      this.shake();
      this.setData({ feedback: { text: '先写下你的答案吧～', cls: '' } });
      return;
    }

    // 平时不区分大小写（小学生还在练手写），设置里可以要求严格一致
    const same = store.prefs().strictCase
      ? String(answer).trim().replace(/\s+/g, ' ') === String(word.w).trim().replace(/\s+/g, ' ')
      : U.normalize(answer) === U.normalize(word.w);

    if (same) {
      data.locked = true;
      data.correct += 1;
      data.earned += 2;
      store.addStars(2);
      store.markWord(word.id, true);
      if (store.prefs().sound) U.vibrate('medium');
      data.hintLevel = String(word.w || '').split('').length;
      data.records.push({ w: word.w, zh: word.zh || '', ok: true });
      this.setData({
        mask: this.maskList(),
        inputDisabled: true,
        hintDisabled: true,
        showCheck: false,
        feedback: { text: '太棒了！' + word.w + ' 拼对啦，+2 ⭐', cls: 'ok' }
      });
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => { this.next(); }, 1250);
      return;
    }

    data.attempts += 1;
    if (store.prefs().sound) U.vibrate('heavy');
    this.shake();
    if (!data.recordedWrong) {
      store.markWord(word.id, false);
      data.recordedWrong = true;
    }

    if (data.attempts >= 2) {
      data.locked = true;
      data.wrong += 1;
      data.hintLevel = String(word.w || '').split('').length;
      data.records.push({ w: word.w, zh: word.zh || '', ok: false });
      this.setData({
        mask: this.maskList(),
        inputDisabled: true,
        hintDisabled: true,
        showCheck: false,
        showNext: true,
        feedback: { text: '正确答案是「' + word.w + '」，读一读，记住它～', cls: 'no' }
      });
    } else {
      data.hintLevel = Math.max(data.hintLevel, 1);
      const first = String(word.w || '').split('')[0];
      this.setData({
        mask: this.maskList(),
        feedback: { text: '再试一次～ 首字母是「' + first + '」哦', cls: 'no' }
      });
    }
  },

  /* ---------- 下一题 ---------- */
  onNext() {
    this.next();
  },

  next() {
    const data = this.spell;
    if (!data || data.finished) return;
    data.index += 1;
    if (data.index >= data.words.length) this.finish();
    else this.render();
  },

  /* ---------- 结算 ---------- */
  finish() {
    const data = this.spell;
    if (!data || data.finished) return;
    data.finished = true;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }

    const total = data.words.length;
    const accuracy = total ? Math.round((data.correct / total) * 100) : 0;
    const rating = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : accuracy >= 40 ? 1 : 0;
    const bonus = rating;
    store.addStars(bonus);
    data.earned += bonus;

    const emoji = rating === 3 ? '✍️' : rating === 2 ? '🌟' : rating === 1 ? '👍' : '🌱';
    const app = getApp();
    app.globalData.lastResult = {
      kind: 'spell',
      unitId: data.unit.id,
      unitName: data.unit.name,
      emoji: emoji,
      total: total,
      correct: data.correct,
      wrong: data.wrong,
      stars: data.earned,
      seconds: 0,
      accuracy: accuracy,
      rating: rating,
      words: data.records
    };
    wx.redirectTo({ url: '/pages/result/result' });
  },

  onBack() {
    const data = this.spell;
    if (data && !data.finished && (data.correct > 0 || data.wrong > 0)) {
      wx.showModal({
        title: '要离开吗？',
        content: '这一轮的成绩还没有结算，退出就丢啦～',
        confirmText: '确定退出',
        cancelText: '继续拼写',
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
