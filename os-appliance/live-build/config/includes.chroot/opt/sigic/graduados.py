#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC — Gestión y Consulta Nativa de Graduados
Aplicación nativa GTK3 para búsqueda, filtrado y padrón de graduados.
"""

import os
import sys
import json
import urllib.request
import urllib.error
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

.search-field {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    color: #0f172a;
}

.search-field:focus {
    border-color: #0284c7;
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

treeview {
    background-color: #ffffff;
    color: #0f172a;
    font-size: 12px;
}

treeview:selected {
    background-color: #0284c7;
    color: #ffffff;
}
"""

DATOS_DEMO = [
    ("43123890", "Cancelo, Lucía", "Analista de Sistemas", "CONFIRMADO", "Fila 1 - Butaca 4"),
    ("44123456", "Alfonso, Alexis", "Desarrollo de Software", "CONFIRMADO", "Fila 1 - Butaca 5"),
    ("42987654", "Contreras, Sol", "Automatización y Control", "ACEPTADO", "Fila 2 - Butaca 8"),
    ("41555666", "Frassia, Matías", "Redes e Infraestructura", "CONFIRMADO", "Fila 2 - Butaca 9"),
    ("43888999", "Santillán, Gabriel", "Telecomunicaciones", "ACEPTADO", "Fila 3 - Butaca 2"),
    ("40111222", "García, Juan Pablo", "Seguridad Informática", "PENDIENTE", "Sin asignar"),
    ("42333444", "Martínez, Camila", "Desarrollo Web Fullstack", "CONFIRMADO", "Fila 3 - Butaca 6"),
    ("41777888", "Rodríguez, Lucas", "Analista de Sistemas", "ACEPTADO", "Fila 4 - Butaca 1"),
]

class GraduadosSigic(Gtk.Window):
    def __init__(self):
        super().__init__(title="Padrón de Graduados — SiGIC")
        self.set_default_size(860, 560)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.get_style_context().add_class("sigic-window")

        self.graduados_todos = []

        # HeaderBar institucional
        header = Gtk.HeaderBar()
        header.set_show_close_button(True)
        header.props.title = "Padrón Oficial de Graduados"
        header.props.subtitle = "Instituto Tecnológico Beltrán"
        header.get_style_context().add_class("sigic-headerbar")
        self.set_titlebar(header)

        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=12)
        vbox.set_margin_top(12)
        vbox.set_margin_bottom(12)
        vbox.set_margin_start(16)
        vbox.set_margin_end(16)
        self.add(vbox)

        # Barra superior con búsqueda y botón actualizar
        box_top = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)

        self.ent_buscar = Gtk.SearchEntry()
        self.ent_buscar.set_placeholder_text("Buscar por DNI, apellido, nombre o carrera...")
        self.ent_buscar.get_style_context().add_class("search-field")
        self.ent_buscar.connect("search-changed", self.on_filtrar)
        box_top.pack_start(self.ent_buscar, True, True, 0)

        btn_refrescar = Gtk.Button()
        lbl_r = Gtk.Label()
        lbl_r.set_markup("<span foreground='#ffffff' weight='heavy'>Actualizar</span>")
        btn_refrescar.add(lbl_r)
        btn_refrescar.get_style_context().add_class("btn-primary")
        btn_refrescar.connect("clicked", lambda b: self.cargar_datos())
        box_top.pack_start(btn_refrescar, False, False, 0)

        btn_web = Gtk.Button()
        lbl_w = Gtk.Label()
        lbl_w.set_markup("<span foreground='#334155' weight='bold'>Abrir en Plataforma</span>")
        btn_web.add(lbl_w)
        btn_web.get_style_context().add_class("btn-secondary")
        btn_web.connect("clicked", lambda b: subprocess.Popen(["chromium", "--start-maximized", "http://localhost:3000/?modulo=gestion-graduados"]))
        box_top.pack_start(btn_web, False, False, 0)

        vbox.pack_start(box_top, False, False, 0)

        # Tabla de Graduados (ListStore + TreeView)
        # Columnas: DNI, Nombre y Apellido, Carrera, Estado, Ubicación
        self.modelo = Gtk.ListStore(str, str, str, str, str)
        self.modelo_filtrado = self.modelo.filter_new()
        self.modelo_filtrado.set_visible_func(self.filtro_func)

        self.treeview = Gtk.TreeView(model=self.modelo_filtrado)
        self.treeview.set_rules_hint(True)

        columnas = [
            ("DNI", 0, 110),
            ("Apellido y Nombre", 1, 220),
            ("Carrera / Especialidad", 2, 220),
            ("Estado", 3, 120),
            ("Ubicación Asignada", 4, 150)
        ]

        for titulo, col_id, ancho in columnas:
            renderizador = Gtk.CellRendererText()
            if col_id == 0 or col_id == 3:
                renderizador.props.weight = 700
            col = Gtk.TreeViewColumn(titulo, renderizador, text=col_id)
            col.set_resizable(True)
            col.set_min_width(ancho)
            self.treeview.append_column(col)

        scroll = Gtk.ScrolledWindow()
        scroll.set_policy(Gtk.PolicyType.AUTOMATIC, Gtk.PolicyType.AUTOMATIC)
        scroll.set_shadow_type(Gtk.ShadowType.ETCHED_IN)
        scroll.add(self.treeview)
        vbox.pack_start(scroll, True, True, 0)

        # Barra inferior
        box_bottom = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=12)
        self.lbl_total = Gtk.Label(xalign=0)
        self.lbl_total.set_markup("<span foreground='#64748b' weight='bold'>Cargando registros...</span>")
        box_bottom.pack_start(self.lbl_total, True, True, 0)

        vbox.pack_start(box_bottom, False, False, 0)

        self.cargar_datos()

    def filtro_func(self, model, iter, data):
        query = self.ent_buscar.get_text().strip().lower()
        if not query:
            return True
        for col in range(5):
            val = model.get_value(iter, col)
            if val and query in str(val).lower():
                return True
        return False

    def on_filtrar(self, entry):
        self.modelo_filtrado.refilter()
        self.actualizar_conteo_visible()

    def actualizar_conteo_visible(self):
        total = len(self.graduados_todos)
        self.lbl_total.set_markup(f"<span foreground='#0284c7' weight='heavy'>● {total} graduados en padrón</span> · <small><span foreground='#64748b'>Filtro en tiempo real activo</span></small>")

    def cargar_datos(self):
        threading.Thread(target=self._hilo_carga, daemon=True).start()

    def _hilo_carga(self):
        url = "http://localhost:3000/api/egresados"
        datos = []
        try:
            req = urllib.request.Request(url, timeout=3)
            with urllib.request.urlopen(req) as resp:
                res = json.loads(resp.read().decode())
                items = res.get("graduados") or res.get("egresados") or []
                for g in items:
                    datos.append((
                        str(g.get("dni", "—")),
                        f"{g.get('apellido', '')}, {g.get('nombre', '')}".strip(" ,"),
                        str(g.get("carrera", "Tecnicatura Beltrán")),
                        str(g.get("estado", "PENDIENTE")).upper(),
                        str(g.get("butaca") or "Sin asignar")
                    ))
        except Exception:
            datos = DATOS_DEMO

        self.graduados_todos = datos
        GLib.idle_add(self._actualizar_tabla, datos)

    def _actualizar_tabla(self, datos):
        self.modelo.clear()
        for fila in datos:
            self.modelo.append(list(fila))
        self.actualizar_conteo_visible()

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
    win = GraduadosSigic()
    aplicar_estilos()
    win.connect("destroy", Gtk.main_quit)
    win.show_all()
    Gtk.main()

if __name__ == "__main__":
    main()
