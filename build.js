// build.js
// Compiles tetris.ohn -> tetris.js via the Ohnrscript V8 backend, then
// inlines that compiled JS into playground.html so the whole demo is a
// single static file. Run this after any change to tetris.ohn.
//
//   node build.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const ohnPath = path.join(dir, 'tetris.ohn');
const jsPath = path.join(dir, 'tetris.js');
const templatePath = path.join(dir, 'playground.html');
const outPath = path.join(dir, 'playground.built.html');

console.log('[1/3] Compiling tetris.ohn -> tetris.js (Ohnrscript V8 backend)...');
execSync(
  `node "${path.join(dir, '..', 'compiler', 'scripts', 'compile.js')}" "${ohnPath}" -o "${jsPath}"`,
  { stdio: 'inherit' }
);

console.log('[2/3] Inlining compiled JS into playground.html...');
const compiledJs = fs.readFileSync(jsPath, 'utf8');
const template = fs.readFileSync(templatePath, 'utf8');
const built = template.replace('__OHNRSCRIPT_COMPILED_JS__', () => compiledJs);

fs.writeFileSync(outPath, built);
console.log(`[3/3] Wrote ${outPath}`);
console.log('Open that file directly in a browser to play.');
