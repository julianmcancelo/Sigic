#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC — Preparación de Sala, Anfiteatro y Asignación de Diplomas
Aplicación nativa GTK3 para visualizar la distribución del escenario y butacas.
"""

import os
import sys
import json
import urllib.request
import threading

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
    background-color: #f1f5f9;
}

headerbar.sigic-headerbar {
    background-color: #ffffff;
    border-bottom: 1px solid #cbd5e1;
}

.card-white {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    padding: 16px;
}

.stage-box {
    background-color: #0284c7;
    color: #ffffff;
    font-size: 14px;
    font-weight: 900;
    border-radius: 8px;
    padding: 12px;
}

.seat-grad {
    background-color: #0284c7;
    color: #ffffff;
    border-radius: 4px;
    font-size: 10px;
    font-weight: bold;
    padding: 4px;
}

.seat-invitado {
    background-color: #64748b;
    color: #ffffff;
    border-radius: 4px;
    font-size: 10px;
    font-weight: bold;
    padding: 4px;
}

.seat-libre {
    background-color: #e2e8f0;
    color: #475569;
    border-radius: 4px;
    font-size: 10px;
    font-weight: bold;
    padding: 4px;
}

button.btn-primary {
    background-image: none;
    background-color: #0284c7;
    border-color: #0284c7;
    color: #ffffff;
    font-size: 12px;
    font-weight: bold;
    border-radius: 8px;
    padding: 8px 16px;
    border-width: 0px;
}
"""

class PreparacionSigic(Gtk.Window):
    def __init__(self):
        super().__init__(title="Preparación de Ceremonia y Anfiteatro — SiGIC")
        self.set_default_size(840, 580)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.get_style_context().add_class("sigic-window")

        header = Gtk.HeaderBar()
        header.set_show_close_button(True)
        header.props.title = "Preparación y Anfiteatro"
        header.props.subtitle = "Distribución de butacas y asignación de docentes entregadores"
        header.get_style_context().add_class("sigic-headerbar")
        self.set_titlebar(header)

        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=14)
        vbox.set_margin_top(14)
        vbox.set_margin_bottom(14)
        vbox.set_margin_start(18)
        vbox.set_margin_end(18)
        self.add(vbox)

        # Resumen superior
        box_top = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=12)
        box_top.get_style_context().add_class("card-white")

        lbl_info = Gtk.Label(xalign=0)
        lbl_info.set_markup("<span foreground='#0f172a' weight='heavy' size='11500'>Anfiteatro Central — Instituto Beltrán</span>\n<small><span foreground='#64748b'>Capacidad total: 200 butacas • 48 Graduados (Sector Preferencial A y B) • 144 Acompañantes</span></small>")
        box_top.pack_start(lbl_info, True, True, 0)

        badge = Gtk.Label()
        badge.set_markup("<span foreground='#0284c7' weight='heavy'>● DISPOSICIÓN CONFIRMADA</span>")
        box_top.pack_start(badge, False, False, 0)
        vbox.pack_start(box_top, False, False, 0)

        # Representación visual del escenario y sectores
        box_sala = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=12)
        box_sala.get_style_context().add_class("card-white")

        # Escenario
        box_stage = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL)
        box_stage.get_style_context().add_class("stage-box")
        lbl_st = Gtk.Label(label="ESCENARIO PRINCIPAL / ESTRADO INSTITUCIONAL BELTRÁN")
        box_stage.pack_start(lbl_st, True, True, 0)
        box_sala.pack_start(box_stage, False, False, 0)

        # Referencias
        box_ref = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=16)
        r1 = Gtk.Label()
        r1.set_markup("<span foreground='#0284c7' weight='heavy'>■</span> <small>Graduados (Filas A-D)</small>")
        r2 = Gtk.Label()
        r2.set_markup("<span foreground='#64748b' weight='heavy'>■</span> <small>Familiares e Invitados (Filas E-L)</small>")
        r3 = Gtk.Label()
        r3.set_markup("<span foreground='#cbd5e1' weight='heavy'>■</span> <small>Libres / Reserva</small>")
        box_ref.pack_start(r1, False, False, 0)
        box_ref.pack_start(r2, False, False, 0)
        box_ref.pack_start(r3, False, False, 0)
        box_sala.pack_start(box_ref, False, False, 4)

        # Grilla de butacas representativa
        grid_seats = Gtk.Grid()
        grid_seats.set_column_spacing(6)
        grid_seats.set_row_spacing(6)
        grid_seats.set_column_homogeneous(True)

        filas = ["A", "B", "C", "D", "E", "F"]
        for r_idx, f in enumerate(filas):
            lbl_f = Gtk.Label(label=f)
            grid_seats.attach(lbl_f, 0, r_idx, 1, 1)
            for c_idx in range(1, 13):
                box_s = Gtk.EventBox()
                lbl_num = Gtk.Label(label=f"{f}{c_idx}")
                box_s.add(lbl_num)
                if r_idx < 4:
                    box_s.get_style_context().add_class("seat-grad")
                elif c_idx <= 8:
                    box_s.get_style_context().add_class("seat-invitado")
                else:
                    box_s.get_style_context().add_class("seat-libre")
                grid_seats.attach(box_s, c_idx, r_idx, 1, 1)

        box_sala.pack_start(grid_seats, True, True, 8)
        vbox.pack_start(box_sala, True, True, 0)

        # Fila de profesores entregadores asignados
        box_prof = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=12)
        box_prof.get_style_context().add_class("card-white")
        lbl_p_info = Gtk.Label(xalign=0)
        lbl_p_info.set_markup("<span foreground='#0f172a' weight='heavy'>Docentes Entregadores de Título:</span>\n<small><span foreground='#475569'>Prof. Roberto Gómez (Informática) • Ing. Marcelo Domínguez (Automatización) • Lic. Andrea Morales</span></small>")
        box_prof.pack_start(lbl_p_info, True, True, 0)
        vbox.pack_start(box_prof, False, False, 0)

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
    win = PreparacionSigic()
    aplicar_estilos()
    win.connect("destroy", Gtk.main_quit)
    win.show_all()
    Gtk.main()

if __name__ == "__main__":
    main()
