# Tetris.Ohn

A complete, playable Tetris written in [Ohnrscript](https://github.com/ohnrshyp/ohnrscript) — the same i32-only, no-GC, no-floats, no-dynamic-heap language used to build [`ohn-kernel`](https://github.com/ohnrshyp/ohnrscript/tree/main/packages-llvm/ohn-kernel).

The engine lives in one file: [`tetris.ohn`](./tetris.ohn). A small HTML/canvas shim reads engine state and paints it — the same shape of split the V-language Doom port has with SDL.

## **Play it:**

Open [`playground.built.html`](./playground.built.html) directly in a browser or `node play.js` for terminal. No server, no dependencies, no build step — one file, ~18KB, drop it anywhere. It also runs from `file://`, so you can double-click it.

**Controls:**
**←** / **→** move, **↓** soft drop, ↑ rotate clockwise, `Z` rotate counter-clockwise, `Space` hard drop, `P` pause, `R` restart.

## Architecture in one paragraph

`tetris.ohn` is one file with 37 functions, no `require()`, no arrays literals, no `switch`, no closures, no floats. The board is a 200-byte `Uint8Array` (10×20, one byte per cell). The 7 tetrominoes × 4 rotations are 28 entries in a module-level `Int32Array`, each a 16-bit mask over a 4×4 box. The RNG is a hand-rolled xorshift32 driving a Fisher-Yates 7-bag. Gravity is an integer frame counter. All arithmetic is `| 0`-cast. The compiled `tetris.js` is a 1:1 translation of the source — the V8 backend injects no runtime.

The browser shim is deliberately logic-free: it reads state via query functions (`getCell`, `getScore`, `getActivePieceType`, ...) and issues movement calls (`moveLeft`, `rotateCW`, `hardDrop`, ...). No game logic lives outside `tetris.ohn`.

## Building from source

Rebuilding `tetris.js` and `playground.built.html` requires the Ohnrscript compiler, which lives in the [main Ohnrscript repo](https://github.com/ohnrshyp/ohnrscript). Assuming a clone at `../ohnrscript` alongside this one:

`# Compile the engine to JS`
`node ../ohnrscript/compiler/scripts/compile.js tetris.ohn -o tetris.js`

`# Run the tests against the compiled output`
`npx jest`

`# Rebuild the standalone browser file`
`node build.js`

## What's in this repo

| File | What it is |
| :---- | :---- |
| tetris.ohn | The engine. 37 functions. Board, tetromino shapes (all 4 rotations), collision, movement, rotation, gravity, 7-bag randomizer (xorshift32), line-clear, scoring, leveling. Written in the strict Ohnrscript subset defined in [`developer_guide.md`](https://github.com/ohnrshyp/ohnrscript/blob/main/developer_guide.md). |
| tetris.js | Compiled output of `tetris.ohn` via the V8 backend. Generated, not hand-written — committed here because rebuilding requires the separate Ohnrscript compiler repo. |
| playground.html | The browser shim template — `<canvas>` rendering, `keydown` handlers, `requestAnimationFrame` loop calling `tick()`. |
| playground.built.html | **The hostable artifact.** `build.js` inlines the compiled engine into `playground.html` to produce this single self-contained file. |
| build.js | Node script that inlines the compiled engine into the shim template. |
| play.js  | Terminal frontend for the same engine — a second, logic-free shim reading state from `tetris.js` and painting the board with ANSI 256-color escapes. Run with `node play.js`. Requires a TTY.  |
| tests/tetris.test.js | 16 jest tests running against the compiled JS — shape integrity across all rotations, wall collisions, gravity and locking, line-clear math (including the 1200-point Tetris bonus), leveling, 7-bag correctness, game-over handling. |
