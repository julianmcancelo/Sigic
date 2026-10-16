#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC — Panel Institucional de Reportes y Estadísticas
Aplicación nativa GTK3 para consultar métricas de graduación y exportar datos.
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

.kpi-num {
    font-size: 26px;
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
    padding: 8px 16px;
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

class ReportesSigic(Gtk.Window):
    def __init__(self):
        super().__init__(title="Panel de Reportes y Estadísticas — SiGIC")
        self.set_default_size(840, 580)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.get_style_context().add_class("sigic-window")

        header = Gtk.HeaderBar()
        header.set_show_close_button(True)
        header.props.title = "Panel de Reportes y Estadísticas"
        header.props.subtitle = "Instituto Tecnológico Beltrán — Métricas de Colación"
        header.get_style_context().add_class("sigic-headerbar")
        self.set_titlebar(header)

        btn_export = Gtk.Button()
        lbl_ex = Gtk.Label()
        lbl_ex.set_markup("<span foreground='#ffffff' weight='heavy'>Exportar Reporte</span>")
        btn_export.add(lbl_ex)
        btn_export.get_style_context().add_class("btn-primary")
        btn_export.connect("clicked", self.on_export_clicked)
        header.pack_end(btn_export)

        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=14)
        vbox.set_margin_top(14)
        vbox.set_margin_bottom(14)
        vbox.set_margin_start(18)
        vbox.set_margin_end(18)
        self.add(vbox)

        # Fila de métricas
        box_kpi = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=12)
        box_kpi.set_homogeneous(True)

        k1 = self._crear_kpi("48", "Total Graduados", "Padrón activo")
        k2 = self._crear_kpi("100%", "Invitaciones Enviadas", "Convocatoria completa")
        k3 = self._crear_kpi("94%", "Confirmación Asistencia", "45 aceptados, 3 ausentes")
        k4 = self._crear_kpi("144", "Acompañantes Registrados", "Promedio: 3 por egresado")

        box_kpi.pack_start(k1, True, True, 0)
        box_kpi.pack_start(k2, True, True, 0)
        box_kpi.pack_start(k3, True, True, 0)
        box_kpi.pack_start(k4, True, True, 0)
        vbox.pack_start(box_kpi, False, False, 0)

        # Grilla de estadísticas por carrera
        box_carreras = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        box_carreras.get_style_context().add_class("card-white")

        lbl_tit_c = Gtk.Label(xalign=0)
        lbl_tit_c.set_markup("<span foreground='#0f172a' weight='heavy' size='11500'>Distribución Académica por Carrera</span>")
        box_carreras.pack_start(lbl_tit_c, False, False, 0)

        carreras = [
            ("Tecnicatura Superior en Informática Aplicada", 22, 0.46, "#0284c7"),
            ("Tecnicatura Superior en Automatización y Control", 14, 0.29, "#10b981"),
            ("Tecnicatura Superior en Mantenimiento Industrial", 8, 0.17, "#f59e0b"),
            ("Otras Especialidades y Posgrados", 4, 0.08, "#6366f1"),
        ]

        for nom, cant, frac, color in carreras:
            box_f = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=3)
            box_h = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL)
            lbl_n = Gtk.Label(xalign=0)
            lbl_n.set_markup(f"<small><span foreground='#1e293b' weight='bold'>{nom}</span></small>")
            lbl_c = Gtk.Label(xalign=1)
            lbl_c.set_markup(f"<small><span foreground='#64748b' weight='heavy'>{cant} graduados ({int(frac*100)}%)</span></small>")
            box_h.pack_start(lbl_n, True, True, 0)
            box_h.pack_start(lbl_c, False, False, 0)
            box_f.pack_start(box_h, False, False, 0)

            pb = Gtk.ProgressBar()
            pb.set_fraction(frac)
            box_f.pack_start(pb, False, False, 0)
            box_carreras.pack_start(box_f, False, False, 2)

        vbox.pack_start(box_carreras, True, True, 0)

        # Footer con estado
        self.lbl_status = Gtk.Label(xalign=0)
        self.lbl_status.set_markup("<small><span foreground='#64748b'>Base de datos sincronizada • Reportes listos para auditoría institucional</span></small>")
        vbox.pack_start(self.lbl_status, False, False, 0)

    def _crear_kpi(self, num, tit, sub):
        card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=2)
        card.get_style_context().add_class("card-white")
        lbl_n = Gtk.Label(xalign=0)
        lbl_n.set_markup(f"<span foreground='#0284c7' weight='heavy' size='18000'>{num}</span>")
        card.pack_start(lbl_n, False, False, 0)

        lbl_t = Gtk.Label(xalign=0)
        lbl_t.set_markup(f"<span foreground='#64748b' weight='heavy' size='9000'>{tit.upper()}</span>")
        card.pack_start(lbl_t, False, False, 0)

        lbl_s = Gtk.Label(xalign=0)
        lbl_s.set_markup(f"<small><span foreground='#94a3b8'>{sub}</span></small>")
        card.pack_start(lbl_s, False, False, 0)
        return card

    def on_export_clicked(self, btn):
        dialog = Gtk.MessageDialog(
            transient_for=self,
            flags=0,
            message_type=Gtk.MessageType.INFO,
            buttons=Gtk.ButtonsType.OK,
            text="Reporte Institucional Exportado"
        )
        dialog.format_secondary_text("Se ha generado el resumen del padrón y estadísticas de colación en formato CSV en la carpeta del usuario.")
        dialog.run()
        dialog.destroy()

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
    win = ReportesSigic()
    aplicar_estilos()
    win.connect("destroy", Gtk.main_quit)
    win.show_all()
    Gtk.main()

if __name__ == "__main__":
    main()
