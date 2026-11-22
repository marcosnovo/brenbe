// Prueba local de functions/index.js (sin Cloudflare): node tests/function-redirect.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'functions', 'index.js'), 'utf8');
const mod = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));

const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const LIVE = { 'es-ar': '/', 'es-mx': '/es-mx/', 'es-es': '/es-es/', en: '/en/', 'pt-br': '/pt-br/' };
let passed = 0;

function run({ path = '/', country, al, ua = CHROME, cookie, live = LIVE, qs = '', headers = {}, assetsFail = false, throwNext = false }) {
  mod._resetCache();
  const h = new Headers(headers);
  if (ua !== null) h.set('user-agent', ua);
  if (al) h.set('accept-language', al);
  if (cookie) h.set('cookie', cookie);
  const request = { url: 'https://brenbe.com' + path + qs, method: 'GET', headers: h, cf: country ? { country } : undefined };
  const NEXT = new Response('static home', { status: 200 });
  const env = { ASSETS: { fetch: async () => { if (assetsFail) throw new Error('boom'); return new Response(JSON.stringify({ live }), { status: 200 }); } } };
  return mod.onRequestGet({ request, env, next: () => { if (throwNext) throw new Error('x'); return NEXT; } }).then((res) => ({ res, passthrough: res === NEXT }));
}
async function t(name, fn) { await fn(); passed++; console.log('ok  ' + name); }

await t('MX + es-MX -> 302 /es-mx/ with cookie, no-store, Vary', async () => {
  const { res } = await run({ country: 'MX', al: 'es-MX,es;q=0.9,en;q=0.8' });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/es-mx/');
  assert.match(res.headers.get('set-cookie'), /^brenbe_loc=es-mx; Path=\/; Max-Age=2592000; SameSite=Lax; Secure$/);
  assert.equal(res.headers.get('cache-control'), 'private, no-store');
  assert.equal(res.headers.get('vary'), 'Accept-Language, Cookie');
});
await t('ES + es-ES -> /es-es/', async () => assert.equal((await run({ country: 'ES', al: 'es-ES,es;q=0.9' })).res.headers.get('location'), '/es-es/'));
await t('ES + ca-ES (catalán) -> /es-es/', async () => assert.equal((await run({ country: 'ES', al: 'ca-ES,es;q=0.8' })).res.headers.get('location'), '/es-es/'));
await t('US + en-US -> /en/', async () => assert.equal((await run({ country: 'US', al: 'en-US,en;q=0.9' })).res.headers.get('location'), '/en/'));
await t('US + es-US -> /es-mx/ (hreflang es-US)', async () => assert.equal((await run({ country: 'US', al: 'es-US,es;q=0.9' })).res.headers.get('location'), '/es-mx/'));
await t('GB/CA/AU + en -> /en/', async () => { for (const c of ['GB', 'CA', 'AU']) assert.equal((await run({ country: c, al: 'en-GB,en;q=0.9' })).res.headers.get('location'), '/en/'); });
await t('BR + pt-BR -> /pt-br/', async () => assert.equal((await run({ country: 'BR', al: 'pt-BR,pt;q=0.9' })).res.headers.get('location'), '/pt-br/'));
await t('PT (Portugal) + pt-PT -> stays on root (banner only)', async () => assert.ok((await run({ country: 'PT', al: 'pt-PT,pt;q=0.9' })).passthrough));
await t('CO/CL/PE + es -> stays on root (other LATAM)', async () => { for (const c of ['CO', 'CL', 'PE', 'UY']) assert.ok((await run({ country: c, al: 'es-CO,es;q=0.9' })).passthrough, c); });
await t('AR + es-AR -> stays', async () => assert.ok((await run({ country: 'AR', al: 'es-AR,es;q=0.9' })).passthrough));
await t('Argentine expat (ES + es-AR) -> stays on root', async () => assert.ok((await run({ country: 'ES', al: 'es-AR,es;q=0.9' })).passthrough));
await t('MX + en-US browser (language mismatch) -> stays', async () => assert.ok((await run({ country: 'MX', al: 'en-US,en;q=0.9' })).passthrough));
await t('ES with Chinese browser -> stays', async () => assert.ok((await run({ country: 'ES', al: 'zh-CN,zh;q=0.9' })).passthrough));
await t('cookie brenbe_loc present -> stays', async () => { assert.ok((await run({ country: 'MX', al: 'es-MX', cookie: 'a=1; brenbe_loc=es-ar' })).passthrough); assert.ok((await run({ country: 'MX', al: 'es-MX', cookie: 'brenbe_loc=es-mx' })).passthrough); });
await t('other cookie does not block', async () => assert.equal((await run({ country: 'MX', al: 'es-MX', cookie: 'foo=bar; xbrenbe_loc=1' })).res.status, 302));
await t('no Accept-Language -> stays', async () => assert.ok((await run({ country: 'MX' })).passthrough));
await t('empty User-Agent -> stays', async () => assert.ok((await run({ country: 'MX', al: 'es-MX', ua: null })).passthrough));
await t('bots/crawlers/previewers -> stay', async () => {
  const bots = ['Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.1; +https://openai.com/gptbot)', 'Mozilla/5.0 AppleWebKit/537.36 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
    'Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)', 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)', 'Twitterbot/1.0',
    'WhatsApp/2.23.20.0 A', 'LinkedInBot/1.0 (compatible; Mozilla/5.0)', 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)', 'Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/126.0', 'curl/8.4.0', 'python-requests/2.31', 'Googlebot-Image/1.0', 'Applebot/0.1'];
  for (const ua of bots) assert.ok((await run({ country: 'MX', al: 'es-MX', ua })).passthrough, ua);
});
await t('only "/": other paths and POST-like paths untouched', async () => { for (const p of ['/es-mx/', '/guias/', '/index.html', '/servicios/']) assert.ok((await run({ path: p, country: 'MX', al: 'es-MX' })).passthrough, p); });
await t('?nolang disables redirect', async () => assert.ok((await run({ country: 'MX', al: 'es-MX', qs: '?nolang' })).passthrough));
await t('prefetch/prerender requests are not redirected', async () => { assert.ok((await run({ country: 'MX', al: 'es-MX', headers: { 'sec-purpose': 'prefetch' } })).passthrough); assert.ok((await run({ country: 'MX', al: 'es-MX', headers: { purpose: 'prefetch' } })).passthrough); });
await t('locale not live (placeholders) -> stays', async () => { assert.ok((await run({ country: 'MX', al: 'es-MX', live: { 'es-ar': '/' } })).passthrough); assert.ok((await run({ country: 'US', al: 'en-US', live: { 'es-ar': '/', 'es-mx': '/es-mx/' } })).passthrough); });
await t('missing request.cf -> stays', async () => assert.ok((await run({ al: 'es-MX' })).passthrough));
await t('fail open: /locales.json fetch throws -> next()', async () => assert.ok((await run({ country: 'MX', al: 'es-MX', assetsFail: true })).passthrough));
await t('fail open: malformed context -> next()', async () => {
  const NEXT = new Response('ok'); const res = await mod.onRequestGet({ request: null, env: {}, next: () => NEXT }); assert.equal(res, NEXT);
});
await t('pickLocale pure rules', async () => {
  assert.equal(mod.pickLocale({ country: 'mx', acceptLanguage: 'es-419,es;q=0.9' }), 'es-mx');
  assert.equal(mod.pickLocale({ country: 'ES', acceptLanguage: '' }), null);
  assert.equal(mod.pickLocale({ country: undefined, acceptLanguage: 'es' }), null);
});
console.log(`\n${passed} tests passed`);
