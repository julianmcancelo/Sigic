#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC — Gestión Nativa de Ceremonias de Colación
Aplicación nativa GTK3 para consultar y gestionar actos institucionales.
"""

import os
import sys
import json
import urllib.request
import subprocess
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

.card-ceremonia {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    padding: 16px;
}

.card-ceremonia.activa {
    border: 2px solid #0284c7;
    background-color: #f0f9ff;
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

button.btn-primary:hover {
    background-image: none;
    background-color: #0369a1;
    border-color: #0369a1;
}

button.btn-secondary {
    background-image: none;
    background-color: #ffffff;
    color: #334155;
    font-size: 12px;
    font-weight: bold;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 8px 16px;
}

button.btn-secondary:hover {
    background-image: none;
    background-color: #f8fafc;
}
"""

CEREMONIAS_DEMO = [
    {
        "id": 1,
        "nombre": "Colación Beltrán 2026 — Tecnicaturas",
        "fecha": "28 de Noviembre de 2026",
        "hora": "18:00 hs",
        "lugar": "Anfiteatro Central — Instituto Beltrán",
        "activa": True,
        "graduados": 48,
        "aforo": 200
    },
    {
        "id": 2,
        "nombre": "Colación Beltrán 2026 — Ingeniería y Posgrados",
        "fecha": "05 de Diciembre de 2026",
        "hora": "19:00 hs",
        "lugar": "Aula Magna Beltrán",
        "activa": False,
        "graduados": 35,
        "aforo": 150
    }
]

class CeremoniasSigic(Gtk.Window):
    def __init__(self):
        super().__init__(title="Ceremonias de Colación — SiGIC")
        self.set_default_size(780, 520)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.get_style_context().add_class("sigic-window")

        # HeaderBar institucional
        header = Gtk.HeaderBar()
        header.set_show_close_button(True)
        header.props.title = "Ceremonias de Colación"
        header.props.subtitle = "Instituto Tecnológico Beltrán"
        header.get_style_context().add_class("sigic-headerbar")
        self.set_titlebar(header)

        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=14)
        vbox.set_margin_top(14)
        vbox.set_margin_bottom(14)
        vbox.set_margin_start(18)
        vbox.set_margin_end(18)
        self.add(vbox)

        # Encabezado con botón de recarga
        box_top = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=12)
        lbl_info = Gtk.Label(xalign=0)
        lbl_info.set_markup("<span foreground='#0f172a' weight='heavy' size='12000'>Actos Institucionales Registrados</span>\n<small><span foreground='#64748b'>Visualizá y gestioná el evento de colación activo en el sistema.</span></small>")
        box_top.pack_start(lbl_info, True, True, 0)

        btn_web = Gtk.Button()
        lbl_w = Gtk.Label()
        lbl_w.set_markup("<span foreground='#334155' weight='bold'>Actualizar</span>")
        btn_web.add(lbl_w)
        btn_web.get_style_context().add_class("btn-secondary")
        btn_web.connect("clicked", lambda b: self.cargar_ceremonias())
        box_top.pack_start(btn_web, False, False, 0)

        vbox.pack_start(box_top, False, False, 0)

        # Contenedor scrolleable para las tarjetas
        scroll = Gtk.ScrolledWindow()
        scroll.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC)
        self.box_cards = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=12)
        scroll.add(self.box_cards)
        vbox.pack_start(scroll, True, True, 0)

        self.cargar_ceremonias()

    def cargar_ceremonias(self):
        threading.Thread(target=self._hilo_carga, daemon=True).start()

    def _hilo_carga(self):
        url = "http://localhost:3000/api/ceremonias"
        items = []
        try:
            req = urllib.request.Request(url, timeout=3)
            with urllib.request.urlopen(req) as resp:
                res = json.loads(resp.read().decode())
                items = res.get("ceremonias") or []
        except Exception:
            pass

        if not items:
            items = CEREMONIAS_DEMO

        GLib.idle_add(self._renderizar_ceremonias, items)

    def _renderizar_ceremonias(self, items):
        for child in self.box_cards.get_children():
            self.box_cards.remove(child)

        for c in items:
            card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
            card.get_style_context().add_class("card-ceremonia")

            es_activa = c.get("activa", False)
            if es_activa:
                card.get_style_context().add_class("activa")

            # Fila superior de la tarjeta: Título + Badge de Estado
            box_h = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
            lbl_tit = Gtk.Label(xalign=0)
            lbl_tit.set_markup(f"<span foreground='#0f172a' weight='heavy' size='11500'>{c.get('nombre', 'Acto de Colación')}</span>")
            box_h.pack_start(lbl_tit, True, True, 0)

            badge = Gtk.Label()
            if es_activa:
                badge.set_markup("<span foreground='#0284c7' weight='heavy'>● CEREMONIA ACTIVA</span>")
            else:
                badge.set_markup("<span foreground='#64748b' weight='bold'>PROGRAMADA</span>")
            box_h.pack_start(badge, False, False, 0)
            card.pack_start(box_h, False, False, 0)

            # Detalles
            lbl_det = Gtk.Label(xalign=0)
            fecha = c.get("fecha", "A definir")
            hora = c.get("hora", "")
            lugar = c.get("lugar", "Instituto Beltrán")
            graduados = c.get("graduados", 0)
            aforo = c.get("aforo", 200)

            lbl_det.set_markup(
                f"<small><span foreground='#475569'>Fecha y Hora:</span> <span weight='bold'>{fecha} {hora}</span>  •  "
                f"<span foreground='#475569'>Lugar:</span> <span weight='bold'>{lugar}</span>\n"
                f"<span foreground='#475569'>Graduados Inscriptos:</span> <span weight='bold'>{graduados}</span>  •  "
                f"<span foreground='#475569'>Capacidad del Anfiteatro:</span> <span weight='bold'>{aforo} butacas</span></small>"
            )
            card.pack_start(lbl_det, False, False, 0)

            self.box_cards.pack_start(card, False, False, 0)

        self.box_cards.show_all()

def aplicar_estilos():
    try:
        css_provider = Gtk.CssProvider()
        css_provider.load_from_data(CSS_ESTILOS)
        screen = Gdk.Screen.get_default()
        if screen:
            Gtk.StyleContext.add_provider_for_screen(screen, css_provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION)
    except Exception as e:
        print(f"Aviso CSS: {e}")

def main():
    win = CeremoniasSigic()
    aplicar_estilos()
    win.connect("destroy", Gtk.main_quit)
    win.show_all()
    Gtk.main()

if __name__ == "__main__":
    main()
