/**
 * 「人机验证（Cap）」测试：配置项、端点规范化、widget 挂载、
 * 以及登录/获取验证码前的 token 校验（含失败即关闭）。
 * 运行：node tools/test-cap.js
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
  set innerHTML(v) { this._innerHTML = String(v); this.children = []; }
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
  head: new Element("head"),
  listeners: new Map(),
  querySelector(sel) {
    if (typeof sel === "string" && sel.startsWith("#")) {
      return registry.get(sel.slice(1).split(/[ >]/)[0]) || null;
    }
    return null;
  },
  querySelectorAll() { return []; },
  getElementById: (id) => registry.get(id) || null,
  createElement: (t) => new Element(t),
  addEventListener(t, f) { (this.listeners.get(t) || this.listeners.set(t, []).get(t)).push(f); },
  dispatch(t, e = {}) { (this.listeners.get(t) || []).forEach((fn) => fn({ preventDefault() {}, target: null, ...e })); }
};

const storage = new Map();
const errors = [];

/* fetch 可替换：Cap 的 /siteverify 全靠它 */
let fetchCalls = [];
let fetchImpl = async () => ({ ok: true, json: async () => ({ success: true }) });

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
  print() {},
  addEventListener(t, f) { (this._l = this._l || {}); (this._l[t] = this._l[t] || []).push(f); },
  setTimeout: (fn) => { try { fn(); } catch (e) { errors.push("setTimeout: " + e.message); } return 1; },
  clearTimeout() {},
  setInterval: () => 1,
  clearInterval() {},
  fetch: (url, opts) => { fetchCalls.push({ url, opts }); return fetchImpl(url, opts); },
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

// widget 当作「已注册」，避免测试里真的去加载 CDN 脚本
const customElements = { get: () => ({}), define() {}, whenDefined: async () => ({}) };

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
  customElements,
  console: windowObj.console,
  URL, URLSearchParams, Math, Date, JSON, Object, Array, String, Number, Boolean, Set, Map, Promise, Error,
  isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent
});

/* ---------- 断言 ---------- */
let pass = 0, fail = 0;
function check(name, condition, detail) {
  if (condition) { pass += 1; console.log("  ✓ " + name); }
  else { fail += 1; console.log("  ✗ " + name + (detail !== undefined && detail !== null ? "  → " + detail : "")); }
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

  const EP = "https://cap.example.com/a1b2c3d4e5/";
  const SECRET = "sk-test-0000";

  section("[1] 默认关闭：没配实例时整段逻辑等于不存在");
  check("默认是关闭的", api.capEnabled() === false);
  check("没配端点时 siteverify 地址为空", api.capSiteverifyUrl() === "");
  fetchCalls = [];
  let r = await api.capConsume("获取验证码");
  check("不启用时直接放行（skipped）", r.ok === true && r.skipped === true, JSON.stringify(r));
  check("不启用时不发任何请求", fetchCalls.length === 0, String(fetchCalls.length));
  await api.capMount();
  check("不启用时验证区藏起来", $("authCapWrap").hidden === true);
  check("不启用时不挂 widget", $("authCapSlot").children.length === 0);

  section("[2] 配置要三项齐全才算启用");
  api.capSaveConfig({ enabled: true, endpoint: EP, secret: "" });
  check("缺 secret 不启用", api.capEnabled() === false);
  api.capSaveConfig({ enabled: false, endpoint: EP, secret: SECRET });
  check("没勾开关不启用", api.capEnabled() === false);
  api.capSaveConfig({ enabled: true, endpoint: "", secret: SECRET });
  check("缺端点不启用", api.capEnabled() === false);
  api.capSaveConfig({ enabled: true, endpoint: EP, secret: SECRET });
  check("三项齐全才启用", api.capEnabled() === true);

  section("[3] 端点规范化与 siteverify 地址");
  check("带斜杠的端点原样使用", api.capEndpoint() === EP, api.capEndpoint());
  check("siteverify 拼在端点后面", api.capSiteverifyUrl() === EP + "siteverify", api.capSiteverifyUrl());
  api.capSaveConfig({ enabled: true, endpoint: "https://cap.example.com/a1b2c3d4e5", secret: SECRET });
  check("没带斜杠会自动补上", api.capEndpoint() === EP, api.capEndpoint());
  check("补斜杠后 siteverify 也正确", api.capSiteverifyUrl() === EP + "siteverify");
  api.capSaveConfig({ enabled: true, endpoint: EP, secret: SECRET });
  check("widget 脚本是 pin 了版本的", /cap-widget@\d+\.\d+\.\d+/.test(api.capScriptUrl()), api.capScriptUrl());

  section("[4] 挂载 widget");
  await api.capMount();
  check("启用后验证区显示出来", $("authCapWrap").hidden === false);
  check("slot 里挂上了 cap-widget", $("authCapSlot").children.length === 1);
  const widget = $("authCapSlot").children[0];
  check("挂的是 cap-widget 元素", widget.tagName === "CAP-WIDGET", widget.tagName);
  check("带上了端点属性", widget.getAttribute("data-cap-api-endpoint") === EP,
    widget.getAttribute("data-cap-api-endpoint"));

  section("[5] 没解过题就去操作 → 拦下来");
  api.capResetWidget();
  api.capSaveConfig({ enabled: true, endpoint: EP, secret: SECRET });
  await api.capMount();
  fetchCalls = [];
  r = await api.capConsume("获取验证码");
  check("被拦住", r.ok === false && r.needSolve === true, JSON.stringify(r));
  check("不发请求", fetchCalls.length === 0);
  check("提示先做验证", /人机验证/.test($("authCapNote").textContent), $("authCapNote").textContent);
  check("提示里带上了动作名", /获取验证码/.test($("authCapNote").textContent), $("authCapNote").textContent);
  check("验证区标红提示", $("authCapWrap").classList.contains("is-required"));

  section("[6] widget 解出题 → token 存下来");
  const solvedWidget = api.getCapWidget();
  check("拿得到 widget 实例", Boolean(solvedWidget));
  solvedWidget.dispatch("solve", { detail: { token: "tok-abc" } });
  check("token 已保存", api.getCapToken() === "tok-abc", String(api.getCapToken()));
  check("提示变成可以提交", /可以提交/.test($("authCapNote").textContent), $("authCapNote").textContent);

  section("[7] 验证通过：请求体与 URL 都要对");
  fetchCalls = [];
  fetchImpl = async () => ({ ok: true, json: async () => ({ success: true }) });
  r = await api.capConsume("提交登录");
  check("放行了", r.ok === true, JSON.stringify(r));
  check("只发一次请求", fetchCalls.length === 1, String(fetchCalls.length));
  check("打到 siteverify", fetchCalls[0] && fetchCalls[0].url === EP + "siteverify",
    fetchCalls[0] && fetchCalls[0].url);
  check("用 POST", fetchCalls[0] && fetchCalls[0].opts.method === "POST");
  const body = JSON.parse(fetchCalls[0].opts.body);
  check("字段名与 reCAPTCHA 兼容：secret + response", body.secret === SECRET && body.response === "tok-abc",
    JSON.stringify(body));
  check("token 用掉后本地清空（单次使用）", api.getCapToken() === null);
  check("换新 widget 等着下一次", $("authCapSlot").children.length === 1);
  check("红框去掉了", $("authCapWrap").classList.contains("is-required") === false);

  section("[8] 失败即关闭：服务端说不行就不能放行");
  api.setCapToken("tok-bad");
  fetchCalls = [];
  fetchImpl = async () => ({ ok: true, json: async () => ({ success: false, error: "token not found" }) });
  r = await api.capConsume("提交登录");
  check("被拒绝", r.ok === false, JSON.stringify(r));
  check("给出明确错误", r.error === "人机验证未通过", r.error);
  check("token 被清掉", api.getCapToken() === null);
  check("提示重新验证", /重新/.test($("authCapNote").textContent), $("authCapNote").textContent);

  section("[9] 失败即关闭：HTTP 500 但 body 说成功，也不能放行");
  api.setCapToken("tok-500");
  fetchImpl = async () => ({ ok: false, status: 500, json: async () => ({ success: true }) });
  r = await api.capConsume("提交登录");
  check("HTTP 不 ok 一律拒绝", r.ok === false, JSON.stringify(r));

  section("[10] 失败即关闭：网络挂了也不能放行");
  api.setCapToken("tok-net");
  fetchImpl = async () => { throw new Error("boom"); };
  r = await api.capConsume("提交登录");
  check("网络异常时拒绝", r.ok === false, JSON.stringify(r));
  check("提示连不上服务", r.error === "验证服务不可用", r.error);
  check("提示语也更新了", /连不上/.test($("authCapNote").textContent), $("authCapNote").textContent);

  section("[11] 设置页：填值、校验与回填");
  api.capSaveConfig({ enabled: false, endpoint: "", secret: "" });
  api.renderSettingsCap();
  check("空配置时开关是关的", $("setCapEnabled").checked === false);
  check("空配置时输入框为空", $("setCapEndpoint").value === "" && $("setCapSecret").value === "");
  check("空配置提示未启用", /还没启用/.test($("setCapNote").textContent), $("setCapNote").textContent);

  $("setCapEndpoint").value = "cap.example.com/x/";
  $("setCapSecret").value = SECRET;
  let v = api.capValidateInput();
  check("缺少协议的端点被拦下", v.ok === false, JSON.stringify(v));
  check("端点错误有提示", /http/.test($("setCapEndpointError").textContent), $("setCapEndpointError").textContent);

  $("setCapEndpoint").value = EP;
  $("setCapSecret").value = "not-a-secret";
  v = api.capValidateInput();
  check("不像 secret key 的值被拦下", v.ok === false);
  check("secret 错误有提示", /sk-/.test($("setCapSecretError").textContent), $("setCapSecretError").textContent);

  $("setCapEndpoint").value = EP;
  $("setCapSecret").value = SECRET;
  $("setCapEnabled").checked = true;
  const saved = api.saveCapSettings();
  check("保存成功", Boolean(saved) && saved.enabled === true, JSON.stringify(saved));
  check("真的写进了 localStorage", Boolean(storage.get("studyHubCap.v1")));
  check("存的内容带 secret", String(storage.get("studyHubCap.v1")).includes(SECRET));
  check("启用后提示语变了", /已启用/.test($("setCapNote").textContent), $("setCapNote").textContent);
  api.renderSettingsCap();
  check("重新渲染会回填端点", $("setCapEndpoint").value === EP);
  check("重新渲染会回填 secret", $("setCapSecret").value === SECRET);
  check("重新渲染会回填开关", $("setCapEnabled").checked === true);

  section("[12] 改配置后旧 token 立刻失效");
  api.setCapToken("tok-stale");
  api.capSaveConfig({ enabled: true, endpoint: "https://cap2.example.com/ffff000011/", secret: SECRET });
  check("换实例后 token 被清掉", api.getCapToken() === null);
  check("端点跟着换了", api.capSiteverifyUrl() === "https://cap2.example.com/ffff000011/siteverify",
    api.capSiteverifyUrl());

  console.log("\n" + (fail === 0 ? "全部通过" : "有失败项") + "：" + pass + " 项通过 / " + fail + " 项失败");
  if (errors.length) {
    console.log("\n运行期 console.error：");
    errors.slice(0, 8).forEach((e) => console.log("  ! " + e));
  }
  process.exit(fail === 0 ? 0 : 1);
})();
