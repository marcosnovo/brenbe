// Cloudflare Pages Function: GET /panel/api/stats?days=7|30|90  (&debug=1 para ver errores de GraphQL)
// Estadísticas privadas del panel (/panel/): lee Cloudflare Web Analytics (RUM) por la API GraphQL.
// Seguridad (en capas): 1) Cloudflare Access protege /panel* en el borde; 2) acá se vuelve a verificar el JWT
// `Cf-Access-Jwt-Assertion` (RS256, aud, iss, exp). Sin configuración -> 503. Nunca se sirven datos sin autenticar.
// Variables (Pages > brenbe > Settings > Variables and Secrets): ACCESS_TEAM_DOMAIN, ACCESS_AUD, CF_ACCOUNT_ID, CF_SITE_TAG, CF_ANALYTICS_TOKEN (secreto).
// Ver docs/panel-analitica.md.

const GRAPHQL = 'https://api.cloudflare.com/client/v4/graphql';
const DAYS_OK = [7, 30, 90];
const CACHE_SECONDS = 300;
const LOCALES = { 'es-mx': '/es-mx/', 'es-es': '/es-es/', en: '/en/', 'pt-br': '/pt-br/' };

const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex, nofollow', ...extra },
  });

// ---------- Cloudflare Access: verificación del JWT ----------
const b64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), (c) => c.charCodeAt(0));
const b64uJson = (s) => JSON.parse(new TextDecoder().decode(b64u(s)));

export function teamHost(v) {
  let t = String(v || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!t) return '';
  if (!t.includes('.')) t += '.cloudflareaccess.com';
  return /^[a-z0-9-]+\.cloudflareaccess\.com$/.test(t) ? t : '';
}

let jwksCache = { host: '', at: 0, keys: null };
export function _resetJwks() { jwksCache = { host: '', at: 0, keys: null }; } // solo para pruebas

async function getKeys(host, force) {
  const now = Date.now();
  if (!force && jwksCache.keys && jwksCache.host === host && now - jwksCache.at < 3600000) return jwksCache.keys;
  const res = await fetch('https://' + host + '/cdn-cgi/access/certs');
  if (!res.ok) throw new Error('jwks ' + res.status);
  const data = await res.json();
  if (!data || !Array.isArray(data.keys)) throw new Error('jwks forma');
  jwksCache = { host, at: now, keys: data.keys };
  return data.keys;
}

// Devuelve {ok:true, claims} o {ok:false, reason}.
export async function verifyAccessJwt(token, env, nowSec = Math.floor(Date.now() / 1000)) {
  try {
    const host = teamHost(env.ACCESS_TEAM_DOMAIN);
    const parts = String(token || '').split('.');
    if (parts.length !== 3) return { ok: false, reason: 'formato' };
    const header = b64uJson(parts[0]);
    if (header.alg !== 'RS256' || !header.kid) return { ok: false, reason: 'alg' };
    let keys = await getKeys(host, false);
    let jwk = keys.find((k) => k.kid === header.kid);
    if (!jwk) { keys = await getKeys(host, true); jwk = keys.find((k) => k.kid === header.kid); } // rotación de claves
    if (!jwk) return { ok: false, reason: 'kid' };
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64u(parts[2]), new TextEncoder().encode(parts[0] + '.' + parts[1]));
    if (!valid) return { ok: false, reason: 'firma' };
    const c = b64uJson(parts[1]);
    if (c.iss !== 'https://' + host) return { ok: false, reason: 'iss' };
    const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
    if (!aud.includes(env.ACCESS_AUD)) return { ok: false, reason: 'aud' };
    if (typeof c.exp !== 'number' || c.exp <= nowSec) return { ok: false, reason: 'exp' };
    if (typeof c.nbf === 'number' && c.nbf > nowSec + 60) return { ok: false, reason: 'nbf' };
    return { ok: true, claims: c };
  } catch (e) {
    return { ok: false, reason: 'error' };
  }
}

// ---------- Canales y rutas ----------
export const CHANNELS = ['Google', 'Pinterest', 'Instagram', 'Facebook', 'WhatsApp', 'Directo', 'Otros'];

export function channelOf(host) {
  const h = String(host || '').toLowerCase().replace(/^www\./, '');
  if (!h || h === 'brenbe.com' || h.endsWith('.brenbe.com') || h.endsWith('.pages.dev')) return 'Directo';
  if (/(^|\.)google\./.test(h) || h === 'googleadservices.com') return 'Google';
  if (/(^|\.)(pinterest\.[a-z.]+|pin\.it)$/.test(h)) return 'Pinterest';
  if (/(^|\.)(instagram\.com|ig\.me)$/.test(h)) return 'Instagram';
  if (/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/.test(h)) return 'Facebook';
  if (/(^|\.)(whatsapp\.com|wa\.me)$/.test(h)) return 'WhatsApp';
  return 'Otros';
}

export function normPath(p) {
  let s = String(p || '/').split('?')[0].split('#')[0].replace(/index\.html$/, '');
  if (!s.startsWith('/')) s = '/' + s;
  return s.length > 1 && !s.endsWith('/') && !/\.[a-z0-9]+$/i.test(s) ? s + '/' : s;
}
export function localeOf(path) {
  for (const k of Object.keys(LOCALES)) if (path.startsWith(LOCALES[k])) return k;
  return 'es-ar';
}
const isWa = (p) => p.startsWith('/wa/');
const isNoise = (p) => p.startsWith('/panel') || p.startsWith('/admin') || p.startsWith('/cdn-cgi/');

// ---------- GraphQL (dataset de Web Analytics / RUM) ----------
// `bot` es un uint8 (0 = persona, 1 = bot que detecta Cloudflare). Todos los bloques principales filtran `bot: 0`
// (solo personas); `bot_gt: 0` cuenta aparte los bots detectados. Verificado por introspección del filtro
// AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject (campos bot, bot_gt, bot_neq, bot_in, ...).
const QUERY = `query Panel($acc: String!, $site: String!, $ps: Time!, $s: Time!, $e: Time!) {
  viewer { accounts(filter: { accountTag: $acc }) {
    curTotal: rumPageloadEventsAdaptiveGroups(filter: { siteTag: $site, bot: 0, datetime_geq: $s, datetime_lt: $e }, limit: 1) { count sum { visits } }
    prevTotal: rumPageloadEventsAdaptiveGroups(filter: { siteTag: $site, bot: 0, datetime_geq: $ps, datetime_lt: $s }, limit: 1) { count sum { visits } }
    series: rumPageloadEventsAdaptiveGroups(filter: { siteTag: $site, bot: 0, datetime_geq: $s, datetime_lt: $e }, limit: 400, orderBy: [date_ASC]) { count sum { visits } dimensions { date } }
    paths: rumPageloadEventsAdaptiveGroups(filter: { siteTag: $site, bot: 0, datetime_geq: $s, datetime_lt: $e }, limit: 1000, orderBy: [count_DESC]) { count sum { visits } dimensions { requestPath } }
    prevPaths: rumPageloadEventsAdaptiveGroups(filter: { siteTag: $site, bot: 0, datetime_geq: $ps, datetime_lt: $s }, limit: 1000, orderBy: [count_DESC]) { count dimensions { requestPath } }
    referrers: rumPageloadEventsAdaptiveGroups(filter: { siteTag: $site, bot: 0, datetime_geq: $s, datetime_lt: $e }, limit: 300, orderBy: [sum_visits_DESC]) { count sum { visits } dimensions { refererHost } }
    countries: rumPageloadEventsAdaptiveGroups(filter: { siteTag: $site, bot: 0, datetime_geq: $s, datetime_lt: $e }, limit: 60, orderBy: [sum_visits_DESC]) { count sum { visits } dimensions { countryName } }
    devices: rumPageloadEventsAdaptiveGroups(filter: { siteTag: $site, bot: 0, datetime_geq: $s, datetime_lt: $e }, limit: 10, orderBy: [sum_visits_DESC]) { count sum { visits } dimensions { deviceType } }
    botTotal: rumPageloadEventsAdaptiveGroups(filter: { siteTag: $site, bot_gt: 0, datetime_geq: $s, datetime_lt: $e }, limit: 1) { count sum { visits } }
    botPrevTotal: rumPageloadEventsAdaptiveGroups(filter: { siteTag: $site, bot_gt: 0, datetime_geq: $ps, datetime_lt: $s }, limit: 1) { count sum { visits } }
    botCountries: rumPageloadEventsAdaptiveGroups(filter: { siteTag: $site, bot_gt: 0, datetime_geq: $s, datetime_lt: $e }, limit: 5, orderBy: [count_DESC]) { count dimensions { countryName } }
  } }
}`;

const iso = (d) => d.toISOString().replace(/\.\d+Z$/, 'Z');
const day = (d) => d.toISOString().slice(0, 10);

async function runQuery(env, days, now) {
  // Ventana alineada a días calendario (UTC): hoy incluido + los (days - 1) días anteriores completos,
  // para que la serie diaria y los totales cubran exactamente los mismos días.
  const end = new Date(now);
  const todayUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const start = new Date(todayUtc - (days - 1) * 86400000);
  const pstart = new Date(start.getTime() - days * 86400000);
  const res = await fetch(GRAPHQL, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + env.CF_ANALYTICS_TOKEN, 'content-type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { acc: env.CF_ACCOUNT_ID, site: env.CF_SITE_TAG, ps: iso(pstart), s: iso(start), e: iso(end) } }),
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body, start, end };
}

const sv = (r) => (r && r.sum && r.sum.visits) || 0;
const dim = (r, k) => r && r.dimensions && r.dimensions[k];

export function shape(acc, days, start, end) {
  const g = (k) => (acc && acc[k]) || [];
  const t = g('curTotal')[0] || {};
  const pt = g('prevTotal')[0] || {};

  // Rutas: se normalizan y juntan (/x y /x/index.html son la misma página). /wa/ = clics a WhatsApp.
  const pages = new Map();
  const wa = new Map();
  const loc = {};
  let waTotal = 0, waPrev = 0, noise = 0, noisePrev = 0;
  for (const r of g('paths')) {
    const p = normPath(dim(r, 'requestPath'));
    const n = r.count || 0;
    if (isWa(p)) { waTotal += n; wa.set(p, (wa.get(p) || 0) + n); continue; }
    if (isNoise(p)) { noise += n; continue; }
    const cur = pages.get(p) || { path: p, views: 0, visits: 0 };
    cur.views += n; cur.visits += sv(r);
    pages.set(p, cur);
    const l = localeOf(p);
    loc[l] = (loc[l] || 0) + n;
  }
  for (const r of g('prevPaths')) {
    const p = normPath(dim(r, 'requestPath'));
    if (isWa(p)) waPrev += r.count || 0;
    else if (isNoise(p)) noisePrev += r.count || 0;
  }
  const waList = [...wa.entries()]
    .map(([path, clicks]) => ({ path, id: path.replace(/^\/wa\//, '').replace(/\/$/, ''), clicks }))
    .sort((a, b) => b.clicks - a.clicks).slice(0, 15);

  // Serie diaria completa (los días sin datos valen 0).
  const byDay = new Map(g('series').map((r) => [dim(r, 'date'), r]));
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = day(new Date(end.getTime() - i * 86400000));
    const r = byDay.get(d);
    series.push({ date: d, visits: sv(r), views: (r && r.count) || 0 });
  }

  const chan = Object.fromEntries(CHANNELS.map((c) => [c, 0]));
  const topRefs = new Map();
  for (const r of g('referrers')) {
    const raw = String(dim(r, 'refererHost') || '').replace(/^www\./, '');
    const c = channelOf(raw);
    chan[c] += sv(r);
    if (raw && c !== 'Directo') topRefs.set(raw, (topRefs.get(raw) || 0) + sv(r));
  }
  const countries = new Map();
  for (const r of g('countries')) {
    const c = dim(r, 'countryName') || '??';
    countries.set(c, (countries.get(c) || 0) + sv(r));
  }
  const devices = new Map();
  for (const r of g('devices')) {
    const d = String(dim(r, 'deviceType') || 'otro').toLowerCase();
    devices.set(d, (devices.get(d) || 0) + sv(r));
  }

  const bt = g('botTotal')[0] || {};
  const bpt = g('botPrevTotal')[0] || {};
  const botCountries = g('botCountries').map((r) => ({ country: dim(r, 'countryName') || '??', views: r.count || 0 })).filter((x) => x.views > 0);

  const rank = (m, key) => [...m.entries()].map(([k, v]) => ({ [key]: k, visits: v })).filter((x) => x.visits > 0).sort((a, b) => b.visits - a.visits);
  return {
    days,
    range: { from: day(start), to: day(end) },
    totals: {
      visits: { value: sv(t), previous: sv(pt) },
      pageviews: { value: Math.max(0, (t.count || 0) - waTotal - noise), previous: Math.max(0, (pt.count || 0) - waPrev - noisePrev) },
      whatsapp: { value: waTotal, previous: waPrev },
      bots: { value: bt.count || 0, previous: bpt.count || 0, visits: sv(bt) },
    },
    botCountries,
    series,
    pages: [...pages.values()].sort((a, b) => b.views - a.views).slice(0, 15),
    channels: CHANNELS.map((c) => ({ channel: c, visits: chan[c] })),
    referrers: rank(topRefs, 'host').slice(0, 10),
    countries: rank(countries, 'country').slice(0, 15),
    devices: rank(devices, 'device'),
    locales: ['es-ar', 'es-mx', 'es-es', 'en', 'pt-br'].map((l) => ({ locale: l, views: loc[l] || 0 })),
    whatsapp: waList,
  };
}

// ---------- Autorización común (la usan stats, visitas y busquedas) ----------
export const jsonResponse = json;
// Devuelve null si el JWT de Access es válido; si no, la Response de error (503/401/403) que hay que devolver.
export async function authorize(request, env) {
  if (!env || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || !teamHost(env.ACCESS_TEAM_DOMAIN)) {
    return json({ error: 'panel_no_configurado', message: 'Panel no configurado: faltan ACCESS_TEAM_DOMAIN y ACCESS_AUD (ver docs/panel-analitica.md).' }, 503);
  }
  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token) return json({ error: 'no_autenticado', message: 'Hace falta iniciar sesión.' }, 401);
  const auth = await verifyAccessJwt(token, env);
  if (!auth.ok) return json({ error: 'acceso_denegado', message: 'Tu sesión no es válida o venció. Volvé a entrar al panel.' }, 403);
  return null;
}

// ---------- Handler ----------
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const denied = await authorize(request, env);
  if (denied) return denied;

  const days = Number(url.searchParams.get('days') || '30');
  if (!DAYS_OK.includes(days)) return json({ error: 'dias_invalidos', message: 'days debe ser 7, 30 o 90.' }, 400);

  if (!env.CF_ANALYTICS_TOKEN || !env.CF_ACCOUNT_ID || !env.CF_SITE_TAG) {
    return json({ error: 'panel_no_configurado', message: 'Panel no configurado: faltan CF_ANALYTICS_TOKEN, CF_ACCOUNT_ID o CF_SITE_TAG (ver docs/panel-analitica.md).' }, 503);
  }
  const debug = url.searchParams.has('debug');

  // Caché de 5 min, DESPUÉS de autenticar. Clave solo por días; el modo debug nunca se cachea.
  const cache = typeof caches !== 'undefined' && caches.default ? caches.default : null;
  const cacheKey = new Request('https://brenbe.com/panel/api/_cache?days=' + days);
  if (cache && !debug) {
    try {
      const hit = await cache.match(cacheKey);
      if (hit) return json(await hit.json(), 200, { 'x-panel-cache': 'hit' });
    } catch (e) { /* sin caché */ }
  }

  let q;
  try { q = await runQuery(env, days, Date.now()); } catch (e) {
    return json({ error: 'sin_conexion', message: 'No se pudo consultar Cloudflare. Probá de nuevo en un rato.' }, 502);
  }
  const errors = q.body && q.body.errors;
  if (q.status !== 200 || !q.body || (errors && errors.length) || !q.body.data) {
    const out = { error: 'analitica_error', message: 'Cloudflare no devolvió los datos (revisá el token y el Site Tag en docs/panel-analitica.md).' };
    if (debug) out.graphql = { status: q.status, errors: errors || null };
    return json(out, 502);
  }
  const acc = q.body.data.viewer && q.body.data.viewer.accounts && q.body.data.viewer.accounts[0];
  if (!acc) {
    return json({ error: 'cuenta_invalida', message: 'Cloudflare no encontró la cuenta (revisá CF_ACCOUNT_ID y los permisos del token).', ...(debug ? { graphql: { errors: errors || null } } : {}) }, 502);
  }

  const data = shape(acc, days, q.start, q.end);
  data.generatedAt = new Date().toISOString();
  if (cache && !debug) {
    try { await cache.put(cacheKey, new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=' + CACHE_SECONDS } })); } catch (e) { /* ok */ }
  }
  return json(data);
}

// Cualquier otro método: 405 (GET lo atiende onRequestGet).
export async function onRequest() {
  return json({ error: 'metodo' }, 405, { allow: 'GET' });
}
