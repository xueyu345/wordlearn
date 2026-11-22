(function () {
"use strict";
const DAILY_KEY = "wordlearn_daily_workbench_v1";
const PET_KEY = "wordlearn_pet_profile_v1";
const BADGES = [
  { id:"first-step", icon:"🌱", name:"初次出发", desc:"完成第 1 项学习任务", at:1, group:"启程" },
  { id:"steady-start", icon:"🐾", name:"稳稳起步", desc:"累计完成 3 项任务", at:3, group:"启程" },
  { id:"little-star", icon:"⭐", name:"小小新星", desc:"累计完成 5 项任务", at:5, group:"启程" },
  { id:"daily-hero", icon:"☀️", name:"每日小英雄", desc:"累计完成 10 项任务", at:10, group:"积累" },
  { id:"book-lover", icon:"📚", name:"阅读达人", desc:"累计完成 15 项任务", at:15, group:"积累" },
  { id:"curious-mind", icon:"🔎", name:"好奇探索者", desc:"累计完成 20 项任务", at:20, group:"积累" },
  { id:"brave-explorer", icon:"🧭", name:"勇敢探索家", desc:"累计完成 30 项任务", at:30, group:"积累" },
  { id:"persistence", icon:"🔥", name:"坚持不懈", desc:"累计完成 40 项任务", at:40, group:"坚持" },
  { id:"learning-master", icon:"🏆", name:"学习小达人", desc:"累计完成 50 项任务", at:50, group:"坚持" },
  { id:"bright-mind", icon:"💡", name:"灵感闪闪", desc:"累计完成 60 项任务", at:60, group:"坚持" },
  { id:"super-learner", icon:"👑", name:"超级学习家", desc:"累计完成 80 项任务", at:80, group:"挑战" },
  { id:"century-star", icon:"💎", name:"百项成就", desc:"累计完成 100 项任务", at:100, group:"挑战" }
];
const LEVELS = [
  { level:1, at:0, name:"初识伙伴", pet:"🐣", perk:"解锁宠物小窝", perkIcon:"🏡" },
  { level:2, at:5, name:"成长伙伴", pet:"🐥", perk:"解锁软软围巾", perkIcon:"🧣" },
  { level:3, at:15, name:"活力伙伴", pet:"🐤", perk:"解锁彩色玩具", perkIcon:"🧸" },
  { level:4, at:30, name:"闪亮伙伴", pet:"🐱", perk:"解锁星星项圈", perkIcon:"✨" },
  { level:5, at:50, name:"守护伙伴", pet:"🦊", perk:"解锁专属小城堡", perkIcon:"🏰" },
  { level:6, at:80, name:"传奇伙伴", pet:"🦄", perk:"解锁彩虹王冠", perkIcon:"👑" }
];
const $ = (s, root) => (root || document).querySelector(s);
function read(key) { try { return JSON.parse(localStorage.getItem(key) || "{}") || {}; } catch (_) { return {}; } }
function totalTasks() {
  const data = read(DAILY_KEY);
  return Object.keys(data).reduce((sum, date) => {
    const done = data[date] && Array.isArray(data[date].done) ? data[date].done : [];
    return sum + done.length;
  }, 0);
}
function currentLevel(total) { return LEVELS.reduce((best, item) => total >= item.at ? item : best, LEVELS[0]); }
const css = [
".wl-pet-panel{margin:0 0 20px;padding:18px 20px;border:1px solid var(--line);border-radius:24px;background:linear-gradient(115deg,#FFF9E9,#F4F0FF);box-shadow:var(--shadow-sm)}",
".wl-pet-top{display:flex;align-items:center;gap:14px}.wl-pet-avatar{width:76px;height:76px;flex:0 0 auto;display:grid;place-items:center;border-radius:22px;background:linear-gradient(145deg,#FFE5AE,#F4DFFF);font-size:43px;box-shadow:inset 0 -4px 0 rgba(112,87,245,.08)}",
".wl-pet-info{min-width:0;flex:1}.wl-pet-info h3{font-size:16px}.wl-pet-info p{margin-top:4px;color:var(--muted);font-size:11.5px;line-height:1.6}.wl-pet-level{display:inline-flex;margin-top:7px;padding:4px 9px;border-radius:99px;background:#fff;color:#7258C8;font-size:10.5px;font-weight:900}",
".wl-pet-meter{height:9px;margin-top:12px;overflow:hidden;border-radius:99px;background:#E9E1D7}.wl-pet-meter span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#FFB34F,#F45D9E);transition:width .2s ease}.wl-pet-next{display:flex;justify-content:space-between;gap:8px;margin-top:6px;color:var(--muted);font-size:10.5px}",
".wl-pet-perks{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.wl-pet-perk{display:flex;align-items:center;gap:6px;padding:7px 10px;border:1px solid rgba(240,230,216,.9);border-radius:12px;background:#fff;font-size:11px;font-weight:800}.wl-pet-perk.locked{opacity:.48;filter:grayscale(.7)}",
".wl-badge-wall{margin-top:17px;padding-top:15px;border-top:1px solid rgba(240,230,216,.9)}.wl-badge-wall-head{display:flex;justify-content:space-between;align-items:center;gap:8px}.wl-badge-wall-head strong{font-size:14px}.wl-badge-wall-head small{color:var(--muted);font-size:10px}",
".wl-badge-filters{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 10px}.wl-badge-filter{padding:6px 11px;border:1px solid var(--line);border-radius:99px;background:#fff;color:var(--muted);font-size:10.5px;font-weight:800}.wl-badge-filter.active{border-color:#D9CEFF;background:#F0ECFF;color:#7057F5}",
".wl-badge-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.wl-badge{min-width:0;display:flex;align-items:center;gap:9px;padding:10px;border:1px solid var(--line);border-radius:14px;background:#fff}.wl-badge-icon{width:38px;height:38px;flex:0 0 auto;display:grid;place-items:center;border-radius:12px;background:#FFF3D8;font-size:21px}.wl-badge b{display:block;font-size:11px}.wl-badge small{display:block;margin-top:3px;color:var(--muted);font-size:9.5px;line-height:1.4}.wl-badge.locked{opacity:.48;filter:grayscale(1)}.wl-badge-earned{display:block;margin-top:4px;color:#2FAE72;font-size:9px;font-weight:900}.wl-badge-empty{grid-column:1/-1;padding:18px;text-align:center;color:var(--muted);font-size:11px;border:1px dashed var(--line);border-radius:14px;background:rgba(255,255,255,.55)}",
"@media(max-width:760px){.wl-pet-panel{padding:15px;border-radius:20px}.wl-pet-avatar{width:65px;height:65px;font-size:36px}.wl-badge-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}"
].join("");
function mount() {
  const view = $("#view-dashboard");
  const workbench = view && $(".wl-workbench", view);
  if (!workbench || $(".wl-pet-panel", view)) return;
  let badgeFilter = "all";
  const panel = document.createElement("section");
  panel.className = "wl-pet-panel";
  panel.setAttribute("aria-label", "宠物成长与徽章墙");
  panel.innerHTML =
    '<div class="wl-pet-top"><div class="wl-pet-avatar" data-pet-avatar aria-hidden="true">🐣</div><div class="wl-pet-info"><h3 data-pet-title>我的学习伙伴</h3><p data-pet-desc>一起完成学习任务，让小伙伴慢慢成长吧！</p><span class="wl-pet-level" data-pet-level>Lv.1 初识伙伴</span></div></div>' +
    '<div class="wl-pet-meter"><span data-pet-fill style="width:0%"></span></div><div class="wl-pet-next"><span data-pet-progress>累计完成 0 项任务</span><span data-pet-next>距离下一级还差 5 项</span></div>' +
    '<div class="wl-pet-head" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:17px"><strong style="font-size:13px">🐾 宠物成长权益</strong><small style="color:var(--muted);font-size:10px">升级后自动解锁</small></div><div class="wl-pet-perks" data-pet-perks></div>' +
    '<div class="wl-badge-wall"><div class="wl-badge-wall-head"><strong>🏅 我的徽章墙</strong><small data-badge-count>已获得 0 / 12 枚</small></div>' +
    '<div class="wl-badge-filters" role="group" aria-label="筛选徽章"><button type="button" class="wl-badge-filter active" data-badge-filter="all" aria-pressed="true">全部</button><button type="button" class="wl-badge-filter" data-badge-filter="earned" aria-pressed="false">已获得</button><button type="button" class="wl-badge-filter" data-badge-filter="locked" aria-pressed="false">未解锁</button></div>' +
    '<div class="wl-badge-grid" data-badge-grid aria-live="polite"></div></div>' +
    '<p style="margin-top:10px;color:var(--muted);font-size:10px;line-height:1.6">完成每日学习任务即可收集徽章。已获得的徽章会点亮，尚未解锁的徽章会显示目标；记录保存在当前设备。</p>';
  workbench.insertAdjacentElement("afterend", panel);
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
  function render() {
    const total = totalTasks();
    const level = currentLevel(total);
    const next = LEVELS.find(item => item.level === level.level + 1);
    const earned = BADGES.filter(item => total >= item.at);
    const progress = next ? Math.max(0, Math.min(100, (total - level.at) / (next.at - level.at) * 100)) : 100;
    $("[data-pet-avatar]", panel).textContent = level.pet;
    $("[data-pet-title]", panel).textContent = "我的学习伙伴 · " + level.name;
    $("[data-pet-desc]", panel).textContent = next ? "你们已经一起完成 " + total + " 项任务啦！继续努力，解锁下一个成长惊喜。" : "太厉害了！你们已经成为传奇搭档，所有宠物成长权益都已解锁！";
    $("[data-pet-level]", panel).textContent = "Lv." + level.level + " · " + level.name;
    $("[data-pet-fill]", panel).style.width = progress + "%";
    $("[data-pet-progress]", panel).textContent = "累计完成 " + total + " 项任务";
    $("[data-pet-next]", panel).textContent = next ? "距离下一级还差 " + (next.at - total) + " 项" : "已达到最高等级";
    $("[data-pet-perks]", panel).innerHTML = LEVELS.map(item =>
      '<span class="wl-pet-perk' + (total < item.at ? " locked" : "") + '">' + item.perkIcon + " " + item.perk + (total >= item.at ? " ✓" : " 🔒") + "</span>"
    ).join("");
    $("[data-badge-count]", panel).textContent = "已获得 " + earned.length + " / " + BADGES.length + " 枚";
    const visible = BADGES.filter(item => badgeFilter === "all" || (badgeFilter === "earned" ? total >= item.at : total < item.at));
    $("[data-badge-grid]", panel).innerHTML = visible.length ? visible.map(item => {
      const unlocked = total >= item.at;
      return '<div class="wl-badge' + (unlocked ? "" : " locked") + '" title="' + item.group + ' · ' + item.desc + '">' +
        '<span class="wl-badge-icon">' + (unlocked ? item.icon : "🔒") + '</span><span><b>' + item.name + '</b><small>' + item.desc + '</small>' +
        (unlocked ? '<span class="wl-badge-earned">✓ 已获得</span>' : '<small>还差 ' + (item.at - total) + ' 项</small>') + '</span></div>';
    }).join("") : '<div class="wl-badge-empty">这里暂时空空的，完成学习任务就能点亮徽章！</div>';
  }
  panel.addEventListener("click", event => {
    const button = event.target.closest("[data-badge-filter]");
    if (!button) return;
    badgeFilter = button.getAttribute("data-badge-filter") || "all";
    panel.querySelectorAll("[data-badge-filter]").forEach(item => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    render();
  });
  render();
  const observer = new MutationObserver(render);
  observer.observe(workbench, { childList:true, subtree:true });
  window.addEventListener("storage", render);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
else mount();
})();