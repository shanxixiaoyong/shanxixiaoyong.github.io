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
    { id: "first-sight", order: 1, name: "初见", scene: "傍晚校园", palette: "香樟绿与夕照金", weather: "风吹过刚停的雨", music: ["木吉他", "鞋底轻响"], objective: "抓住两条路线短暂交汇的机会", opening: "下课铃刚停，她从香樟道另一侧经过。雨水正从叶尖落下，你们在路口第一次看见彼此。", closing: "她在路口停半步，把伞向你这边偏过来。" },
    { id: "familiar-steps", order: 2, name: "熟悉", scene: "清晨河堤", palette: "薄雾蓝与晨光白", weather: "河面有轻雾", music: ["轻鼓点", "自行车铃"], objective: "保持并肩并收集共同话题", opening: "她已经在桥下热身，见你靠近便抬手示意。两双鞋落在同一个节拍里。", closing: "终点还没到，你们已经约好下一次出发时间。" },
    { id: "first-date", order: 3, name: "暧昧", scene: "霓虹夜街", palette: "砖红与夜色青", weather: "晚风穿过街巷", music: ["轻柔合成器", "消息提示音"], objective: "连续收集成对的邀请与回应", opening: "夜色把聊天气泡变成沿街灯光。她时而靠近，时而在下一个路口等你的回应。", closing: "雨棚下，她很自然地问起这个周末有没有空。" },
    { id: "heart-spoken", order: 4, name: "约会", scene: "雨夜旧城", palette: "霓虹青与暖灯橙", weather: "细雨持续落下", music: ["钢琴单音", "雨打伞面"], objective: "跟随同行动作完成第一次正式约会", opening: "风把伞沿推高，她伸手帮你按住。两个人在雨里沿同一条路继续向前。", closing: "约会结束的路口，她没有告别，只是很自然地牵住你的手。" },
    { id: "shared-days", order: 5, name: "相恋", scene: "四季街区", palette: "晴日黄与生活绿", weather: "光影随街区切换", music: ["完整吉他主题", "城市节拍"], objective: "收集日常并维持双人光轨", opening: "路线穿过菜场、站台和晚归的街。她时快时慢，总在下一个路口与你并肩。", closing: "窗里的灯一盏盏亮起，你们把明天也写进共同清单。" },
    { id: "rough-weather", order: 6, name: "磨合", scene: "台风前的城市", palette: "铅灰与信号红", weather: "阵风推着云层", music: ["低音弦乐", "远处雷声"], objective: "避开误解并修复节奏", opening: "风越来越急，计划和路线同时改变。她放慢脚步，等你把真正担心的事说完。", closing: "雨势没有立刻减弱，你们却重新找到同一个速度。" },
    { id: "toward-home", order: 7, name: "未来", scene: "黎明星光长路", palette: "深夜靛与窗灯金", weather: "夜空逐渐转亮", music: ["钢琴与弦乐", "稳定心跳"], objective: "收集约定并共同抵达发光终点", opening: "长街笔直向前，沿途收集的物件化作光点铺在路上。她始终与你并肩。", closing: "终点在晨光中打开，她停下来，向你伸出手。" }
  ];

  const COLLECTIBLES = [
    { id: "umbrella-pin", stage: 1, name: "伞扣", symbol: "透明雨滴", effect: "扩大首次吸附范围", line: "她把松开的伞扣按好，也替你挡住一阵雨。" },
    { id: "earbud", stage: 2, name: "半边耳机", symbol: "银色音符", effect: "短暂显示节拍线", line: "同一首歌落进两个人的步频。" },
    { id: "ticket-stub", stage: 3, name: "双人票根", symbol: "蓝色方票", effect: "约会路线加一格默契", line: "票根一分为二，又在掌心拼成完整图案。" },
    { id: "brave-word", stage: 4, name: "勇气字句", symbol: "发光短笺", effect: "保护一次心意连击", line: "想说的话不再绕开主语。" },
    { id: "door-key", stage: 5, name: "门钥匙", symbol: "黄铜小钥匙", effect: "同行动作持续更久", line: "钥匙轻轻相碰，发出清脆的一声。" },
    { id: "repair-thread", stage: 6, name: "修补线", symbol: "红色线结", effect: "失误后保留一半默契", line: "线结不遮住裂口，只让两边重新靠近。" },
    { id: "heart-seal", stage: 7, name: "心章", symbol: "暖金印记", effect: "开启最终盒子", line: "七段路在掌心汇成完整的心形。" }
  ];

  const OBSTACLES = [
    { id: "puddle", stages: [1, 4], name: "积水", cue: "路面反光晃动", response: "跳跃", meaning: "突如其来的局促" },
    { id: "crowd", stages: [1, 3, 5], name: "人潮", cue: "行人轨迹交错", response: "换道", meaning: "靠近需要主动选择" },
    { id: "silent-gap", stages: [2, 3], name: "冷场", cue: "节拍线出现空拍", response: "收集话题", meaning: "不必用讨好填满沉默" },
    { id: "missed-bus", stages: [3, 5], name: "错过的车", cue: "车门提示灯闪烁", response: "改走支路", meaning: "计划改变也能继续同行" },
    { id: "crosswind", stages: [4, 6], name: "侧风", cue: "雨线突然倾斜", response: "相互搀扶", meaning: "坦白让人短暂失去平衡" },
    { id: "work-stack", stages: [5, 6], name: "忙碌堆叠", cue: "日程牌连续落下", response: "分工", meaning: "亲密仍需要留出时间" },
    { id: "assumption-wall", stages: [6], name: "猜测墙", cue: "不完整句子组成路障", response: "沟通", meaning: "没有说出口的判断阻断道路" },
    { id: "closing-dark", stages: [7], name: "熄灯路段", cue: "街灯逐盏变暗", response: "跟随心章", meaning: "信任比视野先一步抵达" }
  ];

  const ROAD_MODULES = [
    { id: "straight", name: "并肩直道", lanes: 3, mechanic: "维持同道积累默契", length: 12 },
    { id: "fork", name: "选择岔路", lanes: 2, mechanic: "话题或约会路线决定出口", length: 8 },
    { id: "rhythm-bridge", name: "节拍桥", lanes: 1, mechanic: "按提示同步跳跃", length: 10 },
    { id: "market-weave", name: "生活穿行", lanes: 3, mechanic: "分工收集清单物品", length: 14 },
    { id: "conversation-tunnel", name: "对话隧道", lanes: 2, mechanic: "击破猜测，保留真实句子", length: 9 },
    { id: "shelter", name: "避雨檐廊", lanes: 1, mechanic: "降低速度并恢复默契", length: 6 },
    { id: "starlight-finish", name: "星光终道", lanes: 3, mechanic: "七枚心章依次点亮路面", length: 16 }
  ];

  const TOPIC_CATEGORIES = [
    { id: "daily", name: "日常", tone: "轻松", prompts: ["今天最想分享的小事", "最近常走的一条路", "此刻想吃的东西"] },
    { id: "interests", name: "兴趣", tone: "明亮", prompts: ["循环播放的歌", "愿意重看的电影", "最近翻开的书"] },
    { id: "values", name: "选择", tone: "认真", prompts: ["怎样算守约", "独处和陪伴的边界", "面对改变的方式"] },
    { id: "vulnerability", name: "真心", tone: "克制", prompts: ["现在最担心的事", "需要怎样的支持", "一句不容易说出口的话"] },
    { id: "future", name: "未来", tone: "务实", prompts: ["理想的一天", "愿意共同承担的事", "想住下的地方"] }
  ];

  const DATE_ROUTES = [
    { id: "bookstore-river", name: "书店与河岸", topicIds: ["interests", "values"], stage: 3, beats: ["交换书签", "沿河慢走", "赶上末班车"], closing: "她把选中的书递给你，请你读完再谈结尾。" },
    { id: "market-kitchen", name: "市集与厨房", topicIds: ["daily", "future"], stage: 5, beats: ["共同选菜", "分工备餐", "收拾餐桌"], closing: "锅里冒着热气，你们开始商量下一顿饭。" },
    { id: "museum-rooftop", name: "展馆与天台", topicIds: ["interests", "vulnerability"], stage: 4, beats: ["各选一幅画", "交换理由", "在天台停步"], closing: "城市在脚下铺开，你们把话说得比夜色清楚。" },
    { id: "station-seaside", name: "车站与海边", topicIds: ["values", "future"], stage: 7, beats: ["确认车次", "分享靠窗座位", "迎着海风回程"], closing: "返程票放在一起，座位仍然相邻。" }
  ];

  const COMPANION_ACTIONS = [
    { id: "pace-match", name: "调整步频", input: "靠近同行者", result: "双方速度取平均值", line: "不用谁追赶谁，脚步自然落在一起。" },
    { id: "hand-pull", name: "伸手拉起", input: "同伴失衡时互动", result: "免除一次跌倒", line: "手先伸过来，解释可以稍后再说。" },
    { id: "umbrella-share", name: "共撑一伞", input: "雨区内保持同道", result: "持续恢复默契", line: "伞面不大，肩膀因此靠近一点。" },
    { id: "split-task", name: "默契分工", input: "在双目标前分道", result: "同时完成两个收集目标", line: "你看向左边，她已经跑向右边。" },
    { id: "wait-at-turn", name: "路口等候", input: "领先时主动减速", result: "提高信任倍率", line: "她回头时，你仍在能看见的位置。" },
    { id: "honest-talk", name: "停下说清", input: "猜测墙前保持互动", result: "将障碍改为恢复路段", line: "你们把速度放低，让每句话完整落地。" }
  ];

  const STAGE_PERFORMANCES = STAGES.map((stage) => ({
    id: `performance-${stage.id}`,
    stage: stage.order,
    durationMs: 2400 + stage.order * 180,
    camera: stage.order === 7 ? "长焦跟跑转室内近景" : "侧向跟跑转双人近景",
    beats: [stage.opening, `“${stage.objective}”的路标在前方亮起。`, stage.closing],
    skipLabel: "略过演出"
  }));

  const COMPENSATION_SEGMENTS = [
    { id: "gentle-ramp", trigger: "连续失误两次", moduleId: "shelter", benefit: "移除下一组障碍并补充一枚普通心点", line: "前方转入平缓檐廊，呼吸和步频都有重新调整的空间。" },
    { id: "partner-wait", trigger: "与同行者距离过远", moduleId: "straight", benefit: "同行者减速并标出安全路线", line: "她在路口放慢脚步，清晰的落脚点逐个亮起。" },
    { id: "topic-reprise", trigger: "约会话题选择失败", moduleId: "fork", benefit: "提供同类别的新话题且不扣默契", line: "话题换一个入口，真诚仍然有效。" },
    { id: "heart-shelter", trigger: "默契值低于四分之一", moduleId: "shelter", benefit: "暂停衰减并恢复至安全线", line: "雨棚留出一段安静路程，你们并肩把节奏找回来。" }
  ];

  const STAGE_ENDINGS = STAGES.map((stage) => ({
    id: `stage-ending-${stage.id}`,
    stage: stage.order,
    title: ["一次对视", "聊到深夜", "主动邀约", "第一次牵手", "亮灯日常", "重新并肩", "伸出的手"][stage.order - 1],
    line: stage.closing,
    nextHint: stage.order < 7 ? `下一段路通向${STAGES[stage.order].scene}。` : "盒盖上的心形凹槽正等待七枚心章。"
  }));

  const FINAL_ENDINGS = {
    S: { id: "ending-s-complete-journey", grade: "S", title: "完整走过", requirement: "七段旅程高完成度且收集足够隐藏物件", scene: "晨光照进安静的房间，旧物盒已经合上。", line: "这段爱情没有留在今天，却完整地存在过，也把你带到了这里。", coda: "你穿上外套走入清晨，熟悉的光轨在身后亮起片刻，然后自然消失。" },
    A: { id: "ending-a-real-love", grade: "A", title: "一段完整的爱情", requirement: "完成七段旅程并抵达最终揭示", scene: "旧照片被轻轻放回盒中，窗外已经天亮。", line: "你们确实一起走了很远。终点不是重新开始，而是终于能够平静地回望。", coda: "你合上盒子，独自走出房间，街道仍向前延伸。" },
    B: { id: "ending-b-stumbling-journey", grade: "B", title: "跌跌撞撞地走过", requirement: "完成旅程但遗漏较多物件", scene: "盒中的票根和照片并不完整，留下的空位对应一路错过的片段。", line: "这段关系并不完美，但每一次靠近都真实发生过。", coda: "你没有急着给它结论，只把盒子收好，走向已经亮起的街道。" }
  };

  const BOX_REVEAL = {
    id: "final-box-reveal",
    title: "原来，这条路早已走过",
    boundary: "post-reveal",
    requires: ["umbrella-pin", "earbud", "ticket-stub", "brave-word", "door-key", "repair-thread", "heart-seal"],
    shots: [
      { title: "光芒褪去", framing: "旧物盒近景", line: "七枚心章失去光芒，变成褪色的电影票、旧车票、钥匙扣和拍立得照片。" },
      { title: "房间里只有一个人", framing: "镜头缓慢后退", line: "刚才并肩奔跑的人并不在房间里，只有你独自坐在打开的旧物盒前。" },
      { title: "这条路跨过了很多年", framing: "照片与季节交叠", line: "照片里的季节跨过数年。前面连成一条路的场景，原来是这段关系留下的真实轨迹。" },
      { title: "天已经亮了", framing: "现实房间与窗外街道", line: "窗外正是初见时的那条街。你看完最后一张照片，把它轻轻放回盒中。" }
    ],
    line: "我们确实一起走了很远。",
    restraint: "不使用死亡、背叛或哭喊解释，只让角色合上盒子，在天亮后继续生活。"
  };

  const NEW_GAME_PLUS_CLUES = [
    { id: "clue-wristband", stage: 1, layer: "foreground", detail: "冲刺后袖口短暂滑开，腕上露出一截褪色的音乐节手环。", payoff: "最终盒中保存着同一条手环。" },
    { id: "clue-bench-count", stage: 2, layer: "environment", detail: "河堤每隔固定距离出现同款长椅，同行者总在其中一张旁边放慢。", payoff: "最终照片背面写着那张长椅的位置。" },
    { id: "clue-route-fold", stage: 3, layer: "prop", detail: "票根背面的蓝线在折角处中断，形状像一张缩小路线图。", payoff: "盒中路线图沿同一折角展开。" },
    { id: "clue-rain-loop", stage: 4, layer: "audio", detail: "雨声中短暂混入更早季节的蝉鸣，随后又恢复正常。", payoff: "这些场景并非发生在同一天，而是跨越数年。" },
    { id: "clue-left-step", stage: 5, layer: "animation", detail: "经过熟悉路口时，同行者总会自然走到左侧。", payoff: "旧照片里，她也一直站在相同一侧。" },
    { id: "clue-breath-marker", stage: 6, layer: "ui", detail: "风声增强时，两条光轨偶尔只剩下一条。", payoff: "同行的人只存在于这次重新走过的轨迹中。" },
    { id: "clue-window", stage: 7, layer: "background", detail: "终点窗框与前几程边缘反复出现的白色框线完全重合。", payoff: "所有道路最终都收束到现实房间的这扇窗。" }
  ];

  function stableIndex(seed, salt, length) {
    if (typeof seed !== "string" && (typeof seed !== "number" || !Number.isFinite(seed))) {
      throw new TypeError("seed must be a finite number or string");
    }
    const input = `${salt}|${seed}`;
    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) % length;
  }

  function findByStage(value, collection, label) {
    const item = collection.find((entry) => entry.stage === value || entry.id === value);
    if (!item) throw new RangeError(`unknown ${label}: ${value}`);
    return item;
  }

  function getStage(value) {
    if (typeof value !== "number" && typeof value !== "string") throw new TypeError("stage must be a number or id");
    const stage = STAGES.find((entry) => entry.order === value || entry.id === value);
    if (!stage) throw new RangeError(`unknown stage: ${value}`);
    return stage;
  }

  function getCollectible(value) {
    if (typeof value !== "number" && typeof value !== "string") throw new TypeError("collectible must be a stage or id");
    return findByStage(value, COLLECTIBLES, "collectible");
  }

  function getEnding(grade) {
    if (typeof grade !== "string") throw new TypeError("grade must be a string");
    const ending = FINAL_ENDINGS[grade.toUpperCase()];
    if (!ending) throw new RangeError(`unknown ending: ${grade}`);
    return ending;
  }

  function selectTopic(options) {
    if (!options || typeof options !== "object") throw new TypeError("options are required");
    const category = TOPIC_CATEGORIES.find((item) => item.id === options.categoryId);
    if (!category) throw new RangeError(`unknown topic category: ${options.categoryId}`);
    const index = stableIndex(options.seed === undefined ? 0 : options.seed, category.id, category.prompts.length);
    return deepFreeze({ categoryId: category.id, category: category.name, prompt: category.prompts[index], index });
  }

  function selectDateRoute(options) {
    if (!options || typeof options !== "object") throw new TypeError("options are required");
    getStage(options.stage);
    const candidates = DATE_ROUTES.filter((route) => route.stage === options.stage && (!options.topicId || route.topicIds.includes(options.topicId)));
    if (!candidates.length) throw new RangeError("no date route matches the supplied stage and topic");
    return candidates[stableIndex(options.seed === undefined ? 0 : options.seed, `route-${options.stage}-${options.topicId || "any"}`, candidates.length)];
  }

  function selectRoadModule(options) {
    if (!options || typeof options !== "object") throw new TypeError("options are required");
    const stage = getStage(options.stage);
    const excluded = new Set(options.excludeIds || []);
    if (!Array.isArray(options.excludeIds || [])) throw new TypeError("excludeIds must be an array");
    const candidates = ROAD_MODULES.filter((module) => !excluded.has(module.id));
    if (!candidates.length) throw new RangeError("all road modules are excluded");
    return candidates[stableIndex(options.seed === undefined ? 0 : options.seed, `road-${stage.id}`, candidates.length)];
  }

  deepFreeze(STAGES);
  deepFreeze(COLLECTIBLES);
  deepFreeze(OBSTACLES);
  deepFreeze(ROAD_MODULES);
  deepFreeze(TOPIC_CATEGORIES);
  deepFreeze(DATE_ROUTES);
  deepFreeze(COMPANION_ACTIONS);
  deepFreeze(STAGE_PERFORMANCES);
  deepFreeze(COMPENSATION_SEGMENTS);
  deepFreeze(STAGE_ENDINGS);
  deepFreeze(FINAL_ENDINGS);
  deepFreeze(BOX_REVEAL);
  deepFreeze(NEW_GAME_PLUS_CLUES);

  return deepFreeze({
    STAGES,
    COLLECTIBLES,
    OBSTACLES,
    ROAD_MODULES,
    TOPIC_CATEGORIES,
    DATE_ROUTES,
    COMPANION_ACTIONS,
    STAGE_PERFORMANCES,
    COMPENSATION_SEGMENTS,
    STAGE_ENDINGS,
    FINAL_ENDINGS,
    BOX_REVEAL,
    NEW_GAME_PLUS_CLUES,
    getStage,
    getCollectible,
    getEnding,
    selectTopic,
    selectDateRoute,
    selectRoadModule
  });
});
