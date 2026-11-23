// Lógica del formulario de contacto (pura: sin imports de Cloudflare, se prueba con node).
// REGLA: la casilla de destino (env.CONTACT_TO) nunca se escribe en respuestas, logs ni mensajes de error.
// Solo se usa como destinatario del sobre del mail.

const SITE = 'https://brenbe.com';
const DEFAULT_FROM = 'formulario@brenbe.com';

// Por idioma: página de contacto (para volver si algo falla sin JS) y página de gracias.
export const LOCALES = {
  'es-ar': { contact: '/contacto/', thanks: '/gracias/', label: 'es-AR' },
  'es-mx': { contact: '/es-mx/contacto/', thanks: '/es-mx/gracias/', label: 'es-MX' },
  'es-es': { contact: '/es-es/contacto/', thanks: '/es-es/gracias/', label: 'es-ES' },
  en: { contact: '/en/contact/', thanks: '/en/thanks/', label: 'en' },
  'pt-br': { contact: '/pt-br/contato/', thanks: '/pt-br/obrigado/', label: 'pt-BR' },
};

// Claves del <select> -> texto que ve Brenda en el mail (siempre en castellano).
export const NEEDS = {
  asesoria: 'Asesoría de interiorismo online',
  color: 'Asesoría de color',
  empapelado: 'Empapelado y revestimientos',
  mobiliario: 'Mobiliario y distribución',
  iluminacion: 'Iluminación, textiles y styling',
  deptos: 'Deptos chicos / monoambientes',
  otro: 'Otra consulta / no sé todavía',
};

export const LIMITS = {
  body: 24 * 1024, // bytes del POST
  nombre: 100,
  email: 254,
  telefono: 40,
  pais: 80,
  mensajeMin: 10,
  mensaje: 4000,
  page: 200,
  utm: 100,
  minMs: 3000, // tiempo mínimo entre cargar la página y enviar
  rateMax: 5, // envíos por IP...
  rateWindowMs: 15 * 60 * 1000, // ...cada 15 minutos
};

const ORIGINS = new Set([SITE, 'https://www.brenbe.com']);
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const EMAIL_RE = /^[^\s@<>(),;:"\\[\]]+@[^\s@<>(),;:"\\[\]]+\.[^\s@<>(),;:"\\[\]]{2,}$/;

// Límite por IP, en memoria de cada instancia (mejor esfuerzo: no es global entre instancias).
export function createRateLimiter({ max = LIMITS.rateMax, windowMs = LIMITS.rateWindowMs } = {}) {
  const hits = new Map();
  return function allow(key, now) {
    if (!key) return true;
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) { hits.set(key, recent); return false; }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) { for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k); }
    return true;
  };
}
const defaultLimiter = createRateLimiter();

// Quita saltos de línea y caracteres de control (evita inyección de cabeceras) y recorta.
export function oneLine(v, max) {
  return String(v ?? '').replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}
// Texto largo: conserva saltos de línea, elimina el resto de caracteres de control.
function multiLine(v, max) {
  return String(v ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, max);
}

const b64 = (bytes) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const utf8 = (s) => new TextEncoder().encode(s);
const isAscii = (s) => /^[\x20-\x7e]*$/.test(s);

// RFC 2047 (palabras codificadas, en trozos para no cortar caracteres multibyte y respetar los 75 caracteres).
export function encodeWord(s) {
  if (isAscii(s)) return s;
  const chunks = [];
  let cur = '';
  for (const ch of s) {
    if (utf8(cur + ch).length > 36) { chunks.push(cur); cur = ''; }
    cur += ch;
  }
  if (cur) chunks.push(cur);
  return chunks.map((c) => `=?UTF-8?B?${b64(utf8(c))}?=`).join('\r\n ');
}
function displayName(name) {
  const clean = oneLine(name, 100).replace(/["\\<>]/g, '');
  return isAscii(clean) ? `"${clean}"` : encodeWord(clean);
}

export function buildMime({ from, fromName, to, replyTo, replyName, subject, text, messageId, date }) {
  const body = b64(utf8(text)).replace(/(.{76})/g, '$1\r\n');
  const lines = [
    `Date: ${date.toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: <${messageId}@brenbe.com>`,
    `From: ${displayName(fromName)} <${from}>`,
    `To: <${to}>`,
    `Reply-To: ${displayName(replyName)} <${replyTo}>`,
    `Subject: ${encodeWord(oneLine(subject, 150))}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    'X-Auto-Response-Suppress: All',
    '',
    body,
  ];
  return lines.join('\r\n');
}

function composeText(d, now) {
  const utm = UTM_KEYS.filter((k) => d[k]).map((k) => `${k.slice(4)}=${d[k]}`).join(', ');
  const row = (k, v) => `${k}: ${v || '-'}`;
  return [
    'Nueva consulta desde brenbe.com',
    '',
    row('Nombre', d.nombre),
    row('Email', d.email),
    row('WhatsApp / teléfono', d.telefono),
    row('País / ciudad', d.pais),
    row('Qué necesita', NEEDS[d.necesidad] || d.necesidad),
    '',
    'Mensaje:',
    d.mensaje,
    '',
    '----------------------------------------',
    row('Idioma del sitio', LOCALES[d.locale].label),
    row('Página', d.page ? SITE + d.page : ''),
    row('Origen (UTM)', utm),
    row('Recibida', now.toISOString()),
    '',
    'Para contestarle, respondé este mail: va directo a su casilla.',
    '',
  ].join('\n');
}

export function validate(form) {
  const get = (k) => form.get(k);
  const d = {
    nombre: oneLine(get('nombre'), LIMITS.nombre + 1),
    email: oneLine(get('email'), LIMITS.email + 1),
    telefono: oneLine(get('telefono'), LIMITS.telefono),
    pais: oneLine(get('pais'), LIMITS.pais),
    necesidad: oneLine(get('necesidad'), 30),
    mensaje: multiLine(get('mensaje'), LIMITS.mensaje + 1),
    locale: oneLine(get('locale'), 10).toLowerCase(),
    page: oneLine(get('page'), LIMITS.page),
  };
  for (const k of UTM_KEYS) d[k] = oneLine(get(k), LIMITS.utm);
  if (!LOCALES[d.locale]) d.locale = 'es-ar';
  if (!/^\/[A-Za-z0-9\-._~\/%]*$/.test(d.page)) d.page = '';
  if (!NEEDS[d.necesidad]) d.necesidad = '';

  const errors = {};
  if (!d.nombre) errors.nombre = 'required';
  else if (d.nombre.length > LIMITS.nombre) errors.nombre = 'long';
  if (!d.email) errors.email = 'required';
  else if (d.email.length > LIMITS.email || !EMAIL_RE.test(d.email)) errors.email = 'invalid';
  if (!d.mensaje) errors.mensaje = 'required';
  else if (d.mensaje.length < LIMITS.mensajeMin) errors.mensaje = 'short';
  else if (d.mensaje.length > LIMITS.mensaje) errors.mensaje = 'long';
  if (!['on', '1', 'true', 'yes'].includes(oneLine(get('consent'), 10).toLowerCase())) errors.consent = 'required';
  return { d, errors };
}

async function verifyTurnstile(env, token, ip, fetchFn) {
  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
  if (ip) body.set('remoteip', ip);
  const res = await fetchFn('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const data = await res.json();
  return data && data.success === true;
}

const HEADERS = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'X-Content-Type-Options': 'nosniff' };

export async function handleContact(request, env, deps = {}) {
  const now = deps.now ? deps.now() : new Date();
  const fetchFn = deps.fetch || fetch;
  const allow = deps.rateLimiter || defaultLimiter;
  const log = deps.log || console;

  const wantsJson = /application\/json/i.test(request.headers.get('accept') || '');
  let loc = 'es-ar';

  const json = (status, payload) => new Response(JSON.stringify(payload), { status, headers: { ...HEADERS, 'Content-Type': 'application/json; charset=utf-8' } });
  const redirect = (path) => new Response(null, { status: 303, headers: { ...HEADERS, Location: path } });
  const fail = (status, error, fields) =>
    wantsJson ? json(status, { ok: false, error, ...(fields ? { fields } : {}) }) : redirect(`${LOCALES[loc].contact}#contact-error`);
  const succeed = () => (wantsJson ? json(200, { ok: true }) : redirect(LOCALES[loc].thanks));

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { ...HEADERS, Allow: 'POST' } });
  }

  // Mismo origen: los envíos legítimos vienen de brenbe.com. Sin Origin (algunos navegadores) se mira Referer.
  let from = request.headers.get('origin');
  if (!from) {
    try { from = new URL(request.headers.get('referer') || '').origin; } catch { from = ''; }
  }
  if (!ORIGINS.has(from)) return fail(403, 'forbidden');

  if (Number(request.headers.get('content-length') || 0) > LIMITS.body) return fail(413, 'too_large');

  let form;
  try {
    const raw = await request.text();
    if (raw.length > LIMITS.body) return fail(413, 'too_large');
    const type = request.headers.get('content-type') || '';
    form = type.includes('application/x-www-form-urlencoded')
      ? new URLSearchParams(raw)
      : await new Response(raw, { headers: { 'content-type': type } }).formData();
  } catch {
    return fail(400, 'bad_request');
  }
  const l = oneLine(form.get('locale'), 10).toLowerCase();
  if (LOCALES[l]) loc = l;

  const ip = request.headers.get('cf-connecting-ip') || '';
  if (!allow(ip, now.getTime())) return fail(429, 'rate_limited');

  // Honeypot: un bot lo completa; se responde "ok" sin enviar nada para no darle pistas.
  if (oneLine(form.get('website'), 200) !== '') return succeed();

  // Tiempo mínimo (solo si el navegador mandó la marca de tiempo; sin JS no hay marca).
  const ts = Number(oneLine(form.get('ts'), 20));
  if (Number.isFinite(ts) && ts > 0 && now.getTime() - ts < LIMITS.minMs) return fail(400, 'too_fast');

  const { d, errors } = validate(form);
  if (Object.keys(errors).length) return fail(400, 'invalid', errors);

  if (!env.CONTACT_TO) {
    log.error('contact: destino no configurado');
    return fail(503, 'not_configured');
  }

  if (env.TURNSTILE_SECRET) {
    const token = oneLine(form.get('cf-turnstile-response'), 2100);
    if (!token) return fail(400, 'captcha');
    let ok = false;
    try { ok = await verifyTurnstile(env, token, ip, fetchFn); } catch {
      log.error('contact: turnstile no disponible');
      return fail(503, 'captcha_unavailable');
    }
    if (!ok) return fail(400, 'captcha');
  }

  const sender = env.CONTACT_FROM || DEFAULT_FROM;
  const raw = buildMime({
    from: sender,
    fromName: 'BRENBE web',
    to: env.CONTACT_TO,
    replyTo: d.email,
    replyName: d.nombre,
    subject: `Consulta web: ${d.nombre} (${LOCALES[d.locale].label})`,
    text: composeText(d, now),
    messageId: crypto.randomUUID(),
    date: now,
  });
  try {
    if (!deps.sendEmail) throw new Error('sin transporte');
    await deps.sendEmail(env, { from: sender, to: env.CONTACT_TO, raw });
  } catch {
    // Nunca se registra el mensaje del error: Email Routing puede incluir la dirección de destino.
    log.error('contact: fallo el envio');
    return fail(502, 'send_failed');
  }
  return succeed();
}
