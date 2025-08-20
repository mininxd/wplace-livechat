import fs from 'fs';
import path from 'path';

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
}

// Read userscript metadata
const metadata = fs.readFileSync('userscript.txt', 'utf8');

// Read and bundle all JS files
const mainJs = fs.readFileSync('src/main.js', 'utf8');
const connectJs = fs.readFileSync('src/connect.js', 'utf8');
const chatRenderJs = fs.readFileSync('src/chatRender.js', 'utf8');
const detectHttpJs = fs.readFileSync('src/lib/detectHttpRequest.js', 'utf8');
const wplaceDataJs = fs.readFileSync('src/lib/wplaceData.js', 'utf8');
const stylesCss = fs.readFileSync('src/style.css', 'utf8');
const themesCss = fs.readFileSync('src/themes.css', 'utf8');

// Read HTML content from index.html
const htmlContent = fs.readFileSync('index.html', 'utf8');

// Extract the chat modal and button HTML
const chatButtonMatch = htmlContent.match(/<div class="fixed bottom-\[100px\] right-\[20px\]">[\s\S]*?<\/div>/);
const chatModalMatch = htmlContent.match(/<dialog id="chatModal"[\s\S]*?<\/dialog>/);

const chatButtonHtml = chatButtonMatch ? chatButtonMatch[0] : '';
const chatModalHtml = chatModalMatch ? chatModalMatch[0] : '';

// Create userscript content
const userscript = `${metadata}

(function() {
    'use strict';
    
    // Inject CSS
    const css = \`${stylesCss}\n${themesCss}\`;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    
    // Inject HTML
    const chatHtml = \`${chatButtonHtml}\n${chatModalHtml}\`;
    document.body.insertAdjacentHTML('beforeend', chatHtml);
    
    // Utility functions
    ${detectHttpJs.replace('export default function main()', 'function getPixelUrl()')}
    
    // Connection functions
    ${connectJs.replace(/export async function/g, 'async function')}
    
    // Wplace data functions
    ${wplaceDataJs.replace(/import pixelUrl from.*\n/, '').replace(/export async function/g, 'async function').replace('pixelUrl()', 'getPixelUrl()')}
    
    // Chat render functions
    ${chatRenderJs.replace(/import.*\n/g, '').replace(/export \{.*\};/, '')}
    
    // Main functionality
    ${mainJs.replace(/import.*\n/g, '').replace('./lib/wplceData.js', './lib/wplaceData.js')}
    
})();`;

// Write userscript file
fs.writeFileSync('dist/wplace-livechat.user.js', userscript);

console.log('Userscript built successfully!');