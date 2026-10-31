/* 玩法流程测试：把每个玩法真的“点”到结束态，断言可观测结果（星星 / 存档 / 跳转 / lastResult）
 * 用法：node tools/flow-test.js
 *
 * 与 smoke.js 的分工：
 *   smoke.js  = 状态层 + 页面生命周期能不能跑起来
 *   本文件    = 玩法流程能不能真的玩通、结果对不对
 */
const path = require('path');
const fs = require('fs');

/* =========================================================
   1. wx 桩
   ========================================================= */
const storage = {};
const calls = [];
global.wx = {
  getStorageSync: (k) => (k in storage ? storage[k] : ''),
  setStorageSync: (k, v) => { storage[k] = v; calls.push(['setStorageSync', k]); },
  removeStorageSync: (k) => { delete storage[k]; },
  showToast: (o) => calls.push(['toast', o.title]),
  showModal: (o) => {
    calls.push(['modal', o.title]);
    if (o.success) o.success({ confirm: true });
  },
  showLoading: () => {}, hideLoading: () => {},
  vibrateShort: () => {},
  navigateTo: (o) => calls.push(['navigateTo', o.url]),
  redirectTo: (o) => calls.push(['redirectTo', o.url]),
  switchTab: (o) => calls.push(['switchTab', o.url]),
  navigateBack: (o) => calls.push(['navigateBack', (o && o.delta) || 1]),
  setNavigationBarTitle: (o) => calls.push(['navTitle', o.title]),
  stopPullDownRefresh: () => {},
  pageScrollTo: () => {},
  createSelectorQuery: () => ({ select: () => ({ boundingClientRect: () => ({}) }), exec: () => {} }),
  previewImage: () => {},
  chooseMedia: () => {},
  chooseMessageFile: () => {},
  shareFileMessage: () => {},
  setClipboardData: () => {},
  login: (o) => o.success && o.success({ code: 'mock-code' }),
  getAccountInfoSync: () => ({ miniProgram: { appId: 'wxtest' } }),
  env: { USER_DATA_PATH: '/tmp/user' },
  getFileSystemManager: () => ({
    saveFileSync: () => {},
    removeSavedFile: () => {},
    writeFile: () => {},
    readFileSync: () => '{}'
  })
};

const app = { globalData: { lastResult: null }, authReady: null };
global.getApp = () => app;
global.getCurrentPages = () => [{ route: 'pages/math/math' }, { route: 'pages/other/other' }];

/* =========================================================
   2. 假定时器：页面里的 setTimeout 全部进队列，由测试手动推进
   ========================================================= */
const timerQueue = [];
let timerSeq = 0;
global.setTimeout = function (fn) {
  timerSeq += 1;
  timerQueue.push({ id: timerSeq, fn: fn });
  return timerSeq;
};
global.clearTimeout = function (id) {
  for (let i = 0; i < timerQueue.length; i += 1) {
    if (timerQueue[i].id === id) { timerQueue.splice(i, 1); return; }
  }
};
global.setInterval = function () { timerSeq += 1; return timerSeq; };
global.clearInterval = function () {};

function flushTimers(limit) {
  let rounds = 0;
  const max = limit || 400;
  while (timerQueue.length && rounds < max) {
    rounds += 1;
    const batch = timerQueue.splice(0, timerQueue.length);
    batch.forEach((t) => t.fn());
  }
  return rounds;
}

/* =========================================================
   3. cloud 桩：不联网，并记录所有鉴权请求
   ========================================================= */
const cloudCalls = { sendOtp: 0, verifyOtp: 0, signInWithWechat: 0, signOut: 0 };
const Module = require('module');
const origLoad = Module._load;
Module._load = function (request) {
  // store.js 里是 './cloud.js'，页面里是 '../../utils/cloud.js'，两种写法都要拦掉，
  // 否则会真的加载 SDK 并初始化（还可能发出网络请求）
  if (/(^|\/|\\)cloud\.js$/i.test(String(request))) {
    return {
      cloud: {
        auth: {
          getSession: async () => ({ data: null, error: new Error('no session') }),
          onAuthStateChange: () => {},
          sendOtp: async (params) => {
            cloudCalls.sendOtp += 1;
            return { data: { verificationId: 'vid-mock', isExistingUser: false }, error: null };
          },
          verifyOtp: async (params) => {
            cloudCalls.verifyOtp += 1;
            if (params.token !== '123456') {
              return { data: null, error: new Error('验证码不对或已过期') };
            }
            return { data: { user: { id: 'u1', phone: params.phone, provider: 'phone' } }, error: null };
          },
          signInWithWechat: async () => {
            cloudCalls.signInWithWechat += 1;
            return { data: null, error: new Error('mock fail') };
          },
          signOut: async () => { cloudCalls.signOut += 1; return { error: null }; }
        },
        database: {
          from: () => ({
            select: async () => ({ data: [], error: null }),
            upsert: async () => ({ data: null, error: null })
          })
        }
      },
      publicConfig: { endpoint: 'https://example.invalid', publishableKey: 'pk_test' },
      CLOUD_TABLE: 'study_progress'
    };
  }
  return origLoad.apply(this, arguments);
};

/* =========================================================
   4. 断言 / 页面加载 / 实例构造
   ========================================================= */
let pass = 0;
const fails = [];
let currentSection = '';
function section(name) { currentSection = name; console.log('\n## ' + name); }
function ok(cond, label) {
  if (cond) { pass += 1; console.log('  ✓ ' + label); }
  else { fails.push('[' + currentSection + '] ' + label); console.log('  ✗ ' + label); }
}

function setPath(target, dotted, value) {
  const keys = String(dotted).replace(/\[(\d+)\]/g, '.$1').split('.').filter((s) => s !== '');
  let cur = target;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const k = keys[i];
    if (cur[k] === null || cur[k] === undefined) cur[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
}

function loadPage(name) {
  const file = path.resolve(__dirname, '../pages', name, name + '.js');
  let captured = null;
  global.Page = function (opts) { captured = opts; };
  delete require.cache[require.resolve(file)];
  require(file);
  if (!captured) throw new Error('页面 ' + name + ' 没有定义 Page 配置');
  return captured;
}

function makeInstance(opts) {
  const inst = {
    data: JSON.parse(JSON.stringify(opts.data || {})),
    setData(patch) {
      Object.keys(patch).forEach((k) => setPath(this.data, k, patch[k]));
    }
  };
  Object.keys(opts).forEach((key) => {
    if (typeof opts[key] === 'function') inst[key] = opts[key].bind(inst);
  });
  return inst;
}

function navTo(kind) {
  for (let i = calls.length - 1; i >= 0; i -= 1) {
    if (calls[i][0] === kind) return calls[i][1];
  }
  return null;
}
function lastToast() {
  for (let i = calls.length - 1; i >= 0; i -= 1) {
    if (calls[i][0] === 'toast') return calls[i][1];
  }
  return null;
}

/* =========================================================
   5. 起手式
   ========================================================= */
const store = require('../utils/store.js');
const U = require('../utils/util.js');
const BANK = require('../utils/math-problems.js');
store.init();

function resetStore() {
  store.wipeLocalData();
  store.setGrade(3);
  store.setEnBook('general');
  store.setMathBook('general');
  store.setPref('dailyGoal', 20); // 关掉「达成每日目标 +5 星」的干扰
  store.setPref('roundSize', 10);
  store.setPref('sound', false);
  app.globalData.lastResult = null;
  calls.length = 0;
  timerQueue.length = 0;
}

let bigUnit = null;
store.units().forEach((u) => {
  if (!bigUnit || (u.words || []).length > (bigUnit.words || []).length) bigUnit = u;
});
const unitId = bigUnit.id;

/* 结算页能不能真的消费上一轮的 lastResult（端到端闭环） */
function assertResultRenders(kind) {
  const r = app.globalData.lastResult;
  const inst = makeInstance(loadPage('result'));
  inst.onLoad();
  ok(inst.data.ready === true, kind + ' 结算页应能渲染 lastResult');
  ok(inst.data.kind === kind, kind + ' 结算页 kind 应一致，实际 ' + inst.data.kind);
  ok((inst.data.stats || []).length === 3, kind + ' 结算页应有 3 项统计，实际 ' + (inst.data.stats || []).length);
  ok((inst.data.words || []).length === (r.words || []).length, kind + ' 结算页应列出全部明细');
  ok(String(inst.data.title).length > 0, kind + ' 结算页应有标题，实际 ' + JSON.stringify(inst.data.title));
  ok(String(inst.data.desc).length > 0, kind + ' 结算页应有描述文案');
}

/* =========================================================
   流程 1：选一选 quiz
   ========================================================= */
function quizAllCorrect() {
  section('选一选 · 全答对');
  resetStore();
  const inst = makeInstance(loadPage('quiz'));
  inst.onLoad({ u: unitId });

  ok(!!inst.quiz && inst.quiz.words.length > 0, '开局应有题目，实际 ' + (inst.quiz ? inst.quiz.words.length : 0));
  ok(inst.data.options.length === 4, '每题应有 4 个选项，实际 ' + inst.data.options.length);
  const labels = inst.data.options.map((o) => o.label);
  ok(new Set(labels).size === labels.length, '4 个选项不应重复：' + labels.join(' | '));
  const correctLabel = inst.quiz.options[inst.quiz.correctIndex].label;
  ok(labels.indexOf(correctLabel) >= 0, '选项里必须包含正确答案「' + correctLabel + '」');
  ok(labels.every((l) => String(l).length > 0), '选项不应有空文本');

  const total = inst.quiz.words.length;
  let guard = 0;
  let prevCorrect = 0;
  while (inst.quiz && !inst.quiz.finished && guard < 40) {
    guard += 1;
    const starsBefore = store.state().stars;
    inst.onSelect({ currentTarget: { dataset: { index: String(inst.quiz.correctIndex) } } });
    if (store.state().stars !== starsBefore + 1) {
      ok(false, '第 ' + guard + ' 题答对应 +1⭐，实际 ' + starsBefore + ' → ' + store.state().stars);
      break;
    }
    if (inst.quiz.correct !== prevCorrect + 1) {
      ok(false, '答对数应递增，实际 ' + inst.quiz.correct + ' 期望 ' + (prevCorrect + 1));
      break;
    }
    prevCorrect += 1;
    ok(inst.data.feedback.cls === 'ok', '第 ' + guard + ' 题反馈应为正确样式');
    flushTimers();
  }
  ok(guard === total, '应逐题答完 ' + total + ' 道，实际走了 ' + guard + ' 步');
  ok(inst.quiz && inst.quiz.finished === true, '答完应进入结束态');
  ok(inst.quiz && inst.quiz.correct === total, '应全部答对，实际 ' + (inst.quiz ? inst.quiz.correct : -1) + '/' + total);
  ok(store.state().stars >= total, '星星应至少加 ' + total + '，实际 ' + store.state().stars);
  ok(navTo('redirectTo') === '/pages/result/result', '应跳转到结算页，实际 ' + navTo('redirectTo'));

  const r = app.globalData.lastResult;
  ok(!!r, 'lastResult 应有值');
  if (r) {
    ok(r.kind === 'quiz', 'lastResult.kind 应为 quiz，实际 ' + r.kind);
    ok(r.total === total, 'lastResult.total 应为 ' + total + '，实际 ' + r.total);
    ok(r.correct === total, 'lastResult.correct 应为 ' + total + '，实际 ' + r.correct);
    ok(typeof r.stars === 'number' && r.stars > 0, 'lastResult.stars 应为正数，实际 ' + r.stars);
    ok(Array.isArray(r.words) && r.words.length === total, 'lastResult.words 应有 ' + total + ' 条，实际 ' + (r.words || []).length);
    ok(!!r.unitId && !!r.unitName, 'lastResult 应带 unitId / unitName');
    ok(r.words.every((w) => w.ok === true && !!w.w), 'lastResult.words 每条都应标记为答对且带单词');
  }
  assertResultRenders('quiz');
}

function quizAllWrong() {
  section('选一选 · 全答错（扣心 → 心归零结算）');
  resetStore();
  const inst = makeInstance(loadPage('quiz'));
  inst.onLoad({ u: unitId });

  const wordIds = inst.quiz.words.map((w) => w.id);
  ok(inst.data.hearts.length === 3 && inst.data.hearts.every((h) => !h.lost), '开局应有 3 颗心');

  let guard = 0;
  while (inst.quiz && !inst.quiz.finished && guard < 10) {
    guard += 1;
    const correctIndex = inst.quiz.correctIndex;
    const wrongIndex = (correctIndex + 1) % inst.data.options.length;
    const starsBefore = store.state().stars;
    inst.onSelect({ currentTarget: { dataset: { index: String(wrongIndex) } } });
    ok(store.state().stars === starsBefore, '第 ' + guard + ' 题答错不应加星，实际 ' + starsBefore + ' → ' + store.state().stars);
    ok(inst.data.feedback.cls === 'no', '第 ' + guard + ' 题反馈应为错误样式');
    ok(inst.data.feedback.text.indexOf('正确答案是') >= 0, '答错应告知正确答案：' + inst.data.feedback.text);
    ok(inst.data.hearts.filter((h) => !h.lost).length === Math.max(0, 3 - guard), '第 ' + guard + ' 题后应剩 ' + Math.max(0, 3 - guard) + ' 颗心，实际 ' + inst.data.hearts.filter((h) => !h.lost).length);
    flushTimers();
    if (guard >= 3) break;
  }
  ok(guard === 3, '应在第 3 次答错后结束，实际走了 ' + guard + ' 步');
  ok(inst.quiz && inst.quiz.finished === true, '心归零后应结算，实际 finished=' + (inst.quiz && inst.quiz.finished));
  ok(inst.quiz && inst.quiz.hearts === 0, '结算时心应为 0，实际 ' + (inst.quiz ? inst.quiz.hearts : -1));

  const wrong = store.state().wrong;
  ok(wordIds.slice(0, 3).every((id) => wrong.indexOf(id) >= 0), '答错的 3 个词应全部进错词本，实际错词本 ' + JSON.stringify(wrong));
  ok(navTo('redirectTo') === '/pages/result/result', '心归零后应跳结算页，实际 ' + navTo('redirectTo'));

  const r = app.globalData.lastResult;
  ok(!!r && r.kind === 'quiz', 'lastResult 应为 quiz 结算');
  if (r) {
    ok(r.correct === 0, '全答错时 correct 应为 0，实际 ' + r.correct);
    ok(r.wrong === 3, '全答错时 wrong 应为 3，实际 ' + r.wrong);
    ok(r.words.length === 3 && r.words.every((w) => w.ok === false), '结算明细应记录 3 条答错');
  }
}

/* =========================================================
   流程 2：拼一拼 spell
   ========================================================= */
function spellFlow() {
  section('拼一拼 spell');
  resetStore();
  const inst = makeInstance(loadPage('spell'));
  inst.onLoad({ u: unitId });

  ok(!!inst.spell && inst.spell.words.length > 0, '开局应有单词');
  const mask = inst.data.mask;
  ok(Array.isArray(mask) && mask.length > 0, '应有字母遮罩，实际 ' + (mask || []).length);
  ok(mask.filter((m) => m.cls !== 'space').every((m) => m.ch === ''), '开局所有字母都应是遮罩状态');

  const word0 = inst.spell.words[0];
  const starsBefore = store.state().stars;

  // 错误答案
  inst.onInput({ detail: { value: 'zzzzzz' } });
  inst.onCheck();
  ok(inst.data.feedback.cls === 'no', '错误答案应给出否定反馈，实际 cls=' + inst.data.feedback.cls);
  ok(String(inst.data.feedback.text).length > 0, '错误答案应有文字反馈');
  ok(store.state().stars === starsBefore, '答错不应加星，实际 ' + starsBefore + ' → ' + store.state().stars);
  ok(inst.data.showCheck === true && inst.data.inputDisabled === false, '第一次答错应还能继续输入');
  ok(inst.spell.correct === 0, '答错不应计入 correct');

  // 正确答案（大小写故意不一致）
  const cased = String(word0.w).toUpperCase();
  ok(U.normalize(cased) === U.normalize(word0.w), '前置条件：大小写变换后归一化应相同');
  inst.onInput({ detail: { value: cased } });
  inst.onCheck();
  ok(inst.data.feedback.cls === 'ok', '正确答案（大小写不敏感）应判定通过，实际 cls=' + inst.data.feedback.cls);
  ok(store.state().stars === starsBefore + 2, '拼对应 +2⭐，实际 ' + store.state().stars + ' 期望 ' + (starsBefore + 2));
  ok(inst.spell.earned === 2, '本轮 earned 应为 2，实际 ' + inst.spell.earned);
  ok(inst.data.inputDisabled === true, '答对后输入框应锁定');

  flushTimers();
  ok(inst.spell.index === 1, '答对后应进入下一题，实际 index=' + inst.spell.index);
  ok(String(inst.data.stepText).indexOf('2 /') === 0, '进度应推进到第 2 题，实际 ' + inst.data.stepText);
  ok(inst.data.mask.filter((m) => m.cls !== 'space').every((m) => m.ch === ''), '下一题应重新遮罩');

  // 走到结束态：把剩下的题全部拼对
  let guard = 0;
  while (inst.spell && !inst.spell.finished && guard < 40) {
    guard += 1;
    const word = inst.spell.words[inst.spell.index];
    if (!word) break;
    inst.onInput({ detail: { value: word.w.toLowerCase() } });
    inst.onCheck();
    flushTimers();
  }
  ok(inst.spell && inst.spell.finished === true, '全部拼完应进入结算');
  ok(navTo('redirectTo') === '/pages/result/result', '拼一拼结算应跳结算页，实际 ' + navTo('redirectTo'));
  const r = app.globalData.lastResult;
  ok(!!r && r.kind === 'spell', 'lastResult.kind 应为 spell，实际 ' + (r && r.kind));
  if (r) {
    ok(r.total === inst.spell.words.length, 'lastResult.total 应等于题量');
    ok(r.correct === inst.spell.words.length, 'lastResult.correct 应等于题量，实际 ' + r.correct);
    ok(Array.isArray(r.words) && r.words.length === r.total, '结算明细应齐全');
  }
  assertResultRenders('spell');
}

/* =========================================================
   流程 3：连一连 match
   ========================================================= */
function matchFlow() {
  section('连一连 match');
  resetStore();
  const inst = makeInstance(loadPage('match'));
  inst.onLoad({ u: unitId });

  const cards = inst.match.cards;
  ok(Array.isArray(cards) && cards.length >= 4, '应有牌，实际 ' + (cards || []).length);
  ok(cards.length % 2 === 0, '牌数应为偶数，实际 ' + cards.length);
  const pairCount = cards.length / 2;
  const pairProblems = [];
  for (let p = 0; p < pairCount; p += 1) {
    const same = cards.filter((c) => c.pair === p);
    if (same.length !== 2) { pairProblems.push('第 ' + p + ' 组有 ' + same.length + ' 张牌'); continue; }
    const sides = same.map((c) => c.side).sort().join(',');
    if (sides !== 'en,zh') pairProblems.push('第 ' + p + ' 组是 ' + sides);
  }
  ok(pairProblems.length === 0, '每张牌都应成对（一英一中），问题：' + pairProblems.join('；'));
  ok(inst.data.cards.length === cards.length, '渲染的牌数应与数据一致');

  // 故意翻错一对
  const wrongB = cards.findIndex((c, i) => i !== 0 && c.pair !== cards[0].pair);
  inst.onCardTap({ currentTarget: { dataset: { index: '0' } } });
  ok(inst.data.cards[0].state === 'flipped', '第一张应翻开，实际 ' + inst.data.cards[0].state);
  inst.onCardTap({ currentTarget: { dataset: { index: String(wrongB) } } });
  ok(inst.match.moves === 1, '翻两张应记 1 步，实际 ' + inst.match.moves);
  ok(inst.data.cards[0].state === 'mismatch' && inst.data.cards[wrongB].state === 'mismatch', '配错应标记 mismatch');
  flushTimers();
  ok(inst.data.cards[0].state === '' && inst.data.cards[wrongB].state === '', '配错的两张应翻回去，实际 ' + inst.data.cards[0].state + '/' + inst.data.cards[wrongB].state);
  ok(inst.match.flipped.length === 0, '翻回去后待配对列表应清空');
  ok(inst.match.locked === false, '翻回去后应解锁，可以继续翻');
  ok(inst.match.matchedPairs === 0, '配错不应计入已配对');

  // 依次配对全部
  for (let p = 0; p < pairCount; p += 1) {
    const idxs = [];
    cards.forEach((c, i) => { if (c.pair === p) idxs.push(i); });
    inst.onCardTap({ currentTarget: { dataset: { index: String(idxs[0]) } } });
    inst.onCardTap({ currentTarget: { dataset: { index: String(idxs[1]) } } });
    flushTimers();
    ok(inst.match.matchedPairs === p + 1, '第 ' + (p + 1) + ' 对应配对成功，实际 ' + inst.match.matchedPairs);
    ok(inst.data.cards[idxs[0]].state === 'matched', '第 ' + (p + 1) + ' 对应标记 matched');
  }
  ok(inst.match.moves === pairCount + 1, '总步数应为 ' + (pairCount + 1) + '，实际 ' + inst.match.moves);
  ok(inst.match.finished === true, '全部配完应结算');
  ok(navTo('redirectTo') === '/pages/result/result', '连一连结算应跳结算页，实际 ' + navTo('redirectTo'));

  const r = app.globalData.lastResult;
  ok(!!r && r.kind === 'match', 'lastResult.kind 应为 match，实际 ' + (r && r.kind));
  if (r) {
    ok(r.stars === 6, '连一连最多 6 ⭐，实际 ' + r.stars);
    ok(r.total === pairCount, '结算题量应等于配对组数，实际 ' + r.total);
    ok(Array.isArray(r.words) && r.words.length === pairCount, '结算应带回全部配对单词');
  }
  ok(store.state().stars >= 6, '星星应已入账，实际 ' + store.state().stars);
  assertResultRenders('match');
}

/* =========================================================
   流程 4：数学解题挑战 mathSolve
   ========================================================= */
function mathSolveFlow() {
  section('数学解题挑战 mathSolve');
  resetStore();
  const inst = makeInstance(loadPage('mathSolve'));
  inst.onLoad({});

  ok(inst.data.pane === 'setup', '开局应在设置页，实际 ' + inst.data.pane);
  ok(inst.data.bankReady === true, '题库应已就绪');
  const grade = store.getGrade();
  const presetKps = store.mathPresetKps();

  inst.onStart();
  const session = inst.session;
  ok(!!session && session.queue.length > 0, '开始一轮应有题目，实际 ' + (session ? session.queue.length : 0));
  ok(session.grade === grade, '应按当前年级出题，实际 ' + session.grade + ' 期望 ' + grade);
  ok(session.queue.every((q) => q.q && q.a && Array.isArray(q.steps)), '每题应有题干 / 答案 / 解析步骤');
  ok(session.queue.every((q) => String(q.stage || '').indexOf(U.gradeLabel(grade)) >= 0),
    '题目应来自 ' + U.gradeLabel(grade) + '题库，实际 stage=' + session.queue.map((q) => q.stage).join(' | '));
  const gradeTopics = BANK.GRADE_TOPICS[grade] || [];
  ok(session.queue.every((q) => gradeTopics.indexOf(q.topic) >= 0),
    '题目话题必须落在本年级大纲内（不超纲），实际 ' + session.queue.map((q) => q.topic).join(' | '));
  ok(session.queue.every((q) => !!q.kp), '每题都应带知识点名（收进错题本时要用）');

  // ⚠ 已知上游现象（与原网页 index.html 行为一致，非移植引入）：
  // 题库自带的话题名（如「年、月、日」「分数的初步认识」）与当前教材的知识点名
  // （如「年月日」「分数初步认识」）写法不同，混合练习收进错题本时会被 addCustomKp
  // 追加进「自定义知识点」，时间长了知识点下拉会有近似重复项。
  const offList = session.queue.map((q) => q.kp).filter((k) => presetKps.indexOf(k) < 0);
  if (offList.length) {
    console.log('  ⚠ 观察项：题库话题名与当前教材知识点名不一致 -> ' + Array.from(new Set(offList)).join('、')
      + '（会被写进自定义知识点列表；原网页 index.html 同样如此）');
  }
  ok(inst.data.pane === 'play', '开始后应进入答题页，实际 ' + inst.data.pane);

  // 第 1 题：故意答错
  const starsBefore = store.state().stars;
  inst.onInput({ detail: { value: '__肯定不对__' } });
  inst.onCheck();
  ok(inst.data.verdictClass === 'no', '错误答案应判错，实际 ' + inst.data.verdictClass);
  ok(inst.data.showResult === true, '判完应展示解析区');
  ok(inst.data.steps.length > 0, '应展示解析步骤，实际 ' + inst.data.steps.length);
  ok(inst.data.answerText === session.queue[0].a, '应展示正确答案，实际 ' + inst.data.answerText);
  ok(store.state().stars === starsBefore, '答错不应加星，实际 ' + store.state().stars);
  ok(session.queue[0].ok === false && session.queue[0].checked === true, '该题应标记为已判且答错');
  ok(session.wrong === 1, '错误计数应为 1，实际 ' + session.wrong);

  // 第 2 题：答对
  const starsBefore2 = store.state().stars;
  inst.onNext();
  ok(session.index === 1, '点下一题应推进到第 2 题，实际 index=' + session.index);
  const q2 = inst.current();
  inst.onInput({ detail: { value: q2.a } });
  inst.onCheck();
  ok(inst.data.verdictClass === 'ok', '正确答案应判对，实际 ' + inst.data.verdictClass);
  ok(store.state().stars === starsBefore2 + 1, '答对应 +1⭐，实际 ' + store.state().stars + ' 期望 ' + (starsBefore2 + 1));
  ok(session.right === 1, '答对计数应为 1，实际 ' + session.right);

  // 剩下的全部答对，走到结算
  let guard = 0;
  while (inst.session && session.index < session.queue.length && guard < 40) {
    guard += 1;
    const item = inst.current();
    if (!item) break;
    if (!item.checked) {
      inst.onInput({ detail: { value: item.a } });
      inst.onCheck();
    }
    if (session.index < session.queue.length - 1) inst.onNext();
    else { inst.onNext(); break; }
  }
  ok(inst.data.pane === 'summary', '答完应进入结算页，实际 ' + inst.data.pane);
  ok(inst.data.hasFailed === true, '有错题时 hasFailed 应为 true');
  ok(inst.data.pickList.length === 1, '待收进错题本应有 1 道，实际 ' + inst.data.pickList.length);

  const before = store.mathState().items.length;
  inst.onAddToWrongBook();
  const items = store.mathState().items;
  ok(items.length === before + 1, '「收进错题本」后错题应 +1，实际 ' + before + ' → ' + items.length);
  const added = items[0];
  ok(!!added, '应能取到新增错题');
  if (added) {
    ok(added.q === session.queue[0].q, '收进的应是刚才答错的那道题');
    ok(!!added.a, '错题应带正确答案，实际 ' + JSON.stringify(added.a));
    ok(!!added.kp, '错题应带知识点，实际 ' + JSON.stringify(added.kp));
    ok(!!added.type, '错题应带题型，实际 ' + JSON.stringify(added.type));
    ok(Array.isArray(added.steps) && added.steps.length > 0, '错题应带解析步骤，实际 ' + (added.steps || []).length);
    ok(Array.isArray(added.images), '错题应有 images 字段');
    ok(added.done === false, '新收进的错题应为待攻克');
    ok(Number(added.wrongCount) >= 1, '错题应带错误次数，实际 ' + added.wrongCount);
  }
  ok(store.mathState().customKps.every((k) => typeof k === 'string' && String(k).length > 0),
    '自定义知识点不应写入空项，实际 ' + JSON.stringify(store.mathState().customKps));
  ok(navTo('navigateBack') !== null, '收进错题本后应返回上一页');
}

/* =========================================================
   流程 5：抽题复习 mathReview
   ========================================================= */
function mathReviewFlow() {
  section('抽题复习 mathReview');
  resetStore();
  const seeded = [];
  ['复习题 A：2+3=?', '复习题 B：4×5=?', '复习题 C：9-6=?'].forEach((q, i) => {
    seeded.push(store.addMathItem({ q: q, a: String(i + 1), kp: '20 以内加减法', type: '计算题', why: '粗心' }));
  });
  ok(store.mathState().items.length === 3, '前置：应有 3 道错题，实际 ' + store.mathState().items.length);

  const inst = makeInstance(loadPage('mathReview'));
  inst.onLoad({ kp: 'all' });
  ok(!!inst.session && inst.session.queue.length === 3, '?kp=all 应抽到 3 道，实际 ' + (inst.session ? inst.session.queue.length : 0));
  ok(String(inst.data.q).length > 0, '应渲染出题干，实际 ' + JSON.stringify(inst.data.q));
  ok(inst.data.showAnswer === false && inst.data.showReveal === true, '开局答案应隐藏');

  const target = inst.session.queue[0];
  inst.onReveal();
  ok(inst.data.showAnswer === true, '点「看答案」应展示答案');
  ok(inst.data.showJudge === true, '看完答案应出现自评按钮');

  const starsBefore = store.state().stars;
  inst.onGot();
  ok(store.state().stars === starsBefore + 1, '标记做对应 +1⭐，实际 ' + store.state().stars + ' 期望 ' + (starsBefore + 1));
  const saved = store.mathItemById(target.id);
  ok(saved && saved.done === true, '该题应被标记为已掌握，实际 ' + (saved ? saved.done : 'null'));
  flushTimers();
  ok(inst.session.index === 1, '应推进到第 2 题，实际 index=' + inst.session.index);
  ok(String(inst.data.progressText).indexOf('2 /') === 0, '进度文本应更新，实际 ' + inst.data.progressText);

  // 剩下的也做完，走到结束态
  let guard = 0;
  while (inst.session && !inst.session.finished && guard < 10) {
    guard += 1;
    inst.onReveal();
    inst.onMissed();
    flushTimers();
  }
  ok(inst.data.finished === true, '全部做完应进入结束态');
  ok(!!inst.data.result && typeof inst.data.result.desc === 'string', '结束态应有小结文案');
}

/* =========================================================
   流程 6：记错题 mathForm
   ========================================================= */
function mathFormFlow() {
  section('记错题 mathForm');
  resetStore();
  const inst = makeInstance(loadPage('mathForm'));
  inst.onLoad({});

  ok(Array.isArray(inst.data.kpOptions) && inst.data.kpOptions.length > 0, '应有知识点下拉，实际 ' + (inst.data.kpOptions || []).length);
  ok(String(inst.data.kpLabel).length > 0, '应默认选中一个知识点，实际 ' + JSON.stringify(inst.data.kpLabel));

  // 正常保存
  const kpIndex = inst.data.kpOptions.findIndex((k) => k !== '＋ 新建知识点');
  inst.onKpChange({ detail: { value: String(kpIndex) } });
  const kp = inst.data.kpLabel;
  inst.onTypeChange({ detail: { value: '1' } });
  inst.onField({ currentTarget: { dataset: { key: 'q' } }, detail: { value: '小明有 7 颗糖，吃掉 3 颗，还剩几颗？' } });
  inst.onField({ currentTarget: { dataset: { key: 'a' } }, detail: { value: '4' } });
  inst.onField({ currentTarget: { dataset: { key: 'myAnswer' } }, detail: { value: '5' } });
  inst.onField({ currentTarget: { dataset: { key: 'why' } }, detail: { value: '减法看错符号' } });

  inst.onSubmit();
  const items = store.mathState().items;
  ok(items.length === 1, '保存后错题应 +1，实际 ' + items.length);
  if (items.length === 1) {
    const it = items[0];
    ok(it.q === '小明有 7 颗糖，吃掉 3 颗，还剩几颗？', 'q 应落盘，实际 ' + JSON.stringify(it.q));
    ok(it.a === '4', 'a 应落盘，实际 ' + JSON.stringify(it.a));
    ok(it.myAnswer === '5', 'myAnswer 应落盘，实际 ' + JSON.stringify(it.myAnswer));
    ok(it.kp === kp, 'kp 应落盘，实际 ' + JSON.stringify(it.kp) + ' 期望 ' + JSON.stringify(kp));
    ok(it.type === '计算题', 'type 应落盘，实际 ' + JSON.stringify(it.type));
    ok(it.why === '减法看错符号', 'why 应落盘，实际 ' + JSON.stringify(it.why));
    ok(Array.isArray(it.images) && it.images.length === 0, 'images 应为数组，实际 ' + JSON.stringify(it.images));
    ok(Array.isArray(it.steps), 'steps 应为数组');
    ok(Number(it.wrongCount) === 1, 'wrongCount 应为 1，实际 ' + it.wrongCount);
    ok(it.done === false, 'done 应为 false，实际 ' + it.done);
    ok(!!it.id, '应有 id');
  }
  ok(navTo('navigateBack') !== null, '保存后应返回上一页');

  // 故意不填题目 → 应被拦截
  const countBefore = store.mathState().items.length;
  calls.length = 0;
  inst.onField({ currentTarget: { dataset: { key: 'q' } }, detail: { value: '   ' } });
  inst.onSubmit();
  ok(store.mathState().items.length === countBefore, '题目为空不应写入错题，实际 ' + store.mathState().items.length);
  ok(inst.data.qCls === 'invalid', '题目为空应标红，实际 ' + JSON.stringify(inst.data.qCls));
  ok(String(lastToast()).indexOf('题目不能空着') >= 0, '应提示题目不能为空，实际 ' + lastToast());
  ok(store.mathState().items.every((it) => String(it.q || '').trim().length > 0), '错题本里不应存在空题干的脏数据');

  // 选了「新建知识点」却不填名字 → 也应被拦截
  const newKpIndex = inst.data.kpOptions.indexOf('＋ 新建知识点');
  inst.onField({ currentTarget: { dataset: { key: 'q' } }, detail: { value: '再来一道题' } });
  inst.onKpChange({ detail: { value: String(newKpIndex) } });
  inst.onField({ currentTarget: { dataset: { key: 'newKp' } }, detail: { value: '   ' } });
  inst.onSubmit();
  ok(store.mathState().items.length === countBefore, '新知识点为空不应写入错题，实际 ' + store.mathState().items.length);
  ok(inst.data.newKpCls === 'invalid', '新知识点为空应标红');
}

/* =========================================================
   流程 7：登录校验 account
   ========================================================= */
function accountFlow() {
  section('登录校验 account');
  resetStore();
  cloudCalls.sendOtp = 0;
  cloudCalls.verifyOtp = 0;
  const inst = makeInstance(loadPage('account'));
  inst.onLoad({});
  ok(inst.data.logged === false, '未登录时 logged 应为 false');

  /* --- 非法手机号 --- */
  cloudCalls.sendOtp = 0;
  calls.length = 0;
  inst.onPhoneInput({ detail: { value: '123' } });
  return Promise.resolve()
    .then(() => inst.onSendCode())
    .then(() => {
      ok(cloudCalls.sendOtp === 0, '非法手机号不应发出验证码请求，实际发了 ' + cloudCalls.sendOtp + ' 次');
      ok(String(inst.data.phoneError).length > 0, '非法手机号应给出错误提示，实际 ' + JSON.stringify(inst.data.phoneError));
      ok(inst.data.sent === false, '非法手机号不应进入已发送状态');

      /* --- 非法邮箱 --- */
      inst.onChannelSwitch({ currentTarget: { dataset: { channel: 'email' } } });
      cloudCalls.sendOtp = 0;
      inst.onEmailInput({ detail: { value: 'abc' } });
      return inst.onSendCode();
    })
    .then(() => {
      ok(cloudCalls.sendOtp === 0, '非法邮箱不应发出验证码请求，实际发了 ' + cloudCalls.sendOtp + ' 次');
      ok(String(inst.data.emailError).length > 0, '非法邮箱应给出错误提示，实际 ' + JSON.stringify(inst.data.emailError));

      /* --- 正面控制：合法手机号确实会发请求（证明上面的 0 次不是桩没接上） --- */
      inst.onChannelSwitch({ currentTarget: { dataset: { channel: 'phone' } } });
      cloudCalls.sendOtp = 0;
      inst.onPhoneInput({ detail: { value: '13800001111' } });
      return inst.onSendCode();
    })
    .then(() => {
      ok(cloudCalls.sendOtp === 1, '合法手机号应发出 1 次验证码请求，实际 ' + cloudCalls.sendOtp);
      ok(inst.data.sent === true, '合法手机号应进入已发送状态');

      /* --- 验证码错误不应产生登录态 --- */
      inst.onCodeInput({ detail: { value: '000000' } });
      cloudCalls.verifyOtp = 0;
      return inst.onSubmit();
    })
    .then(() => {
      ok(cloudCalls.verifyOtp === 1, '验证码错误时也应真的校验一次，实际 ' + cloudCalls.verifyOtp);
      ok(inst.data.logged === false, '验证码错误不应置为已登录');
      ok(store.getAuthUser() === null, '验证码错误不应产生会话用户');
      ok(String(inst.data.msgText).length > 0, '验证码错误应给出错误文案，实际 ' + JSON.stringify(inst.data.msgText));

      /* --- 静态代码检查：不许匿名登录 / 不许自己写登录态 --- */
      const roots = [path.resolve(__dirname, '../pages'), path.resolve(__dirname, '../utils'), path.resolve(__dirname, '../app.js')];
      const files = [];
      roots.forEach((root) => {
        if (fs.statSync(root).isFile()) { files.push(root); return; }
        fs.readdirSync(root).forEach((dir) => {
          const f = path.join(root, dir, dir + '.js');
          if (fs.existsSync(f)) files.push(f);
        });
      });
      const sources = files.map((f) => ({ f: f, text: fs.readFileSync(f, 'utf8') }));
      ok(sources.length > 0, '应能读到页面源码用于静态检查，实际 ' + sources.length + ' 个文件');

      const anon = sources.filter((s) => s.text.indexOf('signInAnonymously') >= 0);
      ok(anon.length === 0, '代码中不应出现 signInAnonymously，实际出现在 ' + anon.map((s) => s.f).join(','));

      const fakeLogin = sources.filter((s) => /set(StorageSync|Storage)\s*\(\s*['"][^'"]*(login|logged|auth|session|token|user)\b/i.test(s.text));
      ok(fakeLogin.length === 0, '不应往 storage 写登录态冒充登录，实际出现在 ' + fakeLogin.map((s) => s.f).join(','));

      const pageDir = path.resolve(__dirname, '../pages');
      const pageWriters = [];
      fs.readdirSync(pageDir).forEach((dir) => {
        const f = path.join(pageDir, dir, dir + '.js');
        if (fs.existsSync(f) && /wx\.setStorageSync/.test(fs.readFileSync(f, 'utf8'))) pageWriters.push(f);
      });
      ok(pageWriters.length === 0, '页面不应直接写 storage，实际 ' + pageWriters.join(','));
    });
}

/* =========================================================
   跑全部流程
   ========================================================= */
console.log('玩法流程测试 —— ' + path.basename(__dirname));
console.log('主题：' + bigUnit.name + '（' + bigUnit.words.length + ' 词），年级：' + store.getGrade());

const errors = [];
function run(label, fn) {
  try { fn(); } catch (e) { errors.push(label + '：' + e.message + '\n' + (e.stack || '')); }
}

run('quiz-全对', quizAllCorrect);
run('quiz-全错', quizAllWrong);
run('spell', spellFlow);
run('match', matchFlow);
run('mathSolve', mathSolveFlow);
run('mathReview', mathReviewFlow);
run('mathForm', mathFormFlow);

accountFlow().then(() => {
  console.log('\n----------------------------------------');
  console.log('通过断言：' + pass);
  if (errors.length) {
    console.log('流程执行抛错 ' + errors.length + ' 处：');
    errors.forEach((e) => console.log('  ! ' + e));
  }
  if (fails.length) {
    console.log('失败断言 ' + fails.length + ' 项：');
    fails.forEach((f) => console.log('  ✗ ' + f));
  }
  if (!errors.length && !fails.length) console.log('✅ 全部通过');
  else process.exit(1);
}).catch((e) => {
  console.log('\naccount 流程抛错：' + e.message);
  console.log(e.stack);
  process.exit(1);
});
