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
assert.ok(sw.includes("const SCOPE=new URL(self.registration.scope)"),'Service Worker must bind cache scope to its own app path');
assert.ok(sw.includes("const SHELL_PATHS=new Set"),'Only the static PWA shell may be cached');
assert.ok(sw.includes("if(url.origin!==SCOPE.origin||!url.pathname.startsWith(SCOPE.pathname))return;"),'Cross-origin and out-of-scope requests must bypass CacheStorage');
assert.ok(sw.includes("if(!SHELL_PATHS.has(url.pathname))return;"),'Non-shell same-origin requests must bypass CacheStorage');
assert.ok(!sw.includes("cache.put(req"),'Never cache the original request URL, which may contain an auth callback query');
assert.ok(sw.includes("cache.put(INDEX_URL"),'Navigation responses must be cached under the clean canonical app shell URL');
assert.ok(sw.includes("cache.put(cacheKey"),'Static assets must be cached under clean allowlisted URLs');


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
assert.match(html,/Presença e pontualidade também são estimadas por dias de calendário.*não comprovam comparecimento ou pontualidade efetivos/i,'Ranking must disclose that attendance and punctuality XP is provisional');
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
assert.match(gate,/rpc\/bmw_x1_available_roster/,'Signup and post-confirmation request must use the safe available-roster RPC');
assert.doesNotMatch(gate,/\/rest\/v1\/bmw_x1_roster\?select=professional,role/,'Do not load occupied professionals directly into the signup selector');
const availableRosterMigration=read('supabase/migrations/20261125093629_bmw_x1_available_roster.sql');
assert.match(availableRosterMigration,/CREATE OR REPLACE FUNCTION public\.bmw_x1_available_roster/);
assert.match(availableRosterMigration,/SECURITY DEFINER/);
assert.match(availableRosterMigration,/SET search_path TO ''/);
assert.match(availableRosterMigration,/status IN \('pending', 'approved'\)/);
assert.match(availableRosterMigration,/GRANT EXECUTE ON FUNCTION public\.bmw_x1_available_roster\(\) TO anon, authenticated/);
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
assert.match(add,/dateField\.max=todayLocal\(\)/,'Manager admission date must not allow future dates');
assert.match(add,/start>today/,'Manager admission date must reject future dates before calling the RPC');
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

const dbMigrationPath='supabase/migrations/20261123003028_bmw_x1_social_validation_constraints.sql';
const dbMigration=read(dbMigrationPath);
for(const constraint of [
 'bmw_x1_posts_body_1_50_ck',
 'bmw_x1_posts_category_ck',
 'bmw_x1_comments_body_1_50_ck',
 'bmw_x1_result_comments_body_1_50_ck',
 'bmw_x1_reactions_emoji_ck',
 'bmw_x1_members_status_ck',
 'bmw_x1_roster_role_ck'
]){
 assert.match(dbMigration,new RegExp('ADD CONSTRAINT\\s+'+constraint+'\\b'),'Migration must define '+constraint);
 assert.match(dbMigration,new RegExp('VALIDATE CONSTRAINT\\s+'+constraint+'\\b'),'Migration must validate '+constraint);
}
assert.match(dbMigration,/char_length\(body\) BETWEEN 1 AND 50/,'Social text must be capped at 50 characters in PostgreSQL');
assert.match(dbMigration,/emoji IN \('🔥','👏','💪','😂','👀','🏆'\)/,'Database reaction values must match the six UI reaction choices');


const cleanupMigration=read('supabase/migrations/20261123013748_bmw_x1_remove_duplicate_check_constraints.sql');
for(const constraint of [
 'bmw_x1_posts_category_ck',
 'bmw_x1_members_status_ck',
 'bmw_x1_reactions_emoji_ck',
 'bmw_x1_roster_role_ck'
]){
 assert.match(cleanupMigration,new RegExp('DROP CONSTRAINT IF EXISTS\\s+'+constraint+'\\b'),'Cleanup migration must remove redundant '+constraint);
}


const activeRequestMigration=read('supabase/migrations/20261123123844_bmw_x1_prevent_duplicate_active_professional_requests.sql');
assert.match(activeRequestMigration,/CREATE UNIQUE INDEX IF NOT EXISTS bmw_x1_one_active_account_per_professional/,'Active professional request uniqueness migration must be versioned in the repository');
assert.ok(activeRequestMigration.includes('ON public.bmw_x1_members (professional)'),'Active request index must target the professional column');
assert.ok(activeRequestMigration.includes("WHERE status IN ('pending', 'approved')"),'Only pending and approved requests should block a new account');

const rosterPrivacyMigrationPath='supabase/migrations/20261125114026_bmw_x1_restrict_roster_to_available_rpc.sql';
const rosterPrivacyMigration=read(rosterPrivacyMigrationPath);
assert.ok(rosterPrivacyMigration.includes('REVOKE SELECT ON TABLE public.bmw_x1_roster FROM anon, authenticated'),'Direct roster reads must be revoked from client roles');
assert.ok(rosterPrivacyMigration.includes('DROP POLICY IF EXISTS bmw_roster_public_signup_read'),'Public direct roster policy must be removed');
assert.ok(rosterPrivacyMigration.includes('DROP POLICY IF EXISTS bmw_roster_read'),'Authenticated direct roster policy must be removed');
for(const file of ['index.html','auth-gate.js','arena.js','result-social.js','add-professional.js','bonus-breakdown.js','rules-cards.js']){
 assert.ok(!read(file).includes('/rest/v1/bmw_x1_roster'),'Client code must use the least-privilege available-roster RPC, not direct roster reads: '+file);
}
console.log('BMW X1: código, privacidade, login único, mural, comentários, novos cadastros e PWA verificados.');


const managerDateMigrationPath='supabase/migrations/20261126084000_bmw_x1_manager_admission_sao_paulo_date.sql';
const managerDateMigration=read(managerDateMigrationPath);
assert.match(managerDateMigration,/v_today date := \\(now\\(\\) AT TIME ZONE 'America\\/Sao_Paulo'\\)::date/i,'Manager admission dates must use the same Sao Paulo calendar as the browser.');
assert.match(managerDateMigration,/p_start > v_today/,'Database must reject dates after the current Sao Paulo date.');
assert.match(managerDateMigration,/least\\(v_last,v_today,'2026-12-31'::date\\)/i,'Eligibility-day calculations must use the Sao Paulo business date.');
