#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC — Portal Institucional Nativo (Centro de Control)
Dashboard Bento Grid nativo en Python 3 + GTK 3 para Linux.
Proporciona acceso directo a todos los módulos nativos del sistema sin requerir navegador.
"""

import os
import sys
import json
import urllib.request
import subprocess
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

.top-pill {
    background-color: #0284c7;
    color: #ffffff;
    font-size: 11px;
    font-weight: bold;
    border-radius: 6px;
    padding: 3px 8px;
    border: none;
}

.bento-card {
    background-color: #111e33;
    border: 1px solid #1e293b;
    border-radius: 12px;
    padding: 16px;
}

.bento-card:hover {
    border-color: #0284c7;
    background-color: #162640;
}

.bento-title {
    color: #f8fafc;
    font-size: 14px;
    font-weight: bold;
}

.bento-desc {
    color: #94a3b8;
    font-size: 11px;
}

.bento-metric {
    color: #38bdf8;
    font-size: 26px;
    font-weight: 900;
}

.bento-label {
    color: #64748b;
    font-size: 11px;
    font-weight: bold;
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
}

button.btn-module {
    background-image: none;
    background-color: #1e293b;
    color: #f1f5f9;
    font-size: 12px;
    font-weight: bold;
    border-radius: 8px;
    padding: 10px 14px;
    border: 1px solid #334155;
}

button.btn-module:hover {
    background-image: none;
    background-color: #0284c7;
    color: #ffffff;
    border-color: #0284c7;
}

.footer-system {
    color: #475569;
    font-size: 11px;
    padding: 8px;
}
"""

class PortalSigic(Gtk.Window):
    def __init__(self):
        super().__init__(title="SiGIC — Portal Institucional Beltrán")
        self.set_default_size(920, 620)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.get_style_context().add_class("sigic-window")

        # HeaderBar institucional
        header = Gtk.HeaderBar()
        header.set_show_close_button(True)
        header.props.title = "SiGIC — Centro de Control"
        header.props.subtitle = "Instituto Tecnológico Beltrán"
        header.get_style_context().add_class("sigic-headerbar")
        self.set_titlebar(header)

        btn_ajustes = Gtk.Button()
        lbl_aj = Gtk.Label()
        lbl_aj.set_markup("<span foreground='#38bdf8' weight='bold'>Ajustes</span>")
        btn_ajustes.add(lbl_aj)
        btn_ajustes.get_style_context().add_class("btn-module")
        btn_ajustes.connect("clicked", lambda b: self.lanzar_modulo("sigic-ajustes"))
        header.pack_end(btn_ajustes)

        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=14)
        vbox.set_margin_top(16)
        vbox.set_margin_bottom(12)
        vbox.set_margin_start(20)
        vbox.set_margin_end(20)
        self.add(vbox)

        # Fila superior de métricas del evento activo
        box_kpi = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=14)
        box_kpi.set_homogeneous(True)

        self.kpi_ceremonia = self._crear_kpi_card("Ceremonia Activa", "Colación Beltrán 2026", "28 Nov 18:00 hs")
        self.kpi_graduados = self._crear_kpi_card("Graduados Padrón", "48", "94% confirmados")
        self.kpi_butacas = self._crear_kpi_card("Capacidad Sala", "200", "Anfiteatro Central")
        self.kpi_acreditados = self._crear_kpi_card("Acreditación", "En espera", "Portería lista")

        box_kpi.pack_start(self.kpi_ceremonia, True, True, 0)
        box_kpi.pack_start(self.kpi_graduados, True, True, 0)
        box_kpi.pack_start(self.kpi_butacas, True, True, 0)
        box_kpi.pack_start(self.kpi_acreditados, True, True, 0)
        vbox.pack_start(box_kpi, False, False, 0)

        # Título de módulos nativos
        lbl_sec = Gtk.Label(xalign=0)
        lbl_sec.set_markup("<span foreground='#f8fafc' weight='heavy' size='12000'>Módulos Nativos de Gestión Institucional</span>\n<small><span foreground='#64748b'>Cada herramienta se ejecuta de forma nativa e independiente en el sistema.</span></small>")
        vbox.pack_start(lbl_sec, False, False, 4)

        # Grilla de módulos Bento Grid (4x2)
        grid = Gtk.Grid()
        grid.set_column_spacing(12)
        grid.set_row_spacing(12)
        grid.set_column_homogeneous(True)
        grid.set_row_homogeneous(True)

        modulos = [
            ("Ceremonias", "Gestión de actos académicos, cronograma y sedes", "sigic-ceremonias"),
            ("Padrón de Graduados", "Lista de egresados, carreras, DNI y estado", "sigic-graduados"),
            ("Control de Ingreso", "Escáner QR / DNI y acreditación en portería", "sigic-acreditacion"),
            ("Convocatoria", "Despacho y seguimiento de invitaciones por email", "sigic-convocatoria"),
            ("Preparación de Sala", "Diseño de butacas, entregadores y diplomas", "sigic-preparacion"),
            ("Monitor en Vivo", "Seguimiento en tiempo real del acto de grado", "sigic-envivo"),
            ("Panel de Reportes", "Estadísticas, métricas de egreso y exportación", "sigic-reportes"),
            ("Manual de Usuario", "Guía institucional y soporte técnico Beltrán", "sigic-manual"),
        ]

        for i, (titulo, desc, comando) in enumerate(modulos):
            card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
            card.get_style_context().add_class("bento-card")

            lbl_t = Gtk.Label(xalign=0)
            lbl_t.set_markup(f"<span foreground='#f8fafc' weight='bold' size='11500'>{titulo}</span>")
            card.pack_start(lbl_t, False, False, 0)

            lbl_d = Gtk.Label(xalign=0)
            lbl_d.set_markup(f"<span foreground='#94a3b8' size='9500'>{desc}</span>")
            lbl_d.set_line_wrap(True)
            card.pack_start(lbl_d, True, True, 0)

            btn = Gtk.Button()
            lbl_btn = Gtk.Label()
            lbl_btn.set_markup("<span foreground='#ffffff' weight='heavy'>Abrir Módulo</span>")
            btn.add(lbl_btn)
            btn.get_style_context().add_class("btn-primary")
            btn.connect("clicked", lambda b, cmd=comando: self.lanzar_modulo(cmd))
            card.pack_start(btn, False, False, 0)

            col = i % 4
            row = i // 4
            grid.attach(card, col, row, 1, 1)

        vbox.pack_start(grid, True, True, 0)

        # Footer institucional
        lbl_foot = Gtk.Label()
        lbl_foot.set_markup("<small><span foreground='#475569'>Instituto Tecnológico Beltrán · Práctica Profesionalizante 2026 · Cancelo Julián · Alfonso Alan Alexis · Contreras Villalba Sol Heilin · Frassia Matías · Santillán Luis Gabriel</span></small>")
        vbox.pack_start(lbl_foot, False, False, 0)

        self.cargar_metricas_background()

    def _crear_kpi_card(self, label, valor, sub):
        card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=3)
        card.get_style_context().add_class("bento-card")
        lbl_l = Gtk.Label(xalign=0)
        lbl_l.set_markup(f"<span foreground='#64748b' weight='bold' size='9000'>{label.upper()}</span>")
        card.pack_start(lbl_l, False, False, 0)

        lbl_v = Gtk.Label(xalign=0)
        lbl_v.set_markup(f"<span foreground='#38bdf8' weight='heavy' size='18000'>{valor}</span>")
        card.pack_start(lbl_v, False, False, 0)

        lbl_s = Gtk.Label(xalign=0)
        lbl_s.set_markup(f"<small><span foreground='#94a3b8'>{sub}</span></small>")
        card.pack_start(lbl_s, False, False, 0)
        return card

    def lanzar_modulo(self, comando):
        try:
            subprocess.Popen([comando])
        except Exception as err:
            # Fallback a python3 /opt/sigic/{script}.py
            nombre_script = comando.replace("sigic-", "") + ".py"
            ruta = f"/opt/sigic/{nombre_script}"
            if os.path.exists(ruta):
                subprocess.Popen(["python3", ruta])
            else:
                print(f"Error ejecutando {comando}: {err}")

    def cargar_metricas_background(self):
        threading.Thread(target=self._hilo_metricas, daemon=True).start()

    def _hilo_metricas(self):
        url = "http://localhost:3000/api/ceremonias/activa"
        try:
            req = urllib.request.Request(url, timeout=3)
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode())
                if data.get("ceremonia"):
                    c = data["ceremonia"]
                    nombre = c.get("nombre", "Colación Beltrán 2026")
                    fecha = c.get("fecha", "Noviembre 2026")
                    GLib.idle_add(self._actualizar_kpi_ceremonia, nombre, fecha)
        except Exception:
            pass

    def _actualizar_kpi_ceremonia(self, nombre, fecha):
        # Actualización suave si el servidor local está respondiendo
        pass

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
    win = PortalSigic()
    aplicar_estilos()
    win.connect("destroy", Gtk.main_quit)
    win.show_all()
    Gtk.main()

if __name__ == "__main__":
    main()
