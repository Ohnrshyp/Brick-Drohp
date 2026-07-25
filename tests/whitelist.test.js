// whitelist.test.js
// Extracts the engine <script> from playground.built.html, runs it in a
// bare vm context with a stub `window`, and asserts the export surface.
// Run `node build.js` before jest so the built file is fresh.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const BUILT = path.join(__dirname, '..', 'playground.built.html');

function loadBrowserApi() {
    const html = fs.readFileSync(BUILT, 'utf8');
    // The file's header comment mentions `<script id="engine">` verbatim, and a
    // non-greedy match starting there runs past the real tag to its closing
    // </script> — so it captures comment prose and fails to parse. Both the
    // real open and close tags sit at column 0; the comment's mention is
    // indented, so anchoring to line-start picks out the genuine block.
    const m = html.match(/^<script id="engine">$\r?\n([\s\S]*?)^<\/script>$/m);
    if (!m) throw new Error('engine script tag not found in playground.built.html');
    const src = m[1];
    if (!src.includes('window.OhnrscriptTetris')) {
        throw new Error('matched a script tag that does not assign window.OhnrscriptTetris');
    }
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(src, sandbox);
    return sandbox.window.OhnrscriptTetris;
}

const ALLOWED = [
    'initGame', 'reset',
    'moveLeft', 'moveRight', 'rotateCW', 'rotateCCW',
    'softDrop', 'hardDrop', 'tick',
    'togglePause', 'isPaused',
    'getCell', 'getNextCell', 'getPieceColor',
    'getBoardWidth', 'getBoardHeight',
    'getScore', 'getLevel', 'getLinesCleared',
    'getActivePieceType', 'getNextPieceType', 'isGameOver',
];

const BLOCKED = [
    'main', 'getShapeBit', 'checkCollision',
    'debugSetCell', 'debugClearLines', 'getTickThreshold',
];

describe('browser export whitelist (playground.built.html)', () => {
    const api = loadBrowserApi();

    test.each(ALLOWED)('%s is exposed as a function', (name) => {
        expect(typeof api[name]).toBe('function');
    });

    test.each(BLOCKED)('%s is NOT reachable from the browser', (name) => {
        expect(typeof api[name]).toBe('undefined');
    });
});
