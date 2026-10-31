# 学习通 · 微信小程序版

原 Web 版（`../index.html`）的微信小程序副本。原网页与原始文件**完全未改动**，本目录是独立的一份。

## 功能

| 模块 | 内容 |
| --- | --- |
| 仪表盘 | 今日目标、连续打卡、14 天趋势、主题掌握度、错题攻克、8 枚成就徽章 |
| 英语 | 学一学（翻卡）/ 选一选（四选一）/ 拼一拼（拼写）/ 连一连（配对）/ 混合挑战 / 错词本 |
| 数学 | 记错题（含拍照、最多 3 张图）/ 按知识点筛选与搜索 / 抽题复习 / 解题挑战 |
| 错题试卷 | 数学错题 + 英语错词汇总成一张卷子，在线作答、交卷自动判分并回写错题本（入口：数学页「📝 错题组卷」、错词本「📝 错词组卷」、「我的 → 错题试卷」） |
| 我的 | 登录与云端同步、学习偏好、年级与教材切换、备份导出导入、清空数据 |

数据按「年级 × 教材」隔离，存本机；登录后与云端双向合并，换设备可接续。

## 与网页版的差异（受小程序运行环境限制）

- **发音朗读不可用**：小程序没有浏览器 TTS，「听音选词」改为「看音标选词」，拼一拼改为看中文释义拼写。
- **音效改为触感反馈**：小程序无 WebAudio，答对答错用 `wx.vibrateShort` 反馈。
- **错题图片存本地文件**：不再用 dataURL 塞 storage，规避 5MB 上限；云端只同步文字部分。
- **没有 AI 讲题老师**（本次范围不含）。
- **错题试卷不能打印**：小程序没有打印能力，试卷只做在线作答 + 判分；要打印成纸质卷子请用网页版或桌面版的「🖨️ 打印 / 存 PDF」。
- 不支持粘贴截图（小程序拿不到剪贴板图片），拍照和相册选图可用。

## 用微信开发者工具打开

1. 打开「微信开发者工具」→ 导入项目，目录选本文件夹。
2. 填你自己的 **AppID**（`project.config.json` 里的 `appid` 目前是占位值 `touristappid`，需要替换）。
3. 菜单栏「工具 → 构建 npm」，生成 `miniprogram_npm`（云同步依赖这一步）。
4. 如果用到登录，需要在小程序后台把云服务域名加入 **request 合法域名**：`https://mp-api.app.workbuddy.host`。

## 目录

```
app.js / app.json / app.wxss      全局
utils/store.js                    学习档案状态层（年级×教材隔离 + 云同步）
utils/words-data.js               词库副本（由 words.json 生成）
utils/math-problems.js            数学题库副本（由 math-problems.js 生成）
utils/cloud.js                    云服务客户端（唯一实例）
utils/paper.js                    错题试卷：组卷、判分、回写（规则与网页版一致）
utils/workbuddy-cloud-diagnostics.js  云请求诊断
pages/…                           16 个页面
tools/check.js                    静态自检
tools/smoke.js                    状态层 + 全部页面生命周期冒烟
tools/test-paper.js               错题试卷逻辑：组卷 / 判分 / 回写 / 视图数据
```

## 自检

```bash
node tools/check.js        # 静态自检（JSON、WXML 表达式、禁用 API、require 路径）
node tools/smoke.js        # 状态层 + 页面生命周期冒烟
node tools/test-paper.js   # 错题试卷逻辑
```

词库变了需要重新生成副本：

```bash
node tools/build-data.js
```
