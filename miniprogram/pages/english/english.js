/* 英语单词主页：档案摘要 + 每日目标 + 主题列表 + 玩法入口 */
const store = require('../../utils/store.js');
const U = require('../../utils/util.js');

const MODES = [
  { key: 'learn', name: '学一学', desc: '翻卡片，认识新单词', emoji: '🃏', color: '#FF8A3D', soft: '#FFF0E3', path: '/pages/learn/learn' },
  { key: 'quiz', name: '选一选', desc: '四选一，检验记得牢不牢', emoji: '🎯', color: '#7057F5', soft: '#F0ECFF', path: '/pages/quiz/quiz' },
  { key: 'spell', name: '拼一拼', desc: '看中文，亲手拼出单词', emoji: '🔤', color: '#27B8A8', soft: '#E3FAF6', path: '/pages/spell/spell' },
  { key: 'match', name: '连一连', desc: '英文中文配配对', emoji: '🧩', color: '#F45D9E', soft: '#FFEAF5', path: '/pages/match/match' }
];

/* 今日推荐主题：优先学得最少的那个，学过的数量一样就随机挑一个 */
function pickDailyUnit() {
  const units = store.units();
  if (!units.length) return null;
  const ranked = units.map((unit) => ({
    unit: unit,
    ratio: store.unitLearned(unit) / unit.words.length,
    learned: store.unitLearned(unit),
    rand: Math.random()
  })).sort((a, b) => {
    if (a.ratio !== b.ratio) return a.ratio - b.ratio;
    if (a.learned !== b.learned) return a.learned - b.learned;
    return a.rand - b.rand;
  });
  return ranked[0].unit;
}

Page({
  data: {
    gradeLabel: '',
    bookName: '',
    goal: 10,
    goalNum: 0,
    goalPercent: 0,
    goalTitle: '',
    goalSub: '',
    streak: 0,
    learnedTotal: 0,
    allTotal: 0,
    mastery: 0,
    wrongCount: 0,
    unitHint: '',
    mixedHint: '',
    weekDots: [],
    dailyUnit: null,
    modes: MODES,
    units: []
  },

  onShow() {
    this.refresh();
  },

  onPullDownRefresh() {
    this.refresh();
    wx.stopPullDownRefresh();
  },

  refresh() {
    if (!store.state()) store.init();
    store.ensureDaily();

    const st = store.state();
    const goal = store.goal() > 0 ? store.goal() : 10;
    const count = Math.min(st.daily.words.length, goal);
    const percent = Math.round((count / goal) * 100);
    const meta = store.enBookMeta(store.getEnBook());
    const learnedTotal = store.learnedCount();
    const allTotal = store.totalWords();

    // 最近七天打卡圆点
    const labels = ['日', '一', '二', '三', '四', '五', '六'];
    const weekDots = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - offset);
      const key = U.dateKey(date);
      weekDots.push({
        label: labels[date.getDay()],
        done: (st.history[key] || 0) > 0,
        today: offset === 0
      });
    }

    const units = store.units().map((unit) => {
      const learned = store.unitLearned(unit);
      const total = unit.words.length;
      const unitPercent = total ? Math.round((learned / total) * 100) : 0;
      return {
        id: unit.id,
        name: unit.name,
        en: unit.en || '',
        emoji: unit.emoji,
        count: total,
        learned: learned,
        percent: unitPercent,
        tipText: unitPercent >= 100 ? '完成 🎉' : '继续加油',
        cardStyle: 'background:' + unit.soft + ';border-color:' + unit.color + ';',
        barStyle: 'width:' + unitPercent + '%;background:' + unit.color + ';'
      };
    });

    const daily = pickDailyUnit();
    const dailyUnit = daily ? {
      id: daily.id,
      name: daily.name,
      en: daily.en || '',
      emoji: daily.emoji,
      count: daily.words.length,
      learned: store.unitLearned(daily),
      cardStyle: 'background:' + daily.soft + ';border-color:' + daily.color + ';'
    } : null;

    this.setData({
      gradeLabel: U.gradeLabel(store.getGrade()),
      bookName: meta ? meta.name : '全国通用版',
      goal: goal,
      goalNum: count,
      goalPercent: Math.min(100, percent),
      goalTitle: count >= goal ? '今日目标完成啦！' : '还差 ' + (goal - count) + ' 个单词',
      goalSub: count >= goal ? '星星已经装进口袋，明天继续加油～' : '学单词、做挑战都算数哦',
      streak: store.currentStreak(),
      learnedTotal: learnedTotal,
      allTotal: allTotal,
      mastery: allTotal ? Math.round((learnedTotal / allTotal) * 100) : 0,
      wrongCount: st.wrong.length,
      unitHint: units.length + ' 个有趣的主题，' + allTotal + ' 个小学高频单词',
      mixedHint: '从全部 ' + allTotal + ' 个单词里随机抽题，看看你有多厉害！',
      weekDots: weekDots,
      dailyUnit: dailyUnit,
      units: units
    });
  },

  click() {
    if (store.prefs().sound) U.vibrate('light');
  },

  startDaily() {
    this.click();
    const unit = pickDailyUnit();
    if (!unit) { U.toast('还没有可用的主题'); return; }
    wx.navigateTo({ url: '/pages/learn/learn?u=' + unit.id });
  },

  openUnit(event) {
    this.click();
    const id = event.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/unit/unit?u=' + id });
  },

  /* 四个玩法都用「今日推荐主题」开局，没有推荐主题就退回混合模式 */
  openMode(event) {
    this.click();
    const path = event.currentTarget.dataset.path;
    const key = event.currentTarget.dataset.key;
    const unit = pickDailyUnit();
    if (!unit) {
      if (key === 'quiz') {
        wx.navigateTo({ url: '/pages/quiz/quiz?u=all' });
        return;
      }
      U.toast('还没有可用的主题');
      return;
    }
    wx.navigateTo({ url: path + '?u=' + unit.id });
  },

  goMixed() {
    this.click();
    wx.navigateTo({ url: '/pages/quiz/quiz?u=all' });
  },

  goWrongQuiz() {
    this.click();
    if (store.state().wrong.length === 0) { U.toast('错词本是空的，先去学几个新单词吧～'); return; }
    wx.navigateTo({ url: '/pages/quiz/quiz?u=wrong' });
  },

  goWrongBook() {
    this.click();
    wx.navigateTo({ url: '/pages/wrong/wrong' });
  },

  goDashboard() {
    this.click();
    wx.switchTab({ url: '/pages/dashboard/dashboard' });
  }
});
