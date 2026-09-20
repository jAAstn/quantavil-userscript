import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: 'Reddit Reel Mode: Immersive Full-Screen Vertical Video & Feed Swipe',
        namespace: 'https://github.com/quantavil/userscript/tree/main/reddit-reels',
        match: [
          'https://*.reddit.com/*',
          'https://reddit.com/*'
        ],
        description: 'Transform Reddit feeds into an immersive, vertical swipe Reel Mode (TikTok / Instagram Reels style). Features unmuted audio mutex with zero background bleed, smart aspect-ratio scaling (contain meme videos, cover vertical reels), double-tap fit/fill toggle, multi-image gallery carousels, text & link preview cards, subtitles/closed-captions toggle, and native Reddit vote delegation.',
        author: 'quantavil',
        version: '1.1.0',
        license: 'MIT',
        'run-at': 'document-end',
        homepage: 'https://github.com/quantavil/userscript/tree/main/reddit-reels',
        supportURL: 'https://github.com/quantavil/userscript/issues',
        grant: [
          'GM_addStyle',
          'GM_setValue',
          'GM_getValue'
        ],
      },
    }),
  ],
  build: {
    minify: false,
    cssMinify: false,
    target: 'es2022',
  },
});
