/**
 * 「错题试卷」测试：从数学错题本 + 英语错词本汇总成卷、作答、判分、回写错题本。
 * 运行：node tools/test-paper.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
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
  click() { this.dispatch("click"); }
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
      return registry.get(sel.slice(1).split(/[ >]/)[0]) || null;
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
let printCalls = 0;

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
  print() { printCalls += 1; },
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
vm.runInNewContext(fs.readFileSync(path.join(root, "math-problems.js"), "utf8"), windowObj, { filename: "math-problems.js" });

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

  /* ---------- 造数据：3 道数学错题 + 3 个英语错词 ---------- */
  api.switchGrade(3);
  await settle(4);

  const mathFacts = [
    { q: "24 颗糖平均分给 6 个小朋友，每人几颗？", a: "4", kp: "万以内加减法" },
    { q: "一个长方形长 8 厘米、宽 3 厘米，周长是多少厘米？", a: "22", kp: "万以内加减法" },
    { q: "1/2 + 1/2 = ?", a: "1", kp: "万以内加减法" }
  ];
  mathFacts.forEach((fact) => {
    $("mathQuestion").value = fact.q;
    $("mathAnswer").value = fact.a;
    $("mathKpSelect").value = fact.kp;
    $("mathMyAnswer").value = "";
    $("mathReason").value = "";
    api.submitMathForm();
  });
  // 第 4 道：故意不记正确答案，验证它不参与判分
  $("mathQuestion").value = "还没对答案的题：9 × 7 = ?";
  $("mathAnswer").value = "";
  $("mathKpSelect").value = "万以内加减法";
  $("mathMyAnswer").value = "54";
  api.submitMathForm();

  const units = api.getWordState().units;
  const words = (units[0] || { words: [] }).words.slice(0, 3);
  const st = api.getStateRef();
  // 出卷顺序由「未掌握优先 + 错得多优先」决定，不一定是录入顺序，
  // 所以下面都按题干关键词定位题号，不写死下标。
  const idxOf = (keyword) => {
    const pool = api.paperMathPool("all", "");
    return pool.findIndex((it) => String(it.question).includes(keyword)) + 1;
  };
  const seedWrongWords = () => {
    st.wrong = words.map((w) => w.id);
    words.forEach((w) => { st.learned[w.id] = { seen: 0, correct: 0, wrong: 0 }; });
  };
  seedWrongWords();

  section("[1] 组卷页初始化");
  api.setupPaper({ from: "", kp: "" });
  check("组卷面板可见", $("paperSetup").hidden === false);
  check("试卷还没生成", $("paperSheet").hidden === true);
  check("默认填了试卷名", String($("paperTitle").value).length > 0, $("paperTitle").value);
  check("知识点下拉有「全部知识点」", $("paperMathKp").innerHTML.includes("全部知识点"));
  check("知识点下拉带上了错题里的知识点", $("paperMathKp").innerHTML.includes("万以内加减法"),
    $("paperMathKp").innerHTML.slice(0, 120));
  check("提示写清了能出几道", /可以出 \d+ 道/.test($("paperNote").textContent), $("paperNote").textContent);
  check("数学可出题数正确", api.paperMathPool("all", "").length === 4,
    String(api.paperMathPool("all", "").length));
  check("英语错词池正确", api.paperEnPool().length === 3, String(api.paperEnPool().length));
  check("待攻克筛选只会挑未掌握的", api.paperMathPool("todo", "").length === 4);

  section("[2] 只出数学卷");
  $("paperUseMath").checked = true;
  $("paperUseEn").checked = false;
  $("paperMathScope").value = "all";
  $("paperMathKp").value = "";
  $("paperMathCount").value = "0";
  $("paperTitle").value = "数学小测";
  api.buildPaper();
  let paper = api.getPaper();
  check("试卷已生成", Boolean(paper));
  check("标题用的是填写的名字", paper && paper.title === "数学小测", paper && paper.title);
  check("只有一个大题", paper && paper.sections.length === 1, String(paper && paper.sections.length));
  check("大题编号是「一、」", paper && paper.sections[0].title.startsWith("一、"), paper && paper.sections[0].title);
  check("4 道错题全部进卷", paper && paper.total === 4, String(paper && paper.total));
  check("卷子已渲染出来", $("paperSheet").hidden === false && $("paperSetup").hidden === true);
  check("卷面 HTML 里有题干", $("paperBody").innerHTML.includes("24 颗糖"));
  check("卷面上有 4 个作答框", ($("paperBody").innerHTML.match(/data-paper-input="/g) || []).length === 4);
  check("未交卷时显示「交卷判分」", $("paperSubmitBtn").textContent.includes("交卷"));
  check("未交卷时不显示成绩", $("paperScore").hidden === true);

  section("[3] 交卷判分（数学）");
  // 前两道答对；1/2 那道故意答错；没记答案的那道随便写
  // 题号要在交卷前算好：判完分之后排序会变（答对的变已掌握、答错的错因 +1）
  const iSugar = idxOf("24 颗糖");
  const iRect = idxOf("长方形");
  const iHalf = idxOf("1/2 + 1/2");
  const iBlank = idxOf("9 × 7");
  api.paperSetAnswer(iSugar, "4");
  api.paperSetAnswer(iRect, "22 厘米");
  api.paperSetAnswer(iHalf, "99");
  api.paperSetAnswer(iBlank, "63");
  api.submitPaper();
  paper = api.getPaper();
  const at = (index) => paper.sections[0].items[index - 1];
  check("已判完", paper && paper.graded === true);
  check("带单位也算答对", at(iRect).ok === true, JSON.stringify(at(iRect)));
  check("第二题也判对", at(iSugar).ok === true);
  check("乱填判为错", at(iHalf).ok === false);
  check("没记答案的题不参与判分", at(iBlank).ok === null, JSON.stringify(at(iBlank)));
  check("可判题目数是 3", paper.judged === 3, String(paper.judged));
  check("做对 2 道", paper.right === 2, String(paper.right));
  check("做错 1 道", paper.wrong === 1, String(paper.wrong));
  check("成绩区显示出来了", $("paperScore").hidden === false);
  check("成绩里有正确率", $("paperScore").innerHTML.includes("正确率"), $("paperScore").innerHTML.slice(0, 80));
  check("按钮变成「再来一份」", $("paperSubmitBtn").textContent.includes("再来一份"), $("paperSubmitBtn").textContent);
  check("卷面标出了对错", $("paperBody").innerHTML.includes("paper-q ok") || $("paperBody").innerHTML.includes("paper-q no"));

  section("[4] 结果回写数学错题本");
  const mathItems = api.getMathState().items;
  const solved = mathItems.find((it) => it.question.includes("24 颗糖"));
  const missed = mathItems.find((it) => it.question.includes("1/2 + 1/2"));
  check("答对的题被标记为已掌握", solved && solved.done === true, JSON.stringify(solved && solved.done));
  check("答错的题仍是待攻克", missed && missed.done === false);
  check("答错的题错误次数 +1", missed && missed.wrongCount >= 2, String(missed && missed.wrongCount));

  section("[5] 空答案不让交卷");
  api.resetPaper();
  check("重新组卷会回到设置页", $("paperSetup").hidden === false && $("paperSheet").hidden === true);
  check("重新组卷会清掉上一份", api.getPaper() === null);
  $("paperUseMath").checked = true;
  $("paperUseEn").checked = false;
  $("paperMathCount").value = "5";
  api.buildPaper();
  api.submitPaper();
  check("一个字没写时不判分", api.getPaper().graded === false);

  section("[6] 只出英语卷（中译英）");
  api.resetPaper();
  seedWrongWords();
  $("paperUseMath").checked = false;
  $("paperUseEn").checked = true;
  $("paperEnMode").value = "zh2en";
  $("paperEnCount").value = "0";
  $("paperTitle").value = "单词听写";
  api.buildPaper();
  paper = api.getPaper();
  check("英语卷生成成功", Boolean(paper) && paper.total === 3, String(paper && paper.total));
  check("大题编号从「一、」开始", paper.sections[0].title.startsWith("一、"), paper.sections[0].title);
  check("题干用的是中文释义", paper.sections[0].items[0].stem === words[0].zh,
    paper.sections[0].items[0].stem + " / " + words[0].zh);
  check("标准答案是英文单词", paper.sections[0].items[0].answer === words[0].w,
    paper.sections[0].items[0].answer + " / " + words[0].w);
  check("题型标签是中译英", paper.sections[0].items[0].tag.includes("中译英"), paper.sections[0].items[0].tag);

  api.paperSetAnswer(1, words[0].w);
  api.paperSetAnswer(2, "definitely-wrong");
  api.paperSetAnswer(3, words[2].w.toUpperCase());
  api.submitPaper();
  paper = api.getPaper();
  check("写对单词判为对", paper.sections[0].items[0].ok === true);
  check("乱写判为错", paper.sections[0].items[1].ok === false);
  check("大小写不敏感", paper.sections[0].items[2].ok === true,
    words[2].w + " → " + words[2].w.toUpperCase());
  check("做对 2 道", paper.right === 2, String(paper.right));

  section("[7] 英译中与混合模式");
  api.resetPaper();
  seedWrongWords();
  $("paperUseMath").checked = false;
  $("paperUseEn").checked = true;
  $("paperEnMode").value = "en2zh";
  $("paperEnCount").value = "0";
  api.buildPaper();
  paper = api.getPaper();
  check("英译中题干是英文单词", paper.sections[0].items[0].stem === words[0].w, paper.sections[0].items[0].stem);
  check("英译中标准答案是中文", paper.sections[0].items[0].answer === words[0].zh);
  api.paperSetAnswer(1, words[0].zh);
  api.submitPaper();
  check("中文意思写对算对", api.getPaper().sections[0].items[0].ok === true);

  api.resetPaper();
  seedWrongWords();
  $("paperUseMath").checked = false;
  $("paperUseEn").checked = true;
  $("paperEnMode").value = "mix";
  $("paperEnCount").value = "0";
  api.buildPaper();
  paper = api.getPaper();
  const modes = paper.sections[0].items.map((it) => it.mode);
  check("混合模式两种题型都有", modes.includes("zh2en") && modes.includes("en2zh"), modes.join(","));

  section("[8] 数学 + 英语合卷");
  api.resetPaper();
  seedWrongWords();
  $("paperUseMath").checked = true;
  $("paperUseEn").checked = true;
  $("paperMathCount").value = "0";
  $("paperEnCount").value = "0";
  $("paperTitle").value = "";
  api.buildPaper();
  paper = api.getPaper();
  check("两个大题都在", paper.sections.length === 2, String(paper.sections.length));
  check("编号分别是 一、二、",
    paper.sections[0].title.startsWith("一、") && paper.sections[1].title.startsWith("二、"),
    paper.sections.map((s) => s.title).join(" | "));
  check("总题数是两边相加", paper.total === 7, String(paper.total));
  check("没填名字会自动起名", paper.title.includes("错题过关卷"), paper.title);

  section("[9] 打印");
  const beforePrint = api.paperPrintCount();
  api.printPaper();
  check("打印计数 +1", api.paperPrintCount() === beforePrint + 1,
    beforePrint + " → " + api.paperPrintCount());
  check("真的调用了 window.print", printCalls === 1, String(printCalls));

  section("[10] 附上正确答案");
  api.resetPaper();
  $("paperUseMath").checked = true;
  $("paperUseEn").checked = false;
  $("paperMathCount").value = "0";
  $("paperWithAnswer").checked = true;
  api.buildPaper();
  check("勾选后卷面直接带答案", $("paperBody").innerHTML.includes("正确答案"), $("paperBody").innerHTML.slice(0, 160));

  section("[11] 错题本为空时不生成");
  api.resetPaper();
  $("paperUseMath").checked = true;
  $("paperUseEn").checked = false;
  $("paperMathScope").value = "done";
  $("paperMathKp").value = "一个不存在的知识点";
  api.buildPaper();
  check("没有可出的题就不生成卷子", api.getPaper() === null);

  section("[12] 运行时无异常");
  check("没有未捕获错误", errors.length === 0, errors.slice(0, 3).join(" | "));

  console.log("\n══════════════════════════════════════════");
  console.log(`通过 ${pass} / ${pass + fail}`);
  if (fail) { console.log(`失败 ${fail} 项`); process.exitCode = 1; }
})();
