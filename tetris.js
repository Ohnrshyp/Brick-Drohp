'use strict';

'use strict';
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BOARD_SIZE = 200;
const BOX = 4;
const PIECE_COUNT = 7;
const SHAPE_TABLE_SIZE = 28;
const SPAWN_X = 3;
const SPAWN_Y = 0;
const BASE_TICK_THRESHOLD = 48;
const LINES_PER_LEVEL = 10;
const GRAVITY_TABLE_SIZE = 30;
let board = new Uint8Array(BOARD_SIZE);
let pieceShapes = new Int32Array(SHAPE_TABLE_SIZE);
let gravityTable = new Int32Array(GRAVITY_TABLE_SIZE);
let bag = new Int32Array(PIECE_COUNT);
let bagPos = 7;
let rngState = 1;
let curType = 0;
let curRotation = 0;
let curX = SPAWN_X;
let curY = SPAWN_Y;
let nextType = 0;
let score = 0;
let level = 1;
let linesCleared = 0;
let gameOver = 0;
let paused = 0;
let tickCounter = 0;
let tickThreshold = BASE_TICK_THRESHOLD;
function nextRandom() {
    let x = rngState | 0;
    x = x ^ x << 13 | 0;
    x = x ^ x >>> 17 | 0;
    x = x ^ x << 5 | 0;
    rngState = x | 0;
    return x | 0;
}

function randRange(maxExclusive) {
    let r = nextRandom() | 0;
    if (r < 0) {
        r = 0 - r | 0;
    }
    return r % maxExclusive | 0;
}

function initPieceShapes() {
    pieceShapes[0] = 240;
    pieceShapes[1] = 0x4444;
    pieceShapes[2] = 0xf00;
    pieceShapes[3] = 0x2222;
    pieceShapes[4] = 0x660;
    pieceShapes[5] = 0x660;
    pieceShapes[6] = 0x660;
    pieceShapes[7] = 0x660;
    pieceShapes[8] = 0x270;
    pieceShapes[9] = 0x464;
    pieceShapes[10] = 0xe40;
    pieceShapes[11] = 0x2620;
    pieceShapes[12] = 0x360;
    pieceShapes[13] = 0x462;
    pieceShapes[14] = 0x6c0;
    pieceShapes[15] = 0x4620;
    pieceShapes[16] = 0x630;
    pieceShapes[17] = 0x264;
    pieceShapes[18] = 0xc60;
    pieceShapes[19] = 0x2640;
    pieceShapes[20] = 0x710;
    pieceShapes[21] = 0x226;
    pieceShapes[22] = 0x8e0;
    pieceShapes[23] = 0x6440;
    pieceShapes[24] = 0x740;
    pieceShapes[25] = 0x622;
    pieceShapes[26] = 0x2e0;
    pieceShapes[27] = 0x4460;
    return 0;
}

function initGravityTable() {
    gravityTable[0] = 48;
    gravityTable[1] = 43;
    gravityTable[2] = 38;
    gravityTable[3] = 33;
    gravityTable[4] = 28;
    gravityTable[5] = 23;
    gravityTable[6] = 18;
    gravityTable[7] = 13;
    gravityTable[8] = 8;
    gravityTable[9] = 6;
    gravityTable[10] = 5;
    gravityTable[11] = 5;
    gravityTable[12] = 5;
    gravityTable[13] = 4;
    gravityTable[14] = 4;
    gravityTable[15] = 4;
    gravityTable[16] = 3;
    gravityTable[17] = 3;
    gravityTable[18] = 3;
    gravityTable[19] = 2;
    gravityTable[20] = 2;
    gravityTable[21] = 2;
    gravityTable[22] = 2;
    gravityTable[23] = 2;
    gravityTable[24] = 2;
    gravityTable[25] = 2;
    gravityTable[26] = 2;
    gravityTable[27] = 2;
    gravityTable[28] = 2;
    gravityTable[29] = 1;
    return 0;
}

function getShapeBit(type, rotation, row, col) {
    let idx = type * 4 + rotation | 0;
    let mask = pieceShapes[idx] | 0;
    let bitIndex = row * 4 + col | 0;
    let bit = mask >> bitIndex & 1;
    return bit | 0;
}

function refillBag() {
    let i = 0;
    while (i < PIECE_COUNT) {
        bag[i] = i;
        i = i + 1 | 0;
    }
    i = PIECE_COUNT - 1 | 0;
    while (i > 0) {
        let j = randRange(i + 1 | 0) | 0;
        let tmp = bag[i] | 0;
        bag[i] = bag[j];
        bag[j] = tmp;
        i = i - 1 | 0;
    }
    bagPos = 0;
    return 0;
}

function drawFromBag() {
    if (bagPos >= PIECE_COUNT) {
        refillBag();
    }
    let t = bag[bagPos] | 0;
    bagPos = bagPos + 1 | 0;
    return t | 0;
}

function boardIndex(x, y) {
    return y * BOARD_WIDTH + x | 0;
}

function checkCollision(type, rotation, px, py) {
    let row = 0;
    while (row < BOX) {
        let col = 0;
        while (col < BOX) {
            let bit = getShapeBit(type, rotation, row, col) | 0;
            if (bit === 1) {
                let bx = px + col | 0;
                let by = py + row | 0;
                if (bx < 0) {
                    return 1;
                }
                if (bx >= BOARD_WIDTH) {
                    return 1;
                }
                if (by < 0) {
                    return 1;
                }
                if (by >= BOARD_HEIGHT) {
                    return 1;
                }
                if (board[boardIndex(bx, by)] !== 0) {
                    return 1;
                }
            }
            col = col + 1 | 0;
        }
        row = row + 1 | 0;
    }
    return 0;
}

function spawnPiece() {
    curType = nextType | 0;
    nextType = drawFromBag() | 0;
    curRotation = 0;
    curX = SPAWN_X;
    curY = SPAWN_Y;
    if (checkCollision(curType, curRotation, curX, curY) === 1) {
        gameOver = 1;
    }
    return 0;
}

function lockPiece() {
    let row = 0;
    while (row < BOX) {
        let col = 0;
        while (col < BOX) {
            let bit = getShapeBit(curType, curRotation, row, col) | 0;
            if (bit === 1) {
                let bx = curX + col | 0;
                let by = curY + row | 0;
                board[boardIndex(bx, by)] = curType + 1 | 0;
            }
            col = col + 1 | 0;
        }
        row = row + 1 | 0;
    }
    clearLines();
    spawnPiece();
    return 0;
}

function isRowFull(y) {
    let x = 0;
    while (x < BOARD_WIDTH) {
        if (board[boardIndex(x, y)] === 0) {
            return 0;
        }
        x = x + 1 | 0;
    }
    return 1;
}

function copyRow(srcY, dstY) {
    let x = 0;
    while (x < BOARD_WIDTH) {
        board[boardIndex(x, dstY)] = board[boardIndex(x, srcY)];
        x = x + 1 | 0;
    }
    return 0;
}

function clearRow(y) {
    let x = 0;
    while (x < BOARD_WIDTH) {
        board[boardIndex(x, y)] = 0;
        x = x + 1 | 0;
    }
    return 0;
}

function clearLines() {
    let writeY = BOARD_HEIGHT - 1 | 0;
    let readY = BOARD_HEIGHT - 1 | 0;
    let cleared = 0;
    while (readY >= 0) {
        if (isRowFull(readY) === 1) {
            cleared = cleared + 1 | 0;
        } else {
            if (writeY !== readY) {
                copyRow(readY, writeY);
            }
            writeY = writeY - 1 | 0;
        }
        readY = readY - 1 | 0;
    }
    while (writeY >= 0) {
        clearRow(writeY);
        writeY = writeY - 1 | 0;
    }
    if (cleared > 0) {
        applyLineClearScore(cleared);
        linesCleared = linesCleared + cleared | 0;
        updateLevel();
    }
    return cleared | 0;
}

function applyLineClearScore(cleared) {
    let points = 0;
    if (cleared === 1) {
        points = 40 * level;
    } else if (cleared === 2) {
        points = 100 * level;
    } else if (cleared === 3) {
        points = 0x12c * level;
    } else if (cleared === 4) {
        points = 0x4b0 * level;
    }
    score = score + points | 0;
    return 0;
}

function updateLevel() {
    let newLevel = 1 + (linesCleared / LINES_PER_LEVEL | 0) | 0;
    if (newLevel !== level) {
        level = newLevel | 0;
        let idx = level - 1 | 0;
        if (idx < 0) {
            idx = 0;
        }
        if (idx >= GRAVITY_TABLE_SIZE) {
            idx = GRAVITY_TABLE_SIZE - 1 | 0;
        }
        tickThreshold = gravityTable[idx] | 0;
    }
    return 0;
}

function initGame(seed) {
    if (seed === 0) {
        rngState = 1;
    } else {
        rngState = seed | 0;
    }
    let i = 0;
    while (i < BOARD_SIZE) {
        board[i] = 0;
        i = i + 1 | 0;
    }
    initPieceShapes();
    initGravityTable();
    bagPos = 7;
    score = 0;
    level = 1;
    linesCleared = 0;
    gameOver = 0;
    paused = 0;
    tickCounter = 0;
    tickThreshold = gravityTable[0] | 0;
    nextType = drawFromBag() | 0;
    spawnPiece();
    return 0;
}

function moveLeft() {
    if (gameOver === 1) {
        return 0;
    }
    if (paused === 1) {
        return 0;
    }
    let nx = curX - 1 | 0;
    if (checkCollision(curType, curRotation, nx, curY) === 0) {
        curX = nx;
    }
    return 0;
}

function moveRight() {
    if (gameOver === 1) {
        return 0;
    }
    if (paused === 1) {
        return 0;
    }
    let nx = curX + 1 | 0;
    if (checkCollision(curType, curRotation, nx, curY) === 0) {
        curX = nx;
    }
    return 0;
}

function rotateCW() {
    if (gameOver === 1) {
        return 0;
    }
    if (paused === 1) {
        return 0;
    }
    let nr = (curRotation + 1) % 4 | 0;
    if (checkCollision(curType, nr, curX, curY) === 0) {
        curRotation = nr;
    }
    return 0;
}

function rotateCCW() {
    if (gameOver === 1) {
        return 0;
    }
    if (paused === 1) {
        return 0;
    }
    let nr = (curRotation + 3) % 4 | 0;
    if (checkCollision(curType, nr, curX, curY) === 0) {
        curRotation = nr;
    }
    return 0;
}

function togglePause() {
    if (gameOver === 1) {
        return paused | 0;
    }
    paused = paused === 1 ? 0 : 1;
    return paused | 0;
}

function isPaused() {
    return paused | 0;
}

function softDrop() {
    if (gameOver === 1) {
        return 0;
    }
    if (paused === 1) {
        return 0;
    }
    let ny = curY + 1 | 0;
    if (checkCollision(curType, curRotation, curX, ny) === 0) {
        curY = ny;
        score = score + 1 | 0;
        tickCounter = 0;
        return 0;
    }
    lockPiece();
    tickCounter = 0;
    return 1;
}

function hardDrop() {
    if (gameOver === 1) {
        return 0;
    }
    if (paused === 1) {
        return 0;
    }
    let dropCount = 0;
    while (checkCollision(curType, curRotation, curX, curY + 1 | 0) === 0) {
        curY = curY + 1 | 0;
        dropCount = dropCount + 1 | 0;
    }
    score = score + dropCount * 2 | 0;
    lockPiece();
    tickCounter = 0;
    return 0;
}

function tick() {
    if (gameOver === 1) {
        return 1;
    }
    if (paused === 1) {
        return 0;
    }
    tickCounter = tickCounter + 1 | 0;
    if (tickCounter >= tickThreshold) {
        tickCounter = 0;
        let ny = curY + 1 | 0;
        if (checkCollision(curType, curRotation, curX, ny) === 0) {
            curY = ny;
        } else {
            lockPiece();
        }
    }
    return gameOver | 0;
}

function getCell(x, y) {
    let row = y - curY | 0;
    let col = x - curX | 0;
    if (row >= 0) {
        if (row < BOX) {
            if (col >= 0) {
                if (col < BOX) {
                    if (getShapeBit(curType, curRotation, row, col) === 1) {
                        return curType + 1 | 0;
                    }
                }
            }
        }
    }
    return board[boardIndex(x, y)] | 0;
}

function getNextCell(row, col) {
    if (row < 0) {
        return 0;
    }
    if (row >= BOX) {
        return 0;
    }
    if (col < 0) {
        return 0;
    }
    if (col >= BOX) {
        return 0;
    }
    if (getShapeBit(nextType, 0, row, col) === 1) {
        return nextType + 1 | 0;
    }
    return 0;
}

function getBoardWidth() {
    return BOARD_WIDTH;
}

function getBoardHeight() {
    return BOARD_HEIGHT;
}

function getScore() {
    return score | 0;
}

function getLevel() {
    return level | 0;
}

function getLinesCleared() {
    return linesCleared | 0;
}

function getActivePieceType() {
    return curType | 0;
}

function getNextPieceType() {
    return nextType | 0;
}

function isGameOver() {
    return gameOver | 0;
}

function reset(seed) {
    initGame(seed);
    return 0;
}

function debugSetCell(x, y, value) {
    board[boardIndex(x, y)] = value | 0;
    return 0;
}

function debugClearLines() {
    return clearLines() | 0;
}

function getTickThreshold() {
    return tickThreshold | 0;
}

function main() {
    initGame(42);
    moveLeft();
    moveRight();
    rotateCW();
    hardDrop();
    hardDrop();
    hardDrop();
    let y = 16;
    while (y < 20) {
        let x = 0;
        while (x < 10) {
            debugSetCell(x, y, 2);
            x = x + 1 | 0;
        }
        y = y + 1 | 0;
    }
    debugClearLines();
    return linesCleared | 0;
}

module.exports = {
    initGame,
    reset,
    main,
    moveLeft,
    moveRight,
    rotateCW,
    rotateCCW,
    softDrop,
    hardDrop,
    togglePause,
    isPaused,
    tick,
    getCell,
    getNextCell,
    getBoardWidth,
    getBoardHeight,
    getScore,
    getLevel,
    getLinesCleared,
    getActivePieceType,
    getNextPieceType,
    isGameOver,
    getShapeBit,
    checkCollision,
    debugSetCell,
    debugClearLines,
    getTickThreshold,
};
