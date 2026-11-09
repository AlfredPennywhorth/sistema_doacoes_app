#!/usr/bin/env node
// Confere o bundle SPA exportado. Execute apos: npx expo export --platform web
const fs = require('node:fs');
const path = require('node:path');

const dist = path.resolve(__dirname, '..', 'dist');
const htmlFile = path.join(dist, 'index.html');
const errors = [];

if (!fs.existsSync(htmlFile)) {
  console.error('Falha: dist/index.html nao encontrado. Rode npx expo export --platform web.');
  process.exit(1);
}

const html = fs.readFileSync(htmlFile, 'utf8');
const mustContain = [
  ['manifesto', /<link[^>]+rel=["']manifest["'][^>]+href=["']\/manifest\.json["']/i],
  ['registro do service worker', /navigator\.serviceWorker\.register\(["']\/service-worker\.js["']\)/],
  ['raiz do aplicativo', /<div[^>]+id=["']root["']/i],
  ['bundle do Expo', /_expo\/static\/js\/web\/entry-/],
];

for (const [label, regex] of mustContain) {
  if (!regex.test(html)) errors.push(`dist/index.html sem ${label}`);
}

for (const filename of ['manifest.json', 'service-worker.js', 'icon.png']) {
  if (!fs.existsSync(path.join(dist, filename))) {
    errors.push(`dist/${filename} nao encontrado`);
  }
}

// Nao permitir deploy "verde" com fonte TTF ausente ou HTML servido como fonte.
const iconsFont = path.join(
  dist, 'assets', 'node_modules', '@expo', 'vector-icons',
  'build', 'vendor', 'react-native-vector-icons', 'Fonts', 'MaterialIcons.ttf'
);
if (!fs.existsSync(iconsFont)) {
  errors.push('MaterialIcons.ttf nao publicado em dist/assets/node_modules');
} else {
  const fontHeader = fs.readFileSync(iconsFont).subarray(0, 4);
  const valid = fontHeader.length === 4 && (
    fontHeader.readUInt32BE(0) === 0x00010000 ||
    ['OTTO', 'true', 'typ1'].includes(fontHeader.toString('latin1'))
  );
  if (!valid) errors.push('MaterialIcons.ttf invalido (HTML ou outro conteudo)');
}

const manifestFile = path.join(dist, 'manifest.json');
if (fs.existsSync(manifestFile)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    if (manifest.display !== 'standalone') errors.push('Manifesto deve ter display=standalone');
    if (!manifest.name || !manifest.short_name) errors.push('Manifesto sem nome ou nome curto');
  } catch {
    errors.push('Manifesto invalido');
  }
}

if (errors.length) {
  console.error('Verificacao PWA FALHOU:');
  for (const error of errors) console.error(' - ' + error);
  process.exitCode = 1;
} else {
  console.log('Verificacao PWA APROVADA: HTML, manifesto, service worker, icone e bundle presentes.');
}
