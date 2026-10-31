# 学习通 · Windows 桌面版

把 `index.html` 那个网页套进一个原生窗口，双击即用，断网也能学。

## 为什么需要它

直接双击 `index.html` 是 `file://` 协议，浏览器会拦掉 `fetch`，词库读不出来（README 里写过：会退回上一次缓存）。
桌面版在启动时**起一个只监听 127.0.0.1 的本地 http 服务**再加载它，于是：

- 词库 `words.json` 正常加载
- Service Worker 能注册（离线缓存生效）
- 学习记录照常存在本机 localStorage，关掉再开还在

## 两种模式

| 模式 | 加载什么 | 能用的功能 |
| --- | --- | --- |
| **离线模式**（默认） | `app/` 下的本地副本 | 英语四种玩法、数学错题本、解题挑战、学习仪表盘 —— 断网全都能用 |
| **在线模式** | `https://study-hub-71859.app.workbuddy.host/` | 上面全部 + 云同步 + AI 讲题老师 |

菜单「模式」里随时切换，选择记在 `%APPDATA%\学习通\mode.json`。

> **离线模式下云同步和 AI 讲题老师用不了。** 云服务会校验调用来源域名，`127.0.0.1` 过不了（本地预览 `localhost` 也一样，这是原网页的已知限制，不是桌面版引入的）。要用这两个功能就切到在线模式。

## 关窗口 ≠ 退出

点 ✕ 只是把窗口**缩到右下角托盘**，程序继续在后台跑（本地服务、学习记录都还在），点托盘图标就能叫回来。要彻底结束：**右键托盘图标 →「退出」**。

- 托盘菜单：打开/隐藏窗口、切换模式、关闭窗口时缩到托盘（可关）、关于、退出
- 第一次缩到托盘会弹一次气泡提示「学习通还在后台运行」，之后不再打扰
- 程序已经在跑时再双击 exe，会把窗口叫回来，不会开出第二个
- 不想要这个行为：托盘菜单里取消勾选「关闭窗口时缩到托盘」，之后关窗口就直接退出
- 开关记在 `%APPDATA%\学习通\prefs.json`

## 日常使用

```bash
cd desktop

npm start          # 同步网页资源 + 启动窗口（开发用）

npm run dist       # 打包，产出安装包 + 便携版到 desktop/dist
```

打包产物：

- `学习通 Setup 1.5.0.exe` —— 安装版，装到开始菜单 + 桌面快捷方式，可卸载
- `学习通-便携版-1.5.0.exe` —— 单文件，双击直接跑，不写注册表，适合拷到 U 盘

改了网页之后：

```bash
npm run sync       # 把 index.html / words.json / icons 等重新拷进 app/
npm start          # 看效果
npm run dist       # 重新出包
```

## 文件说明

```
desktop/
  main.js              主进程：窗口、菜单、单实例、在线/离线切换
  serve.js             本地静态服务器（端口由系统分配，不抢 8000）
  package.json         打包配置（electron-builder）
  build/icon.ico       窗口和 exe 的图标，由 tools/make-ico.js 生成
  app/                 网页资源副本，由 tools/copy-web.js 同步，不要手改
  tools/
    copy-web.js        网页 → app/ 的同步脚本
    make-ico.js        PNG → ICO（纯 Node，无依赖）
```

## 两个坑

1. **`ELECTRON_RUN_AS_NODE=1` 会让 Electron 退化成纯 Node**（表现为 `require("electron")` 拿不到 `app`，进程秒退，看起来像「双击没反应」）。

   这个变量只在 WorkBuddy 的终端会话里被注入（用户级、系统级都没有），所以**从资源管理器双击 exe 完全不受影响**。要在这个终端里用命令行跑，绕开它即可：

   ```bash
   env -u ELECTRON_RUN_AS_NODE npm start
   ```

   `main.js` 开头也留了一层自愈：真以 Node 模式被拉起时会自己重启一次。
2. **`app/` 是副本不是源码。** 改网页请改根目录的 `index.html`，然后 `npm run sync`，别直接改 `app/` 里的文件，下次同步会被覆盖。
