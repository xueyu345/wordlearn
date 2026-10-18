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

// 先加载分年级词库文件，再加载 words.js（后者会展开前者的数组）
const gradeFiles = fs
  .readdirSync(root)
  .filter((name) => /^words-grade-.*\.js$/.test(name))
  .sort();

const gradeSources = gradeFiles.map((name) => ({
  name,
  code: fs.readFileSync(path.join(root, name), "utf8")
}));

const run = (code, label) => {
  const fn = new Function("window", code + "\n;return window;");
  try {
    return fn(sandbox.window);
  } catch (error) {
    throw new Error("加载 " + label + " 失败：" + error.message);
  }
};

gradeSources.forEach(({ name, code }) => run(code, name));
sandbox.window.WORD_DATA = (run(source, "words.js") || {}).WORD_DATA;

const data = sandbox.window.WORD_DATA;

if (!data || !Array.isArray(data.units) || data.units.length === 0) {
  throw new Error("words.js 没有导出有效的 WORD_DATA.units");
}

// 校验：字段完整性 + id 不重复 + 年级合法
const seen = new Set();
const problems = [];
const validGrades = [1, 2, 3, 4, 5, 6];
const gradeCount = {};

data.units.forEach((unit) => {
  if (!unit.id || !unit.name) problems.push("单元缺少 id 或 name：" + JSON.stringify(unit.name || unit.id));
  if (!Array.isArray(unit.words) || unit.words.length === 0) problems.push(unit.id + " 没有单词");
  if (!validGrades.includes(unit.grade)) {
    problems.push(unit.id + " 的 grade 不合法：" + JSON.stringify(unit.grade) + "（应为 1-6）");
  } else {
    gradeCount[unit.grade] = (gradeCount[unit.grade] || 0) + (unit.words || []).length;
  }
  (unit.words || []).forEach((word, index) => {
    ["w", "ipa", "zh", "emoji", "en", "cn"].forEach((key) => {
      if (!word[key]) problems.push(unit.id + "[" + index + "] 缺少字段 " + key);
    });
  });
  if (seen.has(unit.id)) problems.push("重复单元 id：" + unit.id);
  seen.add(unit.id);
});

if (problems.length) {
  console.error("词库校验失败：\n - " + problems.join("\n - "));
  process.exit(1);
}

const payload = {
  version: data.version || 2,
  goal: data.goal || 10,
  grades: data.grades || validGrades,
  defaultGrade: data.defaultGrade || 3,
  units: data.units
};

fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2) + "\n", "utf8");

const total = data.units.reduce((sum, unit) => sum + unit.words.length, 0);
console.log("已生成 words.json：" + data.units.length + " 个主题 / " + total + " 个单词");
validGrades.forEach((grade) => {
  const units = data.units.filter((unit) => unit.grade === grade);
  console.log("  " + grade + " 年级：" + units.length + " 个主题， " + (gradeCount[grade] || 0) + " 个单词");
});
