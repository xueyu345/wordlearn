/* 学习通 · Windows 桌面版主进程
 *
 * 两种模式：
 *   离线模式（默认）：把 app/ 下的网页副本起成本地 http 服务，完全不依赖网络
 *   在线模式      ：直接加载已发布的正式网址，云同步与 AI 讲题老师可用
 *
 * 菜单「模式」里随时切换，选择记在 userData/mode.json。
 */
"use strict";

/* 环境变量 ELECTRON_RUN_AS_NODE=1 会把 Electron 变成纯 Node：
 * require("electron") 拿不到 app，进程秒退，看上去就是「双击没反应」。
 * 这台机器全局设了这个值，所以这里检测到就以正常模式自己重启一次。
 * 用 STUDYHUB_RELAUNCHED 做标记，避免兜不住时无限重启。
 */
let electronApi = null;
try {
  electronApi = require("electron");
} catch (_) {}
if (!electronApi || typeof electronApi !== "object" || !electronApi.app) {
  const asarMain = /app\.asar/.test(process.argv[1] || "");
  if (asarMain && !process.env.STUDYHUB_RELAUNCHED) {
    try {
      const env = Object.assign({}, process.env);
      delete env.ELECTRON_RUN_AS_NODE;
      delete env.NODE_OPTIONS; // 打包应用里带 NODE_OPTIONS 会触发 node_bindings 报错刷屏
      env.STUDYHUB_RELAUNCHED = "1";
      require("child_process")
        .spawn(process.execPath, [], { env, detached: true, stdio: "ignore" })
        .unref();
      process.exit(0);
    } catch (_) {}
  }
  process.stderr.write(
    "学习通启动失败：Electron 正以 Node 模式运行（环境变量 ELECTRON_RUN_AS_NODE 被设置了）。\n" +
      "开发模式请用 env -u ELECTRON_RUN_AS_NODE npx electron . 启动。\n"
  );
  process.exit(1);
}

const { app, BrowserWindow, Menu, dialog, shell, Tray, nativeImage } = electronApi;
const path = require("path");
const fs = require("fs");
const { startServer } = require("./serve");

const APP_DIR = path.join(__dirname, "app");
const ONLINE_URL = "https://study-hub-71859.app.workbuddy.host/";
const VERSION = require("./package.json").version;

// 允许页面自己跳转的域名：本地服务 + 正式站 + 云服务相关
const ALLOWED_HOSTS = ["127.0.0.1", "localhost"];

let mainWindow = null;
let server = null;
let mode = "offline";

let tray = null;
let allowQuit = false;
let minimizeToTray = true;
let balloonShown = false;

const modeFile = () => path.join(app.getPath("userData"), "mode.json");
const stateFile = () => path.join(app.getPath("userData"), "window-state.json");
const prefFile = () => path.join(app.getPath("userData"), "prefs.json");

function readPrefs() {
  try {
    return JSON.parse(fs.readFileSync(prefFile(), "utf8")) || {};
  } catch (_) {
    return {};
  }
}

function savePrefs(patch) {
  try {
    fs.mkdirSync(path.dirname(prefFile()), { recursive: true });
    fs.writeFileSync(prefFile(), JSON.stringify(Object.assign(readPrefs(), patch)));
  } catch (_) {}
}

function readMode() {
  if (process.argv.includes("--online")) return "online";
  try {
    const saved = JSON.parse(fs.readFileSync(modeFile(), "utf8"));
    if (saved && (saved.mode === "online" || saved.mode === "offline")) return saved.mode;
  } catch (_) {}
  return "offline";
}

function saveMode(next) {
  try {
    fs.mkdirSync(path.dirname(modeFile()), { recursive: true });
    fs.writeFileSync(modeFile(), JSON.stringify({ mode: next }));
  } catch (_) {}
}

function readState() {
  const fallback = { width: 1180, height: 800, x: undefined, y: undefined, maximized: false };
  try {
    const s = JSON.parse(fs.readFileSync(stateFile(), "utf8"));
    return Object.assign(fallback, s || {});
  } catch (_) {
    return fallback;
  }
}

function saveState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const b = mainWindow.getBounds();
  try {
    fs.writeFileSync(
      stateFile(),
      JSON.stringify({ width: b.width, height: b.height, x: b.x, y: b.y, maximized: mainWindow.isMaximized() })
    );
  } catch (_) {}
}

function currentURL() {
  return mode === "online" ? ONLINE_URL : `${server.url}#/home`;
}

async function createWindow() {
  const s = readState();
  mainWindow = new BrowserWindow({
    width: s.width,
    height: s.height,
    x: typeof s.x === "number" ? s.x : undefined,
    y: typeof s.y === "number" ? s.y : undefined,
    minWidth: 380,
    minHeight: 620,
    title: "学习通",
    backgroundColor: "#FFF7EC",
    autoHideMenuBar: true,
    icon: path.join(__dirname, "build", "icon.ico"),
    show: false,
    webPreferences: {
      // 页面是纯前端 + 云服务 SDK，不开 nodeIntegration，保持与普通浏览器一致的安全模型
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false
    }
  });

  if (s.maximized) mainWindow.maximize();

  // 窗口内只放行本地服务 / 正式站；其它一律交给系统浏览器
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowed(url)) return { action: "allow", overrideBrowserWindowOptions: { title: "学习通" } };
    shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isAllowed(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  ["resize", "move"].forEach((ev) => mainWindow.on(ev, saveState));
  mainWindow.on("close", (event) => {
    saveState();
    // 点 ✕ = 缩到托盘，进程继续跑；只有托盘菜单里的「退出」才真正结束
    if (tray && minimizeToTray && !allowQuit) {
      event.preventDefault();
      mainWindow.hide();
      showBalloonOnce();
      updateTrayMenu();
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  await mainWindow.loadURL(currentURL());
  mainWindow.show();
  mainWindow.focus();
  if (process.env.STUDYHUB_SELFTEST) runSelfTest();
}

/* 自检：加载完等几秒，把页面真实状态写进 desktop/self-test.json 后退出。
 * 只在设置 STUDYHUB_SELFTEST=1 时执行，正常启动完全不触发。
 */
async function runSelfTest() {
  const outFile = path.join(__dirname, "self-test.json");
  const report = { mode, url: currentURL(), electron: process.versions.electron, ok: false };
  try {
    await new Promise((r) => setTimeout(r, 4000));
    const probe = await mainWindow.webContents.executeJavaScript(
      `(async () => {
        const regs = await navigator.serviceWorker.getRegistrations().catch(() => []);
        let wordsOk = false, wordsCount = 0;
        try {
          const res = await fetch("./words.json", { cache: "no-store" });
          wordsOk = res.ok;
          const data = await res.json();
          wordsCount = (data.units || []).length;
        } catch (e) { wordsOk = "error: " + e.message; }
        const active = document.querySelector(".view.active");
        return {
          title: document.title,
          href: location.href,
          sideItems: document.querySelectorAll(".side-item").length,
          activeView: active ? active.id : null,
          wordsOk, wordsCount,
          swRegs: regs.length,
          online: navigator.onLine,
          firstText: (document.body.innerText || "").replace(/\\s+/g, " ").slice(0, 160)
        };
      })()`
    );
    Object.assign(report, probe);
    report.ok = probe.sideItems > 0 && probe.wordsOk === true && probe.wordsCount > 0;
  } catch (err) {
    report.error = err.message;
  }
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log("[selftest] " + JSON.stringify(report));
  app.quit();
}

/* ---------- 托盘 ---------- */

function trayImage() {
  const candidates = [
    path.join(__dirname, "app", "icons", "icon-192.png"),
    path.join(__dirname, "build", "icon.ico")
  ];
  for (const p of candidates) {
    try {
      const img = nativeImage.createFromPath(p);
      if (!img.isEmpty()) return img.resize({ width: 32, height: 32 });
    } catch (_) {}
  }
  return null;
}

function createTray() {
  const img = trayImage();
  if (!img) return false; // 拿不到图标就不做托盘，退回「关窗即退出」
  try {
    tray = new Tray(img);
  } catch (_) {
    return false;
  }
  tray.setToolTip(`学习通 v${VERSION}`);
  tray.on("click", toggleWindow);
  tray.on("double-click", toggleWindow);
  updateTrayMenu();
  return true;
}

function updateTrayMenu() {
  if (!tray || tray.isDestroyed()) return;
  const visible = mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible();
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: visible ? "隐藏窗口" : "打开 学习通", click: toggleWindow },
      { type: "separator" },
      {
        label: "离线模式（本地词库，断网可用）",
        type: "radio",
        checked: mode === "offline",
        click: () => switchMode("offline")
      },
      {
        label: "在线模式（云同步 + AI 讲题）",
        type: "radio",
        checked: mode === "online",
        click: () => switchMode("online")
      },
      { type: "separator" },
      {
        label: "关闭窗口时缩到托盘",
        type: "checkbox",
        checked: minimizeToTray,
        click: (item) => {
          minimizeToTray = item.checked;
          savePrefs({ minimizeToTray });
          updateTrayMenu();
          buildMenu();
        }
      },
      { label: `关于 学习通（v${VERSION}）`, click: showAbout },
      { type: "separator" },
      { label: "退出", click: quitApp }
    ])
  );
}

function toggleWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
    return;
  }
  if (mainWindow.isVisible()) {
    if (mainWindow.isFocused()) mainWindow.hide();
    else mainWindow.focus();
  } else {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
  updateTrayMenu();
}

/** 第一次缩到托盘时提示一下，否则用户会以为程序没了 */
function showBalloonOnce() {
  if (!tray || balloonShown || typeof tray.displayBalloon !== "function") return;
  balloonShown = true;
  try {
    tray.displayBalloon({
      iconType: "info",
      title: "学习通还在后台运行",
      content: "点右下角这个图标可以重新打开窗口；要彻底退出，右键它选「退出」。"
    });
  } catch (_) {}
}

function quitApp() {
  allowQuit = true;
  app.quit();
}

function isAllowed(url) {
  try {
    const u = new URL(url);
    if (u.protocol === "file:") return false;
    if (ALLOWED_HOSTS.includes(u.hostname)) return true;
    // 正式站及其子域、云服务域名
    return /(^|\.)workbuddy\.(host|cn)$/.test(u.hostname) || /(^|\.)tencent\.com$/.test(u.hostname);
  } catch (_) {
    return false;
  }
}

function switchMode(next) {
  if (next === mode) return;
  mode = next;
  saveMode(next);
  if (mainWindow) mainWindow.loadURL(currentURL());
  buildMenu();
  updateTrayMenu();
}

function showAbout() {
  dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "关于 学习通",
    message: "学习通 · 小学生英语单词与数学错题本",
    detail: [
      `版本 ${VERSION}`,
      `当前模式：${mode === "online" ? "在线（云同步 + AI 讲题）" : "离线（本地词库，断网可用）"}`,
      "",
      "离线模式下云同步与 AI 讲题老师不可用（云服务会校验调用来源域名），",
      "其余功能——英语四种玩法、数学错题本、解题挑战、学习仪表盘——都可离线使用。"
    ].join("\n"),
    buttons: ["好"]
  });
}

function buildMenu() {
  const template = [
    {
      label: "文件",
      submenu: [
        { label: "重新加载", accelerator: "Ctrl+R", click: () => mainWindow && mainWindow.reload() },
        { label: "回到首页", accelerator: "Ctrl+H", click: () => mainWindow && mainWindow.loadURL(currentURL()) },
        {
          label: "缩到系统托盘",
          accelerator: "Ctrl+W",
          visible: !!tray,
          click: () => {
            if (mainWindow) {
              mainWindow.hide();
              updateTrayMenu();
            }
          }
        },
        { type: "separator" },
        {
          label: "关闭窗口时缩到托盘",
          type: "checkbox",
          checked: minimizeToTray,
          visible: !!tray,
          click: (item) => {
            minimizeToTray = item.checked;
            savePrefs({ minimizeToTray });
            buildMenu();
            updateTrayMenu();
          }
        },
        { label: "退出", accelerator: "Ctrl+Q", click: quitApp }
      ]
    },
    {
      label: "视图",
      submenu: [
        { label: "实际大小", role: "resetZoom" },
        { label: "放大", role: "zoomIn" },
        { label: "缩小", role: "zoomOut" },
        { type: "separator" },
        { label: "全屏", role: "togglefullscreen" },
        { label: "开发者工具", accelerator: "F12", click: () => mainWindow && mainWindow.webContents.toggleDevTools() }
      ]
    },
    {
      label: "模式",
      submenu: [
        {
          label: "离线模式（本地词库，断网可用）",
          type: "radio",
          checked: mode === "offline",
          click: () => switchMode("offline")
        },
        {
          label: "在线模式（云同步 + AI 讲题）",
          type: "radio",
          checked: mode === "online",
          click: () => switchMode("online")
        }
      ]
    },
    {
      label: "帮助",
      submenu: [{ label: `关于 学习通（v${VERSION}）`, click: showAbout }]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    // 已经开着（可能缩在托盘里）时再双击 exe：把窗口叫回来
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      updateTrayMenu();
    } else {
      createWindow();
    }
  });

  app.on("ready", async () => {
    mode = readMode();
    const prefs = readPrefs();
    if (typeof prefs.minimizeToTray === "boolean") minimizeToTray = prefs.minimizeToTray;

    // 离线模式先把本地服务起来；在线模式也起一份，切回离线时不用等
    try {
      server = await startServer(APP_DIR);
    } catch (err) {
      if (app.isReady() && !app.isPackaged) {
        dialog.showErrorBox(
          "本地服务启动失败",
          `离线模式需要占用一个本地端口，但启动失败了：\n\n${err.message}\n\n已切换到在线模式。`
        );
      }
      mode = "online";
    }

    const hasTray = createTray();
    buildMenu();
    await createWindow();
    if (hasTray) updateTrayMenu();
  });

  // 缩到托盘后所有窗口都关了也不要退出 —— 托盘还活着就是还在用
  app.on("window-all-closed", () => {
    if (tray && !tray.isDestroyed() && minimizeToTray) return;
    quitApp();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // 任何退出路径（菜单、托盘、系统关机）都放行窗口关闭，并收掉本地端口
  app.on("before-quit", () => {
    allowQuit = true;
    if (server && typeof server.close === "function") server.close().catch(() => {});
  });
}
