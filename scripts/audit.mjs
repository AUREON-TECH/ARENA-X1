import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read = (file) => fs.readFileSync(file, 'utf8');
const months = ['2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'];
const rates = { CAPTADOR: 1.4, CONSULTOR: 1.2, CLOSER: 1 };
const data = JSON.parse(read('monthly.json'));
const html = read('index.html');
const manifest = JSON.parse(read('manifest.webmanifest'));
const sw = read('sw.js');

assert.equal(data.campaign_start, '2026-07-01');
assert.equal(data.campaign_end, '2026-12-31');
assert.equal(data.records.length, 37, 'São esperados 37 profissionais ativos');
assert.equal(new Set(data.records.map((p) => p.name)).size, 37, 'Nomes duplicados');
assert.deepEqual(
  Object.fromEntries(Object.keys(rates).map((role) => [role, data.records.filter((p) => p.role === role).length])),
  { CAPTADOR: 23, CONSULTOR: 9, CLOSER: 5 },
);
for (const person of data.records) {
  assert.ok(person.role in rates, 'Função não elegível: ' + person.name);
  assert.equal(person.months.length, 6, person.name + ': meses');
  assert.deepEqual(person.months.map((m) => m.month), months, person.name + ': ordem mensal');
  const gross = person.months.reduce((sum, m) => sum + Number(m.vgv_gross || 0), 0);
  assert.ok(Math.abs(gross - person.vgv_gross_total) < 0.02, person.name + ': VGV acumulado');
  assert.equal(person.xp_base, Math.round(person.vgv_gross_total * rates[person.role]), person.name + ': XP total base');
  for (const m of person.months) {
    assert.equal(m.xp_base, Math.round(m.vgv_gross * rates[person.role]), person.name + ': XP de ' + m.month);
    assert.ok(m.attend >= m.sales, person.name + ': vendas acima de atendimentos');
  }
}
const paulo = data.records.find((p) => p.name === 'PAULO VICTOR ORTIZ');
assert.equal(paulo.eligibility_start, '2026-08-21');
assert.equal(paulo.months[0].vgv_gross, 0);
assert.equal(paulo.months[0].xp_base, 0);
assert.ok(data.records.some(p => p.name === 'ALEX DE MENDES BRITO' && p.role === 'CONSULTOR'));
assert.ok(data.records.some(p => p.name === 'MARCELO DE FREITAS MATHEUS' && p.role === 'CONSULTOR'));
assert.match(html, /id="eligibleCount">37<\/b>/);
assert.match(html, /PONTUAÇÃO \/ R\$ 1\.000/);
assert.match(html, /function baseXP\(p\)/);
assert.match(html, /function ownXP\(p\)/);
assert.match(html, /function rendaXP\(p,month\)/);
assert.match(html, /function casalXP\(p,month\)/);
assert.match(html, /function eficienciaXP\(p\)/);
assert.match(html, /function drawPodium\(\)/);
assert.match(html, /publicRefreshBtn/);
assert.match(html, /Promise\.allSettled/);
assert.match(html, /id="loginForm"/);
assert.match(html, /id="rules"/);
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'JS não encontrado');
new vm.Script(script);
for (const path of ['index.html','sw.js','monthly.json','manifest.webmanifest']) assert.ok(fs.existsSync(path));
for (const icon of manifest.icons) assert.ok(fs.existsSync(icon.src.replace(/^\.\//, '')), icon.src);
assert.ok(fs.existsSync('bmw-x1-hero.webp'));
assert.match(sw, /CACHE=/);

for(const file of ['arena.js','rules-cards.js','bonus-breakdown.js']){
  assert.ok(fs.existsSync(file),file);
  assert.ok(html.includes(file),file+' ausente do HTML');
  assert.ok(sw.includes("'./"+file+"'"),file+' ausente do PWA');
  new vm.Script(read(file),{filename:file});
}
const arena=read('arena.js');
for(const pattern of [/maxlength="50"/,/arenaSignup/,/arenaRequest/,/arenaReviewList/,/arenaModPosts/,/data-like/,/arena-comment-form/,/requester_email/])
 assert.match(arena,pattern,'Arena não contém função esperada: '+pattern);
const ruleScript=read('rules-cards.js');
assert.match(ruleScript,/drawRules=async function/);
const begin=script.indexOf('function approved('),end=script.indexOf('function drawRank()',begin);
assert.ok(begin>0&&end>begin,'Funções de pontuação não localizadas');
const changes=[{person:'PAULO VICTOR ORTIZ',month:'2026-08',category:'top',points:400000}];
const ctxt={people:data.records,changes,approvalsAvailable:true,MONTHS:months,Intl,Date};
const fx=vm.runInNewContext(script.slice(begin,end)+';({approved,baseXP,topXP,rendaXP,casalXP,eficienciaXP,attendanceXP,otherBonusXP,ownXP,monthTotalXP,monthDays})',ctxt);
assert.equal(fx.approved('PAULO VICTOR ORTIZ'),400000);
assert.equal(fx.topXP(paulo,'2026-08'),400000,'TOP de Paulo não deve ser duplicado');
assert.equal(data.records.reduce((n,p)=>n+fx.rendaXP(p),0),2400000);
for(const p of data.records){
 if(p.role!=='CAPTADOR'){assert.equal(fx.rendaXP(p),0);assert.equal(fx.casalXP(p),0)}
 if(p.role!=='CONSULTOR')assert.equal(fx.eficienciaXP(p),0);
 assert.equal(p.months.reduce((n,m)=>n+fx.monthTotalXP(p,m.month),0),fx.ownXP(p),p.name+' XP não fecha');
}
const bianca=data.records.find(p=>p.name==='BIANCA MARIA DE OLIVEIRA SANTOS');
const before=fx.attendanceXP(bianca,'presenca','2026-07');
changes.push({person:bianca.name,month:'2026-07',category:'presenca',points:-50000});
assert.equal(fx.attendanceXP(bianca,'presenca','2026-07'),before-50000,'Desconto por falta');
changes.pop();

console.log('BMW X1 AUDITORIA OK: 37 participantes, 6 meses, regras, Paulo, cadastro FTB, JS, PWA e arquivos.');
