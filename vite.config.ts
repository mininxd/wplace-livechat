import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
     monkey({
       entry: 'src/main.ts',
       userscript: {
         name: 'Wplace Live Chats',
         version: '2.3.4_event',
         description: 'Livechat for wplace.live',
         author: 'mininxd',
         icon: 'https://wplace.org/favicon/favicon.svg',
         match: ['https://wplace.live/*', 'https://wplace.live'],
         grant: 'GM_xmlhttpRequest',
         connect: ['wplace-live-chat-server.vercel.app', 'backend.wplace.live'],
       },
         build: {
         fileName: 'wplace_livechat.user.js',
       },
     }),
  ],
});
