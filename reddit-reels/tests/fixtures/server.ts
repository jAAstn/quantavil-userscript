import { join } from 'path';
import { existsSync } from 'fs';

const PORT = 3000;
const FIXTURES_DIR = import.meta.dir;
const ENTRY_FILE = join(FIXTURES_DIR, '../../src/index.ts');
const BUNDLE_OUT = join(FIXTURES_DIR, 'reels-bundle.js');

// Auto-bundle src/index.ts on server startup
if (existsSync(ENTRY_FILE)) {
  await Bun.build({
    entrypoints: [ENTRY_FILE],
    outdir: FIXTURES_DIR,
    target: 'browser',
    format: 'iife',
  });
  console.log('[Test Server] Built client bundle in', FIXTURES_DIR);
}

const server = Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;

    if (pathname === '/' || pathname === '/mock-reddit.html') {
      const file = Bun.file(join(FIXTURES_DIR, 'mock-reddit.html'));
      return new Response(file, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const filePath = join(FIXTURES_DIR, pathname.replace(/^\//, ''));
    if (existsSync(filePath)) {
      const file = Bun.file(filePath);
      return new Response(file);
    }

    return new Response('404 Not Found', { status: 404 });
  },
});

console.log(`[Test Server] Serving fixtures on http://127.0.0.1:${PORT}`);
