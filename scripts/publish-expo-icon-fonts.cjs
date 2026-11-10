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
const publicFontsRoot = path.join(dist, 'fonts');

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
  // Cloudflare pode não servir caminhos que contêm node_modules.
  // Publica uma rota estável em /fonts, sem esse segmento.
  const publicTarget = path.join(publicFontsRoot, path.basename(src));
  fs.mkdirSync(publicFontsRoot, { recursive: true });
  fs.copyFileSync(src, publicTarget);
  if (!validSfnt(fs.readFileSync(publicTarget))) {
    throw new Error('Fonte publica invalida: ' + path.basename(src));
  }
  if (!validSfnt(fs.readFileSync(target))) {
    throw new Error('Falha na copia da fonte: ' + path.basename(src));
  }
}
// A exportação Expo pode embutir a URL original no JS ou CSS do bundle.
// Redirecione a URL para os arquivos públicos realmente publicados.
// Não substituir quaisquer outras fontes ou recursos de terceiros.
const bundleRoot = path.join(dist, '_expo');
let replaced = 0;
let candidateFiles = 0;
function rewriteBundle(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { rewriteBundle(file); continue; }
    if (!entry.isFile() || !/\\.(?:js|css)$/.test(entry.name)) continue;
    const before = fs.readFileSync(file, 'utf8');
    if (before.includes('vector-icons') && before.includes('.ttf')) candidateFiles++;
    const after = before.replace(
      /(?:\\/?assets\\/node_modules\\/(?:@expo|%40expo)\\/vector-icons\\/)[^"'\\s\\x60]*?([A-Za-z0-9_-]+\\.ttf)/g,
      (_match, name) => {
        if (!fs.existsSync(path.join(publicFontsRoot, name))) {
          throw new Error('Fonte referenciada pelo bundle nao existe: ' + name);
        }
        replaced++;
        return '/fonts/' + name;
      }
    );
    if (after !== before) fs.writeFileSync(file, after);
  }
}
rewriteBundle(bundleRoot);
if (candidateFiles > 0 && replaced === 0) {
  throw new Error('O bundle faz referencia a fontes antigas mas nenhuma URL foi corrigida.');
}
console.log('Fontes publicadas em dist/fonts: ' + fonts.length +
  '; referencias de fonte substituidas no bundle: ' + replaced);
