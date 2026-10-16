#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC — Monitor de Ceremonia en Vivo
Aplicación nativa GTK3 para el seguimiento en tiempo real del acto de colación.
"""

import os
import sys
import json
import urllib.request
import threading
from datetime import datetime

try:
    import gi
    gi.require_version('Gtk', '3.0')
    gi.require_version('Gdk', '3.0')
    from gi.repository import Gtk, Gdk, GdkPixbuf, GLib
except Exception as err:
    print(f"Error cargando librerías GTK3: {err}")
    sys.exit(1)

CSS_ESTILOS = b"""
window.sigic-window {
    background-color: #0b1523;
}

headerbar.sigic-headerbar {
    background-color: #0f1c30;
    border-bottom: 1px solid #1e293b;
}

.card-dark {
    background-color: #111e33;
    border: 1px solid #1e293b;
    border-radius: 12px;
    padding: 16px;
}

.live-badge {
    background-color: #ef4444;
    color: #ffffff;
    font-size: 11px;
    font-weight: 900;
    border-radius: 6px;
    padding: 4px 10px;
}

.metric-big {
    font-size: 32px;
    font-weight: 900;
    color: #38bdf8;
}

.metric-lbl {
    font-size: 11px;
    font-weight: bold;
    color: #94a3b8;
}

progressbar progress {
    background-color: #0284c7;
    border-radius: 6px;
}

progressbar trough {
    background-color: #1e293b;
    border-radius: 6px;
}
"""

class EnVivoSigic(Gtk.Window):
    def __init__(self):
        super().__init__(title="Monitor en Vivo de Ceremonia — SiGIC")
        self.set_default_size(840, 560)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.get_style_context().add_class("sigic-window")

        header = Gtk.HeaderBar()
        header.set_show_close_button(True)
        header.props.title = "Monitor en Vivo"
        header.props.subtitle = "Seguimiento en directo del acto de colación"
        header.get_style_context().add_class("sigic-headerbar")
        self.set_titlebar(header)

        badge = Gtk.Label(label="● EN VIVO")
        badge.get_style_context().add_class("live-badge")
        header.pack_end(badge)

        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=14)
        vbox.set_margin_top(14)
        vbox.set_margin_bottom(14)
        vbox.set_margin_start(18)
        vbox.set_margin_end(18)
        self.add(vbox)

        # Fila de métricas en directo
        box_kpi = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=12)
        box_kpi.set_homogeneous(True)

        self.k1 = self._crear_kpi("42 / 48", "Graduados en Sala", "87.5% de asistencia")
        self.k2 = self._crear_kpi("126 / 144", "Invitados Ingresados", "Portería abierta")
        self.k3 = self._crear_kpi("168 / 200", "Ocupación Total", "Anfiteatro Beltrán")

        box_kpi.pack_start(self.k1, True, True, 0)
        box_kpi.pack_start(self.k2, True, True, 0)
        box_kpi.pack_start(self.k3, True, True, 0)
        vbox.pack_start(box_kpi, False, False, 0)

        # Barra de progreso general de acreditación
        box_prog = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        box_prog.get_style_context().add_class("card-dark")

        lbl_pb = Gtk.Label(xalign=0)
        lbl_pb.set_markup("<span foreground='#f8fafc' weight='heavy'>Avance de Acreditación de Sala (84%)</span>")
        box_prog.pack_start(lbl_pb, False, False, 0)

        self.pbar = Gtk.ProgressBar()
        self.pbar.set_fraction(0.84)
        box_prog.pack_start(self.pbar, False, False, 0)
        vbox.pack_start(box_prog, False, False, 0)

        # Flujo de últimas acreditaciones en tiempo real
        scroll = Gtk.ScrolledWindow()
        scroll.set_policy(Gtk.PolicyType.AUTOMATIC, Gtk.PolicyType.AUTOMATIC)
        scroll.get_style_context().add_class("card-dark")

        self.store = Gtk.ListStore(str, str, str, str)
        self.tree = Gtk.TreeView(model=self.store)
        self.tree.set_rules_hint(True)

        cols = ["Hora Ingreso", "Nombre y Apellido", "Rol / Ubicación", "Estado Portería"]
        for i, c in enumerate(cols):
            renderer = Gtk.CellRendererText()
            column = Gtk.TreeViewColumn(c, renderer, text=i)
            self.tree.append_column(column)

        scroll.add(self.tree)
        vbox.pack_start(scroll, True, True, 0)

        self.cargar_datos_demo()

    def _crear_kpi(self, val, tit, sub):
        card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=2)
        card.get_style_context().add_class("card-dark")
        lbl_v = Gtk.Label(xalign=0)
        lbl_v.set_markup(f"<span foreground='#38bdf8' weight='heavy' size='20000'>{val}</span>")
        card.pack_start(lbl_v, False, False, 0)

        lbl_t = Gtk.Label(xalign=0)
        lbl_t.set_markup(f"<span foreground='#94a3b8' weight='heavy' size='9000'>{tit.upper()}</span>")
        card.pack_start(lbl_t, False, False, 0)

        lbl_s = Gtk.Label(xalign=0)
        lbl_s.set_markup(f"<small><span foreground='#64748b'>{sub}</span></small>")
        card.pack_start(lbl_s, False, False, 0)
        return card

    def cargar_datos_demo(self):
        items = [
            ("18:14:22", "Álvarez Sofía", "Graduada — Butaca A-04", "Ingreso Validado QR"),
            ("18:13:50", "Acompañante de Álvarez Sofía", "Invitado — Butaca E-08", "Ingreso Validado QR"),
            ("18:12:10", "Benítez Lucas", "Graduado — Butaca A-05", "Ingreso Validado QR"),
            ("18:10:04", "Castro Lucía", "Graduada — Butaca B-01", "Ingreso Validado QR"),
            ("18:08:45", "Fernández Paula", "Graduada — Butaca B-02", "Ingreso Validado QR"),
            ("18:05:12", "González Tomás", "Graduado — Butaca B-03", "Ingreso Validado QR"),
        ]
        for row in items:
            self.store.append(list(row))

def aplicar_estilos():
    try:
        css_provider = Gtk.CssProvider()
        css_provider.load_from_data(CSS_ESTILOS)
        screen = Gdk.Screen.get_default()
        if screen:
            Gtk.StyleContext.add_provider_for_screen(screen, css_provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION)
    except Exception as err:
        print(f"Aviso CSS: {err}")

def main():
    win = EnVivoSigic()
    aplicar_estilos()
    win.connect("destroy", Gtk.main_quit)
    win.show_all()
    Gtk.main()

if __name__ == "__main__":
    main()
