// Prueba local de functions/panel/api/busquedas.js (Search Console) con fetch simulado: node tests/panel-busquedas.test.mjs
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { keypair, sign, goodClaims, ACCESS_ENV, certsUrl } from './lib/access.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mod = await import(join(root, 'functions', 'panel', 'api', 'busquedas.js'));
const stats = await import(join(root, 'functions', 'panel', 'api', 'stats.js'));

const access = await keypair('k1');
// Cuenta de servicio de prueba: clave RSA real en PKCS#8/PEM, como la del JSON de Google.
const saKey = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const pkcs8 = Buffer.from(await crypto.subtle.exportKey('pkcs8', saKey.privateKey)).toString('base64').match(/.{1,64}/g).join('\n');
const SA = { type: 'service_account', client_email: 'panel@brenbe-test.iam.gserviceaccount.com', private_key: '-----BEGIN PRIVATE KEY-----\n' + pkcs8 + '\n-----END PRIVATE KEY-----\n' };
const ENV = { ...ACCESS_ENV, GSC_SA_JSON: JSON.stringify(SA), GSC_SITE: 'sc-domain:brenbe.com' };

const ROWS = [
  { keys: ['colores para living', 'https://brenbe.com/guias/colores-para-living/', 'arg'], clicks: 4, impressions: 100, ctr: 0.04, position: 5 },
  { keys: ['colores para living', 'https://brenbe.com/', 'arg'], clicks: 0, impressions: 100, ctr: 0, position: 15 },
  { keys: ['colores para living', 'https://brenbe.com/guias/colores-para-living/', 'mex'], clicks: 1, impressions: 10, ctr: 0.1, position: 8 },
  { keys: ['interiorista online', 'https://brenbe.com/', 'esp'], clicks: 2, impressions: 50, ctr: 0.04, position: 3.2 },
  { keys: ['asesoría de interiorismo', 'https://brenbe.com/asesoria-de-interiorismo-online/', 'arg'], clicks: 0, impressions: 300, ctr: 0, position: 11 },
];
let tokenCalls = 0, gscCalls = 0, last = {}, gscStatus = 200, tokenStatus = 200, rowsOut = ROWS;
globalThis.fetch = async (url, init) => {
  url = String(url);
  if (url === certsUrl) return new Response(JSON.stringify({ keys: [access.jwk] }));
  if (url === 'https://oauth2.googleapis.com/token') {
    tokenCalls++;
    const p = new URLSearchParams(init.body);
    assert.equal(p.get('grant_type'), 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    const [h, c, s] = p.get('assertion').split('.');
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', saKey.publicKey, Buffer.from(s, 'base64url'), new TextEncoder().encode(h + '.' + c));
    assert.ok(ok, 'el JWT de la cuenta de servicio está firmado con RS256');
    last.header = JSON.parse(Buffer.from(h, 'base64url')); last.claims = JSON.parse(Buffer.from(c, 'base64url'));
    return new Response(JSON.stringify(tokenStatus === 200 ? { access_token: 'ya29.tok' + tokenCalls, expires_in: 3599, token_type: 'Bearer' } : { error: 'invalid_grant' }), { status: tokenStatus });
  }
  if (url.startsWith('https://www.googleapis.com/webmasters/v3/sites/')) {
    gscCalls++;
    last = { ...last, url, init, body: JSON.parse(init.body) };
    return new Response(JSON.stringify(gscStatus === 200 ? { rows: rowsOut } : { error: { message: 'x' } }), { status: gscStatus });
  }
  throw new Error('fetch inesperado ' + url);
};
async function call({ qs = '?days=30', env = ENV, auth = true, method = 'GET' } = {}) {
  const headers = new Headers();
  if (auth) headers.set('cf-access-jwt-assertion', await sign(access, goodClaims()));
  const request = new Request('https://brenbe.com/panel/api/busquedas' + qs, { method, headers });
  const res = await (method === 'GET' ? mod.onRequestGet : mod.onRequest)({ request, env });
  return { res, body: await res.json() };
}
let passed = 0;
async function t(name, fn) { stats._resetJwks(); mod._resetCache(); tokenCalls = 0; gscCalls = 0; gscStatus = 200; tokenStatus = 200; rowsOut = ROWS; last = {}; await fn(); passed++; console.log('ok  ' + name); }

await t('flujo completo: JWT RS256 -> token -> searchAnalytics con query, page, country', async () => {
  const { res, body } = await call();
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(last.header, { alg: 'RS256', typ: 'JWT' });
  assert.equal(last.claims.iss, SA.client_email);
  assert.equal(last.claims.scope, 'https://www.googleapis.com/auth/webmasters.readonly');
  assert.equal(last.claims.aud, 'https://oauth2.googleapis.com/token');
  assert.equal(last.claims.exp - last.claims.iat, 3600);
  assert.equal(last.url, 'https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Abrenbe.com/searchAnalytics/query');
  assert.equal(last.init.method, 'POST');
  assert.equal(last.init.headers.authorization, 'Bearer ya29.tok1');
  assert.deepEqual(last.body.dimensions, ['query', 'page', 'country']);
  assert.equal(last.body.type, 'web');
  assert.equal(body.configured, true);
});
await t('rango: termina 3 días antes de hoy (demora de Search Console) y cubre N días', async () => {
  for (const days of [7, 30, 90]) {
    await call({ qs: '?days=' + days });
    const s = Date.parse(last.body.startDate), e = Date.parse(last.body.endDate);
    assert.equal((e - s) / 86400000, days - 1);
    assert.equal(Math.round((Date.now() - e) / 86400000), 3);
  }
});
await t('consultas agrupadas: clics, impresiones, posición ponderada, página y país principales', async () => {
  const { body } = await call();
  assert.deepEqual(body.totals, { clicks: 7, impressions: 560 });
  const q = body.queries[0];
  assert.equal(q.query, 'colores para living');
  assert.equal(q.clicks, 5); assert.equal(q.impressions, 210);
  assert.equal(q.position, Math.round(((5 * 100 + 15 * 100 + 8 * 10) / 210) * 10) / 10);
  assert.equal(q.page, 'https://brenbe.com/guias/colores-para-living/');
  assert.equal(q.country, 'AR');
  assert.equal(Math.round(q.ctr * 1000), Math.round(5 / 210 * 1000));
  assert.deepEqual(body.queries.map((x) => x.query), ['colores para living', 'interiorista online', 'asesoría de interiorismo'], 'ordenadas por clics y luego impresiones');
  assert.equal(body.queries[1].country, 'ES');
  assert.equal(body.pages[0].page, 'https://brenbe.com/guias/colores-para-living/');
  assert.equal(body.lagDays, 3);
});
await t('token y resultados en caché: el token se reutiliza entre consultas', async () => {
  await call({ qs: '?days=7' }); await call({ qs: '?days=90' });
  assert.equal(tokenCalls, 1);
  assert.equal(gscCalls, 2);
});
await t('sin GSC_SA_JSON o GSC_SITE: 200 configured:false, sin llamar a Google', async () => {
  for (const env of [{ ...ACCESS_ENV }, { ...ACCESS_ENV, GSC_SA_JSON: ENV.GSC_SA_JSON }, { ...ACCESS_ENV, GSC_SITE: 'sc-domain:brenbe.com' }]) {
    const { res, body } = await call({ env });
    assert.equal(res.status, 200); assert.equal(body.configured, false); assert.equal(body.reason, 'sin_variables'); assert.match(body.message, /no están configuradas|todavía/);
  }
  assert.equal(tokenCalls + gscCalls, 0);
});
await t('GSC_SA_JSON inválido: configured:false sa_invalida', async () => {
  for (const v of ['no es json', '{"client_email":"a@b"}', JSON.stringify({ client_email: 'a@b', private_key: 'xx' })]) {
    const { body } = await call({ env: { ...ENV, GSC_SA_JSON: v } });
    assert.equal(body.configured, false); assert.equal(body.reason, 'sa_invalida');
  }
  assert.equal(tokenCalls, 0);
});
await t('Google rechaza la cuenta (token) -> 502 claro; 403 de Search Console -> 502 de permisos', async () => {
  tokenStatus = 400;
  let r = await call();
  assert.equal(r.res.status, 502); assert.equal(r.body.error, 'google_token');
  tokenStatus = 200; mod._resetCache(); gscStatus = 403;
  r = await call();
  assert.equal(r.res.status, 502); assert.equal(r.body.error, 'google_permiso');
  assert.match(r.body.message, /permiso restringido/);
  mod._resetCache(); gscStatus = 500;
  r = await call();
  assert.equal(r.body.error, 'google_error');
  assert.ok(!JSON.stringify(r.body).includes('private_key'));
});
await t('sin datos todavía: listas vacías', async () => {
  rowsOut = [];
  const { body } = await call();
  assert.deepEqual(body.queries, []); assert.deepEqual(body.totals, { clicks: 0, impressions: 0 });
});
await t('autenticación: sin JWT 401 (no llama a Google), JWT falso 403, days inválido 400, POST 405', async () => {
  assert.equal((await call({ auth: false })).res.status, 401);
  const bad = await keypair('k1');
  const request = new Request('https://brenbe.com/panel/api/busquedas', { headers: { 'cf-access-jwt-assertion': await sign(bad, goodClaims()) } });
  assert.equal((await mod.onRequestGet({ request, env: ENV })).status, 403);
  assert.equal((await call({ qs: '?days=3' })).res.status, 400);
  assert.equal((await call({ method: 'POST' })).res.status, 405);
  assert.equal(tokenCalls + gscCalls, 0);
});
await t('range() y parseServiceAccount()', () => {
  const r = mod.range(7, Date.UTC(2026, 10, 23, 12));
  assert.deepEqual(r, { startDate: '2026-11-14', endDate: '2026-11-20' });
  assert.equal(mod.parseServiceAccount(JSON.stringify(SA)).client_email, SA.client_email);
  assert.equal(mod.parseServiceAccount(''), null);
});

console.log(`\n${passed} pruebas OK`);
