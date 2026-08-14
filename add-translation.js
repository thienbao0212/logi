import fs from 'fs';
import path from 'path';

const [,, keyPath, enValue, viValue] = process.argv;

if (!keyPath || !enValue || !viValue) {
  console.error("Usage: node add-translation.js <keyPath> <enValue> <viValue>");
  process.exit(1);
}

function setNestedKey(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

function updateFile(filename, value) {
  const filePath = path.resolve('src/locales', filename);
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch(e) {}
  
  setNestedKey(data, keyPath, value);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

updateFile('en.json', enValue);
updateFile('vi.json', viValue);
console.log(`Added ${keyPath} to en.json and vi.json`);
