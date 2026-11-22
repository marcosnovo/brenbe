# Guía para quienes escriben contenido por idioma

Idiomas: es-AR (raíz, ya publicado), es-MX `/es-mx/`, es-ES `/es-es/`, en `/en/`, pt-BR `/pt-br/`.
Las páginas ya existen como **borradores** (`ready: false`, noindex, fuera del sitemap y de hreflang). Tu trabajo es reescribir el contenido (transcrear, no traducir) y publicar.
Vocabulario, tono, moneda, keywords y patrones de título: `docs/localizacion-estrategia.md` (sección 4). Todo el sitio se excluye de Jekyll en `docs/`.

## Archivos por idioma

| Ref | es-AR (referencia) | es-MX | es-ES | en | pt-BR |
|---|---|---|---|---|---|
| home | `/` | `es-mx/index.html` | `es-es/index.html` | `en/index.html` | `pt-br/index.html` |
| asesoria-online | `/asesoria-de-interiorismo-online/` | `es-mx/asesoria-de-diseno-de-interiores-en-linea/` | `es-es/interiorismo-online/` | `en/online-interior-design-consultation/` | `pt-br/consultoria-de-decoracao-online/` |
| servicios | `/servicios/` | `es-mx/servicios/index.html` | `es-es/servicios/index.html` | `en/services/index.html` | `pt-br/servicos/index.html` |
| servicio-color | `/servicios/asesoria-de-color/` | `.../asesoria-de-color.md` | `.../asesoramiento-de-color.md` | `.../color-consultation.md` | `.../consultoria-de-cores.md` |
| servicio-empapelado | `/servicios/empapelado-y-revestimientos/` | `.../papel-tapiz-y-recubrimientos.md` | `.../papel-pintado-y-revestimientos.md` | `.../wallpaper-and-wall-coverings.md` | `.../papel-de-parede-e-revestimentos.md` |
| servicio-mobiliario | `/servicios/mobiliario-y-distribucion/` | `.../muebles-y-distribucion.md` | `.../mobiliario-y-distribucion.md` | `.../furniture-and-layout.md` | `.../moveis-e-distribuicao.md` |
| servicio-iluminacion | `/servicios/iluminacion-textiles-y-styling/` | `.../iluminacion-textiles-y-styling.md` | `.../iluminacion-textiles-y-styling.md` | `.../lighting-textiles-and-styling.md` | `.../iluminacao-texteis-e-styling.md` |
| servicio-deptos | `/servicios/decoracion-de-monoambientes-y-deptos-chicos/` | `.../decoracion-de-departamentos-pequenos.md` | `.../decorar-pisos-pequenos.md` | `.../small-apartment-and-studio-decorating.md` | `.../decoracao-de-apartamento-pequeno-e-studio.md` |
| sobre-brenda | `/sobre-brenda/` | `es-mx/sobre-brenda/` | `es-es/sobre-brenda/` | `en/about-brenda/` | `pt-br/sobre-a-brenda/` |
| contacto | `/contacto/` | `es-mx/contacto/` | `es-es/contacto/` | `en/contact/` | `pt-br/contato/` |
| proyectos | `/proyectos/` | `es-mx/proyectos/` | `es-es/proyectos/` | `en/projects/` | `pt-br/projetos/` |
| guias (índice) | `/guias/` | `es-mx/guias/` | `es-es/guias/` | `en/guides/` | `pt-br/guias/` |

Los servicios viven en la carpeta del hub de servicios de cada idioma (`es-mx/servicios/`, `en/services/`, `pt-br/servicos/`...). Los slugs se pueden cambiar (cambiá el `permalink:`; el `ref` no se toca).

**Guías** (mientras la home del idioma no esté publicada, poné `ready: false` en cada guía): una colección por idioma, fuera del panel de Brenda: `_guias_es_mx/`, `_guias_es_es/`, `_guias_en/`, `_guias_pt_br/`. URLs: `/es-mx/guias/<archivo>/`, `/es-es/guias/…`, `/en/guides/…`, `/pt-br/guias/…`. Usan el layout `guia` (se asigna solo) y el mismo front matter que las de es-AR (`title`, `description`, `category`, `date`, `updated`, `cover`, `cover_alt`, `related: [archivos de guías de ese idioma]`, `faq`). Para que sean equivalentes de una guía es-AR, agregá `ref: <nombre del archivo de la guía es-AR sin .md>` (p. ej. `ref: colores-para-living`). Sin `ref` la guía queda sola en su idioma (solo hreflang propio).

**FAQ global** del idioma (si la página no define `faq:`): `_data/faq_es_mx.yml`, `faq_es_es.yml`, `faq_en.yml`, `faq_pt_br.yml`, con la misma forma que `_data/faq.yml` (`items: [{q, a}]`).

**Textos de interfaz** (menú, pie, botones, mensajes de WhatsApp, fechas, nombres de ambientes): `_data/i18n/<idioma>.yml`. Ya están completos; ajustalos ahí, no en las plantillas. Lo que falte cae al texto es-AR.

**Precios**: es-AR sale de "Mis datos" (Pages CMS). El resto, de `_data/precios.yml` (`usd` para es-MX y en, `eur` para es-ES, `brl` para pt-BR; solo el número). En una página: `{% include precio.html %}{{ price_label }}` ("Desde US$ 90" o "Consulta el precio").

## Front matter (contrato)

```yaml
layout: base | servicio        # servicio solo para las 5 páginas de servicio
locale: es-mx                   # es-ar | es-mx | es-es | en | pt-br  (obligatorio)
ref: servicio-color             # id del grupo de traducción: igual en todos los idiomas (NO cambiar)
ready: false                    # true = publicada (ver abajo)
title / seo_title               # seo_title ≤ 60 caracteres, keyword al inicio, marca al final: "… | BRENBE"
description                     # distinta de las demás versiones; con el precio desde si existe
last_modified_at: 2026-11-22    # fecha del último cambio real (va al sitemap)
breadcrumb: "Nombre corto"      # migas + BreadcrumbList; breadcrumb_parents: [{name, url}] para servicios
permalink: /es-mx/…/
# banderas de schema: schema_service: true (+ service_name/service_type/service_description/service_price: false),
# faq_schema: true (usa faq de la página o la FAQ global del idioma), collection_page: true | guias
# index_when: [...] / index_when_any: [...] (páginas que dependen de datos de Brenda)
```

Enlaces internos: `{% include l.html ref='asesoria-online' %}` devuelve la URL de esa página en el idioma actual. Textos de interfaz: `{% include t.html k="nav_servicios" %}`.

## Cómo se publica una página

Una página sale en sitemap/hreflang cuando `ready` NO es `false` **y** el idioma tiene `ready: true` en `_data/locales.yml` (hoy todos lo tienen; es el interruptor para apagar un idioma entero).

1. Reescribí el contenido y borrá **todos** los marcadores `TODO(i18n)`.
2. Cambiá `ready: false` por `ready: true` (o borrá la línea).
3. `bundle exec jekyll build && python3 docs/check-hreflang.py` debe terminar en `OK` (reciprocidad, canonical, sitemap, JSON-LD, enlaces; falla si queda un `TODO(i18n)` en una página publicada).

El idioma aparece en el selector, el banner y la redirección de la home **solo cuando su home (`ref: home`) está publicada**. Publicá primero home + asesoría online + contacto; el resto cuando esté listo. Hasta entonces el sitio se ve exactamente como hoy.

Antes de lanzar un idioma: checklist de la sección 5.3 de la estrategia (precio, cobro, aviso legal, horarios locales, revisión nativa).

## Proyectos

Son una sola colección en español (la carga Brenda). En los otros idiomas el listado muestra las tarjetas con el tipo de ambiente traducido (`spaces:` en `_data/i18n`) y enlaza a la URL original es-AR. No se traducen las fichas.

## Redirección automática (Cloudflare)

`functions/index.js` solo responde a `GET /`: primera visita, sin cookie `brenbe_loc`, no bots, con Accept-Language compatible, país mapeado y idioma publicado (`/locales.json`): 302 al idioma. `?nolang` la desactiva. Prueba: `node tests/function-redirect.test.mjs`. Verificar con "Inspección de URL" de Search Console que Googlebot ve `/` sin redirección.

## Temas (hubs) y plantillas de guía

Cada guía puede llevar `hub:` y `role: pilar|cluster` (ver `_data/hubs.yml`). La página del tema se genera sola en cada idioma con al menos 2 guías publicadas de ese tema (slugs y textos por idioma en `hubs.yml`). Plantillas de paleta, idea, estilo, antes/después y glosario: `docs/growth/plantillas.md`. Medición de clics a WhatsApp y UTM: `docs/growth/utm.md`. Páginas de la guía de paletas (lead magnet): `ref: guia-de-paletas`, todas con `ready: false` y marcador `TODO(i18n)` hasta tener el PDF.
