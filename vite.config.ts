import { defineConfig } from 'vite';
import monkey, { cdn } from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'Wplace Live Chats',
        version: '2.1',
        description: 'Livechat for wplace.live',
        author: 'mininxd',
        match: ['https://wplace.live/*', 'https://wplace.live'],
        grant: ['GM_xmlhttpRequest', 'GM_addStyle', 'GM_getResourceText'],
        connect: ['wplace-live-chat-server.vercel.app', 'backend.wplace.live'],
      },
      build: {
        fileName: 'wplace_livechat.user.js',
        externalGlobals: {
          'vanilla-picker/csp': cdn.jsdelivr('Picker', 'dist/vanilla-picker.csp.min.js'),
        },
        externalResource: {
            'vanilla-picker/dist/vanilla-picker.csp.css': cdn.jsdelivr(),
        },
      },
    }),
  ],
});
