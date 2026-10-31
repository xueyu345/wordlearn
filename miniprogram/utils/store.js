/* 学习档案：全部按「年级 + 教材」隔离，本地 storage 为主，登录后与云端合并同步 */
const U = require('./util.js');
const WORDS = require('./words-data.js');
const { cloud, CLOUD_TABLE } = require('./cloud.js');

const GRADES = U.GRADES;
const DEFAULT_GRADE = 3;
const DEFAULT_EN_BOOK = 'general';
const DEFAULT_MATH_BOOK = 'general';

const STORAGE_KEY = 'wordHeroState.v1';
const MATH_BASE_KEY = 'studyHubMath.v1';
const GRADE_KEY = 'studyHubGrade.v1';
const EN_BOOK_KEY = 'studyHubEnBook.v1';
const MATH_BOOK_KEY = 'studyHubMathBook.v1';
const SYNC_DEBOUNCE = 2500;
const GOAL_CHOICES = [5, 10, 15, 20];
const ROUND_CHOICES = [5, 10, 15];
const PREF_DEFAULTS = {
  sound: true,
  voice: true,
  autoSpeak: true,
  dailyGoal: 10,
  roundSize: 10,
  strictCase: false
};

const MATH_BOOKS = [
  {
    id: 'general', name: '全国通用版', short: '通用', color: '#FF8A3D',
    note: '不绑定具体教材，按知识板块分类，各版本都能用',
    kps: {
      1: ['10 以内加减法', '20 以内加减法', '100 以内数的认识', '认识图形', '认识钟表', '分类与比较'],
      2: ['100 以内加减法', '乘法口诀', '表内除法', '长度单位', '角的初步认识', '观察物体', '统计'],
      3: ['万以内加减法', '多位数乘一位数', '除法', '分数初步认识', '小数初步认识', '周长与面积', '年月日'],
      4: ['大数认识', '三位数乘两位数', '除数是两位数的除法', '运算定律', '小数的意义与加减法', '三角形与四边形'],
      5: ['小数乘除法', '简易方程', '因数与倍数', '分数加减法', '多边形面积', '长方体与正方体'],
      6: ['分数乘除法', '比与比例', '圆', '百分数', '圆柱与圆锥', '统计与概率', '解决问题']
    }
  },
  {
    id: 'bsd', name: '北师大版', short: '北师大', color: '#3B82F6',
    note: '北京师范大学出版社《义务教育教科书·数学》，单元名与课本目录一致',
    kps: {
      1: ['生活中的数', '比较', '加与减（一）', '分类', '位置与顺序', '认识图形', '加与减（二）', '认识钟表'],
      2: ['加与减', '购物', '数一数与乘法', '图形的变化', '2~5 的乘法口诀', '测量', '分一分与除法', '6~9 的乘法口诀'],
      3: ['混合运算', '观察物体', '加与减', '乘与除', '周长', '乘法', '年、月、日', '认识小数'],
      4: ['认识更大的数', '线与角', '乘法', '运算律', '方向与位置', '除法', '生活中的负数', '可能性'],
      5: ['小数除法', '轴对称和平移', '倍数与因数', '多边形的面积', '分数的意义', '组合图形的面积', '可能性'],
      6: ['圆', '分数混合运算', '观察物体', '百分数', '数据处理', '比的认识', '百分数的应用']
    }
  },
  {
    id: 'rjb', name: '人教版', short: '人教', color: '#14B8A6',
    note: '人民教育出版社《义务教育教科书·数学》，单元名与课本目录一致',
    kps: {
      1: ['20 以内的加减法', '100 以内数的认识', '认识图形（一）', '认识钟表', '认识人民币', '分类与整理'],
      2: ['长度单位', '100 以内的加减法', '角的初步认识', '表内乘法', '观察物体', '认识时间', '数学广角'],
      3: ['时分秒', '万以内的加减法', '测量', '多位数乘一位数', '分数的初步认识', '长方形和正方形', '面积'],
      4: ['大数的认识', '公顷和平方千米', '角的度量', '三位数乘两位数', '平行四边形和梯形', '除数是两位数的除法', '条形统计图'],
      5: ['小数乘法', '小数除法', '简易方程', '多边形的面积', '分数的意义和性质', '分数的加减法', '长方体和正方体'],
      6: ['分数乘法', '分数除法', '比', '圆', '百分数（一）', '扇形统计图', '数学广角']
    }
  }
];

function readStored(key) {
  try {
    const v = wx.getStorageSync(key);
    return v === '' || v === null || v === undefined ? null : v;
  } catch (e) { return null; }
}
function writeStored(key, value) {
  try { wx.setStorageSync(key, value); return true; } catch (e) { return false; }
}
function removeStored(key) {
  try { wx.removeStorageSync(key); } catch (e) { /* ignore */ }
}
function parseStored(key) {
  const raw = readStored(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

/* ---------- 教材键：通用版沿用旧键名，其他教材加后缀 ---------- */
function withBook(base, book, grade) {
  return book === DEFAULT_EN_BOOK ? base + '.g' + grade : base + '.' + book + '.g' + grade;
}
function stateKey(grade, book) { return withBook(STORAGE_KEY, book, grade); }
function mathKey(grade, book) { return withBook(MATH_BASE_KEY, book, grade); }

/* ---------- 运行时状态 ---------- */
let currentGrade = DEFAULT_GRADE;
let currentEnBook = DEFAULT_EN_BOOK;
let currentMathBook = DEFAULT_MATH_BOOK;
let EN_BOOKS = [];
let ALL_UNITS = [];
let UNITS = [];
let ALL_WORDS = [];
let WORD_MAP = {};
let TOTAL_WORDS = 0;
let GOAL = 10;
let state = null;
let mathState = null;

let authUser = null;
let syncState = 'idle';      // idle | busy | done | error
let syncText = '仅本机';
let syncTimer = null;
let syncInFlight = false;
let suppressPush = false;
const listeners = [];

function emit() {
  listeners.forEach((fn) => { try { fn(); } catch (e) { /* ignore */ } });
}
function onChange(fn) {
  if (typeof fn === 'function' && listeners.indexOf(fn) < 0) listeners.push(fn);
}
function offChange(fn) {
  const i = listeners.indexOf(fn);
  if (i >= 0) listeners.splice(i, 1);
}

/* ---------- 词库 ---------- */
function prepareUnits(rawUnits) {
  ALL_UNITS = (rawUnits || []).map((unit) => ({
    book: unit.book || DEFAULT_EN_BOOK,
    grade: Number(unit.grade) || DEFAULT_GRADE,
    id: unit.id,
    name: unit.name,
    en: unit.en || '',
    emoji: unit.emoji || '🔤',
    color: unit.color || '#7057F5',
    soft: unit.soft || '#F0ECFF',
    desc: unit.desc || '',
    words: (unit.words || []).map((word, index) => {
      const copy = {};
      Object.keys(word).forEach((k) => { copy[k] = word[k]; });
      copy.id = unit.id + '-' + index;
      copy.unitId = unit.id;
      return copy;
    })
  }));
}

function applyGradeUnits() {
  const matched = ALL_UNITS.filter((u) => u.grade === currentGrade && u.book === currentEnBook);
  const fallback = ALL_UNITS.filter((u) => u.grade === currentGrade && u.book === DEFAULT_EN_BOOK);
  UNITS = matched.length ? matched : fallback;
  ALL_WORDS = [];
  UNITS.forEach((u) => { ALL_WORDS = ALL_WORDS.concat(u.words); });
  WORD_MAP = {};
  ALL_WORDS.forEach((w) => { WORD_MAP[w.id] = w; });
  TOTAL_WORDS = ALL_WORDS.length;
}

function unitCountOfBook(book, grade) {
  return ALL_UNITS.filter((u) => u.book === book && u.grade === grade).length;
}
function bookEditions(bookId) {
  const meta = enBookMeta(bookId);
  return meta ? (meta.editions || []) : [];
}
function enBookMeta(bookId) {
  for (let i = 0; i < EN_BOOKS.length; i += 1) if (EN_BOOKS[i].id === bookId) return EN_BOOKS[i];
  return EN_BOOKS[0] || null;
}
// 教材 id 必须真的存在：enBookMeta 有「找不到就返回第一本」的兜底，不能用它做合法性判断
function enBookExists(bookId) {
  for (let i = 0; i < EN_BOOKS.length; i += 1) if (EN_BOOKS[i].id === bookId) return true;
  return false;
}
function enBooksForGrade(grade) {
  return EN_BOOKS.filter((b) => (b.editions || []).indexOf(grade) >= 0);
}
function mathBookMeta(bookId) {
  for (let i = 0; i < MATH_BOOKS.length; i += 1) if (MATH_BOOKS[i].id === bookId) return MATH_BOOKS[i];
  return MATH_BOOKS[0];
}
function mathBookExists(bookId) {
  for (let i = 0; i < MATH_BOOKS.length; i += 1) if (MATH_BOOKS[i].id === bookId) return true;
  return false;
}
function mathBookKps(bookId, grade) {
  const book = mathBookMeta(bookId);
  return (book.kps && book.kps[grade]) ? book.kps[grade].slice() : [];
}
function mathBookIds() { return MATH_BOOKS.map((b) => b.id); }

function ensureBookForGrade(grade) {
  if (bookEditions(currentEnBook).indexOf(grade) < 0) currentEnBook = DEFAULT_EN_BOOK;
}

/* ---------- 英语档案 ---------- */
function defaultState() {
  return {
    stars: 0, streak: 0, lastActive: null,
    learned: {}, wrong: [],
    daily: { date: U.dateKey(), words: [], bonus: false },
    history: {},
    settings: {
      sound: true, voice: true, autoSpeak: true, dailyGoal: 10, roundSize: 10, strictCase: false
    }
  };
}
function normalizeState(saved) {
  const base = defaultState();
  if (!saved || typeof saved !== 'object') return base;
  return {
    stars: Number(saved.stars) || 0,
    streak: Number(saved.streak) || 0,
    lastActive: saved.lastActive || null,
    learned: (saved.learned && typeof saved.learned === 'object') ? saved.learned : {},
    wrong: Array.isArray(saved.wrong) ? saved.wrong : [],
    daily: (saved.daily && typeof saved.daily === 'object') ? saved.daily : base.daily,
    history: (saved.history && typeof saved.history === 'object') ? saved.history : {},
    settings: Object.assign({}, base.settings, saved.settings || {})
  };
}
function loadState() {
  try {
    const raw = readStored(stateKey(currentGrade, currentEnBook));
    return raw ? normalizeState(JSON.parse(raw)) : defaultState();
  } catch (e) { return defaultState(); }
}
function saveState() {
  writeStored(stateKey(currentGrade, currentEnBook), JSON.stringify(state));
  schedulePush();
  emit();
}

function prefs() {
  const saved = (state && state.settings) || {};
  return {
    sound: saved.sound !== false,
    voice: saved.voice !== false,
    autoSpeak: saved.autoSpeak !== false,
    dailyGoal: U.clampChoice(saved.dailyGoal, GOAL_CHOICES, PREF_DEFAULTS.dailyGoal),
    roundSize: U.clampChoice(saved.roundSize, ROUND_CHOICES, PREF_DEFAULTS.roundSize),
    strictCase: saved.strictCase === true
  };
}
function setPref(key, value) {
  state.settings = Object.assign({}, PREF_DEFAULTS, state.settings || {});
  if (key === 'dailyGoal') {
    state.settings.dailyGoal = U.clampChoice(value, GOAL_CHOICES, PREF_DEFAULTS.dailyGoal);
    GOAL = state.settings.dailyGoal;
  } else if (key === 'roundSize') {
    state.settings.roundSize = U.clampChoice(value, ROUND_CHOICES, PREF_DEFAULTS.roundSize);
  } else {
    state.settings[key] = !!value;
  }
  saveState();
  emit();
}

function ensureDaily() {
  const today = U.dateKey();
  if (!state.daily || state.daily.date !== today) {
    state.daily = { date: today, words: [], bonus: false };
    saveState();
  } else {
    if (!Array.isArray(state.daily.words)) state.daily.words = [];
    if (typeof state.daily.bonus !== 'boolean') state.daily.bonus = false;
  }
}
function learnedCount() { return Object.keys(state.learned).length; }
function currentStreak() {
  if (!state.lastActive) return 0;
  return (state.lastActive === U.dateKey() || state.lastActive === U.yesterdayKey()) ? state.streak : 0;
}
function noteActivity() {
  const today = U.dateKey();
  if (state.lastActive === today) return;
  state.streak = state.lastActive === U.yesterdayKey() ? (state.streak || 0) + 1 : 1;
  state.lastActive = today;
  saveState();
}
function addDailyWord(id) {
  ensureDaily();
  noteActivity();
  if (state.daily.words.indexOf(id) >= 0) return null;
  state.daily.words.push(id);
  state.history[state.daily.date] = state.daily.words.length;
  if (state.daily.words.length >= GOAL && !state.daily.bonus) {
    state.daily.bonus = true;
    saveState();
    // 达成每日目标：奖励 5 颗星（原网页是延迟 400ms 再给，这里直接给，页面自己补提示）
    addStars(5);
    if (prefs().sound) U.vibrate('medium');
    return { bonus: true };
  }
  saveState();
  return { bonus: false };
}
function addStars(amount) {
  if (!amount) return;
  state.stars += amount;
  saveState();
}
function markWord(id, correct) {
  const word = WORD_MAP[id];
  if (!word) return;
  const record = state.learned[id] || { seen: 0, correct: 0, wrong: 0 };
  record.seen = (record.seen || 0) + 1;
  if (correct) {
    record.correct = (record.correct || 0) + 1;
    if (record.correct >= 2) state.wrong = state.wrong.filter((w) => w !== id);
  } else {
    record.wrong = (record.wrong || 0) + 1;
    addWrongWord(id);
  }
  state.learned[id] = record;
  addDailyWord(id);
  saveState();
}
function addWrongWord(id) {
  if (state.wrong.indexOf(id) < 0) { state.wrong.push(id); saveState(); }
}
function removeWrongWord(id) {
  state.wrong = state.wrong.filter((w) => w !== id);
  saveState();
}
function getUnit(unitId) {
  for (let i = 0; i < UNITS.length; i += 1) if (UNITS[i].id === unitId) return UNITS[i];
  return null;
}
function unitLearned(unit) {
  let n = 0;
  (unit.words || []).forEach((w) => { if (state.learned[w.id]) n += 1; });
  return n;
}

/* ---------- 数学档案 ---------- */
function defaultMathState() {
  return { version: 1, items: [], customKps: [], updatedAt: null };
}
function normalizeMathState(saved) {
  const base = defaultMathState();
  if (!saved || typeof saved !== 'object') return base;
  return {
    version: 1,
    items: Array.isArray(saved.items) ? saved.items : [],
    customKps: Array.isArray(saved.customKps) ? saved.customKps : [],
    updatedAt: saved.updatedAt || null
  };
}
function loadMathState() {
  try {
    const raw = readStored(mathKey(currentGrade, currentMathBook));
    return raw ? normalizeMathState(JSON.parse(raw)) : defaultMathState();
  } catch (e) { return defaultMathState(); }
}
function saveMathState() {
  mathState.updatedAt = Date.now();
  const ok = writeStored(mathKey(currentGrade, currentMathBook), JSON.stringify(mathState));
  if (!ok) U.toast('保存失败：存储空间可能不够了');
  schedulePush();
  emit();
  return ok;
}
function mathPresetKps() { return mathBookKps(currentMathBook, currentGrade); }
function mathKpList() {
  const used = mathState.items.map((it) => it.kp);
  const all = mathPresetKps().concat(mathState.customKps || [], used);
  const out = [];
  all.forEach((kp) => { if (kp && out.indexOf(kp) < 0) out.push(kp); });
  return out;
}
function mathItemById(id) {
  for (let i = 0; i < mathState.items.length; i += 1) if (mathState.items[i].id === id) return mathState.items[i];
  return null;
}
function mathStats() {
  const total = mathState.items.length;
  let done = 0;
  mathState.items.forEach((it) => { if (it.done) done += 1; });
  return { total: total, done: done, todo: total - done };
}
function addMathItem(data) {
  const item = {
    id: U.uid('m'),
    q: data.q || '',
    a: data.a || '',
    myAnswer: data.myAnswer || '',
    kp: data.kp || '',
    type: data.type || '',
    why: data.why || '',
    steps: Array.isArray(data.steps) ? data.steps : [],
    images: Array.isArray(data.images) ? data.images : [],
    wrongCount: Number(data.wrongCount) || 1,
    done: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  mathState.items.unshift(item);
  saveMathState();
  return item;
}
function updateMathItem(id, patch) {
  const item = mathItemById(id);
  if (!item) return null;
  Object.keys(patch).forEach((k) => { item[k] = patch[k]; });
  item.updatedAt = Date.now();
  saveMathState();
  return item;
}
function deleteMathItem(id) {
  mathState.items = mathState.items.filter((it) => it.id !== id);
  saveMathState();
}
function toggleMathDone(id) {
  const item = mathItemById(id);
  if (!item) return false;
  item.done = !item.done;
  item.updatedAt = Date.now();
  saveMathState();
  return item.done;
}
function addCustomKp(kp) {
  if (!kp) return;
  if ((mathState.customKps || []).indexOf(kp) < 0) {
    mathState.customKps.push(kp);
    saveMathState();
  }
}

/* ---------- 错题图片：存本地文件，不再塞进 storage ---------- */
function saveImageFile(tempPath) {
  try {
    const fs = wx.getFileSystemManager();
    const name = 'sh_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7) + '.jpg';
    const target = wx.env.USER_DATA_PATH + '/' + name;
    fs.saveFileSync(tempPath, target);
    return target;
  } catch (e) {
    return tempPath;
  }
}
function removeImageFile(path) {
  if (!path) return;
  try { wx.getFileSystemManager().removeSavedFile({ filePath: path }); } catch (e) { /* ignore */ }
}

/* ---------- 年级 / 教材切换 ---------- */
function setGrade(grade) {
  const g = Number(grade);
  if (GRADES.indexOf(g) < 0 || g === currentGrade) return;
  currentGrade = g;
  ensureBookForGrade(g);
  writeStored(GRADE_KEY, g);
  writeStored(EN_BOOK_KEY, currentEnBook);
  reloadProfiles();
}
function setEnBook(bookId) {
  if (!enBookExists(bookId) || bookId === currentEnBook) return;
  if (bookEditions(bookId).indexOf(currentGrade) < 0) return;
  currentEnBook = bookId;
  writeStored(EN_BOOK_KEY, bookId);
  reloadProfiles();
}
function setMathBook(bookId) {
  if (!mathBookExists(bookId) || bookId === currentMathBook) return;
  currentMathBook = bookId;
  writeStored(MATH_BOOK_KEY, bookId);
  reloadProfiles();
}
function reloadProfiles() {
  applyGradeUnits();
  state = loadState();
  mathState = loadMathState();
  ensureDaily();
  GOAL = prefs().dailyGoal;
  emit();
}

/* ---------- 仪表盘快照 ---------- */
function dashboardBadges(streak, stars, learned, mathDone, wrongCount) {
  return [
    { icon: '🔥', name: '连打 3 天', got: streak >= 3, progress: Math.min(streak, 3) + '/3' },
    { icon: '🏅', name: '连打 7 天', got: streak >= 7, progress: Math.min(streak, 7) + '/7' },
    { icon: '👑', name: '连打 30 天', got: streak >= 30, progress: Math.min(streak, 30) + '/30' },
    { icon: '🔤', name: '认识 50 词', got: learned >= 50, progress: Math.min(learned, 50) + '/50' },
    { icon: '📚', name: '认识 200 词', got: learned >= 200, progress: Math.min(learned, 200) + '/200' },
    { icon: '⭐', name: '100 颗星', got: stars >= 100, progress: Math.min(stars, 100) + '/100' },
    { icon: '➗', name: '攻克 10 题', got: mathDone >= 10, progress: Math.min(mathDone, 10) + '/10' },
    { icon: '🎯', name: '错词清零', got: learned > 0 && wrongCount === 0, progress: wrongCount === 0 ? '已达成' : '还有 ' + wrongCount + ' 个' }
  ];
}
function dashboardSnapshot() {
  ensureDaily();
  const goal = GOAL > 0 ? GOAL : 10;
  const todayWords = state.daily.words.length;
  const history = state.history || {};
  const trend = [];
  let activeDays = 0;
  let bestDay = 0;
  let totalRecent = 0;
  for (let offset = 13; offset >= 0; offset -= 1) {
    const day = new Date(Date.now() - offset * 86400000);
    const key = U.dateKey(day);
    const count = Number(history[key]) || 0;
    totalRecent += count;
    if (count > 0) activeDays += 1;
    if (count > bestDay) bestDay = count;
    trend.push({
      key: key,
      label: (day.getMonth() + 1) + '/' + day.getDate(),
      count: count,
      today: offset === 0,
      // 柱状高度百分比，最高那天撑满
      height: 0
    });
  }
  let peak = 1;
  trend.forEach((t) => { if (t.count > peak) peak = t.count; });
  trend.forEach((t) => { t.height = Math.max(4, Math.round((t.count / peak) * 100)); });

  const units = UNITS.map((unit) => {
    const total = unit.words.length;
    const learned = unitLearned(unit);
    return {
      id: unit.id, name: unit.name, emoji: unit.emoji, color: unit.color,
      learned: learned, total: total,
      percent: total ? Math.round((learned / total) * 100) : 0
    };
  }).sort((a, b) => (b.percent - a.percent) || (b.total - a.total));

  const weak = Object.keys(state.learned || {})
    .map((id) => {
      const record = state.learned[id] || {};
      const word = WORD_MAP[id];
      return { wrong: Number(record.wrong) || 0, seen: Number(record.seen) || 0, word: word || null };
    })
    .filter((e) => e.word && e.wrong > 0)
    .sort((a, b) => (b.wrong - a.wrong) || (b.seen - a.seen))
    .slice(0, 6)
    .map((e) => ({ id: e.word.id, w: e.word.w, zh: e.word.zh || '', wrong: e.wrong }));

  const stats = mathStats();
  const byKp = {};
  mathState.items.forEach((item) => {
    const kp = item.kp || '未分类';
    if (!byKp[kp]) byKp[kp] = { kp: kp, total: 0, done: 0 };
    byKp[kp].total += 1;
    if (item.done) byKp[kp].done += 1;
  });
  const kps = Object.keys(byKp).map((k) => byKp[k])
    .sort((a, b) => (b.total - a.total) || a.kp.localeCompare(b.kp))
    .slice(0, 6)
    .map((row) => ({ kp: row.kp, total: row.total, done: row.done, percent: row.total ? Math.round((row.done / row.total) * 100) : 0 }));

  const learnedTotal = learnedCount();
  return {
    goal: goal,
    todayWords: todayWords,
    todayPercent: Math.min(100, Math.round((todayWords / goal) * 100)),
    restWords: Math.max(0, goal - todayWords),
    streak: currentStreak(),
    stars: state.stars || 0,
    learned: learnedTotal,
    totalWords: TOTAL_WORDS,
    mastery: TOTAL_WORDS ? Math.round((learnedTotal / TOTAL_WORDS) * 100) : 0,
    wrongCount: state.wrong.length,
    trend: trend,
    activeDays: activeDays,
    bestDay: bestDay,
    totalRecent: totalRecent,
    units: units,
    weak: weak,
    math: {
      total: stats.total, done: stats.done, todo: stats.todo,
      percent: stats.total ? Math.round((stats.done / stats.total) * 100) : 0,
      kps: kps
    },
    badges: dashboardBadges(currentStreak(), state.stars || 0, learnedTotal, stats.done, state.wrong.length)
  };
}

/* ---------- 备份 / 恢复 / 清空 ---------- */
function backupPayload() {
  const profiles = {};
  GRADES.forEach((grade) => {
    // 一律存成对象：restorePayload 会再 JSON.stringify 一次，这里若留原始字符串会双重编码
    profiles['en.' + grade + '.' + DEFAULT_EN_BOOK] = parseStored(stateKey(grade, DEFAULT_EN_BOOK));
    mathBookIds().forEach((book) => {
      profiles['math.' + grade + '.' + book] = parseStored(mathKey(grade, book));
    });
    EN_BOOKS.forEach((book) => {
      if (book.id === DEFAULT_EN_BOOK) return;
      if (bookEditions(book.id).indexOf(grade) < 0) return;
      profiles['en.' + grade + '.' + book.id] = parseStored(stateKey(grade, book.id));
    });
  });
  return {
    app: 'studyhub-miniprogram',
    version: 2,
    exportedAt: new Date().toISOString(),
    grade: currentGrade,
    enBook: currentEnBook,
    mathBook: currentMathBook,
    profiles: profiles
  };
}
function restorePayload(payload) {
  if (!payload || payload.version !== 2 || !payload.profiles) throw new Error('这不是学习通的备份文件');
  Object.keys(payload.profiles).forEach((key) => {
    const value = payload.profiles[key];
    if (!value) return;
    const parts = key.split('.');
    const scope = parts[0];
    const grade = Number(parts[1]);
    const book = parts[2];
    if (GRADES.indexOf(grade) < 0) return;
    writeStored(scope === 'en' ? stateKey(grade, book) : mathKey(grade, book), JSON.stringify(value));
  });
  currentGrade = GRADES.indexOf(Number(payload.grade)) >= 0 ? Number(payload.grade) : currentGrade;
  currentEnBook = enBookExists(payload.enBook) ? payload.enBook : currentEnBook;
  currentMathBook = mathBookExists(payload.mathBook) ? payload.mathBook : currentMathBook;
  writeStored(GRADE_KEY, currentGrade);
  writeStored(EN_BOOK_KEY, currentEnBook);
  writeStored(MATH_BOOK_KEY, currentMathBook);
  reloadProfiles();
}
function localDataStats() {
  let bytes = 0;
  let files = 0;
  GRADES.forEach((grade) => {
    const en = readStored(stateKey(grade, DEFAULT_EN_BOOK));
    if (en) bytes += String(en).length;
    mathBookIds().forEach((book) => {
      const raw = readStored(mathKey(grade, book));
      if (raw) bytes += String(raw).length;
    });
    EN_BOOKS.forEach((book) => {
      if (book.id === DEFAULT_EN_BOOK) return;
      const raw = readStored(stateKey(grade, book.id));
      if (raw) bytes += String(raw).length;
    });
  });
  let images = 0;
  mathState.items.forEach((it) => { images += ((it.images || []).length); });
  files = images;
  return { bytes: bytes, text: U.sizeText(bytes * 2), images: files };
}
function wipeLocalData() {
  GRADES.forEach((grade) => {
    removeStored(stateKey(grade, DEFAULT_EN_BOOK));
    mathBookIds().forEach((book) => removeStored(mathKey(grade, book)));
    EN_BOOKS.forEach((book) => { if (book.id !== DEFAULT_EN_BOOK) removeStored(stateKey(grade, book.id)); });
  });
  mathState.items.forEach((it) => { (it.images || []).forEach(removeImageFile); });
  reloadProfiles();
}

/* =========================================================
   云端同步
   ========================================================= */
function profilePairs() {
  const pairs = [];
  GRADES.forEach((grade) => {
    pairs.push({ grade: grade, scope: 'en', book: DEFAULT_EN_BOOK });
    mathBookIds().forEach((book) => pairs.push({ grade: grade, scope: 'math', book: book }));
    EN_BOOKS.forEach((book) => {
      if (book.id === DEFAULT_EN_BOOK) return;
      if (bookEditions(book.id).indexOf(grade) < 0) return;
      pairs.push({ grade: grade, scope: 'en', book: book.id });
    });
  });
  return pairs;
}
function profileKeyOf(pair) { return pair.scope + '.' + pair.grade + '.' + pair.book; }
function localPayload(pair) {
  const key = pair.scope === 'en' ? stateKey(pair.grade, pair.book) : mathKey(pair.grade, pair.book);
  const raw = readStored(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}
function writeLocalPayload(pair, payload) {
  const key = pair.scope === 'en' ? stateKey(pair.grade, pair.book) : mathKey(pair.grade, pair.book);
  writeStored(key, JSON.stringify(payload));
}
// 错题图片只在本机，云端只同步文字部分
function cloudPayload(pair, payload) {
  if (pair.scope !== 'math' || !payload) return payload;
  const copy = JSON.parse(JSON.stringify(payload));
  (copy.items || []).forEach((item) => { item.images = []; });
  return copy;
}
function mergeEnState(local, remote) {
  if (!local) return remote ? normalizeState(remote) : null;
  if (!remote) return normalizeState(local);
  const a = normalizeState(local);
  const b = normalizeState(remote);
  const learned = Object.assign({}, b.learned, a.learned);
  const wrong = [];
  (a.wrong || []).concat(b.wrong || []).forEach((id) => { if (wrong.indexOf(id) < 0) wrong.push(id); });
  const daily = (a.daily && a.daily.date && b.daily && a.daily.date === b.daily.date)
    ? {
      date: a.daily.date,
      words: (function () {
        const out = [];
        (a.daily.words || []).concat(b.daily.words || []).forEach((id) => { if (out.indexOf(id) < 0) out.push(id); });
        return out;
      })(),
      bonus: Boolean(a.daily.bonus || b.daily.bonus)
    }
    : (a.daily || b.daily);
  return {
    stars: Math.max(a.stars || 0, b.stars || 0),
    streak: Math.max(a.streak || 0, b.streak || 0),
    lastActive: a.lastActive && b.lastActive
      ? (a.lastActive > b.lastActive ? a.lastActive : b.lastActive)
      : (a.lastActive || b.lastActive || null),
    learned: learned,
    wrong: wrong,
    daily: daily,
    history: Object.assign({}, b.history, a.history),
    settings: Object.assign({}, a.settings)
  };
}
function mergeMathState(local, remote) {
  if (!local) return remote ? normalizeMathState(remote) : null;
  if (!remote) return normalizeMathState(local);
  const a = normalizeMathState(local);
  const b = normalizeMathState(remote);
  const byId = {};
  b.items.forEach((item) => { if (item && item.id) byId[item.id] = item; });
  a.items.forEach((item) => {
    if (!item || !item.id) return;
    const other = byId[item.id];
    if (!other) { byId[item.id] = item; return; }
    const newer = (item.updatedAt || 0) >= (other.updatedAt || 0) ? item : other;
    const merged = Object.assign({}, other, newer);
    merged.done = Boolean(item.done || other.done);
    // 本机图片永远优先，云端的空数组不能覆盖掉本地图
    merged.images = (item.images && item.images.length) ? item.images : (other.images || []);
    byId[item.id] = merged;
  });
  const customKps = [];
  (a.customKps || []).concat(b.customKps || []).forEach((kp) => { if (kp && customKps.indexOf(kp) < 0) customKps.push(kp); });
  return normalizeMathState({
    version: 1,
    items: Object.keys(byId).map((k) => byId[k]),
    customKps: customKps,
    updatedAt: Math.max(a.updatedAt || 0, b.updatedAt || 0)
  });
}
function mergePayload(scope, local, remote) {
  return scope === 'en' ? mergeEnState(local, remote) : mergeMathState(local, remote);
}
function setSync(status, text) {
  syncState = status;
  syncText = text || '';
  emit();
}
async function fetchRemote() {
  const map = {};
  if (!authUser) return map;
  const { data, error } = await cloud.database.from(CLOUD_TABLE).select('profile_key, scope, payload');
  if (error) throw error;
  (Array.isArray(data) ? data : []).forEach((row) => {
    if (!row || !row.profile_key || !row.payload) return;
    map[row.profile_key] = { scope: row.scope, payload: row.payload };
  });
  return map;
}
async function upsertRemote(pair, payload) {
  const { error } = await cloud.database.from(CLOUD_TABLE).upsert({
    profile_key: profileKeyOf(pair),
    scope: pair.scope,
    payload: cloudPayload(pair, payload)
  }, { onConflict: 'owner_id,profile_key,scope' });
  if (error) throw error;
}
// 登录后第一次：云端与本机双向合并，再把结果推回去
async function pullAndMerge() {
  if (!authUser) return false;
  setSync('busy', '正在同步…');
  suppressPush = true;
  try {
    const remote = await fetchRemote();
    const pairs = profilePairs();
    let changed = 0;
    for (let i = 0; i < pairs.length; i += 1) {
      const pair = pairs[i];
      const key = profileKeyOf(pair);
      const local = localPayload(pair);
      const hit = remote[key];
      const merged = mergePayload(pair.scope, local, hit ? hit.payload : null);
      if (!merged) continue;
      const localJson = local ? JSON.stringify(local) : '';
      const mergedJson = JSON.stringify(merged);
      if (mergedJson !== localJson) { writeLocalPayload(pair, merged); changed += 1; }
      if (!hit || JSON.stringify(hit.payload) !== JSON.stringify(cloudPayload(pair, merged))) {
        await upsertRemote(pair, merged);
      }
    }
    reloadProfiles();
    suppressPush = false;
    setSync('done', changed ? '已合并 ' + changed + ' 份档案' : '云端与本机一致');
    return changed;
  } catch (error) {
    suppressPush = false;
    setSync('error', '同步失败，可重试');
    throw error;
  }
}
async function pushLocal() {
  if (!authUser || syncInFlight) return;
  syncInFlight = true;
  setSync('busy', '正在上传…');
  try {
    const pairs = profilePairs();
    for (let i = 0; i < pairs.length; i += 1) {
      const payload = localPayload(pairs[i]);
      if (!payload) continue;
      await upsertRemote(pairs[i], payload);
    }
    setSync('done', '已同步');
  } catch (error) {
    setSync('error', '同步失败，可重试');
  } finally {
    syncInFlight = false;
  }
}
function schedulePush() {
  if (!authUser || suppressPush) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => { pushLocal(); }, SYNC_DEBOUNCE);
}

/* ---------- 登录态 ---------- */
async function refreshSession() {
  try {
    const { data: session, error } = await cloud.auth.getSession();
    authUser = (error || !session) ? null : session.user;
  } catch (e) {
    authUser = null;
  }
  if (!authUser) setSync('idle', '仅本机');
  emit();
  return authUser;
}
async function signOut() {
  try { await cloud.auth.signOut(); } catch (e) { /* ignore */ }
  authUser = null;
  setSync('idle', '仅本机');
}

/* ---------- 启动 ---------- */
function init() {
  const data = WORDS || {};
  // EN_BOOKS 必须先就位：下面恢复教材、ensureBookForGrade 都要查它
  EN_BOOKS = Array.isArray(data.books) && data.books.length ? data.books : [{
    id: 'general', name: '全国通用版', short: '通用', editions: GRADES
  }];

  const savedGrade = Number(readStored(GRADE_KEY));
  currentGrade = GRADES.indexOf(savedGrade) >= 0 ? savedGrade : DEFAULT_GRADE;
  const savedEn = readStored(EN_BOOK_KEY);
  currentEnBook = (savedEn && enBookMeta(savedEn) && enBookMeta(savedEn).id === savedEn) ? savedEn : DEFAULT_EN_BOOK;
  const savedMath = readStored(MATH_BOOK_KEY);
  currentMathBook = (savedMath && mathBookMeta(savedMath).id === savedMath) ? savedMath : DEFAULT_MATH_BOOK;

  prepareUnits(data.units || []);
  ensureBookForGrade(currentGrade);
  GOAL = Number(data.goal) > 0 ? Number(data.goal) : 10;
  reloadProfiles();
  return true;
}

module.exports = {
  // 常量
  GRADES: GRADES,
  DEFAULT_GRADE: DEFAULT_GRADE,
  GOAL_CHOICES: GOAL_CHOICES,
  ROUND_CHOICES: ROUND_CHOICES,
  PREF_DEFAULTS: PREF_DEFAULTS,
  MATH_BOOKS: MATH_BOOKS,
  APP_VERSION: '1.5.0',
  // 生命周期
  init: init,
  onChange: onChange,
  offChange: offChange,
  // 年级 / 教材
  getGrade: function () { return currentGrade; },
  setGrade: setGrade,
  getEnBook: function () { return currentEnBook; },
  setEnBook: setEnBook,
  getMathBook: function () { return currentMathBook; },
  setMathBook: setMathBook,
  enBooksForGrade: enBooksForGrade,
  enBookMeta: enBookMeta,
  mathBookMeta: mathBookMeta,
  mathBookKps: mathBookKps,
  mathBookIds: mathBookIds,
  unitCountOfBook: unitCountOfBook,
  bookEditions: bookEditions,
  // 词库 / 单元
  units: function () { return UNITS; },
  allUnits: function () { return ALL_UNITS; },
  allWords: function () { return ALL_WORDS; },
  wordById: function (id) { return WORD_MAP[id] || null; },
  totalWords: function () { return TOTAL_WORDS; },
  goal: function () { return GOAL; },
  getUnit: getUnit,
  unitLearned: unitLearned,
  // 英语档案
  state: function () { return state; },
  saveState: saveState,
  prefs: prefs,
  setPref: setPref,
  ensureDaily: ensureDaily,
  learnedCount: learnedCount,
  currentStreak: currentStreak,
  noteActivity: noteActivity,
  addDailyWord: addDailyWord,
  addStars: addStars,
  markWord: markWord,
  addWrongWord: addWrongWord,
  removeWrongWord: removeWrongWord,
  // 数学档案
  mathState: function () { return mathState; },
  saveMathState: saveMathState,
  mathPresetKps: mathPresetKps,
  mathKpList: mathKpList,
  mathItemById: mathItemById,
  mathStats: mathStats,
  addMathItem: addMathItem,
  updateMathItem: updateMathItem,
  deleteMathItem: deleteMathItem,
  toggleMathDone: toggleMathDone,
  addCustomKp: addCustomKp,
  saveImageFile: saveImageFile,
  removeImageFile: removeImageFile,
  // 仪表盘
  dashboardSnapshot: dashboardSnapshot,
  // 数据管理
  backupPayload: backupPayload,
  restorePayload: restorePayload,
  localDataStats: localDataStats,
  wipeLocalData: wipeLocalData,
  // 云同步
  getAuthUser: function () { return authUser; },
  getSyncState: function () { return syncState; },
  getSyncText: function () { return syncText; },
  setSync: setSync,
  refreshSession: refreshSession,
  pullAndMerge: pullAndMerge,
  pushLocal: pushLocal,
  signOut: signOut
};
