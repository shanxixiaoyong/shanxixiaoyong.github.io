(function (root, factory) {
  const stories = factory();
  if (typeof module === "object" && module.exports) module.exports = stories;
  if (root) root.Love2048Stories = stories;
})(typeof window !== "undefined" ? window : globalThis, function () {
  function freezeBand(items) {
    return Object.freeze(items.map((item) => Object.freeze(item)));
  }

  const positiveBands = Object.freeze({
    near: freezeBand([
      {
        id: "positive-near-rain-walk",
        title: "雨夜同路",
        line: "骤雨把街灯揉成一片暖黄，TA把伞悄悄向你倾斜。两个人绕过积水，谁也没有提醒这条路其实早该分开。",
        mood: "rain",
        backdrop: "rain",
        atmosphere: "rain"
      },
      {
        id: "positive-near-extra-ticket",
        title: "多出的一张票",
        line: "TA说朋友临时来不了，指间那张票便有了你的名字。散场后你们还在谈最后一幕，像舍不得让今晚就此落幕。",
        mood: "date",
        backdrop: "city",
        atmosphere: "projector"
      },
      {
        id: "positive-near-book-note",
        title: "旧书夹页",
        line: "你借走TA读过的旧书，在夹页里发现一张写着推荐理由的纸。字迹克制又认真，恰好回答了你没问出口的话。",
        mood: "campus",
        backdrop: "campus",
        atmosphere: "pages"
      },
      {
        id: "positive-near-last-bus",
        title: "末班车靠窗",
        line: "末班车驶过安静的高架，你们并肩坐在最后一排。窗外城市不断后退，TA却把明天的早餐说得像一次郑重邀请。",
        mood: "street",
        backdrop: "city",
        atmosphere: "transit"
      },
      {
        id: "positive-near-instant-photo",
        title: "拍立得留白",
        line: "相纸慢慢显影时，你们都嫌自己笑得太傻。TA仍在照片下方留了一块空白，说等下次见面再补上日期。",
        mood: "date",
        backdrop: "cafe",
        atmosphere: "petals"
      },
      {
        id: "positive-near-cafe-refill",
        title: "续杯以后",
        line: "咖啡已经见底，窗外也换成夜色，TA却又替你添了半杯热水。话题从电影绕到童年，时间悄悄失去刻度。",
        mood: "cafe",
        backdrop: "cafe",
        atmosphere: "cafe"
      },
      {
        id: "positive-near-shared-earbud",
        title: "耳机另一边",
        line: "车厢太吵，TA把另一只耳机递给你。熟悉的歌只播放了一半，你们的肩膀轻轻相碰，谁也没有先挪开。",
        mood: "street",
        backdrop: "city",
        atmosphere: "transit"
      },
      {
        id: "positive-near-long-way-home",
        title: "绕远的晚风",
        line: "导航明明指向右边，你们却默契地沿河多走了一站。晚风把零碎的话吹得很轻，沉默也第一次显得自然。",
        mood: "starlight",
        backdrop: "starlight",
        atmosphere: "city"
      },
      {
        id: "positive-near-morning-call",
        title: "清晨来电",
        line: "你睡意未散地接起电话，TA只为分享窗外刚亮起的云。几句寻常问候之后，这一天像被提前点亮了一角。",
        mood: "chat",
        backdrop: "starlight",
        atmosphere: "phone"
      },
      {
        id: "positive-near-closing-shop",
        title: "小店关门前",
        line: "店员开始收起门外的桌椅，你们才发现已经聊到打烊。TA替你围好忘在椅背上的围巾，又约了下一次座位。",
        mood: "cafe",
        backdrop: "cafe",
        atmosphere: "cafe"
      }
    ]),
    together: freezeBand([
      {
        id: "positive-together-key",
        title: "同一把钥匙",
        line: "TA把新配的钥匙放进你掌心，没有说隆重的话。傍晚推门时屋里亮着灯，你忽然听懂了这份普通的信任。",
        mood: "home",
        backdrop: "home",
        atmosphere: "home"
      },
      {
        id: "positive-together-list",
        title: "共同清单",
        line: "你们在共享清单里写下想看的展、想吃的小店和要买的灯泡。浪漫与琐事排在一起，竟比誓言更像未来。",
        mood: "home",
        backdrop: "home",
        atmosphere: "phone"
      },
      {
        id: "positive-together-fridge-note",
        title: "冰箱便签",
        line: "清晨出门太匆忙，TA只在冰箱上留下一句记得吃饭。你傍晚回家看见歪斜的字，疲惫便有了安放之处。",
        mood: "home",
        backdrop: "home",
        atmosphere: "home"
      },
      {
        id: "positive-together-warm-porridge",
        title: "温着的粥",
        line: "退烧醒来时，厨房里还温着一小锅粥。TA伏在桌边睡着，手边压着药盒和时间表，你轻轻替TA披上外套。",
        mood: "home",
        backdrop: "home",
        atmosphere: "home"
      },
      {
        id: "positive-together-moving-boxes",
        title: "纸箱写着我们",
        line: "搬家的纸箱堆满客厅，你们蹲在地上为杯子和书分位置。忙乱到深夜，门牌后的生活终于有了复数。",
        mood: "home",
        backdrop: "home",
        atmosphere: "pages"
      },
      {
        id: "positive-together-quiet-work",
        title: "各自忙碌",
        line: "周日下午，你们在同一张桌前做各自的事。键盘声与翻页声交替响起，偶尔抬头对视，就算完成一次拥抱。",
        mood: "cafe",
        backdrop: "cafe",
        atmosphere: "pages"
      },
      {
        id: "positive-together-station-reunion",
        title: "出口的身影",
        line: "列车晚点四十分钟，你拖着行李走出闸机，第一眼仍看见TA。一路积攒的疲惫，在那个伸来的拥抱里散开。",
        mood: "date",
        backdrop: "city",
        atmosphere: "transit"
      },
      {
        id: "positive-together-balcony",
        title: "阳台晴天",
        line: "你们把洗好的床单晾上阳台，风一吹，白色布面鼓成轻软的帆。TA隔着日光看你，忽然笑说今天很好。",
        mood: "home",
        backdrop: "home",
        atmosphere: "home"
      },
      {
        id: "positive-together-dinner-introduction",
        title: "饭桌上的介绍",
        line: "朋友问起你是谁，TA自然地说出伴侣两个字，还顺手把喜欢的菜转到你面前。你低头夹菜，耳尖却慢慢热了。",
        mood: "meet",
        backdrop: "home",
        atmosphere: "cafe"
      },
      {
        id: "positive-together-ordinary-anniversary",
        title: "普通纪念日",
        line: "你们都忙到忘记准备礼物，只在下班后分了一块便利店蛋糕。塑料叉轻轻碰在一起，这一年便有了落款。",
        mood: "date",
        backdrop: "city",
        atmosphere: "petals"
      }
    ]),
    future: freezeBand([
      {
        id: "positive-future-city-map",
        title: "地图上的圆圈",
        line: "你们摊开地图，把通勤、工作和喜欢的街区逐一圈出。两个原本分开的生活半径，终于开始寻找共同圆心。",
        mood: "starlight",
        backdrop: "city",
        atmosphere: "city"
      },
      {
        id: "positive-future-travel-fund",
        title: "第一笔远行钱",
        line: "共同账户收到第一笔小小的旅行存款，数字并不起眼。你们却认真挑起目的地，仿佛海风已经吹到桌边。",
        mood: "date",
        backdrop: "cafe",
        atmosphere: "travel"
      },
      {
        id: "positive-future-balcony-space",
        title: "阳台空出一角",
        line: "看房时，TA指着朝南的阳台，说这里可以放你喜欢的椅子。尚未签下名字的房间，先替你留好了位置。",
        mood: "home",
        backdrop: "home",
        atmosphere: "home"
      },
      {
        id: "positive-future-family-visit",
        title: "带回家的点心",
        line: "去见家人前，你们绕路挑了两盒不太甜的点心。TA记得每个人的口味，也在车上轻声问你是否紧张。",
        mood: "vow",
        backdrop: "home",
        atmosphere: "travel"
      },
      {
        id: "positive-future-winter-ticket",
        title: "冬天的车票",
        line: "离冬天还有很久，你们已经订好回程相邻的座位。电子票静静躺在手机里，像一份提前抵达的陪伴。",
        mood: "starlight",
        backdrop: "starlight",
        atmosphere: "transit"
      },
      {
        id: "positive-future-shared-bookshelf",
        title: "书架的下一层",
        line: "TA量完墙角尺寸，特意把书架多留出一层。你们还没决定摆什么，却已开始想象多年后泛黄的书脊。",
        mood: "home",
        backdrop: "home",
        atmosphere: "pages"
      },
      {
        id: "positive-future-house-viewing",
        title: "周末去看房",
        line: "你们在陌生客厅里试着想象清晨的光和晚饭的香气。窗外没有电影般的景色，彼此的神情却很笃定。",
        mood: "vow",
        backdrop: "home",
        atmosphere: "home"
      },
      {
        id: "positive-future-two-cities",
        title: "两座城的答案",
        line: "工作机会落在不同城市，你们没有急着要求谁放弃。长谈后的纸上列满选择，也留下了共同承担的署名。",
        mood: "starlight",
        backdrop: "city",
        atmosphere: "city"
      },
      {
        id: "positive-future-next-year-letter",
        title: "写给明年的信",
        line: "跨年前夜，你们各自写下一封明年才能拆的信。信纸折好放进抽屉，未说出的愿望已有彼此作证。",
        mood: "starlight",
        backdrop: "starlight",
        atmosphere: "pages"
      },
      {
        id: "positive-future-slow-walk",
        title: "很久以后的散步",
        line: "路过白发夫妇牵手等灯时，TA忽然握紧了你。你们没有许诺永远，只把回家的脚步放得更慢一些。",
        mood: "vow",
        backdrop: "city",
        atmosphere: "petals"
      }
    ])
  });

  const conflictBands = Object.freeze({
    minor: freezeBand([
      {
        id: "conflict-minor-read-receipt",
        title: "消息停在已读",
        line: "你认真说完白天的委屈，消息却停在已读。直到睡前都没有回应，你开始猜测那段沉默究竟是什么意思。",
        resolution: "TA解释当时正在处理急事，也承认不该让你独自等待。你们约好忙碌时先留一句明确的回应。",
        mood: "chat",
        backdrop: "city",
        atmosphere: "phone",
        severity: "minor"
      },
      {
        id: "conflict-minor-cancelled-date",
        title: "临时改期",
        line: "你已经走到约定的街口，TA才说工作临时拖延。失望并不剧烈，却让一整天的期待突然失去去处。",
        resolution: "TA没有用下次再说敷衍，而是当晚重新确认时间并赶来见你。你也说清，提前告知比补偿更重要。",
        mood: "rain",
        backdrop: "rain",
        atmosphere: "phone",
        severity: "minor"
      },
      {
        id: "conflict-minor-sink-cups",
        title: "水池里的杯子",
        line: "又一只喝完没洗的杯子留在水池，你收拾时忽然没了耐心。真正累人的，是提醒多次仍像无人听见。",
        resolution: "TA先把积下的杯子洗净，再和你重新分配收尾习惯。小事没有被嘲笑，家也不再只靠一人维护。",
        mood: "home",
        backdrop: "home",
        atmosphere: "home",
        severity: "minor"
      },
      {
        id: "conflict-minor-ten-minutes-late",
        title: "迟到的十分钟",
        line: "TA又迟到了十分钟，进门时仍笑着说路上太堵。你沉默下来，因为被轻描淡写的从来不只是时间。",
        resolution: "TA听完后收起玩笑，开始在出门前主动报备进度。你们也约定，偶尔迟到可以，习惯性失约不行。",
        mood: "cafe",
        backdrop: "cafe",
        atmosphere: "cafe",
        severity: "minor"
      },
      {
        id: "conflict-minor-photo-post",
        title: "没问过的合照",
        line: "TA把你们的合照发到公开动态，你看到后有些不自在。那张照片很好看，却越过了你想保留的边界。",
        resolution: "TA先撤下照片，再问清你能接受的分享范围。你也说明介意的不是关系，而是希望被提前尊重。",
        mood: "chat",
        backdrop: "city",
        atmosphere: "phone",
        severity: "minor"
      },
      {
        id: "conflict-minor-weekend-plan",
        title: "排满的周末",
        line: "你以为周末会留给两个人，TA却答应了朋友的聚会。彼此都没有做错，只是期待从未被放在同一张表上。",
        resolution: "你们把各自安排摊开，先确认必须保留的独处与相处时间。临时邀请仍可接受，但不再默认对方永远有空。",
        mood: "meet",
        backdrop: "city",
        atmosphere: "phone",
        severity: "minor"
      },
      {
        id: "conflict-minor-unfinished-sentence",
        title: "没说完的话",
        line: "你刚说到最在意的部分，TA便急着给出解决办法。那些建议都很认真，却让你觉得自己的情绪没有被听完。",
        resolution: "TA停下来问你此刻需要倾听还是建议，并把没说完的话重新接住。你也更直接地表达当下需要什么。",
        mood: "chat",
        backdrop: "home",
        atmosphere: "phone",
        severity: "minor"
      },
      {
        id: "conflict-minor-shared-dessert",
        title: "最后一口甜点",
        line: "你特意留到最后的甜点被TA顺手吃掉，笑意一下停在脸上。委屈很小，却勾起许多没被留意的瞬间。",
        resolution: "TA没有说只是一口，而是重新买来一份并认真道歉。你们借这件小事说清，体贴有时就是先问一句。",
        mood: "cafe",
        backdrop: "cafe",
        atmosphere: "cafe",
        severity: "minor"
      }
    ]),
    friction: freezeBand([
      {
        id: "conflict-friction-travel-pace",
        title: "不同的旅行节奏",
        line: "你想沿街慢慢走，TA却不断催着赶往下一个景点。行程一项项完成，两个人的兴致反而越来越远。",
        resolution: "你们删掉一半打卡点，把上午留给计划、下午留给漫游。旅行不必证明效率，也允许彼此偶尔分头行动。",
        mood: "street",
        backdrop: "city",
        atmosphere: "travel",
        severity: "friction"
      },
      {
        id: "conflict-friction-social-boundary",
        title: "热闹之外",
        line: "TA习惯把你带进每场聚会，你却常在人群里耗尽力气。几次婉拒被当成不合群，亲近开始变成负担。",
        resolution: "TA不再替你答应邀约，也会提前说明人数和时长。你愿意参加重要场合，同时保留安静离开的权利。",
        mood: "meet",
        backdrop: "city",
        atmosphere: "city",
        severity: "friction"
      },
      {
        id: "conflict-friction-spending",
        title: "账单上的分歧",
        line: "TA觉得纪念日就该住更好的酒店，你却担心下月支出。谁都不是小气，只是安全感落在不同地方。",
        resolution: "你们列出共同预算，也各自保留无需解释的额度。值得庆祝的日子继续庆祝，但不再靠超支证明心意。",
        mood: "home",
        backdrop: "home",
        atmosphere: "travel",
        severity: "friction"
      },
      {
        id: "conflict-friction-housework",
        title: "看不见的家务",
        line: "地面总有人拖，日用品也总有人补齐，TA却以为家会自然整洁。你的疲惫来自那些从未被计算的操心。",
        resolution: "你们把采购、清洁和记账一并列出，按时间而非性别分配。TA开始主动发现任务，你也不再担任提醒者。",
        mood: "home",
        backdrop: "home",
        atmosphere: "home",
        severity: "friction"
      },
      {
        id: "conflict-friction-work-overtime",
        title: "被工作挤走的晚上",
        line: "连续几个晚上，TA都抱着电脑坐到深夜。你理解项目紧急，却不愿每次开口都只能收到再等等。",
        resolution: "TA说明忙碌会持续多久，并划出不被工作占用的晚餐时间。你不再猜测期限，也愿意陪TA度过高峰。",
        mood: "home",
        backdrop: "home",
        atmosphere: "phone",
        severity: "friction"
      },
      {
        id: "conflict-friction-cooling-off",
        title: "沉默的时长",
        line: "争执后你想立刻说清，TA却需要独处。一个不断追问，一个关上房门，焦虑与压力同时被放大。",
        resolution: "你们约定暂停前说明多久后再谈，并确保按时回来。空间不再像逃避，等待也不再没有尽头。",
        mood: "rain",
        backdrop: "rain",
        atmosphere: "home",
        severity: "friction"
      },
      {
        id: "conflict-friction-family-visits",
        title: "频繁的家庭聚餐",
        line: "TA默认每个周末都该回家吃饭，你却需要休息，也不习惯总被问起私人计划。拒绝几次后气氛渐渐发紧。",
        resolution: "TA向家人解释边界，不再把出席当作关系考核。你们共同选择重要聚会，也为自己的周末留下余地。",
        mood: "home",
        backdrop: "home",
        atmosphere: "cafe",
        severity: "friction"
      },
      {
        id: "conflict-friction-alone-time",
        title: "关上的书房门",
        line: "你想安静读完一本书，TA却把独处理解成疏远。越是追问是不是不开心，你越难找到喘息的空间。",
        resolution: "你说明独处是恢复精力，不是撤回感情。TA学会尊重关门的时刻，你也会明确何时再回到彼此身边。",
        mood: "campus",
        backdrop: "home",
        atmosphere: "pages",
        severity: "friction"
      }
    ]),
    deep: freezeBand([
      {
        id: "conflict-deep-city-choice",
        title: "城市的两端",
        line: "你的机会在南方，TA的事业刚在北方站稳。地图上的距离不再浪漫，每个选择都意味着真实的放弃。",
        resolution: "你们分别写下不可让步与可调整的部分，再约定半年评估期。决定暂未完美，但代价由两个人共同承担。",
        mood: "starlight",
        backdrop: "city",
        atmosphere: "city",
        severity: "deep"
      },
      {
        id: "conflict-deep-family-boundary",
        title: "门内门外",
        line: "TA的家人频繁介入你们的决定，从住处到节日安排都有意见。TA的沉默让你觉得自己始终站在门外。",
        resolution: "TA先向家人明确共同生活由你们决定，再与你商量需要保留的联系。边界由TA出面建立，你不再独自抵挡。",
        mood: "home",
        backdrop: "home",
        atmosphere: "home",
        severity: "deep"
      },
      {
        id: "conflict-deep-parenthood",
        title: "关于孩子的答案",
        line: "谈到是否要孩子，你们第一次发现期待并不相同。这不是靠迁就就能过去的话题，餐桌因此安静很久。",
        resolution: "你们暂停催促彼此，分别梳理愿望、恐惧与现实条件，并约定持续讨论，必要时寻求专业咨询。",
        mood: "starlight",
        backdrop: "home",
        atmosphere: "home",
        severity: "deep"
      },
      {
        id: "conflict-deep-career-turn",
        title: "突然的职业转弯",
        line: "TA想辞去稳定工作重新读书，你担心收入与计划被打乱。支持梦想和守住生活，一时像两条相反的路。",
        resolution: "你们把学费、储蓄和最坏情况算清，设定可承受的期限。尝试仍被尊重，风险也不再只落在你身上。",
        mood: "home",
        backdrop: "home",
        atmosphere: "pages",
        severity: "deep"
      },
      {
        id: "conflict-deep-financial-duty",
        title: "没有说过的负担",
        line: "你偶然发现TA长期承担家里的债务，而共同储蓄始终停滞。隐瞒比数字更刺痛，也让未来忽然失焦。",
        resolution: "TA完整说明金额与期限，并同家人重谈承担范围。你们重做共同预算，信任从持续透明而非一次保证开始。",
        mood: "rain",
        backdrop: "rain",
        atmosphere: "phone",
        severity: "deep"
      },
      {
        id: "conflict-deep-long-distance",
        title: "异地没有期限",
        line: "视频通话仍然准时，可下一次生活在一起的日期始终空白。没有终点的等待，正慢慢磨损最初的耐心。",
        resolution: "你们不再只说坚持，而是确定求职、调动和搬迁的节点。若期限内无法靠近，也诚实评估各自选择。",
        mood: "chat",
        backdrop: "city",
        atmosphere: "phone",
        severity: "deep"
      },
      {
        id: "conflict-deep-caregiving",
        title: "照护的重量",
        line: "家人生病后，TA把全部时间投入照护，你们的生活骤然停摆。你理解责任，也害怕自己的疲惫显得自私。",
        resolution: "你们请亲友共同排班，也寻找可负担的支持服务。TA允许你表达疲惫，你则明确能承担的时间与方式。",
        mood: "home",
        backdrop: "home",
        atmosphere: "home",
        severity: "deep"
      },
      {
        id: "conflict-deep-commitment-timeline",
        title: "不同步的时间表",
        line: "你希望关系走向更明确的承诺，TA却总说再等等。模糊的未来让每次纪念日都带上一点不安。",
        resolution: "TA说清犹豫来自什么，你也坦白自己能等待多久。你们定下再次讨论的日期，不用空泛承诺拖延答案。",
        mood: "vow",
        backdrop: "starlight",
        atmosphere: "pages",
        severity: "deep"
      }
    ])
  });

  function pickFromBands(bands, key, fallbackKey, random) {
    const selectedKey = typeof key === "string" && Object.hasOwn(bands, key) ? key : fallbackKey;
    const items = bands[selectedKey].length ? bands[selectedKey] : bands[fallbackKey];
    const nextRandom = typeof random === "function" ? random : Math.random;
    const roll = Number(nextRandom());
    const boundedRoll = Number.isFinite(roll)
      ? Math.max(0, Math.min(1 - Number.EPSILON, roll))
      : 0;
    return items[Math.floor(boundedRoll * items.length)];
  }

  function pickPositive(band, random) {
    return pickFromBands(positiveBands, band, "near", random);
  }

  function pickConflict(severity, random) {
    return pickFromBands(conflictBands, severity, "minor", random);
  }

  return Object.freeze({
    positiveBands,
    conflictBands,
    pickPositive,
    pickConflict
  });
});
