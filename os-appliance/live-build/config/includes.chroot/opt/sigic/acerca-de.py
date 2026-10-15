#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC — Acerca del Sistema y Equipo de Desarrollo
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
    border-bottom: 1px solid #cbd5e1;
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

button.btn-primary {
    background-color: #0284c7;
    color: #ffffff;
    border-radius: 12px;
    padding: 9px 18px;
    border-width: 0px;
    font-weight: bold;
}

button.btn-primary:hover {
    background-color: #0369a1;
}

button.btn-secondary {
    background-color: #ffffff;
    color: #334155;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    padding: 6px 16px;
    font-weight: bold;
}

button.btn-secondary:hover {
    background-color: #f1f5f9;
}
"""

class QRWidget(Gtk.DrawingArea):
    """Renderizador Cairo vectorial de alta fidelidad para el QR de https://www.sigic.com.ar"""
    MATRIX = [
        "1111111010001010101111111",
        "1000001010001000101000001",
        "1011101011111100101011101",
        "1011101001100100101011101",
        "1011101010001010101011101",
        "1000001001111100001000001",
        "1111111010101010101111111",
        "0000000001111100000000000",
        "1001111110010010110010111",
        "0011000101000111010111110",
        "0011101100110101101101001",
        "1001000001101011000101111",
        "1111001011010001101000001",
        "1100010010101011110010010",
        "1110101001100111011011111",
        "1001010111101000110101101",
        "1010111110011110111110110",
        "0000000011110100100010110",
        "1111111010101000101010001",
        "1000001011110111100010001",
        "1011101011011011111110000",
        "1011101010001011001000011",
        "1011101000111011010011111",
        "1000001000001011000110111",
        "1111111011110000110001001"
    ]

    def __init__(self, size=164):
        super().__init__()
        self.set_size_request(size, size)
        self.connect("draw", self.on_draw)

    def on_draw(self, widget, cr):
        w = widget.get_allocated_width()
        h = widget.get_allocated_height()

        # Marco blanco con esquinas redondeadas
        cr.set_source_rgb(1.0, 1.0, 1.0)
        cr.rectangle(0, 0, w, h)
        cr.fill()

        n = len(self.MATRIX)
        padding = 10
        side = min(w, h) - (padding * 2)
        cell = side / n
        start_x = (w - (n * cell)) / 2.0
        start_y = (h - (n * cell)) / 2.0

        # Módulos azul marino oscuro de SiGIC
        cr.set_source_rgb(0.06, 0.10, 0.18)
        for r, row in enumerate(self.MATRIX):
            for c, bit in enumerate(row):
                if bit == '1':
                    cr.rectangle(
                        start_x + (c * cell),
                        start_y + (r * cell),
                        cell + 0.1,
                        cell + 0.1
                    )
        cr.fill()
        return False

class AcercaDeSigic(Gtk.Window):
    def __init__(self):
        super().__init__(title="Acerca de SiGIC")
        self.set_default_size(740, 560)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.set_resizable(False)
        self.get_style_context().add_class("sigic-window")

        # HeaderBar nativo estilo GNOME / XFCE
        header = Gtk.HeaderBar()
        header.set_show_close_button(True)
        header.props.title = "Acerca de SiGIC"
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
        lbl_titulo.set_markup("<span foreground='#0f172a' weight='heavy' size='15000'>SiGIC</span>  <small><span foreground='#0284c7' weight='bold'>Edición Institucional</span></small>")
        lbl_sub = Gtk.Label(xalign=0)
        lbl_sub.set_markup("<span foreground='#64748b' weight='bold' size='10500'>Sistema de Gestión Institucional de Colaciones — Práctica Profesionalizante 2026</span>")
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
        lbl_sec_equipo.set_markup("<span foreground='#0284c7' weight='heavy' size='11000'>EQUIPO DE DESARROLLO</span>")
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
            lbl_m.set_markup(f"<span foreground='#1e293b' weight='bold'>•  {miembro}</span>")
            box_equipo.pack_start(lbl_m, False, False, 0)
        col_izq.pack_start(box_equipo, False, False, 4)

        # Separador horizontal
        sep = Gtk.Separator(orientation=Gtk.Orientation.HORIZONTAL)
        col_izq.pack_start(sep, False, False, 4)

        lbl_sec_specs = Gtk.Label(xalign=0)
        lbl_sec_specs.set_markup("<span foreground='#0284c7' weight='heavy' size='11000'>DETALLES DEL SISTEMA</span>")
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
            lbl_k.set_markup(f"<span foreground='#64748b' weight='bold'>{k}</span>")
            lbl_v = Gtk.Label(xalign=0)
            lbl_v.set_markup(f"<span foreground='#0f172a' weight='bold'>{v}</span>")
            grid_specs.attach(lbl_k, 0, fila, 1, 1)
            grid_specs.attach(lbl_v, 1, fila, 1, 1)

        col_izq.pack_start(grid_specs, False, False, 0)
        card_central.pack_start(col_izq, True, True, 0)

        # Columna Derecha: Tarjeta con Código QR Vectorial y Acceso Directo
        col_der = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
        col_der.set_size_request(240, -1)
        col_der.get_style_context().add_class("sigic-qr-card")

        lbl_qr_title = Gtk.Label(xalign=0.5)
        lbl_qr_title.set_markup("<span foreground='#0284c7' weight='heavy' size='11000'>PORTAL INSTITUCIONAL</span>")
        col_der.pack_start(lbl_qr_title, False, False, 0)

        # Widget QR Vectorial Cairo (100% garantizado)
        self.qr_widget = QRWidget(size=164)
        box_qr_align = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL)
        box_qr_align.set_halign(Gtk.Align.CENTER)
        box_qr_align.pack_start(self.qr_widget, False, False, 0)
        col_der.pack_start(box_qr_align, False, False, 2)

        lbl_qr_desc = Gtk.Label(xalign=0.5)
        lbl_qr_desc.set_markup("<small><span foreground='#475569' weight='bold'>Escaneá con tu teléfono o hacé clic abajo para ingresar</span></small>")
        lbl_qr_desc.set_line_wrap(True)
        lbl_qr_desc.set_justify(Gtk.Justification.CENTER)
        col_der.pack_start(lbl_qr_desc, False, False, 0)

        btn_web = Gtk.Button()
        lbl_btn = Gtk.Label()
        lbl_btn.set_markup("<span foreground='#ffffff' weight='heavy' size='10500'>Abrir www.sigic.com.ar</span>")
        btn_web.add(lbl_btn)
        btn_web.get_style_context().add_class("btn-primary")
        btn_web.connect("clicked", self.on_abrir_web)
        col_der.pack_start(btn_web, False, False, 4)

        card_central.pack_start(col_der, False, False, 0)
        box_principal.pack_start(card_central, True, True, 0)

        # Fila inferior: Estado de plataforma + Botón cerrar
        box_bottom = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=12)
        
        lbl_status = Gtk.Label(xalign=0)
        lbl_status.set_markup("<span foreground='#10b981'>●</span> <small><span foreground='#334155' weight='bold'>Sistema listo · Servicio local activo en puerto 3000</span></small>")
        box_bottom.pack_start(lbl_status, True, True, 0)

        btn_cerrar = Gtk.Button()
        lbl_cerrar = Gtk.Label()
        lbl_cerrar.set_markup("<span foreground='#334155' weight='bold'>Cerrar</span>")
        btn_cerrar.add(lbl_cerrar)
        btn_cerrar.get_style_context().add_class("btn-secondary")
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
