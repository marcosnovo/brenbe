# frozen_string_literal: true

# Plugins propios de BRENBE (se cargan en el build de Cloudflare Pages: `bundle exec jekyll build`).
#
#  1. Filtros Liquid para paletas: hex_norm, hex_fg, hex_contrast, wcag_level (contraste WCAG).
#  2. HubGenerator: páginas de "tema" (hub) por idioma a partir de _data/hubs.yml. Un hub SOLO se genera en un
#     idioma si tiene al menos `min_guides` guías publicadas (sin páginas finas). Deja en `site.hubs_live`
#     { 'es-ar' => { 'depto-chico' => '/guias/depto-chico/' } } lo que se generó, para el resto de las plantillas.
#  (/wa/<origen>/ ya no se genera: lo resuelve la Pages Function functions/wa/[[path]].js; el número vive solo como secreto.)

require 'jekyll'

module Brenbe
  DARK = '#25221f'
  LIGHT = '#ffffff'

  module Color
    module_function

    def norm(value)
      s = value.to_s.strip.delete_prefix('#').downcase
      s = s.chars.map { |c| c * 2 }.join if s.match?(/\A[0-9a-f]{3}\z/)
      s.match?(/\A[0-9a-f]{6}\z/) ? "##{s}" : ''
    end

    def luminance(hex)
      h = norm(hex)
      return 0.0 if h.empty?

      r, g, b = h.delete_prefix('#').scan(/../).map do |p|
        v = p.to_i(16) / 255.0
        v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055)**2.4
      end
      (0.2126 * r) + (0.7152 * g) + (0.0722 * b)
    end

    def ratio(a, b)
      la = luminance(a)
      lb = luminance(b)
      hi, lo = la > lb ? [la, lb] : [lb, la]
      (hi + 0.05) / (lo + 0.05)
    end

    def fg(hex)
      ratio(hex, DARK) >= ratio(hex, LIGHT) ? DARK : LIGHT
    end
  end

  module Filters
    # "#A1b" / "a1b2c3" -> "#AABB11"-style normalized lowercase "#a1b2c3"; invalid -> ""
    def hex_norm(input)
      Color.norm(input)
    end

    # Texto legible sobre ese fondo (oscuro de la marca o blanco), el de mayor contraste.
    def hex_fg(input)
      Color.norm(input).empty? ? '' : Color.fg(input)
    end

    # Contraste WCAG del texto elegido sobre el color, con 1 decimal (se trunca, nunca se redondea hacia arriba).
    def hex_contrast(input)
      return '' if Color.norm(input).empty?

      (Color.ratio(input, Color.fg(input)) * 10).floor / 10.0
    end

    # 7+ AAA, 4.5+ AA, 3+ AA (texto grande), si no ''.
    def wcag_level(ratio)
      r = ratio.to_f
      return 'AAA' if r >= 7
      return 'AA' if r >= 4.5

      r >= 3 ? 'AA-large' : ''
    end
  end

  module Util
    module_function

    def locale_of(doc)
      (doc.data['locale'] || 'es-ar').to_s
    end

    # Misma regla que _includes/indexable.html (listo para publicar).
    def publishable?(site, doc)
      d = doc.data
      return false if d['indexable'] == false || d['ready'] == false

      return false if site.data['locales'].dig(locale_of(doc), 'ready') == false

      negocio = site.data['negocio'] || {}
      sitio = site.data['sitio'] || {}
      # `whatsapp` vale como cargado cuando el interruptor sitio.whatsapp_enabled es true (el número ya no está en los datos).
      filled = ->(k) { k == 'whatsapp' ? sitio['whatsapp_enabled'] == true : !negocio[k].to_s.strip.empty? }
      # `contact_form` (en index_when_any) vale como cargado si el formulario está activo en _data/sitio.yml.
      form_on = (site.data['sitio'] || {})['contact_form'] == true
      filled_any = ->(k) { filled.call(k) || (k == 'contact_form' && form_on) }
      return false unless Array(d['index_when']).all?(&filled)
      return false if d['index_when_any'] && !Array(d['index_when_any']).any?(&filled_any)

      true
    end

    def guide_docs(site, lk)
      name = site.data['locales'].dig(lk, 'guias')
      coll = name && site.collections[name]
      coll ? coll.docs : []
    end

  end
end

Liquid::Template.register_filter(Brenbe::Filters)

module Brenbe
  class HubPage < Jekyll::PageWithoutAFile; end

  class HubGenerator < Jekyll::Generator
    safe true
    priority :normal

    def generate(site)
      cfg = site.data['hubs'] || {}
      min = (cfg['min_guides'] || 2).to_i
      hubs = cfg['hubs'] || {}
      live = Hash.new { |h, k| h[k] = {} }
      taken = {}

      site.data['locales'].each do |lk, ldata|
        next if ldata['ready'] == false

        index = site.pages.find { |p| p.data['ref'] == 'guias' && Util.locale_of(p) == lk }
        next unless index

        base = index.url.sub(%r{index\.html\z}, '').chomp('/')
        guides = Util.guide_docs(site, lk)
        hubs.each do |id, hub|
          h = hub[lk]
          next unless h && !h['slug'].to_s.empty?

          members = guides.select { |g| g.data['hub'].to_s == id && Util.publishable?(site, g) }
          next if members.size < min

          url = "#{base}/#{h['slug']}/"
          if guides.any? { |g| g.url == url } || taken[url]
            raise Jekyll::Errors::FatalException, "hub #{id} (#{lk}): la URL #{url} choca con otra página"
          end

          taken[url] = true
          pillar = members.find { |g| g.data['role'] == 'pilar' }
          newest = members.max_by { |g| (g.data['updated'] || g.data['date']).to_s }
          cover_src = pillar || members.find { |g| g.data['cover'] } || newest
          page = HubPage.new(site, site.source, url.chomp('/'), 'index.html')
          page.content = ''
          page.data.merge!(
            'layout' => 'hub', 'locale' => lk, 'ref' => "hub-#{id}", 'hub' => id,
            'title' => h['titulo'] || h['nombre'], 'seo_title' => h['seo_title'],
            'description' => h['descripcion'], 'breadcrumb' => h['nombre'],
            'collection_page' => 'hub', 'permalink' => url,
            'last_modified_at' => (newest.data['updated'] || newest.data['date']),
            'cover' => cover_src.data['cover'], 'cover_alt' => cover_src.data['cover_alt']
          )
          site.pages << page
          live[lk][id] = url
        end
      end
      site.config['hubs_live'] = live
    end
  end
end
