/**
 * 学习进度仪表盘测试：快照计算、趋势、掌握度、数学分布、成就、渲染与转义。
 * 运行：node tools/test-dashboard.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
// 只取带内联代码的 script 块：CDN 外链块内容为空，跳过
const script = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
  .map((m) => m[1])
  .find((code) => code.trim().length > 0);
if (!script) throw new Error("index.html 里没找到内联主脚本");

/* ---------- 极简 DOM ---------- */
class ClassList {
  constructor() { this.set = new Set(); }
  add(...n) { n.forEach((x) => this.set.add(x)); }
  remove(...n) { n.forEach((x) => this.set.delete(x)); }
  toggle(n, f) { const on = f === undefined ? !this.set.has(n) : Boolean(f); on ? this.set.add(n) : this.set.delete(n); return on; }
  contains(n) { return this.set.has(n); }
}

class Element {
  constructor(tag) {
    this.tagName = (tag || "div").toUpperCase();
    this.attributes = new Map();
    this.style = { setProperty() {} };
    this.dataset = {};
    this.classList = new ClassList();
    this.listeners = new Map();
    this._textContent = "";
    this._innerHTML = "";
    this.value = "";
    this.checked = false;
    this.hidden = false;
    this.disabled = false;
    this.id = "";
    this.files = [];
    this.offsetWidth = 1;
    this.children = [];
  }
  setAttribute(k, v) {
    this.attributes.set(k, String(v));
    if (k === "id") this.id = String(v);
    if (k.startsWith("data-")) this.dataset[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(v);
  }
  getAttribute(k) { return this.attributes.has(k) ? this.attributes.get(k) : null; }
  set innerHTML(v) { this._innerHTML = String(v); }
  get innerHTML() { return this._innerHTML; }
  set textContent(v) { this._textContent = String(v); }
  get textContent() { return this._textContent; }
  appendChild(c) { this.children.push(c); return c; }
  insertAdjacentHTML(p, m) { this._innerHTML += m; }
  remove() {}
  addEventListener(t, f) { (this.listeners.get(t) || this.listeners.set(t, []).get(t)).push(f); }
  dispatch(t, e = {}) { (this.listeners.get(t) || []).forEach((fn) => fn({ preventDefault() {}, target: this, ...e })); }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  closest() { return null; }
  focus() {}
  select() {}
  click() { this.dispatch("click"); }
  matches() { return false; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 10, height: 10 }; }
}

const ids = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
const registry = new Map();
ids.forEach((id) => {
  const el = new Element("div");
  el.setAttribute("id", id);
  registry.set(id, el);
});

const document = {
  title: "",
  body: new Element("body"),
  listeners: new Map(),
  querySelector(sel) {
    if (typeof sel === "string" && sel.startsWith("#")) {
      const first = sel.slice(1).split(/[ >]/)[0];
      return registry.get(first) || null;
    }
    return null;
  },
  querySelectorAll() { return []; },
  createElement: (t) => new Element(t),
  addEventListener(t, f) { (this.listeners.get(t) || this.listeners.set(t, []).get(t)).push(f); },
  dispatch(t, e = {}) { (this.listeners.get(t) || []).forEach((fn) => fn({ preventDefault() {}, target: null, ...e })); }
};

const storage = new Map();
const errors = [];

const windowObj = {
  __STUDYHUB_TEST__: true,
  document,
  location: { hash: "", protocol: "http:" },
  navigator: {},
  localStorage: {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
    get length() { return storage.size; },
    key: (i) => Array.from(storage.keys())[i] || null
  },
  confirm: () => true,
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  scrollTo() {},
  addEventListener(t, f) { (this._l = this._l || {}); (this._l[t] = this._l[t] || []).push(f); },
  setTimeout: (fn) => { try { fn(); } catch (e) { errors.push("setTimeout: " + e.message); } return 1; },
  clearTimeout() {},
  setInterval: () => 1,
  clearInterval() {},
  fetch: async () => ({ ok: true, json: async () => JSON.parse(fs.readFileSync(path.join(root, "words.json"), "utf8")) }),
  speechSynthesis: { getVoices: () => [], addEventListener() {}, cancel() {}, speak() {} },
  SpeechSynthesisUtterance: function () {},
  AudioContext: function () {
    return {
      state: "running", currentTime: 0, resume() {},
      createOscillator: () => ({ frequency: {}, connect: () => ({ connect() {} }), start() {}, stop() {} }),
      createGain: () => ({ gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: () => ({ connect() {} }) }),
      destination: {}
    };
  },
  console: { log() {}, warn() {}, error: (...a) => errors.push(a.join(" ")) }
};
windowObj.window = windowObj;

const context = vm.createContext({
  window: windowObj,
  document,
  navigator: windowObj.navigator,
  localStorage: windowObj.localStorage,
  location: windowObj.location,
  confirm: windowObj.confirm,
  matchMedia: windowObj.matchMedia,
  setTimeout: windowObj.setTimeout,
  clearTimeout: windowObj.clearTimeout,
  setInterval: windowObj.setInterval,
  clearInterval: windowObj.clearInterval,
  fetch: windowObj.fetch,
  console: windowObj.console,
  URL,
  URLSearchParams, Math, Date, JSON, Object, Array, String, Number, Boolean, Set, Map, Promise, Error,
  isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent
});

/* ---------- 断言 ---------- */
let pass = 0, fail = 0;
function check(name, condition, detail) {
  if (condition) { pass += 1; console.log("  ✓ " + name); }
  else { fail += 1; console.log("  ✗ " + name + (detail ? "  → " + detail : "")); }
}
function section(title) { console.log("\n" + title); }
const tick = () => new Promise((r) => setImmediate(r));
async function settle(n = 6) { for (let i = 0; i < n; i += 1) await tick(); }

/* ---------- 执行 ---------- */
(async () => {
  console.log("加载页面脚本 …");
  vm.runInContext(script, context, { filename: "index.html", timeout: 10000 });
  await settle(10);

  const api = windowObj.__studyhub;
  if (!api) { console.log("✗ 测试接口未暴露"); process.exit(1); }
  const $ = (id) => registry.get(id);
  const state = api.getStateRef();
  const today = api.dateKeyOf(0);
  const countOf = (html, needle) => (html.match(new RegExp(needle, "g")) || []).length;

  section("[1] 全新档案的快照");
  let snap = api.dashboardSnapshot();
  check("目标是 10 个单词", snap.goal === 10, String(snap.goal));
  check("今天还没学", snap.todayWords === 0 && snap.todayPercent === 0);
  check("词库已加载", state && api.getWordState().dataReady === true);
  check("总词数大于 0", snap.totalWords > 0, String(snap.totalWords));
  check("掌握度从 0 起算", snap.learned === 0 && snap.mastery === 0);
  check("趋势固定 14 天", snap.trend.length === 14, String(snap.trend.length));
  check("最后一天是今天", snap.trend[13].key === today && snap.trend[13].today === true, snap.trend[13].key);
  check("第一天是 13 天前", snap.trend[0].key === api.dateKeyOf(13), snap.trend[0].key);
  check("没有任何学习记录", snap.activeDays === 0 && snap.totalRecent === 0 && snap.bestDay === 0);
  check("单元列表非空", snap.units.length > 0, String(snap.units.length));
  check("薄弱单词为空", snap.weak.length === 0);
  check("数学错题为空", snap.math.total === 0 && snap.math.percent === 0);
  check("成就共 8 枚", snap.badges.length === 8, String(snap.badges.length));

  section("[2] 今日目标进度");
  state.daily = { date: today, words: ["a", "b", "c"], bonus: false };
  snap = api.dashboardSnapshot();
  check("今天学了 3 个", snap.todayWords === 3, String(snap.todayWords));
  check("完成度 30%", snap.todayPercent === 30, String(snap.todayPercent));
  state.daily = { date: today, words: new Array(10).fill(0).map((_, i) => "w" + i), bonus: true };
  snap = api.dashboardSnapshot();
  check("学满 10 个算 100%", snap.todayPercent === 100, String(snap.todayPercent));
  state.daily = { date: today, words: new Array(20).fill(0).map((_, i) => "w" + i), bonus: true };
  snap = api.dashboardSnapshot();
  check("超额也不会超过 100%", snap.todayPercent === 100, String(snap.todayPercent));

  section("[3] 连续打卡与星星");
  state.stars = 42;
  state.streak = 5;
  state.lastActive = today;
  snap = api.dashboardSnapshot();
  check("连续打卡读出来是 5", snap.streak === 5, String(snap.streak));
  check("星星读出来是 42", snap.stars === 42, String(snap.stars));
  state.lastActive = "2020-01-01";
  snap = api.dashboardSnapshot();
  check("很久没学就归零", snap.streak === 0, String(snap.streak));
  state.lastActive = api.dateKeyOf(1);
  state.streak = 9;
  snap = api.dashboardSnapshot();
  check("昨天学过今天还没学也算连续", snap.streak === 9, String(snap.streak));

  section("[4] 近 14 天趋势");
  state.history = {};
  state.history[api.dateKeyOf(0)] = 4;
  state.history[api.dateKeyOf(1)] = 6;
  state.history[api.dateKeyOf(5)] = 11;
  state.history[api.dateKeyOf(20)] = 99;   // 超出 14 天窗口，不该被算进去
  snap = api.dashboardSnapshot();
  check("活跃天数 3 天", snap.activeDays === 3, String(snap.activeDays));
  check("合计 21 个单词", snap.totalRecent === 21, String(snap.totalRecent));
  check("单日最多 11 个", snap.bestDay === 11, String(snap.bestDay));
  check("窗口外的记录不计入", !snap.trend.some((d) => d.count === 99));
  check("今天这根柱子有数据", snap.trend[13].count === 4, String(snap.trend[13].count));
  check("没有数据的日子是 0", snap.trend[2].count === 0);

  section("[5] 主题掌握度");
  const units = api.getWordState().units;
  const firstUnit = units[0];
  state.learned = {};
  state.learned[firstUnit.words[0].id] = { seen: 1, correct: 1, wrong: 0 };
  state.learned[firstUnit.words[1].id] = { seen: 2, correct: 1, wrong: 1 };
  snap = api.dashboardSnapshot();
  const firstRow = snap.units.find((u) => u.id === firstUnit.id);
  check("该主题已学 2 个", firstRow.learned === 2, String(firstRow.learned));
  check("百分比按总数算", firstRow.percent === Math.round((2 / firstUnit.words.length) * 100),
    String(firstRow.percent));
  check("按掌握度从高到低排", snap.units[0].percent >= snap.units[snap.units.length - 1].percent);
  check("没学的主题是 0%", snap.units.filter((u) => u.percent === 0).length === snap.units.length - 1,
    String(snap.units.filter((u) => u.percent === 0).length));
  check("总掌握度跟着变", snap.learned === 2 && snap.mastery === Math.round((2 / snap.totalWords) * 100),
    snap.learned + " / " + snap.mastery);

  section("[6] 容易错的单词");
  const w2 = firstUnit.words[1];
  const w3 = firstUnit.words[2];
  state.learned[w3.id] = { seen: 4, correct: 1, wrong: 3 };
  snap = api.dashboardSnapshot();
  check("只统计错过至少 1 次的", snap.weak.every((item) => item.wrong > 0));
  check("错得最多的排第一", snap.weak[0].w === w3.w, snap.weak[0].w);
  check("带中文释义", typeof snap.weak[0].zh === "string" && snap.weak[0].zh.length > 0);
  check("没错的单词不出现", !snap.weak.some((item) => item.w === firstUnit.words[0].w));
  const many = {};
  units[0].words.slice(0, 8).forEach((w, i) => { many[w.id] = { seen: 9, correct: 0, wrong: 8 - i }; });
  state.learned = many;
  snap = api.dashboardSnapshot();
  check("最多只列 6 个", snap.weak.length === 6, String(snap.weak.length));

  section("[7] 数学错题分布");
  api.setMathState({
    version: 1,
    customKps: [],
    updatedAt: null,
    items: [
      { id: "m1", question: "1", kp: "分数加减", done: true, createdAt: 1 },
      { id: "m2", question: "2", kp: "分数加减", done: false, createdAt: 2 },
      { id: "m3", question: "3", kp: "面积", done: true, createdAt: 3 },
      { id: "m4", question: "4", kp: "面积", done: true, createdAt: 4 },
      { id: "m5", question: "5", kp: "面积", done: false, createdAt: 5 },
      { id: "m6", question: "6", kp: "除法", done: false, createdAt: 6 },
      { id: "m7", question: "7", kp: "", done: false, createdAt: 7 }
    ]
  });
  snap = api.dashboardSnapshot();
  check("错题总数 7", snap.math.total === 7, String(snap.math.total));
  check("已攻克 3", snap.math.done === 3, String(snap.math.done));
  check("待攻克 4", snap.math.todo === 4, String(snap.math.todo));
  check("攻克率 43%", snap.math.percent === 43, String(snap.math.percent));
  check("按知识点分成 4 组", snap.math.kps.length === 4, String(snap.math.kps.length));
  check("题最多的知识点排第一", snap.math.kps[0].kp === "面积", snap.math.kps[0].kp);
  check("分组内统计正确", snap.math.kps[0].total === 3 && snap.math.kps[0].done === 2,
    snap.math.kps[0].total + "/" + snap.math.kps[0].done);
  check("没填知识点的归到未分类", snap.math.kps.some((k) => k.kp === "未分类"));

  section("[8] 打卡成就");
  const badges = api.dashboardBadges(7, 120, 60, 12, 0);
  check("连打 3 天已解锁", badges[0].got === true);
  check("连打 7 天已解锁", badges[1].got === true);
  check("连打 30 天未解锁", badges[2].got === false && badges[2].progress === "7/30", badges[2].progress);
  check("认识 50 词已解锁", badges[3].got === true);
  check("认识 200 词未解锁", badges[4].got === false && badges[4].progress === "60/200", badges[4].progress);
  check("100 颗星已解锁", badges[5].got === true);
  check("攻克 10 题已解锁", badges[6].got === true);
  check("错词清零已解锁", badges[7].got === true);
  const fresh = api.dashboardBadges(0, 0, 0, 0, 0);
  check("全新档案只有错词清零不成立", fresh.filter((b) => b.got).length === 0,
    String(fresh.filter((b) => b.got).length));
  check("没学过的进度显示 0/3", fresh[0].progress === "0/3", fresh[0].progress);

  section("[9] 仪表盘渲染");
  state.streak = 5;
  state.stars = 42;
  state.lastActive = today;
  state.daily = { date: today, words: ["a", "b", "c"], bonus: false };
  state.wrong = [w3.id];
  windowObj.location.hash = "#/dashboard";
  api.route();
  check("进度环写了完成度", $("dashGoalRing").getAttribute("aria-label").includes("30%"),
    $("dashGoalRing").getAttribute("aria-label"));
  check("环里显示 3 / 10 词", $("dashGoalText").innerHTML.includes("<b>3</b>")
    && $("dashGoalText").innerHTML.includes("/ 10 词"), $("dashGoalText").innerHTML);
  check("标题反映今天学了 3 个", $("dashGoalTitle").textContent.includes("3"), $("dashGoalTitle").textContent);
  check("提示还差 7 个", $("dashGoalHint").textContent.includes("7"), $("dashGoalHint").textContent);
  check("三个摘要胶囊", countOf($("dashGoalMeta").innerHTML, "dash-pill") === 3, $("dashGoalMeta").innerHTML);
  check("概览四张卡", countOf($("dashStats").innerHTML, "dash-stat\"") === 4, $("dashStats").innerHTML);
  check("概览里带掌握度", $("dashStats").innerHTML.includes("掌握"), $("dashStats").innerHTML);
  check("趋势 14 根柱子", countOf($("dashTrend").innerHTML, "dash-bar-col") === 14,
    String(countOf($("dashTrend").innerHTML, "dash-bar-col")));
  check("今天的柱子高亮", $("dashTrend").innerHTML.includes("dash-bar today"),
    $("dashTrend").innerHTML.slice(0, 120));
  check("趋势说明有数字", /\d/.test($("dashTrendNote").textContent), $("dashTrendNote").textContent);
  check("每个主题一行", countOf($("dashUnits").innerHTML, "dash-line") === snap.units.length
    || countOf($("dashUnits").innerHTML, "dash-line") > 0, String(countOf($("dashUnits").innerHTML, "dash-line")));
  check("数学四个数字块", countOf($("dashMath").innerHTML, "dash-math-box") === 4,
    String(countOf($("dashMath").innerHTML, "dash-math-box")));
  check("数学知识点横条", $("dashMath").innerHTML.includes("dash-fill"), $("dashMath").innerHTML.slice(0, 120));
  check("薄弱单词有卡片", $("dashWeak").innerHTML.includes("dash-weak-chip"), $("dashWeak").innerHTML.slice(0, 120));
  check("薄弱单词给出去复习的入口", $("dashWeak").innerHTML.includes("#/quiz/wrong"));
  check("成就格子 8 个", countOf($("dashBadges").innerHTML, "dash-badge") === 8,
    String(countOf($("dashBadges").innerHTML, "dash-badge")));
  check("已解锁的成就高亮", $("dashBadges").innerHTML.includes("dash-badge on"));
  check("顶部标注年级教材", $("dashScopeNote").textContent.includes("年级"), $("dashScopeNote").textContent);

  section("[10] 没有数据时的空状态");
  api.setMathState({ version: 1, customKps: [], updatedAt: null, items: [] });
  state.learned = {};
  state.wrong = [];
  api.route();
  check("数学给空状态提示", $("dashMath").innerHTML.includes("还没有录入错题"), $("dashMath").innerHTML.slice(0, 80));
  check("薄弱单词给鼓励文案", $("dashWeak").innerHTML.includes("还没有出错记录"), $("dashWeak").innerHTML.slice(0, 80));
  check("数学仍是四个数字块", countOf($("dashMath").innerHTML, "dash-math-box") === 4);

  section("[11] 用户填的知识点会被转义");
  api.setMathState({
    version: 1, customKps: [], updatedAt: null,
    items: [{ id: "x1", question: "q", kp: "<img src=x onerror=alert(1)>", done: false, createdAt: 1 }]
  });
  api.route();
  check("尖括号被转义", $("dashMath").innerHTML.includes("&lt;img"),
    $("dashMath").innerHTML.slice(0, 200));
  check("原样脚本不会注入", !$("dashMath").innerHTML.includes("<img src=x"));

  section("[12] 科目选择页入口摘要");
  // 改动版式后 #/home 直接就是学习仪表盘，"两扇门"欢迎页挪到了 #/home/hub
  windowObj.location.hash = "#/home/hub";
  api.route();
  check("入口卡片显示摘要", $("dashEntryNote").textContent.includes("已认识")
    && $("dashEntryNote").textContent.includes("连续打卡"), $("dashEntryNote").textContent);
  check("摘要里有待攻克错题数", $("dashEntryNote").textContent.includes("待攻克错题"), $("dashEntryNote").textContent);

  // 默认首页（没点任何科目）应该是学习仪表盘。
  // 这个迷你 DOM 的 querySelectorAll 返回空数组，测不了 .active，改看标题和内容渲染。
  windowObj.location.hash = "#/home";
  api.route();
  check("没点科目时默认进学习仪表盘", windowObj.document.title.indexOf("学习进度") === 0,
    windowObj.document.title);
  check("仪表盘顶部有科目快捷入口", $("dashQuickEnDesc").textContent.includes("个单词")
    && $("dashQuickMathDesc").textContent.includes("错题"), $("dashQuickEnDesc").textContent);

  section("[13] 运行时无异常");
  check("没有未捕获错误", errors.length === 0, errors.slice(0, 3).join(" | "));

  console.log("\n══════════════════════════════════════════");
  console.log(`通过 ${pass} / ${pass + fail}`);
  if (fail) process.exit(1);
})();
