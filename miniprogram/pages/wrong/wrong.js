/* 英语错词本 */
const store = require('../../utils/store.js');
const U = require('../../utils/util.js');

Page({
  data: {
    hasWords: false,
    count: 0,
    subText: '',
    words: []
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    if (!store.state()) store.init();
    store.ensureDaily();

    const st = store.state();
    // 后进先出：最近错的最先看到
    const list = [];
    for (let i = st.wrong.length - 1; i >= 0; i -= 1) {
      const word = store.wordById(st.wrong[i]);
      if (!word) continue;
      const record = st.learned[word.id] || {};
      list.push({
        id: word.id,
        w: word.w,
        ipa: word.ipa || '',
        zh: word.zh || '',
        emoji: word.emoji || '🔤',
        en: word.en || '',
        cn: word.cn || '',
        wrongCount: Number(record.wrong) || 1
      });
    }

    this.setData({
      hasWords: list.length > 0,
      count: list.length,
      subText: list.length
        ? '这里住着 ' + list.length + ' 个还需要多见面的单词。看一看例句，再点「记住了」把它们送回家。'
        : '太厉害了，目前没有错词！继续去认识新朋友吧。',
      words: list
    });
  },

  click() {
    if (store.prefs().sound) U.vibrate('light');
  },

  /* 记住了：从错词本里移走 */
  removeWrong(event) {
    if (store.prefs().sound) U.vibrate('light');
    store.removeWrongWord(event.currentTarget.dataset.id);
    U.toast('又记住一个，错词本更轻啦！');
    this.refresh();
  },

  goChallenge() {
    this.click();
    if (this.data.count === 0) { U.toast('错词本是空的，先去学几个新单词吧～'); return; }
    wx.navigateTo({ url: '/pages/quiz/quiz?u=wrong' });
  },

  goPaper() {
    this.click();
    if (this.data.count === 0) { U.toast('错词本是空的，先去学几个新单词吧～'); return; }
    wx.navigateTo({ url: '/pages/paper/paper?from=en' });
  },

  goStudy() {
    this.click();
    wx.switchTab({ url: '/pages/english/english' });
  },

  goBack() {
    wx.navigateBack({
      fail: function () {
        wx.switchTab({ url: '/pages/english/english' });
      }
    });
  }
});
