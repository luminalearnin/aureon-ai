import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('index.html', 'dist/index.html');
await cp('manus-routes.json', 'dist/manus-routes.json');
await cp('src', 'dist/src', { recursive: true });

const entryPath = 'dist/index.html';
const entry = await readFile(entryPath, 'utf8');
await writeFile(entryPath, entry.replaceAll('="/src/', '="./src/'));
