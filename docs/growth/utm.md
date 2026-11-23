# Medición: UTM, WhatsApp y Cloudflare Web Analytics

## Qué mide cada cosa (y qué no)

Cloudflare Web Analytics (CWA) es gratis, sin cookies y sin banner, pero **solo registra páginas vistas** (por **ruta**, país, referer, dispositivo). Según su documentación oficial: **no guarda query strings** (por eso no lee UTM) y **no tiene eventos personalizados**. Consecuencias:

1. Una UTM (`?utm_source=...`) **no aparece en CWA**. Sirve igual para: Pinterest/Instagram/GBP (te muestran sus propios clics), y para quien lea el enlace en la planilla de leads. Si algún día se suma Plausible/GA/Umami, ya quedan etiquetados.
2. La fuente de visitas en CWA sale del **referer** (pinterest.com, instagram, google...), que es bastante confiable en Pinterest y Google; en Instagram (bio) a veces llega como `l.instagram.com`.
3. Los clics a WhatsApp se miden con **rutas**, no con query: ver abajo.

## Clics a WhatsApp: `/wa/<página>/`

Con `whatsapp_enabled: true` en `_data/sitio.yml`, todos los botones de WhatsApp (flotante, CTA de guías, servicios, contacto, pie, home) apuntan a **`/wa/<origen>/`** (el `<origen>` es la URL de la página con guiones: `/guias/colores-para-living/` → `/wa/guias-colores-para-living/`; la home es `/wa/home/`; `/es-mx/guias/...` → `/wa/es-mx-guias-...`).
Esa ruta la resuelve una **Pages Function** (`functions/wa/[[path]].js`), no una página estática: busca el mensaje de ese origen en `/_wa-map.json` (lo genera Jekyll con `wa-map.json`; sin teléfonos) y responde `302` a `https://wa.me/<número>?text=<mensaje>` (`Cache-Control: private, no-store`, `X-Robots-Tag: noindex`, `Referrer-Policy: no-referrer`). Los bots reciben 403 (no cosechan el número por el header `Location`).

**El número de WhatsApp no está en el repo ni en el HTML.** Vive como secreto de Cloudflare Pages (lo gestiona Marcos; Brenda no lo ve): `WA_NUMBER_AR` (es-AR) y `WA_NUMBER_ES` (es-MX, es-ES, en, pt-BR); solo dígitos, formato internacional sin `+`. Si falta uno se usa el otro; si faltan los dos, el botón lleva a la página de Contacto del idioma.

**Cómo se miden los clics:** el colector propio (`/c`) registra `wa_click` con la página donde se tocó el botón (tabla `events` de D1). El panel (`/panel/api/stats`) arma de ahí el total de "Clics a WhatsApp", la comparación con el período anterior y la tarjeta "por página" (solo personas, `is_bot = 0`). Sin D1 conectada se muestra "no configurado", no 0. Cloudflare Web Analytics ya no ve `/wa/*` (la Function responde 302 sin HTML).
Para ocultar los botones: `whatsapp_enabled: false`.
Límite: cuenta clics, no conversaciones; y no distingue botón flotante vs. CTA de la misma página. Registrar en la primera respuesta ("¿cómo nos conociste?") sigue siendo necesario.

## Activar Web Analytics en Cloudflare (qué tiene que hacer la dueña)

Hay dos formas; **usá una sola** (una página no puede tener dos beacons):

- **A. Recomendada (manual, ya implementada): token en el repo.** Cloudflare → Web Analytics → *Add a site* → `brenbe.com` → *Manage site* → copiar el **token** del snippet (solo el valor `"token": "XXXX"`) → pegarlo en `_data/sitio.yml` → `cloudflare_analytics_token:`. Ventajas: viene en el HTML (también en `/wa/`), no depende de que Cloudflare inyecte, queda versionado. Hoy el campo está vacío: **no se mide nada hasta cargarlo**. Verificar: abrir el sitio, ver en "Red" (DevTools) `beacon.min.js` y un POST a `cloudflareinsights.com/cdn-cgi/rum`.
- **B. Automática (un clic):** Workers & Pages → proyecto `brenbe` → *Metrics* → *Enable* Web Analytics. Cloudflare inyecta el snippet en el próximo deploy. Más simple, pero hay que dejar `cloudflare_analytics_token` **vacío** para no duplicar, y depende de que el HTML sea válido y no lleve `Cache-Control: no-transform`.
- Sugerencia: A. Si se prefiere B, dejar el token vacío (el include `_includes/analytics.html` no imprime nada).
- En ambos casos: Search Console (propiedad de dominio por DNS, enviar `sitemap.xml`) y Pinterest (reclamar dominio: pegar el código en `_data/sitio.yml` → `pinterest_domain_verify:`).

## Convención UTM (para enlaces que ponemos en Pinterest, Instagram, GBP y directorios)

Minúsculas, sin acentos, siempre igual:

`?utm_source={pinterest|instagram|gbp|houzz|habitissimo|email|pr}&utm_medium={organic|bio|post|profile|newsletter|referral}&utm_campaign={nombre-corto}&utm_content={id-pin-o-reel}`

| Canal | utm_source | utm_medium | utm_campaign (ejemplo) | utm_content |
|---|---|---|---|---|
| Pin de Pinterest | `pinterest` | `organic` | `paletas-living-es-ar` | `pin-014` |
| Bio de Instagram | `instagram` | `bio` | `perfil` | — |
| Publicación / reel | `instagram` | `post` | `antes-despues-nov26` | `reel-007` |
| Google Business Profile | `gbp` | `profile` | `local` | — |
| Directorio (Houzz, Habitissimo...) | `houzz` / `habitissimo` | `referral` | `perfil` | — |
| Email / newsletter | `email` | `newsletter` | `guia-paletas-1` | — |
| Nota de prensa / colaboración | `pr` | `referral` | `nombre-medio` | — |

Ejemplos: `https://brenbe.com/guias/colores-para-living/?utm_source=pinterest&utm_medium=organic&utm_campaign=paletas-living-es-ar&utm_content=pin-014` · `https://brenbe.com/?utm_source=gbp&utm_medium=profile&utm_campaign=local`.
Reglas: una campaña = un nombre; no usar UTM en enlaces **internos** del sitio; los enlaces `wa.me` no admiten UTM. Los enlaces con UTM no cambian la URL canónica (ya apunta a la limpia).
Alternativa si se quiere atribuir cada canal en CWA: pedir al dev una página-puente por canal (`/r/pinterest/`, estilo `/wa/`) y usar esa URL en la bio/perfil; cada canal queda como una ruta distinta.

## Planilla de leads (10 min/semana)

Fecha, origen (referer / ruta `/wa/...` / "cómo nos conociste"), idioma, servicio, estado, monto, reseña pedida.

## Actualización: las UTM ahora sí se miden (estadísticas propias)

Desde el panel v2, el colector propio (`/c`, ver `docs/panel-analitica.md`) guarda `utm_source`, `utm_medium` y `utm_campaign` de cada visita (anónimo, sin cookies) y el panel los muestra en "¿De dónde llegan?". Cloudflare Web Analytics sigue sin leer query strings; esto es un complemento. Requiere la base D1 activada.
