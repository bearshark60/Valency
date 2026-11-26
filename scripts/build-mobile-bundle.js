// VALENCY — Clean Mobile PWA & Native WebDir Bundler
// Produces dist/valency-mobile-pwa/ (with mobile.html promoted to root index.html)
// ready for instant Netlify Drop / Cloudflare Pages / GitHub Pages / Capacitor wrapping.
// Usage: node scripts/build-mobile-bundle.js [--with-audio]
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'dist', 'valency-mobile-pwa');
const INCLUDE_AUDIO = process.argv.includes('--with-audio');

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      if (entry === 'concepts' || entry === 'production' || entry === 'qa') continue; // Exclude archival masters, concepts & QA sheets from lightweight mobile PWA runtime bundle
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// 1. Clean output directory
if (fs.existsSync(OUT_DIR)) {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
}
fs.mkdirSync(OUT_DIR, { recursive: true });

// 2. Promote mobile.html -> index.html (and also keep mobile.html alias so both URLs work!)
const mobileHtml = fs.readFileSync(path.join(ROOT, 'mobile.html'), 'utf8');
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), mobileHtml, 'utf8');
fs.writeFileSync(path.join(OUT_DIR, 'mobile.html'), mobileHtml, 'utf8');

// 3. Rewrite manifest.webmanifest start_url -> "./" so root installs launch straight into mobile UI
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
manifest.start_url = './';
fs.writeFileSync(path.join(OUT_DIR, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');

// 4. Rewrite sw.js cache list to include './' and './index.html'
let sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
sw = sw.replace("'./mobile.html',", "'./',\n  './index.html',\n  './mobile.html',");
fs.writeFileSync(path.join(OUT_DIR, 'sw.js'), sw, 'utf8');

// 5. Copy core runtime source modules (excluding desktop-only tests/docs/checkpoints)
const dirsToCopy = [
  'src/data',
  'src/engine',
  'src/story',
  'src/frontier',
  'src/presentation',
  'src/styles',
  'src/ui',
  'assets/events',
  'assets/icons',
  'assets/portraits',
  'assets/characters',
];
for (const rel of dirsToCopy) {
  copyRecursive(path.join(ROOT, rel), path.join(OUT_DIR, rel));
}

// 6. Optionally bundle custom audio files (default omits ~67 MB uncompressed WAVs so iPhone loads fast;
//    if compressed .mp3/.m4a/.ogg files exist in assets/audio/, include them automatically!)
const audioSrcDir = path.join(ROOT, 'assets', 'audio');
const audioDestDir = path.join(OUT_DIR, 'assets', 'audio');
if (fs.existsSync(audioSrcDir)) {
  fs.mkdirSync(audioDestDir, { recursive: true });
  for (const file of fs.readdirSync(audioSrcDir)) {
    const ext = path.extname(file).toLowerCase();
    const isCompressedAudio = ['.mp3', '.m4a', '.ogg'].includes(ext);
    const isWav = ext === '.wav';
    if (isCompressedAudio || (INCLUDE_AUDIO && isWav)) {
      fs.copyFileSync(path.join(audioSrcDir, file), path.join(audioDestDir, file));
    }
  }
}

// 7. Compute bundle summary
let fileCount = 0;
let totalBytes = 0;
function walkStats(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = fs.statSync(full);
    if (st.isDirectory()) walkStats(full);
    else {
      fileCount += 1;
      totalBytes += st.size;
    }
  }
}
walkStats(OUT_DIR);

console.log(`Built clean mobile PWA bundle at: ${OUT_DIR}`);
console.log(`Files: ${fileCount}, Total size: ${(totalBytes / 1024).toFixed(1)} KB (withAudioWAVs=${INCLUDE_AUDIO})`);
