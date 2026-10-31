/* 通用工具：日期、洗牌、字符串、提示 */

const GRADES = [1, 2, 3, 4, 5, 6];
const GRADE_CN = { 1: "一", 2: "二", 3: "三", 4: "四", 5: "五", 6: "六" };

function pad2(n) { return n < 10 ? "0" + n : String(n); }

function dateKey(date) {
  const d = date || new Date();
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}

function yesterdayKey() {
  return dateKey(new Date(Date.now() - 86400000));
}

function gradeLabel(grade) {
  return (GRADE_CN[grade] || grade) + "年级";
}

function shuffle(list) {
  const array = list.slice();
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = array[i]; array[i] = array[j]; array[j] = t;
  }
  return array;
}

// 答案归一化：全角数字、多余空格、大小写都统一掉
function normalize(value) {
  return String(value == null ? "" : value)
    .replace(/[\uFF10-\uFF19]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function clampChoice(value, choices, fallback) {
  const number = Number(value);
  return choices.indexOf(number) >= 0 ? number : fallback;
}

function sizeText(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / 1024 / 1024).toFixed(2) + " MB";
}

function formatTime(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  return pad2(Math.floor(s / 60)) + ":" + pad2(s % 60);
}

function uid(prefix) {
  return (prefix || "id") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function toast(title, icon) {
  wx.showToast({ title: String(title || "").slice(0, 40), icon: icon || "none", duration: 1800 });
}

function vibrate(kind) {
  try { wx.vibrateShort({ type: kind || "light" }); } catch (e) { /* 模拟器可能不支持 */ }
}

module.exports = {
  GRADES: GRADES,
  GRADE_CN: GRADE_CN,
  pad2: pad2,
  dateKey: dateKey,
  yesterdayKey: yesterdayKey,
  gradeLabel: gradeLabel,
  shuffle: shuffle,
  normalize: normalize,
  clampChoice: clampChoice,
  sizeText: sizeText,
  formatTime: formatTime,
  uid: uid,
  toast: toast,
  vibrate: vibrate
};
