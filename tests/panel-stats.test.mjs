// Prueba local de functions/panel/api/stats.js (sin Cloudflare): node tests/panel-stats.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'functions', 'panel', 'api', 'stats.js'), 'utf8');
const mod = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));

const TEAM = 'brenbe.cloudflareaccess.com';
const AUD = 'aud-tag-123';
const ENV = { ACCESS_TEAM_DOMAIN: 'brenbe', ACCESS_AUD: AUD, CF_ANALYTICS_TOKEN: 'tok', CF_ACCOUNT_ID: 'acc1', CF_SITE_TAG: 'site1' };

const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
async function keypair(kid) {
  const kp = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', kp.publicKey);
  return { priv: kp.privateKey, jwk: { ...jwk, kid, alg: 'RS256', use: 'sig' }, kid };
}
async function sign(kp, claims, header = {}) {
  const h = enc({ alg: 'RS256', kid: kp.kid, typ: 'JWT', ...header });
  const p = enc(claims);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.priv, new TextEncoder().encode(h + '.' + p));
  return h + '.' + p + '.' + Buffer.from(sig).toString('base64url');
}
const now = Math.floor(Date.now() / 1000);
const good = { iss: 'https://' + TEAM, aud: [AUD], exp: now + 600, iat: now, email: 'brenda@example.com' };

const kp = await keypair('k1');
const other = await keypair('k1'); // mismo kid, clave distinta (firma falsa)

const grp = (count, visits, dimensions) => ({ count, sum: { visits }, dimensions });
const today = new Date().toISOString().slice(0, 10);
const GQL = {
  data: { viewer: { accounts: [{
    curTotal: [grp(120, 80, {})],
    prevTotal: [grp(100, 50, {})],
    series: [grp(30, 20, { date: today })],
    paths: [
      grp(60, 40, { requestPath: '/' }),
      grp(20, 15, { requestPath: '/guias/colores-para-living/index.html' }),
      grp(10, 8, { requestPath: '/es-mx/guias/x/' }),
      grp(6, 6, { requestPath: '/wa/home/' }),
      grp(4, 4, { requestPath: '/wa/guias-colores-para-living/' }),
      grp(2, 2, { requestPath: '/panel/' }),
    ],
    prevPaths: [grp(3, 3, { requestPath: '/wa/home/' }), grp(97, 50, { requestPath: '/' })],
    referrers: [grp(30, 30, { refererHost: '' }), grp(20, 20, { refererHost: 'www.google.com' }), grp(10, 10, { refererHost: 'ar.pinterest.com' }), grp(6, 6, { refererHost: 'l.instagram.com' }), grp(4, 4, { refererHost: 'otro.com' })],
    countries: [grp(50, 50, { countryName: 'AR' }), grp(20, 20, { countryName: 'MX' })],
    devices: [grp(60, 60, { deviceType: 'mobile' }), grp(20, 20, { deviceType: 'desktop' })],
    botTotal: [grp(40, 33, {})],
    botPrevTotal: [grp(5, 5, {})],
    botCountries: [grp(30, 0, { countryName: 'US' }), grp(10, 0, { countryName: 'DE' })],
  }] } },
};

let gqlCalls = 0, jwksCalls = 0, lastGql = null;
function installFetch({ gql = GQL, gqlStatus = 200, keys = [kp.jwk] } = {}) {
  globalThis.fetch = async (url, init) => {
    url = String(url);
    if (url === 'https://' + TEAM + '/cdn-cgi/access/certs') { jwksCalls++; return new Response(JSON.stringify({ keys }), { status: 200 }); }
    if (url === 'https://api.cloudflare.com/client/v4/graphql') {
      gqlCalls++;
      lastGql = { init, body: JSON.parse(init.body) };
      return new Response(JSON.stringify(gql), { status: gqlStatus });
    }
    throw new Error('fetch inesperado ' + url);
  };
}
async function call({ qs = '?days=30', token, env = ENV, method = 'GET' } = {}) {
  const headers = new Headers();
  if (token) headers.set('cf-access-jwt-assertion', token);
  const request = new Request('https://brenbe.com/panel/api/stats' + qs, { method, headers });
  const fn = method === 'GET' ? mod.onRequestGet : mod.onRequest;
  const res = await fn({ request, env });
  return { res, body: await res.json() };
}
let passed = 0;
async function t(name, fn) { mod._resetJwks(); gqlCalls = 0; jwksCalls = 0; installFetch(); await fn(); passed++; console.log('ok  ' + name); }

await t('JWT válido -> 200 con datos y cabeceras privadas', async () => {
  const { res, body } = await call({ token: await sign(kp, good) });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'private, no-store');
  assert.match(res.headers.get('x-robots-tag'), /noindex/);
  assert.equal(body.days, 30);
  assert.deepEqual(body.totals.visits, { value: 80, previous: 50 });
  assert.deepEqual(body.totals.whatsapp, { value: null, previous: null }, 'sin DB: no configurado, no 0');
  assert.equal(body.whatsapp_configured, false);
  // 120 pageviews - 10 wa - 2 panel = 108; previo 100 - 3 wa = 97
  assert.deepEqual(body.totals.pageviews, { value: 108, previous: 97 });
  assert.equal(body.series.length, 30);
  assert.equal(body.series.at(-1).visits, 20);
  assert.equal(body.series[0].visits, 0);
});
await t('páginas: normaliza index.html, excluye /wa/ y /panel', async () => {
  const { body } = await call({ token: await sign(kp, good) });
  assert.deepEqual(body.pages.map((p) => p.path), ['/', '/guias/colores-para-living/', '/es-mx/guias/x/']);
  assert.ok(!body.pages.some((p) => p.path.startsWith('/wa/') || p.path.startsWith('/panel')));
});
// D1 falso: batch([cur, curTotal, prev]) -> [{results:[{path,n}]}, {results:[{n:total}]}, {results:[{n}]}]; guarda los SQL y binds.
function fakeDb({ rows, prev, total, fail = false }) {
  const calls = [];
  return { calls, prepare: (sql) => ({ bind: (...b) => ({ sql, b }) }), batch: async (qs) => { calls.push(...qs); if (fail) throw new Error('no such table'); return [{ results: rows }, { results: [{ n: total ?? rows.reduce((a, r) => a + r.n, 0) }] }, { results: [{ n: prev }] }]; } };
}
await t('WhatsApp sale del colector D1 (wa_click, solo personas), por página, con período anterior', async () => {
  const db = fakeDb({ rows: [{ path: '/', n: 6 }, { path: '/guias/colores-para-living/', n: 4 }, { path: '/guias/colores-para-living/index.html', n: 1 }], prev: 3 });
  const { body } = await call({ token: await sign(kp, good), env: { ...ENV, DB: db } });
  assert.equal(body.whatsapp_configured, true);
  assert.deepEqual(body.totals.whatsapp, { value: 11, previous: 3 });
  assert.deepEqual(body.whatsapp.map((w) => [w.id, w.clicks]), [['home', 6], ['guias-colores-para-living', 5]]);
  assert.match(db.calls[0].sql, /type = 'wa_click' AND is_bot = 0/);
  assert.match(db.calls[1].sql, /type = 'wa_click' AND is_bot = 0/);
  assert.match(db.calls[0].sql, /sid NOT IN \(SELECT sid FROM events WHERE is_bot = 1/, 'excluye sesiones con eventos de bot');
  assert.doesNotMatch(db.calls[1].sql, /LIMIT/, 'el total no depende del límite del ranking');
  const [s0, e0] = db.calls[0].b, [ps, pe] = db.calls[2].b;
  assert.equal(pe, s0, 'el período anterior termina donde empieza el actual');
  assert.equal(Math.round((s0 - ps) / 86400000), 30);
  assert.ok(e0 > s0);
  // pageviews no cambia por WhatsApp: los /wa/ históricos de RUM igual se descuentan
  assert.deepEqual(body.totals.pageviews, { value: 108, previous: 97 });
});
await t('WhatsApp: D1 sin tabla -> no configurado; sin clics -> 0 configurado', async () => {
  const bad = await call({ token: await sign(kp, good), env: { ...ENV, DB: fakeDb({ rows: [], prev: 0, fail: true }) } });
  assert.equal(bad.body.whatsapp_configured, false);
  assert.deepEqual(bad.body.totals.whatsapp, { value: null, previous: null });
  assert.deepEqual(bad.body.whatsapp, []);
  const zero = await call({ token: await sign(kp, good), env: { ...ENV, DB: fakeDb({ rows: [], prev: 0 }) } });
  assert.equal(zero.body.whatsapp_configured, true);
  assert.deepEqual(zero.body.totals.whatsapp, { value: 0, previous: 0 });
});
await t('split por idioma', async () => {
  const { body } = await call({ token: await sign(kp, good) });
  const l = Object.fromEntries(body.locales.map((x) => [x.locale, x.views]));
  assert.equal(l['es-ar'], 80);
  assert.equal(l['es-mx'], 10);
  assert.equal(l.en, 0);
});
await t('canales, países, dispositivos', async () => {
  const { body } = await call({ token: await sign(kp, good) });
  const c = Object.fromEntries(body.channels.map((x) => [x.channel, x.visits]));
  assert.deepEqual(c, { Google: 20, Pinterest: 10, Instagram: 6, Facebook: 0, WhatsApp: 0, Directo: 30, Otros: 4 });
  assert.equal(body.countries[0].country, 'AR');
  assert.equal(body.devices[0].device, 'mobile');
  assert.equal(body.referrers[0].host, 'google.com');
});
await t('consulta GraphQL: token, cuenta, site tag y rango', async () => {
  await call({ qs: '?days=7', token: await sign(kp, good) });
  assert.equal(lastGql.init.headers.authorization, 'Bearer tok');
  const v = lastGql.body.variables;
  assert.equal(v.acc, 'acc1');
  assert.equal(v.site, 'site1');
  const span = (Date.parse(v.e) - Date.parse(v.s)) / 86400000;
  assert.ok(span > 6 && span <= 7, 'la ventana cubre hoy + 6 días completos');
  assert.match(v.s, /T00:00:00Z$/, 'el inicio está alineado a medianoche UTC');
  assert.equal(Math.round((Date.parse(v.s) - Date.parse(v.ps)) / 86400000), 7);
  assert.match(lastGql.body.query, /rumPageloadEventsAdaptiveGroups/);
});
await t('bots: todos los bloques principales filtran bot: 0 y los bots se cuentan aparte', async () => {
  const { body } = await call({ token: await sign(kp, good) });
  const q = lastGql.body.query;
  const main = ['curTotal', 'prevTotal', 'series', 'paths', 'prevPaths', 'referrers', 'countries', 'devices'];
  for (const k of main) assert.match(q, new RegExp(k + ': rumPageloadEventsAdaptiveGroups\\(filter: \\{ siteTag: \\$site, bot: 0,'), k + ' filtra personas');
  for (const k of ['botTotal', 'botPrevTotal', 'botCountries']) assert.match(q, new RegExp(k + ': rumPageloadEventsAdaptiveGroups\\(filter: \\{ siteTag: \\$site, bot_gt: 0,'), k + ' cuenta bots');
  assert.deepEqual(body.totals.bots, { value: 40, previous: 5, visits: 33 });
  assert.deepEqual(body.botCountries, [{ country: 'US', views: 30 }, { country: 'DE', views: 10 }]);
});
await t('JWKS se cachea en memoria', async () => {
  const tk = await sign(kp, good);
  await call({ token: tk }); await call({ token: tk });
  assert.equal(jwksCalls, 1);
});
await t('sin JWT -> 401', async () => { const { res } = await call({}); assert.equal(res.status, 401); assert.equal(gqlCalls, 0); });
await t('JWT vencido -> 403', async () => { const { res } = await call({ token: await sign(kp, { ...good, exp: now - 10 }) }); assert.equal(res.status, 403); assert.equal(gqlCalls, 0); });
await t('aud equivocado -> 403', async () => assert.equal((await call({ token: await sign(kp, { ...good, aud: ['otra'] }) })).res.status, 403));
await t('iss equivocado -> 403', async () => assert.equal((await call({ token: await sign(kp, { ...good, iss: 'https://evil.cloudflareaccess.com' }) })).res.status, 403));
await t('firma falsa (otra clave) -> 403', async () => assert.equal((await call({ token: await sign(other, good) })).res.status, 403));
await t('alg none / HS256 -> 403', async () => {
  const tk = enc({ alg: 'none', typ: 'JWT' }) + '.' + enc(good) + '.';
  assert.equal((await call({ token: tk })).res.status, 403);
  assert.equal((await call({ token: await sign(kp, good, { alg: 'HS256' }) })).res.status, 403);
});
await t('kid desconocido -> 403', async () => assert.equal((await call({ token: await sign({ ...kp, kid: 'zzz' }, good) })).res.status, 403));
await t('basura -> 403', async () => assert.equal((await call({ token: 'a.b.c' })).res.status, 403));
await t('falta ACCESS_* -> 503 aunque haya JWT', async () => {
  const { res, body } = await call({ token: await sign(kp, good), env: { ...ENV, ACCESS_AUD: '' } });
  assert.equal(res.status, 503);
  assert.match(body.message, /no configurado/i);
  assert.equal(gqlCalls, 0);
});
await t('falta ACCESS_TEAM_DOMAIN o inválido -> 503', async () => {
  assert.equal((await call({ env: { ...ENV, ACCESS_TEAM_DOMAIN: undefined } })).res.status, 503);
  assert.equal((await call({ env: { ...ENV, ACCESS_TEAM_DOMAIN: 'evil.com' } })).res.status, 503);
});
await t('falta CF_ANALYTICS_TOKEN -> 503', async () => {
  const { res, body } = await call({ token: await sign(kp, good), env: { ...ENV, CF_ANALYTICS_TOKEN: '' } });
  assert.equal(res.status, 503);
  assert.match(body.message, /no configurado/i);
});
await t('ACCESS_TEAM_DOMAIN acepta nombre, host o URL', async () => {
  for (const v of ['brenbe', 'brenbe.cloudflareaccess.com', 'https://brenbe.cloudflareaccess.com/']) assert.equal(mod.teamHost(v), TEAM);
});
await t('days inválido -> 400; 7/30/90 -> 200', async () => {
  const tk = await sign(kp, good);
  for (const d of ['1', '0', 'abc', '365', '-7', '7.5']) assert.equal((await call({ qs: '?days=' + d, token: tk })).res.status, 400, d);
  for (const d of [7, 30, 90]) assert.equal((await call({ qs: '?days=' + d, token: tk })).body.series.length, d);
  assert.equal((await call({ qs: '', token: tk })).body.days, 30);
});
await t('error de GraphQL -> 502 sin filtrar detalles; con ?debug=1 los muestra', async () => {
  installFetch({ gql: { errors: [{ message: 'unknown field' }], data: null } });
  const tk = await sign(kp, good);
  const a = await call({ token: tk });
  assert.equal(a.res.status, 502);
  assert.equal(a.body.graphql, undefined);
  const b = await call({ qs: '?days=30&debug=1', token: tk });
  assert.equal(b.res.status, 502);
  assert.equal(b.body.graphql.errors[0].message, 'unknown field');
});
await t('cuenta vacía / sin datos -> 200 con ceros', async () => {
  installFetch({ gql: { data: { viewer: { accounts: [{}] } } } });
  const { res, body } = await call({ token: await sign(kp, good) });
  assert.equal(res.status, 200);
  assert.equal(body.totals.visits.value, 0);
  assert.equal(body.pages.length, 0);
});
await t('método POST -> 405', async () => assert.equal((await call({ method: 'POST', token: await sign(kp, good) })).res.status, 405));
await t('canales: hosts', async () => {
  const c = mod.channelOf;
  assert.equal(c(''), 'Directo'); assert.equal(c('brenbe.com'), 'Directo');
  assert.equal(c('www.google.com.ar'), 'Google'); assert.equal(c('ar.pinterest.com'), 'Pinterest'); assert.equal(c('pin.it'), 'Pinterest');
  assert.equal(c('l.instagram.com'), 'Instagram'); assert.equal(c('m.facebook.com'), 'Facebook'); assert.equal(c('l.facebook.com'), 'Facebook');
  assert.equal(c('web.whatsapp.com'), 'WhatsApp'); assert.equal(c('bing.com'), 'Otros'); assert.equal(c('notgoogle.com'), 'Otros');
});

console.log(`\n${passed} pruebas OK`);
