import fs from 'fs';
import path from 'path';
import { transformAsync } from '@babel/core';
import { JSDOM } from 'jsdom';

async function buildUserscript() {
    // Ensure dist exists
    if (!fs.existsSync('dist')) fs.mkdirSync('dist');

    // Read userscript metadata
    const metadata = fs.readFileSync('userscript.txt', 'utf8');

    // Read index.html
    const htmlContent = fs.readFileSync('dist/index.html', 'utf8');
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // Pick chat button and modal by selectors
    const chatButtonHtml = document.querySelector('div.fixed.bottom-\\[100px\\].right-\\[20px\\]')?.outerHTML || '';
    const chatModalHtml = document.querySelector('dialog#chatModal')?.outerHTML || '';

    // Locate assets
    const assetsDir = path.join('dist', 'assets');
    const files = fs.readdirSync(assetsDir);

    const jsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
    const cssFile = files.find(f => f.startsWith('index-') && f.endsWith('.css'));

    if (!jsFile || !cssFile) {
        console.error('Could not find JS or CSS in dist/assets');
        process.exit(1);
    }

    const distJs = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');
    const distCss = fs.readFileSync(path.join(assetsDir, cssFile), 'utf8');

    // Transpile JS to ES5
    const transpiled = await transformAsync(distJs, {
        presets: [['@babel/preset-env', { targets: { ie: '11' } }]],
        comments: false,
        minified: true,
    });

    // Build userscript
    const userscript = `${metadata}

(function() {
    'use strict';

    // Inject CSS
    var style = document.createElement('style');
    style.textContent = \`${distCss}\`;
    document.head.appendChild(style);

    // Inject HTML
    document.body.insertAdjacentHTML('beforeend', \`${chatButtonHtml}\n${chatModalHtml}\`);

    // Inject JS
    ${transpiled.code}

})();
`;

    fs.writeFileSync(path.join('dist', 'wplace-livechat.user.js'), userscript);
    console.log('Userscript built successfully!');
}

buildUserscript();

