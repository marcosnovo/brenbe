// Cloudflare Pages Function: GET /panel/api/visitas?days=7|30|90
// Estadísticas propias (colector /c -> D1 binding `DB`): personas vs bots, ciudades, países, páginas de entrada, canales/UTM
// y las últimas visitas con su recorrido. Misma verificación del JWT de Cloudflare Access que /panel/api/stats.
// Sin DB o sin tabla: 200 con {configured:false} (el panel muestra "no configurado" en esos bloques). Ver docs/panel-analitica.md.

import { authorize, channelOf, jsonResponse as json } from './stats.js';

const DAYS_OK = [7, 30, 90];
const CACHE_SECONDS = 300;
const MAX_ROWS = 30000;
const RECENT = 50;
const SEARCH = /(^|\.)(bing\.com|duckduckgo\.com|ecosia\.org|yahoo\.com|search\.brave\.com|baidu\.com|yandex\.[a-z]+|startpage\.com|qwant\.com)$/;
export const CHANNELS = ['Google', 'Pinterest', 'Instagram', 'Facebook', 'WhatsApp', 'Otros buscadores', 'Directo', 'Otros'];
const UTM_CHANNEL = { google: 'Google', gbp: 'Google', pinterest: 'Pinterest', instagram: 'Instagram', ig: 'Instagram', facebook: 'Facebook', fb: 'Facebook', whatsapp: 'WhatsApp', wa: 'WhatsApp' };

// Canal de una sesión: la UTM manda sobre el referer.
export function channelFor(e) {
  const src = String(e.utm_source || '').toLowerCase();
  if (src) return { channel: UTM_CHANNEL[src] || 'Otros', detail: [src, e.utm_medium, e.utm_campaign].filter(Boolean).join(' / ') };
  const host = String(e.ref_host || '');
  let c = channelOf(host);
  if (c === 'Otros' && SEARCH.test(host)) c = 'Otros buscadores';
  return { channel: c, detail: c === 'Directo' ? '' : host };
}

const pv = (e) => e.type === 'pageview';
const DAY = 86400000;
const dayKey = (ms) => new Date(ms).toISOString().slice(0, 10);
// Ventana alineada a días calendario UTC, igual que /panel/api/stats: hoy incluido + los (days - 1) días anteriores completos.
export function windowStart(now, days) {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - (days - 1) * DAY;
}
function tally(map, key, obj) {
  const cur = map.get(key);
  if (cur) cur.visits++; else map.set(key, { ...obj, visits: 1 });
}
const rank = (map, n) => [...map.values()].sort((a, b) => b.visits - a.visits).slice(0, n);

// Arma la respuesta a partir de las filas de `events` (ya ordenadas por ts ascendente).
export function shape(rows, { days, now, previousPeople = 0, previousContacted = 0, truncated = false }) {
  const sessions = new Map();
  for (const e of rows) {
    let s = sessions.get(e.sid);
    if (!s) {
      const ch = channelFor(e);
      s = {
        sid: e.sid, start: e.ts, end: e.ts, bot: 0, reasons: new Set(),
        country: e.country || '', region: e.region || '', city: e.city || '', device: e.device || 'other',
        channel: ch.channel, detail: ch.detail, ref: e.ref_host || '', locale: e.locale || 'es-ar',
        pages: [], utm: null, wa: 0, contact: 0, dur: 0, scroll: 0,
      };
      sessions.set(e.sid, s);
    }
    if (e.ts > s.end) s.end = e.ts;
    if (e.is_bot) { s.bot = 1; if (e.bot_reason) s.reasons.add(e.bot_reason); }
    // Si el primer evento no traía origen/UTM pero uno posterior sí (p. ej. recarga), se completa.
    if (s.channel === 'Directo' && (e.utm_source || e.ref_host) && pv(e)) { const ch = channelFor(e); s.channel = ch.channel; s.detail = ch.detail; s.ref = e.ref_host || s.ref; }
    if (!s.utm && pv(e) && e.utm_source) s.utm = { source: e.utm_source, medium: e.utm_medium || '', campaign: e.utm_campaign || '' };
    if (!s.city && e.city) { s.city = e.city; s.region = e.region || s.region; }
    if (e.type === 'wa_click') s.wa++;
    else if (e.type === 'contact_submit') s.contact++;
    else if (e.type === 'leave') { s.dur = Math.max(s.dur, e.dur || 0); s.scroll = Math.max(s.scroll, e.scroll || 0); }
    else if (pv(e)) {
      const last = s.pages[s.pages.length - 1];
      if (!last || last.path !== e.path) s.pages.push({ path: e.path, title: e.title || '', t: e.ts });
    }
  }

  const people = [], bots = [];
  for (const s of sessions.values()) (s.bot ? bots : people).push(s);
  // Serie diaria de personas (sesiones no-bot por día de inicio, días calendario UTC, los días sin datos valen 0).
  const perDay = new Map();
  for (const s of people) { const k = dayKey(s.start); perDay.set(k, (perDay.get(k) || 0) + 1); }
  const first = windowStart(now, days);
  const series = [];
  for (let i = 0; i < days; i++) { const k = dayKey(first + i * DAY); series.push({ date: k, people: perDay.get(k) || 0 }); }
  const contacted = people.filter((s) => s.wa || s.contact).length;
  const peopleViews = people.reduce((n, s) => n + s.pages.length, 0);

  const cities = new Map(), countries = new Map(), entries = new Map(), channels = new Map(), refs = new Map(), utms = new Map(), devices = new Map();
  for (const s of people) {
    const cc = s.country || '??';
    tally(countries, cc, { country: cc });
    const ck = (s.city || '') + '|' + (s.region || '') + '|' + cc;
    tally(cities, ck, { city: s.city || '', region: s.region || '', country: cc });
    tally(channels, s.channel, { channel: s.channel });
    tally(devices, s.device, { device: s.device });
    if (s.pages[0]) tally(entries, s.pages[0].path, { path: s.pages[0].path, title: s.pages[0].title });
    if (s.ref) tally(refs, s.ref, { host: s.ref });
    if (s.utm) tally(utms, s.utm.source + '|' + s.utm.medium + '|' + s.utm.campaign, s.utm);
  }
  const botReasons = new Map(), botCountries = new Map();
  for (const s of bots) {
    for (const r of (s.reasons.size ? s.reasons : ['otro'])) tally(botReasons, r, { reason: r });
    const cc = s.country || '??';
    tally(botCountries, cc, { country: cc });
  }

  const recent = people.sort((a, b) => b.start - a.start).slice(0, RECENT).map((s) => ({
    start: new Date(s.start).toISOString(),
    city: s.city, region: s.region, country: s.country,
    device: s.device, channel: s.channel, detail: s.detail, locale: s.locale,
    entry: s.pages[0] ? s.pages[0].path : '',
    pages: s.pages.map((p) => ({ path: p.path, title: p.title })),
    seconds: Math.max(s.dur, Math.round((s.end - s.start) / 1000)),
    scroll: s.scroll,
    whatsapp: s.wa > 0, contact: s.contact > 0,
  }));

  return {
    configured: true,
    days, truncated,
    range: { from: new Date(windowStart(now, days)).toISOString(), to: new Date(now).toISOString() },
    totals: {
      people: { value: people.length, previous: previousPeople },
      pageviews: { value: peopleViews },
      whatsapp: { value: people.filter((s) => s.wa).length },
      contact: { value: people.filter((s) => s.contact).length },
      contacted: { value: contacted, previous: previousContacted },
      bots: { value: bots.length, pageviews: bots.reduce((n, s) => n + s.pages.length, 0) },
    },
    bots: { reasons: rank(botReasons, 6), countries: rank(botCountries, 5) },
    cities: rank(cities, 15),
    countries: rank(countries, 15),
    entries: rank(entries, 10),
    channels: CHANNELS.map((c) => ({ channel: c, visits: (channels.get(c) || { visits: 0 }).visits })),
    referrers: rank(refs, 10),
    utm: rank(utms, 10),
    devices: rank(devices, 5),
    series,
    recent,
  };
}

// ---------- Handler ----------
async function query(db, days, now) {
  const start = windowStart(now, days), pstart = start - days * DAY;
  const cols = 'ts, sid, type, path, title, locale, ref_host, ref_path, utm_source, utm_medium, utm_campaign, country, region, city, device, is_bot, bot_reason, dur, scroll';
  const notBot = 'sid NOT IN (SELECT sid FROM events WHERE is_bot = 1 AND ts >= ? AND ts < ?)';
  const [cur, prev, prevC] = await db.batch([
    db.prepare('SELECT ' + cols + ' FROM events WHERE ts >= ? ORDER BY ts DESC LIMIT ' + (MAX_ROWS + 1)).bind(start),
    db.prepare('SELECT COUNT(DISTINCT sid) AS n FROM events WHERE ts >= ? AND ts < ? AND ' + notBot).bind(pstart, start, pstart, start),
    db.prepare("SELECT COUNT(DISTINCT sid) AS n FROM events WHERE type IN ('wa_click', 'contact_submit') AND ts >= ? AND ts < ? AND " + notBot).bind(pstart, start, pstart, start),
  ]);
  let rows = (cur && cur.results) || [];
  const truncated = rows.length > MAX_ROWS;
  if (truncated) rows = rows.slice(0, MAX_ROWS);
  rows = rows.slice().reverse();
  const num = (r) => Number(r && r.results && r.results[0] && r.results[0].n) || 0;
  return { rows, truncated, previousPeople: num(prev), previousContacted: num(prevC) };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const denied = await authorize(request, env);
  if (denied) return denied;

  const url = new URL(request.url);
  const days = Number(url.searchParams.get('days') || '30');
  if (!DAYS_OK.includes(days)) return json({ error: 'dias_invalidos', message: 'days debe ser 7, 30 o 90.' }, 400);

  if (!env.DB) return json({ configured: false, reason: 'sin_db', message: 'Las estadísticas propias todavía no están configuradas (falta la base D1 "DB", ver docs/panel-analitica.md).' });

  const cache = typeof caches !== 'undefined' && caches.default ? caches.default : null;
  const cacheKey = new Request('https://brenbe.com/panel/api/_cache_visitas?days=' + days);
  if (cache) {
    try {
      const hit = await cache.match(cacheKey);
      if (hit) return json(await hit.json(), 200, { 'x-panel-cache': 'hit' });
    } catch (e) { /* sin caché */ }
  }

  const now = Date.now();
  let q;
  try { q = await query(env.DB, days, now); } catch (e) {
    return json({ configured: false, reason: 'sin_tabla', message: 'La base D1 está conectada pero falta aplicar la migración (migrations/0001_init.sql, ver docs/panel-analitica.md).' });
  }
  const data = shape(q.rows, { days, now, previousPeople: q.previousPeople, previousContacted: q.previousContacted, truncated: q.truncated });
  data.generatedAt = new Date(now).toISOString();
  if (cache) {
    try { await cache.put(cacheKey, new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=' + CACHE_SECONDS } })); } catch (e) { /* ok */ }
  }
  return json(data);
}

export async function onRequest() {
  return json({ error: 'metodo' }, 405, { allow: 'GET' });
}
