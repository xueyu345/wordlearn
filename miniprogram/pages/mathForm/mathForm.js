/* 记一道错题 / 修改错题
 * 规则与原网页 index.html 的 setupMathForm / pickPreferredKp / submitMathForm 一致，
 * 只是图片改成 wx.chooseMedia + store.saveImageFile（不再用 dataURL / canvas 压缩）。
 */
const store = require('../../utils/store.js');
const U = require('../../utils/util.js');

const MATH_TYPES = ['计算题', '应用题', '概念判断', '图形几何', '单位换算', '其他'];
const NEW_KP = '＋ 新建知识点';
const MAX_IMAGES = 3;

function click() {
  if (store.prefs().sound) U.vibrate('light');
}

// 新建时优先选「还有待攻克错题」的知识点里出现最多的那个，其次是预设第一个
function pickPreferredKp(unfinished) {
  const counts = Object.create(null);
  const order = [];
  (unfinished || []).forEach(function (item) {
    const key = item.kp || '未分类';
    if (counts[key] === undefined) {
      counts[key] = 0;
      order.push(key);
    }
    counts[key] += 1;
  });
  order.sort(function (a, b) { return counts[b] - counts[a]; });
  if (order.length) return order[0];
  const preset = store.mathPresetKps();
  return preset[0] || '';
}

function isPresetKp(kp, preset) {
  return preset.indexOf(kp) >= 0;
}

Page({
  data: {
    title: '记一道错题',
    saveText: '保存到错题本',
    q: '',
    a: '',
    myAnswer: '',
    why: '',
    kpOptions: [],
    kpIndex: 0,
    kpLabel: '',
    showNewKp: false,
    newKp: '',
    typeOptions: ['不填'].concat(MATH_TYPES),
    typeIndex: 0,
    typeLabel: '不填',
    images: [],
    hasImages: false,
    qCls: '',
    newKpCls: ''
  },

  onLoad: function (query) {
    const id = (query && query.id) || '';
    this.itemId = id;
    this.preset = store.mathPresetKps();
    const item = id ? store.mathItemById(id) : null;
    const items = store.mathState().items || [];

    const kpOptions = store.mathKpList().slice();
    let kpIndex = 0;
    if (item) {
      let index = kpOptions.indexOf(item.kp);
      if (index < 0) {
        kpOptions.unshift(item.kp || '未分类');
        index = 0;
      }
      kpIndex = index;
    } else {
      const preferred = pickPreferredKp(items.filter(function (entry) { return !entry.done; }));
      const index = kpOptions.indexOf(preferred);
      kpIndex = index >= 0 ? index : 0;
    }
    kpOptions.push(NEW_KP);

    const typeOptions = this.data.typeOptions;
    let typeIndex = 0;
    if (item && item.type) {
      const index = typeOptions.indexOf(item.type);
      if (index > 0) typeIndex = index;
    }

    const images = item && Array.isArray(item.images) ? item.images.slice(0, MAX_IMAGES) : [];
    // 图片文件的删除要等真正保存了才做：本次摘掉的旧图先记着，本次新选的图先存着
    this.pendingRemove = [];   // 原本属于这道题、本次被摘掉的路径（保存成功才删文件）
    this.pendingAdd = [];      // 本次新选进来的路径（放弃编辑时要删文件，避免孤儿）

    this.setData({
      title: item ? '修改这道错题' : '记一道错题',
      saveText: item ? '保存修改' : '保存到错题本',
      q: item ? (item.q || '') : '',
      a: item ? (item.a || '') : '',
      myAnswer: item ? (item.myAnswer || '') : '',
      why: item ? (item.why || '') : '',
      kpOptions: kpOptions,
      kpIndex: kpIndex,
      kpLabel: kpOptions[kpIndex] || '',
      showNewKp: kpOptions[kpIndex] === NEW_KP,
      newKp: '',
      typeIndex: typeIndex,
      typeLabel: typeOptions[typeIndex],
      images: images,
      hasImages: images.length > 0,
      qCls: '',
      newKpCls: ''
    });
    wx.setNavigationBarTitle({ title: item ? '修改错题' : '记一道错题' });
  },

  onField: function (event) {
    const key = event.currentTarget.dataset.key;
    const value = event.detail.value || '';
    const patch = {};
    patch[key] = value;
    if (key === 'q') patch.qCls = '';
    if (key === 'newKp') patch.newKpCls = '';
    this.setData(patch);
  },

  onKpChange: function (event) {
    const index = Number(event.detail.value) || 0;
    const options = this.data.kpOptions;
    const picked = options[index] || '';
    this.setData({
      kpIndex: index,
      kpLabel: picked,
      showNewKp: picked === NEW_KP
    });
  },

  onTypeChange: function (event) {
    const index = Number(event.detail.value) || 0;
    const options = this.data.typeOptions;
    this.setData({ typeIndex: index, typeLabel: options[index] });
  },

  onChooseImage: function () {
    const remain = MAX_IMAGES - this.data.images.length;
    if (remain <= 0) {
      U.toast('最多只能放 ' + MAX_IMAGES + ' 张图片哦');
      return;
    }
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const files = (res && res.tempFiles) || [];
        const list = this.data.images.slice();
        files.forEach((file) => {
          if (list.length >= MAX_IMAGES) return;
          const saved = store.saveImageFile(file.tempFilePath);
          list.push(saved);
          this.pendingAdd.push(saved);
        });
        this.setData({ images: list, hasImages: list.length > 0 });
      },
      fail: () => { /* 用户取消，不提示 */ }
    });
  },

  onRemoveImage: function (event) {
    const index = Number(event.currentTarget.dataset.index) || 0;
    const list = this.data.images.slice();
    const removed = list.splice(index, 1);
    if (!removed.length) return;
    const path = removed[0];
    const added = this.pendingAdd.indexOf(path);
    if (added >= 0) {
      // 本次才选进来的，档案里没人引用它，可以立刻删掉文件
      this.pendingAdd.splice(added, 1);
      store.removeImageFile(path);
    } else {
      // 原本就属于这道题：先只从表单里摘掉，等保存成功再删文件
      this.pendingRemove.push(path);
    }
    this.setData({ images: list, hasImages: list.length > 0 });
  },

  onPreviewImage: function (event) {
    const index = Number(event.currentTarget.dataset.index) || 0;
    const urls = this.data.images.slice();
    if (!urls.length) return;
    wx.previewImage({ current: urls[index] || urls[0], urls: urls });
  },

  onCancel: function () {
    click();
    this.discardPending();
    const pages = getCurrentPages();
    if (pages.length > 1) wx.navigateBack();
    else wx.switchTab({ url: '/pages/math/math' });
  },

  // 放弃本次编辑：只清理「本次新选」的图片文件（还没人引用，留着就是孤儿）
  // pendingRemove 里的旧图绝不能删——档案里那道题还在引用它们
  discardPending: function () {
    (this.pendingAdd || []).forEach(function (path) { store.removeImageFile(path); });
    this.pendingAdd = [];
    this.pendingRemove = [];
  },

  onUnload: function () {
    this.discardPending();
  },

  onSubmit: function () {
    const q = String(this.data.q || '').trim();
    const a = String(this.data.a || '').trim();
    const myAnswer = String(this.data.myAnswer || '').trim();
    const why = String(this.data.why || '').trim();

    let kp = this.data.kpOptions[this.data.kpIndex] || '';
    if (kp === NEW_KP) {
      kp = String(this.data.newKp || '').trim();
      if (!kp) {
        this.setData({ newKpCls: 'invalid' });
        U.toast('先填一下新知识点的名字');
        return;
      }
    }

    if (!q) {
      this.setData({ qCls: 'invalid' });
      U.toast('题目不能空着，至少写上题目内容');
      return;
    }
    if (!kp) {
      U.toast('请选择一个知识点');
      return;
    }

    const type = this.data.typeIndex > 0 ? this.data.typeOptions[this.data.typeIndex] : '';
    const images = this.data.images.slice();

    if (this.itemId && store.mathItemById(this.itemId)) {
      store.updateMathItem(this.itemId, {
        q: q, a: a, myAnswer: myAnswer, kp: kp, type: type, why: why, images: images
      });
      U.toast('修改已保存');
    } else {
      store.addMathItem({
        q: q, a: a, myAnswer: myAnswer, kp: kp, type: type, why: why, images: images, steps: []
      });
      U.toast('已记进错题本，之后在复习里再练它 💪');
    }

    if (!isPresetKp(kp, this.preset)) store.addCustomKp(kp);

    // 已经写进档案了：这次摘掉的旧图才真正没人引用，可以删文件了
    (this.pendingRemove || []).forEach(function (path) { store.removeImageFile(path); });
    this.pendingRemove = [];
    this.pendingAdd = [];

    click();
    const pages = getCurrentPages();
    if (pages.length > 1) wx.navigateBack();
    else wx.switchTab({ url: '/pages/math/math' });
  }
});
