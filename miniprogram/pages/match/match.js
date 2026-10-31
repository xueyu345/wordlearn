const store = require('../../utils/store.js');
const U = require('../../utils/util.js');

const MAX_PAIRS = 6;

Page({
  data: {
    title: '',
    pairsText: '0 / 0',
    moves: 0,
    timeText: '00:00',
    cards: []
  },

  onLoad(query) {
    this.timer = null;
    this.flipTimer = null;
    this.match = null;
    this.start((query && query.u) || '');
  },

  onUnload() {
    this.stopTimer();
    if (this.flipTimer) { clearTimeout(this.flipTimer); this.flipTimer = null; }
    this.match = null;
  },

  /* ---------- 开局 ---------- */
  start(unitId) {
    const unit = store.getUnit(unitId);
    if (!unit) {
      wx.switchTab({ url: '/pages/english/english' });
      return;
    }
    const words = (unit.words || []).slice();
    if (words.length < 2) {
      U.toast('这个主题单词太少啦，换个主题试试～');
      wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/english/english' }) });
      return;
    }
    // 最多 6 组（12 张牌），题量也跟随「每轮题目数量」设置
    const count = Math.max(2, Math.min(store.prefs().roundSize, MAX_PAIRS, words.length));
    const picked = U.shuffle(words).slice(0, count);
    const cards = [];
    picked.forEach((word, index) => {
      cards.push({ pair: index, side: 'en', text: word.w, emoji: '' });
      cards.push({ pair: index, side: 'zh', text: word.zh || '', emoji: word.emoji || '' });
    });
    this.match = {
      unit: unit,
      words: picked,
      cards: cards,
      flipped: [],
      matchedPairs: 0,
      moves: 0,
      seconds: 0,
      started: false,
      locked: false,
      finished: false
    };
    this.setData({
      title: unit.name,
      pairsText: '0 / ' + picked.length,
      moves: 0,
      timeText: '00:00',
      cards: this.cardList()
    });
  },

  cardList() {
    const data = this.match;
    return data.cards.map((card, index) => ({
      key: 'c' + index,
      side: card.side,
      text: card.text,
      emoji: card.emoji,
      state: card.state || ''
    }));
  },

  /* ---------- 计时器 ---------- */
  startTimer() {
    const data = this.match;
    if (!data || data.started) return;
    data.started = true;
    this.stopTimer();
    this.timer = setInterval(() => {
      if (!this.match || this.match.finished) return;
      this.match.seconds += 1;
      this.setData({ timeText: U.formatTime(this.match.seconds) });
    }, 1000);
  },

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  /* ---------- 翻牌 ---------- */
  onCardTap(event) {
    const data = this.match;
    if (!data || data.locked || data.finished) return;
    const index = Number(event.currentTarget.dataset.index);
    if (isNaN(index)) return;
    const card = data.cards[index];
    if (!card || card.state) return;

    this.startTimer();
    card.state = 'flipped';
    data.flipped.push(index);
    this.setData({ cards: this.cardList() });

    if (data.flipped.length < 2) return;

    data.moves += 1;
    const firstIndex = data.flipped[0];
    const secondIndex = data.flipped[1];
    const firstCard = data.cards[firstIndex];
    const secondCard = data.cards[secondIndex];
    data.locked = true;
    this.setData({ moves: data.moves });

    if (firstCard.pair === secondCard.pair && firstCard.side !== secondCard.side) {
      if (store.prefs().sound) U.vibrate('medium');
      if (this.flipTimer) clearTimeout(this.flipTimer);
      this.flipTimer = setTimeout(() => {
        if (!this.match || this.match !== data) return;
        firstCard.state = 'matched';
        secondCard.state = 'matched';
        data.matchedPairs += 1;
        data.flipped = [];
        data.locked = false;
        this.setData({
          cards: this.cardList(),
          pairsText: data.matchedPairs + ' / ' + data.words.length
        });
        if (data.matchedPairs >= data.words.length) this.finish();
      }, 430);
    } else {
      if (store.prefs().sound) U.vibrate('heavy');
      firstCard.state = 'mismatch';
      secondCard.state = 'mismatch';
      this.setData({ cards: this.cardList() });
      if (this.flipTimer) clearTimeout(this.flipTimer);
      this.flipTimer = setTimeout(() => {
        if (!this.match || this.match !== data) return;
        firstCard.state = '';
        secondCard.state = '';
        data.flipped = [];
        data.locked = false;
        this.setData({ cards: this.cardList() });
      }, 850);
    }
  },

  /* ---------- 结算 ---------- */
  finish() {
    const data = this.match;
    if (!data || data.finished) return;
    data.finished = true;
    this.stopTimer();
    if (this.flipTimer) { clearTimeout(this.flipTimer); this.flipTimer = null; }

    const moves = data.moves;
    const rating = moves <= 8 ? 3 : moves <= 11 ? 2 : 1;
    const earned = rating * 2;
    store.addStars(earned);
    if (store.prefs().sound) U.vibrate('medium');

    const app = getApp();
    app.globalData.lastResult = {
      kind: 'match',
      unitId: data.unit.id,
      unitName: data.unit.name,
      emoji: rating === 3 ? '🧩' : '🎊',
      total: data.words.length,
      correct: data.words.length,
      wrong: 0,
      stars: earned,
      seconds: data.seconds,
      moves: moves,
      rating: rating,
      words: data.words.map((word) => ({ w: word.w, zh: word.zh || '', ok: true }))
    };
    wx.redirectTo({ url: '/pages/result/result' });
  },

  onBack() {
    const data = this.match;
    if (data && !data.finished && data.moves > 0) {
      wx.showModal({
        title: '要离开吗？',
        content: '这一轮还没有配对完，退出就丢啦～',
        confirmText: '确定退出',
        cancelText: '继续配对',
        success: (res) => { if (res.confirm) this.goBack(); }
      });
      return;
    }
    this.goBack();
  },

  goBack() {
    this.stopTimer();
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/english/english' });
      }
    });
  }
});
