# Tetris.Ohn

A playable Tetris written in [Ohnrscript](https://github.com/ohnrshyp/ohnrscript) — the same i32-only, no-GC, no-floats, no-dynamic-heap language used to build [`ohn-kernel`](https://github.com/ohnrshyp/ohnrscript/tree/main/packages-llvm/ohn-kernel).

The engine lives in one file: [`tetris.ohn`](./tetris.ohn). A small HTML/canvas shim reads engine state and paints it — the same shape of split the V-language Doom port has with SDL.

## **Play it:**

Open [`playground.built.html`](./playground.built.html) directly in a browser or `node play.js` for terminal. No server, no dependencies, no build step — one file, ~21KB, drop it anywhere. It also runs from `file://`, so you can double-click it.


**Controls:**

&emsp; `P` pause &ensp; `R` restart &ensp; `←` / `→` move &ensp; `↓` soft drop &ensp; `↑` rotate clockwise &ensp; `Z` rotate counter-clockwise &ensp; `Space` hard drop

<table>
  <tr>
    <td valign="top" width="57%">
      <img width="100%" alt="Tetris Still picture" src="https://github.com/user-attachments/assets/b255ecb8-eb14-4f3d-91f3-ec1c59dcd8bf" />
    </td>
    <td valign="top" width="43%">
       <h2>Architecture in one paragraph</h2>
      <p>
        <code>tetris.ohn</code> is one file with 44 functions, no <code>require()</code>, no arrays literals, no <code>switch</code>, no closures, no floats. The board is a 200-byte <code>Uint8Array</code> (10×20, one byte per cell).
      </p>
      <br>
      <p>
        The 7 tetrominoes × 4 rotations are 28 entries in a module-level <code>Int32Array</code>, each a 16-bit mask over a 4×4 box. The RNG is a hand-rolled xorshift32 driving a Fisher-Yates 7-bag. Gravity is an integer frame counter driven by the authentic NES frames-per-row table, reaching 1 frame/row at game level 30 — the NES level-29 "killscreen" equivalent. Colors are packed <code>0xRRGGBB</code> in a third arena. All arithmetic is <code>| 0</code>-cast.
      </p>
      <br>
      <p>
        The compiled <code>tetris.js</code> is a 1:1 translation of the source — the V8 backend injects no runtime. The browser shim is deliberately logic-free: it reads state via query functions (<code>getCell</code>, <code>getScore</code>, <code>getActivePieceType</code>, ...) and issues movement calls (<code>moveLeft</code>, <code>rotateCW</code>, <code>hardDrop</code>, ...). Game logic lives entirely in <code>tetris.ohn</code>.
      </p>
    </td>
  </tr>
</table>

## Building from source

Rebuilding `tetris.js` and `playground.built.html` requires the Ohnrscript compiler, which lives in the [main Ohnrscript repo](https://github.com/ohnrshyp/ohnrscript). `build.js` resolves the compiler at `../compiler/scripts/compile.js`, so it expects **this repo to sit one directory inside an Ohnrscript clone**.

From the `Tetris/` directory:

`# Compile the engine to JS`
`node ../compiler/scripts/compile.js tetris.ohn -o tetris.js`

`# Run the tests against the compiled output`
`npx jest --rootDir .`

`# Rebuild the standalone browser file (compiles, then inlines)`
`node build.js`

Two notes. `node build.js` does the compile step itself, so it's the only command you need for a full rebuild. And `--rootDir .` matters: this repo has no `package.json`, so a bare `npx jest` resolves its root to the enclosing Ohnrscript clone and runs that repo's compiler tests alongside these.

## What's in this repo

| File | What it is |
| :---- | :---- |
| tetris.ohn | The engine. 44 functions. Board, tetromino shapes (all 4 rotations), collision, movement, rotation, NES gravity table, 7-bag randomizer (xorshift32), line-clear, scoring, leveling, packed color palette. Written in the strict Ohnrscript subset defined in [`developer_guide.md`](https://github.com/ohnrshyp/ohnrscript/blob/main/developer_guide.md). |
| tetris.js | Compiled output of `tetris.ohn` via the V8 backend. Generated, not hand-written — committed here because rebuilding requires the separate Ohnrscript compiler repo. |
| playground.html | The browser shim template — `<canvas>` rendering, `keydown` handlers, `requestAnimationFrame` loop calling `tick()`. |
| playground.built.html | **The hostable artifact.** `build.js` inlines the compiled engine into `playground.html` to produce this single self-contained file. |
| build.js | Node script that inlines the compiled engine into the shim template. |
| play.js  | Terminal frontend for the same engine — a second, logic-free shim reading state from `tetris.js` and painting the board with ANSI 256-color escapes. Run with `node play.js`. Requires a TTY.  |
| tests/ | 62 jest tests running against the compiled JS. `tetris.test.js` (22) — shape integrity across all rotations, wall collisions, gravity and locking, line-clear math (including the 1200-point Tetris bonus), leveling, 7-bag correctness, game-over handling. `gravity.test.js` (8) — the NES frames-per-row table, including the clamp past level 30. `whitelist.test.js` (28) — runs the built file's engine in a bare `vm` and asserts the browser only ever sees the renderer-facing API. `colors.test.js` (4) — the packed `0xRRGGBB` palette. |
