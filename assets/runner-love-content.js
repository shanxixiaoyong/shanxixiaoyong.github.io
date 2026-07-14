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
      arrival: "路口的红灯亮起，她站在屋檐下，认出了从雨里赶来的你。",
      continuity: {
        fromPrevious: "一张多年没有再亮起的头像，忽然出现在雨后的消息栏。",
        chapterTurn: "曾经只在走廊擦肩的人，第一次为彼此停在同一个路口。",
        toNext: "她把伞柄递回来，又提起桥下那家刚开门的旧书店。"
      },
      openingPerformance: {
        id: "message-after-rain", durationMs: 6200, trigger: "放学铃停下，手机在空教室里轻震。",
        beats: [
          { id: "empty-classroom", atMs: 0, durationMs: 1800, camera: "雨痕窗面缓慢推向最后一排", action: "你收起写到一半的笔记，窗外有人群涌向校门。", line: "雨好像停了。" },
          { id: "familiar-avatar", atMs: 1800, durationMs: 2100, camera: "手机近景映出窗外摇晃的香樟叶", action: "那句迟疑的确认在屏幕上停了几秒。", line: "刚才是不是在香樟路看见你了？" },
          { id: "run-to-crossing", atMs: 3900, durationMs: 2300, camera: "从门口甩到走廊尽头的跟跑镜头", action: "你抓起外套冲出教室，潮湿的风迎面吹来。", line: "等我一下。" }
        ]
      },
      sceneMood: { location: "旧校园西侧", mood: "熟悉景物里重新冒出的紧张与期待", ambience: "檐水、远处球场哨声、鞋底踏过湿砖", motif: "倒影里总比现实早一步出现她的身影" },
      timeWeather: { timeOfDay: "放学后的傍晚", start: "16:52", end: "17:16", condition: "短雨刚停", progression: "零星檐水先落，香樟道中段再来一阵太阳雨，路口云缝透出夕照" },
      colorPalette: { description: "雨后青绿与夕照金", sky: "铅灰转淡金", ground: "湿砖深绿与水面银白", architecture: "旧墙灰白", accent: "消息提示的珊瑚红", transition: "越接近图书馆，暖金越多地落进冷色倒影" },
      landmarks: [
        { id: "west-classroom-arcade", name: "旧教学楼雨廊", segmentId: "campus-release", visualRole: "连续窗格映出奔跑剪影", storyRole: "把迟疑留在教室里" },
        { id: "camphor-vending-light", name: "香樟道自动贩卖机", segmentId: "sun-shower-lane", visualRole: "冷白灯照亮雨丝和两罐饮料", storyRole: "第一次主动带上可以分享的东西" },
        { id: "library-clock-crossing", name: "图书馆钟楼与路口", segmentId: "library-crossing", visualRole: "钟面、红灯和屋檐构成清楚终点", storyRole: "让再次看见变成真正见面" }
      ],
      roadDesign: { identity: "会保存倒影的校园跑线", laneCount: 3, material: "旧红砖、香樟根拱起的沥青、粗颗粒斑马线", structure: "窄雨廊起步，进入树列弯道，再收束到信号路口", movement: "先在人潮缝隙侧移，再跨过积水，最后在屋檐下减速" },
      obstacleDesign: {
        semantics: [
          { id: "departing-student-stream", name: "散开的放学人潮", meaning: "熟悉面孔不断打断寻找", cue: "伞尖与书包先向两侧分流", response: "switch" },
          { id: "camphor-root-puddle", name: "树根积水带", meaning: "想快一点，却不能弄湿一路护住的东西", cue: "倒影被连续雨滴打碎", response: "jump" },
          { id: "library-delivery-rail", name: "图书馆送书矮栏", meaning: "终点已经看见，最后一段仍需沉住气", cue: "银色栏杆反射钟楼暖光", response: "slide" }
        ],
        combinations: [
          { id: "corridor-release", name: "人潮开口", obstacleIds: ["departing-student-stream", "library-delivery-rail"], cadence: "侧移后立刻俯身", storyMeaning: "从被动跟随人群变成主动选择方向" },
          { id: "reflection-hop", name: "倒影三连", obstacleIds: ["camphor-root-puddle", "camphor-root-puddle", "departing-student-stream"], cadence: "两次短跳接一次换道", storyMeaning: "她的倒影在每次落地后更近一点" },
          { id: "red-light-arrival", name: "红灯前的收步", obstacleIds: ["departing-student-stream", "library-delivery-rail"], cadence: "换到中央后从栏下穿过", storyMeaning: "赶路的慌张在看见她时慢下来" }
        ]
      },
      segments: [
        { id: "campus-release", order: 1, name: "铃声之后", progress: [0, 0.3], storyBeat: "沿雨廊追上刚刚散开的放学人潮。", worldChange: "教室冷白灯逐间熄灭，手机暖光成为最亮的方向。", roadChange: "湿砖直道在连廊柱间周期收窄。", landmarkIds: ["west-classroom-arcade"], obstacleCombinationIds: ["corridor-release"], collectibleItemIds: ["dropped-photo", "library-bookmark"], propIds: ["campus-bell-rope"], transition: "一阵横风把照片与银杏叶同时卷向香樟道。" },
        { id: "sun-shower-lane", order: 2, name: "香樟太阳雨", progress: [0.3, 0.7], storyBeat: "雨重新落下，你在树影和积水间护住要带去的东西。", worldChange: "稀薄阳光穿过雨丝，倒影由灰转金。", roadChange: "拱起的树根把三条跑线切成高低交替的小坡。", landmarkIds: ["camphor-vending-light"], obstacleCombinationIds: ["reflection-hop"], collectibleItemIds: ["shared-umbrella", "warm-can"], propIds: ["vending-change-slot"], transition: "钟楼报时，雨势减弱，前方红灯映进整片积水。" },
        { id: "library-crossing", order: 3, name: "路口看见", progress: [0.7, 1], storyBeat: "穿过最后一批自行车，在图书馆屋檐前认出她。", worldChange: "环境声被红灯倒计时压低，她的身影从人群中保持清晰。", roadChange: "弯曲沥青拉直为斑马线，三道最终汇成屋檐下的一条干燥线。", landmarkIds: ["library-clock-crossing"], obstacleCombinationIds: ["red-light-arrival"], collectibleItemIds: ["pocket-candy", "shared-umbrella"], propIds: ["crossing-countdown"], transition: "红灯亮起，奔跑停住，故事第一次留出并肩的位置。" }
      ],
      stageProps: [
        { id: "campus-bell-rope", name: "仍在轻晃的铃绳", segmentId: "campus-release", storyUse: "碰过铃绳，走廊尽头的回声会替脚步打拍。", worldResponse: "窗格依次亮起一小段夕光。" },
        { id: "vending-change-slot", name: "卡着一枚硬币的售货机", segmentId: "sun-shower-lane", storyUse: "推回硬币，机器掉下第二罐温热饮料。", worldResponse: "冷白灯转成一圈琥珀暖光。" },
        { id: "crossing-countdown", name: "旧路口倒计时灯", segmentId: "library-crossing", storyUse: "倒计时归零前，屋檐下的人向前走了一步。", worldResponse: "红色数字在积水里拉成长线。" }
      ],
      destinationDetail: { name: "图书馆路口", landmarkId: "library-clock-crossing", approach: "从斑马线中央减速到屋檐下", arrivalAction: "你把伞向她那边倾斜，她先叫出了你的名字。", storyPayoff: "一次不确定的确认，终于变成面对面的重逢。", nextHook: "她说桥下书店明早开门，伞可以在那里还。" }
    },
    {
      id: "familiar-steps", order: 2, name: "渐渐熟悉", metric: "同行",
      scene: "清晨河堤与书店", destination: "桥下书店", district: "glass-station",
      palette: "晨雾蓝与纸页白", weather: "河面升起薄雾",
      objective: "沿着共同喜欢的事物，跑向下一次见面",
      opening: "她说桥下新开了一家小店，问你要不要一起去看看。",
      arrival: "玻璃门被推开，你带来的东西恰好接上了昨晚没聊完的话题。",
      continuity: {
        fromPrevious: "图书馆路口分别后，那把透明雨伞成了第二天见面的自然理由。",
        chapterTurn: "归还一件东西的短暂碰面，被共同的书、音乐和河风拉成长谈。",
        toNext: "她在明信片背面写下电影名，又圈出周五晚上的场次。"
      },
      openingPerformance: {
        id: "umbrella-return-note", durationMs: 6500, trigger: "清晨第一班电车驶过河桥，伞柄上别着一张小纸条。",
        beats: [
          { id: "dry-umbrella", atMs: 0, durationMs: 1900, camera: "窗边静物转向河面晨雾", action: "晾干的透明伞靠在门边，昨晚的水痕已经消失。", line: "伞收到了，谢谢。" },
          { id: "bookstore-invite", atMs: 1900, durationMs: 2300, camera: "纸条字迹近景叠化为桥下店招", action: "新消息跟着亮起，地址正落在河堤尽头。", line: "桥下新开了一家小店，要不要一起去看看？" },
          { id: "levee-start", atMs: 4200, durationMs: 2300, camera: "低机位贴着单车道向晨雾深处推进", action: "你把她提过的书装进背包，沿河向桥影跑去。", line: "我带一本书来。" }
        ]
      },
      sceneMood: { location: "旧河堤文化街", mood: "从客气试探逐渐变成忘记时间的自在", ambience: "车铃、河水拍岸、唱片店门铃与翻页声", motif: "每一次停留都会打开下一处可以一起去的地方" },
      timeWeather: { timeOfDay: "周末清晨到上午", start: "08:06", end: "09:18", condition: "薄雾无雨", progression: "河面雾气先遮住远岸，日光越过桥梁后逐段照亮店铺玻璃" },
      colorPalette: { description: "晨雾蓝与纸页白", sky: "雾蓝转清透浅青", ground: "灰白石板与潮湿木栈道", architecture: "砖红桥墩和深绿店门", accent: "柠檬黄与唱片紫", transition: "由低饱和河雾进入书店木色暖光" },
      landmarks: [
        { id: "levee-mile-stones", name: "河堤旧里程碑", segmentId: "misty-levee", visualRole: "在雾中依次显出手写数字", storyRole: "把下一次见面变成可以期待的距离" },
        { id: "underbridge-record-window", name: "桥洞唱片橱窗", segmentId: "record-alley", visualRole: "旋转黑胶把晨光切成移动光斑", storyRole: "发现两个人记得同一段前奏" },
        { id: "bookstore-glass-door", name: "桥下书店玻璃门", segmentId: "bookstore-threshold", visualRole: "雾气在门外，暖木桌在门内", storyRole: "让短暂见面自然延长成一个上午" }
      ],
      roadDesign: { identity: "沿河展开的闲逛路线", laneCount: 3, material: "防洪石板、桥洞旧轨砖、书店木平台", structure: "开阔堤岸缓弯，穿入回声桥洞，再沿窄阶抬升到玻璃门", movement: "长步巡航、跟随车铃换道、在店铺遮棚下连续俯身" },
      obstacleDesign: {
        semantics: [
          { id: "levee-bicycle-bells", name: "晨练自行车列", meaning: "还不熟悉的同行需要学会预留位置", cue: "车铃从雾里由远及近", response: "switch" },
          { id: "record-crate-ramp", name: "卸货唱片箱", meaning: "共同爱好突然出现，脚步也跟着轻快", cue: "唱片封套在箱顶排成斜面", response: "jump" },
          { id: "bookstore-canvas-valance", name: "书店低垂布檐", meaning: "越靠近约定地点，越要收住只顾向前的速度", cue: "布边铜铃先响", response: "slide" }
        ],
        combinations: [
          { id: "bell-weave", name: "雾中车铃", obstacleIds: ["levee-bicycle-bells", "levee-bicycle-bells", "record-crate-ramp"], cadence: "两次换道接一次跃上木栈道", storyMeaning: "从各跑各的速度调成能够并肩的节奏" },
          { id: "groove-and-crates", name: "唱片回旋", obstacleIds: ["record-crate-ramp", "bookstore-canvas-valance", "record-crate-ramp"], cadence: "跳、俯身、再跳", storyMeaning: "共同旋律让桥洞里的绕路也值得停留" },
          { id: "quiet-threshold", name: "门前慢下来", obstacleIds: ["levee-bicycle-bells", "bookstore-canvas-valance"], cadence: "避开单车后从布檐下进入", storyMeaning: "赶到门口不是结束，而是谈话真正开始" }
        ]
      },
      segments: [
        { id: "misty-levee", order: 1, name: "雾里沿河", progress: [0, 0.36], storyBeat: "循着纸条上的手绘箭头，沿河堤寻找桥洞店铺。", worldChange: "远岸藏在雾里，里程碑和车铃先于景物出现。", roadChange: "平直石板逐渐接入有弹性的木栈道。", landmarkIds: ["levee-mile-stones"], obstacleCombinationIds: ["bell-weave"], collectibleItemIds: ["river-postcard", "lemon-soda"], propIds: ["fogged-route-board"], transition: "日光穿过第一座桥孔，一段唱片前奏从暗处传来。" },
        { id: "record-alley", order: 2, name: "桥洞同一首歌", progress: [0.36, 0.72], storyBeat: "在唱片铺与旧货摊之间，发现她提过的那张唱片。", worldChange: "桥洞回声按唱片重拍循环，墙面光斑缓慢旋转。", roadChange: "旧轨砖形成环形岔道，正确方向跟随音乐回到主线。", landmarkIds: ["underbridge-record-window"], obstacleCombinationIds: ["groove-and-crates"], collectibleItemIds: ["record", "cat-treat"], propIds: ["listening-post"], transition: "唱针抬起，书店门铃从桥洞另一头接过最后一个音。" },
        { id: "bookstore-threshold", order: 3, name: "把话聊完", progress: [0.72, 1], storyBeat: "沿窄阶来到玻璃门，把昨晚没聊完的话题带到她面前。", worldChange: "雾蓝逐渐退到门外，旧木桌与纸页暖光填满近景。", roadChange: "坡阶压缩为单线门槛，越过后展开成安静的室内长桌。", landmarkIds: ["bookstore-glass-door"], obstacleCombinationIds: ["quiet-threshold"], collectibleItemIds: ["paperback", "bookstore-coffee", "cat-treat"], propIds: ["door-cat-bell"], transition: "她把靠窗的位置向外拉开，桌上还空着一半。" }
      ],
      stageProps: [
        { id: "fogged-route-board", name: "起雾的河堤地图牌", segmentId: "misty-levee", storyUse: "擦开一角，桥下书店的手绘标记与纸条笔迹完全相同。", worldResponse: "雾里出现一列淡蓝方向箭头。" },
        { id: "listening-post", name: "桥洞试听机", segmentId: "record-alley", storyUse: "按下旧按钮，她提过的前奏从单边耳机里响起。", worldResponse: "轨砖缝隙按节拍亮起紫色细线。" },
        { id: "door-cat-bell", name: "系着猫铃的门挡", segmentId: "bookstore-threshold", storyUse: "挪开门挡，店里的猫先跑向她常坐的位置。", worldResponse: "门铃与猫铃叠成轻快的两声。" }
      ],
      destinationDetail: { name: "桥下书店", landmarkId: "bookstore-glass-door", approach: "沿桥墩窄阶推开起雾的玻璃门", arrivalAction: "她接过归还的伞，把靠窗椅子拉到自己身边。", storyPayoff: "原本只为还伞的见面，被共同话题留成一整个上午。", nextHook: "她在河堤明信片上写下电影名：周五，要不要一起看？" }
    },
    {
      id: "first-date", order: 3, name: "第一次赴约", metric: "准时",
      scene: "霓虹站前街", destination: "旧城电影院", district: "neon-river",
      palette: "夜色蓝与影院暖红", weather: "远处刚亮起霓虹",
      objective: "赶上末班车，把这次邀请变成真正的见面",
      opening: "手机屏幕亮起：电影七点四十开始，我在门口等你。",
      arrival: "影院灯牌在雨雾里亮着，她看了眼时间，又笑着朝你挥手。",
      continuity: {
        fromPrevious: "桥下书店的明信片一直夹在书里，圈出的周五终于到了。",
        chapterTurn: "一次说出口的邀请，让熟悉的聊天第一次带上正式赴约的紧张。",
        toNext: "片尾灯亮起时雨还没停，她没有走向车站，而是指了指河边夜市。"
      },
      openingPerformance: {
        id: "cinema-clock-start", durationMs: 6700, trigger: "站前大钟跳到七点零八分，临时停运提示同时亮起。",
        beats: [
          { id: "tickets-in-pocket", atMs: 0, durationMs: 1800, camera: "两张票根近景拉到拥堵站前街", action: "你确认口袋里的电影票，又护住刚买好的两杯咖啡。", line: "还有三十二分钟。" },
          { id: "platform-change", atMs: 1800, durationMs: 2500, camera: "电子站牌红字横移到手机消息", action: "原本的站台关闭，影院那边发来一句安静的等待。", line: "别急，我在灯牌下面。" },
          { id: "choose-night-route", atMs: 4300, durationMs: 2400, camera: "高机位扫过车流后俯冲到人行通道", action: "你转向旧线入口，沿着霓虹反光开始赶路。", line: "我会到。" }
        ]
      },
      sceneMood: { location: "旧城交通枢纽", mood: "时间压力里的郑重与克制兴奋", ambience: "报站声、列车制动、远处影院预告与细雨", motif: "所有时钟都在催促，只有她的消息让画面短暂停住" },
      timeWeather: { timeOfDay: "周五入夜", start: "19:08", end: "19:40", condition: "低云与间歇细雨", progression: "站前风把雨吹成斜线，地下通道短暂干燥，影院街口再落一层薄雾" },
      colorPalette: { description: "夜色蓝与影院暖红", sky: "深钴蓝", ground: "黑亮沥青与地铁白砖", architecture: "旧城褐砖和银色轨道", accent: "影院钨丝红与票根奶白", transition: "冷蓝交通灯逐步让位给影院暖红" },
      landmarks: [
        { id: "station-clock-tower", name: "站前大钟", segmentId: "station-rush", visualRole: "指针与列车倒计时同框", storyRole: "让赴约的郑重有了明确时间" },
        { id: "old-line-platform", name: "旧线弧形站台", segmentId: "last-train-transfer", visualRole: "车窗格光连续掠过弯道", storyRole: "把临时改道变成愿意多走的一段路" },
        { id: "cinema-marquee", name: "旧城影院灯牌", segmentId: "marquee-approach", visualRole: "暖红字牌穿透街口雨雾", storyRole: "她站在所有催促的终点耐心等待" }
      ],
      roadDesign: { identity: "与倒计时赛跑的城市动线", laneCount: 3, material: "站前沥青、地铁防滑白砖、影院街黄铜嵌条", structure: "开放街口转入地下折返，再从狭长出口冲向灯牌广场", movement: "密集短换道、长距离俯身穿闸、出站后的持续冲刺" },
      obstacleDesign: {
        semantics: [
          { id: "station-suitcase-wave", name: "滚轮行李潮", meaning: "陌生人的行程交错，自己的目的地必须保持清楚", cue: "滚轮声先从左右声道靠近", response: "switch" },
          { id: "closing-fare-gates", name: "连续闭合闸门", meaning: "犹豫会让路线真正关上", cue: "橙灯从远端依次转红", response: "slide" },
          { id: "platform-service-cart", name: "站台补给车", meaning: "赶时间也要护住为她带去的心意", cue: "杯架与车轮同时轻响", response: "jump" }
        ],
        combinations: [
          { id: "clockwork-crowd", name: "钟下交错", obstacleIds: ["station-suitcase-wave", "station-suitcase-wave", "closing-fare-gates"], cadence: "左右换道后穿过半落闸门", storyMeaning: "从混乱人流中守住赴约方向" },
          { id: "last-transfer", name: "末班换乘", obstacleIds: ["platform-service-cart", "closing-fare-gates", "station-suitcase-wave"], cadence: "跃过推车、俯身过闸、落地换道", storyMeaning: "临时变化没有削弱想见面的确定" },
          { id: "marquee-sprint", name: "灯牌冲刺", obstacleIds: ["station-suitcase-wave", "platform-service-cart"], cadence: "向暖红跑线切入后长跳", storyMeaning: "城市噪声在她挥手时全部退到身后" }
        ]
      },
      segments: [
        { id: "station-rush", order: 1, name: "大钟之下", progress: [0, 0.34], storyBeat: "带着两张票穿过晚高峰，寻找仍开放的旧线入口。", worldChange: "报站字幕不断改写，只有影院方向保持暖红。", roadChange: "宽阔沥青被护栏切成频繁交叉的三股人流。", landmarkIds: ["station-clock-tower"], obstacleCombinationIds: ["clockwork-crowd"], collectibleItemIds: ["coffee-pair", "cinema-flower"], propIds: ["departure-flipboard"], transition: "站牌翻到末班提示，地下入口的绿灯只剩最后一格。" },
        { id: "last-train-transfer", order: 2, name: "旧线末班", progress: [0.34, 0.73], storyBeat: "冲过即将闭合的闸门，在弧形站台赶上旧线列车。", worldChange: "车窗外的城市被切成高速后退的蓝色光格。", roadChange: "白砖直道转入站台弧线，闸门形成高低交替的节奏。", landmarkIds: ["old-line-platform"], obstacleCombinationIds: ["last-transfer"], collectibleItemIds: ["last-train-pass", "rain-umbrella"], propIds: ["platform-call-box"], transition: "列车门打开，影院预告的低音从出口楼梯上方传来。" },
        { id: "marquee-approach", order: 3, name: "灯暗之前", progress: [0.73, 1], storyBeat: "沿旧城雨街冲向影院，在开场灯暗下前把票递到她手里。", worldChange: "街边霓虹逐块熄灭，影院完整片名一字一字亮起。", roadChange: "出站窄梯骤然展开成带黄铜导线的影院前广场。", landmarkIds: ["cinema-marquee"], obstacleCombinationIds: ["marquee-sprint"], collectibleItemIds: ["cinema-ticket", "soundtrack-record", "cinema-flower"], propIds: ["marquee-letter-box"], transition: "最后一个灯牌字亮起，她从檐下朝你挥手。" }
      ],
      stageProps: [
        { id: "departure-flipboard", name: "仍会翻页的旧站牌", segmentId: "station-rush", storyUse: "手动拨回一格，旧线入口从停运信息后露出来。", worldResponse: "散乱目的地收束成一条暖红箭头。" },
        { id: "platform-call-box", name: "站台铜制呼叫盒", segmentId: "last-train-transfer", storyUse: "按下按钮，车门为最后一位乘客多停两秒。", worldResponse: "弧形警示灯从红色回到绿色。" },
        { id: "marquee-letter-box", name: "影院灯牌字匣", segmentId: "marquee-approach", storyUse: "扶正被风吹歪的片名字牌，门厅光随之完整亮起。", worldResponse: "暖红倒影铺到她等待的位置。" }
      ],
      destinationDetail: { name: "旧城电影院", landmarkId: "cinema-marquee", approach: "从地铁旧出口冲上灯牌广场", arrivalAction: "你递出两张票，她接走已经微凉的那杯咖啡。", storyPayoff: "准时抵达并不只关乎电影，而是让邀请得到认真回应。", nextHook: "散场后雨声还轻，她问：夜市没关，要不要再走一会儿？" }
    },
    {
      id: "heart-spoken", order: 4, name: "约会正发生", metric: "今晚",
      scene: "夜市与河岸", destination: "河岸长椅", district: "date-market",
      palette: "玫红霓虹与灯笼暖橙", weather: "夜风穿过摊位",
      objective: "让今晚的路线自然长成只属于你们的一晚",
      opening: "电影散场还早，她问：要不要再走一会儿？",
      arrival: "河面映着城市灯光，今晚带来的每件小东西都有了去处。",
      continuity: {
        fromPrevious: "影院散场灯亮起，赶路的紧张被一场完整电影慢慢放松。",
        chapterTurn: "没有计划的续场，让两个人第一次不借共同爱好也愿意继续相处。",
        toNext: "河岸分别前，她把那张拍立得照片塞进你口袋，背面写着明早想吃的东西。"
      },
      openingPerformance: {
        id: "after-credit-walk", durationMs: 6400, trigger: "片尾曲结束，门厅时钟还没有走到十点。",
        beats: [
          { id: "lobby-reflection", atMs: 0, durationMs: 1900, camera: "影院镜面墙里两道身影并肩走出", action: "人群向车站散去，你们却在门口同时慢下来。", line: "电影比想象中好。" },
          { id: "market-lights-on", atMs: 1900, durationMs: 2200, camera: "镜头越过她肩头望见河边灯笼", action: "远处夜市刚点亮最后一排灯，她指向相反方向。", line: "要不要再走一会儿？" },
          { id: "no-map-start", atMs: 4100, durationMs: 2300, camera: "手持跟拍穿入第一排摊位", action: "你收起回程路线，没有问终点就跟上她。", line: "好啊，走到河边。" }
        ]
      },
      sceneMood: { location: "旧城河畔夜市", mood: "从精心赴约走向毫无准备的亲近", ambience: "摊贩叫卖、演出低音、纸袋摩擦与河风", motif: "路线越偏离计划，两个人的步幅越自然一致" },
      timeWeather: { timeOfDay: "电影散场后的夜晚", start: "21:48", end: "23:12", condition: "雨停后的清凉夜风", progression: "夜市蒸汽仍暖，音乐广场风势渐强，河岸上空最终露出少量星光" },
      colorPalette: { description: "玫红霓虹与灯笼暖橙", sky: "近黑靛青", ground: "油亮石砖与河岸灰木", architecture: "彩棚红、舞台银和桥体青灰", accent: "拍立得白与小灯金", transition: "高饱和夜市逐段退成河岸低亮暖光" },
      landmarks: [
        { id: "lantern-food-gate", name: "灯笼夜市门", segmentId: "market-taste", visualRole: "密集暖灯形成不断开合的入口", storyRole: "从正式约会进入轻松共享的夜晚" },
        { id: "open-air-music-stage", name: "露天音乐台", segmentId: "music-crowd", visualRole: "扫描灯与人群手环同步闪动", storyRole: "留下第一张没有准备的共同照片" },
        { id: "riverside-bench-lamp", name: "旧河岸长椅", segmentId: "quiet-river", visualRole: "一盏小灯照亮长椅与水面", storyRole: "在热闹结束后确认仍想继续相处" }
      ],
      roadDesign: { identity: "从拥挤热闹逐渐走向安静的夜游线", laneCount: 3, material: "夜市防滑砖、舞台钢板、河岸木栈道", structure: "摊位蛇形窄道，音乐广场开放回环，最后降到贴水单向栈道", movement: "连续换道穿摊、按重拍跨越线缆、沿河风稳定长跑" },
      obstacleDesign: {
        semantics: [
          { id: "market-steam-carts", name: "交错出摊车", meaning: "两个人开始替彼此看见拥挤里的空位", cue: "蒸汽先从轮下横向掠过", response: "switch" },
          { id: "stage-cable-ramps", name: "舞台线缆坡", meaning: "共同节拍让突兀障碍变成可以一起跨过的拍点", cue: "荧光胶带沿线缆依次亮起", response: "jump" },
          { id: "lantern-crossbars", name: "低垂灯笼横杆", meaning: "越热闹的地方越需要留意身边的人", cue: "流苏先扫过画面上沿", response: "slide" }
        ],
        combinations: [
          { id: "shared-snack-weave", name: "一半一半", obstacleIds: ["market-steam-carts", "lantern-crossbars", "market-steam-carts"], cadence: "换道、俯身、回到并肩线", storyMeaning: "分享一只纸袋也分享穿过人群的判断" },
          { id: "chorus-jumps", name: "副歌三拍", obstacleIds: ["stage-cable-ramps", "stage-cable-ramps", "lantern-crossbars"], cadence: "两次重拍跳接一次长俯身", storyMeaning: "不熟悉的热闹因为牵住袖口而变得自在" },
          { id: "river-breath", name: "河风留白", obstacleIds: ["market-steam-carts", "stage-cable-ramps"], cadence: "避开末班摊车后轻跳上木栈道", storyMeaning: "热闹退去后，两个人仍然没有急着分别" }
        ]
      },
      segments: [
        { id: "market-taste", order: 1, name: "最后一口", progress: [0, 0.38], storyBeat: "穿过即将收摊的夜市，把想尝的东西各留一半。", worldChange: "食物蒸汽把影院冷雨色温彻底推成暖橙。", roadChange: "摊位把砖路压成左右不断交替的窄缝。", landmarkIds: ["lantern-food-gate"], obstacleCombinationIds: ["shared-snack-weave"], collectibleItemIds: ["night-snack", "single-flower"], propIds: ["last-stall-sign"], transition: "远处副歌盖过叫卖声，一列发光手环向广场移动。" },
        { id: "music-crowd", order: 2, name: "没有准备的合照", progress: [0.38, 0.74], storyBeat: "跟着人群挤到音乐台前，在副歌里按下一次快门。", worldChange: "扫描灯把四周切成短暂定格的彩色画面。", roadChange: "石砖接入有弹性的舞台钢板，线缆坡与重拍对齐。", landmarkIds: ["open-air-music-stage"], obstacleCombinationIds: ["chorus-jumps"], collectibleItemIds: ["music-wristband", "instant-camera"], propIds: ["chorus-light-console"], transition: "演出熄灯后，拍立得白边在黑暗里慢慢显出两张笑脸。" },
        { id: "quiet-river", order: 3, name: "灯下慢下来", progress: [0.74, 1], storyBeat: "离开散场人群，沿手绘地图找到贴近水面的旧长椅。", worldChange: "霓虹退到远岸，只剩小灯、河面和彼此的侧脸。", roadChange: "开放广场收成平缓单向木栈道，步幅由冲刺转为并肩。", landmarkIds: ["riverside-bench-lamp"], obstacleCombinationIds: ["river-breath"], collectibleItemIds: ["river-map", "riverside-lamp", "instant-camera"], propIds: ["bench-coin-lamp"], transition: "小灯被拧亮，照片背面多了一行约定早餐的字。" }
      ],
      stageProps: [
        { id: "last-stall-sign", name: "翻到最后一份的木牌", segmentId: "market-taste", storyUse: "把木牌翻回正面，摊主把最后一份分进两个小纸袋。", worldResponse: "两条暖橙香气线短暂并行。" },
        { id: "chorus-light-console", name: "无人照看的灯光台", segmentId: "music-crowd", storyUse: "推起最后一根滑杆，副歌灯光恰好照亮快门。", worldResponse: "扫描光锁定一段安全的重拍跑线。" },
        { id: "bench-coin-lamp", name: "投币才亮的长椅灯", segmentId: "quiet-river", storyUse: "夜市找回的硬币落下，小灯照清照片上没准备好的笑。", worldResponse: "远岸反光收束到长椅四周。" }
      ],
      destinationDetail: { name: "河岸长椅", landmarkId: "riverside-bench-lamp", approach: "从音乐广场沿贴水栈道放慢脚步", arrivalAction: "你们把小灯放在中间，一起等照片显影。", storyPayoff: "不再需要电影或书作为理由，仍愿意把夜晚继续留给彼此。", nextHook: "照片背面写着：明早如果醒得早，帮我带两份早餐。" }
    },
    {
      id: "shared-days", order: 5, name: "错开的日常", metric: "对时",
      scene: "清晨市场与搬家街区", destination: "亮灯的厨房", district: "home-quarter",
      palette: "生活绿、时钟蓝与早餐暖黄", weather: "晴朗晨光被楼影切成两条路线",
      objective: "护住手里的日常，并看清两份同时改变的约定为何错开",
      opening: "早餐店催取，交房人提前；两件原本错开的事，突然挤进同一小时。",
      arrival: "厨房的定时灯亮着却没有人；街角交房点也刚落下卷帘。你们都按自己看到的约定抵达了。",
      continuity: {
        fromPrevious: "河岸照片后来贴上冰箱，早餐、采购和谁带钥匙都有了不用再说的分工。",
        chapterTurn: "熟练的默契遇上同时变化的时间表，两个人都做对了手里的事，却走向不同地点。",
        toNext: "两处空位终于让错开的时间显形；这一次，谁也不准备继续隔着消息猜。"
      },
      openingPerformance: {
        id: "two-clocks-change", durationMs: 6400, trigger: "六点四十二分，早餐取餐牌和交房通知同时跳到更早的时间。",
        beats: [
          { id: "ordinary-baseline", atMs: 0, durationMs: 1800, camera: "冰箱照片下移到并排的早餐夹与钥匙盘", action: "你拿购物袋，她拿文件袋；动作熟练得没有人再确认。", line: "还是照旧。" },
          { id: "two-updates", atMs: 1800, durationMs: 2200, camera: "取餐牌与交房通知在画面两侧同时翻页", action: "早餐必须提前取，交房人也临时提前；两只时钟同时快了一格。", line: "时间都改了。" },
          { id: "opposite-exits", atMs: 4000, durationMs: 2400, camera: "门厅俯拍，两个人从相反出口离开后路线短暂交叉", action: "你循着旧清单去市场，她带着新标签去交钥匙。", line: "等会儿厨房见。" }
        ]
      },
      sceneMood: { location: "住处与新家之间的清晨街区", mood: "熟悉日常中的细小错位逐步显形", ambience: "煎锅、市场铜铃、两处卷帘门与不同步的整点报时", motif: "同一只时钟在玻璃反射里始终分成快慢两面" },
      timeWeather: { timeOfDay: "搬家日清晨", start: "06:42", end: "07:28", condition: "晴朗，昨夜雨水未干", progression: "早餐蒸汽先遮住钟面，市场棚影把路线分开，定时灯最终照亮空着的厨房" },
      colorPalette: { description: "生活绿、时钟蓝与早餐暖黄", sky: "清浅青白", ground: "洗净灰砖、市场绿垫与楼梯水磨石", architecture: "旧住处米白墙和交房点冷蓝玻璃", accent: "番茄红、黄铜金与时间牌蓝", transition: "早餐暖色与交房冷色并行，最终停在两个无人位置" },
      landmarks: [
        { id: "corner-breakfast-window", name: "转角早餐窗口", segmentId: "breakfast-block", visualRole: "两只熟客木夹旁突然亮起提前取餐灯", storyRole: "先建立可靠日常，再让第一处时间变化可见" },
        { id: "covered-morning-market", name: "双钟有顶市场", segmentId: "market-list", visualRole: "市场钟与交房塔钟隔街显示不同时间", storyRole: "让旧分工与新安排同时保持合理" },
        { id: "kitchen-lit-window", name: "定时亮起的三楼厨房", segmentId: "stairway-home", visualRole: "暖窗与街角交房点在分屏中同时无人", storyRole: "用两个空位揭示错位，而非指责任何一方" }
      ],
      roadDesign: { identity: "两份合理日程互相擦过的双时钟路线", laneCount: 3, material: "清晨灰砖、市场防滑胶垫、住宅水磨石楼梯", structure: "早餐街建立共同节奏，市场网格分成采购与交房方向，末段在上下层擦过后抵达两处空位", movement: "护住纸袋、按旧清单取物、辨认新钥匙标签，再在交叉楼梯看见迟到的另一条路线" },
      obstacleDesign: {
        semantics: [
          { id: "breakfast-delivery-bikes", name: "逆向送餐车", meaning: "稳定日常仍需要保护手里承诺的状态", cue: "保温箱反光先扫过墙面", response: "switch" },
          { id: "market-produce-crates", name: "双标记菜箱", meaning: "旧清单仍有效，新时间也同样真实", cue: "食材标签与钥匙标签使用两种颜色", response: "jump" },
          { id: "stairwell-laundry-bars", name: "交叉楼层晾杆", meaning: "相隔一层的两条路能擦过，却来不及互相看见", cue: "另一道人影先掠过栏杆缝隙", response: "slide" }
        ],
        combinations: [
          { id: "breakfast-balance", name: "旧默契仍在", obstacleIds: ["breakfast-delivery-bikes", "stairwell-laundry-bars", "breakfast-delivery-bikes"], cadence: "护袋换道、俯身、回到取餐线", storyMeaning: "玩家表现只改变早餐温度，不改变两份新通知同时发生" },
          { id: "shopping-list-grid", name: "两只时钟", obstacleIds: ["market-produce-crates", "breakfast-delivery-bikes", "market-produce-crates"], cadence: "跨箱、切线、再跨箱", storyMeaning: "采购路线与交钥匙路线都在各自时间内成立" },
          { id: "three-floor-home", name: "上下层擦过", obstacleIds: ["stairwell-laundry-bars", "market-produce-crates"], cadence: "从晾杆下穿过后跃上错层平台", storyMeaning: "两个人近到能看见影子，却分别抵达两个合理终点" }
        ]
      },
      segments: [
        { id: "breakfast-block", order: 1, name: "照旧的早晨", progress: [0, 0.31], storyBeat: "按熟悉分工取走两份早餐；取餐牌与交房通知在身后同时提前。", worldChange: "木夹先并排晃动，随后两只电子钟跳到不同的新时间。", roadChange: "早餐街保持熟悉折线，出口却第一次分成市场与交房两向。", landmarkIds: ["corner-breakfast-window"], obstacleCombinationIds: ["breakfast-balance"], collectibleItemIds: ["breakfast-bag", "kitchen-towel"], propIds: ["breakfast-order-clips"], transition: "你带走仍热的纸袋；她的钥匙文件袋已从另一扇门离开。" },
        { id: "market-list", order: 2, name: "两条都对的路", progress: [0.31, 0.72], storyBeat: "你按旧默契完成采购，她按新通知赶去交钥匙；两条路线隔着市场并行。", worldChange: "食材灯逐项亮起，远处交房塔钟也逐格倒数，双方都没有停下。", roadChange: "棋盘市场被高架步道切成上下两层，偶尔能看见另一条路线的影子。", landmarkIds: ["covered-morning-market"], obstacleCombinationIds: ["shopping-list-grid"], collectibleItemIds: ["grocery-bag", "small-plant", "brass-key"], propIds: ["market-scale-bell"], transition: "市场铃与交房卷帘同时响起，两道人影在街角前后擦过。" },
        { id: "stairway-home", order: 3, name: "两个空位", progress: [0.72, 1], storyBeat: "沿错层楼梯追过熟悉背影，最终只在厨房和交房点各留下一个空位。", worldChange: "厨房定时灯与交房台灯同时亮起，镜头分开后两边都没有人。", roadChange: "上下层交叉一次便彻底分离，末段分别指向楼梯门与落下的卷帘。", landmarkIds: ["kitchen-lit-window"], obstacleCombinationIds: ["three-floor-home"], collectibleItemIds: ["recipe-note", "brass-key", "kitchen-towel"], propIds: ["third-floor-doorbell"], transition: "完整或压皱的早餐、清单和钥匙标签留在画面里；错开的事实不因操作好坏改变。" }
      ],
      stageProps: [
        { id: "breakfast-order-clips", name: "两只熟客木夹", segmentId: "breakfast-block", storyUse: "木夹仍按旧口味并排，旁边的取餐灯却提前亮起。", worldResponse: "蒸汽保持两道，墙上时钟同时快进一格。" },
        { id: "market-scale-bell", name: "夹着旧清单的市场秤", segmentId: "market-list", storyUse: "每称好一样食材，旧清单划掉一项；秤背后闪过交房倒计时。", worldResponse: "暖色摊位与冷蓝时钟在上下路线同步推进。" },
        { id: "third-floor-doorbell", name: "带定时灯的门铃", segmentId: "stairway-home", storyUse: "门铃记录显示她来过又离开；交房台也留下你的未接标记。", worldResponse: "暖厨房与冷交房点被同一声整点钟分成两半。" }
      ],
      destinationDetail: { name: "亮灯的厨房", landmarkId: "kitchen-lit-window", approach: "从交叉楼梯看见另一道人影后抵达三楼", arrivalAction: "镜头同时展开厨房与交房点：你们分别放下纸袋和钥匙文件袋，又同时看向空位。", storyPayoff: "没有人失约；旧默契没有赶上两项同时改变的新安排。", nextHook: "两部手机同时亮起。你们没有继续打字，而是约在河桥雨棚见面。" }
    },
    {
      id: "rough-weather", order: 6, name: "先听完", metric: "留步",
      scene: "暴雨高架与旧桥", destination: "河桥雨棚", district: "storm-bridge",
      palette: "风暴蓝与信号红", weather: "阵雨压低城市灯光",
      objective: "放下准备好的解释，进入雨棚侧线，等她表达完再一起腾出位置",
      opening: "你把解释折进口袋。雨刚落下，纸边已经开始洇开。",
      arrival: "短笺已经无法辨认。她先说完，你等到她点头，才一起把落水链移开。修复从这里开始。",
      continuity: {
        fromPrevious: "厨房与交房点各自空着，早餐和钥匙标签证明双方都曾按自己看到的时间抵达。",
        chapterTurn: "准备好的漂亮解释被雨水抹掉，真正要做的是改道、减速，并把表达的空间让给对方。",
        toNext: "问题没有在雨棚下消失；你们各自拿着一把钥匙，决定先把清晨那段路共同走完。"
      },
      openingPerformance: {
        id: "ink-runs-before-words", durationMs: 7000, trigger: "河桥雨势突然加大，折好的短笺在第一阵横雨里吸满水。",
        beats: [
          { id: "folded-explanation", atMs: 0, durationMs: 1900, camera: "短笺与两张不同时间的通知并排近景", action: "你把两处时间圈在纸上，试图先整理出完整解释。", line: "见面说。" },
          { id: "ink-runs", atMs: 1900, durationMs: 2300, camera: "墨迹沿折痕扩散，字形在雨滴下失去边界", action: "纸没有被保护成功；解释还未抵达就已经无法照读。", line: "字看不清了。" },
          { id: "shelter-side-signal", atMs: 4200, durationMs: 2800, camera: "高架跟跑转向雨棚侧轨的稳定白灯", action: "她的身影停在侧线，没有靠近，也没有离开。", line: "先过去。" }
        ]
      },
      sceneMood: { location: "暴雨中的高架旧桥区", mood: "从急于说明逐步转为克制倾听", ambience: "桥底雷声、排水泵、封路广播、落水链与变慢的脚步", motif: "墨迹越模糊，雨棚侧面的两道人影越清楚" },
      timeWeather: { timeOfDay: "深夜暴雨", start: "22:26", end: "23:03", condition: "强对流阵雨", progression: "高架下横雨最密，封路街口积水上涨，靠近河桥后雷声远去但雨仍持续" },
      colorPalette: { description: "风暴蓝与信号红", sky: "近黑蓝灰", ground: "积水钢蓝与油污虹彩", architecture: "混凝土冷灰和锈蚀铁色", accent: "封路红、短笺白与可可暖褐", transition: "刺眼警示红逐步收束为雨棚下一盏稳定白灯" },
      landmarks: [
        { id: "flyover-pump-house", name: "高架排水泵房", segmentId: "under-flyover", visualRole: "强光把横雨照成密集斜线", storyRole: "所有急着解释的话先被天气压住" },
        { id: "flooded-closure-crossing", name: "积水封路街口", segmentId: "closure-detour", visualRole: "红色警示牌在水面反复断裂", storyRole: "旧路线走不通，只能主动寻找新的靠近方式" },
        { id: "river-bridge-shelter", name: "河桥旧雨棚", segmentId: "shelter-approach", visualRole: "侧面白灯先照亮她的动作，再照亮被共同移开的落水链", storyRole: "让等待与腾出位置成为可见的修复动作" }
      ],
      roadDesign: { identity: "从冲刺线转为等待线的雨夜修复路线", laneCount: 3, material: "高架粗面混凝土、涉水防滑板、旧桥铆钉钢板", structure: "桥柱间横向折返，封路口出现主动侧轨，最后在雨棚前收束为可停下的双人位置", movement: "先接受短笺失效，再切入雨棚侧轨降速，保持不越过她的表达标记，最后共同移链" },
      obstacleDesign: {
        semantics: [
          { id: "crosswind-warning-sheets", name: "横风警示布", meaning: "情绪会遮住眼前方向，必须等看清再改变路线", cue: "红布先被风拉直到横跨跑线", response: "slide" },
          { id: "storm-drain-surges", name: "排水槽涌流", meaning: "水会必然浸透短笺，不能再依赖准备好的台词", cue: "白色水线从槽口迅速抬高", response: "jump" },
          { id: "closure-light-chicane", name: "封路灯阵", meaning: "原来的路被阻断，靠近仍可以有另一条路线", cue: "红灯由近到远交替闪烁", response: "switch" },
          { id: "bridge-maintenance-frame", name: "旧桥维修架", meaning: "靠近之后先停下，等对方动作结束再回应", cue: "垂落链条先挡住单人直冲线", response: "slide" }
        ],
        combinations: [
          { id: "storm-truth", name: "墨迹散开", obstacleIds: ["crosswind-warning-sheets", "storm-drain-surges", "closure-light-chicane"], cadence: "俯身、长跳、逆向换道", storyMeaning: "短笺必然失效，玩家只能决定纸张是否仍被带到雨棚" },
          { id: "closed-road-choice", name: "主动走侧线", obstacleIds: ["closure-light-chicane", "storm-drain-surges", "closure-light-chicane"], cadence: "切入侧轨、涉水跳、保持侧线", storyMeaning: "正确推进不是更快，而是主动选择能看见对方的慢路线" },
          { id: "shelter-last-steps", name: "等她说完", obstacleIds: ["bridge-maintenance-frame", "storm-drain-surges"], cadence: "保持位置，信号结束后再俯身移链", storyMeaning: "先听见完整表达，再共同处理挡在两人之间的现实物件" }
        ]
      },
      segments: [
        { id: "under-flyover", order: 1, name: "字先被雨抹掉", progress: [0, 0.32], storyBeat: "穿过高架横雨；短笺必然洇湿，无法再替任何人完成表达。", worldChange: "纸上墨迹流进路面积水，手机与字幕光逐项熄灭。", roadChange: "急促折返把直冲路线切断，泵房白光只保留可读地面。", landmarkIds: ["flyover-pump-house"], obstacleCombinationIds: ["storm-truth"], collectibleItemIds: ["folded-note", "dry-towel"], propIds: ["pump-house-shutter"], transition: "不可辨认的短笺仍留在口袋，前方出现一条明显更慢的雨棚侧轨。" },
        { id: "closure-detour", order: 2, name: "把速度放下来", progress: [0.32, 0.7], storyBeat: "主动切入雨棚侧轨并维持低速，让镜头从追赶转为与她并行。", worldChange: "警示红减少，雨点与脚步降为半拍，她的手势第一次完整可见。", roadChange: "高低板桥分出快速直线与低速侧线；只有侧线持续通向雨棚。", landmarkIds: ["flooded-closure-crossing"], obstacleCombinationIds: ["closed-road-choice"], collectibleItemIds: ["hot-cocoa", "rain-flower"], propIds: ["closure-route-lamp"], transition: "她先转身面对你，画面留出一段没有收集物和障碍的距离。" },
        { id: "shelter-approach", order: 3, name: "先听完", progress: [0.7, 1], storyBeat: "保持位置等她表达结束；收到动作信号后，两个人从两侧共同移开落水链。", worldChange: "侧面白灯先只照亮她，等待完成后才扩成能站下两人的宽度。", roadChange: "最后一段先静止，再开放左右两条短线共同汇入雨棚干燥区。", landmarkIds: ["river-bridge-shelter"], obstacleCombinationIds: ["shelter-last-steps"], collectibleItemIds: ["mended-ticket", "spare-key", "folded-note"], propIds: ["shelter-drip-chain"], transition: "两把钥匙仍分别留在两个人手里；雨棚只是修复的起点。" }
      ],
      stageProps: [
        { id: "pump-house-shutter", name: "卡住的泵房百叶", segmentId: "under-flyover", storyUse: "拉开百叶，排水泵恢复转动，淹没的旧路标重新露出。", worldResponse: "近处积水开始退成可辨认的三条线。" },
        { id: "closure-route-lamp", name: "倒向水面的绕行灯", segmentId: "closure-detour", storyUse: "扶正灯架，侧巷箭头第一次被完整照亮。", worldResponse: "红灯不再乱闪，而是依次指向河桥。" },
        { id: "shelter-drip-chain", name: "雨棚落水链", segmentId: "shelter-approach", storyUse: "她先握住一侧；等她点头后，你从另一侧同时移开。", worldResponse: "落水改向两边，中央出现不偏向任何人的双人位置。" }
      ],
      destinationDetail: { name: "河桥雨棚", landmarkId: "river-bridge-shelter", approach: "从低速侧轨进入白灯边缘，先停在她动作线之外", arrivalAction: "她先表达，你等待；收到点头后，两个人各握一侧移开落水链，各自保留一把钥匙。", storyPayoff: "没有立刻和好，也没有谁被一场奔赴说服；你们只是第一次用同一个动作开始修复。", nextHook: "雨小下来。两把钥匙分别装进口袋，清晨的车由两个人共同决定是否上车。" }
    },
    {
      id: "toward-home", order: 7, name: "共同承担", metric: "合流",
      scene: "黎明车站与长街", destination: "有灯的家", district: "sunrise-terminal",
      palette: "黎明靛蓝与窗灯金", weather: "天际线逐渐转亮",
      objective: "在相邻跑线间交换行李，分别打开两道锁，再共同跨进下一站",
      opening: "清晨第一班车进站。她把较重的箱子推到两条跑线之间。",
      arrival: "两把钥匙分别转动，两道锁先后打开。行李在门内换回手中，你们一起跨过门槛。",
      continuity: {
        fromPrevious: "河桥雨棚下说完的话没有抹掉争执，却让两个人没有取消原本约好的新家交接。",
        chapterTurn: "共同的家不再由一个人冲到终点证明，而由换手、等待和两次独立开锁共同完成。",
        toNext: "门打开以后，地图还留着许多空白；以后每次出发，都有同一盏灯等着回来。"
      },
      openingPerformance: {
        id: "first-train-handoff", durationMs: 7200, trigger: "暴雨后的第一班车进站，两只重量不同的行李箱停在相邻跑线。",
        beats: [
          { id: "separate-keys", atMs: 0, durationMs: 2100, camera: "两把钥匙分别留在两只手中，镜头下移到大小不同的行李箱", action: "没有交换承诺；她只把较重的箱子推到可换手的位置。", line: "这段我来。" },
          { id: "first-handoff", atMs: 2100, durationMs: 2400, camera: "平行侧拍，两人在车门前完成第一次行李换手", action: "重量改变两个人的步幅，另一人随即放慢半步。", line: "到下一段再换。" },
          { id: "paired-platform", atMs: 4500, durationMs: 2700, camera: "列车门打开后保持双人平行长跟", action: "两条跑线并列延伸，行李标签指向同一地址的两道锁。", line: "一起开门。" }
        ]
      },
      sceneMood: { location: "暴雨初晴后的黎明终点站", mood: "经历过迟疑后的安稳、清醒与共同期待", ambience: "首班车、行李轮、早店烤炉、街道清扫与逐渐醒来的城市", motif: "前六关出现过的声音与物件不再是回忆插图，而成为这条新路线的具体坐标" },
      timeWeather: { timeOfDay: "雨后黎明", start: "05:21", end: "06:18", condition: "云层散开，地面仍湿", progression: "站台残留薄雾，长街云隙逐渐发亮，门打开时第一束直射晨光进入室内" },
      colorPalette: { description: "黎明靛蓝与窗灯金", sky: "靛蓝转清晨珊瑚粉再到浅金", ground: "湿轨银、旧街青灰与门厅浅木", architecture: "站棚墨绿、街墙灰白和新家暖白", accent: "窗灯金、植物绿与相框玫红", transition: "由夜色残留的冷靛蓝完整过渡到有真实材质的室内晨光" },
      landmarks: [
        { id: "dawn-terminal-canopy", name: "黎明终点站棚", segmentId: "first-train-platform", visualRole: "雨滴沿玻璃棚边倒数落下", storyRole: "两个人第一次从同一个起点出发" },
        { id: "memory-crossroads", name: "七条旧路交会口", segmentId: "familiar-memory-street", visualRole: "书店招牌、影院灯牌与市场棚影在不同街角短暂出现", storyRole: "过去的地点不再拉回从前，而是证明一路如何走到这里" },
        { id: "home-window-beacon", name: "新街尽头亮窗", segmentId: "home-straight", visualRole: "稳定暖窗随天光变亮仍保持清晰", storyRole: "把共同选择落在一扇真正会打开的门上" }
      ],
      roadDesign: { identity: "通过换手与双锁合流完成的共同归家线", laneCount: 3, material: "站台磨石、旧街混合铺装、新家浅木台阶", structure: "玻璃站棚保留双人平行线，六段旧路动作依次回响，最终左右两线分别抵达一道门锁后合流", movement: "相邻换轨接手重量、用前六关动作通过旧路回响、各自在一侧完成开锁再并肩入门" },
      obstacleDesign: {
        semantics: [
          { id: "platform-rolling-luggage", name: "首班行李列", meaning: "重量真实改变步幅，必须在相邻跑线主动换手", cue: "较重箱子的轮迹先向两线中央靠拢", response: "switch" },
          { id: "street-cleaning-bars", name: "清扫横臂", meaning: "新开始不是空白，生活仍有需要共同处理的琐事", cue: "刷毛水线从路边横向展开", response: "slide" },
          { id: "dawn-repair-ramps", name: "晨修坡板", meaning: "修补过的地方也可以成为向上的落脚点", cue: "坡板边缘反射第一束日光", response: "jump" }
        ],
        combinations: [
          { id: "shared-departure", name: "重量换手", obstacleIds: ["platform-rolling-luggage", "street-cleaning-bars", "platform-rolling-luggage"], cadence: "相邻换轨接手、共同俯身、下一段换回", storyMeaning: "行李归属不变，承担者会随路况主动改变" },
          { id: "memory-reprise-road", name: "六次动作回声", obstacleIds: ["dawn-repair-ramps", "street-cleaning-bars", "dawn-repair-ramps"], cadence: "看见、调步、守约、并肩、停下、接手", storyMeaning: "前六关的关系动词变成必须由两条跑线共同完成的机械回声" },
          { id: "two-key-arrival", name: "双锁合流", obstacleIds: ["platform-rolling-luggage", "dawn-repair-ramps"], cadence: "左右分线各自开锁，门开后在中央合流", storyMeaning: "两次独立确认缺一不可，最后一步才由两个人共同完成" }
        ]
      },
      segments: [
        { id: "first-train-platform", order: 1, name: "重量换手", progress: [0, 0.29], storyBeat: "在相邻跑线间接过较重行李；重量改变姿态、速度和下一次换道时机。", worldChange: "两条独立轮迹在每次换手处短暂交叉，站台广播保持同一目的地。", roadChange: "玻璃棚下保留平行双线，换手点只在两线靠近时出现。", landmarkIds: ["dawn-terminal-canopy"], obstacleCombinationIds: ["shared-departure"], collectibleItemIds: ["travel-map", "morning-bread"], propIds: ["first-train-board"], transition: "出站前完成最后一次换手，两个人各自拿稳一件行李。" },
        { id: "familiar-memory-street", order: 2, name: "六次回声", progress: [0.29, 0.71], storyBeat: "两条跑线依次完成看见、调步、守约、并肩、停下与接手，不靠文字复述过去。", worldChange: "旧材质只在对应动作完成时亮起，随即融入清晨街道，不形成怀旧插图。", roadChange: "六段短拓扑轮流复现前六关的动作关系，双方各完成其中一半。", landmarkIds: ["memory-crossroads"], obstacleCombinationIds: ["memory-reprise-road"], collectibleItemIds: ["framed-photo", "house-plant"], propIds: ["memory-post-box"], transition: "六段路线在亮窗前收成左右两线，两把钥匙各自发出一次反光。" },
        { id: "home-straight", order: 3, name: "两道锁", progress: [0.71, 1], storyBeat: "分别沿左右跑线抵达两道门锁；两边都完成后，中央门缝才打开。", worldChange: "左锁亮起一半门厅，右锁补全另一半；门开后行李轮迹在中央合流。", roadChange: "三线先分成不可互换的左右锁线，双锁完成后才并成双人宽门槛。", landmarkIds: ["home-window-beacon"], obstacleCombinationIds: ["two-key-arrival"], collectibleItemIds: ["home-key", "window-lamp", "morning-bread"], propIds: ["home-entry-tray"], transition: "两把钥匙各自落入一格，行李换回手中，两个人同时跨进晨光。" }
      ],
      stageProps: [
        { id: "first-train-board", name: "带称重灯的首班车牌", segmentId: "first-train-platform", storyUse: "行李在两线之间换手时，重量灯从一侧移到另一侧。", worldResponse: "两条轮迹保持不同亮度，却始终指向同一出口。" },
        { id: "memory-post-box", name: "六格动作信箱", segmentId: "familiar-memory-street", storyUse: "每完成一次关系动作，一格机械翻片从旧符号转为空白新卡。", worldResponse: "六种旧材质依次出现又融入同一条晨光路。" },
        { id: "home-entry-tray", name: "双锁钥匙托盘", segmentId: "home-straight", storyUse: "两把钥匙先各开一道锁，再分别落入两格；中央不接受单把钥匙。", worldResponse: "左右门厅光各亮一半，双锁完成后在门槛中央相接。" }
      ],
      destinationDetail: { name: "有灯的家", landmarkId: "home-window-beacon", approach: "分别沿左右锁线抵达门前，再在开启后的中央门槛合流", arrivalAction: "她打开左锁，你打开右锁；门开后先交换行李，再一起跨进门内。", storyPayoff: "共同未来不是一把钥匙替两个人决定，而是各自确认、彼此接手，最后选择同一步。", nextHook: "地图在早餐桌上摊开，两件行李并排靠墙，下一次谁先接手仍由路况决定。" }
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
    { id: "breakfast-bag", stage: 5, name: "早餐纸袋", kind: "snack", color: "cream", carry: "hand", action: "breakfast", line: "两份口味都没有错；纸袋温度只记录这一路是否被护好。" },
    { id: "grocery-bag", stage: 5, name: "一袋食材", kind: "groceries", color: "green", carry: "hand", action: "carry", line: "旧清单被完整划完，袋底却压着一张刚更新的交房时间。" },
    { id: "brass-key", stage: 5, name: "黄铜钥匙", kind: "key", color: "gold", carry: "pocket", action: "handover", line: "钥匙标签写着新的交接时间；它正确，却没有出现在旧清单上。" },
    { id: "small-plant", stage: 5, name: "窗边绿植", kind: "plant", color: "green", carry: "hand", action: "protect", line: "花盆是否完好取决于路线；它最终仍被带到一间暂时空着的屋子。" },
    { id: "recipe-note", stage: 5, name: "折角食谱", kind: "note", color: "ivory", carry: "pocket", action: "compare", line: "正面的早餐约定没有变，背面的交房时间却已经改过。" },
    { id: "kitchen-towel", stage: 5, name: "格纹餐巾", kind: "cloth", color: "blue", carry: "backpack", action: "keep-dry", line: "餐巾仍为两个人准备，只是展开时桌子两侧都没有人。" },
    { id: "folded-note", stage: 6, name: "洇湿短笺", kind: "note", color: "ivory", carry: "pocket", action: "release-script", line: "墨迹已经无法辨认；这张纸只能证明准备过，不能替谁把话说完。" },
    { id: "hot-cocoa", stage: 6, name: "热可可", kind: "coffee", color: "amber", carry: "hand", action: "set-down", line: "杯子被放在两人之间，没有被当成道歉，也没有要求她立刻接过。" },
    { id: "dry-towel", stage: 6, name: "干燥毛巾", kind: "cloth", color: "blue", carry: "backpack", action: "leave-space", line: "毛巾挂在雨棚边缘，需要的人可以自己取走，不附带任何回答。" },
    { id: "mended-ticket", stage: 6, name: "拼好的旧票根", kind: "ticket", color: "rose", carry: "pocket", action: "acknowledge", line: "裂痕仍然清楚；拼合只让两边能被同时看见。" },
    { id: "rain-flower", stage: 6, name: "雨里的白花", kind: "flower", color: "ivory", carry: "hand", action: "wait", line: "花留在侧线，没有被递出去；等待本身成为这一段的动作。" },
    { id: "spare-key", stage: 6, name: "各自的钥匙", kind: "key", color: "gold", carry: "pocket", action: "retain", line: "两把钥匙分别留在两只手里；修复开始，但决定没有被替对方做出。" },
    { id: "travel-map", stage: 7, name: "折叠地图", kind: "map", color: "blue", carry: "backpack", action: "plan", line: "地图摊在桌上，下一条路线终于不再只属于一个人。" },
    { id: "home-key", stage: 7, name: "双锁钥匙", kind: "key", color: "gold", carry: "pocket", action: "dual-unlock", line: "左右两道锁各认一把钥匙；只有两边都转动，中央门缝才会亮起。" },
    { id: "window-lamp", stage: 7, name: "窗边小灯", kind: "lamp", color: "amber", carry: "hand", action: "light", line: "灯被放上窗台，回来的路从此总有一个清楚的坐标。" },
    { id: "morning-bread", stage: 7, name: "清晨面包", kind: "snack", color: "cream", carry: "hand", action: "handoff", line: "较轻的纸袋会在接过重箱时换到另一只手里，温度随每次换手继续前行。" },
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
      world: ["clear-words", "被雨打乱的岔路熄去文字提示，只留下通往雨棚的侧线", "输入框般的冷光退去，雨棚侧灯照亮她正在表达的动作", 0.81],
      music: ["spoken-line", "solo-cello", 0.72],
      character: ["松开已经洇湿的短笺并抬头等待对方说完", "忐忑但专注", 0.82],
      narrative: ["纸上的字已经无法辨认，准备好的解释让位于真正的倾听", "共同的门真正打开前，这次先听完会成为信任的依据", ["短笺", "倾听", "放下预设"]]
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
      character: ["两个人各自握住一把钥匙，沿左右跑线同时走向门口", "笃定而平等", 0.92],
      narrative: ["两把钥匙分别落进托盘的两格，确认了彼此独立作出的共同选择", "暴雨里先听完的话成为两道锁能够分别打开的基础", ["两把钥匙", "双锁", "共同选择"]]
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
  const ATTENTION_ACTIONS = new Set(["return", "shelter", "offer", "write", "listen", "feed", "wait", "leave-space"]);
  const REPAIR_ACTIONS = new Set(["release-script", "set-down", "acknowledge", "retain", "compare"]);
  const STORY_ITEMS = STORY_ITEM_DEFINITIONS.map((item) => ({
    ...item,
    relationshipAxis: REPAIR_ACTIONS.has(item.action) ? "repair" : ATTENTION_ACTIONS.has(item.action) ? "attention" : "mutuality",
    interactionProfile: INTERACTION_PROFILES[item.id]
  }));
  const STAGE_ITEM_IDS = STAGES.map((stage) => STORY_ITEMS.filter((item) => item.stage === stage.order).map((item) => item.id));

  const STAGE_DIRECTOR_SEGMENTS = [
    {
      stage: 1, stageId: "first-sight", segmentId: "campus-release", timeWindowSec: [0, 52],
      visibleGoal: "campus-bell-rope", actionGoal: "switch-through-arcade-opening",
      routeTopologyKey: "arcade-squeeze", cameraRigKey: "follow-column", rhythm: "release-weave", bpm: 96,
      nextSegmentId: "sun-shower-lane", storyVerb: "notice",
      physicalState: { subject: "dropped-photo", initial: "wind-loose", onSuccess: "caught-dry", onStrain: "splashed-edge", invariant: "photo-remains-visible" },
      worldState: { initial: "corridor-cold", onSuccess: "window-light-chase", onStrain: "window-light-paused", persistent: "bell-echo" }
    },
    {
      stage: 1, stageId: "first-sight", segmentId: "sun-shower-lane", timeWindowSec: [52, 118],
      visibleGoal: "vending-change-slot", actionGoal: "jump-root-ridges-and-protect-warm-can",
      routeTopologyKey: "root-undulation", cameraRigKey: "shoulder-beacon", rhythm: "sun-shower-sync", bpm: 108,
      nextSegmentId: "library-crossing", storyVerb: "make-room",
      physicalState: { subject: "warm-can", initial: "sealed-warm", onSuccess: "upright-warm", onStrain: "dented-cooling", invariant: "second-can-exists" },
      worldState: { initial: "rain-silver", onSuccess: "rain-gold-pulses", onStrain: "rain-gold-thins", persistent: "vending-amber" }
    },
    {
      stage: 1, stageId: "first-sight", segmentId: "library-crossing", timeWindowSec: [118, 180],
      visibleGoal: "crossing-countdown", actionGoal: "switch-to-dry-center-and-hold",
      routeTopologyKey: "crossing-converge", cameraRigKey: "tele-crossing", rhythm: "countdown-breath", bpm: 88,
      nextSegmentId: "misty-levee", storyVerb: "stop-together",
      physicalState: { subject: "shared-umbrella", initial: "folded-dry", onSuccess: "opened-between", onStrain: "opened-late", invariant: "crossing-stops-at-red" },
      worldState: { initial: "crowd-occluded", onSuccess: "awning-pair-clear", onStrain: "awning-pair-partial", persistent: "crossing-reflection" }
    },
    {
      stage: 2, stageId: "familiar-steps", segmentId: "misty-levee", timeWindowSec: [0, 58],
      visibleGoal: "fogged-route-board", actionGoal: "switch-on-shared-painted-arrow",
      routeTopologyKey: "levee-outer-curve", cameraRigKey: "river-offset", rhythm: "mist-step", bpm: 92,
      nextSegmentId: "record-alley", storyVerb: "follow-signal",
      physicalState: { subject: "river-postcard", initial: "blank-dry", onSuccess: "route-marked", onStrain: "corner-bent", invariant: "bookstore-mark-visible" },
      worldState: { initial: "levee-fogged", onSuccess: "milestones-reveal", onStrain: "milestones-faint", persistent: "river-arrow" }
    },
    {
      stage: 2, stageId: "familiar-steps", segmentId: "record-alley", timeWindowSec: [58, 122],
      visibleGoal: "listening-post", actionGoal: "jump-slide-on-shared-rhythm",
      routeTopologyKey: "bridge-groove-split", cameraRigKey: "portal-low", rhythm: "groove-call-response", bpm: 112,
      nextSegmentId: "bookstore-threshold", storyVerb: "match-rhythm",
      physicalState: { subject: "record", initial: "sleeved", onSuccess: "cue-aligned", onStrain: "dusty-edge", invariant: "same-intro-plays" },
      worldState: { initial: "bridge-echo-single", onSuccess: "bridge-echo-paired", onStrain: "bridge-echo-delayed", persistent: "groove-lights" }
    },
    {
      stage: 2, stageId: "familiar-steps", segmentId: "bookstore-threshold", timeWindowSec: [122, 180],
      visibleGoal: "door-cat-bell", actionGoal: "decelerate-through-door-funnel",
      routeTopologyKey: "bookstore-step-funnel", cameraRigKey: "door-lock", rhythm: "threshold-release", bpm: 84,
      nextSegmentId: "station-rush", storyVerb: "leave-a-place",
      physicalState: { subject: "paperback", initial: "closed-carried", onSuccess: "opened-shared-page", onStrain: "bookmark-shifted", invariant: "seat-remains-open" },
      worldState: { initial: "door-fogged", onSuccess: "table-warm-clear", onStrain: "table-warm-muted", persistent: "cat-bell-double" }
    },
    {
      stage: 3, stageId: "first-date", segmentId: "station-rush", timeWindowSec: [0, 54],
      visibleGoal: "departure-flipboard", actionGoal: "weave-clock-crowd-without-dropping-tickets",
      routeTopologyKey: "station-braid", cameraRigKey: "clock-pressure", rhythm: "departure-urgency", bpm: 118,
      nextSegmentId: "last-train-transfer", storyVerb: "commit-to-arrival",
      physicalState: { subject: "cinema-ticket", initial: "paired-flat", onSuccess: "paired-flat", onStrain: "creased-corner", invariant: "showtime-fixed" },
      worldState: { initial: "destinations-scattered", onSuccess: "old-line-arrow-clear", onStrain: "old-line-arrow-flicker", persistent: "clock-countdown" }
    },
    {
      stage: 3, stageId: "first-date", segmentId: "last-train-transfer", timeWindowSec: [54, 120],
      visibleGoal: "platform-call-box", actionGoal: "slide-gate-then-switch-platform",
      routeTopologyKey: "platform-arc", cameraRigKey: "platform-tele", rhythm: "last-train-drive", bpm: 132,
      nextSegmentId: "marquee-approach", storyVerb: "take-the-long-way",
      physicalState: { subject: "coffee-pair", initial: "two-cups-hot", onSuccess: "two-cups-warm", onStrain: "one-lid-spilled", invariant: "two-cup-carrier" },
      worldState: { initial: "platform-closing", onSuccess: "door-holds-two-beats", onStrain: "door-holds-one-beat", persistent: "carriage-window-run" }
    },
    {
      stage: 3, stageId: "first-date", segmentId: "marquee-approach", timeWindowSec: [120, 180],
      visibleGoal: "marquee-letter-box", actionGoal: "protect-tickets-and-arrive-on-beat",
      routeTopologyKey: "marquee-release", cameraRigKey: "marquee-dolly", rhythm: "arrival-crescendo", bpm: 124,
      nextSegmentId: "market-taste", storyVerb: "keep-promise",
      physicalState: { subject: "cinema-flower", initial: "wrapped-upright", onSuccess: "petals-intact", onStrain: "petals-wind-bent", invariant: "arrival-occurs-before-showtime" },
      worldState: { initial: "marquee-partial", onSuccess: "marquee-full-warm", onStrain: "marquee-full-late", persistent: "doorway-waiting-light" }
    },
    {
      stage: 4, stageId: "heart-spoken", segmentId: "market-taste", timeWindowSec: [0, 62],
      visibleGoal: "last-stall-sign", actionGoal: "switch-back-to-shared-lane-after-pickup",
      routeTopologyKey: "market-slalom", cameraRigKey: "market-weave", rhythm: "shared-snack-step", bpm: 108,
      nextSegmentId: "music-crowd", storyVerb: "share-space",
      physicalState: { subject: "night-snack", initial: "single-paper-bag", onSuccess: "split-evenly", onStrain: "bag-crumpled", invariant: "last-serving-shared" },
      worldState: { initial: "market-crowded", onSuccess: "paired-steam-line", onStrain: "paired-steam-broken", persistent: "lantern-warmth" }
    },
    {
      stage: 4, stageId: "heart-spoken", segmentId: "music-crowd", timeWindowSec: [62, 128],
      visibleGoal: "chorus-light-console", actionGoal: "sync-jump-slide-on-partner-cue",
      routeTopologyKey: "music-crowd-ring", cameraRigKey: "beat-crane", rhythm: "chorus-sync", bpm: 126,
      nextSegmentId: "quiet-river", storyVerb: "move-together",
      physicalState: { subject: "instant-camera", initial: "one-frame-ready", onSuccess: "shared-frame-clear", onStrain: "shared-frame-motion-blur", invariant: "shutter-fires-on-chorus" },
      worldState: { initial: "crowd-random", onSuccess: "crowd-beat-open", onStrain: "crowd-beat-narrow", persistent: "wristband-pulse" }
    },
    {
      stage: 4, stageId: "heart-spoken", segmentId: "quiet-river", timeWindowSec: [128, 180],
      visibleGoal: "bench-coin-lamp", actionGoal: "decelerate-and-hold-adjacent-lane",
      routeTopologyKey: "river-singletrack", cameraRigKey: "river-breath-cam", rhythm: "river-half-time", bpm: 78,
      nextSegmentId: "breakfast-block", storyVerb: "stay-after-noise",
      physicalState: { subject: "riverside-lamp", initial: "unlit", onSuccess: "lit-between-two", onStrain: "lit-off-center", invariant: "bench-has-two-places" },
      worldState: { initial: "river-dark", onSuccess: "two-silhouettes-stable", onStrain: "two-silhouettes-offset", persistent: "bench-light" }
    },
    {
      stage: 5, stageId: "shared-days", segmentId: "breakfast-block", timeWindowSec: [0, 58],
      visibleGoal: "breakfast-order-clips", actionGoal: "protect-two-breakfasts-through-chicane",
      routeTopologyKey: "breakfast-chicane", cameraRigKey: "window-glance", rhythm: "ordinary-two-step", bpm: 100,
      nextSegmentId: "market-list", storyVerb: "trust-the-routine",
      physicalState: { subject: "breakfast-bag", initial: "two-portions-hot", onSuccess: "two-portions-warm", onStrain: "two-portions-cooling", invariant: "both-schedules-change" },
      worldState: { initial: "routine-aligned", onSuccess: "two-clocks-visible-breakfast-warm", onStrain: "two-clocks-visible-breakfast-cooling", persistent: "opposite-exits" }
    },
    {
      stage: 5, stageId: "shared-days", segmentId: "market-list", timeWindowSec: [58, 124],
      visibleGoal: "market-scale-bell", actionGoal: "complete-old-list-while-tracking-parallel-key-route",
      routeTopologyKey: "market-grid", cameraRigKey: "market-high", rhythm: "parallel-obligations", bpm: 116,
      nextSegmentId: "stairway-home", storyVerb: "notice-the-change",
      physicalState: { subject: "grocery-bag", initial: "list-open", onSuccess: "list-complete-intact", onStrain: "list-complete-crushed", invariant: "key-handover-also-valid" },
      worldState: { initial: "routes-parallel", onSuccess: "parallel-route-visible-list-intact", onStrain: "parallel-route-visible-list-scattered", persistent: "dual-clock-countdown" }
    },
    {
      stage: 5, stageId: "shared-days", segmentId: "stairway-home", timeWindowSec: [124, 180],
      visibleGoal: "third-floor-doorbell", actionGoal: "follow-crossing-shadow-to-split-reveal",
      routeTopologyKey: "stair-switchback", cameraRigKey: "stair-tilt", rhythm: "misalignment-reveal", bpm: 92,
      nextSegmentId: "under-flyover", storyVerb: "recognize-misalignment",
      physicalState: { subject: "brass-key", initial: "new-time-tagged", onSuccess: "tag-readable", onStrain: "tag-creased-readable", invariant: "destinations-remain-empty" },
      worldState: { initial: "routes-nearly-touch", onSuccess: "kitchen-office-split-clear", onStrain: "kitchen-office-split-delayed", persistent: "two-empty-places" }
    },
    {
      stage: 6, stageId: "rough-weather", segmentId: "under-flyover", timeWindowSec: [0, 54],
      visibleGoal: "pump-house-shutter", actionGoal: "cross-drain-and-release-written-script",
      routeTopologyKey: "flyover-zigzag", cameraRigKey: "storm-low", rhythm: "storm-pressure", bpm: 120,
      nextSegmentId: "closure-detour", storyVerb: "release-the-script",
      physicalState: { subject: "folded-note", initial: "folded-readable", onSuccess: "ink-bled-carried", onStrain: "ink-bled-torn-edge", invariant: "ink-becomes-unreadable" },
      worldState: { initial: "text-reflections-active", onSuccess: "text-reflections-off", onStrain: "text-reflections-off", persistent: "shelter-side-light" }
    },
    {
      stage: 6, stageId: "rough-weather", segmentId: "closure-detour", timeWindowSec: [54, 122],
      visibleGoal: "closure-route-lamp", actionGoal: "switch-to-shelter-side-and-hold-slow-line",
      routeTopologyKey: "detour-boardwalk-fork", cameraRigKey: "fork-overhead", rhythm: "storm-half-time", bpm: 128,
      nextSegmentId: "shelter-approach", storyVerb: "slow-down",
      physicalState: { subject: "runner-distance", initial: "closing-fast", onSuccess: "parallel-respectful", onStrain: "overshoot-recoverable", invariant: "partner-keeps-boundary" },
      worldState: { initial: "fast-line-dominant", onSuccess: "side-line-dominant", onStrain: "side-line-reopens", persistent: "camera-side-by-side" }
    },
    {
      stage: 6, stageId: "rough-weather", segmentId: "shelter-approach", timeWindowSec: [122, 180],
      visibleGoal: "shelter-drip-chain", actionGoal: "wait-for-partner-signal-then-move-chain-together",
      routeTopologyKey: "shelter-funnel", cameraRigKey: "shelter-tele", rhythm: "listen-then-answer", bpm: 86,
      nextSegmentId: "first-train-platform", storyVerb: "listen-and-make-room",
      physicalState: { subject: "shelter-drip-chain", initial: "blocking-center", onSuccess: "moved-by-two", onStrain: "moved-after-retry", invariant: "keys-remain-separate" },
      worldState: { initial: "one-person-dry-space", onSuccess: "two-person-dry-space", onStrain: "two-person-dry-space-delayed", persistent: "repair-begun-not-resolved" }
    },
    {
      stage: 7, stageId: "toward-home", segmentId: "first-train-platform", timeWindowSec: [0, 58],
      visibleGoal: "first-train-board", actionGoal: "handoff-heavy-luggage-on-adjacent-lane",
      routeTopologyKey: "platform-paired", cameraRigKey: "train-parallel", rhythm: "weight-transfer", bpm: 104,
      nextSegmentId: "familiar-memory-street", storyVerb: "share-the-weight",
      physicalState: { subject: "heavy-luggage", initial: "partner-carrying", onSuccess: "ownership-alternates", onStrain: "handoff-delayed", invariant: "luggage-weight-affects-stride" },
      worldState: { initial: "parallel-tracks-separated", onSuccess: "handoff-points-lit", onStrain: "handoff-point-repeats", persistent: "same-destination-board" }
    },
    {
      stage: 7, stageId: "toward-home", segmentId: "familiar-memory-street", timeWindowSec: [58, 126],
      visibleGoal: "memory-post-box", actionGoal: "complete-six-relation-actions-across-paired-lanes",
      routeTopologyKey: "memory-material-bands", cameraRigKey: "memory-match", rhythm: "six-verb-reprise", bpm: 116,
      nextSegmentId: "home-straight", storyVerb: "carry-history-forward",
      physicalState: { subject: "framed-photo", initial: "packed-protected", onSuccess: "packed-intact", onStrain: "frame-scuffed", invariant: "six-actions-require-both-lanes" },
      worldState: { initial: "six-materials-dormant", onSuccess: "six-materials-integrated", onStrain: "missed-material-repeats", persistent: "morning-street-unified" }
    },
    {
      stage: 7, stageId: "toward-home", segmentId: "home-straight", timeWindowSec: [126, 180],
      visibleGoal: "home-entry-tray", actionGoal: "open-paired-locks-then-converge",
      routeTopologyKey: "home-converge", cameraRigKey: "home-dolly", rhythm: "double-lock-coda", bpm: 82,
      nextSegmentId: null, storyVerb: "choose-the-same-step",
      physicalState: { subject: "home-key", initial: "two-keys-two-hands", onSuccess: "two-locks-open", onStrain: "one-lock-waits", invariant: "one-key-cannot-open-both" },
      worldState: { initial: "door-light-halved", onSuccess: "door-light-joined", onStrain: "door-light-half-waiting", persistent: "shared-threshold" }
    }
  ];

  const directorBySegmentId = Object.fromEntries(STAGE_DIRECTOR_SEGMENTS.map((entry) => [entry.segmentId, entry]));
  const directorKeys = ["timeWindowSec", "visibleGoal", "actionGoal", "routeTopologyKey", "cameraRigKey", "rhythm", "bpm", "nextSegmentId", "storyVerb", "physicalState", "worldState"];
  if (STAGE_DIRECTOR_SEGMENTS.length !== 21 || Object.keys(directorBySegmentId).length !== 21) throw new Error("director catalog must define 21 unique segments");

  STAGE_DIRECTOR_SEGMENTS.forEach((entry, index) => {
    const stage = STAGES[entry.stage - 1];
    const segment = stage?.segments.find((candidate) => candidate.id === entry.segmentId);
    if (!stage || stage.id !== entry.stageId || !segment) throw new Error(`director references unknown segment: ${entry.segmentId}`);
    directorKeys.forEach((key) => {
      if (!(key in entry)) throw new Error(`director segment ${entry.segmentId} is missing ${key}`);
    });
    if (!Array.isArray(entry.timeWindowSec) || entry.timeWindowSec.length !== 2 || entry.timeWindowSec[1] <= entry.timeWindowSec[0]) throw new Error(`director segment ${entry.segmentId} has invalid time window`);
    const previous = STAGE_DIRECTOR_SEGMENTS[index - 1];
    if (previous && previous.stage === entry.stage && previous.timeWindowSec[1] !== entry.timeWindowSec[0]) throw new Error(`director stage ${entry.stageId} has discontinuous time windows`);
    if (segment.order === 1 && entry.timeWindowSec[0] !== 0) throw new Error(`director stage ${entry.stageId} must begin at zero`);
    if (segment.order === 3 && entry.timeWindowSec[1] !== 180) throw new Error(`director stage ${entry.stageId} must end at 180 seconds`);
    const expectedNextId = STAGE_DIRECTOR_SEGMENTS[index + 1]?.segmentId || null;
    if (entry.nextSegmentId !== expectedNextId) throw new Error(`director segment ${entry.segmentId} has an invalid next segment`);
    if (!stage.stageProps.some((prop) => prop.id === entry.visibleGoal && prop.segmentId === entry.segmentId)) throw new Error(`director segment ${entry.segmentId} has invalid visible goal`);
    if (!entry.physicalState || !entry.worldState || !Object.values(entry.physicalState).every((value) => typeof value === "string" && value.length) || !Object.values(entry.worldState).every((value) => typeof value === "string" && value.length)) throw new Error(`director segment ${entry.segmentId} has invalid state data`);
    segment.director = entry;
  });

  STAGES.forEach((stage) => {
    const stageItemIds = new Set(STAGE_ITEM_IDS[stage.order - 1]);
    const stagePropIds = new Set(stage.stageProps.map((prop) => prop.id));
    const obstacleIds = new Set(stage.obstacleDesign.semantics.map((obstacle) => obstacle.id));
    const combinationIds = new Set(stage.obstacleDesign.combinations.map((combination) => combination.id));
    let previousEnd = 0;
    const usedItemIds = new Set();
    const usedPropIds = new Set();

    stage.obstacleDesign.combinations.forEach((combination) => combination.obstacleIds.forEach((obstacleId) => {
      if (!obstacleIds.has(obstacleId)) throw new Error(`stage ${stage.id} combination references unknown obstacle: ${obstacleId}`);
    }));
    stage.segments.forEach((segment, index) => {
      if (segment.order !== index + 1) throw new Error(`stage ${stage.id} has unordered segment: ${segment.id}`);
      if (segment.progress[0] !== previousEnd || segment.progress[1] <= segment.progress[0]) throw new Error(`stage ${stage.id} has discontinuous segment: ${segment.id}`);
      previousEnd = segment.progress[1];
      segment.collectibleItemIds.forEach((itemId) => {
        if (!stageItemIds.has(itemId)) throw new Error(`stage ${stage.id} segment references foreign item: ${itemId}`);
        usedItemIds.add(itemId);
      });
      segment.propIds.forEach((propId) => {
        if (!stagePropIds.has(propId)) throw new Error(`stage ${stage.id} segment references unknown prop: ${propId}`);
        usedPropIds.add(propId);
      });
      segment.obstacleCombinationIds.forEach((combinationId) => {
        if (!combinationIds.has(combinationId)) throw new Error(`stage ${stage.id} segment references unknown combination: ${combinationId}`);
      });
    });
    if (previousEnd !== 1) throw new Error(`stage ${stage.id} segments must end at 1`);
    stageItemIds.forEach((itemId) => {
      if (!usedItemIds.has(itemId)) throw new Error(`stage ${stage.id} never introduces item: ${itemId}`);
    });
    stagePropIds.forEach((propId) => {
      if (!usedPropIds.has(propId)) throw new Error(`stage ${stage.id} never uses prop: ${propId}`);
    });
    const repeatedForWholeStage = [...stageItemIds].filter((itemId) => stage.segments.every((segment) => segment.collectibleItemIds.includes(itemId)));
    if (repeatedForWholeStage.length) throw new Error(`stage ${stage.id} repeats items through every segment: ${repeatedForWholeStage.join(",")}`);
  });

  const STAGE_SEGMENTS = STAGES.flatMap((stage) => stage.segments.map((segment) => ({
    ...segment,
    stage: stage.order,
    stageId: stage.id
  })));

  const STAGE_PROPS = STAGES.flatMap((stage) => stage.stageProps.map((prop) => ({
    ...prop,
    stage: stage.order,
    stageId: stage.id
  })));

  const STAGE_OBSTACLES = STAGES.flatMap((stage) => stage.obstacleDesign.semantics.map((obstacle) => ({
    ...obstacle,
    stage: stage.order,
    stageId: stage.id
  })));

  const STAGE_OBSTACLE_COMBINATIONS = STAGES.flatMap((stage) => stage.obstacleDesign.combinations.map((combination) => ({
    ...combination,
    stage: stage.order,
    stageId: stage.id
  })));

  function createCollectionCue(itemId) {
    const item = STORY_ITEMS.find((entry) => entry.id === itemId);
    const profile = item.interactionProfile;
    return {
      id: item.id,
      itemId: item.id,
      name: item.name,
      kind: item.kind,
      color: item.color,
      carry: item.carry,
      action: item.action,
      immediateImpact: {
        gameplay: {
          effect: profile.gameplay.effect,
          strength: profile.gameplay.strength,
          durationMs: profile.gameplay.durationMs
        },
        world: {
          changeType: profile.world.changeType,
          roadChange: profile.world.roadChange,
          environmentChange: profile.world.environmentChange
        },
        character: {
          action: profile.character.immediateAction,
          emotion: profile.character.emotion
        },
        story: profile.narrative.currentEvent
      },
      laterEcho: {
        story: profile.narrative.laterEcho,
        memoryTags: profile.narrative.memoryTags
      }
    };
  }

  const STAGE_COLLECTION_PHASES = STAGE_SEGMENTS.map((segment) => {
    const props = segment.propIds.map((propId) => STAGE_PROPS.find((prop) => prop.id === propId));
    return {
      id: `${segment.stageId}-${segment.id}-collection`,
      stage: segment.stage,
      stageId: segment.stageId,
      segmentId: segment.id,
      order: segment.order,
      progress: segment.progress,
      storyCue: segment.storyBeat,
      itemIds: segment.collectibleItemIds,
      items: segment.collectibleItemIds.map(createCollectionCue),
      propIds: segment.propIds,
      props
    };
  });

  const STAGE_VISUAL_KEYS = [
    { sceneFactoryKey: "rain-campus", roadMaterialKey: "wet-asphalt", roadProfileKey: "crowned-campus", obstacleVisualKey: "campus-commute", collectibleVisualKeys: ["rain-glints", "sun-shower-keepsakes", "crossing-lights"], phaseWorldKeys: ["school-arcade", "camphor-rain", "library-crossing"], introCueSequence: ["street-wide", "message-close", "runner-follow"] },
    { sceneFactoryKey: "river-bookstore", roadMaterialKey: "mist-concrete", roadProfileKey: "riverside-boardwalk", obstacleVisualKey: "bookstore-delivery", collectibleVisualKeys: ["river-signals", "record-grooves", "paper-warmth"], phaseWorldKeys: ["misty-levee", "record-alley", "bookstore-threshold"], introCueSequence: ["river-pan", "object-close", "runner-follow"] },
    { sceneFactoryKey: "neon-cinema", roadMaterialKey: "neon-rail", roadProfileKey: "tram-canyon", obstacleVisualKey: "cinema-transit", collectibleVisualKeys: ["station-pulses", "last-train-tokens", "marquee-sparks"], phaseWorldKeys: ["station-rush", "last-train", "marquee-approach"], introCueSequence: ["station-wide", "clock-close", "runner-surge"] },
    { sceneFactoryKey: "night-market-river", roadMaterialKey: "oily-stone", roadProfileKey: "market-cobbles", obstacleVisualKey: "market-stalls", collectibleVisualKeys: ["food-steam", "music-beats", "riverside-stars"], phaseWorldKeys: ["market-taste", "music-crowd", "quiet-river"], introCueSequence: ["market-wide", "keepsake-close", "runner-weave"] },
    { sceneFactoryKey: "lived-in-neighborhood", roadMaterialKey: "dry-asphalt", roadProfileKey: "neighborhood-patchwork", obstacleVisualKey: "daily-delivery", collectibleVisualKeys: ["breakfast-warmth", "market-list", "home-lights"], phaseWorldKeys: ["breakfast-block", "morning-market", "stairway-home"], introCueSequence: ["neighborhood-wide", "list-close", "runner-follow"] },
    { sceneFactoryKey: "storm-old-bridge", roadMaterialKey: "flooded-steel", roadProfileKey: "bridge-grating", obstacleVisualKey: "storm-maintenance", collectibleVisualKeys: ["storm-shards", "detour-signals", "shelter-lights"], phaseWorldKeys: ["under-flyover", "closure-detour", "shelter-approach"], introCueSequence: ["storm-wide", "warning-close", "runner-surge"] },
    { sceneFactoryKey: "dawn-station", roadMaterialKey: "dawn-rail", roadProfileKey: "terminal-platforms", obstacleVisualKey: "station-departure", collectibleVisualKeys: ["dawn-tickets", "memory-keepsakes", "home-beacons"], phaseWorldKeys: ["first-platform", "memory-street", "home-straight"], introCueSequence: ["terminal-wide", "ticket-close", "runner-follow"] }
  ];

  const STAGE_BLUEPRINTS = STAGES.map((stage, index) => {
    const segments = STAGE_SEGMENTS.filter((segment) => segment.stage === stage.order);
    const props = STAGE_PROPS.filter((prop) => prop.stage === stage.order);
    const obstacles = STAGE_OBSTACLES.filter((obstacle) => obstacle.stage === stage.order);
    const combinations = STAGE_OBSTACLE_COMBINATIONS.filter((combination) => combination.stage === stage.order);
    const phases = STAGE_COLLECTION_PHASES.filter((phase) => phase.stage === stage.order);
    return {
      id: stage.id,
      order: stage.order,
      name: stage.name,
      metric: stage.metric,
      objective: stage.objective,
      story: {
        openingLine: stage.opening,
        arrivalLine: stage.arrival,
        continuity: {
          previousStageId: index > 0 ? STAGES[index - 1].id : null,
          nextStageId: index < STAGES.length - 1 ? STAGES[index + 1].id : null,
          ...stage.continuity
        }
      },
      openingPerformance: stage.openingPerformance,
      world: {
        sceneMood: stage.sceneMood,
        timeWeather: stage.timeWeather,
        colorPalette: stage.colorPalette,
        landmarks: stage.landmarks,
        roadDesign: stage.roadDesign
      },
      obstacleDesign: {
        obstacles,
        combinations
      },
      visual: STAGE_VISUAL_KEYS[index],
      segments: segments.map((segment, phaseIndex) => ({
        ...segment,
        visual: {
          worldKey: STAGE_VISUAL_KEYS[index].phaseWorldKeys[phaseIndex],
          roadMaterialKey: STAGE_VISUAL_KEYS[index].roadMaterialKey,
          roadProfileKey: STAGE_VISUAL_KEYS[index].roadProfileKey,
          obstacleVisualKey: STAGE_VISUAL_KEYS[index].obstacleVisualKey,
          collectibleVisualKey: STAGE_VISUAL_KEYS[index].collectibleVisualKeys[phaseIndex]
        }
      })),
      collectionPlan: {
        mode: "progressive-segment-pools",
        stageItemIds: STAGE_ITEM_IDS[stage.order - 1],
        phases
      },
      props,
      destination: {
        ...stage.destinationDetail,
        nextStageId: index < STAGES.length - 1 ? STAGES[index + 1].id : null
      }
    };
  });

  const ROUTE_SET_PIECES = [
    { stage: 1, venues: ["香樟道", "玻璃连廊", "图书馆路口"], obstacles: ["crowd", "puddle", "barrier"], gestures: ["switch", "jump", "slide"] },
    { stage: 2, venues: ["河堤", "唱片店", "桥下书店"], obstacles: ["bicycle", "book-cart", "awning"], gestures: ["switch", "jump", "slide"] },
    { stage: 3, venues: ["站前街", "地铁站", "旧城电影院"], obstacles: ["service-cart", "train", "signal-gate"], gestures: ["switch", "jump", "slide"] },
    { stage: 4, venues: ["夜市", "音乐广场", "河岸长椅"], obstacles: ["stall", "barrier", "awning"], gestures: ["switch", "jump", "slide"] },
    { stage: 5, venues: ["早餐店", "清晨市场", "亮灯的厨房"], obstacles: ["delivery-cart", "grocery-crate", "signal-gate"], gestures: ["switch", "jump", "slide"] },
    { stage: 6, venues: ["高架桥", "封路街口", "河桥雨棚"], obstacles: ["warning", "puddle", "maintenance"], gestures: ["switch", "jump", "slide"] },
    { stage: 7, venues: ["黎明站台", "熟悉长街", "有灯的家"], obstacles: ["luggage", "barrier", "awning"], gestures: ["switch", "jump", "slide"] }
  ].map((route) => {
    const stage = STAGES[route.stage - 1];
    return {
      ...route,
      segmentIds: stage.segments.map((segment) => segment.id),
      roadIdentity: stage.roadDesign.identity,
      obstacleCombinationIds: stage.obstacleDesign.combinations.map((combination) => combination.id)
    };
  });

  const ARRIVAL_SCENES = [
    { stage: 1, id: "awning-recognition", venue: "图书馆路口", camera: "跟跑转屋檐双人中景", durationMs: 4300, defaultItemId: "shared-umbrella" },
    { stage: 2, id: "bookstore-conversation", venue: "桥下书店", camera: "推门跟拍转桌边近景", durationMs: 4500, defaultItemId: "paperback" },
    { stage: 3, id: "cinema-arrival", venue: "旧城电影院", camera: "冲出站口转影院灯牌", durationMs: 4700, defaultItemId: "cinema-ticket" },
    { stage: 4, id: "riverside-night", venue: "河岸长椅", camera: "夜市穿行转河面环绕", durationMs: 4800, defaultItemId: "instant-camera" },
    { stage: 5, id: "two-empty-places", venue: "亮灯的厨房", camera: "上下层擦过后分屏厨房与交房点", durationMs: 5200, defaultItemId: "brass-key" },
    { stage: 6, id: "repair-begins", venue: "河桥雨棚", camera: "侧面静止等待转双人移链中景", durationMs: 5200, defaultItemId: "folded-note" },
    { stage: 7, id: "paired-locks-at-dawn", venue: "有灯的家", camera: "左右双锁分屏转门槛中央合流", durationMs: 5800, defaultItemId: "home-key" }
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

  const ROAD_MODULES = ROUTE_SET_PIECES.flatMap((route) => route.venues.map((venue, index) => {
    const stage = STAGES[route.stage - 1];
    const segment = stage.segments[index];
    return {
      id: `stage-${route.stage}-route-${index + 1}`,
      stage: route.stage,
      name: venue,
      mechanic: index === 2 ? "抵达" : index === 1 ? "途中选择" : "城市穿行",
      length: index === 2 ? 18 : 34,
      segmentId: segment.id,
      progress: segment.progress,
      material: stage.roadDesign.material,
      structure: stage.roadDesign.structure,
      roadChange: segment.roadChange,
      worldChange: segment.worldChange
    };
  }));

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
    title: ["她认出了你", "话题没有结束", "准时抵达", "今晚还很长", "两处都空着", "修复从这里开始", "一起打开门"][index],
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

  function getStageBlueprint(value) {
    const stage = getStage(value);
    return STAGE_BLUEPRINTS[stage.order - 1];
  }

  function getStageSegment(options) {
    if (!options || typeof options !== "object" || Array.isArray(options)) throw new TypeError("stage segment options are required");
    const stage = getStage(options.stage);
    const progress = options.progress;
    if (typeof progress !== "number" || !Number.isFinite(progress)) throw new TypeError("progress must be a finite number");
    if (progress < 0 || progress > 1) throw new RangeError("progress must be between 0 and 1");
    return STAGE_BLUEPRINTS[stage.order - 1].segments.find((segment) => (
      segment.stage === stage.order
      && progress >= segment.progress[0]
      && (progress < segment.progress[1] || segment.progress[1] === 1)
    ));
  }

  function getStageCollectionPool(options) {
    const segment = getStageSegment(options);
    return STAGE_COLLECTION_PHASES.find((phase) => phase.stage === segment.stage && phase.segmentId === segment.id);
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

  function selectStageProgressItem(options) {
    if (!options || typeof options !== "object" || Array.isArray(options)) throw new TypeError("options are required");
    if (!Array.isArray(options.excludeIds || [])) throw new TypeError("excludeIds must be an array");
    const pool = getStageCollectionPool(options);
    const items = pool.itemIds
      .filter((itemId) => !(options.excludeIds || []).includes(itemId))
      .map((itemId) => getItem(itemId));
    if (!items.length) throw new RangeError("all stage segment items are excluded");
    return items[stableIndex(options.seed === undefined ? 0 : options.seed, `item-${pool.stageId}-${pool.segmentId}`, items.length)];
  }

  function selectStageItem(options) {
    if (!options || typeof options !== "object") throw new TypeError("options are required");
    if (options.progress !== undefined) return selectStageProgressItem(options);
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

  [STAGES, STORY_ITEMS, STAGE_ITEM_IDS, STAGE_BLUEPRINTS, STAGE_SEGMENTS, STAGE_DIRECTOR_SEGMENTS, STAGE_COLLECTION_PHASES, STAGE_PROPS, STAGE_OBSTACLES, STAGE_OBSTACLE_COMBINATIONS, ROUTE_SET_PIECES, ARRIVAL_SCENES, COLLECTIBLES, OBSTACLES, ROAD_MODULES, STAGE_PERFORMANCES, STAGE_ENDINGS, FINAL_ENDINGS, GAMEPLAY_EFFECTS, INTERACTION_COMBINATIONS, INTERACTION_PROFILES].forEach(deepFreeze);

  return deepFreeze({
    STAGES,
    STORY_ITEMS,
    STAGE_ITEM_IDS,
    STAGE_BLUEPRINTS,
    STAGE_SEGMENTS,
    STAGE_DIRECTOR_SEGMENTS,
    STAGE_COLLECTION_PHASES,
    STAGE_PROPS,
    STAGE_OBSTACLES,
    STAGE_OBSTACLE_COMBINATIONS,
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
    getStageBlueprint,
    getStageSegment,
    getStageCollectionPool,
    getItem,
    getInteractionProfile,
    getCollectible,
    getEnding,
    getRoute,
    selectStageItem,
    selectStageProgressItem,
    selectArrival,
    resolveCollectionInteraction
  });
});
