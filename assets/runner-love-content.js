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

  const STORY_ITEMS = [
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

  [STAGES, STORY_ITEMS, STAGE_ITEM_IDS, ROUTE_SET_PIECES, ARRIVAL_SCENES, COLLECTIBLES, OBSTACLES, ROAD_MODULES, STAGE_PERFORMANCES, STAGE_ENDINGS, FINAL_ENDINGS].forEach(deepFreeze);

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
    getStage,
    getItem,
    getCollectible,
    getEnding,
    getRoute,
    selectStageItem,
    selectArrival
  });
});
