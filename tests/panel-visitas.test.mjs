// Prueba local de functions/panel/api/visitas.js con una D1 simulada: node tests/panel-visitas.test.mjs
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { keypair, sign, goodClaims, ACCESS_ENV, certsUrl } from './lib/access.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mod = await import(join(root, 'functions', 'panel', 'api', 'visitas.js'));
const stats = await import(join(root, 'functions', 'panel', 'api', 'stats.js'));

const kp = await keypair('k1');
const NOW = Date.now();
const H = 3600000;
let seqId = 0;
const ev = (sid, minsAgo, o = {}) => ({
  ts: NOW - minsAgo * 60000, sid, type: 'pageview', path: '/', title: 'Inicio | BRENBE', locale: 'es-ar',
  ref_host: null, ref_path: null, utm_source: null, utm_medium: null, utm_campaign: null,
  country: 'AR', region: 'Córdoba', city: 'Córdoba', device: 'mobile', is_bot: 0, bot_reason: null, dur: null, scroll: null, id: ++seqId, ...o,
});
// Filas en orden ascendente de ts (como las devuelve la consulta ya invertida por la Function).
const ROWS = [
  // Persona 1: Google -> home -> guía -> WhatsApp
  ev('persona1aaaa', 300, { ref_host: 'google.com', ref_path: '/' }),
  ev('persona1aaaa', 298, { path: '/guias/colores-para-living/', title: 'Colores para living | BRENBE' }),
  ev('persona1aaaa', 297, { type: 'wa_click', path: '/guias/colores-para-living/' }),
  ev('persona1aaaa', 296, { type: 'leave', path: '/guias/colores-para-living/', dur: 150, scroll: 80 }),
  // Persona 2: UTM de Pinterest, Buenos Aires, recarga la misma página
  ev('persona2bbbb', 200, { path: '/guias/paleta/', title: 'Paleta | BRENBE', ref_host: 'ar.pinterest.com', utm_source: 'pinterest', utm_medium: 'organic', utm_campaign: 'paletas', city: 'Buenos Aires', region: 'Buenos Aires F.D.', device: 'desktop' }),
  ev('persona2bbbb', 199, { path: '/guias/paleta/', title: 'Paleta | BRENBE', city: 'Buenos Aires', region: 'Buenos Aires F.D.', device: 'desktop' }),
  // Persona 3: directo desde México, envía contacto
  ev('persona3cccc', 100, { path: '/es-mx/', locale: 'es-mx', country: 'MX', region: 'CDMX', city: 'Ciudad de México' }),
  ev('persona3cccc', 99, { type: 'contact_submit', path: '/es-mx/', locale: 'es-mx', country: 'MX', region: 'CDMX', city: 'Ciudad de México' }),
  // Persona 4: Bing, sin ciudad
  ev('persona4dddd', 50, { ref_host: 'bing.com', country: 'AR', region: '', city: '' }),
  // Bot 1: centro de datos de EE. UU.
  ev('bot1xxxxxxxx', 400, { country: 'US', region: 'Virginia', city: 'Ashburn', device: 'desktop', is_bot: 1, bot_reason: 'datacenter' }),
  ev('bot1xxxxxxxx', 399, { path: '/servicios/', country: 'US', region: 'Virginia', city: 'Ashburn', device: 'desktop', is_bot: 1, bot_reason: 'datacenter' }),
  // Bot 2: UA
  ev('bot2yyyyyyyy', 10, { country: 'US', city: 'Boardman', is_bot: 1, bot_reason: 'ua' }),
].sort((a, b) => a.ts - b.ts);

function mockDb({ rows = ROWS, prev = 3, prevC = 1, fail = false } = {}) {
  const log = [];
  return {
    log,
    prepare(sql) { return { sql, bind: (...args) => ({ sql, args }) }; },
    async batch(stmts) {
      if (fail) throw new Error('no such table: events');
      log.push(...stmts);
      return stmts.map((s) => (/COUNT\(DISTINCT sid\)/.test(s.sql) ? { results: [{ n: /wa_click/.test(s.sql) ? prevC : prev }] } : { results: rows.slice().reverse().filter((r) => r.ts >= s.args[0]) }));
    },
  };
}
globalThis.fetch = async (url) => {
  if (String(url) === certsUrl) return new Response(JSON.stringify({ keys: [kp.jwk] }));
  throw new Error('fetch inesperado ' + url);
};
async function call({ qs = '?days=7', env = {}, auth = true, method = 'GET' } = {}) {
  const headers = new Headers();
  if (auth) headers.set('cf-access-jwt-assertion', await sign(kp, goodClaims()));
  const request = new Request('https://brenbe.com/panel/api/visitas' + qs, { method, headers });
  const res = await (method === 'GET' ? mod.onRequestGet : mod.onRequest)({ request, env: { ...ACCESS_ENV, ...env } });
  return { res, body: await res.json() };
}
let passed = 0;
async function t(name, fn) { stats._resetJwks(); await fn(); passed++; console.log('ok  ' + name); }

await t('personas vs bots: cuenta sesiones, no mezcla y compara con el período previo', async () => {
  const { res, body } = await call({ env: { DB: mockDb() } });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'private, no-store');
  assert.equal(body.configured, true);
  assert.deepEqual(body.totals.people, { value: 4, previous: 3 });
  assert.equal(body.totals.bots.value, 2);
  assert.equal(body.totals.bots.pageviews, 3);
  assert.equal(body.totals.pageviews.value, 5, 'personas: 2 + 1 (recarga se junta) + 1 + 1');
  assert.equal(body.totals.whatsapp.value, 1);
  assert.equal(body.totals.contact.value, 1);
  assert.deepEqual(Object.fromEntries(body.bots.reasons.map((r) => [r.reason, r.visits])), { datacenter: 1, ua: 1 });
  assert.equal(body.bots.countries[0].country, 'US');
});
await t('los bots no ensucian ciudades, países ni canales', async () => {
  const { body } = await call({ env: { DB: mockDb() } });
  assert.ok(!body.countries.some((c) => c.country === 'US'));
  assert.ok(!body.cities.some((c) => c.city === 'Ashburn'));
  assert.deepEqual(body.countries.map((c) => [c.country, c.visits]), [['AR', 3], ['MX', 1]]);
  const c = body.cities.find((x) => x.city === 'Córdoba');
  assert.deepEqual([c.city, c.region, c.country, c.visits], ['Córdoba', 'Córdoba', 'AR', 1]);
  assert.ok(body.cities.some((x) => x.city === '' && x.country === 'AR'), 'sin ciudad se agrupa por país');
});
await t('canales: la UTM manda sobre el referer; Bing = otros buscadores; sin referer = directo', async () => {
  const { body } = await call({ env: { DB: mockDb() } });
  const ch = Object.fromEntries(body.channels.map((x) => [x.channel, x.visits]));
  assert.deepEqual(ch, { Google: 1, Pinterest: 1, Instagram: 0, Facebook: 0, WhatsApp: 0, 'Otros buscadores': 1, Directo: 1, Otros: 0 });
  assert.deepEqual(body.utm, [{ source: 'pinterest', medium: 'organic', campaign: 'paletas', visits: 1 }]);
  assert.equal(body.referrers.find((r) => r.host === 'google.com').visits, 1);
  assert.equal(mod.channelFor({ utm_source: 'gbp', utm_medium: 'profile' }).channel, 'Google');
  assert.equal(mod.channelFor({ utm_source: 'newsletter' }).channel, 'Otros');
  assert.equal(mod.channelFor({}).channel, 'Directo');
});
await t('páginas de entrada', async () => {
  const { body } = await call({ env: { DB: mockDb() } });
  const m = Object.fromEntries(body.entries.map((e) => [e.path, e.visits]));
  assert.deepEqual(m, { '/': 2, '/guias/paleta/': 1, '/es-mx/': 1 });
});
await t('últimas visitas: más reciente primero, recorrido sin duplicados, duración y acciones', async () => {
  const { body } = await call({ env: { DB: mockDb() } });
  assert.equal(body.recent.length, 4);
  assert.deepEqual(body.recent.map((r) => r.city), ['', 'Ciudad de México', 'Buenos Aires', 'Córdoba']);
  const p1 = body.recent[3];
  assert.deepEqual(p1.pages.map((p) => p.path), ['/', '/guias/colores-para-living/']);
  assert.equal(p1.channel, 'Google'); assert.equal(p1.whatsapp, true); assert.equal(p1.contact, false);
  assert.equal(p1.seconds, 240, 'duración = de la primera a la última acción (4 min)');
  assert.equal(p1.scroll, 80); assert.equal(p1.entry, '/');
  const p2 = body.recent[2];
  assert.deepEqual(p2.pages.map((p) => p.path), ['/guias/paleta/'], 'la recarga no repite la página');
  assert.equal(p2.device, 'desktop'); assert.equal(p2.channel, 'Pinterest'); assert.equal(p2.detail, 'pinterest / organic / paletas');
  assert.equal(body.recent[1].contact, true);
  assert.ok(!JSON.stringify(body).includes('persona1aaaa'), 'no se expone el id de sesión');
  assert.ok(body.recent.every((r) => !r.is_bot));
});
await t('muchas sesiones: solo las 50 últimas', async () => {
  const rows = [];
  for (let i = 0; i < 70; i++) rows.push(ev('sesionnumero' + String(i).padStart(3, '0'), 1000 - i));
  const { body } = await call({ env: { DB: mockDb({ rows: rows.sort((a, b) => a.ts - b.ts) }) } });
  assert.equal(body.totals.people.value, 70);
  assert.equal(body.recent.length, 50);
});
await t('contactos únicos (wa o formulario, sin doble conteo) y serie diaria de personas', async () => {
  const rows = [
    ...ROWS,
    // persona que toca WhatsApp y además manda el formulario: cuenta 1 en contacted y 1 en cada desglose
    ev('persona5eeee', 30, {}), ev('persona5eeee', 29, { type: 'wa_click' }), ev('persona5eeee', 28, { type: 'contact_submit' }),
    // bot que toca WhatsApp: no cuenta
    ev('bot3zzzzzzzz', 20, { is_bot: 1, bot_reason: 'ua' }), ev('bot3zzzzzzzz', 19, { type: 'wa_click', is_bot: 1, bot_reason: 'ua' }),
  ].sort((a, b) => a.ts - b.ts);
  const { body } = await call({ qs: '?days=7', env: { DB: mockDb({ rows, prevC: 2 }) } });
  assert.deepEqual(body.totals.contacted, { value: 3, previous: 2 });
  assert.equal(body.totals.whatsapp.value, 2); assert.equal(body.totals.contact.value, 2);
  assert.ok(body.totals.contacted.value < body.totals.whatsapp.value + body.totals.contact.value);
  assert.equal(body.series.length, 7);
  const dates = body.series.map((x) => x.date);
  const n = new Date();
  const stats7 = stats.shape({}, 7, new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()) - 6 * 86400000), n);
  assert.deepEqual(dates, stats7.series.map((x) => x.date), 'mismos días que la serie de stats.js');
  assert.ok(body.series.reduce((k, x) => k + x.people, 0) >= body.totals.people.value, 'cada persona cuenta al menos un día');
  assert.ok(body.series.every((x) => Number.isInteger(x.people) && x.people >= 0));
  assert.equal(body.range.from.slice(0, 10), dates[0]);
});
await t('serie diaria: una misma pestaña activa dos días cuenta en ambos días', async () => {
  const today = new Date(NOW).toISOString().slice(0, 10);
  const minsToday = Math.max(1, Math.floor((NOW - Date.parse(today + 'T00:00:00Z')) / 60000) - 1);
  const rows = [ev('pestana2dias', minsToday + 60 * 24), ev('pestana2dias', 0)].sort((a, b) => a.ts - b.ts);
  const { body } = await call({ qs: '?days=7', env: { DB: mockDb({ rows }) } });
  const byDate = Object.fromEntries(body.series.map((x) => [x.date, x.people]));
  assert.equal(byDate[today], 1, 'hoy cuenta a la persona');
  const yesterday = new Date(Date.parse(today) - 86400000).toISOString().slice(0, 10);
  assert.equal(byDate[yesterday], 1, 'ayer también');
  assert.equal(body.totals.people.value, 1);
});
await t('consulta: ventana de días, límite y solo lecturas', async () => {
  const db = mockDb();
  await call({ qs: '?days=30', env: { DB: db } });
  assert.equal(db.log.length, 3);
  assert.match(db.log[0].sql, /^SELECT .* FROM events WHERE ts >= \? ORDER BY ts DESC LIMIT/);
  const d0 = new Date(); const todayUtc = Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth(), d0.getUTCDate());
  assert.equal(db.log[0].args[0], todayUtc - 29 * 86400000, 'ventana alineada a días calendario UTC (igual que stats.js)');
  assert.equal(db.log[1].args[1], db.log[0].args[0], 'el período previo termina donde empieza el actual');
  assert.ok(db.log.every((s) => /^SELECT/.test(s.sql)));
});
await t('sin DB: 200 configured:false; D1 sin migración: configured:false sin_tabla', async () => {
  let r = await call({ env: {} });
  assert.equal(r.res.status, 200); assert.equal(r.body.configured, false); assert.equal(r.body.reason, 'sin_db');
  r = await call({ env: { DB: mockDb({ fail: true }) } });
  assert.equal(r.res.status, 200); assert.equal(r.body.configured, false); assert.equal(r.body.reason, 'sin_tabla');
});
await t('base vacía: ceros y listas vacías', async () => {
  const { body } = await call({ env: { DB: mockDb({ rows: [], prev: 0 }) } });
  assert.equal(body.totals.people.value, 0); assert.deepEqual(body.recent, []); assert.deepEqual(body.cities, []);
});
await t('autenticación: sin JWT 401, JWT falso 403, sin Access configurado 503; days inválido 400; POST 405', async () => {
  const db = mockDb();
  assert.equal((await call({ auth: false, env: { DB: db } })).res.status, 401);
  assert.equal(db.log.length, 0, 'sin autenticar no se toca la base');
  const bad = await keypair('k1');
  const request = new Request('https://brenbe.com/panel/api/visitas', { headers: { 'cf-access-jwt-assertion': await sign(bad, goodClaims()) } });
  assert.equal((await mod.onRequestGet({ request, env: { ...ACCESS_ENV, DB: db } })).status, 403);
  const r503 = await mod.onRequestGet({ request: new Request('https://brenbe.com/panel/api/visitas'), env: { DB: db } });
  assert.equal(r503.status, 503);
  assert.equal((await call({ qs: '?days=5', env: { DB: db } })).res.status, 400);
  assert.equal((await call({ method: 'POST', env: { DB: db } })).res.status, 405);
  assert.equal(db.log.length, 0);
});

console.log(`\n${passed} pruebas OK`);
