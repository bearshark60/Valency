// VALENCY — Local Server & Static Asset Integrity Smoke Test
// Verifies server.js routing, MIME types, HTTP 206 Byte Range responses, path traversal protection,
// and ensures every <script src> and <link href> in index.html, mobile.html, and tests.html exists on disk.
'use strict';

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TEST_PORT = 18089;

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`PASS: ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL: ${name}\n  -> ${err.stack || err.message}`);
  }
}

function httpGet(urlPath, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: urlPath,
        method: 'GET',
        headers,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks),
          });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(ROOT, 'server.js')], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(TEST_PORT) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let started = false;
    const timer = setTimeout(() => {
      if (!started) {
        child.kill();
        reject(new Error('server.js did not start within 5s'));
      }
    }, 5000);

    child.stdout.on('data', (chunk) => {
      if (!started && chunk.toString().includes('Server Running')) {
        started = true;
        clearTimeout(timer);
        resolve(child);
      }
    });
    child.on('exit', (code) => {
      if (!started) {
        clearTimeout(timer);
        reject(new Error(`server.js exited prematurely with code ${code}`));
      }
    });
  });
}

async function main() {
  await test('HTML Integrity: all <script src> and <link href> assets in index.html, mobile.html, and tests.html exist on disk', async () => {
    for (const htmlFile of ['index.html', 'mobile.html', 'tests.html']) {
      const html = fs.readFileSync(path.join(ROOT, htmlFile), 'utf8');
      const refs = [];
      const regex = /<(?:script|link)\b[^>]*\b(?:src|href)="([^"]+)"/gi;
      let m;
      while ((m = regex.exec(html)) !== null) {
        const ref = m[1];
        if (!ref.startsWith('http://') && !ref.startsWith('https://') && !ref.startsWith('#')) {
          refs.push(ref);
        }
      }
      assert(refs.length > 0, `${htmlFile} should reference local assets`);
      for (const rel of refs) {
        const abs = path.join(ROOT, rel.split('?')[0]);
        assert(fs.existsSync(abs), `${htmlFile} references missing asset: ${rel}`);
      }
    }
  });

  const proc = await startServer();
  try {
    await test('Server Routes: /, /index.html, /mobile.html, /tests.html, /src/engine/gameEngine.js return 200 with valid MIME types', async () => {
      const checks = [
        ['/', 'text/html'],
        ['/index.html', 'text/html'],
        ['/mobile.html', 'text/html'],
        ['/tests.html', 'text/html'],
        ['/src/engine/gameEngine.js', 'application/javascript'],
        ['/manifest.webmanifest', 'application/manifest+json'],
      ];
      for (const [route, mimePrefix] of checks) {
        const res = await httpGet(route);
        assert.strictEqual(res.status, 200, `${route} expected 200, got ${res.status}`);
        assert(
          String(res.headers['content-type'] || '').startsWith(mimePrefix),
          `${route} expected content-type ${mimePrefix}, got ${res.headers['content-type']}`
        );
        assert(res.body.length > 0, `${route} returned empty body`);
      }
    });

    await test('Server HTTP Byte Ranges: returns 206 Partial Content with valid Content-Range header', async () => {
      const res = await httpGet('/index.html', { Range: 'bytes=0-63' });
      assert.strictEqual(res.status, 206, `Expected 206, got ${res.status}`);
      assert.strictEqual(res.body.length, 64, `Expected 64 bytes, got ${res.body.length}`);
      assert(/^bytes 0-63\/\d+$/.test(String(res.headers['content-range'] || '')), `Unexpected Content-Range: ${res.headers['content-range']}`);
    });

    await test('Server Security & 404: blocks path traversal and returns 404 for unknown files', async () => {
      const trav = await httpGet('/%2e%2e/%2e%2e/Windows/win.ini');
      assert(trav.status === 403 || trav.status === 404, `Traversal should be 403/404, got ${trav.status}`);
      const missing = await httpGet('/definitely-does-not-exist-12345.js');
      assert.strictEqual(missing.status, 404, `Missing file expected 404, got ${missing.status}`);
    });
  } finally {
    proc.kill();
  }

  console.log(`\nSERVER SMOKE SUMMARY: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
