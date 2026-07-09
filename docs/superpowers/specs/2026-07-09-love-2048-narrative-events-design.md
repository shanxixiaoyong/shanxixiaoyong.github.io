# Love 2048 Narrative Events Design

## Goal

Rebuild `game-2048.html` as a pure 2048 game where romance is expressed through merge animations and randomized story events. The player should only need to understand swipe, merge matching numbers, and reach `2048 双向奔赴`.

## Player Model

The game is no longer a relationship management system. It has no special event cells, no resource economy, and no action buttons other than restart and a lightweight story log. The romance layer is presentation only: every successful merge can trigger a short novel-like scene tied to the merged stage.

## Stage Line

- `2 初见`
- `4 有好感`
- `8 暧昧`
- `16 第一次约会`
- `32 确认关系`
- `64 热恋期`
- `128 磨合期`
- `256 信任建立`
- `512 共同生活`
- `1024 未来计划`
- `2048 双向奔赴`
- `4096 十年纪念`
- `8192 白发相册`

## Event Pools

Each stage has several scene variants. A merge chooses one at random from the destination stage, records it in the current run story, and shows it in the bottom story card.

### 初见

- 雨停便利店：你们同时站在门口等雨小，谁都没有先走。
- 图书馆错拿书：伸手拿到同一本书时，你们都笑了一下。
- 地铁对视：车厢轻轻一晃，目光刚好碰上。
- 朋友聚会：热闹里突然记住了一个安静的人。
- 楼下晚风：一句普通问候，被你记了很久。

### 有好感

- 等消息：手机亮了一下，你比想象中更快拿起来。
- 记住喜好：TA 随口说过的口味，你竟然记住了。
- 偶遇绕路：明明不顺路，还是想从那边经过。
- 点赞停留：一个普通动态，你看了不止一遍。
- 小心试探：一句玩笑话里藏着一点认真。

### 暧昧

- 正在输入：那几个字闪了又停，心也跟着停了一下。
- 晚安多一秒：晚安发出后，你们都没有立刻退出聊天。
- 表情包互传：奇怪的是，连无聊都变得好玩。
- 深夜长聊：窗外安静下来，聊天框还亮着。
- 约饭试探：一句“改天一起吃饭”变得不像客套。

### 第一次约会

- 咖啡馆：杯子轻碰，暖灯落在桌面上。
- 电影散场：电影一般，但散场后的路走得很慢。
- 雨天共享伞：伞不算大，距离却刚刚好。
- 夜市灯火：人群很吵，你却听得清 TA 说话。
- 公园长椅：风吹过树影，你们聊到天色暗下来。
- 书店角落：翻页声很轻，连沉默都不尴尬。

### 确认关系

- 路口告白：红灯很长，足够把话说完。
- 花束递出：花有点歪，但心意很认真。
- 天台晚风：城市很远，眼前的人很近。
- 聊天记录：那句“我们试试看吧”停在屏幕中央。
- 牵手确认：没有夸张台词，只是手没有再松开。

### 热恋期

- 烟花夜：烟花亮起时，你们同时看向对方。
- 旅行车票：目的地不重要，一起出发比较重要。
- 合照贴纸：相册里开始频繁出现两个人。
- 拥抱重逢：见面前的路都显得太长。
- 纪念小物：一个不起眼的小东西，被认真收好。

### 磨合期

- 雨窗沉默：你们第一次不知道该先说什么。
- 小争执：吵的不是那件小事，而是没说出口的在意。
- 道歉消息：删删改改很久，最后只发出一句真心话。
- 情绪冷却：过了一会儿，你们终于愿意好好听对方说。
- 重新靠近：不是没有分歧，是没有转身离开。

### 信任建立

- 深夜长谈：真正的问题被慢慢摊开。
- 共享伞：这次不是浪漫，是一种被照顾的安心。
- 坦白过去：说出来之后，反而轻松了一点。
- 等待归来：有人为你留着灯，关系就有了重量。
- 低谷陪伴：没有解决一切，但没有让对方一个人。

### 共同生活

- 同一把钥匙：门打开时，灯已经亮着。
- 早餐热气：平淡的一天，从给对方留一份开始。
- 阳台植物：你们一起养活了一盆小小的绿意。
- 同款拖鞋：生活的痕迹开始成双出现。
- 台灯夜话：没有轰轰烈烈，但很踏实。

### 未来计划

- 地图标记：那些没去过的地方，被认真圈起来。
- 日历约定：未来第一次有了具体日期。
- 城市夜景：你们讨论以后，也讨论现实。
- 共同目标：不是完全一样的人，却愿意往同一边走。
- 车票远方：路还很长，但这次不是一个人。

### 双向奔赴

- 相册翻页：每一页都不是完美，却都真实。
- 桃花满屏：那些靠近、争执、和好，终于长成答案。
- 家的灯：远处有灯，身边有人。
- 长路同行：不是童话结尾，是一起继续生活。
- 星光心形：你们没有成为完美的人，只是更愿意理解彼此。

## Merge Presentation

Every merge has three layers:

1. Board layer: the destination tile pulses, the number bounces, heart glow expands, petals radiate from the merged cell.
2. Atmosphere layer: the board and page receive a temporary mood class derived from the stage theme, such as `mood-date`, `mood-rain`, `mood-home`, or `mood-starlight`.
3. Story layer: a compact bottom card shows `stage · scene title` and a one-sentence narrative line. It fades in without blocking swipes.

## Mobile Layout

The target viewport is `430 × 932 CSS px`.

- Header: small back button, title, score.
- Hero status strip: `目标：合成 2048 双向奔赴` plus `最高：当前最高阶段`.
- Board: centered and dominant, no side panels.
- Bottom: one story card and a two-button footer (`重遇`, `回忆`).
- Hidden from initial UI: resources, relationship-management meta tags, chapter/duo/task controls, event-cell hints.

## Acceptance Evidence

- Static validator fails if old resource systems or event cells remain.
- Static validator requires narrative event pools, merge story selection, mood classes, story card rendering, and simplified controls.
- Browser smoke test at `430 × 932` shows no horizontal overflow, one board, story card visible, and no console errors.
- Public GitHub Pages URL serves the updated HTML, JS, and CSS.
