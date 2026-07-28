#!/usr/bin/env node
// play.js — terminal Tetris using the compiled brick-drohp.ohn engine.
// Zero game logic here, same as playground.html: reads getCell()/getScore()/etc.
// and calls the engine's exported input functions.
//
//   node play.js

'use strict';

const readline = require('readline');
const t = require('./brick-drohp.js');

const CELL = '  '; // two chars per board cell, matches roughly-square terminal glyphs
const COLOR_CODES = [null, 51, 220, 135, 78, 203, 69, 208]; // index = colorId (0 empty..7)
const LINE_WIDTH = 78;

function colorCell(colorId) {
    if (colorId === 0) return '\x1b[48;5;235m' + CELL + '\x1b[0m';
    return `\x1b[48;5;${COLOR_CODES[colorId]}m${CELL}\x1b[0m`;
}

function pad(str, visibleLen, width) {
    const gap = Math.max(0, width - visibleLen);
    return str + ' '.repeat(gap);
}

function buildNextBoxLines() {
    const lines = [];
    for (let row = 0; row < 4; row++) {
        let s = '';
        for (let col = 0; col < 4; col++) {
            s += colorCell(t.getNextCell(row, col));
        }
        lines.push(s);
    }
    return lines;
}

function render() {
    const boardW = t.getBoardWidth();
    const boardH = t.getBoardHeight();
    const nextLines = buildNextBoxLines();

    const stats = [
        `Score: ${t.getScore()}`,
        `Level: ${t.getLevel()}`,
        `Lines: ${t.getLinesCleared()}`,
        '',
        'Next:',
        ...nextLines.map((l) => '  ' + l),
        '',
        'Controls:',
        '← → move',
        '↑ rotate cw   z rotate ccw',
        '↓ soft drop   space hard drop',
        'p pause/resume q quit',
        'r restart',
    ];

    const out = [];
    out.push('Ohnrscript Tetris (terminal)'.padEnd(LINE_WIDTH));
    out.push('╔' + '═'.repeat(boardW * CELL.length) + '╗');

    for (let y = 0; y < boardH; y++) {
        let row = '║';
        for (let x = 0; x < boardW; x++) {
            row += colorCell(t.getCell(x, y));
        }
        row += '║';
        out.push(row);
    }

    out.push('╚' + '═'.repeat(boardW * CELL.length) + '╝');

    if (t.isGameOver() === 1) {
        out.push('GAME OVER — press r to restart, q to quit'.padEnd(LINE_WIDTH));
    } else if (t.isPaused() === 1) {
        out.push('PAUSED — press p to resume, q to quit'.padEnd(LINE_WIDTH));
    } else {
        out.push(''.padEnd(LINE_WIDTH));
    }

    // Merge stats onto the right of each board row (rows 1..boardH of `out`).
    for (let i = 0; i < stats.length; i++) {
        const rowIdx = 2 + i; // row 0 is the title, row 1 is the top border, row 2 is the first board row
        if (rowIdx < out.length) {
            out[rowIdx] = out[rowIdx] + '   ' + stats[i];
        }
    }

    const frame = out.map((l) => pad(l, stripAnsiLen(l), LINE_WIDTH)).join('\n');
    process.stdout.write('\x1b[H' + frame + '\n');
}

// Rough visible-length estimate (strips ANSI escapes) so padding doesn't
// undercount — used only to avoid leftover characters between frames.
function stripAnsiLen(str) {
    return str.replace(/\x1b\[[0-9;]*m/g, '').length;
}

function cleanupAndExit(code) {
    clearInterval(loopHandle);
    process.stdout.write('\x1b[?25h\x1b[2J\x1b[H');
    if (process.stdin.isTTY) process.stdin.setRawMode(false);
    process.stdin.pause();
    process.exit(code);
}

if (!process.stdin.isTTY) {
    console.error('play.js needs an interactive terminal (TTY) for keyboard input.');
    process.exit(1);
}

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.resume();

process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') cleanupAndExit(0);
    switch (key.name) {
        case 'left': t.moveLeft(); break;
        case 'right': t.moveRight(); break;
        case 'up': t.rotateCW(); break;
        case 'down': t.softDrop(); break;
        case 'space': t.hardDrop(); break;
        case 'z': t.rotateCCW(); break;
        case 'p': t.togglePause(); break;
        case 'r': t.reset(Date.now() | 0); break;
        case 'q': cleanupAndExit(0); break;
        default: break;
    }
    render();
});

process.stdout.write('\x1b[?25l\x1b[2J\x1b[H');
t.initGame(Date.now() | 0);
render();

const loopHandle = setInterval(() => {
    t.tick();
    render();
}, 16);
