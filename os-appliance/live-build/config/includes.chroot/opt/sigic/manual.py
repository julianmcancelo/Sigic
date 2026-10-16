#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC — Manual de Usuario y Soporte Institucional
Aplicación nativa GTK3 para consultar la documentación oficial de la plataforma offline.
"""

import os
import sys

try:
    import gi
    gi.require_version('Gtk', '3.0')
    gi.require_version('Gdk', '3.0')
    from gi.repository import Gtk, Gdk, GdkPixbuf
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

.sidebar-list {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
}

.content-card {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    padding: 20px;
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
"""

CAPITULOS = [
    {
        "titulo": "1. Introducción y Arquitectura",
        "contenido": """<b>1. Introducción y Arquitectura del Sistema</b>

SiGIC es el Sistema Integral de Gestión Institucional de Colaciones desarrollado para el <b>Instituto Tecnológico Beltrán</b>.

<b>Objetivos Principales:</b>
• Centralización integral del acto académico de grado.
• Despacho de convocatorias vía correo electrónico con token seguro de un solo uso (OTP).
• Autogestión del egresado: confirmación de asistencia, registro de acompañantes y selección de butacas.
• Acreditación ágil y sin demoras en portería el día del evento mediante escaneo de credenciales QR.
• Operación autónoma sin requerir conexión a internet durante el acto en el anfiteatro.
"""
    },
    {
        "titulo": "2. Gestión de Ceremonias",
        "contenido": """<b>2. Gestión y Creación de Ceremonias</b>

El módulo de Ceremonias permite programar y configurar los actos académicos.

<b>Puntos Clave:</b>
• <b>Creación de Acto:</b> Se define nombre, fecha, horario, sede y cupo máximo de invitados por egresado.
• <b>Ceremonia Activa:</b> Solo una ceremonia puede estar en estado 'Activa' simultáneamente para el proceso de acreditación en portería.
• <b>Aforo y Anfiteatro:</b> El sistema valida automáticamente que la sumatoria de egresados y acompañantes no supere la capacidad del recinto.
"""
    },
    {
        "titulo": "3. Padrón y Carga de Graduados",
        "contenido": """<b>3. Padrón y Carga de Graduados</b>

El módulo de Graduados gestiona la nómina de estudiantes habilitados para recibir el título.

<b>Funcionalidades:</b>
• <b>Importación Masiva (Excel / CSV):</b> Permite cargar el padrón completo provisto por Secretaría Académica.
• <b>Estados del Egresado:</b>
  - <i>Pendiente:</i> Cargado en el sistema pero sin invitación despachada.
  - <i>Invitado:</i> Notificación por correo enviada con token de acceso.
  - <i>Aceptado:</i> Asistencia confirmada por el graduado.
  - <i>Confirmado:</i> Registro de invitados y butacas completado; credencial QR emitida.
  - <i>Rechazado:</i> El egresado indicó que no asistirá al acto.
"""
    },
    {
        "titulo": "4. Control de Ingreso y Portería",
        "contenido": """<b>4. Control de Ingreso y Portería</b>

El módulo de Acreditación se utiliza el día de la colación para verificar y autorizar el acceso al recinto.

<b>Modos de Uso:</b>
• <b>Escaneo de Credencial QR:</b> La credencial del graduado funciona como pase grupal para él y sus invitados.
• <b>Búsqueda por DNI:</b> En caso de olvido de la credencial, el operador de portería puede ingresar el DNI manualmente.
• <b>Semáforo Visual:</b>
  - <span foreground='#059669'><b>VERDE:</b></span> Ingreso habilitado y butacas autorizadas.
  - <span foreground='#d97706'><b>AMARILLO:</b></span> Alerta de reingreso (ya validado previamente).
  - <span foreground='#dc2626'><b>ROJO:</b></span> No habilitado, inasistencia o DNI no encontrado.
"""
    },
    {
        "titulo": "5. Soporte y Mantenimiento",
        "contenido": """<b>5. Soporte Técnico y Mantenimiento</b>

<b>Herramientas Integradas:</b>
• <b>Modo Mantenimiento:</b> Suspende temporalmente el acceso público al portal web preservando el acceso de los administradores.
• <b>Selector de Apariencia:</b> Permite alternar entre los fondos oficiales de SiGIC en tiempo real.
• <b>Verificación de Servicios:</b> Monitor de estado del motor de base de datos PostgreSQL y los servicios del sistema.
"""
    }
]

class ManualSigic(Gtk.Window):
    def __init__(self):
        super().__init__(title="Manual de Usuario y Soporte — SiGIC")
        self.set_default_size(860, 580)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.get_style_context().add_class("sigic-window")

        header = Gtk.HeaderBar()
        header.set_show_close_button(True)
        header.props.title = "Manual de Usuario SiGIC"
        header.props.subtitle = "Instituto Tecnológico Beltrán — Guía Oficial Offline"
        header.get_style_context().add_class("sigic-headerbar")
        self.set_titlebar(header)

        paned = Gtk.Paned(orientation=Gtk.Orientation.HORIZONTAL)
        paned.set_position(260)
        paned.set_margin_top(14)
        paned.set_margin_bottom(14)
        paned.set_margin_start(16)
        paned.set_margin_end(16)
        self.add(paned)

        # Columna izquierda: Lista de capítulos
        scroll_list = Gtk.ScrolledWindow()
        scroll_list.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC)
        scroll_list.get_style_context().add_class("sidebar-list")

        self.listbox = Gtk.ListBox()
        self.listbox.set_selection_mode(Gtk.SelectionMode.SINGLE)
        self.listbox.connect("row-selected", self.on_capitulo_selected)

        for cap in CAPITULOS:
            row = Gtk.ListBoxRow()
            lbl = Gtk.Label(xalign=0)
            lbl.set_markup(f"<span foreground='#0f172a' weight='bold'>{cap['titulo']}</span>")
            lbl.set_margin_top(12)
            lbl.set_margin_bottom(12)
            lbl.set_margin_start(12)
            lbl.set_margin_end(12)
            row.add(lbl)
            self.listbox.add(row)

        scroll_list.add(self.listbox)
        paned.pack1(scroll_list, False, False)

        # Columna derecha: Contenido del capítulo
        scroll_content = Gtk.ScrolledWindow()
        scroll_content.set_policy(Gtk.PolicyType.AUTOMATIC, Gtk.PolicyType.AUTOMATIC)
        scroll_content.get_style_context().add_class("content-card")

        self.lbl_contenido = Gtk.Label(xalign=0, yalign=0)
        self.lbl_contenido.set_line_wrap(True)
        self.lbl_contenido.set_margin_top(10)
        self.lbl_contenido.set_margin_bottom(10)
        self.lbl_contenido.set_margin_start(14)
        self.lbl_contenido.set_margin_end(14)

        scroll_content.add(self.lbl_contenido)
        paned.pack2(scroll_content, True, False)

        # Seleccionar primer capítulo
        primera_fila = self.listbox.get_row_at_index(0)
        if primera_fila:
            self.listbox.select_row(primera_fila)

    def on_capitulo_selected(self, listbox, row):
        if not row:
            return
        idx = row.get_index()
        if 0 <= idx < len(CAPITULOS):
            texto = CAPITULOS[idx]["contenido"]
            self.lbl_contenido.set_markup(texto)

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
    win = ManualSigic()
    aplicar_estilos()
    win.connect("destroy", Gtk.main_quit)
    win.show_all()
    Gtk.main()

if __name__ == "__main__":
    main()
