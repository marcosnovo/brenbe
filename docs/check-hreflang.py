#!/usr/bin/env python3
"""Verificación del sitio construido (carpeta _site) para SEO internacional.

Uso:  bundle exec jekyll build && python3 docs/check-hreflang.py [_site] [--base https://brenbe.com]

Comprueba:
  1. hreflang: cada página indexable es autocanónica, se lista a sí misma, solo apunta a páginas
     indexables que existen, es RECÍPROCA (cada alternate lista de vuelta a la página y con el mismo
     conjunto), sin códigos duplicados, x-default -> es-AR, <html lang> y og:locale coherentes.
  2. Páginas noindex (borradores `ready: false`, 404, admin): fuera del sitemap y de cualquier hreflang.
  3. sitemap.xml: XML válido, solo URLs indexables, los xhtml:link coinciden con el <head>.
  4. JSON-LD: todos los <script type="application/ld+json"> parsean.
  5. Enlaces internos (href/src que empiezan con "/"): 0 rotos (incluye anclas #id) y _redirects sin bucles.
  6. Ninguna página indexable conserva marcadores TODO(i18n).
Sale con código 1 si hay errores.
"""
import json, os, re, sys
from html.parser import HTMLParser
from urllib.parse import urldefrag, unquote
import xml.etree.ElementTree as ET

args = [a for a in sys.argv[1:] if not a.startswith('--')]
BASE = 'https://brenbe.com'
if '--base' in sys.argv:
    BASE = sys.argv[sys.argv.index('--base') + 1].rstrip('/')
    args = [a for a in args if a != BASE]
SITE = os.path.abspath(args[0] if args else '_site')

HREFLANG_RE = re.compile(r'^(x-default|[a-z]{2,3}(-[A-Za-z]{2})?)$')
errors, warnings = [], []


def err(m):
    errors.append(m)


def warn(m):
    warnings.append(m)


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.lang = None
        self.canonical = None
        self.robots = ''
        self.alts = []
        self.og_locale = None
        self.ld = []
        self._ld = False
        self._skip = 0
        self.links = []
        self.ids = set()
        self.text = []

    def handle_starttag(self, tag, a):
        a = dict(a)
        if 'id' in a:
            self.ids.add(a['id'])
        if tag == 'html':
            self.lang = a.get('lang')
        elif tag == 'link':
            rel = (a.get('rel') or '').lower()
            if rel == 'canonical':
                self.canonical = a.get('href')
            elif rel == 'alternate' and a.get('hreflang'):
                self.alts.append((a['hreflang'], a.get('href')))
            elif a.get('href') and rel in ('stylesheet', 'icon', 'apple-touch-icon', 'preload'):
                self.links.append(a['href'])
        elif tag == 'meta':
            n = (a.get('name') or '').lower()
            p = (a.get('property') or '').lower()
            if n == 'robots':
                self.robots = (a.get('content') or '').lower()
            if p == 'og:locale':
                self.og_locale = a.get('content')
        elif tag == 'script':
            if (a.get('type') or '') == 'application/ld+json':
                self._ld = True
                self.ld.append('')
            else:
                self._skip += 1
                if a.get('src'):
                    self.links.append(a['src'])
        elif tag == 'a' and a.get('href'):
            self.links.append(a['href'])
        elif tag in ('img', 'source') and a.get('src'):
            self.links.append(a['src'])
        if tag in ('img', 'source') and a.get('srcset'):
            for part in a['srcset'].split(','):
                u = part.strip().split(' ')[0]
                if u:
                    self.links.append(u)

    def handle_endtag(self, tag):
        if tag == 'script':
            if self._ld:
                self._ld = False
            elif self._skip:
                self._skip -= 1

    def handle_data(self, d):
        if self._ld:
            self.ld[-1] += d
        elif not self._skip:
            self.text.append(d)


def url_for(path):
    rel = os.path.relpath(path, SITE).replace(os.sep, '/')
    if rel.endswith('index.html'):
        rel = rel[:-len('index.html')]
    return BASE + '/' + rel


def file_for(url_path):
    p = unquote(url_path.split('?')[0])
    if p.endswith('/') or p == '':
        cands = [os.path.join(SITE, p.lstrip('/'), 'index.html')]
    else:
        cands = [os.path.join(SITE, p.lstrip('/')), os.path.join(SITE, p.lstrip('/'), 'index.html'),
                 os.path.join(SITE, p.lstrip('/') + '.html')]
    for c in cands:
        if os.path.isfile(c):
            return c
    return None


pages = {}
for root, _, files in os.walk(SITE):
    for f in files:
        if f.endswith('.html'):
            path = os.path.join(root, f)
            pr = Page()
            pr.feed(open(path, encoding='utf-8').read())
            pr.path = path
            pr.url = url_for(path)
            pr.indexable = 'noindex' not in pr.robots
            pages[pr.url] = pr
indexable = {u: p for u, p in pages.items() if p.indexable}

# 1-2. hreflang
for u, p in sorted(indexable.items()):
    if p.canonical != u:
        err(f'{u}: canonical {p.canonical!r} no es autorreferente')
    codes = [c for c, _ in p.alts]
    if len(codes) != len(set(codes)):
        err(f'{u}: hreflang duplicado {codes}')
    for c in codes:
        if not HREFLANG_RE.match(c) or c.lower() == 'es-419':
            err(f'{u}: código hreflang inválido o no soportado {c!r}')
    if u not in {h for _, h in p.alts}:
        err(f'{u}: no se lista a sí misma en hreflang')
    if not p.lang:
        err(f'{u}: falta <html lang>')
    own = [c for c, h in p.alts if h == u and c != 'x-default']
    if p.lang and own and p.lang.lower().split('-')[0] != own[0].lower().split('-')[0]:
        err(f'{u}: <html lang="{p.lang}"> no coincide con hreflang propio {own}')
    mine = set(p.alts)
    for c, h in p.alts:
        t = indexable.get(h)
        if t is None:
            err(f'{u}: hreflang {c} -> {h} no existe o es noindex')
            continue
        if h == u:
            continue
        if u not in {bh for _, bh in t.alts}:
            err(f'{u}: hreflang {c} -> {h} no es recíproco')
        elif set(t.alts) != mine:
            err(f'{u} y {h}: conjuntos hreflang distintos')
    xd = [h for c, h in p.alts if c == 'x-default']
    if xd:
        t = indexable.get(xd[0])
        if t is None or t.lang != 'es-AR':
            err(f'{u}: x-default debería apuntar a la versión es-AR ({xd[0]})')
    if len({h for _, h in p.alts}) > 1 and not xd:
        warn(f'{u}: grupo con varios idiomas sin x-default')
    if p.og_locale is None:
        err(f'{u}: falta og:locale')
    if 'TODO(i18n)' in ''.join(p.text) or any('TODO(i18n)' in x for x in p.ld):
        err(f'{u}: indexable con marcador TODO(i18n)')
for u, p in pages.items():
    if not p.indexable:
        for c, h in p.alts:
            err(f'{u}: página noindex con hreflang ({c})')
        for iu, ip in indexable.items():
            if u in {h for _, h in ip.alts}:
                err(f'{iu}: hreflang apunta a la página noindex {u}')

# 3. sitemap
sm = os.path.join(SITE, 'sitemap.xml')
n_sm = 0
if not os.path.isfile(sm):
    err('falta sitemap.xml')
else:
    ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9', 'x': 'http://www.w3.org/1999/xhtml'}
    try:
        root = ET.parse(sm).getroot()
    except ET.ParseError as e:
        err(f'sitemap.xml no es XML válido: {e}')
        root = None
    if root is not None:
        locs = []
        for url in root.findall('s:url', ns):
            loc = url.find('s:loc', ns).text.strip()
            locs.append(loc)
            p = pages.get(loc)
            if p is None:
                err(f'sitemap: {loc} no existe en _site')
                continue
            if not p.indexable:
                err(f'sitemap: {loc} es noindex')
            sm_alts = {(l.get('hreflang'), l.get('href')) for l in url.findall('x:link', ns)}
            if sm_alts:
                n_sm += 1
                if sm_alts != set(p.alts):
                    err(f'sitemap: alternates de {loc} no coinciden con el <head>')
                if loc not in {h for _, h in sm_alts}:
                    err(f'sitemap: {loc} no se lista a sí misma')
            elif len({h for _, h in p.alts}) > 1:
                err(f'sitemap: {loc} tiene alternates en el <head> pero no en el sitemap')
        if len(locs) != len(set(locs)):
            err('sitemap: URLs duplicadas')
        for u in indexable:
            if u not in locs:
                warn(f'indexable fuera del sitemap: {u}')

# 4. JSON-LD
n_ld = 0
for u, p in pages.items():
    for block in p.ld:
        n_ld += 1
        try:
            json.loads(block)
        except Exception as e:
            err(f'{u}: JSON-LD inválido ({e})')

# 5. enlaces internos
try:
    wa_map = json.load(open(os.path.join(SITE, '_wa-map.json'), encoding='utf-8')).get('map', {})
except Exception:
    wa_map = {}
n_links = 0
for u, p in pages.items():
    for href in p.links:
        href = href.strip()
        if href.startswith(BASE):
            href = href[len(BASE):] or '/'
        if not href.startswith('/') or href.startswith('//') or href.startswith('/cdn-cgi/'):
            continue
        if href.startswith('/wa/'):
            # /wa/<origen>/ lo resuelve la Pages Function (functions/wa/[[path]].js): el origen tiene que estar en el mapa.
            n_links += 1
            if href[4:].strip('/') not in wa_map:
                err(f'{u}: /wa/ sin entrada en _wa-map.json: {href}')
            continue
        n_links += 1
        path, frag = urldefrag(href)
        f = file_for(path) if path else None
        if path and f is None:
            err(f'{u}: enlace roto {href}')
            continue
        if frag and f and f.endswith('.html'):
            target = pages.get(url_for(f))
            if target is not None and frag not in target.ids:
                err(f'{u}: ancla inexistente {href}')
    for href in p.links:
        if href.startswith('#') and len(href) > 1 and href[1:] not in p.ids:
            err(f'{u}: ancla interna inexistente {href}')

rd = os.path.join(SITE, '_redirects')
if os.path.isfile(rd):
    srcs, dsts = set(), []
    for line in open(rd):
        parts = line.split('#')[0].split()
        if len(parts) >= 2:
            srcs.add(parts[0].rstrip('/') or '/')
            dsts.append(parts[1])
    for d in dsts:
        if (d.rstrip('/') or '/') in srcs:
            err(f'_redirects: bucle, el destino {d} también es origen')
        if d.startswith('/') and file_for(d) is None:
            err(f'_redirects: destino inexistente {d}')

print(f'{len(pages)} páginas ({len(indexable)} indexables, {n_sm} con alternates en el sitemap), '
      f'{n_ld} bloques JSON-LD, {n_links} enlaces internos revisados.')
for w in warnings:
    print('AVISO:', w)
for e in errors:
    print('ERROR:', e)
print('OK' if not errors else f'{len(errors)} error(es)')
sys.exit(1 if errors else 0)
