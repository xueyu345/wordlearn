(function () {
"use strict";
const STORE_KEY = "wordlearn_daily_workbench_v1";
const tasks = [
{id:"chinese",icon:"📚",name:"语文练习",desc:"生字与句子",href:"#/chinese"},
{id:"english",icon:"🔤",name:"英语单词",desc:"学习与闯关",href:"#/home/en"},
{id:"math",icon:"➗",name:"数学练习",desc:"错题与挑战",href:"#/home/math"},
{id:"tutor",icon:"👩‍🏫",name:"AI 讲题",desc:"解决不会的题",href:"#/tutor"},
{id:"paper",icon:"📝",name:"错题试卷",desc:"整理与练习",href:"#/paper"},
{id:"review",icon:"⭐",name:"今日复习",desc:"再巩固一下",href:"#/home/en"},
{id:"progress",icon:"📊",name:"学习进度",desc:"查看成长记录",href:"#/dashboard"},
{id:"settings",icon:"⚙️",name:"学习设置",desc:"目标与偏好",href:"#/settings"}
];
let offset = 0;
const $ = (s, r) => (r || document).querySelector(s);
const dateFor = (delta) => { const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()+delta); return d; };
const keyFor = (d) => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const readStore = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY)||"{}")||{}; } catch (_) { return {}; } };
const writeStore = (s) => { try { localStorage.setItem(STORE_KEY,JSON.stringify(s)); } catch (_) {} };
const css = [
".wl-workbench{margin:0 0 20px;padding:22px;border:1px solid var(--line);border-radius:26px;background:linear-gradient(115deg,rgba(255,255,255,.98),rgba(246,242,255,.96));box-shadow:var(--shadow-sm)}",
".wl-wb-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}",
".wl-wb-title{display:flex;align-items:center;gap:10px}.wl-wb-title-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:14px;background:#FFF1D9;font-size:22px}",
".wl-wb-title strong{display:block;font-size:19px}.wl-wb-title small{display:block;margin-top:4px;color:var(--muted);font-size:11.5px}",
".wl-wb-date{display:flex;align-items:center;gap:7px;padding:5px;border:1px solid var(--line);border-radius:99px;background:#fff}.wl-wb-date button{width:30px;height:30px;border-radius:50%;background:#F6F2FF;color:#6552C8;font-weight:900}.wl-wb-date button:disabled{opacity:.35;cursor:default}.wl-wb-date span{min-width:118px;text-align:center;font-size:12px;font-weight:800}",
".wl-wb-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center;margin-top:17px;padding:18px 20px;border-radius:20px;background:linear-gradient(110deg,#FFF3D9,#F0ECFF)}.wl-wb-hero h3{font-size:20px;line-height:1.4}.wl-wb-hero p{margin-top:5px;color:#786D83;font-size:12px;line-height:1.7}",
".wl-wb-actions{display:flex;gap:8px;flex-wrap:wrap}.wl-wb-actions button{min-height:38px;padding:0 14px;border-radius:99px;background:#fff;border:1px solid rgba(112,87,245,.15);color:#6552C8;font-size:12px;font-weight:800}.wl-wb-actions button.primary{color:#fff;background:linear-gradient(135deg,var(--orange),#FF6F61);border:0;box-shadow:0 4px 0 #D95732}",
".wl-wb-progress{display:flex;align-items:center;gap:12px;margin-top:16px}.wl-wb-track{height:10px;flex:1;overflow:hidden;border-radius:99px;background:#EEE8E0}.wl-wb-fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--orange),#F45D9E);transition:width .2s ease}.wl-wb-count{min-width:52px;text-align:right;font-size:12px;font-weight:900}",
".wl-wb-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:13px}.wl-wb-stat{padding:11px 13px;border:1px solid rgba(240,230,216,.9);border-radius:15px;background:rgba(255,255,255,.82)}.wl-wb-stat b{display:block;font-size:18px}.wl-wb-stat small{color:var(--muted);font-size:11px}",
".wl-wb-section{margin-top:17px}.wl-wb-section-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}.wl-wb-section-head strong{font-size:14px}.wl-wb-section-head small{color:var(--muted);font-size:11px}",
".wl-wb-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.wl-wb-tile{min-width:0;display:flex;flex-direction:column;gap:7px;padding:13px 12px;border:1px solid var(--line);border-radius:16px;background:#fff;transition:transform .18s ease,box-shadow .18s ease}.wl-wb-tile:hover{transform:translateY(-2px);box-shadow:var(--shadow-sm)}.wl-wb-tile i{font-style:normal;font-size:21px}.wl-wb-tile b{font-size:12px}.wl-wb-tile small{color:var(--muted);font-size:10.5px;line-height:1.4}",
".wl-wb-task-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.wl-wb-task{display:flex;align-items:center;gap:9px;padding:10px 11px;border:1px solid var(--line);border-radius:13px;background:#fff}.wl-wb-task input{width:17px;height:17px;accent-color:var(--purple);flex:0 0 auto}.wl-wb-task span{min-width:0;flex:1;font-size:12px;font-weight:800}.wl-wb-task small{color:var(--muted);font-size:10px}.wl-wb-task.done span{color:var(--muted);text-decoration:line-through}.wl-wb-note{margin-top:10px;color:var(--muted);font-size:10.5px;line-height:1.6}",
".wl-wb-toast{position:fixed;left:50%;bottom:24px;z-index:100;transform:translate(-50%,12px);padding:10px 16px;border-radius:99px;background:#342B45;color:#fff;font-size:12px;opacity:0;pointer-events:none;transition:all .2s ease}.wl-wb-toast.show{opacity:1;transform:translate(-50%,0)}",
"@media(max-width:760px){.wl-workbench{padding:16px;border-radius:21px}.wl-wb-hero{grid-template-columns:1fr}.wl-wb-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.wl-wb-task-list{grid-template-columns:1fr}.wl-wb-title strong{font-size:17px}}"
].join("");
function mount() {
 const view=$("#view-dashboard"); if(!view||$(".wl-workbench",view)) return;
 const body=$(".settings-body",view); if(!body) return;
 const quick=$(".dash-quick",body), section=document.createElement("section");
 section.className="wl-workbench"; section.setAttribute("aria-label","每日学习工作台");
 const tiles=tasks.map(t=>'<a class="wl-wb-tile" href="'+t.href+'"><i aria-hidden="true">'+t.icon+'</i><b>'+t.name+'</b><small>'+t.desc+'</small></a>').join("");
 section.innerHTML='<div class="wl-wb-head"><div class="wl-wb-title"><span class="wl-wb-title-icon" aria-hidden="true">☀️</span><div><strong>每日学习工作台</strong><small>每天一点点进步，积累大大的成长</small></div></div><div class="wl-wb-date"><button type="button" data-wb-prev aria-label="前一天">‹</button><span data-wb-date></span><button type="button" data-wb-next aria-label="后一天">›</button></div></div>'+
 '<div class="wl-wb-hero"><div><h3 data-wb-greeting>早上好，今天也要加油！</h3><p data-wb-subtitle>安排一点学习时间，完成任务后记得给自己一个鼓励。</p><div class="wl-wb-progress"><div class="wl-wb-track"><div class="wl-wb-fill" data-wb-fill style="width:0%"></div></div><span class="wl-wb-count" data-wb-count>0 / 8</span></div></div><div class="wl-wb-actions"><button class="primary" type="button" data-wb-start>开始今日学习 →</button><button type="button" data-wb-pet>🐾 看看小伙伴</button></div></div>'+
 '<div class="wl-wb-stats"><div class="wl-wb-stat"><b data-wb-points>0</b><small>今日积分</small></div><div class="wl-wb-stat"><b data-wb-streak>0 天</b><small>连续学习</small></div><div class="wl-wb-stat"><b data-wb-done>0 / 8</b><small>今日完成</small></div></div>'+
 '<div class="wl-wb-section"><div class="wl-wb-section-head"><strong>📚 学习快捷入口</strong><small>选择一个模块开始学习</small></div><div class="wl-wb-grid">'+tiles+'</div></div>'+
 '<div class="wl-wb-section"><div class="wl-wb-section-head"><strong>✅ 今日学习任务</strong><small>勾选完成的项目，自动保存</small></div><div class="wl-wb-task-list" data-wb-tasks></div></div>'+
 '<p class="wl-wb-note">任务勾选记录保存在当前设备浏览器中；学习模块中的单词、错题和星星仍使用原有记录方式。</p>';
 if(quick) body.insertBefore(section,quick); else body.prepend(section);
 const styleNode=document.createElement("style"); styleNode.textContent=css; document.head.appendChild(styleNode);
 const toast=document.createElement("div"); toast.className="wl-wb-toast"; toast.setAttribute("role","status"); document.body.appendChild(toast);
 let toastTimer;
 function notify(msg){toast.textContent=msg;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2100);}
 function render(){
  const d=dateFor(offset),key=keyFor(d),store=readStore(),record=store[key]||{done:[]},done=Array.isArray(record.done)?record.done:[];
  const count=done.length,percent=Math.round(count/tasks.length*100),label=offset===0?"今天":offset===-1?"昨天":(d.getMonth()+1)+"月"+d.getDate()+"日";
  $("[data-wb-date]",section).textContent=label+" · "+key;
  $("[data-wb-prev]",section).disabled=offset<=-30;$("[data-wb-next]",section).disabled=offset>=0;
  $("[data-wb-greeting]",section).textContent=offset===0?"早上好，今天也要加油！":label+"的学习计划";
  $("[data-wb-subtitle]",section).textContent=count===tasks.length?"太棒了！今天的计划已经全部完成。":"已完成 "+count+" 项，还剩 "+(tasks.length-count)+" 项。一步一步来就很好。";
  $("[data-wb-fill]",section).style.width=percent+"%";$("[data-wb-count]",section).textContent=count+" / "+tasks.length;
  $("[data-wb-done]",section).textContent=count+" / "+tasks.length;$("[data-wb-points]",section).textContent=count*5;
  const streak=$("#streakCount");$("[data-wb-streak]",section).textContent=(streak?streak.textContent:"0")+" 天";
  $("[data-wb-tasks]",section).innerHTML=tasks.map(t=>{const checked=done.includes(t.id);return '<label class="wl-wb-task'+(checked?" done":"")+'"><input type="checkbox" data-wb-check="'+t.id+'" '+(checked?"checked":"")+'><span>'+t.icon+" "+t.name+'</span><small>'+(checked?"已完成":"待完成")+"</small></label>";}).join("");
  $("[data-wb-start]",section).textContent=count===0?"开始今日学习 →":count===tasks.length?"再复习一次 →":"继续今日学习 →";$("[data-wb-start]",section).disabled=offset>0;
 }
 section.addEventListener("change",e=>{const input=e.target.closest("[data-wb-check]");if(!input)return;const store=readStore(),key=keyFor(dateFor(offset)),record=store[key]||{done:[]},done=new Set(Array.isArray(record.done)?record.done:[]);if(input.checked)done.add(input.dataset.wbCheck);else done.delete(input.dataset.wbCheck);record.done=Array.from(done);store[key]=record;writeStore(store);render();});
 $("[data-wb-prev]",section).addEventListener("click",()=>{offset=Math.max(-30,offset-1);render();});
 $("[data-wb-next]",section).addEventListener("click",()=>{offset=Math.min(0,offset+1);render();});
 $("[data-wb-start]",section).addEventListener("click",()=>{const record=readStore()[keyFor(dateFor(offset))]||{done:[]};const next=tasks.find(t=>!(record.done||[]).includes(t.id));if(next)location.hash=next.href;else notify("今天的任务都完成啦，真棒！");});
 $("[data-wb-pet]",section).addEventListener("click",()=>notify("🐾 小伙伴说：你已经很棒啦，继续保持好奇心！"));
 render();
 new MutationObserver(()=>{if(view.classList.contains("active"))render();}).observe(view,{attributes:true,attributeFilter:["class"]});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();