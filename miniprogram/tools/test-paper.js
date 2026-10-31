/* 错题试卷逻辑测试（不跑页面，只测 utils/paper.js 的组卷 / 判分 / 回写）
 * 用法：node tools/test-paper.js
 */
const path = require('path');

/* ---------- wx 桩 ---------- */
const storage = {};
global.wx = {
  getStorageSync: (k) => (k in storage ? storage[k] : ''),
  setStorageSync: (k, v) => { storage[k] = v; },
  removeStorageSync: (k) => { delete storage[k]; },
  showToast: () => {},
  showModal: (o) => { if (o.success) o.success({ confirm: true }); },
  showLoading: () => {}, hideLoading: () => {},
  vibrateShort: () => {},
  navigateTo: () => {}, redirectTo: () => {}, switchTab: () => {}, navigateBack: () => {},
  setNavigationBarTitle: () => {},
  pageScrollTo: () => {},
  previewImage: () => {},
  getAccountInfoSync: () => ({ miniProgram: { appId: 'wxtest' } }),
  env: { USER_DATA_PATH: '/tmp/user' },
  getFileSystemManager: () => ({
    saveFileSync: () => {}, removeSavedFile: () => {}, writeFile: () => {}, readFileSync: () => '{}'
  })
};
global.getApp = () => ({ globalData: { lastResult: null } });

/* ---------- 拦截 cloud.js：不联网 ---------- */
const Module = require('module');
const origLoad = Module._load;
Module._load = function (request) {
  if (/cloud\.js$/.test(String(request))) {
    return {
      cloud: {
        auth: { getSession: async () => ({ data: null, error: new Error('no session') }), onAuthStateChange: () => {} },
        database: { from: () => ({ select: async () => ({ data: [], error: null }) }) }
      },
      publicConfig: { endpoint: 'https://example.invalid', publishableKey: 'pk_test' },
      CLOUD_TABLE: 'study_progress'
    };
  }
  return origLoad.apply(this, arguments);
};

/* ---------- 断言 ---------- */
let pass = 0;
const fails = [];
function ok(cond, label) {
  if (cond) { pass += 1; } else { fails.push(label); }
}
function section(name) { console.log('\n## ' + name); }

const store = require('../utils/store.js');
const paper = require('../utils/paper.js');

store.init();

/* ---------- 造数据 ---------- */
const KP = '万以内加减法';
const facts = [
  { q: '24 颗糖平均分给 6 个小朋友，每人几颗？', a: '4' },
  { q: '长 8 厘米、宽 3 厘米的长方形，周长多少厘米？', a: '22' },
  { q: '1/2 + 1/2 = ?', a: '1' }
];
facts.forEach((f) => store.addMathItem({ q: f.q, a: f.a, kp: KP, type: '计算题', why: '' }));
// 第 4 道：不记正确答案
store.addMathItem({ q: '还没对答案：9 × 7 = ?', a: '', kp: KP, type: '计算题' });

const words = store.units()[0].words.slice(0, 3);
const st = store.state();
const idxOf = (keyword) => {
  const pool = paper.mathPool('all', '');
  return pool.findIndex((it) => String(it.q).indexOf(keyword) >= 0);
};
const seedWrongWords = () => {
  st.wrong = words.map((w) => w.id);
  words.forEach((w) => { st.learned[w.id] = { seen: 0, correct: 0, wrong: 0 }; });
};
seedWrongWords();

/* ============ 1. 选题池 ============ */
section('选题池');
ok(paper.mathPool('all', '').length === 4, '数学错题池应为 4，实际 ' + paper.mathPool('all', '').length);
ok(paper.mathPool('todo', '').length === 4, '待攻克应为 4');
ok(paper.mathPool('done', '').length === 0, '已掌握应为 0');
ok(paper.mathPool('all', KP).length === 4, '按知识点筛选应命中 4 道');
ok(paper.mathPool('all', '不存在的知识点').length === 0, '不存在的知识点应为 0');
ok(paper.enPool().length === 3, '英语错词池应为 3，实际 ' + paper.enPool().length);

// 错得多的排前面
const target = paper.mathPool('all', '')[0];
store.updateMathItem(target.id, { wrongCount: 5 });
ok(paper.mathPool('all', '')[0].id === target.id, '错得多的应排在最前');

/* ============ 2. 只出数学卷 ============ */
section('只出数学卷');
let built = paper.build({
  title: '数学小测', useMath: true, mathScope: 'all', mathKp: '', mathCount: 0, useEn: false
});
ok(Boolean(built), '试卷应生成');
ok(built.title === '数学小测', '标题应为填写的名字，实际 ' + built.title);
ok(built.sections.length === 1, '应只有 1 个大题');
ok(built.sections[0].title.indexOf('一、') === 0, '大题编号应为「一、」，实际 ' + built.sections[0].title);
ok(built.total === 4, '题数应为 4，实际 ' + built.total);

/* ============ 3. 判分 ============ */
section('判分');
const flatItems = paper.flat(built);
const at = (keyword) => flatItems[idxOf(keyword)];
at('24 颗糖').userAnswer = '4';
at('长方形').userAnswer = '22 厘米';
at('1/2 + 1/2').userAnswer = '99';
at('9 × 7').userAnswer = '63';
let result = paper.grade(built);
ok(built.graded === true, '应标记为已判');
ok(at('24 颗糖').ok === true, '正确答案应判对');
ok(at('长方形').ok === true, '带单位也应判对');
ok(at('1/2 + 1/2').ok === false, '乱填应判错');
ok(at('9 × 7').ok === null, '没记答案的题应不参与判分');
ok(result.judged === 3, '可判题目应为 3，实际 ' + result.judged);
ok(result.right === 2, '做对应为 2，实际 ' + result.right);
ok(result.wrong === 1, '做错应为 1，实际 ' + result.wrong);

/* ============ 4. 回写错题本 ============ */
section('回写错题本');
paper.applyResult(built);
const mathItems = store.mathState().items;
const solved = mathItems.find((it) => String(it.q).indexOf('24 颗糖') >= 0);
const missed = mathItems.find((it) => String(it.q).indexOf('1/2 + 1/2') >= 0);
ok(solved && solved.done === true, '答对应标记为已掌握');
ok(missed && missed.done === false, '答错应保持待攻克');
ok(missed && missed.wrongCount >= 2, '答错应累加错误次数，实际 ' + (missed && missed.wrongCount));

/* ============ 5. 英语卷 ============ */
section('英语卷');
seedWrongWords();
built = paper.build({ useMath: false, useEn: true, enMode: 'zh2en', enCount: 0 });
ok(Boolean(built) && built.total === 3, '英语卷应为 3 题，实际 ' + (built && built.total));
ok(built.sections[0].title.indexOf('一、') === 0, '英语单独出卷时编号也从「一、」开始');
let en = paper.flat(built);
ok(en[0].stem === words[0].zh, '中译英题干应为中文释义，实际 ' + en[0].stem);
ok(en[0].answer === words[0].w, '中译英标准答案应为英文单词');
ok(en[0].tag.indexOf('中译英') >= 0, '题型标签应为中译英');
en[0].userAnswer = words[0].w;
en[1].userAnswer = '肯定不对';
en[2].userAnswer = words[2].w.toUpperCase();
result = paper.grade(built);
ok(en[0].ok === true, '写对单词应判对');
ok(en[1].ok === false, '乱写应判错');
ok(en[2].ok === true, '大小写不敏感');
ok(result.right === 2, '做对应为 2，实际 ' + result.right);

seedWrongWords();
built = paper.build({ useMath: false, useEn: true, enMode: 'en2zh', enCount: 0 });
en = paper.flat(built);
ok(en[0].stem === words[0].w, '英译中题干应为英文单词，实际 ' + en[0].stem);
ok(en[0].answer === words[0].zh, '英译中标准答案应为中文');
en[0].userAnswer = words[0].zh;
result = paper.grade(built);
ok(en[0].ok === true, '中文意思写对应判对');

seedWrongWords();
built = paper.build({ useMath: false, useEn: true, enMode: 'mix', enCount: 0 });
const modes = paper.flat(built).map((it) => it.mode);
ok(modes.indexOf('zh2en') >= 0 && modes.indexOf('en2zh') >= 0, '混合模式应两种题型都有，实际 ' + modes.join(','));

/* ============ 6. 判定容错 ============ */
section('判定容错');
ok(paper.mathMatch('0.5', '1/2') === true, '1/2 与 0.5 应等价');
ok(paper.mathMatch('０．５', '0.5') === true, '全角数字应识别');
ok(paper.mathMatch('', '5') === false, '空答案不算对');
ok(paper.mathMatch('5', '') === false, '没记答案不算对');
ok(paper.zhMatch('苹果', '苹果；苹果树') === true, '多义项命中一个就算对');
ok(paper.zhMatch('香蕉', '苹果；苹果树') === false, '完全不相关不算对');
ok(paper.norm(' Ａpple ') === 'apple', 'norm 应去空格并转小写，实际 ' + paper.norm(' Ａpple '));

/* ============ 7. 两本合卷 + 空数据 ============ */
section('两本合卷与空数据');
seedWrongWords();
built = paper.build({
  title: '', useMath: true, mathScope: 'all', mathKp: '', mathCount: 0,
  useEn: true, enMode: 'mix', enCount: 0
});
ok(built.sections.length === 2, '应有 2 个大题，实际 ' + built.sections.length);
ok(built.sections[0].title.indexOf('一、') === 0 && built.sections[1].title.indexOf('二、') === 0,
  '编号应为 一、二、，实际 ' + built.sections.map((s) => s.title).join(' | '));
ok(built.total === 7, '总题数应为 7，实际 ' + built.total);
ok(built.title.indexOf('错题过关卷') === 0, '没填名字应自动起名，实际 ' + built.title);

ok(paper.build({ useMath: false, useEn: false }) === null, '两本都不选应返回 null');
ok(paper.build({ useMath: true, mathScope: 'all', mathKp: '不存在的知识点', mathCount: 0, useEn: false }) === null,
  '没有符合条件的题应返回 null');

/* ============ 8. 视图数据 ============ */
section('视图数据');
const view = paper.toView(built, false);
ok(view.sections.length === 2, '视图应有 2 个大题');
ok(view.sections[0].items[0].index === 1, '题号应从 1 开始');
ok(view.sections[1].items[0].index === 5, '第二大题题号应接着排，实际 ' + view.sections[1].items[0].index);
ok(view.sections[0].items.every((it) => !it.showStd), '未勾选附答案时不应显示标准答案');
const viewWithAnswer = paper.toView(built, true);
ok(viewWithAnswer.sections[0].items.every((it) => it.showStd), '勾选后每题都应带标准答案');
ok(viewWithAnswer.sections[0].items.every((it) => typeof it.stdText === 'string' && it.stdText.length > 0),
  '标准答案文本不应为空');

/* ---------- 汇总 ---------- */
console.log('\n----------------------------------------');
if (fails.length) {
  console.log('通过断言：' + pass);
  console.log('❌ 失败 ' + fails.length + ' 项：');
  fails.forEach((f) => console.log('  ✗ ' + f));
  process.exitCode = 1;
} else {
  console.log('通过断言：' + pass);
  console.log('✅ 全部通过');
}
