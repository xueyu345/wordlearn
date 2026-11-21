(function () {
"use strict";
const $ = (selector, root) => (root || document).querySelector(selector);
const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[ch]));
const css = [
".wl-groups-entry{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:0 0 14px;padding:14px 16px;border:1px solid var(--line);border-radius:17px;background:linear-gradient(110deg,#EFF8FF,#F4F0FF)}",
".wl-groups-entry strong{display:block;font-size:14px}.wl-groups-entry small{display:block;margin-top:4px;color:var(--muted);font-size:11px;line-height:1.5}",
".wl-groups-open,.wl-groups-primary{min-height:38px;padding:0 15px;border:0;border-radius:99px;background:linear-gradient(135deg,var(--blue),#8C79E8);color:#fff;font-size:12px;font-weight:900}",
".wl-groups-panel{margin:0 0 18px;padding:18px;border:1px solid var(--line);border-radius:22px;background:#fff;box-shadow:var(--shadow-sm)}.wl-groups-panel[hidden]{display:none}",
".wl-groups-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap}.wl-groups-head h2{font-size:18px}.wl-groups-head p{margin-top:4px;color:var(--muted);font-size:11px;line-height:1.6}",
".wl-groups-actions{display:flex;gap:7px;flex-wrap:wrap}.wl-groups-actions button,.wl-group-card button,.wl-group-members button{min-height:33px;padding:0 11px;border:1px solid var(--line);border-radius:99px;background:#fff;color:var(--ink);font-size:11px;font-weight:800}",
".wl-groups-forms{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}.wl-groups-form{padding:13px;border:1px solid var(--line);border-radius:15px;background:#FFFCF8}.wl-groups-form h3{font-size:13px;margin-bottom:10px}.wl-groups-form label{display:block;margin:8px 0 4px;color:var(--muted);font-size:10px}.wl-groups-form input,.wl-groups-form select{width:100%;min-height:38px;padding:0 10px;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--ink);font:inherit;font-size:12px}.wl-groups-form button{margin-top:10px}",
".wl-groups-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}.wl-group-card{padding:13px;border:1px solid var(--line);border-radius:15px;background:#fff}.wl-group-card h3{font-size:13px}.wl-group-card p{margin-top:5px;color:var(--muted);font-size:10.5px;line-height:1.6}.wl-group-code{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px;padding:9px 10px;border-radius:10px;background:#F2F0FF;color:#5C4B91;font-weight:900;letter-spacing:2px}.wl-group-code button{letter-spacing:0}",
".wl-group-members{margin-top:12px;padding-top:10px;border-top:1px solid var(--line)}.wl-group-member{display:flex;justify-content:space-between;gap:8px;padding:7px 0;color:var(--ink);font-size:11px}.wl-group-member small{color:var(--muted)}",
".wl-groups-message{margin-top:11px;padding:10px 12px;border-radius:11px;background:#F4F1FF;color:#5C4B91;font-size:11px;line-height:1.6}.wl-groups-message.error{background:#FFF0EC;color:#A33D2A}.wl-groups-empty{grid-column:1/-1;padding:15px;border:1px dashed var(--line);border-radius:13px;color:var(--muted);font-size:11px;text-align:center}",
".wl-groups-foot{margin-top:12px;color:var(--muted);font-size:10px;line-height:1.6}",
"@media(max-width:760px){.wl-groups-panel{padding:14px}.wl-groups-forms,.wl-groups-list{grid-template-columns:1fr}}"
].join("");
function mount() {
  const view = $("#view-dashboard");
  const body = view && $(".settings-body", view);
  if (!body || $(".wl-groups-entry", body)) return;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
  const entry = document.createElement("section");
  entry.className = "wl-groups-entry";
  entry.innerHTML = '<div><strong>👫 学习小组</strong><small>和同学组成学习伙伴，用邀请码加入专属小组</small></div><button type="button" class="wl-groups-open" data-groups-open>进入学习小组 →</button>';
  const panel = document.createElement("section");
  panel.className = "wl-groups-panel";
  panel.hidden = true;
  panel.innerHTML =
    '<div class="wl-groups-head"><div><h2>👫 我的学习小组</h2><p>仅凭邀请码加入，不公开展示个人账号或学习档案</p></div><div class="wl-groups-actions"><button type="button" data-groups-refresh>↻ 刷新</button><button type="button" data-groups-close>收起</button></div></div>' +
    '<div class="wl-groups-forms">' +
    '<form class="wl-groups-form" data-group-create><h3>✨ 创建一个小组</h3><label>小组名称</label><input name="name" maxlength="30" minlength="2" placeholder="例如：三年级阅读伙伴" required><label>小组内显示的昵称</label><input name="nickname" maxlength="20" placeholder="例如：小星星" required><label>所在年级</label><select name="grade"><option value="1">一年级</option><option value="2">二年级</option><option value="3" selected>三年级</option><option value="4">四年级</option><option value="5">五年级</option><option value="6">六年级</option></select><button class="wl-groups-primary" type="submit">创建小组并生成邀请码</button></form>' +
    '<form class="wl-groups-form" data-group-join><h3>🔑 使用邀请码加入</h3><label>8 位邀请码</label><input name="code" maxlength="8" minlength="8" pattern="[A-Za-z0-9]{8}" placeholder="输入小组邀请码" required><label>小组内显示的昵称</label><input name="nickname" maxlength="20" placeholder="例如：小星星" required><label>所在年级</label><select name="grade"><option value="1">一年级</option><option value="2">二年级</option><option value="3" selected>三年级</option><option value="4">四年级</option><option value="5">五年级</option><option value="6">六年级</option></select><button class="wl-groups-primary" type="submit">加入小组</button></form></div>' +
    '<div class="wl-groups-message" data-groups-message hidden aria-live="polite"></div>' +
    '<div class="wl-groups-list" data-groups-list><div class="wl-groups-empty">打开学习小组后加载你的加入记录。</div></div>' +
    '<p class="wl-groups-foot">第一版每个账号最多加入 5 个小组，每组最多 20 人。小组成员只显示自选昵称和年级，不会互相查看单词、错题或个人学习报告。创建者可以删除小组，普通成员可以退出。需要登录并先完成数据库迁移后使用。</p>';
  const quick = $(".dash-quick", body);
  body.insertBefore(entry, quick || body.firstChild);
  body.insertBefore(panel, quick || entry.nextSibling);
  const api = () => window.WordlearnStudyGroups || null;
  const message = (text, error) => {
    const node = $("[data-groups-message]", panel);
    node.hidden = false;
    node.classList.toggle("error", Boolean(error));
    node.textContent = text;
  };
  const rpc = async (name, args) => {
    const bridge = api();
    const client = bridge && bridge.cloud;
    if (!client || !client.auth || !client.database) throw new Error("云服务尚未准备好，请刷新页面后重试");
    const session = await client.auth.getSession();
    if (session.error || !session.data || !session.data.session) throw new Error("请先登录 Wordlearn 账号，再使用学习小组");
    const result = await client.database.rpc(name, args || {});
    if (result.error) throw result.error;
    return result.data;
  };
  const errorText = error => {
    const text = error && (error.message || error.details || error.hint);
    return text ? String(text).replace(/^.*?:\s*/, "") : "操作暂时未能完成，请稍后重试";
  };
  const gradeLabel = grade => "小学" + ["一","二","三","四","五","六"][Number(grade)-1] + "年级";
  let groups = [];
  async function loadGroups() {
    const list = $("[data-groups-list]", panel);
    list.innerHTML = '<div class="wl-groups-empty">正在加载小组…</div>';
    try {
      const rows = await rpc("list_my_study_groups");
      groups = Array.isArray(rows) ? rows : [];
      if (!groups.length) {
        list.innerHTML = '<div class="wl-groups-empty">你还没有加入学习小组。可以创建一个小组，或输入同学分享的邀请码加入。</div>';
        return;
      }
      list.innerHTML = groups.map((group, index) =>
        '<article class="wl-group-card" data-group-card="' + index + '"><h3>👥 ' + esc(group.group_name) + '</h3><p>' +
        (group.member_role === "owner" ? "创建者" : "小组成员") + " · " + esc(group.member_count) + " / 20 人</p>" +
        (group.invite_code ? '<div class="wl-group-code"><span>' + esc(group.invite_code) + '</span><button type="button" data-copy-code="' + index + '">复制</button></div>' : "") +
        '<div class="wl-group-members" data-members="' + index + '"><button type="button" data-view-members="' + index + '">查看小组成员</button></div>' +
        '<div class="wl-groups-actions" style="margin-top:9px"><button type="button" data-group-action="' + index + '">' + (group.member_role === "owner" ? "删除小组" : "退出小组") + '</button></div></article>'
      ).join("");
    } catch (error) {
      list.innerHTML = '<div class="wl-groups-empty">' + esc(errorText(error)) + '</div>';
      message("无法读取学习小组：" + errorText(error), true);
    }
  }
  async function open() {
    panel.hidden = false;
    panel.scrollIntoView({behavior:"smooth",block:"start"});
    const bridge = api();
    const user = bridge && bridge.getUser ? bridge.getUser() : null;
    if (!user) {
      message("学习小组需要登录账号。请先到「账户」完成登录，再回来使用。", true);
      return;
    }
    const grade = bridge.getGrade ? bridge.getGrade() : 3;
    ["[data-group-create]","[data-group-join]"].forEach(selector => {
      const select = $(selector + ' select[name="grade"]', panel);
      if (select) select.value = String(grade);
    });
    await loadGroups();
  }
  $("[data-groups-open]", entry).addEventListener("click", open);
  $("[data-groups-close]", panel).addEventListener("click", () => { panel.hidden = true; });
  $("[data-groups-refresh]", panel).addEventListener("click", loadGroups);
  $("[data-group-create]", panel).addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const rows = await rpc("create_study_group", {
        p_name:String(data.get("name") || "").trim(),
        p_nickname:String(data.get("nickname") || "").trim(),
        p_grade:Number(data.get("grade"))
      });
      const created = Array.isArray(rows) ? rows[0] : rows;
      message("小组创建成功！邀请码：" + (created && created.invite_code ? created.invite_code : "请刷新查看") + "。把邀请码分享给想邀请的同学即可。");
      form.reset();
      await loadGroups();
    } catch (error) { message(errorText(error), true); }
  });
  $("[data-group-join]", panel).addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await rpc("join_study_group_by_code", {
        p_invite_code:String(data.get("code") || "").trim().toUpperCase(),
        p_nickname:String(data.get("nickname") || "").trim(),
        p_grade:Number(data.get("grade"))
      });
      message("加入成功！现在可以查看小组成员了。");
      form.reset();
      await loadGroups();
    } catch (error) { message(errorText(error), true); }
  });
  panel.addEventListener("click", async event => {
    const copy = event.target.closest("[data-copy-code]");
    const members = event.target.closest("[data-view-members]");
    const action = event.target.closest("[data-group-action]");
    if (copy) {
      const group = groups[Number(copy.dataset.copyCode)];
      if (!group || !group.invite_code) return;
      try {
        await navigator.clipboard.writeText(group.invite_code);
        message("邀请码已复制：" + group.invite_code);
      } catch (_) { message("邀请码：" + group.invite_code + "。请长按复制。"); }
      return;
    }
    if (members) {
      const index = Number(members.dataset.viewMembers);
      const group = groups[index];
      const target = $('[data-members="' + index + '"]', panel);
      if (!group || !target) return;
      members.disabled = true;
      try {
        const rows = await rpc("list_study_group_members", {p_group_id:group.group_id});
        target.innerHTML = (Array.isArray(rows) ? rows : []).map(row =>
          '<div class="wl-group-member"><span>' + esc(row.nickname) + (row.member_role === "owner" ? " · 创建者" : "") + '</span><small>' + esc(gradeLabel(row.grade)) + '</small></div>'
        ).join("") || '<small>暂无成员</small>';
      } catch (error) { message(errorText(error), true); }
      finally { members.disabled = false; }
      return;
    }
    if (action) {
      const index = Number(action.dataset.groupAction);
      const group = groups[index];
      if (!group) return;
      const owner = group.member_role === "owner";
      const confirmed = window.confirm(owner
        ? "确定删除「" + group.group_name + "」吗？所有成员都会退出，且无法撤销。"
        : "确定退出「" + group.group_name + "」吗？");
      if (!confirmed) return;
      action.disabled = true;
      try {
        await rpc(owner ? "delete_study_group" : "leave_study_group", {p_group_id:group.group_id});
        message(owner ? "小组已删除。" : "已退出小组。");
        await loadGroups();
      } catch (error) { message(errorText(error), true); action.disabled = false; }
    }
  });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
else mount();
})();