import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
test('All static assets and application DOM IDs are present, unique and local',()=>{
  const html=readFileSync('dist/index.html','utf8'),app=readFileSync('dist/app.js','utf8');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
  const dynamic=new Set(['mapping-rows','bloch0','bloch1',...Array.from(readFileSync('dist/music-controls.js','utf8').matchAll(/\bid="([^"]+)"/g),m=>m[1])]);
  for(const [,id] of app.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.includes(id)||dynamic.has(id),`Missing DOM id ${id}`);
  for(const [,path]of html.matchAll(/(?:src|href)="([^"]+)"/g))if(!path.startsWith('https:')&&!path.startsWith('#'))assert.ok(existsSync(resolve('dist',path)),`Missing asset ${path}`);
  assert.ok(!html.includes('https://fonts.'));assert.ok(!/fetch\(|XMLHttpRequest/.test(app));
  assert.ok(html.includes('noindex,nofollow'));assert.ok(html.includes('restricted access'));assert.ok(html.includes('seeded classical pseudorandom'));
});
