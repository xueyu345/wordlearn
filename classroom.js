(function () {
"use strict";
const $ = (selector, root) => (root || document).querySelector(selector);
const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[ch]));

const css = [
".wl-cr-tabs{display:flex;gap:6px;padding:5px;border:1px solid var(--line);border-radius:99px;background:var(--surface);width:max-content;max-width:100%}",
".wl-cr-tab{min-height:38px;padding:0 18px;border:0;border-radius:99px;background:transparent;color:var(--muted);font-size:13px;font-weight:900;cursor:pointer}",
".wl-cr-tab[aria-selected=true]{background:linear-gradient(135deg,var(--blue),#8C79E8);color:#fff}",
".wl-cr-card{padding:18px;border:1px solid var(--line);border-radius:20px;background:var(--surface);box-shadow:var(--shadow-sm)}",
".wl-cr-card h2{font-size:16px;margin:0}.wl-cr-card>p,.wl-cr-sub{margin:5px 0 0;color:var(--muted);font-size:11.5px;line-height:1.6}",
".wl-cr-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}",
".wl-cr-form{display:flex;flex-direction:column;gap:4px;margin-top:12px}",
".wl-cr-form label{margin-top:6px;color:var(--muted);font-size:11px;font-weight:800}",
".wl-cr-form input,.wl-cr-form select,.wl-cr-form textarea{width:100%;min-height:40px;padding:8px 11px;border:1px solid var(--line);border-radius:11px;background:#fff;color:var(--ink);font:inherit;font-size:13px}",
".wl-cr-form textarea{min-height:84px;resize:vertical}",
".wl-cr-row{display:flex;gap:10px;flex-wrap:wrap}.wl-cr-row>*{flex:1 1 140px}",
".wl-cr-primary{align-self:flex-start;margin-top:10px;min-height:40px;padding:0 18px;border:0;border-radius:99px;background:linear-gradient(135deg,var(--blue),#8C79E8);color:#fff;font-size:12.5px;font-weight:900;cursor:pointer}",
".wl-cr-primary:disabled{opacity:.6;cursor:wait}",
".wl-cr-ghost{min-height:32px;padding:0 12px;border:1px solid var(--line);border-radius:99px;background:#fff;color:var(--ink);font-size:11.5px;font-weight:800;cursor:pointer}",
".wl-cr-ghost.danger{color:#A33D2A;border-color:#F3C9BE}",
".wl-cr-list{display:flex;flex-direction:column;gap:10px;margin-top:12px}",
".wl-cr-item{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:13px 14px;border:1px solid var(--line);border-radius:15px;background:#fff;text-align:left}",
".wl-cr-item.selectable{cursor:pointer}.wl-cr-item.active{border-color:#B9A8FF;box-shadow:0 0 0 3px rgba(112,87,245,.12)}",
".wl-cr-item strong{display:block;font-size:13.5px;color:var(--ink)}.wl-cr-item small{display:block;margin-top:3px;color:var(--muted);font-size:11px;line-height:1.5}",
".wl-cr-item .wl-cr-body{flex:1 1 220px;min-width:0}.wl-cr-content{margin-top:6px;color:var(--ink);font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-word}",
".wl-cr-actions{display:flex;gap:6px;flex-wrap:wrap}",
".wl-cr-code{display:inline-flex;align-items:center;gap:8px;padding:5px 10px;border-radius:10px;background:#F2F0FF;color:#5C4B91;font-weight:900;letter-spacing:2px;font-size:13px}",
".wl-cr-tag{display:inline-block;padding:2px 8px;margin-right:6px;border-radius:99px;font-size:10.5px;font-weight:900;background:#EEF6FF;color:#2F6FB5}",
".wl-cr-tag.done{background:#E9F8EF;color:#23824D}.wl-cr-tag.late{background:#FFF0EC;color:#A33D2A}",
".wl-cr-msg{padding:10px 12px;border-radius:12px;background:#F4F1FF;color:#5C4B91;font-size:12px;line-height:1.6}.wl-cr-msg.error{background:#FFF0EC;color:#A33D2A}",
".wl-cr-empty{padding:16px;border:1px dashed var(--line);border-radius:14px;color:var(--muted);font-size:12px;text-align:center;line-height:1.6}",
".wl-cr-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap}",
".wl-cr-roster{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.wl-cr-roster span{padding:4px 10px;border-radius:99px;background:#F6F4EF;font-size:11.5px;color:var(--ink)}",
".wl-cr-roster span.done{background:#E9F8EF;color:#23824D}",
"@media(max-width:760px){.wl-cr-grid{grid-template-columns:1fr}}"
].join("");

const SUBJECTS = { en: "英语", math: "数学", chinese: "语文", other: "其他" };
const GRADES = ["一","二","三","四","五","六"];
const gradeLabel = grade => GRADES[Number(grade) - 1] ? GRADES[Number(grade) - 1] + "年级" : "";
const gradeOptions = selected => GRADES.map((g, i) =>
  '<option value="' + (i + 1) + '"' + (i + 1 === selected ? " selected" : "") + ">" + g + "年级</option>").join("");
const fmtDate = value => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return (d.getMonth() + 1) + "月" + d.getDate() + "日";
};
const todayIso = () => {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
};

const state = {
  role: "student",
  teacher: undefined,
  teacherClasses: [],
  myClasses: [],
  selectedTeacherClass: null,
  selectedStudentClass: null,
  homework: [],
  roster: [],
  progressFor: null,
  progress: [],
  message: null,
  loading: false
};

const bridge = () => window.WordlearnStudyGroups || null;
const signedIn = () => {
  const b = bridge();
  return Boolean(b && b.getUser && b.getUser());
};

async function rpc(name, args) {
  const b = bridge();
  const client = b && b.cloud;
  if (!client || !client.auth || !client.database) throw new Error("云服务尚未准备好，请刷新页面后重试");
  const session = await client.auth.getSession();
  if (session.error || !session.data || !session.data.session) throw new Error("请先登录 Wordlearn 账号");
  const result = await client.database.rpc(name, args || {});
  if (result.error) throw result.error;
  return result.data;
}
const errorText = error => {
  const text = error && (error.message || error.details || error.hint);
  return text ? String(text).replace(/^.*?:\s*/, "") : "操作暂时未能完成，请稍后重试";
};
const rows = data => (Array.isArray(data) ? data : data ? [data] : []);

function root() { return $("#classroomRoot"); }

function setMessage(text, error) {
  state.message = text ? { text, error: Boolean(error) } : null;
  const node = $("[data-cr-msg]", root());
  if (!node) return;
  node.hidden = !state.message;
  node.className = "wl-cr-msg" + (state.message && state.message.error ? " error" : "");
  node.textContent = state.message ? state.message.text : "";
}

function shell(inner) {
  const node = root();
  if (!node) return;
  node.innerHTML =
    '<div class="wl-cr-tabs" role="tablist" aria-label="选择身份">' +
      '<button class="wl-cr-tab" type="button" role="tab" data-cr-role="student" aria-selected="' + (state.role === "student") + '">我是学生</button>' +
      '<button class="wl-cr-tab" type="button" role="tab" data-cr-role="teacher" aria-selected="' + (state.role === "teacher") + '">我是老师</button>' +
    "</div>" +
    '<div class="wl-cr-msg' + (state.message && state.message.error ? " error" : "") + '" data-cr-msg role="status"' + (state.message ? "" : " hidden") + ">" +
      esc(state.message ? state.message.text : "") + "</div>" +
    inner;
}

function renderSignedOut() {
  shell(
    '<section class="wl-cr-card"><h2>先登录账号</h2>' +
    "<p>老师需要登录后开通老师身份，才能建班和发布作业；学生登录后输入老师给的 6 位班级码即可加入班级。</p>" +
    '<button class="wl-cr-primary" type="button" data-cr-login>登录 / 注册</button></section>'
  );
}

function renderLoading(text) {
  shell('<div class="wl-cr-empty">' + esc(text || "正在加载…") + "</div>");
}

function homeworkMeta(hw) {
  const parts = ['<span class="wl-cr-tag">' + esc(SUBJECTS[hw.subject] || "作业") + "</span>"];
  if (hw.my_submitted_at) parts.push('<span class="wl-cr-tag done">已完成</span>');
  else if (hw.due_on && hw.due_on < todayIso()) parts.push('<span class="wl-cr-tag late">已过截止</span>');
  const due = hw.due_on ? "截止 " + fmtDate(hw.due_on) : "不限截止日期";
  return parts.join("") + "<small>" + esc(due) + " · 发布于 " + esc(fmtDate(hw.created_at)) + "</small>";
}

/* ---------------- 学生 ---------------- */

function renderStudent() {
  const classes = state.myClasses;
  const current = classes.find(c => c.classroom_id === state.selectedStudentClass) || null;
  const classList = classes.length
    ? classes.map(c =>
        '<div class="wl-cr-item selectable' + (current && current.classroom_id === c.classroom_id ? " active" : "") +
        '" role="button" tabindex="0" data-cr-pick-student="' + esc(c.classroom_id) + '"><div class="wl-cr-body"><strong>' + esc(c.classroom_name) +
        "</strong><small>" + esc(gradeLabel(c.grade)) + " · " + esc(c.teacher_name) + " 老师 · 我叫 " + esc(c.nickname) + "</small></div>" +
        (Number(c.pending_count) > 0 ? '<span class="wl-cr-tag late">待完成 ' + esc(c.pending_count) + "</span>" : '<span class="wl-cr-tag done">全部完成</span>') +
        "</div>").join("")
    : '<div class="wl-cr-empty">还没有加入班级。向老师要 6 位班级码，填在上面加入吧。</div>';

  let detail = "";
  if (current) {
    const list = state.homework.length
      ? state.homework.map(hw =>
          '<div class="wl-cr-item"><div class="wl-cr-body"><strong>' + esc(hw.title) + "</strong>" + homeworkMeta(hw) +
          (hw.content ? '<div class="wl-cr-content">' + esc(hw.content) + "</div>" : "") +
          (hw.my_submitted_at ? "<small>" + esc(fmtDate(hw.my_submitted_at)) + " 已打卡" + (hw.my_note ? "：" + esc(hw.my_note) : "") + "</small>" : "") +
          '</div><div class="wl-cr-actions">' +
          (hw.my_submitted_at
            ? '<button class="wl-cr-ghost" type="button" data-cr-withdraw="' + esc(hw.homework_id) + '">撤回打卡</button>'
            : '<button class="wl-cr-primary" type="button" data-cr-submit="' + esc(hw.homework_id) + '">我完成了</button>') +
          "</div></div>").join("")
      : '<div class="wl-cr-empty">老师还没有在这个班级发布作业。</div>';
    detail =
      '<section class="wl-cr-card"><div class="wl-cr-head"><div><h2>' + esc(current.classroom_name) + ' · 作业</h2><p class="wl-cr-sub">完成后点「我完成了」，老师就能看到你的打卡。</p></div>' +
      '<div class="wl-cr-actions"><button class="wl-cr-ghost" type="button" data-cr-refresh>刷新</button><button class="wl-cr-ghost danger" type="button" data-cr-leave="' + esc(current.classroom_id) + '">退出班级</button></div></div>' +
      '<div class="wl-cr-list">' + list + "</div></section>";
  }

  shell(
    '<section class="wl-cr-card"><h2>加入班级</h2><p>输入老师提供的班级码，并填写老师认得出的名字。</p>' +
    '<form class="wl-cr-form" data-cr-join><div class="wl-cr-row">' +
    '<div><label for="crJoinCode">班级码</label><input id="crJoinCode" name="code" maxlength="6" minlength="6" pattern="[A-Za-z0-9]{6}" autocomplete="off" placeholder="例如 A1B2C3" required></div>' +
    '<div><label for="crJoinName">我的名字</label><input id="crJoinName" name="nickname" maxlength="20" placeholder="例如 王小明" required></div>' +
    '</div><button class="wl-cr-primary" type="submit">加入班级</button></form></section>' +
    '<section class="wl-cr-card"><h2>我的班级</h2><div class="wl-cr-list">' + classList + "</div></section>" +
    detail
  );
}

async function loadStudent() {
  const data = rows(await rpc("list_my_classrooms"));
  state.myClasses = data;
  if (!data.some(c => c.classroom_id === state.selectedStudentClass)) {
    state.selectedStudentClass = data.length ? data[0].classroom_id : null;
  }
  state.homework = state.selectedStudentClass
    ? rows(await rpc("list_classroom_homework", { p_classroom_id: state.selectedStudentClass }))
    : [];
}

/* ---------------- 老师 ---------------- */

function renderTeacherRegister() {
  shell(
    '<section class="wl-cr-card"><h2>开通老师身份</h2><p>开通后可以创建班级、生成班级码并给学生发布作业。学生只能看到你填写的称呼。</p>' +
    '<form class="wl-cr-form" data-cr-register><div class="wl-cr-row">' +
    '<div><label for="crTeacherName">老师称呼</label><input id="crTeacherName" name="name" maxlength="20" placeholder="例如 李" required></div>' +
    '<div><label for="crTeacherSchool">学校（选填）</label><input id="crTeacherSchool" name="school" maxlength="40" placeholder="例如 实验小学"></div>' +
    '</div><button class="wl-cr-primary" type="submit">开通老师身份</button></form></section>'
  );
}

function renderTeacher() {
  const t = state.teacher;
  const classes = state.teacherClasses;
  const current = classes.find(c => c.classroom_id === state.selectedTeacherClass) || null;
  const classList = classes.length
    ? classes.map(c =>
        '<div class="wl-cr-item selectable' + (current && current.classroom_id === c.classroom_id ? " active" : "") +
        '" role="button" tabindex="0" data-cr-pick-teacher="' + esc(c.classroom_id) + '"><div class="wl-cr-body"><strong>' + esc(c.classroom_name) +
        "</strong><small>" + esc(gradeLabel(c.grade)) + " · " + esc(c.student_count) + " 名学生 · " + esc(c.homework_count) + " 份作业</small></div>" +
        '<span class="wl-cr-code" title="班级码">' + esc(c.invite_code) + "</span></div>").join("")
    : '<div class="wl-cr-empty">还没有班级。先创建一个，把班级码发给学生。</div>';

  let detail = "";
  if (current) {
    const roster = state.roster.length
      ? '<div class="wl-cr-roster">' + state.roster.map(s => "<span>" + esc(s.nickname) + " · 完成 " + esc(s.done_count) + "</span>").join("") + "</div>"
      : '<p class="wl-cr-sub">还没有学生加入。把班级码 <b>' + esc(current.invite_code) + "</b> 发给学生吧。</p>";
    const hwList = state.homework.length
      ? state.homework.map(hw => {
          const open = state.progressFor === hw.homework_id;
          const progress = open
            ? (state.progress.length
                ? '<div class="wl-cr-roster">' + state.progress.map(p =>
                    '<span class="' + (p.submitted_at ? "done" : "") + '">' + esc(p.nickname) + (p.submitted_at ? " ✓" : " · 未完成") + "</span>").join("") + "</div>"
                : '<p class="wl-cr-sub">班级里还没有学生。</p>')
            : "";
          return '<div class="wl-cr-item"><div class="wl-cr-body"><strong>' + esc(hw.title) + "</strong>" + homeworkMeta(hw) +
            (hw.content ? '<div class="wl-cr-content">' + esc(hw.content) + "</div>" : "") +
            "<small>完成 " + esc(hw.submitted_count || 0) + " / " + esc(hw.student_count || 0) + " 人</small>" + progress +
            '</div><div class="wl-cr-actions"><button class="wl-cr-ghost" type="button" data-cr-progress="' + esc(hw.homework_id) + '" aria-expanded="' + open + '">' + (open ? "收起名单" : "完成名单") + "</button>" +
            '<button class="wl-cr-ghost danger" type="button" data-cr-del-hw="' + esc(hw.homework_id) + '">删除</button></div></div>';
        }).join("")
      : '<div class="wl-cr-empty">这个班级还没有作业。</div>';

    detail =
      '<section class="wl-cr-card"><div class="wl-cr-head"><div><h2>' + esc(current.classroom_name) + '</h2><p class="wl-cr-sub">班级码 <span class="wl-cr-code">' + esc(current.invite_code) + "</span></p></div>" +
      '<div class="wl-cr-actions"><button class="wl-cr-ghost" type="button" data-cr-copy="' + esc(current.invite_code) + '">复制班级码</button><button class="wl-cr-ghost" type="button" data-cr-refresh>刷新</button><button class="wl-cr-ghost danger" type="button" data-cr-del-class="' + esc(current.classroom_id) + '">解散班级</button></div></div>' +
      '<h2 style="margin-top:14px;font-size:14px">学生名单</h2>' + roster + "</section>" +
      '<section class="wl-cr-card"><h2>发布作业</h2><p>发布后班级里的学生马上就能看到。</p>' +
      '<form class="wl-cr-form" data-cr-publish><label for="crHwTitle">作业标题</label><input id="crHwTitle" name="title" minlength="2" maxlength="40" placeholder="例如 Unit 3 单词默写" required>' +
      '<div class="wl-cr-row"><div><label for="crHwSubject">科目</label><select id="crHwSubject" name="subject"><option value="en">英语</option><option value="math">数学</option><option value="chinese">语文</option><option value="other">其他</option></select></div>' +
      '<div><label for="crHwDue">截止日期（选填）</label><input id="crHwDue" name="due" type="date" min="' + todayIso() + '"></div></div>' +
      '<label for="crHwContent">作业要求（选填）</label><textarea id="crHwContent" name="content" maxlength="500" placeholder="例如：在「单词闯关」完成 Unit 3 的拼写练习，错题本清零"></textarea>' +
      '<button class="wl-cr-primary" type="submit">发布作业</button></form></section>' +
      '<section class="wl-cr-card"><h2>已发布的作业</h2><div class="wl-cr-list">' + hwList + "</div></section>";
  }

  shell(
    '<section class="wl-cr-card"><div class="wl-cr-head"><div><h2>' + esc(t.display_name) + ' 老师</h2><p class="wl-cr-sub">' + esc(t.school || "可以创建最多 10 个班级") + "</p></div></div>" +
    '<form class="wl-cr-form" data-cr-create><div class="wl-cr-row">' +
    '<div><label for="crClassName">新班级名称</label><input id="crClassName" name="name" minlength="2" maxlength="30" placeholder="例如 三年级二班" required></div>' +
    '<div><label for="crClassGrade">年级</label><select id="crClassGrade" name="grade">' + gradeOptions(3) + "</select></div>" +
    '</div><button class="wl-cr-primary" type="submit">创建班级</button></form></section>' +
    '<section class="wl-cr-card"><h2>我的班级</h2><div class="wl-cr-list">' + classList + "</div></section>" +
    detail
  );
}

async function loadTeacher() {
  const profile = rows(await rpc("get_my_teacher_profile"))[0] || null;
  state.teacher = profile;
  if (!profile) return;
  const classes = rows(await rpc("list_teacher_classrooms"));
  state.teacherClasses = classes;
  if (!classes.some(c => c.classroom_id === state.selectedTeacherClass)) {
    state.selectedTeacherClass = classes.length ? classes[0].classroom_id : null;
    state.progressFor = null;
  }
  if (state.selectedTeacherClass) {
    const [hw, roster] = await Promise.all([
      rpc("list_classroom_homework", { p_classroom_id: state.selectedTeacherClass }),
      rpc("list_classroom_students", { p_classroom_id: state.selectedTeacherClass })
    ]);
    state.homework = rows(hw);
    state.roster = rows(roster);
    if (state.progressFor && state.homework.some(h => h.homework_id === state.progressFor)) {
      state.progress = rows(await rpc("list_homework_progress", { p_homework_id: state.progressFor }));
    } else {
      state.progressFor = null;
    }
  } else {
    state.homework = [];
    state.roster = [];
  }
}

/* ---------------- 渲染调度 ---------------- */

function paint() {
  if (!signedIn()) return renderSignedOut();
  if (state.role === "teacher") {
    if (state.teacher === undefined) return renderLoading("正在读取老师信息…");
    return state.teacher ? renderTeacher() : renderTeacherRegister();
  }
  return renderStudent();
}

let loadToken = 0;
async function refresh() {
  if (!root()) return;
  if (!signedIn()) return paint();
  const token = ++loadToken;
  if (state.role === "teacher" && state.teacher === undefined) renderLoading("正在读取老师信息…");
  try {
    if (state.role === "teacher") await loadTeacher();
    else await loadStudent();
  } catch (error) {
    if (token !== loadToken) return;
    if (state.role === "teacher" && state.teacher === undefined) state.teacher = null;
    state.message = { text: errorText(error), error: true };
  }
  if (token === loadToken) paint();
}

async function act(button, task, okText) {
  if (button) button.disabled = true;
  try {
    await task();
    state.message = okText ? { text: okText, error: false } : null;
    await refresh();
  } catch (error) {
    setMessage(errorText(error), true);
    if (button) button.disabled = false;
  }
}

function bind() {
  const node = root();
  if (!node || node.dataset.crBound) return;
  node.dataset.crBound = "1";

  node.addEventListener("click", event => {
    const t = event.target;
    const roleBtn = t.closest("[data-cr-role]");
    if (roleBtn) {
      if (state.role === roleBtn.dataset.crRole) return;
      state.role = roleBtn.dataset.crRole;
      state.message = null;
      state.homework = [];
      paint();
      refresh();
      return;
    }
    if (t.closest("[data-cr-login]")) {
      const b = bridge();
      if (b && b.openLogin) b.openLogin();
      return;
    }
    if (t.closest("[data-cr-refresh]")) { state.message = null; refresh(); return; }

    const pickT = t.closest("[data-cr-pick-teacher]");
    if (pickT) { state.selectedTeacherClass = pickT.dataset.crPickTeacher; state.progressFor = null; state.message = null; refresh(); return; }
    const pickS = t.closest("[data-cr-pick-student]");
    if (pickS) { state.selectedStudentClass = pickS.dataset.crPickStudent; state.message = null; refresh(); return; }

    const copy = t.closest("[data-cr-copy]");
    if (copy) {
      const code = copy.dataset.crCopy;
      const done = () => setMessage("班级码 " + code + " 已复制，发给学生就能加入");
      if (navigator.clipboard) navigator.clipboard.writeText(code).then(done, () => setMessage("班级码是 " + code));
      else setMessage("班级码是 " + code);
      return;
    }
    const prog = t.closest("[data-cr-progress]");
    if (prog) {
      const id = prog.dataset.crProgress;
      if (state.progressFor === id) { state.progressFor = null; paint(); return; }
      act(prog, async () => {
        state.progress = rows(await rpc("list_homework_progress", { p_homework_id: id }));
        state.progressFor = id;
      });
      return;
    }
    const delHw = t.closest("[data-cr-del-hw]");
    if (delHw) {
      if (!confirm("确定删除这份作业吗？学生的完成记录也会一起删除。")) return;
      act(delHw, () => rpc("delete_homework", { p_homework_id: delHw.dataset.crDelHw }), "作业已删除");
      return;
    }
    const delClass = t.closest("[data-cr-del-class]");
    if (delClass) {
      if (!confirm("确定解散这个班级吗？所有作业和学生记录都会删除，且无法恢复。")) return;
      act(delClass, () => rpc("delete_classroom", { p_classroom_id: delClass.dataset.crDelClass }), "班级已解散");
      return;
    }
    const leave = t.closest("[data-cr-leave]");
    if (leave) {
      if (!confirm("确定退出这个班级吗？你在这个班级的打卡记录会被清除。")) return;
      act(leave, () => rpc("leave_classroom", { p_classroom_id: leave.dataset.crLeave }), "已退出班级");
      return;
    }
    const submit = t.closest("[data-cr-submit]");
    if (submit) {
      const note = prompt("想对老师说点什么吗？（选填，最多 200 字）", "");
      if (note === null) return;
      act(submit, () => rpc("submit_homework", { p_homework_id: submit.dataset.crSubmit, p_note: note.slice(0, 200) }), "打卡成功，老师能看到啦");
      return;
    }
    const withdraw = t.closest("[data-cr-withdraw]");
    if (withdraw) {
      act(withdraw, () => rpc("withdraw_homework_submission", { p_homework_id: withdraw.dataset.crWithdraw }), "已撤回打卡");
    }
  });

  node.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const item = event.target.closest("[data-cr-pick-teacher],[data-cr-pick-student]");
    if (!item || item !== event.target) return;
    event.preventDefault();
    item.click();
  });

  node.addEventListener("submit", event => {
    const form = event.target;
    event.preventDefault();
    const data = new FormData(form);
    const button = $("button[type=submit]", form);
    if (form.matches("[data-cr-register]")) {
      act(button, async () => {
        await rpc("register_teacher", { p_display_name: data.get("name"), p_school: data.get("school") || "" });
        state.teacher = undefined;
      }, "老师身份已开通，先创建一个班级吧");
    } else if (form.matches("[data-cr-create]")) {
      act(button, async () => {
        const created = rows(await rpc("create_classroom", { p_name: data.get("name"), p_grade: Number(data.get("grade")) }))[0];
        if (created) state.selectedTeacherClass = created.classroom_id;
      }, "班级已创建，把班级码发给学生吧");
    } else if (form.matches("[data-cr-publish]")) {
      act(button, () => rpc("publish_homework", {
        p_classroom_id: state.selectedTeacherClass,
        p_title: data.get("title"),
        p_subject: data.get("subject"),
        p_content: data.get("content") || "",
        p_due_on: data.get("due") || null
      }), "作业已发布");
    } else if (form.matches("[data-cr-join]")) {
      act(button, async () => {
        const joined = rows(await rpc("join_classroom_by_code", {
          p_invite_code: String(data.get("code") || "").trim().toUpperCase(),
          p_nickname: data.get("nickname")
        }))[0];
        if (joined) state.selectedStudentClass = joined.classroom_id;
      }, "加入成功，快看看老师布置的作业");
    }
  });
}

function mount() {
  if (!root()) return;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
  bind();
  window.addEventListener("wordlearn:auth-change", () => {
    state.teacher = undefined;
    state.teacherClasses = [];
    state.myClasses = [];
    state.homework = [];
    state.message = null;
    if (location.hash.startsWith("#/classroom")) refresh();
  });
}

window.WordlearnClassroom = {
  render() {
    bind();
    paint();
    refresh();
  }
};

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
else mount();
})();
