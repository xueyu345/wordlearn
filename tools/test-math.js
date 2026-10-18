/**
 * 数学错题本端到端测试：直接调用页面内部函数，验证真实业务逻辑。
 * 运行：node tools/test-math.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = html.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];

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
  click() {}
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
      // 支持 "#a b" 形式取第一段
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
    removeItem: (k) => storage.delete(k)
  },
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
  matchMedia: windowObj.matchMedia,
  setTimeout: windowObj.setTimeout,
  clearTimeout: windowObj.clearTimeout,
  setInterval: windowObj.setInterval,
  clearInterval: windowObj.clearInterval,
  fetch: windowObj.fetch,
  console: windowObj.console,
  Image: function () {},
  FileReader: function () {},
  URLSearchParams, Math, Date, JSON, Object, Array, String, Number, Boolean, Set, Map, Promise, Error,
  isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent
});

/* ---------- 断言 ---------- */
let pass = 0, fail = 0;
function check(name, condition, detail) {
  if (condition) { pass += 1; console.log("  ✓ " + name); }
  else { fail += 1; console.log("  ✗ " + name + (detail ? "  → " + detail : "")); }
}

/* ---------- 执行 ---------- */
console.log("加载页面脚本 …");
vm.runInContext(script, context, { filename: "index.html", timeout: 10000 });

setTimeout(() => {
  const api = windowObj.__studyhub;
  if (!api) {
    console.log("✗ 测试接口未暴露，无法继续");
    process.exit(1);
  }

  console.log("\n[1] 首页双入口");
  api.route.call(null); // hash 为空 -> #/home
  const words = api.getWordState();
  check("英语词库加载成功", words.dataReady === true);
  check("默认年级为三年级", api.getGrade() === 3, "实际 " + api.getGrade());
  check("三年级词库共 104 词", words.total === 104, "实际 " + words.total);
  check("三年级共 10 个主题", words.units.length === 10, "实际 " + words.units.length);
  check("单元都带年级字段", words.units.every((u) => u.grade === 3));
  check("首页显示已认识单词数", registry.get("hubLearned").textContent === "0", registry.get("hubLearned").textContent);
  check("首页显示错题总数 0", registry.get("hubMathTotal").textContent === "0", registry.get("hubMathTotal").textContent);

  console.log("\n[2] 录入第一道错题");
  windowObj.location.hash = "#/math/add";
  api.route();
  registry.get("mathQuestion").value = "小明有 24 颗糖，平均分给 6 个小朋友，每人分到几颗？";
  registry.get("mathAnswer").value = "24 ÷ 6 = 4（颗）";
  registry.get("mathMyAnswer").value = "24 ÷ 6 = 6";
  registry.get("mathReason").value = "除法口诀背错了";
  registry.get("mathKpSelect").value = "乘除法";
  registry.get("mathTypeSelect").value = "应用题";
  api.submitMathForm();
  const state1 = api.getMathState();
  check("错题已写入", state1.items.length === 1, "实际 " + state1.items.length);
  check("题目内容正确", state1.items[0].question.includes("24 颗糖"));
  check("知识点已记录", state1.items[0].kp === "乘除法", state1.items[0].kp);
  check("入库后跳回错题本主页", windowObj.location.hash === "#/home/math", windowObj.location.hash);

  console.log("\n[3] 再录一道（新建知识点 + 必填校验）");
  windowObj.location.hash = "#/math/add";
  api.route();
  // 空题目提交应被拦截
  api.submitMathForm();
  check("空题目被拦截", api.getMathState().items.length === 1);

  registry.get("mathQuestion").value = "一个长方形长 8cm，宽 5cm，求面积。";
  registry.get("mathAnswer").value = "8 × 5 = 40（平方厘米）";
  registry.get("mathKpSelect").value = "__new__";
  registry.get("mathNewKp").value = "长方形面积";
  api.submitMathForm();
  const state2 = api.getMathState();
  check("第二道已写入", state2.items.length === 2, "实际 " + state2.items.length);
  check("新知识点已保存", state2.customKps.includes("长方形面积"), JSON.stringify(state2.customKps));

  console.log("\n[4] 错题本主页渲染");
  windowObj.location.hash = "#/home/math";
  api.route();
  check("待攻克数 = 2", registry.get("mathStatTodo").textContent === "2", registry.get("mathStatTodo").textContent);
  check("已掌握数 = 0", registry.get("mathStatDone").textContent === "0", registry.get("mathStatDone").textContent);
  check("知识点卡片已渲染", registry.get("kpGrid").innerHTML.includes("乘除法"));
  check("列表渲染出两张卡片", (registry.get("mathList").innerHTML.match(/math-item/g) || []).length >= 2);

  console.log("\n[5] 标记掌握 / 取消掌握");
  const firstId = api.getMathState().items[0].id;
  api.toggleMathDone(firstId);
  check("标记后 done=true", api.getMathState().items.find((i) => i.id === firstId).done === true);
  check("已掌握数变 1", registry.get("mathStatDone").textContent === "1", registry.get("mathStatDone").textContent);
  api.toggleMathDone(firstId);
  check("再次点击取消掌握", api.getMathState().items.find((i) => i.id === firstId).done === false);

  console.log("\n[6] 按知识点抽题复习");
  windowObj.location.hash = "#/math/review";
  api.route();
  check("复习队列已建立", registry.get("reviewCount").textContent.includes("1 / 2"), registry.get("reviewCount").textContent);
  check("显示知识点标签", registry.get("reviewKp").textContent.length > 0);
  check("答案初始隐藏", registry.get("reviewAnswerBox").hidden === true);
  api.revealReviewAnswer();
  check("点开后答案显示", registry.get("reviewAnswerBox").hidden === false);
  check("判定按钮出现", registry.get("reviewJudge").hidden === false);

  api.judgeReview(true);
  check("答对后进入第 2 题", registry.get("reviewCount").textContent.includes("2 / 2"), registry.get("reviewCount").textContent);
  const doneAfter = api.getMathState().items.filter((i) => i.done).length;
  check("答对的题被标记掌握", doneAfter === 1, "已掌握 " + doneAfter);

  api.revealReviewAnswer();
  api.judgeReview(false);
  check("结算文案出现", registry.get("reviewQuestion").innerHTML.includes("正确率") || registry.get("reviewQuestion").innerHTML.includes("做对"));
  const missed = api.getMathState().items.filter((i) => !i.done && (i.wrongCount || 1) > 1).length;
  check("答错的题 wrongCount 增加", missed === 1, "实际 " + missed);

  console.log("\n[7] 按知识点筛选（从卡片进入）");
  windowObj.location.hash = "#/home/math?kp=" + encodeURIComponent("长方形面积");
  api.route();
  check("搜索框被知识点填充", registry.get("mathSearch").value === "长方形面积", registry.get("mathSearch").value);
  const listHtml = registry.get("mathList").innerHTML;
  check("列表只剩该知识点的题", listHtml.includes("长方形") && !listHtml.includes("24 颗糖"));

  console.log("\n[8] 数据持久化");
  const raw = storage.get("studyHubMath.v1.g3");
  check("已按年级写入 localStorage", Boolean(raw));
  const parsed = JSON.parse(raw || "{}");
  check("持久化 2 道错题", (parsed.items || []).length === 2);

  console.log("\n[9] 英语模块未受影响");
  windowObj.location.hash = "#/home/en";
  api.route();
  check("英语首页可渲染", registry.get("unitGrid").innerHTML.includes("动物朋友"));
  windowObj.location.hash = "#/unit/animals";
  api.route();
  check("英语主题页可渲染", registry.get("wordGrid").innerHTML.includes("cat"));
  windowObj.location.hash = "#/quiz/all";
  api.route();
  check("选一选可启动", registry.get("quizOptions").innerHTML.includes("option-btn"));

  console.log("\n[10] 年级切换：内容按年级隔离");
  const g3Stats = api.getStats();
  check("切换前记住了三年级错题数", g3Stats.mathTotal === 2, "实际 " + g3Stats.mathTotal);

  check("切到一年级成功", api.switchGrade(1) === true);
  check("当前年级已是一年级", api.getGrade() === 1, "实际 " + api.getGrade());
  const g1 = api.getWordState();
  check("一年级共 34 词", g1.total === 34, "实际 " + g1.total);
  check("一年级共 4 个主题", g1.units.length === 4, "实际 " + g1.units.length);
  check("一年级单元都属于一年级", g1.units.every((u) => u.grade === 1));
  check("年级已写入 localStorage", storage.get("studyHubGrade.v1") === "1", storage.get("studyHubGrade.v1"));
  check("一年级的英语进度是空的", api.getStats().learned === 0, "实际 " + api.getStats().learned);
  check("一年级的数学错题是空的", api.getStats().mathTotal === 0, "实际 " + api.getStats().mathTotal);

  console.log("\n[11] 一年级 → 六年级内容各不相同");
  api.switchGrade(6);
  const g6 = api.getWordState();
  check("六年级共 40 词", g6.total === 40, "实际 " + g6.total);
  check("六年级共 4 个主题", g6.units.length === 4, "实际 " + g6.units.length);
  check("六年级单元都属于六年级", g6.units.every((u) => u.grade === 6));
  check("六年级内容与一年级不同",
    g6.units[0].id !== g1.units[0].id, g6.units[0].id + " vs " + g1.units[0].id);

  console.log("\n[12] 六年级档案独立性");
  const g6State = api.getMathState();
  g6State.items.push({
    id: "math-g6-1", question: "六年级的一道错题", kp: "分数",
    type: "计算题", reason: "", answer: "", myAnswer: "",
    images: [], done: false, wrongCount: 0, createdAt: Date.now()
  });
  check("六年级记下 1 道错题", api.getStats().mathTotal === 1, "实际 " + api.getStats().mathTotal);
  // 走一次真实保存路径（新建知识点会写入当前年级的键）
  api.getMathState().customKps.push("分数");
  windowObj.location.hash = "#/math/add?kp=" + encodeURIComponent("分数");
  api.route();
  registry.get("mathQuestion").value = "六年级新录的一道分数题";
  registry.get("mathAnswer").value = "1/2";
  api.submitMathForm();
  check("六年级数据写到自己的键", Boolean(storage.get("studyHubMath.v1.g6")),
    Array.from(storage.keys()).filter((k) => k.startsWith("studyHubMath")).join(", "));
  check("六年级错题变成 2 道", api.getStats().mathTotal === 2, "实际 " + api.getStats().mathTotal);
  check("三年级的数据没被改写",
    JSON.parse(storage.get("studyHubMath.v1.g3") || "{}").items.length === 2);

  console.log("\n[13] 切回三年级，原档案完好");
  api.switchGrade(3);
  check("回到三年级", api.getGrade() === 3);
  check("三年级错题仍是 2 道", api.getStats().mathTotal === 2, "实际 " + api.getStats().mathTotal);
  check("三年级词库仍是 104 词", api.getWordState().total === 104, "实际 " + api.getWordState().total);
  check("六年级的错题没串到三年级",
    !api.getMathState().items.some((i) => i.id === "math-g6-1"));

  console.log("\n[14] 非法年级被拒绝");
  check("不存在的年级返回 false", api.switchGrade(9) === false);
  check("重复切到当前年级返回 false", api.switchGrade(3) === false);
  check("年级仍是三年级", api.getGrade() === 3);

  console.log("\n[15] 切年级后页面渲染正常");
  windowObj.location.hash = "#/home/en";
  api.route();
  check("三年级首页仍渲染 10 个主题",
    (registry.get("unitGrid").innerHTML.match(/unit-card/g) || []).length === 10,
    String((registry.get("unitGrid").innerHTML.match(/unit-card/g) || []).length));
  check("首页年级标签已更新", registry.get("homeEnGrade").textContent.includes("三"),
    registry.get("homeEnGrade").textContent);

  api.switchGrade(1);
  windowObj.location.hash = "#/home/en";
  api.route();
  check("一年级首页只渲染 4 个主题",
    (registry.get("unitGrid").innerHTML.match(/unit-card/g) || []).length === 4,
    String((registry.get("unitGrid").innerHTML.match(/unit-card/g) || []).length));

  console.log("\n[16] 跨年级的旧链接被挡回本科目首页");
  windowObj.location.hash = "#/unit/animals"; // 三年级单元
  api.route();
  check("一年级访问三年级单元被导回英语首页",
    windowObj.location.hash === "#/home/en", windowObj.location.hash);

  console.log("\n" + "═".repeat(46));
  console.log("通过 " + pass + " / " + (pass + fail));
  if (errors.length) {
    console.log("捕获到的运行时错误：");
    errors.forEach((e) => console.log("  - " + e));
  }
  if (fail > 0 || errors.length) process.exitCode = 1;
}, 30);
