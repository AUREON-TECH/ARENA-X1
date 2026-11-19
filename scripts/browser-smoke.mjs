import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.ARENA_URL || 'https://aureon-tech.github.io/ARENA-X1/';
const expectedBuild = 'arena-x1-v47';
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const pageErrors = [];
const unsafeRequests = [];
let signupRequests = 0;

await context.addInitScript(() => {
  window.__auditBlockedWrites = [];
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || String(input);
    const method = String(init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    if (url.includes('veznreiamwstlulkpocz.supabase.co') && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      window.__auditBlockedWrites.push({ method, url });
      return Promise.reject(new Error('Blocked by read-only browser audit'));
    }
    return originalFetch(input, init);
  };
});

page.on('pageerror', error => pageErrors.push(error.message));
page.on('request', request => {
  const url = request.url();
  const method = request.method().toUpperCase();
  if (url.includes('/auth/v1/signup')) signupRequests++;
  if (url.includes('veznreiamwstlulkpocz.supabase.co') && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    unsafeRequests.push({ method, url });
  }
});

try {
  let deployed = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
      const build = await page.locator('meta[name="arena-build"]').getAttribute('content').catch(() => null);
      const source = await page.content();
      if (build === expectedBuild && source.includes("gate.style.display='block'")) {
        deployed = true;
        break;
      }
    } catch {}
    await page.waitForTimeout(5000);
  }
  assert.ok(deployed, 'GitHub Pages did not serve ' + expectedBuild + ' at ' + baseUrl);

  await page.waitForFunction(
    () => typeof window.bmwArenaOpen === 'function' && typeof window.bmwAppToken === 'function',
    null,
    { timeout: 30000 }
  );
  assert.match(await page.title(), /ARENA X1/i);

  const duplicateIds = await page.locator('[id]').evaluateAll(nodes => {
    const ids = nodes.map(node => node.id).filter(Boolean);
    return [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  });
  assert.deepEqual(duplicateIds, [], 'Runtime DOM must not contain duplicate IDs');

  const manifest = await page.locator('link[rel="manifest"]').getAttribute('href');
  assert.ok(manifest, 'PWA manifest link must exist');
  const manifestResponse = await context.request.get(new URL(manifest, baseUrl).toString());
  assert.equal(manifestResponse.status(), 200, 'PWA manifest must load');
  const manifestJson = await manifestResponse.json();
  assert.equal(manifestJson.start_url, '/ARENA-X1/');
  assert.equal(manifestJson.scope, '/ARENA-X1/');

  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration?.active?.state === 'activated';
  }, null, { timeout: 45000 });
  const swInfo = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return { scope: registration?.scope || '', state: registration?.active?.state || '' };
  });
  assert.match(swInfo.scope, /\/ARENA-X1\/$/);
  assert.equal(swInfo.state, 'activated');
  const swResponse = await context.request.get(new URL('sw.js?v=47', baseUrl).toString());
  assert.equal(swResponse.status(), 200, 'Service Worker must load');
  assert.match(await swResponse.text(), /arena-x1-stable-v47/);

  await page.evaluate(() => window.nav('arena'));
  await page.waitForFunction(
    () => document.getElementById('bmwGateMessage')?.style.display === 'block',
    null,
    { timeout: 5000 }
  );
  const gateMessage = await page.locator('#bmwGateMessage').innerText();
  assert.match(gateMessage, /Entre na sua conta/i);
  assert.equal(
    await page.locator('#arena').evaluate(element => element.classList.contains('hidden')),
    true,
    'Unauthenticated navigation must not open the Arena'
  );

  await page.locator('#bmwGateSignup').click();
  await page.waitForFunction(
    () => getComputedStyle(document.getElementById('bmwGateConfirmWrap')).display !== 'none',
    null,
    { timeout: 5000 }
  );
  await page.waitForFunction(
    () => (document.querySelectorAll('#bmwSignupProfessional option').length || 0) > 1,
    null,
    { timeout: 20000 }
  );
  await page.locator('#bmwSignupProfessional').selectOption({ index: 1 });
  await page.locator('#bmwGateEmail').fill('browser-audit@example.invalid');
  await page.locator('#bmwGatePassword').fill('Senha123!');
  await page.locator('#bmwGateConfirm').fill('SenhaDiferente123!');
  await page.locator('#bmwGateEnter').click();
  await page.waitForFunction(
    () => document.getElementById('bmwGateMessage')?.textContent.includes('As duas senhas estão diferentes'),
    null,
    { timeout: 5000 }
  );
  assert.equal(signupRequests, 0, 'Mismatched passwords must not call Supabase signup');
  assert.deepEqual(unsafeRequests, [], 'Browser audit must not send write requests to production');
  const blockedWrites = await page.evaluate(() => window.__auditBlockedWrites || []);
  assert.deepEqual(blockedWrites, [], 'No production writes should be attempted by this smoke test');

  for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport);
    const dimensions = await page.evaluate(() => ({
      width: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth
    }));
    assert.ok(
      dimensions.documentWidth <= dimensions.width + 1,
      'Horizontal overflow at ' + viewport.width + 'px: ' + JSON.stringify(dimensions)
    );
  }

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 20000 });
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  assert.match(await page.title(), /ARENA X1/i, 'Cached app shell must load offline');
  await context.setOffline(false);

  assert.deepEqual(pageErrors, [], 'Unexpected browser JavaScript errors: ' + pageErrors.join('; '));
  console.log('BMW X1 Chromium smoke: PASS — live page, DOM IDs, Arena gate, password confirmation, roster read, PWA, offline shell, 390/768px responsive; production writes blocked.');
} finally {
  await browser.close();
}
