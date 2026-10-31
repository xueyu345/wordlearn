/* 数学题库副本：由 math-problems.js 生成，改为 CommonJS 导出 */
var __bank_host = {};
/* 数学「解题挑战」题库
 * ------------------------------------------------------------------
 * 题目不是写死的，而是按「当前年级的学习阶段」现场生成：
 *   一年级只会出 20 以内加减、认识钟表这类题，绝不会出现方程；
 *   六年级才会出现分数乘除、百分数、圆柱圆锥。
 * 每一道题都自带：
 *   steps —— 用该年级课本里的讲法写的一步一步解析
 *   tip   —— 这个知识点最容易踩的坑
 * 这样孩子先做题、看解析，做错了再一键收进错题本。
 * ------------------------------------------------------------------
 * 用法：MathProblemBank.makeSet({ grade, kp, count })
 */
(function (global) {
  "use strict";

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function lcm(a, b) { return a * b / gcd(a, b); }
  // 约分后的分数字符串（分母为 1 时写成整数）
  function frac(n, d) {
    var g = gcd(n, d); n /= g; d /= g;
    if (d < 0) { n = -n; d = -d; }
    return d === 1 ? String(n) : n + "/" + d;
  }
  function r2(n) { return Math.round(n * 100) / 100; }
  function num(n) { return String(r2(n)); }
  function pad2(n) { return n < 10 ? "0" + n : String(n); }
  function money(n) { return n % 10 === 0 ? String(n / 10) : (n / 10).toFixed(1); }

  var PI = 3.14;

  var TOPICS = {
    /* ============ 一年级 ============ */
    add20: {
      name: "20 以内加减法", type: "计算题", stage: "一年级 · 20 以内加减法",
      keys: ["20 以内", "加减", "加与减", "生活中的数"],
      gen: function () {
        if (Math.random() < 0.5) {
          var a = ri(3, 14), b = ri(2, Math.max(2, 20 - a)), s = a + b;
          var toTen = 10 - (a % 10);
          var steps = a < 10 && b > toTen && toTen > 0
            ? ["用凑十法：把 " + b + " 分成 " + toTen + " 和 " + (b - toTen) + "。",
               a + " + " + toTen + " = 10，10 再 add " + (b - toTen) + " 是 " + s + "。".replace("add", "加")]
            : ["从 " + a + " 开始，接着往后数 " + b + " 个。",
               "数到最后一个数就是 " + s + "。"];
          return { q: a + " + " + b + " = （  ）", a: String(s), steps: steps,
            tip: "进位加法可以用凑十法：先凑成 10，再加上剩下的。" };
        }
        var c = ri(11, 20), d = ri(2, c - 2), e = c - d;
        return { q: c + " − " + d + " = （  ）", a: String(e),
          steps: ["想加法算减法：几加 " + d + " 等于 " + c + "？",
                  "因为 " + e + " + " + d + " = " + c + "，所以 " + c + " − " + d + " = " + e + "。"],
          tip: "减法想加法：算减法时，想「谁加上减数等于被减数」。" };
      }
    },
    num100: {
      name: "100 以内数的认识", type: "概念判断", stage: "一年级 · 100 以内数的认识",
      keys: ["100 以内数的认识", "100 以内的数", "生活中的数", "数的认识"],
      gen: function () {
        var mode = ri(0, 2);
        if (mode === 0) {
          var t = ri(1, 9), o = ri(0, 9), n = t * 10 + o;
          return { q: t + " 个十和 " + o + " 个一组成的数是（  ）", a: String(n),
            steps: [t + " 个十就是 " + t * 10 + "。", t * 10 + " 再加上 " + o + " 个一，就是 " + n + "。"],
            tip: "十位上是几就表示几个十，个位上是几就表示几个一。" };
        }
        if (mode === 1) {
          var m = ri(20, 89);
          return { q: m + " 的十位上是（  ）", a: String(Math.floor(m / 10)),
            steps: ["从右边起，第一位是个位，第二位是十位。", m + " 十位上的数字是 " + Math.floor(m / 10) + "。"],
            tip: "两位数中，左边那位在十位上。" };
        }
        var k = ri(21, 88);
        return { q: "与 " + k + " 相邻的两个数是（  ）和（  ）", a: (k - 1) + " 和 " + (k + 1),
          accept: [(k - 1) + "和" + (k + 1), (k - 1) + "、" + (k + 1), (k - 1) + "," + (k + 1), (k - 1) + " " + (k + 1)],
          steps: ["相邻的数就是它前面一个和后面一个。", k + " 前面是 " + (k - 1) + "，后面是 " + (k + 1) + "。"],
          tip: "按顺序写：先写小的，再写大的。" };
      }
    },
    shape1: {
      name: "认识图形", type: "图形几何", stage: "一年级 · 认识图形",
      keys: ["图形", "认识图形"],
      gen: function () {
        return pick([
          { q: "正方体有（  ）个面", a: "6", steps: ["正方体上下、前后、左右各有 1 个面。", "6 个面都一样大。"], tip: "可以拿一个正方体盒子数一数。" },
          { q: "长方形有（  ）条边", a: "4", steps: ["长方形是四边形，四条边围成一圈。"], tip: "长方形和正方形都有 4 条边。" },
          { q: "硬币的面是（  ）形", a: "圆", accept: ["圆", "圆形"], steps: ["圆圆的、没有尖角的图形就是圆。"], tip: "填图形名称：圆。" },
          { q: "圆柱的上下两个面都是（  ）形", a: "圆", accept: ["圆", "圆形"], steps: ["圆柱上下两个底面大小相同，都是圆。"], tip: "" },
          { q: "三角形有（  ）个角", a: "3", steps: ["三角形有 3 条边，也就有 3 个角。"], tip: "" }
        ]);
      }
    },
    clock: {
      name: "认识钟表", type: "概念判断", stage: "一年级 · 认识钟表",
      keys: ["钟表", "认识钟表"],
      gen: function () {
        if (Math.random() < 0.5) {
          var h = ri(1, 12);
          return { q: "分针指向 12，时针指向 " + h + "，这时是（  ）时", a: String(h),
            steps: ["分针指向 12，说明是整时。", "整时看时针：时针指向几就是几时。"],
            tip: "整时的时候，分针一定指着 12。" };
        }
        var h2 = ri(1, 9), add = ri(1, 3);
        return { q: h2 + " 时再过 " + add + " 小时是（  ）时", a: String(h2 + add),
          steps: ["整时加整时，只要把小时数相加。", h2 + " + " + add + " = " + (h2 + add) + "，所以是 " + (h2 + add) + " 时。"],
          tip: "" };
      }
    },
    money: {
      name: "认识人民币", type: "单位换算", stage: "一年级 · 认识人民币",
      keys: ["人民币", "购物", "元角分"],
      gen: function () {
        var mode = ri(0, 2);
        if (mode === 0) return { q: "1 元 =（  ）角", a: "10", steps: ["人民币单位换算：1 元 = 10 角。"], tip: "元、角、分相邻两个单位之间的进率是 10。" };
        if (mode === 1) return { q: "1 角 =（  ）分", a: "10", steps: ["人民币单位换算：1 角 = 10 分。"], tip: "" };
        var price = ri(2, 9), pay = price + ri(1, 8);
        return { q: "买一本 " + price + " 元的本子，付 " + pay + " 元，应找回（  ）元", a: String(pay - price),
          steps: ["找回的钱 = 付的钱 − 物品的价钱。", pay + " − " + price + " = " + (pay - price) + "（元）。"],
          tip: "看清题目问的是「找回多少」，不是「一共多少」。" };
      }
    },
    compare: {
      name: "比较与分类", type: "概念判断", stage: "一年级 · 比较与分类",
      keys: ["比较", "分类", "分类与整理"],
      gen: function () {
        var t1 = ri(1, 9), t2 = ri(1, 9);
        while (t2 === t1) t2 = ri(1, 9);
        var a = t1 * 10 + ri(0, 9), b = t2 * 10 + ri(0, 9);
        var sym = a > b ? ">" : "<";
        return { q: "在 ○ 里填上 ＞ 、＜ 或 ＝ ：" + a + " ○ " + b, a: sym,
          accept: [sym, sym === ">" ? "＞" : "＜"],
          steps: ["两位数比大小，先比十位。", a + " 的十位是 " + t1 + "，" + b + " 的十位是 " + t2 + "，十位大的那个数就大。",
                  "所以 " + a + " " + sym + " " + b + "。"],
          tip: "十位不同就只看十位；十位相同才去比个位。" };
      }
    },

    /* ============ 二年级 ============ */
    add100: {
      name: "100 以内加减法", type: "计算题", stage: "二年级 · 100 以内加减法",
      keys: ["100 以内", "加与减", "加减"],
      gen: function () {
        if (Math.random() < 0.5) {
          var a = ri(23, 62), b = ri(11, Math.max(12, 98 - a)), s = a + b;
          return { q: a + " + " + b + " = （  ）", a: String(s),
            steps: ["把 " + b + " 拆成 " + Math.floor(b / 10) * 10 + " 和 " + (b % 10) + "。",
                    a + " + " + Math.floor(b / 10) * 10 + " = " + (a + Math.floor(b / 10) * 10) + "，再加 " + (b % 10) + " 得 " + s + "。"],
            tip: "竖式计算要相同数位对齐，个位相加满十要向十位进 1。" };
        }
        var c = ri(45, 99), d = ri(11, Math.min(c - 10, 60)), e = c - d;
        return { q: c + " − " + d + " = （  ）", a: String(e),
          steps: ["把 " + d + " 拆成 " + Math.floor(d / 10) * 10 + " 和 " + (d % 10) + "。",
                  c + " − " + Math.floor(d / 10) * 10 + " = " + (c - Math.floor(d / 10) * 10) + "，再减 " + (d % 10) + " 得 " + e + "。"],
          tip: "个位不够减时，要从十位退 1 当 10。" };
      }
    },
    mulTable: {
      name: "表内乘法", type: "计算题", stage: "二年级 · 乘法口诀",
      keys: ["乘法", "乘法口诀", "表内乘法", "数一数与乘法"],
      gen: function () {
        if (Math.random() < 0.6) {
          var a = ri(2, 9), b = ri(2, 9);
          return { q: a + " × " + b + " = （  ）", a: String(a * b),
            steps: ["想乘法口诀：" + (a < b ? a : b) + " 的口诀。", "所以 " + a + " × " + b + " = " + a * b + "。"],
            tip: "一句乘法口诀一般能算两道乘法算式。" };
        }
        var d = ri(2, 9), s = ri(2, 9);
        return { q: "（  ）× " + d + " = " + d * s, a: String(s),
          steps: ["想 " + d + " 的乘法口诀，几乘 " + d + " 得 " + d * s + "？", "所以方框里是 " + s + "。"],
          tip: "未知因数可以用积除以已知因数来想。" };
      }
    },
    divTable: {
      name: "表内除法", type: "计算题", stage: "二年级 · 表内除法",
      keys: ["除法", "分一分与除法", "表内除法"],
      gen: function () {
        if (Math.random() < 0.6) {
          var d = ri(2, 9), s = ri(2, 9);
          return { q: d * s + " ÷ " + d + " = （  ）", a: String(s),
            steps: ["想乘法算除法：几乘 " + d + " 得 " + d * s + "？", "所以商是 " + s + "。"],
            tip: "除法用乘法口诀来想最快。" };
        }
        var e = ri(2, 9), t = ri(2, 9);
        return { q: "（  ）÷ " + e + " = " + t, a: String(e * t),
          steps: ["被除数 = 商 × 除数。", t + " × " + e + " = " + e * t + "。"],
          tip: "没有余数的除法里：被除数 = 商 × 除数。" };
      }
    },
    length: {
      name: "长度单位", type: "单位换算", stage: "二年级 · 长度单位",
      keys: ["长度", "测量", "单位"],
      gen: function () {
        var mode = ri(0, 2);
        if (mode === 0) {
          var m = ri(2, 9);
          return { q: m + " 米 =（  ）厘米", a: String(m * 100),
            steps: ["1 米 = 100 厘米。", m + " 米就是 " + m + " 个 100 厘米，是 " + m * 100 + " 厘米。"],
            tip: "米和厘米之间的进率是 100。" };
        }
        if (mode === 1) {
          var cut = ri(10, 85);
          return { q: "1 米长的绳子，剪去 " + cut + " 厘米，还剩（  ）厘米", a: String(100 - cut),
            steps: ["先统一单位：1 米 = 100 厘米。", "100 − " + cut + " = " + (100 - cut) + "（厘米）。"],
            tip: "单位不一样时，要先化成相同单位再算。" };
        }
        return { q: "教室的门大约高 2（  ）（填「米」或「厘米」）", a: "米",
          accept: ["米", "m"],
          steps: ["1 厘米大约是一个手指甲的宽度，门不可能只有 2 厘米。", "门的高度用「米」作单位合适。"],
          tip: "填单位前先在脑子里比一比 1 厘米、1 米有多长。" };
      }
    },
    angle: {
      name: "角的初步认识", type: "图形几何", stage: "二年级 · 角的初步认识",
      keys: ["角", "角的初步认识"],
      gen: function () {
        return pick([
          { q: "一个角有（  ）个顶点", a: "1", steps: ["两条边相交的那个点就是顶点，只有一个。"], tip: "" },
          { q: "一个角有（  ）条边", a: "2", steps: ["角是从一个点引出两条直直的线。"], tip: "" },
          { q: "长方形有（  ）个直角", a: "4", steps: ["长方形四个角都是直角。"], tip: "正方形、长方形的四个角都是直角。" },
          { q: "比直角小的角叫（  ）角", a: "锐", accept: ["锐", "锐角"], steps: ["比直角小的是锐角，比直角大的是钝角。"], tip: "填一个字：锐。" },
          { q: "比直角大的角叫（  ）角", a: "钝", accept: ["钝", "钝角"], steps: ["比直角大的是钝角。"], tip: "填一个字：钝。" }
        ]);
      }
    },
    time2: {
      name: "认识时间", type: "单位换算", stage: "二年级 · 认识时间",
      keys: ["时间", "认识时间", "时分秒"],
      gen: function () {
        var mode = ri(0, 2);
        if (mode === 0) return { q: "1 时 =（  ）分", a: "60", steps: ["时针走 1 大格是 1 时，分针正好走一圈，是 60 分。"], tip: "时和分之间的进率是 60，不是 100。" };
        if (mode === 1) return { q: "1 分 =（  ）秒", a: "60", steps: ["分针走 1 小格是 1 分，秒针走一圈，是 60 秒。"], tip: "" };
        var m1 = ri(0, 40), add = ri(5, Math.max(6, 59 - m1));
        return { q: "从 9:" + pad2(m1) + " 到 9:" + pad2(m1 + add) + "，一共经过了（  ）分", a: String(add),
          steps: ["同一个小时内，经过时间 = 结束的分钟数 − 开始的分钟数。", (m1 + add) + " − " + m1 + " = " + add + "（分）。"],
          tip: "分和分相减，时和时相减。" };
      }
    },

    /* ============ 三年级 ============ */
    add10000: {
      name: "万以内加减法", type: "计算题", stage: "三年级 · 万以内加减法",
      keys: ["万以内", "万以内的加减法", "加减", "加与减"],
      gen: function () {
        if (Math.random() < 0.5) {
          var a = ri(120, 700), b = ri(110, Math.max(120, 985 - a)), s = a + b;
          return { q: a + " + " + b + " = （  ）", a: String(s),
            steps: ["相同数位对齐，从个位加起。", "哪一位相加满十，就向前一位进 1。", "算得 " + a + " + " + b + " = " + s + "。"],
            tip: "进位的小 1 别漏加，算完可以用「和 − 一个加数」验算。" };
        }
        var c = ri(400, 990), d = ri(110, Math.min(c - 100, 700)), e = c - d;
        return { q: c + " − " + d + " = （  ）", a: String(e),
          steps: ["相同数位对齐，从个位减起。", "哪一位不够减，就从前一位退 1 当 10 再减。", "算得 " + c + " − " + d + " = " + e + "。"],
          tip: "连续退位最容易错，算完用「差 + 减数」验算一遍。" };
      }
    },
    mul1d: {
      name: "多位数乘一位数", type: "计算题", stage: "三年级 · 多位数乘一位数",
      keys: ["多位数乘一位数", "乘法", "乘与除"],
      gen: function () {
        var a = ri(112, 320), b = ri(3, 9), s = a * b;
        var h = Math.floor(a / 100) * 100, t = Math.floor(a / 10) % 10 * 10, o = a % 10;
        return { q: a + " × " + b + " = （  ）", a: String(s),
          steps: ["把 " + a + " 拆成 " + h + " + " + t + " + " + o + "，分别去乘 " + b + "。",
                  h + " × " + b + " = " + h * b + "，" + t + " × " + b + " = " + t * b + "，" + o + " × " + b + " = " + o * b + "。",
                  h * b + " + " + t * b + " + " + o * b + " = " + s + "。"],
          tip: "哪一位乘得的积满几十，就向前一位进几。" };
      }
    },
    div1d: {
      name: "除数是一位数的除法", type: "计算题", stage: "三年级 · 除数是一位数的除法",
      keys: ["除法", "除与乘", "除数是一位数"],
      gen: function () {
        var d = ri(3, 9), s = ri(23, Math.floor(960 / d)), n = d * s;
        return { q: n + " ÷ " + d + " = （  ）", a: String(s),
          steps: ["从被除数的最高位除起，一位不够就看两位。", "想 " + d + " 的乘法口诀试商，除到哪一位商就写在那一位上面。",
                  "验算：" + s + " × " + d + " = " + n + "，正确。"],
          tip: "每次除得的余数一定要比除数小；算完用「商 × 除数」验算。" };
      }
    },
    fracIntro: {
      name: "分数的初步认识", type: "计算题", stage: "三年级 · 分数的初步认识",
      keys: ["分数初步", "分数的初步认识", "分数"],
      gen: function () {
        var mode = ri(0, 3);
        if (mode === 0) {
          var d = ri(3, 9), n1 = ri(1, d - 1), n2 = ri(1, Math.max(1, d - n1));
          var sum = n1 + n2;
          return { q: n1 + "/" + d + " + " + n2 + "/" + d + " = （  ）", a: frac(sum, d),
            accept: sum === d ? [frac(sum, d), "1"] : [frac(sum, d)],
            steps: ["分母相同，说明平均分的份数一样，分母不变。", "只把分子相加：" + n1 + " + " + n2 + " = " + sum + "。",
                    sum === d ? "分子和分母相同，就是 1 个整体。" : "结果是 " + frac(sum, d) + "。"],
            tip: "同分母分数相加减，分母不变，只把分子相加减。" };
        }
        if (mode === 1) {
          var d2 = ri(3, 9), a1 = ri(2, d2 - 1), a2 = ri(1, a1 - 1);
          return { q: a1 + "/" + d2 + " − " + a2 + "/" + d2 + " = （  ）", a: frac(a1 - a2, d2),
            steps: ["分母相同，分母不变，只把分子相减。", a1 + " − " + a2 + " = " + (a1 - a2) + "，结果是 " + frac(a1 - a2, d2) + "。"],
            tip: "" };
        }
        if (mode === 2) {
          var d3 = ri(3, 9), x = ri(1, d3 - 1), y = ri(1, d3 - 1);
          while (y === x) y = ri(1, d3 - 1);
          var sym = x > y ? "＞" : "＜";
          return { q: "在 ○ 里填 ＞ 或 ＜ ：" + x + "/" + d3 + " ○ " + y + "/" + d3, a: sym,
            accept: [sym, sym === "＞" ? ">" : "<"],
            steps: ["分母相同时，分子大的分数就大。", x + " " + (x > y ? "＞" : "＜") + " " + y + "，所以 " + x + "/" + d3 + " " + sym + " " + y + "/" + d3 + "。"],
            tip: "分子相同才反过来看：分子相同时，分母大的反而小。" };
        }
        var d4 = pick([4, 6, 8]), n4 = ri(1, d4 - 1);
        return { q: "把一个蛋糕平均分成 " + d4 + " 份，取其中的 " + n4 + " 份，用分数表示是（  ）",
          a: n4 + "/" + d4, accept: [n4 + "/" + d4, frac(n4, d4)],
          steps: ["平均分成 " + d4 + " 份，分母就是 " + d4 + "。", "取了 " + n4 + " 份，分子就是 " + n4 + "，是 " + n4 + "/" + d4 + "。"],
          tip: "「平均分」是分数的前提，没有平均分就不能用分数表示。" };
      }
    },
    decIntro: {
      name: "小数初步认识", type: "计算题", stage: "三年级 · 小数初步认识",
      keys: ["小数初步", "认识小数", "小数"],
      gen: function () {
        var mode = ri(0, 2);
        if (mode === 0) {
          var yuan = ri(1, 9), jiao = ri(1, 9);
          return { q: yuan + " 元 " + jiao + " 角 =（  ）元", a: money(yuan * 10 + jiao),
            steps: ["1 角 = 0.1 元，所以 " + jiao + " 角 = " + (jiao / 10).toFixed(1) + " 元。",
                    yuan + " 元 + " + (jiao / 10).toFixed(1) + " 元 = " + money(yuan * 10 + jiao) + " 元。"],
            tip: "元角分改写成小数：几元是整数部分，几角是十分位。" };
        }
        if (mode === 1) {
          var x = ri(3, 90), y = ri(3, Math.max(4, 99 - x));
          return { q: money(x) + " + " + money(y) + " = （  ）", a: money(x + y),
            steps: ["小数点对齐，也就是相同数位对齐。", "先按整数加法算：" + x + " + " + y + " = " + (x + y) + "（角）。",
                    "再点上小数点，得 " + money(x + y) + "。"],
            tip: "小数加减一定要先把小数点对齐。" };
        }
        var p = ri(12, 95);
        return { q: money(p) + " 元 =（  ）元（  ）角", a: Math.floor(p / 10) + " 元 " + (p % 10) + " 角",
          accept: [Math.floor(p / 10) + "元" + (p % 10) + "角", Math.floor(p / 10) + " 元 " + (p % 10) + " 角"],
          steps: ["小数点左边是元，小数点右边第一位是角。", "所以是 " + Math.floor(p / 10) + " 元 " + (p % 10) + " 角。"],
          tip: "" };
      }
    },
    area: {
      name: "周长与面积", type: "图形几何", stage: "三年级 · 长方形和正方形的周长、面积",
      keys: ["周长", "面积", "长方形", "正方形"],
      gen: function () {
        var mode = ri(0, 2);
        if (mode === 0) {
          var w = ri(4, 20), h = ri(2, 15);
          return { q: "一个长方形长 " + w + " 厘米，宽 " + h + " 厘米，它的周长是（  ）厘米", a: String(2 * (w + h)),
            steps: ["长方形周长 =（长 + 宽）× 2。", "（" + w + " + " + h + "）× 2 = " + (w + h) + " × 2 = " + 2 * (w + h) + "（厘米）。"],
            tip: "周长是四条边的总长，别只算两条边。" };
        }
        if (mode === 1) {
          var w2 = ri(4, 20), h2 = ri(2, 15);
          return { q: "一个长方形长 " + w2 + " 厘米，宽 " + h2 + " 厘米，它的面积是（  ）平方厘米", a: String(w2 * h2),
            steps: ["长方形面积 = 长 × 宽。", w2 + " × " + h2 + " = " + w2 * h2 + "（平方厘米）。"],
            tip: "周长用长度单位（厘米），面积用面积单位（平方厘米），别写混。" };
        }
        var s = ri(3, 15), askArea = Math.random() < 0.5;
        return askArea
          ? { q: "一个正方形边长 " + s + " 厘米，它的面积是（  ）平方厘米", a: String(s * s),
              steps: ["正方形面积 = 边长 × 边长。", s + " × " + s + " = " + s * s + "（平方厘米）。"], tip: "" }
          : { q: "一个正方形边长 " + s + " 厘米，它的周长是（  ）厘米", a: String(4 * s),
              steps: ["正方形周长 = 边长 × 4。", s + " × 4 = " + 4 * s + "（厘米）。"], tip: "" };
      }
    },
    date: {
      name: "年、月、日", type: "单位换算", stage: "三年级 · 年、月、日",
      keys: ["年月日", "年、月、日", "时分秒"],
      gen: function () {
        return pick([
          { q: "一年有（  ）个月", a: "12", steps: ["一年有 12 个月。"], tip: "" },
          { q: "大月有（  ）天", a: "31", steps: ["1、3、5、7、8、10、12 月是大月，每月 31 天。"], tip: "一三五七八十腊，三十一天永不差。" },
          { q: "小月有（  ）天", a: "30", steps: ["4、6、9、11 月是小月，每月 30 天。"], tip: "" },
          { q: "平年二月有（  ）天", a: "28", steps: ["平年二月 28 天，闰年二月 29 天。"], tip: "" },
          { q: "闰年二月有（  ）天", a: "29", steps: ["闰年二月比平年多 1 天，是 29 天。"], tip: "" },
          { q: "平年全年有（  ）天", a: "365", steps: ["平年 365 天，闰年 366 天。"], tip: "" },
          { q: "闰年全年有（  ）天", a: "366", steps: ["闰年二月多一天，全年 366 天。"], tip: "" },
          { q: "7 月和 8 月一共有（  ）天", a: "62", steps: ["7 月和 8 月都是大月，各 31 天。", "31 + 31 = 62（天）。"], tip: "连续的两个大月只有 7 月和 8 月。" }
        ]);
      }
    },

    /* ============ 四年级 ============ */
    bigNum: {
      name: "大数的认识", type: "概念判断", stage: "四年级 · 大数的认识",
      keys: ["大数", "更大的数", "大数的认识"],
      gen: function () {
        return pick([
          { q: "10 个一万是（  ）", a: "十万", accept: ["十万", "100000"], steps: ["每相邻两个计数单位之间的进率是 10。", "10 个一万就是十万。"], tip: "" },
          { q: "10 个十万是（  ）", a: "一百万", accept: ["一百万", "1000000", "百万"], steps: ["10 个十万是一百万。"], tip: "" },
          { q: "一亿里面有（  ）个一千万", a: "10", steps: ["一亿 = 10 个一千万。"], tip: "" },
          { q: "从个位起，第五位是（  ）位", a: "万", accept: ["万", "万位"], steps: ["个、十、百、千、万，第五位是万位。"], tip: "数位顺序要背熟：个十百千万，十万百万千万亿。" },
          { q: "一个数由 5 个亿和 3 个万组成，这个数是（  ）", a: "500030000", steps: ["5 个亿是 500000000，3 个万是 30000。", "500000000 + 30000 = 500030000。"], tip: "哪一位上一个单位也没有，就用 0 占位。" }
        ]);
      }
    },
    mul2d: {
      name: "三位数乘两位数", type: "计算题", stage: "四年级 · 三位数乘两位数",
      keys: ["三位数乘两位数", "乘法", "乘法运算"],
      gen: function () {
        var a = ri(112, 480), b = ri(12, 45), s = a * b;
        var t = Math.floor(b / 10) * 10, o = b % 10;
        return { q: a + " × " + b + " = （  ）", a: String(s),
          steps: ["把 " + b + " 拆成 " + t + " + " + o + "。",
                  a + " × " + t + " = " + a * t + "，" + a + " × " + o + " = " + a * o + "。",
                  a * t + " + " + a * o + " = " + s + "。"],
          tip: "用十位数去乘时，得数末位要对齐十位。" };
      }
    },
    div2d: {
      name: "除数是两位数的除法", type: "计算题", stage: "四年级 · 除数是两位数的除法",
      keys: ["除数是两位数", "除法"],
      gen: function () {
        var d = ri(12, 45), s = ri(11, Math.floor(9800 / d)), n = d * s;
        return { q: n + " ÷ " + d + " = （  ）", a: String(s),
          steps: ["把除数 " + d + " 看作接近的整十数 " + Math.round(d / 10) * 10 + " 来试商。",
                  "试商后算一算：商 × 除数不能超过被除数。", "验算：" + s + " × " + d + " = " + n + "。"],
          tip: "余数一定要比除数小；商大了就调小，商小了就调大。" };
      }
    },
    oplaw: {
      name: "运算定律与简便计算", type: "计算题", stage: "四年级 · 运算定律",
      keys: ["运算定律", "运算律", "简便"],
      gen: function () {
        return pick([
          { q: "25 × 32 × 4 = （  ）", a: "3200", steps: ["用乘法交换律先算 25 × 4。", "25 × 4 = 100，100 × 32 = 3200。"], tip: "看到 25 找 4，看到 125 找 8。" },
          { q: "125 × (80 + 8) = （  ）", a: "11000", steps: ["用乘法分配律：125 × 80 + 125 × 8。", "10000 + 1000 = 11000。"], tip: "括号里是整十整百加一个数时，用分配律最快。" },
          { q: "99 × 36 + 36 = （  ）", a: "3600", steps: ["99 个 36 加上 1 个 36，一共是 100 个 36。", "100 × 36 = 3600。"], tip: "单独的那个数可以看成「× 1」。" },
          { q: "4800 ÷ 25 ÷ 4 = （  ）", a: "48", steps: ["连续除以两个数，等于除以它们的积。", "4800 ÷ (25 × 4) = 4800 ÷ 100 = 48。"], tip: "a ÷ b ÷ c = a ÷ (b × c)。" },
          { q: "36 + 78 + 64 = （  ）", a: "178", steps: ["用加法交换律先凑整：36 + 64 = 100。", "100 + 78 = 178。"], tip: "先凑整十整百，计算又快又准。" },
          { q: "8 × (125 + 25) = （  ）", a: "1200", steps: ["8 × 125 + 8 × 25 = 1000 + 200。", "1000 + 200 = 1200。"], tip: "" }
        ]);
      }
    },
    decAdd: {
      name: "小数的加减法", type: "计算题", stage: "四年级 · 小数的意义和加减法",
      keys: ["小数", "加减"],
      gen: function () {
        var plus = Math.random() < 0.5;
        if (plus) {
          var x = ri(15, 900), y = ri(15, Math.max(20, 990 - x));
          return { q: money(x) + " + " + money(y) + " = （  ）", a: money(x + y),
            steps: ["小数点对齐，相同数位对齐。", "按整数加法算出 " + x + " + " + y + " = " + (x + y) + "。",
                    "在得数里点上小数点，得 " + money(x + y) + "。"],
            tip: "小数加减法最容易错在数位没对齐。" };
        }
        var p = ri(300, 990), q2 = ri(15, Math.min(p - 10, 500));
        return { q: money(p) + " − " + money(q2) + " = （  ）", a: money(p - q2),
          steps: ["小数点对齐，相同数位对齐。", "按整数减法算出 " + p + " − " + q2 + " = " + (p - q2) + "。",
                  "点上小数点，得 " + money(p - q2) + "。"],
          tip: "末尾是 0 时，小数末尾的 0 一般要去掉。" };
      }
    },
    tri: {
      name: "三角形与四边形", type: "图形几何", stage: "四年级 · 三角形、平行四边形和梯形",
      keys: ["三角形", "四边形", "平行四边形", "梯形", "角"],
      gen: function () {
        var mode = ri(0, 4);
        if (mode === 0) return { q: "三角形的内角和是（  ）度", a: "180", steps: ["三角形三个内角拼在一起正好是一个平角。", "平角是 180°，所以内角和是 180°。"], tip: "" };
        if (mode === 1) {
          var a1 = ri(30, 90), a2 = ri(20, Math.max(25, 160 - a1)), a3 = 180 - a1 - a2;
          return { q: "一个三角形中，∠1 = " + a1 + "°，∠2 = " + a2 + "°，∠3 = （  ）度", a: String(a3),
            steps: ["三角形内角和是 180°。", "180 − " + a1 + " − " + a2 + " = " + a3 + "（度）。"], tip: "" };
        }
        if (mode === 2) return { q: "平行四边形有（  ）组对边互相平行", a: "2", steps: ["平行四边形的两组对边分别平行且相等。"], tip: "" };
        if (mode === 3) {
          var sharp = ri(20, 70);
          return { q: "一个直角三角形的一个锐角是 " + sharp + "°，另一个锐角是（  ）度", a: String(90 - sharp),
            steps: ["直角三角形的两个锐角之和是 90°。", "90 − " + sharp + " = " + (90 - sharp) + "（度）。"], tip: "" };
        }
        return { q: "一个四边形的内角和是（  ）度", a: "360", steps: ["连接一条对角线，把四边形分成两个三角形。", "每个三角形内角和 180°，180 × 2 = 360°。"], tip: "" };
      }
    },

    /* ============ 五年级 ============ */
    decMulDiv: {
      name: "小数乘除法", type: "计算题", stage: "五年级 · 小数乘除法",
      keys: ["小数乘", "小数除", "小数"],
      gen: function () {
        if (Math.random() < 0.5) {
          var x = ri(12, 96) / 10, b = ri(2, 9);
          return { q: x.toFixed(1) + " × " + b + " = （  ）", a: num(x * b),
            steps: ["先按整数乘法算：" + Math.round(x * 10) + " × " + b + " = " + Math.round(x * 10) * b + "。",
                    "因数中一共有一位小数，就从积的右边起数出一位点上小数点。",
                    "得 " + num(x * b) + "。"],
            tip: "积的小数位数 = 两个因数小数位数之和。" };
        }
        var s = ri(3, 20), d = ri(12, 96) / 10, n = r2(s * d);
        return { q: n + " ÷ " + d.toFixed(1) + " = （  ）", a: String(s),
          steps: ["除数是小数，先把除数变成整数：" + d.toFixed(1) + " 扩大 10 倍变成 " + Math.round(d * 10) + "。",
                  "被除数也扩大 10 倍，变成 " + num(n * 10) + "。",
                  num(n * 10) + " ÷ " + Math.round(d * 10) + " = " + s + "。"],
          tip: "除数是小数时，先把除数变成整数，被除数同时扩大相同的倍数。" };
      }
    },
    equation: {
      name: "简易方程", type: "计算题", stage: "五年级 · 简易方程",
      keys: ["方程"],
      gen: function () {
        var mode = ri(0, 3);
        if (mode === 0) {
          var a = ri(5, 60), x = ri(2, 90), b = a + x;
          return { q: "解方程：x + " + a + " = " + b + "，x = （  ）", a: String(x),
            steps: ["等式两边同时减去 " + a + "。", "x = " + b + " − " + a + " = " + x + "。"],
            tip: "解方程要利用等式的性质，两边同时加、减、乘、除同一个数。" };
        }
        if (mode === 1) {
          var c = ri(5, 60), x1 = ri(2, 90), b1 = x1 - c;
          if (b1 <= 0) b1 = x1 + c;
          var val = b1 - c;
          return { q: "解方程：x − " + c + " = " + b1 + "，x = （  ）", a: String(val),
            steps: ["等式两边同时加上 " + c + "。", "x = " + b1 + " + " + c + " = " + val + "。"],
            tip: "解完可以代入原方程检验一下。" };
        }
        if (mode === 2) {
          var d = ri(2, 9), x2 = ri(3, 40), b2 = d * x2;
          return { q: "解方程：" + d + "x = " + b2 + "，x = （  ）", a: String(x2),
            steps: ["等式两边同时除以 " + d + "。", "x = " + b2 + " ÷ " + d + " = " + x2 + "。"], tip: "" };
        }
        var e = ri(2, 9), x3 = ri(2, 25), f = ri(2, 40), b3 = e * x3 + f;
        return { q: "解方程：" + e + "x + " + f + " = " + b3 + "，x = （  ）", a: String(x3),
          steps: ["先把 " + e + "x 看成一个整体，两边同时减 " + f + "：" + e + "x = " + (b3 - f) + "。",
                  "两边再同时除以 " + e + "：x = " + (b3 - f) + " ÷ " + e + " = " + x3 + "。"],
          tip: "两步方程先处理「加减去」，再处理「乘除」。" };
      }
    },
    factor: {
      name: "因数与倍数", type: "概念判断", stage: "五年级 · 因数与倍数",
      keys: ["因数", "倍数"],
      gen: function () {
        var mode = ri(0, 3);
        if (mode === 0) {
          var a = ri(6, 48), b = ri(6, 48), g = gcd(a, b);
          return { q: a + " 和 " + b + " 的最大公因数是（  ）", a: String(g),
            steps: ["分别列出两个数的因数，找最大的公共因数。", a + " 和 " + b + " 的最大公因数是 " + g + "。"],
            tip: "也可以用短除法，把公有的质因数连乘。" };
        }
        if (mode === 1) {
          var c = ri(3, 20), d = ri(3, 20), l = lcm(c, d);
          return { q: c + " 和 " + d + " 的最小公倍数是（  ）", a: String(l),
            steps: ["最小公倍数 = 两数的积 ÷ 最大公因数。", c + " × " + d + " ÷ " + gcd(c, d) + " = " + l + "。"],
            tip: "两个数是互质数时，最小公倍数就是它们的积。" };
        }
        if (mode === 2) {
          var k = ri(2, 12), m3 = ri(2, 8), good = m3 * 3, bad1 = good + 1, bad2 = good + 2;
          var opts = [good, bad1, bad2]; opts.sort(function () { return Math.random() - 0.5; });
          return { q: "下面三个数中，是 3 的倍数的是（  ）：" + opts.join("、"), a: String(good),
            steps: ["3 的倍数特征：各位上数字之和是 3 的倍数。", good + " 的数字和是 " + String(good).split("").reduce(function (s, ch) { return s + Number(ch); }, 0) + "，是 3 的倍数。"],
            tip: "看各位数字之和，比直接除快得多。" };
        }
        var n4 = ri(4, 40), cnt = 0;
        for (var i = 1; i <= n4; i++) if (n4 % i === 0) cnt++;
        return { q: n4 + " 一共有（  ）个因数", a: String(cnt),
          steps: ["一对一对地找：1 × " + n4 + "，2 × ……", "数一数，" + n4 + " 一共有 " + cnt + " 个因数。"],
          tip: "找一个数的因数要一对一对地找，才不容易漏。" };
      }
    },
    fracAddSub: {
      name: "分数加减法", type: "计算题", stage: "五年级 · 分数加减法",
      keys: ["分数加减", "分数的加减法", "分数的意义和性质", "分数"],
      gen: function () {
        var pool = [2, 3, 4, 5, 6, 8, 10];
        var d1 = pick(pool), d2 = pick(pool);
        while (d2 === d1) d2 = pick(pool);
        var n1 = ri(1, d1 - 1), n2 = ri(1, d2 - 1);
        var plus = Math.random() < 0.5;
        var vn = plus ? n1 * d2 + n2 * d1 : n1 * d2 - n2 * d1;
        if (!plus && vn <= 0) { plus = true; vn = n1 * d2 + n2 * d1; }
        var cd = d1 * d2;
        return { q: n1 + "/" + d1 + (plus ? " + " : " − ") + n2 + "/" + d2 + " = （  ）", a: frac(vn, cd),
          steps: ["分母不同，要先通分，公分母取 " + d1 + " 和 " + d2 + " 的公倍数 " + cd + "。",
                  n1 + "/" + d1 + " = " + n1 * d2 + "/" + cd + "，" + n2 + "/" + d2 + " = " + n2 * d1 + "/" + cd + "。",
                  (plus ? n1 * d2 + " + " + n2 * d1 : n1 * d2 + " − " + n2 * d1) + " = " + vn + "，得 " + vn + "/" + cd + "。",
                  "约成最简分数：" + frac(vn, cd) + "。"],
          tip: "结果不是最简分数的，一定要约分；假分数通常要化成带分数。" };
      }
    },
    polyArea: {
      name: "多边形的面积", type: "图形几何", stage: "五年级 · 多边形的面积",
      keys: ["多边形面积", "组合图形的面积", "面积", "图形"],
      gen: function () {
        var mode = ri(0, 2);
        if (mode === 0) {
          var b = ri(4, 20), h = ri(3, 15);
          return { q: "一个平行四边形底 " + b + " 厘米，高 " + h + " 厘米，面积是（  ）平方厘米", a: String(b * h),
            steps: ["平行四边形面积 = 底 × 高。", b + " × " + h + " = " + b * h + "（平方厘米）。"],
            tip: "高必须是与底对应的那条高，不能用斜边当高。" };
        }
        if (mode === 1) {
          var b2 = ri(4, 20), h2 = ri(3, 15), s2v = b2 * h2 / 2;
          return { q: "一个三角形底 " + b2 + " 厘米，高 " + h2 + " 厘米，面积是（  ）平方厘米", a: num(s2v),
            steps: ["三角形面积 = 底 × 高 ÷ 2。", b2 + " × " + h2 + " ÷ 2 = " + num(s2v) + "（平方厘米）。"],
            tip: "三角形的面积要「÷ 2」，别忘掉这一半。" };
        }
        var a3 = ri(3, 12), b3 = ri(5, 18), h3 = ri(3, 12) * 2;
        return { q: "一个梯形上底 " + a3 + " 厘米，下底 " + b3 + " 厘米，高 " + h3 + " 厘米，面积是（  ）平方厘米",
          a: String((a3 + b3) * h3 / 2),
          steps: ["梯形面积 =（上底 + 下底）× 高 ÷ 2。", "（" + a3 + " + " + b3 + "）× " + h3 + " ÷ 2 = " + (a3 + b3) * h3 / 2 + "（平方厘米）。"],
          tip: "" };
      }
    },
    cuboid: {
      name: "长方体和正方体", type: "图形几何", stage: "五年级 · 长方体和正方体",
      keys: ["长方体", "正方体"],
      gen: function () {
        var mode = ri(0, 3);
        if (mode === 0) {
          var a = ri(2, 12), b = ri(2, 10), c = ri(2, 9);
          return { q: "一个长方体长 " + a + " 厘米、宽 " + b + " 厘米、高 " + c + " 厘米，体积是（  ）立方厘米", a: String(a * b * c),
            steps: ["长方体体积 = 长 × 宽 × 高。", a + " × " + b + " × " + c + " = " + a * b * c + "（立方厘米）。"],
            tip: "体积用立方单位，表面积用平方单位，别写反。" };
        }
        if (mode === 1) {
          var a2 = ri(2, 9), b2 = ri(2, 8), c2 = ri(2, 7);
          var surf = 2 * (a2 * b2 + a2 * c2 + b2 * c2);
          return { q: "一个长方体长 " + a2 + " 厘米、宽 " + b2 + " 厘米、高 " + c2 + " 厘米，表面积是（  ）平方厘米", a: String(surf),
            steps: ["长方体表面积 =（长×宽 + 长×高 + 宽×高）× 2。",
                    a2 + "×" + b2 + " = " + a2 * b2 + "，" + a2 + "×" + c2 + " = " + a2 * c2 + "，" + b2 + "×" + c2 + " = " + b2 * c2 + "。",
                    "（" + a2 * b2 + " + " + a2 * c2 + " + " + b2 * c2 + "）× 2 = " + surf + "（平方厘米）。"],
            tip: "长方体有 6 个面，相对的两个面完全相同。" };
        }
        if (mode === 2) {
          var s = ri(2, 9);
          return { q: "一个正方体棱长 " + s + " 厘米，体积是（  ）立方厘米", a: String(s * s * s),
            steps: ["正方体体积 = 棱长 × 棱长 × 棱长。", s + " × " + s + " × " + s + " = " + s * s * s + "（立方厘米）。"], tip: "" };
        }
        var s2 = ri(2, 9);
        return { q: "一个正方体棱长 " + s2 + " 厘米，表面积是（  ）平方厘米", a: String(6 * s2 * s2),
          steps: ["正方体 6 个面完全相同，每个面面积是 棱长 × 棱长。", "6 × " + s2 + " × " + s2 + " = " + 6 * s2 * s2 + "（平方厘米）。"], tip: "" };
      }
    },

    /* ============ 六年级 ============ */
    fracMulDiv: {
      name: "分数乘除法", type: "计算题", stage: "六年级 · 分数乘除法",
      keys: ["分数乘", "分数除", "分数混合运算", "分数"],
      gen: function () {
        var mode = ri(0, 3);
        if (mode === 0) {
          var d1 = ri(3, 9), d2 = ri(3, 9), n1 = ri(1, d1 - 1), n2 = ri(1, d2 - 1);
          return { q: n1 + "/" + d1 + " × " + n2 + "/" + d2 + " = （  ）", a: frac(n1 * n2, d1 * d2),
            steps: ["分数乘分数：分子相乘作分子，分母相乘作分母。",
                    n1 + " × " + n2 + " = " + n1 * n2 + "，" + d1 + " × " + d2 + " = " + d1 * d2 + "。",
                    "约成最简分数：" + frac(n1 * n2, d1 * d2) + "。"],
            tip: "能约分的先约分再乘，算起来更省力。" };
        }
        if (mode === 1) {
          var e1 = ri(3, 9), e2 = ri(3, 9), f1 = ri(1, e1 - 1), f2 = ri(1, e2 - 1);
          return { q: f1 + "/" + e1 + " ÷ " + f2 + "/" + e2 + " = （  ）", a: frac(f1 * e2, e1 * f2),
            steps: ["除以一个不为 0 的数，等于乘这个数的倒数。",
                    f1 + "/" + e1 + " ÷ " + f2 + "/" + e2 + " = " + f1 + "/" + e1 + " × " + e2 + "/" + f2 + "。",
                    "＝ " + frac(f1 * e2, e1 * f2) + "。"],
            tip: "除法变乘法时：被除数不变，除数要「翻转」。" };
        }
        if (mode === 2) {
          var g1 = ri(3, 9), k = ri(2, 9), g2 = ri(1, g1 - 1);
          return { q: g2 + "/" + g1 + " × " + k + " = （  ）", a: frac(g2 * k, g1),
            steps: ["整数可以看作分母是 1 的分数。", g2 + "/" + g1 + " × " + k + "/1 = " + g2 * k + "/" + g1 + "。",
                    "约分得 " + frac(g2 * k, g1) + "。"],
            tip: "分数乘整数，只把分子和整数相乘，分母不变。" };
        }
        var p = ri(2, 9), q1 = ri(2, 9), base = ri(4, 20) * p;
        return { q: "一个数的 " + p + "/" + q1 + " 是 " + base + "，这个数是（  ）", a: frac(base * q1, p),
          steps: ["单位「1」未知，用除法：对应量 ÷ 对应分率 = 单位「1」。",
                  base + " ÷ " + p + "/" + q1 + " = " + base + " × " + q1 + "/" + p + " = " + frac(base * q1, p) + "。"],
          tip: "求单位「1」用除法，求单位「1」的几分之几用乘法。" };
      }
    },
    ratio: {
      name: "比与比例", type: "应用题", stage: "六年级 · 比与比例",
      keys: ["比", "比例"],
      gen: function () {
        var mode = ri(0, 3);
        if (mode === 0) {
          var a = ri(6, 48), b = ri(6, 48), g = gcd(a, b);
          return { q: "化成最简单的整数比：" + a + " : " + b + " = （  ）", a: (a / g) + ":" + (b / g),
            accept: [(a / g) + ":" + (b / g), (a / g) + "：" + (b / g), (a / g) + "比" + (b / g)],
            steps: ["比的前项和后项同时除以它们的最大公因数 " + g + "。",
                    a + " ÷ " + g + " = " + a / g + "，" + b + " ÷ " + g + " = " + b / g + "。",
                    "最简单的整数比是 " + a / g + " : " + b / g + "。"],
            tip: "化简比的结果仍然是一个比，不能写成一个数。" };
        }
        if (mode === 1) {
          var d = ri(2, 9), v = ri(2, 12), a2 = d * v;
          return { q: "求比值：" + a2 + " : " + d + " = （  ）", a: String(v),
            steps: ["比值 = 前项 ÷ 后项。", a2 + " ÷ " + d + " = " + v + "。"],
            tip: "比值是一个数（整数、分数或小数），化简比的结果才是比。" };
        }
        if (mode === 2) {
          var p = ri(2, 7), q2 = ri(2, 7), unit = ri(3, 20);
          if (p === q2) q2 = p + 1;
          return { q: "把 " + (p + q2) * unit + " 按 " + p + " : " + q2 + " 分配，两份分别是（  ）和（  ）",
            a: p * unit + " 和 " + q2 * unit,
            accept: [p * unit + "和" + q2 * unit, p * unit + "、" + q2 * unit, p * unit + "," + q2 * unit],
            steps: ["先求总份数：" + p + " + " + q2 + " = " + (p + q2) + " 份。",
                    "每份是 " + (p + q2) * unit + " ÷ " + (p + q2) + " = " + unit + "。",
                    "两份分别是 " + p + " × " + unit + " = " + p * unit + " 和 " + q2 + " × " + unit + " = " + q2 * unit + "。"],
            tip: "按比分配先求「一份是多少」。" };
        }
        return { q: "总价一定时，单价和数量成（  ）比例（填「正」或「反」）", a: "反",
          accept: ["反", "反比例"],
          steps: ["单价 × 数量 = 总价（一定）。", "两种相关联的量乘积一定，它们成反比例。"],
          tip: "商一定成正比例，积一定成反比例。" };
      }
    },
    circle: {
      name: "圆", type: "图形几何", stage: "六年级 · 圆",
      keys: ["圆"],
      gen: function () {
        var r = ri(1, 10), mode = ri(0, 2);
        if (mode === 0) {
          return { q: "一个圆半径 " + r + " 厘米，它的周长是（  ）厘米（π 取 3.14）", a: num(2 * PI * r),
            steps: ["圆的周长 C = 2πr。", "2 × 3.14 × " + r + " = " + num(2 * PI * r) + "（厘米）。"],
            tip: "看清给的是半径还是直径，别把直径当半径代进去。" };
        }
        if (mode === 1) {
          return { q: "一个圆半径 " + r + " 厘米，它的面积是（  ）平方厘米（π 取 3.14）", a: num(PI * r * r),
            steps: ["圆的面积 S = πr²。", "3.14 × " + r + " × " + r + " = 3.14 × " + r * r + " = " + num(PI * r * r) + "（平方厘米）。"],
            tip: "r² 是 r × r，不是 r × 2。" };
        }
        var d = ri(2, 20);
        return { q: "一个圆直径 " + d + " 厘米，它的周长是（  ）厘米（π 取 3.14）", a: num(PI * d),
          steps: ["已知直径，用 C = πd。", "3.14 × " + d + " = " + num(PI * d) + "（厘米）。"], tip: "" };
      }
    },
    percent: {
      name: "百分数", type: "应用题", stage: "六年级 · 百分数",
      keys: ["百分数", "百分数的应用"],
      gen: function () {
        var mode = ri(0, 4);
        if (mode === 0) {
          var total = pick([20, 25, 40, 50, 80]), part = ri(1, Math.floor(total / 2));
          while ((part * 100) % total !== 0) part = ri(1, Math.floor(total / 2));
          return { q: "全班 " + total + " 人，男生 " + part + " 人，男生占全班的（  ）%", a: String(Math.round(part * 100 / total)),
            steps: ["求一个数是另一个数的百分之几，用除法。",
                    part + " ÷ " + total + " = " + (part / total) + " = " + Math.round(part * 100 / total) + "%。"],
            tip: "百分号前一般保留整数或一位小数，别漏写 %。" };
        }
        if (mode === 1) {
          var price = ri(2, 20) * 10;
          return { q: "一件衣服原价 " + price + " 元，打八折后是（  ）元", a: num(price * 0.8),
            steps: ["八折就是原价的 80%。", price + " × 80% = " + num(price * 0.8) + "（元）。"],
            tip: "几折就是十分之几，也就是百分之几十。" };
        }
        if (mode === 2) {
          var base = ri(2, 20) * 4;
          return { q: "比 " + base + " 多 25% 的数是（  ）", a: String(base * 1.25),
            steps: ["比 " + base + " 多 25%，就是 " + base + " 的（1 + 25%）= 125%。",
                    base + " × 125% = " + base * 1.25 + "。"],
            tip: "看清单位「1」是谁，多百分之几就用 1 加，少百分之几就用 1 减。" };
        }
        if (mode === 3) {
          var base2 = ri(2, 20) * 20;
          return { q: base2 + " 的 15% 是（  ）", a: String(base2 * 0.15),
            steps: ["求一个数的百分之几是多少，用乘法。", base2 + " × 15% = " + base2 * 0.15 + "。"],
            tip: "" };
        }
        var pair = pick([[40, 50, 25], [80, 100, 25], [20, 25, 25], [50, 60, 20], [30, 40, 25], [60, 80, 25]]);
        return { q: pair[1] + " 比 " + pair[0] + " 多（  ）%", a: String(pair[2]),
          steps: ["先求多的部分：" + pair[1] + " − " + pair[0] + " = " + (pair[1] - pair[0]) + "。",
                  "再除以单位「1」（比字后面的量 " + pair[0] + "）：" + (pair[1] - pair[0]) + " ÷ " + pair[0] + " = " + pair[2] / 100 + " = " + pair[2] + "%。"],
          tip: "「比」字后面的量就是单位「1」，要除以它。" };
      }
    },
    cylinder: {
      name: "圆柱与圆锥", type: "图形几何", stage: "六年级 · 圆柱与圆锥",
      keys: ["圆柱", "圆锥"],
      gen: function () {
        var r = ri(1, 10), h = ri(2, 20), mode = ri(0, 2);
        if (mode === 0) {
          return { q: "一个圆柱底面半径 " + r + " 厘米，高 " + h + " 厘米，它的侧面积是（  ）平方厘米（π 取 3.14）",
            a: num(2 * PI * r * h),
            steps: ["圆柱侧面积 = 底面周长 × 高 = 2πrh。",
                    "2 × 3.14 × " + r + " × " + h + " = " + num(2 * PI * r * h) + "（平方厘米）。"],
            tip: "侧面积只是侧面一圈，不算上下两个底面。" };
        }
        if (mode === 1) {
          return { q: "一个圆柱底面半径 " + r + " 厘米，高 " + h + " 厘米，它的体积是（  ）立方厘米（π 取 3.14）",
            a: num(PI * r * r * h),
            steps: ["圆柱体积 = 底面积 × 高 = πr²h。",
                    "3.14 × " + r + " × " + r + " × " + h + " = " + num(PI * r * r * h) + "（立方厘米）。"],
            tip: "" };
        }
        var r2 = ri(1, 9), h2 = ri(3, 18) * 2;
        return { q: "一个圆锥底面半径 " + r2 + " 厘米，高 " + h2 + " 厘米，它的体积是（  ）立方厘米（π 取 3.14）",
          a: num(PI * r2 * r2 * h2 / 3),
          steps: ["圆锥体积 = 1/3 × 底面积 × 高 = 1/3 πr²h。",
                  "1/3 × 3.14 × " + r2 + " × " + r2 + " × " + h2 + " = " + num(PI * r2 * r2 * h2 / 3) + "（立方厘米）。"],
          tip: "圆锥体积一定要乘 1/3，等底等高的圆锥是圆柱体积的三分之一。" };
      }
    },
    statistic: {
      name: "统计与概率", type: "概念判断", stage: "六年级 · 统计与概率",
      keys: ["统计", "概率", "数据处理", "扇形", "可能性"],
      gen: function () {
        var mode = ri(0, 3);
        if (mode === 0) {
          var avg = ri(5, 40), off1 = ri(-6, 6), off2 = ri(-6, 6), off3 = -(off1 + off2);
          var arr = [avg + off1, avg + off2, avg + off3, avg];
          arr.sort(function () { return Math.random() - 0.5; });
          return { q: "一组数据 " + arr.join("、") + " 的平均数是（  ）", a: String(avg),
            steps: ["平均数 = 总和 ÷ 个数。",
                    "总和 = " + arr.join(" + ") + " = " + arr.reduce(function (s, v) { return s + v; }, 0) + "。",
                    arr.reduce(function (s, v) { return s + v; }, 0) + " ÷ 4 = " + avg + "。"],
            tip: "平均数容易被极端值影响，要看清给的是几个数。" };
        }
        if (mode === 1) {
          var c = ri(3, 9) * 2, d = ri(1, c - 1);
          return { q: "六（1）班男生 " + c + " 人，女生 " + d + " 人，男生占全班的（  ）%",
            a: num(c * 100 / (c + d)),
            steps: ["全班 " + c + " + " + d + " = " + (c + d) + " 人。",
                    c + " ÷ " + (c + d) + " ≈ " + num(c * 100 / (c + d)) + "%。"],
            tip: "" };
        }
        if (mode === 2) {
          var pct = pick([10, 20, 25, 30, 40, 50, 60, 75]);
          return { q: "扇形统计图中，占总数 " + pct + "% 的那一项，圆心角是（  ）度", a: String(pct * 3.6),
            steps: ["整个圆是 360°，对应 100%。", "360 × " + pct + "% = " + pct * 3.6 + "（度）。"],
            tip: "圆心角 = 360° × 该项所占的百分比。" };
        }
        return { q: "抛一枚硬币，正面朝上的可能性是（  ）（填分数）", a: "1/2",
          accept: ["1/2", "0.5", "50%"],
          steps: ["抛硬币只有正面、反面两种等可能的结果。", "正面朝上占其中的 1 种，是 1/2。"],
          tip: "可能性可以用分数表示，也可以用百分数表示。" };
      }
    }
  };

  /* 每个年级可以出哪些话题（严格按学习阶段） */
  var GRADE_TOPICS = {
    1: ["add20", "num100", "shape1", "clock", "money", "compare"],
    2: ["add100", "mulTable", "divTable", "length", "angle", "time2"],
    3: ["add10000", "mul1d", "div1d", "fracIntro", "decIntro", "area", "date"],
    4: ["bigNum", "mul2d", "div2d", "oplaw", "decAdd", "tri"],
    5: ["decMulDiv", "equation", "factor", "fracAddSub", "polyArea", "cuboid"],
    6: ["fracMulDiv", "ratio", "circle", "percent", "cylinder", "statistic"]
  };

  function topicMatches(topic, kp) {
    return (topic.keys || []).some(function (key) { return String(kp).indexOf(key) >= 0; });
  }

  // 教材里的知识点名 → 话题；先在本年级话题里找，找不到再全表找
  function topicForKp(kp, grade) {
    if (!kp) return null;
    var inGrade = (GRADE_TOPICS[grade] || []).filter(function (id) { return topicMatches(TOPICS[id], kp); });
    if (inGrade.length) return inGrade[0];
    var ids = Object.keys(TOPICS).filter(function (id) { return topicMatches(TOPICS[id], kp); });
    return ids.length ? ids[0] : null;
  }

  function generate(topicId) {
    var topic = TOPICS[topicId];
    if (!topic || typeof topic.gen !== "function") return null;
    var item = topic.gen();
    if (!item || !item.q) return null;
    return {
      topic: topicId,
      topicName: topic.name,
      stage: topic.stage,
      type: topic.type,
      q: item.q,
      a: String(item.a),
      accept: item.accept && item.accept.length ? item.accept.map(String) : [String(item.a)],
      steps: (item.steps || []).slice(),
      tip: item.tip || ""
    };
  }

  /* 出一套题：优先贴合传入的知识点，否则按年级随机 */
  function makeSet(options) {
    var opts = options || {};
    var grade = Number(opts.grade) || 1;
    var count = Math.max(1, Number(opts.count) || 5);
    var kp = opts.kp || "";
    var pool = GRADE_TOPICS[grade] || GRADE_TOPICS[1];
    var forced = topicForKp(kp, grade);
    var out = [];
    var seen = Object.create(null);
    var tries = 0;
    while (out.length < count && tries < count * 40) {
      tries += 1;
      var id = forced || pick(pool);
      var item = generate(id);
      if (!item) continue;
      if (seen[item.q]) continue;
      seen[item.q] = 1;
      item.kp = kp || item.topicName;
      out.push(item);
    }
    return out;
  }

  /* 答案归一化：全角转半角、去空格、去尾部的常见单位 */
  var UNIT_TAIL = /(个|只|颗|支|枝|本|朵|张|块|条|面|棵|台|辆|人|元|角|分|米|厘米|分米|毫米|千米|克|千克|吨|秒|时|小时|分钟|度|°|%|％|平方厘米|平方米|立方厘米|立方米)$/;
  function normalizeAnswer(value) {
    var s = String(value == null ? "" : value);
    s = s.replace(/[\uFF01-\uFF5E]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); });
    s = s.replace(/\u3000/g, " ").replace(/\s+/g, "");
    var trimmed = s;
    for (var i = 0; i < 4; i += 1) {
      var next = trimmed.replace(UNIT_TAIL, "");
      if (next === trimmed || next === "") break;
      trimmed = next;
    }
    // 答案本身就是单位（比如填「米」）时别把它削没了
    if (trimmed === "") trimmed = s;
    return trimmed.replace(/^[，,、。.]+|[，,、。.]+$/g, "");
  }

  function toNumber(s) {
    if (!s) return NaN;
    if (/^-?\d+\/\d+$/.test(s)) {
      var parts = s.split("/");
      var den = Number(parts[1]);
      return den === 0 ? NaN : Number(parts[0]) / den;
    }
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
    return NaN;
  }

  function checkAnswer(input, problem) {
    if (!problem) return false;
    var got = normalizeAnswer(input);
    if (!got) return false;
    var accepts = (problem.accept || [problem.a]).map(normalizeAnswer);
    if (accepts.indexOf(got) >= 0) return true;
    var num = toNumber(got);
    if (!isNaN(num)) {
      for (var i = 0; i < accepts.length; i += 1) {
        var target = toNumber(accepts[i]);
        if (!isNaN(target) && Math.abs(num - target) < 1e-6) return true;
      }
    }
    return false;
  }

  global.MathProblemBank = {
    TOPICS: TOPICS,
    GRADE_TOPICS: GRADE_TOPICS,
    topicForKp: topicForKp,
    generate: generate,
    makeSet: makeSet,
    normalizeAnswer: normalizeAnswer,
    checkAnswer: checkAnswer
  };
})(__bank_host);
module.exports = __bank_host.MathProblemBank;
