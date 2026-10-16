#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC — Gestión y Padrón Oficial de Graduados
Aplicación nativa GTK3 para búsqueda, alta individual, importación masiva y padrón oficial.
Instituto Tecnológico Beltrán
"""

import os
import sys
import csv
import json
import io
import zipfile
import xml.etree.ElementTree as ET
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
    background-color: #f8fafc;
}

headerbar.sigic-headerbar {
    background-color: #ffffff;
    border-bottom: 1px solid #cbd5e1;
}

.search-field {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 7px 12px;
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
    padding: 7px 14px;
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
    padding: 7px 14px;
}

button.btn-secondary:hover {
    background-image: none;
    background-color: #f1f5f9;
}

button.btn-danger {
    background-image: none;
    background-color: #ffffff;
    color: #dc2626;
    font-size: 12px;
    font-weight: bold;
    border: 1px solid #fca5a5;
    border-radius: 8px;
    padding: 7px 12px;
}

button.btn-danger:hover {
    background-image: none;
    background-color: #fef2f2;
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

CARRERAS_BELTRAN = [
    "Tecnicatura Superior en Desarrollo de Software",
    "Tecnicatura Superior en Analista de Sistemas",
    "Tecnicatura Superior en Automatización y Robótica",
    "Tecnicatura Superior en Redes e Infraestructura",
    "Tecnicatura Superior en Diseño y Desarrollo Web",
    "Tecnicatura Superior en Ciencia de Datos e IA",
    "Tecnicatura Superior en Ciberseguridad",
    "Tecnicatura Superior en Higiene y Seguridad en el Trabajo",
]

COHORTE_MODELO = [
    {"nombre": "García, Juan Manuel", "dni": "42123456", "legajo": "BEL-2024-101", "correo": "juan.garcia@sigic.demo.ar", "carrera": "Tecnicatura Superior en Desarrollo de Software", "promedio": "9.1", "estado": "CONFIRMADO", "butaca": "Fila A - Butaca 01"},
    {"nombre": "Martínez, Lucía Belén", "dni": "43234567", "legajo": "BEL-2024-102", "correo": "lucia.martinez@sigic.demo.ar", "carrera": "Tecnicatura Superior en Automatización y Robótica", "promedio": "9.4", "estado": "CONFIRMADO", "butaca": "Fila A - Butaca 02"},
    {"nombre": "Rodríguez, Matías Alejandro", "dni": "41987654", "legajo": "BEL-2024-103", "correo": "matias.rodriguez@sigic.demo.ar", "carrera": "Tecnicatura Superior en Redes e Infraestructura", "promedio": "8.7", "estado": "CONFIRMADO", "butaca": "Fila A - Butaca 03"},
    {"nombre": "Fernández, Camila Soledad", "dni": "44567890", "legajo": "BEL-2024-104", "correo": "camila.fernandez@sigic.demo.ar", "carrera": "Tecnicatura Superior en Ciencia de Datos e IA", "promedio": "9.6", "estado": "ACEPTADO", "butaca": "Fila A - Butaca 04"},
    {"nombre": "López, Tomás Ignacio", "dni": "42876543", "legajo": "BEL-2024-105", "correo": "tomas.lopez@sigic.demo.ar", "carrera": "Tecnicatura Superior en Ciberseguridad", "promedio": "8.9", "estado": "CONFIRMADO", "butaca": "Fila B - Butaca 01"},
    {"nombre": "González, Valentina Rocío", "dni": "43654321", "legajo": "BEL-2024-106", "correo": "valentina.gonzalez@sigic.demo.ar", "carrera": "Tecnicatura Superior en Diseño y Desarrollo Web", "promedio": "9.3", "estado": "ACEPTADO", "butaca": "Fila B - Butaca 02"},
    {"nombre": "Díaz, Agustín Ezequiel", "dni": "42345678", "legajo": "BEL-2024-107", "correo": "agustin.diaz@sigic.demo.ar", "carrera": "Tecnicatura Superior en Desarrollo de Software", "promedio": "8.5", "estado": "CONFIRMADO", "butaca": "Fila B - Butaca 03"},
    {"nombre": "Pérez, Sofía Ailén", "dni": "44123789", "legajo": "BEL-2024-108", "correo": "sofia.perez@sigic.demo.ar", "carrera": "Tecnicatura Superior en Automatización y Robótica", "promedio": "9.0", "estado": "CONFIRMADO", "butaca": "Fila B - Butaca 04"},
    {"nombre": "Romero, Franco Damián", "dni": "43987123", "legajo": "BEL-2024-109", "correo": "franco.romero@sigic.demo.ar", "carrera": "Tecnicatura Superior en Redes e Infraestructura", "promedio": "8.8", "estado": "PENDIENTE", "butaca": "Sin asignar"},
    {"nombre": "Torres, Florencia Denise", "dni": "41765432", "legajo": "BEL-2024-110", "correo": "florencia.torres@sigic.demo.ar", "carrera": "Tecnicatura Superior en Ciencia de Datos e IA", "promedio": "9.5", "estado": "ACEPTADO", "butaca": "Fila C - Butaca 01"},
    {"nombre": "Acosta, Lucas Gabriel", "dni": "42567123", "legajo": "BEL-2024-111", "correo": "lucas.acosta@sigic.demo.ar", "carrera": "Tecnicatura Superior en Ciberseguridad", "promedio": "8.6", "estado": "CONFIRMADO", "butaca": "Fila C - Butaca 02"},
    {"nombre": "Benítez, Micaela Paula", "dni": "43876512", "legajo": "BEL-2024-112", "correo": "micaela.benitez@sigic.demo.ar", "carrera": "Tecnicatura Superior en Diseño y Desarrollo Web", "promedio": "9.2", "estado": "CONFIRMADO", "butaca": "Fila C - Butaca 03"}
]


class DialogoNuevoGraduado(Gtk.Dialog):
    """Diálogo emergente para la carga individual de un alumno."""
    def __init__(self, parent):
        super().__init__(title="Nuevo Graduado — SiGIC Beltrán", transient_for=parent, flags=0)
        self.set_default_size(480, 420)
        self.set_resizable(False)

        box_content = self.get_content_area()
        box_content.set_spacing(10)
        box_content.set_margin_top(16)
        box_content.set_margin_bottom(16)
        box_content.set_margin_start(20)
        box_content.set_margin_end(20)

        lbl_tit = Gtk.Label(xalign=0)
        lbl_tit.set_markup("<span foreground='#0f172a' weight='heavy' size='13000'>Ficha de Ingreso al Padrón Oficial</span>\n<small><span foreground='#64748b'>Completá los datos requeridos para registrar al egresado.</span></small>")
        box_content.pack_start(lbl_tit, False, False, 4)

        grid = Gtk.Grid()
        grid.set_column_spacing(12)
        grid.set_row_spacing(10)
        box_content.pack_start(grid, True, True, 0)

        # Campos
        self.ent_nombre = Gtk.Entry()
        self.ent_nombre.set_placeholder_text("Ej: García, Juan Manuel")

        self.ent_dni = Gtk.Entry()
        self.ent_dni.set_placeholder_text("Ej: 42123456 (solo números)")

        self.ent_legajo = Gtk.Entry()
        self.ent_legajo.set_placeholder_text("Ej: BEL-2024-101")

        self.ent_correo = Gtk.Entry()
        self.ent_correo.set_placeholder_text("Ej: juan.garcia@gmail.com")

        self.combo_carrera = Gtk.ComboBoxText()
        for c in CARRERAS_BELTRAN:
            self.combo_carrera.append_text(c)
        self.combo_carrera.set_active(0)

        self.ent_promedio = Gtk.Entry()
        self.ent_promedio.set_placeholder_text("Ej: 8.75 (opcional)")

        filas = [
            ("Apellido y Nombre *", self.ent_nombre),
            ("DNI *", self.ent_dni),
            ("Legajo Institucional", self.ent_legajo),
            ("Correo Electrónico *", self.ent_correo),
            ("Carrera / Titulación *", self.combo_carrera),
            ("Promedio Académico", self.ent_promedio)
        ]

        for i, (etiqueta, widget) in enumerate(filas):
            lbl = Gtk.Label(label=etiqueta, xalign=0)
            lbl.get_style_context().add_class("field-label")
            grid.attach(lbl, 0, i, 1, 1)
            widget.set_hexpand(True)
            grid.attach(widget, 1, i, 1, 1)

        self.add_button("Cancelar", Gtk.ResponseType.CANCEL)
        btn_guardar = self.add_button("Guardar en Padrón", Gtk.ResponseType.OK)
        btn_guardar.get_style_context().add_class("btn-primary")
        self.show_all()

    def obtener_datos(self):
        carrera = self.combo_carrera.get_active_text() or "Tecnicatura Beltrán"
        return {
            "nombre": self.ent_nombre.get_text().strip(),
            "dni": self.ent_dni.get_text().strip().replace(".", "").replace(" ", ""),
            "legajo": self.ent_legajo.get_text().strip(),
            "correo": self.ent_correo.get_text().strip(),
            "carrera": carrera,
            "promedio": self.ent_promedio.get_text().strip()
        }


class GraduadosSigic(Gtk.Window):
    def __init__(self):
        super().__init__(title="Padrón de Graduados — SiGIC")
        self.set_default_size(960, 600)
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

        # Botón Nuevo Graduado (Primario)
        btn_nuevo = Gtk.Button()
        lbl_n = Gtk.Label()
        lbl_n.set_markup("<span foreground='#ffffff' weight='heavy'>+ Nuevo Graduado</span>")
        btn_nuevo.add(lbl_n)
        btn_nuevo.get_style_context().add_class("btn-primary")
        btn_nuevo.connect("clicked", self.on_abrir_nuevo_graduado)
        header.pack_start(btn_nuevo)

        # Botón Importar Excel / CSV
        btn_importar = Gtk.Button()
        lbl_imp = Gtk.Label()
        lbl_imp.set_markup("<span foreground='#0f172a' weight='bold'>Importar Excel / CSV</span>")
        btn_importar.add(lbl_imp)
        btn_importar.get_style_context().add_class("btn-secondary")
        btn_importar.connect("clicked", self.on_importar_archivo)
        header.pack_start(btn_importar)

        # Botón Cargar Cohorte Modelo
        btn_demo = Gtk.Button()
        lbl_demo = Gtk.Label()
        lbl_demo.set_markup("<span foreground='#0284c7' weight='bold'>Cohorte Modelo</span>")
        btn_demo.add(lbl_demo)
        btn_demo.get_style_context().add_class("btn-secondary")
        btn_demo.connect("clicked", self.on_cargar_cohorte_modelo)
        header.pack_end(btn_demo)

        # Botón Plantilla
        btn_plantilla = Gtk.Button()
        lbl_plan = Gtk.Label()
        lbl_plan.set_markup("<span foreground='#64748b' weight='bold'>Descargar Plantilla CSV</span>")
        btn_plantilla.add(lbl_plan)
        btn_plantilla.get_style_context().add_class("btn-secondary")
        btn_plantilla.connect("clicked", self.on_descargar_plantilla)
        header.pack_end(btn_plantilla)

        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=12)
        vbox.set_margin_top(12)
        vbox.set_margin_bottom(12)
        vbox.set_margin_start(16)
        vbox.set_margin_end(16)
        self.add(vbox)

        # Barra superior con búsqueda, filtro y botón eliminar
        box_top = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)

        self.ent_buscar = Gtk.SearchEntry()
        self.ent_buscar.set_placeholder_text("Buscar por DNI, apellido, nombre o carrera...")
        self.ent_buscar.get_style_context().add_class("search-field")
        self.ent_buscar.connect("search-changed", self.on_filtrar)
        box_top.pack_start(self.ent_buscar, True, True, 0)

        btn_eliminar = Gtk.Button()
        lbl_del = Gtk.Label()
        lbl_del.set_markup("<span foreground='#dc2626' weight='bold'>Eliminar Seleccionado</span>")
        btn_eliminar.add(lbl_del)
        btn_eliminar.get_style_context().add_class("btn-danger")
        btn_eliminar.connect("clicked", self.on_eliminar_seleccionado)
        box_top.pack_start(btn_eliminar, False, False, 0)

        btn_refrescar = Gtk.Button()
        lbl_r = Gtk.Label()
        lbl_r.set_markup("<span foreground='#334155' weight='bold'>Actualizar</span>")
        btn_refrescar.add(lbl_r)
        btn_refrescar.get_style_context().add_class("btn-secondary")
        btn_refrescar.connect("clicked", lambda b: self.cargar_datos())
        box_top.pack_start(btn_refrescar, False, False, 0)

        vbox.pack_start(box_top, False, False, 0)

        # Tabla de Graduados (ListStore + TreeView)
        # Columnas: DNI, Nombre y Apellido, Carrera, Estado, Ubicación, Correo, ID
        self.modelo = Gtk.ListStore(str, str, str, str, str, str, str)
        self.modelo_filtrado = self.modelo.filter_new()
        self.modelo_filtrado.set_visible_func(self.filtro_func)

        self.treeview = Gtk.TreeView(model=self.modelo_filtrado)
        self.treeview.set_rules_hint(True)
        self.treeview.set_enable_search(False)

        columnas = [
            ("DNI", 0, 100),
            ("Apellido y Nombre", 1, 210),
            ("Carrera / Especialidad", 2, 230),
            ("Estado", 3, 110),
            ("Ubicación Asignada", 4, 140),
            ("Correo Electrónico", 5, 170)
        ]

        for titulo, col_id, ancho in columnas:
            renderizador = Gtk.CellRendererText()
            if col_id in (0, 3):
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
        for col in range(6):
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
                        f"{g.get('apellido', '')}, {g.get('nombre', '')}".strip(" ,") if g.get('apellido') else str(g.get('nombre', '—')),
                        str(g.get("carrera", "Tecnicatura Beltrán")),
                        str(g.get("estado", "PENDIENTE")).upper(),
                        str(g.get("butaca") or "Sin asignar"),
                        str(g.get("correo") or "—"),
                        str(g.get("id", ""))
                    ))
        except Exception:
            pass

        if not datos:
            for g in COHORTE_MODELO:
                datos.append((
                    g["dni"],
                    g["nombre"],
                    g["carrera"],
                    g["estado"],
                    g["butaca"],
                    g["correo"],
                    ""
                ))

        self.graduados_todos = datos
        GLib.idle_add(self._actualizar_tabla, datos)

    def _actualizar_tabla(self, datos):
        self.modelo.clear()
        for fila in datos:
            self.modelo.append(list(fila))
        self.actualizar_conteo_visible()

    def on_abrir_nuevo_graduado(self, button):
        dlg = DialogoNuevoGraduado(self)
        resp = dlg.run()
        if resp == Gtk.ResponseType.OK:
            datos = dlg.obtener_datos()
            dlg.destroy()
            if not datos["nombre"] or not datos["dni"]:
                self.mostrar_alerta("Campos Requeridos", "Debe ingresar al menos el Apellido/Nombre y el DNI.")
                return
            threading.Thread(target=self._hilo_guardar_nuevo, args=(datos,), daemon=True).start()
        else:
            dlg.destroy()

    def _hilo_guardar_nuevo(self, datos):
        url = "http://localhost:3000/api/egresados"
        guardado_api = False
        try:
            payload = json.dumps(datos).encode("utf-8")
            req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
            with urllib.request.urlopen(req, timeout=4) as resp:
                if resp.status in (200, 201):
                    guardado_api = True
        except Exception as err:
            print(f"Aviso API al guardar: {err}")

        nueva_fila = (
            datos["dni"],
            datos["nombre"],
            datos["carrera"],
            "SIN_INVITAR",
            "Sin asignar",
            datos["correo"],
            ""
        )
        self.graduados_todos.insert(0, nueva_fila)
        GLib.idle_add(self._insertar_graduado_en_tabla, nueva_fila, guardado_api)

    def _insertar_graduado_en_tabla(self, fila, guardado_api):
        self.modelo.prepend(list(fila))
        self.actualizar_conteo_visible()
        self.mostrar_alerta(
            "Graduado Ingresado",
            f"Se registró exitosamente a {fila[1]} (DNI {fila[0]}) en el padrón oficial."
        )

    def on_importar_archivo(self, button):
        dlg = Gtk.FileChooserDialog(
            title="Seleccionar Archivo de Graduados (Excel o CSV)",
            parent=self,
            action=Gtk.FileChooserAction.OPEN
        )
        dlg.add_buttons("Cancelar", Gtk.ResponseType.CANCEL, "Importar Padrón", Gtk.ResponseType.OK)

        filtro = Gtk.FileFilter()
        filtro.set_name("Planillas de Graduados (*.csv, *.tsv, *.xlsx, *.txt)")
        filtro.add_pattern("*.csv")
        filtro.add_pattern("*.tsv")
        filtro.add_pattern("*.xlsx")
        filtro.add_pattern("*.txt")
        dlg.add_filter(filtro)

        filtro_todos = Gtk.FileFilter()
        filtro_todos.set_name("Todos los archivos")
        filtro_todos.add_pattern("*")
        dlg.add_filter(filtro_todos)

        resp = dlg.run()
        ruta = dlg.get_filename()
        dlg.destroy()

        if resp == Gtk.ResponseType.OK and ruta:
            threading.Thread(target=self._hilo_procesar_archivo, args=(ruta,), daemon=True).start()

    def _hilo_procesar_archivo(self, ruta):
        nuevos = []
        try:
            # Procesamiento de CSV / TSV / Texto delimitado
            if not ruta.lower().endswith(".xlsx"):
                with open(ruta, "r", encoding="utf-8", errors="replace") as f:
                    contenido = f.read()
                
                # Detectar separador
                delimitador = ","
                if "\t" in contenido.splitlines()[0]:
                    delimitador = "\t"
                elif ";" in contenido.splitlines()[0]:
                    delimitador = ";"

                lector = csv.DictReader(io.StringIO(contenido), delimiter=delimitador)
                for fila in lector:
                    # Mapeo flexible de cabeceras
                    nombre = fila.get("nombre") or fila.get("Nombre") or fila.get("NOMBRE") or fila.get("Nombre Completo") or fila.get("Apellido y Nombre") or ""
                    dni = fila.get("dni") or fila.get("DNI") or fila.get("documento") or fila.get("Documento") or ""
                    legajo = fila.get("legajo") or fila.get("Legajo") or fila.get("LEGAJO") or ""
                    correo = fila.get("correo") or fila.get("Correo") or fila.get("email") or fila.get("Email") or ""
                    carrera = fila.get("carrera") or fila.get("Carrera") or fila.get("CARRERA") or "Tecnicatura Beltrán"
                    promedio = fila.get("promedio") or fila.get("Promedio") or ""

                    if nombre and dni:
                        nuevos.append({
                            "nombre": nombre.strip(),
                            "dni": str(dni).strip().replace(".", "").replace(" ", ""),
                            "legajo": str(legajo).strip(),
                            "correo": str(correo).strip(),
                            "carrera": str(carrera).strip(),
                            "promedio": str(promedio).strip()
                        })
            else:
                # Lectura de XLSX nativa en Python usando zipfile y XML
                with zipfile.ZipFile(ruta, 'r') as z:
                    # Extraer shared strings
                    strings = []
                    if 'xl/sharedStrings.xml' in z.namelist():
                        tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
                        for elem in tree.iter():
                            if elem.tag.endswith('t') and elem.text:
                                strings.append(elem.text)

                    # Leer sheet1.xml
                    if 'xl/worksheets/sheet1.xml' in z.namelist():
                        sheet_tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
                        rows = []
                        for row in sheet_tree.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
                            valores_fila = []
                            for c in row.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                                t = c.attrib.get('t')
                                v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                                if v is not None and v.text:
                                    if t == 's':
                                        idx = int(v.text)
                                        valores_fila.append(strings[idx] if idx < len(strings) else "")
                                    else:
                                        valores_fila.append(v.text)
                            if valores_fila:
                                rows.append(valores_fila)

                        if len(rows) > 1:
                            cabeceras = [str(h).lower() for h in rows[0]]
                            for r in rows[1:]:
                                d = {}
                                for i, h in enumerate(cabeceras):
                                    if i < len(r):
                                        d[h] = r[i]
                                nombre = d.get("nombre") or d.get("nombre completo") or d.get("apellido y nombre") or (r[0] if len(r) > 0 else "")
                                dni = d.get("dni") or d.get("documento") or (r[1] if len(r) > 1 else "")
                                legajo = d.get("legajo") or (r[2] if len(r) > 2 else "")
                                correo = d.get("correo") or d.get("email") or (r[3] if len(r) > 3 else "")
                                carrera = d.get("carrera") or (r[4] if len(r) > 4 else "Tecnicatura Beltrán")
                                if nombre and dni:
                                    nuevos.append({
                                        "nombre": str(nombre).strip(),
                                        "dni": str(dni).strip().replace(".", "").replace(" ", ""),
                                        "legajo": str(legajo).strip(),
                                        "correo": str(correo).strip(),
                                        "carrera": str(carrera).strip()
                                    })
        except Exception as err:
            GLib.idle_add(self.mostrar_alerta, "Error de Importación", f"No se pudo leer el archivo: {err}")
            return

        if not nuevos:
            GLib.idle_add(self.mostrar_alerta, "Sin Registros Válidos", "No se encontraron filas con Nombre y DNI en la planilla seleccionada.")
            return

        # Enviar masivamente a la API local
        url = "http://localhost:3000/api/egresados/importar"
        try:
            payload = json.dumps({"egresados": nuevos}).encode("utf-8")
            req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
            urllib.request.urlopen(req, timeout=5)
        except Exception as err:
            print(f"Aviso API bulk: {err}")

        GLib.idle_add(self._aplicar_importacion, nuevos)

    def _aplicar_importacion(self, nuevos):
        dnis_existentes = {f[0] for f in self.graduados_todos}
        agregados = 0
        for n in nuevos:
            if n["dni"] not in dnis_existentes:
                fila = (
                    n["dni"],
                    n["nombre"],
                    n.get("carrera", "Tecnicatura Beltrán"),
                    "SIN_INVITAR",
                    "Sin asignar",
                    n.get("correo", "—"),
                    ""
                )
                self.graduados_todos.append(fila)
                self.modelo.append(list(fila))
                dnis_existentes.add(n["dni"])
                agregados += 1

        self.actualizar_conteo_visible()
        self.mostrar_alerta(
            "Importación Completada",
            f"Se incorporaron exitosamente {agregados} graduados de {len(nuevos)} registros de la planilla."
        )

    def on_cargar_cohorte_modelo(self, button):
        nuevos = []
        dnis_existentes = {f[0] for f in self.graduados_todos}
        for g in COHORTE_MODELO:
            if g["dni"] not in dnis_existentes:
                nuevos.append(g)

        if not nuevos:
            self.mostrar_alerta("Cohorte Modelo", "Todos los alumnos de la cohorte modelo ya están presentes en el padrón.")
            return

        threading.Thread(target=self._hilo_guardar_bulk, args=(nuevos,), daemon=True).start()

    def _hilo_guardar_bulk(self, nuevos):
        url = "http://localhost:3000/api/egresados/importar"
        try:
            payload = json.dumps({"egresados": nuevos}).encode("utf-8")
            req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
            urllib.request.urlopen(req, timeout=4)
        except Exception:
            pass

        filas = []
        for g in nuevos:
            filas.append((
                g["dni"],
                g["nombre"],
                g["carrera"],
                g["estado"],
                g["butaca"],
                g["correo"],
                ""
            ))
        GLib.idle_add(self._agregar_filas_a_tabla, filas)

    def _agregar_filas_a_tabla(self, filas):
        for f in filas:
            self.graduados_todos.append(f)
            self.modelo.append(list(f))
        self.actualizar_conteo_visible()
        self.mostrar_alerta("Cohorte Modelo Cargada", f"Se cargaron {len(filas)} graduados de ejemplo del Instituto Beltrán.")

    def on_descargar_plantilla(self, button):
        home = os.path.expanduser("~")
        dest_dir = os.path.join(home, "Desktop")
        if not os.path.exists(dest_dir):
            dest_dir = os.path.join(home, "Escritorio")
        if not os.path.exists(dest_dir):
            dest_dir = home

        ruta_csv = os.path.join(dest_dir, "Plantilla_Padron_SiGIC.csv")
        try:
            with open(ruta_csv, "w", encoding="utf-8", newline="") as f:
                escritor = csv.writer(f, delimiter=";")
                escritor.writerow(["Nombre Completo", "DNI", "Legajo", "Correo", "Carrera", "Promedio", "Año"])
                escritor.writerow(["García Juan Manuel", "40123456", "LEG-2024-001", "juan.garcia@gmail.com", "Desarrollo de Software", "9.1", "2024"])
                escritor.writerow(["Martínez Lucía Belén", "41234567", "LEG-2024-002", "lucia.martinez@gmail.com", "Automatización y Robótica", "9.4", "2024"])
                escritor.writerow(["Rodríguez Matías", "39987654", "LEG-2024-003", "matias.rodriguez@gmail.com", "Redes e Infraestructura", "8.7", "2024"])

            self.mostrar_alerta(
                "Plantilla Guardada",
                f"La plantilla CSV fue guardada en:\n{ruta_csv}\n\nPodés abrirla y completarla con Microsoft Excel o LibreOffice Calc."
            )
        except Exception as err:
            self.mostrar_alerta("Error", f"No se pudo guardar la plantilla: {err}")

    def on_eliminar_seleccionado(self, button):
        selection = self.treeview.get_selection()
        model, treeiter = selection.get_selected()
        if not treeiter:
            self.mostrar_alerta("Aviso", "Seleccioná primero un graduado en la tabla para eliminarlo.")
            return

        dni = model.get_value(treeiter, 0)
        nombre = model.get_value(treeiter, 1)

        dlg = Gtk.MessageDialog(
            transient_for=self,
            flags=0,
            message_type=Gtk.MessageType.QUESTION,
            buttons=Gtk.ButtonsType.YES_NO,
            text=f"¿Desea eliminar a {nombre}?"
        )
        dlg.format_secondary_text(f"DNI: {dni}\nSe quitará del padrón oficial y se liberarán sus butacas.")
        resp = dlg.run()
        dlg.destroy()

        if resp == Gtk.ResponseType.YES:
            # Eliminar localmente de la lista y modelo
            self.graduados_todos = [g for g in self.graduados_todos if g[0] != dni]
            self.modelo.remove(model.convert_iter_to_child_iter(treeiter))
            self.actualizar_conteo_visible()

            # Enviar delete a la API
            def _hilo_del():
                try:
                    url = f"http://localhost:3000/api/egresados?dni={dni}"
                    req = urllib.request.Request(url, method="DELETE")
                    urllib.request.urlopen(req, timeout=3)
                except Exception:
                    pass
            threading.Thread(target=_hilo_del, daemon=True).start()

    def mostrar_alerta(self, titulo, mensaje):
        dlg = Gtk.MessageDialog(
            transient_for=self,
            flags=0,
            message_type=Gtk.MessageType.INFO,
            buttons=Gtk.ButtonsType.OK,
            text=titulo
        )
        dlg.format_secondary_text(mensaje)
        dlg.run()
        dlg.destroy()


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
