/* 从原网页项目重新生成小程序的数据副本（只读原文件，不改原文件）
 * 用法：node tools/build-data.js
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../..');       // E:/wordlearn
const OUT = path.resolve(__dirname, '../utils');    // E:/wordlearn/miniprogram/utils

const wordsRaw = fs.readFileSync(path.join(SRC, 'words.json'), 'utf8');
const words = JSON.parse(wordsRaw);
if (!Array.isArray(words.units) || !words.units.length) throw new Error('words.json 里没有 units');
fs.writeFileSync(
  path.join(OUT, 'words-data.js'),
  '/* 词库副本：由 words.json 生成，请勿手工编辑 */\nmodule.exports = ' + JSON.stringify(words) + ';\n'
);

let bank = fs.readFileSync(path.join(SRC, 'math-problems.js'), 'utf8');
const tail = '})(typeof window !== "undefined" ? window : globalThis);';
if (bank.indexOf(tail) < 0) throw new Error('math-problems.js 尾部挂载方式变了，请同步更新本脚本');
bank = '/* 数学题库副本：由 math-problems.js 生成，改为 CommonJS 导出 */\nvar __bank_host = {};\n'
  + bank.replace(tail, '})(__bank_host);\nmodule.exports = __bank_host.MathProblemBank;');
fs.writeFileSync(path.join(OUT, 'math-problems.js'), bank);

const counts = {};
words.units.forEach((u) => {
  const k = u.book + ' · ' + u.grade + '年级';
  counts[k] = (counts[k] || 0) + 1;
});
console.log('words-data.js  units=' + words.units.length + '  books=' + (words.books || []).length);
console.log('math-problems.js  ' + bank.length + ' bytes');
Object.keys(counts).sort().forEach((k) => console.log('  ' + k + '：' + counts[k] + ' 个主题'));
const bank2 = require(path.join(OUT, 'math-problems.js'));
console.log('题库自检 makeSet:', JSON.stringify(bank2.makeSet({ grade: 3, kp: '周长', count: 1 })[0].q));
