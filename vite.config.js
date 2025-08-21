"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vite_1 = require("vite");
var vite_plugin_userscript_1 = require("vite-plugin-userscript");
exports.default = (0, vite_1.defineConfig)({
    plugins: [
        (0, vite_plugin_userscript_1.default)({
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
});
