// Cloudflare Pages Function: SOLO GET "/" (la home es-AR).
// Sugiere la versión regional (es-MX, es-ES, en, pt-BR) en la PRIMERA visita, con un 302 temporal.
// Reglas de seguridad para el SEO (ver docs/i18n-content-guide.md): nunca a bots, nunca sin Accept-Language,
// nunca si ya hay cookie `brenbe_loc` (el visitante ya eligió, o ya lo redirigimos), nunca a un idioma que
// no esté publicado (se lee /locales.json, que genera Jekyll), y ante cualquier duda o error: sirve la home normal.
// Para probarlo a mano: agregar ?nolang a la URL desactiva la redirección.

const COOKIE = 'brenbe_loc';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

// País de Cloudflare -> idioma. Otros países hispanohablantes de Latinoamérica NO se redirigen: se quedan en la raíz (es-AR, hreflang `es`).
// Portugal no se redirige (pt-PT != pt-BR): ve la sugerencia del banner.
const COUNTRY = {
  MX: 'es-mx', ES: 'es-es', BR: 'pt-br',
  US: 'en', CA: 'en', GB: 'en', IE: 'en', AU: 'en', NZ: 'en', ZA: 'en', SG: 'en',
};
// Primer idioma de Accept-Language compatible con cada destino.
const LANG_OK = { 'es-mx': ['es'], 'es-es': ['es', 'ca', 'gl', 'eu'], 'pt-br': ['pt'], en: ['en'] };

const BOT = /bot|crawl|spider|slurp|bing|google|duckduck|yandex|baidu|facebookexternalhit|twitterbot|linkedin|whatsapp|telegram|slack|pinterest|preview|embedly|lighthouse|pagespeed|gtmetrix|headless|curl|wget|python|go-http|monitor|uptime|ahrefs|semrush|gptbot|claudebot|perplexity|oai-searchbot|chatgpt|applebot|ccbot|bytespider|petalbot|mj12|dotbot|facebot|discord|skype|vkshare|w3c_validator|node-fetch|axios|java\//i;

// Idiomas publicados: /locales.json lo genera Jekyll con las homes publicadas ({"live":{"es-ar":"/","es-mx":"/es-mx/"}}).
let cache = { at: 0, live: null };
async function liveLocales(env, url) {
  const now = Date.now();
  if (cache.live && now - cache.at < 60000) return cache.live;
  if (!env || !env.ASSETS) return null;
  const res = await env.ASSETS.fetch(new Request(new URL('/locales.json', url).toString()));
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || typeof data.live !== 'object') return null;
  cache = { at: now, live: data.live };
  return data.live;
}

export function _resetCache() { cache = { at: 0, live: null }; } // solo para pruebas

// Decide el idioma destino o null. Función pura (se prueba en tests/function-redirect.test.mjs).
export function pickLocale({ country, acceptLanguage }) {
  const first = String(acceptLanguage || '').split(',')[0].trim().toLowerCase();
  if (!first) return null;
  if (/-ar$/.test(first)) return null; // argentinos (también en el exterior) se quedan en su raíz
  const lang = first.split('-')[0];
  let loc = COUNTRY[String(country || '').toUpperCase()];
  if (String(country || '').toUpperCase() === 'US' && lang === 'es') loc = 'es-mx'; // hispanos en EE.UU.: hreflang es-US -> /es-mx/
  if (!loc || !LANG_OK[loc] || LANG_OK[loc].indexOf(lang) === -1) return null;
  return loc;
}

export async function onRequestGet(context) {
  const { request, next, env } = context;
  try {
    const url = new URL(request.url);
    if (url.pathname !== '/' || url.searchParams.has('nolang')) return next();
    const h = request.headers;
    const ua = h.get('user-agent') || '';
    const al = h.get('accept-language') || '';
    if (!ua || !al || BOT.test(ua)) return next();
    if (new RegExp('(?:^|;\\s*)' + COOKIE + '=').test(h.get('cookie') || '')) return next();
    if (/prefetch|prerender/i.test((h.get('sec-purpose') || '') + ' ' + (h.get('purpose') || ''))) return next();
    const loc = pickLocale({ country: request.cf && request.cf.country, acceptLanguage: al });
    if (!loc) return next();
    const live = await liveLocales(env, request.url);
    const target = live && live[loc];
    if (!target || target === '/') return next();
    return new Response(null, {
      status: 302,
      headers: {
        Location: target,
        'Set-Cookie': COOKIE + '=' + loc + '; Path=/; Max-Age=' + COOKIE_MAX_AGE + '; SameSite=Lax' + (url.protocol === 'https:' ? '; Secure' : ''),
        'Cache-Control': 'private, no-store',
        Vary: 'Accept-Language, Cookie',
      },
    });
  } catch (e) {
    return next(); // falla abierta: ante cualquier error se sirve la home estática
  }
}
