import { defineConfig } from 'vite'
import userscript from 'vite-plugin-userscript'

export default defineConfig({
  plugins: [
    userscript({
      entry: 'src/main.ts',
      header: {
        name: 'Wplace Live Chats',
        version: '1.0',
        description: 'Livechat for wplace.live',
        author: 'mininxd',
        match: ['https://wplace.live/*', 'https://wplace.live'],
        grant: 'GM_xmlhttpRequest',
        connect: ['wplace-live-chat-server.vercel.app', 'backend.wplace.live'],
      },
    }),
  ],
})
