/**
 * 极简 DOM 模拟器 —— 在 Node 里跑 index.html 的内联脚本，
 * 用来捕获真实的运行时错误（未定义变量、空指针、事件绑定失败等）。
 *
 * 运行：node tools/smoke-test.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
// 只取带内联代码的 script 块：带 src 的外链（如云服务 SDK）内容为空，跳过
const script = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
  .map((m) => m[1])
  .find((code) => code.trim().length > 0);
if (!script) throw new Error("index.html 里没找到内联主脚本");

/* ---------- 极简元素 ---------- */
class ClassList {
  constructor() { this.set = new Set(); }
  add(...names) { names.forEach((n) => this.set.add(n)); }
  remove(...names) { names.forEach((n) => this.set.delete(n)); }
  toggle(name, force) {
    const on = force === undefined ? !this.set.has(name) : Boolean(force);
    if (on) this.set.add(name); else this.set.delete(name);
    return on;
  }
  contains(name) { return this.set.has(name); }
}

class Element {
  constructor(tag, owner) {
    this.tagName = (tag || "div").toUpperCase();
    this.ownerDocument = owner;
    this.children = [];
    this.attributes = new Map();
    this.style = { setProperty() {}, removeProperty() {}, getPropertyValue: () => "" };
    this.dataset = {};
    this.classList = new ClassList();
    this.listeners = new Map();
    this._textContent = "";
    this._innerHTML = "";
    this.value = "";
    this.hidden = false;
    this.disabled = false;
    this.id = "";
    this.className = "";
    this.files = [];
    this.offsetWidth = 1;
  }
  setAttribute(k, v) {
    this.attributes.set(k, String(v));
    if (k === "id") this.id = String(v);
    if (k.startsWith("data-")) {
      const key = k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      this.dataset[key] = String(v);
    }
  }
  getAttribute(k) { return this.attributes.has(k) ? this.attributes.get(k) : null; }
  hasAttribute(k) { return this.attributes.has(k); }
  removeAttribute(k) { this.attributes.delete(k); }
  set innerHTML(v) { this._innerHTML = String(v); }
  get innerHTML() { return this._innerHTML; }
  set textContent(v) { this._textContent = String(v); }
  get textContent() { return this._textContent; }
  appendChild(child) { this.children.push(child); return child; }
  insertAdjacentHTML(position, markup) {
    this._innerHTML += markup;
  }
  remove() {}
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }
  removeEventListener() {}
  dispatch(type, event = {}) {
    (this.listeners.get(type) || []).forEach((fn) => fn({ target: this, preventDefault() {}, ...event }));
  }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  closest() { return null; }
  focus() {}
  select() {}
  click() {}
  matches() { return false; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 10, height: 10 }; }
  getContext() { return null; }
  toDataURL() { return "data:image/jpeg;base64,"; }
}

/* ---------- 从 HTML 抽取真实存在的 id ---------- */
const ids = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);

class Document {
  constructor() {
    this.listeners = new Map();
    this.readyState = "complete";
    this.title = "";
    this.body = new Element("body", this);
    this.body.classList.add("body");
    this.registry = new Map();
    ids.forEach((id) => {
      const el = new Element("div", this);
      el.setAttribute("id", id);
      this.registry.set(id, el);
    });
  }
  querySelector(selector) {
    if (typeof selector !== "string") return null;
    if (selector.startsWith("#")) return this.registry.get(selector.slice(1)) || null;
    return null; // 类选择器：返回 null，由调用方判空处理
  }
  querySelectorAll() { return []; }
  createElement(tag) { return new Element(tag, this); }
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }
  dispatch(type, event = {}) {
    (this.listeners.get(type) || []).forEach((fn) => fn({ target: null, preventDefault() {}, ...event }));
  }
}

/* ---------- 浏览器 API 模拟 ---------- */
const document = new Document();
const storage = new Map();

const windowObj = {
  document,
  location: { hash: "", protocol: "http:", href: "http://localhost/" },
  navigator: { serviceWorker: undefined },
  localStorage: {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k)
  },
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  scrollTo() {},
  addEventListener(type, fn) {
    if (!this._listeners) this._listeners = {};
    (this._listeners[type] = this._listeners[type] || []).push(fn);
  },
  setTimeout: (fn) => { try { fn(); } catch (e) { errors.push("setTimeout 回调: " + e.message); } return 1; },
  clearTimeout() {},
  setInterval: () => 1,
  clearInterval() {},
  fetch: async () => {
    const data = fs.readFileSync(path.join(root, "words.json"), "utf8");
    return { ok: true, json: async () => JSON.parse(data), status: 200 };
  },
  speechSynthesis: {
    getVoices: () => [],
    addEventListener() {},
    cancel() {},
    speak() {}
  },
  SpeechSynthesisUtterance: function (text) { this.text = text; },
  AudioContext: function () {
    return {
      state: "running",
      currentTime: 0,
      resume: () => {},
      createOscillator: () => ({ type: "", frequency: { value: 0 }, connect: () => ({ connect() {} }), start() {}, stop() {} }),
      createGain: () => ({ gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: () => ({ connect() {} }) }),
      destination: {}
    };
  },
  URLSearchParams,
  Image: function () { this.onload = null; this.onerror = null; },
  FileReader: function () { this.readAsDataURL = () => {}; },
  console
};

windowObj.__STUDYHUB_TEST__ = true;
windowObj.window = windowObj;
windowObj.self = windowObj;

const errors = [];

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
  console: {
    log: (...a) => console.log("  [page]", ...a),
    warn: (...a) => console.log("  [page:warn]", ...a),
    error: (...a) => errors.push("console.error: " + a.join(" "))
  },
  URLSearchParams,
  Math,
  Date,
  JSON,
  Object,
  Array,
  String,
  Number,
  Boolean,
  Set,
  Map,
  Promise,
  Error,
  isNaN,
  parseInt,
  parseFloat,
  encodeURIComponent,
  decodeURIComponent
});

/* ---------- 执行 ---------- */
console.log("执行 index.html 内联脚本 …");
try {
  vm.runInContext(script, context, { filename: "index.html", timeout: 10000 });
  console.log("✓ 脚本执行完毕");
} catch (error) {
  console.log("✗ 执行报错：" + error.message);
  console.log(error.stack.split("\n").slice(0, 6).join("\n"));
  process.exit(1);
}

/* ---------- 校验页面走完启动流程 ---------- */
setImmediate(() => {
  const title = document.title;
  console.log("  页面标题：" + (title || "(空)"));
  if (!title.includes("学习通")) {
    console.log("✗ 标题未更新为学习通，boot/route 可能没跑完");
    process.exitCode = 1;
  } else {
    console.log("✓ boot 流程正常，标题已更新");
  }
  if (errors.length) {
    console.log("✗ 捕获到错误：");
    errors.forEach((e) => console.log("   - " + e));
    process.exitCode = 1;
  } else {
    console.log("✓ 无运行时错误");
  }
});
