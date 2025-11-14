const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, '..', 'src', 'locales');
const files = ['es.json','en.json','fr.json'].map(f=>path.join(base,f));

function load(file){
  return JSON.parse(fs.readFileSync(file,'utf8'));
}

function collectKeys(obj, prefix=''){
  const keys = new Set();
  if (typeof obj === 'string' || obj === null) return keys;
  if (Array.isArray(obj)) {
    // arrays: include index keys
    obj.forEach((v,i)=>{
      const k = prefix ? `${prefix}.${i}` : `${i}`;
      collectKeys(v,k).forEach(x=>keys.add(x));
    });
    return keys;
  }
  for (const k of Object.keys(obj)){
    const full = prefix ? `${prefix}.${k}` : k;
    keys.add(full);
    const sub = obj[k];
    if (typeof sub === 'object' && sub !== null) {
      collectKeys(sub, full).forEach(x=>keys.add(x));
    }
  }
  return keys;
}

const data = files.map(f=>({file: path.basename(f), json: load(f), keys: collectKeys(load(f))}));

// produce summary
const allKeys = new Set();
data.forEach(d=>d.keys.forEach(k=>allKeys.add(k)));

const missing = {};
for (const d of data){
  missing[d.file] = [];
}

for (const k of Array.from(allKeys).sort()){
  for (const d of data){
    if (!d.keys.has(k)) missing[d.file].push(k);
  }
}

console.log('Checked files:', files.join(', '));
for (const d of data){
  console.log('\nMissing keys in', d.file, ':');
  if (missing[d.file].length===0) console.log('  (none)');
  else missing[d.file].forEach(k=>console.log('  -', k));
}
