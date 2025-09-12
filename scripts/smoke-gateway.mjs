// Quick smoke test for VibeGate gateway + debugger
// Usage: node scripts/smoke-gateway.mjs

const GW = process.env.GATEWAY_ORIGIN || 'http://localhost:4000';
const DBG = process.env.DEBUGGER_ORIGIN || 'http://localhost:3001';
const API = `${GW}/vibegate/api`;

function nowId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function req(path, init = {}, jar) {
  const headers = { 'Content-Type': 'application/json', ...(init.headers || {}) };
  if (jar) headers['Cookie'] = jar;
  const res = await fetch(`${API}${path}`, { ...init, headers, redirect: 'manual' });
  const setCookie = res.headers.get('set-cookie');
  const text = await res.text().catch(() => '');
  let json;
  try { json = text ? JSON.parse(text) : undefined; } catch { json = { raw: text }; }
  return { status: res.status, headers: res.headers, setCookie, body: json };
}

async function fetchProxy(url, jar) {
  const headers = {};
  if (jar) headers['Cookie'] = jar;
  const res = await fetch(url, { headers, redirect: 'manual' });
  const text = await res.text().catch(() => '');
  let json; try { json = text ? JSON.parse(text) : undefined; } catch { json = { raw: text }; }
  return { status: res.status, headers: res.headers, body: json };
}

async function main() {
  // basic readiness hints
  console.log('Expect gateway at', GW, 'and debugger at', DBG);
  const email = `test+${nowId()}@example.com`;
  const password = 'password123';
  let cookieJar = '';

  // register
  const reg = await req('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name: 'Smoke' }) });
  if (![200, 201].includes(reg.status)) throw new Error(`register failed: ${reg.status} ${JSON.stringify(reg.body)}`);
  if (reg.setCookie) cookieJar = reg.setCookie.split(',')[0].split(';')[0];
  console.log('Registered user:', email);

  // me
  const me = await req('/auth/me', { method: 'GET' }, cookieJar);
  if (me.status !== 200) throw new Error(`me failed: ${me.status} ${JSON.stringify(me.body)}`);
  console.log('Auth/me ok:', me.body.user?.email);

  // create open route /debug-<id> -> debugger root
  const routePathOpen = `/debug-${nowId().slice(0,6)}`;
  const createOpen = await req('/admin/routes', { method: 'POST', body: JSON.stringify({ path: routePathOpen, target: DBG, requireAuth: false, enabled: true }) }, cookieJar);
  if (![200, 201].includes(createOpen.status)) throw new Error(`create open route failed: ${createOpen.status} ${JSON.stringify(createOpen.body)}`);
  console.log('Created open route', routePathOpen, '->', DBG);

  // proxy to /api/echo via /debug prefix
  const echoUrl = `${GW}${routePathOpen}/api/echo?foo=bar`;
  const echoRes = await fetchProxy(echoUrl);
  if (echoRes.status !== 200) throw new Error(`proxy open route failed: ${echoRes.status} ${JSON.stringify(echoRes.body)}`);
  console.log('Proxy open route ok:', echoRes.body?.url || echoRes.body);

  // create secure route /secure-<id> -> debugger root (require auth)
  const routePathSec = `/secure-${nowId().slice(0,6)}`;
  const createSec = await req('/admin/routes', { method: 'POST', body: JSON.stringify({ path: routePathSec, target: DBG, requireAuth: true, enabled: true }) }, cookieJar);
  if (![200, 201].includes(createSec.status)) throw new Error(`create secure route failed: ${createSec.status} ${JSON.stringify(createSec.body)}`);
  console.log('Created secure route', routePathSec, '->', DBG);

  // proxy secure without cookie should 401
  const secUrl = `${GW}${routePathSec}/api/echo`;
  const secNoAuth = await fetchProxy(secUrl);
  if (secNoAuth.status !== 401) throw new Error(`secure route expected 401, got ${secNoAuth.status}`);
  console.log('Secure route rejects without auth as expected');

  // proxy secure with cookie should 200
  const secWithAuth = await fetch(secUrl, { headers: { Cookie: cookieJar } });
  if (secWithAuth.status !== 200) throw new Error(`secure route with auth failed: ${secWithAuth.status}`);
  console.log('Secure route accepts with auth');

  // list routes
  const list = await req('/admin/routes', { method: 'GET' }, cookieJar);
  if (list.status !== 200) throw new Error(`list routes failed: ${list.status}`);
  console.log('Routes total:', list.body.routes?.length ?? 'n/a');

  console.log('\nSmoke test completed successfully.');
}

main().catch((err) => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
