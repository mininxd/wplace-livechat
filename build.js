import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DIST_DIR = './dist';
const USERSCRIPT_METADATA_FILE = './userscript.txt';
const OUTPUT_FILE = './dist/wplace-live-chats.user.js';

function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error.message);
        return null;
    }
}

function extractAssetsFromHTML(htmlContent) {
    const assets = {
        css: [],
        js: []
    };
    
    // Simple regex to find CSS and JS assets
    const cssMatches = htmlContent.match(/href="\.\/assets\/[^"]+\.css"/g) || [];
    const jsMatches = htmlContent.match(/src="\.\/assets\/[^"]+\.js"/g) || [];
    
    cssMatches.forEach(match => {
        const href = match.match(/href="\.\/assets\/([^"]+)"/)[1];
        assets.css.push('assets/' + href);
    });
    
    jsMatches.forEach(match => {
        const src = match.match(/src="\.\/assets\/([^"]+)"/)[1];
        assets.js.push('assets/' + src);
    });
    
    return assets;
}

function buildUserscript() {
    console.log('🚀 Starting Tampermonkey userscript build...');
    
    // Read userscript metadata
    const metadata = readFile(USERSCRIPT_METADATA_FILE);
    if (!metadata) {
        console.error('❌ Could not read userscript metadata file');
        return;
    }
    
    // Read HTML file to extract asset references
    const htmlPath = path.join(DIST_DIR, 'index.html');
    const htmlContent = readFile(htmlPath);
    if (!htmlContent) {
        console.error('❌ Could not read HTML file');
        return;
    }
    
    // Extract assets from HTML
    const assets = extractAssetsFromHTML(htmlContent);
    console.log('📦 Found assets:', assets);
    
    // Read and combine CSS files
    let combinedCSS = '';
    for (const cssFile of assets.css) {
        const cssPath = path.join(DIST_DIR, cssFile);
        const cssContent = readFile(cssPath);
        if (cssContent) {
            combinedCSS += cssContent + '\n';
            console.log(`✅ Added CSS: ${cssFile}`);
        }
    }
    
    // Read and combine JS files
    let combinedJS = '';
    for (const jsFile of assets.js) {
        const jsPath = path.join(DIST_DIR, jsFile);
        const jsContent = readFile(jsPath);
        if (jsContent) {
            combinedJS += jsContent + '\n';
            console.log(`✅ Added JS: ${jsFile}`);
        }
    }
    
    // Build the complete userscript
    let userscript = metadata + '\n\n';
    
    // Add CSS using GM_addStyle if there's any CSS
    if (combinedCSS.trim()) {
        userscript += '// Add CSS styles\n';
        userscript += 'GM_addStyle(`\n';
        userscript += combinedCSS;
        userscript += '`);\n\n';
    }
    
    // Add JavaScript code
    if (combinedJS.trim()) {
        userscript += '// Main JavaScript code\n';
        userscript += '(function() {\n';
        userscript += '    \'use strict\';\n\n';
        
        // Wrap the code to handle potential module exports/imports
        userscript += '    // Wrapped Vite build output\n';
        userscript += '    try {\n';
        userscript += '        ' + combinedJS.split('\n').join('\n        ') + '\n';
        userscript += '    } catch (error) {\n';
        userscript += '        console.error(\'Wplace Live Chats Error:\', error);\n';
        userscript += '    }\n';
        userscript += '})();\n';
    }
    
    // Create dist directory if it doesn't exist
    if (!fs.existsSync(DIST_DIR)) {
        fs.mkdirSync(DIST_DIR, { recursive: true });
    }
    
    // Write the userscript file
    try {
        fs.writeFileSync(OUTPUT_FILE, userscript, 'utf8');
        console.log(`✅ Userscript built successfully: ${OUTPUT_FILE}`);
        console.log(`📊 File size: ${(userscript.length / 1024).toFixed(2)} KB`);
        
        // Show summary
        console.log('\n📋 Build Summary:');
        console.log(`   CSS files: ${assets.css.length}`);
        console.log(`   JS files: ${assets.js.length}`);
        console.log(`   Total size: ${(userscript.length / 1024).toFixed(2)} KB`);
        console.log('\n🎉 Ready to install in Tampermonkey!');
        
    } catch (error) {
        console.error('❌ Error writing userscript file:', error.message);
    }
}

// Alternative method: Read all files in assets directory directly
function buildUserscriptDirect() {
    console.log('🚀 Starting direct assets build...');
    
    const assetsDir = path.join(DIST_DIR, 'assets');
    
    if (!fs.existsSync(assetsDir)) {
        console.error('❌ Assets directory not found');
        return;
    }
    
    // Read userscript metadata
    const metadata = readFile(USERSCRIPT_METADATA_FILE);
    if (!metadata) {
        console.error('❌ Could not read userscript metadata file');
        return;
    }
    
    // Read all files in assets directory
    const assetFiles = fs.readdirSync(assetsDir);
    let combinedCSS = '';
    let combinedJS = '';
    
    for (const file of assetFiles) {
        const filePath = path.join(assetsDir, file);
        const content = readFile(filePath);
        
        if (!content) continue;
        
        if (file.endsWith('.css')) {
            combinedCSS += content + '\n';
            console.log(`✅ Added CSS: ${file}`);
        } else if (file.endsWith('.js')) {
            combinedJS += content + '\n';
            console.log(`✅ Added JS: ${file}`);
        }
    }
    
    // Build the complete userscript (same as above)
    let userscript = metadata + '\n\n';
    
    if (combinedCSS.trim()) {
        userscript += '// Add CSS styles\n';
        userscript += 'GM_addStyle(`\n';
        userscript += combinedCSS;
        userscript += '`);\n\n';
    }
    
    if (combinedJS.trim()) {
        userscript += '// Main JavaScript code\n';
        userscript += '(function() {\n';
        userscript += '    \'use strict\';\n\n';
        userscript += '    try {\n';
        userscript += '        ' + combinedJS.split('\n').join('\n        ') + '\n';
        userscript += '    } catch (error) {\n';
        userscript += '        console.error(\'Wplace Live Chats Error:\', error);\n';
        userscript += '    }\n';
        userscript += '})();\n';
    }
    
    // Write the userscript file
    try {
        fs.writeFileSync(OUTPUT_FILE, userscript, 'utf8');
        console.log(`✅ Userscript built successfully: ${OUTPUT_FILE}`);
        console.log(`📊 File size: ${(userscript.length / 1024).toFixed(2)} KB`);
    } catch (error) {
        console.error('❌ Error writing userscript file:', error.message);
    }
}

// Main execution
const isDirect = process.argv.includes('--direct');

if (isDirect) {
    buildUserscriptDirect();
} else {
    buildUserscript();
}

// Export functions for potential use as module
export { buildUserscript, buildUserscriptDirect };
