/* 把网页运行所需的文件同步到 desktop/app/
 * 改了 index.html / 词库之后，重新跑一次：npm run sync
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const DEST = path.resolve(__dirname, "..", "app");

const FILES = ["index.html", "words.json", "math-problems.js", "sw.js", "manifest.json", "books-en.js"];
const DIRS = ["icons"];

function copyFile(name) {
  const src = path.join(ROOT, name);
  const dst = path.join(DEST, name);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  const kb = (fs.statSync(dst).size / 1024).toFixed(1);
  console.log(`  ✓ ${name}  (${kb} KB)`);
}

function copyDir(name) {
  const src = path.join(ROOT, name);
  const dst = path.join(DEST, name);
  fs.rmSync(dst, { recursive: true, force: true });
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.isFile()) fs.copyFileSync(path.join(src, entry.name), path.join(dst, entry.name));
  }
  console.log(`  ✓ ${name}/  (${fs.readdirSync(dst).length} 个文件)`);
}

console.log(`同步网页资源 → ${DEST}`);
fs.mkdirSync(DEST, { recursive: true });
FILES.forEach(copyFile);
DIRS.forEach(copyDir);
console.log("完成。");
