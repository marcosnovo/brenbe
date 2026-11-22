# BRENBE: plan de distribución, conversión y rutina (off-site)

Fecha: 2026-11-22. Complementa `seo-contenido-growth.md` (SEO/contenido on-site) y `localizacion-estrategia.md` (locales y cobro). No toca el repo.

**Límites de la investigación.** Las búsquedas web trajeron poco dato oficial. Lo único confirmado en fuente de Google: reglas de negocios de área de servicio (ver 1.3). Lo de Pinterest (frescura, Rich Pins) viene de blogs secundarios; lo marcado **[VERIFICAR]** hay que chequearlo en la ayuda oficial antes de invertir tiempo. No hay cifras propias de tráfico: los objetivos de la sección 5 son hipótesis de arranque, no promesas.

Fuentes consultadas: [Google, áreas de servicio](https://support.google.com/business/answer/9157481), [Pinterest, tendencias 2026](https://newsroom.pinterest.com/news/spring-trend-report-2026/), [Pinterest Create, contenido de hogar](https://create.pinterest.com/nl/blog/home-decor-content-ideas-examples/), [eMarketer, Pinterest 2026: mini mejoras en vez de reformas](https://www.emarketer.com/content/pinterest-s-spring-2026-search-trends-favor-mini-upgrades-over-remodels), [Habitissimo México](https://www.habitissimo.com.mx/registrar/empresa), [Habitissimo España](https://www.habitissimo.es/empresas/decoradores), [Cronoshare MX](https://www.cronoshare.com.mx/servicios/decorador-interiores/ciudad-de-mexico), [Houzz](https://www.houzz.es/professionals/interioristas-y-decoradores/puerto-vallarta-14-mx-tipo-de-proyecto-diseno-de-salones-probr1-bo~t_17750~r_3991328~sv_32721), [servidos.ar](https://servidos.ar/servicios/disenador-de-interiores/buenos-aires).

---

## 0. Decisión en una página

1. **Pinterest es el canal #1** (buscador visual que manda tráfico al sitio, contenido que dura meses, sirve a los 5 idiomas con las mismas imágenes). **Instagram #2** (prueba social y conversación por DM/WhatsApp, no tráfico). **WhatsApp + reseñas** es lo que convierte. **Google Business Profile solo para su ciudad** (presencial), no para lo online.
2. **No abrir** TikTok, LinkedIn, YouTube como canales propios. Los Reels de Instagram se reciclan a Shorts/TikTok *solo si* es un clic (el equipo lo hace). 
3. Backlinks: pocos, buenos, **ganados con algo que dar** (guía de paletas, mini-encuesta de colores, proyectos fotografiables), no comprados.
4. Lo primero que hay que resolver no es un canal: es **que el sitio convierta** (WhatsApp con mensaje prellenado, "desde" publicado, una reserva simple, 3 reseñas). Sin eso, el tráfico se desperdicia.
5. Brenda: **4 h/semana** con bloques fijos. Todo lo demás lo arma el equipo/IA a partir de **1 proyecto por mes** (reciclaje en 5 idiomas).

---

## 1. Canales rankeados por ROI

| # | Canal | ROI esperado | Esfuerzo Brenda | Tiempo a resultados | Rol |
|---|---|---|---|---|---|
| 1 | Pinterest | Alto | Bajo (el equipo diseña pines) | 3-6 meses | Tráfico al sitio + SEO visual, 5 idiomas |
| 2 | WhatsApp + reseñas (conversión) | Alto | Medio | Inmediato | Cerrar ventas |
| 3 | Instagram | Medio | Medio-alto | 2-4 meses | Credibilidad, DMs, portfolio vivo |
| 4 | Google Business Profile (ciudad) | Medio-alto *local* | Bajo | 1-3 meses | Ventas presenciales + reseñas visibles en Google |
| 5 | Directorios por país | Medio, muy desigual | Bajo (alta única) | 1-2 meses | Backlink + leads de baja calidad |
| 6 | Digital PR / colaboraciones | Medio (acumulativo) | Bajo-medio | 3-12 meses | Autoridad, backlinks |
| 7 | YouTube Shorts / TikTok | Bajo para su caso | Reciclado | n/a | Opcional, solo reciclando Reels |
| 8 | LinkedIn | Bajo | n/a | n/a | No (salvo 1 perfil mínimo para PR/colaboraciones) |

### 1.1 Pinterest (prioridad 1)

**Por qué:** el hogar/deco es de las categorías más fuertes de la plataforma; Pinterest comunica para 2026 foco en comodidad, personalización y "mini mejoras en vez de reformas" ([eMarketer](https://www.emarketer.com/content/pinterest-s-spring-2026-search-trends-favor-mini-upgrades-over-remodels)), que calza con el "sin obra" de Brenda. Funciona como buscador: pin con título/descripción con palabras clave + enlace a una página del sitio.

**Setup (una vez, lo hace el equipo con acceso de Brenda, ~2 h):**
- [ ] Cuenta **comercial** con email de BRENBE. Perfil en español neutro-rioplatense, país/idioma: Argentina, es.
- [ ] **Reclamar el dominio** brenbe.com (metaetiqueta o archivo; la metaetiqueta va en `_layouts/base.html`, tarea para dev).
- [ ] **Rich Pins** (tipo artículo, para guías): validar una URL de `/guias/` con el validador de Pinterest **[VERIFICAR]**; requiere metadatos Open Graph/Schema que el sitio ya debería tener. Los Rich Pins de producto/precio **no aplican** (no vende productos).
- [ ] Tag de Pinterest: **no instalar** (sin anuncios; no sumar peso ni banner de cookies).
- [ ] **Un solo perfil, tableros por idioma.** Pinterest no segmenta bien por cuenta; segmentá por tablero con nombre y descripción en cada idioma. Alternativa si el volumen crece: cuenta en inglés separada (fase 2).
- [ ] Tableros iniciales (12 es-AR; luego duplicar los mejores en otros idiomas):
  - Por ambiente: Living, Dormitorio, Comedor, Home office, Cocina, Baño, Balcón.
  - Por situación: Decorar depto alquilado sin obra, Monoambiente y depto chico, Mudanza y casa nueva.
  - Por tema: Paletas de color, Papel pintado/empapelado, Iluminación, Antes y después.
  - Tableros en `en`: "Renter-friendly decorating", "Small apartment ideas", "Color palettes". En `es-MX`/`es-ES`: mismo formato con léxico local (ver `docs/i18n-content-guide.md`).
- [ ] Portada de cada tablero con diseño común (paleta BRENBE). Descripción con keywords + enlace a la página relevante.

**Cadencia (hipótesis de trabajo, ajustar con datos):** 5-7 pines **nuevos** por semana, no repines. Contenido evergreen todo el año; estacional (Navidad, primavera, vuelta a clases/mudanzas feb-mar) publicado 30-60 días antes del pico ([fuente secundaria, VERIFICAR](https://create.pinterest.com/nl/blog/home-decor-content-ideas-examples/)).

**Qué publicar** (formato vertical 2:3, 1000x1500):
| Tipo | Ejemplo | Enlaza a |
|---|---|---|
| Paleta | "Paleta cálida para living chico: 5 colores" | guía/artículo de color |
| Lista | "7 ideas para un depto alquilado sin hacer obra" | guía |
| Antes/después (collage) | Proyecto real, solo con permiso de la clienta | `/proyectos/` o servicio |
| Pin de servicio | "Asesoría online en 1 semana, sin obra" | página de servicio del locale |
| Video corto 7-15 s | Recorrido de moodboard o antes/después | guía/proyecto |

Reglas: 1 idea = 1 página destino; título con la keyword natural al inicio; texto superpuesto legible; **imágenes propias o con licencia** (no tomar fotos de otros); nada de pines clickbait. Cada pin lleva UTM (sección 5.3).

**Cómo alimenta el SEO:** Pinterest no da link-juice relevante (nofollow), pero (a) trae visitas cualificadas que mejoran señales de marca, (b) las imágenes aparecen en Google Imágenes/Discover, (c) cada pin obliga a tener una página destino útil por idioma. Es un multiplicador del plan on-site.

### 1.2 Instagram (prioridad 3 en esfuerzo, 2 en visibilidad)

**Setup (1 h):**
- [ ] Cuenta profesional, categoría "Diseñador de interiores".
- [ ] Bio (150 car.): propuesta + "Asesoría online, sin obra" + ciudad. Un solo enlace: **página puente** `brenbe.com/?utm_source=instagram...` o, mejor, un botón de **WhatsApp** (Instagram lo permite en perfil comercial) + enlace al sitio.
- [ ] Idioma: **cuenta en español**; contenido en inglés/portugués solo en textos alternativos o 1 Reel/mes con subtítulos (no mezclar cuentas al inicio).
- [ ] 5 historias destacadas: Cómo trabajo, Antes/después, Paletas, Reseñas, Preguntas.
- [ ] Respuesta guardada de WhatsApp/DM (plantilla 3.1).

**Cadencia mínima viable:** 2 Reels + 1 carrusel por semana + historias cuando haya algo (las historias son opcionales). Si hay semanas flojas: 1 Reel + 1 carrusel. La constancia pesa más que el volumen.

**Qué publicar (no hay "algoritmo secreto", sí buenas prácticas generales [VERIFICAR con Instagram Creators]):**
- Reels 15-30 s: antes/después, "un error de color que veo siempre", tour de moodboard. Gancho en 2 segundos, subtítulos incrustados, portada legible.
- Carruseles guardables: "5 paletas para living", "checklist antes de comprar un sillón". Los guardados y envíos por DM son la señal más útil.
- Stories con encuestas ("¿cuál elegirías?"): generan conversación que termina en WhatsApp.
- **Colaboraciones (función Collab):** con marcas de pintura/empapelado/mueblerías chicas, fotógrafas de interiores, inmobiliarias de alquiler.

**Qué NO hacer:** comprar seguidores, grupos de engagement, hashtags masivos (3-5 relevantes alcanzan), publicar datos de clientas sin permiso.

**Cómo alimenta el SEO:** señales de marca y tráfico directo; cada post fuerte se convierte en un pin y en una sección de guía.

### 1.3 Google Business Profile (GBP)

**Lo que dice Google (confirmado):** un negocio que visita a sus clientes sin atenderlos en su dirección es "service-area business": **debe quitar la dirección y definir áreas de servicio**; hasta 20 áreas definidas por ciudad/código postal (no por radio); no se puede usar una oficina "virtual" si no está atendida en horario ([ayuda de Google](https://support.google.com/business/answer/9157481)).

**Consecuencia para Brenda (decisión):**
- Crear el perfil **solo para su ciudad** (servicio presencial), como negocio de **área de servicio, dirección oculta**. No publicar su domicilio particular.
- **No** crear perfiles falsos para MX/ES/US/BR: sin presencia física real en esos países, está prohibido y arriesga suspensión. Lo online se posiciona con el sitio y Pinterest, no con GBP.
- **Verificación:** suele pedirse por video; tener a mano un video corto de su zona de trabajo y materiales **[VERIFICAR el método actual]**.

**Setup:**
- [ ] Categoría principal: "Diseñador de interiores" (secundarias: "Servicio de decoración de interiores", "Consultor de diseño" **[VERIFICAR nombres exactos en AR]**).
- [ ] Nombre exacto "BRENBE Interiorismo" (sin keywords agregadas: Google lo penaliza).
- [ ] Áreas de servicio: su ciudad + barrios/localidades reales donde va.
- [ ] Sitio web: la home o una página local; teléfono = WhatsApp Business; horarios reales.
- [ ] Servicios (Asesoría online, Asesoría presencial, Asesoría de color) con descripción corta y "desde" cuando haya precio.
- [ ] Fotos: 10 propias (proyectos, no stock). Logo y portada.
- [ ] **Reseñas**: enlace corto de reseña (sección 3.5). Meta 5 en 60 días, 15 en 6 meses.
- [ ] **Publicaciones:** 1 por semana (novedades o proyecto) y 1 respuesta por reseña, siempre.
- Medir: llamadas/clics a WhatsApp desde el perfil (panel de GBP).

**SEO:** el enlace al sitio y las reseñas apoyan consultas "interiorista en [ciudad]"; sumar una página `/[ciudad]/` solo si existe base real (criterio en `seo-contenido-growth.md`, sección 2.3).

### 1.4 Directorios y marketplaces (alta única, ~2-3 h en total, sin pagar al inicio)

Criterio: perfil gratuito + backlink + posibilidad de reseñas. **No comprar planes de leads al inicio**: mala relación calidad/precio para un servicio de ticket medio, y compiten por precio.

| País | Plataforma | Qué verificar | Decisión |
|---|---|---|---|
| AR | **Houzz** (perfil) | Alta gratuita, ciudades argentinas **[VERIFICAR]** | Sí: portfolio + enlace |
| AR | **servidos.ar** (categoría diseñador de interiores) | Si aplica alta gratuita; hoy lista profesionales por ciudad | Probar, bajo costo |
| AR | Cámaras/guías locales (CAC, cámaras de comercio de su ciudad), Páginas Amarillas | Enlace sin costo | Opcional, solo si es gratis |
| MX | **Habitissimo México** | Registro gratuito; destacar y comprar contactos requiere plan pago, sin comisión por trabajos ([fuente](https://www.habitissimo.com.mx/registrar/empresa)) | Perfil gratis sí; plan pago no |
| MX | **Cronoshare MX** | Modelo de solicitudes ([fuente](https://www.cronoshare.com.mx/servicios/decorador-interiores/ciudad-de-mexico)); vende contactos | Solo mirar; probablemente no |
| ES | **Habitissimo España** (decoradores) | Perfil gratis; el servicio **online** puede no encajar con "profesionales locales" | Perfil gratis sí, expectativas bajas |
| ES/MX/US | **Houzz** (global) | Perfil de profesional de pago/gratis según país; muestra proyectos | Un perfil, en inglés/español |
| US | Thumbtack / Angi | Priorizan servicios locales con visita y cobran por lead | **No** (no hay servicio local en EE.UU.) |
| US/global | Plataformas de e-design (Decorilla, Havenly, Laurel & Wolf) | Suelen reclutar diseñadores con prueba y revenue share | **Postular solo en fase 2**: son una vía de ingresos, no de marca |
| BR | GetNinjas, Habitissimo BR **[VERIFICAR]** | Requieren portugués y presencia | **No** hasta decidir pt-BR (ver `localizacion-estrategia.md`) |

Mejores usos de los perfiles: **mismo NAP** (nombre, WhatsApp, web) en todos; enlace a la home del locale; nada de duplicar texto exacto en 10 sitios.

### 1.5 YouTube Shorts / TikTok / LinkedIn
- **Shorts/TikTok:** el equipo reexporta los Reels, sin rediseñar y sin esfuerzo de Brenda. Revisar a los 90 días si traen visitas; si no, abandonar.
- **LinkedIn:** solo un perfil personal completo (sirve para PR/colaboraciones y como prueba de credenciales). No se publica ahí.

---

## 2. Digital PR y backlinks (pocos, relevantes, éticos)

**Principio:** cada enlace debe responder "¿qué le doy yo a quien me enlaza?" (contenido, dato, imágenes, nota). Nada de comprar enlaces, PBN ni intercambios masivos. 5-10 enlaces buenos en 12 meses valen más que 100 directorios.

### 2.1 Activos "linkeables" (se hacen una vez)
| Activo | Qué es | Para quién |
|---|---|---|
| **Guía de paletas** (PDF + página web) | 12 paletas para ambientes, con nombres de colores y cómo combinarlos | Blogs deco, inmobiliarias, marcas de pintura |
| **Mini-encuesta de colores** (datos propios) | 5 preguntas por Instagram/Pinterest/lista ("¿qué color tiene tu living?", "¿qué te frena de pintar?"); se publica un informe con 3-4 gráficos por país | Prensa y blogs ("según encuesta de BRENBE") |
| **Mapa de "decorar sin obra"** | Checklist por ambiente de cambios reversibles para alquilar | Inmobiliarias, comunidades de alquiler |
| **Proyectos fotografiados** | 3-5 antes/después con permiso | Revistas, blogs, Houzz |

Importante: **los resultados de la encuesta deben ser reales**; no inventar datos. Aclarar muestra y fecha en la nota metodológica ("no es estadística representativa").

### 2.2 Tácticas por mercado
| Mercado | Qué hacer | Ejemplos de destinos (verificar activos) |
|---|---|---|
| **AR** | Nota de colaboración con inmobiliarias/portales de alquiler ("cómo decorar tu depto alquilado"); secciones de deco de medios (La Nación Revista Living, Clarín Arq, etc.): enviar pitch breve con dato propio; blogs de deco argentinos; podcasts de emprendedoras/diseño; **egresados** de su universidad (revista o newsletter de alumnos) | medios de deco y vida, mueblerías locales, marcas de pintura/empapelado locales |
| **MX** | Pitch a blogs de deco/vivienda mexicanos con la encuesta de colores adaptada a MX; colaboración con marcas de pintura/empapelado y mueblerías de CDMX/Guadalajara/Monterrey; podcasts de diseño en español | verificar medios al armar la lista |
| **ES** | Blogs de decoración (nicho "sin obras/alquiler"), colaboración con marcas de textil/iluminación, directorios de arquitectura/diseño que acepten enlaces editoriales | verificar |
| **EN/US** | Guest posts en blogs de "renter-friendly" y apartment living; podcasts de diseño/small business; HARO-like en inglés (**Connectively** y **Qwoted** **[VERIFICAR vigencia]**); Featured.com / Source of Sources (SOS) | verificar |
| **PT-BR** | No hacer PR hasta decidir pt-BR | n/a |

### 2.3 Herramientas tipo HARO
- Inglés: Connectively (ex-HARO), Qwoted, Featured **[VERIFICAR cuáles siguen activos y si hay plan gratuito]**. En español no hay un equivalente fuerte confirmado: usar **búsqueda directa** (hashtags de periodistas de deco en X/LinkedIn, secciones "colaborá" de medios).
- Regla: responder solo preguntas donde tenga experiencia real; 2-3 respuestas por mes, con cita corta + foto.

### 2.4 Colaboraciones con marcas locales (reciprocidad)
- **Marcas de pintura, empapelado, textiles, iluminación:** ofrecer una "paleta del mes" con sus colores a cambio de enlace y mención. No pedir productos gratis si no están alineados; **declarar siempre cuando hay canje** (ley de publicidad y reglas de Instagram: etiqueta "colaboración pagada/canje").
- **Fotógrafas de interiores:** intercambio de imágenes + créditos con enlace.
- **Inmobiliarias y administradoras de alquiler:** guía "Decorar un depto alquilado" co-firmada.
- **Universidad/alumni:** un artículo en el medio de la facultad o asociación profesional.

### 2.5 Qué evitar
Directorios de enlaces masivos, comentarios en blogs con link, intercambios de enlaces reiterados, "guest posts" pagados en redes de blogs, reseñas falsas, y robo de imágenes. Todo link "patrocinado" debe ir con `rel="sponsored"`.

**Meta realista:** 10 backlinks de calidad en 6 meses (3 AR, 2 MX, 2 ES, 2 EN, 1 directorio) + los perfiles de directorios.

---

## 3. Conversión

### 3.1 Flujo de WhatsApp (el centro del embudo)
Ideal: **WhatsApp Business** (app gratis), con catálogo/servicios cargados, etiquetas ("consulta", "cotización enviada", "seña", "cliente", "cerrado") y mensaje de ausencia.

Embudo: **Clic en sitio/Pinterest/IG -> mensaje prellenado -> respuesta en <2 h hábiles -> mini-diagnóstico -> propuesta con precio -> reserva con seña -> sesión -> entregable -> reseña**.

Mensaje prellenado (el sitio abre `wa.me/NUMERO?text=...`; el dev lo hace por locale):

| Locale | Mensaje prellenado |
|---|---|
| es-AR | "Hola Brenda, vi tu sitio y quiero consultar por una asesoría de interiorismo. Mi ambiente es: ___" |
| es-MX | "Hola Brenda, vi tu sitio y me gustaría consultar por una asesoría de interiorismo. Mi espacio es: ___" |
| es-ES | "Hola Brenda, he visto tu web y me gustaría consultar por una asesoría de interiorismo. Mi estancia es: ___" |
| en | "Hi Brenda, I found your website and I'd like to ask about an online interior design consultation. My space is: ___" |
| pt-BR | "Olá Brenda, vi seu site e queria saber sobre consultoria de interiores online. Meu espaço é: ___" |

**Plantilla de primera respuesta (es-AR, adaptar léxico por locale; Brenda la guarda como respuesta rápida):**
> "¡Hola [nombre]! Gracias por escribirme. Para orientarte bien, contame: 1) qué ambiente querés trabajar, 2) fotos o un video corto, 3) medidas aproximadas, 4) qué te molesta hoy y qué estilo te gusta, 5) presupuesto aproximado para comprar o renovar. Con eso te digo cuál servicio te conviene y cuánto sale. Te respondo en el día."

**Plantilla de propuesta:**
> "Gracias por las fotos. Te recomiendo [servicio]: [qué incluye en 3 líneas]. Valor: [precio]. Entrega: [plazo]. Si te sirve, reservamos fecha con una seña de [X]. ¿Querés que te mande el link de reserva?"

**Seguimiento (solo 2 mensajes, sin presionar):**
- Día 2: "¿Pudiste ver la propuesta? Si te quedó alguna duda, la resolvemos."
- Día 7: "Te dejo una guía de paletas por si te sirve mientras lo pensás. Cualquier cosa, acá estoy." (sirve de lead magnet).

**Para otros locales**, el equipo/IA traduce estas plantillas con léxico local y Brenda las revisa una vez (es-MX: "depa", "recámara", "sala"; es-ES: "salón", "piso"; ver guía i18n). Regla: **Brenda responde en el idioma del cliente**; si no está en B2, la propuesta en inglés se revisa con IA antes de enviar.

**Fuera de horario:** mensaje automático de WhatsApp Business ("Te respondo de lunes a viernes de 10 a 18 h (hora Argentina)"), y mostrar en el sitio la ventana en la hora local de cada país (ver tabla de husos en `localizacion-estrategia.md`).

### 3.2 Lead magnet: "Guía de paletas" (y checklist)
- **Formato:** PDF de 8-12 páginas ("12 paletas para tu living/dormitorio, con cómo combinarlas y qué pintura/textil buscar") + checklist de 1 página "Antes de pintar o comprar: 10 preguntas".
- **Entrega sin fricción:** descarga directa en la web a cambio de email **opcional**, o por WhatsApp ("escribinos PALETA"). Recomendado: **doble vía**; el email va a una lista gratuita (**MailerLite/Brevo, planes gratis [VERIFICAR límites]**).
- **Legal:** consentimiento expreso para recibir emails y aviso de privacidad por locale (LGPD en BR, GDPR en ES/UE, Ley 25.326 en AR). Revisar con la contadora/abogada **[VERIFICAR]**.
- **Medición:** descargas, suscripciones y cuántas terminan en conversación de WhatsApp.
- **Secuencia de 3 emails** (cuando haya lista): (1) la guía + cómo trabajo, (2) un caso antes/después, (3) oferta de asesoría con "desde". Un email por mes después.

### 3.3 Empaquetado de ofertas y precios
Hoy no hay precios publicados; **no inventar valores**. Decisión pendiente de Brenda (ver `localizacion-estrategia.md` para rangos orientativos por mercado, que son estimaciones a validar).

Estructura recomendada (3 paquetes, mostrar "desde" y qué incluye):

| Paquete | Para quién | Qué incluye | Cómo mostrar el precio |
|---|---|---|---|
| **Consulta express** (60 min) | Dudas puntuales, decidir por dónde empezar | Videollamada + resumen escrito de 1 página | "Desde US$ X" |
| **Asesoría por ambiente** | Un living, un dormitorio | Videollamada + moodboard + paleta + lista de compras/lugares | "Desde US$ X por ambiente" |
| **Asesoría de vivienda** | Depto o casa completa | Varios ambientes + plan por etapas + 1 seguimiento | "Desde US$ X, a medida" |

Reglas:
- **Moneda:** USD como referencia para MX/EN/AR-exterior; EUR en `/es-es/` (con precio en EUR fijo, no conversión automática); ARS en AR **actualizado** con aclaración "valores en pesos al [fecha]" o referenciados a USD para evitar desactualización por inflación. BRL si se abre pt-BR.
- Publicar "desde" y qué incluye. Quien no ve precio igual pregunta, pero el "desde" filtra y mejora la calidad de las consultas.
- **Anclaje:** el paquete medio es el más visible. Incluir una garantía simple de satisfacción **solo si Brenda la puede sostener**.
- **Seña:** 30-50% para reservar fecha; saldo antes de la entrega del material final.
- Cambios de precio por país: considerar mismo precio en USD en todos los locales hispanos al inicio (más simple) y revisar a los 90 días.

### 3.4 Reserva (agenda)
| Herramienta | Plan gratis | Comentario |
|---|---|---|
| **Cal.com** | Sí (reservas ilimitadas, 1 usuario, integra Google Calendar y Zoom/Meet **[VERIFICAR]**) | Recomendada: huso horario automático para el cliente |
| Calendly | Sí, 1 tipo de evento | Más conocida; limitada gratis |
| Google Calendar (citas) | Con Workspace de pago | No necesaria |

Config: 3 tipos de evento (express, ambiente, vivienda), ventanas por mercado (ver tabla de husos), buffer de 15 min, formulario previo con 3 preguntas y subida de fotos por WhatsApp/email. Enlace desde el sitio como **segunda opción** al lado de WhatsApp (muchos prefieren chatear primero).

### 3.5 Reseñas y testimonios (sistema)
**Hoy no hay ninguno; no inventar.** Meta: 3 en 30 días, 10 en 90.
1. Entregable final -> mensaje a las 48 h: "¿Me dejás una reseña? Me ayuda mucho: [enlace corto de Google] (30 segundos)".
2. Para clientes del exterior (sin Google/GBP aplicable): testimonio en texto/WhatsApp **con permiso escrito** para publicar (capturas con nombre y ciudad, o solo nombre de pila y país).
3. Formulario simple de 3 preguntas: antes (qué te frenaba), durante, después (qué cambió).
4. Mostrar en el sitio solo con permiso; añadir schema `Review` solo cuando haya reseñas reales y verificables **[tarea dev después de tener 5+]**.
5. Responder todas las reseñas en <48 h.
6. **Nunca** ofrecer descuentos a cambio de reseñas positivas (viola las políticas de Google).

### 3.6 Cobros (verificar con contadora/contador antes de lanzar)
Resumen y comisiones en `localizacion-estrategia.md`. Para ordenar:

| Cliente | Vía recomendada | Notas |
|---|---|---|
| AR | **Mercado Pago** (link de pago), transferencia (CBU/alias) | Rápido; comisión MP **[VERIFICAR]** |
| MX | PayPal (link de pago/factura), transferencia internacional a cuenta USD | Mercado Pago MX no es la vía simple para cobrar desde AR |
| ES | Transferencia SEPA (cuenta EUR) si es viable, o PayPal | Comparar con comisiones PayPal; ver Payoneer/Wise EUR **[VERIFICAR]** |
| EN/US | PayPal, Payoneer (ACH US), transferencia SWIFT a cuenta USD | Evitar Stripe: **disponibilidad en Argentina limitada [VERIFICAR]** |
| BR | Aún no | |

**Lo que hay que preguntarle a la contadora (no es consejo legal):**
- Categoría de **Monotributo** o Responsable Inscripta y el tope de facturación anual.
- **Factura E** de exportación de servicios y registro de la actividad como exportación **[VERIFICAR]**.
- **Liquidación de divisas / ingreso de cobros en USD** y régimen cambiario vigente; opciones para dejar los dólares en cuenta o liquidarlos.
- **Impuestos** sobre ingresos del exterior (Ganancias, Ingresos Brutos de su provincia, IVA exportación).
- Comisiones y percepciones por vía de cobro (el caso US$1000 -> US$450 del [Cronista](https://www.cronista.com/infotechnology/finanzas-digitales/argentinos-que-cobran-en-el-exterior-por-cada-us-1000-solo-les-llegan-us-450) muestra por qué importa comparar).
- Contrato/condiciones del servicio (reembolsos, cancelaciones, propiedad intelectual de moodboards) y aviso de privacidad.
- Si cobra en EUR/BRL, impuestos de los países de origen.

---

## 4. Rutina semanal de Brenda (4 h/semana)

| Bloque | Cuándo | Min | Qué hace | Herramienta |
|---|---|---|---|---|
| A. Bandeja y WhatsApp | Lun a vie, 15 min por día | 75 | Responder consultas, aplicar plantillas, etiquetar, seguimiento día 2/7 | WhatsApp Business |
| B. Contenido (1 sesión) | Martes | 90 | Revisar y aprobar lo que armó el equipo; grabar 2 clips de 20 s con el celular; elegir 1 foto de proyecto | Celular, carpeta compartida |
| C. Instagram | Miércoles y viernes | 40 | Publicar (programado por el equipo) + responder comentarios/DM 20 min | Meta Business Suite |
| D. Reseñas y GBP | Jueves | 20 | Pedir reseña al último cliente, responder reseñas, 1 post de GBP (lo prepara el equipo) | GBP, WhatsApp |
| E. Revisión de números | Viernes | 15 | Mirar 5 cifras (sección 5), anotar una decisión | Planilla simple |
| **Total** | | **~4 h** | | |

Reglas para que sea sostenible:
- **Un día de grabación al mes** (2-3 h) para juntar clips de varios proyectos; el resto es solo aprobar.
- Si una semana no puede, se hace A y D (lo que convierte) y se pausa lo demás.
- Brenda **no diseña pines ni edita**: aprueba o corrige.
- **Entrega de cada proyecto:** pedir permiso de imagen por escrito antes de publicar.

### 4.1 Qué hace el equipo/IA (reciclaje de 1 proyecto)
Con **1 proyecto por mes** (fotos antes/después, paleta, texto de Brenda de 5 líneas) el equipo produce:

| Salida | Cantidad | Idiomas |
|---|---|---|
| Pines (distintos ángulos, textos y títulos) | 12-15 | 5 (copy nativo; imágenes compartidas) |
| Reels / video corto | 2-3 | es (+ subtítulos en/pt si el audio lo permite) |
| Carrusel IG | 1-2 | es |
| Post de GBP | 2 | es-AR |
| Sección en `/proyectos/` o guía (texto + fotos) | 1 | 5 (alineado con el plan on-site) |
| Texto para pitch de PR + imágenes | 1 | es/en |
| Respuesta a preguntas frecuentes de WhatsApp | actualizar | por locale |

Flujo: Brenda sube carpeta + audio de 2 min contando el proyecto -> el equipo transcribe, redacta, diseña (plantillas en Canva o Figma), traduce con revisión de léxico local -> Brenda aprueba en 30-45 min -> programación (Pinterest/Meta Business Suite/Buffer gratuito **[VERIFICAR]**).

Regla de oro del equipo/IA: **no inventar** testimonios, resultados ni proyectos; todo lo publicado sale de material real de Brenda. Los textos largos en idiomas que ella no domine se marcan "pendiente de revisión nativa".

---

## 5. Plan de 90 días, hitos a 12 meses y métricas

### 5.1 Plan de 90 días
| Semana | Foco | Entregables |
|---|---|---|
| **1-2** | Cimientos de conversión | WhatsApp Business activo + enlace `wa.me` con mensaje por locale; email de contacto real; plantillas; decisión de precios "desde" (Brenda + contadora); Cloudflare Web Analytics y Search Console activos; convención UTM |
| **3-4** | Perfiles | Pinterest comercial + dominio reclamado + 12 tableros; Instagram profesional + bio/destacadas; GBP creado y en verificación; Houzz/servidos.ar/Habitissimo (perfiles gratis) |
| **5-6** | Cal.com + guía de paletas | Reserva de citas online; PDF de paletas + página de descarga; 1ª encuesta de colores lanzada (Instagram + stories) |
| **7-8** | Producción constante | 25-30 pines publicados, 8-10 posts de Instagram; 3 reseñas pedidas; 1er proyecto reciclado en 5 idiomas |
| **9-10** | PR suave | Lista de 20 contactos AR/MX; 5 pitches (guía de paletas, "decorar sin obra"); 2 colaboraciones propuestas (marca de pintura/empapelado + inmobiliaria) |
| **11-12** | Resultados de la encuesta + revisión | Informe de datos propios (3-4 gráficos) -> pitch a medios; revisión de métricas: qué pines/reels trajeron visitas, qué sacar, qué duplicar |

**Gate a día 90 (decidir):** ¿Pinterest manda al menos X visitas/mes al sitio? Si sí, duplicar tableros a es-MX/en; si no, revisar títulos/destinos antes de abandonar. ¿Hay al menos 5 consultas por WhatsApp/mes desde web? Si no, el problema es de conversión, no de tráfico.

### 5.2 Hitos a 12 meses (hipótesis, ajustar con datos reales)
| Mes | Hito |
|---|---|
| 3 | Todo el set de perfiles activo; 3 reseñas; 1ª venta atribuible a Pinterest o web |
| 6 | 10 reseñas/testimonios reales; 4-6 backlinks de calidad; es-MX en marcha con tableros y pines propios; lista de email con la guía |
| 9 | Primer artículo/nota en medio externo; 2-3 colaboraciones; decisión sobre en (EE.UU.) y pt-BR con datos (consultas, huso, idioma) |
| 12 | Pinterest como canal #1 de visitas; 25+ reseñas; 10+ backlinks de calidad; flujo estable de consultas internacionales; decisión de contratar apoyo (community manager) si el volumen lo justifica |

### 5.3 KPIs (el seguidor no es la meta)
| Nivel | KPI | Fuente |
|---|---|---|
| Tráfico | Visitas al sitio desde Pinterest, Instagram, Google, directos; por locale | Cloudflare Web Analytics (+ UTM) |
| Intención | **Clics a WhatsApp** y clics a reserva, por origen y locale | Eventos/enlaces con UTM o, mejor, redirección propia `/wa/` **[tarea dev]** |
| Ventas | **Consultas iniciadas**, **asesorías reservadas**, ingresos por canal | Planilla simple de Brenda (hoja de seguimiento) |
| Calidad | Tasa consulta->reserva; ticket medio; reseñas nuevas/mes | Planilla / GBP |
| SEO | Impresiones, clics, posiciones por país y por página | Google Search Console |
| Pinterest | Salidas (outbound clicks), guardados, impresiones por pin | Analytics de Pinterest |

**Convención UTM** (minúsculas, sin acentos, siempre igual):
`?utm_source={pinterest|instagram|gbp|houzz|habitissimo|email|pr}&utm_medium={organic|bio|post|profile|newsletter|referral}&utm_campaign={nombre-corto}&utm_content={id-pin-o-reel}`
Ejemplos: `utm_source=pinterest&utm_medium=organic&utm_campaign=paletas-living-es-ar&utm_content=pin-014`; `utm_source=gbp&utm_medium=profile&utm_campaign=local`.
Los enlaces `wa.me` no admiten UTM: usar una página intermedia o parámetro en la URL de origen y registrar la fuente al responder ("¿cómo nos conociste?" en la primera plantilla de WhatsApp, 1 pregunta).

**Tracking simple:**
- **Cloudflare Web Analytics:** sin cookies, no requiere banner; da visitas, páginas, referers y países.
- **Search Console:** propiedad de dominio verificada por DNS; enviar sitemap; filtrar por país para ver cada mercado.
- **Planilla de leads** (Google Sheets): fecha, origen (UTM o "cómo nos conociste"), locale, servicio, estado, monto, reseña pedida (sí/no). 10 minutos por semana.
- Sin Google Analytics ni píxeles al inicio (privacidad, simplicidad, velocidad).

**Umbrales de alerta:** más de 30 días sin pines nuevos; tiempo de respuesta de WhatsApp > 4 h hábiles; 0 reseñas en 60 días.

---

## 6. Pendientes y decisiones que necesito de Brenda (en orden)
1. Número de WhatsApp Business y email definitivos.
2. Rangos de precio "desde" por paquete (con la contadora para moneda y facturación).
3. Su ciudad y si atiende presencial con visitas (define si va GBP y con qué áreas).
4. Permiso de imagen de al menos 3 proyectos reales (fotos antes/después).
5. Idiomas en los que **sí** atiende (es, en, pt) y con qué fluidez; define fase 2 y 3 de locales.
6. Aprobación de la política de reseñas y del uso de testimonios.

## 7. Tareas dev derivadas (para el equipo, no para Brenda)
- Metaetiqueta de verificación de Pinterest + Open Graph/`article` en guías (Rich Pins).
- Botón de WhatsApp con mensaje prellenado por locale y `/wa/` con redirección y registro de origen.
- Cloudflare Web Analytics en `base.html` (sin banner).
- Enlace a reserva (Cal.com) por locale.
- Página de descarga de la guía de paletas y formulario de email opcional (con aviso de privacidad por locale).
- Schema `Review`/`AggregateRating` solo cuando existan 5+ reseñas verificables.
