// Prueba local de functions/c.js (colector anónimo) con una D1 simulada: node tests/collector.test.mjs
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mod = await import(join(root, 'functions', 'c.js'));

function mockDb({ fail = false } = {}) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      return { bind: (...args) => ({ run: async () => { if (fail) throw new Error('no such table: events'); calls.push({ sql, args }); return { success: true }; } }) };
    },
  };
}
const SID = 'abcd1234efgh';
const UA_PHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const UA_DESK = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const CF = { country: 'AR', region: 'Córdoba', city: 'Córdoba', timezone: 'America/Argentina/Cordoba' };
const body = (o = {}) => JSON.stringify({ e: 'pv', s: SID, p: '/guias/colores-para-living/', n: 'Colores para living | BRENBE', r: 'https://www.google.com/', us: null, um: null, uc: null, b: 0, ...o });

async function post({ raw = body(), db = mockDb(), headers = {}, cf = CF, noDb = false, method = 'POST' } = {}) {
  const h = new Headers({ origin: 'https://brenbe.com', 'user-agent': UA_PHONE, 'content-type': 'text/plain' });
  for (const [k, v] of Object.entries(headers)) { if (v === null) h.delete(k); else h.set(k, v); }
  const request = new Request('https://brenbe.com/c', { method, headers: h, body: method === 'POST' ? raw : undefined });
  Object.defineProperty(request, 'cf', { value: cf });
  const env = noDb ? {} : { DB: db };
  const fn = method === 'POST' ? mod.onRequestPost : mod.onRequest;
  const res = await fn({ request, env });
  return { res, db };
}
// Valor de una columna en el INSERT (las columnas y los bind van en el mismo orden).
const col = (c, name) => c.args[c.sql.slice(c.sql.indexOf('(') + 1, c.sql.indexOf(')')).split(',').map((x) => x.trim()).indexOf(name)];
let passed = 0;
async function t(name, fn) { mod._resetRate(); await fn(); passed++; console.log('ok  ' + name); }

await t('pageview válido: 204 y una fila con geo aproximada, sin IP', async () => {
  const { res, db } = await post({ headers: { 'cf-connecting-ip': '203.0.113.9', 'x-forwarded-for': '203.0.113.9' } });
  assert.equal(res.status, 204);
  assert.equal(db.calls.length, 1);
  const c = db.calls[0];
  assert.ok(!/\bip\b/i.test(c.sql), 'la tabla no tiene columna de IP');
  assert.ok(!c.args.some((a) => String(a).includes('203.0.113.9')), 'la IP no se guarda');
  assert.equal(col(c, 'type'), 'pageview'); assert.equal(col(c, 'sid'), SID); assert.equal(col(c, 'path'), '/guias/colores-para-living/');
  assert.equal(col(c, 'city'), 'Córdoba'); assert.equal(col(c, 'country'), 'AR'); assert.equal(col(c, 'device'), 'mobile');
  assert.equal(col(c, 'ref_host'), 'google.com'); assert.equal(col(c, 'ref_path'), '/'); assert.equal(col(c, 'locale'), 'es-ar');
  assert.equal(col(c, 'is_bot'), 0); assert.equal(col(c, 'bot_reason'), null);
  assert.ok(Math.abs(col(c, 'ts') - Date.now()) < 5000, 'la hora la pone el servidor');
});
await t('referrer: solo los buscadores guardan ruta (y nunca la query); el propio sitio no cuenta', async () => {
  let r = await post({ raw: body({ r: 'https://www.google.com/search?q=zapatos+rojos&x=1' }) });
  assert.equal(col(r.db.calls[0], 'ref_path'), '/search');
  assert.ok(!JSON.stringify(r.db.calls[0].args).includes('zapatos'));
  r = await post({ raw: body({ r: 'https://ar.pinterest.com/pin/123/?x=1' }) });
  assert.equal(col(r.db.calls[0], 'ref_host'), 'ar.pinterest.com');
  assert.equal(col(r.db.calls[0], 'ref_path'), null);
  r = await post({ raw: body({ r: 'https://brenbe.com/servicios/' }) });
  assert.equal(col(r.db.calls[0], 'ref_host'), null);
});
await t('UTM normalizadas y limitadas; idioma por ruta; query y hash fuera de la ruta', async () => {
  const { db } = await post({ raw: body({ p: '/en/guides/x/?a=1#b', us: 'Pinterest', um: 'organic', uc: 'PALETAS-living<script>' }) });
  const c = db.calls[0];
  assert.equal(col(c, 'utm_source'), 'pinterest'); assert.equal(col(c, 'utm_medium'), 'organic');
  assert.equal(col(c, 'utm_campaign'), 'paletas-livingscript');
  assert.equal(col(c, 'locale'), 'en'); assert.equal(col(c, 'path'), '/en/guides/x/');
});
await t('eventos wa_click, contact_submit y leave (duración y scroll acotados)', async () => {
  for (const [e, type] of [['wa', 'wa_click'], ['ct', 'contact_submit']]) {
    const { db } = await post({ raw: body({ e }) });
    assert.equal(col(db.calls[0], 'type'), type);
  }
  const { db } = await post({ raw: body({ e: 'lv', d: 95.4, g: 250 }) });
  assert.equal(col(db.calls[0], 'type'), 'leave');
  assert.equal(col(db.calls[0], 'dur'), 95);
  assert.equal(col(db.calls[0], 'scroll'), 100);
  const pv = await post({ raw: body({ d: 5, g: 5 }) });
  assert.equal(col(pv.db.calls[0], 'dur'), null);
});
await t('bots: UA, categoría verificada de Cloudflare, señal JS, centro de datos, puntaje', async () => {
  const bot = async (o) => { const r = await post(o); return [col(r.db.calls[0], 'is_bot'), col(r.db.calls[0], 'bot_reason')]; };
  assert.deepEqual(await bot({ headers: { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' } }), [1, 'ua']);
  assert.deepEqual(await bot({ headers: { 'user-agent': 'HeadlessChrome/120' } }), [1, 'ua']);
  assert.deepEqual(await bot({ headers: { 'user-agent': null } }), [1, 'ua']);
  assert.deepEqual(await bot({ cf: { ...CF, verifiedBotCategory: 'Search Engine Crawler' } }), [1, 'verified']);
  assert.deepEqual(await bot({ cf: { ...CF, botManagement: { score: 3 } } }), [1, 'score']);
  assert.deepEqual(await bot({ raw: body({ b: 1 }) }), [1, 'webdriver']);
  assert.deepEqual(await bot({ headers: { 'user-agent': UA_DESK }, cf: { ...CF, country: 'US', asOrganization: 'Amazon.com, Inc.' } }), [1, 'datacenter']);
  assert.deepEqual(await bot({ headers: { 'user-agent': UA_DESK }, cf: { ...CF, asOrganization: 'Telecom Argentina S.A.' } }), [0, null]);
  assert.deepEqual(await bot({ cf: { ...CF, asOrganization: 'Cloudflare, Inc.' } }), [0, null]);
});
await t('dispositivo por UA', () => {
  assert.equal(mod.deviceOf(UA_PHONE), 'mobile'); assert.equal(mod.deviceOf(UA_DESK), 'desktop');
  assert.equal(mod.deviceOf('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)'), 'tablet');
  assert.equal(mod.deviceOf('Mozilla/5.0 (Linux; Android 13; SM-X700)'), 'tablet');
  assert.equal(mod.deviceOf(''), 'other');
});
await t('rechaza otro origen (403) y no escribe; acepta Sec-Fetch-Site same-origin sin Origin', async () => {
  let r = await post({ headers: { origin: 'https://evil.example' } });
  assert.equal(r.res.status, 403); assert.equal(r.db.calls.length, 0);
  r = await post({ headers: { origin: null } });
  assert.equal(r.res.status, 403); assert.equal(r.db.calls.length, 0);
  r = await post({ headers: { origin: null, 'sec-fetch-site': 'same-origin' } });
  assert.equal(r.res.status, 204); assert.equal(r.db.calls.length, 1);
  r = await post({ headers: { origin: 'https://brenbe.com.evil.example' } });
  assert.equal(r.res.status, 403);
});
await t('respeta Do Not Track y Global Privacy Control (no guarda)', async () => {
  for (const h of [{ dnt: '1' }, { 'sec-gpc': '1' }]) {
    const r = await post({ headers: h });
    assert.equal(r.res.status, 204); assert.equal(r.db.calls.length, 0);
  }
});
await t('valida el cuerpo: tamaño, JSON, tipo, sid, ruta; ignora /panel, /admin y /wa/', async () => {
  const bad = async (raw, status) => { const r = await post({ raw }); assert.equal(r.res.status, status, raw.slice(0, 40)); assert.equal(r.db.calls.length, 0); };
  await bad('x'.repeat(3000), 413);
  await bad('no es json', 400); await bad('[]', 400); await bad('null', 400);
  await bad(body({ e: 'zzz' }), 400); await bad(body({ s: 'corto' }), 400); await bad(body({ s: 'ABC DEF!!' }), 400);
  await bad(body({ p: 'https://evil.com/' }), 400); await bad(body({ p: '//evil.com' }), 400); await bad(body({ p: '' }), 400);
  await bad(body({ p: '/' + 'a'.repeat(300) }), 400);
  for (const p of ['/panel/', '/admin/', '/wa/home/', '/c']) await bad(body({ p }), 400);
  const big = await post({ raw: body(), headers: { 'content-length': '99999' } });
  assert.equal(big.res.status, 413);
});
await t('título largo y caracteres de control se recortan', async () => {
  const { db } = await post({ raw: body({ n: 'a\u0000b\n' + 'x'.repeat(500) }) });
  const title = col(db.calls[0], 'title');
  assert.ok(title.length <= 120); assert.ok(!/[\u0000-\u001f]/.test(title));
});
await t('límite por sesión: 60 por minuto, y otra sesión no se ve afectada', async () => {
  let last;
  for (let i = 0; i < 61; i++) last = await post({});
  assert.equal(last.res.status, 429);
  assert.equal((await post({ raw: body({ s: 'otrasesion99' }) })).res.status, 204);
  assert.equal(mod.allowed(SID, Date.now() + 61000), true, 'la ventana se reinicia');
});
await t('sin DB o con D1 caída: 204 y el sitio no se entera', async () => {
  assert.equal((await post({ noDb: true })).res.status, 204);
  assert.equal((await post({ db: mockDb({ fail: true }) })).res.status, 204);
});
await t('retención: borra lo de más de 400 días solo de vez en cuando', async () => {
  const db = mockDb();
  const now = Date.UTC(2026, 10, 23);
  assert.equal(await mod.maybePurge(db, now, 0.5), false);
  assert.equal(db.calls.length, 0);
  assert.equal(await mod.maybePurge(db, now, 0.001), true);
  assert.match(db.calls[0].sql, /DELETE FROM events WHERE ts < \?/);
  assert.equal(db.calls[0].args[0], now - 400 * 86400000);
});
await t('otros métodos: 405', async () => {
  const { res } = await post({ method: 'GET' });
  assert.equal(res.status, 405);
});

console.log(`\n${passed} pruebas OK`);
