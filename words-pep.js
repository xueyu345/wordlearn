/* 人教 PEP · 三年级起点 词库
 *
 * 按 PEP 教材真实单元组织，单元标题沿用课本 Unit 名，词汇取自课标词汇表。
 * 三、四年级对应上册内容，五、六年级对应下册内容（每册 6 个单元，这里取 4 个主单元）。
 * 只包含单元对象，供 words.js 用 ...PEP_UNITS 展开引入。
 */
window.PEP_UNITS = [
  /* ---------- 三年级 ---------- */
  {
    book: "pep", grade: 3, id: "pep-3-hello", name: "Hello!", en: "Unit 1 Hello!",
    emoji: "👋", color: "#3B82F6", soft: "#E8F1FF", desc: "打招呼、介绍自己和文具",
    words: [
      { w: "hello", ipa: "/həˈləʊ/", zh: "你好", emoji: "👋", en: "Hello! I'm Wu Binbin.", cn: "你好！我是吴彬彬。" },
      { w: "hi", ipa: "/haɪ/", zh: "嗨", emoji: "🙋", en: "Hi, I'm Sarah.", cn: "嗨，我是萨拉。" },
      { w: "goodbye", ipa: "/ˌɡʊdˈbaɪ/", zh: "再见", emoji: "👋", en: "Goodbye, Miss White!", cn: "再见，怀特老师！" },
      { w: "name", ipa: "/neɪm/", zh: "名字", emoji: "📛", en: "What's your name?", cn: "你叫什么名字？" },
      { w: "ruler", ipa: "/ˈruːlə(r)/", zh: "尺子", emoji: "📏", en: "I have a ruler.", cn: "我有一把尺子。" },
      { w: "pencil", ipa: "/ˈpensl/", zh: "铅笔", emoji: "✏️", en: "This is my pencil.", cn: "这是我的铅笔。" },
      { w: "eraser", ipa: "/ɪˈreɪzə(r)/", zh: "橡皮", emoji: "🧽", en: "I have an eraser.", cn: "我有一块橡皮。" },
      { w: "crayon", ipa: "/ˈkreɪən/", zh: "蜡笔", emoji: "🖍️", en: "Show me your crayon.", cn: "给我看看你的蜡笔。" },
      { w: "bag", ipa: "/bæɡ/", zh: "书包", emoji: "🎒", en: "My bag is heavy.", cn: "我的书包很重。" },
      { w: "book", ipa: "/bʊk/", zh: "书", emoji: "📕", en: "Open your book, please.", cn: "请打开你的书。" }
    ]
  },
  {
    book: "pep", grade: 3, id: "pep-3-colours", name: "Colours", en: "Unit 2 Colours",
    emoji: "🎨", color: "#F45D9E", soft: "#FFEAF5", desc: "认识颜色，学会问候",
    words: [
      { w: "red", ipa: "/red/", zh: "红色", emoji: "🔴", en: "I see red.", cn: "我看见红色。" },
      { w: "green", ipa: "/ɡriːn/", zh: "绿色", emoji: "🟢", en: "The tree is green.", cn: "树是绿色的。" },
      { w: "yellow", ipa: "/ˈjeləʊ/", zh: "黄色", emoji: "🟡", en: "The banana is yellow.", cn: "香蕉是黄色的。" },
      { w: "blue", ipa: "/bluː/", zh: "蓝色", emoji: "🔵", en: "The sky is blue.", cn: "天空是蓝色的。" },
      { w: "black", ipa: "/blæk/", zh: "黑色", emoji: "⚫", en: "I have a black cat.", cn: "我有一只黑猫。" },
      { w: "white", ipa: "/waɪt/", zh: "白色", emoji: "⚪", en: "Snow is white.", cn: "雪是白色的。" },
      { w: "brown", ipa: "/braʊn/", zh: "棕色", emoji: "🟤", en: "Colour it brown!", cn: "把它涂成棕色！" },
      { w: "orange", ipa: "/ˈɒrɪndʒ/", zh: "橙色", emoji: "🟠", en: "An orange is orange.", cn: "橙子是橙色的。" },
      { w: "morning", ipa: "/ˈmɔːnɪŋ/", zh: "早上", emoji: "🌅", en: "Good morning, Miss Green!", cn: "早上好，格林老师！" },
      { w: "afternoon", ipa: "/ˌɑːftəˈnuːn/", zh: "下午", emoji: "🌇", en: "Good afternoon, Mr Jones.", cn: "下午好，琼斯先生。" }
    ]
  },
  {
    book: "pep", grade: 3, id: "pep-3-look-at-me", name: "Look at me!", en: "Unit 3 Look at me!",
    emoji: "🙂", color: "#7057F5", soft: "#F0ECFF", desc: "身体部位，问问对方好不好",
    words: [
      { w: "face", ipa: "/feɪs/", zh: "脸", emoji: "😊", en: "Touch your face.", cn: "摸摸你的脸。" },
      { w: "ear", ipa: "/ɪə(r)/", zh: "耳朵", emoji: "👂", en: "I have two ears.", cn: "我有两只耳朵。" },
      { w: "eye", ipa: "/aɪ/", zh: "眼睛", emoji: "👁️", en: "Look at my eyes.", cn: "看我的眼睛。" },
      { w: "nose", ipa: "/nəʊz/", zh: "鼻子", emoji: "👃", en: "This is my nose.", cn: "这是我的鼻子。" },
      { w: "mouth", ipa: "/maʊθ/", zh: "嘴", emoji: "👄", en: "Open your mouth.", cn: "张开你的嘴。" },
      { w: "arm", ipa: "/ɑːm/", zh: "胳膊", emoji: "💪", en: "Wave your arms.", cn: "挥挥你的胳膊。" },
      { w: "hand", ipa: "/hænd/", zh: "手", emoji: "✋", en: "Clap your hands.", cn: "拍拍你的手。" },
      { w: "head", ipa: "/hed/", zh: "头", emoji: "🧑", en: "Nod your head.", cn: "点点头。" },
      { w: "body", ipa: "/ˈbɒdi/", zh: "身体", emoji: "🧍", en: "Move your body.", cn: "动动你的身体。" },
      { w: "leg", ipa: "/leɡ/", zh: "腿", emoji: "🦵", en: "I have long legs.", cn: "我的腿很长。" },
      { w: "foot", ipa: "/fʊt/", zh: "脚", emoji: "🦶", en: "My foot hurts.", cn: "我的脚疼。" },
      { w: "school", ipa: "/skuːl/", zh: "学校", emoji: "🏫", en: "Let's go to school!", cn: "我们一起去学校吧！" }
    ]
  },
  {
    book: "pep", grade: 3, id: "pep-3-animals", name: "We love animals", en: "Unit 4 We love animals",
    emoji: "🐼", color: "#D97706", soft: "#FFF4DE", desc: "动物朋友，问问这是什么",
    words: [
      { w: "duck", ipa: "/dʌk/", zh: "鸭子", emoji: "🦆", en: "It's a duck.", cn: "它是一只鸭子。" },
      { w: "pig", ipa: "/pɪɡ/", zh: "猪", emoji: "🐷", en: "The pig is pink.", cn: "这头猪是粉色的。" },
      { w: "cat", ipa: "/kæt/", zh: "猫", emoji: "🐱", en: "I like this cat.", cn: "我喜欢这只猫。" },
      { w: "bear", ipa: "/beə(r)/", zh: "熊", emoji: "🐻", en: "The bear is big.", cn: "那只熊很大。" },
      { w: "dog", ipa: "/dɒɡ/", zh: "狗", emoji: "🐶", en: "What's this? It's a dog.", cn: "这是什么？是一只狗。" },
      { w: "elephant", ipa: "/ˈelɪfənt/", zh: "大象", emoji: "🐘", en: "An elephant is very big.", cn: "大象非常大。" },
      { w: "monkey", ipa: "/ˈmʌŋki/", zh: "猴子", emoji: "🐵", en: "The monkey is funny.", cn: "这只猴子很有趣。" },
      { w: "bird", ipa: "/bɜːd/", zh: "鸟", emoji: "🐦", en: "A bird can fly.", cn: "鸟会飞。" },
      { w: "tiger", ipa: "/ˈtaɪɡə(r)/", zh: "老虎", emoji: "🐯", en: "Look at the tiger!", cn: "看那只老虎！" },
      { w: "panda", ipa: "/ˈpændə/", zh: "熊猫", emoji: "🐼", en: "I like pandas.", cn: "我喜欢熊猫。" },
      { w: "zoo", ipa: "/zuː/", zh: "动物园", emoji: "🦒", en: "Let's go to the zoo.", cn: "我们去动物园吧。" },
      { w: "funny", ipa: "/ˈfʌni/", zh: "有趣的", emoji: "😄", en: "The monkey is funny.", cn: "猴子很好玩。" }
    ]
  },

  /* ---------- 四年级 ---------- */
  {
    book: "pep", grade: 4, id: "pep-4-classroom", name: "My classroom", en: "Unit 1 My classroom",
    emoji: "🏫", color: "#3B82F6", soft: "#E8F1FF", desc: "教室里的东西和位置",
    words: [
      { w: "classroom", ipa: "/ˈklɑːsruːm/", zh: "教室", emoji: "🏫", en: "Our classroom is big.", cn: "我们的教室很大。" },
      { w: "window", ipa: "/ˈwɪndəʊ/", zh: "窗户", emoji: "🪟", en: "Open the window, please.", cn: "请打开窗户。" },
      { w: "door", ipa: "/dɔː(r)/", zh: "门", emoji: "🚪", en: "Close the door.", cn: "关上门。" },
      { w: "picture", ipa: "/ˈpɪktʃə(r)/", zh: "图画", emoji: "🖼️", en: "Look at this picture.", cn: "看这幅画。" },
      { w: "blackboard", ipa: "/ˈblækbɔːd/", zh: "黑板", emoji: "📋", en: "The teacher is at the blackboard.", cn: "老师在黑板前。" },
      { w: "light", ipa: "/laɪt/", zh: "灯", emoji: "💡", en: "Turn on the light.", cn: "开灯。" },
      { w: "computer", ipa: "/kəmˈpjuːtə(r)/", zh: "电脑", emoji: "💻", en: "There is a computer here.", cn: "这里有一台电脑。" },
      { w: "fan", ipa: "/fæn/", zh: "风扇", emoji: "🌀", en: "The fan is on.", cn: "风扇开着。" },
      { w: "wall", ipa: "/wɔːl/", zh: "墙", emoji: "🧱", en: "A map is on the wall.", cn: "墙上有一张地图。" },
      { w: "floor", ipa: "/flɔː(r)/", zh: "地板", emoji: "🟫", en: "The floor is clean.", cn: "地板很干净。" }
    ]
  },
  {
    book: "pep", grade: 4, id: "pep-4-schoolbag", name: "My schoolbag", en: "Unit 2 My schoolbag",
    emoji: "🎒", color: "#F45D9E", soft: "#FFEAF5", desc: "书包里的文具和课本",
    words: [
      { w: "schoolbag", ipa: "/ˈskuːlbæɡ/", zh: "书包", emoji: "🎒", en: "My schoolbag is heavy.", cn: "我的书包很重。" },
      { w: "notebook", ipa: "/ˈnəʊtbʊk/", zh: "笔记本", emoji: "📒", en: "I have a new notebook.", cn: "我有一个新笔记本。" },
      { w: "storybook", ipa: "/ˈstɔːribʊk/", zh: "故事书", emoji: "📖", en: "This storybook is fun.", cn: "这本故事书很有趣。" },
      { w: "candy", ipa: "/ˈkændi/", zh: "糖果", emoji: "🍬", en: "Don't eat too much candy.", cn: "别吃太多糖。" },
      { w: "toy", ipa: "/tɔɪ/", zh: "玩具", emoji: "🧸", en: "A toy is in my bag.", cn: "我包里有个玩具。" },
      { w: "key", ipa: "/kiː/", zh: "钥匙", emoji: "🔑", en: "Where is my key?", cn: "我的钥匙在哪？" },
      { w: "pencil box", ipa: "/ˈpensl bɒks/", zh: "铅笔盒", emoji: "🧰", en: "My pencil box is blue.", cn: "我的铅笔盒是蓝色的。" },
      { w: "maths book", ipa: "/mæθs bʊk/", zh: "数学书", emoji: "📐", en: "This is my maths book.", cn: "这是我的数学书。" },
      { w: "English book", ipa: "/ˈɪŋɡlɪʃ bʊk/", zh: "英语书", emoji: "📘", en: "Open your English book.", cn: "打开你的英语书。" },
      { w: "Chinese book", ipa: "/ˌtʃaɪˈniːz bʊk/", zh: "语文书", emoji: "📙", en: "I like my Chinese book.", cn: "我喜欢我的语文书。" }
    ]
  },
  {
    book: "pep", grade: 4, id: "pep-4-friends", name: "My friends", en: "Unit 3 My friends",
    emoji: "🧑‍🤝‍🧑", color: "#7057F5", soft: "#F0ECFF", desc: "描述好朋友的样子和性格",
    words: [
      { w: "friend", ipa: "/frend/", zh: "朋友", emoji: "🧑‍🤝‍🧑", en: "She is my best friend.", cn: "她是我最好的朋友。" },
      { w: "long", ipa: "/lɒŋ/", zh: "长的", emoji: "📏", en: "She has long hair.", cn: "她留着长头发。" },
      { w: "short", ipa: "/ʃɔːt/", zh: "短的；矮的", emoji: "📐", en: "He is short but strong.", cn: "他个子矮但很壮。" },
      { w: "tall", ipa: "/tɔːl/", zh: "高的", emoji: "🦒", en: "My brother is tall.", cn: "我哥哥很高。" },
      { w: "thin", ipa: "/θɪn/", zh: "瘦的", emoji: "🥢", en: "The boy is thin.", cn: "那个男孩很瘦。" },
      { w: "strong", ipa: "/strɒŋ/", zh: "强壮的", emoji: "💪", en: "He is very strong.", cn: "他非常强壮。" },
      { w: "quiet", ipa: "/ˈkwaɪət/", zh: "安静的", emoji: "🤫", en: "Please be quiet.", cn: "请安静。" },
      { w: "friendly", ipa: "/ˈfrendli/", zh: "友好的", emoji: "😊", en: "Our teacher is friendly.", cn: "我们的老师很友好。" },
      { w: "hair", ipa: "/heə(r)/", zh: "头发", emoji: "💇", en: "Her hair is black.", cn: "她的头发是黑色的。" },
      { w: "glasses", ipa: "/ˈɡlɑːsɪz/", zh: "眼镜", emoji: "👓", en: "He wears glasses.", cn: "他戴眼镜。" }
    ]
  },
  {
    book: "pep", grade: 4, id: "pep-4-home", name: "My home", en: "Unit 4 My home",
    emoji: "🏠", color: "#D97706", soft: "#FFF4DE", desc: "家里的房间和陈设",
    words: [
      { w: "home", ipa: "/həʊm/", zh: "家", emoji: "🏠", en: "I am at home now.", cn: "我现在在家。" },
      { w: "bedroom", ipa: "/ˈbedruːm/", zh: "卧室", emoji: "🛏️", en: "My bedroom is small.", cn: "我的卧室很小。" },
      { w: "living room", ipa: "/ˈlɪvɪŋ ruːm/", zh: "客厅", emoji: "🛋️", en: "We watch TV in the living room.", cn: "我们在客厅看电视。" },
      { w: "kitchen", ipa: "/ˈkɪtʃɪn/", zh: "厨房", emoji: "🍳", en: "Mum is in the kitchen.", cn: "妈妈在厨房里。" },
      { w: "bathroom", ipa: "/ˈbɑːθruːm/", zh: "浴室", emoji: "🛁", en: "The bathroom is clean.", cn: "浴室很干净。" },
      { w: "study", ipa: "/ˈstʌdi/", zh: "书房", emoji: "📚", en: "Dad is in the study.", cn: "爸爸在书房。" },
      { w: "bed", ipa: "/bed/", zh: "床", emoji: "🛏️", en: "The cat is on the bed.", cn: "猫在床上。" },
      { w: "sofa", ipa: "/ˈsəʊfə/", zh: "沙发", emoji: "🛋️", en: "Sit on the sofa, please.", cn: "请坐在沙发上。" },
      { w: "table", ipa: "/ˈteɪbl/", zh: "桌子", emoji: "🪑", en: "The book is on the table.", cn: "书在桌子上。" },
      { w: "fridge", ipa: "/frɪdʒ/", zh: "冰箱", emoji: "🧊", en: "Milk is in the fridge.", cn: "牛奶在冰箱里。" }
    ]
  },

  /* ---------- 五年级 ---------- */
  {
    book: "pep", grade: 5, id: "pep-5-like", name: "What's he like?", en: "Unit 1 What's he like?",
    emoji: "🧑‍🏫", color: "#3B82F6", soft: "#E8F1FF", desc: "描述人的性格和特点",
    words: [
      { w: "kind", ipa: "/kaɪnd/", zh: "和善的", emoji: "🤗", en: "Our maths teacher is kind.", cn: "我们的数学老师很和善。" },
      { w: "strict", ipa: "/strɪkt/", zh: "严格的", emoji: "😐", en: "Mr Li is strict but fair.", cn: "李老师严格但公平。" },
      { w: "polite", ipa: "/pəˈlaɪt/", zh: "有礼貌的", emoji: "🙇", en: "Be polite to others.", cn: "对别人要有礼貌。" },
      { w: "hard-working", ipa: "/ˌhɑːd ˈwɜːkɪŋ/", zh: "勤奋的", emoji: "💪", en: "She is hard-working.", cn: "她很勤奋。" },
      { w: "helpful", ipa: "/ˈhelpfl/", zh: "乐于助人的", emoji: "🤝", en: "He is helpful at school.", cn: "他在学校乐于助人。" },
      { w: "clever", ipa: "/ˈklevə(r)/", zh: "聪明的", emoji: "🧠", en: "My sister is clever.", cn: "我妹妹很聪明。" },
      { w: "shy", ipa: "/ʃaɪ/", zh: "害羞的", emoji: "😳", en: "The new boy is shy.", cn: "新来的男孩很害羞。" },
      { w: "funny", ipa: "/ˈfʌni/", zh: "滑稽的", emoji: "😄", en: "Our music teacher is funny.", cn: "我们的音乐老师很滑稽。" },
      { w: "young", ipa: "/jʌŋ/", zh: "年轻的", emoji: "🧒", en: "She looks young.", cn: "她看起来很年轻。" },
      { w: "old", ipa: "/əʊld/", zh: "年老的", emoji: "👴", en: "My grandpa is old.", cn: "我爷爷年纪大了。" }
    ]
  },
  {
    book: "pep", grade: 5, id: "pep-5-week", name: "My week", en: "Unit 2 My week",
    emoji: "📅", color: "#F45D9E", soft: "#FFEAF5", desc: "一周七天和周末安排",
    words: [
      { w: "Monday", ipa: "/ˈmʌndeɪ/", zh: "星期一", emoji: "1️⃣", en: "We have English on Monday.", cn: "我们星期一有英语课。" },
      { w: "Tuesday", ipa: "/ˈtjuːzdeɪ/", zh: "星期二", emoji: "2️⃣", en: "I play football on Tuesday.", cn: "我星期二踢足球。" },
      { w: "Wednesday", ipa: "/ˈwenzdeɪ/", zh: "星期三", emoji: "3️⃣", en: "Wednesday is a busy day.", cn: "星期三很忙。" },
      { w: "Thursday", ipa: "/ˈθɜːzdeɪ/", zh: "星期四", emoji: "4️⃣", en: "We have music on Thursday.", cn: "我们星期四有音乐课。" },
      { w: "Friday", ipa: "/ˈfraɪdeɪ/", zh: "星期五", emoji: "5️⃣", en: "Friday is my favourite day.", cn: "星期五是我最喜欢的一天。" },
      { w: "Saturday", ipa: "/ˈsætədeɪ/", zh: "星期六", emoji: "6️⃣", en: "I read books on Saturday.", cn: "我星期六看书。" },
      { w: "Sunday", ipa: "/ˈsʌndeɪ/", zh: "星期日", emoji: "7️⃣", en: "We visit grandma on Sunday.", cn: "我们星期日去看奶奶。" },
      { w: "weekend", ipa: "/ˌwiːkˈend/", zh: "周末", emoji: "🎉", en: "What do you do on the weekend?", cn: "你周末做什么？" },
      { w: "often", ipa: "/ˈɒfn/", zh: "经常", emoji: "🔁", en: "I often play ping-pong.", cn: "我经常打乒乓球。" },
      { w: "sometimes", ipa: "/ˈsʌmtaɪmz/", zh: "有时", emoji: "⏳", en: "Sometimes I watch TV.", cn: "有时我看电视。" }
    ]
  },
  {
    book: "pep", grade: 5, id: "pep-5-food", name: "What would you like?", en: "Unit 3 What would you like?",
    emoji: "🍽️", color: "#7057F5", soft: "#F0ECFF", desc: "点餐、说说想吃什么",
    words: [
      { w: "sandwich", ipa: "/ˈsænwɪtʃ/", zh: "三明治", emoji: "🥪", en: "I'd like a sandwich.", cn: "我想要一个三明治。" },
      { w: "salad", ipa: "/ˈsæləd/", zh: "沙拉", emoji: "🥗", en: "The salad is fresh.", cn: "沙拉很新鲜。" },
      { w: "hamburger", ipa: "/ˈhæmbɜːɡə(r)/", zh: "汉堡包", emoji: "🍔", en: "He likes hamburgers.", cn: "他喜欢汉堡包。" },
      { w: "ice cream", ipa: "/ˌaɪs ˈkriːm/", zh: "冰淇淋", emoji: "🍦", en: "Ice cream is sweet.", cn: "冰淇淋很甜。" },
      { w: "tea", ipa: "/tiː/", zh: "茶", emoji: "🍵", en: "Would you like some tea?", cn: "你想喝点茶吗？" },
      { w: "fresh", ipa: "/freʃ/", zh: "新鲜的", emoji: "🌿", en: "The fruit is fresh.", cn: "水果很新鲜。" },
      { w: "healthy", ipa: "/ˈhelθi/", zh: "健康的", emoji: "💚", en: "Vegetables are healthy.", cn: "蔬菜是健康的。" },
      { w: "delicious", ipa: "/dɪˈlɪʃəs/", zh: "美味的", emoji: "😋", en: "The soup is delicious.", cn: "汤很好喝。" },
      { w: "hot", ipa: "/hɒt/", zh: "辣的；热的", emoji: "🌶️", en: "This dish is too hot.", cn: "这道菜太辣了。" },
      { w: "sweet", ipa: "/swiːt/", zh: "甜的", emoji: "🍯", en: "I like sweet food.", cn: "我喜欢甜食。" }
    ]
  },
  {
    book: "pep", grade: 5, id: "pep-5-can-do", name: "What can you do?", en: "Unit 4 What can you do?",
    emoji: "🎯", color: "#D97706", soft: "#FFF4DE", desc: "说说自己会做什么",
    words: [
      { w: "sing", ipa: "/sɪŋ/", zh: "唱歌", emoji: "🎤", en: "I can sing English songs.", cn: "我会唱英文歌。" },
      { w: "dance", ipa: "/dɑːns/", zh: "跳舞", emoji: "💃", en: "She can dance well.", cn: "她跳舞跳得很好。" },
      { w: "draw", ipa: "/drɔː/", zh: "画画", emoji: "🎨", en: "Can you draw cartoons?", cn: "你会画卡通画吗？" },
      { w: "swim", ipa: "/swɪm/", zh: "游泳", emoji: "🏊", en: "My brother can swim.", cn: "我哥哥会游泳。" },
      { w: "cook", ipa: "/kʊk/", zh: "烹饪", emoji: "🍳", en: "Dad can cook noodles.", cn: "爸爸会做面条。" },
      { w: "play basketball", ipa: "/pleɪ ˈbɑːskɪtbɔːl/", zh: "打篮球", emoji: "🏀", en: "Let's play basketball.", cn: "我们去打篮球吧。" },
      { w: "play ping-pong", ipa: "/pleɪ ˈpɪŋpɒŋ/", zh: "打乒乓球", emoji: "🏓", en: "He can play ping-pong.", cn: "他会打乒乓球。" },
      { w: "kung fu", ipa: "/ˌkʊŋ ˈfuː/", zh: "功夫", emoji: "🥋", en: "I can do some kung fu.", cn: "我会一点功夫。" },
      { w: "speak", ipa: "/spiːk/", zh: "说（语言）", emoji: "🗣️", en: "She can speak English.", cn: "她会说英语。" },
      { w: "help", ipa: "/help/", zh: "帮助", emoji: "🤝", en: "Can you help me?", cn: "你能帮我吗？" }
    ]
  },

  /* ---------- 六年级 ---------- */
  {
    book: "pep", grade: 6, id: "pep-6-get-there", name: "How can I get there?", en: "Unit 1 How can I get there?",
    emoji: "🗺️", color: "#3B82F6", soft: "#E8F1FF", desc: "问路和指路",
    words: [
      { w: "science museum", ipa: "/ˈsaɪəns mjuˈziːəm/", zh: "科学博物馆", emoji: "🔬", en: "Where is the science museum?", cn: "科学博物馆在哪里？" },
      { w: "post office", ipa: "/ˈpəʊst ˈɒfɪs/", zh: "邮局", emoji: "📮", en: "The post office is near here.", cn: "邮局就在附近。" },
      { w: "bookstore", ipa: "/ˈbʊkstɔː(r)/", zh: "书店", emoji: "📚", en: "I often go to the bookstore.", cn: "我常去书店。" },
      { w: "cinema", ipa: "/ˈsɪnəmə/", zh: "电影院", emoji: "🎬", en: "The cinema is over there.", cn: "电影院在那边。" },
      { w: "hospital", ipa: "/ˈhɒspɪtl/", zh: "医院", emoji: "🏥", en: "Turn left at the hospital.", cn: "在医院那里左转。" },
      { w: "crossing", ipa: "/ˈkrɒsɪŋ/", zh: "十字路口", emoji: "🚦", en: "Stop at the crossing.", cn: "在十字路口停下。" },
      { w: "turn left", ipa: "/tɜːn left/", zh: "向左转", emoji: "⬅️", en: "Turn left here.", cn: "在这里左转。" },
      { w: "turn right", ipa: "/tɜːn raɪt/", zh: "向右转", emoji: "➡️", en: "Turn right at the corner.", cn: "在拐角处右转。" },
      { w: "straight", ipa: "/streɪt/", zh: "笔直地", emoji: "⬆️", en: "Go straight for five minutes.", cn: "直走五分钟。" },
      { w: "near", ipa: "/nɪə(r)/", zh: "在附近", emoji: "📍", en: "The zoo is near my home.", cn: "动物园在我家附近。" }
    ]
  },
  {
    book: "pep", grade: 6, id: "pep-6-ways", name: "Ways to go to school", en: "Unit 2 Ways to go to school",
    emoji: "🚦", color: "#F45D9E", soft: "#FFEAF5", desc: "上学方式和交通规则",
    words: [
      { w: "by bike", ipa: "/baɪ baɪk/", zh: "骑自行车", emoji: "🚲", en: "I go to school by bike.", cn: "我骑自行车上学。" },
      { w: "by bus", ipa: "/baɪ bʌs/", zh: "坐公共汽车", emoji: "🚌", en: "She goes to school by bus.", cn: "她坐公交车上学。" },
      { w: "by subway", ipa: "/baɪ ˈsʌbweɪ/", zh: "坐地铁", emoji: "🚇", en: "We go by subway.", cn: "我们坐地铁去。" },
      { w: "on foot", ipa: "/ɒn fʊt/", zh: "步行", emoji: "🚶", en: "I come to school on foot.", cn: "我步行来学校。" },
      { w: "train", ipa: "/treɪn/", zh: "火车", emoji: "🚆", en: "The train is fast.", cn: "火车很快。" },
      { w: "plane", ipa: "/pleɪn/", zh: "飞机", emoji: "✈️", en: "We go there by plane.", cn: "我们坐飞机去那里。" },
      { w: "ship", ipa: "/ʃɪp/", zh: "轮船", emoji: "🚢", en: "A ship is on the sea.", cn: "海上有一艘船。" },
      { w: "traffic", ipa: "/ˈtræfɪk/", zh: "交通", emoji: "🚥", en: "The traffic is heavy.", cn: "交通很拥挤。" },
      { w: "slow down", ipa: "/sləʊ daʊn/", zh: "慢下来", emoji: "🐢", en: "Slow down at the crossing.", cn: "过路口要减速。" },
      { w: "wait", ipa: "/weɪt/", zh: "等待", emoji: "⏸️", en: "Wait for the green light.", cn: "等绿灯再走。" }
    ]
  },
  {
    book: "pep", grade: 6, id: "pep-6-plan", name: "My weekend plan", en: "Unit 3 My weekend plan",
    emoji: "📝", color: "#7057F5", soft: "#F0ECFF", desc: "说说周末和假期的计划",
    words: [
      { w: "plan", ipa: "/plæn/", zh: "计划", emoji: "📝", en: "What are you going to do?", cn: "你打算做什么？" },
      { w: "tomorrow", ipa: "/təˈmɒrəʊ/", zh: "明天", emoji: "🌤️", en: "I will visit my aunt tomorrow.", cn: "我明天去看姑姑。" },
      { w: "next week", ipa: "/nekst wiːk/", zh: "下周", emoji: "📆", en: "We will go camping next week.", cn: "我们下周去露营。" },
      { w: "visit", ipa: "/ˈvɪzɪt/", zh: "拜访", emoji: "🚪", en: "I am going to visit my grandparents.", cn: "我要去看望祖父母。" },
      { w: "film", ipa: "/fɪlm/", zh: "电影", emoji: "🎞️", en: "Let's see a film tonight.", cn: "今晚我们去看电影吧。" },
      { w: "trip", ipa: "/trɪp/", zh: "旅行", emoji: "🧳", en: "Have a good trip!", cn: "旅途愉快！" },
      { w: "supermarket", ipa: "/ˈsuːpəmɑːkɪt/", zh: "超市", emoji: "🛒", en: "Mum is at the supermarket.", cn: "妈妈在超市。" },
      { w: "evening", ipa: "/ˈiːvnɪŋ/", zh: "傍晚", emoji: "🌆", en: "We will meet this evening.", cn: "我们今晚见。" },
      { w: "together", ipa: "/təˈɡeðə(r)/", zh: "一起", emoji: "👫", en: "Let's go together.", cn: "我们一起去吧。" },
      { w: "homework", ipa: "/ˈhəʊmwɜːk/", zh: "作业", emoji: "📓", en: "I will do my homework first.", cn: "我要先做作业。" }
    ]
  },
  {
    book: "pep", grade: 6, id: "pep-6-feelings", name: "How do you feel?", en: "Unit 6 How do you feel?",
    emoji: "😊", color: "#D97706", soft: "#FFF4DE", desc: "表达情绪，安慰别人",
    words: [
      { w: "happy", ipa: "/ˈhæpi/", zh: "高兴的", emoji: "😄", en: "I am happy today.", cn: "我今天很开心。" },
      { w: "sad", ipa: "/sæd/", zh: "难过的", emoji: "😢", en: "Why are you sad?", cn: "你为什么难过？" },
      { w: "angry", ipa: "/ˈæŋɡri/", zh: "生气的", emoji: "😠", en: "Don't be angry.", cn: "别生气。" },
      { w: "afraid", ipa: "/əˈfreɪd/", zh: "害怕的", emoji: "😨", en: "I am afraid of dogs.", cn: "我怕狗。" },
      { w: "worried", ipa: "/ˈwʌrid/", zh: "担心的", emoji: "😟", en: "Mum is worried about me.", cn: "妈妈担心我。" },
      { w: "excited", ipa: "/ɪkˈsaɪtɪd/", zh: "兴奋的", emoji: "🤩", en: "We are excited about the trip.", cn: "我们对这次旅行很兴奋。" },
      { w: "tired", ipa: "/ˈtaɪəd/", zh: "累的", emoji: "😴", en: "You look tired.", cn: "你看起来累了。" },
      { w: "ill", ipa: "/ɪl/", zh: "生病的", emoji: "🤒", en: "She is ill today.", cn: "她今天生病了。" },
      { w: "wear", ipa: "/weə(r)/", zh: "穿；戴", emoji: "👕", en: "You should wear warm clothes.", cn: "你应该穿暖和的衣服。" },
      { w: "see a doctor", ipa: "/siː ə ˈdɒktə(r)/", zh: "看医生", emoji: "🧑‍⚕️", en: "You should see a doctor.", cn: "你应该去看医生。" }
    ]
  }
];
