// VALENCY — Zero-Dependency Local Mobile & Desktop Pilot Server (with HTTP Range support for iOS Safari audio)
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8080);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const safeRel = path.normalize(urlPath === '/' ? '/index.html' : urlPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(ROOT, safeRel);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    const total = stat.size;
    const range = req.headers.range;

    // Support HTTP Byte Ranges (required by iPhone Safari for <audio> playback!)
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
      if (isNaN(start) || isNaN(end) || start >= total || end >= total) {
        res.writeHead(416, { 'Content-Range': `bytes */${total}` });
        res.end();
        return;
      }
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': contentType,
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Length': total,
      'Accept-Ranges': 'bytes',
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' || ext === '.js' || ext === '.css' ? 'no-cache' : 'public, max-age=3600',
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

function getLanAddresses() {
  const nets = os.networkInterfaces();
  const out = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        out.push(net.address);
      }
    }
  }
  return out;
}

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n=======================================================');
  console.log('  VALENCY — iPhone & Desktop Local Pilot Server Running');
  console.log('=======================================================');
  console.log(`  Desktop (this PC): http://localhost:${PORT}/index.html`);
  console.log(`  Mobile  (this PC): http://localhost:${PORT}/mobile.html`);
  const ips = getLanAddresses();
  if (ips.length > 0) {
    console.log('\n  Open on iPhone Safari (same Wi-Fi):');
    for (const ip of ips) {
      console.log(`    -> http://${ip}:${PORT}/mobile.html`);
    }
  }
  console.log('\n  Press Ctrl+C to stop the server.\n');
});
