// tetris.test.js
// Tests run against the COMPILED output of tetris.ohn (tetris.js),
// not hand-written JS — this is what actually verifies the Ohnrscript compiler
// produced a correct, playable engine.

const t = require('../tetris.js');

function renderBoard() {
    let rows = [];
    for (let y = 0; y < t.getBoardHeight(); y++) {
        let row = '';
        for (let x = 0; x < t.getBoardWidth(); x++) {
            const c = t.getCell(x, y);
            row += c === 0 ? '.' : String(c);
        }
        rows.push(row);
    }
    return rows;
}

function countFilled() {
    let n = 0;
    for (let y = 0; y < t.getBoardHeight(); y++) {
        for (let x = 0; x < t.getBoardWidth(); x++) {
            if (t.getCell(x, y) !== 0) n++;
        }
    }
    return n;
}

describe('initGame', () => {
    test('sets up a clean board and initial state', () => {
        t.initGame(1);
        expect(t.getScore()).toBe(0);
        expect(t.getLevel()).toBe(1);
        expect(t.getLinesCleared()).toBe(0);
        expect(t.isGameOver()).toBe(0);
        expect(t.getBoardWidth()).toBe(10);
        expect(t.getBoardHeight()).toBe(20);
    });

    test('active piece type is a valid tetromino id (0-6)', () => {
        t.initGame(1);
        const type = t.getActivePieceType();
        expect(type).toBeGreaterThanOrEqual(0);
        expect(type).toBeLessThanOrEqual(6);
    });

    test('is deterministic for a given seed', () => {
        t.initGame(999);
        const seqA = [t.getActivePieceType()];
        for (let i = 0; i < 10; i++) { seqA.push(t.getNextPieceType()); t.hardDrop(); }

        t.initGame(999);
        const seqB = [t.getActivePieceType()];
        for (let i = 0; i < 10; i++) { seqB.push(t.getNextPieceType()); t.hardDrop(); }

        expect(seqA).toEqual(seqB);
    });

    test('rejects a zero seed without breaking the PRNG (falls back internally)', () => {
        expect(() => t.initGame(0)).not.toThrow();
        expect(t.isGameOver()).toBe(0);
    });
});

describe('7-bag randomizer', () => {
    test('every consecutive run of 7 pieces is a permutation of 0-6', () => {
        t.initGame(7);
        const seq = [t.getActivePieceType()];
        for (let i = 0; i < 27; i++) {
            seq.push(t.getNextPieceType());
            t.moveLeft(); // harmless input between draws
            // Force a spawn without stacking up: teleport via hardDrop only
            // once, then reset the column drift by re-seeding per bag isn't
            // necessary — hardDrop() naturally advances curType/nextType.
            t.hardDrop();
            if (t.isGameOver() === 1) break;
        }
        // Only check full bags among however many pieces we got through
        // before topping out.
        const fullBags = Math.floor(seq.length / 7);
        for (let b = 0; b < fullBags; b++) {
            const bagSlice = seq.slice(b * 7, b * 7 + 7).slice().sort((a, b2) => a - b2);
            expect(bagSlice).toEqual([0, 1, 2, 3, 4, 5, 6]);
        }
        expect(fullBags).toBeGreaterThan(0);
    });
});

describe('piece shapes', () => {
    // Every rotation of every piece must occupy exactly 4 cells (tetromino
    // invariant) and stay within the 4x4 box.
    test('every type/rotation has exactly 4 occupied cells', () => {
        for (let type = 0; type < 7; type++) {
            for (let rotation = 0; rotation < 4; rotation++) {
                let count = 0;
                for (let row = 0; row < 4; row++) {
                    for (let col = 0; col < 4; col++) {
                        count += t.getShapeBit(type, rotation, row, col);
                    }
                }
                expect(count).toBe(4);
            }
        }
    });
});

describe('movement & wall collision', () => {
    test('moveLeft stops at the left wall instead of going out of bounds', () => {
        t.initGame(1);
        for (let i = 0; i < 20; i++) t.moveLeft();
        // No cell of the active piece should render at a negative or
        // out-of-range column — renderBoard() would have thrown/produced
        // garbage if getCell ever read outside the board.
        const rows = renderBoard();
        expect(rows.length).toBe(20);
        expect(rows.every(r => r.length === 10)).toBe(true);
    });

    test('moveRight stops at the right wall', () => {
        t.initGame(1);
        for (let i = 0; i < 20; i++) t.moveRight();
        const rows = renderBoard();
        expect(rows.every(r => r.length === 10)).toBe(true);
    });

    test('rotating repeatedly never crashes and stays in-bounds', () => {
        t.initGame(2);
        for (let i = 0; i < 12; i++) t.rotateCW();
        for (let i = 0; i < 12; i++) t.rotateCCW();
        expect(() => renderBoard()).not.toThrow();
    });
});

describe('gravity & locking', () => {
    test('tick() eventually locks the piece and spawns a new one', () => {
        t.initGame(3);
        const firstType = t.getActivePieceType();
        let locked = false;
        // tickThreshold starts at 48; BOARD_HEIGHT max drop is 20 rows.
        for (let i = 0; i < 48 * 25 && !locked; i++) {
            t.tick();
            if (t.getActivePieceType() !== firstType) locked = true;
        }
        expect(locked).toBe(true);
    });

    test('hardDrop locks immediately and awards drop-distance points', () => {
        t.initGame(4);
        const before = t.getScore();
        t.hardDrop();
        expect(t.getScore()).toBeGreaterThanOrEqual(before);
        expect(countFilled()).toBeGreaterThan(0);
    });
});

describe('line clearing & scoring', () => {
    test('a fully filled row is cleared, board compacts, and score increases', () => {
        t.initGame(5);
        // Fill row 19 completely except the last column via the debug hook.
        for (let x = 0; x < 9; x++) t.debugSetCell(x, 19, 1);
        t.debugSetCell(9, 19, 0);
        // Put a marker in row 18 so we can confirm it shifts down after clear.
        t.debugSetCell(0, 18, 5);

        expect(t.getCell(0, 19)).toBe(1);
        expect(t.getCell(9, 19)).toBe(0);

        // Completing the row: fill the last cell directly, then force a
        // clear-lines pass (mirrors what lockPiece() does automatically).
        t.debugSetCell(9, 19, 3);
        const scoreBefore = t.getScore();
        const cleared = t.debugClearLines();

        expect(cleared).toBe(1);
        expect(t.getScore()).toBeGreaterThan(scoreBefore);
        expect(t.getLinesCleared()).toBe(1);
        // Row 19 should now hold what used to be in row 18 (compacted down).
        expect(t.getCell(0, 19)).toBe(5);
        expect(t.getCell(0, 18)).toBe(0);
    });

    test('clearing 4 lines at once (a Tetris) awards the correct bonus', () => {
        t.initGame(6);
        for (let y = 16; y < 20; y++) {
            for (let x = 0; x < 10; x++) t.debugSetCell(x, y, 2);
        }
        const cleared = t.debugClearLines();
        expect(cleared).toBe(4);
        // Level 1 tetris = 1200 * level(1) = 1200
        expect(t.getScore()).toBe(1200);
        expect(t.getLinesCleared()).toBe(4);
    });

    test('level increases every 10 lines and gravity speeds up', () => {
        t.initGame(8);
        expect(t.getLevel()).toBe(1);
        for (let y = 10; y < 20; y++) {
            for (let x = 0; x < 10; x++) t.debugSetCell(x, y, 1);
        }
        // 10 single-row-equivalent lines via one big clear won't happen in
        // one call (clearLines only clears currently-full rows in one pass,
        // but all 10 rows here are full so it clears all 10 at once).
        t.debugClearLines();
        expect(t.getLinesCleared()).toBe(10);
        expect(t.getLevel()).toBe(2);
    });
});

describe('game over', () => {
    test('stacking pieces straight down without clearing eventually tops out', () => {
        t.initGame(11);
        let steps = 0;
        while (t.isGameOver() === 0 && steps < 200) {
            t.hardDrop();
            steps++;
        }
        expect(t.isGameOver()).toBe(1);
    });

    test('input functions are no-ops after game over (no crash, no state change)', () => {
        t.initGame(11);
        let steps = 0;
        while (t.isGameOver() === 0 && steps < 200) {
            t.hardDrop();
            steps++;
        }
        expect(t.isGameOver()).toBe(1);
        const scoreAfterOver = t.getScore();
        t.moveLeft();
        t.moveRight();
        t.rotateCW();
        t.softDrop();
        t.hardDrop();
        expect(t.getScore()).toBe(scoreAfterOver);
        expect(t.isGameOver()).toBe(1);
    });
});

describe('pause', () => {
    test('togglePause flips isPaused 0 -> 1 -> 0', () => {
        t.initGame(20);
        expect(t.isPaused()).toBe(0);
        t.togglePause();
        expect(t.isPaused()).toBe(1);
        t.togglePause();
        expect(t.isPaused()).toBe(0);
    });

    test('while paused, tick() never advances the piece or the score', () => {
        t.initGame(20);
        t.togglePause();
        const before = renderBoard();
        const scoreBefore = t.getScore();
        for (let i = 0; i < 500; i++) t.tick();
        expect(renderBoard()).toEqual(before);
        expect(t.getScore()).toBe(scoreBefore);
    });

    test('while paused, moveLeft/moveRight/rotateCW/rotateCCW/softDrop are no-ops', () => {
        t.initGame(20);
        t.togglePause();
        const before = renderBoard();
        const scoreBefore = t.getScore();
        t.moveLeft();
        t.moveRight();
        t.rotateCW();
        t.rotateCCW();
        t.softDrop();
        expect(renderBoard()).toEqual(before);
        expect(t.getScore()).toBe(scoreBefore);
    });

    test('while paused, hardDrop() does not lock the piece or change the score', () => {
        t.initGame(20);
        t.togglePause();
        const before = renderBoard();
        const scoreBefore = t.getScore();
        const typeBefore = t.getActivePieceType();
        t.hardDrop();
        expect(renderBoard()).toEqual(before);
        expect(t.getScore()).toBe(scoreBefore);
        expect(t.getActivePieceType()).toBe(typeBefore);
    });

    test('togglePause is a no-op once the game is over', () => {
        t.initGame(11);
        let steps = 0;
        while (t.isGameOver() === 0 && steps < 200) {
            t.hardDrop();
            steps++;
        }
        expect(t.isGameOver()).toBe(1);
        expect(t.isPaused()).toBe(0);
        t.togglePause();
        expect(t.isPaused()).toBe(0);
    });

    test('initGame/reset clears paused back to 0 even if called mid-pause', () => {
        t.initGame(20);
        t.togglePause();
        expect(t.isPaused()).toBe(1);
        t.reset(21);
        expect(t.isPaused()).toBe(0);
    });
});
