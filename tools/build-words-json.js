#!/usr/bin/env node
/**
 * words.js  ->  words.json + units.js
 *
 * 词库唯一真源是 words.js（可带注释、可写尾逗号）。
 * 运行：node tools/build-words-json.js
 */
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const srcPath = path.join(root, "words.js");
const jsonPath = path.join(root, "words.json");

const source = fs.readFileSync(srcPath, "utf8");
const sandbox = { window: {} };
const load = new Function("window", source + "\n;return window.WORD_DATA;");
const data = load(sandbox.window);

if (!data || !Array.isArray(data.units) || data.units.length === 0) {
  throw new Error("words.js 没有导出有效的 WORD_DATA.units");
}

// 校验：字段完整性 + id 不重复
const seen = new Set();
const problems = [];
data.units.forEach((unit) => {
  if (!unit.id || !unit.name) problems.push("单元缺少 id 或 name：" + JSON.stringify(unit.name || unit.id));
  if (!Array.isArray(unit.words) || unit.words.length === 0) problems.push(unit.id + " 没有单词");
  (unit.words || []).forEach((word, index) => {
    ["w", "ipa", "zh", "emoji", "en", "cn"].forEach((key) => {
      if (!word[key]) problems.push(unit.id + "[" + index + "] 缺少字段 " + key);
    });
  });
  const key = unit.id + "#" + String((unit.words || [])[0] && unit.words[0].w);
  if (seen.has(key)) problems.push("重复单元：" + key);
  seen.add(key);
});

if (problems.length) {
  console.error("词库校验失败：\n - " + problems.join("\n - "));
  process.exit(1);
}

const payload = {
  version: data.version || 1,
  goal: data.goal || 10,
  units: data.units
};

fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2) + "\n", "utf8");

const total = data.units.reduce((sum, unit) => sum + unit.words.length, 0);
console.log("已生成 words.json：" + data.units.length + " 个主题 / " + total + " 个单词");
