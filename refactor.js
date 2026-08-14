import fs from 'fs';
import path from 'path';

function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
}

const uiDir = path.join(process.cwd(), 'src/ui');
const srcDir = path.join(process.cwd(), 'src');

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allSrcFiles = getAllFiles(srcDir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

// 1. Rename files in src/ui and build a mapping
const renameMap = new Map(); // old basename -> new basename
const uiFiles = getAllFiles(uiDir).filter(f => f.endsWith('.tsx'));

for (const filePath of uiFiles) {
  const basename = path.basename(filePath, '.tsx');
  if (basename.toLowerCase() !== basename) {
    const snake = toSnakeCase(basename);
    const newPath = path.join(path.dirname(filePath), `${snake}.tsx`);
    fs.renameSync(filePath, newPath);
    renameMap.set(basename, snake);
    console.log(`Renamed ${basename}.tsx -> ${snake}.tsx`);
  }
}

// 2. Update imports and fetch in all files
const allFilesNow = getAllFiles(srcDir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

for (const filePath of allFilesNow) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Update imports
  for (const [oldName, newName] of renameMap.entries()) {
    const regex = new RegExp(`(['"\`/])${oldName}(['"\`.])`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `$1${newName}$2`);
      changed = true;
    }
  }

  // Refactor fetch -> apiFetch
  if (content.includes('fetch(') && !filePath.includes('fetch.ts') && !filePath.includes('i18n.ts')) {
    content = content.replace(/await fetch\(/g, 'await apiFetch(');
    content = content.replace(/fetch\(/g, 'apiFetch(');
    if (!content.includes('apiFetch')) {
       // just in case
    } else if (!content.includes('@/lib/fetch.js')) {
       content = `import { apiFetch } from '@/lib/fetch.js';\n` + content;
    }
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}
console.log('Refactor complete.');
