#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC — Portal Institucional Nativo (Centro de Control Compacto)
Dashboard Bento Grid nativo en Python 3 + GTK 3 sincronizado en tiempo real
con sigic_db.py.
Instituto Tecnológico Beltrán — Práctica Profesionalizante 2026
"""

import os
import sys
import subprocess
from datetime import datetime

sys.path.insert(0, "/opt/sigic")
import sigic_db

try:
    import gi
    gi.require_version('Gtk', '3.0')
    gi.require_version('Gdk', '3.0')
    from gi.repository import Gtk, Gdk, GdkPixbuf, GLib, Pango
except Exception as err:
    print(f"Error cargando librerías GTK3: {err}")
    sys.exit(1)

CSS_PORTAL = b"""
.bento-card {
    background-image: linear-gradient(180deg, #0c182b 0%, #081120 100%);
    border: 1px solid #192841;
    border-radius: 10px;
    padding: 9px 11px;
}
.bento-card:hover {
    border-color: #0284c7;
    background-image: linear-gradient(180deg, #10213a 0%, #0b172a 100%);
}
.tag-badge {
    background-color: #0f1f38;
    border: 1px solid #1e3a5f;
    border-radius: 5px;
    padding: 1px 6px;
}
button.btn-card-action {
    background-image: none;
    background-color: #11223b;
    color: #e2e8f0;
    font-size: 11px;
    font-weight: bold;
    border-radius: 7px;
    padding: 4px 10px;
    border: 1px solid #1e3a5f;
}
button.btn-card-action:hover {
    background-image: linear-gradient(90deg, #0284c7 0%, #0369a1 100%);
    background-color: #0284c7;
    color: #ffffff;
    border-color: #38bdf8;
}
.footer-bar {
    background-color: #07101d;
    border: 1px solid #132238;
    border-radius: 8px;
    padding: 4px 12px;
}
"""


def render_svg_badge(inner_paths, stroke_color, bg_top="#112642", bg_bot="#081324", size=30):
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 44 44">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="{bg_top}"/>
          <stop offset="100%" stop-color="{bg_bot}"/>
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="41" height="41" rx="10" fill="url(#g)" stroke="{stroke_color}" stroke-width="1.5" stroke-opacity="0.8"/>
      <g transform="translate(10, 10)" fill="none" stroke="{stroke_color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        {inner_paths}
      </g>
    </svg>"""
    try:
        loader = GdkPixbuf.PixbufLoader.new_with_type("svg")
        loader.set_size(size, size)
        loader.write(svg.encode("utf-8"))
        loader.close()
        return loader.get_pixbuf()
    except Exception:
        return None


ICON_PATHS = {
    "calendario": '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M10 16h4"/><path d="M12 14v4"/>',
    "graduados": '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    "escaner": '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" x2="17" y1="12" y2="12"/>',
    "convocatoria": '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    "anfiteatro": '<path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z"/><path d="M5 18v2"/><path d="M19 18v2"/>',
    "envivo": '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    "reportes": '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    "manual": '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
}


class PortalSigic(Gtk.Window):
    def __init__(self):
        super().__init__(title="SiGIC — Centro de Control Institucional")
        self.set_default_size(980, 560)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.get_style_context().add_class("sigic-window")

        for ruta_logo in ["/opt/sigic/logo.png", "/usr/share/pixmaps/sigic.png"]:
            if os.path.exists(ruta_logo):
                try:
                    self.set_icon_from_file(ruta_logo)
                    break
                except Exception:
                    pass

        header = Gtk.HeaderBar()
        header.set_show_close_button(True)
        header.set_decoration_layout(":minimize,maximize,close")
        header.props.title = "SiGIC — Centro de Control Institucional"
        header.props.subtitle = "Instituto Tecnológico Beltrán"
        header.get_style_context().add_class("sigic-headerbar")
        self.set_titlebar(header)

        for ruta_logo in ["/opt/sigic/logo.png", "/usr/share/pixmaps/sigic.png"]:
            if os.path.exists(ruta_logo):
                try:
                    pix = GdkPixbuf.Pixbuf.new_from_file_at_scale(ruta_logo, 20, 20, True)
                    img_h = Gtk.Image.new_from_pixbuf(pix)
                    img_h.set_margin_start(4)
                    header.pack_start(img_h)
                    break
                except Exception:
                    pass

        btn_web = Gtk.Button(label="Abrir Plataforma Web (:3000)")
        btn_web.get_style_context().add_class("btn-primary")
        btn_web.connect("clicked", lambda b: subprocess.Popen(["xdg-open", "http://localhost:3000"]))
        header.pack_start(btn_web)

        btn_acerca = Gtk.Button(label="Equipo Beltrán")
        btn_acerca.get_style_context().add_class("btn-secondary")
        btn_acerca.connect("clicked", lambda b: self.lanzar_modulo("sigic-acerca-de"))
        header.pack_end(btn_acerca)

        btn_ajustes = Gtk.Button(label="Ajustes y Fondos")
        btn_ajustes.get_style_context().add_class("btn-secondary")
        btn_ajustes.connect("clicked", lambda b: self.lanzar_modulo("sigic-ajustes"))
        header.pack_end(btn_ajustes)

        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=7)
        vbox.set_margin_top(7)
        vbox.set_margin_bottom(7)
        vbox.set_margin_start(12)
        vbox.set_margin_end(12)
        self.add(vbox)

        # 1. HERO BANNER COMPACTO
        hero = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        hero.get_style_context().add_class("hero-banner")

        for ruta_logo in ["/opt/sigic/logo.png", "/usr/share/pixmaps/sigic.png"]:
            if os.path.exists(ruta_logo):
                try:
                    pix_hero = GdkPixbuf.Pixbuf.new_from_file_at_scale(ruta_logo, 34, 34, True)
                    hero.pack_start(Gtk.Image.new_from_pixbuf(pix_hero), False, False, 0)
                    break
                except Exception:
                    pass

        hero_text_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=1)
        lbl_hero_t = Gtk.Label(xalign=0)
        lbl_hero_t.set_markup(
            "<span foreground='#ffffff' weight='heavy' size='12500'>SiGIC</span>  "
            "<span foreground='#38bdf8' weight='bold' size='9500'>·  Sistema de Gestión Institucional de Colaciones — Instituto Beltrán</span>"
        )
        hero_text_box.pack_start(lbl_hero_t, False, False, 0)

        lbl_hero_sub = Gtk.Label(xalign=0)
        lbl_hero_sub.set_markup(
            "<span foreground='#94a3b8' size='8800'>Padrón oficial, credenciales QR, anfiteatro interactivo, envíos OTP y conexión con App Móvil Portería.</span>"
        )
        hero_text_box.pack_start(lbl_hero_sub, False, False, 0)
        hero.pack_start(hero_text_box, True, True, 0)

        self.lbl_reloj = Gtk.Label()
        self.lbl_reloj.set_markup(f"<span foreground='#34d399' weight='heavy' size='9500'>● ACTIVO  {datetime.now().strftime('%H:%M:%S')}</span>")
        self.lbl_reloj.get_style_context().add_class("pill-ok")
        hero.pack_end(self.lbl_reloj, False, False, 0)
        vbox.pack_start(hero, False, False, 0)

        # 2. TARJETAS KPI DINÁMICAS (4 COLUMNAS COMPACTAS)
        box_kpi = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=8)
        box_kpi.set_homogeneous(True)

        self.lbl_k1_v, self.lbl_k1_s, k1 = self._crear_kpi("CEREMONIA ACTIVA", "Colación Beltrán", "Sede Central", "#38bdf8")
        self.lbl_k2_v, self.lbl_k2_s, k2 = self._crear_kpi("PADRÓN OFICIAL", "0 Egresados", "0% confirmados", "#34d399")
        self.lbl_k3_v, self.lbl_k3_s, k3 = self._crear_kpi("ANFITEATRO Y SALA", "0 Butacas", "0 acompañantes", "#c084fc")
        self.lbl_k4_v, self.lbl_k4_s, k4 = self._crear_kpi("PORTERÍA QR / APP", "0 Acreditados", "Escáner sincronizado", "#fbbf24")

        for k in (k1, k2, k3, k4):
            box_kpi.pack_start(k, True, True, 0)
        vbox.pack_start(box_kpi, False, False, 0)

        # 3. GRILLA BENTO COMPACTA (4x2)
        grid = Gtk.Grid()
        grid.set_column_spacing(8)
        grid.set_row_spacing(8)
        grid.set_column_homogeneous(True)
        grid.set_row_homogeneous(True)

        modulos = [
            ("Ceremonias", "Alta, edición y activación de actos académicos de colación.", "sigic-ceremonias", "calendario", "#818cf8", "#1e1b4b", "ACTOS", "Abrir Ceremonias"),
            ("Padrón y QRs", "CRUD de graduados, acompañantes, entregadores y Credencial QR.", "sigic-graduados", "graduados", "#34d399", "#064e3b", "PADRÓN + QR", "Abrir Padrón"),
            ("Portería y App Móvil", "Escáner QR/DNI en puerta y QRs de conexión App Móvil Portería.", "sigic-acreditacion", "escaner", "#fbbf24", "#451a03", "QR MÓVIL", "Abrir Portería"),
            ("Convocatoria OTP", "Despacho de invitaciones por correo, tokens OTP y pases QR.", "sigic-convocatoria", "convocatoria", "#38bdf8", "#0c4a6e", "EMAILS OTP", "Abrir Convocatoria"),
            ("Anfiteatro y Docentes", "Plano clicable de butacas (A1..F12) y profesores entregadores.", "sigic-preparacion", "anfiteatro", "#22d3ee", "#083344", "BUTACAS", "Abrir Anfiteatro"),
            ("Monitor en Vivo", "Llamador de escenario, entrega de diplomas y bitácora en vivo.", "sigic-envivo", "envivo", "#2dd4bf", "#134e4a", "ESTRADOS", "Abrir En Vivo"),
            ("Reportes y Actas", "Métricas por carrera, exportación CSV y Acta Oficial HTML.", "sigic-reportes", "reportes", "#c084fc", "#3b0764", "ACTAS / CSV", "Abrir Reportes"),
            ("Manual de Usuario", "Guía técnica y operativa completa del sistema SiGIC Beltrán.", "sigic-manual", "manual", "#60a5fa", "#172554", "GUÍA", "Abrir Manual"),
        ]

        for i, (titulo, desc, comando, icon_key, color_hex, bg_hex, tag_txt, btn_txt) in enumerate(modulos):
            card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=4)
            card.get_style_context().add_class("bento-card")

            top_row = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=6)
            pix_icon = render_svg_badge(ICON_PATHS[icon_key], color_hex, bg_hex, "#070f1d", 28)
            if pix_icon:
                top_row.pack_start(Gtk.Image.new_from_pixbuf(pix_icon), False, False, 0)

            lbl_t = Gtk.Label(xalign=0)
            lbl_t.set_markup(f"<span foreground='#f8fafc' weight='heavy' size='10200'>{titulo}</span>")
            top_row.pack_start(lbl_t, True, True, 0)

            tag_box = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL)
            tag_box.set_valign(Gtk.Align.CENTER)
            tag_box.get_style_context().add_class("tag-badge")
            lbl_tag = Gtk.Label()
            lbl_tag.set_markup(f"<span foreground='{color_hex}' weight='bold' size='7800'>{tag_txt}</span>")
            tag_box.pack_start(lbl_tag, False, False, 2)
            top_row.pack_end(tag_box, False, False, 0)
            card.pack_start(top_row, False, False, 0)

            lbl_d = Gtk.Label(xalign=0)
            lbl_d.set_markup(f"<span foreground='#94a3b8' size='8500'>{desc}</span>")
            lbl_d.set_line_wrap(True)
            lbl_d.set_line_wrap_mode(Pango.WrapMode.WORD_CHAR)
            lbl_d.set_max_width_chars(28)
            lbl_d.set_yalign(0.0)
            card.pack_start(lbl_d, True, True, 0)

            btn = Gtk.Button(label=f"{btn_txt} →")
            btn.get_style_context().add_class("btn-card-action")
            btn.connect("clicked", lambda b, cmd=comando: self.lanzar_modulo(cmd))
            card.pack_start(btn, False, False, 0)

            grid.attach(card, i % 4, i // 4, 1, 1)

        vbox.pack_start(grid, True, True, 0)

        # 4. FOOTER COMPACTO
        footer_box = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=8)
        footer_box.get_style_context().add_class("footer-bar")

        lbl_foot_left = Gtk.Label(xalign=0)
        lbl_foot_left.set_markup("<span foreground='#38bdf8' weight='bold' size='8500'>INSTITUTO TECNOLÓGICO BELTRÁN</span>  <span foreground='#64748b' size='8500'>·  Práctica Profesionalizante 2026</span>")
        footer_box.pack_start(lbl_foot_left, False, False, 0)

        lbl_foot_right = Gtk.Label(xalign=1)
        lbl_foot_right.set_markup("<span foreground='#94a3b8' size='8500'>Cancelo Julián · Alfonso Alan · Contreras Sol · Frassia Matías · Santillán Luis</span>")
        footer_box.pack_end(lbl_foot_right, False, False, 0)
        vbox.pack_start(footer_box, False, False, 0)

        self.refrescar_kpis()
        GLib.timeout_add_seconds(2, self._tick)

    def _crear_kpi(self, tit, val, sub, col):
        box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=1)
        box.get_style_context().add_class("kpi-card")
        l1 = Gtk.Label(xalign=0)
        l1.set_markup(f"<span foreground='#94a3b8' weight='bold' size='7800'>{tit}</span>")
        l2 = Gtk.Label(xalign=0)
        l2.set_markup(f"<span foreground='{col}' weight='heavy' size='11500'>{val}</span>")
        l3 = Gtk.Label(xalign=0)
        l3.set_markup(f"<span foreground='#64748b' size='8000'>{sub}</span>")
        box.pack_start(l1, False, False, 0)
        box.pack_start(l2, False, False, 0)
        box.pack_start(l3, False, False, 0)
        return l2, l3, box

    def _tick(self):
        self.lbl_reloj.set_markup(f"<span foreground='#34d399' weight='heavy' size='9500'>● ACTIVO  {datetime.now().strftime('%H:%M:%S')}</span>")
        self.refrescar_kpis()
        return True

    def refrescar_kpis(self):
        try:
            r = sigic_db.obtener_resumen_global()
            c = r["ceremonia"]
            self.lbl_k1_v.set_markup(f"<span foreground='#38bdf8' weight='heavy' size='10500'>{c.get('nombre', 'Colación 2026')[:26]}</span>")
            self.lbl_k1_s.set_markup(f"<span foreground='#64748b' size='8000'>{c.get('fecha', '')} · {c.get('hora', '')}</span>")

            self.lbl_k2_v.set_markup(f"<span foreground='#34d399' weight='heavy' size='11500'>{r['total']} Egresados</span>")
            self.lbl_k2_s.set_markup(f"<span foreground='#64748b' size='8000'>{r['confirmados']} confirmados ({r['porcentaje_confirmados']}%)</span>")

            self.lbl_k3_v.set_markup(f"<span foreground='#c084fc' weight='heavy' size='11500'>{r['butacas_ocupadas']} Butacas Asig.</span>")
            self.lbl_k3_s.set_markup(f"<span foreground='#64748b' size='8000'>{r['total_invitados']} acompañantes reg.</span>")

            self.lbl_k4_v.set_markup(f"<span foreground='#fbbf24' weight='heavy' size='11500'>{r['acreditados']} / {r['total']} en Sala</span>")
            self.lbl_k4_s.set_markup("<span foreground='#64748b' size='8000'>QR y App Móvil listos</span>")
        except Exception:
            pass

    def lanzar_modulo(self, comando):
        try:
            subprocess.Popen([comando])
        except Exception:
            nombre_script = comando.replace("sigic-", "") + ".py"
            ruta = f"/opt/sigic/{nombre_script}"
            if os.path.exists(ruta):
                subprocess.Popen(["python3", ruta])


def main():
    sigic_db.aplicar_css_oscuro(CSS_PORTAL)
    win = PortalSigic()
    win.connect("destroy", Gtk.main_quit)
    win.show_all()
    Gtk.main()


if __name__ == "__main__":
    main()
