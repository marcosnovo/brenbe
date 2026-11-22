# BRENBE Interiorismo: estrategia de localización (es-AR, es-MX, es-ES, pt-BR, en)

Fecha: 2026-11-22. Solo lectura del repo (`_config.yml`, `_layouts/base.html`, `_data/negocio.yml`, `.pages.yml`, `_headers`, `_guias/`, `servicios/`, `Gemfile`) y de `seo-tecnico.md` / `seo-contenido-growth.md`.

**Límites de esta investigación (leer primero).** En este entorno el proxy bloqueó `developers.google.com` y `developers.cloudflare.com`, y las búsquedas web no devolvieron cifras por país de demanda ni de precios de e-design. Lo que sigue sobre Google (hreflang, páginas adaptadas por locale) y sobre los límites de Cloudflare viene de documentación conocida y hay que **re-verificarlo antes de implementar** (marcado con [VERIFICAR]). Las cifras de precios y demanda son **estimaciones orientativas**, no datos medidos; se validan con Search Console (filtro por país) y Keyword Planner. Fuente usada sobre cobros: [Cronista, 3 vías para recibir dólares](https://www.cronista.com/infotechnology/finanzas-digitales/freelancers-argentinos-las-3-vias-para-recibir-dolares-del-exterior-y-evitar-errores/), [Cronista, caso US$1000 → US$450](https://www.cronista.com/infotechnology/finanzas-digitales/argentinos-que-cobran-en-el-exterior-por-cada-us-1000-solo-les-llegan-us-450), [iProfesional, comisiones 2026](https://www.iprofesional.com/tecnologia/460003-como-cobrar-en-dolares-desde-argentina-pagando-menos-comisiones). Fuente sobre mercado: [reportes sectoriales](https://www.marketresearch.com/Bosson-Research-v4252/Global-Online-Interior-Design-Home-44584560/) (sin desglose por país en lo accesible).

---

## 0. Resumen ejecutivo (decisión)

| Locale | Veredicto | Fase | Condición |
|---|---|---|---|
| es-AR (raíz `/`) | Ya existe: terminar y posicionar | 0 | Es la base; todo lo demás se apoya en que convierta |
| es-MX | **GO** | 1a | Cobro en USD resuelto (PayPal/Payoneer/transferencia) y precio publicado |
| es-ES | **GO** (después de MX) | 1b | Cobro en EUR resuelto; revisar aviso legal/consumo UE |
| en (en-US + `en` genérico) | **GO condicionado** | 2 | Solo si Brenda sostiene una videollamada de 60 min y escribe recomendaciones en inglés (B2+) |
| pt-BR | **NO-GO por ahora** | 3 (si algún día) | Solo si Brenda (o una socia brasileña) atiende en portugués |
| es-US (hispanos en EE.UU.) | **No crear locale propio** | 2 | Cubrir con hreflang `es-US` apuntando a `/es-mx/` (se permite un mismo URL para varios hreflang) |

Regla de oro: **el cuello de botella no es el sitio, es la capacidad de Brenda de vender y entregar en cada mercado**. Cada locale nuevo cuesta poco en desarrollo (1-2 días) y bastante en copy nativo + atención. Por eso: primero los mercados donde no necesita otro idioma, y un "gate" de datos antes de cada fase (sección 1.6).

Auto-aplicar idioma por región: **sí, pero solo en la raíz `/` y en la primera visita, nunca a bots, con switcher visible y cookie** (sección 2). Es el único modo que no daña el SEO.

---

## 1. Análisis "¿vale la pena?" por mercado

### 1.1 Tabla comparativa

| | AR | MX | ES | BR | US (en) |
|---|---|---|---|---|---|
| Población aprox. | 46 M | 130 M | 48 M | 215 M | 335 M (hispanohablantes en casa ~42 M) |
| Idioma que debe dominar Brenda | es | es (cero fricción) | es (cero fricción) | **pt (obligatorio)** | **en (obligatorio)** |
| Huso horario vs AR (UTC-3 fijo) | = | CDMX UTC-6 sin DST: **AR +3 h** | CET/CEST: **AR -4 h (invierno ES) / -5 h (verano ES)** | Brasilia UTC-3 sin DST: **igual** | ET: AR +2 h invierno / +1 h Mar-Nov; PT: +5/+4 |
| Ventana útil de llamadas | 10-18 h | 10-15 h AR = 7-12 h CDMX (mañanas MX) | 10-15 h AR = 14-19 h ES (tardes ES) | cualquiera | 10-14 h AR = 8-12 h ET |
| Moneda de precio | ARS (+ USD ref.) | USD | EUR | BRL o USD | USD |
| Ticket orientativo por ambiente online [estimación, VALIDAR] | bajo | medio-bajo (~US$ 80-270) | alto (~90-250 €) | medio (R$ 400-1.500) | alto (US$ 100-500; plataformas masivas desde ~US$ 79-130) |
| Competencia SEO en "asesoría/diseño de interiores online" | baja-media (hueco real, ver `seo-contenido-growth.md`) | media; muchas cuentas de Instagram, pocos sitios con servicio "sin obra" empaquetado | **alta**: interioristas online, Houzz, Westwing, Leroy Merlin/IKEA, medios deco | alta y madura ("decoração online", "projeto 3D online") | **muy alta** (Decorilla, Havenly, Laurel & Wolf, Houzz y miles de e-designers) |
| Cultura de pagar por asesoría remota | media | media y creciendo (IG/Pinterest) | alta | alta | muy alta |
| Fricción de cobro para una argentina | n/a | media | **baja-media (SEPA vía cuenta EUR)** | **alta (Pix no sirve a proveedor extranjero; IOF; confianza)** | baja-media (PayPal/Payoneer/ACH) |

Notas de lectura:
- La palabra clave que ordena todo es **"sin obra"**: en ES se dice "sin reformas / sin obras", en BR "sem obra / sem reforma", en EN "no-renovation / renter-friendly". Es el diferencial de Brenda y se traduce bien en los cuatro mercados (el renter-friendly de EE.UU. y los pisos de alquiler de España son nichos naturales).
- Ventaja de arbitraje: Brenda puede cobrar un "desde" en USD/EUR que en AR sería alto y en destino es medio, sin parecer barata. No competir por precio contra plataformas masivas de EE.UU.; competir por **atención personalizada + criterio + idioma/cultura cercana** (para el público hispano de EE.UU. es una ventaja real).

### 1.2 Cobrar en USD/EUR/BRL desde Argentina (qué se puede y qué no)

Hechos (de las fuentes citadas; **verificar con contador/ARCA**, la parte fiscal cambia seguido):
- Vías típicas de cobro del exterior: transferencia internacional (SWIFT/ACH/SEPA), plataformas (PayPal, Payoneer) y billeteras de dólares digitales/stablecoins. Wise es buena en comisiones pero según una guía 2026 no abre cuentas locales a residentes argentinos; por eso los cobros suelen requerir un paso intermedio.
- La diferencia entre métodos puede ser **2% a 10%** por cobro; hay casos reportados de recibir mucho menos al convertir al dólar oficial. Recomendación práctica de las fuentes: pedir al cliente transferencia bancaria cuando sea posible.
- Exportación de servicios: se factura con Factura E (y hay regímenes como Monotributo Tech en otros rubros; en su caso hay que ver si aplica a diseño de interiores). Ingresos del exterior son renta de fuente argentina de servicios prestados desde AR: **consultar contador** (monotributo vs responsable inscripto, IVA exento por exportación, reglas cambiarias vigentes).
- Stripe no permite abrir cuenta comercial en Argentina de forma nativa [VERIFICAR]; Mercado Pago opera en MX/BR pero cobrar allí requiere entidad local, no sirve como proveedora extranjera; **Pix y SPEI son rieles domésticos** (no los puede recibir una persona sin cuenta local).

Setup mínimo recomendado antes de la Fase 1 (una sola vez):
1. **PayPal Business** (link de pago / factura en USD o EUR) como opción para tarjeta: es lo que más inspira confianza al cliente; comisión alta, se asume o se suma al precio.
2. **Payoneer** (o cuenta que entregue datos bancarios en USD y EUR) para cobrar por transferencia ACH/SEPA sin que el cliente pague comisión extra. Para ES, recibir en EUR por SEPA es la opción más barata y natural.
3. Mostrar en el sitio **solo "desde US$ X" / "desde X €"** con "los pagos se coordinan por WhatsApp/email; aceptamos transferencia o PayPal" (sin checkout automático: evita dependencia de pasarela y conserva el flujo conversacional que ya tiene el sitio).
4. Contrato/condiciones breves (alcance, reprogramación, pago por adelantado 100% o 50%).
Pendiente legal por mercado (revisar, no es asesoramiento legal): UE exige aviso legal/identificación del titular (LSSI) y derecho de desistimiento 14 días en servicios a consumidores; Brasil tiene CDC (7 días a distancia) y LGPD; México LFPDPPP (aviso de privacidad); EE.UU. CCPA solo si supera umbrales.

### 1.3 Veredicto y razón por mercado

- **MX: GO (1a).** Mismo idioma, solo 3 h de diferencia, mercado enorme, "sin obra" poco empaquetado, precio USD razonable. Riesgo: vocabulario muy distinto (recámara/sala/clóset) → hay que localizar de verdad, no copiar.
- **ES: GO (1b).** Tickets más altos, cobro SEPA, mismo idioma. Riesgo: SERP muy competida y 4-5 h de diferencia (llamadas de tarde en ES). Entrar con long-tails: "interiorismo online sin reformas", "decorar piso de alquiler", "home staging" (término muy fuerte en ES).
- **en: GO condicionado (2).** El mayor pozo de demanda y de precio, pero competencia brutal; solo vale con oferta diferenciada: **hispanos en EE.UU. + renter-friendly + "en español o inglés"**, y solo si Brenda puede atender en inglés. En EE.UU. "interior designer" es título regulado en varios estados: usar "online interior design consultant / decorator" en el copy.
- **pt-BR: NO-GO.** Exige atender en portugués (videollamada, WhatsApp, recomendaciones escritas, lista de compras con nombres de marcas locales). Un sitio en portugués que no se puede cumplir genera reclamos y mala reputación; portuñol quema credibilidad. Además fricción de cobro (Pix, IOF, desconfianza a prestador extranjero). **Reabrir** si: (a) Brenda habla/escribe portugués de forma profesional o (b) tiene una socia/diseñadora brasileña que atienda y el sitio la presenta. Mercado grande y misma zona horaria: es el candidato natural a Fase 3.

### 1.4 Fases

- **Fase 0 (ahora-4 semanas): es-AR sólido.** Contacto operativo, precio "desde", schema, guías. Instalar cobro internacional y precios USD/EUR. Medir impresiones por país en Search Console.
- **Fase 1a (semanas 5-10): es-MX** (5 páginas + 2 guías). **1b (semanas 11-16): es-ES** (idem). Entre 1a y 1b mirar datos.
- **Fase 2 (mes 5-8): en** (+ hreflang `es-US`→`/es-mx/`), si cumple la condición de idioma.
- **Fase 3 (mes 9+): pt-BR**, solo con capacidad de atención.

### 1.5 Costo estimado por locale (dev + contenido)
- Desarrollo del esqueleto multi-locale (una sola vez): ~2-3 días. Cada locale adicional: ~0,5-1 día de dev.
- Copy: 5 páginas (~2.500 palabras) + 2 guías (~3.000 palabras): borrador con IA + **revisión de nativa/o paga**. Presupuestar la revisión humana siempre (es lo que evita "traducido" y marca confianza).

### 1.6 Gate de datos antes de cada fase
Construir un locale solo si se cumple al menos una: (a) ≥8-10% de impresiones o clics en Search Console desde ese país en 90 días; (b) ≥2 consultas reales de ese país en 90 días; (c) decisión estratégica explícita de Brenda con cobro e idioma resueltos. Para MX/ES se puede saltear el gate (apuesta barata), para en/pt-BR **no**.

---

## 2. Arquitectura SEO-correcta

### 2.1 Estructura de URLs (decisión)

Un solo dominio, **subcarpetas** (hereda autoridad; no hay que comprar ccTLD ni gestionar subdominios):

| Locale | Carpeta | hreflang | Notas |
|---|---|---|---|
| es-AR | `/` (raíz, no se mueve) | `es-AR` + `es` (fallback) + `x-default` | No mover a `/ar/`: preserva URLs, enlaces y señales ya acumuladas |
| es-MX | `/es-mx/` | `es-MX` (+ `es-US` en fase 2) | |
| es-ES | `/es-es/` | `es-ES` | |
| en | `/en/` | `en` y `en-US` | Genérico: sirve a EE.UU., CA, UK, AU; precio en USD |
| pt-BR | `/pt-br/` | `pt-BR` | Fase 3, no crear carpeta aún |

Decisiones puntuales:
- **Sin `es-419`.** No es un código hreflang soportado de forma fiable por Google (acepta idioma ISO 639-1 + región ISO 3166-1 alfa-2). Para el resto de Latinoamérica (CO, CL, PE, UY...) se usa **`hreflang="es"` genérico → raíz es-AR**: cualquier hispanohablante sin versión propia cae ahí. (El voseo es comprensible en toda la región.) Si en el futuro CO/CL aportan tráfico, se evalúa una versión tuteo neutra.
- **`x-default` → `/`** (raíz es-AR): no hay página selectora de idioma, y la raíz tiene el switcher visible.
- Slugs: es-MX y es-ES **conservan los slugs en español** (`/es-mx/asesoria-de-interiorismo-online/`); si la palabra local es otra, se cambia el slug (p. ej. es-ES: `/es-es/interiorismo-online/`, opcional). en y pt-BR **traducen slugs** (`/en/online-interior-design/`, `/pt-br/consultoria-de-decoracao-online/`) para que la URL tenga la keyword.
- Cada locale **solo existe en las páginas que realmente están traducidas**; no se clonan páginas en español bajo otra carpeta sin localizar (duplicado + Google elige otra canónica).

### 2.2 hreflang, canonical, sitemap

Reglas:
1. **Canonical autorreferente** en cada URL de cada locale. Nunca apuntar el canonical de es-MX a es-AR.
2. hreflang **recíproco y completo**: si A lista a B, B lista a A y cada página se lista a sí misma. Solo entre páginas equivalentes (si la guía no existe en es-MX, no hay hreflang a es-MX en esa guía).
3. URLs absolutas, un solo método **generado desde la misma fuente de datos**: `<link rel="alternate">` en el `<head>` (que ya existe en `base.html` con `es-AR` y `x-default`) **y** `sitemap.xml` con `xhtml:link`. Si ambos salen del mismo `ref`, no pueden contradecirse.
4. Es-AR y es-MX/es-ES son casi el mismo idioma: Google puede **agruparlos como duplicados** y elegir una canónica. Para evitarlo hay que **diferenciar de verdad** vocabulario, ejemplos, moneda, keywords, FAQ y meta (sección 4). hreflang ayuda a mostrar la versión correcta, no resuelve contenido calcado.
5. `og:locale` + `og:locale:alternate`; `<html lang="{{ page.lang }}">` (hoy está fijo en `es-AR`).

Ejemplo del bloque `<head>` (home, fase 1 completa):
```html
<link rel="canonical" href="https://brenbe.com/es-mx/">
<link rel="alternate" hreflang="es-AR" href="https://brenbe.com/">
<link rel="alternate" hreflang="es"    href="https://brenbe.com/">
<link rel="alternate" hreflang="es-MX" href="https://brenbe.com/es-mx/">
<link rel="alternate" hreflang="es-ES" href="https://brenbe.com/es-es/">
<link rel="alternate" hreflang="x-default" href="https://brenbe.com/">
```
Sitemap: reemplazar la lista fija por un `sitemap.xml` Liquid que recorre `site.pages | concat: site.documents`, filtra `indexable`, y por cada URL con `ref` emite `<xhtml:link rel="alternate" hreflang=... href=...>` de todos sus equivalentes (incluida ella misma). `jekyll-sitemap` **no** genera alternates; no sirve.

### 2.3 Por qué el redirect automático por IP/idioma es dañino

(Referencia: Google, "Managing multi-regional and multilingual sites" y "locale-adaptive pages" [VERIFICAR texto actual].)
1. **Googlebot rastrea sobre todo desde IPs de EE.UU. y sin `Accept-Language`.** Un redirect por país/idioma lo manda siempre a la versión "por defecto" de ese perfil (o lo bloquea): Google **nunca vería** las versiones es-MX/es-ES si se redirige todo desde cualquier URL, o vería solo una.
2. Google recomienda **URLs separadas por versión** y no variar contenido en la misma URL según la ubicación o el idioma del navegador; si se sugiere cambio de versión, que sea con **banner/enlace**, no forzado.
3. Rompe enlaces compartidos y resultados de búsqueda: alguien en España abre un link a una guía AR y lo tirás a otra página; expatriados (argentina viviendo en Madrid) quedan atrapados en la versión equivocada.
4. Genera bucles y problemas de caché (CDN sirve la redirección de un usuario a otro si no hay `Vary`/no-store).
5. Cualquier excepción mal escrita (bots, prefetch, vistas previas de WhatsApp/Meta) contamina previews y analítica.
Conclusión: **nunca redirigir páginas internas; en la raíz hacerlo solo bajo condiciones muy estrictas, o directamente no hacerlo y usar un aviso.**

### 2.4 Comportamiento exacto (recomendado)

**A) Redirect solo en `/` (Pages Function) — Opción recomendada, con todas estas condiciones a la vez:**
1. Método GET y ruta exactamente `/` (ninguna otra URL se toca).
2. **No hay cookie `brenbe_loc`** (primera visita o cookie borrada).
3. **No es bot**: User-Agent vacío o que matchea `bot|crawl|spider|slurp|bing|google|duckduck|yandex|baidu|facebookexternalhit|twitterbot|linkedin|whatsapp|telegram|slack|pinterest|preview|embedly|lighthouse|pagespeed|gtmetrix|headless|curl|wget|python|go-http|monitor|uptime|ahrefs|semrush`. Además **sin `Accept-Language` no se redirige** (los rastreadores no lo envían).
4. `request.cf.country` está en el mapa de países con locale **publicado** (ej. `MX→es-mx`, `ES→es-es`; `US→en` recién en fase 2; `BR` no hasta fase 3).
5. **El primer idioma de `Accept-Language` es compatible** con el locale destino (`es*` para MX/ES, `en*` para US). Si el primer tag es `es-AR` (o cualquier `-AR`) → **no redirigir** (expatriados argentinos quedan en su raíz).
6. Sin parámetro `?nolang` ni encabezado de prefetch (`Sec-Purpose: prefetch`).
7. Respuesta: **302** (nunca 301) a `/<carpeta>/`, con `Set-Cookie: brenbe_loc=<locale>; Path=/; Max-Age=2592000; SameSite=Lax` (30 días, cookie funcional de preferencia, sin banner de consentimiento necesario si solo guarda la elección) y `Cache-Control: private, no-store` + `Vary: Accept-Language, Cookie`.
8. Cualquier otro caso (o cualquier error): `return next()` (sirve la raíz estática normalmente). **Falla abierta siempre.**

**B) Switcher visible siempre** (cabecera y footer): texto en el idioma propio ("Argentina · México · España · English"), **sin banderas** (las banderas representan países, no idiomas). Cada enlace es una URL real (funciona sin JS) y con un pequeño JS que escribe `brenbe_loc=<locale>` (30 días-1 año) al hacer clic. Si el usuario elige "Argentina", la cookie `brenbe_loc=es-ar` impide cualquier redirección futura desde `/`.

**C) Banner de sugerencia no bloqueante (complemento, en TODAS las páginas):**
- Se muestra solo si no hay cookie, el locale de la página difiere del detectado por `navigator.languages` + país, y **nunca modal**: barra fija inferior/superior, `role="region"`, 44 px, cierre con "×" (guarda cookie `brenbe_loc` = locale actual 90 días). Texto en el idioma de la versión sugerida: "¿Estás en México? Mirá/Mira la versión para México." / "Ver versión para España | Quedarme aquí".
- País sin costo de Function: `fetch('/cdn-cgi/trace')` (lo sirve el borde de Cloudflare, no cuenta como invocación de Function) devuelve `loc=XX`. Alternativa: usar solo `navigator.language`.
- Se esconde sobre el botón flotante de WhatsApp para no tapar el CTA.
- **Este banner es la protección para búsquedas de Google**: el usuario de México que aterriza en una guía AR desde el buscador ve la sugerencia sin ningún redirect.

Si hay que elegir una sola cosa por simplicidad: **C solo (banner) + B (switcher)** ya cumple el pedido "auto-aplicar" de forma segura, con cero Function. A es un agregado que mejora la conversión del tráfico directo/redes a la home.

### 2.5 Pages Function (esqueleto)

Archivo `functions/index.js` (responde solo a `/`; no usar `_middleware`, que se ejecutaría en todas las rutas):
```js
const COUNTRY = { MX: 'es-mx', ES: 'es-es' };            // sumar US:'en' (fase 2), BR:'pt-br' (fase 3)
const LANG    = { 'es-mx': 'es', 'es-es': 'es', en: 'en', 'pt-br': 'pt' };
const BOT = /bot|crawl|spider|slurp|bing|google|duckduck|yandex|baidu|facebookexternalhit|twitterbot|linkedin|whatsapp|telegram|slack|pinterest|preview|embedly|lighthouse|pagespeed|gtmetrix|headless|curl|wget|python|go-http|monitor|uptime|ahrefs|semrush/i;

export async function onRequestGet({ request, next }) {
  try {
    const h = request.headers;
    const ua = h.get('user-agent') || '', al = (h.get('accept-language') || '').toLowerCase();
    if (!ua || !al || BOT.test(ua)) return next();
    if (/(?:^|;\s*)brenbe_loc=/.test(h.get('cookie') || '')) return next();
    if (new URL(request.url).searchParams.has('nolang') || /prefetch/.test(h.get('sec-purpose') || '')) return next();
    const first = al.split(',')[0].trim();                 // ej. "es-mx", "es-ar", "en-us"
    if (first.endsWith('-ar')) return next();
    const loc = COUNTRY[request.cf && request.cf.country];
    if (!loc || !first.startsWith(LANG[loc])) return next();
    return new Response(null, { status: 302, headers: {
      Location: '/' + loc + '/',
      'Set-Cookie': 'brenbe_loc=' + loc + '; Path=/; Max-Age=2592000; SameSite=Lax',
      'Cache-Control': 'private, no-store',
      Vary: 'Accept-Language, Cookie',
    }});
  } catch (e) { return next(); }
}
```
Archivos/ajustes en el repo (el build de Cloudflare ejecuta Jekyll; `functions/` va en la raíz del repo, fuera de `_site`):
- `_config.yml`: agregar `functions` a `exclude` (si no, Jekyll copia el JS a `_site/functions/`), y declarar `_routes.json` si se usa (en `include`). Con `functions/index.js` Pages ya genera rutas solo para `/`; un `_routes.json` explícito `{"version":1,"include":["/"],"exclude":[]}` es cinturón y tirantes.
- `_headers` no cambia (se aplica sobre respuestas estáticas; los `Set-Cookie`/`Cache-Control` de la Function van en el propio código).
- Probar con `curl -I -H 'Accept-Language: es-MX' -H 'User-Agent: Mozilla/5.0 ...' -H 'CF-IPCountry: MX'` solo en preview (el país real lo inyecta Cloudflare; en local usar `wrangler pages dev`) y **verificar con el "Inspección de URL" de Search Console que Googlebot ve `/` sin redirigir**.

### 2.6 Límites y costos de Cloudflare Pages Functions [VERIFICAR en la doc vigente]
- Plan gratis: **100.000 solicitudes/día** compartidas con Workers de la cuenta (reinicia 00:00 UTC), con un tope de CPU por solicitud de ~10 ms (la lógica de arriba es de microsegundos).
- **Los archivos estáticos, `_headers` y `_redirects` no cuentan**: las solicitudes de assets estáticos son gratuitas e ilimitadas; solo cuentan las invocaciones de la Function. Al limitar la Function a `/`, solo suman las vistas a la home de visitantes sin cookie.
- Si algún día se supera la cuota, las rutas con Function fallan (los assets estáticos siguen) → la home estaría caída: **mitigación** monitorear y pasar al plan de pago de Workers (~US$ 5/mes) o desactivar la Function (el sitio sigue funcionando solo con banner). Con el tráfico esperable de este negocio, 100k/día es un techo muy lejano.

---

## 3. Plan de implementación en Jekyll (CMS simple para Brenda)

### 3.1 ¿Plugin o a mano? Decisión: **a mano, sin `jekyll-polyglot`**

| | jekyll-polyglot | Hecho a mano (recomendado) |
|---|---|---|
| Cloudflare lo compila | Sí si está en el `Gemfile` (Cloudflare corre `bundle`+`jekyll build`) | Sí, nativo |
| Control de qué existe por locale | Débil: por defecto **clona todo el sitio** al idioma nuevo con el contenido sin traducir → duplicados masivos indexables (justo lo que hay que evitar) salvo que se use `exclude_from_localization` a mano | Total: solo existen las páginas que se crean |
| hreflang/sitemap | Helpers propios (`I18n_Headers`) con limitaciones; hay que reescribir sitemap igual | Liquid + `ref`, ~30 líneas |
| Códigos es-MX/es-ES | Pensado para idiomas; manejo de región incómodo | Libre |
| Colecciones por locale | Soporte parcial | Simple (colecciones separadas) |
| Dependencia/mantenimiento | Gema con poco mantenimiento, cambia el pipeline de build y las rutas | Cero dependencias nuevas |
| Aprendizaje para quien edita | Cada archivo con `lang` y reglas implícitas | Archivos explícitos por carpeta |
Para 5 locales y ~40 páginas, lo explícito gana. Opcional: un mini plugin propio en `_plugins/i18n_check.rb` (hook `:site, :post_write`) que **avise en el build** si un `ref` tiene alternate sin recíproco o si falta una clave de `_data/i18n`.

### 3.2 Estructura de archivos
```
_data/
  locales.yml           # config de cada locale (ver abajo)
  i18n/
    es-AR.yml  es-MX.yml  es-ES.yml  en.yml  pt-BR.yml   # textos de interfaz (flat keys)
  precios.yml           # (CMS) precios "desde" por moneda
  negocio.yml           # (CMS) ya existe
es-mx/                   # páginas del locale (carpeta SIN guion bajo = se publica)
  index.html
  asesoria-de-interiorismo-online/index.md
  servicios/index.html + 2-5 md
  sobre-brenda/index.md
  contacto/index.html
  guias/index.html
_guias/                  # es-AR (la colección actual, la edita Brenda)
_guias_es_mx/            # colección es-MX (la mantiene quien traduce, no Brenda)
_guias_es_es/
_proyectos/              # una sola colección (ver 3.4)
```
`_data/locales.yml` (una entrada por locale; `ready: false` oculta el locale en hreflang, switcher y sitemap hasta lanzarlo):
```yaml
es-AR: { code: es-AR, prefix: "",        hreflang: es-AR, og: es_AR, name: Argentina,  currency: ARS, symbol: "$",   ready: true,  guias: guias }
es-MX: { code: es-MX, prefix: "/es-mx",  hreflang: es-MX, og: es_MX, name: México,     currency: USD, symbol: "US$", ready: false, guias: guias_es_mx }
es-ES: { code: es-ES, prefix: "/es-es",  hreflang: es-ES, og: es_ES, name: España,     currency: EUR, symbol: "€",   ready: false, guias: guias_es_es }
en:    { code: en,    prefix: "/en",     hreflang: en-US, og: en_US, name: English,    currency: USD, symbol: "US$", ready: false, guias: guias_en }
```
**`_config.yml`**: colecciones nuevas (`guias_es_mx` con `permalink: /es-mx/guias/:name/`, etc.) y `defaults` por carpeta, más específicos al final (`scope.path: "es-mx"` → `lang: es-MX`, layout según colección). `lang: es-AR` queda como default general (ya existe).

### 3.3 Textos de interfaz (`_data/i18n/*.yml`)
- **Claves planas** (`nav_servicios`, `cta_whatsapp`, `footer_legal`, `lbl_desde`, `form_*`, `space_Living`...), porque Liquid no hace deep-merge y las planas permiten el fallback a es-AR con un include:
```liquid
{%- comment -%} _includes/t.html  uso: {% include t.html k="nav_servicios" %} {%- endcomment -%}
{%- assign _l = site.data.i18n[page.lang] -%}{%- assign _d = site.data.i18n['es-AR'] -%}
{{- _l[include.k] | default: _d[include.k] -}}
```
- Los textos **largos** (cuerpo de páginas, FAQ) no van en i18n: viven en el archivo de página de cada locale (el FAQ por locale: `faq_es-MX.yml` o en el front matter de la página).
- Estos YML **no se declaran en `.pages.yml`**: Brenda no los ve ni los rompe (misma lógica que `sitio.yml`).
- Enlaces internos por `ref` (robustos a slugs distintos):
```liquid
{%- comment -%} _includes/l.html  uso: {% include l.html ref="asesoria-online" %} {%- endcomment -%}
{%- assign _all = site.pages | concat: site.documents -%}
{%- assign _p = _all | where: 'ref', include.ref | where: 'lang', page.lang | first -%}
{{- _p.url | default: '/' -}}
```
- `base.html`: `lang="{{ page.lang }}"`, `og:locale` desde `locales.yml`, el bloque hreflang genera el set `{% assign alts = _all | where: 'ref', page.ref %}` filtrado por locales con `ready: true`; si la página no tiene `ref`, solo se emite el self-link (as-is hoy).
- `header.html`/`footer.html`: nav desde i18n + switcher desde `locales.yml` (solo los `ready`).
- `schema.html`: `inLanguage`, `areaServed` (Country MX/ES/US), `priceCurrency` por locale (hoy lee `negocio.moneda`).

### 3.4 Proyectos (lo que Brenda sube en español): recomendación

**Una sola colección `_proyectos`, sin traducir, mostrada en todas las locales hispanas; en `en`/`pt-BR` solo como galería.** Cero carga para Brenda.
- **es-MX y es-ES:** `/es-mx/proyectos/` lista las mismas tarjetas (generadas con el include `proyectos.html` + `locale`), que enlazan a la URL canónica `/proyectos/<slug>/` (es-AR). Los proyectos son foto + historia; el voseo en la historia es tolerable. **No** se duplican las fichas por locale (se evitan duplicados y no hay que traducir).
- **Mejora opcional (fase 2):** un generador mínimo en `_plugins/` que cree `/es-mx/proyectos/<slug>/` como "vista" del mismo documento con `canonical` al original de AR (sin hreflang), para que el header/nav queden en el locale. Solo si el salto de nav se siente raro.
- **en y pt-BR:** el listado muestra galería con título original en español (etiqueta "Proyecto en español / Project details in Spanish") y **traduce los campos cerrados** (`space`: Living, Dormitorio... vía claves `space_*` de i18n: el select del CMS es una lista cerrada, así que se traduce solo, sin trabajo de Brenda). Los títulos y descripciones quedan en español. Esto es honesto y no ensucia el SEO.
- **Campos opcionales traducidos** (`title_en`, `summary_en`) en el CMS: **no recomendados**; cargan a Brenda y quedan vacíos. Si algún proyecto estrella merece traducción, la agrega el equipo técnico por fuera del panel.
- Importante (de `.pages.yml`): cualquier campo nuevo debe declararse allí o se pierde al guardar. Los precios por moneda sí conviene declararlos: archivo `_data/precios.yml` con tres campos numéricos ("Precio desde en pesos", "Precio desde en dólares (US$)", "Precio desde en euros (€)"), todos opcionales; si el vacío, el sitio muestra "Consultá el precio" en ese locale.

### 3.5 Guías
- Colección **por locale** (`_guias_es_mx`, ...) con layout `guia` existente. Brenda sigue editando solo `_guias` (es-AR) en el panel; las otras las mantiene el equipo técnico/agencia (no aparecen en `.pages.yml`).
- Cada guía lleva `ref:` (grupo de traducción) para emitir hreflang solo con sus equivalentes reales.
- El include `guias.html` recibe la colección según `locales[page.lang].guias`.

### 3.6 Flujo de trabajo de traducción (quién hace qué)
1. Brenda publica en español en el panel (como hoy).
2. Si el contenido tiene equivalente en otro locale: el equipo técnico crea el archivo del locale con `ref`, usa IA para el borrador de **transcreación** (adaptar, no traducir) con esta guía (sección 4) y pasa por revisión nativa.
3. `ready: true` en `locales.yml` solo al lanzar y cuando el checklist de la sección 5.3 esté completo.

### 3.7 Orden de implementación (esqueleto, 2-3 días)
1. `_data/locales.yml`, `_data/i18n/es-AR.yml` (extraer los textos hardcodeados de `header/footer/contact/faq/guias` includes), include `t.html`/`l.html`.
2. `base.html` (lang, og:locale, hreflang por `ref`), `sitemap.xml` Liquid con alternates, `schema.html` con `inLanguage`/moneda.
3. Switcher + JS de cookie + banner.
4. `functions/index.js` + `exclude`/`_routes.json`.
5. Crear es-MX (con `ready: false` primero, `noindex` mientras se revisa; luego publicar).

---

## 4. Guía de localización por locale

### 4.1 Tratamiento, tono y formato

| | es-AR | es-MX | es-ES | pt-BR | en (US) |
|---|---|---|---|---|---|
| Tratamiento | **voseo** (elegí, escribime, vos) | **tuteo** (elige, escríbeme); evitar "vos" y "vosotros"; "usted" solo en avisos legales | **tuteo** (elige, escríbeme); plural "vosotros" solo si es inevitable | **você** | you |
| Tono | cálido, cercano, directo, sin jerga | cálido y respetuoso, un grado más cortés; evitar mexicanismos de slang | cercano pero sobrio y directo, sin diminutivos excesivos | cálido, caloroso; frases curtas | claro, profesional, benefit-first |
| Moneda en el sitio | ARS "$ 25.000" + USD de referencia opcional | **"US$ 90"** (nunca "$" solo: en MX "$" es peso) | "90 €" (número, espacio, €) | R$ (si algún día se cobra en BRL) o "US$" | "$90 USD" |
| Números | 1.234,56 | **1,234.56** (coma miles, punto decimal) | 1.234,56 (sin separador en 4 cifras: 1234) | 1.234,56 | 1,234.56 |
| Fechas | 22/11/2026 | 22/11/2026 | 22/11/2026 | 22/11/2026 | 11/22/2026 o "Nov 22, 2026" |
| Medidas | m² | m² | m² | m² | **ft² con m²**: "12 m² (130 ft²)" |
| Contacto preferido | WhatsApp | **WhatsApp** (muy usado) | WhatsApp + email | WhatsApp | **email + enlace de agenda** (Calendly/Cal.com) |
| Horarios | "hora de Argentina" | indicar "hora CDMX" | indicar "hora peninsular" | "horário de Brasília" | indicar ET/PT |

Reglas transversales: las llamadas se agendan con un enlace que **convierte husos horarios solo**; siempre mostrar "tu hora local". Estaciones: AR/BR/MX central están en hemisferio sur/trópico; **España y EE.UU. son hemisferio norte** → las guías con estación (luz, ropa de cama, "renová para el verano") se invierten en fechas.

### 4.2 Tabla de vocabulario de interiorismo

| Concepto | es-AR | es-MX | es-ES | pt-BR | en-US |
|---|---|---|---|---|---|
| Sala de estar | living | sala | salón | sala de estar | living room |
| Living-comedor | living-comedor | sala-comedor | salón-comedor | sala de estar e jantar (integrada) | open-plan living/dining room |
| Dormitorio | dormitorio / habitación | recámara | dormitorio / habitación | quarto | bedroom |
| Dormitorio principal | dormitorio principal | recámara principal | dormitorio principal | suíte / quarto principal | primary bedroom |
| Armario del dormitorio | placard | clóset | armario (empotrado) | armário / guarda-roupa | closet |
| Vestidor | vestidor | vestidor / clóset vestidor | vestidor | closet | walk-in closet |
| Piso/vivienda | departamento / depto | departamento | piso / apartamento | apartamento / apê | apartment / condo |
| Vivienda de un ambiente | monoambiente | departamento tipo estudio / loft | estudio / apartamento de un ambiente | studio / kitnet* | studio apartment |
| "2 ambientes" | 2 ambientes (cuenta el living) | depa de 1 recámara | piso de 1 dormitorio | apartamento de 1 quarto | one-bedroom |
| Cocina (ambiente) | cocina | cocina | cocina | cozinha | kitchen |
| Cocina (aparato) | cocina | estufa | cocina (o placa + horno) | fogão | stove / range |
| Heladera | heladera | refrigerador | nevera / frigorífico | geladeira | refrigerator / fridge |
| Anafe | anafe / hornallas | parrilla / quemadores | placa de cocción / vitrocerámica | cooktop | cooktop / burners |
| Mesada | mesada | cubierta / encimera | encimera | bancada | countertop |
| Alacena / muebles altos | alacena | alacena / gabinetes altos | muebles altos | armários aéreos | upper cabinets |
| Baño | baño | baño | baño / aseo | banheiro / lavabo (visita) | bathroom / powder room |
| Azulejos / cerámicos | cerámicos / azulejos | azulejo / loseta | azulejos / baldosas | azulejo / revestimento | tile |
| Piso (suelo) | piso | piso | suelo | piso | floor / flooring |
| Zócalo | zócalo | zoclo | rodapié | rodapé | baseboard |
| Cielorraso | cielorraso | plafón / techo | techo | teto / forro | ceiling |
| Cortinas | cortinas (roller) | cortinas / persianas | cortinas / estores | cortinas / persianas (rolô) | curtains / blinds / roller shades |
| Alfombra | alfombra | alfombra / tapete | alfombra | tapete | rug |
| Sillón de una plaza | sillón | sillón | butaca | poltrona | armchair / accent chair |
| Sofá | sillón / sofá | sofá | sofá | sofá | sofa / couch |
| Mesa ratona | mesa ratona | mesa de centro | mesa de centro | mesa de centro | coffee table |
| Mesa de luz | mesa de luz | buró / mesita de noche | mesilla de noche | criado-mudo / mesa de cabeceira | nightstand |
| Cabecera | respaldo / cabecera | cabecera | cabecero | cabeceira | headboard |
| Lámpara de mesa | velador / lámpara de mesa | lámpara de buró | lámpara de mesa / flexo | abajur | table lamp |
| Estantería | biblioteca / estantería | librero / repisa | estantería / librería | estante / prateleira | bookshelf / shelving |
| Papel pintado | empapelado / papel tapiz | papel tapiz | papel pintado | papel de parede | wallpaper |
| Pared | pared | muro / pared | pared | parede | wall |
| Almohadón | almohadón | cojín | cojín | almofada | throw pillow |
| Manta | manta / pie de cama | cobija / manta | manta / plaid | manta | throw blanket |
| Ropa de cama | ropa de cama / blanquería | ropa de cama | ropa de cama | roupa de cama | bedding / linens |
| Balcón | balcón / terraza | balcón / terraza | balcón / terraza | varanda / sacada | balcony / patio |
| Recibidor | hall / recibidor | recibidor / vestíbulo | recibidor / entrada | hall de entrada | entryway / foyer |
| Lavadero | lavadero | cuarto de lavado | lavadero | área de serviço | laundry room |
| Mueble de TV | mueble de TV / rack | mueble para TV | mueble de TV | rack / painel de TV | TV stand / media console |
| Muebles a medida | muebles a medida | muebles a la medida | muebles a medida | móveis planejados / sob medida | custom furniture / built-ins |
| Cuadros | cuadros / láminas | cuadros | cuadros / láminas | quadros | wall art |
| Oficina en casa | escritorio / home office | oficina en casa / home office | despacho / zona de trabajo | home office | home office |
| Renovar / reformar | renovar / refaccionar | remodelar | reformar | reformar | remodel / renovate |
| **"Sin obra"** | sin obra | sin obra / sin remodelar | **sin obras / sin reformas** | sem obra / sem reforma | no renovation / no construction / renter-friendly |
| Profesional | decoradora / diseñadora de interiores | diseñadora de interiores / decoradora | **interiorista** / decoradora | designer de interiores / decoradora | interior designer (cuidar: título regulado en algunos estados) → "online decorator / design consultant" |
| Online | online | **en línea** / online | online | online | online / virtual |
| Asesoría | asesoría / asesoramiento | asesoría | asesoramiento / asesoría | consultoria | consultation / consulting |
\* "kitnet" en Brasil connota unidad mínima de bajo costo; "studio" es el término de mercado medio/alto.

Notas de uso:
- **Atención con falsos amigos:** "piso" (AR/MX suelo; ES vivienda); "cocina" (aparato en AR/ES = en MX "estufa"); "balda" (ES) vs "estante"; "sala" (MX living; ES "sala" suena a sala de reuniones/espectáculos).
- `papel pintado` es el slug actual de `/servicios/papel-pintado-y-revestimientos/`: en AR la gente busca **"empapelado"** y **"papel tapiz"**; es-ES **sí** usa "papel pintado". Revisar keywords en la versión AR (no depende de esta localización).
- `space` del CMS (lista cerrada): Living, Comedor, Living comedor, Dormitorio, Cocina, Baño, Escritorio, Recibidor, Balcón o terraza, Monoambiente, Habitación infantil, Casa completa, Otro → mapear a `space_*` en cada i18n con la tabla anterior (Living → sala/salón/living room, etc.).

### 4.3 Keywords objetivo (top 10 por mercado) [orientativas: validar volumen en Keyword Planner/Search Console antes de comprometer contenido]

**es-AR:** asesoría de interiorismo online · decoradora de interiores online · asesoramiento de decoración online · cuánto cuesta una asesoría de interiorismo · cómo decorar un living chico · colores para el living · decorar un monoambiente · decoración de departamento chico · empapelado / papel tapiz · renovar la casa sin obra.

**es-MX:** asesoría de interiorismo en línea · diseñadora de interiores en línea · decoración de interiores online · asesoría de decoración de casa · cómo decorar una sala pequeña · colores para sala · decoración de recámara · decoración de departamento pequeño · diseño de interiores sin remodelar · cuánto cobra una diseñadora de interiores.

**es-ES:** interiorista online · asesoramiento de decoración online · diseño de interiores online · decorar un salón pequeño · colores para el salón · decorar un piso pequeño / de alquiler · decoración de dormitorio · home staging (servicio y consultas) · interiorismo sin obras / sin reformas · cuánto cuesta un interiorista.

**en (US):** online interior design · virtual interior design / e-design · online interior designer · virtual decorating consultation · how much does an online interior designer cost · how to decorate a small living room · living room color palette ideas · studio apartment decorating ideas · renter-friendly decorating · interior designer who speaks Spanish / diseñadora de interiores en español.

**pt-BR (fase 3, referencia):** consultoria de decoração online · decoração online · designer de interiores online · projeto de decoração online · como decorar sala pequena · cores para sala · decoração de apartamento pequeno · decorar sem obra / sem reforma · quanto custa um designer de interiores · decoração de kitnet / studio.

### 4.4 Patrones de meta title (≤ 60 caracteres, marca al final, `|`)

| Plantilla | es-AR | es-MX | es-ES | en | pt-BR |
|---|---|---|---|---|---|
| Home | Asesoría de interiorismo online y presencial \| BRENBE | Asesoría de interiorismo en línea \| BRENBE | Interiorista online: renueva tu casa sin obras \| BRENBE | Online Interior Design, No Renovation Needed \| BRENBE | Consultoria de decoração online \| BRENBE |
| Asesoría online | Asesoría de interiorismo online sin obra \| BRENBE | Asesoría de diseño de interiores en línea, sin obra \| BRENBE | Asesoramiento de interiorismo online, sin reformas \| BRENBE | Online Interior Design Consultation \| BRENBE | Consultoria de decoração online, sem obra \| BRENBE |
| Servicio | {Servicio}: asesoría online | BRENBE | {Servicio} en línea: sala, recámara... \| BRENBE | {Servicio} online para tu piso \| BRENBE | {Service}: Virtual Design Help \| BRENBE | {Serviço} online \| BRENBE |
| Guía | {Título} | BRENBE | igual con vocabulario local | igual | igual | igual |
| Proyecto | {Título} | Proyecto de interiorismo | BRENBE (ya existe) | idem (solo AR, ver 3.4) | idem | -- | -- |
Reglas: keyword principal al inicio; **diferenciar** el `<title>` y la `<meta description>` de cada locale aunque la página sea parecida (señal anti-duplicado); la description lleva el precio "desde" en moneda local si existe y el verbo de acción local ("Reservá" AR, "Reserva" MX/ES).

---

## 5. Alcance de contenido por locale

### 5.1 Fase 1 (por cada locale, es-MX primero)
Páginas (transcreadas, no traducidas):
1. Home.
2. Asesoría online (**la página de dinero**; precio "desde", cómo funciona, horarios en hora local, FAQ local).
3. Servicios: hub + **2 servicios** estrella (asesoría de color y "deptos chicos/pisos pequeños" localizado) → luego los otros 3.
4. Sobre Brenda (misma historia; resaltar "diseño desde Argentina, atención en tu huso horario" y credenciales).
5. Contacto (WhatsApp + enlace de agenda; email para en).
6. Listado de proyectos (según 3.4) y aviso legal/privacidad cuando aplique (ES: aviso legal y privacidad; MX: aviso de privacidad).
Resultado: ~6-8 URLs por locale, todas con equivalente hreflang en es-AR.

### 5.2 Guías: ¿adaptar las 4 existentes o escribir específicas?
Las 4 guías actuales son: `colores-para-living`, `como-decorar-un-living-chico`, `como-decorar-un-monoambiente`, `cuanto-cuesta-una-asesoria-de-interiorismo`.
- **Las 3 "evergreen" (colores, living/sala chica, monoambiente): transcrear**, no traducir: cambia título y keyword (sala/salón/estudio), vocabulario, ejemplos de metros y mobiliario local, estaciones/luz del hemisferio, marcas y tiendas de referencia, y FAQ (`faq:` del front matter). Hacerlo bien las convierte en contenido original por mercado.
- **"Cuánto cuesta una asesoría"**: **escribirla de nuevo por mercado**, con rangos del mercado local y el precio de Brenda en la moneda correspondiente; es la guía de intención comercial más fuerte y no se traduce.
- **1 guía nueva específica por locale** en la primera tanda: ES → "Cómo decorar un piso de alquiler sin obras" y "Home staging: qué es y si vale la pena"; MX → "Cómo decorar un departamento pequeño (guía para CDMX/MTY)" o "Colores para sala con mucha luz/calor"; en → "Renter-friendly decorating" y "How an online design consultation works".
- Cantidad: **2 guías por locale al lanzar** (cuánto cuesta + la de mayor intención local), el resto a ritmo mensual. No lanzar con guías mal localizadas: peor que no tenerlas.
- Calidad: borrador IA + revisión nativa; añadir imágenes con alt localizado; no copiar `faq` literal.

### 5.3 Checklist de lanzamiento por locale (para poner `ready: true`)
- [ ] Páginas transcreadas, vocabulario y moneda verificados por nativa/o.
- [ ] Precio "desde" cargado en `precios.yml` (o "consultá").
- [ ] Cobro habilitado y condiciones breves publicadas.
- [ ] Horarios en hora local + enlace de agenda.
- [ ] hreflang recíproco y sitemap verificados (Search Console > Internacional no está, usar Inspección de URL y rastreador tipo Screaming Frog).
- [ ] `<html lang>`, og:locale, schema con `areaServed`/`inLanguage`.
- [ ] Aviso legal/privacidad del mercado.
- [ ] Switcher y banner funcionando; Function (si se usa) probada y Googlebot verificado.
- [ ] Alta de la propiedad con filtro/segmento por país en Search Console y evento de analítica por `locale`.

### 5.4 Medición y decisiones de seguimiento
- Search Console: informe por país; reglas de gate (1.6). Medir conversión (clics a WhatsApp/contacto) **por locale**.
- A los 90 días de cada locale: si no hay ni 1 consulta cualificada ni crecimiento de impresiones, **no escalar guías**; consolidar o bajar prioridad.
- Redes: Pinterest e Instagram pesan mucho en decoración en MX/ES/EE.UU./BR; adaptar el calendario de contenidos por mercado en vez de repostear el mismo.

### 5.5 Riesgos y mitigaciones
| Riesgo | Mitigación |
|---|---|
| Google agrupa es-AR/MX/ES como duplicados | Transcreación real, hreflang correcto, titles/descriptions distintos |
| Redirect daña indexación | Solo `/`, sin bots, 302, cookie, banner como mecanismo principal |
| Brenda no puede atender un mercado | Gate de idioma/cobro; pt-BR en NO-GO |
| Calidad de copy "traducido" | Revisión nativa obligatoria |
| Costo de cobro (2-10 %) | Cuenta EUR/USD por transferencia, ajustar el "desde" |
| Cambio de normativa cambiaria/fiscal | Contador antes de lanzar Fase 1 |
| Carga de mantenimiento | Solo contenido que se mantiene; `ready:false` para lo que no se atienda |
