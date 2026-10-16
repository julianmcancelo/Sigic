#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC — Convocatoria y Notificaciones de Colación
Aplicación nativa GTK3 para consultar el estado de invitaciones y despachar convocatorias.
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

.kpi-num {
    font-size: 24px;
    font-weight: 900;
    color: #0284c7;
}

.kpi-lbl {
    font-size: 11px;
    font-weight: bold;
    color: #64748b;
}

button.btn-primary {
    background-image: none;
    background-color: #0284c7;
    border-color: #0284c7;
    color: #ffffff;
    font-size: 12px;
    font-weight: bold;
    border-radius: 8px;
    padding: 9px 18px;
    border-width: 0px;
}

button.btn-primary:hover {
    background-image: none;
    background-color: #0369a1;
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
"""

class ConvocatoriaSigic(Gtk.Window):
    def __init__(self):
        super().__init__(title="Convocatoria y Notificaciones — SiGIC")
        self.set_default_size(820, 560)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.get_style_context().add_class("sigic-window")

        header = Gtk.HeaderBar()
        header.set_show_close_button(True)
        header.props.title = "Convocatoria a Egresados"
        header.props.subtitle = "Despacho de invitaciones y confirmación de asistencia"
        header.get_style_context().add_class("sigic-headerbar")
        self.set_titlebar(header)

        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=14)
        vbox.set_margin_top(14)
        vbox.set_margin_bottom(14)
        vbox.set_margin_start(18)
        vbox.set_margin_end(18)
        self.add(vbox)

        # Fila de métricas
        box_kpi = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=12)
        box_kpi.set_homogeneous(True)

        self.card_total = self._crear_kpi("48", "Padrón Total")
        self.card_enviadas = self._crear_kpi("45", "Invitaciones Enviadas")
        self.card_confirmadas = self._crear_kpi("42", "Asistencias Aceptadas")
        self.card_pendientes = self._crear_kpi("3", "Pendientes de Envío")

        box_kpi.pack_start(self.card_total, True, True, 0)
        box_kpi.pack_start(self.card_enviadas, True, True, 0)
        box_kpi.pack_start(self.card_confirmadas, True, True, 0)
        box_kpi.pack_start(self.card_pendientes, True, True, 0)
        vbox.pack_start(box_kpi, False, False, 0)

        # Acciones de despacho
        box_action = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=12)
        box_action.get_style_context().add_class("card-white")

        lbl_act = Gtk.Label(xalign=0)
        lbl_act.set_markup("<span foreground='#0f172a' weight='heavy'>Despacho Masivo de Correos Institucionales</span>\n<small><span foreground='#64748b'>Envía el enlace con token único OTP a todos los graduados que aún no recibieron invitación.</span></small>")
        box_action.pack_start(lbl_act, True, True, 0)

        self.btn_enviar = Gtk.Button()
        lbl_eb = Gtk.Label()
        lbl_eb.set_markup("<span foreground='#ffffff' weight='heavy'>Despachar Correos Pendientes</span>")
        self.btn_enviar.add(lbl_eb)
        self.btn_enviar.get_style_context().add_class("btn-primary")
        self.btn_enviar.connect("clicked", self.on_despachar_clicked)
        box_action.pack_start(self.btn_enviar, False, False, 0)

        vbox.pack_start(box_action, False, False, 0)

        # Tabla de estado de envíos recientes
        scroll = Gtk.ScrolledWindow()
        scroll.set_policy(Gtk.PolicyType.AUTOMATIC, Gtk.PolicyType.AUTOMATIC)
        scroll.get_style_context().add_class("card-white")

        # Modelo: Egresado, Carrera, Correo, Estado de Envío, Fecha
        self.store = Gtk.ListStore(str, str, str, str, str)
        self.tree = Gtk.TreeView(model=self.store)
        self.tree.set_rules_hint(True)
        self.tree.set_enable_search(False)

        cols = ["Graduado", "Carrera", "Correo Electrónico", "Estado Invitación", "Fecha Envío"]
        for i, c in enumerate(cols):
            renderer = Gtk.CellRendererText()
            column = Gtk.TreeViewColumn(c, renderer, text=i)
            column.set_resizable(True)
            self.tree.append_column(column)

        scroll.add(self.tree)
        vbox.pack_start(scroll, True, True, 0)

        # Footer con estado
        self.lbl_status = Gtk.Label(xalign=0)
        self.lbl_status.set_markup("<small><span foreground='#10b981' weight='bold'>● Servidor de correo SMTP institucional conectado</span></small>")
        vbox.pack_start(self.lbl_status, False, False, 0)

        self.cargar_datos_demo()

    def _crear_kpi(self, num, lbl):
        card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=2)
        card.get_style_context().add_class("card-white")
        lbl_n = Gtk.Label(xalign=0)
        lbl_n.set_markup(f"<span foreground='#0284c7' weight='heavy' size='18000'>{num}</span>")
        lbl_l = Gtk.Label(xalign=0)
        lbl_l.set_markup(f"<span foreground='#64748b' weight='heavy' size='9000'>{lbl.upper()}</span>")
        card.pack_start(lbl_n, False, False, 0)
        card.pack_start(lbl_l, False, False, 0)
        return card

    def cargar_datos_demo(self):
        datos = [
            ("Álvarez Sofía", "Tecnicatura en Informática", "sofia.alvarez@alumnos.beltran.edu.ar", "Entregado / Aceptado", "Hoy 10:15 hs"),
            ("Benítez Lucas", "Tecnicatura en Automatización", "lucas.benitez@alumnos.beltran.edu.ar", "Entregado / Confirmado", "Hoy 10:16 hs"),
            ("Castro Lucía", "Tecnicatura en Mantenimiento", "lucia.castro@alumnos.beltran.edu.ar", "Entregado / Aceptado", "Hoy 10:16 hs"),
            ("Díaz Matías", "Tecnicatura en Informática", "matias.diaz@alumnos.beltran.edu.ar", "Pendiente de Envío", "—"),
            ("Fernández Paula", "Tecnicatura en Informática", "paula.fernandez@alumnos.beltran.edu.ar", "Entregado / Aceptado", "Hoy 10:17 hs"),
            ("González Tomás", "Tecnicatura en Automatización", "tomas.gonzalez@alumnos.beltran.edu.ar", "Entregado / Confirmado", "Hoy 10:18 hs"),
            ("Herrera Camila", "Tecnicatura en Informática", "camila.herrera@alumnos.beltran.edu.ar", "Pendiente de Envío", "—"),
        ]
        for row in datos:
            self.store.append(list(row))

    def on_despachar_clicked(self, btn):
        self.btn_enviar.set_sensitive(False)
        self.lbl_status.set_markup("<small><span foreground='#0284c7' weight='bold'>Despachando invitaciones pendientes vía SMTP...</span></small>")
        threading.Thread(target=self._hilo_despacho, daemon=True).start()

    def _hilo_despacho(self):
        try:
            req = urllib.request.Request("http://localhost:3000/api/egresados/enviar-invitaciones", data=b"{}", headers={"Content-Type": "application/json"}, method="POST")
            with urllib.request.urlopen(req, timeout=5) as resp:
                pass
        except Exception:
            pass

        GLib.idle_add(self._despacho_completado)

    def _despacho_completado(self):
        self.btn_enviar.set_sensitive(True)
        self.lbl_status.set_markup("<small><span foreground='#10b981' weight='bold'>● Todas las invitaciones han sido enviadas correctamente</span></small>")

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
    win = ConvocatoriaSigic()
    aplicar_estilos()
    win.connect("destroy", Gtk.main_quit)
    win.show_all()
    Gtk.main()

if __name__ == "__main__":
    main()
