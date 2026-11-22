import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
const html=read('index.html'),sw=read('sw.js');
const manifest=JSON.parse(read('manifest.webmanifest'));
const scripts=['bonus-breakdown.js','arena.js','rules-cards.js','auth-gate.js','result-social.js','add-professional.js'];
const inline=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const cacheVersion=sw.match(/arena-x1-stable-v(\d+)/);
const registrationVersion=html.match(/sw\.js\?v=(\d+)/);
assert.ok(cacheVersion&&registrationVersion&&cacheVersion[1]===registrationVersion[1],'Service Worker registration/cache versions must match');
const buildVersion=html.match(/name="arena-build" content="arena-x1-v(\d+)"/);
assert.ok(buildVersion&&buildVersion[1]===cacheVersion[1],'Arena build metadata and PWA cache versions must match');

function idAttributes(source){
 return [...source.matchAll(/\s+id\s*=\s*\\?["']([^"'\\]+)\\?["']/g)].map(match=>match[1]);
}
const idSources=[
 ['index.html',html],
 ['bonus-breakdown.js',read('bonus-breakdown.js')],
 ['arena.js',read('arena.js')],
 ['rules-cards.js',read('rules-cards.js')],
 ['auth-gate.js',read('auth-gate.js')],
 ['result-social.js',read('result-social.js')],
 ['add-professional.js',read('add-professional.js')]
];
const seenIds=new Map();
for(const [file,source] of idSources){
 const ids=idAttributes(source),duplicates=ids.filter((id,index)=>ids.indexOf(id)!==index);
 assert.equal(duplicates.length,0,file+': IDs duplicados: '+[...new Set(duplicates)].join(', '));
 for(const id of ids){
  assert.ok(!seenIds.has(id),'ID "'+id+'" repetido entre '+seenIds.get(id)+' e '+file);
  seenIds.set(id,file);
 }
}

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
assert.match(html,/id="rankingDataWarning"/,'Ranking must expose pending-bonus warning');
assert.match(html,/bonus_suggested_pending_approval/,'Pending bonus state must be surfaced');
assert.match(html,/RANKING PROVISÓRIO/,'Pending bonus warning must be explicit');
assert.match(html,/Acesso exclusivo para Raphael e Luis/,'Manager login guidance must match the verified allowlisted accounts');
assert.doesNotMatch(html,/cadastro criado, aguardando confirmação por e-mail/i,'Do not publish stale manager confirmation instructions');
assert.match(html,/!accessGranted/);
assert.match(html,/id="bmwGate"/);
assert.match(html,/id="eligibleCount"/);
assert.doesNotMatch(html,/valid\.length!==37/);
const arena=read('arena.js');
assert.match(arena,/data-max-codepoints="50"/);
assert.match(arena,/chars\.slice\(0,50\)\.join\(''\)/);
assert.match(arena,/await window\.bmwAppToken/);
assert.doesNotMatch(arena,/auth\/v1\/signup|arenaSignup|arenaAuthForm|arenaRecover|auth\/v1\/token\?grant_type=password/,'A Arena não pode manter um segundo fluxo de autenticação/cadastro.');
assert.match(arena,/!accessGranted/);
assert.match(arena,/arenaModPosts/);
assert.match(arena,/data-like/);
assert.match(arena,/arena-comment-form/);
const gate=read('auth-gate.js');
for(const pattern of [/isManager/,/getMember/,/checkSession/,/bmwGatePending/,/await refresh\(\)/,/window\.bmwLogout/])
 assert.match(gate,pattern);
const social=read('result-social.js');
for(const pattern of [/bmw_x1_result_comments/,/bmw_x1_result_likes/,/data-max-codepoints="50"/,/Array\.from\(msg\)\.length>50/,/chars\.slice\(0,50\)\.join\(''\)/,/currentMember\?\.write|currentMember\.write/])
 assert.match(social,pattern);
assert.match(social,/if\(!admin&&!auth\.write\)/,'Read-only viewers must not query private social rows');

assert.match(html,/data-tab="arena"[^>]*id="arenaTab"/);
assert.match(html,/window\.bmwArenaOpen\(\)/);
assert.ok(html.includes("gate.style.display='block'"),'Unauthenticated navigation must display the access message');
assert.match(gate,/password!==el\('bmwGateConfirm'\)\.value/);
assert.match(gate,/auth\/v1\/signup/);
assert.match(gate,/auth\/v1\/signup\?redirect_to=/,'Email confirmation must return to the current canonical app URL');
assert.ok(html.includes("async function token(){const getToken=window.bmwAppToken;if(typeof getToken!=='function')return null;return await getToken()}"),'Manager token refresh must use the shared session controller');
assert.match(gate,/if\(manager\)\{\s*if\(!admin\)\{\s*storeAuth\(gateSession,true\);\s*await enableApp\(true\);\s*\}\s*return;\s*\}/,'Manager revalidation must restore the allowlisted role');
assert.match(arena,/const emojiSet=\['🔥','👏','💪','😂','👀','🏆'\]/);
assert.match(arena,/data-react=/);
assert.match(arena,/data-like=/);
assert.match(arena,/arena-comment-form/);
assert.match(social,/bmw_x1_result_comments/);
assert.match(social,/bmw_x1_result_likes/);

const add=read('add-professional.js');
assert.match(add,/rpc\/bmw_x1_add_professional/);
assert.match(add,/if\(!admin\)return/);
const rules=read('rules-cards.js');assert.match(rules,/rules-cards/);
for(const path of ['index.html','sw.js','manifest.webmanifest'])assert.ok(fs.existsSync(path),path);
for(const icon of manifest.icons)assert.ok(fs.existsSync(icon.src.replace(/^\.\//,'')),icon.src);
const shellMatch=sw.match(/const SHELL=\[([\s\S]*?)\];/);
assert.ok(shellMatch,'Lista de arquivos do pré-cache PWA');
const shellPaths=[...shellMatch[1].matchAll(/'([^']+)'/g)].map(match=>match[1]);
assert.equal(shellPaths.length,new Set(shellPaths).size,'Arquivos duplicados no pré-cache PWA');
for(const path of shellPaths)assert.ok(fs.existsSync(path.replace(/^\.\//,'')),'Arquivo ausente no pré-cache: '+path);
assert.ok(fs.existsSync('bmw-x1-hero.webp'));
const browserSmoke=read('scripts/browser-smoke.mjs');
assert.match(browserSmoke,/readFileSync\(new URL\('\.\.\/index\.html', import\.meta\.url\)/,'Chromium smoke must derive the expected build from source');
assert.match(browserSmoke,/expectedVersion/,'Chromium smoke must verify the matching live Service Worker version');
assert.doesNotMatch(browserSmoke,/arena-x1-v49|arena-x1-stable-v49|sw\.js\?v=49/,'Chromium smoke must not be pinned to a retired PWA version');
console.log('BMW X1: código, privacidade, login único, mural, comentários, novos cadastros e PWA verificados.');
