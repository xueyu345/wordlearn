/* 英语教材版本元数据
 *
 * 只用来说明「哪个版本覆盖哪些年级、每个年级有哪些单元」，
 * 真正的单词在 words.js / words-grade-*.js / words-pep.js / words-fltrp.js 里。
 * 这里的 book 必须与词库单元的 book 字段一致。
 *
 * editions(grades) 表示这个版本在这几个年级有内容；
 * outline 的键是年级，值是教材单元标题，用来给家长对照课本。
 */
window.EN_BOOKS = [
  {
    id: "general",
    name: "全国通用版",
    short: "通用",
    note: "不绑定具体教材，按主题分类的常用词，各版本都能用",
    editions: [1, 2, 3, 4, 5, 6],
    color: "#FF8A3D",
    outline: {}
  },
  {
    id: "pep",
    name: "人教 PEP · 三年级起点",
    short: "人教PEP",
    note: "人民教育出版社《义务教育教科书·英语(PEP)》，三年级开始，每学期 6 个单元 + 2 个复习",
    editions: [3, 4, 5, 6],
    color: "#3B82F6",
    outline: {
      3: ["Unit 1 Hello!", "Unit 2 Colours", "Unit 3 Look at me!", "Unit 4 We love animals",
        "Unit 5 Let's eat!", "Unit 6 Happy birthday!"],
      4: ["Unit 1 My classroom", "Unit 2 My schoolbag", "Unit 3 My friends", "Unit 4 My home",
        "Unit 5 Dinner's ready", "Unit 6 Meet my family!"],
      5: ["Unit 1 What's he like?", "Unit 2 My week", "Unit 3 What would you like?",
        "Unit 4 What can you do?", "Unit 5 There is a big bed", "Unit 6 In a nature park"],
      6: ["Unit 1 How can I get there?", "Unit 2 Ways to go to school", "Unit 3 My weekend plan",
        "Unit 4 I have a pen pal", "Unit 5 What does he do?", "Unit 6 How do you feel?"]
    }
  },
  {
    id: "fltrp",
    name: "外研版 · 三年级起点",
    short: "外研版",
    note: "外语教学与研究出版社《英语》(新标准)(三年级起点)，每册 10 个 Module",
    editions: [3, 4, 5, 6],
    color: "#14B8A6",
    outline: {
      3: ["Module 1 Greetings", "Module 2 Me and my family", "Module 3 Classroom",
        "Module 4 Colours", "Module 5 Numbers", "Module 6 Animals"],
      4: ["Module 1 Getting to know you", "Module 2 My house", "Module 3 Daily life",
        "Module 4 Food", "Module 5 Abilities", "Module 6 Travel"],
      5: ["Module 1 Changes", "Module 2 My week", "Module 3 Food and health",
        "Module 4 Nature", "Module 5 Body and habits", "Module 6 Around the world"],
      6: ["Module 1 Places", "Module 2 Ways to go", "Module 3 Plans",
        "Module 4 Pen pals", "Module 5 Jobs and dreams", "Module 6 Feelings"]
    }
  }
];
