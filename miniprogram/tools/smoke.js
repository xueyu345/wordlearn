/* 运行时冒烟测试：用 wx 桩在 Node 里真跑一遍状态层和全部页面的生命周期
 * 用法：node tools/smoke.js
 */
const path = require('path');

/* ---------- wx 桩 ---------- */
const storage = {};
const fsFiles = {};
const calls = [];
global.wx = {
  getStorageSync: (k) => (k in storage ? storage[k] : ''),
  setStorageSync: (k, v) => { storage[k] = v; },
  removeStorageSync: (k) => { delete storage[k]; },
  showToast: (o) => calls.push(['toast', o.title]),
  showModal: (o) => { calls.push(['modal', o.title]); if (o.success) o.success({ confirm: true }); },
  showLoading: () => {}, hideLoading: () => {},
  vibrateShort: () => {},
  navigateTo: (o) => calls.push(['navigateTo', o.url]),
  redirectTo: (o) => calls.push(['redirectTo', o.url]),
  switchTab: (o) => calls.push(['switchTab', o.url]),
  navigateBack: () => calls.push(['navigateBack', '']),
  setNavigationBarTitle: () => {},
  stopPullDownRefresh: () => {},
  pageScrollTo: () => {},
  createSelectorQuery: () => ({ select: () => ({ boundingClientRect: () => ({}) }), exec: () => {} }),
  previewImage: () => {},
  chooseMedia: () => {},
  chooseMessageFile: () => {},
  shareFileMessage: () => {},
  setClipboardData: () => {},
  login: (o) => o.success && o.success({ code: 'mock' }),
  getAccountInfoSync: () => ({ miniProgram: { appId: 'wxtest' } }),
  env: { USER_DATA_PATH: '/tmp/user' },
  getFileSystemManager: () => ({
    saveFileSync: (src, dst) => { fsFiles[dst] = src; },
    removeSavedFile: () => {},
    writeFile: () => {},
    readFileSync: () => '{}'
  })
};
global.getApp = () => ({ globalData: { lastResult: null } });
global.__pageConfigs = {};
global.Page = (opts) => { /* 收集交给下面的加载器 */ };

/* ---------- 拦截 cloud.js：不联网、不初始化 SDK ---------- */
const Module = require('module');
const origLoad = Module._load;
Module._load = function (request) {
  // store.js 里写的是 require('./cloud.js')，按文件名结尾匹配，两种写法都要拦住
  if (/cloud\.js$/.test(String(request))) {
    return {
      cloud: {
        auth: {
          getSession: async () => ({ data: null, error: new Error('no session') }),
          onAuthStateChange: () => {}
        },
        database: { from: () => ({ select: async () => ({ data: [], error: null }) }) }
      },
      publicConfig: { endpoint: 'https://example.invalid', publishableKey: 'pk_test' },
      CLOUD_TABLE: 'study_progress'
    };
  }
  return origLoad.apply(this, arguments);
};

/* ---------- 断言 ---------- */
let pass = 0;
const fails = [];
function ok(cond, label) {
  if (cond) { pass += 1; } else { fails.push(label); }
}
function section(name) { console.log('\n## ' + name); }

const store = require('../utils/store.js');
const U = require('../utils/util.js');

/* ============ 1. 状态层 ============ */
section('状态层');
store.init();
ok(store.getGrade() === 3, '默认年级应为三年级，实际 ' + store.getGrade());
ok(store.units().length > 0, '当前年级应有主题，实际 ' + store.units().length);
ok(store.totalWords() > 0, '应有单词，实际 ' + store.totalWords());
ok(store.state().stars === 0, '初始星星应为 0');

const firstUnit = store.units()[0];
ok(!!firstUnit && !!firstUnit.words.length, '第一个主题应有单词');

// 单词学习 + 星星 + 错词
store.markWord(firstUnit.words[0].id, true);
ok(store.state().stars === 0, '答对错词不加星（学一学才加）');
ok(store.learnedCount() === 1, '已学词数应为 1，实际 ' + store.learnedCount());
ok(store.state().daily.words.length === 1, '今日学习词数应为 1');
store.markWord(firstUnit.words[1].id, false);
ok(store.state().wrong.length === 1, '答错应进错词本，实际 ' + store.state().wrong.length);
store.markWord(firstUnit.words[1].id, true);
store.markWord(firstUnit.words[1].id, true);
ok(store.state().wrong.length === 0, '连续答对 2 次应移出错词本，实际 ' + store.state().wrong.length);

store.addStars(5);
ok(store.state().stars === 5, '加星后应为 5，实际 ' + store.state().stars);

// 每日目标达成
const before = store.state().stars;
let guard = 0;
while (store.state().daily.words.length < store.goal() && guard < 40) {
  guard += 1;
  const w = firstUnit.words[guard % firstUnit.words.length];
  store.markWord(w.id, true);
}
ok(store.state().stars > before, '达成每日目标应奖励星星');

// 年级隔离
store.setGrade(5);
ok(store.getGrade() === 5, '应切到五年级');
ok(store.state().stars === 0, '五年级是新档案，星星应为 0，实际 ' + store.state().stars);
ok(store.units().every((u) => u.grade === 5), '五年级只应有五年级主题');
store.setGrade(3);
ok(store.state().stars > 0, '切回三年级应恢复原档案，实际 ' + store.state().stars);

// 教材切换
const enBooks = store.enBooksForGrade(3);
ok(enBooks.length >= 1, '三年级应有可用英语教材');
if (enBooks.length > 1) {
  store.setEnBook(enBooks[1].id);
  ok(store.getEnBook() === enBooks[1].id, '英语教材应切换成功');
  store.setEnBook('general');
}
store.setEnBook('不存在的教材');
ok(store.getEnBook() === 'general', '非法教材应被忽略');

// 偏好
store.setPref('dailyGoal', 15);
ok(store.prefs().dailyGoal === 15, '每日目标应改为 15');
store.setPref('dailyGoal', 999);
ok(store.prefs().dailyGoal === 10, '非法目标应回落默认值 10，实际 ' + store.prefs().dailyGoal);
store.setPref('sound', false);
ok(store.prefs().sound === false, '音效开关应关闭');

/* ============ 2. 数学错题 ============ */
section('数学错题');
ok(store.mathState().items.length === 0, '初始错题应为空');
const item = store.addMathItem({ q: '1+1=?', a: '2', myAnswer: '3', kp: '20 以内加减法', type: '计算题', why: '粗心' });
ok(store.mathState().items.length === 1, '应新增 1 道错题');
ok(store.mathStats().total === 1 && store.mathStats().todo === 1, '统计应为 1 总 / 1 待攻克');
ok(store.toggleMathDone(item.id) === true, '标记掌握应返回 true');
ok(store.mathStats().done === 1, '已攻克应为 1');
ok(store.toggleMathDone(item.id) === false, '再点应取消掌握');
ok(store.mathKpList().indexOf('20 以内加减法') >= 0, '知识点列表应含预设项');
store.addCustomKp('自定义知识点');
ok(store.mathKpList().indexOf('自定义知识点') >= 0, '自定义知识点应进列表');
const updated = store.updateMathItem(item.id, { a: '22' });
ok(updated.a === '22', '修改答案应生效');
store.deleteMathItem(item.id);
ok(store.mathState().items.length === 0, '删除后应为空');

/* ============ 3. 仪表盘快照 ============ */
section('仪表盘快照');
const snap = store.dashboardSnapshot();
ok(snap.trend.length === 14, '趋势应为 14 天，实际 ' + snap.trend.length);
ok(snap.badges.length === 8, '徽章应为 8 枚，实际 ' + snap.badges.length);
ok(snap.units.length === store.units().length, '主题掌握度应覆盖全部主题');
ok(snap.math && typeof snap.math.percent === 'number', '数学统计应有攻克率');
ok(snap.todayPercent >= 0 && snap.todayPercent <= 100, '今日进度应在 0-100');
ok(snap.trend.every((t) => t.height >= 4 && t.height <= 100), '柱状高度应在 4-100');
ok(typeof snap.goal === 'number' && snap.goal > 0, '每日目标应为正数');

/* ============ 4. 备份 / 恢复 / 清空 ============ */
section('备份与恢复');
store.addMathItem({ q: '备份测试题', a: '1', kp: '20 以内加减法' });
const beforeStars = store.state().stars;
const backup = store.backupPayload();
ok(backup.version === 2 && !!backup.profiles, '备份应带 version=2 与 profiles');
store.wipeLocalData();
ok(store.state().stars === 0, '清空后星星应为 0');
store.restorePayload(backup);
ok(store.state().stars === beforeStars, '恢复后星星应还原，实际 ' + store.state().stars + ' 期望 ' + beforeStars);
ok(store.mathState().items.some((i) => i.q === '备份测试题'), '恢复后错题应还原');
ok(typeof store.localDataStats().text === 'string', '本机数据统计应可读');

/* ============ 5. 题库 ============ */
section('数学题库');
const BANK = require('../utils/math-problems.js');
[1, 2, 3, 4, 5, 6].forEach((g) => {
  const set = BANK.makeSet({ grade: g, kp: '', count: 5 });
  ok(set.length > 0, g + ' 年级应能出题，实际 ' + set.length);
  ok(set.every((q) => q.q && q.a && Array.isArray(q.steps)), g + ' 年级每道题应有题干/答案/解析步骤');
});
// checkAnswer(学生答案, 题目对象) —— 第二参是题目，不是数组
ok(BANK.checkAnswer('0.5', { a: '1/2', accept: ['1/2'] }), '1/2 与 0.5 应判定为同一个答案');
ok(BANK.checkAnswer('18厘米', { a: '18', accept: ['18'] }), '带单位应判定正确');
ok(BANK.checkAnswer('１', { a: '1', accept: ['1'] }), '全角数字应判定正确');
ok(!BANK.checkAnswer('7', { a: '18', accept: ['18'] }), '错误答案不应判定为正确');

/* ============ 6. 页面生命周期 ============ */
section('页面生命周期');
const pageFiles = [
  ['dashboard', {}], ['english', {}], ['math', {}], ['mine', {}], ['account', {}],
  ['unit', { u: firstUnit.id }],
  ['learn', { u: firstUnit.id }],
  ['quiz', { u: firstUnit.id }],
  ['quiz', { u: 'all' }],
  ['spell', { u: firstUnit.id }],
  ['match', { u: firstUnit.id }],
  ['wrong', {}],
  ['result', {}],
  ['mathForm', {}],
  ['mathReview', { kp: 'all' }],
  ['mathSolve', {}]
];
// 结算页需要上一轮成绩
getApp().globalData.lastResult = {
  kind: 'quiz', unitId: firstUnit.id, unitName: firstUnit.name, emoji: firstUnit.emoji,
  total: 5, correct: 4, wrong: 1, stars: 7, seconds: 42, rating: 2,
  words: [{ w: 'cat', zh: '猫', ok: true }]
};

global.Page = function (opts) { global.__pageConfigs[global.__loading] = opts; };
pageFiles.forEach(([name, query]) => {
  const file = path.resolve(__dirname, '../pages', name, name + '.js');
  global.__loading = name + JSON.stringify(query);
  let opts = null;
  try {
    delete require.cache[require.resolve(file)];
    require(file);
    opts = global.__pageConfigs[global.__loading];
  } catch (e) {
    fails.push('页面 ' + name + ' 加载抛错：' + e.message);
    return;
  }
  ok(!!opts, '页面 ' + name + ' 应定义 Page 配置');
  if (!opts) return;
  // 构造实例并跑 onLoad / onShow
  const inst = Object.assign({
    data: JSON.parse(JSON.stringify(opts.data || {})),
    setData(obj) { Object.assign(this.data, obj); }
  }, opts);
  let stage = 'onLoad';
  try {
    if (opts.onLoad) opts.onLoad.call(inst, query);
    stage = 'onShow';
    if (opts.onShow) opts.onShow.call(inst);
    stage = 'onReady';
    if (opts.onReady) opts.onReady.call(inst);
    stage = 'onUnload';
    if (opts.onUnload) opts.onUnload.call(inst);
    ok(true, '页面 ' + name + ' 生命周期通过');
  } catch (e) {
    fails.push('页面 ' + name + ' ' + stage + ' 抛错：' + e.message);
  }
});

/* ---------- 结果 ---------- */
console.log('\n----------------------------------------');
console.log('通过断言：' + pass);
if (fails.length) {
  console.log('失败 ' + fails.length + ' 项：');
  fails.forEach((f) => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('✅ 全部通过');
