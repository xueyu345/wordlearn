"use strict";
/*
 * 词库唯一真源。改完这里运行 `node tools/build-words-json.js` 生成 words.json。
 * 生产环境不会加载本文件，页面只读取 words.json。
 * 单元按 grade 字段归属年级；分年级内容在同目录的 words-grade-*.js 里。
 */
window.WORD_DATA = {
  version: 2,
  goal: 10,
  grades: [1, 2, 3, 4, 5, 6],
  defaultGrade: 3,
  units: [
    // 一二年级（words-grade-12.js）
    ...window.GRADE_12_UNITS,
    // 三年级：下面的基础单元

    {
      grade: 3, id: "animals", name: "动物朋友", en: "Animals", emoji: "🐾",
      color: "#FF8A3D", soft: "#FFF0E3", desc: "和 12 位动物朋友打个招呼",
      words: [
        { w: "cat", ipa: "/kæt/", zh: "猫", emoji: "🐱", en: "A cat likes fish.", cn: "猫喜欢鱼。" },
        { w: "dog", ipa: "/dɒɡ/", zh: "狗", emoji: "🐶", en: "My dog can run fast.", cn: "我的狗跑得很快。" },
        { w: "bird", ipa: "/bɜːd/", zh: "鸟", emoji: "🐦", en: "The bird is singing.", cn: "小鸟在唱歌。" },
        { w: "fish", ipa: "/fɪʃ/", zh: "鱼", emoji: "🐟", en: "Fish live in water.", cn: "鱼儿生活在水里。" },
        { w: "rabbit", ipa: "/ˈræbɪt/", zh: "兔子", emoji: "🐰", en: "The rabbit has long ears.", cn: "兔子有长长的耳朵。" },
        { w: "monkey", ipa: "/ˈmʌŋki/", zh: "猴子", emoji: "🐵", en: "Monkeys love bananas.", cn: "猴子最喜欢香蕉。" },
        { w: "tiger", ipa: "/ˈtaɪɡə(r)/", zh: "老虎", emoji: "🐯", en: "The tiger is big and strong.", cn: "老虎又大又强壮。" },
        { w: "panda", ipa: "/ˈpændə/", zh: "熊猫", emoji: "🐼", en: "Pandas eat bamboo.", cn: "熊猫爱吃竹子。" },
        { w: "elephant", ipa: "/ˈelɪfənt/", zh: "大象", emoji: "🐘", en: "An elephant has a long nose.", cn: "大象有长长的鼻子。" },
        { w: "lion", ipa: "/ˈlaɪən/", zh: "狮子", emoji: "🦁", en: "The lion is the king of animals.", cn: "狮子是动物之王。" },
        { w: "duck", ipa: "/dʌk/", zh: "鸭子", emoji: "🦆", en: "The duck can swim well.", cn: "鸭子很会游泳。" },
        { w: "horse", ipa: "/hɔːs/", zh: "马", emoji: "🐴", en: "I can ride a horse.", cn: "我会骑马。" }
      ]
    },
    {
      grade: 3, id: "fruits", name: "水果蔬菜", en: "Fruits & Veggies", emoji: "🍎",
      color: "#F85C70", soft: "#FFEBEE", desc: "甜甜的水果，绿绿的蔬菜",
      words: [
        { w: "apple", ipa: "/ˈæpl/", zh: "苹果", emoji: "🍎", en: "I eat an apple every day.", cn: "我每天吃一个苹果。" },
        { w: "banana", ipa: "/bəˈnɑːnə/", zh: "香蕉", emoji: "🍌", en: "Bananas are sweet.", cn: "香蕉甜甜的。" },
        { w: "orange", ipa: "/ˈɒrɪndʒ/", zh: "橙子", emoji: "🍊", en: "This orange is juicy.", cn: "这个橙子多汁。" },
        { w: "pear", ipa: "/peə(r)/", zh: "梨", emoji: "🍐", en: "The pear is green and sweet.", cn: "梨又绿又甜。" },
        { w: "grape", ipa: "/ɡreɪp/", zh: "葡萄", emoji: "🍇", en: "I like purple grapes.", cn: "我喜欢紫葡萄。" },
        { w: "strawberry", ipa: "/ˈstrɔːbəri/", zh: "草莓", emoji: "🍓", en: "Strawberries are red and sweet.", cn: "草莓又红又甜。" },
        { w: "watermelon", ipa: "/ˈwɔːtəmelən/", zh: "西瓜", emoji: "🍉", en: "Watermelon is cool in summer.", cn: "夏天吃西瓜真凉快。" },
        { w: "tomato", ipa: "/təˈmɑːtəʊ/", zh: "西红柿", emoji: "🍅", en: "A tomato is red and round.", cn: "西红柿又红又圆。" },
        { w: "carrot", ipa: "/ˈkærət/", zh: "胡萝卜", emoji: "🥕", en: "Rabbits like carrots.", cn: "兔子喜欢胡萝卜。" },
        { w: "potato", ipa: "/pəˈteɪtəʊ/", zh: "土豆", emoji: "🥔", en: "My mum cooks potatoes for dinner.", cn: "妈妈晚餐做土豆。" },
        { w: "peach", ipa: "/piːtʃ/", zh: "桃子", emoji: "🍑", en: "The peach is soft and sweet.", cn: "桃子又软又甜。" },
        { w: "lemon", ipa: "/ˈlemən/", zh: "柠檬", emoji: "🍋", en: "The lemon is very sour.", cn: "柠檬非常酸。" }
      ]
    },
    {
      grade: 3, id: "colors", name: "缤纷颜色", en: "Colors", emoji: "🌈",
      color: "#E85D9E", soft: "#FFEAF5", desc: "把彩虹装进口袋里",
      words: [
        { w: "red", ipa: "/red/", zh: "红色", emoji: "🔴", en: "The apple is red.", cn: "苹果是红色的。" },
        { w: "blue", ipa: "/bluː/", zh: "蓝色", emoji: "🔵", en: "The sky is blue.", cn: "天空是蓝色的。" },
        { w: "yellow", ipa: "/ˈjeləʊ/", zh: "黄色", emoji: "🟡", en: "The sun is yellow.", cn: "太阳是黄色的。" },
        { w: "green", ipa: "/ɡriːn/", zh: "绿色", emoji: "🟢", en: "The leaves are green.", cn: "叶子是绿色的。" },
        { w: "black", ipa: "/blæk/", zh: "黑色", emoji: "⚫", en: "My cat is black.", cn: "我的猫是黑色的。" },
        { w: "white", ipa: "/waɪt/", zh: "白色", emoji: "⚪", en: "Snow is white.", cn: "雪是白色的。" },
        { w: "pink", ipa: "/pɪŋk/", zh: "粉色", emoji: "🩷", en: "She has a pink bag.", cn: "她有一个粉色的书包。" },
        { w: "purple", ipa: "/ˈpɜːpl/", zh: "紫色", emoji: "🟣", en: "Grapes can be purple.", cn: "葡萄可以是紫色的。" },
        { w: "orange", ipa: "/ˈɒrɪndʒ/", zh: "橙色", emoji: "🟠", en: "The pumpkin is orange.", cn: "南瓜是橙色的。" },
        { w: "brown", ipa: "/braʊn/", zh: "棕色", emoji: "🟤", en: "The bear is brown.", cn: "小熊是棕色的。" }
      ]
    },
    {
      grade: 3, id: "numbers", name: "数字 1–12", en: "Numbers", emoji: "🔢",
      color: "#7C5CFF", soft: "#F0ECFF", desc: "从 one 数到 twelve",
      words: [
        { w: "one", ipa: "/wʌn/", zh: "一", emoji: "1️⃣", en: "I have one nose.", cn: "我有一个鼻子。" },
        { w: "two", ipa: "/tuː/", zh: "二", emoji: "2️⃣", en: "I have two eyes.", cn: "我有两只眼睛。" },
        { w: "three", ipa: "/θriː/", zh: "三", emoji: "3️⃣", en: "There are three cats.", cn: "有三只猫。" },
        { w: "four", ipa: "/fɔː(r)/", zh: "四", emoji: "4️⃣", en: "A dog has four legs.", cn: "狗有四条腿。" },
        { w: "five", ipa: "/faɪv/", zh: "五", emoji: "5️⃣", en: "I have five fingers.", cn: "我有五根手指。" },
        { w: "six", ipa: "/sɪks/", zh: "六", emoji: "6️⃣", en: "Six birds are in the tree.", cn: "树上有六只鸟。" },
        { w: "seven", ipa: "/ˈsevn/", zh: "七", emoji: "7️⃣", en: "A week has seven days.", cn: "一周有七天。" },
        { w: "eight", ipa: "/eɪt/", zh: "八", emoji: "8️⃣", en: "A spider has eight legs.", cn: "蜘蛛有八条腿。" },
        { w: "nine", ipa: "/naɪn/", zh: "九", emoji: "9️⃣", en: "Nine stars are in the sky.", cn: "天上有九颗星星。" },
        { w: "ten", ipa: "/ten/", zh: "十", emoji: "🔟", en: "Count from one to ten.", cn: "从一数到十。" },
        { w: "eleven", ipa: "/ɪˈlevn/", zh: "十一", emoji: "1️⃣1️⃣", en: "Eleven players are on the team.", cn: "队里有十一名队员。" },
        { w: "twelve", ipa: "/twelv/", zh: "十二", emoji: "1️⃣2️⃣", en: "A year has twelve months.", cn: "一年有十二个月。" }
      ]
    },
    {
      grade: 3, id: "school", name: "学校文具", en: "School", emoji: "🎒",
      color: "#3B82F6", soft: "#E8F1FF", desc: "每天陪你上学的小物件",
      words: [
        { w: "book", ipa: "/bʊk/", zh: "书", emoji: "📖", en: "I read a book after school.", cn: "放学后我读了一本书。" },
        { w: "pen", ipa: "/pen/", zh: "钢笔", emoji: "🖊️", en: "May I use your pen?", cn: "我可以用一下你的钢笔吗？" },
        { w: "pencil", ipa: "/ˈpensl/", zh: "铅笔", emoji: "✏️", en: "I draw with a pencil.", cn: "我用铅笔画画。" },
        { w: "ruler", ipa: "/ˈruːlə(r)/", zh: "尺子", emoji: "📏", en: "I have a long ruler.", cn: "我有一把长尺子。" },
        { w: "eraser", ipa: "/ɪˈreɪzə(r)/", zh: "橡皮", emoji: "🧽", en: "This eraser is small.", cn: "这块橡皮很小。" },
        { w: "schoolbag", ipa: "/ˈskuːlbæɡ/", zh: "书包", emoji: "🎒", en: "My schoolbag is blue.", cn: "我的书包是蓝色的。" },
        { w: "desk", ipa: "/desk/", zh: "书桌", emoji: "🖥️", en: "My book is on the desk.", cn: "我的书在书桌上。" },
        { w: "chair", ipa: "/tʃeə(r)/", zh: "椅子", emoji: "🪑", en: "Please sit on the chair.", cn: "请坐在椅子上。" },
        { w: "crayon", ipa: "/ˈkreɪən/", zh: "蜡笔", emoji: "🖍️", en: "I draw a rainbow with crayons.", cn: "我用蜡笔画彩虹。" },
        { w: "notebook", ipa: "/ˈnəʊtbʊk/", zh: "笔记本", emoji: "📓", en: "My notebook has a red cover.", cn: "我的笔记本是红色封面。" }
      ]
    },
    {
      grade: 3, id: "family", name: "温暖家人", en: "Family", emoji: "👨‍👩‍👧‍👦",
      color: "#D97706", soft: "#FFF4DE", desc: "介绍你最爱的人",
      words: [
        { w: "mother", ipa: "/ˈmʌðə(r)/", zh: "妈妈", emoji: "👩", en: "My mother makes breakfast for me.", cn: "妈妈为我做早餐。" },
        { w: "father", ipa: "/ˈfɑːðə(r)/", zh: "爸爸", emoji: "👨", en: "My father reads with me.", cn: "爸爸陪我一起读书。" },
        { w: "sister", ipa: "/ˈsɪstə(r)/", zh: "姐姐", emoji: "👧", en: "My sister is ten years old.", cn: "我姐姐十岁了。" },
        { w: "brother", ipa: "/ˈbrʌðə(r)/", zh: "哥哥", emoji: "👦", en: "My brother can ride a bike.", cn: "我哥哥会骑自行车。" },
        { w: "grandma", ipa: "/ˈɡrænmɑː/", zh: "奶奶", emoji: "👵", en: "Grandma tells me stories.", cn: "奶奶给我讲故事。" },
        { w: "grandpa", ipa: "/ˈɡrænpɑː/", zh: "爷爷", emoji: "👴", en: "Grandpa waters the flowers.", cn: "爷爷给花浇水。" },
        { w: "baby", ipa: "/ˈbeɪbi/", zh: "宝宝", emoji: "👶", en: "The baby is sleeping.", cn: "宝宝在睡觉。" },
        { w: "family", ipa: "/ˈfæməli/", zh: "家庭", emoji: "🏠", en: "I love my family.", cn: "我爱我的家。" }
      ]
    },
    {
      grade: 3, id: "body", name: "身体部位", en: "My Body", emoji: "🧒",
      color: "#14B8A6", soft: "#E3FAF6", desc: "从头到脚认识自己",
      words: [
        { w: "head", ipa: "/hed/", zh: "头", emoji: "🧑", en: "Nod your head.", cn: "点点头。" },
        { w: "eye", ipa: "/aɪ/", zh: "眼睛", emoji: "👁️", en: "Close your eyes.", cn: "闭上眼睛。" },
        { w: "ear", ipa: "/ɪə(r)/", zh: "耳朵", emoji: "👂", en: "I have two ears.", cn: "我有两只耳朵。" },
        { w: "nose", ipa: "/nəʊz/", zh: "鼻子", emoji: "👃", en: "The elephant has a long nose.", cn: "大象有长长的鼻子。" },
        { w: "mouth", ipa: "/maʊθ/", zh: "嘴巴", emoji: "👄", en: "Open your mouth, please.", cn: "请张开嘴巴。" },
        { w: "hand", ipa: "/hænd/", zh: "手", emoji: "✋", en: "Wash your hands before dinner.", cn: "饭前要洗手。" },
        { w: "foot", ipa: "/fʊt/", zh: "脚", emoji: "🦶", en: "My left foot is small.", cn: "我的左脚小小的。" },
        { w: "hair", ipa: "/heə(r)/", zh: "头发", emoji: "💇", en: "Her hair is long and black.", cn: "她的头发又长又黑。" },
        { w: "tooth", ipa: "/tuːθ/", zh: "牙齿", emoji: "🦷", en: "Brush your teeth every day.", cn: "每天都要刷牙。" },
        { w: "arm", ipa: "/ɑːm/", zh: "胳膊", emoji: "💪", en: "My arm is strong.", cn: "我的胳膊很有力。" }
      ]
    },
    {
      grade: 3, id: "food", name: "食物饮料", en: "Food & Drinks", emoji: "🍞",
      color: "#65A30D", soft: "#F2FBE3", desc: "早餐、午餐和下午茶",
      words: [
        { w: "milk", ipa: "/mɪlk/", zh: "牛奶", emoji: "🥛", en: "I drink milk for breakfast.", cn: "我早餐喝牛奶。" },
        { w: "bread", ipa: "/bred/", zh: "面包", emoji: "🍞", en: "The bread is warm and soft.", cn: "面包又暖和又松软。" },
        { w: "egg", ipa: "/eɡ/", zh: "鸡蛋", emoji: "🥚", en: "I eat an egg every morning.", cn: "我每天早上吃一个鸡蛋。" },
        { w: "rice", ipa: "/raɪs/", zh: "米饭", emoji: "🍚", en: "We eat rice for lunch.", cn: "我们午饭吃米饭。" },
        { w: "cake", ipa: "/keɪk/", zh: "蛋糕", emoji: "🎂", en: "The birthday cake is sweet.", cn: "生日蛋糕甜甜的。" },
        { w: "water", ipa: "/ˈwɔːtə(r)/", zh: "水", emoji: "💧", en: "Drink more water every day.", cn: "每天多喝水。" },
        { w: "juice", ipa: "/dʒuːs/", zh: "果汁", emoji: "🧃", en: "I like orange juice.", cn: "我喜欢橙汁。" },
        { w: "noodles", ipa: "/ˈnuːdlz/", zh: "面条", emoji: "🍜", en: "My dad cooks noodles on Sunday.", cn: "爸爸星期天做面条。" },
        { w: "candy", ipa: "/ˈkændi/", zh: "糖果", emoji: "🍬", en: "Too much candy is not good for your teeth.", cn: "吃太多糖对牙齿不好。" },
        { w: "ice cream", ipa: "/ˌaɪs ˈkriːm/", zh: "冰淇淋", emoji: "🍦", en: "I want an ice cream in summer.", cn: "夏天我想吃冰淇淋。" }
      ]
    },
    {
      grade: 3, id: "actions", name: "动作词", en: "Actions", emoji: "🏃",
      color: "#0891B2", soft: "#E2F7FC", desc: "跑跑跳跳，边做边学",
      words: [
        { w: "run", ipa: "/rʌn/", zh: "跑", emoji: "🏃", en: "I can run very fast.", cn: "我能跑得很快。" },
        { w: "jump", ipa: "/dʒʌmp/", zh: "跳", emoji: "🤸", en: "The rabbit can jump high.", cn: "兔子能跳得很高。" },
        { w: "swim", ipa: "/swɪm/", zh: "游泳", emoji: "🏊", en: "I swim in the pool.", cn: "我在游泳池里游泳。" },
        { w: "sing", ipa: "/sɪŋ/", zh: "唱歌", emoji: "🎤", en: "She can sing a song.", cn: "她会唱一首歌。" },
        { w: "dance", ipa: "/dɑːns/", zh: "跳舞", emoji: "💃", en: "Let's dance together!", cn: "我们一起跳舞吧！" },
        { w: "read", ipa: "/riːd/", zh: "读", emoji: "📖", en: "I read a story every night.", cn: "我每天晚上读一个故事。" },
        { w: "write", ipa: "/raɪt/", zh: "写", emoji: "✍️", en: "I write my name on the paper.", cn: "我在纸上写我的名字。" },
        { w: "draw", ipa: "/drɔː/", zh: "画画", emoji: "🎨", en: "I draw a big sun.", cn: "我画了一个大太阳。" },
        { w: "eat", ipa: "/iːt/", zh: "吃", emoji: "🍽️", en: "We eat lunch at twelve.", cn: "我们十二点吃午饭。" },
        { w: "sleep", ipa: "/sliːp/", zh: "睡觉", emoji: "😴", en: "I sleep at nine o'clock.", cn: "我九点睡觉。" }
      ]
    },
    {
      grade: 3, id: "nature", name: "自然天气", en: "Nature", emoji: "🌤️",
      color: "#2F9E44", soft: "#E9F8EC", desc: "看看天空和四季",
      words: [
        { w: "sun", ipa: "/sʌn/", zh: "太阳", emoji: "☀️", en: "The sun is bright.", cn: "太阳亮亮的。" },
        { w: "moon", ipa: "/muːn/", zh: "月亮", emoji: "🌙", en: "The moon is round tonight.", cn: "今晚的月亮圆圆的。" },
        { w: "star", ipa: "/stɑː(r)/", zh: "星星", emoji: "⭐", en: "Stars shine at night.", cn: "星星在夜晚闪光。" },
        { w: "sky", ipa: "/skaɪ/", zh: "天空", emoji: "🌌", en: "The sky is blue.", cn: "天空是蓝色的。" },
        { w: "tree", ipa: "/triː/", zh: "树", emoji: "🌳", en: "The bird is in the tree.", cn: "小鸟在树上。" },
        { w: "flower", ipa: "/ˈflaʊə(r)/", zh: "花", emoji: "🌸", en: "The flower smells nice.", cn: "这朵花闻起来很香。" },
        { w: "rain", ipa: "/reɪn/", zh: "雨", emoji: "🌧️", en: "I like the sound of rain.", cn: "我喜欢雨的声音。" },
        { w: "snow", ipa: "/snəʊ/", zh: "雪", emoji: "❄️", en: "Snow is white and cold.", cn: "雪又白又冷。" },
        { w: "wind", ipa: "/wɪnd/", zh: "风", emoji: "🍃", en: "The wind is cool today.", cn: "今天风很凉爽。" },
        { w: "cloud", ipa: "/klaʊd/", zh: "云", emoji: "☁️", en: "A white cloud is in the sky.", cn: "天上有一朵白云。" }
      ]
    },
    // 四五六年级（words-grade-456.js）
    ...window.GRADE_456_UNITS
  ]
};
