# Love 2048 Milestone Cinematics

## Objective

Make the next unseen relationship stage the emotional reward of play. Only a first-time highest-stage merge receives a full-screen event cinematic. Repeated-stage merges remain fast, readable, and free of narrative subtitles.

## Event gating

- A milestone is a merged value that is higher than every value reached earlier in the current run.
- If one move creates several merged values, only the highest new value may trigger a cinematic.
- The event scene is randomly selected only after a milestone is confirmed.
- Repeated-stage merges do not call the narrative picker, do not update the current story, do not create memories, and do not create bloom or danmaku text.
- Restart resets milestone discovery to the initial value `2`.

## Milestone cinematic

- Duration: approximately 2.6 seconds, pointer-transparent so the gesture flow is not blocked.
- Center composition: relationship stage, event title, and the complete event description.
- Backdrop selection derives from event title, description, mood, and tone.
- Backdrop families: rainy night, evening cafe, campus/library, city night, warm home, and starlight/vow.
- Each family uses its own local raster backdrop plus lightweight CSS weather/light layers.
- The existing particle engine provides a short celebration only during milestone cinematics.
- The cinematic must clean itself up fully when replaced, restarted, or the game is destroyed.

## Repeated merge feedback

- Keep the destination heart collision animation.
- Add only a short local sparkle/burst at the highest repeated merge destination.
- No full-screen layer, center title, event line, story-card update, mood change, memory entry, or danmaku.

## Input and render performance

- Keep 16 board cell elements alive instead of replacing the entire board HTML on every move.
- Only rebuild a cell's heart SVG when its value changes.
- Cache relative cell geometry for movement effects and invalidate it only when board dimensions change.
- Movement ghosts use a lightweight one-path heart rather than cloning the complete jewel SVG.
- Remove the per-move swipe-trace DOM effect.
- Throttle touch-position/tilt writes to one `requestAnimationFrame` and cache the board rectangle from pointer down.
- Disable continuous ambient particles; particles run only for merge bursts and milestone celebrations.
- Cap canvas DPR and particle count for the 430 x 932 mobile target.

## Acceptance criteria

- First-time stage merge creates exactly one `.love-cinematic-scene` containing `scene.line` and a scene-specific backdrop key.
- Repeating the same stage creates no cinematic, bloom, danmaku, or story mutation.
- Rapid valid and blocked swipes remain responsive and never create duplicate motion/cinematic layers.
- The board remains 418 x 418 at the 430 x 932 reference viewport with no horizontal overflow.
- All existing merge, blocked-input spawn, restart, score, and game-over behavior remains intact.

