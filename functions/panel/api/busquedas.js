// Cloudflare Pages Function: GET /panel/api/busquedas?days=7|30|90
// Qué buscó la gente en Google para llegar a BRENBE: Google Search Console API (searchAnalytics.query) con una cuenta de servicio.
// Variables: GSC_SA_JSON (secreto: el JSON de la clave de la cuenta de servicio) y GSC_SITE (p. ej. sc-domain:brenbe.com).
// Sin ellas: 200 con {configured:false}. Misma verificación del JWT de Cloudflare Access que /panel/api/stats.
// Search Console publica los datos con 2 o 3 días de demora: el rango termina 3 días antes de hoy. Ver docs/panel-analitica.md.

import { authorize, jsonResponse as json } from './stats.js';

const DAYS_OK = [7, 30, 90];
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API = 'https://www.googleapis.com/webmasters/v3/sites/';
const LAG_DAYS = 3;
const ROW_LIMIT = 1000;
const CACHE_SECONDS = 3600;
const A3 = { arg: 'AR', mex: 'MX', esp: 'ES', usa: 'US', chl: 'CL', col: 'CO', per: 'PE', ury: 'UY', bra: 'BR', prt: 'PT', ecu: 'EC', bol: 'BO', pry: 'PY', ven: 'VE', gbr: 'GB', fra: 'FR', deu: 'DE', ita: 'IT', can: 'CA', cri: 'CR', pan: 'PA', dom: 'DO', gtm: 'GT' };

const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64uStr = (s) => b64u(new TextEncoder().encode(s));

export function parseServiceAccount(raw) {
  try {
    const o = JSON.parse(String(raw || ''));
    if (o && typeof o.client_email === 'string' && typeof o.private_key === 'string' && o.private_key.includes('PRIVATE KEY')) return o;
  } catch (e) { /* json inválido */ }
  return null;
}

// JWT RS256 firmado con WebCrypto (la clave privada de la cuenta de servicio es PKCS#8 en PEM).
export async function signJwt(sa, now = Math.floor(Date.now() / 1000)) {
  const pem = sa.private_key.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const head = b64uStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = b64uStr(JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(head + '.' + body));
  return head + '.' + body + '.' + b64u(sig);
}

let tokenCache = { email: '', token: '', exp: 0 };
export function _resetCache() { tokenCache = { email: '', token: '', exp: 0 }; } // solo para pruebas

async function accessToken(sa, now = Date.now()) {
  if (tokenCache.token && tokenCache.email === sa.client_email && now < tokenCache.exp - 60000) return tokenCache.token;
  const assertion = await signJwt(sa, Math.floor(now / 1000));
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + encodeURIComponent(assertion),
  });
  const j = await res.json().catch(() => null);
  if (!res.ok || !j || !j.access_token) throw Object.assign(new Error('token'), { code: 'token', status: res.status });
  tokenCache = { email: sa.client_email, token: j.access_token, exp: now + (Number(j.expires_in) || 3600) * 1000 };
  return j.access_token;
}

const ymd = (ms) => new Date(ms).toISOString().slice(0, 10);

export function range(days, now = Date.now()) {
  const end = now - LAG_DAYS * 86400000;
  return { startDate: ymd(end - (days - 1) * 86400000), endDate: ymd(end) };
}

// Junta filas (query, page, country) en una lista por consulta. La posición se pondera por impresiones.
export function shape(rows, r, days) {
  const qs = new Map(), pages = new Map();
  let clicks = 0, impressions = 0;
  for (const row of rows || []) {
    const [query, page, country] = row.keys || [];
    const c = row.clicks || 0, i = row.impressions || 0, pos = row.position || 0;
    clicks += c; impressions += i;
    let q = qs.get(query);
    if (!q) { q = { query, clicks: 0, impressions: 0, pw: 0, pages: new Map(), countries: new Map() }; qs.set(query, q); }
    q.clicks += c; q.impressions += i; q.pw += pos * i;
    q.pages.set(page, (q.pages.get(page) || 0) + c * 1000 + i);
    q.countries.set(country, (q.countries.get(country) || 0) + c * 1000 + i);
    let pg = pages.get(page);
    if (!pg) { pg = { page, clicks: 0, impressions: 0, pw: 0 }; pages.set(page, pg); }
    pg.clicks += c; pg.impressions += i; pg.pw += pos * i;
  }
  const best = (m) => { let k = '', v = -1; for (const [kk, vv] of m) if (vv > v) { k = kk; v = vv; } return k; };
  const queries = [...qs.values()].map((q) => {
    const cc = best(q.countries);
    return {
      query: q.query, clicks: q.clicks, impressions: q.impressions,
      ctr: q.impressions ? q.clicks / q.impressions : 0,
      position: q.impressions ? Math.round((q.pw / q.impressions) * 10) / 10 : 0,
      page: best(q.pages), country: A3[cc] || String(cc || '').toUpperCase(),
    };
  }).sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 25);
  const topPages = [...pages.values()].map((p) => ({
    page: p.page, clicks: p.clicks, impressions: p.impressions, position: p.impressions ? Math.round((p.pw / p.impressions) * 10) / 10 : 0,
  })).sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 10);
  return { configured: true, days, range: r, lagDays: LAG_DAYS, totals: { clicks, impressions }, queries, pages: topPages };
}

export async function fetchSearch(sa, site, days, now = Date.now()) {
  const token = await accessToken(sa, now);
  const r = range(days, now);
  const res = await fetch(API + encodeURIComponent(site) + '/searchAnalytics/query', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: JSON.stringify({ ...r, dimensions: ['query', 'page', 'country'], type: 'web', rowLimit: ROW_LIMIT }),
  });
  if (res.status === 401) tokenCache = { email: '', token: '', exp: 0 };
  if (!res.ok) throw Object.assign(new Error('gsc'), { code: res.status === 403 || res.status === 404 ? 'permiso' : 'gsc', status: res.status });
  const j = await res.json().catch(() => ({}));
  return shape(j.rows, r, days);
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const denied = await authorize(request, env);
  if (denied) return denied;

  const days = Number(new URL(request.url).searchParams.get('days') || '30');
  if (!DAYS_OK.includes(days)) return json({ error: 'dias_invalidos', message: 'days debe ser 7, 30 o 90.' }, 400);

  if (!env.GSC_SA_JSON || !env.GSC_SITE) {
    return json({ configured: false, reason: 'sin_variables', message: 'Las búsquedas de Google todavía no están configuradas (faltan GSC_SA_JSON y GSC_SITE, ver docs/panel-analitica.md).' });
  }
  const sa = parseServiceAccount(env.GSC_SA_JSON);
  if (!sa) return json({ configured: false, reason: 'sa_invalida', message: 'GSC_SA_JSON no es el JSON de una cuenta de servicio de Google (ver docs/panel-analitica.md).' });

  const cache = typeof caches !== 'undefined' && caches.default ? caches.default : null;
  const cacheKey = new Request('https://brenbe.com/panel/api/_cache_busquedas?days=' + days + '&site=' + encodeURIComponent(env.GSC_SITE));
  if (cache) {
    try {
      const hit = await cache.match(cacheKey);
      if (hit) return json(await hit.json(), 200, { 'x-panel-cache': 'hit' });
    } catch (e) { /* sin caché */ }
  }

  let data;
  try { data = await fetchSearch(sa, env.GSC_SITE, days); } catch (e) {
    if (e && e.code === 'token') return json({ error: 'google_token', message: 'Google no aceptó la cuenta de servicio (revisá GSC_SA_JSON y que la API de Search Console esté activada).' }, 502);
    if (e && e.code === 'permiso') return json({ error: 'google_permiso', message: 'La cuenta de servicio no tiene acceso a esa propiedad de Search Console (agregala como usuario con permiso restringido) o GSC_SITE está mal escrito.' }, 502);
    return json({ error: 'google_error', message: 'No se pudo consultar Search Console. Probá de nuevo en un rato.' }, 502);
  }
  data.generatedAt = new Date().toISOString();
  if (cache) {
    try { await cache.put(cacheKey, new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=' + CACHE_SECONDS } })); } catch (e) { /* ok */ }
  }
  return json(data);
}

export async function onRequest() {
  return json({ error: 'metodo' }, 405, { allow: 'GET' });
}
