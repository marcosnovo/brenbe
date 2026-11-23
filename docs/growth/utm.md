# Medición: UTM, WhatsApp y Cloudflare Web Analytics

## Qué mide cada cosa (y qué no)

Cloudflare Web Analytics (CWA) es gratis, sin cookies y sin banner, pero **solo registra páginas vistas** (por **ruta**, país, referer, dispositivo). Según su documentación oficial: **no guarda query strings** (por eso no lee UTM) y **no tiene eventos personalizados**. Consecuencias:

1. Una UTM (`?utm_source=...`) **no aparece en CWA**. Sirve igual para: Pinterest/Instagram/GBP (te muestran sus propios clics), y para quien lea el enlace en la planilla de leads. Si algún día se suma Plausible/GA/Umami, ya quedan etiquetados.
2. La fuente de visitas en CWA sale del **referer** (pinterest.com, instagram, google...), que es bastante confiable en Pinterest y Google; en Instagram (bio) a veces llega como `l.instagram.com`.
3. Los clics a WhatsApp se miden con **rutas**, no con query: ver abajo.

## Clics a WhatsApp: `/wa/<página>/`

Cuando "Mis datos" tiene WhatsApp, todos los botones de WhatsApp (flotante, CTA de guías, servicios, contacto, pie, home) apuntan a una mini-página **`/wa/<origen>/`** (una por página del sitio, generadas en el build; el `<origen>` es la URL de la página con guiones: `/guias/colores-para-living/` → `/wa/guias-colores-para-living/`; la home es `/wa/home/`; `/es-mx/guias/...` → `/wa/es-mx-guias-...`).
Esa página (noindex, fuera del sitemap, `Disallow: /wa/` en robots.txt, `X-Robots-Tag: noindex`) lleva el beacon de CWA, espera ~0,7 s a que se registre la visita y salta a `https://wa.me/<número>?text=<mensaje de esa página>` con `location.replace` (el botón "atrás" vuelve a la página de origen, no queda en un bucle). Respaldo sin JS: `meta refresh` a los 3 s y botón visible.

**Cómo leerlo en Cloudflare:** Web Analytics → brenbe.com → filtro **Path** que empiece por `/wa/` → cada ruta es un clic atribuido a su página; el prefijo del idioma está en la ruta. Total de clics = visitas a `/wa/*`.
Para desactivarlo: `wa_track: false` en `_data/sitio.yml` (los botones vuelven a abrir `wa.me` directo). Sin número de WhatsApp no se genera nada.
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
Reglas: una campaña = un nombre; no usar UTM en enlaces **internos** del sitio; los enlaces `wa.me` no admiten UTM (usar `/wa/`). Los enlaces con UTM no cambian la URL canónica (ya apunta a la limpia).
Alternativa si se quiere atribuir cada canal en CWA: pedir al dev una página-puente por canal (`/r/pinterest/`, estilo `/wa/`) y usar esa URL en la bio/perfil; cada canal queda como una ruta distinta.

## Planilla de leads (10 min/semana)

Fecha, origen (referer / ruta `/wa/...` / "cómo nos conociste"), idioma, servicio, estado, monto, reseña pedida.

## Actualización: las UTM ahora sí se miden (estadísticas propias)

Desde el panel v2, el colector propio (`/c`, ver `docs/panel-analitica.md`) guarda `utm_source`, `utm_medium` y `utm_campaign` de cada visita (anónimo, sin cookies) y el panel los muestra en "¿De dónde llegan?". Cloudflare Web Analytics sigue sin leer query strings; esto es un complemento. Requiere la base D1 activada.
