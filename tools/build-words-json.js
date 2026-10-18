#!/usr/bin/env node
/**
 * books-en.js + words*.js  ->  words.json
 *
 * 词库唯一真源是 words.js 与同目录的 words-*.js（可带注释、可写尾逗号）。
 * 运行：node tools/build-words-json.js
 */
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const jsonPath = path.join(root, "words.json");

const readSource = (name) => fs.readFileSync(path.join(root, name), "utf8");

const run = (code, label, sandbox) => {
  const fn = new Function("window", code + "\n;return window;");
  try {
    return fn(sandbox);
  } catch (error) {
    throw new Error("加载 " + label + " 失败：" + error.message);
  }
};

// 教材版本元数据要先加载
const sandbox = {};
run(readSource("books-en.js"), "books-en.js", sandbox);

// 词库分片：words-grade-*.js（通用版分年级）+ words-pep.js + words-fltrp.js
const SHARD_PATTERN = /^words-(grade-.*|pep|fltrp)\.js$/;
const shards = fs
  .readdirSync(root)
  .filter((name) => SHARD_PATTERN.test(name))
  .sort();

["words-pep.js", "words-fltrp.js"].forEach((name) => {
  if (!shards.includes(name)) throw new Error("缺少词库分片：" + name);
});

shards.forEach((name) => run(readSource(name), name, sandbox));

const data = (run(readSource("words.js"), "words.js", sandbox) || {}).WORD_DATA;

if (!data || !Array.isArray(data.units) || data.units.length === 0) {
  throw new Error("words.js 没有导出有效的 WORD_DATA.units");
}

const books = Array.isArray(sandbox.EN_BOOKS) ? sandbox.EN_BOOKS : [];
if (books.length === 0) throw new Error("books-en.js 没有导出有效的 EN_BOOKS");

const validGrades = [1, 2, 3, 4, 5, 6];
const bookIds = new Set(books.map((book) => book.id));

// 教材元数据自身的校验
const bookProblems = [];
books.forEach((book) => {
  if (!book.id || !book.name) bookProblems.push("教材版本缺少 id 或 name");
  if (!Array.isArray(book.editions) || book.editions.length === 0) {
    bookProblems.push(book.id + " 没有声明 editions");
  } else {
    book.editions.forEach((grade) => {
      if (!validGrades.includes(grade)) bookProblems.push(book.id + " 的 editions 含非法年级 " + grade);
    });
  }
});
if (bookProblems.length) {
  console.error("教材元数据校验失败：\n - " + bookProblems.join("\n - "));
  process.exit(1);
}

// 单元校验：字段完整性 + id 不重复 + 年级/教材合法
const seen = new Set();
const problems = [];
const stats = {};

data.units.forEach((unit) => {
  if (!unit.id || !unit.name) problems.push("单元缺少 id 或 name：" + JSON.stringify(unit.name || unit.id));
  if (!Array.isArray(unit.words) || unit.words.length === 0) problems.push(unit.id + " 没有单词");
  if (!unit.book) {
    problems.push(unit.id + " 缺少 book 字段（general / pep / fltrp）");
  } else if (!bookIds.has(unit.book)) {
    problems.push(unit.id + " 的 book 不合法：" + unit.book);
  }
  if (!validGrades.includes(unit.grade)) {
    problems.push(unit.id + " 的 grade 不合法：" + JSON.stringify(unit.grade) + "（应为 1-6）");
  } else if (unit.book) {
    const book = books.find((item) => item.id === unit.book);
    if (book && !book.editions.includes(unit.grade)) {
      problems.push(unit.id + " 属于 " + unit.book + "，但该版本不覆盖 " + unit.grade + " 年级");
    }
    const key = unit.book + "-" + unit.grade;
    stats[key] = stats[key] || { units: 0, words: 0 };
    stats[key].units += 1;
    stats[key].words += (unit.words || []).length;
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
  version: data.version || 3,
  goal: data.goal || 10,
  grades: data.grades || validGrades,
  defaultGrade: data.defaultGrade || 3,
  defaultBook: data.defaultBook || "general",
  books: books.map((book) => ({
    id: book.id,
    name: book.name,
    short: book.short || book.name,
    note: book.note || "",
    editions: book.editions,
    color: book.color || "#FF8A3D",
    outline: book.outline || {}
  })),
  units: data.units
};

fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2) + "\n", "utf8");

const total = data.units.reduce((sum, unit) => sum + unit.words.length, 0);
console.log("已生成 words.json：" + data.units.length + " 个主题 / " + total + " 个单词");
books.forEach((book) => {
  console.log("\n  【" + book.name + "】");
  book.editions.forEach((grade) => {
    const row = stats[book.id + "-" + grade];
    console.log("    " + grade + " 年级：" + (row
      ? row.units + " 个主题， " + row.words + " 个单词"
      : "暂无内容"));
  });
});
