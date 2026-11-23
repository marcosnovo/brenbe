# Formulario de contacto de brenbe.com

Las consultas del formulario le llegan por mail a la casilla privada de Brenda. **Esa dirección no está en el repo, ni en el HTML, ni en el JS:** vive solo como secreto `CONTACT_TO` del Worker. En esta guía se escribe `<CONTACT_TO>`.

## Cómo funciona

- El formulario (`_includes/contact-form.html`) hace `POST /api/contacto`. Sin JS, el navegador redirige a la página de gracias del idioma (`/gracias/`, `/es-mx/gracias/`, `/es-es/gracias/`, `/en/thanks/`, `/pt-br/obrigado/`; noindex, fuera del sitemap). Con JS (`brenbe-contact.js`) se envía con `fetch` y muestra el mensaje en la misma página.
- **Por qué un Worker aparte:** Cloudflare Pages Functions no admite el binding `send_email` de Email Routing (solo Workers). Por eso hay un Worker `brenbe-contacto` (`workers/contacto/`) con una ruta de zona `brenbe.com/api/contacto`. Pages no lo ve: `_routes.json` ya solo activa Functions en `/` y `/panel/api/*`.
- El Worker valida, filtra spam y manda el mail con `SEND_EMAIL` (Email Routing, gratis) desde `formulario@brenbe.com` hacia `<CONTACT_TO>`. El `Reply-To` es el mail del visitante: Brenda responde con "Responder".
- Anti-spam: Turnstile (si hay clave), campo trampa (honeypot), tiempo mínimo de 3 s, límite de 5 envíos por IP cada 15 min (en memoria, mejor esfuerzo), tope de largos, chequeo de Origin (solo brenbe.com) y limpieza de saltos de línea (sin inyección de cabeceras). Si no hay `TURNSTILE_SECRET`, rigen solo honeypot + tiempo + límite por IP. Con Turnstile activo, el envío sin JS no funciona (el widget necesita JS).
- Ninguna respuesta ni log incluye `<CONTACT_TO>` (hay un test que lo verifica).
- El sitio sigue funcionando sin el Worker: el formulario solo se muestra con `contact_form: true` en `_data/sitio.yml`.

## Pasos para activar (una sola vez)

1. **Email Routing.** En el panel de Cloudflare, zona `brenbe.com` > *Email* > *Email Routing* > *Enable*. Cloudflare agrega registros MX y TXT (SPF). Ojo: ya existe un TXT de SPF de DonDominio. Un dominio solo puede tener **un** SPF: hay que **unir** los dos en un solo registro (o borrar el de DonDominio si ya no se usa su correo) antes de aceptar el cambio. Si el dominio recibe correo en DonDominio, hay que revisar antes los MX.
2. **Destino verificado.** En *Email Routing* > *Destination addresses* > *Add destination address*: cargar `<CONTACT_TO>`. A esa casilla llega un mail de verificación de Cloudflare: **su dueña debe hacer clic en el enlace**. Sin eso, el Worker no puede enviar.
3. **Turnstile.** *Turnstile* > *Add widget* para el dominio `brenbe.com` (modo *Managed*). Guardar la *site key* (pública) y la *secret key*.
4. **Desplegar el Worker.** Desde `workers/contacto/`: `npx wrangler deploy`. Crea el Worker `brenbe-contacto`, el binding `SEND_EMAIL` y la ruta `brenbe.com/api/contacto`.
5. **Secretos del Worker.** En la misma carpeta:
   - `npx wrangler secret put CONTACT_TO` (pegar `<CONTACT_TO>`)
   - `npx wrangler secret put TURNSTILE_SECRET` (la secret key del paso 3; opcional pero recomendado)
6. **Activar en el sitio.** En `_data/sitio.yml`: `contact_form: true` y `turnstile_sitekey: <site key>`. Al mergear a `main`, las páginas de contacto muestran el formulario y pasan a ser indexables (se agregan al sitemap/hreflang).
7. **Probar.** Enviar una consulta de prueba desde `https://brenbe.com/contacto/` y comprobar que llega a `<CONTACT_TO>` con el `Reply-To` correcto. Si no llega: `npx wrangler tail brenbe-contacto` (los logs no muestran la dirección).

## Pruebas y mantenimiento

- Tests del Worker: `node tests/contacto.test.mjs`.
- Opciones del desplegable y su texto en el mail: `NEEDS` en `workers/contacto/src/handler.js` y `cf_need_opts` en `_data/i18n/*.yml` (mismas claves).
- Remitente distinto: variable `CONTACT_FROM` (tiene que ser una dirección del dominio con Email Routing activo).
- Medición: al enviar con éxito, el JS hace `navigator.sendBeacon('/c', {"e":"contact_submit","p":<ruta>,"l":<idioma>})`; si `/c` no existe, no pasa nada.
- No hay página de política de privacidad en el sitio; el texto de consentimiento del formulario solo promete usar los datos para responder la consulta.
