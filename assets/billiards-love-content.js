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

  const STAGES = deepFreeze([
    {
      id: "first-contact",
      order: 1,
      name: "初次接触",
      ballNumbers: [1, 2, 3],
      environment: "雨夜球房刚过九点，临街窗起雾，陌生客人隔着一张球桌来往。",
      poses: {
        player: "扶杆站在球桌短边，目光克制地抬起。",
        partner: "在对面整理袖口，察觉视线后轻轻回望。"
      },
      lighting: "冷青窗光压低四周，暖白桌灯只照亮表情和球面。",
      musicLayers: ["稀疏钢琴", "玻璃雨声", "球房低声交谈"],
      enterLine: "目光先于语言抵达。",
      completeLine: "名字和联系方式，都留了下来。"
    },
    {
      id: "growing-familiar",
      order: 2,
      name: "熟悉升温",
      ballNumbers: [4, 5],
      environment: "打烊前的球房安静下来，吧台留着唱片、杂志和两只温热的杯子。",
      poses: {
        player: "倚在桌沿听她说话，偶尔低头回复消息。",
        partner: "坐在高脚椅上，谈到喜欢的事时眼神明亮。"
      },
      lighting: "琥珀吧台灯与墨绿台呢相接，人物面部保持柔和半明。",
      musicLayers: ["电钢琴和弦", "轻刷鼓", "消息提示音点缀"],
      enterLine: "话题有了下一句，问候也有了下一天。",
      completeLine: "你们开始频繁出现在彼此的日常里。"
    },
    {
      id: "intentional-dates",
      order: 3,
      name: "线下靠近",
      ballNumbers: [6, 7],
      environment: "球房之外，安静餐厅与周末展馆依次亮起，两次见面都被认真安排。",
      poses: {
        player: "与她隔桌而坐，随后在展厅并肩慢行。",
        partner: "放下手机专心交谈，离场时自然等你同行。"
      },
      lighting: "餐桌吊灯温暖收束，约会场景以清透自然光过渡。",
      musicLayers: ["木吉他泛音", "柔和贝斯", "餐厅与街道环境声"],
      enterLine: "见面不再偶然，而是被郑重地留出时间。",
      completeLine: "第二次赴约时，你们都明白这不是顺路。"
    },
    {
      id: "spoken-heart",
      order: 4,
      name: "告白",
      ballNumbers: [8],
      environment: "楼顶风很轻，城市的声音被夜色推到很远。",
      poses: {
        player: "正面对着她，球杆收在身后。",
        partner: "手扶栏杆，没有移开视线。"
      },
      lighting: "月白轮廓光勾住肩线，脸侧由远处窗灯轻轻补亮。",
      musicLayers: ["单音钢琴", "微弱弦乐长音", "屋顶风声"],
      enterLine: "这一句，终于不再绕行。",
      completeLine: "答案落下时，风恰好停了一秒。"
    },
    {
      id: "confirmed-love",
      order: 5,
      name: "确定关系",
      ballNumbers: [9, 10, 11],
      environment: "关系有了名字，街角、站台和远方旅店开始留下两个人的共同片段。",
      poses: {
        player: "走在她身侧，伸手时留有从容的停顿。",
        partner: "回应你的靠近，在陌生城市里自然与你并肩。"
      },
      lighting: "柔暖街灯、清晨车窗光与旅行日照交替，色温明亮但不过分甜腻。",
      musicLayers: ["原声钢琴", "克制弦乐", "列车与城市环境声"],
      enterLine: "确认喜欢以后，身体与脚步都靠近了一点。",
      completeLine: "你们牵手、拥抱，也一起看过陌生的清晨。"
    },
    {
      id: "learning-together",
      order: 6,
      name: "磨合",
      ballNumbers: [12, 13],
      environment: "回到日常以后，未完成的计划和冷下来的茶留在同一张桌上。",
      poses: {
        player: "坐在桌边把语速放慢，手掌离开争执中的纸页。",
        partner: "从窗边回到对面坐下，愿意把真正的不安说完。"
      },
      lighting: "分歧时使用克制冷光，沟通深入后由桌边暖灯缓慢补回面部。",
      musicLayers: ["低音提琴拨奏", "钢琴低音区", "钟表与室内底噪"],
      enterLine: "亲密让分歧无处隐藏。",
      completeLine: "话被认真听完以后，你们重新坐回同一边。"
    },
    {
      id: "shared-future",
      order: 7,
      name: "共同未来",
      ballNumbers: [14, 15],
      environment: "闭店后的旧球房只留一桌灯光，地图与戒盒安静放在桌边。",
      poses: {
        player: "先与她并肩谈完计划，再放下球杆站到她面前。",
        partner: "认真确认每个选择，最后带着笑意等你说完。"
      },
      lighting: "暖白顶灯集中在两人之间，窗外清晨泛起淡金。",
      musicLayers: ["完整钢琴主题", "大提琴和声", "清晨风声"],
      enterLine: "先把未来谈清楚，再问那个很长的问题。",
      completeLine: "灯光没有变，你们决定继续并肩。"
    }
  ]);

  const BALLS = deepFreeze([
    {
      number: 1,
      id: "eye-contact",
      name: "对视",
      stage: 1,
      stageId: "first-contact",
      meaning: "第一次对视，让彼此从人群中变得清晰。",
      variants: [
        {
          id: "ball-01-table-glance",
          durationMs: 820,
          camera: "对切·球桌两端",
          visual: "她抬眼看向这一杆，你也正好望过去。",
          line: "隔着一桌灯光，目光停在了同一秒。"
        },
        {
          id: "ball-01-window-reflection",
          durationMs: 1040,
          camera: "侧景·玻璃倒影",
          visual: "车灯掠过窗面，两道视线在倒影里相遇。",
          line: "谁都没有立刻移开，也没有刻意停得太久。"
        },
        {
          id: "ball-01-chalk-glance",
          durationMs: 760,
          camera: "近景·递出的巧粉",
          visual: "她拾起巧粉递来，抬头时与你短暂对视。",
          line: "一句谢谢之前，你们先记住了彼此的眼睛。"
        }
      ]
    },
    {
      number: 2,
      id: "starting-conversation",
      name: "主动搭话",
      stage: 1,
      stageId: "first-contact",
      meaning: "主动开口，把一次对视变成真正的认识。",
      variants: [
        {
          id: "ball-02-offered-chalk",
          durationMs: 780,
          camera: "近景·掌心巧粉",
          visual: "你把巧粉递过去，顺势问她常来这里吗。",
          line: "开场很普通，好在语气足够真诚。"
        },
        {
          id: "ball-02-open-table",
          durationMs: 940,
          camera: "中景·空着的球桌一侧",
          visual: "你指了指空位，问她愿不愿意同打一局。",
          line: "她看了看球桌，说，可以。"
        },
        {
          id: "ball-02-rain-question",
          durationMs: 1060,
          camera: "侧跟·窗边雨线",
          visual: "她望向窗外，你走近问她是否带了伞。",
          line: "话题从天气开始，没有停在天气。"
        }
      ]
    },
    {
      number: 3,
      id: "exchange-contacts",
      name: "交换联系方式",
      stage: 1,
      stageId: "first-contact",
      meaning: "在告别之前，为下一次联系留下明确入口。",
      variants: [
        {
          id: "ball-03-contact-card",
          durationMs: 760,
          camera: "特写·交换的手机",
          visual: "你们各自在联系人页面输入名字。",
          line: "名字有了备注，见面也有了下一次。"
        },
        {
          id: "ball-03-qr-scan",
          durationMs: 820,
          camera: "俯拍·相邻的二维码",
          visual: "扫描完成，她的头像出现在新联系人一栏。",
          line: "申请很快通过，谁都没有故意等一会儿。"
        },
        {
          id: "ball-03-first-message",
          durationMs: 980,
          camera: "过肩·第一条消息",
          visual: "你把刚才的比分发给她，屏幕很快亮起回复。",
          line: "联系方式不是句点，是一条刚打开的路。"
        }
      ]
    },
    {
      number: 4,
      id: "shared-interest",
      name: "共同话题",
      stage: 2,
      stageId: "growing-familiar",
      meaning: "共同兴趣让谈话自然延长，也显露彼此的分寸。",
      variants: [
        {
          id: "ball-04-shared-record",
          durationMs: 920,
          camera: "俯拍·唱片封套",
          visual: "你们同时认出角落那张旧唱片，话题一下展开。",
          line: "原来喜欢的旋律，也有重合的部分。"
        },
        {
          id: "ball-04-book-margin",
          durationMs: 1040,
          camera: "近景·翻开的书页",
          visual: "她提起最近读的书，你恰好记得同一段。",
          line: "观点并不完全相同，谈起来却很舒服。"
        },
        {
          id: "ball-04-film-still",
          durationMs: 1120,
          camera: "双人中景·手机里的剧照",
          visual: "一张电影剧照在两人之间停住，新的片单越列越长。",
          line: "共同话题不必讨好，下一句自然会来。"
        }
      ]
    },
    {
      number: 5,
      id: "frequent-chatting",
      name: "频繁聊天",
      stage: 2,
      stageId: "growing-familiar",
      meaning: "联系变得频繁，彼此开始分享未经修饰的日常。",
      variants: [
        {
          id: "ball-05-morning-message",
          durationMs: 720,
          camera: "特写·清晨锁屏",
          visual: "她发来一张上班路上的天空，你顺手回了早餐。",
          line: "问候不再客套，普通一天有了交换。"
        },
        {
          id: "ball-05-typing-dots",
          durationMs: 900,
          camera: "定格·反复出现的输入圆点",
          visual: "三颗圆点消失又出现，最后落成一段真心话。",
          line: "聊天越过寒暄，也开始容纳不那么体面的情绪。"
        },
        {
          id: "ball-05-midnight-call",
          durationMs: 1180,
          camera: "分屏·两端夜灯",
          visual: "通话时间越过零点，两边都没有急着挂断。",
          line: "晚安说了两次，电话才真正结束。"
        }
      ]
    },
    {
      number: 6,
      id: "dinner-for-two",
      name: "单独吃饭",
      stage: 3,
      stageId: "intentional-dates",
      meaning: "第一次单独吃饭，把线上熟悉带进真实相处。",
      variants: [
        {
          id: "ball-06-shared-menu",
          durationMs: 880,
          camera: "俯拍·摊开的菜单",
          visual: "两根手指同时停在同一道菜旁，又一起收回。",
          line: "第一次单独吃饭，沉默也不显得空。"
        },
        {
          id: "ball-06-water-refill",
          durationMs: 760,
          camera: "近景·杯沿与手",
          visual: "你替她添水，她把最后一块甜点推过来。",
          line: "偏好还没问完，已经被各自记下。"
        },
        {
          id: "ball-06-closing-time",
          durationMs: 1160,
          camera: "广角·空下来的餐厅",
          visual: "服务生收走邻桌，你们面前的茶又续了一壶。",
          line: "这一顿饭结束很久，话还没有说完。"
        }
      ]
    },
    {
      number: 7,
      id: "official-date",
      name: "正式约会",
      stage: 3,
      stageId: "intentional-dates",
      meaning: "双方明确以约会为目的，认真安排一段只属于彼此的时间。",
      variants: [
        {
          id: "ball-07-calendar-invite",
          durationMs: 820,
          camera: "特写·日历邀请",
          visual: "周六晚上的时间被确认，地点也认真选好。",
          line: "这次不是顺路，是一场说清楚的约会。"
        },
        {
          id: "ball-07-gallery-walk",
          durationMs: 1080,
          camera: "侧跟·展厅长廊",
          visual: "你们在同一幅画前停下，肩膀保持着舒服的距离。",
          line: "被安排好的见面，反而从容得像一次散步。"
        },
        {
          id: "ball-07-ticket-stubs",
          durationMs: 1180,
          camera: "俯拍·并排的票根",
          visual: "散场后票根还在桌上，你们已经谈到下一次。",
          line: "约会没有刻意浪漫，只让彼此更确定了一点。"
        }
      ]
    },
    {
      number: 8,
      id: "confession",
      name: "告白",
      stage: 4,
      stageId: "spoken-heart",
      meaning: "把心意说清，也给对方从容回答的空间。",
      variants: [
        {
          id: "ball-08-cue-rest",
          durationMs: 960,
          camera: "特写·落下的球杆",
          visual: "球杆轻靠桌沿，你终于转身正对着她。",
          line: "绕了很久的话，开口时只剩一句喜欢。"
        },
        {
          id: "ball-08-rooftop-wind",
          durationMs: 1240,
          camera: "双人中景·天台风",
          visual: "风掀起她的发梢，你把后半句话完整说完。",
          line: "这一次，你没有把认真藏进玩笑。"
        },
        {
          id: "ball-08-held-gaze",
          durationMs: 1380,
          camera: "缓推·停住的目光",
          visual: "城市灯点逐渐虚化，只留下她安静的眼睛。",
          line: "答案之前，你先把沉默留给她。"
        }
      ]
    },
    {
      number: 9,
      id: "holding-hands",
      name: "牵手",
      stage: 5,
      stageId: "confirmed-love",
      meaning: "确认关系后第一次牵手，让亲密得到自然回应。",
      variants: [
        {
          id: "ball-09-sleeve-touch",
          durationMs: 720,
          camera: "特写·袖口轻触",
          visual: "指尖先碰到衣袖，她没有避开。",
          line: "牵手以前，你们都停了一瞬。"
        },
        {
          id: "ball-09-crosswalk-hold",
          durationMs: 940,
          camera: "中景·转角车流",
          visual: "过街时她握住你的手腕，随后慢慢滑到掌心。",
          line: "车流过去，手还留在原处。"
        },
        {
          id: "ball-09-palm-warmth",
          durationMs: 1080,
          camera: "俯拍·掌心与路灯",
          visual: "两只手在暖光里扣紧，步伐恢复平常。",
          line: "没有谁宣布什么，只是都没有松开。"
        }
      ]
    },
    {
      number: 10,
      id: "embrace",
      name: "拥抱",
      stage: 5,
      stageId: "confirmed-love",
      meaning: "在重逢、安慰与告别时，用拥抱确认彼此的依靠。",
      variants: [
        {
          id: "ball-10-doorway-reunion",
          durationMs: 920,
          camera: "中景·门口重逢",
          visual: "她推门进来，你们相视一笑后自然抱住彼此。",
          line: "几天没见，拥抱先替问候落了地。"
        },
        {
          id: "ball-10-quiet-comfort",
          durationMs: 1180,
          camera: "近景·肩侧暖灯",
          visual: "她问可以抱你吗，得到点头才轻轻靠近。",
          line: "难过没有被劝走，只被安静接住。"
        },
        {
          id: "ball-10-platform-goodbye",
          durationMs: 1060,
          camera: "侧景·站台将发的车",
          visual: "提示音响起，她在上车前回身抱了你一下。",
          line: "拥抱很短，足够把想念留到再见。"
        }
      ]
    },
    {
      number: 11,
      id: "traveling-together",
      name: "共同旅行",
      stage: 5,
      stageId: "confirmed-love",
      meaning: "第一次共同旅行，在陌生环境中看见更完整的彼此。",
      variants: [
        {
          id: "ball-11-train-window",
          durationMs: 980,
          camera: "双人侧景·列车窗边",
          visual: "城市退到窗后，她靠着你睡过一站。",
          line: "旅程刚开始，疲惫已经可以放心交给彼此。"
        },
        {
          id: "ball-11-folded-map",
          durationMs: 1120,
          camera: "俯拍·被风吹动的地图",
          visual: "你们在岔路前重新折地图，最后选了都没走过的方向。",
          line: "偶尔走错也没关系，同行的人还在身边。"
        },
        {
          id: "ball-11-hotel-morning",
          durationMs: 1260,
          camera: "广角·旅店清晨",
          visual: "行李散在椅边，两杯咖啡对着陌生城市醒来。",
          line: "共同旅行没有滤镜，也因此更像真实生活。"
        }
      ]
    },
    {
      number: 12,
      id: "facing-differences",
      name: "面对分歧",
      stage: 6,
      stageId: "learning-together",
      meaning: "关系中的真实分歧浮现，双方不再用默契代替表达。",
      variants: [
        {
          id: "ball-12-diverging-balls",
          durationMs: 860,
          camera: "俯拍·反向滚动",
          visual: "两颗球擦肩后滚向桌面两端，速度渐慢。",
          line: "意见落在两边，谁都没有假装无所谓。"
        },
        {
          id: "ball-12-cold-tea",
          durationMs: 1120,
          camera: "静物·凉下来的茶",
          visual: "桌上两杯茶不再冒气，门却始终没有关。",
          line: "沉默很重，但你们都还在场。"
        },
        {
          id: "ball-12-conflicting-plans",
          durationMs: 1240,
          camera: "对切·两份日程",
          visual: "两张计划表摊在桌上，重要日期没有重合。",
          line: "分歧不是不爱，只是彼此都有不能略过的生活。"
        }
      ]
    },
    {
      number: 13,
      id: "talking-and-reconciling",
      name: "沟通和好",
      stage: 6,
      stageId: "learning-together",
      meaning: "把分歧与感受说清，在理解边界后重新靠近。",
      variants: [
        {
          id: "ball-13-returned-seat",
          durationMs: 1260,
          camera: "固定中景·重新坐下",
          visual: "她拉开椅子坐回对面，你先把语速放慢。",
          line: "后来谈的不是输赢，是彼此哪里受了伤。"
        },
        {
          id: "ball-13-honest-apology",
          durationMs: 1180,
          camera: "双人近景·视线重新相接",
          visual: "你们各自道歉，也各自保留需要坚持的部分。",
          line: "和好不是略过分歧，而是终于听懂了对方。"
        },
        {
          id: "ball-13-reheated-dinner",
          durationMs: 1360,
          camera: "侧景·重新亮起的餐桌灯",
          visual: "凉掉的晚餐重新加热，两把椅子挪近了一点。",
          line: "话说完以后，你们仍愿意一起吃完这顿饭。"
        }
      ]
    },
    {
      number: 14,
      id: "discussing-future",
      name: "谈论未来",
      stage: 7,
      stageId: "shared-future",
      meaning: "把未来拆成可以共同讨论、协商与承担的选择。",
      variants: [
        {
          id: "ball-14-city-map",
          durationMs: 960,
          camera: "俯拍·摊开的地图",
          visual: "两种颜色的笔圈住同一片街区。",
          line: "你们第一次认真讨论，要在哪座城生活。"
        },
        {
          id: "ball-14-kitchen-budget",
          durationMs: 1220,
          camera: "中景·厨房桌面",
          visual: "计算器停下，她把自己的计划推到你面前。",
          line: "以后不只是一句话，也包括账单和取舍。"
        },
        {
          id: "ball-14-blank-calendar",
          durationMs: 1080,
          camera: "推近·空白日历",
          visual: "她在来年某天画了小圈，没有写原因。",
          line: "很长的未来，先从留出一天开始。"
        }
      ]
    },
    {
      number: 15,
      id: "proposal",
      name: "求婚",
      stage: 7,
      stageId: "shared-future",
      meaning: "在共同生活的基础上提出长久承诺。",
      variants: [
        {
          id: "ball-15-quiet-ring",
          durationMs: 1180,
          camera: "特写·掌心戒指",
          visual: "戒指安静躺在掌心，没有花束遮住彼此。",
          line: "你问的不是今晚，是往后许多普通日子。"
        },
        {
          id: "ball-15-old-table",
          durationMs: 1420,
          camera: "环绕·旧球桌灯下",
          visual: "你放下球杆走近，她已经看懂你的认真。",
          line: "故事回到起点，问题终于指向一生。"
        },
        {
          id: "ball-15-open-hand",
          durationMs: 1300,
          camera: "双人近景·伸出的手",
          visual: "你没有催促，只把手留在两人之间。",
          line: "承诺说完以后，答案仍由她亲自给出。"
        }
      ]
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
      id: "ordinary-forever",
      title: "共度寻常",
      scene: "清晨照亮旧球房，两支球杆并排留在墙边。",
      line: "她点头以后，你们先笑了。余生没有定格，只是从这晚继续。",
      epilogue: "很多年后，那张球桌还在；你们谈的是明天买什么菜。",
      musicLayers: ["完整钢琴主题", "温暖弦乐和声", "清晨环境声"]
    },
    A: {
      grade: "A",
      id: "still-approaching",
      title: "仍在靠近",
      scene: "戒盒收回口袋，两个人沿着天亮的街慢慢走远。",
      line: "你们没有赶着给未来定论，只约好把下一段路认真走完。",
      epilogue: "关系仍有未答的问题，也仍有愿意留下来回答的人。",
      musicLayers: ["钢琴主题变奏", "轻刷鼓", "渐近的街声"]
    },
    B: {
      grade: "B",
      id: "kindly-apart",
      title: "各自珍重",
      scene: "球桌恢复安静，窗外两条街灯向不同方向延伸。",
      line: "后来消息停在一个普通的周二，谁都没有把曾经说成遗憾。",
      epilogue: "再想起那场雨，你仍记得有人曾认真向你走来。",
      musicLayers: ["独奏钢琴尾句", "稀薄雨声", "远去的车流"]
    }
  });

  const BALL_BY_NUMBER = Object.freeze(Object.fromEntries(
    BALLS.map((ball) => [ball.number, ball])
  ));
  const STAGE_BY_ID = Object.freeze(Object.fromEntries(
    STAGES.map((stage) => [stage.id, stage])
  ));

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

  function variantIndex(source, ballNumber, intent, timing, seed) {
    const intentOffset = intent === INTENTS.ACTIVE ? 0 : 17;
    const timingOffset = {
      [TIMINGS.EARLY]: 0,
      [TIMINGS.RIGHT]: 31,
      [TIMINGS.LATE]: 62
    }[timing];
    const sourceOffset = hashString(source.id) % 97;
    const total = normalizeSeed(seed) + ballNumber * 7 + intentOffset + timingOffset + sourceOffset;
    return total % source.variants.length;
  }

  function selectPerformance(options) {
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      throw new TypeError("options must be an object");
    }
    const ballNumber = options.ballNumber;
    const intent = options.intent === undefined ? INTENTS.ACTIVE : options.intent;
    const timing = options.timing === undefined ? TIMINGS.RIGHT : options.timing;
    const seed = options.seed === undefined ? 0 : options.seed;

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
    const index = variantIndex(source, ballNumber, intent, timing, seed);
    const variant = source.variants[index];

    return Object.freeze({
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

  return Object.freeze({
    INTENTS,
    TIMINGS,
    BALLS,
    STAGES,
    SPECIAL_EVENTS,
    ENDINGS,
    getBall,
    getStage,
    getEnding,
    selectPerformance
  });
});
