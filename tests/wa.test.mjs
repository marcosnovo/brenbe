// Prueba local de functions/wa/[[path]].js (sin Cloudflare): node tests/wa.test.mjs
// Los números son de prueba; la Function nunca debe mostrarlos salvo en el header Location para personas.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'functions', 'wa', '[[path]].js'), 'utf8');
const mod = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));

const CHROME = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';
const AR = '5491100000001';
const ES = '34600000002';
const MAP = {
  v: 1,
  map: {
    home: { l: 'es-ar', m: 'Hola Brenda, vi tu web.' },
    'guias-colores-para-living': { l: 'es-ar', m: 'Hola Brenda, leí la guía "Colores para living" & más.' },
    'es-mx': { l: 'es-mx', m: 'Hola Brenda (MX)' },
    en: { l: 'en', m: 'Hi Brenda, I found your website.' },
    'en-guides-small-living-room': { l: 'en', m: 'Hi Brenda, I read the guide "Small living room".' },
  },
};
let passed = 0;

async function run({ path = '/wa/home/', ua = CHROME, env = { WA_NUMBER_AR: AR, WA_NUMBER_ES: ES }, map = MAP, assetsFail = false, method = 'GET' }) {
  mod._resetCache();
  const h = new Headers();
  if (ua !== null) h.set('user-agent', ua);
  const request = new Request('https://brenbe.com' + path, { method, headers: h });
  const full = { ...env, ASSETS: { fetch: async () => { if (assetsFail) throw new Error('boom'); return map ? new Response(JSON.stringify(map)) : new Response('nope', { status: 404 }); } } };
  const fn = method === 'GET' ? mod.onRequestGet : mod.onRequest;
  return fn({ request, env: full });
}
// El número solo puede aparecer en Location (302 a personas): ni cuerpo ni otros headers.
async function noLeak(res, nums = [AR, ES], { allowLocation = false } = {}) {
  const body = await res.text();
  for (const n of nums) {
    assert.ok(!body.includes(n), 'cuerpo con número');
    for (const [k, v] of res.headers) if (!(allowLocation && k === 'location')) assert.ok(!v.includes(n), 'header ' + k + ' con número');
  }
}
async function t(name, fn) { await fn(); passed++; console.log('ok  ' + name); }

await t('es-ar -> número AR + mensaje de la página, headers privados', async () => {
  const res = await run({ path: '/wa/guias-colores-para-living/' });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), 'https://wa.me/' + AR + '?text=' + encodeURIComponent('Hola Brenda, leí la guía "Colores para living" & más.'));
  assert.equal(res.headers.get('cache-control'), 'private, no-store');
  assert.equal(res.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.equal(res.headers.get('referrer-policy'), 'no-referrer');
  await noLeak(res, [AR, ES], { allowLocation: true });
});
await t('home es-ar -> AR', async () => assert.match((await run({ path: '/wa/home/' })).headers.get('location'), new RegExp('^https://wa.me/' + AR + '\\?text=')));
await t('en -> número ES', async () => {
  const res = await run({ path: '/wa/en-guides-small-living-room/' });
  assert.equal(res.headers.get('location'), 'https://wa.me/' + ES + '?text=' + encodeURIComponent('Hi Brenda, I read the guide "Small living room".'));
});
await t('es-mx, es-es, pt-br -> ES (por prefijo aunque no estén en el mapa)', async () => {
  for (const p of ['/wa/es-mx/', '/wa/es-es-contacto/', '/wa/pt-br-contato/']) assert.match((await run({ path: p })).headers.get('location'), new RegExp('^https://wa.me/' + ES));
});
await t('sin WA_NUMBER_ES: los idiomas no AR usan el AR (respaldo)', async () => assert.match((await run({ path: '/wa/en/', env: { WA_NUMBER_AR: AR } })).headers.get('location'), new RegExp('^https://wa.me/' + AR)));
await t('sin WA_NUMBER_AR: es-ar usa el ES (respaldo)', async () => assert.match((await run({ path: '/wa/home/', env: { WA_NUMBER_ES: ES } })).headers.get('location'), new RegExp('^https://wa.me/' + ES)));
await t('sin ningún número -> 302 a la página de contacto del idioma, sin números', async () => {
  const cases = { '/wa/home/': '/contacto/', '/wa/en-guides-small-living-room/': '/en/contact/', '/wa/es-mx/': '/es-mx/contacto/', '/wa/es-es-x/': '/es-es/contacto/', '/wa/pt-br-x/': '/pt-br/contato/' };
  for (const [p, to] of Object.entries(cases)) {
    const res = await run({ path: p, env: {} });
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('location'), to);
    assert.equal(res.headers.get('cache-control'), 'private, no-store');
  }
});
await t('número mal formado se trata como ausente; con + y espacios se normaliza', async () => {
  const res = await run({ path: '/wa/home/', env: { WA_NUMBER_AR: '12ab', WA_NUMBER_ES: '' } });
  assert.equal(res.headers.get('location'), '/contacto/');
  assert.match((await run({ path: '/wa/home/', env: { WA_NUMBER_AR: '+54 9 11 0000-0001' } })).headers.get('location'), /^https:\/\/wa\.me\/5491100000001\?/);
});
await t('origen desconocido -> mensaje genérico (home) del idioma inferido', async () => {
  assert.equal((await run({ path: '/wa/no-existe/' })).headers.get('location'), 'https://wa.me/' + AR + '?text=' + encodeURIComponent('Hola Brenda, vi tu web.'));
  assert.equal((await run({ path: '/wa/en-no-existe/' })).headers.get('location'), 'https://wa.me/' + ES + '?text=' + encodeURIComponent('Hi Brenda, I found your website.'));
  assert.equal((await run({ path: '/wa/' })).status, 302);
});
await t('origen raro (caracteres inválidos, __proto__) no rompe ni se refleja', async () => {
  for (const p of ['/wa/%3Cscript%3E/', '/wa/__proto__/', '/wa/constructor/', '/wa/' + 'a'.repeat(300) + '/']) {
    const res = await run({ path: p });
    assert.equal(res.status, 302);
    assert.ok(!(res.headers.get('location') || '').includes('script'));
  }
});
await t('mapa no disponible (404 / error / JSON inválido) -> igual redirige, sin texto', async () => {
  assert.equal((await run({ map: null })).headers.get('location'), 'https://wa.me/' + AR);
  assert.equal((await run({ assetsFail: true })).headers.get('location'), 'https://wa.me/' + AR);
  assert.equal((await run({ map: { map: null } })).headers.get('location'), 'https://wa.me/' + AR);
});
await t('bots y sin user-agent: 403, sin Location ni número', async () => {
  for (const ua of ['Googlebot/2.1 (+http://www.google.com/bot.html)', 'Mozilla/5.0 (compatible; bingbot/2.0)', 'facebookexternalhit/1.1', 'curl/8.4.0', 'Python-urllib/3.11', 'GPTBot/1.0', 'WhatsApp/2.23 preview', 'Mozilla/5.0 HeadlessChrome/126', null, '']) {
    const res = await run({ ua });
    assert.equal(res.status, 403, String(ua));
    assert.equal(res.headers.get('location'), null);
    assert.equal(res.headers.get('x-robots-tag'), 'noindex, nofollow');
    await noLeak(res);
  }
});
await t('navegadores de personas (Chrome, Safari iOS, Instagram in-app) pasan', async () => {
  for (const ua of [CHROME, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 330.0']) assert.equal((await run({ ua })).status, 302);
});
await t('otro método -> 405 sin números', async () => {
  const res = await run({ method: 'POST' });
  assert.equal(res.status, 405);
  await noLeak(res);
});
await t('ningún cuerpo ni header (salvo Location a personas) contiene los números', async () => {
  for (const p of ['/wa/home/', '/wa/en/', '/wa/no-existe/']) await noLeak(await run({ path: p }), [AR, ES], { allowLocation: true });
  await noLeak(await run({ path: '/wa/home/', env: {} }));
});
await t('el código fuente no escribe en logs', () => assert.ok(!/console\./.test(src)));

console.log(passed + ' pruebas OK');
