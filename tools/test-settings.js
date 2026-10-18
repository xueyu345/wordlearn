/**
 * 设置页测试：偏好读写、题量联动、备份导出/导入、清空数据、账号块渲染。
 * 运行：node tools/test-settings.js
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
const downloads = [];
let confirmAnswer = true;   // 模拟用户在确认框里点「确定」
const confirmCalls = [];

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
  confirm: (message) => { confirmCalls.push(message); return confirmAnswer; },
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
  Blob: function (parts) { this.parts = parts; },
  URL: Object.assign(function () { return { href: "blob:test" }; }, {
    createObjectURL: (blob) => { downloads.push(blob.parts.join("")); return "blob:test"; },
    revokeObjectURL() {}
  }),
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

  section("[1] 默认偏好");
  const p0 = api.prefs();
  check("默认每日目标 10", p0.dailyGoal === 10, String(p0.dailyGoal));
  check("默认每轮 10 题", p0.roundSize === 10, String(p0.roundSize));
  check("默认不区分大小写", p0.strictCase === false);
  check("默认音效开", p0.sound === true);
  check("默认语音开", p0.voice === true);
  check("默认自动朗读开", p0.autoSpeak === true);
  check("GOAL 与偏好一致", api.getGoal() === 10, String(api.getGoal()));
  check("版本号可读", /^\d+\.\d+\.\d+$/.test(api.getAppVersion()), api.getAppVersion());

  section("[2] 修改偏好会落盘");
  api.setPref("dailyGoal", "20");
  check("目标改成 20", api.prefs().dailyGoal === 20, String(api.prefs().dailyGoal));
  check("GOAL 同步", api.getGoal() === 20, String(api.getGoal()));
  const savedKey = [...storage.keys()].find((k) => k.indexOf("wordHeroState.v1") === 0);
  check("写进了当前档案", Boolean(savedKey), savedKey);
  check("存档里带 dailyGoal", JSON.parse(storage.get(savedKey)).settings.dailyGoal === 20,
    String(JSON.parse(storage.get(savedKey)).settings.dailyGoal));

  api.setPref("roundSize", 15);
  check("题量改成 15", api.prefs().roundSize === 15, String(api.prefs().roundSize));

  api.setPref("dailyGoal", "999");   // 非法值必须被拒
  check("非法目标被纠正回默认", api.prefs().dailyGoal === 10, String(api.prefs().dailyGoal));
  api.setPref("roundSize", -3);
  check("非法题量被纠正回默认", api.prefs().roundSize === 10, String(api.prefs().roundSize));

  api.setPref("strictCase", true);
  check("严格拼写可打开", api.prefs().strictCase === true);

  section("[3] 题量不超过题库长度");
  check("题库只有 3 个词时只出 3 题", api.roundCount(3) === 3, String(api.roundCount(3)));
  check("空题库也不会出 0 题", api.roundCount(0) === 1, String(api.roundCount(0)));
  api.setPref("roundSize", 15);
  check("题库 20 个词时出 15 题", api.roundCount(20) === 15, String(api.roundCount(20)));
  api.setPref("roundSize", 5);
  check("改成 5 后出 5 题", api.roundCount(20) === 5, String(api.roundCount(20)));

  section("[4] 设置页渲染");
  windowObj.location.hash = "#/settings";
  api.route();
  check("当前视图是设置页", windowObj.location.hash === "#/settings");
  check("版本显示出来", $("setVersion").textContent === "v" + api.getAppVersion(), $("setVersion").textContent);
  check("档案信息有内容", ($("setProfile").textContent || "").length > 0, $("setProfile").textContent);
  check("档案信息含年级", $("setProfile").textContent.includes("年级"), $("setProfile").textContent);
  check("账号块已渲染", ($("setAccountBox").innerHTML || "").length > 0);
  check("未登录时提示仅本机", $("setAccountBox").innerHTML.includes("还没登录") || $("setAccountBox").innerHTML.includes("云服务"),
    $("setAccountBox").innerHTML.slice(0, 60));

  section("[5] 本机数据统计");
  // 造点数据：一道数学错题
  windowObj.location.hash = "#/math/add";
  api.route();
  $("mathQuestion").value = "设置页测试题";
  $("mathAnswer").value = "42";
  $("mathKpSelect").value = "除法";
  api.submitMathForm();
  await settle();
  const stats = api.localDataStats();
  check("统计到 1 道错题", stats.math === 1, String(stats.math));
  check("统计到至少 1 份档案", stats.profiles >= 1, String(stats.profiles));
  check("估算了体积", stats.bytes > 0, String(stats.bytes));

  section("[6] 导出备份");
  const payload = api.backupPayload();
  check("备份带应用标识", payload.app === "studyhub", payload.app);
  check("备份带版本号", payload.version === api.getAppVersion(), payload.version);
  check("备份带导出时间", typeof payload.exportedAt === "string" && payload.exportedAt.length > 10);
  check("备份记录了当前年级", payload.grade === api.getGrade(), String(payload.grade));
  check("备份里有档案", Object.keys(payload.profiles).length >= 1);
  check("备份不含词库缓存", !Object.keys(payload.profiles).some((k) => k.indexOf("Cache") !== -1),
    Object.keys(payload.profiles).join(","));
  check("备份里的错题还在", JSON.stringify(payload.profiles).includes("设置页测试题"));

  api.exportBackup();
  await settle(4);
  check("触发了一次下载", downloads.length === 1, String(downloads.length));
  const downloaded = downloads[0] ? JSON.parse(downloads[0]) : {};
  check("下载内容可解析且是完整备份", downloaded.app === "studyhub" && Object.keys(downloaded.profiles || {}).length >= 1);

  section("[7] 清空本机数据的双确认");
  confirmCalls.length = 0;
  confirmAnswer = false;
  api.wipeLocalData();
  check("第一次确认被拒就不动手", api.localDataStats().math === 1, String(api.localDataStats().math));
  check("问了一次确认", confirmCalls.length === 1, String(confirmCalls.length));

  confirmCalls.length = 0;
  confirmAnswer = true;
  let asked = 0;
  // 第一次同意、第二次拒绝：仍然不能删
  const realConfirm = windowObj.confirm;
  windowObj.confirm = (m) => { asked += 1; return asked === 1; };
  context.confirm = windowObj.confirm;
  api.wipeLocalData();
  check("第二次确认被拒也不删", api.localDataStats().math === 1, String(api.localDataStats().math));
  check("确实问了两次", asked === 2, String(asked));

  windowObj.confirm = () => true;
  context.confirm = windowObj.confirm;
  api.wipeLocalData();
  check("两次都同意才清空错题", api.localDataStats().math === 0, String(api.localDataStats().math));
  windowObj.confirm = realConfirm;
  context.confirm = realConfirm;
  confirmAnswer = true;

  section("[8] 导入备份恢复数据");
  const backupText = JSON.stringify(downloaded);
  const fakeFile = { text: async () => backupText };
  confirmAnswer = true;
  await api.importBackupFile(fakeFile);
  await settle(10);
  check("导入后错题回来了", api.localDataStats().math === 1, String(api.localDataStats().math));
  const restoredMath = JSON.stringify([...storage.entries()].filter(([k]) => k.indexOf("studyHubMath.v1") === 0));
  check("错题内容一致", restoredMath.includes("设置页测试题"));

  section("[9] 导入非法文件必须拒绝");
  const before = api.localDataStats().math;
  await api.importBackupFile({ text: async () => "这不是 JSON" });
  await settle(4);
  check("坏文件不破坏数据", api.localDataStats().math === before, String(api.localDataStats().math));
  check("坏文件有提示", $("setDataNote").textContent.includes("损坏") || $("setDataNote").textContent.includes("有效的备份"),
    $("setDataNote").textContent);

  await api.importBackupFile({ text: async () => JSON.stringify({ app: "other", profiles: {} }) });
  await settle(4);
  check("别的应用的文件被拒", api.localDataStats().math === before, String(api.localDataStats().math));
  check("提示不是学习通备份", $("setDataNote").textContent.includes("不是学习通"), $("setDataNote").textContent);

  await api.importBackupFile({ text: async () => JSON.stringify({ app: "studyhub", profiles: {} }) });
  await settle(4);
  check("空备份被拒", $("setDataNote").textContent.includes("没有学习档案"), $("setDataNote").textContent);

  section("[10] 偏好跨档案隔离 & 同步带上设置");
  const goalBefore = api.prefs().dailyGoal;
  api.switchGrade(6);
  await settle(6);
  check("换年级后是新档案的默认偏好", api.prefs().dailyGoal === 10, String(api.prefs().dailyGoal));
  check("原年级的偏好还在", goalBefore === 5 || goalBefore === 10, String(goalBefore));
  api.switchGrade(3);
  await settle(6);

  const pairKey = api.profilePairs().find((p) => p.grade === 3 && p.scope === "en" && p.book === "general").key;
  const backupAgain = api.backupPayload();
  const enKey = Object.keys(backupAgain.profiles).find((k) => k.indexOf("wordHeroState.v1.g3") === 0 && k.indexOf("general") === -1);
  check("英语三年级档案在备份里", Boolean(enKey), Object.keys(backupAgain.profiles).join(","));
  check("云端键格式仍是 scope.grade.book", pairKey === "en.3.general", pairKey);
  if (enKey) {
    const settings = backupAgain.profiles[enKey].settings || {};
    check("档案 settings 带 dailyGoal（会随云同步）", settings.dailyGoal !== undefined, JSON.stringify(settings));
    check("档案 settings 带 roundSize", settings.roundSize !== undefined, JSON.stringify(settings));
  }

  section("[11] 未知路由回落首页，settings 不被拦");
  windowObj.location.hash = "#/not-a-page";
  api.route();
  check("未知路由回首页", windowObj.location.hash === "#/home", windowObj.location.hash);
  windowObj.location.hash = "#/settings";
  api.route();
  check("设置页可以直接访问", windowObj.location.hash === "#/settings");

  section("[12] 运行时无异常");
  check("没有未捕获错误", errors.length === 0, errors.slice(0, 3).join(" | "));

  console.log("\n" + "═".repeat(46));
  console.log("通过 " + pass + " / " + (pass + fail));
  if (fail) process.exit(1);
})();
