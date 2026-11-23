-- Estadísticas propias de BRENBE (colector /c). Base D1 "brenbe-analytics", binding `DB`.
-- Anónimo por diseño: sin IP, sin cookies, sin huella del navegador. `sid` es un número al azar por pestaña (sessionStorage).
-- Aplicar: wrangler d1 execute brenbe-analytics --remote --file=migrations/0001_init.sql   (ver docs/panel-analitica.md)
CREATE TABLE IF NOT EXISTS events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ts           INTEGER NOT NULL,            -- milisegundos Unix (hora del servidor)
  sid          TEXT    NOT NULL,            -- id al azar de la pestaña (no identifica personas)
  type         TEXT    NOT NULL,            -- pageview | wa_click | contact_submit | leave
  path         TEXT    NOT NULL,            -- ruta sin query ni hash
  title        TEXT,
  locale       TEXT,                        -- es-ar | es-mx | es-es | en | pt-br
  ref_host     TEXT,                        -- host de origen (vacío = directo o sitio propio)
  ref_path     TEXT,                        -- solo si el origen es un buscador
  utm_source   TEXT,
  utm_medium   TEXT,
  utm_campaign TEXT,
  country      TEXT,                        -- request.cf (aproximado)
  region       TEXT,
  city         TEXT,
  tz           TEXT,
  device       TEXT,                        -- mobile | tablet | desktop | other
  is_bot       INTEGER NOT NULL DEFAULT 0,  -- 1 = bot detectado
  bot_reason   TEXT,                        -- ua | verified | score | webdriver | datacenter
  dur          INTEGER,                     -- segundos en la página (solo type = leave)
  scroll       INTEGER                      -- % de scroll máximo (solo type = leave)
);
CREATE INDEX IF NOT EXISTS idx_events_ts     ON events (ts);
CREATE INDEX IF NOT EXISTS idx_events_sid_ts ON events (sid, ts);
CREATE INDEX IF NOT EXISTS idx_events_bot_ts ON events (is_bot, ts);
