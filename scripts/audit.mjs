import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
const html=read('index.html'),sw=read('sw.js');
const manifest=JSON.parse(read('manifest.webmanifest'));
const scripts=['bonus-breakdown.js','arena.js','rules-cards.js','auth-gate.js','result-social.js','add-professional.js'];
const inline=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(inline,'Script do aplicativo');
new vm.Script(inline,{filename:'index.html:inline'});
for(const file of scripts){
 assert.ok(fs.existsSync(file),file);
 assert.ok(html.includes(file),file+' deve carregar');
 assert.ok(sw.includes("'./"+file+"'"),file+' deve fazer parte do PWA');
 new vm.Script(read(file),{filename:file});
}
assert.ok(!fs.existsSync('monthly.json'),'Dados privados não podem ficar públicos em GitHub Pages');
assert.ok(!fs.existsSync('data.json'),'Resumo privado não pode ficar público');
assert.doesNotMatch(sw,/monthly\.json/);
assert.doesNotMatch(html,/fetch\('\.\/monthly\.json/);
assert.match(html,/bmw_x1_campaign_snapshot/);
assert.match(html,/!accessGranted/);
assert.match(html,/id="bmwGate"/);
assert.match(html,/id="eligibleCount"/);
assert.doesNotMatch(html,/valid\.length!==37/);
const arena=read('arena.js');
assert.match(arena,/maxlength="50"/);
assert.match(arena,/await window\.bmwAppToken/);
assert.match(arena,/!accessGranted/);
assert.match(arena,/arenaModPosts/);
assert.match(arena,/data-like/);
assert.match(arena,/arena-comment-form/);
const gate=read('auth-gate.js');
for(const pattern of [/isManager/,/getMember/,/checkSession/,/bmwGatePending/,/await refresh\(\)/,/window\.bmwLogout/])
 assert.match(gate,pattern);
const social=read('result-social.js');
for(const pattern of [/bmw_x1_result_comments/,/bmw_x1_result_likes/,/maxlength="50"/,/currentMember\.write/])
 assert.match(social,pattern);
const add=read('add-professional.js');
assert.match(add,/rpc\/bmw_x1_add_professional/);
assert.match(add,/if\(!admin\)return/);
const rules=read('rules-cards.js');assert.match(rules,/rules-cards/);
for(const path of ['index.html','sw.js','manifest.webmanifest'])assert.ok(fs.existsSync(path),path);
for(const icon of manifest.icons)assert.ok(fs.existsSync(icon.src.replace(/^\.\//,'')),icon.src);
assert.ok(fs.existsSync('bmw-x1-hero.webp'));
console.log('BMW X1: código, privacidade, login único, mural, comentários, novos cadastros e PWA verificados.');
