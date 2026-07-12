(function (root, factory) {
  const content = factory();
  if (typeof module === "object" && module.exports) module.exports = content;
  else if (root) root.BilliardsLoveContent = content;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach((key) => deepFreeze(value[key]));
    return Object.freeze(value);
  }

  const INTENTS = deepFreeze({
    ACTIVE: "active",
    ACCIDENTAL: "accidental"
  });

  const TIMINGS = deepFreeze({
    EARLY: "early",
    RIGHT: "right",
    LATE: "late"
  });

  const STAGE_EVENT_TYPES = deepFreeze({
    MISS: "miss",
    SCRATCH: "scratch",
    SETUP: "setup"
  });

  const SHOT_ARCHETYPES = deepFreeze({
    DIRECT: "direct",
    GENTLE: "gentle",
    POWER: "power",
    BANK: "bank",
    LONG: "long",
    COMBO: "combo",
    RATTLE: "rattle",
    MULTI: "multi",
    NEAR: "near",
    MISS: "miss",
    SCRATCH: "scratch"
  });

  const SHOT_ARCHETYPE_META = deepFreeze({
    direct: { label: "直线命中 · 坐标点亮", gesture: "notice", visualMode: "straight" },
    gentle: { label: "轻推入袋 · 路线留白", gesture: "offer", visualMode: "soft" },
    power: { label: "有力命中 · 光路脉冲", gesture: "surprise", visualMode: "pulse" },
    bank: { label: "借库入袋 · 绕路抵达", gesture: "reach", visualMode: "rail" },
    long: { label: "远台命中 · 跨桌抵达", gesture: "answer", visualMode: "distance" },
    combo: { label: "组合入袋 · 路线相接", gesture: "answer", visualMode: "linked" },
    rattle: { label: "袋口停顿 · 地标闪烁", gesture: "hesitate", visualMode: "hesitate" },
    multi: { label: "一杆多球 · 双点同亮", gesture: "delight", visualMode: "double" },
    near: { label: "擦袋停留 · 路标未熄", gesture: "hesitate", visualMode: "near" },
    miss: { label: "这一杆落空 · 地图仍亮", gesture: "waiting", visualMode: "quiet" },
    scratch: { label: "白球落袋 · 路线回退", gesture: "withdraw", visualMode: "fracture" }
  });

  const POCKET_DATE_SCENES = deepFreeze([
    {
      id: "corner-store",
      pocketId: "top-left",
      name: "街角便利店",
      tableZone: "左上角袋",
      light: "冷白冰柜光",
      detail: "桌沿亮起便利店灯牌和一小格雨棚"
    },
    {
      id: "coffee-window",
      pocketId: "top-right",
      name: "咖啡店",
      tableZone: "右上角袋",
      light: "琥珀咖啡灯",
      detail: "桌沿浮出双杯剪影和暖色窗格"
    },
    {
      id: "late-cinema",
      pocketId: "middle-left",
      name: "电影院",
      tableZone: "左侧中袋",
      light: "暗红银幕光",
      detail: "中袋边缘点亮并排座位和票根标记"
    },
    {
      id: "river-walk",
      pocketId: "middle-right",
      name: "河边步道",
      tableZone: "右侧中袋",
      light: "水蓝栏杆光",
      detail: "中袋边缘铺开一小段波纹和栏杆投影"
    },
    {
      id: "last-train",
      pocketId: "bottom-left",
      name: "地铁站",
      tableZone: "左下角袋",
      light: "青绿站牌光",
      detail: "桌沿亮起末班车时刻和入口箭头"
    },
    {
      id: "walk-home",
      pocketId: "bottom-right",
      name: "回家街道",
      tableZone: "右下角袋",
      light: "暖黄路灯光",
      detail: "桌沿延伸出并肩影子和归途路标"
    }
  ]);

  const POCKET_DATE_SCENE_BY_ID = Object.freeze(Object.fromEntries(
    POCKET_DATE_SCENES.map((scene) => [scene.pocketId, scene])
  ));
  const POCKET_DATE_IDS = Object.freeze(POCKET_DATE_SCENES.map((scene) => scene.pocketId));

  const STAGES = deepFreeze([
    {
      id: "first-contact",
      order: 1,
      name: "雨夜开场",
      ballNumbers: [1, 2, 3],
      environment: "同一张墨绿球桌化作今夜约会地图，六个袋口固定标记街角便利店、咖啡店、电影院、河边步道、地铁站与回家街道。",
      poses: {
        player: "扶杆站在球桌短边，从雨滴标记看向第一处亮起的袋口。",
        partner: "留在球桌对面，用杆尖轻点咖啡与电影票的路线。"
      },
      lighting: "雨夜窗光保持不变，桌灯只让台呢路线和袋口微缩路标依次亮起。",
      musicLayers: ["玻璃雨声", "稀疏钢琴", "清脆碰球声"],
      enterLine: "这一晚不切换场景，路线从球桌上的雨滴开始。",
      completeLine: "咖啡与电影票已经在同一张桌面地图上连成第一段路。"
    },
    {
      id: "growing-familiar",
      order: 2,
      name: "光影留念",
      ballNumbers: [4, 5],
      environment: "仍是同一张球桌，相机取景框与路灯光斑沿台呢展开，六处袋口地标保持原位。",
      poses: {
        player: "沿球桌长边俯身找角度，击球后仍看着桌面光线。",
        partner: "站在对侧库边，以手势替你框出相机与路灯的构图。"
      },
      lighting: "暖白桌灯叠加一层取景框光线，人物和球桌都留在雨夜球房内。",
      musicLayers: ["轻刷鼓", "相机快门点音", "桌边雨声"],
      enterLine: "地图没有翻页，只在原来的台呢上多出两格光影。",
      completeLine: "相机留住路灯，下一段路线继续沿同一张球桌延伸。"
    },
    {
      id: "intentional-dates",
      order: 3,
      name: "并肩听歌",
      ballNumbers: [6, 7],
      environment: "耳机波形与猫爪印出现在同一张球桌中央，所有约会地点仍由六个袋口表示。",
      poses: {
        player: "握杆停在桌侧，等她选定耳机波形通向哪一袋。",
        partner: "靠着球桌长边轻敲节拍，指向绕过猫爪印的线路。"
      },
      lighting: "桌灯保持克制暖白，耳机波形用淡金、猫爪印用柔灰点亮。",
      musicLayers: ["共享耳机节拍", "低声贝斯", "球体滚动声"],
      enterLine: "音乐和偶遇都只成为桌面路线的一部分。",
      completeLine: "你们在同一张桌边听完一段歌，也选好了下一处袋口。"
    },
    {
      id: "spoken-heart",
      order: 4,
      name: "心意落点",
      ballNumbers: [8],
      environment: "黑8停在球桌中心，心形光纹连接六个袋口，却不离开这张约会地图。",
      poses: {
        player: "收住球杆站在桌边，正面看向她等待这一杆。",
        partner: "双手搭在对侧库边，把决定落在哪个袋口留给你。"
      },
      lighting: "四周维持雨夜暗度，桌灯集中照亮黑8与心形光纹。",
      musicLayers: ["单音钢琴", "低弦长音", "安静呼吸声"],
      enterLine: "整晚的路线在黑8周围停顿，心意只在桌面上亮明。",
      completeLine: "黑8落袋，六处地标同时亮了一瞬，回答仍发生在桌边。"
    },
    {
      id: "confirmed-love",
      order: 5,
      name: "晚霞回声",
      ballNumbers: [9, 10, 11],
      environment: "晚霞、礼物与短信化作三层桌面投影，覆盖台呢但不替换雨夜球房。",
      poses: {
        player: "从球桌一侧推杆，让三枚物象依次穿过亮起的路线。",
        partner: "沿对侧桌边移动，把礼物光标和短信光点接到下一袋。"
      },
      lighting: "桌灯叠入低饱和晚霞色，礼物与短信只以桌面图标出现。",
      musicLayers: ["柔和电钢琴", "纸张轻响", "消息提示点音"],
      enterLine: "晚霞只是台呢上的颜色，礼物和短信也都留在桌边。",
      completeLine: "三枚物象在同一晚得到回应，地图开始转向末班路线。"
    },
    {
      id: "learning-together",
      order: 6,
      name: "末班星光",
      ballNumbers: [12, 13],
      environment: "公交卡轨迹与星点投影沿同一张球桌交叉，地铁站袋口保持青绿微光。",
      poses: {
        player: "贴着桌边校准公交卡轨迹，给星星球留出通道。",
        partner: "在对侧观察碰库角度，用杆尾标出末班车方向。"
      },
      lighting: "青绿站牌光与银白星点都收束在台呢范围内，窗外仍是同一场雨。",
      musicLayers: ["低音提琴拨奏", "站台提示音", "球桌环境声"],
      enterLine: "路线需要重新校准，但两个人都没有离开球桌。",
      completeLine: "公交卡与星星在桌面汇合，最后两球通向共伞归途。"
    },
    {
      id: "shared-future",
      order: 7,
      name: "共伞归途",
      ballNumbers: [14, 15],
      environment: "雨伞轮廓覆盖球桌中央，归途光线从最后两球延伸到回家街道袋口。",
      poses: {
        player: "沿球桌短边完成最后瞄准，把归途路线留在两人之间。",
        partner: "站在同一盏桌灯下，握住伞形光纹另一侧的杆尖。"
      },
      lighting: "暖白桌灯与雨蓝窗光保持整晚一致，右下角袋的路灯标记最亮。",
      musicLayers: ["完整钢琴主题", "克制弦乐", "渐缓雨声"],
      enterLine: "地图最后一段仍在这张球桌上，雨伞与归途等待落点。",
      completeLine: "最后一球抵达回家街道，整晚约会地图在桌灯下完整亮起。"
    }
  ]);

  const BALL_DATE_MOTIFS = deepFreeze([
    {
      ballNumber: 1,
      number: 1,
      id: "raindrop",
      name: "雨滴",
      stage: 1,
      meaning: "雨滴把同一晚的城市声响收进球桌，成为约会地图的起点。",
      colorCue: "银蓝",
      tableMark: "细雨纹从球面下方散开",
      lines: [
        "雨纹沿台呢铺开，今晚的第一段路线有了起点。",
        "窗上的雨声落进击球间隙，她把下一杆的位置留给你。",
        "袋口路标映着水光，你们隔桌选定最近的一站。"
      ]
    },
    {
      ballNumber: 2,
      number: 2,
      id: "coffee",
      name: "咖啡",
      stage: 1,
      meaning: "咖啡是雨夜路线里的暖色停顿，让桌边交谈自然延长。",
      colorCue: "焦糖棕",
      tableMark: "杯口热气化作一圈暖光",
      lines: [
        "暖色光圈停在台呢上，像一句还没说完的话。",
        "她用杆尾点了点双杯标记，把选择留给你的下一杆。",
        "咖啡路标亮起时，两个人都没有急着结束这一局。"
      ]
    },
    {
      ballNumber: 3,
      number: 3,
      id: "movie-ticket",
      name: "电影票",
      stage: 1,
      meaning: "电影票把共同选择压成一枚桌面坐标，标记今晚的下一站。",
      colorCue: "暗红",
      tableMark: "两张票根图标在球后并排滑行",
      lines: [
        "票根光标并排停住，银幕袋口在桌沿亮了一格。",
        "你问她选哪一场，她用球杆指向地图上的同一处。",
        "散场时间只写在桌面标记里，这一局仍在继续。"
      ]
    },
    {
      ballNumber: 4,
      number: 4,
      id: "camera",
      name: "相机",
      stage: 2,
      meaning: "相机把这张球桌上的片刻留住，不把叙事切去别处。",
      colorCue: "雾银",
      tableMark: "取景框跟随球面缓慢收焦",
      lines: [
        "取景框沿桌面收紧，刚好装下两支交错的球杆。",
        "快门点音落在碰球之后，她笑着示意这一杆可以保留。",
        "相机光标没有离开台呢，只记下袋口亮起的一秒。"
      ]
    },
    {
      ballNumber: 5,
      number: 5,
      id: "streetlamp",
      name: "路灯",
      stage: 2,
      meaning: "路灯为桌面路线提供暖黄节点，让每次绕库都有清楚方向。",
      colorCue: "暖黄",
      tableMark: "一排小灯点沿库边依次亮起",
      lines: [
        "库边灯点逐盏亮起，把绕行路线照得清楚。",
        "她站在对侧灯影里，等你决定这一杆从哪里转弯。",
        "路灯光圈留在球桌边缘，两道影子仍隔桌相接。"
      ]
    },
    {
      ballNumber: 6,
      number: 6,
      id: "earphones",
      name: "耳机",
      stage: 3,
      meaning: "耳机把共享节拍变成可见波形，引导球沿同一张地图前进。",
      colorCue: "墨绿",
      tableMark: "细小声波从球后向两侧展开",
      lines: [
        "声波贴着台呢起伏，球速与耳机节拍正好重合。",
        "她隔桌轻敲两拍，你在第三拍把路线送向袋口。",
        "耳机图标留在桌面中央，一段副歌陪这一杆走完。"
      ]
    },
    {
      ballNumber: 7,
      number: 7,
      id: "cat",
      name: "猫",
      stage: 3,
      meaning: "猫是约会地图里的偶然停顿，为严整线路留下一点松弛。",
      colorCue: "柔灰",
      tableMark: "三枚猫爪印绕开目标线",
      lines: [
        "猫爪印横在路线旁，你们同时把球杆收慢一点。",
        "她用杆尖绕过那枚爪印，给你示范一条更轻的线。",
        "猫形光标伏在库边不动，只看这一球从面前经过。"
      ]
    },
    {
      ballNumber: 8,
      number: 8,
      id: "heart-eight",
      name: "心意（黑8）",
      stage: 4,
      meaning: "黑8承载这晚最明确的心意，是整张桌面地图的中央落点。",
      colorCue: "黑金",
      tableMark: "心形轮廓从黑8下方缓慢亮起",
      lines: [
        "心形光纹停在黑8周围，桌边的沉默变得清楚。",
        "她没有催你出杆，只把视线留在同一个落点。",
        "黑8靠近袋口时，六处地图灯标同时降低了亮度。"
      ]
    },
    {
      ballNumber: 9,
      number: 9,
      id: "sunset",
      name: "晚霞",
      stage: 5,
      meaning: "晚霞是投在台呢上的暖色回声，为雨夜约会添上一层想象。",
      colorCue: "珊瑚橙",
      tableMark: "低饱和霞光沿球路铺开",
      lines: [
        "霞光只铺在台呢上，却让这一杆显得更慢。",
        "她隔桌看着暖色球路，说这一格颜色应该留到最后。",
        "晚霞投影掠过袋口，雨夜球房仍保持原来的安静。"
      ]
    },
    {
      ballNumber: 10,
      number: 10,
      id: "gift",
      name: "礼物",
      stage: 5,
      meaning: "礼物不是独立道具，而是桌面地图里被认真选择的一枚光标。",
      colorCue: "莓红",
      tableMark: "小小缎带光纹系在球影上",
      lines: [
        "缎带光纹随球滚动，心意没有遮住真正的线路。",
        "她把巧粉推到桌面中央，像交换一份刚好的小礼物。",
        "礼物图标在袋口展开又收起，只留下一点暖光。"
      ]
    },
    {
      ballNumber: 11,
      number: 11,
      id: "message",
      name: "短信",
      stage: 5,
      meaning: "短信把没说完的句子压成桌面光点，让回应紧跟球路抵达。",
      colorCue: "屏幕蓝",
      tableMark: "三枚输入光点追在球后闪动",
      lines: [
        "输入光点跟着球路亮灭，最后在袋口组成一句收到。",
        "她隔桌点亮回应标记，让你的下一杆不必等待。",
        "短信图标始终贴着台呢移动，没有把画面带离球桌。"
      ]
    },
    {
      ballNumber: 12,
      number: 12,
      id: "bus-card",
      name: "公交卡",
      stage: 6,
      meaning: "公交卡把末班路线变成清楚轨迹，提醒两个人一起校准时间。",
      colorCue: "站牌青",
      tableMark: "刷卡弧线沿库边划过",
      lines: [
        "刷卡弧线贴着库边前进，末班方向在袋口亮起。",
        "你们隔桌核对同一条路线，再把击球角度调小一点。",
        "公交卡光标停在台呢上，时间提示没有催散这一局。"
      ]
    },
    {
      ballNumber: 13,
      number: 13,
      id: "star",
      name: "星星",
      stage: 6,
      meaning: "星星是桌灯下的微小坐标，为末班路线保留从容与亮度。",
      colorCue: "银白",
      tableMark: "细碎星点沿目标线依次出现",
      lines: [
        "星点在台呢上排成短线，为长台球标出方向。",
        "她用杆尖接住最后一颗星点，把路线轻轻转向。",
        "星形光标落在袋口旁，两个人仍站在同一盏桌灯下。"
      ]
    },
    {
      ballNumber: 14,
      number: 14,
      id: "umbrella",
      name: "雨伞",
      stage: 7,
      meaning: "雨伞把两人的路线罩进同一轮廓，是归途前的桌面约定。",
      colorCue: "雨蓝",
      tableMark: "半透明伞面轮廓覆盖球路",
      lines: [
        "伞形光纹在球桌中央撑开，为最后路线留出共同空间。",
        "她握住对侧杆尖，与你一起校准伞沿指向的袋口。",
        "雨声仍在窗外，雨伞标记只安静罩住这张桌面地图。"
      ]
    },
    {
      ballNumber: 15,
      number: 15,
      id: "homeward",
      name: "归途",
      stage: 7,
      meaning: "归途汇拢整晚的十五枚物象，让约会地图在最后一袋闭合。",
      colorCue: "路灯金",
      tableMark: "两道并肩光线在球后汇成一条",
      lines: [
        "两道光线沿台呢合拢，最后一站已经清楚。",
        "她留在球桌另一端等这一杆，也等地图完整亮起。",
        "归途球靠近袋口时，前十四枚物象在桌沿依次回亮。"
      ]
    }
  ]);

  const TABLE_VARIANT_CAMERAS = deepFreeze([
    "俯拍·整张约会地图",
    "侧跟·同一张球桌长边",
    "近景·桌面袋口路标"
  ]);

  const TABLE_VARIANT_MOTIONS = deepFreeze([
    "沿台呢地图线直行，入袋后让固定路标亮起一格",
    "擦过库边回到桌面路线，微缩灯牌始终固定在桌沿",
    "在袋口前短暂停顿，桌面投影随球速收成一个坐标"
  ]);

  const TABLE_STAGE_INTERACTIONS = deepFreeze([
    "她在球桌对面抬起杆尖，示意你沿亮起的起点继续。",
    "你们隔着桌面交换取景角度，光标仍留在台呢范围。",
    "她沿对侧库边轻敲节拍，把下一处袋口交给你选择。",
    "两个人都停在桌边，等黑8把中央心形光纹点亮。",
    "她把礼物与短信光标接到球路末端，回应没有离开桌面。",
    "你们从球桌两侧校准末班轨迹，让星点重新排成一线。",
    "她握住伞形光纹另一侧的杆尖，与你一起看归途落袋。"
  ]);

  const TABLE_MOMENT_MOTIONS = deepFreeze({
    direct: "沿桌面光线直行，干净抵达袋口",
    gentle: "贴着台呢缓慢前行，在袋口轻轻收住速度",
    power: "带动整条桌面路线脉冲发亮，利落落袋",
    bank: "碰库转向后回到约会地图的发光路线",
    long: "跨过整张球桌，把远端路标逐格点亮",
    combo: "依次推动相邻球影，让两段桌面路线接在一起",
    rattle: "在袋口两侧短暂碰响，随后落进固定地标",
    multi: "让两枚物象同时点亮桌沿上的相邻坐标",
    near: "贴着袋口掠过，停在微缩路标旁边",
    miss: "越过预定线后停在台呢中央，路标仍保持微亮",
    scratch: "让白球沉入袋口，桌面地图短暂回退一格"
  });

  const TABLE_MOMENT_DURATIONS = deepFreeze({
    direct: 1320,
    gentle: 1460,
    power: 1280,
    bank: 1560,
    long: 1680,
    combo: 1540,
    rattle: 1760,
    multi: 1720,
    near: 1480,
    miss: 1380,
    scratch: 1600
  });

  const BALLS = deepFreeze(BALL_DATE_MOTIFS.map((motif) => {
    const stage = STAGES[motif.stage - 1];
    const variants = motif.lines.map((line, index) => {
      const pocketId = POCKET_DATE_IDS[(motif.ballNumber - 1 + index * 2) % POCKET_DATE_IDS.length];
      const scene = POCKET_DATE_SCENE_BY_ID[pocketId];
      return {
        id: "ball-" + String(motif.ballNumber).padStart(2, "0") + "-table-map-" + (index + 1),
        durationMs: [1260, 1440, 1620][index],
        camera: TABLE_VARIANT_CAMERAS[index],
        visual: "同一张球桌上，" + motif.tableMark + "；" + motif.ballNumber + "号球滚向"
          + scene.tableZone + "，只在桌沿点亮" + scene.name + "的微缩路标。",
        line,
        pocketId,
        scene: scene.name,
        motif: motif.name,
        motion: TABLE_VARIANT_MOTIONS[index]
      };
    });

    return {
      number: motif.ballNumber,
      id: motif.id,
      name: motif.name,
      stage: motif.stage,
      stageId: stage.id,
      meaning: motif.meaning,
      variants
    };
  }));
  const STAGE_TRANSITIONS = deepFreeze([
    {
      stage: 1,
      stageId: "first-contact",
      nextStageId: "growing-familiar",
      variants: [
        {
          id: "transition-01-rain-contact",
          durationMs: 1840,
          scene: "雨夜球房的最后一桌灯光映在雾窗上，新联系人页面刚刚亮起。",
          backgroundKeywords: ["雨夜球房", "雾窗雨线", "墨绿台呢", "新联系人"],
          kicker: "第一章 · 初次接触",
          title: "陌生，终于有了名字",
          line: "雨还没停，联系方式已经留下；下一次问候不必再等偶遇。",
          visual: "镜头越过缓慢归位的球，推向窗边两道被桌灯拉近的倒影。",
          sound: "雨声收窄，钢琴落下两枚清亮单音",
          tone: "冷青褪向克制琥珀"
        },
        {
          id: "transition-01-closing-clock",
          durationMs: 1920,
          scene: "打烊时钟越过十点，空球桌旁仍留着没有结束的告别。",
          backgroundKeywords: ["打烊时钟", "空球桌", "桌灯余晖", "手机微光"],
          kicker: "STAGE 01 · 相识",
          title: "告别留下了下文",
          line: "名字被认真备注，今晚从一次照面变成了可以继续的开场。",
          visual: "秒针掠过整点，画面切到两部手机上同时保存的联系人。",
          sound: "钟表轻响接入柔和电钢琴和弦",
          tone: "深绿、暖白与一点银灰"
        },
        {
          id: "transition-01-shared-umbrella",
          durationMs: 1880,
          scene: "球房门外雨幕未歇，一把伞在路灯下为两个人留出位置。",
          backgroundKeywords: ["门外雨幕", "共享雨伞", "湿亮街面", "暖黄路灯"],
          kicker: "初次接触 · 完成",
          title: "同行，从半条街开始",
          line: "并肩的路很短，却足够让第一句晚安有了抵达的人。",
          visual: "伞沿雨珠连成细线，两道影子在街面上缓慢并到一起。",
          sound: "近处雨滴与远处车流下，木吉他泛音轻轻进入",
          tone: "雨蓝托住低饱和暖金"
        },
        {
          id: "transition-01-chalk-trail",
          durationMs: 1960,
          scene: "巧粉的淡蓝痕迹留在指尖，球桌两端已经不再只是陌生客人。",
          backgroundKeywords: ["巧粉微尘", "指尖特写", "桌灯光束", "交换名字"],
          kicker: "关系刻度 · 01/07",
          title: "目光有了回音",
          line: "一次对视接住一次开口，彼此的日常从此多了一处入口。",
          visual: "巧粉微尘在光束里升起，转场为第二天清晨跳出的第一条消息。",
          sound: "球体轻碰声延展成稀疏钢琴主题",
          tone: "冷白、淡蓝与柔暖肤色"
        }
      ]
    },
    {
      stage: 2,
      stageId: "growing-familiar",
      nextStageId: "intentional-dates",
      variants: [
        {
          id: "transition-02-two-cups",
          durationMs: 1860,
          scene: "吧台只剩两只温热的杯子，唱片转到最后一首。",
          backgroundKeywords: ["两只杯子", "唱片尾曲", "安静吧台", "墨绿球桌"],
          kicker: "第二章 · 熟悉升温",
          title: "日常开始为彼此留灯",
          line: "话题从喜欢什么走到今天过得怎样，见面也不再只在球房发生。",
          visual: "杯口热气叠成柔焦，下一幕里餐厅的两套餐具清晰亮起。",
          sound: "唱针底噪淡出，轻刷鼓与木吉他接棒",
          tone: "琥珀、墨绿与柔和象牙白"
        },
        {
          id: "transition-02-message-montage",
          durationMs: 1940,
          scene: "清晨、午后与深夜的消息片段在同一面玻璃上依次映过。",
          backgroundKeywords: ["消息蒙太奇", "晨光锁屏", "深夜通话", "城市倒影"],
          kicker: "STAGE 02 · 靠近",
          title: "聊天走出了屏幕",
          line: "分享变得自然，于是周末被认真空出，等一场只属于彼此的见面。",
          visual: "输入圆点化成街道路灯，镜头沿灯线落到一条已确认的日历邀请。",
          sound: "提示音被编进电钢琴节拍，最后停在确认声上",
          tone: "晨灰、暖橙与清透夜蓝"
        },
        {
          id: "transition-02-record-needle",
          durationMs: 1900,
          scene: "旧唱片的副歌刚好重合，两个人在吧台前交换下一次想去的地方。",
          backgroundKeywords: ["旧唱片", "共享耳机", "约会清单", "吧台暖灯"],
          kicker: "熟悉升温 · 完成",
          title: "共同话题有了去处",
          line: "喜欢的歌与电影列成清单，其中第一项，已经约好一起完成。",
          visual: "唱针沿纹路向内推进，圆形画面匹配切到并排放好的两张票。",
          sound: "低声唱片底噪托住一段克制弦乐上行",
          tone: "烟黑、铜金与一点莓红"
        },
        {
          id: "transition-02-calendar-light",
          durationMs: 1980,
          scene: "打烊后的球房归于安静，手机日历里同一天被两个人同时圈住。",
          backgroundKeywords: ["打烊球房", "双人日历", "周末约定", "桌灯熄灭"],
          kicker: "关系刻度 · 02/07",
          title: "问候抵达了下一次见面",
          line: "频繁联系没有停在暧昧里，一段被留出的时间正在变得具体。",
          visual: "桌灯逐盏熄灭，只留日历日期发亮，随后展开为周末街景。",
          sound: "环境声渐静，一记日历确认音带出轻快贝斯",
          tone: "暗绿背景上浮出清暖金色"
        }
      ]
    },
    {
      stage: 3,
      stageId: "intentional-dates",
      nextStageId: "spoken-heart",
      variants: [
        {
          id: "transition-03-ticket-afterglow",
          durationMs: 1880,
          scene: "两张票根压在餐巾一角，散场后的街灯把肩线照得很近。",
          backgroundKeywords: ["并排票根", "散场街灯", "约会余温", "肩线剪影"],
          kicker: "第三章 · 线下靠近",
          title: "约会之后，只差一句说清",
          line: "两次赴约都不是顺路，藏在安排里的认真已经有了清晰轮廓。",
          visual: "票根日期被光扫过，镜头抬向夜色里欲言又止的侧脸。",
          sound: "木吉他尾音悬停，单音钢琴从远处回应",
          tone: "清透夜蓝与柔暖路灯金"
        },
        {
          id: "transition-03-restaurant-close",
          durationMs: 1960,
          scene: "餐厅已经收走邻桌，最后一壶茶仍在两个人之间冒着热气。",
          backgroundKeywords: ["闭店餐厅", "最后一壶茶", "双人餐桌", "窗外夜色"],
          kicker: "STAGE 03 · 赴约",
          title: "时间被认真留给了彼此",
          line: "沉默也开始舒服，离开时那句还想见你，已经不像试探。",
          visual: "服务灯缓慢变暗，热气上升后溶成天台边缘的薄雾。",
          sound: "瓷杯轻放，餐厅底噪退成一段长弦音",
          tone: "奶白灯面、深绿阴影与月白"
        },
        {
          id: "transition-03-gallery-door",
          durationMs: 1840,
          scene: "展馆玻璃门在身后合上，两个人的倒影仍并肩停在夜里。",
          backgroundKeywords: ["展馆玻璃门", "并肩倒影", "夜间广场", "未说出口"],
          kicker: "线下靠近 · 完成",
          title: "认真不再需要伪装成偶然",
          line: "下一次见面已经约好，而更重要的那句话，也终于走到门边。",
          visual: "玻璃倒影与真实身影短暂重合，城市灯点向画面中央收束。",
          sound: "脚步声同步后淡出，屋顶风声轻轻进入",
          tone: "玻璃银灰、城市暖金与克制玫瑰色"
        },
        {
          id: "transition-03-weekend-route",
          durationMs: 2000,
          scene: "周末路线在地图上连成一条细线，终点停在能看见城市的高处。",
          backgroundKeywords: ["周末地图", "两人路线", "城市高处", "夜风前奏"],
          kicker: "关系刻度 · 03/07",
          title: "靠近有了明确方向",
          line: "从吃饭到正式约会，每一步都得到回应；今晚，心意将不再绕行。",
          visual: "地图线条化作城市天际线，最后一盏灯落在相对而立的两人之间。",
          sound: "轻快节拍逐层抽离，只留下钢琴与呼吸",
          tone: "清蓝渐深，中心保留温暖肤色"
        }
      ]
    },
    {
      stage: 4,
      stageId: "spoken-heart",
      nextStageId: "confirmed-love",
      variants: [
        {
          id: "transition-04-wind-still",
          durationMs: 1920,
          scene: "天台风在回答落下时短暂停住，远处城市铺成安静光海。",
          backgroundKeywords: ["夜色天台", "城市光海", "停住的风", "相对身影"],
          kicker: "第四章 · 告白",
          title: "喜欢终于有了回声",
          line: "一句认真被另一句认真接住，从此靠近不必再借偶然。",
          visual: "城市灯点先虚化再逐一亮起，两道影子在栏杆前慢慢靠近。",
          sound: "风声骤轻，钢琴主题第一次出现完整和弦",
          tone: "月白轮廓与含蓄暖金"
        },
        {
          id: "transition-04-joined-shadows",
          durationMs: 1880,
          scene: "楼梯间的感应灯逐层亮起，两个人的影子从前后变成并排。",
          backgroundKeywords: ["楼梯感应灯", "并排影子", "告白余温", "夜归脚步"],
          kicker: "STAGE 04 · 心意抵达",
          title: "关系有了新的名字",
          line: "答案没有烟火，只有一起下楼的脚步，比来时更近了一点。",
          visual: "灯光按脚步次序亮起，最后定格在自然相碰的手背。",
          sound: "脚步与心跳低频交叠，弦乐只抬高半度",
          tone: "深灰楼道与温暖顶灯"
        },
        {
          id: "transition-04-city-lights",
          durationMs: 1960,
          scene: "城市灯光倒映在彼此眼里，未发出的消息被一句当面回答取代。",
          backgroundKeywords: ["眼神特写", "城市灯点", "已读心意", "轻柔夜风"],
          kicker: "告白 · 完成",
          title: "从我喜欢你，到我们",
          line: "等待过的沉默终于落地，下一段故事将由两个人共同署名。",
          visual: "两块手机屏幕同时熄灭，真实的目光成为画面唯一亮处。",
          sound: "提示音被取消，取而代之的是温柔大提琴和声",
          tone: "夜蓝、肤色暖光与一点香槟金"
        },
        {
          id: "transition-04-cues-together",
          durationMs: 1840,
          scene: "回到旧球房，两支球杆第一次并排靠在同一侧墙边。",
          backgroundKeywords: ["并排球杆", "旧球房", "双人外套", "暖白桌灯"],
          kicker: "关系刻度 · 04/07",
          title: "不再隔着球桌试探",
          line: "心意被说清以后，牵手、拥抱和同行都将拥有从容的开始。",
          visual: "镜头从两支球杆缓慢下移，停在桌边距离很近的两只手。",
          sound: "球杆靠墙的轻响后，完整钢琴主题温柔展开",
          tone: "暖白、墨绿与低饱和绯红"
        }
      ]
    },
    {
      stage: 5,
      stageId: "confirmed-love",
      nextStageId: "learning-together",
      variants: [
        {
          id: "transition-05-suitcase-unpacked",
          durationMs: 1940,
          scene: "旅行归来的行李摊开在客厅，照片旁也放着未完成的日程。",
          backgroundKeywords: ["打开的行李箱", "旅行照片", "共同日程", "日常客厅"],
          kicker: "第五章 · 确定关系",
          title: "亲密走进了真实日常",
          line: "牵手与远行留下甜意，也把习惯、疲惫和不同节奏带到彼此面前。",
          visual: "旅行照片依次掠过，最后停在一张写满修改痕迹的日程表。",
          sound: "列车节奏减慢，低音提琴与室内钟声进入",
          tone: "明亮旅行色回落为自然中性色"
        },
        {
          id: "transition-05-morning-platform",
          durationMs: 1860,
          scene: "清晨站台上仍牵着的手，切换到忙碌工作日里错开的时间。",
          backgroundKeywords: ["清晨站台", "相握的手", "错开日程", "城市通勤"],
          kicker: "STAGE 05 · 相爱",
          title: "靠近，也照见彼此的边界",
          line: "关系越确定，差异越无法藏在浪漫之后；这一次，你们会留下来谈完。",
          visual: "列车门在相握的手后合拢，玻璃倒影变成两份不同的时间表。",
          sound: "站台提示音化成克制的低音钢琴脉冲",
          tone: "晨金转向冷白，人物肤色保持温暖"
        },
        {
          id: "transition-05-shared-key",
          durationMs: 1900,
          scene: "一把备用钥匙落进掌心，身后是开始共同使用的普通空间。",
          backgroundKeywords: ["备用钥匙", "共同空间", "玄关灯", "生活细节"],
          kicker: "确定关系 · 完成",
          title: "爱有了可以推开的门",
          line: "共同生活的入口已经打开，门内既有拥抱，也有需要说清的分歧。",
          visual: "钥匙反光划过画面，转场到餐桌上并排却不同的两份计划。",
          sound: "钥匙清响后，温暖和弦里加入一枚低音",
          tone: "家居暖光与清醒的灰蓝阴影"
        },
        {
          id: "transition-05-photo-outside-frame",
          durationMs: 1980,
          scene: "合影之外，迟到的晚餐、散乱行李与沉默的片刻同样进入画面。",
          backgroundKeywords: ["旅行合影", "迟到晚餐", "散乱行李", "真实生活"],
          kicker: "关系刻度 · 05/07",
          title: "滤镜退场，同行继续",
          line: "你们看见彼此不够轻松的一面，下一阶段将学习怎样把话真正听完。",
          visual: "鲜亮照片向后退成桌边小框，前景的两把椅子缓慢拉近。",
          sound: "快门声淡去，只留室内底噪与缓慢钢琴",
          tone: "褪色暖调、木色与少量冷光"
        }
      ]
    },
    {
      stage: 6,
      stageId: "learning-together",
      nextStageId: "shared-future",
      variants: [
        {
          id: "transition-06-warm-lamp-return",
          durationMs: 1920,
          scene: "争执后的桌灯重新亮暖，两杯冷茶被换成刚烧好的热水。",
          backgroundKeywords: ["重亮桌灯", "两杯热水", "争执之后", "重新落座"],
          kicker: "第六章 · 磨合",
          title: "听懂以后，重新并肩",
          line: "分歧没有消失，却被放到两个人都看得见的位置，未来因此能够谈得更远。",
          visual: "冷色阴影沿桌面退开，两把椅子从对面缓慢移到同一侧。",
          sound: "低音脉冲松开，钢琴主题在暖和弦中回归",
          tone: "冷灰回暖至柔白与浅金"
        },
        {
          id: "transition-06-plans-overlap",
          durationMs: 1880,
          scene: "两份各自坚持的计划摊在桌上，中间添了一张共同书写的新页。",
          backgroundKeywords: ["双份计划", "共同新页", "协商标记", "桌边暖灯"],
          kicker: "STAGE 06 · 理解",
          title: "差异留下了坐标",
          line: "你们不再用沉默换和平，而是从保留彼此开始，画出可以同行的路线。",
          visual: "不同颜色的批注逐渐汇入一张地图，路线向远处延伸。",
          sound: "纸页翻动与铅笔声组成轻巧节拍",
          tone: "纸张象牙白、墨蓝与低饱和绿"
        },
        {
          id: "transition-06-reheated-tea",
          durationMs: 1960,
          scene: "凉掉的茶重新升起热气，窗外天色也从深夜走向将明。",
          backgroundKeywords: ["热茶蒸汽", "深夜长谈", "将明窗色", "相接目光"],
          kicker: "磨合 · 完成",
          title: "和好不是略过，而是听完",
          line: "那些真正的不安终于被说清，谈论未来不再只靠浪漫支撑。",
          visual: "蒸汽掠过相接的目光，溶成窗外逐渐清晰的城市轮廓。",
          sound: "水沸声渐远，大提琴长音托起清晨鸟声",
          tone: "深夜蓝向清晨淡金过渡"
        },
        {
          id: "transition-06-same-side-seats",
          durationMs: 1840,
          scene: "原本相对的两把椅子并到桌子同侧，未来清单摆在正前方。",
          backgroundKeywords: ["同侧座椅", "未来清单", "并肩视角", "安静室内"],
          kicker: "关系刻度 · 06/07",
          title: "你们重新站到问题的同一边",
          line: "理解没有让谁消失，只让下一次选择可以由两个人共同承担。",
          visual: "镜头越过并肩肩线，推向写着城市、时间与家的三行清单。",
          sound: "椅脚轻响后，钢琴与大提琴第一次同奏主旋律",
          tone: "克制暖白、深绿与稳定金色"
        }
      ]
    },
    {
      stage: 7,
      stageId: "shared-future",
      nextStageId: null,
      variants: [
        {
          id: "transition-07-dawn-table",
          durationMs: 2000,
          scene: "旧球房迎来清晨，地图、戒盒与两支球杆留在同一束光里。",
          backgroundKeywords: ["旧球房清晨", "地图戒盒", "并排球杆", "淡金天光"],
          kicker: "第七章 · 共同未来",
          title: "问题落下，未来起身",
          line: "你们谈过城市、账单与取舍，最后才把很长的承诺交到彼此手中。",
          visual: "晨光沿台呢缓慢铺开，依次照亮地图、戒指与相握的手。",
          sound: "完整钢琴主题与大提琴和声在清晨环境声中展开",
          tone: "暖白、墨绿与清晨淡金"
        },
        {
          id: "transition-07-ring-map",
          durationMs: 1940,
          scene: "戒指放在摊开的城市地图上，圆环正好圈住共同选择的街区。",
          backgroundKeywords: ["戒指与地图", "共同街区", "生活计划", "柔暖桌灯"],
          kicker: "STAGE 07 · 约定",
          title: "承诺终于落到生活里",
          line: "它不只指向某个盛大时刻，也指向以后每一个需要商量的普通早晨。",
          visual: "镜头穿过戒指圆环，看见远处并肩核对清单的两个人。",
          sound: "一声清澈金属轻响，接入舒展却不过满的弦乐",
          tone: "香槟金、纸张白与沉静墨绿"
        },
        {
          id: "transition-07-paired-cues",
          durationMs: 1880,
          scene: "两支使用多年的球杆并排靠墙，桌边新增了一张写着共同姓氏的便签。",
          backgroundKeywords: ["并排旧球杆", "共同署名", "桌边便签", "起点回望"],
          kicker: "共同未来 · 完成",
          title: "故事回到起点，身边多了一个人",
          line: "从隔桌对视到并肩计划，你们没有停在答案里，而是准备继续生活。",
          visual: "镜头沿球杆上移，旧日雨窗与今日晨光在玻璃上短暂重叠。",
          sound: "第一章的雨声短暂回响，随后融入完整主题",
          tone: "旧日冷青与今日暖金平衡交叠"
        },
        {
          id: "transition-07-ordinary-morning",
          durationMs: 1960,
          scene: "球房门被推开，街上早餐店刚亮灯，两个人并肩走进普通清晨。",
          backgroundKeywords: ["普通清晨", "早餐店灯", "并肩背影", "城市苏醒"],
          kicker: "关系刻度 · 07/07",
          title: "最华丽的段落，落在寻常",
          line: "很长的问题已经回答，接下来是买早餐、赶车，以及一起度过明天。",
          visual: "门外晨光吞没剪影，画面最后停在两杯被同时接过的热饮。",
          sound: "弦乐收束，保留钢琴尾句与渐近街声",
          tone: "清晨乳白、柔金与自然城市色"
        }
      ]
    }
  ]);

  const STAGE_EVENTS = deepFreeze([
    {
      stage: 1,
      stageId: "first-contact",
      events: {
        miss: [
          {
            id: "stage-01-miss-opening-line",
            durationMs: 1320,
            camera: "中景·目标球擦过袋角",
            title: "开场白停在袋口",
            visual: "目标球偏出半颗，她刚抬起的目光也随球声移开。",
            line: "你们只交换了一句客气，第一次认识暂时没有再往前。",
            impact: "关系进度未增加，陌生感仍留在球桌两端。",
            sound: "轻促擦袋声与近处雨声",
            tone: "冷青、墨绿与一线暖白"
          },
          {
            id: "stage-01-miss-lost-name",
            durationMs: 1460,
            camera: "对切·球房忽然喧闹",
            title: "名字被人声盖住",
            visual: "这一杆偏离路线，邻桌笑声正好淹没你报出的名字。",
            line: "她礼貌地点头，却没能听清；认识仍停在模糊印象里。",
            impact: "没有留下称呼，下一次开口仍需要重新开始。",
            sound: "碰库闷响后，人声短暂抬高",
            tone: "深绿背景压住柔暖肤色"
          },
          {
            id: "stage-01-miss-rain-question",
            durationMs: 1580,
            camera: "侧景·窗边空杆",
            title: "关于雨的话题没有接上",
            visual: "球停在窗边倒影下，她已经转身去拿自己的外套。",
            line: "你想问她是否带伞，迟了一秒，只来得及说再见。",
            impact: "初次接触没有破局，偶遇仍是唯一的联系。",
            sound: "滚动声渐止，玻璃雨声变清晰",
            tone: "雨蓝与低饱和琥珀"
          },
          {
            id: "stage-01-miss-contact-unsaid",
            durationMs: 1740,
            camera: "远景·门口将合",
            title: "联系方式还没问出口",
            visual: "目标球停在袋前，球房门在她身后缓慢合上。",
            line: "今晚留下了对视和短谈，却没有通向下一次的入口。",
            impact: "相识未推进，后续只能等待新的交集。",
            sound: "球体慢停与门铃一声",
            tone: "冷白门光切开暗绿室内"
          }
        ],
        scratch: [
          {
            id: "stage-01-scratch-polite-distance",
            durationMs: 1380,
            camera: "俯拍·白球落入边袋",
            title: "轻松开场突然失了准星",
            visual: "白球沿袋口坠下，你们同时停住刚开始的话题。",
            line: "一阵短促尴尬把气氛推回礼貌，彼此都收起了半步靠近。",
            impact: "第一印象受到波动，熟悉度暂时回落。",
            sound: "白球落袋低响，钢琴单音中断",
            tone: "冷灰压低桌灯暖色"
          },
          {
            id: "stage-01-scratch-spilled-water",
            durationMs: 1620,
            camera: "近景·底袋与打翻的水杯",
            title: "忙乱抢在认识之前",
            visual: "白球被连撞带入底袋，你转身时又碰倒桌边水杯。",
            line: "她帮忙递来纸巾，谈话却只剩收拾残局的匆忙。",
            impact: "联系方式没有留下，印象被意外打散。",
            sound: "落袋声叠上杯壁轻碰",
            tone: "银灰水光与克制冷青"
          },
          {
            id: "stage-01-scratch-abrupt-goodbye",
            durationMs: 1880,
            camera: "缓拉·白球绕袋消失",
            title: "这一晚提前结束",
            visual: "白球绕角袋一周落下，店员恰好开始收灯。",
            line: "刚有一点轮廓的相识被打烊截断，告别里没有来得及留下下文。",
            impact: "本阶段出现明显停顿，下一次相遇仍不确定。",
            sound: "袋网闷响后，顶灯逐盏轻灭",
            tone: "暗绿、冷白与门外雨蓝"
          }
        ],
        setup: [
          {
            id: "stage-01-setup-offered-chalk",
            durationMs: 1280,
            camera: "特写·停在袋前的球与巧粉",
            title: "这一杆只递出一点善意",
            visual: "目标球没有入袋，你把巧粉推到她伸手可及的位置。",
            line: "关系没有推进，她却记住了这份不着痕迹的照顾。",
            impact: "未增加阶段进度，下一次搭话获得自然开口。",
            sound: "球体慢停与巧粉落桌轻响",
            tone: "冷青里保留一小块暖白"
          },
          {
            id: "stage-01-setup-saved-seat",
            durationMs: 1510,
            camera: "中景·空出的桌边位置",
            title: "距离先缩短了半步",
            visual: "球停在安全位，你顺手为她挪开挡路的高脚椅。",
            line: "名字还没交换，站位却从球桌两端移到了相邻一侧。",
            impact: "本杆未推进关系，下一次对话的距离更自然。",
            sound: "椅脚轻移，雨声维持低位",
            tone: "墨绿与温和木色"
          },
          {
            id: "stage-01-setup-umbrella-glance",
            durationMs: 1760,
            camera: "侧跟·窗边伞架",
            title: "下一句话已经有了题目",
            visual: "没有球落袋，她的视线却在窗外雨线与空伞架之间停了停。",
            line: "相识暂未推进，一个关于回程的问题正等在这一局之后。",
            impact: "进度保持不变，离场时可能出现新的交集。",
            sound: "稀疏雨滴与一枚钢琴泛音",
            tone: "雨蓝、玻璃灰与柔黄灯点"
          }
        ]
      }
    },
    {
      stage: 2,
      stageId: "growing-familiar",
      events: {
        miss: [
          {
            id: "stage-02-miss-topic-fades",
            durationMs: 1340,
            camera: "中近景·球停在长库",
            title: "话题在中途散开",
            visual: "目标球偏出线路，刚聊起的旧电影也停在片名。",
            line: "你们没有找到下一句，熟悉感今晚只维持在原处。",
            impact: "关系未升温，共同话题没有继续展开。",
            sound: "碰库轻响，唱片底噪短暂变空",
            tone: "琥珀灯下混入安静灰绿"
          },
          {
            id: "stage-02-miss-reply-delayed",
            durationMs: 1490,
            camera: "分屏·未送达消息与偏袋球",
            title: "回复晚了一整个夜晚",
            visual: "球从袋边滑走，屏幕上的问候直到次日才亮起回应。",
            line: "联系没有断，只是刚形成的频率被拉开了一段距离。",
            impact: "阶段进度停滞，日常分享的连续感减弱。",
            sound: "擦袋声接一枚迟到提示音",
            tone: "夜蓝、屏幕白与淡琥珀"
          },
          {
            id: "stage-02-miss-call-ended",
            durationMs: 1640,
            camera: "分屏·通话突然结束",
            title: "晚安比预想更早",
            visual: "这一杆没有进球，通话也被一阵忙音截在半句话里。",
            line: "想分享的情绪没能说完，彼此的日常暂时少了一块。",
            impact: "熟悉度未推进，一段未完话题留到以后。",
            sound: "滚动声止于忙音，电钢琴留白",
            tone: "深夜蓝与两端孤立暖灯"
          },
          {
            id: "stage-02-miss-record-skip",
            durationMs: 1810,
            camera: "俯拍·唱针跳格",
            title: "默契跳过了这一拍",
            visual: "球撞库后偏离，唱针也恰好跳过你们都喜欢的副歌。",
            line: "共同兴趣仍在，却没有自然走向下一次见面的约定。",
            impact: "本阶段没有推进，线下靠近尚未发生。",
            sound: "唱针跳格与低缓碰库声",
            tone: "烟黑、铜色与低饱和绿"
          }
        ],
        scratch: [
          {
            id: "stage-02-scratch-joke-misread",
            durationMs: 1420,
            camera: "近景·白球滑入中袋",
            title: "玩笑越过了分寸",
            visual: "白球直落中袋，屏幕另一端的回复也从轻快变成简短。",
            line: "一句没被接住的玩笑让她收回分享，聊天突然客气起来。",
            impact: "熟悉感明显回落，彼此边界重新变得清晰。",
            sound: "落袋闷响，提示音降为低频",
            tone: "暖琥珀被冷灰切断"
          },
          {
            id: "stage-02-scratch-private-question",
            durationMs: 1680,
            camera: "对切·白球落袋后的沉默",
            title: "问题问得太近",
            visual: "白球擦两库后入袋，她停顿片刻，把手机扣回桌面。",
            line: "过早触及的私人话题让她结束谈话，刚建立的从容被收紧。",
            impact: "阶段关系受挫，分享意愿暂时降低。",
            sound: "连续碰库后骤静，只留吧台底噪",
            tone: "墨绿、暗金与冷白阴影"
          },
          {
            id: "stage-02-scratch-missed-plan",
            durationMs: 1900,
            camera: "俯拍·空座与角袋",
            title: "第一次约定落了空",
            visual: "白球坠入角袋，吧台对面的座位从暖茶等到杯壁变凉。",
            line: "一场没有及时说明的缺席，让频繁联系第一次失去可信的落点。",
            impact: "信任出现缺口，正式约会被推迟。",
            sound: "袋网低响与钟表走针",
            tone: "褪暖琥珀与安静蓝灰"
          }
        ],
        setup: [
          {
            id: "stage-02-setup-shared-playlist",
            durationMs: 1300,
            camera: "俯拍·安全球与共享歌单",
            title: "这一杆留下了一首歌",
            visual: "目标球停在安全区，她把刚提到的歌加入共享列表。",
            line: "关系没有升温，却多了一段会在明天继续播放的声音。",
            impact: "阶段进度不变，共同兴趣获得后续入口。",
            sound: "球速缓停，唱片前奏轻轻浮起",
            tone: "墨绿、唱片黑与柔暖橙"
          },
          {
            id: "stage-02-setup-saved-article",
            durationMs: 1540,
            camera: "过肩·收藏页面",
            title: "分享先被认真收下",
            visual: "没有球入袋，她把你发来的长文标记为稍后阅读。",
            line: "今晚没有聊深，但你的兴趣开始在她的日常里占一小格。",
            impact: "未推进阶段，下一次话题已有明确线索。",
            sound: "轻碰球声与收藏确认音",
            tone: "屏幕冷白衬着吧台暖金"
          },
          {
            id: "stage-02-setup-tomorrow-message",
            durationMs: 1780,
            camera: "特写·停在袋口与输入框",
            title: "未完的话留到了明天",
            visual: "球停在袋沿，她发来一句太晚了，明天接着说。",
            line: "关系暂时没有推进，联系却第一次自然越过了今天。",
            impact: "进度保持，持续聊天的节奏得到铺垫。",
            sound: "球体轻停，温和提示音接电钢琴尾句",
            tone: "深夜蓝与稳定暖白"
          }
        ]
      }
    },
    {
      stage: 3,
      stageId: "intentional-dates",
      events: {
        miss: [
          {
            id: "stage-03-miss-reservation-time",
            durationMs: 1360,
            camera: "俯拍·偏袋球与两条日历",
            title: "约会错开了半小时",
            visual: "目标球偏出，两份日历上的预约时间也没有对齐。",
            line: "见面被匆忙压缩，原本想说的话只剩一半。",
            impact: "线下靠近未推进，正式感被削弱。",
            sound: "擦袋轻响与短促日历提示",
            tone: "清冷白光混入餐厅暖色"
          },
          {
            id: "stage-03-miss-menu-silence",
            durationMs: 1510,
            camera: "双人中景·菜单之间",
            title: "这顿饭安静得有些生疏",
            visual: "球停在库边，菜单也一直挡在两个人之间。",
            line: "线上熟悉没有完全落到现实，沉默让第一次单独吃饭慢了下来。",
            impact: "阶段关系停留，约会舒适度没有增加。",
            sound: "球体慢停与餐具远响",
            tone: "暖白餐灯下保留一层灰绿"
          },
          {
            id: "stage-03-miss-gallery-distance",
            durationMs: 1660,
            camera: "长焦·展厅两端",
            title: "并肩变成了前后",
            visual: "这一杆落空，你们也在展厅不同作品前各自停了很久。",
            line: "约会仍然完整，却没有找到自然靠近的节奏。",
            impact: "关系未推进，双方仍在确认相处方式。",
            sound: "空旷脚步与低声碰库",
            tone: "展厅白、玻璃灰与少量暖肤色"
          },
          {
            id: "stage-03-miss-next-date-unsaid",
            durationMs: 1840,
            camera: "侧景·散场出口",
            title: "下一次没有被提起",
            visual: "目标球停在袋前，散场后你们在路口各自看向不同方向。",
            line: "这次见面没有不好，只是认真尚未得到更明确的回应。",
            impact: "正式约会未推进，关系保持观察。",
            sound: "球速归零，街口信号音清晰响起",
            tone: "夜蓝、路灯金与克制灰色"
          }
        ],
        scratch: [
          {
            id: "stage-03-scratch-late-without-word",
            durationMs: 1440,
            camera: "俯拍·白球入袋与空餐位",
            title: "等待先耗掉了期待",
            visual: "白球落入边袋，她独自在餐桌前看过两次时间。",
            line: "没有说明的迟到让这场认真安排的见面显得不再对等。",
            impact: "信任与期待同时下降，约会进程受挫。",
            sound: "落袋声叠上钟表秒针",
            tone: "餐厅暖光褪成冷灰"
          },
          {
            id: "stage-03-scratch-phone-between",
            durationMs: 1700,
            camera: "双人近景·白球与亮屏",
            title: "屏幕占据了对面的座位",
            visual: "白球被撞进底袋，你的手机也第三次在她说话时亮起。",
            line: "她把没有讲完的故事收住，这次约会忽然像一场被打断的行程。",
            impact: "被重视感下降，线下关系明显停顿。",
            sound: "袋网闷响与连续震动声",
            tone: "屏幕冷光压住柔暖餐灯"
          },
          {
            id: "stage-03-scratch-decided-for-her",
            durationMs: 1920,
            camera: "对切·角袋与两张票",
            title: "安排得太满，回应无处落下",
            visual: "白球绕角袋坠落，你已经替她决定了整段周末路线。",
            line: "精心计划没有留下选择空间，她的期待转成了谨慎。",
            impact: "约会意愿受损，下一步靠近被延后。",
            sound: "两次碰库后落袋，弦乐骤停",
            tone: "华灯暖金被清醒蓝灰压低"
          }
        ],
        setup: [
          {
            id: "stage-03-setup-shared-dessert",
            durationMs: 1320,
            camera: "俯拍·安全球与甜点盘",
            title: "这一杆只记住了偏好",
            visual: "没有球入袋，她把最后一口不太甜的点心推给你。",
            line: "约会没有推进，彼此的口味却被安静记在心里。",
            impact: "阶段进度不变，真实相处增加一处细节。",
            sound: "球体慢停与瓷盘轻响",
            tone: "奶白、浅金与墨绿"
          },
          {
            id: "stage-03-setup-ticket-kept",
            durationMs: 1560,
            camera: "特写·票根收进书页",
            title: "票根先替今晚留下证据",
            visual: "目标球停在袋口，她把两张票根一起夹进随身的书。",
            line: "关系暂未推进，这场见面却已经被她认真保留。",
            impact: "未增加阶段进度，下一次约会获得温和伏笔。",
            sound: "纸页轻合与一枚木吉他泛音",
            tone: "纸张暖白与低饱和玫瑰色"
          },
          {
            id: "stage-03-setup-walk-to-station",
            durationMs: 1800,
            camera: "侧跟·末班车方向",
            title: "同行多出了一站路",
            visual: "这一杆只做防守，散场后她却放慢脚步陪你走向车站。",
            line: "约会没有明确推进，分别的时间却被双方默契地推迟。",
            impact: "进度保持不变，靠近意愿获得铺垫。",
            sound: "缓慢脚步与远处列车声",
            tone: "夜蓝、路灯暖金与自然肤色"
          }
        ]
      }
    },
    {
      stage: 4,
      stageId: "spoken-heart",
      events: {
        miss: [
          {
            id: "stage-04-miss-words-stall",
            durationMs: 1380,
            camera: "近景·球停与欲言又止",
            title: "那句话停在开头",
            visual: "目标球滑过袋口，你说到其实，随后只剩一阵夜风。",
            line: "心意已经靠近出口，却没有在今晚完整抵达。",
            impact: "告白阶段未推进，双方继续停在确认之前。",
            sound: "擦袋声后只留天台风",
            tone: "月白与深夜蓝"
          },
          {
            id: "stage-04-miss-interrupted-moment",
            durationMs: 1530,
            camera: "远景·忽然打开的天台门",
            title: "准备好的时刻被打断",
            visual: "这一杆偏出，天台门也被人推开，安静瞬间散去。",
            line: "原本清晰的告白失去落点，只能重新收回普通谈话。",
            impact: "关系没有推进，表达时机被延后。",
            sound: "碰库声与门轴轻响叠在一起",
            tone: "城市冷光切开柔暖轮廓"
          },
          {
            id: "stage-04-miss-hidden-in-joke",
            durationMs: 1680,
            camera: "对切·笑意慢慢收住",
            title: "认真又藏回了玩笑",
            visual: "球偏离直线，你把喜欢说成一句可以随时撤回的笑话。",
            line: "她跟着笑了，却无法确认这份心意究竟有多认真。",
            impact: "告白未完成，彼此判断仍然模糊。",
            sound: "轻碰球声与短促失笑",
            tone: "月白、灰蓝与一线暖色"
          },
          {
            id: "stage-04-miss-unsent-message",
            durationMs: 1860,
            camera: "过肩·未发送输入框",
            title: "长消息没有发出",
            visual: "目标球停在库边，写好的心意也停在发送键上方。",
            line: "今晚留下了足够多的暗示，却没有一个可以被回答的问题。",
            impact: "阶段进度停滞，关系维持暧昧。",
            sound: "球速渐止，键盘声也随之停下",
            tone: "屏幕冷白与室内低暖灯"
          }
        ],
        scratch: [
          {
            id: "stage-04-scratch-blurted-pressure",
            durationMs: 1460,
            camera: "俯拍·白球直落中袋",
            title: "心意在压力里脱口而出",
            visual: "白球坠入中袋，你在旁人起哄中仓促说出了喜欢。",
            line: "她听见了内容，却没能得到从容理解与回答的空间。",
            impact: "告白体验受损，回应被迫延后。",
            sound: "落袋声压过远处人声，音乐骤停",
            tone: "冷白高光与收紧的暗红"
          },
          {
            id: "stage-04-scratch-public-scene",
            durationMs: 1720,
            camera: "远景·人群与角袋",
            title: "场面比心意更先抵达",
            visual: "白球绕入角袋，过于公开的安排也让她站在所有目光中央。",
            line: "浪漫的外壳变得太响，她的真实感受暂时被人群盖住。",
            impact: "安全感下降，关系无法在此刻确认。",
            sound: "袋网闷响后，人群声被低频压远",
            tone: "亮金退去，只留清醒蓝灰"
          },
          {
            id: "stage-04-scratch-promise-too-far",
            durationMs: 1940,
            camera: "双人中景·白球落袋后的距离",
            title: "喜欢被说成了太远的以后",
            visual: "白球被连撞入底袋，你的告白也越过当下，直接抵达一生。",
            line: "承诺重过了刚成熟的关系，她没有后退，却无法立刻接住。",
            impact: "告白阶段受挫，关系需要重新确认节奏。",
            sound: "连续碰撞后低沉落袋，弦乐悬停",
            tone: "月白轮廓下压入深灰"
          }
        ],
        setup: [
          {
            id: "stage-04-setup-folded-note",
            durationMs: 1340,
            camera: "特写·安全球与折起便签",
            title: "心意先被留在口袋里",
            visual: "没有球入袋，你把写好的便签重新折好，却没有丢掉。",
            line: "告白尚未发生，认真表达的准备仍被完整保留。",
            impact: "阶段不推进，下一次开口获得明确铺垫。",
            sound: "纸张轻折与单音钢琴",
            tone: "象牙白、月蓝与低暖肤色"
          },
          {
            id: "stage-04-setup-rooftop-wait",
            durationMs: 1580,
            camera: "双人远景·栏杆两侧",
            title: "她没有先离开",
            visual: "目标球停在袋前，长久沉默里她仍站在原处等你说完。",
            line: "关系没有推进，却多了一段允许认真发生的时间。",
            impact: "进度保持，告白获得温和回应信号。",
            sound: "城市底噪与稳定风声",
            tone: "深夜蓝与柔白轮廓"
          },
          {
            id: "stage-04-setup-held-gaze",
            durationMs: 1820,
            camera: "缓推·没有移开的目光",
            title: "答案之前，目光先停住",
            visual: "这一杆只把球送到袋口，她却在你欲言又止时认真回望。",
            line: "告白暂未落下，彼此都已察觉今晚与往常不同。",
            impact: "阶段未推进，心意确认获得清晰前奏。",
            sound: "球体轻停，风声下浮出弦乐长音",
            tone: "月白、城市金与克制玫瑰色"
          }
        ]
      }
    },
    {
      stage: 5,
      stageId: "confirmed-love",
      events: {
        miss: [
          {
            id: "stage-05-miss-hands-pass",
            durationMs: 1400,
            camera: "特写·错开的指尖",
            title: "牵手错过了这一秒",
            visual: "目标球偏出，两只伸向同处的手也在雨伞下先后收回。",
            line: "关系已经确认，身体的靠近却暂时没有找到自然节奏。",
            impact: "亲密进度未增加，双方仍在适应边界。",
            sound: "擦袋轻响与伞面细雨",
            tone: "雨蓝、路灯金与柔暖肤色"
          },
          {
            id: "stage-05-miss-cancelled-evening",
            durationMs: 1550,
            camera: "俯拍·偏袋球与取消日程",
            title: "约好的晚上临时空了",
            visual: "球停在长库，手机日历里的双人安排也变成灰色。",
            line: "一句加班让见面推迟，想念没有消失，只是没能落地。",
            impact: "关系未推进，共同日常少了一次累积。",
            sound: "碰库声与日历取消提示",
            tone: "城市冷白与低饱和暖橙"
          },
          {
            id: "stage-05-miss-travel-wrong-turn",
            durationMs: 1710,
            camera: "广角·岔路与停球",
            title: "旅途在岔路口停了一拍",
            visual: "这一杆落空，你们也拿着不同路线在陌生街口沉默片刻。",
            line: "共同旅行露出节奏差异，浪漫没有因此消失，却需要重新对齐。",
            impact: "亲密关系暂不推进，磨合议题开始显现。",
            sound: "球速渐止，远处街声与地图折响",
            tone: "日照暖色混入清醒灰蓝"
          },
          {
            id: "stage-05-miss-comfort-unsaid",
            durationMs: 1880,
            camera: "侧景·相邻却沉默的座位",
            title: "安慰没有找到合适的话",
            visual: "目标球停在袋前，她靠在窗边，你坐近却没能开口。",
            line: "陪伴仍在，只是这次难过没有被真正看见。",
            impact: "情感连接未推进，一段情绪留待之后理解。",
            sound: "球体轻停与低缓列车声",
            tone: "车窗灰蓝与局部暖光"
          }
        ],
        scratch: [
          {
            id: "stage-05-scratch-boundary-crossed",
            durationMs: 1480,
            camera: "俯拍·白球入袋与被拿起的手机",
            title: "亲密越过了未说清的边界",
            visual: "白球滑入边袋，你也未经询问翻开了她亮起的手机。",
            line: "关系有了名字，不代表所有空间自动共享；她的神情明显收紧。",
            impact: "信任受到损耗，亲密进程回退。",
            sound: "落袋声与手机扣桌轻响",
            tone: "暖色迅速降为冷灰"
          },
          {
            id: "stage-05-scratch-no-word-absence",
            durationMs: 1740,
            camera: "分屏·白球底袋与未读消息",
            title: "失联让等待变得很长",
            visual: "白球被撞入底袋，几条询问也整夜停在未读。",
            line: "没有说明的消失把担心留给她，旅行后的安心第一次松动。",
            impact: "安全感明显下降，关系进入短暂冷却。",
            sound: "低沉落袋后，只留时钟与城市远响",
            tone: "深夜蓝与孤立屏幕白"
          },
          {
            id: "stage-05-scratch-comparison",
            durationMs: 1960,
            camera: "双人中景·角袋后的沉默",
            title: "比较盖过了她真实的样子",
            visual: "白球绕角袋消失，一句与别人相比也让桌边安静下来。",
            line: "原本轻松的亲密被衡量取代，她收回了刚准备分享的脆弱。",
            impact: "被理解感下降，磨合压力提前出现。",
            sound: "袋网闷响，旅行旋律突然断句",
            tone: "褪色暖金与深灰绿"
          }
        ],
        setup: [
          {
            id: "stage-05-setup-spare-charger",
            durationMs: 1360,
            camera: "近景·安全球与备用充电线",
            title: "她的习惯开始留在你这里",
            visual: "没有球入袋，一根为她准备的充电线被放进常用抽屉。",
            line: "亲密没有推进，共同生活却悄悄多了一处具体位置。",
            impact: "阶段进度不变，日常联结获得铺垫。",
            sound: "抽屉轻合与柔和钢琴和弦",
            tone: "家居暖白、木色与墨绿"
          },
          {
            id: "stage-05-setup-grocery-list",
            durationMs: 1600,
            camera: "俯拍·停球与双人清单",
            title: "购物清单出现了两种笔迹",
            visual: "目标球停在安全位，她在你的清单下补上自己常喝的牛奶。",
            line: "这一杆没有推进，关系却从约会向普通生活多走了半步。",
            impact: "进度保持，共同日常得到明确伏笔。",
            sound: "铅笔轻划与室内环境声",
            tone: "纸白、柔绿与浅暖黄"
          },
          {
            id: "stage-05-setup-printed-photo",
            durationMs: 1840,
            camera: "特写·照片靠在桌边",
            title: "旅行没有只留在相册里",
            visual: "没有进球，她把合影洗出来，放在每天都能看见的位置。",
            line: "亲密进度暂未增加，共同经历却开始进入稳定日常。",
            impact: "阶段未推进，归属感得到温和铺垫。",
            sound: "相纸轻落与列车主题的短促回声",
            tone: "照片暖色与自然室内灰绿"
          }
        ]
      }
    },
    {
      stage: 6,
      stageId: "learning-together",
      events: {
        miss: [
          {
            id: "stage-06-miss-circling-talk",
            durationMs: 1420,
            camera: "俯拍·绕台滚动",
            title: "谈话又绕回了原点",
            visual: "目标球沿库边走了一圈停下，两个人也重复着各自的理由。",
            line: "分歧被说了很多次，真正的不安仍没有出现。",
            impact: "磨合未推进，问题继续留在桌面中央。",
            sound: "连续轻碰库与低音钢琴脉冲",
            tone: "冷灰、深绿与少量桌灯暖白"
          },
          {
            id: "stage-06-miss-apology-incomplete",
            durationMs: 1570,
            camera: "近景·停在袋前与半句道歉",
            title: "对不起后面没有说完",
            visual: "球停在袋口，一句道歉也停在但是之前。",
            line: "歉意被解释冲淡，受伤的部分没有真正得到回应。",
            impact: "关系修复未推进，距离维持不变。",
            sound: "滚动声渐止，钟表声浮到前景",
            tone: "室内冷白与克制暗金"
          },
          {
            id: "stage-06-miss-plans-still-apart",
            durationMs: 1730,
            camera: "对切·两份日程与偏袋球",
            title: "计划仍落在两边",
            visual: "这一杆偏出，两张日程表上最重要的日期依然没有重合。",
            line: "你们都说了现实难处，却还没找到可以共同承担的部分。",
            impact: "磨合进度停滞，未来讨论暂时推迟。",
            sound: "擦袋声与纸页翻动",
            tone: "纸白、墨蓝与冷绿阴影"
          },
          {
            id: "stage-06-miss-tea-cold-again",
            durationMs: 1900,
            camera: "固定中景·再次凉掉的茶",
            title: "沉默又长过了热气",
            visual: "目标球慢慢停下，两杯重新泡的茶也再次失去温度。",
            line: "你们都没有离开，只是今晚还没能走到理解。",
            impact: "关系未推进，沟通窗口仍保持打开。",
            sound: "球速归零与安静室内底噪",
            tone: "蓝灰为主，桌灯留一圈暖色"
          }
        ],
        scratch: [
          {
            id: "stage-06-scratch-sharp-words",
            durationMs: 1500,
            camera: "俯拍·白球重落底袋",
            title: "一句重话先越过了边界",
            visual: "白球被强力撞入底袋，争执里那句总是也让空气骤冷。",
            line: "眼前的问题被旧伤取代，两个人同时停止解释。",
            impact: "沟通信任明显下降，修复进度回退。",
            sound: "强碰撞与低沉落袋声",
            tone: "冷蓝、深灰与熄弱暖光"
          },
          {
            id: "stage-06-scratch-silent-days",
            durationMs: 1760,
            camera: "分屏·角袋与连续空白日期",
            title: "沉默从一晚长成几天",
            visual: "白球绕角袋消失，对话框也连续几天没有新消息。",
            line: "分歧失去讨论的出口，联系在各自等待里变得稀薄。",
            impact: "关系出现明显裂缝，失去联系风险上升。",
            sound: "袋网闷响后，消息底噪完全抽离",
            tone: "深夜蓝与稀薄屏幕灰"
          },
          {
            id: "stage-06-scratch-old-score",
            durationMs: 1980,
            camera: "双人远景·白球落袋后起身",
            title: "旧账遮住了正在发生的事",
            visual: "白球滑入边袋，早已过去的争执也被重新摊满桌面。",
            line: "这一次分歧被拉成所有问题的总和，她起身走向窗边。",
            impact: "理解感大幅下降，和好被迫延后。",
            sound: "落袋声、椅脚声与压低弦乐",
            tone: "冷白窗光切开暗暖室内"
          }
        ],
        setup: [
          {
            id: "stage-06-setup-notes-before-talk",
            durationMs: 1380,
            camera: "俯拍·安全球与手写要点",
            title: "真正想说的话先被写下来",
            visual: "没有球入袋，你在纸上划掉指责，只留下感受与事实。",
            line: "磨合尚未推进，下一次谈话却多了一条更清楚的入口。",
            impact: "阶段进度不变，诚实沟通获得铺垫。",
            sound: "铅笔划过纸面与缓慢钢琴",
            tone: "纸白、石墨灰与柔暖灯色"
          },
          {
            id: "stage-06-setup-door-left-open",
            durationMs: 1620,
            camera: "中景·停球与没有关上的门",
            title: "离开没有变成告别",
            visual: "目标球停在库边，她走到窗前，却把身后的门留着。",
            line: "关系没有修复，双方仍为谈完这件事保留位置。",
            impact: "未推进阶段，沟通窗口继续存在。",
            sound: "球体慢停与远处钟表声",
            tone: "冷灰空间里保留一道暖门光"
          },
          {
            id: "stage-06-setup-shared-date",
            durationMs: 1860,
            camera: "特写·两种颜色圈住同一天",
            title: "分歧之外先留出一晚",
            visual: "这一杆只做安全球，两支笔却在日历上圈住同一个空白日期。",
            line: "磨合暂未推进，你们已经共同为下一次长谈留出时间。",
            impact: "进度保持，关系修复获得明确前奏。",
            sound: "笔尖轻点与低音提琴回暖",
            tone: "象牙白、墨蓝与稳定浅金"
          }
        ]
      }
    },
    {
      stage: 7,
      stageId: "shared-future",
      events: {
        miss: [
          {
            id: "stage-07-miss-budget-gap",
            durationMs: 1440,
            camera: "俯拍·偏袋球与未平账目",
            title: "未来先卡在一列数字",
            visual: "目标球偏出，计算器上的差额也仍然没有归零。",
            line: "你们谈到了共同生活，却还没找到都能承担的方式。",
            impact: "未来阶段未推进，计划保持讨论状态。",
            sound: "擦袋声与计算器按键",
            tone: "纸白、墨绿与清醒灰蓝"
          },
          {
            id: "stage-07-miss-city-choice",
            durationMs: 1590,
            camera: "广角·地图两端",
            title: "两座城市还没有答案",
            visual: "这一杆停在长库，两种颜色的笔也各自圈住不同方向。",
            line: "未来被认真摊开，迁往哪里仍需要更多时间。",
            impact: "关系未推进，共同地点尚未确定。",
            sound: "球体慢停与地图纸张摩擦",
            tone: "地图浅色、墨蓝与柔暖桌灯"
          },
          {
            id: "stage-07-miss-proposal-pauses",
            durationMs: 1750,
            camera: "近景·袋口与口袋里的戒盒",
            title: "很长的问题停在今晚",
            visual: "目标球停在袋前，你碰到口袋里的戒盒，最终只握了握她的手。",
            line: "承诺没有说出口，但共同未来的认真并未消失。",
            impact: "求婚未推进，时机继续被保留。",
            sound: "球速渐止与极轻金属碰响",
            tone: "暖白、墨绿与低调香槟金"
          },
          {
            id: "stage-07-miss-ring-stays-closed",
            durationMs: 1920,
            camera: "缓拉·桌边未开的戒盒",
            title: "戒盒仍安静合着",
            visual: "这一杆没有入袋，晨光已经抵达桌边，问题却没有开始。",
            line: "你们完成了许多现实讨论，最后一步仍在等待更确定的一刻。",
            impact: "阶段保持未完成，长期承诺暂缓。",
            sound: "清晨风声与未落地的钢琴和弦",
            tone: "晨灰、浅金与沉静深绿"
          }
        ],
        scratch: [
          {
            id: "stage-07-scratch-decided-alone",
            durationMs: 1520,
            camera: "俯拍·白球入袋与单人签字",
            title: "共同未来被一个人先决定",
            visual: "白球直落中袋，一份没有商量过的计划也被推到她面前。",
            line: "答案看似完整，却没有留下她参与选择的位置。",
            impact: "共同感受损，未来计划明显回退。",
            sound: "落袋低响与笔尖停顿",
            tone: "清冷纸白压住暖金"
          },
          {
            id: "stage-07-scratch-crowded-proposal",
            durationMs: 1780,
            camera: "远景·白球角袋与围拢人群",
            title: "最重要的问题失去了安静",
            visual: "白球绕角袋坠下，突然围拢的人群也把她推到必须回应的位置。",
            line: "承诺被注视变成压力，真实答案只能暂时收回。",
            impact: "安全感下降，求婚结果延后。",
            sound: "袋网闷响，人群声被逐渐压低",
            tone: "外层亮金退为中心冷白"
          },
          {
            id: "stage-07-scratch-assumed-answer",
            durationMs: 2000,
            camera: "双人中景·白球落袋与合起戒盒",
            title: "承诺先替她写好了答案",
            visual: "白球被连撞入底袋，你的话里也只剩默认她会同意的以后。",
            line: "曾经谈清的平等在这一刻变轻，她把戒盒缓慢推回桌面中央。",
            impact: "长期承诺受挫，关系需要重新确认选择权。",
            sound: "连续碰撞、落袋与盒盖轻合",
            tone: "暖白转冷，香槟金降为哑光灰"
          }
        ],
        setup: [
          {
            id: "stage-07-setup-map-overlap",
            durationMs: 1400,
            camera: "俯拍·安全球与重叠地图圈",
            title: "两条路线第一次重合",
            visual: "没有球入袋，两种颜色的笔却在地图上圈住同一片街区。",
            line: "未来暂未推进，一个关于家的共同坐标已经出现。",
            impact: "阶段进度不变，共同生活得到具体铺垫。",
            sound: "笔尖轻划与完整主题的两枚音符",
            tone: "地图白、墨蓝与柔和暖金"
          },
          {
            id: "stage-07-setup-shared-envelope",
            durationMs: 1640,
            camera: "近景·停球与共同储蓄信封",
            title: "以后先有了第一笔准备",
            visual: "目标球停在库边，两个人把各自的一部分计划放进同一个信封。",
            line: "关系没有推进，未来却从抽象愿望变成了一件可触摸的小事。",
            impact: "进度保持，长期承诺获得现实基础。",
            sound: "纸张轻合与温暖低弦",
            tone: "象牙白、木色与克制金色"
          },
          {
            id: "stage-07-setup-paired-cues",
            durationMs: 1880,
            camera: "缓推·并排球杆与晨光",
            title: "起点已经为两个人留好位置",
            visual: "这一杆只做铺垫，两支球杆在旧球房墙边被并排放稳。",
            line: "求婚尚未发生，共同走下去的意愿却已写进每个普通安排。",
            impact: "阶段未推进，最终承诺获得安静前奏。",
            sound: "球杆靠墙轻响，清晨风声进入",
            tone: "墨绿、暖白与清晨淡金"
          }
        ]
      }
    }
  ]);

  const SPECIAL_EVENTS = deepFreeze({
    confessionSuccess: {
      id: "confession-success",
      title: "告白成功",
      kind: "milestone",
      ballNumbers: [8],
      variants: [
        {
          id: "event-confession-success-answer",
          durationMs: 1240,
          camera: "近景·她轻轻点头",
          visual: "她看了你一会儿，眼里慢慢有了笑意。",
          line: "她说，我也喜欢你。"
        },
        {
          id: "event-confession-success-hands",
          durationMs: 1460,
          camera: "特写·主动靠近的手",
          visual: "她没有先回答，只把手放进你的掌心。",
          line: "答案很轻，却被你稳稳接住。"
        },
        {
          id: "event-confession-success-laugh",
          durationMs: 1120,
          camera: "双人中景·风里失笑",
          visual: "你们同时松了口气，又为这份紧张笑起来。",
          line: "原来彼此都等了这一句。"
        }
      ]
    },
    confessionTooEarly: {
      id: "confession-too-early",
      title: "告白过早",
      kind: "detour",
      ballNumbers: [8],
      variants: [
        {
          id: "event-confession-early-space",
          durationMs: 1380,
          camera: "双人远景·留出半步",
          visual: "她安静听完，往栏杆边轻靠了一点。",
          line: "她没有拒绝，只说还想再认识你一点。"
        },
        {
          id: "event-confession-early-cue",
          durationMs: 1160,
          camera: "近景·递回球杆",
          visual: "她把球杆递回，目光温和却没有靠近。",
          line: "喜欢被听见了，答案还需要时间。"
        },
        {
          id: "event-confession-early-night",
          durationMs: 1540,
          camera: "侧景·并肩看城灯",
          visual: "你们仍站在一起，只是不再急着说下一句。",
          line: "今晚没有结果，关系也没有因此结束。"
        }
      ]
    },
    feelingsExposed: {
      id: "feelings-exposed",
      title: "心意意外暴露",
      kind: "reveal",
      ballNumbers: [8],
      variants: [
        {
          id: "event-feelings-exposed-note",
          durationMs: 980,
          camera: "特写·滑出的便签",
          visual: "写着她名字的便签从书页间落到桌面。",
          line: "没准备好的心意，先一步被她看见。"
        },
        {
          id: "event-feelings-exposed-screen",
          durationMs: 1080,
          camera: "过肩·未熄的屏幕",
          visual: "没发出的那句话停在输入框，她正好回头。",
          line: "你来不及遮掩，只好诚实地抬眼。"
        },
        {
          id: "event-feelings-exposed-friend",
          durationMs: 1260,
          camera: "中景·话音突然停住",
          visual: "朋友说漏半句，桌边的笑声短暂停下。",
          line: "秘密散在空气里，等你亲自把它说完。"
        }
      ]
    },
    proposalSuccess: {
      id: "proposal-success",
      title: "求婚成功",
      kind: "milestone",
      ballNumbers: [15],
      variants: [
        {
          id: "event-proposal-success-yes",
          durationMs: 1580,
          camera: "近景·含泪的笑",
          visual: "她点头以后先笑了，眼泪才慢慢落下来。",
          line: "她说，好，我们继续一起生活。"
        },
        {
          id: "event-proposal-success-ring",
          durationMs: 1720,
          camera: "特写·相握的手",
          visual: "戒指戴好，你们的手仍旧握在一起。",
          line: "没有掌声，只有两个人都听清的答案。"
        },
        {
          id: "event-proposal-success-dawn",
          durationMs: 1840,
          camera: "缓拉·窗外天亮",
          visual: "球房灯光渐暗，清晨从玻璃外铺进来。",
          line: "这一夜结束，往后的日子刚刚开始。"
        }
      ]
    },
    commitmentTooHeavy: {
      id: "commitment-too-heavy",
      title: "承诺过重",
      kind: "detour",
      ballNumbers: [15],
      variants: [
        {
          id: "event-commitment-heavy-closed-box",
          durationMs: 1460,
          camera: "特写·合起的戒盒",
          visual: "你把戒盒慢慢合上，桌灯仍照着彼此。",
          line: "她说爱你，也说此刻还接不住一生。"
        },
        {
          id: "event-commitment-heavy-honest",
          durationMs: 1620,
          camera: "双人中景·隔桌而坐",
          visual: "她坐下来，把犹豫一件件说清楚。",
          line: "问题没有被浪漫盖过，答案因此更诚实。"
        },
        {
          id: "event-commitment-heavy-window",
          durationMs: 1380,
          camera: "侧景·窗边停顿",
          visual: "她看向将亮的窗外，你把催促留在沉默里。",
          line: "承诺太重时，停下来也是一种认真。"
        }
      ]
    },
    losingContact: {
      id: "losing-contact",
      title: "渐渐失去联系",
      kind: "distance",
      ballNumbers: [11, 12, 13, 14],
      variants: [
        {
          id: "event-losing-contact-dates",
          durationMs: 1180,
          camera: "俯拍·稀疏的消息日期",
          visual: "对话框里的间隔从几小时变成几周。",
          line: "没有正式告别，联系只是慢慢少了。"
        },
        {
          id: "event-losing-contact-clocks",
          durationMs: 1320,
          camera: "分屏·两座城市时钟",
          visual: "两边的灯依次熄灭，始终没有同时亮着。",
          line: "忙碌各有缘由，沉默也渐渐有了惯性。"
        },
        {
          id: "event-losing-contact-photo",
          durationMs: 1440,
          camera: "缓推·抽屉里的合影",
          visual: "旧照片被票据盖住，只露出相靠的肩。",
          line: "后来想起彼此，仍温柔，却不再打扰。"
        }
      ]
    }
  });

  const ENDINGS = deepFreeze({
    S: {
      grade: "S",
      id: "city-alight",
      title: "灯火长明",
      scene: "十五道真实球路同时回亮，六处夜景连成一颗不规则的心。",
      line: "两个人影沿着你打出的路线，从第一场雨走到了同一盏归途灯下。",
      epilogue: "街角、雨声与末班车都已安静，清晨替今晚收好最后一盏灯。",
      musicLayers: ["完整钢琴主题", "温暖弦乐和声", "清晨环境声"]
    },
    A: {
      grade: "A",
      id: "homeward-together",
      title: "并肩归途",
      scene: "桌面路线在几次停顿后重新接起，最后汇入回家街道。",
      line: "这晚并不完美，却因此有了绕路、等待和重新同行的温度。",
      epilogue: "球桌记住的不是失误，而是每次停下以后，你们仍愿意继续。",
      musicLayers: ["钢琴主题变奏", "轻刷鼓", "渐近的街声"]
    },
    B: {
      grade: "B",
      id: "unhurried-night",
      title: "慢慢走完",
      scene: "断续亮起的路线最终也覆盖了整张桌布，两个人影在路口等了彼此几次。",
      line: "有些球走得远，有些路绕得长，今晚仍然完整抵达了最后一站。",
      epilogue: "技术决定这幅地图的笔触，不决定这段幻想是否值得发生。",
      musicLayers: ["钢琴主题慢板", "柔和雨声", "渐近的街灯环境声"]
    }
  });

  const BALL_BY_NUMBER = Object.freeze(Object.fromEntries(
    BALLS.map((ball) => [ball.number, ball])
  ));
  const STAGE_BY_ID = Object.freeze(Object.fromEntries(
    STAGES.map((stage) => [stage.id, stage])
  ));
  const STAGE_TRANSITION_BY_ID = Object.freeze(Object.fromEntries(
    STAGE_TRANSITIONS.map((transition) => [transition.stageId, transition])
  ));
  const STAGE_EVENTS_BY_ID = Object.freeze(Object.fromEntries(
    STAGE_EVENTS.map((catalog) => [catalog.stageId, catalog])
  ));
  const STAGE_EVENT_LABELS = Object.freeze({
    [STAGE_EVENT_TYPES.MISS]: "空杆",
    [STAGE_EVENT_TYPES.SCRATCH]: "白球落袋",
    [STAGE_EVENT_TYPES.SETUP]: "铺垫 · 未推进"
  });

  function assertBallNumber(ballNumber) {
    if (!Number.isSafeInteger(ballNumber)) throw new TypeError("ballNumber must be an integer");
    if (ballNumber < 1 || ballNumber > 15) throw new RangeError("ballNumber must be between 1 and 15");
  }

  function getBall(ballNumber) {
    assertBallNumber(ballNumber);
    return BALL_BY_NUMBER[ballNumber];
  }

  function getStage(stage) {
    if (Number.isSafeInteger(stage)) {
      if (stage < 1 || stage > STAGES.length) throw new RangeError("stage must be between 1 and 7");
      return STAGES[stage - 1];
    }
    if (typeof stage !== "string") throw new TypeError("stage must be an order or id");
    if (!Object.hasOwn(STAGE_BY_ID, stage)) throw new RangeError(`Unknown stage: ${stage}`);
    return STAGE_BY_ID[stage];
  }

  function getStageTransition(stage) {
    const narrative = getStage(stage);
    return STAGE_TRANSITION_BY_ID[narrative.id];
  }

  function getStageEvents(stage) {
    const narrative = getStage(stage);
    return STAGE_EVENTS_BY_ID[narrative.id];
  }

  function getEnding(grade) {
    if (typeof grade !== "string") throw new TypeError("grade must be a string");
    const normalized = grade.toUpperCase();
    if (!Object.hasOwn(ENDINGS, normalized)) throw new RangeError(`Unknown ending grade: ${grade}`);
    return ENDINGS[normalized];
  }

  function hashString(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function normalizeSeed(seed) {
    if (typeof seed === "number") {
      if (!Number.isFinite(seed)) throw new TypeError("seed must be a finite number or string");
      return Math.trunc(seed) >>> 0;
    }
    if (typeof seed === "string") return hashString(seed);
    throw new TypeError("seed must be a finite number or string");
  }

  function createSeededRng(seed) {
    let state = normalizeSeed(seed);
    const rng = function seededRng() {
      state = (state + 0x6D2B79F5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
    return Object.freeze(rng);
  }

  function selectionSource(options) {
    const hasSeed = options.seed !== undefined;
    const hasRng = options.rng !== undefined;
    if (hasSeed && hasRng) throw new TypeError("seed and rng are mutually exclusive");
    if (hasRng) {
      if (typeof options.rng !== "function") throw new TypeError("rng must be a function");
      return { rng: options.rng, seed: null };
    }
    const seed = hasSeed ? options.seed : 0;
    normalizeSeed(seed);
    return { rng: null, seed };
  }

  function rngIndex(rng, length) {
    const value = rng();
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value >= 1) {
      throw new RangeError("rng must return a finite number from 0 (inclusive) to 1 (exclusive)");
    }
    return Math.floor(value * length);
  }

  function seededIndex(sourceId, length, selection, offset) {
    if (selection.rng) return rngIndex(selection.rng, length);
    const sourceOffset = hashString(sourceId) % 997;
    return (normalizeSeed(selection.seed) + sourceOffset + offset) % length;
  }

  function specialEventFor(ballNumber, intent, timing) {
    if (ballNumber === 8) {
      if (intent === INTENTS.ACCIDENTAL) return SPECIAL_EVENTS.feelingsExposed;
      if (timing === TIMINGS.EARLY) return SPECIAL_EVENTS.confessionTooEarly;
      return SPECIAL_EVENTS.confessionSuccess;
    }
    if (ballNumber === 15) {
      if (intent === INTENTS.ACTIVE && timing !== TIMINGS.EARLY) {
        return SPECIAL_EVENTS.proposalSuccess;
      }
      return SPECIAL_EVENTS.commitmentTooHeavy;
    }
    if (
      ballNumber >= 11
      && ballNumber <= 14
      && intent === INTENTS.ACCIDENTAL
      && timing === TIMINGS.LATE
    ) {
      return SPECIAL_EVENTS.losingContact;
    }
    return null;
  }

  function variantIndex(source, ballNumber, intent, timing, selection) {
    const intentOffset = intent === INTENTS.ACTIVE ? 0 : 17;
    const timingOffset = {
      [TIMINGS.EARLY]: 0,
      [TIMINGS.RIGHT]: 31,
      [TIMINGS.LATE]: 62
    }[timing];
    return seededIndex(
      source.id,
      source.variants.length,
      selection,
      ballNumber * 7 + intentOffset + timingOffset
    );
  }

  function selectPerformance(options) {
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      throw new TypeError("options must be an object");
    }
    const ballNumber = options.ballNumber;
    const intent = options.intent === undefined ? INTENTS.ACTIVE : options.intent;
    const timing = options.timing === undefined ? TIMINGS.RIGHT : options.timing;
    const selection = selectionSource(options);

    assertBallNumber(ballNumber);
    if (intent !== INTENTS.ACTIVE && intent !== INTENTS.ACCIDENTAL) {
      throw new RangeError(`Unknown intent: ${intent}`);
    }
    if (timing !== TIMINGS.EARLY && timing !== TIMINGS.RIGHT && timing !== TIMINGS.LATE) {
      throw new RangeError(`Unknown timing: ${timing}`);
    }

    const ball = getBall(ballNumber);
    const event = specialEventFor(ballNumber, intent, timing);
    const source = event || ball;
    const index = variantIndex(source, ballNumber, intent, timing, selection);
    const variant = source.variants[index];

    return deepFreeze({
      id: variant.id,
      ballNumber: ball.number,
      ballId: ball.id,
      ballName: ball.name,
      stage: ball.stage,
      stageId: ball.stageId,
      intent,
      timing,
      eventId: event ? event.id : null,
      eventTitle: event ? event.title : null,
      variantIndex: index,
      durationMs: variant.durationMs,
      camera: variant.camera,
      visual: variant.visual,
      line: variant.line
    });
  }

  function selectStageTransition(options) {
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      throw new TypeError("options must be an object");
    }
    const stage = getStage(options.stage);
    const selection = selectionSource(options);
    const source = getStageTransition(stage.id);
    const index = seededIndex(
      `transition:${stage.id}`,
      source.variants.length,
      selection,
      stage.order * 11
    );
    const variant = source.variants[index];

    return deepFreeze({
      kind: "stage-transition",
      stage: stage.order,
      stageId: stage.id,
      stageName: stage.name,
      nextStage: stage.order < STAGES.length ? stage.order + 1 : null,
      nextStageId: source.nextStageId,
      variantIndex: index,
      ...variant
    });
  }

  function selectStageEvent(options) {
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      throw new TypeError("options must be an object");
    }
    const stage = getStage(options.stage);
    const eventType = options.eventType === undefined ? options.type : options.eventType;
    if (!Object.values(STAGE_EVENT_TYPES).includes(eventType)) {
      throw new RangeError(`Unknown stage event type: ${eventType}`);
    }
    const selection = selectionSource(options);
    const source = getStageEvents(stage.id);
    const variants = source.events[eventType];
    const index = seededIndex(
      `stage-event:${stage.id}:${eventType}`,
      variants.length,
      selection,
      stage.order * 13
    );
    const variant = variants[index];

    return deepFreeze({
      kind: "stage-event",
      eventType,
      stage: stage.order,
      stageId: stage.id,
      stageName: stage.name,
      kicker: `${stage.name} · ${STAGE_EVENT_LABELS[eventType]}`,
      variantIndex: index,
      ...variant
    });
  }

  function finiteNumber(value, fallback = 0) {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
  }

  function analyzeShot(options = {}) {
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      throw new TypeError("shot analysis options must be an object");
    }
    const pottedDetails = Array.isArray(options.pottedDetails) ? options.pottedDetails : [];
    const pottedNumbers = Array.isArray(options.pottedNumbers) ? options.pottedNumbers : [];
    const pottedCount = Math.max(pottedDetails.length, pottedNumbers.length);
    const primary = pottedDetails[0] || {};
    const bankedCount = Math.max(
      pottedDetails.filter((detail) => finiteNumber(detail.railHits) > 0).length,
      Array.isArray(options.bankedNumbers) ? options.bankedNumbers.length : 0
    );
    const maximumJawHits = pottedDetails.reduce((maximum, detail) => Math.max(maximum, finiteNumber(detail.jawHits)), 0);
    const maximumMouthEntries = pottedDetails.reduce((maximum, detail) => Math.max(maximum, finiteNumber(detail.mouthEntries, 1)), 0);
    const maximumTravel = pottedDetails.reduce((maximum, detail) => Math.max(maximum, finiteNumber(detail.travel)), 0);
    const entrySpeed = finiteNumber(primary.entrySpeed, Infinity);
    const launchPower = finiteNumber(options.launchPower, 0.52);
    const objectContacts = Math.max(0, Math.trunc(finiteNumber(options.objectContacts)));
    const cueScratch = Boolean(options.cueScratch);
    const nearMiss = Boolean(options.nearMiss);
    let id;

    if (pottedCount === 0) {
      id = cueScratch
        ? SHOT_ARCHETYPES.SCRATCH
        : nearMiss ? SHOT_ARCHETYPES.NEAR : SHOT_ARCHETYPES.MISS;
    } else if (pottedCount >= 2) {
      id = SHOT_ARCHETYPES.MULTI;
    } else if (maximumJawHits >= 2 || maximumMouthEntries >= 2) {
      id = SHOT_ARCHETYPES.RATTLE;
    } else if (objectContacts >= 2) {
      id = SHOT_ARCHETYPES.COMBO;
    } else if (bankedCount > 0) {
      id = SHOT_ARCHETYPES.BANK;
    } else if (maximumTravel >= 390) {
      id = SHOT_ARCHETYPES.LONG;
    } else if (launchPower <= 0.3 || entrySpeed <= 3.2) {
      id = SHOT_ARCHETYPES.GENTLE;
    } else if (launchPower >= 0.78) {
      id = SHOT_ARCHETYPES.POWER;
    } else {
      id = SHOT_ARCHETYPES.DIRECT;
    }

    const meta = SHOT_ARCHETYPE_META[id];
    return deepFreeze({
      id,
      ...meta,
      pottedCount,
      bankedCount,
      objectContacts,
      maximumJawHits,
      maximumMouthEntries,
      maximumTravel,
      launchPower,
      entrySpeed: Number.isFinite(entrySpeed) ? entrySpeed : null,
      cueScratch,
      nearMiss,
      modifiers: {
        soft: launchPower <= 0.3,
        forceful: launchPower >= 0.78,
        banked: bankedCount > 0,
        linked: objectContacts >= 2,
        hesitant: maximumJawHits >= 2 || maximumMouthEntries >= 2,
        multiple: pottedCount >= 2
      }
    });
  }

  function composeTableMoment(options = {}) {
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      throw new TypeError("table moment options must be an object");
    }

    assertBallNumber(options.ballNumber);
    const ball = getBall(options.ballNumber);
    const stage = options.stage === undefined ? getStage(ball.stage) : getStage(options.stage);
    const archetype = options.archetype === undefined ? SHOT_ARCHETYPES.DIRECT : options.archetype;
    const meta = SHOT_ARCHETYPE_META[archetype];
    if (!meta) throw new RangeError(`Unknown shot archetype: ${archetype}`);

    const selection = selectionSource({ seed: options.seed === undefined ? 0 : options.seed });
    const motif = BALL_DATE_MOTIFS[ball.number - 1];
    const variantIndex = seededIndex(
      `table-moment:${ball.id}:${stage.id}:${archetype}`,
      motif.lines.length,
      selection,
      ball.number * 7 + stage.order * 17
    );
    const pocketId = options.pocketId === undefined
      ? POCKET_DATE_IDS[(ball.number - 1 + variantIndex * 2) % POCKET_DATE_IDS.length]
      : options.pocketId;
    if (typeof pocketId !== "string") throw new TypeError("pocketId must be a string");
    if (!Object.hasOwn(POCKET_DATE_SCENE_BY_ID, pocketId)) {
      throw new RangeError(`Unknown pocketId: ${pocketId}`);
    }

    const scene = POCKET_DATE_SCENE_BY_ID[pocketId];
    const interaction = TABLE_STAGE_INTERACTIONS[stage.order - 1];
    const motion = `${ball.name}球${TABLE_MOMENT_MOTIONS[archetype]}；${scene.detail}。`;

    return deepFreeze({
      id: `table-moment-${ball.id}-${scene.id}-${archetype}-${variantIndex + 1}`,
      ballNumber: ball.number,
      ballId: ball.id,
      stage: stage.order,
      stageId: stage.id,
      stageName: stage.name,
      pocketId,
      sceneId: scene.id,
      scene: scene.name,
      motifId: motif.id,
      motif: motif.name,
      archetype,
      title: `${scene.name} · ${motif.name}`,
      line: `${motif.lines[variantIndex]} ${interaction}`,
      motion,
      interaction,
      camera: TABLE_VARIANT_CAMERAS[variantIndex],
      visualMode: meta.visualMode,
      variantIndex,
      durationMs: TABLE_MOMENT_DURATIONS[archetype]
    });
  }

  function selectShotStory(options = {}) {
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      throw new TypeError("shot story options must be an object");
    }
    const stage = getStage(options.stage);
    const archetype = typeof options.archetype === "string"
      ? options.archetype
      : options.analysis?.id;
    const meta = SHOT_ARCHETYPE_META[archetype];
    if (!meta) throw new RangeError(`Unknown shot archetype: ${archetype}`);
    const storyNumber = Number.isInteger(options.storyNumber)
      ? options.storyNumber
      : stage.ballNumbers[0];
    assertBallNumber(storyNumber);
    const performance = options.performance && typeof options.performance === "object"
      ? options.performance
      : null;
    const pocketId = options.pocketId === undefined ? performance?.pocketId : options.pocketId;
    const seed = options.seed === undefined
      ? performance?.id || `${stage.id}:${storyNumber}:${archetype}`
      : options.seed;
    const moment = composeTableMoment({
      ballNumber: storyNumber,
      pocketId,
      archetype,
      stage: stage.id,
      seed
    });

    return deepFreeze({
      ...moment,
      id: `shot-story-${stage.id}-${archetype}-${storyNumber}-${performance?.id || "default"}`,
      technique: meta.label,
      gesture: meta.gesture,
      storyNumber,
      emotionLine: moment.interaction
    });
  }

  return Object.freeze({
    INTENTS,
    TIMINGS,
    STAGE_EVENT_TYPES,
    SHOT_ARCHETYPES,
    SHOT_ARCHETYPE_META,
    POCKET_DATE_SCENES,
    BALL_DATE_MOTIFS,
    BALLS,
    STAGES,
    STAGE_TRANSITIONS,
    STAGE_EVENTS,
    SPECIAL_EVENTS,
    ENDINGS,
    getBall,
    getStage,
    getStageTransition,
    getStageEvents,
    getEnding,
    createSeededRng,
    selectPerformance,
    selectStageTransition,
    selectStageEvent,
    analyzeShot,
    composeTableMoment,
    selectShotStory
  });
});
