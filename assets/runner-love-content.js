(function (root, factory) {
  const content = factory();
  if (typeof module === "object" && module.exports) module.exports = content;
  else if (root) root.RunnerLoveContent = content;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Reflect.ownKeys(value).forEach((key) => deepFreeze(value[key]));
    return Object.freeze(value);
  }

  const STAGES = [
    {
      id: "first-sight", order: 1, name: "再遇见", metric: "路口",
      scene: "雨后香樟路", destination: "图书馆路口", district: "campus-line",
      palette: "雨后青绿与夕照金", weather: "树叶还在滴水",
      objective: "穿过放学后的人潮，在图书馆路口再次遇见她",
      opening: "她发来一句：刚才是不是在香樟路看见你了？",
      arrival: "路口的红灯亮起，她站在屋檐下，认出了从雨里赶来的你。"
    },
    {
      id: "familiar-steps", order: 2, name: "渐渐熟悉", metric: "同行",
      scene: "清晨河堤与书店", destination: "桥下书店", district: "glass-station",
      palette: "晨雾蓝与纸页白", weather: "河面升起薄雾",
      objective: "沿着共同喜欢的事物，跑向下一次见面",
      opening: "她说桥下新开了一家小店，问你要不要一起去看看。",
      arrival: "玻璃门被推开，你带来的东西恰好接上了昨晚没聊完的话题。"
    },
    {
      id: "first-date", order: 3, name: "第一次赴约", metric: "准时",
      scene: "霓虹站前街", destination: "旧城电影院", district: "neon-river",
      palette: "夜色蓝与影院暖红", weather: "远处刚亮起霓虹",
      objective: "赶上末班车，把这次邀请变成真正的见面",
      opening: "手机屏幕亮起：电影七点四十开始，我在门口等你。",
      arrival: "影院灯牌在雨雾里亮着，她看了眼时间，又笑着朝你挥手。"
    },
    {
      id: "heart-spoken", order: 4, name: "约会正发生", metric: "今晚",
      scene: "夜市与河岸", destination: "河岸长椅", district: "date-market",
      palette: "玫红霓虹与灯笼暖橙", weather: "夜风穿过摊位",
      objective: "让今晚的路线自然长成只属于你们的一晚",
      opening: "电影散场还早，她问：要不要再走一会儿？",
      arrival: "河面映着城市灯光，今晚带来的每件小东西都有了去处。"
    },
    {
      id: "shared-days", order: 5, name: "成为日常", metric: "归家",
      scene: "清晨市场与街区", destination: "亮灯的厨房", district: "home-quarter",
      palette: "生活绿与早餐暖黄", weather: "窗边有柔和晨光",
      objective: "把早餐和寻常小事完整带回那间亮着灯的家",
      opening: "她发来一张空冰箱的照片：回来的路上，顺便买点东西？",
      arrival: "门锁转动，厨房的灯已经亮了。最普通的一天因此有了期待。"
    },
    {
      id: "rough-weather", order: 6, name: "雨夜之后", metric: "见面",
      scene: "暴雨高架与旧桥", destination: "河桥雨棚", district: "storm-bridge",
      palette: "风暴蓝与信号红", weather: "阵雨压低城市灯光",
      objective: "绕过封闭道路，亲自把没说清的话带到她面前",
      opening: "消息停在输入框很久。最后你只发出一句：见面说吧。",
      arrival: "雨声仍然很大，但你们终于站在同一处屋檐下，不再隔着屏幕猜测。"
    },
    {
      id: "toward-home", order: 7, name: "下一站", metric: "抵达",
      scene: "黎明车站与长街", destination: "有灯的家", district: "sunrise-terminal",
      palette: "黎明靛蓝与窗灯金", weather: "天际线逐渐转亮",
      objective: "经过一路熟悉的地方，抵达共同选择的下一站",
      opening: "清晨的车票夹在门边。她说：不用赶，我会一直开着灯。",
      arrival: "一路经过的物件在门口安静落定。门打开时，晨光也刚好照进来。"
    }
  ];

  const STORY_ITEM_DEFINITIONS = [
    { id: "dropped-photo", stage: 1, name: "被风吹走的照片", kind: "photo", color: "ivory", carry: "backpack", action: "return", line: "你在积水前接住照片，照片背面还留着她刚写下的日期。" },
    { id: "shared-umbrella", stage: 1, name: "透明雨伞", kind: "umbrella", color: "cyan", carry: "hand", action: "shelter", line: "雨势突然变大，你把一路护住的伞递到她面前。" },
    { id: "warm-can", stage: 1, name: "温热饮料", kind: "drink", color: "amber", carry: "hand", action: "offer", line: "自动贩卖机还亮着，两罐饮料在手里碰出清脆一声。" },
    { id: "library-bookmark", stage: 1, name: "银杏叶书签", kind: "note", color: "gold", carry: "pocket", action: "return", line: "书签从台阶边被拾起，她接过去时认出那是上次借书留下的叶子。" },
    { id: "pocket-candy", stage: 1, name: "柑橘糖纸袋", kind: "packet", color: "coral", carry: "pocket", action: "share", line: "等红灯的几秒里，你递出一颗糖，陌生的沉默先有了轻松的味道。" },
    { id: "paperback", stage: 2, name: "她提过的书", kind: "book", color: "coral", carry: "backpack", action: "share", line: "她翻开你带来的书，书签正停在你们昨晚聊到的那一页。" },
    { id: "record", stage: 2, name: "同一张唱片", kind: "record", color: "violet", carry: "backpack", action: "listen", line: "唱针落下，她把另一边耳机递过来，同一段前奏同时响起。" },
    { id: "lemon-soda", stage: 2, name: "柠檬汽水", kind: "drink", color: "lime", carry: "hand", action: "toast", line: "玻璃瓶蒙着水汽，你们为了最后一瓶相视而笑。" },
    { id: "cat-treat", stage: 2, name: "猫咪零食", kind: "packet", color: "rose", carry: "pocket", action: "feed", line: "书店门口的猫先一步跑来，她蹲下时给你留出身边的位置。" },
    { id: "bookstore-coffee", stage: 2, name: "书店手冲", kind: "coffee", color: "cream", carry: "hand", action: "offer", line: "咖啡在旧木桌上冒着热气，你们把一章书聊成了一个下午。" },
    { id: "river-postcard", stage: 2, name: "河堤明信片", kind: "photo", color: "blue", carry: "backpack", action: "write", line: "她在明信片空白处写下店名，说下次可以从这里继续逛。" },
    { id: "cinema-ticket", stage: 3, name: "两张电影票", kind: "ticket", color: "crimson", carry: "pocket", action: "admit", line: "你赶在灯光暗下前递出票根，她已经替你留好了靠里的座位。" },
    { id: "coffee-pair", stage: 3, name: "两杯热咖啡", kind: "coffee", color: "cream", carry: "hand", action: "offer", line: "杯盖还冒着热气，她接过那杯时准确叫出了你常点的口味。" },
    { id: "rain-umbrella", stage: 3, name: "深蓝长伞", kind: "umbrella", color: "blue", carry: "hand", action: "shelter", line: "散场时雨正落下，一把伞让回程自然变成并肩慢走。" },
    { id: "last-train-pass", stage: 3, name: "末班车票", kind: "ticket", color: "cyan", carry: "pocket", action: "detour", line: "电影结束得太晚，你们改坐最后一班车，多聊了整整七站。" },
    { id: "cinema-flower", stage: 3, name: "影院门口的小花", kind: "flower", color: "rose", carry: "hand", action: "gift", line: "它并不隆重，却让等待开场的那几分钟突然有了正式赴约的意味。" },
    { id: "soundtrack-record", stage: 3, name: "电影原声唱片", kind: "record", color: "violet", carry: "backpack", action: "listen", line: "片尾曲响起时你们同时认出旋律，散场后的路也因此走得更慢。" },
    { id: "single-flower", stage: 4, name: "一枝小花", kind: "flower", color: "rose", carry: "hand", action: "gift", line: "不是郑重其事的花束，只是路过时觉得它很适合今晚。" },
    { id: "instant-camera", stage: 4, name: "拍立得", kind: "camera", color: "ivory", carry: "neck", action: "photo", line: "快门亮起时你们都没准备好，那张照片反而笑得最自然。" },
    { id: "night-snack", stage: 4, name: "夜市纸袋", kind: "snack", color: "amber", carry: "hand", action: "share", line: "最后一口被推来推去，纸袋底只剩下暖暖的香气。" },
    { id: "music-wristband", stage: 4, name: "演出手环", kind: "wristband", color: "magenta", carry: "wrist", action: "dance", line: "灯光扫过人群，她拉住你的袖口，带你挤到更靠近舞台的位置。" },
    { id: "river-map", stage: 4, name: "手绘夜游地图", kind: "map", color: "blue", carry: "backpack", action: "wander", line: "你们没有照着地图走，却把绕远的那一段也认真圈了起来。" },
    { id: "riverside-lamp", stage: 4, name: "露营小灯", kind: "lamp", color: "gold", carry: "hand", action: "light", line: "长椅旁的小灯被拧亮，河面、晚风和彼此的侧脸都变得清楚。" },
    { id: "breakfast-bag", stage: 5, name: "早餐纸袋", kind: "snack", color: "cream", carry: "hand", action: "breakfast", line: "纸袋里装着两种口味，餐桌前那把椅子已经被自然拉开。" },
    { id: "grocery-bag", stage: 5, name: "一袋食材", kind: "groceries", color: "green", carry: "hand", action: "cook", line: "你把食材放上料理台，她已经卷起袖口，留下另一半工作给你。" },
    { id: "brass-key", stage: 5, name: "黄铜钥匙", kind: "key", color: "gold", carry: "pocket", action: "unlock", line: "钥匙第一次顺利转动，门里的灯也在同一刻亮起。" },
    { id: "small-plant", stage: 5, name: "窗边绿植", kind: "plant", color: "green", carry: "hand", action: "place", line: "她把花盆挪到窗边，空着的那一格从此有了共同照看的东西。" },
    { id: "recipe-note", stage: 5, name: "折角食谱", kind: "note", color: "ivory", carry: "pocket", action: "cook", line: "食谱边缘写满临时改动，最后那道菜也变成了只属于这张餐桌的味道。" },
    { id: "kitchen-towel", stage: 5, name: "格纹餐巾", kind: "cloth", color: "blue", carry: "backpack", action: "set-table", line: "你把餐巾铺好，她端来刚出锅的盘子，寻常晚餐有了郑重的开场。" },
    { id: "folded-note", stage: 6, name: "折好的短笺", kind: "note", color: "ivory", carry: "pocket", action: "explain", line: "纸上的句子很短，但每个字都比输入框里的猜测更清楚。" },
    { id: "hot-cocoa", stage: 6, name: "热可可", kind: "coffee", color: "amber", carry: "hand", action: "warm", line: "你没有急着解释，只先把还温热的杯子放到她手里。" },
    { id: "dry-towel", stage: 6, name: "干燥毛巾", kind: "cloth", color: "blue", carry: "backpack", action: "care", line: "她接过毛巾，也终于没有避开你认真看过来的目光。" },
    { id: "mended-ticket", stage: 6, name: "拼好的旧票根", kind: "ticket", color: "rose", carry: "pocket", action: "remember", line: "裂开的票根被重新拼好，不是为了回到从前，而是把今天说完整。" },
    { id: "rain-flower", stage: 6, name: "雨里的白花", kind: "flower", color: "ivory", carry: "hand", action: "wait", line: "花瓣被雨打得有些狼狈，你们却终于愿意停下来把真正介意的事说完。" },
    { id: "spare-key", stage: 6, name: "备用钥匙", kind: "key", color: "gold", carry: "pocket", action: "trust", line: "钥匙没有立刻被收起。她握在手里，等你把最后一句解释说完。" },
    { id: "travel-map", stage: 7, name: "折叠地图", kind: "map", color: "blue", carry: "backpack", action: "plan", line: "地图摊在桌上，下一条路线终于不再只属于一个人。" },
    { id: "home-key", stage: 7, name: "两把钥匙", kind: "key", color: "gold", carry: "pocket", action: "home", line: "两把钥匙落在同一个托盘里，发出很轻却很确定的声音。" },
    { id: "window-lamp", stage: 7, name: "窗边小灯", kind: "lamp", color: "amber", carry: "hand", action: "light", line: "灯被放上窗台，回来的路从此总有一个清楚的坐标。" },
    { id: "morning-bread", stage: 7, name: "清晨面包", kind: "snack", color: "cream", carry: "hand", action: "breakfast", line: "门打开时面包还热着，未来先从一顿很普通的早餐开始。" },
    { id: "framed-photo", stage: 7, name: "装框的合照", kind: "photo", color: "rose", carry: "backpack", action: "place", line: "照片被放在玄关最容易看见的位置，出门与回家都能经过同一段笑容。" },
    { id: "house-plant", stage: 7, name: "新家的第一盆植物", kind: "plant", color: "green", carry: "hand", action: "grow", line: "花盆落在晨光里，你们讨论的不是它会不会开花，而是谁记得先浇水。" }
  ];

  const GAMEPLAY_EFFECTS = ["magnet", "shield", "multiplier", "overdrive"];

  const INTERACTION_PROFILE_SPECS = {
    "dropped-photo": {
      gameplay: ["magnet", 0.72, 5200],
      world: ["memory-lane", "积水边缘浮出一条通往照片的干燥跑线", "雨滴反光收束成短暂的相片边框", 0.64],
      music: ["memory-pulse", "felt-piano", 0.56],
      character: ["俯身伸手接住照片并护在胸前", "惊喜而专注", 0.62],
      narrative: ["被风卷走的照片在落进积水前被接住", "这张照片后来与玄关里的共同合照并排放好", ["初遇", "照片", "日期"]]
    },
    "shared-umbrella": {
      gameplay: ["shield", 0.82, 6000],
      world: ["rain-shelter", "中央跑线被伞沿遮出连续的避雨带", "近景雨幕向两侧分开，路灯倒影变得清楚", 0.78],
      music: ["rain-canopy", "glass-marimba", 0.58],
      character: ["抬高手臂稳住伞面并向身侧让出位置", "体贴而从容", 0.72],
      narrative: ["突来的大雨让两个人第一次并肩躲进同一把伞", "以后每次听见急雨都会想起这段并肩跑线", ["雨夜", "并肩", "照顾"]]
    },
    "warm-can": {
      gameplay: ["overdrive", 0.58, 3600],
      world: ["warm-current", "贩卖机前的湿滑路段升起暖色加速线", "白雾从罐口掠过，冷雨色温短暂回暖", 0.52],
      music: ["warm-beat", "muted-brass", 0.55],
      character: ["换手托住两罐饮料并加快步频", "轻松而期待", 0.57],
      narrative: ["两罐温热饮料在赶路途中被稳稳带上", "后来争执后的热可可延续了先递出温度的习惯", ["饮料", "暖意", "递出"]]
    },
    "library-bookmark": {
      gameplay: ["multiplier", 0.62, 5000],
      world: ["page-route", "银杏叶纹沿正确跑线逐页亮起", "风中的叶片按书页翻动的节奏排列", 0.57],
      music: ["page-turn", "plucked-strings", 0.51],
      character: ["捻住书签边缘后贴身收进口袋", "熟悉又好奇", 0.55],
      narrative: ["遗落的银杏叶书签重新回到约定的书里", "下一次共读时，它停在两人都记得的段落", ["书页", "银杏", "再遇见"]]
    },
    "pocket-candy": {
      gameplay: ["magnet", 0.55, 4200],
      world: ["citrus-drift", "糖纸折出的橙色箭头吸引邻近收集物靠拢", "空气里闪过细小柑橘色光点", 0.48],
      music: ["citrus-click", "woodblock", 0.47],
      character: ["单手接住纸袋并顺势递出一颗糖", "放松而友善", 0.51],
      narrative: ["等红灯的沉默被一颗柑橘糖轻轻打破", "后来共享汽水时仍会提起这次不经意的开场", ["分享", "柑橘", "红灯"]]
    },
    "paperback": {
      gameplay: ["multiplier", 0.68, 5600],
      world: ["chapter-path", "路面章节标记连续点亮并延长得分跑线", "纸页投影在晨雾里向前翻动", 0.61],
      music: ["chapter-loop", "nylon-guitar", 0.54],
      character: ["把书从背包抽出后贴臂稳住继续奔跑", "投入而笃定", 0.59],
      narrative: ["她提过的书把昨晚没聊完的话题带到见面现场", "书签停留的那一页成了以后反复提起的共同段落", ["共读", "话题", "书店"]]
    },
    "record": {
      gameplay: ["overdrive", 0.74, 4800],
      world: ["groove-track", "唱片纹路铺成随重拍加速的弧形跑道", "店铺灯光按唱针轨迹缓慢旋转", 0.68],
      music: ["shared-groove", "vinyl-keys", 0.79],
      character: ["护住唱片封套并踩着重拍调整步幅", "兴奋而默契", 0.7],
      narrative: ["同一张唱片让两个人同时认出熟悉的前奏", "电影散场后的原声旋律再次接上这段共同聆听", ["唱片", "前奏", "默契"]]
    },
    "lemon-soda": {
      gameplay: ["overdrive", 0.64, 3800],
      world: ["bubble-sprint", "气泡沿当前跑线连续爆开并推高短程速度", "河堤雾气里浮出清亮的柠檬色气泡", 0.55],
      music: ["soda-pop", "bottle-percussion", 0.6],
      character: ["举稳玻璃瓶并用轻快小步穿过人群", "清爽而雀跃", 0.63],
      narrative: ["最后一瓶柠檬汽水被两个人笑着分享", "柑橘味后来总与轻松开口的时刻连在一起", ["汽水", "柑橘", "相视一笑"]]
    },
    "cat-treat": {
      gameplay: ["magnet", 0.67, 4700],
      world: ["companion-lane", "街角脚印把邻近收集物引向安全跑线", "书店门口的暖光沿低处一路跟随", 0.59],
      music: ["soft-steps", "pizzicato-strings", 0.52],
      character: ["放低重心护住零食袋并侧身留出位置", "温柔而专注", 0.61],
      narrative: ["书店门口的相遇因为一袋零食多停留了片刻", "那张旧木桌后来一直被记作第一次自然坐近的位置", ["书店", "停留", "靠近"]]
    },
    "bookstore-coffee": {
      gameplay: ["shield", 0.6, 4400],
      world: ["steam-buffer", "热气在手边形成一段减弱碰撞冲击的缓冲跑线", "旧木桌色的暖雾覆盖近景与门外街角", 0.54],
      music: ["coffee-room", "upright-bass", 0.5],
      character: ["双手稳住杯身后收紧步幅避开障碍", "安定而专心", 0.56],
      narrative: ["一杯手冲让原本短暂的见面延长成整个下午", "以后经过桥下书店都会想起那次没有看时间的谈话", ["咖啡", "下午", "长谈"]]
    },
    "river-postcard": {
      gameplay: ["magnet", 0.62, 5200],
      world: ["postcard-route", "明信片边线展开为吸引沿途物品的河堤跑线", "远景被压成带邮戳质感的清透色块", 0.56],
      music: ["river-note", "harmonica", 0.49],
      character: ["夹稳明信片并抬头确认下一处转弯", "好奇而向往", 0.55],
      narrative: ["空白明信片记下了下一次继续闲逛的店名", "多年后的折叠地图仍标着同一个河堤起点", ["明信片", "下次", "河堤"]]
    },
    "cinema-ticket": {
      gameplay: ["multiplier", 0.78, 5400],
      world: ["admission-line", "两道票根光带并行延伸并提高连续得分", "影院灯牌逐字亮起，雨雾退到街道两侧", 0.72],
      music: ["opening-credit", "cinematic-strings", 0.69],
      character: ["从口袋抽出票根并冲刺穿过检票口", "紧张后释然", 0.74],
      narrative: ["两张电影票在灯光暗下前及时送到检票口", "被重新拼好的旧票根会证明那晚确实被认真珍藏", ["电影", "赴约", "准时"]]
    },
    "coffee-pair": {
      gameplay: ["overdrive", 0.68, 4200],
      world: ["paired-steam", "两股热气并成中央加速线穿过站前街", "杯盖白雾在霓虹下形成成对光晕", 0.6],
      music: ["paired-cups", "rhodes-piano", 0.58],
      character: ["平衡两只杯子并用短促步伐快速前进", "体贴而自信", 0.64],
      narrative: ["准确记住的两种口味让等待变得被重视", "清晨面包与咖啡后来成为无需询问的日常搭配", ["口味", "记得", "等待"]]
    },
    "rain-umbrella": {
      gameplay: ["shield", 0.88, 6500],
      world: ["shared-canopy", "长伞覆盖相邻跑线并挡开横向雨障", "散场雨幕被伞面切成柔和的蓝色帘幕", 0.84],
      music: ["after-film-rain", "brush-drums", 0.62],
      character: ["压低伞柄迎风前倾并保持并肩速度", "可靠而亲近", 0.78],
      narrative: ["散场的雨让回程自然变成一段并肩慢走", "雨里的白花后来提醒两个人别在坏天气里走散", ["散场", "雨伞", "并肩"]]
    },
    "last-train-pass": {
      gameplay: ["overdrive", 0.82, 4600],
      world: ["last-train-rush", "站台警示线化为连续冲刺带赶向末班车", "车窗光格向后快速掠过并拉长城市纵深", 0.8],
      music: ["platform-rush", "sequenced-synth", 0.76],
      character: ["攥紧车票压低身体完成一段长冲刺", "急切又兴奋", 0.81],
      narrative: ["赶上的末班车把散场后的谈话延长了七站", "后来每次临时绕路都不再被当作浪费时间", ["末班车", "绕路", "七站"]]
    },
    "cinema-flower": {
      gameplay: ["magnet", 0.6, 4400],
      world: ["petal-invitation", "花瓣沿影院门前的弧线路径吸引邻近物品", "暖红灯牌下飘过细小玫色花影", 0.55],
      music: ["small-occasion", "celesta", 0.52],
      character: ["护住花茎并放慢手臂摆动穿过人群", "认真而羞涩", 0.59],
      narrative: ["影院门口的小花让普通等待有了正式赴约的意味", "夜市里再次挑中的一枝花会延续这份不隆重的认真", ["小花", "赴约", "心意"]]
    },
    "soundtrack-record": {
      gameplay: ["multiplier", 0.72, 5800],
      world: ["credit-groove", "片尾字幕线叠上跑道并延长重拍得分窗口", "街景边缘出现缓慢旋转的唱片高光", 0.67],
      music: ["credit-reprise", "string-synth", 0.82],
      character: ["抱稳唱片封套并随副歌拉长步幅", "沉浸而默契", 0.71],
      narrative: ["片尾曲让两个人在散场时同时认出同一段旋律", "唱片店里的前奏从此有了属于这场电影的后半句", ["原声", "片尾曲", "同频"]]
    },
    "single-flower": {
      gameplay: ["magnet", 0.66, 4600],
      world: ["petal-follow", "一列花瓣贴着所选跑线吸引散落收集物", "夜市灯笼间浮起柔和的玫色微光", 0.6],
      music: ["flower-theme", "solo-violin", 0.56],
      character: ["把花移到内侧手臂并自然放慢半步", "温柔而坦然", 0.63],
      narrative: ["路过时挑中的一枝花准确属于这个夜晚", "影院门前那次小小郑重终于变成自然表达", ["花", "夜市", "表达"]]
    },
    "instant-camera": {
      gameplay: ["multiplier", 0.76, 5200],
      world: ["snapshot-window", "快门白框依次锁定高价值跑线并扩大连击收益", "夜市片段短暂定格成高对比相片色", 0.7],
      music: ["shutter-sync", "clap-percussion", 0.66],
      character: ["抬起相机完成抓拍后立即收回胸前", "惊喜而开怀", 0.73],
      narrative: ["没有准备好的快门留下了最自然的一次同框", "装进玄关相框后，这张照片每天都能被经过", ["拍立得", "同框", "自然笑容"]]
    },
    "night-snack": {
      gameplay: ["shield", 0.58, 4000],
      world: ["market-buffer", "纸袋暖光覆盖摊位间最拥挤的一段跑线", "食物蒸汽把刺眼霓虹柔化成暖色光圈", 0.53],
      music: ["market-snack", "hand-percussion", 0.57],
      character: ["抬高手中纸袋并侧肩穿过摊位间隙", "满足而放松", 0.58],
      narrative: ["被推来推去的最后一口让夜市停留得更久", "清晨早餐延续了总把一半留给对方的习惯", ["夜市", "分享", "最后一口"]]
    },
    "music-wristband": {
      gameplay: ["overdrive", 0.9, 5000],
      world: ["concert-surge", "舞台重拍把三条跑线依次推成高速节奏带", "扫描灯越过人群并在前方汇成明亮光柱", 0.9],
      music: ["live-chorus", "distorted-synth", 0.94],
      character: ["抬起佩戴手环的手臂踩重拍连续变线", "兴奋而无拘束", 0.9],
      narrative: ["发亮的演出手环把两个人带到更靠近舞台的位置", "拍立得留下的模糊灯光后来成了这首歌的固定画面", ["演出", "重拍", "牵引"]]
    },
    "river-map": {
      gameplay: ["magnet", 0.8, 6000],
      world: ["wander-route", "手绘支路主动弯向附近收集物再回到主跑线", "河岸灯点连成会移动的蓝色地图标记", 0.74],
      music: ["riverside-route", "clean-guitar", 0.61],
      character: ["展开地图快速扫视后主动切入一条支路", "好奇而自在", 0.7],
      narrative: ["没有照着走的地图仍认真圈下了那段绕远路", "末班车带来的七站闲聊让绕路从此成为共同选择", ["夜游", "地图", "绕远"]]
    },
    "riverside-lamp": {
      gameplay: ["shield", 0.74, 5600],
      world: ["riverside-light", "灯光照出前方障碍边缘并覆盖一段安全跑线", "河面与长椅周围的暗部被暖金光逐层打开", 0.69],
      music: ["lamp-glow", "warm-vibraphone", 0.55],
      character: ["提灯靠近身体并抬眼确认前方落脚点", "安宁而亲密", 0.67],
      narrative: ["长椅旁亮起的小灯让彼此的侧脸都变得清楚", "新家窗边的灯后来把这份清楚变成归家坐标", ["河岸", "灯", "看清彼此"]]
    },
    "breakfast-bag": {
      gameplay: ["overdrive", 0.62, 4200],
      world: ["morning-carry", "早餐店到街区的跑线被晨光推成轻快加速带", "纸袋暖气与清晨薄雾交叠成柔黄尾迹", 0.56],
      music: ["breakfast-step", "acoustic-guitar", 0.53],
      character: ["提稳纸袋并用轻快步幅绕开早市人流", "踏实而愉快", 0.6],
      narrative: ["装着两种口味的早餐被完整带回共同餐桌", "夜市留下最后一口的习惯在清晨变成自然预留", ["早餐", "两种口味", "日常"]]
    },
    "grocery-bag": {
      gameplay: ["magnet", 0.72, 5400],
      world: ["market-gather", "散落食材标记被吸向通往厨房的中央跑线", "市场招牌色彩按食谱顺序依次亮起", 0.65],
      music: ["kitchen-prelude", "mallet-percussion", 0.57],
      character: ["换手平衡食材重量并稳定穿过市场转角", "忙碌而期待", 0.66],
      narrative: ["一袋食材把回家路上的琐事变成共同晚餐的开场", "折角食谱上的临时改动会成为这张餐桌的固定味道", ["食材", "做饭", "分工"]]
    },
    "brass-key": {
      gameplay: ["shield", 0.82, 6200],
      world: ["doorway-guard", "钥匙光纹锁定通往亮灯厨房的安全跑线", "街区门窗依次亮起温暖的室内光", 0.76],
      music: ["first-key", "bell-piano", 0.6],
      character: ["确认钥匙后握紧收入口袋并稳步前进", "郑重而安心", 0.72],
      narrative: ["黄铜钥匙第一次顺利打开了那扇共同的门", "备用钥匙被交付时，这次进入会成为信任的前文", ["钥匙", "开门", "共同空间"]]
    },
    "small-plant": {
      gameplay: ["multiplier", 0.58, 6000],
      world: ["green-rhythm", "叶脉纹路沿连续跑线生长并维持得分倍率", "窗边晨光扩散出清新的绿色层次", 0.55],
      music: ["leaf-pattern", "kalimba", 0.48],
      character: ["双手稳住花盆并缩短步幅保持平衡", "耐心而柔和", 0.58],
      narrative: ["窗边空着的一格有了需要共同照看的绿植", "新家的第一盆植物会接续这次关于浇水的分工", ["绿植", "照看", "窗边"]]
    },
    "recipe-note": {
      gameplay: ["multiplier", 0.7, 5600],
      world: ["recipe-chain", "食谱步骤化成连续检查点并提升完整连击收益", "手写改动以暖白字迹浮在厨房方向", 0.63],
      music: ["recipe-rhythm", "kitchen-percussion", 0.56],
      character: ["展开折角纸页快速确认后收回口袋", "专注而有默契", 0.64],
      narrative: ["写满临时改动的食谱把一道菜变成共同版本", "以后再做这道菜时，没人需要重新确认那些改动", ["食谱", "共同版本", "餐桌"]]
    },
    "kitchen-towel": {
      gameplay: ["shield", 0.66, 5000],
      world: ["table-ready", "格纹图案铺成稳定跑线并缓冲拥挤路段", "清晨市场的杂色逐渐整理成餐桌配色", 0.59],
      music: ["table-setting", "brush-snare", 0.5],
      character: ["把餐巾夹在臂弯并稳住剩余携带物", "有序而满足", 0.61],
      narrative: ["铺好的格纹餐巾让寻常晚餐有了认真开场", "清晨面包放上同一块格纹时，仪式已经成为日常", ["餐巾", "摆桌", "晚餐"]]
    },
    "folded-note": {
      gameplay: ["multiplier", 0.84, 6200],
      world: ["clear-words", "被雨打乱的岔路重新排成一条清楚的连续跑线", "输入框般的冷光退去，纸面暖白照亮前方", 0.81],
      music: ["spoken-line", "solo-cello", 0.72],
      character: ["把短笺贴近胸前并抬头直视目的地", "忐忑但坦诚", 0.82],
      narrative: ["写在纸上的短句让含混猜测第一次有了明确顺序", "共同的门真正打开前，这次说清会成为信任的依据", ["短笺", "解释", "坦诚"]]
    },
    "hot-cocoa": {
      gameplay: ["shield", 0.78, 5200],
      world: ["cocoa-warmth", "杯口暖雾包住湿滑跑线并降低风雨冲击", "暴雨蓝中扩开一圈稳定的可可暖色", 0.73],
      music: ["warm-pause", "bass-clarinet", 0.58],
      character: ["用双手护住杯子并放缓呼吸靠近雨棚", "克制而关心", 0.75],
      narrative: ["解释之前先递出的热可可让对话有了停顿空间", "最初那罐温热饮料所代表的关心在此刻重新被看见", ["热可可", "先照顾", "停顿"]]
    },
    "dry-towel": {
      gameplay: ["shield", 0.9, 6800],
      world: ["storm-cover", "毛巾展开成覆盖相邻跑线的强力避雨屏障", "镜头水痕迅速褪去，桥下轮廓恢复清晰", 0.88],
      music: ["storm-soften", "low-strings", 0.61],
      character: ["抬臂挡雨后把干毛巾完整护在内侧", "坚定而体贴", 0.86],
      narrative: ["被忽略的照顾在暴雨里通过一条干毛巾重新接上", "第一次共伞时让出的位置终于得到对等回应", ["毛巾", "暴雨", "回应照顾"]]
    },
    "mended-ticket": {
      gameplay: ["magnet", 0.68, 5600],
      world: ["mended-route", "断开的道路标线像票根一样重新拼合并吸引遗漏物品", "旧影院暖红从雨夜反光中逐片复原", 0.67],
      music: ["ticket-reprise", "tape-piano", 0.64],
      character: ["用指腹压住拼接处并稳稳收好票根", "怀念但清醒", 0.7],
      narrative: ["裂开的旧票根被拼好，不为回去而为把今天说完整", "那场及时赶上的电影因此不再只剩争执后的怀旧", ["旧票根", "修补", "说完整"]]
    },
    "rain-flower": {
      gameplay: ["multiplier", 0.72, 5200],
      world: ["patient-bloom", "雨中花瓣标出需要放慢判断的高收益跑线", "白色花影在信号红与风暴蓝之间保持不灭", 0.69],
      music: ["rain-bloom", "oboe", 0.6],
      character: ["护住受雨的花并主动把步子放稳", "脆弱而真诚", 0.73],
      narrative: ["有些狼狈的白花陪两个人停下来谈完真正介意的事", "散场共伞的温柔与赴约小花的认真在此刻一起被记起", ["白花", "停下来", "说开"]]
    },
    "spare-key": {
      gameplay: ["overdrive", 0.76, 4800],
      world: ["trust-opening", "封闭路障按钥匙转动方向依次打开成冲刺通道", "雨棚尽头的门灯从微弱变为稳定金色", 0.75],
      music: ["trust-turn", "French-horn", 0.67],
      character: ["摊开手掌展示钥匙后坚定迈向最后一段路", "紧张而信任", 0.78],
      narrative: ["备用钥匙没有立刻收起，直到最后一句解释被听完", "黄铜钥匙第一次开门的意义因此从进入变成彼此托付", ["备用钥匙", "信任", "等待回答"]]
    },
    "travel-map": {
      gameplay: ["magnet", 0.86, 6400],
      world: ["future-route", "折叠地图展开多条支路并自动汇集沿途收集物", "黎明天际线叠上清晰的远行坐标", 0.82],
      music: ["departure-map", "wide-strings", 0.7],
      character: ["迎风展开地图并指向两个人共同确认的方向", "坚定而向往", 0.82],
      narrative: ["摊开的地图让下一条路线不再只属于一个人", "河堤明信片写下的下次终于延伸成更远的共同计划", ["地图", "共同计划", "下一站"]]
    },
    "home-key": {
      gameplay: ["shield", 0.94, 7200],
      world: ["homeward-guard", "两道钥匙光纹覆盖通往家门的全部关键跑线", "沿街窗灯逐盏点亮并稳定保持到抵达", 0.93],
      music: ["home-resolution", "piano-and-strings", 0.78],
      character: ["把两把钥匙握在同一只手中稳步走向门口", "笃定而安心", 0.92],
      narrative: ["两把钥匙落进同一个托盘，确认了共同选择的下一站", "暴雨里说清的话成为这扇门能够长久打开的基础", ["两把钥匙", "家", "共同选择"]]
    },
    "window-lamp": {
      gameplay: ["overdrive", 0.7, 5000],
      world: ["window-beacon", "窗灯投下笔直光路引导最后一段归家冲刺", "黎明靛蓝被一扇稳定的暖窗逐步推开", 0.72],
      music: ["window-light", "analog-pad", 0.62],
      character: ["提起小灯确认窗边位置后加速靠近家门", "期待而安稳", 0.7],
      narrative: ["放上窗台的小灯让回来的路有了清楚坐标", "河岸长椅旁第一次照清彼此的光被留进日常", ["窗灯", "归家", "坐标"]]
    },
    "morning-bread": {
      gameplay: ["multiplier", 0.64, 5400],
      world: ["morning-table", "面包香气串起连续得分点直到亮灯厨房", "晨光与烘焙暖色从门缝向街道扩散", 0.59],
      music: ["dawn-breakfast", "acoustic-piano", 0.55],
      character: ["把面包抱稳在身前并轻快跨过最后台阶", "满足而平静", 0.64],
      narrative: ["仍然温热的面包让未来从普通早餐开始", "两杯咖啡与格纹餐巾都在这张日常餐桌上找到位置", ["面包", "清晨", "普通日常"]]
    },
    "framed-photo": {
      gameplay: ["magnet", 0.78, 6200],
      world: ["memory-gallery", "相框边缘扩展成汇集沿途回忆物的归家跑线", "经过的街景依次显影为清晰照片层", 0.76],
      music: ["memory-home", "felt-piano-and-tape", 0.68],
      character: ["双臂护住相框并在门前回头确认一路", "珍惜而笃定", 0.79],
      narrative: ["合照被放在玄关，让出门与回家都经过同一段笑容", "雨后接住的第一张照片终于与共同生活并排成册", ["合照", "玄关", "共同记忆"]]
    },
    "house-plant": {
      gameplay: ["multiplier", 0.74, 6800],
      world: ["home-growth", "新叶沿最终跑线连续展开并维持抵达前的倍率", "晨光里的绿色从窗边延伸到整条熟悉长街", 0.71],
      music: ["growing-home", "marimba-and-strings", 0.6],
      character: ["稳稳托住花盆并与身侧步伐保持一致", "踏实而有盼望", 0.74],
      narrative: ["新家的第一盆植物把未来落在谁先浇水的具体日常里", "曾经填满窗边空格的小绿植长成了共同照看的习惯", ["新家", "生长", "共同照看"]]
    }
  };

  function createCombination(id, itemIds, name, bonus, world, music, character, narrative) {
    return {
      id,
      itemIds,
      name,
      bonus: { strength: bonus[0], durationMs: bonus[1] },
      world: { changeType: world[0], roadChange: world[1], environmentChange: world[2] },
      music: { layer: music[0], timbre: music[1] },
      character: { immediateAction: character[0], emotion: character[1] },
      narrative: { currentEvent: narrative[0], laterEcho: narrative[1], memoryTags: narrative[2] }
    };
  }

  const INTERACTION_COMBINATIONS = [
    createCombination("photo-home-arc", ["dropped-photo", "framed-photo"], "接住的照片", [0.1, 900], ["memory-gallery", "起点与终点之间出现连续相框跑线", "雨后街景与玄关晨光同时显影"], ["photo-reprise", "felt-piano-duet"], ["护住相框后回望来路", "珍惜而笃定"], ["第一张被接住的照片与共同合照同时进入这一刻", "两段笑容会留在每天经过的玄关", ["照片回环", "从初遇到家"]]),
    createCombination("shared-rain-care", ["shared-umbrella", "dry-towel"], "雨里的照顾", [0.11, 1000], ["rain-clearance", "伞下跑线与干燥缓冲区连成完整通道", "镜头雨痕退去，路灯轮廓恢复清晰"], ["rain-care", "brushes-and-low-strings"], ["先挡雨再把干燥的位置让向身侧", "被回应的体贴"], ["第一次让出的伞下位置得到对等回应", "坏天气不再意味着各自硬撑", ["共伞", "回应照顾"]]),
    createCombination("warmth-return", ["warm-can", "hot-cocoa"], "先递出的温度", [0.08, 800], ["warm-front", "暖色加速线穿过雨夜缓冲区", "罐口与杯口白雾叠成稳定暖光"], ["warmth-reprise", "muted-brass-and-clarinet"], ["放慢一步确认温度再继续前进", "克制而关心"], ["两次先递出的温度让关心不必依赖解释", "冷雨里的停顿会被记成愿意照顾彼此", ["温度", "先照顾"]]),
    createCombination("marked-chapter", ["library-bookmark", "paperback"], "停在同一页", [0.09, 900], ["chapter-link", "银杏叶标记把章节检查点连成连续跑线", "晨雾中同时浮出叶脉与翻页投影"], ["marked-page", "plucked-strings-and-guitar"], ["把书签夹回熟悉页码后抱稳书本", "会意而投入"], ["找回的书签准确停进昨晚聊到的章节", "共同段落会成为下一次谈话的自然开头", ["同一页", "共读"]]),
    createCombination("citrus-sharing", ["pocket-candy", "lemon-soda"], "柑橘开场", [0.07, 700], ["citrus-stream", "糖纸箭头与气泡加速线汇成轻快支路", "橙黄光点在河雾里连续爆开"], ["citrus-pop", "woodblock-and-bottles"], ["递出糖果后举瓶轻碰", "轻松而亲近"], ["一颗糖与最后一瓶汽水都让沉默自然结束", "柑橘味会一直关联那些容易开口的时刻", ["柑橘", "分享"]]),
    createCombination("shared-soundtrack", ["record", "soundtrack-record"], "同一段旋律", [0.1, 1000], ["double-groove", "两圈唱片纹路叠成持续得分与加速跑线", "唱片店与影院灯光按同一转速旋转"], ["full-reprise", "vinyl-strings"], ["踩中前奏后在副歌处拉长步幅", "沉浸而默契"], ["唱片前奏与电影片尾曲在同一段奔跑里相接", "这首歌以后总有两处共同记忆", ["旋律回环", "共同聆听"]]),
    createCombination("bookstore-afternoon", ["cat-treat", "bookstore-coffee"], "多停留一会儿", [0.07, 800], ["bookstore-pause", "脚印导向一段受热气保护的安静跑线", "书店门口与旧木桌的暖光连成一体"], ["quiet-afternoon", "pizzicato-and-bass"], ["放低步幅后在桌边自然坐近", "温柔而放松"], ["门口的短暂停留延长成旧木桌边的整个下午", "那次没有看时间的谈话会留作熟悉的开始", ["书店下午", "自然靠近"]]),
    createCombination("postcard-journey", ["river-postcard", "travel-map"], "从下次到下一站", [0.1, 1000], ["route-expansion", "河堤小路接入地图上的远行主线", "邮戳标记扩展成黎明坐标"], ["journey-note", "harmonica-and-strings"], ["把明信片压在地图起点并共同指向远方", "向往而确定"], ["写在明信片上的下次扩展成两个人的下一站", "每张新地图都会保留河堤作为共同起点", ["下次", "共同远行"]]),
    createCombination("ticket-kept", ["cinema-ticket", "mended-ticket"], "被留下的票根", [0.1, 900], ["ticket-continuity", "检票光带跨过断路并重新拼成完整跑线", "影院暖红从暴雨反光中恢复"], ["credit-memory", "cinematic-tape-piano"], ["压实拼接处后重新向前", "怀念但清醒"], ["及时递出的电影票与后来拼好的票根证明那晚一直被珍藏", "修补不是回到从前，而是让共同记忆继续向后生长", ["票根", "修补"]]),
    createCombination("coffee-breakfast", ["coffee-pair", "morning-bread"], "记得的早餐", [0.08, 800], ["morning-pair", "两道杯形热气接上面包香气形成归家跑线", "站前霓虹渐变为厨房晨光"], ["morning-duet", "rhodes-and-acoustic-piano"], ["平衡咖啡与面包并肩走上台阶", "熟悉而满足"], ["被记住的咖啡口味成为无需询问的早餐搭配", "普通清晨会反复确认那些被认真记住的细节", ["口味", "早餐日常"]]),
    createCombination("rain-flower-promise", ["rain-umbrella", "rain-flower"], "雨里没有走散", [0.1, 1000], ["patient-shelter", "伞面屏障覆盖需要放慢判断的花瓣跑线", "深蓝雨幕里保持一束稳定白光"], ["rain-promise", "brush-drums-and-oboe"], ["护住花与身侧位置并同步放慢", "脆弱而可靠"], ["散场时的并肩与争执后的停留在雨里重合", "下一场雨会提醒两个人先靠近再开口", ["雨中并肩", "停下来"]]),
    createCombination("chosen-detour", ["last-train-pass", "river-map"], "一起绕远", [0.11, 900], ["detour-flow", "站台冲刺线转入手绘河岸支路后重新汇合", "车窗光格与河面灯点交替掠过"], ["detour-chorus", "sequencer-and-guitar"], ["冲上末班车后主动展开夜游地图", "兴奋而自在"], ["多坐七站与没有照图走都证明绕路可以是共同选择", "以后临时改变路线会先被看作新的相处时间", ["绕远", "共同选择"]]),
    createCombination("small-flowers", ["cinema-flower", "single-flower"], "不隆重的认真", [0.07, 700], ["petal-occasion", "两段花瓣弧线连成通往约会现场的跑线", "影院暖红过渡成夜市玫色灯影"], ["flower-reprise", "celesta-and-violin"], ["护好花茎后自然递向身侧", "认真而坦然"], ["两次路过时挑中的小花让心意从郑重变得自然", "不必盛大的表达也会被准确记住", ["小花", "自然表达"]]),
    createCombination("captured-concert", ["instant-camera", "music-wristband"], "快门里的重拍", [0.12, 900], ["snapshot-surge", "快门框锁定舞台重拍并连续点亮高速跑线", "扫描灯在相片白边内短暂定格"], ["shutter-chorus", "claps-and-distorted-synth"], ["举起相机抓拍后立刻跟上舞台重拍", "开怀而无拘束"], ["没有准备好的合照收住了最热烈的一段演出灯光", "这首歌以后总伴随那张略微模糊的照片", ["演出照片", "重拍"]]),
    createCombination("shared-meals", ["night-snack", "breakfast-bag"], "总会留下一半", [0.08, 800], ["meal-cycle", "夜市暖光跑线自然接入清晨市场加速带", "纸袋蒸汽从霓虹暖橙过渡到晨光柔黄"], ["meal-rhythm", "hand-percussion-and-guitar"], ["把最后一口与另一份早餐推向身侧", "满足而体贴"], ["夜晚与清晨都有人自然为对方留下一半", "分享不再是事件，而会成为餐桌上的习惯", ["分享食物", "日常习惯"]]),
    createCombination("lights-toward-home", ["riverside-lamp", "window-lamp"], "一直亮着的灯", [0.1, 1000], ["light-homeward", "河岸安全光带延伸成直达窗边的归家跑线", "长椅灯影逐渐收束进一扇暖窗"], ["light-reprise", "vibraphone-and-pad"], ["提灯确认彼此后共同望向窗边", "安宁而期待"], ["河岸照清彼此的小灯最终成为不会熄灭的归家坐标", "每次回家都会经过今晚留下的那束光", ["灯光回环", "归家坐标"]]),
    createCombination("shared-recipe", ["grocery-bag", "recipe-note"], "共同版本", [0.09, 900], ["kitchen-chain", "食材标记依照手写步骤排成连续得分跑线", "市场颜色按共同食谱逐项归位"], ["kitchen-groove", "mallets-and-kitchen-percussion"], ["确认改动后重新分配手中食材", "忙碌而默契"], ["食材与写满改动的食谱共同完成只属于这张餐桌的味道", "以后做同一道菜时，分工会自然开始", ["共同食谱", "厨房分工"]]),
    createCombination("keys-of-trust", ["brass-key", "spare-key"], "从开门到托付", [0.11, 1100], ["trusted-doorway", "两次钥匙转动依次解除道路屏障并形成安全通道", "厨房灯与雨棚尽头的门灯同时稳定亮起"], ["key-resolution", "bell-piano-and-horn"], ["摊开备用钥匙后与原钥匙并握", "郑重而信任"], ["第一次被允许进入的门，后来成为愿意彼此托付的门", "钥匙的意义会从地址变成关系中的信任", ["钥匙", "托付"]]),
    createCombination("plants-grow-home", ["small-plant", "house-plant"], "一起照看的生长", [0.08, 1000], ["green-continuity", "两组叶脉纹路连续覆盖从旧窗边到新家的跑线", "晨光绿色逐渐长成完整室内层次"], ["growth-reprise", "kalimba-and-strings"], ["托稳花盆并与身侧步幅保持一致", "耐心而有盼望"], ["填上窗边空格的小绿植长成共同照看的生活习惯", "未来会由浇水这样具体的小事持续确认", ["共同照看", "生长"]]),
    createCombination("table-at-dawn", ["kitchen-towel", "morning-bread"], "摆好的清晨", [0.07, 800], ["table-continuity", "格纹稳定跑线接住连续的面包得分点", "晚餐暖光平滑过渡到清晨餐桌"], ["table-morning", "brushes-and-acoustic-piano"], ["铺好格纹后把仍温热的面包放到中央", "有序而满足"], ["郑重摆好的晚餐位置变成每天都能坐下的早餐位置", "仪式感会留在普通日常的具体动作里", ["餐桌", "清晨"]]),
    createCombination("words-open-home", ["folded-note", "home-key"], "说清以后回家", [0.12, 1200], ["clear-homeward", "清楚的纸面跑线穿过风暴并接入完整归家通道", "冷雨输入框光彻底退去，只留下稳定窗灯"], ["home-spoken", "cello-piano-and-strings"], ["收好短笺后把两把钥匙放在同一掌心", "坦诚而安心"], ["暴雨里说清的每句话让共同的门能够真正长久打开", "以后分歧仍会回到面对面说完整的选择", ["坦诚", "共同的家"]])
  ];

  function createGameplay(effect, strength, durationMs) {
    const roundedStrength = Number(strength.toFixed(2));
    const channels = Object.fromEntries(GAMEPLAY_EFFECTS.map((name) => {
      const active = name === effect;
      return [name, {
        active,
        strength: active ? roundedStrength : 0,
        durationMs: active ? durationMs : 0
      }];
    }));
    if (effect === "magnet") channels.magnet.radiusMultiplier = Number((1 + roundedStrength).toFixed(2));
    if (effect === "shield") channels.shield.hitCapacity = 1 + Math.floor(roundedStrength * 2);
    if (effect === "multiplier") channels.multiplier.scoreMultiplier = Number((1 + roundedStrength).toFixed(2));
    if (effect === "overdrive") channels.overdrive.speedMultiplier = Number((1 + roundedStrength * 0.4).toFixed(2));
    return {
      effect,
      type: effect,
      strength: roundedStrength,
      intensity: Math.min(1, roundedStrength),
      durationMs,
      ...channels
    };
  }

  function createInteractionProfile(item) {
    const spec = INTERACTION_PROFILE_SPECS[item.id];
    if (!spec) throw new Error(`missing interaction profile: ${item.id}`);
    const [effect, strength, durationMs] = spec.gameplay;
    const [changeType, roadChange, environmentChange, worldIntensity] = spec.world;
    const [layer, timbre, musicIntensity] = spec.music;
    const [immediateAction, emotion, characterIntensity] = spec.character;
    const [currentEvent, laterEcho, memoryTags] = spec.narrative;
    const combinations = INTERACTION_COMBINATIONS
      .filter((combination) => combination.itemIds.includes(item.id))
      .map((combination) => ({
        id: combination.id,
        name: combination.name,
        withItemIds: combination.itemIds.filter((id) => id !== item.id),
        bonus: combination.bonus,
        world: combination.world,
        music: combination.music,
        character: combination.character,
        narrative: combination.narrative
      }));
    if (!combinations.length) throw new Error(`missing interaction combination: ${item.id}`);
    return deepFreeze({
      itemId: item.id,
      stage: item.stage,
      gameplay: createGameplay(effect, strength, durationMs),
      world: { changeType, roadChange, environmentChange, intensity: worldIntensity },
      music: { layer, timbre, intensity: musicIntensity },
      character: { immediateAction, action: immediateAction, emotion, intensity: characterIntensity },
      narrative: { currentEvent, laterEcho, memoryTags: memoryTags.slice() },
      synergy: { combinations }
    });
  }

  const definedItemIds = new Set(STORY_ITEM_DEFINITIONS.map((item) => item.id));
  Object.keys(INTERACTION_PROFILE_SPECS).forEach((itemId) => {
    if (!definedItemIds.has(itemId)) throw new Error(`interaction profile references unknown item: ${itemId}`);
  });
  INTERACTION_COMBINATIONS.forEach((combination) => combination.itemIds.forEach((itemId) => {
    if (!definedItemIds.has(itemId)) throw new Error(`interaction combination references unknown item: ${itemId}`);
  }));

  const INTERACTION_PROFILES = Object.fromEntries(STORY_ITEM_DEFINITIONS.map((item) => [item.id, createInteractionProfile(item)]));
  const STORY_ITEMS = STORY_ITEM_DEFINITIONS.map((item) => ({ ...item, interactionProfile: INTERACTION_PROFILES[item.id] }));
  const STAGE_ITEM_IDS = STAGES.map((stage) => STORY_ITEMS.filter((item) => item.stage === stage.order).map((item) => item.id));

  const ROUTE_SET_PIECES = [
    { stage: 1, venues: ["香樟道", "玻璃连廊", "图书馆路口"], obstacles: ["crowd", "puddle", "barrier"], gestures: ["switch", "jump", "slide"] },
    { stage: 2, venues: ["河堤", "唱片店", "桥下书店"], obstacles: ["bicycle", "book-cart", "awning"], gestures: ["switch", "jump", "slide"] },
    { stage: 3, venues: ["站前街", "地铁站", "旧城电影院"], obstacles: ["service-cart", "train", "signal-gate"], gestures: ["switch", "jump", "slide"] },
    { stage: 4, venues: ["夜市", "音乐广场", "河岸长椅"], obstacles: ["stall", "barrier", "awning"], gestures: ["switch", "jump", "slide"] },
    { stage: 5, venues: ["早餐店", "清晨市场", "亮灯的厨房"], obstacles: ["delivery-cart", "grocery-crate", "signal-gate"], gestures: ["switch", "jump", "slide"] },
    { stage: 6, venues: ["高架桥", "封路街口", "河桥雨棚"], obstacles: ["warning", "puddle", "maintenance"], gestures: ["switch", "jump", "slide"] },
    { stage: 7, venues: ["黎明站台", "熟悉长街", "有灯的家"], obstacles: ["luggage", "barrier", "awning"], gestures: ["switch", "jump", "slide"] }
  ];

  const ARRIVAL_SCENES = [
    { stage: 1, id: "awning-recognition", venue: "图书馆路口", camera: "跟跑转屋檐双人中景", durationMs: 4300, defaultItemId: "shared-umbrella" },
    { stage: 2, id: "bookstore-conversation", venue: "桥下书店", camera: "推门跟拍转桌边近景", durationMs: 4500, defaultItemId: "paperback" },
    { stage: 3, id: "cinema-arrival", venue: "旧城电影院", camera: "冲出站口转影院灯牌", durationMs: 4700, defaultItemId: "cinema-ticket" },
    { stage: 4, id: "riverside-night", venue: "河岸长椅", camera: "夜市穿行转河面环绕", durationMs: 4800, defaultItemId: "instant-camera" },
    { stage: 5, id: "kitchen-light", venue: "亮灯的厨房", camera: "钥匙入锁转室内暖景", durationMs: 4800, defaultItemId: "grocery-bag" },
    { stage: 6, id: "bridge-shelter", venue: "河桥雨棚", camera: "雨中长焦转并肩近景", durationMs: 5000, defaultItemId: "folded-note" },
    { stage: 7, id: "home-at-dawn", venue: "有灯的家", camera: "黎明长跟转门内晨光", durationMs: 5600, defaultItemId: "home-key" }
  ];

  const COLLECTIBLES = STAGES.map((stage, index) => {
    const signature = STORY_ITEMS.find((item) => item.id === ARRIVAL_SCENES[index].defaultItemId);
    return { ...signature, signature: true, items: STAGE_ITEM_IDS[index] };
  });

  const OBSTACLES = [
    { id: "puddle", stages: [1, 3, 6], name: "积水", cue: "地面反光", response: "jump" },
    { id: "crowd", stages: [1, 2, 4, 5], name: "人潮", cue: "路线交错", response: "switch" },
    { id: "barrier", stages: [1, 4, 7], name: "矮栏", cue: "警示反光", response: "jump" },
    { id: "signal-gate", stages: [3, 5, 7], name: "低闸", cue: "关闭提示", response: "slide" },
    { id: "train", stages: [3, 7], name: "进站列车", cue: "车灯靠近", response: "switch" },
    { id: "service-cart", stages: [2, 3, 5], name: "手推车", cue: "滚轮声", response: "switch" },
    { id: "awning", stages: [2, 4, 6], name: "低矮雨棚", cue: "垂下布帘", response: "slide" },
    { id: "warning", stages: [6], name: "封路警示", cue: "红灯连续闪烁", response: "switch" }
  ];

  const ROAD_MODULES = ROUTE_SET_PIECES.flatMap((route) => route.venues.map((venue, index) => ({
    id: `stage-${route.stage}-route-${index + 1}`,
    stage: route.stage,
    name: venue,
    mechanic: index === 2 ? "抵达" : index === 1 ? "途中选择" : "城市穿行",
    length: index === 2 ? 18 : 34
  })));

  const STAGE_PERFORMANCES = STAGES.map((stage, index) => ({
    id: `arrival-${stage.id}`,
    stage: stage.order,
    durationMs: ARRIVAL_SCENES[index].durationMs,
    camera: ARRIVAL_SCENES[index].camera,
    venue: ARRIVAL_SCENES[index].venue,
    line: stage.arrival
  }));

  const STAGE_ENDINGS = STAGES.map((stage, index) => ({
    id: `stage-ending-${stage.id}`,
    stage: stage.order,
    title: ["她认出了你", "话题没有结束", "准时抵达", "今晚还很长", "灯已经亮了", "终于见面", "下一站，回家"][index],
    line: stage.arrival
  }));

  const FINAL_ENDINGS = {
    S: { id: "ending-s-one-perfect-night", grade: "S", title: "每次都刚刚好", line: "你没有把约会安排得毫无意外，却认真接住了沿途发生的一切。", coda: "门里的灯亮着，下一段路从这里继续。" },
    A: { id: "ending-a-arrived", grade: "A", title: "今晚，抵达", line: "有些路线绕了远路，有些东西没能带到，但你还是出现在约定的地方。", coda: "她打开门，晨光刚好越过你的肩膀。" },
    B: { id: "ending-b-unplanned", grade: "B", title: "意外的一晚", line: "错过的车、淋湿的外套和临时改变的路线，也成了只属于你们的故事。", coda: "不是完美的一晚，却是一场真实发生的见面。" }
  };

  function stableIndex(seed, salt, length) {
    if (typeof seed !== "string" && (typeof seed !== "number" || !Number.isFinite(seed))) throw new TypeError("seed must be a finite number or string");
    const input = `${salt}|${seed}`;
    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) % length;
  }

  function getStage(value) {
    if (typeof value !== "number" && typeof value !== "string") throw new TypeError("stage must be a number or id");
    const stage = STAGES.find((entry) => entry.order === value || entry.id === value);
    if (!stage) throw new RangeError(`unknown stage: ${value}`);
    return stage;
  }

  function getItem(value) {
    if (typeof value !== "string") throw new TypeError("item id must be a string");
    const item = STORY_ITEMS.find((entry) => entry.id === value);
    if (!item) throw new RangeError(`unknown item: ${value}`);
    return item;
  }

  function getInteractionProfile(itemId) {
    return getItem(itemId).interactionProfile;
  }

  function getCollectible(value) {
    if (typeof value !== "number" && typeof value !== "string") throw new TypeError("collectible must be a stage or id");
    const item = COLLECTIBLES.find((entry) => entry.stage === value || entry.id === value);
    if (!item) throw new RangeError(`unknown collectible: ${value}`);
    return item;
  }

  function getEnding(grade) {
    if (typeof grade !== "string") throw new TypeError("grade must be a string");
    const ending = FINAL_ENDINGS[grade.toUpperCase()];
    if (!ending) throw new RangeError(`unknown ending: ${grade}`);
    return ending;
  }

  function getRoute(value) {
    const stage = getStage(value);
    return ROUTE_SET_PIECES[stage.order - 1];
  }

  function selectStageItem(options) {
    if (!options || typeof options !== "object") throw new TypeError("options are required");
    const stage = getStage(options.stage);
    if (!Array.isArray(options.excludeIds || [])) throw new TypeError("excludeIds must be an array");
    const items = STORY_ITEMS.filter((item) => item.stage === stage.order && !(options.excludeIds || []).includes(item.id));
    if (!items.length) throw new RangeError("all stage items are excluded");
    return items[stableIndex(options.seed === undefined ? 0 : options.seed, `item-${stage.id}`, items.length)];
  }

  function selectArrival(options) {
    if (!options || typeof options !== "object") throw new TypeError("options are required");
    const stage = getStage(options.stage);
    const scene = ARRIVAL_SCENES[stage.order - 1];
    const supplied = Array.isArray(options.itemIds) ? options.itemIds.filter((id) => STORY_ITEMS.some((item) => item.id === id && item.stage === stage.order)) : [];
    const itemId = supplied.length ? supplied[stableIndex(options.seed === undefined ? 0 : options.seed, `arrival-${stage.id}`, supplied.length)] : scene.defaultItemId;
    const item = getItem(itemId);
    return deepFreeze({ ...scene, itemId: item.id, itemName: item.name, action: item.action, line: item.line });
  }

  function resolveCollectionInteraction(options) {
    if (!options || typeof options !== "object" || Array.isArray(options)) throw new TypeError("interaction options are required");
    const item = getItem(options.itemId);
    const collectedItemIds = options.collectedItemIds === undefined ? [] : options.collectedItemIds;
    const combo = options.combo === undefined ? 0 : options.combo;
    const stageIndex = options.stageIndex === undefined ? item.stage - 1 : options.stageIndex;
    if (!Array.isArray(collectedItemIds)) throw new TypeError("collectedItemIds must be an array");
    if (!Number.isInteger(combo)) throw new TypeError("combo must be an integer");
    if (combo < 0) throw new RangeError("combo must not be negative");
    if (!Number.isInteger(stageIndex)) throw new TypeError("stageIndex must be an integer");
    if (stageIndex < 0 || stageIndex >= STAGES.length) throw new RangeError(`unknown stage index: ${stageIndex}`);

    const collectedSet = new Set();
    collectedItemIds.forEach((collectedItemId) => {
      const collectedItem = getItem(collectedItemId);
      collectedSet.add(collectedItem.id);
    });
    const normalizedCollectedItemIds = STORY_ITEMS.filter((entry) => collectedSet.has(entry.id)).map((entry) => entry.id);
    const profile = item.interactionProfile;
    const activeCombinations = profile.synergy.combinations.filter((combination) => (
      combination.withItemIds.every((partnerId) => collectedSet.has(partnerId))
    ));
    const cappedCombo = Math.min(combo, 30);
    const comboTier = combo >= 24 ? "crescendo" : combo >= 12 ? "flow" : combo >= 6 ? "linked" : "base";
    const itemStageIndex = item.stage - 1;
    const stageRelation = stageIndex === itemStageIndex ? "current" : stageIndex > itemStageIndex ? "echo" : "preview";
    const comboStrengthBonus = Number((cappedCombo * 0.006).toFixed(2));
    const stageStrengthBonus = stageRelation === "current" ? 0.04 : stageRelation === "echo" ? 0.02 : 0;
    const synergyStrengthBonus = Number(activeCombinations.reduce((sum, combination) => sum + combination.bonus.strength, 0).toFixed(2));
    const comboDurationBonusMs = cappedCombo * 60;
    const stageDurationBonusMs = stageRelation === "current" ? 400 : stageRelation === "echo" ? 200 : 0;
    const synergyDurationBonusMs = activeCombinations.reduce((sum, combination) => sum + combination.bonus.durationMs, 0);
    const resolvedStrength = Math.min(1, Number((profile.gameplay.strength + comboStrengthBonus + stageStrengthBonus + synergyStrengthBonus).toFixed(2)));
    const resolvedDurationMs = Math.min(12000, profile.gameplay.durationMs + comboDurationBonusMs + stageDurationBonusMs + synergyDurationBonusMs);
    const resolvedGameplay = createGameplay(profile.gameplay.effect, resolvedStrength, resolvedDurationMs);
    const resolvedMemoryTags = [...new Set([
      ...profile.narrative.memoryTags,
      ...activeCombinations.flatMap((combination) => combination.narrative.memoryTags)
    ])];
    const matchedItemIds = [...new Set(activeCombinations.flatMap((combination) => combination.withItemIds))];
    const worldIntensity = Math.min(1, Number((profile.world.intensity + cappedCombo * 0.003 + activeCombinations.length * 0.05).toFixed(2)));
    const musicIntensity = Math.min(1, Number((profile.music.intensity + cappedCombo * 0.004 + activeCombinations.length * 0.05).toFixed(2)));
    const characterIntensity = Math.min(1, Number((profile.character.intensity + cappedCombo * 0.003 + activeCombinations.length * 0.04).toFixed(2)));

    return deepFreeze({
      itemId: item.id,
      itemName: item.name,
      stageIndex,
      stageOrder: stageIndex + 1,
      stageRelation,
      combo,
      comboTier,
      collectedItemIds: normalizedCollectedItemIds,
      gameplay: {
        ...resolvedGameplay,
        baseStrength: profile.gameplay.strength,
        baseDurationMs: profile.gameplay.durationMs,
        bonuses: {
          comboStrength: comboStrengthBonus,
          stageStrength: stageStrengthBonus,
          synergyStrength: synergyStrengthBonus,
          comboDurationMs: comboDurationBonusMs,
          stageDurationMs: stageDurationBonusMs,
          synergyDurationMs: synergyDurationBonusMs
        }
      },
      world: {
        ...profile.world,
        intensity: worldIntensity,
        synergyChanges: activeCombinations.map((combination) => ({ id: combination.id, name: combination.name, ...combination.world }))
      },
      music: {
        ...profile.music,
        intensity: musicIntensity,
        layers: [profile.music.layer, ...activeCombinations.map((combination) => combination.music.layer)],
        timbres: [profile.music.timbre, ...activeCombinations.map((combination) => combination.music.timbre)],
        synergyAccents: activeCombinations.map((combination) => ({ id: combination.id, name: combination.name, ...combination.music }))
      },
      character: {
        ...profile.character,
        intensity: characterIntensity,
        synergyActions: activeCombinations.map((combination) => ({ id: combination.id, name: combination.name, ...combination.character }))
      },
      narrative: {
        ...profile.narrative,
        laterEchoes: [profile.narrative.laterEcho, ...activeCombinations.map((combination) => combination.narrative.laterEcho)],
        memoryTags: resolvedMemoryTags,
        synergyEvents: activeCombinations.map((combination) => ({ id: combination.id, name: combination.name, ...combination.narrative }))
      },
      synergy: {
        active: activeCombinations,
        matchedItemIds,
        strengthBonus: synergyStrengthBonus,
        durationBonusMs: synergyDurationBonusMs
      }
    });
  }

  [STAGES, STORY_ITEMS, STAGE_ITEM_IDS, ROUTE_SET_PIECES, ARRIVAL_SCENES, COLLECTIBLES, OBSTACLES, ROAD_MODULES, STAGE_PERFORMANCES, STAGE_ENDINGS, FINAL_ENDINGS, GAMEPLAY_EFFECTS, INTERACTION_COMBINATIONS, INTERACTION_PROFILES].forEach(deepFreeze);

  return deepFreeze({
    STAGES,
    STORY_ITEMS,
    STAGE_ITEM_IDS,
    ROUTE_SET_PIECES,
    ARRIVAL_SCENES,
    COLLECTIBLES,
    OBSTACLES,
    ROAD_MODULES,
    STAGE_PERFORMANCES,
    STAGE_ENDINGS,
    FINAL_ENDINGS,
    GAMEPLAY_EFFECTS,
    INTERACTION_COMBINATIONS,
    INTERACTION_PROFILES,
    getStage,
    getItem,
    getInteractionProfile,
    getCollectible,
    getEnding,
    getRoute,
    selectStageItem,
    selectArrival,
    resolveCollectionInteraction
  });
});
