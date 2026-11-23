// Prueba local del Worker del formulario (workers/contacto/src/handler.js): node tests/contacto.test.mjs
// SEND_EMAIL y Turnstile van simulados. Se verifica además que la casilla de destino nunca aparezca en respuestas ni logs.
import assert from 'node:assert/strict';
import { handleContact, createRateLimiter, LIMITS } from '../workers/contacto/src/handler.js';

const SECRET_TO = 'privada-secreta-zzz@example.invalid'; // valor de prueba de CONTACT_TO
const NOW = new Date('2026-11-23T15:00:00Z');
const FRESH = NOW.getTime() - 20000; // la página se cargó hace 20 s

function setup(env = {}, over = {}) {
  const sent = [];
  const logs = [];
  const verifyCalls = [];
  const deps = {
    now: () => NOW,
    rateLimiter: createRateLimiter(),
    log: { error: (...a) => logs.push(a.join(' ')) },
    sendEmail: async (_e, msg) => { sent.push(msg); },
    fetch: async (url, init) => {
      verifyCalls.push({ url, body: String(init.body) });
      return new Response(JSON.stringify({ success: !String(init.body).includes('response=bad') }));
    },
    ...over,
  };
  return { sent, logs, verifyCalls, deps, env: { CONTACT_TO: SECRET_TO, ...env } };
}

function req(fields = {}, { json = true, origin = 'https://brenbe.com', ip = '1.2.3.4', method = 'POST' } = {}) {
  const base = {
    nombre: 'Lucía Pérez', email: 'lucia@example.com', telefono: '+54 9 11 5555 5555', pais: 'Argentina, CABA',
    necesidad: 'color', mensaje: 'Quiero renovar mi living y necesito ayuda con los colores.', consent: 'on',
    locale: 'es-ar', page: '/contacto/', ts: String(FRESH), website: '', utm_source: 'instagram', utm_medium: 'bio',
  };
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...base, ...fields })) if (v !== undefined) form.set(k, v);
  const headers = { 'content-type': 'application/x-www-form-urlencoded', 'cf-connecting-ip': ip };
  if (origin) headers.origin = origin;
  if (json) headers.accept = 'application/json';
  return new Request('https://brenbe.com/api/contacto', { method, headers, body: method === 'POST' ? form.toString() : undefined });
}

async function run(fields, opts, envOver, depsOver) {
  const s = setup(envOver, depsOver);
  const res = await handleContact(req(fields, opts), s.env, s.deps);
  const text = res.status === 303 || res.status === 405 ? '' : await res.text();
  const everything = text + [...res.headers].join('|') + s.logs.join('|');
  assert.ok(!everything.includes(SECRET_TO), 'CONTACT_TO no debe aparecer en respuestas ni logs');
  return { res, text, body: text ? JSON.parse(text) : null, ...s };
}

let n = 0;
async function t(name, fn) { await fn(); n++; console.log('ok -', name); }

await t('envío válido: manda 1 mail con Reply-To del visitante y destino correcto', async () => {
  const r = await run();
  assert.equal(r.res.status, 200);
  assert.deepEqual(r.body, { ok: true });
  assert.equal(r.sent.length, 1);
  assert.equal(r.sent[0].to, SECRET_TO);
  assert.equal(r.sent[0].from, 'formulario@brenbe.com');
  const raw = r.sent[0].raw;
  const [head, ...rest] = raw.split('\r\n\r\n');
  assert.match(head, /^Reply-To: .*<lucia@example\.com>$/m);
  assert.match(head, /^To: <privada-secreta-zzz@example\.invalid>$/m);
  assert.match(head, /^Subject: =\?UTF-8\?B\?/m); // nombre con tilde: palabra codificada
  const text = Buffer.from(rest.join('').replace(/\s+/g, ''), 'base64').toString('utf8');
  assert.match(text, /Nombre: Lucía Pérez/);
  assert.match(text, /Qué necesita: Asesoría de color/);
  assert.match(text, /Página: https:\/\/brenbe\.com\/contacto\//);
  assert.match(text, /Origen \(UTM\): source=instagram, medium=bio/);
  assert.match(text, /Idioma del sitio: es-AR/);
  assert.ok(head.split('\r\n').every((l) => l.length <= 998));
});

await t('envío sin JS (form POST): redirige 303 a la página de gracias del idioma', async () => {
  for (const [loc, to] of [['es-ar', '/gracias/'], ['es-mx', '/es-mx/gracias/'], ['es-es', '/es-es/gracias/'], ['en', '/en/thanks/'], ['pt-br', '/pt-br/obrigado/']]) {
    const r = await run({ locale: loc }, { json: false });
    assert.equal(r.res.status, 303);
    assert.equal(r.res.headers.get('location'), to);
    assert.equal(r.sent.length, 1);
  }
});

await t('error sin JS: vuelve a la página de contacto con ancla #contact-error', async () => {
  const r = await run({ email: 'no-es-mail', locale: 'en' }, { json: false });
  assert.equal(r.res.status, 303);
  assert.equal(r.res.headers.get('location'), '/en/contact/#contact-error');
  assert.equal(r.sent.length, 0);
});

await t('locale inválido no sirve para redirigir a otro sitio', async () => {
  const r = await run({ locale: 'https://evil.example' }, { json: false });
  assert.equal(r.res.headers.get('location'), '/gracias/');
});

await t('honeypot: responde ok pero no envía', async () => {
  const r = await run({ website: 'http://spam.example' });
  assert.equal(r.res.status, 200);
  assert.equal(r.sent.length, 0);
});

await t('demasiado rápido (< 3 s): rechaza', async () => {
  const r = await run({ ts: String(NOW.getTime() - 1000) });
  assert.equal(r.res.status, 400);
  assert.equal(r.body.error, 'too_fast');
  assert.equal(r.sent.length, 0);
});

await t('sin marca de tiempo (sin JS): se acepta', async () => {
  const r = await run({ ts: undefined });
  assert.equal(r.res.status, 200);
  assert.equal(r.sent.length, 1);
});

await t('email inválido / vacío / con salto de línea', async () => {
  for (const email of ['nope', 'a@b', '', 'a@b.com\r\nBcc: x@y.com']) {
    const r = await run({ email });
    assert.equal(r.res.status, 400, email);
    assert.ok(r.body.fields.email, email);
    assert.equal(r.sent.length, 0);
  }
});

await t('campos demasiado largos / mensaje corto / sin consentimiento / sin nombre', async () => {
  let r = await run({ mensaje: 'x'.repeat(LIMITS.mensaje + 1) });
  assert.equal(r.body.fields.mensaje, 'long');
  r = await run({ mensaje: 'hola' });
  assert.equal(r.body.fields.mensaje, 'short');
  r = await run({ consent: undefined });
  assert.equal(r.body.fields.consent, 'required');
  r = await run({ nombre: '' });
  assert.equal(r.body.fields.nombre, 'required');
  r = await run({ nombre: 'N'.repeat(LIMITS.nombre + 1) });
  assert.equal(r.body.fields.nombre, 'long');
  assert.equal(r.sent.length, 0);
});

await t('POST enorme: 413', async () => {
  const r = await run({ mensaje: 'x'.repeat(LIMITS.body + 10) });
  assert.equal(r.res.status, 413);
  assert.equal(r.sent.length, 0);
});

await t('inyección de cabeceras en nombre/teléfono: no crea cabeceras nuevas', async () => {
  const r = await run({ nombre: 'Ana\r\nBcc: robo@x.com', telefono: '1\nTo: otro@x.com', pais: 'AR\r\nX-Evil: 1' });
  assert.equal(r.res.status, 200);
  const head = r.sent[0].raw.split('\r\n\r\n')[0];
  assert.ok(!/^Bcc:/mi.test(head) && !/^X-Evil:/mi.test(head));
  assert.equal((head.match(/^To:/gm) || []).length, 1);
});

await t('origen: otro dominio o sin Origin/Referer es rechazado; Referer de brenbe.com vale', async () => {
  let r = await run({}, { origin: 'https://evil.example' });
  assert.equal(r.res.status, 403);
  r = await run({}, { origin: null });
  assert.equal(r.res.status, 403);
  const s = setup();
  const q = new Request('https://brenbe.com/api/contacto', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', referer: 'https://brenbe.com/contacto/', accept: 'application/json' }, body: req().url && (await req().text()) });
  const res = await handleContact(q, s.env, s.deps);
  assert.equal(res.status, 200);
});

await t('GET: 405', async () => {
  const s = setup();
  const res = await handleContact(new Request('https://brenbe.com/api/contacto'), s.env, s.deps);
  assert.equal(res.status, 405);
});

await t('límite por IP: el 6.º envío en 15 min recibe 429', async () => {
  const s = setup();
  const codes = [];
  for (let i = 0; i < 6; i++) codes.push((await handleContact(req(), s.env, s.deps)).status);
  assert.deepEqual(codes, [200, 200, 200, 200, 200, 429]);
  const other = await handleContact(req({}, { ip: '9.9.9.9' }), s.env, s.deps);
  assert.equal(other.status, 200);
});

await t('falta CONTACT_TO: 503 genérico y no se envía', async () => {
  const s = setup();
  s.env.CONTACT_TO = '';
  const res = await handleContact(req(), s.env, s.deps);
  assert.equal(res.status, 503);
  assert.equal((await res.json()).error, 'not_configured');
  assert.equal(s.sent.length, 0);
});

await t('sin TURNSTILE_SECRET: se acepta con honeypot + tiempo y no se llama a Turnstile', async () => {
  const r = await run();
  assert.equal(r.res.status, 200);
  assert.equal(r.verifyCalls.length, 0);
});

await t('con TURNSTILE_SECRET: exige token, lo verifica y rechaza uno malo', async () => {
  let r = await run({}, {}, { TURNSTILE_SECRET: 'sec' });
  assert.equal(r.body.error, 'captcha');
  assert.equal(r.sent.length, 0);
  r = await run({ 'cf-turnstile-response': 'bad' }, {}, { TURNSTILE_SECRET: 'sec' });
  assert.equal(r.body.error, 'captcha');
  assert.equal(r.sent.length, 0);
  r = await run({ 'cf-turnstile-response': 'good-token' }, {}, { TURNSTILE_SECRET: 'sec' });
  assert.equal(r.res.status, 200);
  assert.equal(r.sent.length, 1);
  assert.match(r.verifyCalls[0].url, /siteverify$/);
  assert.match(r.verifyCalls[0].body, /secret=sec/);
  assert.match(r.verifyCalls[0].body, /remoteip=1\.2\.3\.4/);
});

await t('Turnstile caído: falla cerrado (503) sin enviar', async () => {
  const r = await run({ 'cf-turnstile-response': 'x' }, {}, { TURNSTILE_SECRET: 'sec' }, { fetch: async () => { throw new Error('red'); } });
  assert.equal(r.res.status, 503);
  assert.equal(r.body.error, 'captcha_unavailable');
});

await t('falla SEND_EMAIL con error que contiene la dirección: respuesta y logs sin la dirección', async () => {
  const r = await run({}, {}, {}, { sendEmail: async () => { throw new Error(`destination address not verified: ${SECRET_TO}`); } });
  assert.equal(r.res.status, 502);
  assert.equal(r.body.error, 'send_failed');
  assert.ok(r.logs.length === 1);
});

await t('multipart/form-data (fetch con FormData) también se procesa', async () => {
  const s = setup();
  const fd = new FormData();
  for (const [k, v] of Object.entries({ nombre: 'Ana', email: 'ana@example.com', mensaje: 'Hola, quiero consultar por mi dormitorio.', consent: 'on', locale: 'pt-br', ts: String(FRESH), website: '' })) fd.set(k, v);
  const mp = new Request('https://brenbe.com/api/contacto', { method: 'POST', headers: { origin: 'https://brenbe.com', accept: 'application/json' }, body: fd });
  const res = await handleContact(mp, s.env, s.deps);
  assert.equal(res.status, 200);
  assert.equal(s.sent.length, 1);
  assert.match(s.sent[0].raw.split('\r\n\r\n')[0], /^Subject: Consulta web: Ana \(pt-BR\)$/m);
});

console.log(`\n${n} pruebas OK`);
