/* 原生小程序静态自检：在没法开微信开发者工具时，先拦掉必编译失败 / 必运行时报错的问题
 * 用法：node tools/check.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let errors = [];
let warns = [];

function walk(dir, out) {
  fs.readdirSync(dir).forEach((name) => {
    if (name === 'node_modules' || name === '.git') return;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else out.push(full);
  });
  return out;
}
const files = walk(ROOT, []);
const rel = (f) => path.relative(ROOT, f).replace(/\\/g, '/');

/* ---------- 1. JSON 严格性（小程序不允许注释和尾逗号） ---------- */
files.filter((f) => f.endsWith('.json')).forEach((f) => {
  try { JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) {
    errors.push(rel(f) + ' JSON 解析失败：' + e.message);
  }
});

/* ---------- 2. app.json 与页面文件齐套 ---------- */
const appJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'));
if (!appJson.pages || !appJson.pages.length) errors.push('app.json 缺少 pages');
if (appJson.lazyCodeLoading !== 'requiredComponents') errors.push('app.json 缺少 lazyCodeLoading: requiredComponents');

const declared = appJson.pages || [];
declared.forEach((p) => {
  ['js', 'wxml'].forEach((ext) => {
    if (!fs.existsSync(path.join(ROOT, p + '.' + ext))) errors.push('app.json 声明的页面缺少文件：' + p + '.' + ext);
  });
});
// 反向：pages 目录里存在但未声明的页面
files.filter((f) => /pages\/[^/]+\/[^/]+\.js$/.test(f)).forEach((f) => {
  const p = rel(f).replace(/\.js$/, '');
  if (declared.indexOf(p) < 0) warns.push('页面未在 app.json 声明：' + p);
});

if (appJson.tabBar && appJson.tabBar.list) {
  appJson.tabBar.list.forEach((item) => {
    if (declared.indexOf(item.pagePath) < 0) errors.push('tabBar 指向未声明页面：' + item.pagePath);
    if (item.iconPath && !fs.existsSync(path.join(ROOT, item.iconPath))) errors.push('tabBar 图标不存在：' + item.iconPath);
    if (item.selectedIconPath && !fs.existsSync(path.join(ROOT, item.selectedIconPath))) errors.push('tabBar 选中图标不存在：' + item.selectedIconPath);
  });
}

/* ---------- 3. WXML 表达式限制 ---------- */
files.filter((f) => f.endsWith('.wxml')).forEach((f) => {
  const src = fs.readFileSync(f, 'utf8');
  // 3.1 HTML 标签（小程序没有这些）
  ['div', 'span', 'p', 'a', 'img', 'ul', 'li', 'section', 'header', 'main', 'article', 'h1', 'h2', 'h3'].forEach((tag) => {
    const re = new RegExp('<' + tag + '[\\s>]', 'g');
    if (re.test(src)) errors.push(rel(f) + ' 使用了 HTML 标签 <' + tag + '>，小程序不支持');
  });
  // 3.2 插值里不允许函数调用 / 箭头函数 / ?. / ??
  const interpolations = src.match(/\{\{[\s\S]*?\}\}/g) || [];
  interpolations.forEach((expr) => {
    if (/=>/.test(expr)) errors.push(rel(f) + ' WXML 插值含箭头函数：' + expr.trim());
    if (/\?\./.test(expr)) errors.push(rel(f) + ' WXML 插值含可选链 ?.：' + expr.trim());
    if (/\?\?/.test(expr)) errors.push(rel(f) + ' WXML 插值含 ?? ：' + expr.trim());
    // 排除 wx:for / wx:if 里合法的简单表达式后，检测 "name(" 形式调用
    const calls = expr.match(/[A-Za-z_$][\w$]*\s*\(/g) || [];
    const allow = ['wx:for', 'wx:if', 'wx:elif', 'wx:key', 'wx:else'];
    calls.forEach((c) => {
      if (allow.some((a) => c.indexOf(a) === 0)) return;
      errors.push(rel(f) + ' WXML 插值调用了函数：' + c + '（应改为在 data 里算好）');
    });
  });
});

/* ---------- 4. JS 禁用浏览器 API ---------- */
const banned = [
  ['document.', 'document'],
  ['window.', 'window'],
  ['localStorage', 'localStorage'],
  ['sessionStorage', 'sessionStorage'],
  ['innerHTML', 'innerHTML'],
  ['fetch(', 'fetch'],
  ['XMLHttpRequest', 'XMLHttpRequest'],
  ['speechSynthesis', 'speechSynthesis'],
  ['new Audio(', 'WebAudio'],
  ['FileReader', 'FileReader'],
  ['URL.createObjectURL', 'createObjectURL']
];
// 只扫会进小程序包的代码：tools/ 是 Node 脚本，words-data.js 是词库数据（里面有 window 这个单词）
const SKIP_SCAN = ['tools/', 'node_modules/', 'utils/words-data.js', 'utils/math-problems.js', 'utils/workbuddy-cloud-diagnostics.js'];
files.filter((f) => f.endsWith('.js')).forEach((f) => {
  const r = rel(f);
  if (SKIP_SCAN.some((p) => r.indexOf(p) === 0 || r === p)) return;
  const src = fs.readFileSync(f, 'utf8');
  banned.forEach(([needle, label]) => {
    if (src.indexOf(needle) >= 0) errors.push(rel(f) + ' 使用了浏览器 API：' + label);
  });
});

/* ---------- 5. require 路径可解析 ---------- */
files.filter((f) => f.endsWith('.js')).forEach((f) => {
  const r0 = rel(f);
  if (r0.indexOf('node_modules/') === 0) return;
  if (r0.indexOf('tools/') === 0) return;   // Node 测试脚本，不进小程序包
  const src = fs.readFileSync(f, 'utf8');
  const reqs = src.match(/require\(\s*['"]([^'"]+)['"]\s*\)/g) || [];
  reqs.forEach((r) => {
    const mod = r.match(/['"]([^'"]+)['"]/)[1];
    if (!mod.startsWith('.')) return;   // npm 包交给构建
    const target = path.resolve(path.dirname(f), mod);
    if (!fs.existsSync(target) && !fs.existsSync(target + '.js')) {
      errors.push(rel(f) + ' 的 require 找不到目标：' + mod);
    }
  });
});

/* ---------- 6. WXSS @import 必须指向已存在文件 ---------- */
files.filter((f) => f.endsWith('.wxss')).forEach((f) => {
  const src = fs.readFileSync(f, 'utf8');
  const imports = src.match(/@import\s+['"]([^'"]+)['"]/g) || [];
  imports.forEach((imp) => {
    const p = imp.match(/['"]([^'"]+)['"]/)[1];
    if (!fs.existsSync(path.resolve(path.dirname(f), p))) errors.push(rel(f) + ' 的 @import 不存在：' + p);
  });
});

console.log('--- 小程序静态自检 ---');
console.log('页面数：' + declared.length + '，文件数：' + files.length);
if (warns.length) {
  console.log('\n[提醒 ' + warns.length + ']');
  warns.forEach((w) => console.log('  · ' + w));
}
if (errors.length) {
  console.log('\n[错误 ' + errors.length + ']');
  errors.forEach((e) => console.log('  ✗ ' + e));
  process.exit(1);
}
console.log('\n✅ 未发现必错问题');
