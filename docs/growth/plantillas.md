# Plantillas de contenido (guía para quien escribe las páginas)

Todo vive dentro de las **guías** (`_guias/`, `_guias_es_mx/`, `_guias_es_es/`, `_guias_en/`, `_guias_pt_br/`): mismo layout `guia`, mismas URLs `/guias/<archivo>/`, mismo hreflang (`ref:`) y mismo sitemap. Cada plantilla es un conjunto de **campos opcionales del front matter**; la guía muestra solo los bloques que existan, siempre en este orden:

`portada` → `respuesta` → `definicion`/`claves` (estilo) → `galeria` → `paleta` → **texto (Markdown)** → `como_lograrlo` → `lista` → `errores` → CTA doble (asesoría + WhatsApp) → FAQ → "Más en este tema" → "Seguí leyendo".

Las páginas se escriben a mano (git); Brenda no ve estos campos en el panel (están declarados como `hidden` en `.pages.yml` para que no se pierdan si ella edita la guía).
Reglas del repo: nada de precios, códigos de pintura, testimonios ni proyectos que Brenda no haya confirmado. Alt de las fotos: 80-125 caracteres, sin "imagen de".

## 1. Temas (hubs)

- Definición de temas, slugs y textos por idioma: `_data/hubs.yml` (hoy: depto-chico, color-y-paletas, decorar-alquilando, presupuesto; fase 2-3: iluminacion, empapelado, ideas-por-ambiente, estilos).
- En cada guía: `hub: depto-chico` y `role: pilar` (la guía larga y definitiva; una por tema) o `role: cluster` (default).
- La página del tema (`/guias/depto-chico/`, `/es-mx/guias/departamento-pequeno/`...) **se genera sola** en cada idioma que tenga **al menos 2 guías publicadas** de ese tema (`min_guides` en `hubs.yml`). Con menos, no existe ni entra al sitemap. Muestra el pilar primero, luego las demás, cierra con CTA y lleva `CollectionPage` + `ItemList` + migas.
- La guía muestra "Más en este tema" y las migas `Inicio / Guías / Tema / Guía` solo cuando la página del tema existe en su idioma.
- Slugs por idioma (carpeta de guías de cada idioma + slug):

| Tema | es-AR `/guias/` | es-MX `/es-mx/guias/` | es-ES `/es-es/guias/` | en `/en/guides/` | pt-BR `/pt-br/guias/` |
|---|---|---|---|---|---|
| depto-chico | depto-chico | departamento-pequeno | piso-pequeno | small-apartment | apartamento-pequeno |
| color-y-paletas | color-y-paletas | color-y-paletas | color-y-paletas | color-and-palettes | cores-e-paletas |
| decorar-alquilando | decorar-alquilando | decorar-rentando | decorar-de-alquiler | renter-friendly-decorating | decorar-alugando |
| presupuesto | presupuesto | presupuesto | presupuesto | budget | orcamento |
| iluminacion | iluminacion | iluminacion | iluminacion | lighting | iluminacao |
| empapelado | empapelado | papel-tapiz | papel-pintado | wallpaper | papel-de-parede |
| ideas-por-ambiente | ideas-por-ambiente | ideas-por-espacio | ideas-por-estancia | room-ideas | ideias-por-ambiente |
| estilos | estilos | estilos | estilos | styles | estilos |

 Hoy solo `depto-chico` tiene 2 guías publicadas por idioma (color, presupuesto y alquilar tienen 1 o ninguna: aparecen solos al publicar la segunda).
- Un slug de tema no puede coincidir con el nombre de un archivo de guía (el build falla con un mensaje claro).

```yaml
hub: color-y-paletas
role: pilar
```

## 2. Bloques comunes

```yaml
respuesta: "40-60 palabras: la respuesta directa, citable por buscadores y asistentes de IA."
cover: /media/guias/abc123.jpg
cover_alt: "Living de 25 m² con sofá oliva y mesa ratona de nogal; ventana al norte"
cover_caption: "Epígrafe visible bajo la portada (opcional)."
og_image: /media/guias/og-living.jpg     # opcional: imagen 1200x630 propia para redes; si falta usa cover
```

Foto con epígrafe visible **dentro del texto** (Markdown):

```liquid
{% include fig.html src="/media/guias/abc123.jpg" alt="Qué se ve" caption="Por qué funciona" %}
```

## 3. Idea (`tipo: idea`)

Galería + "cómo lograrlo" + lista + errores. CTA doble ya viene en toda guía.

```yaml
tipo: idea
respuesta: "..."
galeria:                       # 6-12 fotos; el epígrafe explica POR QUÉ funciona (también va al botón "Guardar" de Pinterest)
  - { image: /media/guias/a1.jpg, alt: "Descripción factual", caption: "La alfombra grande une el sillón y la mesa." }
como_lograrlo:                 # pasos; `grupo` (opcional) agrupa con subtítulo
  - { titulo: "Empezá por la luz.", texto: "Un aplique enchufable sobre el sillón.", grupo: "Sin obra" }
lista:                         # lo que necesitás (checklist imprimible)
  titulo: "Lo que necesitás"   # opcional
  items:
    - { texto: "Lámpara de pie de luz cálida" }
    - { texto: "Alfombra 160 x 230", rango: "US$ 60-120", nota: "Rango confirmado por Brenda, nov. 2026" }   # rango SOLO si Brenda lo confirma
    - { texto: "Cortina de lino", link: "https://...", afiliado: true }   # afiliado: rel="sponsored" + aviso automático
errores:
  - "Poner la alfombra solo debajo de la mesa ratona."
  - { titulo: "Pintar sin probar.", texto: "La luz cambia el color." }
```

## 4. Paleta (`tipo: paleta`)

Muestras dibujadas en HTML/CSS (texto indexable, no una imagen). El texto del hex se pinta en oscuro o blanco según el **contraste WCAG** y se muestra la etiqueta (`AAA · 7.9:1`, con texto equivalente para lectores de pantalla). Botón "Copiar #HEX" y "Imprimir paleta" (aparecen con JavaScript; sin JS la página sigue completa). Al imprimir salen solo las muestras, con sus colores.

```yaml
tipo: paleta
paleta:
  titulo: "Paleta cálida para un living chico"   # opcional
  intro: "Cinco colores que se llevan bien con la madera de nogal."
  aviso: "..."                  # opcional; por defecto: "el color cambia según pantalla, luz y lote"
  imagen: /media/guias/moodboard.jpg      # opcional (moodboard o render; rotular como visualización)
  imagen_alt: "Moodboard con..."
  colores:                      # nombre y hex alcanzan; el resto es opcional
    - { nombre: "Arena", hex: "#E8DCC8", rol: "Base", peso: 60, uso: "Paredes y techo." }
    - nombre: "Oliva"
      hex: "#555B3A"
      rol: "Secundario"
      peso: 30
      pintura: { marca: "Alba", nombre: "…", codigo: "…" }   # SOLO códigos verificados en el país/idioma de la página
```

- `peso` (60/30/10) dibuja la barra de proporción. `pintura` es opcional por color: no inventes códigos; si no lo verificaste, omitilo.
- Schema: `ItemList` con cada color. `Article.image` incluye `paleta.imagen`.
- **No se genera PNG/PDF descargable** (decisión: complejidad). Alternativas incluidas: copiar hex + vista de impresión (se puede "Guardar como PDF" desde el navegador). El PDF de marca es el lead magnet (`/guia-de-paletas/`).

## 5. Estilo (`tipo: estilo`)

```yaml
tipo: estilo
definicion: "Japandi: calma japonesa + calidez nórdica, en dos líneas."
claves:                         # 5 señales reconocibles
  - "Madera clara y natural."
  - { titulo: "Pocos objetos.", texto: "Cada uno con lugar." }
paleta: { colores: [ ... ] }    # opcional, mismo bloque que arriba
como_lograrlo:
  - { grupo: "En un depto chico", titulo: "...", texto: "..." }
  - { grupo: "Si alquilás", titulo: "...", texto: "..." }
errores: [ "..." ]
faq: [ { q: "...", a: "..." } ]
```
El texto del estilo no puede ser una plantilla con huecos: cada página con criterio propio (plan de contenido, 1.4).

## 6. Antes y después (casos)

No hay campos nuevos: sale de `_proyectos/` (lo que carga Brenda). En la "galería" del proyecto, las fotos marcadas **Antes** / **Después** se emparejan en orden (1.ª antes con 1.ª después...) y se muestran en un comparador:

- sin JavaScript (o al imprimir): las dos fotos lado a lado, cada una con su etiqueta;
- con JavaScript: control deslizante accesible (`<input type=range>`, teclado y lector de pantalla) y arrastre con el dedo/mouse.

Las fotos emparejadas salen de la galería general; el resto queda en la grilla. La tarjeta del proyecto en `/proyectos/` lleva la etiqueta "Antes y después". Epígrafes: campo `caption` en cada foto de `gallery` (solo a mano, no está en el panel); se usa el de la foto "después" (o el de "antes").
Schema: `CreativeWork` con `ImageObject` (caption, creator). No hay `Review`/`AggregateRating`.

## 7. Glosario (opcional)

Página con `layout: glosario` (cada idioma su archivo, con `ref: glosario`):

```yaml
---
layout: glosario
locale: es-ar
ref: glosario
title: "Glosario de decoración"
description: "..."
last_modified_at: 2026-11-22
breadcrumb: "Glosario"
terminos:
  - { termino: "Regla 60-30-10", definicion: "Reparto de color: 60 % base, 30 % secundario, 10 % acento.", link: /guias/colores-para-living/ }
---
Texto introductorio opcional.
```
Cada término tiene ancla (`#regla-60-30-10`) y sale como `DefinedTermSet`/`DefinedTerm`. No se publicó ninguna página de glosario: crearla cuando haya 15-20 términos.

## 8. Imágenes (SEO)

- Nombre de archivo del panel: **se mantiene `rename: random`** en `.pages.yml`. Pages CMS solo admite `false | 'safe' | 'random'` (no plantillas de nombre) y `safe` solo pasa a minúsculas/guiones el nombre del celular (IMG_0001) y puede chocar. Para un nombre descriptivo, el dev renombra al publicar (`living-chico-sofa-oliva-nogal.webp`) o usa imágenes de la raíz con `_data/imagenes.yml`.
- `alt` obligatorio y descriptivo; `caption` visible donde la plantilla lo permita; `data-pin-description` sale solo (del epígrafe o, si no hay, del alt) en todas las imágenes de contenido.
- Sitemap: `<image:image>` por cada URL de guía/proyecto (cover, galería, imagen de paleta).
- Open Graph por guía: `cover` (o `og_image` si querés una de 1200x630). `og:type=article`, `article:published_time`, `article:modified_time`, `article:section`, `og:site_name` (Rich Pins de Pinterest).

## 9. Cómo probar

```bash
bundle exec jekyll build && python3 docs/check-hreflang.py && node tests/function-redirect.test.mjs
```
Para ver una guía nueva en local: `bundle exec jekyll serve`.
