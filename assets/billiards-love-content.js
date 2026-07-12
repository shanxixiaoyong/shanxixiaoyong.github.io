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
    direct: { label: "直线命中 · 光轨锁定", gesture: "notice", visualMode: "straight" },
    gentle: { label: "轻推入袋 · 流光收束", gesture: "offer", visualMode: "soft" },
    power: { label: "强力命中 · 能量爆闪", gesture: "surprise", visualMode: "pulse" },
    bank: { label: "借库入袋 · 折射转向", gesture: "reach", visualMode: "rail" },
    long: { label: "远台命中 · 光束贯穿", gesture: "answer", visualMode: "distance" },
    combo: { label: "组合入袋 · 连锁点燃", gesture: "answer", visualMode: "linked" },
    rattle: { label: "袋口震荡 · 火花回弹", gesture: "hesitate", visualMode: "hesitate" },
    multi: { label: "一杆多球 · 色谱连爆", gesture: "delight", visualMode: "double" },
    near: { label: "擦袋而过 · 余辉悬停", gesture: "hesitate", visualMode: "near" },
    miss: { label: "线路落空 · 能量待机", gesture: "waiting", visualMode: "quiet" },
    scratch: { label: "白球落袋 · 电场重置", gesture: "withdraw", visualMode: "fracture" }
  });

  const POCKET_DATE_SCENES = deepFreeze([
    {
      id: "corner-store",
      pocketId: "top-left",
      name: "液态涟漪",
      tableZone: "左上角袋",
      light: "青蓝液态光",
      detail: "左上袋迸开液态同心波，青蓝水光沿库边扩散"
    },
    {
      id: "coffee-window",
      pocketId: "top-right",
      name: "彗星火花",
      tableZone: "右上角袋",
      light: "金橙彗尾光",
      detail: "右上袋拖出彗尾，金橙火花扫过桌角"
    },
    {
      id: "late-cinema",
      pocketId: "middle-left",
      name: "棱镜折射",
      tableZone: "左侧中袋",
      light: "全色色散光",
      detail: "左中袋折射棱光，彩色光束横切台呢"
    },
    {
      id: "river-walk",
      pocketId: "middle-right",
      name: "脉冲声呐",
      tableZone: "右侧中袋",
      light: "洋红脉冲光",
      detail: "右中袋发出声呐环，洋红脉冲逐圈扫描"
    },
    {
      id: "last-train",
      pocketId: "bottom-left",
      name: "闪电",
      tableZone: "左下角袋",
      light: "白蓝电弧光",
      detail: "左下袋劈出电弧，白蓝闪电沿库边跃迁"
    },
    {
      id: "walk-home",
      pocketId: "bottom-right",
      name: "极光缎带",
      tableZone: "右下角袋",
      light: "青绿玫红极光",
      detail: "右下袋扬起极光缎带，双色光带卷向桌面"
    }
  ]);

  const POCKET_DATE_SCENE_BY_ID = Object.freeze(Object.fromEntries(
    POCKET_DATE_SCENES.map((scene) => [scene.pocketId, scene])
  ));
  const POCKET_DATE_IDS = Object.freeze(POCKET_DATE_SCENES.map((scene) => scene.pocketId));

  const BALL_MOTIF_SPECS = deepFreeze([
    {
      ballNumber: 1,
      id: "raindrop",
      name: "黄金光子",
      stage: 1,
      meaning: "1号黄色实球压缩光子，入袋时释放金色闪爆。",
      colorCue: "黄金",
      tableMark: "细密光粒从黄色球面向后喷射"
    },
    {
      ballNumber: 2,
      id: "coffee",
      name: "蓝色电弧",
      stage: 1,
      meaning: "2号蓝色实球携带电弧，碰库后留下钴蓝轨迹。",
      colorCue: "钴蓝",
      tableMark: "蓝色电弧贴着球影跳动"
    },
    {
      ballNumber: 3,
      id: "movie-ticket",
      name: "赤红熔核",
      stage: 1,
      meaning: "3号红色实球封装熔核，滚动时拉出赤红热浪。",
      colorCue: "赤红",
      tableMark: "熔核光环在红色球面内旋转"
    },
    {
      ballNumber: 4,
      id: "camera",
      name: "紫晶等离子",
      stage: 2,
      meaning: "4号紫色实球聚合等离子，撞击瞬间迸出紫晶光。",
      colorCue: "紫晶",
      tableMark: "紫色等离子薄层包住球影"
    },
    {
      ballNumber: 5,
      id: "streetlamp",
      name: "橙色日焰",
      stage: 2,
      meaning: "5号橙色实球点燃日焰，强击会拉长灼亮尾迹。",
      colorCue: "炽橙",
      tableMark: "橙色焰冠沿球路向后翻卷"
    },
    {
      ballNumber: 6,
      id: "earphones",
      name: "翠绿激光",
      stage: 3,
      meaning: "6号绿色实球校准激光，直线球形成锐利绿束。",
      colorCue: "翠绿",
      tableMark: "绿色激光线锁住目标袋中心"
    },
    {
      ballNumber: 7,
      id: "cat",
      name: "深红震波",
      stage: 3,
      meaning: "7号深红实球蓄积震波，每次碰库扩散一圈红光。",
      colorCue: "深红",
      tableMark: "深红冲击环从接触点扩开"
    },
    {
      ballNumber: 8,
      id: "heart-eight",
      name: "黑曜奇点",
      stage: 4,
      meaning: "黑8化作高密度奇点，吸拢全桌色光后集中释放。",
      colorCue: "黑曜",
      tableMark: "黑色核心牵引六束彩色光线"
    },
    {
      ballNumber: 9,
      id: "sunset",
      name: "黄金流体",
      stage: 5,
      meaning: "9号黄纹球包裹黄金流体，旋转时形成液态光带。",
      colorCue: "黄白条纹",
      tableMark: "金色液膜沿条纹球面循环流动"
    },
    {
      ballNumber: 10,
      id: "gift",
      name: "蓝色离子",
      stage: 5,
      meaning: "10号蓝纹球释放离子束，连击时叠加冰蓝亮度。",
      colorCue: "蓝白条纹",
      tableMark: "冰蓝离子点环绕条纹球高速运行"
    },
    {
      ballNumber: 11,
      id: "message",
      name: "赤红火花",
      stage: 5,
      meaning: "11号红纹球储存火花，入袋会引爆短促红色闪光。",
      colorCue: "红白条纹",
      tableMark: "赤红火花从条纹边缘连续弹出"
    },
    {
      ballNumber: 12,
      id: "bus-card",
      name: "紫晶棱镜",
      stage: 6,
      meaning: "12号紫纹球构成棱镜，碰库角度决定色散方向。",
      colorCue: "紫白条纹",
      tableMark: "紫晶切面把桌灯拆成多束色光"
    },
    {
      ballNumber: 13,
      id: "star",
      name: "橙色脉冲",
      stage: 6,
      meaning: "13号橙纹球发射脉冲，速度越高光环越密。",
      colorCue: "橙白条纹",
      tableMark: "橙色脉冲环按球速连续展开"
    },
    {
      ballNumber: 14,
      id: "umbrella",
      name: "翠绿闪电",
      stage: 7,
      meaning: "14号绿纹球导通闪电，长台路线被绿色电光贯穿。",
      colorCue: "绿白条纹",
      tableMark: "翠绿闪电沿条纹与目标线跃迁"
    },
    {
      ballNumber: 15,
      id: "homeward",
      name: "深红极光",
      stage: 7,
      meaning: "15号深红纹球卷起极光，终局入袋触发全桌色爆。",
      colorCue: "深红白条纹",
      tableMark: "深红极光带绕球面高速收束"
    }
  ]);

  const POCKET_MOTIF_MOMENTS = deepFreeze(Object.fromEntries(
    POCKET_DATE_SCENES.map((scene) => [
      scene.pocketId,
      Object.fromEntries(BALL_MOTIF_SPECS.map((motif) => [
        motif.id,
        `${motif.name}触发${scene.name}；${scene.detail}。`
      ]))
    ])
  ));

  const STAGE_RELATION_BEATS = deepFreeze([
    [
      "三束主色上线，基础倍率启动。",
      "起始光轨稳定，首轮连击窗口开启。",
      "能量汇入球桌，下一波等待击发。"
    ],
    [
      "紫橙亮度抬升，碰撞反馈全面增强。",
      "双球完成充能，桌面进入高亮档位。",
      "等离子与日焰交叠，倍率继续上冲。"
    ],
    [
      "激光锁线，震波接管库边。",
      "频率完成同步，连击节奏开始加速。",
      "绿束穿过红环，能量槽逼近满格。"
    ],
    [
      "黑曜核心吸收全色，超载倒计时启动。",
      "黑8锁住中心，六袋效果同时待命。",
      "奇点压缩完成，爆发窗口已经打开。"
    ],
    [
      "条纹球群接力，色谱连击不断档。",
      "流体、离子与火花叠成三段爆闪。",
      "高饱和能量贯穿桌面，倍率快速累积。"
    ],
    [
      "棱镜校准脉冲，终局线路变得清晰。",
      "两束条纹能量交叉，临界读数持续上升。",
      "色散与频率合流，最后阶段即将解锁。"
    ],
    [
      "闪电接入极光，终局色域全面展开。",
      "最后两球升至峰值，全桌进入爆发模式。",
      "终极光轨锁定，清台信号已经点亮。"
    ]
  ]);

  const STAGES = deepFreeze([
    {
      id: "first-contact",
      order: 1,
      name: "色谱启动",
      ballNumbers: [1, 2, 3],
      environment: "同一张霓虹球桌加载黄金、钴蓝与赤红三条主光轨，六个袋口效果保持待机。",
      poses: {
        player: "主视角选手在球桌短边压低球杆，准星锁定1号球。",
        partner: "对侧选手沿桌边校准2号与3号球的连续线路。"
      },
      lighting: "黑色场域衬托高饱和三原色，台呢边缘出现细密像素闪光。",
      musicLayers: ["合成器启动音", "低频节拍", "清脆碰球声"],
      enterLine: "色谱核心上线，首轮三球等待点亮。",
      completeLine: "黄金、蓝弧与熔核全部激活，基础倍率锁定。"
    },
    {
      id: "growing-familiar",
      order: 2,
      name: "电压攀升",
      ballNumbers: [4, 5],
      environment: "同一张球桌升起紫色等离子层与橙色焰冠，袋口边缘开始高频闪烁。",
      poses: {
        player: "主视角选手沿球桌长边找准切角，准备释放4号球。",
        partner: "对侧选手用杆尖标出5号球的强击落点。"
      },
      lighting: "紫晶冷光与炽橙热光从桌面两侧对冲，球体轮廓保持清晰。",
      musicLayers: ["脉冲贝斯", "电弧噪点", "加速滚动声"],
      enterLine: "第二电压档接通，紫橙双球进入充能区。",
      completeLine: "等离子与日焰同时爆闪，能量条跃升一档。"
    },
    {
      id: "intentional-dates",
      order: 3,
      name: "频率锁定",
      ballNumbers: [6, 7],
      environment: "绿色激光和深红震波横穿同一张球桌，库边化作连续频率刻度。",
      poses: {
        player: "主视角选手贴近桌侧瞄准，绿色准线贯穿目标袋。",
        partner: "对侧选手控制击球节拍，让红色震波避开遮挡球。"
      },
      lighting: "锐利绿束切开暗场，深红环形波在台呢上持续扩散。",
      musicLayers: ["高速琶音", "声呐低鼓", "库边回弹声"],
      enterLine: "双频通道打开，激光与震波等待同步。",
      completeLine: "绿束锁线，红环归位，连击节奏达到稳定峰值。"
    },
    {
      id: "spoken-heart",
      order: 4,
      name: "黑曜超载",
      ballNumbers: [8],
      environment: "黑8停在球桌中心形成奇点，六个袋口的彩色能量被同时牵引。",
      poses: {
        player: "主视角选手在桌边收稳球杆，准星压向黑8中心。",
        partner: "对侧选手停在安全区，监控六袋同步读数。"
      },
      lighting: "黑曜核心吞入环境光，只保留高速旋转的彩色吸积环。",
      musicLayers: ["低频心跳鼓", "奇点嗡鸣", "短促静音断点"],
      enterLine: "全桌光谱正在压缩，黑8超载倒计时开始。",
      completeLine: "黑8落袋，六种袋口效果同时冲到最大亮度。"
    },
    {
      id: "confirmed-love",
      order: 5,
      name: "色谱连击",
      ballNumbers: [9, 10, 11],
      environment: "黄、蓝、红三枚条纹球在同一张球桌组成高速连击链，光带覆盖全部目标线。",
      poses: {
        player: "主视角选手从桌侧连续推杆，依次锁定9至11号球。",
        partner: "对侧选手沿库边追踪反弹点，维持三球连锁。"
      },
      lighting: "黄金流体、冰蓝离子与赤红火花分层闪烁，白色条纹保持可辨。",
      musicLayers: ["连击提示音", "合成器断奏", "火花爆裂声"],
      enterLine: "条纹球波次抵达，三段色谱连击开始计分。",
      completeLine: "流体、离子与火花完成串联，高分倍率持续燃烧。"
    },
    {
      id: "learning-together",
      order: 6,
      name: "临界充能",
      ballNumbers: [12, 13],
      environment: "紫晶棱镜与橙色脉冲在同一张球桌交叉，色散路径直指终局球组。",
      poses: {
        player: "主视角选手贴住桌边校准折射角，让12号球避开阻挡。",
        partner: "对侧选手用杆尾标记13号球的脉冲落点。"
      },
      lighting: "紫色棱光拆出完整色带，橙色脉冲按固定间隔横扫台呢。",
      musicLayers: ["上升合成器", "脉冲军鼓", "晶体折射音"],
      enterLine: "临界槽开始充能，棱镜与脉冲接管桌面。",
      completeLine: "折射角与频率全部锁定，终局通道正式开启。"
    },
    {
      id: "shared-future",
      order: 7,
      name: "终局爆发",
      ballNumbers: [14, 15],
      environment: "翠绿闪电与深红极光覆盖同一张球桌，最后两条光轨连接终点袋口。",
      poses: {
        player: "主视角选手沿球桌短边完成终极瞄准，电光准星锁住14号球。",
        partner: "对侧选手稳定最后一条极光线路，等待15号球清台。"
      },
      lighting: "绿色电弧高速分叉，深红极光缎带卷过全桌，编号始终清晰。",
      musicLayers: ["终局合成器主题", "重拍鼓组", "全色爆闪音"],
      enterLine: "终局模式启动，闪电与极光升至峰值。",
      completeLine: "15号球完成清台，全桌色域在最高倍率下爆发。"
    }
  ]);

  const BALL_DATE_MOTIFS = deepFreeze(BALL_MOTIF_SPECS.map((spec) => ({
    ballNumber: spec.ballNumber,
    number: spec.ballNumber,
    id: spec.id,
    name: spec.name,
    stage: spec.stage,
    meaning: spec.meaning,
    colorCue: spec.colorCue,
    tableMark: spec.tableMark,
    lines: [
      `${spec.name}沿${spec.colorCue}光轨直冲袋口，首段能量点亮。`,
      `${spec.ballNumber}号球擦库转向，${spec.tableMark}。`,
      `${spec.name}贴近袋口收速，色谱读数稳定锁定。`
    ]
  })));

  const TABLE_VARIANT_CAMERAS = deepFreeze([
    "俯拍·全桌色谱",
    "侧跟·霓虹长边",
    "近景·袋口能量环"
  ]);

  const TABLE_VARIANT_MOTIONS = deepFreeze([
    "沿台呢光轨直行，入袋后触发一轮高饱和闪爆",
    "擦过库边完成折射，彩色尾迹紧贴真实球路",
    "在袋口前短暂收速，能量环随转速压缩成亮点"
  ]);

  const TABLE_STAGE_INTERACTIONS = deepFreeze([
    "主色准线在球桌上展开，首个袋口开始充能。",
    "紫橙电压沿库边攀升，下一杆进入高亮区。",
    "激光与震波跨过桌面同步，连击节拍已经锁定。",
    "黑8在球桌中心压缩全色，六袋等待同步爆发。",
    "三枚条纹球接续点亮，色谱倍率保持燃烧。",
    "棱镜和脉冲从球桌两侧合流，终局线路完成校准。",
    "闪电贯穿台呢，极光沿最后一球收束至终点袋口。"
  ]);

  const TABLE_MOMENT_MOTIONS = deepFreeze({
    direct: "沿桌面光轨直行，精准击穿袋口",
    gentle: "贴着台呢缓慢前行，在袋口收束流光",
    power: "带动整条线路爆闪，强势轰入袋口",
    bank: "碰库折射后切回高亮目标线",
    long: "跨过整张球桌，让远端能量环瞬间满格",
    combo: "连续推动相邻球体，点燃两段连锁光轨",
    rattle: "在袋口两侧震荡，迸出火花后落袋",
    multi: "让两枚编号球同步入袋，触发双色连爆",
    near: "贴着袋口掠过，余辉停在库边",
    miss: "越过预定光轨后停在台呢中央，倍率保持",
    scratch: "让白球沉入袋口，桌面电场立即重置"
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
          + scene.tableZone + "，触发" + scene.name + "。",
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

  const TRANSITION_VARIANT_IDS = deepFreeze([
    ["transition-01-rain-contact", "transition-01-closing-clock", "transition-01-shared-umbrella", "transition-01-chalk-trail"],
    ["transition-02-two-cups", "transition-02-message-montage", "transition-02-record-needle", "transition-02-calendar-light"],
    ["transition-03-ticket-afterglow", "transition-03-restaurant-close", "transition-03-gallery-door", "transition-03-weekend-route"],
    ["transition-04-wind-still", "transition-04-joined-shadows", "transition-04-city-lights", "transition-04-cues-together"],
    ["transition-05-suitcase-unpacked", "transition-05-morning-platform", "transition-05-shared-key", "transition-05-photo-outside-frame"],
    ["transition-06-warm-lamp-return", "transition-06-plans-overlap", "transition-06-reheated-tea", "transition-06-same-side-seats"],
    ["transition-07-dawn-table", "transition-07-ring-map", "transition-07-paired-cues", "transition-07-ordinary-morning"]
  ]);

  const TRANSITION_DURATIONS = deepFreeze([
    [1840, 1920, 1880, 1960],
    [1860, 1940, 1900, 1980],
    [1880, 1960, 1840, 2000],
    [1920, 1880, 1960, 1840],
    [1940, 1860, 1900, 1980],
    [1920, 1880, 1960, 1840],
    [2000, 1940, 1880, 1960]
  ]);

  const TRANSITION_COPY = deepFreeze([
    {
      title: "色域展开",
      line: "关卡色彩铺满台呢，能量槽跃升到下一档。",
      visual: "镜头俯冲球桌，六个袋口依次扫过全色闪光。",
      sound: "清算提示音接入上升合成器",
      tone: "高饱和青蓝、金黄与纯白"
    },
    {
      title: "倍率跃升",
      line: "最后一次碰撞化作像素爆点，连击倍率完成结算。",
      visual: "计分数字从球面弹出，沿库边高速翻至新倍率。",
      sound: "低频重拍叠加连续计分音",
      tone: "电紫、炽橙与荧光绿"
    },
    {
      title: "全桌闪爆",
      line: "所有已激活光轨同步回亮，桌面进入更高能级。",
      visual: "彩色尾迹逆向回放，最终汇入桌面中央的能量环。",
      sound: "反向粒子声切入短促爆闪",
      tone: "赤红、钴蓝与棱镜全色"
    },
    {
      title: "关卡清算",
      line: "编号球化作色谱刻度，下一波目标已在袋口锁定。",
      visual: "关卡编号压过暗场，随后收进发光准星。",
      sound: "街机清关音接入高速鼓点",
      tone: "黑曜底色与多色霓虹"
    }
  ]);

  const STAGE_TRANSITIONS = deepFreeze(STAGES.map((stage, stageIndex) => ({
    stage: stage.order,
    stageId: stage.id,
    nextStageId: STAGES[stageIndex + 1]?.id || null,
    variants: TRANSITION_VARIANT_IDS[stageIndex].map((id, variantIndex) => {
      const copy = TRANSITION_COPY[variantIndex];
      const accent = POCKET_DATE_SCENES[(stageIndex + variantIndex) % POCKET_DATE_SCENES.length].name;
      return {
        id,
        durationMs: TRANSITION_DURATIONS[stageIndex][variantIndex],
        scene: `${stage.name}完成，霓虹球桌被${accent}覆盖，计分环跳入下一档。`,
        backgroundKeywords: [stage.name, "霓虹球桌", "高饱和光轨", accent],
        kicker: `STAGE ${String(stage.order).padStart(2, "0")} · CHROMA CLEAR`,
        title: `${stage.name} · ${copy.title}`,
        line: copy.line,
        visual: copy.visual,
        sound: copy.sound,
        tone: copy.tone
      };
    })
  })));

  const STAGE_EVENT_IDS = deepFreeze([
    {
      miss: ["stage-01-miss-opening-line", "stage-01-miss-lost-name", "stage-01-miss-rain-question", "stage-01-miss-contact-unsaid"],
      scratch: ["stage-01-scratch-polite-distance", "stage-01-scratch-spilled-water", "stage-01-scratch-abrupt-goodbye"],
      setup: ["stage-01-setup-offered-chalk", "stage-01-setup-saved-seat", "stage-01-setup-umbrella-glance"]
    },
    {
      miss: ["stage-02-miss-topic-fades", "stage-02-miss-reply-delayed", "stage-02-miss-call-ended", "stage-02-miss-record-skip"],
      scratch: ["stage-02-scratch-joke-misread", "stage-02-scratch-private-question", "stage-02-scratch-missed-plan"],
      setup: ["stage-02-setup-shared-playlist", "stage-02-setup-saved-article", "stage-02-setup-tomorrow-message"]
    },
    {
      miss: ["stage-03-miss-reservation-time", "stage-03-miss-menu-silence", "stage-03-miss-gallery-distance", "stage-03-miss-next-date-unsaid"],
      scratch: ["stage-03-scratch-late-without-word", "stage-03-scratch-phone-between", "stage-03-scratch-decided-for-her"],
      setup: ["stage-03-setup-shared-dessert", "stage-03-setup-ticket-kept", "stage-03-setup-walk-to-station"]
    },
    {
      miss: ["stage-04-miss-words-stall", "stage-04-miss-interrupted-moment", "stage-04-miss-hidden-in-joke", "stage-04-miss-unsent-message"],
      scratch: ["stage-04-scratch-blurted-pressure", "stage-04-scratch-public-scene", "stage-04-scratch-promise-too-far"],
      setup: ["stage-04-setup-folded-note", "stage-04-setup-rooftop-wait", "stage-04-setup-held-gaze"]
    },
    {
      miss: ["stage-05-miss-hands-pass", "stage-05-miss-cancelled-evening", "stage-05-miss-travel-wrong-turn", "stage-05-miss-comfort-unsaid"],
      scratch: ["stage-05-scratch-boundary-crossed", "stage-05-scratch-no-word-absence", "stage-05-scratch-comparison"],
      setup: ["stage-05-setup-spare-charger", "stage-05-setup-grocery-list", "stage-05-setup-printed-photo"]
    },
    {
      miss: ["stage-06-miss-circling-talk", "stage-06-miss-apology-incomplete", "stage-06-miss-plans-still-apart", "stage-06-miss-tea-cold-again"],
      scratch: ["stage-06-scratch-sharp-words", "stage-06-scratch-silent-days", "stage-06-scratch-old-score"],
      setup: ["stage-06-setup-notes-before-talk", "stage-06-setup-door-left-open", "stage-06-setup-shared-date"]
    },
    {
      miss: ["stage-07-miss-budget-gap", "stage-07-miss-city-choice", "stage-07-miss-proposal-pauses", "stage-07-miss-ring-stays-closed"],
      scratch: ["stage-07-scratch-decided-alone", "stage-07-scratch-crowded-proposal", "stage-07-scratch-assumed-answer"],
      setup: ["stage-07-setup-map-overlap", "stage-07-setup-shared-envelope", "stage-07-setup-paired-cues"]
    }
  ]);

  const STAGE_EVENT_DURATIONS = deepFreeze([
    { miss: [1320, 1460, 1580, 1740], scratch: [1380, 1620, 1880], setup: [1280, 1510, 1760] },
    { miss: [1340, 1490, 1640, 1810], scratch: [1420, 1680, 1900], setup: [1300, 1540, 1780] },
    { miss: [1360, 1510, 1660, 1840], scratch: [1440, 1700, 1920], setup: [1320, 1560, 1800] },
    { miss: [1380, 1530, 1680, 1860], scratch: [1460, 1720, 1940], setup: [1340, 1580, 1820] },
    { miss: [1400, 1550, 1710, 1880], scratch: [1480, 1740, 1960], setup: [1360, 1600, 1840] },
    { miss: [1420, 1570, 1730, 1900], scratch: [1500, 1760, 1980], setup: [1380, 1620, 1860] },
    { miss: [1440, 1590, 1750, 1920], scratch: [1520, 1780, 2000], setup: [1400, 1640, 1880] }
  ]);

  const STAGE_EVENT_COPY = deepFreeze({
    miss: [
      {
        camera: "俯拍·偏离光轨",
        title: "光轨偏出",
        visual: "目标球越过准线，彩色尾迹在袋口外侧迅速熄灭。",
        line: "本杆没有入袋，下一条高亮线路仍在桌面等待。",
        impact: "本杆零分，当前色谱倍率保持。",
        sound: "滚动声后留下一拍静音",
        tone: "冷蓝余辉"
      },
      {
        camera: "近景·袋口失锁",
        title: "袋口失锁",
        visual: "编号球擦过袋角，能量环闪烁两次后回到待机。",
        line: "锁定信号中断，目标球停在下一杆可攻区域。",
        impact: "连击未增加，袋口锁定值保留一格。",
        sound: "袋角轻响接入短促降调",
        tone: "银白与低亮洋红"
      },
      {
        camera: "侧跟·能量擦边",
        title: "能量擦边",
        visual: "球体沿库边滑过，细窄光带没有接入目标袋。",
        line: "色光贴边掠过，桌面为下一次折射留下角度。",
        impact: "得分未变，反弹路线完成预显。",
        sound: "持续滑音收进轻微电流声",
        tone: "青绿与钴蓝"
      },
      {
        camera: "低机位·连击悬停",
        title: "连击悬停",
        visual: "目标球停在袋前，计分数字悬浮后冻结。",
        line: "这一拍暂未结算，能量仍集中在目标区。",
        impact: "倍率暂停增长，下一杆获得近袋机会。",
        sound: "计分音拉长后突然截断",
        tone: "炽橙与黑曜"
      }
    ],
    scratch: [
      {
        camera: "俯拍·白球坠落",
        title: "白球过载",
        visual: "白球冲入袋口，全桌彩色线路瞬间切成红色警报。",
        line: "电场发生重置，编号球位置保持可见。",
        impact: "当前连击清零，关卡进度不回退。",
        sound: "低沉落袋声接入警报脉冲",
        tone: "警报红与纯白"
      },
      {
        camera: "近景·电场反转",
        title: "电场反转",
        visual: "白球消失在边袋，残余光轨沿原路反向扫回。",
        line: "控制权短暂切换，桌面能量重新分配。",
        impact: "倍率降至基础档，蓄能槽保留。",
        sound: "反向吸入声叠加低频断点",
        tone: "电紫与深红"
      },
      {
        camera: "侧景·倍率熔断",
        title: "倍率熔断",
        visual: "白球撞开目标线后落袋，计分环裂成像素碎片。",
        line: "高压输出被截断，下一杆从稳定模式重启。",
        impact: "爆发倍率失效，基础得分规则继续。",
        sound: "玻璃化碎裂音接入重启提示",
        tone: "黑曜、赤红与冷灰"
      }
    ],
    setup: [
      {
        camera: "俯拍·蓄能线路",
        title: "蓄能完成",
        visual: "目标球停在安全位，一条细亮线路延伸至下一目标。",
        line: "本杆未入袋，但攻击通道已经建立。",
        impact: "得分保持，下一杆获得清晰目标线。",
        sound: "柔和充能音逐步升高",
        tone: "翠绿与金黄"
      },
      {
        camera: "近景·准星校准",
        title: "角度锁定",
        visual: "球体贴近库边停稳，折射准星精准落在袋口中心。",
        line: "切角完成预演，下一次击发可直接接续。",
        impact: "连击待机，折射辅助提升一档。",
        sound: "两次校准点音接入稳定长音",
        tone: "钴蓝与荧光绿"
      },
      {
        camera: "侧跟·色域预热",
        title: "色域预热",
        visual: "编号球缓慢归位，周围色光从低亮升至待发。",
        line: "能量没有释放，下一波光谱已经完成加载。",
        impact: "阶段得分不变，爆发槽增加一格。",
        sound: "低频循环叠加明亮启动音",
        tone: "全色渐亮"
      }
    ]
  });

  const STAGE_EVENTS = deepFreeze(STAGES.map((stage, stageIndex) => ({
    stage: stage.order,
    stageId: stage.id,
    events: Object.fromEntries(Object.values(STAGE_EVENT_TYPES).map((eventType) => [
      eventType,
      STAGE_EVENT_IDS[stageIndex][eventType].map((id, variantIndex) => ({
        id,
        durationMs: STAGE_EVENT_DURATIONS[stageIndex][eventType][variantIndex],
        ...STAGE_EVENT_COPY[eventType][variantIndex]
      }))
    ]))
  })));

  function createSpecialEvent(config) {
    return {
      id: config.id,
      title: config.title,
      kind: config.kind,
      ballNumbers: config.ballNumbers,
      variants: config.variantIds.map((id, index) => ({
        id,
        durationMs: config.durations[index],
        ...config.copy[index]
      }))
    };
  }

  const SPECIAL_EVENTS = deepFreeze({
    confessionSuccess: createSpecialEvent({
      id: "confession-success",
      title: "黑8超载",
      kind: "milestone",
      ballNumbers: [8],
      variantIds: ["event-confession-success-answer", "event-confession-success-hands", "event-confession-success-laugh"],
      durations: [1240, 1460, 1120],
      copy: [
        { camera: "近景·奇点爆闪", visual: "黑8落袋，彩色吸积环向六个袋口同时爆开。", line: "奇点释放完成，全桌能量升至峰值。" },
        { camera: "俯拍·六袋联动", visual: "六种袋口效果沿库边依次点燃，中央留下黑曜余辉。", line: "同步读数满格，隐藏倍率已经解锁。" },
        { camera: "侧跟·黑金尾迹", visual: "黑8拖出黑金尾迹，计分数字在落袋瞬间翻倍。", line: "核心命中，超载奖励立即结算。" }
      ]
    }),
    confessionTooEarly: createSpecialEvent({
      id: "confession-too-early",
      title: "黑8抢拍",
      kind: "detour",
      ballNumbers: [8],
      variantIds: ["event-confession-early-space", "event-confession-early-cue", "event-confession-early-night"],
      durations: [1380, 1160, 1540],
      copy: [
        { camera: "俯拍·奇点未满", visual: "黑8提前启动，吸积环只亮起一半。", line: "充能不足，本次超载转入基础结算。" },
        { camera: "近景·能量回流", visual: "彩色光束触及黑8后弹回各自袋口。", line: "核心尚未锁定，色谱能量保持待机。" },
        { camera: "侧景·倒计时重置", visual: "黑曜读数归零，桌面准线重新加载。", line: "抢拍未触发奖励，下一次击发仍可蓄满。" }
      ]
    }),
    feelingsExposed: createSpecialEvent({
      id: "feelings-exposed",
      title: "黑8意外触发",
      kind: "reveal",
      ballNumbers: [8],
      variantIds: ["event-feelings-exposed-note", "event-feelings-exposed-screen", "event-feelings-exposed-friend"],
      durations: [980, 1080, 1260],
      copy: [
        { camera: "近景·误触火花", visual: "黑8被擦碰，球面突然迸出一圈紫色火花。", line: "隐藏核心被短暂点亮，能量读数公开。" },
        { camera: "俯拍·光谱泄露", visual: "一道彩光从黑8裂隙扫过整张台呢。", line: "意外信号完成扫描，六袋进入预警。" },
        { camera: "侧跟·奇点偏移", visual: "黑8偏离中心，吸积环跟随球路快速移动。", line: "核心位置改变，新的攻击角度已经出现。" }
      ]
    }),
    proposalSuccess: createSpecialEvent({
      id: "proposal-success",
      title: "终球爆发",
      kind: "milestone",
      ballNumbers: [15],
      variantIds: ["event-proposal-success-yes", "event-proposal-success-ring", "event-proposal-success-dawn"],
      durations: [1580, 1720, 1840],
      copy: [
        { camera: "近景·15号清台", visual: "15号球卷起深红极光，沿终极光轨高速入袋。", line: "清台完成，最高色谱倍率正式结算。" },
        { camera: "俯拍·全桌色爆", visual: "六个袋口同步释放涟漪、火花、棱光、脉冲、闪电与极光。", line: "全效果联动成功，终局奖励全部解锁。" },
        { camera: "拉远·冠军计分环", visual: "霓虹球桌缩入巨型计分环，S级读数占满画面。", line: "终球命中，冠军色域保持长亮。" }
      ]
    }),
    commitmentTooHeavy: createSpecialEvent({
      id: "commitment-too-heavy",
      title: "终球过载",
      kind: "detour",
      ballNumbers: [15],
      variantIds: ["event-commitment-heavy-closed-box", "event-commitment-heavy-honest", "event-commitment-heavy-window"],
      durations: [1460, 1620, 1380],
      copy: [
        { camera: "近景·极光熔断", visual: "15号球亮度过高，极光尾迹在袋口前分裂。", line: "输出超过阈值，终局奖励延后结算。" },
        { camera: "俯拍·能量泄压", visual: "深红光带沿库边散开，峰值读数逐级下降。", line: "系统完成泄压，清台线路仍然有效。" },
        { camera: "侧景·终点待机", visual: "15号球停在终点袋旁，极光环保持低亮旋转。", line: "终球尚未落袋，最后一次击发继续开放。" }
      ]
    }),
    losingContact: createSpecialEvent({
      id: "losing-contact",
      title: "连锁断频",
      kind: "distance",
      ballNumbers: [11, 12, 13, 14],
      variantIds: ["event-losing-contact-dates", "event-losing-contact-clocks", "event-losing-contact-photo"],
      durations: [1180, 1320, 1440],
      copy: [
        { camera: "俯拍·断裂光轨", visual: "条纹球之间的连锁线逐段熄灭，桌面留下分散亮点。", line: "连续频率中断，倍率回落一档。" },
        { camera: "近景·脉冲失步", visual: "两圈脉冲错开节拍，无法在目标袋前重合。", line: "同步失败，下一杆需要重新校频。" },
        { camera: "侧跟·余辉衰减", visual: "球体继续滚动，尾迹却在抵达库边前淡出。", line: "能量传输减弱，连击窗口正在收窄。" }
      ]
    })
  });

  const ENDINGS = deepFreeze({
    S: {
      grade: "S",
      id: "city-alight",
      title: "全色制霸",
      scene: "15枚编号球全部清台，六个袋口效果在霓虹球桌上同步爆发。",
      line: "最高倍率锁定，全色能量贯穿终局计分环。",
      epilogue: "每一次精准碰撞都留下一道色光，最终组成完整冠军光谱。",
      musicLayers: ["终局合成器主题", "重拍鼓组", "冠军清算音"]
    },
    A: {
      grade: "A",
      id: "homeward-together",
      title: "霓虹通关",
      scene: "主要光轨覆盖整张台呢，少量余辉仍在库边缓慢闪烁。",
      line: "稳定清台完成，霓虹倍率停在高分区。",
      epilogue: "没有浪费的线路，偏转与回弹都汇入最后的色谱读数。",
      musicLayers: ["合成器主题变奏", "高速断奏", "高分提示音"]
    },
    B: {
      grade: "B",
      id: "unhurried-night",
      title: "余辉结算",
      scene: "断续光轨依次点亮球桌，六个袋口保留低亮能量环。",
      line: "基础清台完成，剩余色光转入自由模式。",
      epilogue: "每个落点都记录在计分板上，下一局可从更高能级重新启动。",
      musicLayers: ["低速合成器", "柔和脉冲", "街机结算音"]
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
    [STAGE_EVENT_TYPES.MISS]: "线路偏出",
    [STAGE_EVENT_TYPES.SCRATCH]: "白球落袋",
    [STAGE_EVENT_TYPES.SETUP]: "蓄能待发"
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
    const sceneMoment = POCKET_MOTIF_MOMENTS[pocketId]?.[motif.id] || motif.lines[variantIndex];
    const relationshipBeat = STAGE_RELATION_BEATS[stage.order - 1][variantIndex % STAGE_RELATION_BEATS[stage.order - 1].length];
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
      line: `${sceneMoment}${relationshipBeat}`,
      motion,
      interaction,
      relationshipBeat,
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
    const physicalBallNumber = Number.isInteger(options.ballNumber)
      ? options.ballNumber
      : storyNumber;
    assertBallNumber(physicalBallNumber);
    const performance = options.performance && typeof options.performance === "object"
      ? options.performance
      : null;
    const pocketId = options.pocketId === undefined ? performance?.pocketId : options.pocketId;
    const seed = options.seed === undefined
      ? performance?.id || `${stage.id}:${storyNumber}:${archetype}`
      : options.seed;
    const moment = composeTableMoment({
      ballNumber: physicalBallNumber,
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
      physicalBallNumber,
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
    POCKET_MOTIF_MOMENTS,
    STAGE_RELATION_BEATS,
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
