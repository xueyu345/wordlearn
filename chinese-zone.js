/* Wordlearn · Chinese learning zone
 * Initial grade-level practice samples; not a complete official textbook transcription.
 */
(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const gradeData = {
    1: [
      ["天","tiān","大","天空","蓝蓝的天空飘着白云。"],["地","dì","土","土地","小树在土地里慢慢长大。"],["人","rén","人","大人","我们要做诚实的人。"],["口","kǒu","口","门口","门口有一棵高高的树。"],["日","rì","日","日子","今天是快乐的日子。"],["月","yuè","月","月亮","弯弯的月亮挂在夜空。"],["山","shān","山","高山","远处有一座绿色的高山。"],["水","shuǐ","水","河水","清清的河水向前流。"],["火","huǒ","火","火苗","节日的灯光像小小的火苗。"],["木","mù","木","木头","木头可以做成小凳子。"],["禾","hé","禾","禾苗","田里的禾苗喝饱了水。"],["云","yún","二","白云","白云像棉花一样柔软。"],["雨","yǔ","雨","下雨","下雨了，我们撑起小雨伞。"],["风","fēng","风","微风","微风轻轻吹过树梢。"],["花","huā","艹","花朵","花园里的花朵开了。"],["鸟","niǎo","鸟","小鸟","小鸟站在枝头唱歌。"]],
    2: [
      ["春","chūn","日","春天","春天来了，小草探出了头。"],["冬","dōng","夂","冬天","冬天的早晨有些寒冷。"],["雪","xuě","雨","雪花","雪花落在屋顶上。"],["柳","liǔ","木","柳树","河边的柳树长出了新芽。"],["桃","táo","木","桃花","粉红的桃花开满枝头。"],["杏","xìng","木","杏树","院子里的杏树结了果子。"],["园","yuán","囗","花园","我们在花园里观察昆虫。"],["孔","kǒng","子","孔雀","孔雀展开了美丽的羽毛。"],["桥","qiáo","木","石桥","小河上有一座石桥。"],["群","qún","羊","一群","一群小鱼在水里游来游去。"],["队","duì","阝","队伍","同学们排着整齐的队伍。"],["旗","qí","方","红旗","操场上的红旗迎风飘扬。"],["铜","tóng","钅","铜号","小朋友吹响了铜号。"],["杨","yáng","木","杨树","高大的杨树为我们遮阳。"],["壮","zhuàng","士","强壮","每天运动让身体更强壮。"],["桐","tóng","木","梧桐","梧桐叶在秋风中摇动。"]],
    3: [
      ["晨","chén","日","早晨","早晨的校园充满了读书声。"],["绒","róng","纟","绒毛","小猫身上的绒毛十分柔软。"],["球","qiú","王","足球","放学后我们去操场踢足球。"],["汉","hàn","氵","汉字","汉字有着悠久的历史。"],["艳","yàn","色","鲜艳","鲜艳的花朵吸引了蝴蝶。"],["服","fú","月","衣服","妈妈把干净的衣服收好。"],["静","jìng","青","安静","图书馆里需要保持安静。"],["停","tíng","亻","停止","雨停了，天空出现彩虹。"],["粗","cū","米","粗心","做完题要检查，不能粗心。"],["影","yǐng","彡","影子","太阳下我们的影子变长了。"],["落","luò","艹","落叶","秋天的落叶铺满小路。"],["荒","huāng","艹","荒野","探险队走过安静的荒野。"],["笛","dí","竹","笛子","清脆的笛声从窗外传来。"],["舞","wǔ","夕","跳舞","大家围成圆圈快乐地跳舞。"],["猜","cāi","犭","猜想","我猜明天会是晴天。"],["扬","yáng","扌","表扬","老师表扬了认真读书的同学。"]],
    4: [
      ["潮","cháo","氵","潮水","潮水轻轻拍打着岸边。"],["据","jù","扌","根据","我们要根据事实表达想法。"],["堤","dī","土","堤岸","人们沿着堤岸散步。"],["阔","kuò","门","宽阔","宽阔的田野一眼望不到边。"],["盼","pàn","目","盼望","我盼望着周末去看望奶奶。"],["滚","gǔn","氵","滚动","圆球沿着斜坡滚动起来。"],["顿","dùn","页","顿时","听到好消息，大家顿时笑了。"],["逐","zhú","辶","逐渐","天气逐渐变得暖和。"],["犹","yóu","犭","犹如","湖面犹如一面明亮的镜子。"],["崩","bēng","山","崩塌","雨水冲刷后，山坡出现了崩塌。"],["震","zhèn","雨","地震","地震演练时要听从老师指挥。"],["余","yú","人","剩余","我们把剩余的纸张整理好。"],["淘","táo","氵","淘气","淘气的小狗追着皮球跑。"],["鹅","é","鸟","白鹅","白鹅在池塘边慢慢游水。"],["卵","luǎn","卩","鸟卵","鸟妈妈小心地守护鸟卵。"],["坑","kēng","土","土坑","小朋友在沙地里挖了一个土坑。"]],
    5: [
      ["毯","tǎn","毛","地毯","柔软的地毯让房间更温暖。"],["陈","chén","阝","陈列","博物馆里陈列着古老的器物。"],["裳","shang","衣","衣裳","舞台上的衣裳色彩鲜艳。"],["虹","hóng","虫","彩虹","雨后天空出现了一道彩虹。"],["蹄","tí","足","马蹄","马蹄声从远处传来。"],["腐","fǔ","肉","豆腐","奶奶做的豆腐鲜嫩可口。"],["稍","shāo","禾","稍微","请把声音稍微调小一点。"],["微","wēi","彳","微笑","她微笑着向大家问好。"],["幽","yōu","幺","幽静","山谷里有一条幽静的小路。"],["雅","yǎ","隹","优雅","白天鹅优雅地游过湖面。"],["案","àn","木","答案","请把答案写在横线上。"],["拙","zhuō","扌","笨拙","小企鹅走起路来有些笨拙。"],["薄","báo","艹","薄纸","这张薄纸可以折成小船。"],["糊","hú","米","模糊","玻璃上的水汽让景色变得模糊。"],["恍","huǎng","忄","恍惚","他听得入神，恍若置身故事中。"],["德","dé","彳","品德","诚实守信是一种可贵的品德。"]],
    6: [
      ["瀑","pù","氵","瀑布","山间的瀑布发出清亮的声音。"],["津","jīn","氵","津津有味","妹妹津津有味地读着故事。"],["俏","qiào","亻","俏丽","春天的花朵显得格外俏丽。"],["桨","jiǎng","木","船桨","爷爷用船桨慢慢划船。"],["暇","xiá","日","闲暇","闲暇时我喜欢读书和画画。"],["峭","qiào","山","陡峭","山路旁有陡峭的岩壁。"],["躯","qū","身","身躯","小树挺直身躯迎接阳光。"],["魁","kuí","鬼","魁梧","那位叔叔身材魁梧。"],["婉","wǎn","女","婉转","鸟儿婉转的歌声十分动听。"],["挠","náo","扌","阻挠","遇到困难也不要轻易放弃。"],["庸","yōng","广","平庸","坚持学习能让每一天更充实。"],["劈","pī","刀","劈开","木匠小心地劈开木板。"],["寝","qǐn","宀","寝室","大家把寝室整理得整整齐齐。"],["频","pín","页","频繁","频繁使用电子产品要注意休息。"],["朦","méng","月","朦胧","清晨的远山笼罩在朦胧雾气中。"],["胧","lóng","月","朦胧","月光下的树影有些朦胧。"]]
  };
  const sentenceData = {
    1: [["观察句","太阳出来了，小鸟在树枝上唱歌。","读一读，找出句子里写到的事物。"],["想象句","弯弯的月亮像一只小船。","说一说，月亮还像什么？"],["表达句","我和小伙伴一起整理书包。","试着说说你每天会做的一件事。"]],
    2: [["描写句","春风轻轻吹过，柳枝在河边跳舞。","找出描写动作的词语。"],["比喻句","雪花像一片片白色的羽毛落下来。","想一想，还能用什么比喻雪花？"],["连贯句","放学后，我先洗手，再认真完成作业。","用“先……再……”说一句话。"]],
    3: [["观察句","清晨，校园里传来清脆的读书声。","找出句子中的时间和声音。"],["拟人句","秋风唱着歌，把金黄的树叶送到地面。","说说句子把秋风当成了什么。"],["感受句","看到大家互相帮助，我的心里暖暖的。","说说你什么时候有过这样的感受。"]],
    4: [["描写句","雨后的山林空气清新，树叶上闪着晶莹的水珠。","找出描写景物的词语。"],["顺序句","清晨我们出发，中午到达山脚，傍晚返回家中。","说说句子按照什么顺序写。"],["想象句","夜空中的星星眨着眼睛，仿佛在和我们打招呼。","找一找句子中的想象。"]],
    5: [["细节句","她轻轻推开窗户，微风便带着花香跑进屋里。","圈出表现动作轻柔的词语。"],["抒情句","每当想起那次帮助，我心里总会涌起一阵感动。","说说句子表达了怎样的心情。"],["写景句","远处的山峰披着薄雾，近处的小溪映着阳光。","句子从哪两个角度描写景物？"]],
    6: [["排比句","操场上有奔跑的身影，有响亮的口号，也有灿烂的笑脸。","体会排比句带来的表达效果。"],["转折句","虽然路程很远，但是我们依然准时到达。","找出表示转折关系的关联词。"],["感悟句","真正的成长，不只是学会知识，更是懂得担当与分享。","说说你对这句话的理解。"]]
  };
  const prompts = ["认真","发现","勇敢","整齐","突然","因为……所以……","虽然……但是……","一边……一边……","不仅……还……"];
  const keyFor = (grade) => "wordlearn.chinese.v1.g" + grade;
  let activeTab = "characters";
  let currentPrompt = 0;
  let currentGrade = 1;
  let saved = { mastered: [], sentences: [] };
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  const gradeName = (n) => ["","一年级","二年级","三年级","四年级","五年级","六年级"][n] || "一年级";
  function loadState() {
    try { saved = JSON.parse(localStorage.getItem(keyFor(currentGrade)) || '{"mastered":[],"sentences":[]}'); }
    catch (_) { saved = { mastered: [], sentences: [] }; }
    if (!saved || !Array.isArray(saved.mastered) || !Array.isArray(saved.sentences)) saved = { mastered: [], sentences: [] };
  }
  function saveState() {
    try { localStorage.setItem(keyFor(currentGrade), JSON.stringify(saved)); }
    catch (_) { /* private browsing storage may be unavailable */ }
  }
  function currentWords() { return gradeData[currentGrade] || gradeData[1]; }
  function renderCharacters() {
    const grid = $("#cnCharacterGrid");
    if (!grid) return;
    const query = ($("#cnSearch")?.value || "").trim().toLowerCase();
    const rows = currentWords().filter((w) => w.join(" ").toLowerCase().includes(query));
    grid.innerHTML = rows.map((w) => {
      const done = saved.mastered.includes(w[0]);
      return '<article class="cn-char-card' + (done ? ' mastered' : '') + '">' +
        '<div class="cn-char-main">' + esc(w[0]) + '</div><div class="cn-char-pinyin">' + esc(w[1]) + '</div>' +
        '<div class="cn-char-meta">部首：' + esc(w[2]) + '</div><div class="cn-char-words">组词：' + esc(w[3]) + '</div>' +
        '<div class="cn-char-example">' + esc(w[4]) + '</div><div class="cn-char-actions">' +
        '<button class="cn-mini-btn" type="button" data-cn-speak="' + esc(w[0]) + '">🔊 听读</button>' +
        '<button class="cn-mini-btn ' + (done ? 'done' : '') + '" type="button" data-cn-master="' + esc(w[0]) + '">' + (done ? '✓ 已认识' : '标记认识') + '</button></div></article>';
    }).join("") || '<p class="chinese-empty">没有找到匹配的生字，试试其他关键词。</p>';
    $("#cnCount").textContent = "本年级 " + currentWords().length + " 个练习字 · 已认识 " + saved.mastered.length + " 个";
  }
  function renderSentences() {
    const list = $("#cnSentenceList");
    if (!list) return;
    list.innerHTML = (sentenceData[currentGrade] || sentenceData[1]).map((item) =>
      '<article class="cn-sentence-card"><p>' + esc(item[1]) + '</p><small>' + esc(item[0]) + ' · ' + esc(item[2]) + '</small>' +
      '<button type="button" data-cn-speak="' + esc(item[1]) + '">🔊 朗读例句</button></article>'
    ).join("");
    $("#cnCount").textContent = "本年级 " + (sentenceData[currentGrade] || []).length + " 组表达示例";
  }
  function renderHistory() {
    const box = $("#cnHistory");
    if (!box) return;
    box.innerHTML = saved.sentences.length ? saved.sentences.slice().reverse().map((item) =>
      '<div class="cn-history-item">' + esc(item.text) + '<small>' + esc(item.word) + ' · ' + esc(item.date) + '</small></div>'
    ).join("") : '<p class="chinese-empty">还没有保存的句子，写下第一句吧！</p>';
  }
  function showTab(tab) {
    activeTab = tab;
    document.querySelectorAll("[data-cn-tab]").forEach((button) => {
      const on = button.dataset.cnTab === tab;
      button.classList.toggle("active", on);
      button.setAttribute("aria-selected", String(on));
    });
    $("#cnCharacters").hidden = tab !== "characters";
    $("#cnSentences").hidden = tab !== "sentences";
    $("#cnPractice").hidden = tab !== "practice";
    $("#cnSearch").hidden = tab === "practice";
    $("#cnCount").hidden = tab === "practice";
    $("#cnSearch").value = "";
    if (tab === "characters") renderCharacters();
    if (tab === "sentences") renderSentences();
    if (tab === "practice") { renderHistory(); renderPrompt(); }
  }
  function renderPrompt() {
    $("#cnPromptWord").textContent = prompts[currentPrompt];
    $("#cnPromptTitle").textContent = "用“" + prompts[currentPrompt] + "”写一句话";
    $("#cnPromptText").textContent = "想一想这个词语或句式的意思，再写一个完整、通顺的句子。";
    $("#cnAnswer").value = "";
  }
  function renderChineseZone() {
    const gradeSelect = $("#gradeSelect");
    currentGrade = Math.max(1, Math.min(6, Number(gradeSelect ? gradeSelect.value : 1) || 1));
    loadState();
    $("#chineseGradeNote").textContent = "人教版学习方向 · " + gradeName(currentGrade) + " · 基础练习";
    showTab(activeTab);
  }
  document.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-cn-tab]");
    if (tab) { showTab(tab.dataset.cnTab); return; }
    const master = event.target.closest("[data-cn-master]");
    if (master) {
      const char = master.dataset.cnMaster;
      saved.mastered = saved.mastered.includes(char) ? saved.mastered.filter((x) => x !== char) : saved.mastered.concat(char);
      saveState(); renderCharacters(); return;
    }
    const speak = event.target.closest("[data-cn-speak]");
    if (speak) {
      const text = speak.dataset.cnSpeak;
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "zh-CN"; utterance.rate = 0.82;
        window.speechSynthesis.speak(utterance);
      }
      return;
    }
    if (event.target.closest("#cnNewPrompt")) {
      currentPrompt = (currentPrompt + 1) % prompts.length; renderPrompt(); return;
    }
    if (event.target.closest("#cnSaveAnswer")) {
      const text = ($("#cnAnswer").value || "").trim();
      if (text.length < 4) { $("#cnPracticeNote").textContent = "再多写几个字，试着组成一个完整的句子吧。"; return; }
      saved.sentences.push({ text, word: prompts[currentPrompt], date: new Date().toLocaleDateString("zh-CN") });
      saved.sentences = saved.sentences.slice(-30);
      saveState(); renderHistory();
      $("#cnPracticeNote").textContent = "保存成功！继续练习，让表达越来越清楚。";
    }
  });
  const search = document.addEventListener("input", (event) => {
    if (event.target && event.target.id === "cnSearch") renderCharacters();
  });
  document.addEventListener("DOMContentLoaded", () => {
    const gradeSelect = $("#gradeSelect");
    if (gradeSelect) gradeSelect.addEventListener("change", () => {
      if (location.hash.startsWith("#/chinese")) renderChineseZone();
    });
  }, { once: true });
  window.renderChineseZone = renderChineseZone;
  if (location.hash.startsWith("#/chinese")) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderChineseZone, { once: true });
    else renderChineseZone();
  }
})();
