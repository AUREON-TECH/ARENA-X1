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

  const legacyContext = await browser.newContext();
  try {
    const legacyPage = await legacyContext.newPage();
    const legacyResponse = await legacyPage.goto(
      'https://raphaelbuenocaptacao-creator.github.io/BMW-X1/',
      { waitUntil: 'domcontentloaded', timeout: 20000 }
    );
    const legacyStatus = legacyResponse?.status() ?? null;
    const reachedCanonical = legacyPage.url().startsWith(baseUrl);
    console.log('Legacy BMW-X1 URL probe: ' + JSON.stringify({
      status: legacyStatus,
      finalUrl: legacyPage.url(),
      reachedCanonical
    }));
    if (legacyStatus !== 200 || !reachedCanonical) {
      console.warn('::warning::Legacy BMW-X1 URL is unavailable or did not redirect to the canonical ARENA-X1 address. Restore a Pages redirect on the personal domain.');
    }
  } catch (error) {
    console.warn('::warning::Legacy BMW-X1 URL probe unavailable: ' + error.message);
  } finally {
    await legacyContext.close();
  }

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
    const scriptUrl = registration?.active?.scriptURL || '';
    const version = scriptUrl ? new URL(scriptUrl).searchParams.get('v') : null;
    return registration?.active?.state === 'activated' &&
      version === '47' &&
      !registration.installing &&
      !registration.waiting;
  }, null, { timeout: 45000 });
  const swInfo = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return {
      scope: registration?.scope || '',
      state: registration?.active?.state || '',
      activeScript: registration?.active?.scriptURL || ''
    };
  });
  assert.match(swInfo.scope, /\/ARENA-X1\/$/);
  assert.match(swInfo.activeScript, /sw\.js\?v=47$/);
  console.log('Service Worker active: ' + swInfo.activeScript);
  const socialPrecache = await page.waitForFunction(async () => {
    const cache = await caches.open('arena-x1-stable-v47');
    return Boolean(await cache.match(new URL('result-social.js', location.href).toString()));
  }, null, { timeout: 20000 }).then(() => true).catch(() => false);
  assert.ok(socialPrecache, 'Results social script must be included in the active v47 PWA precache');
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
  await page.waitForFunction(
    () => typeof window.bmwResultSocialRefresh === 'function',
    null,
    { timeout: 10000 }
  );
  await context.setOffline(false);

  const runMockFlow = async mode => {
    const mockContext = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      serviceWorkers: 'block'
    });
    await mockContext.addInitScript(mode => {
      const adminMode = mode === 'admin-raphael' || mode === 'admin-luis';
      const currentId = '11111111-1111-4111-8111-111111111111';
      const approvedId = '33333333-3333-4333-8333-333333333333';
      const pendingId = '22222222-2222-4222-8222-222222222222';
      const email = mode === 'admin-luis' ? 'luisaneto@gmail.com' :
        mode === 'admin-raphael' ? 'raphaelbueno@gmail.com' : 'profissional@example.invalid';
      const user = { id: currentId, email };
      const approved = {
        user_id: approvedId,
        professional: 'Profissional Aprovado',
        status: 'approved',
        requested_at: '2026-11-19T17:00:00Z',
        requester_email: 'aprovado@example.invalid'
      };
      const pending = {
        user_id: pendingId,
        professional: 'Profissional Pendente',
        status: 'pending',
        requested_at: '2026-11-19T18:00:00Z',
        requester_email: 'pendente@example.invalid'
      };
      const currentMember = mode === 'request' ? null : {
        user_id: currentId,
        professional: 'Profissional Teste',
        status: mode === 'pending' ? 'pending' : mode === 'rejected' ? 'rejected' : 'approved',
        requested_at: '2026-11-19T17:00:00Z',
        requester_email: email
      };
      const state = {
        members: adminMode ? [pending, approved] : currentMember ? [currentMember] : [],
        posts: [{
          id: 1,
          user_id: adminMode ? approvedId : currentId,
          professional: adminMode ? 'Profissional Aprovado' : 'Profissional Teste',
          body: 'Post de teste',
          category: 'desafio',
          pinned: false,
          created_at: '2026-11-19T18:00:00Z'
        }],
        comments: [],
        likes: [],
        reactions: [],
        resultComments: [],
        resultLikes: [],
        writes: [],
        nextPostId: 2,
        nextCommentId: 1,
        signupCalls: 0,
        refreshCalls: 0
      };
      const session = {
        access_token: 'mock-access-' + mode,
        refresh_token: 'mock-refresh-' + mode,
        expires_at: mode === 'member-expiring' ? Math.floor(Date.now() / 1000) + 20 : 4102444800
      };
      window.__mockState = state;
      if (mode !== 'signup') localStorage.setItem('bmw-x1-arena-auth', JSON.stringify(session));
      const json = (data, status = 200) => new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
      });
      const empty = (status = 204) => new Response(null, { status });
      const originalFetch = window.fetch.bind(window);
      window.fetch = async (input, init = {}) => {
        const raw = typeof input === 'string' ? input : input?.url || String(input);
        const url = new URL(raw, location.href);
        if (!url.hostname.includes('veznreiamwstlulkpocz.supabase.co')) return originalFetch(input, init);
        const method = String(init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
        const path = url.pathname;
        const body = init.body ? JSON.parse(init.body) : {};
        const idParam = key => String(url.searchParams.get(key) || '').replace(/^eq\./, '');
        state.writes.push({ method, path });

        if (path.endsWith('/auth/v1/user')) return json(user);
        if (path.endsWith('/auth/v1/signup') && method === 'POST') {
          state.signupCalls++;
          return json({ user: { id: currentId, email } });
        }
        if (path.endsWith('/auth/v1/token')) {
          state.refreshCalls++;
          return json({ ...session, access_token: 'mock-refreshed-' + mode, expires_at: 4102444800, user, expires_in: 3600 });
        }
        if (path.endsWith('/auth/v1/logout')) return empty();
        if (path.endsWith('/rest/v1/bmw_x1_admin_allowlist')) {
          return json(adminMode ? [{ email }] : []);
        }
        if (path.endsWith('/rest/v1/bmw_x1_viewers')) return json([]);
        if (path.endsWith('/rest/v1/bmw_x1_roster')) {
          return json([
            { professional: 'Profissional Teste', role: 'CAPTADOR' },
            { professional: 'Profissional Aprovado', role: 'CONSULTOR' }
          ]);
        }
        if (path.endsWith('/rest/v1/bmw_x1_campaign_snapshot')) {
          return json([{
            payload: {
              data_through: '2026-11-19',
              records: [{
                name: 'Profissional Teste',
                role: 'CAPTADOR',
                admission_date: '2026-07-01',
                assiduity_start: '2026-07-01',
                first_record_date: '2026-07-01',
                eligibility_start: '2026-07-01',
                months: [{ month: '2026-11', vgv_net_est: 100000 }]
              }]
            }
          }]);
        }
        if (path.endsWith('/rest/v1/bmw_x1_adjustments')) return json([]);
        if (path.endsWith('/rest/v1/bmw_x1_private_rules')) return json([]);
        if (path.endsWith('/rest/v1/bmw_x1_members')) {
          if (method === 'GET') {
            const filter = url.searchParams.get('user_id');
            if (filter) return json(state.members.filter(row => row.user_id === idParam('user_id')));
            return json(state.members);
          }
          if (method === 'PATCH') {
            const row = state.members.find(item => item.user_id === idParam('user_id'));
            if (row) Object.assign(row, body);
            return empty();
          }
          if (method === 'POST') {
            state.members.push(body);
            return empty(201);
          }
        }
        if (path.endsWith('/rest/v1/bmw_x1_posts')) {
          if (method === 'GET') return json(state.posts);
          if (method === 'POST') {
            state.posts.push({
              ...body,
              id: state.nextPostId++,
              pinned: false,
              created_at: '2026-11-19T18:10:00Z'
            });
            return empty(201);
          }
          if (method === 'PATCH') {
            const row = state.posts.find(item => item.id === Number(idParam('id')));
            if (row) Object.assign(row, body);
            return empty();
          }
          if (method === 'DELETE') {
            state.posts = state.posts.filter(item => item.id !== Number(idParam('id')));
            return empty();
          }
        }
        if (path.endsWith('/rest/v1/bmw_x1_comments')) {
          if (method === 'GET') return json(state.comments);
          if (method === 'POST') {
            state.comments.push({
              ...body,
              id: state.nextCommentId++,
              created_at: '2026-11-19T18:11:00Z'
            });
            return empty(201);
          }
          if (method === 'DELETE') {
            state.comments = state.comments.filter(item => item.id !== Number(idParam('id')));
            return empty();
          }
        }
        if (path.endsWith('/rest/v1/bmw_x1_likes')) {
          if (method === 'GET') return json(state.likes);
          if (method === 'POST') {
            state.likes.push(body);
            return empty(201);
          }
          if (method === 'DELETE') {
            state.likes = state.likes.filter(item =>
              !(item.post_id === Number(idParam('post_id')) && item.user_id === idParam('user_id'))
            );
            return empty();
          }
        }
        if (path.endsWith('/rest/v1/bmw_x1_reactions')) {
          if (method === 'GET') return json(state.reactions);
          if (method === 'POST') {
            state.reactions.push(body);
            return empty(201);
          }
          if (method === 'PATCH') {
            const row = state.reactions.find(item =>
              item.post_id === Number(idParam('post_id')) && item.user_id === idParam('user_id')
            );
            if (row) Object.assign(row, body);
            return empty();
          }
          if (method === 'DELETE') {
            state.reactions = state.reactions.filter(item =>
              !(item.post_id === Number(idParam('post_id')) && item.user_id === idParam('user_id'))
            );
            return empty();
          }
        }
        if (path.endsWith('/rest/v1/bmw_x1_result_comments')) {
          if (method === 'GET') return json(state.resultComments);
          if (method === 'POST') {
            state.resultComments.push({
              ...body,
              id: state.resultComments.length + 1,
              created_at: '2026-11-19T18:12:00Z'
            });
            return empty(201);
          }
          if (method === 'DELETE') {
            state.resultComments = state.resultComments.filter(item => item.id !== Number(idParam('id')));
            return empty();
          }
        }
        if (path.endsWith('/rest/v1/bmw_x1_result_likes')) {
          if (method === 'GET') return json(state.resultLikes);
          if (method === 'POST') {
            state.resultLikes.push(body);
            return empty(201);
          }
          if (method === 'DELETE') {
            state.resultLikes = state.resultLikes.filter(item =>
              !(item.professional === idParam('professional') && item.user_id === idParam('user_id'))
            );
            return empty();
          }
        }
        return json([]);
      };
    }, mode);

    const mockPage = await mockContext.newPage();
    const mockErrors = [];
    mockPage.on('pageerror', error => mockErrors.push(error.message));
    mockPage.on('dialog', dialog => dialog.accept());
    try {
      await mockPage.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      if (mode === 'signup') {
        await mockPage.locator('#bmwGateSignup').click();
        await mockPage.waitForFunction(
          () => getComputedStyle(document.getElementById('bmwGateConfirmWrap')).display !== 'none',
          null,
          { timeout: 5000 }
        );
        await mockPage.waitForFunction(
          () => (document.querySelectorAll('#bmwSignupProfessional option').length || 0) > 1,
          null,
          { timeout: 15000 }
        );
        await mockPage.locator('#bmwSignupProfessional').selectOption({ index: 1 });
        await mockPage.locator('#bmwGateEmail').fill('signup-audit@example.invalid');
        await mockPage.locator('#bmwGatePassword').fill('Senha123!');
        await mockPage.locator('#bmwGateConfirm').fill('Senha123!');
        await mockPage.locator('#bmwGateEnter').click();
        await mockPage.waitForFunction(
          () => document.getElementById('bmwGateMessage')?.textContent.includes('confira sua caixa de entrada'),
          null,
          { timeout: 10000 }
        );
        const signupState = await mockPage.evaluate(() => window.__mockState);
        assert.equal(signupState.signupCalls, 1, 'Signup flow should reach the mocked confirmation-required response');
        assert.equal(signupState.writes.filter(x => x.path.endsWith('/bmw_x1_members') && x.method === 'POST').length, 0, 'No approval request is sent before email confirmation');
        assert.deepEqual(mockErrors, [], 'Signup mock browser errors: ' + mockErrors.join('; '));
        console.log('BMW X1 mocked Chromium flow PASS: signup confirmation-required state — no production API writes.');
        return;
      }

      if (mode === 'request') {
        await mockPage.waitForFunction(
          () => document.getElementById('bmwGateRequest')?.style.display === 'block',
          null,
          { timeout: 15000 }
        );
        await mockPage.locator('#bmwGateProfessional').selectOption({ index: 0 });
        await mockPage.locator('#bmwGateRequestButton').click();
        await mockPage.waitForFunction(
          () => window.__mockState.members.length === 1 &&
            window.__mockState.members[0].status === 'pending',
          null,
          { timeout: 10000 }
        );
        const requestState = await mockPage.evaluate(() => window.__mockState);
        assert.equal(requestState.writes.filter(x => x.path.endsWith('/bmw_x1_members') && x.method === 'POST').length, 1);
        assert.deepEqual(mockErrors, [], 'Approval request mock browser errors: ' + mockErrors.join('; '));
        console.log('BMW X1 mocked Chromium flow PASS: confirmed account submits a pending approval request in memory only.');
        return;
      }

      if (mode === 'pending' || mode === 'rejected') {
        await mockPage.waitForFunction(
          () => document.getElementById('bmwGatePending')?.style.display === 'block',
          null,
          { timeout: 15000 }
        );
        if (mode === 'pending') {
          assert.match(await mockPage.locator('#bmwGatePendingText').innerText(), /Raphael ou Luis precisa aprovar/i);
        } else {
          assert.match(await mockPage.locator('#bmwGatePendingTitle').innerText(), /Acesso não aprovado/i);
        }
        await mockPage.evaluate(() => window.nav('arena'));
        assert.equal(await mockPage.locator('#arena').evaluate(el => el.classList.contains('hidden')), true);
        const pendingState = await mockPage.evaluate(() => window.__mockState);
        assert.equal(pendingState.writes.filter(x => ['POST', 'PATCH', 'DELETE'].includes(x.method)).length, 0);
        assert.deepEqual(mockErrors, [], 'Pending mock browser errors: ' + mockErrors.join('; '));
        console.log('BMW X1 mocked Chromium flow PASS: pending professional remains blocked.');
        return;
      }

      await mockPage.waitForFunction(
        () => document.body.classList.contains('bmw-authorized'),
        null,
        { timeout: 20000 }
      );
      assert.equal(await mockPage.locator('#bmwGate').isVisible(), false, mode + ': access gate should close after mocked authorization');

      if (mode === 'member' || mode === 'member-expiring') {
        await mockPage.locator('#arenaTab').click();
        await mockPage.waitForFunction(
          () => !document.getElementById('arenaFeedArea').classList.contains('hidden'),
          null,
          { timeout: 15000 }
        );
        await mockPage.waitForFunction(
          () => document.getElementById('arenaFeed')?.innerText.includes('Post de teste'),
          null,
          { timeout: 15000 }
        );
        for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
          await mockPage.setViewportSize(viewport);
          const dimensions = await mockPage.evaluate(() => ({
            width: window.innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            muralWidth: document.getElementById('arenaFeedArea')?.scrollWidth || 0,
            muralClientWidth: document.getElementById('arenaFeedArea')?.clientWidth || 0
          }));
          assert.ok(
            dimensions.documentWidth <= dimensions.width + 1,
            'Authenticated Mural horizontal overflow at ' + viewport.width + 'px: ' + JSON.stringify(dimensions)
          );
          assert.ok(
            dimensions.muralWidth <= dimensions.muralClientWidth + 1,
            'Mural content overflow at ' + viewport.width + 'px: ' + JSON.stringify(dimensions)
          );
        }
        console.log('Authenticated Mural responsive: PASS at 390px and 768px.');
        await mockPage.locator('[data-arena-view="posts"]').click();
        await mockPage.locator('#arenaPostCategory').selectOption('desafio');
        await mockPage.locator('#arenaPostText').fill('Meta batida!');
        await mockPage.locator('.arena-emoji-insert').first().click();
        assert.match(await mockPage.locator('#arenaPostText').inputValue(), /🔥/);
        await mockPage.locator('#arenaPostForm button[type="submit"]').click();
        await mockPage.waitForFunction(
          () => document.getElementById('arenaFeed')?.innerText.includes('Meta batida!🔥'),
          null,
          { timeout: 10000 }
        );
        await mockPage.locator('[data-like="1"]').click();
        await mockPage.waitForFunction(
          () => document.querySelector('[data-like="1"]')?.innerText.includes('Curtido'),
          null,
          { timeout: 10000 }
        );
        await mockPage.locator('[data-react="1"][data-emoji="🔥"]').waitFor({ state: 'visible', timeout: 10000 });
        await mockPage.locator('[data-react="1"][data-emoji="🔥"]').click();
        await mockPage.waitForFunction(
          () => document.querySelector('[data-react="1"][data-emoji="🔥"]')?.classList.contains('active'),
          null,
          { timeout: 10000 }
        );
        await mockPage.locator('[data-commenttoggle="1"]').click();
        await mockPage.locator('form[data-post="1"] input').fill('Comentário simulado');
        await mockPage.locator('form[data-post="1"] button[type="submit"]').click();
        await mockPage.waitForFunction(
          () => window.__mockState.posts.length === 2 &&
            window.__mockState.likes.length === 1 &&
            window.__mockState.reactions.length === 1 &&
            window.__mockState.comments.length === 1,
          null,
          { timeout: 15000 }
        );

        await mockPage.locator('[data-tab="professional"]').click();
        await mockPage.waitForFunction(
          () => document.getElementById('resultSocial')?.innerText.includes('Torcida e comentários'),
          null,
          { timeout: 15000 }
        );
        await mockPage.waitForFunction(
          () => document.getElementById('socialLike') && document.getElementById('socialCommentForm'),
          null,
          { timeout: 10000 }
        );
        await mockPage.locator('#socialLike').click();
        await mockPage.waitForFunction(
          () => window.__mockState.resultLikes.length === 1 &&
            document.getElementById('socialLike')?.innerText.includes('Curtido'),
          null,
          { timeout: 10000 }
        );
        await mockPage.locator('#socialCommentText').fill('Parabéns pelo resultado!');
        await mockPage.locator('#socialCommentForm button[type="submit"]').click();
        await mockPage.waitForFunction(
          () => window.__mockState.resultComments.length === 1,
          null,
          { timeout: 10000 }
        );
      } else {
        await mockPage.waitForFunction(
          () => document.getElementById('arenaReviewList')?.innerText.includes('Profissional Pendente'),
          null,
          { timeout: 15000 }
        );
        await mockPage.locator('#arenaReviewList [data-approve]').click();
        await mockPage.waitForFunction(
          () => window.__mockState.members.find(row => row.professional === 'Profissional Pendente')?.status === 'approved',
          null,
          { timeout: 10000 }
        );
        await mockPage.waitForFunction(
          () => document.getElementById('arenaModPosts')?.innerText.includes('Post de teste'),
          null,
          { timeout: 10000 }
        );
        await mockPage.locator('#arenaModPosts [data-moderate]').click();
        await mockPage.waitForFunction(
          () => window.__mockState.posts.length === 0,
          null,
          { timeout: 10000 }
        );
        await mockPage.locator('#arenaTab').click();
        await mockPage.waitForFunction(
          expected => document.getElementById('arenaIdentity')?.innerText.includes(expected === 'admin-luis' ? 'LUIS' : 'RAPHAEL'),
          mode,
          { timeout: 10000 }
        );
      }

      const dynamicDuplicateIds = await mockPage.locator('[id]').evaluateAll(nodes => {
        const ids = nodes.map(node => node.id).filter(Boolean);
        return [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
      });
      assert.deepEqual(dynamicDuplicateIds, [], mode + ': dynamic DOM IDs must remain unique');
      const mockState = await mockPage.evaluate(() => window.__mockState);
      const dml = mockState.writes.filter(item => ['POST', 'PATCH', 'DELETE'].includes(item.method));
      assert.ok(dml.length > 0, mode + ': mocked UI writes should be recorded in memory only');
      if (mode === 'member-expiring') {
        assert.equal(mockState.refreshCalls, 1, 'Near-expiry session should refresh its token once');
      }
      assert.deepEqual(mockErrors, [], mode + ': unexpected browser errors: ' + mockErrors.join('; '));
      await mockPage.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
      await mockPage.waitForFunction(
        () => document.body.classList.contains('bmw-authorized'),
        null,
        { timeout: 20000 }
      );
      console.log('BMW X1 mocked Chromium flow PASS: ' + mode + ' — session restored; no production API writes.');
    } finally {
      await mockContext.close();
    }
  };

  await runMockFlow('signup');
  await runMockFlow('request');
  await runMockFlow('pending');
  await runMockFlow('rejected');
  await runMockFlow('member');
  await runMockFlow('member-expiring');
  await runMockFlow('admin-raphael');
  await runMockFlow('admin-luis');

  assert.deepEqual(pageErrors, [], 'Unexpected browser JavaScript errors: ' + pageErrors.join('; '));
  console.log('BMW X1 Chromium smoke: PASS — live page, DOM IDs, Arena gate, password confirmation, roster read, PWA, offline shell, 390/768px responsive; production writes blocked.');
} finally {
  await browser.close();
}
