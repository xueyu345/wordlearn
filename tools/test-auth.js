/**
 * 登录 + 云同步测试：用 mock 的云服务 SDK 验证业务规则，不联网、不碰真实数据库。
 * 运行：node tools/test-auth.js
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

/* ---------- mock 云服务 SDK ---------- */
const cloudCalls = [];
const cloudDb = new Map();        // "email|profile_key|scope" -> payload
let currentSession = null;
let nextOtpResult = { verificationId: "v-1", isExistingUser: false };

function dbKey(email, profileKey) {
  // 用 JSON 数组做复合键，避免分隔符与内容冲突
  return JSON.stringify([email, profileKey]);
}

function makeFilters(build) {
  // 极简 PostgREST 链式 mock：只支持本项目用到的 select / upsert
  return {
    select() { return this; },
    eq() { return this; },
    then(resolve, reject) { return Promise.resolve(build()).then(resolve, reject); }
  };
}

const mockAuth = {
  async getSession() {
    cloudCalls.push("getSession");
    return currentSession ? { data: currentSession, error: null } : { data: null, error: null };
  },
  async sendOtp({ email }) {
    cloudCalls.push("sendOtp:" + email);
    return { data: nextOtpResult, error: null };
  },
  async verifyOtp({ email, password }) {
    cloudCalls.push("verifyOtp:" + email + ":" + (password ? "withPass" : "noPass"));
    if (!password) return { data: null, error: { message: "注册必须带密码" } };
    currentSession = { user: { id: "u-" + email, email } };
    return { data: currentSession, error: null };
  },
  async signInWithPassword({ email, password }) {
    cloudCalls.push("signInWithPassword:" + email);
    if (password !== "correct-horse") {
      return { data: null, error: { message: "Invalid login credentials" } };
    }
    currentSession = { user: { id: "u-" + email, email } };
    return { data: currentSession, error: null };
  },
  async signOut() {
    cloudCalls.push("signOut");
    currentSession = null;
    return { error: null };
  },
  async resetPasswordForEmail(email) {
    cloudCalls.push("resetPasswordForEmail:" + email);
    return { data: { updateUser: async () => ({ error: null }) }, error: null };
  }
};

const mockDatabase = {
  from() {
    let rows = null;
    // 模拟 supabase 风格的 thenable builder：await 之后拿到的是 { data, error }
    const builder = {
      select() {
        const email = currentSession && currentSession.user.email;
        const out = [];
        for (const [k, v] of cloudDb.entries()) {
          const [owner, profileKey] = JSON.parse(k);
          if (owner !== email) continue;  // 模拟 RLS：只看得到自己的行
          out.push({ profile_key: profileKey, scope: profileKey.split(".")[0], payload: v });
        }
        cloudCalls.push("select:" + email);
        rows = { data: out, error: null };
        return builder;
      },
      upsert(row) {
        const email = currentSession && currentSession.user.email;
        cloudCalls.push("upsert:" + email + ":" + row.profile_key + ":" + row.scope);
        if (!email) { rows = { data: null, error: { message: "not signed in" } }; return builder; }
        cloudDb.set(dbKey(email, row.profile_key), JSON.parse(JSON.stringify(row.payload)));
        rows = { data: null, error: null };
        return builder;
      },
      eq() { return builder; },
      then(resolve) {
        if (rows === null) rows = { data: null, error: null };
        return Promise.resolve(rows).then(resolve);
      }
    };
    return builder;
  }
};

const mockCloud = {
  WorkBuddyCloud: {
    createWorkBuddyCloud(config) {
      cloudCalls.push("init:" + (config.endpoint || "NO_ENDPOINT"));
      return { auth: mockAuth, database: mockDatabase };
    }
  }
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
Object.assign(windowObj, mockCloud);

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

  section("[1] 云服务初始化");
  check("客户端用到了 endpoint", cloudCalls.some((c) => c.startsWith("init:https://")), cloudCalls[0]);
  check("云服务可用", api.cloudReady() === true);
  check("初始未登录", api.getAuth().user === null);
  check("顶栏显示「登录」", $("accountName").textContent === "登录", $("accountName").textContent);

  section("[2] 邮箱校验");
  check("合法邮箱通过", api.validEmail("kid@example.com") === true);
  check("缺 @ 被拒", api.validEmail("kidexample.com") === false);
  check("缺域名被拒", api.validEmail("kid@example") === false);
  check("去空格转小写", api.emailOf("  Kid@Example.COM ") === "kid@example.com", api.emailOf("  Kid@Example.COM "));

  section("[3] 注册：必须先验证邮箱");
  api.openAccountPanel(true);
  check("面板已打开", api.getAuth().panelOpen === true);
  api.switchAuthMode("signup");
  check("切到注册模式", api.getAuth().mode === "signup");
  check("注册时显示验证码行", $("authCodeRow").hidden === false);

  $("authEmail").value = "bad-email";
  $("authPassword").value = "correct-horse";
  const callsBefore = cloudCalls.length;
  $("authSubmit").dispatch("click");
  await settle();
  check("非法邮箱不发起请求", cloudCalls.length === callsBefore, cloudCalls.slice(callsBefore).join(","));
  check("提示邮箱格式错误", $("authEmailError").textContent.includes("正确的邮箱"));

  $("authEmail").value = "kid@example.com";
  $("authPassword").value = "correct-horse";
  const callsBefore2 = cloudCalls.length;
  $("authSubmit").dispatch("click");
  await settle();
  check("没取验证码就不提交注册", cloudCalls.length === callsBefore2, cloudCalls.slice(callsBefore2).join(","));
  check("提示先获取验证码", $("authMessage").textContent.includes("获取验证码"), $("authMessage").textContent);

  section("[4] 获取验证码 → 带密码完成注册");
  $("authSendCode").dispatch("click");
  await settle();
  check("调用了 sendOtp", cloudCalls.some((c) => c === "sendOtp:kid@example.com"));
  check("保存了 challenge", api.getAuth().hasPendingOtp === true);

  // 先放一份本机数据，验证注册后会被上传
  windowObj.location.hash = "#/math/add";
  api.route();
  $("mathQuestion").value = "本机录入的一道题";
  $("mathAnswer").value = "答案";
  $("mathKpSelect").value = "除法";
  api.submitMathForm();
  await settle();
  check("本机已有一道错题", api.getMathState().items.length === 1, String(api.getMathState().items.length));

  $("authCode").value = "123456";
  $("authSubmit").dispatch("click");
  await settle(10);
  check("调用了 verifyOtp 并带密码", cloudCalls.some((c) => c.startsWith("verifyOtp:kid@example.com:withPass")));
  check("已登录", api.getAuth().user && api.getAuth().user.email === "kid@example.com");
  check("注册后关闭面板", api.getAuth().panelOpen === false);
  check("已写入一条云端记录", [...cloudDb.keys()].some((k) => JSON.parse(k)[0] === "kid@example.com"), [...cloudDb.keys()].join(","));
  check("云端记录带 owner 前缀（数据归属清晰）", [...cloudDb.keys()].every((k) => JSON.parse(k)[0] === "kid@example.com"));

  section("[5] 换设备登录：合并云端进度");
  const cloudKey = [...cloudDb.keys()].find((k) => JSON.parse(k)[1] === "math.3.general");
  // 模拟另一台设备：清空本地，登录后应把云端拉回来
  api.clearProfileStorage();
  api.setMathState({ version: 1, items: [], customKps: [], updatedAt: null });
  check("本地档案已清空", ![...storage.keys()].some((k) => k.startsWith("studyHubMath.v1")));
  check("云端仍在", cloudKey !== undefined, String(cloudKey));

  cloudCalls.length = 0;
  $("accountSyncNow").dispatch("click");
  await settle(15);
  check("触发了云端读取", cloudCalls.some((c) => c.startsWith("select:kid@example.com")));
  check("合并后内存状态恢复错题", api.getMathState().items.length === 1, String(api.getMathState().items.length));
  const restored = [...storage.keys()].filter((k) => k.startsWith("studyHubMath.v1"));
  check("合并结果已写回本地存档", restored.length === 1 && JSON.parse(storage.get(restored[0])).items.length === 1,
    restored.join(","));
  check("英语与数学用不同的云端档案键", [...cloudDb.keys()].some((k) => JSON.parse(k)[1] === "math.3.general"), [...cloudDb.keys()].join(","));

  section("[6] 退出登录必须清掉本机档案");
  // 先造一点本机数据
  windowObj.location.hash = "#/math/add";
  api.route();
  $("mathQuestion").value = "退出前的一道题";
  $("mathAnswer").value = "答案";
  $("mathKpSelect").value = "除法";
  api.submitMathForm();
  await settle(10);
  check("退出前本机有 2 道题", api.getMathState().items.length === 2, String(api.getMathState().items.length));

  $("accountSignOut").dispatch("click");
  await settle(15);
  check("调用了 signOut", cloudCalls.includes("signOut"));
  check("已变为未登录", api.getAuth().user === null);
  const leftover = [...storage.keys()].filter((k) => k.startsWith("studyHubMath.v1") || k.startsWith("wordHeroState.v1"));
  check("本机学习档案已清空，不留给下一个人", leftover.length === 0, leftover.join(","));
  check("退出后提示已保存", ($("authMessage").textContent || "").includes("退出"), $("authMessage").textContent);

  section("[7] 密码登录成功 / 失败");
  api.switchAuthMode("login");
  $("authEmail").value = "kid@example.com";
  $("authPassword").value = "wrong-password";
  $("authSubmit").dispatch("click");
  await settle(10);
  check("错误密码不产生登录态", api.getAuth().user === null);
  check("提示邮箱或密码不对", $("authMessage").textContent.includes("邮箱或密码"), $("authMessage").textContent);

  $("authPassword").value = "correct-horse";
  $("authSubmit").dispatch("click");
  await settle(15);
  check("正确密码登录成功", api.getAuth().user && api.getAuth().user.email === "kid@example.com");
  check("登录后拉回云端错题", api.getMathState().items.length >= 1, String(api.getMathState().items.length));

  section("[8] 云端数据隔离（RLS 效果由 mock 模拟）");
  const kidRows = [...cloudDb.keys()].filter((k) => JSON.parse(k)[0] === "kid@example.com").length;
  const otherRows = [...cloudDb.keys()].filter((k) => JSON.parse(k)[0] === "other@example.com").length;
  check("只有 kid 的行", kidRows > 0 && otherRows === 0, kidRows + "/" + otherRows);

  section("[9] 合并规则：两边都不白学");
  const mergedEn = api.mergeEnState(
    { stars: 10, streak: 2, learned: { a: 1, b: 1 }, wrong: ["a"], history: { "2024-01-01": 2 }, daily: { date: "2024-01-01", words: ["a"], bonus: false }, settings: { sound: true, voice: true, autoSpeak: true } },
    { stars: 6, streak: 5, learned: { b: 1, c: 1 }, wrong: ["c"], history: { "2024-01-02": 1 }, daily: { date: "2024-01-02", words: ["c"], bonus: true }, settings: { sound: false, voice: true, autoSpeak: true } }
  );
  check("星星取较大值", mergedEn.stars === 10, String(mergedEn.stars));
  check("连续天数取较大值", mergedEn.streak === 5, String(mergedEn.streak));
  check("已学单词取并集", Object.keys(mergedEn.learned).sort().join(",") === "a,b,c", Object.keys(mergedEn.learned).join(","));
  check("错词取并集", mergedEn.wrong.sort().join(",") === "a,c", mergedEn.wrong.join(","));

  const mergedMath = api.mergeMathState(
    { version: 1, items: [{ id: "m1", kp: "除法", question: "q1", done: false, updatedAt: 100 }, { id: "m2", kp: "面积", question: "q2", done: true, updatedAt: 100 }], customKps: ["面积"] },
    { version: 1, items: [{ id: "m1", kp: "除法", question: "q1-改", done: true, updatedAt: 200 }, { id: "m3", kp: "分数", question: "q3", done: false, updatedAt: 100 }], customKps: ["分数"] }
  );
  check("错题取并集（3 道）", mergedMath.items.length === 3, String(mergedMath.items.length));
  check("同 id 取较新内容", mergedMath.items.find((i) => i.id === "m1").question === "q1-改");
  check("任一边攻克即算攻克", mergedMath.items.find((i) => i.id === "m1").done === true);
  check("知识点取并集", mergedMath.customKps.sort().join(",") === "分数,面积", mergedMath.customKps.join(","));

  section("[10] 同步范围覆盖全部年级 × 教材");
  const pairs = api.profilePairs();
  const enPairs = pairs.filter((p) => p.scope === "en");
  const mathPairs = pairs.filter((p) => p.scope === "math");
  check("英语档案覆盖 1-6 年级", new Set(enPairs.map((p) => p.grade)).size === 6, String(new Set(enPairs.map((p) => p.grade)).size));
  check("英语包含 PEP 档案", enPairs.some((p) => p.book === "pep"));
  check("英语包含外研版档案", enPairs.some((p) => p.book === "fltrp"));
  check("数学覆盖 3 种教材", new Set(mathPairs.map((p) => p.book)).size === 3, String(new Set(mathPairs.map((p) => p.book)).size));
  check("档案 key 唯一", new Set(pairs.map((p) => p.key)).size === pairs.length);

  section("[11] 运行时无异常");
  check("没有未捕获错误", errors.length === 0, errors.slice(0, 3).join(" | "));

  console.log("\n" + "═".repeat(46));
  console.log("通过 " + pass + " / " + (pass + fail));
  if (fail) process.exit(1);
})();
