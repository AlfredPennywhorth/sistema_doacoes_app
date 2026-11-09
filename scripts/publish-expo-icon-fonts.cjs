#!/usr/bin/env node
// Expo Web/Cloudflare Pages: garantir que arquivos TTF requisitados via
// /assets/node_modules/@expo/vector-icons/... sejam publicados de fato.
// Um 404 em SPA pode retornar index.html ("<!DO") e causar OTS invalid sfntVersion.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const iconsRoot = path.join(root, 'node_modules', '@expo', 'vector-icons');
const dist = path.join(root, 'dist');
const assetsRoot = path.join(dist, 'assets', 'node_modules');

function findFonts(dir, collected = []) {
  if (!fs.existsSync(dir)) return collected;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const src = path.join(dir, ent.name);
    if (ent.isDirectory()) findFonts(src, collected);
    else if (ent.isFile() && ent.name.toLowerCase().endsWith('.ttf')) collected.push(src);
  }
  return collected;
}

function validSfnt(bytes) {
  if (bytes.length < 4) return false;
  const sfnt = bytes.subarray(0, 4).toString('latin1');
  return bytes.readUInt32BE(0) === 0x00010000 ||
    ['OTTO', 'true', 'typ1'].includes(sfnt);
}

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  throw new Error('Exportacao Expo web ausente: dist/index.html nao encontrado.');
}
const fonts = findFonts(iconsRoot);
const materialIcons = fonts.find((p) => path.basename(p) === 'MaterialIcons.ttf');
if (!materialIcons) {
  throw new Error('MaterialIcons.ttf nao encontrado no @expo/vector-icons instalado.');
}
for (const src of fonts) {
  const data = fs.readFileSync(src);
  if (!validSfnt(data)) {
    throw new Error('Fonte invalida no node_modules: ' + path.basename(src));
  }
  const rel = path.relative(path.join(root, 'node_modules'), src);
  const target = path.join(assetsRoot, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(src, target);
  if (!validSfnt(fs.readFileSync(target))) {
    throw new Error('Falha na copia da fonte: ' + path.basename(src));
  }
}
console.log('Fontes vetoriais publicadas em dist/assets/node_modules: ' + fonts.length);
