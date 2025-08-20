import fs from 'fs';
import { build } from 'esbuild';

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
}

// Read userscript metadata
const metadata = fs.readFileSync('userscript.txt', 'utf8');

// Read HTML content from index.html
const htmlContent = fs.readFileSync('index.html', 'utf8');

// Extract the chat modal and button HTML
const chatButtonMatch = htmlContent.match(/<div class="fixed bottom-\[100px\] right-\[20px\]">[\s\S]*?<\/div>/);
const chatModalMatch = htmlContent.match(/<dialog id="chatModal"[\s\S]*?<\/dialog>/);

const chatButtonHtml = chatButtonMatch ? chatButtonMatch[0] : '';
const chatModalHtml = chatModalMatch ? chatModalMatch[0] : '';

// Bundle JavaScript with esbuild
const result = await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'iife',
  write: false,
  minify: false,
  target: 'es2020',
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});

const bundledJs = result.outputFiles[0].text;

// Read CSS files
const stylesCss = fs.readFileSync('src/style.css', 'utf8');
const themesCss = fs.readFileSync('src/themes.css', 'utf8');

// Create userscript content
const userscript = `${metadata}

(function() {
    'use strict';
    
    // Inject CSS
    const css = \`${stylesCss}
${themesCss}\`;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    
    // Inject HTML
    const chatHtml = \`${chatButtonHtml}
${chatModalHtml}\`;
    document.body.insertAdjacentHTML('beforeend', chatHtml);
    
    // Bundled JavaScript
    ${bundledJs.replace('(() => {', '').replace(/}\)\(\);$/, '')}
    
})();`;

// Write userscript file
fs.writeFileSync('dist/wplace-livechat.user.js', userscript);

console.log('Userscript built successfully!');