// gravity.test.js
// Verifies the NES gravity table via linesCleared-driven level changes.
const t = require('../brick-drohp.js');

// Fill n full rows (n <= 20) at the bottom of the board and clear them.
function addLines(n) {
    for (let y = 20 - n; y < 20; y++) {
        for (let x = 0; x < 10; x++) t.debugSetCell(x, y, 1);
    }
    t.debugClearLines();
}

// Fresh game, then clear exactly enough lines to reach `target` level.
function driveToLevel(target) {
    t.initGame(1);
    let remaining = (target - 1) * 10;
    while (remaining > 0) {
        const chunk = remaining > 20 ? 20 : remaining;
        addLines(chunk);
        remaining -= chunk;
    }
    expect(t.getLevel()).toBe(target);
}

describe('NES gravity table', () => {
    test('level 1 starts at 48 frames/row', () => {
        t.initGame(1);
        expect(t.getLevel()).toBe(1);
        expect(t.getTickThreshold()).toBe(48);
    });

    test.each([
        [5, 28],
        [9, 8],
        [10, 6],
        [13, 5],
        [19, 3],
        [29, 2],
    ])('level %i -> %i frames/row', (lvl, frames) => {
        driveToLevel(lvl);
        expect(t.getTickThreshold()).toBe(frames);
    });

    test('level 40 clamps to the last entry (1 frame/row), no out-of-bounds read', () => {
        driveToLevel(40);
        expect(t.getTickThreshold()).toBe(1);
    });
});
