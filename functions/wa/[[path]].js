// Cloudflare Pages Function: GET /wa/<origen>/  (botones de WhatsApp de todo el sitio)
// Responde 302 a https://wa.me/<número>?text=<mensaje de esa página>. El número NO está en el repo ni en el HTML: vive solo como
// secreto de Pages (WA_NUMBER_AR para es-AR, WA_NUMBER_ES para es-MX, es-ES, en y pt-BR; solo dígitos, formato internacional sin "+").
// El mensaje de cada <origen> sale de /_wa-map.json (lo genera Jekyll, sin teléfonos; ver wa-map.json y _includes/wa.html).
// Reglas: nunca se repite el número en un error ni en un log; los bots no reciben el redirect (403) para que no lo cosechen por
// el header Location; la respuesta no se cachea ni se indexa. Si falta un secreto se usa el otro; si faltan los dos, 302 a Contacto.
// Los clics se miden con el colector /c (stats-script.html envía `wa` al tocar un enlace /wa/); esta Function no guarda nada.

const MAP_PATH = '/_wa-map.json';
const CONTACT = { 'es-ar': '/contacto/', 'es-mx': '/es-mx/contacto/', 'es-es': '/es-es/contacto/', en: '/en/contact/', 'pt-br': '/pt-br/contato/' };
const PREFIXES = ['es-mx', 'es-es', 'pt-br', 'en'];
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|facebot|preview|embedly|headless|phantomjs|puppeteer|playwright|selenium|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|curl|wget|python|aiohttp|httpx|go-http|java\/|okhttp|libwww|axios|node-fetch|scrapy|postman|google-|mediapartners|ahrefs|semrush|mj12|dotbot|petalbot|bytespider|gpt|claude|perplexity|ccbot|applebot|validator|vkshare|skypeuri|discord|slack|twitter|linkedin|pinterest|telegram/i;

let cache = { at: 0, map: null };
export function _resetCache() { cache = { at: 0, map: null }; } // solo para pruebas

// Idioma que se deduce del prefijo del origen (es-mx-guias-x -> es-mx; en-contact -> en; el resto -> es-ar).
export function localeOfOrigin(origen) {
  for (const p of PREFIXES) if (origen === p || origen.startsWith(p + '-')) return p;
  return 'es-ar';
}

// Solo dígitos, entre 8 y 15 (E.164). Cualquier otra cosa cuenta como "no configurado".
export function cleanNumber(v) {
  const d = String(v == null ? '' : v).replace(/\D/g, '');
  return d.length >= 8 && d.length <= 15 ? d : '';
}

export function pickNumber(locale, env) {
  const ar = cleanNumber(env && env.WA_NUMBER_AR);
  const es = cleanNumber(env && env.WA_NUMBER_ES);
  return locale === 'es-ar' ? ar || es : es || ar;
}

async function loadMap(env, url) {
  const now = Date.now();
  if (cache.map && now - cache.at < 60000) return cache.map;
  if (!env || !env.ASSETS) return null;
  try {
    const res = await env.ASSETS.fetch(new Request(new URL(MAP_PATH, url).toString()));
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data.map !== 'object' || !data.map) return null;
    cache = { at: now, map: data.map };
    return data.map;
  } catch (e) {
    return null;
  }
}

const HEADERS = { 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'no-referrer' };
const reply = (status, extra = {}) => new Response(null, { status, headers: { ...HEADERS, ...extra } });
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const ua = request.headers.get('user-agent') || '';
    if (!ua || BOT.test(ua)) return reply(403);

    let origen = url.pathname.replace(/^\/wa\/?/, '').replace(/\/+$/, '').toLowerCase();
    if (!/^[a-z0-9-]{1,200}$/.test(origen)) origen = '';
    const map = await loadMap(env, url);
    const entry = origen && map && has(map, origen) ? map[origen] : null;
    const locale = entry && entry.l && has(CONTACT, entry.l) ? entry.l : localeOfOrigin(origen);

    const number = pickNumber(locale, env);
    if (!number) return reply(302, { location: CONTACT[locale] });

    // Mensaje de la página; si el origen no existe, el de la home de ese idioma; si no hay mapa, el chat se abre sin texto.
    const homeKey = locale === 'es-ar' ? 'home' : locale;
    const found = entry || (map && has(map, homeKey) ? map[homeKey] : null);
    const msg = found && typeof found.m === 'string' ? found.m.slice(0, 1000) : '';
    return reply(302, { location: 'https://wa.me/' + number + (msg ? '?text=' + encodeURIComponent(msg) : '') });
  } catch (e) {
    // Sin detalles: ni el error ni el número se escriben en ningún lado.
    return reply(404);
  }
}

// Cualquier otro método: no hace nada.
export async function onRequest() {
  return reply(405, { allow: 'GET' });
}
