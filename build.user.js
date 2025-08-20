import fs from 'fs';
import path from 'path';
import JavaScriptObfuscator from 'javascript-obfuscator';

const inputFile = 'wplace_livechat.user.js';
const metadataFile = 'userscript.txt';
const distDir = 'dist';
const outputFile = path.join(distDir, 'script.build.user.js');

if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

const code = fs.readFileSync(inputFile, 'utf-8');
const metadata = fs.readFileSync(metadataFile, 'utf-8');

const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    stringArray: true,
    stringArrayEncoding: ['rc4'],
    rotateStringArray: true,
    simplify: true,
    splitStrings: false,
    transformObjectKeys: false,
    unicodeEscapeSequence: false
}).getObfuscatedCode();

const finalCode = metadata + '\n' + obfuscatedCode;

fs.writeFileSync(outputFile, finalCode);

console.log(`Build complete: ${outputFile}`);
