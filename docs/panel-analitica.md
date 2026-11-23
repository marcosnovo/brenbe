# Panel de estadísticas privado (`brenbe.com/panel/`)

Una página privada donde Brenda y Marcos ven cuánta gente entra a la web, de dónde llega y qué mira. Funciona con **Cloudflare Web Analytics** (gratis, sin cookies) y está protegida con **Cloudflare Access** (se entra con un código que llega por mail). Solo hace falta hacer esta configuración **una vez**, en el panel de Cloudflare.

## Cómo funciona (resumen)

- `/panel/` es una página estática; pide los números a `/panel/api/stats` (una Function de Cloudflare Pages).
- **Access** frena a cualquiera que no esté en la lista de mails. Además, la Function vuelve a comprobar la identidad (`Cf-Access-Jwt-Assertion`): si falta configuración, responde "El panel todavía no está configurado" y **nunca** muestra datos.
- La Function consulta la API GraphQL de Cloudflare con un token de solo lectura y guarda el resultado 5 minutos.
- No se enlaza desde el sitio público. Solo hay un enlace "Ver estadísticas de la web" en `/admin/` (la ayuda de Brenda, que no se indexa). `/panel/` lleva `noindex`, `Disallow` en robots.txt y `Cache-Control: private, no-store`.

## Antes de empezar

Necesitás: la cuenta de Cloudflare donde está `brenbe.com`, y los mails de las personas que van a entrar (Marcos y Brenda). Ya tiene que estar activado Web Analytics (ver `docs/growth/utm.md`: si "no se mide nada", primero hay que cargar el token en `_data/sitio.yml`).

## Paso 1. Confirmar Web Analytics y copiar el Site Tag

1. Entrá a <https://dash.cloudflare.com> y elegí la cuenta.
2. Menú izquierdo: **Analytics & logs** → **Web analytics**.
3. Tiene que aparecer el sitio **brenbe.com**. Si no aparece: **Add a site** → escribí `brenbe.com` → seguí los pasos (ver `docs/growth/utm.md`, opción A) y esperá unas horas a que haya visitas.
4. Hacé clic en **brenbe.com** (o en **View metrics**) para abrir sus estadísticas.
5. Mirá la barra de direcciones del navegador: la URL incluye `siteTag~in=XXXXXXXX…`. Ese valor (letras y números, hasta el próximo `&` si lo hay) es el **Site Tag**. Copialo: lo usás en el paso 3 como `CF_SITE_TAG`.
   - **No** es el `token` del código JS (*Manage site* → *JS Snippet*): ese token es otro identificador y sirve para `_data/sitio.yml` → `cloudflare_analytics_token`, no para el panel.

## Paso 2. Crear el token de la API (solo lectura)

1. Arriba a la derecha: el ícono de tu perfil → **My Profile** → **API Tokens** (o directo: <https://dash.cloudflare.com/profile/api-tokens>).
2. **Create Token** → bajá hasta **Create Custom Token** → **Get started**.
3. *Token name*: `brenbe-panel-analitica`.
4. En **Permissions** elegí, en tres desplegables: **Account** → **Account Analytics** → **Read**.
5. *Account Resources*: **Include** → **Specific account** → tu cuenta (la de brenbe.com).
6. (Opcional) *Client IP Address Filtering* y *TTL*: dejalo vacío.
7. **Continue to summary** → **Create Token**.
8. Copiá el token que aparece (**se muestra una sola vez**). Lo usás en el paso 3 como `CF_ANALYTICS_TOKEN`.
   - Nunca lo pegues en el repositorio, en mails ni en chats.

## Paso 3. Cargar las variables en Cloudflare Pages

Primero hacé el **paso 4** (Access) hasta copiar el *Application Audience (AUD) Tag*, porque hace falta para dos de estas variables; o cargá estas ahora y volvé a completar `ACCESS_AUD` después.

1. **Workers & Pages** → proyecto **brenbe** → pestaña **Settings** → **Variables and Secrets** (en algunas cuentas: **Environment variables**).
2. **Add** y cargá, en el entorno **Production**:

| Nombre | Tipo | Valor |
|---|---|---|
| `CF_ANALYTICS_TOKEN` | **Secret** (Encrypt) | el token del paso 2 |
| `CF_ACCOUNT_ID` | Text | `18acd12c36831ec676523250b2308d23` |
| `CF_SITE_TAG` | Text | el Site Tag del paso 1 |
| `ACCESS_TEAM_DOMAIN` | Text | tu *team domain* de Zero Trust, p. ej. `brenbe` o `brenbe.cloudflareaccess.com` (paso 4.2) |
| `ACCESS_AUD` | Text | el *Application Audience (AUD) Tag* del paso 4 |

3. **Save**. (Si la cuenta tiene Preview, no hace falta cargarlas ahí.)

## Paso 4. Proteger `/panel` con Cloudflare Access

1. Menú izquierdo: **Zero Trust** (si es la primera vez te pide elegir un *team name* y el plan **Free**: sirve hasta 50 personas; puede pedir una tarjeta de verificación, no cobra).
2. **Settings** → **Custom pages**/**General**: ahí se ve el **Team domain** (`algo.cloudflareaccess.com`). Anotalo: es `ACCESS_TEAM_DOMAIN`.
3. Menú: **Access** → **Applications** → **Add an application** → **Self-hosted**.
4. *Application name*: `Panel BRENBE`. *Session duration*: `24 hours` (o más, p. ej. `1 month` para que Brenda no tenga que entrar siempre).
5. **Add public hostname** (o *Application domain*):
   - Domain: `brenbe.com`
   - Path: `panel*`  (cubre `/panel/` y `/panel/api/stats`)
6. En **Access policies** → **Create new policy**:
   - *Policy name*: `Dueños`
   - *Action*: **Allow**
   - *Include* → *Selector*: **Emails** → escribí los mails permitidos (Marcos y Brenda), uno por uno.
7. En **Login methods** dejá marcado solo **One-time PIN** (el código que llega por mail). Desmarcá los demás si aparecen.
8. **Next** → **Save** (puede decir "Add application" / "Create").
9. Abrí la aplicación recién creada → **Overview** y copiá el **Application Audience (AUD) Tag** (una cadena larga de letras y números). Es `ACCESS_AUD` (paso 3).

## Paso 5. Volver a publicar

Las variables nuevas se aplican en el **próximo despliegue**:

1. **Workers & Pages** → **brenbe** → **Deployments** → en el último despliegue de **Production**, menú **⋯** → **Retry deployment** (o hacé cualquier cambio en `main`).
2. Esperá a que diga **Success**.
3. Abrí `https://brenbe.com/panel/` en una ventana privada: pide tu mail → llega un código de 6 dígitos (revisá Spam) → entrás y se ven los números.

**Si algo falla:**
- *"El panel todavía no está configurado"*: falta alguna variable (paso 3) o no se redesplegó (paso 5).
- *"No pudimos cargar los números"*: token, cuenta o Site Tag mal copiados. Para ver el detalle técnico (estando logueado) abrí `https://brenbe.com/panel/api/stats?days=30&debug=1` y mirá el campo `graphql.errors`.
- Todo en cero: la web recién empezó a medir; esperá unas horas. Revisá que `cloudflare_analytics_token` esté cargado en `_data/sitio.yml` (y que no haya dos beacons).
- *"Tu sesión venció"*: recargar la página y volver a poner el mail.

## Paso 6. Agregar o quitar personas

1. **Zero Trust** → **Access** → **Applications** → **Panel BRENBE** → **Edit** → pestaña **Policies** → editá la política **Dueños**.
2. En *Include → Emails* agregá o quitá mails. **Save**.
3. Para sacar a alguien ya mismo: **Zero Trust** → **Access** → **Users** (o *Logs*) → revocar su sesión; o esperá a que venza la duración de la sesión.
4. No hace falta tocar el código ni redesplegar.

## Qué muestra y cómo se calcula

- **Visitas**, **Páginas vistas** y su comparación con el período anterior de la misma duración.
- **Clics a WhatsApp**: visitas a las páginas `/wa/<origen>/` (ver `docs/growth/utm.md`); el origen es la página desde donde tocaron el botón. No se suman a "Páginas vistas".
- **¿De dónde llegan?**: según el *referer*: Google, Pinterest, Instagram, Facebook, WhatsApp, Directo (sin referer) y Otros. Cloudflare no lee UTM (ver `docs/growth/utm.md`).
- **Idioma de la web**: por prefijo de la ruta (`/es-mx/`, `/es-es/`, `/en/`, `/pt-br/`; el resto es es-AR).
- Los títulos de las páginas salen de `/panel/pages.json`, que se genera en cada build.

## Para el equipo técnico

- Variables: `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `CF_ACCOUNT_ID`, `CF_SITE_TAG`, `CF_ANALYTICS_TOKEN` (secreto).
- `_routes.json`: las Functions solo corren en `/` y `/panel/api/*`.
- Tests: `node tests/panel-stats.test.mjs` (JWT RS256 firmado en el test, GraphQL y JWKS simulados) y `node tests/function-redirect.test.mjs`.
- La consulta usa el dataset `rumPageloadEventsAdaptiveGroups` (filtros `siteTag`, `datetime_geq`, `datetime_lt`; dimensiones `date`, `requestPath`, `refererHost`, `countryName`, `deviceType`; `sum { visits }`). Si Cloudflare cambia un nombre de campo, `?debug=1` devuelve el error de GraphQL.
