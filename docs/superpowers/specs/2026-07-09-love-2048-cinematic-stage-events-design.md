# Love 2048 Cinematic Stage Events Design

## Goal

Make `桃花心动 2048` remain immediately understandable as 2048 while making each merge feel like a relationship scene. The player swipes, equal numbers merge, and the game shows a stage-appropriate cinematic story in the center of the board.

## Core Rules

- Gameplay stays pure 2048: no resource meters, no special event tiles, no side actions.
- Every valid input may spawn a tile if the board has empty space. If a swipe cannot move or merge anything, it still spawns a new tile instead of doing nothing.
- New tiles prefer the top row. If the top row is full, generation falls back to any empty cell.
- A failed input on a full board does not spawn a tile.
- The target viewport is `430 x 932 CSS px` in portrait orientation.

## Stage Line

The old relationship arc was too coarse before confirmation and before long-term commitment. The new stage line adds finer steps while keeping powers of two:

- `2 初见`
- `4 记住`
- `8 有好感`
- `16 试探`
- `32 暧昧`
- `64 约见`
- `128 第一次约会`
- `256 频繁联系`
- `512 心照不宣`
- `1024 告白前夜`
- `2048 确认关系`
- `4096 热恋期`
- `8192 磨合期`
- `16384 稳定相处`
- `32768 见过朋友`
- `65536 共同旅行`
- `131072 同居日常`
- `262144 见过家人`
- `524288 谈及婚姻`
- `1048576 求婚时刻`
- `2097152 婚礼之前`
- `4194304 长久相爱`

## Event Density

Early stages need more variety because they appear most often:

- `2` through `128`: at least eight scene variants each.
- `256` through `2048`: at least six scene variants each.
- `4096` and above: at least four scene variants each.

Each event has:

- `title`: short scene title.
- `line`: detailed one-to-two sentence description shown in the center.
- `mood`: board/page atmosphere class.
- `effect`: particle bloom style.
- `tone`: small category such as `meet`, `chat`, `date`, `rain`, `home`, or `vow`.

## Merge Presentation

When a merge creates a destination value:

1. Pick a random scene from that destination stage.
2. Update the bottom story card and memory drawer.
3. Show a centered cinematic overlay on the board for about two seconds.
4. Apply a matching board mood: campus, chat glow, cafe, rainy window, street lights, home lamp, starlight, or vow.
5. Trigger a cell bloom at the merged tile location.

The overlay must not permanently block touch controls. It is `pointer-events: none`, short-lived, and visually centered.

## Acceptance Evidence

- Validator detects the blocked-swipe spawn rule, top-row preferred generation, expanded stage line, dense early event pools, and centered scene overlay.
- Validator rejects old relationship-management systems and special event cells.
- Browser check at `430 x 932` verifies no horizontal overflow, board remains usable, and a center story overlay appears after a merge.
- Public GitHub Pages serves the updated HTML, JS, and CSS.
