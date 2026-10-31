const U = require('../../utils/util.js');

const PLAY_PATH = {
  learn: '/pages/learn/learn',
  quiz: '/pages/quiz/quiz',
  spell: '/pages/spell/spell',
  match: '/pages/match/match'
};

Page({
  data: {
    ready: false,
    kind: '',
    unitId: '',
    unitName: '',
    emoji: '🎉',
    kicker: 'CHALLENGE COMPLETE',
    title: '',
    desc: '',
    stars: [],
    stats: [],
    words: [],
    backText: '回到主题',
    canRetry: true,
    retryText: '🔄 再来一轮'
  },

  onLoad() {
    this.renderResult();
  },

  onShow() {
    // 从其它页面返回时，若上一轮成绩还在就重新渲染一次
    const app = getApp();
    if (app.globalData.lastResult) this.renderResult();
  },

  renderResult() {
    const app = getApp();
    const result = app.globalData.lastResult;
    if (!result) {
      wx.switchTab({ url: '/pages/english/english' });
      return;
    }

    const kind = result.kind || 'quiz';
    const unitId = result.unitId || '';
    const unitName = result.unitName || '这个主题';
    const total = Number(result.total) || 0;
    const correct = Number(result.correct) || 0;
    const wrongCount = Number(result.wrong) || 0;
    const stars = Number(result.stars) || 0;
    const seconds = Number(result.seconds) || 0;
    const accuracy = result.accuracy != null
      ? Number(result.accuracy)
      : (total ? Math.round((correct / total) * 100) : 0);
    let rating = Number(result.rating);
    if (isNaN(rating)) {
      rating = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : accuracy >= 50 ? 1 : 0;
    }

    let title = '';
    let desc = '';
    let emoji = result.emoji || '🎉';
    let stats = [];
    let backText = '回到主题';

    if (kind === 'learn') {
      const reviewed = result.reviewed != null ? Number(result.reviewed) : total;
      const known = result.known != null ? Number(result.known) : correct;
      title = '卡片学完啦！';
      emoji = '📚';
      desc = '你完成了「' + unitName + '」的 ' + reviewed + ' 张单词卡，认识了 ' + known + ' 个单词。每一次翻卡，都是在给大脑种一颗单词种子。';
      stats = [
        { key: 's1', value: String(reviewed), label: '看过卡片' },
        { key: 's2', value: String(known), label: '认识单词' },
        { key: 's3', value: '+' + stars, label: '获得星星' }
      ];
    } else if (kind === 'quiz') {
      title = rating === 3 ? '满分小冠军！' : rating === 2 ? '干得漂亮！' : rating === 1 ? '完成挑战！' : '再试一次吧！';
      emoji = rating === 3 ? '🏆' : rating === 2 ? '🎉' : rating === 1 ? '👍' : '💪';
      desc = rating === 3
        ? '你答得又快又准，单词们都被你收服啦！'
        : rating === 2
          ? '只差一点点就满分啦，把刚才答错的单词再读一遍吧。'
          : rating === 1
            ? '已经完成一轮挑战！错词本里的单词正在等你回去看它们。'
            : '别着急，先去「学一学」翻翻卡片，再来挑战一次会更有把握。';
      stats = [
        { key: 's1', value: correct + '/' + total, label: '答对题数' },
        { key: 's2', value: accuracy + '%', label: '正确率' },
        { key: 's3', value: '+' + stars, label: '获得星星' }
      ];
      backText = unitId === 'all' ? '返回首页' : unitId === 'wrong' ? '回到错词本' : '回到主题';
    } else if (kind === 'spell') {
      title = rating === 3 ? '拼写小达人！' : rating === 2 ? '拼得不错！' : rating === 1 ? '完成拼写挑战！' : '多练几次就好啦！';
      emoji = rating === 3 ? '✍️' : rating === 2 ? '🌟' : rating === 1 ? '👍' : '🌱';
      desc = rating >= 2
        ? '你拼出了 ' + correct + ' 个单词，字母记得真牢！'
        : '拼写需要多练几遍。看着中文意思，一个字母一个字母地写出来吧。';
      stats = [
        { key: 's1', value: correct + '/' + total, label: '拼对单词' },
        { key: 's2', value: accuracy + '%', label: '正确率' },
        { key: 's3', value: '+' + stars, label: '获得星星' }
      ];
      backText = '回到主题';
    } else if (kind === 'match') {
      const moves = Number(result.moves) || 0;
      title = rating === 3 ? '配对高手！' : rating === 2 ? '全部配对成功！' : '完成配对啦！';
      emoji = rating === 3 ? '🧩' : '🎊';
      desc = '你用了 ' + moves + ' 步、' + U.formatTime(seconds) + ' 完成 ' + total + ' 组配对。英文和中文已经手拉手成为好朋友啦！';
      stats = [
        { key: 's1', value: moves + ' 步', label: '翻牌步数' },
        { key: 's2', value: U.formatTime(seconds), label: '完成用时' },
        { key: 's3', value: '+' + stars, label: '获得星星' }
      ];
      backText = '回到主题';
    }

    const starList = [];
    for (let i = 0; i < 3; i += 1) starList.push({ key: 'st' + i, on: i < rating });

    const words = (result.words || []).map((item, index) => ({
      key: 'w' + index,
      w: item.w || '',
      zh: item.zh || '',
      mark: item.ok ? '✓' : '✗',
      cls: item.ok ? 'ok' : 'no'
    }));

    this.setData({
      ready: true,
      kind: kind,
      unitId: unitId,
      unitName: unitName,
      emoji: emoji,
      kicker: kind === 'learn' ? 'LEARNING COMPLETE' : 'CHALLENGE COMPLETE',
      title: title,
      desc: desc,
      stars: starList,
      stats: stats,
      words: words,
      backText: backText,
      canRetry: !!PLAY_PATH[kind] && !!unitId,
      retryText: '🔄 再来一轮',
      wrongText: wrongCount > 0 ? '错了 ' + wrongCount + ' 个，回错词本再看看它们' : ''
    });
  },

  /* ---------- 出口 ---------- */
  onRetry() {
    const kind = this.data.kind;
    const path = PLAY_PATH[kind];
    if (!path || !this.data.unitId) {
      wx.switchTab({ url: '/pages/english/english' });
      return;
    }
    wx.redirectTo({ url: path + '?u=' + this.data.unitId });
  },

  // 换个玩法：回到主题页，那里有「学一学 / 选一选 / 拼一拼 / 连一连」
  onSwitchMode() {
    const unitId = this.data.unitId;
    if (!unitId || unitId === 'all' || unitId === 'wrong') {
      wx.switchTab({ url: '/pages/english/english' });
      return;
    }
    wx.redirectTo({ url: '/pages/unit/unit?u=' + unitId });
  },

  onBackUnit() {
    const unitId = this.data.unitId;
    if (!unitId || unitId === 'all' || unitId === 'wrong') {
      wx.switchTab({ url: '/pages/english/english' });
      return;
    }
    // 上一页就是主题页时直接返回，否则（比如从「学一学」跳过来的）落到主题页
    const pages = getCurrentPages();
    const prev = pages[pages.length - 2];
    if (prev && prev.route === 'pages/unit/unit') {
      wx.navigateBack({ delta: 1 });
      return;
    }
    wx.redirectTo({ url: '/pages/unit/unit?u=' + unitId });
  },

  onHome() {
    const app = getApp();
    app.globalData.lastResult = null;
    wx.switchTab({ url: '/pages/english/english' });
  }
});
