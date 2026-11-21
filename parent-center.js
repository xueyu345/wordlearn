(function () {
"use strict";
const $ = (selector, root) => (root || document).querySelector(selector);
const esc = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[ch]));
const css = [
".wl-parent-entry{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:0 0 14px;padding:14px 16px;border:1px solid var(--line);border-radius:17px;background:linear-gradient(110deg,#FFF5E5,#F2EFFF)}",
".wl-parent-entry strong{display:block;font-size:14px}.wl-parent-entry small{display:block;margin-top:4px;color:var(--muted);font-size:11px;line-height:1.5}",
".wl-parent-open{min-height:38px;padding:0 15px;border:0;border-radius:99px;background:linear-gradient(135deg,var(--orange),#FF6F61);color:#fff;font-size:12px;font-weight:900;box-shadow:0 3px 0 #D95732}",
".wl-parent-panel{margin:0 0 18px;padding:18px;border:1px solid var(--line);border-radius:22px;background:#fff;box-shadow:var(--shadow-sm)}.wl-parent-panel[hidden]{display:none}",
".wl-parent-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}.wl-parent-head h2{font-size:19px}.wl-parent-head p{margin-top:5px;color:var(--muted);font-size:11px;line-height:1.6}",
".wl-parent-tools{display:flex;gap:7px;flex-wrap:wrap}.wl-parent-tools button{min-height:34px;padding:0 12px;border:1px solid var(--line);border-radius:99px;background:#fff;color:var(--ink);font-size:11px;font-weight:800}",
".wl-parent-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:15px}.wl-parent-kpi{padding:12px;border:1px solid var(--line);border-radius:14px;background:#FFFCF8}.wl-parent-kpi b{display:block;font-size:20px}.wl-parent-kpi small{display:block;margin-top:4px;color:var(--muted);font-size:10px}",
".wl-parent-block{margin-top:17px}.wl-parent-block h3{margin-bottom:9px;font-size:13px}.wl-parent-bars{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));align-items:end;gap:7px;min-height:106px;padding:12px 10px 7px;border:1px solid var(--line);border-radius:14px;background:#FFFCF8}.wl-parent-day{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:5px;min-width:0;height:82px}.wl-parent-day b{font-size:10px}.wl-parent-day i{display:block;width:100%;max-width:25px;min-height:3px;border-radius:7px 7px 3px 3px;background:linear-gradient(180deg,#A998F5,#F5A75C)}.wl-parent-day small{color:var(--muted);font-size:9px}",
".wl-parent-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.wl-parent-card{padding:13px;border:1px solid var(--line);border-radius:14px;background:#fff}.wl-parent-card b{display:block;margin-bottom:6px;font-size:12px}.wl-parent-card p{color:var(--muted);font-size:11px;line-height:1.7}",
".wl-parent-advice{margin-top:12px;padding:13px 14px;border-radius:14px;background:#F5F1FF;color:#5C4B91;font-size:11px;line-height:1.7}.wl-parent-foot{margin-top:12px;color:var(--muted);font-size:10px;line-height:1.6}",
"@media(max-width:760px){.wl-parent-panel{padding:14px}.wl-parent-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.wl-parent-columns{grid-template-columns:1fr}}",
"@media print{body.wl-parent-print *{visibility:hidden!important}body.wl-parent-print #view-dashboard,body.wl-parent-print #view-dashboard .settings-body,body.wl-parent-print .wl-parent-panel,body.wl-parent-print .wl-parent-panel *{visibility:visible!important}body.wl-parent-print #view-dashboard{display:block!important;position:absolute!important;inset:0!important;width:100%!important}body.wl-parent-print #view-dashboard .settings-body{display:block!important}body.wl-parent-print #view-dashboard .settings-body>*:not(.wl-parent-panel){display:none!important}body.wl-parent-print .wl-parent-panel{display:block!important;position:static!important;margin:0!important;box-shadow:none!important;border:0!important}body.wl-parent-print .wl-parent-tools{display:none!important}}"
].join("");
function mount() {
  const view = $("#view-dashboard");
  const body = view && $(".settings-body", view);
  if (!body || $(".wl-parent-entry", body)) return;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
  const entry = document.createElement("section");
  entry.className = "wl-parent-entry";
  entry.innerHTML = '<div><strong>👨‍👩‍👧 家长中心 · 学习报告</strong><small>查看当前学习档案的学习表现、近期趋势和下一步建议</small></div><button class="wl-parent-open" type="button" data-parent-open>打开家长中心 →</button>';
  const panel = document.createElement("section");
  panel.className = "wl-parent-panel";
  panel.hidden = true;
  panel.setAttribute("aria-label", "家长学习报告");
  panel.innerHTML =
    '<div class="wl-parent-head"><div><h2>📊 学习成长报告</h2><p data-parent-scope>当前年级 · 当前学习档案</p></div><div class="wl-parent-tools"><button type="button" data-parent-refresh>↻ 刷新报告</button><button type="button" data-parent-print>🖨️ 打印报告</button><button type="button" data-parent-close>收起</button></div></div>' +
    '<div class="wl-parent-kpis" data-parent-kpis></div>' +
    '<div class="wl-parent-block"><h3>最近 7 天英语学习趋势</h3><div class="wl-parent-bars" data-parent-week></div></div>' +
    '<div class="wl-parent-block"><h3>学科学习概况</h3><div class="wl-parent-columns" data-parent-subjects></div></div>' +
    '<div class="wl-parent-advice" data-parent-advice></div>' +
    '<p class="wl-parent-foot">报告依据当前浏览器中已加载的学习档案生成。登录并完成云同步后，可在此设备查看同步后的档案。此版本为家庭查看报告，不包含独立家长账号、远程绑定孩子或访问控制；相关权限功能将在后续阶段单独开发。</p>';
  const quick = $(".dash-quick", body);
  body.insertBefore(entry, quick || body.firstChild);
  body.insertBefore(panel, quick || entry.nextSibling);
  const readText = (selector, root) => {
    const node = $(selector, root || view);
    return node ? node.textContent.trim() : "";
  };
  function render() {
    const scope = readText("#dashScopeNote") || "当前学习档案";
    const stats = Array.from($("#dashStats", view)?.querySelectorAll(".dash-stat") || []);
    const kpis = stats.map(card => ({
      value: readText("b", card),
      label: readText("small", card),
      note: readText(".dash-stat-sub", card)
    }));
    const goal = readText("#dashGoalTitle") || "暂无今日学习数据";
    const goalHint = readText("#dashGoalHint");
    const trendNote = readText("#dashTrendNote");
    const bars = Array.from($("#dashTrend", view)?.querySelectorAll(".dash-bar-col") || []).slice(-7);
    const week = bars.map((col, i) => {
      const value = Number(readText(".dash-bar-value", col)) || 0;
      const label = readText(".dash-bar-label", col) || (i === bars.length - 1 ? "今天" : "");
      return { value, label: label || "·" };
    });
    const math = $("#dashMath", view);
    const mathText = math ? math.textContent.replace(/\s+/g, " ").trim() : "暂无数学学习数据";
    const weak = readText("#dashWeak") || "暂无明显的英语错词记录";
    const badges = readText("#dashBadges") || "继续学习，积累成就";
    const today = new Date().toLocaleDateString("zh-CN");
    $("[data-parent-scope]", panel).textContent = scope + " · 报告生成于 " + today;
    $("[data-parent-kpis]", panel).innerHTML = (kpis.length ? kpis : [
      {value:"—",label:"连续打卡",note:"开始学习后显示"},
      {value:"—",label:"累计星星",note:"开始学习后显示"},
      {value:"—",label:"认识单词",note:"开始学习后显示"},
      {value:"—",label:"错词本",note:"开始学习后显示"}
    ]).map(item => '<div class="wl-parent-kpi"><b>' + esc(item.value) + '</b><small>' + esc(item.label) + ' · ' + esc(item.note) + '</small></div>').join("");
    const max = Math.max(1, ...week.map(day => day.value));
    $("[data-parent-week]", panel).innerHTML = week.length ? week.map(day =>
      '<div class="wl-parent-day"><b>' + (day.value || "0") + '</b><i style="height:' + Math.max(3, Math.round(day.value / max * 55)) + 'px"></i><small>' + esc(day.label) + '</small></div>'
    ).join("") : '<p>暂无近 7 天学习记录</p>';
    const mathSummary = mathText.length > 230 ? mathText.slice(0, 230) + "…" : mathText;
    const weakSummary = weak.length > 180 ? weak.slice(0, 180) + "…" : weak;
    $("[data-parent-subjects]", panel).innerHTML =
      '<div class="wl-parent-card"><b>➗ 数学学习</b><p>' + esc(mathSummary) + '</p></div>' +
      '<div class="wl-parent-card"><b>🔤 英语学习</b><p>' + esc(trendNote || "暂时没有英语趋势数据") + '<br>' + esc(weakSummary) + '</p></div>' +
      '<div class="wl-parent-card"><b>🎯 今日学习</b><p>' + esc(goal) + '<br>' + esc(goalHint) + '</p></div>' +
      '<div class="wl-parent-card"><b>🏅 学习成就</b><p>' + esc(badges) + '</p></div>';
    let advice = "建议保持稳定、适量的学习节奏，完成学习后安排休息，并多鼓励孩子讲出自己的解题思路。";
    if (/错词本\s*[1-9]/.test(kpis.map(x => x.value + x.label).join(" "))) advice = "建议和孩子一起挑选少量错词进行复习，先理解再记忆，不必一次完成太多。";
    if (/今天还没开始/.test(goal)) advice = "今天还没有学习记录。可以先安排一个轻松的小目标，例如复习 5 个单词或整理 1 道数学错题。";
    $("[data-parent-advice]", panel).textContent = "💡 家庭陪学建议：" + advice;
  }
  function open() {
    panel.hidden = false;
    render();
    panel.scrollIntoView({behavior:"smooth",block:"start"});
  }
  $("[data-parent-open]", entry).addEventListener("click", open);
  $("[data-parent-close]", panel).addEventListener("click", () => { panel.hidden = true; });
  $("[data-parent-refresh]", panel).addEventListener("click", render);
  $("[data-parent-print]", panel).addEventListener("click", () => {
    render();
    document.body.classList.add("wl-parent-print");
    const cleanup = () => document.body.classList.remove("wl-parent-print");
    window.addEventListener("afterprint", cleanup, {once:true});
    window.print();
    window.setTimeout(cleanup, 2500);
  });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
else mount();
})();