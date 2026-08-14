import fs from 'fs';
import path from 'path';

function fixFetchInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Pattern 1: login, shipment_list, shipment_detail, create_shipment_modal, edit_shipment_modal
  // const res = await apiFetch(...);
  // const json = await res.json();
  if (content.includes('const json = await res.json()')) {
    content = content.replace(/const res = await apiFetch/g, 'const json = await apiFetch');
    content = content.replace(/\s*const json = await res\.json\(\);/g, '');
    changed = true;
  }

  // Pattern 2: customs_tab
  // const res = await apiFetch(...);
  // const data: CustomsData = await res.json();
  if (content.includes('const data: CustomsData = await res.json()')) {
    content = content.replace(/const res = await apiFetch/g, 'const data: CustomsData = await apiFetch');
    content = content.replace(/\s*const data: CustomsData = await res\.json\(\);/g, '');
    changed = true;
  }

  // Pattern 3: containers_tab, tasks_tab, issues_tab
  // const data: Type[] = await res.json();
  // const newType: Type = await res.json();
  if (content.includes('await res.json()')) {
    // Replace const res = await apiFetch(...) with const temp_res = await apiFetch(...)
    content = content.replace(/const res = await apiFetch/g, 'const _fetchRes = await apiFetch');
    content = content.replace(/await res\.json\(\)/g, '_fetchRes');
    changed = true;
  }

  // Remove `if (!res.ok) { ... }` block entirely because apiFetch throws
  if (content.includes('if (!res.ok)')) {
    content = content.replace(/\s*if\s*\(!res\.ok\)\s*\{\s*throw\s*new\s*Error[^}]+\}\s*\}/g, '');
    content = content.replace(/\s*if\s*\(!res\.ok\)\s*\{\s*throw\s*new\s*Error[^}]+\}\s*/g, '');
    content = content.replace(/\s*if\s*\(!res\.ok\)\s*return;/g, '');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      fixFetchInFile(fullPath);
    }
  }
}

walk(path.join(process.cwd(), 'src/ui'));
