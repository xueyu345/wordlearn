/* 错题试卷：把数学错题本 + 英语错词本汇总成一张卷子
 * 规则与网页版 index.html 的「错题试卷」保持一致：
 *   数学：未掌握优先 → 错得多的靠前 → 最近更新的靠前
 *   英语：错词次数多的靠前
 * 试卷只在内存里，不写进学习档案；判完分才把结果回写进错题本。
 */
const store = require('./store.js');
const U = require('./util.js');
const BANK = require('./math-problems.js');

const CN_NUM = ['一', '二'];
const ANSWER_SPLIT = /[；;，,、\/|]+/;

function defaultTitle() {
  const now = new Date();
  return '错题过关卷（' + (now.getMonth() + 1) + '-' + now.getDate() + '）';
}

/* ---------- 选题 ---------- */
function mathPool(scope, kp) {
  return (store.mathState().items || []).filter(function (item) {
    if (scope === 'todo' && item.done) return false;
    if (scope === 'done' && !item.done) return false;
    if (kp && (item.kp || '未分类') !== kp) return false;
    return true;
  }).slice().sort(function (a, b) {
    if (Boolean(a.done) !== Boolean(b.done)) return a.done ? 1 : -1;
    const diff = (Number(b.wrongCount) || 1) - (Number(a.wrongCount) || 1);
    if (diff !== 0) return diff;
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });
}

function enPool() {
  const learned = store.state().learned || {};
  return (store.state().wrong || [])
    .map(function (id) { return store.wordById(id); })
    .filter(Boolean)
    .slice()
    .sort(function (a, b) {
      const ra = learned[a.id] || {};
      const rb = learned[b.id] || {};
      return (rb.wrong || 0) - (ra.wrong || 0);
    });
}

// count 为 0 表示「全部」
function take(list, count) {
  const limit = Number(count) || 0;
  if (!limit || limit >= list.length) return list.slice();
  return list.slice(0, limit);
}

/* ---------- 答案比对 ---------- */
// 全角转半角 + 去空白 + 去中英文标点 + 统一小写
function norm(value) {
  return String(value == null ? '' : value)
    .replace(/[\uFF01-\uFF5E]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
    .replace(/\s+/g, '')
    .replace(/[。，、！？；：""''（）()]/g, '')
    .toLowerCase();
}

// 中文释义：标准答案可能写了好几种说法，命中任意一种就算对
function zhMatch(input, answer) {
  const got = norm(input);
  if (!got) return false;
  return String(answer || '').split(ANSWER_SPLIT).some(function (one) {
    const std = norm(one);
    if (!std) return false;
    return std === got || std.indexOf(got) >= 0 || got.indexOf(std) >= 0;
  });
}

// 数学答案：优先用题库的宽松判定（分数、小数、带单位都算对）
function mathMatch(input, answer) {
  const value = String(input || '').trim();
  if (!value || !answer) return false;
  try {
    if (BANK.checkAnswer(value, { a: answer })) return true;
  } catch (e) { /* 题库不可用时退回本地判定 */ }
  const got = norm(value);
  const std = norm(answer);
  if (!got || !std) return false;
  if (got === std) return true;
  const na = Number(got);
  const nb = Number(std);
  return !isNaN(na) && !isNaN(nb) && Math.abs(na - nb) < 1e-6;
}

function judge(item, input) {
  if (item.kind === 'math') return mathMatch(input, item.answer);
  return item.mode === 'zh2en'
    ? norm(input) === norm(item.answer)
    : zhMatch(input, item.answer);
}

/* ---------- 组卷 ---------- */
function build(options) {
  const opts = options || {};
  const sections = [];

  if (opts.useMath) {
    const picked = take(mathPool(opts.mathScope, opts.mathKp), opts.mathCount);
    if (picked.length) {
      sections.push({
        title: '数学错题重现',
        note: '把当时做错的题再做一遍，写清过程和答案。',
        items: picked.map(function (item) {
          return {
            kind: 'math',
            refId: item.id,
            stem: item.q || '',
            tag: [item.kp || '未分类', item.type].filter(Boolean).join(' · '),
            tip: '',
            images: (item.images || []).slice(0, 3),
            answer: item.a || '',
            gradable: Boolean(item.a),
            userAnswer: '',
            ok: null
          };
        })
      });
    }
  }

  if (opts.useEn) {
    const mode = opts.enMode || 'zh2en';
    const picked = take(enPool(), opts.enCount);
    if (picked.length) {
      sections.push({
        title: '英语错词过关',
        note: mode === 'mix' ? '一半看中文写单词，一半看单词写意思。' : '看提示写出来，写完点交卷自动判分。',
        items: picked.map(function (word, index) {
          // 混合模式交替出题，保证两种题型各占一半
          const kind = mode === 'mix' ? (index % 2 === 0 ? 'zh2en' : 'en2zh') : mode;
          return {
            kind: 'en',
            mode: kind,
            refId: word.id,
            stem: kind === 'zh2en' ? (word.zh || '') : (word.w || ''),
            tag: (kind === 'zh2en' ? '中译英' : '英译中') + (word.ipa ? ' · ' + word.ipa : ''),
            tip: word.ipa || '',
            images: [],
            answer: kind === 'zh2en' ? (word.w || '') : (word.zh || ''),
            gradable: true,
            userAnswer: '',
            ok: null
          };
        })
      });
    }
  }

  if (!sections.length) return null;

  const total = sections.reduce(function (sum, sec) { return sum + sec.items.length; }, 0);
  return {
    title: (opts.title || '').trim() || defaultTitle(),
    sections: sections.map(function (sec, index) {
      return {
        title: (CN_NUM[index] || (index + 1)) + '、' + sec.title,
        note: sec.note,
        items: sec.items
      };
    }),
    total: total,
    graded: false,
    judged: 0,
    right: 0,
    wrong: 0,
    createdAt: Date.now()
  };
}

function flat(paper) {
  if (!paper) return [];
  return paper.sections.reduce(function (list, sec) { return list.concat(sec.items); }, []);
}

/* ---------- 交卷 ---------- */
// 返回 { judged, right, wrong, blank }；item.ok 为 null 表示这道题当时没记正确答案、不参与判分
function grade(paper) {
  let right = 0;
  let wrong = 0;
  let judged = 0;
  let blank = 0;
  flat(paper).forEach(function (item) {
    item.userAnswer = String(item.userAnswer || '').trim();
    if (!item.gradable) { item.ok = null; return; }
    if (!item.userAnswer) {
      item.ok = false;
      blank += 1;
      wrong += 1;
      judged += 1;
      return;
    }
    item.ok = judge(item, item.userAnswer);
    judged += 1;
    if (item.ok) right += 1; else wrong += 1;
  });
  paper.graded = true;
  paper.judged = judged;
  paper.right = right;
  paper.wrong = wrong;
  return { judged: judged, right: right, wrong: wrong, blank: blank };
}

/* ---------- 回写错题本 ---------- */
// 数学：答对标记已掌握、答错累加错误次数；英语：走 markWord（连续答对两次自动移出错词本）
function applyResult(paper) {
  const now = Date.now();
  let mathTouched = false;
  flat(paper).forEach(function (item) {
    if (item.ok === null) return;
    if (item.kind === 'math') {
      const target = store.mathItemById(item.refId);
      if (!target) return;
      if (item.ok) {
        target.done = true;
      } else {
        target.wrongCount = (Number(target.wrongCount) || 1) + 1;
        target.done = false;
      }
      target.updatedAt = now;
      mathTouched = true;
    } else {
      store.markWord(item.refId, Boolean(item.ok));
    }
  });
  if (mathTouched) store.saveMathState();
  if (paper.right > 0) store.addStars(paper.right);
}

/* ---------- 给页面用的视图数据 ---------- */
function toView(paper, showAnswer) {
  let cursor = 0;
  return {
    title: paper.title,
    sections: paper.sections.map(function (sec) {
      return {
        title: sec.title,
        note: sec.note,
        items: sec.items.map(function (item) {
          cursor += 1;
          const images = (item.images || []).slice(0, 3);
          return {
            index: cursor,
            kind: item.kind,
            tag: item.tag || '',
            stem: item.stem,
            hasTip: Boolean(item.tip),
            tip: item.tip || '',
            images: images,
            hasImages: images.length > 0,
            answer: item.answer,
            userAnswer: item.userAnswer || '',
            cls: item.ok === true ? 'ok' : item.ok === false ? 'no' : '',
            mark: item.ok === true ? '✅' : item.ok === false ? '❌' : '',
            showStd: Boolean(showAnswer),
            stdText: item.answer ? '正确答案：' + item.answer : '（这道题当时还没记正确答案）',
            blank: !item.gradable && !item.answer
          };
        })
      };
    })
  };
}

module.exports = {
  defaultTitle: defaultTitle,
  mathPool: mathPool,
  enPool: enPool,
  norm: norm,
  zhMatch: zhMatch,
  mathMatch: mathMatch,
  judge: judge,
  build: build,
  flat: flat,
  grade: grade,
  applyResult: applyResult,
  toView: toView,
  shuffle: U.shuffle
};
