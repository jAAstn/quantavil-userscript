import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: 'Reddit Reel Mode',
        namespace: 'https://github.com/quantavil/reddit-reels',
        match: [
          'https://*.reddit.com/*',
          'https://reddit.com/*'
        ],
        description: 'Immersive full-screen vertical swipe Reel mode for Reddit mobile & desktop web with unmuted audio and zero overlap.',
        author: 'quantavil',
        version: '1.0.0',
        license: 'MIT',
        grant: [
          'GM_addStyle',
          'GM_setValue',
          'GM_getValue'
        ],
      },
    }),
  ],
});
