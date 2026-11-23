// Cloudflare Pages Function: POST /c  (colector de estadísticas propias, anónimo)
// Recibe un JSON chico (navigator.sendBeacon) desde el script de _layouts/base.html y lo guarda en D1 (binding `DB`).
// Privacidad por diseño: sin cookies, sin IP guardada, sin huella del navegador. El `sid` es un número al azar por pestaña
// (sessionStorage) que no identifica a nadie. La ciudad/país salen de request.cf (aproximados). Se respeta DNT y GPC.
// Si falta el binding DB o la tabla, responde 204 sin hacer nada: el sitio funciona igual. Ver docs/panel-analitica.md.

const MAX_BODY = 2048;
const RETENTION_DAYS = 400;
const RATE_MAX = 60; // eventos por sesión por ventana
const RATE_WINDOW = 60000;
const TYPES = { pv: 'pageview', wa: 'wa_click', ct: 'contact_submit', lv: 'leave' };
const LOCALES = { '/es-mx/': 'es-mx', '/es-es/': 'es-es', '/en/': 'en', '/pt-br/': 'pt-br' };
const SEARCH_HOSTS = /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|ecosia\.org|yahoo\.com|search\.brave\.com|baidu\.com|yandex\.[a-z]+|startpage\.com|qwant\.com)$/;
const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|phantomjs|puppeteer|playwright|selenium|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|curl\/|wget|python-requests|python-urllib|aiohttp|httpclient|okhttp|java\/|go-http|libwww|axios|node-fetch|scrapy|httpx|postman|embedly|whatsapp\/|telegrambot|discord|skypeuri|bytespider|petalbot|semrush|ahrefs|mj12|dotbot|\bgpt|claude|perplexity|ccbot|amazonbot|applebot/i;
// Solo proveedores de hosting/nube (nunca redes de personas: iCloud Private Relay y WARP quedan afuera a propósito).
const DATACENTER = /amazon|aws|google cloud|microsoft|azure|digitalocean|ovh|hetzner|linode|oracle|vultr|alibaba|tencent|leaseweb|contabo|scaleway|datacamp|m247/i;

const empty = (status = 204) => new Response(null, { status, headers: { 'cache-control': 'no-store' } });

// ---------- Utilidades puras (se prueban sin Cloudflare) ----------
export function deviceOf(ua) {
  const u = String(ua || '');
  if (/ipad|tablet|kindle|silk|playbook/i.test(u) || (/android/i.test(u) && !/mobile/i.test(u))) return 'tablet';
  if (/mobi|iphone|ipod|android|windows phone/i.test(u)) return 'mobile';
  return u ? 'desktop' : 'other';
}

export function botReason(ua, cf, signal) {
  if (!ua || BOT_UA.test(ua)) return 'ua';
  if (cf && cf.verifiedBotCategory) return 'verified';
  const score = cf && cf.botManagement && cf.botManagement.score;
  if (typeof score === 'number' && score > 0 && score < 30) return 'score';
  if (signal) return 'webdriver';
  if (cf && cf.asOrganization && DATACENTER.test(String(cf.asOrganization))) return 'datacenter';
  return '';
}

const clip = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n);
const tag = (v) => clip(v, 60).toLowerCase().replace(/[^a-z0-9._ \-+]/g, '');

export function cleanPath(p) {
  let s = String(p || '').split('#')[0].split('?')[0];
  if (!s.startsWith('/') || s.startsWith('//') || s.length > 200 || /[\u0000-\u001f\s]/.test(s)) return '';
  return s;
}

export function localeOf(path) {
  for (const k of Object.keys(LOCALES)) if (path.startsWith(k)) return LOCALES[k];
  return 'es-ar';
}

export function isIgnoredPath(p) {
  return p.startsWith('/panel') || p.startsWith('/admin') || p.startsWith('/wa/') || p === '/c' || p.startsWith('/cdn-cgi/');
}

// Valida y normaliza el cuerpo. Devuelve null si no sirve.
export function parsePayload(raw, selfHost) {
  let b;
  try { b = JSON.parse(raw); } catch (e) { return null; }
  if (!b || typeof b !== 'object' || Array.isArray(b)) return null;
  const type = TYPES[b.e];
  if (!type) return null;
  const sid = String(b.s || '');
  if (!/^[a-z0-9]{8,32}$/.test(sid)) return null;
  const path = cleanPath(b.p);
  if (!path || isIgnoredPath(path)) return null;

  let refHost = '', refPath = '';
  if (b.r) {
    try {
      const u = new URL(String(b.r).slice(0, 500));
      const h = u.hostname.toLowerCase().replace(/^www\./, '');
      const self = String(selfHost || '').toLowerCase().replace(/^www\./, '');
      if (/^https?:$/.test(u.protocol) && h && h !== self) {
        refHost = h.slice(0, 100);
        if (SEARCH_HOSTS.test(h)) refPath = u.pathname.slice(0, 100); // sin query: nunca se guarda lo que buscó la persona
      }
    } catch (e) { /* referrer inválido */ }
  }
  const num = (v, max) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : null; };
  return {
    type, sid, path,
    title: clip(b.n, 120),
    locale: localeOf(path),
    refHost, refPath,
    us: tag(b.us), um: tag(b.um), uc: tag(b.uc),
    signal: b.b ? 1 : 0,
    dur: type === 'leave' ? num(b.d, 86400) : null,
    scroll: type === 'leave' ? num(b.g, 100) : null,
  };
}

// ---------- Límite por sesión (en memoria de cada instancia; no guarda nada) ----------
const rate = new Map();
export function _resetRate() { rate.clear(); }
export function allowed(sid, now = Date.now()) {
  if (rate.size > 5000) rate.clear();
  const r = rate.get(sid);
  if (!r || now - r.at > RATE_WINDOW) { rate.set(sid, { at: now, n: 1 }); return true; }
  r.n++;
  return r.n <= RATE_MAX;
}

// ---------- Retención: borra lo de más de 400 días, de vez en cuando ----------
export async function maybePurge(db, now = Date.now(), rand = Math.random()) {
  if (rand >= 0.01) return false;
  await db.prepare('DELETE FROM events WHERE ts < ?').bind(now - RETENTION_DAYS * 86400000).run();
  return true;
}

// ---------- Handler ----------
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env || !env.DB) return empty();
    const url = new URL(request.url);
    // Solo el propio sitio: Origin igual al host, o Sec-Fetch-Site same-origin si el navegador no manda Origin.
    const origin = request.headers.get('origin');
    if (origin ? origin !== url.origin : request.headers.get('sec-fetch-site') !== 'same-origin') return empty(403);
    // Privacidad: Do Not Track / Global Privacy Control.
    if (request.headers.get('dnt') === '1' || request.headers.get('sec-gpc') === '1') return empty();

    const len = Number(request.headers.get('content-length') || 0);
    if (len > MAX_BODY) return empty(413);
    const raw = await request.text();
    if (raw.length > MAX_BODY) return empty(413);

    const e = parsePayload(raw, url.hostname);
    if (!e) return empty(400);
    if (!allowed(e.sid)) return empty(429);

    const cf = request.cf || {};
    const ua = request.headers.get('user-agent') || '';
    const reason = botReason(ua, cf, e.signal);
    await env.DB.prepare(
      'INSERT INTO events (ts, sid, type, path, title, locale, ref_host, ref_path, utm_source, utm_medium, utm_campaign, country, region, city, tz, device, is_bot, bot_reason, dur, scroll) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    ).bind(
      Date.now(), e.sid, e.type, e.path, e.title || null, e.locale, e.refHost || null, e.refPath || null,
      e.us || null, e.um || null, e.uc || null,
      clip(cf.country, 2) || null, clip(cf.region, 80) || null, clip(cf.city, 80) || null, clip(cf.timezone, 60) || null,
      deviceOf(ua), reason ? 1 : 0, reason || null, e.dur, e.scroll
    ).run();

    const purge = maybePurge(env.DB);
    if (context.waitUntil) context.waitUntil(purge.catch(() => {})); else await purge.catch(() => {});
    return empty();
  } catch (err) {
    return empty(); // sin tabla / D1 caído: nunca rompe el sitio
  }
}

// Cualquier otro método: 405.
export async function onRequest() {
  return new Response(null, { status: 405, headers: { allow: 'POST', 'cache-control': 'no-store' } });
}
