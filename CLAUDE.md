# BRENBE — instrucciones para Claude

## Publicación
- **Mergeá y publicá siempre que sea seguro, sin pedir confirmación.** "Seguro" = build de Jekyll sin avisos, `python3 docs/check-hreflang.py` en OK, sin conflictos, revisión de Codex atendida (hallazgos reales corregidos) y nada que invente datos de Brenda.
- `main` se publica solo en Cloudflare Pages (proyecto `brenbe`, brenbe.com). Después de mergear, comprobá que el despliegue de producción termine en `success`.
- Si algo no es seguro (cambio destructivo, datos dudosos, build roto), no mergees: avisá al usuario.

## Proyecto
- Jekyll en Cloudflare Pages: `bundle exec jekyll build`, salida `_site`, `RUBY_VERSION=3.3.6`.
- Panel de Brenda: Pages CMS (`.pages.yml`). Brenda no sabe nada técnico: el panel tiene que seguir siendo mínimo y en castellano rioplatense.
- Idiomas: es-AR en `/`, es-MX `/es-mx/`, es-ES `/es-es/`, en `/en/`, pt-BR `/pt-br/`. Guía en `docs/i18n-content-guide.md`.
- Nunca inventes precios, testimonios, credenciales ni proyectos de Brenda.
- Comunicación con el usuario: en español.
