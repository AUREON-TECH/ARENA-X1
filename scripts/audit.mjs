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
assert.match(html, /baseXP\(p\)\+approved\(p\.name\)/);
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
console.log('BMW X1 AUDITORIA OK: 37 participantes, 6 meses, regras, Paulo, cadastro FTB, JS, PWA e arquivos.');
