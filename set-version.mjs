import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const commit = execSync('git rev-parse --short HEAD').toString().trim();
let content = '';

try {
  content = readFileSync('.env.local', 'utf8');
} catch {
  content = '';
}

// elimina versiones viejas
const cleaned = content.replace(/^NEXT_PUBLIC_VERSION=.*$/m, '').trim();
const newContent = `${cleaned}\nNEXT_PUBLIC_VERSION=${commit}\n`;

writeFileSync('.env.local', newContent);
console.log('Versión registrada:', commit);
