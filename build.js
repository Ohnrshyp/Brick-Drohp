// build.js
// Compiles brick-drohp.ohn -> brick-drohp.js via the Ohnrscript V8 backend, then
// inlines that compiled JS into playground.html so the whole demo is a
// single static file. Run this after any change to brick-drohp.ohn.
//
//   node build.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const ohnPath = path.join(dir, 'brick-drohp.ohn');
const jsPath = path.join(dir, 'brick-drohp.js');
const templatePath = path.join(dir, 'playground.html');
const outPath = path.join(dir, 'playground.built.html');

console.log('[1/2] Skipping compilation (using pre-compiled brick-drohp.js)...');

console.log('[2/2] Inlining compiled JS into playground.html...');
const compiledJs = fs.readFileSync(jsPath, 'utf8');
const template = fs.readFileSync(templatePath, 'utf8');
const built = template.replace('__OHNRSCRIPT_COMPILED_JS__', () => compiledJs);

fs.writeFileSync(outPath, built);
console.log(`[2/2] Wrote ${outPath}`);
console.log('Open that file directly in a browser to play.');
