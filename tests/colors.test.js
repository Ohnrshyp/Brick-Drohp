// colors.test.js
// Verifies the packed 0xRRGGBB color table exposed by getPieceColor().
const t = require('../brick-drohp.js');

describe('packed color table', () => {
    test('ids 1-7 return the expected packed RGB values', () => {
        t.initGame(1);
        expect(t.getPieceColor(1)).toBe(0x4DD8E6);
        expect(t.getPieceColor(2)).toBe(0xE6D84D);
        expect(t.getPieceColor(3)).toBe(0xB96BE6);
        expect(t.getPieceColor(4)).toBe(0x63E66B);
        expect(t.getPieceColor(5)).toBe(0xE6636B);
        expect(t.getPieceColor(6)).toBe(0x6B86E6);
        expect(t.getPieceColor(7)).toBe(0xE69A4D);
    });

    test('id 0 and out-of-range ids return 0 without reading out of bounds', () => {
        t.initGame(1);
        expect(t.getPieceColor(0)).toBe(0);
        expect(t.getPieceColor(-1)).toBe(0);
        expect(t.getPieceColor(99)).toBe(0);
    });

    test('every packed value stays positive in i32 and fits in 24 bits', () => {
        t.initGame(1);
        for (let id = 1; id <= 7; id++) {
            const packed = t.getPieceColor(id);
            expect(packed).toBeGreaterThan(0);
            expect(packed).toBeLessThanOrEqual(0xFFFFFF);
        }
    });

    test('packed values format to the exact hex strings the shim used to hardcode', () => {
        t.initGame(1);
        const hex = (id) => ('000000' + t.getPieceColor(id).toString(16)).slice(-6);
        expect(hex(1)).toBe('4dd8e6');
        expect(hex(2)).toBe('e6d84d');
        expect(hex(3)).toBe('b96be6');
        expect(hex(4)).toBe('63e66b');
        expect(hex(5)).toBe('e6636b');
        expect(hex(6)).toBe('6b86e6');
        expect(hex(7)).toBe('e69a4d');
    });
});
