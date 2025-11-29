import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import pkg from './package.json';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'Wplace Live Chats',
        version: pkg.version,
        description: 'Livechat for wplace.live',
        author: 'mininxd',
        icon: 'https://wplace.org/favicon/favicon.svg',
        match: ['https://wplace.live/*', 'https://wplace.live'],
        grant: ['GM_xmlhttpRequest'],
        connect: ['wplace-live-chat-server.vercel.app', 'backend.wplace.live'],
      },
      build: {
        fileName: 'wplace_livechat.user.js',
      },
    }),
  ],
});
