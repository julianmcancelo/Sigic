#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC OS — Acerca del Sistema y Equipo de Desarrollo
Aplicación nativa GTK3 para entorno XFCE / Debian GNU/Linux.
"""

import os
import sys
import subprocess

try:
    import gi
    gi.require_version('Gtk', '3.0')
    gi.require_version('Gdk', '3.0')
    from gi.repository import Gtk, Gdk, GdkPixbuf, GLib
except Exception as e:
    print(f"Error cargando librerías GTK3: {e}")
    sys.exit(1)

CSS_ESTILOS = b"""
window.sigic-window {
    background-color: #f1f5f9;
}

headerbar.sigic-headerbar {
    background-color: #ffffff;
    border-bottom: 1px solid #e2e8f0;
}

.sigic-main-card {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 16px;
    padding: 20px;
}

.sigic-qr-card {
    background-color: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 14px;
    padding: 16px;
}

.title-main {
    font-size: 20px;
    font-weight: bold;
    color: #0f172a;
}

.title-section {
    font-size: 13px;
    font-weight: bold;
    color: #0284c7;
}

.text-institution {
    font-size: 12px;
    color: #64748b;
}

.team-member {
    font-size: 13px;
    font-weight: bold;
    color: #1e293b;
    padding: 3px 0px;
}

.spec-key {
    font-size: 12px;
    color: #64748b;
}

.spec-val {
    font-size: 12px;
    font-weight: bold;
    color: #0f172a;
}

.btn-primary {
    background-color: #0284c7;
    color: #ffffff;
    font-weight: bold;
    font-size: 13px;
    border-radius: 18px;
    padding: 8px 18px;
    border-width: 0px;
}

.btn-primary:hover {
    background-color: #0369a1;
}
"""

class AcercaDeSigic(Gtk.Window):
    def __init__(self):
        super().__init__(title="Acerca de SiGIC OS")
        self.set_default_size(740, 560)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.set_resizable(False)
        self.get_style_context().add_class("sigic-window")

        # HeaderBar nativo estilo GNOME / XFCE
        header = Gtk.HeaderBar()
        header.set_show_close_button(True)
        header.props.title = "Acerca de SiGIC OS"
        header.props.subtitle = "Instituto Tecnológico Beltrán"
        header.get_style_context().add_class("sigic-headerbar")
        self.set_titlebar(header)

        # Contenedor principal con margen
        box_principal = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=16)
        box_principal.set_margin_top(16)
        box_principal.set_margin_bottom(16)
        box_principal.set_margin_start(20)
        box_principal.set_margin_end(20)
        self.add(box_principal)

        # Fila superior: Logo institucional + Titular
        box_top = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=16)
        
        logo_path = "/opt/sigic/logo.png"
        if os.path.exists(logo_path):
            try:
                pixbuf_logo = GdkPixbuf.Pixbuf.new_from_file_at_scale(logo_path, -1, 46, True)
                img_logo = Gtk.Image.new_from_pixbuf(pixbuf_logo)
                box_top.pack_start(img_logo, False, False, 0)
            except Exception:
                pass

        box_titulos = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=3)
        lbl_titulo = Gtk.Label(xalign=0)
        lbl_titulo.set_markup("<span class='title-main'>SiGIC OS</span>  <small><span foreground='#0284c7' weight='bold'>Edición Institucional</span></small>")
        lbl_sub = Gtk.Label(xalign=0)
        lbl_sub.set_markup("<span class='text-institution'>Sistema de Gestión Institucional de Colaciones — Práctica Profesionalizante 2026</span>")
        box_titulos.pack_start(lbl_titulo, False, False, 0)
        box_titulos.pack_start(lbl_sub, False, False, 0)
        box_top.pack_start(box_titulos, True, True, 0)

        box_principal.pack_start(box_top, False, False, 0)

        # Tarjeta central dividida en dos columnas
        card_central = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=24)
        card_central.get_style_context().add_class("sigic-main-card")

        # Columna Izquierda: Equipo de Desarrollo y Datos Técnicos
        col_izq = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)

        lbl_sec_equipo = Gtk.Label(xalign=0)
        lbl_sec_equipo.set_markup("<span class='title-section'>Equipo de Desarrollo</span>")
        col_izq.pack_start(lbl_sec_equipo, False, False, 0)

        integrantes = [
            "Cancelo Julián",
            "Alfonso Alan Alexis",
            "Contreras Villalba Sol Heilin",
            "Frassia Matías",
            "Santillán Luis Gabriel"
        ]

        box_equipo = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=2)
        for miembro in integrantes:
            lbl_m = Gtk.Label(xalign=0)
            lbl_m.set_markup(f"<span class='team-member'>•  {miembro}</span>")
            box_equipo.pack_start(lbl_m, False, False, 0)
        col_izq.pack_start(box_equipo, False, False, 4)

        # Separador horizontal
        sep = Gtk.Separator(orientation=Gtk.Orientation.HORIZONTAL)
        col_izq.pack_start(sep, False, False, 4)

        lbl_sec_specs = Gtk.Label(xalign=0)
        lbl_sec_specs.set_markup("<span class='title-section'>Detalles del Sistema</span>")
        col_izq.pack_start(lbl_sec_specs, False, False, 0)

        grid_specs = Gtk.Grid()
        grid_specs.set_row_spacing(5)
        grid_specs.set_column_spacing(14)

        specs = [
            ("Distribución:", "Debian GNU/Linux 12 (Bookworm)"),
            ("Entorno gráfico:", "XFCE 4.18 Desktop"),
            ("Plataforma web:", "Next.js 16 / Node.js LTS"),
            ("Base de datos:", "PostgreSQL"),
            ("Institución:", "Instituto Tecnológico Beltrán")
        ]

        for fila, (k, v) in enumerate(specs):
            lbl_k = Gtk.Label(xalign=0)
            lbl_k.set_markup(f"<span class='spec-key'>{k}</span>")
            lbl_v = Gtk.Label(xalign=0)
            lbl_v.set_markup(f"<span class='spec-val'>{v}</span>")
            grid_specs.attach(lbl_k, 0, fila, 1, 1)
            grid_specs.attach(lbl_v, 1, fila, 1, 1)

        col_izq.pack_start(grid_specs, False, False, 0)
        card_central.pack_start(col_izq, True, True, 0)

        # Columna Derecha: Tarjeta con Código QR y Acceso Directo
        col_der = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        col_der.set_size_request(240, -1)
        col_der.get_style_context().add_class("sigic-qr-card")

        lbl_qr_title = Gtk.Label(xalign=0.5)
        lbl_qr_title.set_markup("<span class='title-section'>Portal Institucional</span>")
        col_der.pack_start(lbl_qr_title, False, False, 0)

        qr_path_png = "/opt/sigic/qr-sigic.png"
        qr_path_svg = "/opt/sigic/qr-sigic.svg"
        img_qr = None
        if os.path.exists(qr_path_png):
            try:
                pixbuf_qr = GdkPixbuf.Pixbuf.new_from_file_at_scale(qr_path_png, 180, 180, True)
                img_qr = Gtk.Image.new_from_pixbuf(pixbuf_qr)
            except Exception:
                pass
        elif os.path.exists(qr_path_svg):
            try:
                pixbuf_qr = GdkPixbuf.Pixbuf.new_from_file_at_scale(qr_path_svg, 180, 180, True)
                img_qr = Gtk.Image.new_from_pixbuf(pixbuf_qr)
            except Exception:
                pass

        if img_qr:
            col_der.pack_start(img_qr, False, False, 4)

        lbl_qr_desc = Gtk.Label(xalign=0.5)
        lbl_qr_desc.set_markup("<small><span foreground='#64748b'>Escaneá con tu teléfono o hacé clic abajo para ingresar</span></small>")
        lbl_qr_desc.set_line_wrap(True)
        lbl_qr_desc.set_justify(Gtk.Justification.CENTER)
        col_der.pack_start(lbl_qr_desc, False, False, 0)

        btn_web = Gtk.Button(label="Abrir www.sigic.com.ar")
        btn_web.get_style_context().add_class("btn-primary")
        btn_web.connect("clicked", self.on_abrir_web)
        col_der.pack_start(btn_web, False, False, 6)

        card_central.pack_start(col_der, False, False, 0)
        box_principal.pack_start(card_central, True, True, 0)

        # Fila inferior: Estado de plataforma + Botón cerrar
        box_bottom = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=12)
        
        lbl_status = Gtk.Label(xalign=0)
        lbl_status.set_markup("<span foreground='#10b981'>●</span> <small><span foreground='#475569' weight='bold'>Sistema operativo listo · Servicio local activo en puerto 3000</span></small>")
        box_bottom.pack_start(lbl_status, True, True, 0)

        btn_cerrar = Gtk.Button(label="Cerrar")
        btn_cerrar.connect("clicked", lambda b: self.destroy())
        box_bottom.pack_start(btn_cerrar, False, False, 0)

        box_principal.pack_start(box_bottom, False, False, 0)

    def on_abrir_web(self, widget):
        url = "https://www.sigic.com.ar"
        try:
            Gtk.show_uri_on_window(self, url, Gdk.CURRENT_TIME)
        except Exception:
            subprocess.Popen(["xdg-open", url])

def aplicar_estilos():
    try:
        css_provider = Gtk.CssProvider()
        css_provider.load_from_data(CSS_ESTILOS)
        screen = Gdk.Screen.get_default()
        if screen:
            Gtk.StyleContext.add_provider_for_screen(
                screen,
                css_provider,
                Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
            )
    except Exception as err:
        print(f"Aviso CSS: {err}")

def main():
    win = AcercaDeSigic()
    aplicar_estilos()
    win.connect("destroy", Gtk.main_quit)
    win.show_all()
    Gtk.main()

if __name__ == "__main__":
    main()
