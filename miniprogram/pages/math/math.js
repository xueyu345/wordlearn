/* 数学错题本主页（tab 页）
 * 规则与原网页 index.html 的 renderMathHome / mathFilteredItems / toggleMathDone / deleteMathItem 一致。
 * 数据层统一走 utils/store.js，错题字段为 { q, a, myAnswer, kp, type, why, steps, images, wrongCount, done }。
 */
const store = require('../../utils/store.js');
const U = require('../../utils/util.js');

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'todo', label: '待攻克' },
  { key: 'done', label: '已掌握' }
];

function click() {
  if (store.prefs().sound) U.vibrate('light');
}

// 按知识点分组：待攻克多的排前面
function buildKpList(items) {
  const map = Object.create(null);
  const order = [];
  items.forEach(function (item) {
    const name = item.kp || '未分类';
    if (!map[name]) {
      map[name] = { name: name, total: 0, done: 0 };
      order.push(name);
    }
    map[name].total += 1;
    if (item.done) map[name].done += 1;
  });
  return order.map(function (name) {
    const group = map[name];
    const todo = group.total - group.done;
    const percent = group.total ? Math.round((group.done / group.total) * 100) : 0;
    return {
      name: group.name,
      total: group.total,
      done: group.done,
      todo: todo,
      percent: percent,
      badge: todo === 0 ? '全掌握' : '待攻 ' + todo,
      badgeCls: todo === 0 ? 'pill pill-mint' : 'pill pill-orange'
    };
  }).sort(function (a, b) {
    return (b.todo - a.todo) || (b.total - a.total);
  });
}

function toViewItem(item) {
  const images = Array.isArray(item.images) ? item.images.slice(0, 3) : [];
  const wrong = Number(item.wrongCount) || 1;
  const steps = Array.isArray(item.steps) ? item.steps.filter(Boolean) : [];
  return {
    id: item.id,
    kp: item.kp || '未分类',
    type: item.type || '',
    hasType: Boolean(item.type),
    done: Boolean(item.done),
    cls: item.done ? 'is-done' : '',
    q: item.q || '',
    a: item.a || '',
    hasMyAnswer: Boolean(item.myAnswer),
    myAnswer: item.myAnswer || '',
    hasWhy: Boolean(item.why),
    why: item.why || '',
    hasSteps: steps.length > 0,
    stepsText: steps.join('；'),
    images: images,
    hasImages: images.length > 0,
    hasWrong: wrong > 1,
    wrongText: '错 ' + wrong + ' 次',
    doneIcon: item.done ? '↩️' : '✅',
    doneText: item.done ? '待攻克' : '已掌握'
  };
}

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) wx.navigateBack();
  else wx.switchTab({ url: '/pages/math/math' });
}

Page({
  data: {
    scopeText: '',
    heroSub: '',
    stats: { total: 0, todo: 0, done: 0, percent: 0 },
    kpCountText: '',
    hasKp: false,
    kpList: [],
    reviewOptions: [],
    reviewIndex: 0,
    keyword: '',
    filter: 'all',
    filters: [],
    listCountText: '共 0 道',
    items: [],
    showEmpty: false,
    emptyIcon: '',
    emptyTitle: '',
    emptyText: '',
    canReview: false
  },

  // tab 页：首次进入，以及从表单 / 挑战 / 复习返回时都重新读取
  //（期间年级、教材、错题都可能变了）
  onShow: function () {
    this.refresh();
  },

  refresh: function () {
    const grade = store.getGrade();
    const book = store.getMathBook();
    const meta = store.mathBookMeta(book);
    const stats = store.mathStats();
    const percent = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
    const kpCount = store.mathBookKps(book, grade).length;
    const items = store.mathState().items || [];

    const heroSub = (stats.total
      ? '已经记下 ' + stats.total + ' 道错题，还有 ' + stats.todo + ' 道等着你攻下来。'
      : '把做错的题记下来，按知识点整理，复习时抽题重做。')
      + '（' + U.gradeLabel(grade) + ' · ' + meta.name + ' · ' + kpCount + ' 个知识点）';

    const keyword = U.normalize(this.data.keyword);
    const filter = this.data.filter || 'all';
    const filtered = items.filter(function (item) {
      if (filter === 'todo' && item.done) return false;
      if (filter === 'done' && !item.done) return false;
      if (!keyword) return true;
      const hay = U.normalize([item.q, item.kp, item.type, item.why, item.a, item.myAnswer].join(' '));
      return hay.indexOf(keyword) >= 0;
    }).sort(function (a, b) {
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    const kpList = buildKpList(items);
    const patch = {
      scopeText: U.gradeLabel(grade) + ' · ' + meta.short,
      heroSub: heroSub,
      stats: { total: stats.total, todo: stats.todo, done: stats.done, percent: percent },
      kpCountText: kpList.length ? kpList.length + ' 个分类' : '',
      hasKp: kpList.length > 0,
      kpList: kpList,
      reviewOptions: ['全部知识点'].concat(store.mathKpList()),
      reviewIndex: 0,
      listCountText: '共 ' + items.length + ' 道',
      items: filtered.map(toViewItem),
      canReview: items.length > 0,
      filters: FILTERS.map(function (f) {
        return { key: f.key, label: f.label, cls: f.key === filter ? 'pill pill-purple' : 'pill' };
      })
    };

    patch.showEmpty = items.length > 0 && filtered.length === 0;
    if (patch.showEmpty) {
      patch.emptyIcon = '🔍';
      patch.emptyTitle = '没有符合条件的错题';
      patch.emptyText = '换个关键词，或者把筛选切回「全部」。';
    }
    this.setData(patch);
  },

  onSearch: function (event) {
    this.setData({ keyword: event.detail.value || '' });
    this.refresh();
  },

  onFilter: function (event) {
    const key = event.currentTarget.dataset.key || 'all';
    this.setData({ filter: key });
    click();
    this.refresh();
  },

  // 点知识点卡片 = 把该知识点填进搜索框，只看这一类
  onPickKp: function (event) {
    const kp = event.currentTarget.dataset.kp || '';
    this.setData({ keyword: kp, filter: 'all' });
    click();
    this.refresh();
  },

  onAdd: function () {
    click();
    wx.navigateTo({ url: '/pages/mathForm/mathForm' });
  },

  onSolve: function () {
    click();
    wx.navigateTo({ url: '/pages/mathSolve/mathSolve' });
  },

  onPaper: function () {
    click();
    wx.navigateTo({ url: '/pages/paper/paper?from=math' });
  },

  onStartReview: function (event) {
    const index = Number(event.detail.value) || 0;
    const options = this.data.reviewOptions || [];
    if (index <= 0 || !options[index]) {
      wx.navigateTo({ url: '/pages/mathReview/mathReview?kp=all' });
      return;
    }
    click();
    wx.navigateTo({
      url: '/pages/mathReview/mathReview?kp=' + encodeURIComponent(options[index])
    });
  },

  onToggleDone: function (event) {
    const id = event.currentTarget.dataset.id;
    const done = store.toggleMathDone(id);
    click();
    if (done) U.toast('标记为已掌握，真棒！');
    else U.toast('已放回待攻克，再练练它');
    this.refresh();
  },

  onEdit: function (event) {
    click();
    wx.navigateTo({
      url: '/pages/mathForm/mathForm?id=' + encodeURIComponent(event.currentTarget.dataset.id)
    });
  },

  onDelete: function (event) {
    const id = event.currentTarget.dataset.id;
    const item = store.mathItemById(id);
    if (!item) return;
    wx.showModal({
      title: '删除这道错题',
      content: '确定删除这道错题吗？删除后无法恢复。\n\n' + String(item.q || '').slice(0, 60),
      confirmText: '删除',
      confirmColor: '#EF5B65',
      success: (res) => {
        if (!res.confirm) return;
        (item.images || []).forEach(store.removeImageFile);
        store.deleteMathItem(id);
        click();
        U.toast('已删除');
        this.refresh();
      }
    });
  },

  onPreviewImage: function (event) {
    const id = event.currentTarget.dataset.id;
    const index = Number(event.currentTarget.dataset.index) || 0;
    const item = store.mathItemById(id);
    if (!item) return;
    const urls = (item.images || []).slice();
    if (!urls.length) return;
    wx.previewImage({ current: urls[index] || urls[0], urls: urls });
  }
});
