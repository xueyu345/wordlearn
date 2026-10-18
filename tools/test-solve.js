/**
 * 数学「解题挑战」测试：按年级出题、判定、解析、收进错题本、答案可空。
 * 运行：node tools/test-solve.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
// 只取带内联代码的 script 块：外链块内容为空，跳过
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
// 页面里 math-problems.js 是外链脚本，测试里直接注入
vm.runInNewContext(fs.readFileSync(path.join(root, "math-problems.js"), "utf8"), windowObj, { filename: "math-problems.js" });
windowObj.MathProblemBank = windowObj.MathProblemBank || null;

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
  URL, URLSearchParams, Math, Date, JSON, Object, Array, String, Number, Boolean, Set, Map, Promise, Error,
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
  const bank = windowObj.MathProblemBank;

  section("[1] 题库加载与按年级出题");
  check("题库已挂到 window", Boolean(bank));
  check("页面认为题库可用", api.solveAvailable() === true);
  check("六个年级都有话题", [1, 2, 3, 4, 5, 6].every((g) => (bank.GRADE_TOPICS[g] || []).length > 0));
  for (const grade of [1, 2, 3, 4, 5, 6]) {
    const set = bank.makeSet({ grade, count: 12 });
    const allowed = bank.GRADE_TOPICS[grade];
    const allInStage = set.every((p) => allowed.indexOf(p.topic) >= 0);
    check(grade + " 年级不会出超纲题", allInStage,
      set.filter((p) => allowed.indexOf(p.topic) < 0).map((p) => p.topic).join(","));
    check(grade + " 年级题目都能出满", set.length === 12, String(set.length));
  }
  const easy = bank.makeSet({ grade: 1, count: 30 });
  check("一年级不出方程/百分数", easy.every((p) => ["equation", "percent", "ratio", "circle"].indexOf(p.topic) < 0));
  check("一年级都有解析步骤", easy.every((p) => p.steps && p.steps.length > 0));

  section("[2] 出题面板");
  api.switchGrade(3);
  await settle(4);
  api.setupSolve();
  check("知识点下拉已填充", $("solveKpSelect").innerHTML.includes("分数的初步认识")
    || $("solveKpSelect").innerHTML.includes("万以内"), $("solveKpSelect").innerHTML.slice(0, 80));
  check("阶段说明点明年级", $("solveStageNote").textContent.includes("三年级"), $("solveStageNote").textContent);
  check("开始按钮可用", $("solveStartBtn").disabled === false);
  check("设置面板可见", $("solveSetup").hidden === false);

  section("[3] 一轮答题：答对");
  $("solveKpSelect").value = "";
  $("solveCountSelect").value = "5";
  api.startSolve();
  let solve = api.getSolve();
  check("生成 5 道题", solve && solve.total === 5, String(solve && solve.total));
  check("停在第 1 题", solve.index === 0);
  check("题目已渲染到页面", $("solveQuestion").textContent === solve.items[0].q, $("solveQuestion").textContent);
  check("答题面板可见", $("solvePlay").hidden === false && $("solveSetup").hidden === true);
  check("结果区先藏起来", $("solveResult").hidden === true);

  api.setSolveInput(solve.items[0].a);
  api.checkSolve();
  solve = api.getSolve();
  check("填正确答案判为对", solve.items[0].ok === true, solve.items[0].q + " → " + solve.items[0].a);
  check("做对数 +1", solve.right === 1, String(solve.right));
  check("结果区显示出来", $("solveResult").hidden === false);
  check("判定文案是答对", $("solveVerdict").textContent.includes("答对"), $("solveVerdict").textContent);
  check("解析里有解题步骤", $("solveAnalysis").innerHTML.includes("<li>"), $("solveAnalysis").innerHTML.slice(0, 60));
  check("解析里给出正确答案", $("solveAnalysis").innerHTML.includes(solve.items[0].a));

  section("[4] 答错与跳过");
  api.nextSolve();
  solve = api.getSolve();
  check("进到第 2 题", solve.index === 1, String(solve.index));
  api.setSolveInput("肯定不对的答案");
  api.checkSolve();
  solve = api.getSolve();
  check("乱填判为错", solve.items[1].ok === false);
  check("做错数 +1", solve.wrong === 1, String(solve.wrong));
  check("判错文案提示看解析", $("solveVerdict").textContent.includes("解析"), $("solveVerdict").textContent);
  check("解析里保留我写的答案", $("solveAnalysis").innerHTML.includes("肯定不对的答案"));

  api.nextSolve();
  api.skipSolve();
  solve = api.getSolve();
  check("跳过的题标记为 skipped", solve.items[2].skipped === true && solve.items[2].ok === false);
  check("跳过也计入未掌握", solve.wrong === 2, String(solve.wrong));
  check("跳过也给出解析", $("solveAnalysis").innerHTML.includes("<li>"));

  section("[5] 判定的容错");
  const sample = { a: "0.5", accept: ["0.5", "1/2"] };
  check("1/2 和 0.5 等价", api.checkAnswerRaw("1/2", sample) === true);
  check("0.50 也算对", api.checkAnswerRaw("0.50", sample) === true);
  check("全角数字能识别", api.checkAnswerRaw("０．５", sample) === true);
  check("带单位能识别", api.checkAnswerRaw("18 厘米", { a: "18", accept: ["18"] }) === true);
  check("空答案不算对", api.checkAnswerRaw("", sample) === false);
  check("错答案不算对", api.checkAnswerRaw("99", sample) === false);
  check("中文答案不误判", api.checkAnswerRaw("米", { a: "米", accept: ["米"] }) === true);

  section("[6] 收进错题本");
  api.nextSolve();                       // 第 4 题
  api.setSolveInput("也不会对");
  api.checkSolve();
  api.nextSolve();                       // 第 5 题
  api.setSolveInput("继续错");
  api.checkSolve();
  api.nextSolve();                       // 走完 → 结算
  solve = api.getSolve();
  check("结算面板可见", $("solveSummary").hidden === false && $("solvePlay").hidden === true);
  check("成绩里有正确率", $("solveScore").innerHTML.includes("正确率"), $("solveScore").innerHTML.slice(0, 80));
  const before = api.getMathState().items.length;
  api.addSolveToWrongBook();
  const after = api.getMathState().items;
  check("错题本新增了题", after.length > before, before + " → " + after.length);
  const added = after.filter((item) => Array.isArray(item.analysis));
  check("收进来的题带解析步骤", added.length > 0 && added.every((item) => item.analysis.length > 0));
  check("解析内容是刚才那几道题的步骤",
    added.every((item) => solve.items.some((p) => p.q === item.question)));
  check("带上了我当时写的答案", added.some((item) => item.myAnswer === "也不会对" || item.myAnswer === "继续错"));
  check("正确答案也一起记下", added.every((item) => Boolean(item.answer)));
  check("知识点有值", added.every((item) => Boolean(item.kp)));
  check("题型有值", added.every((item) => Boolean(item.type)));
  check("新题都是待攻克", added.every((item) => item.done === false));

  const dupBefore = api.getMathState().items.length;
  const first = api.getMathState().items.find((item) => Array.isArray(item.analysis));
  const wrongBefore = first.wrongCount;
  api.addSolveToWrongBook();             // session 还在？收完会清空
  check("收完一轮后不重复再收一次", api.getMathState().items.length === dupBefore,
    String(api.getMathState().items.length));
  check("重复收进只累加错误次数", first.wrongCount === wrongBefore, String(first.wrongCount));

  section("[7] 按知识点出题");
  api.switchGrade(5);
  await settle(4);
  api.setupSolve();
  $("solveKpSelect").value = "简易方程";
  $("solveCountSelect").value = "5";
  api.startSolve();
  solve = api.getSolve();
  check("指定知识点后都是方程题", solve.items.every((p) => p.topic === "equation"),
    solve.items.map((p) => p.topic).join(","));
  check("知识点写进题目", solve.items.every((p) => p.kp === "简易方程"), solve.items[0].kp);

  section("[8] 错题录入：正确答案可空");
  api.switchGrade(3);
  await settle(4);
  api.setupSolve();
  const mathState = api.getMathState();
  const countBefore = mathState.items.length;
  $("mathQuestion").value = "一道还没对答案的题：36 + 47 = ?";
  $("mathAnswer").value = "";
  $("mathKpSelect").value = "万以内的加减法";
  $("mathMyAnswer").value = "73";
  api.submitMathForm();
  const saved = api.getMathState().items;
  check("不填正确答案也能保存", saved.length === countBefore + 1, countBefore + " → " + saved.length);
  const blank = saved[0];
  check("保存的题目是对的", blank.question.includes("36 + 47"));
  check("答案确实是空的", blank.answer === "", JSON.stringify(blank.answer));
  check("我的答案还在", blank.myAnswer === "73");
  check("知识点保留了", blank.kp === "万以内的加减法", blank.kp);

  section("[9] 复习页能显示解析");
  api.startMathReview("");
  await settle(4);
  const session = api.getMathState().items.filter((item) => Array.isArray(item.analysis));
  check("解析题进了复习队列", session.length > 0);
  check("解析区已渲染", $("reviewAnalysisWrap").hidden === false || $("reviewAnalysis").innerHTML.includes("<li>"),
    $("reviewAnalysis").innerHTML.slice(0, 60));

  section("[10] 运行时无异常");
  check("没有未捕获错误", errors.length === 0, errors.slice(0, 3).join(" | "));

  console.log("\n══════════════════════════════════════════");
  console.log(`通过 ${pass} / ${pass + fail}`);
  if (fail) { console.log(`失败 ${fail} 项`); process.exitCode = 1; }
})();
