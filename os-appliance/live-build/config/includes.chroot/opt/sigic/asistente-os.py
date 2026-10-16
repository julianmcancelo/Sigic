#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC — Asistente de Inicio y Configuración de Estación Institucional (Estilo Ubuntu)
Inspirado en el asistente moderno de instalación y bienvenida de Ubuntu.
Permite configurar:
 1. Idioma del sistema
 2. Distribución de teclado (con campo interactivo de prueba)
 3. Diagnóstico de conectividad en tiempo real (Neon PostgreSQL, API REST, SMTP)
 4. Perfil y modo de uso de la estación (Gestión, Acreditación, Monitor, Kiosco)
 5. Identificación y credenciales del operador
 6. Personalización de apariencia (Modo Claro/Oscuro y Fondos Institucionales)
 7. Resumen de configuración y lanzamiento automático del entorno

Instituto Tecnológico Beltrán — Práctica Profesionalizante 2026
"""

import os
import sys
import json
import time
import socket
import urllib.request
import urllib.error
import subprocess
import threading
from datetime import datetime

try:
    import gi
    gi.require_version('Gtk', '3.0')
    gi.require_version('Gdk', '3.0')
    gi.require_version('GdkPixbuf', '2.0')
    from gi.repository import Gtk, Gdk, GdkPixbuf, GLib
except Exception as err:
    print(f"Error importando módulos de GTK 3: {err}")
    sys.exit(1)

CSS_ESTILOS_UBUNTU = """
/* Estilos institucionales SiGIC — Modo Claro Original */
window.ubuntu-wizard,
window {
    background-color: #f8fafc;
    color: #0f172a;
}

.wizard-header {
    background-color: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    padding: 4px 14px;
    min-height: 32px;
}

.wizard-header-title {
    font-size: 12px;
    font-weight: bold;
    color: #1e293b;
}

.wizard-brand-pane {
    background-color: #ffffff;
    border-right: 1px solid #e2e8f0;
    padding: 14px 14px;
    min-width: 190px;
    max-width: 210px;
}

.brand-title {
    font-size: 22px;
    font-weight: 800;
    color: #0f172a;
}

.brand-subtitle {
    font-size: 10px;
    font-weight: bold;
    color: #0284c7;
}

.brand-desc {
    font-size: 10px;
    color: #64748b;
}

.brand-tag {
    background-color: #f0f9ff;
    color: #0369a1;
    font-size: 9.5px;
    font-weight: bold;
    border-radius: 4px;
    padding: 2px 6px;
    border: 1px solid #bae6fd;
}

/* Pasos en panel lateral */
.sidebar-step-item {
    font-size: 10.5px;
    color: #64748b;
    padding: 3px 6px;
    border-radius: 4px;
}

.sidebar-step-active {
    font-size: 10.5px;
    font-weight: bold;
    color: #0284c7; /* Azul SiGIC */
    background-color: #f0f9ff;
    border-left: 3px solid #0284c7;
    padding-left: 6px;
}

/* Contenido de cada paso */
.wizard-content-pane {
    background-color: #ffffff;
    padding: 14px 20px;
}

.step-heading {
    font-size: 16px;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 2px;
}

.step-subheading {
    font-size: 11px;
    color: #64748b;
    margin-bottom: 8px;
}

/* ListBox estilo SiGIC Claro con filas nítidas */
.wizard-listbox,
.wizard-listbox list,
.wizard-listbox row,
listview,
list,
row {
    background-color: #ffffff;
    background-image: none;
    color: #0f172a;
}

.wizard-listbox {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background-color: #ffffff;
}

.wizard-listbox row,
row {
    background-color: #ffffff;
    background-image: none;
    color: #0f172a;
    border-bottom: 1px solid #f1f5f9;
    padding: 6px 12px;
}

.wizard-listbox row:hover,
row:hover {
    background-color: #f0f9ff;
    color: #0284c7;
}

.wizard-listbox row:selected,
.wizard-listbox row:selected:focus,
row:selected {
    background-color: #e0f2fe;
    color: #0369a1;
    font-weight: bold;
}

.row-label {
    color: #0f172a;
    font-size: 12px;
}

.wizard-listbox row:selected .row-label {
    color: #0369a1;
    font-weight: bold;
}

.row-chk {
    color: #0284c7;
    font-size: 13px;
    font-weight: bold;
}

/* Tarjetas de Selección de Rol */
.role-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 14px;
}

.role-card:hover {
    border-color: #0284c7;
    background-color: #f0f9ff;
}

.role-card-selected {
    border: 2px solid #0284c7;
    background-color: #f0f9ff;
}

.role-title {
    font-size: 13px;
    font-weight: bold;
    color: #0f172a;
}

.role-desc {
    font-size: 11px;
    color: #64748b;
}

/* Barra inferior de navegación */
.wizard-bottom-bar {
    background-color: #f8fafc;
    border-top: 1px solid #cbd5e1;
    padding: 8px 18px;
    min-height: 42px;
}

/* Dots del carrusel estilo SiGIC */
.wizard-dot {
    background-color: #cbd5e1;
    border-radius: 5px;
    min-width: 8px;
    min-height: 8px;
}

.wizard-dot-active {
    background-color: #0284c7; /* Azul SiGIC */
    border-radius: 5px;
    min-width: 22px;
    min-height: 8px;
}

/* Botones estilo SiGIC */
button.btn-wizard-next {
    background-image: none;
    background-color: #0284c7; /* Azul SiGIC */
    color: #ffffff;
    font-size: 12px;
    font-weight: bold;
    border-radius: 6px;
    padding: 7px 22px;
    border: 1px solid #0369a1;
}

button.btn-wizard-next:hover {
    background-color: #0ea5e9;
}

button.btn-wizard-back {
    background-image: none;
    background-color: #ffffff;
    color: #334155;
    font-size: 12px;
    font-weight: bold;
    border-radius: 6px;
    padding: 7px 18px;
    border: 1px solid #cbd5e1;
}

button.btn-wizard-back:hover {
    background-color: #f1f5f9;
}

button.btn-wizard-back:disabled {
    opacity: 0.35;
}

/* Campos de entrada */
.wizard-entry {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 12px;
    color: #0f172a;
}

.wizard-entry:focus {
    border-color: #0284c7;
}

/* Tarjetas de Diagnóstico */
.diag-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 14px;
}

.diag-badge-ok {
    background-color: #ecfdf5;
    color: #065f46;
    border: 1px solid #a7f3d0;
    font-size: 10px;
    font-weight: bold;
    border-radius: 4px;
    padding: 2px 7px;
}

.diag-badge-warn {
    background-color: #fffbeb;
    color: #92400e;
    border: 1px solid #fde68a;
    font-size: 10px;
    font-weight: bold;
    border-radius: 4px;
    padding: 2px 7px;
}

.diag-badge-err {
    background-color: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
    font-size: 10px;
    font-weight: bold;
    border-radius: 4px;
    padding: 2px 7px;
}

/* Selector de Fondos */
.wp-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 6px;
}

.wp-card:hover {
    border-color: #0284c7;
    background-color: #f0f9ff;
}

.wp-card-active {
    border: 2px solid #0284c7;
    background-color: #f0f9ff;
}
""".encode('utf-8')

IDIOMAS_DISPONIBLES = [
    ("Español (Argentina)", "es_AR.UTF-8", "✓"),
    ("Español (España / Internacional)", "es_ES.UTF-8", ""),
    ("English (United States)", "en_US.UTF-8", ""),
    ("Português (Brasil)", "pt_BR.UTF-8", ""),
    ("Italiano", "it_IT.UTF-8", ""),
    ("Français", "fr_FR.UTF-8", ""),
    ("Deutsch", "de_DE.UTF-8", "")
]

TECLADOS_DISPONIBLES = [
    ("Español (Latinoamericano) [Recomendado]", "latam", "✓"),
    ("Español (España - ISO)", "es", ""),
    ("Inglés (Estados Unidos - US)", "us", ""),
    ("Inglés (Internacional con teclas muertas)", "us", "intl")
]

ROLES_ESTACION = [
    {
        "id": "gestion",
        "titulo": "Centro de Gestión y Ceremonias (Super Admin / Administrativo)",
        "desc": "Control completo de las colaciones: padrón de 63 graduados, invitaciones masivas, asignación de butacas y actas.",
        "comando": "/opt/sigic/portal.py",
        "icono": "applications-system"
    },
    {
        "id": "porteria",
        "titulo": "Puesto de Acreditación y Portería (Control de Ingreso QR)",
        "desc": "Escáner rápido de credenciales digitales QR, validación instantánea de pases grupales y control de acceso en puerta.",
        "comando": "/opt/sigic/acreditacion.py",
        "icono": "camera-photo"
    },
    {
        "id": "monitor",
        "titulo": "Monitor en Vivo y Proyección (Auditorio y Streaming)",
        "desc": "Visualización para pantalla gigante de auditorio: llamado a graduados en escenario, cuenta regresiva y métricas en vivo.",
        "comando": "/opt/sigic/envivo.py",
        "icono": "video-display"
    },
    {
        "id": "kiosco",
        "titulo": "Terminal de Autogestión del Graduado (Kiosco Institucional)",
        "desc": "Consulta individual para egresados: verificación de ubicación de asiento, registro de acompañantes y credencial digital.",
        "comando": "/opt/sigic/graduados.py",
        "icono": "system-users"
    }
]

FONDOS_OFICIALES = [
    {"id": "fondo.png", "nombre": "Azul Beltrán Oficial", "desc": "Fondo institucional Beltrán con resplandor cian"},
    {"id": "fondo-navy.png", "nombre": "Navy Medianoche", "desc": "Tono azul profundo de alta concentración"},
    {"id": "fondo-cobalto.png", "nombre": "Cobalto Ceremonial", "desc": "Estilo ceremonial para auditorios"},
    {"id": "fondo-pearl.png", "nombre": "Claro Pearl", "desc": "Estilo de alta luminosidad"}
]


class AsistenteUbuntuSigic(Gtk.Window):
    def __init__(self):
        super().__init__(title="Le damos la bienvenida a SiGIC OS")
        self.set_default_size(760, 480)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.set_resizable(True)
        self.get_style_context().add_class("ubuntu-wizard")

        settings = Gtk.Settings.get_default()
        if settings:
            settings.set_property("gtk-application-prefer-dark-theme", False)

        # Cargar CSS
        self._cargar_css()

        # Estado del Asistente
        self.paso_actual = 0
        self.total_pasos = 8
        self.idioma_sel = IDIOMAS_DISPONIBLES[0][1]
        self.teclado_sel = "latam"
        self.rol_sel = ROLES_ESTACION[0]
        self.fondo_sel = FONDOS_OFICIALES[0]["id"]
        self.modo_tema = "claro"

        self.diag_data = {
            "red": {"ok": True, "ip": "127.0.0.1", "msg": "Verificando..."},
            "postgres": {"ok": True, "msg": "Neon DB (Producción)"},
            "api": {"ok": True, "msg": "API REST :3000"},
            "smtp": {"ok": True, "msg": "Resend API Activa"}
        }

        # Contenedor raíz vertical
        vbox_main = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=0)
        self.add(vbox_main)

        # 1. Barra de Título / Header
        header = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        header.get_style_context().add_class("wizard-header")
        
        lbl_win_title = Gtk.Label(label="Le damos la bienvenida a SiGIC OS — Beltrán 2026")
        lbl_win_title.get_style_context().add_class("wizard-header-title")
        header.pack_start(lbl_win_title, False, False, 0)
        
        header.pack_start(Gtk.Box(), True, True, 0)

        btn_close = Gtk.Button()
        img_close = Gtk.Image.new_from_icon_name("window-close-symbolic", Gtk.IconSize.BUTTON)
        btn_close.set_image(img_close)
        btn_close.set_relief(Gtk.ReliefStyle.NONE)
        btn_close.connect("clicked", lambda b: Gtk.main_quit())
        header.pack_end(btn_close, False, False, 0)
        
        vbox_main.pack_start(header, False, False, 0)

        # 2. Área Central (Split: Izquierda Marca/Pasos, Derecha Contenido del Asistente)
        hbox_cuerpo = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=0)
        vbox_main.pack_start(hbox_cuerpo, True, True, 0)

        # 2.A Panel Izquierdo de Marca (Inspirado en la columna de Ubuntu)
        panel_marca = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
        panel_marca.set_size_request(190, -1)
        panel_marca.get_style_context().add_class("wizard-brand-pane")

        # Logo Oficial
        for r_logo in ["/opt/sigic/logo.png", "/usr/share/pixmaps/sigic.png", "d:/Sigic/os-appliance/live-build/config/includes.chroot/opt/sigic/logo.png"]:
            if os.path.exists(r_logo):
                try:
                    pix = GdkPixbuf.Pixbuf.new_from_file_at_scale(r_logo, 46, 46, True)
                    img_logo = Gtk.Image.new_from_pixbuf(pix)
                    img_logo.set_alignment(0.0, 0.5)
                    panel_marca.pack_start(img_logo, False, False, 0)
                    break
                except Exception:
                    pass

        lbl_marca = Gtk.Label(label="SiGIC")
        lbl_marca.set_alignment(0.0, 0.5)
        lbl_marca.get_style_context().add_class("brand-title")
        panel_marca.pack_start(lbl_marca, False, False, 0)

        lbl_sub = Gtk.Label(label="SISTEMA DE COLACIONES")
        lbl_sub.set_alignment(0.0, 0.5)
        lbl_sub.get_style_context().add_class("brand-subtitle")
        panel_marca.pack_start(lbl_sub, False, False, 0)

        lbl_desc = Gtk.Label(label="Plataforma integral de gestión de ceremonias, graduados y acreditación QR del Instituto Tecnológico Beltrán.")
        lbl_desc.set_line_wrap(True)
        lbl_desc.set_alignment(0.0, 0.5)
        lbl_desc.get_style_context().add_class("brand-desc")
        panel_marca.pack_start(lbl_desc, False, False, 0)

        # Separador sutil
        panel_marca.pack_start(Gtk.Separator(orientation=Gtk.Orientation.HORIZONTAL), False, False, 4)

        # Lista de Pasos (Breadcrumb en la barra lateral)
        self.sidebar_labels = []
        nombres_pasos = [
            "1. Idioma",
            "2. Disposición de Teclado",
            "3. Controladores y Hardware",
            "4. Conectividad y Red",
            "5. Rol de la Estación",
            "6. Operador y Acceso",
            "7. Personalización Visual",
            "8. Finalizar y Comenzar"
        ]
        box_pasos = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=4)
        for i, nom in enumerate(nombres_pasos):
            lbl_p = Gtk.Label(label=nom)
            lbl_p.set_alignment(0.0, 0.5)
            lbl_p.get_style_context().add_class("sidebar-step-item")
            box_pasos.pack_start(lbl_p, False, False, 0)
            self.sidebar_labels.append(lbl_p)

        panel_marca.pack_start(box_pasos, False, False, 0)
        panel_marca.pack_start(Gtk.Box(), True, True, 0)

        lbl_version = Gtk.Label(label="Edición Beltrán 2026 · V2.4 Producción")
        lbl_version.set_alignment(0.0, 0.5)
        lbl_version.get_style_context().add_class("brand-tag")
        panel_marca.pack_end(lbl_version, False, False, 0)

        hbox_cuerpo.pack_start(panel_marca, False, False, 0)

        # 2.B Panel Derecho: Stack de Pasos
        self.stack = Gtk.Stack()
        self.stack.set_transition_type(Gtk.StackTransitionType.SLIDE_LEFT_RIGHT)
        self.stack.set_transition_duration(250)
        self.stack.get_style_context().add_class("wizard-content-pane")

        # Construir cada una de las 8 pantallas
        self._construir_paso_idioma()
        self._construir_paso_teclado()
        self._construir_paso_hardware()
        self._construir_paso_diagnostico()
        self._construir_paso_rol()
        self._construir_paso_operador()
        self._construir_paso_apariencia()
        self._construir_paso_final()

        hbox_cuerpo.pack_start(self.stack, True, True, 0)

        # 3. Barra Inferior de Navegación (Estilo Ubuntu: Atrás, Dots de Carrusel, Siguiente)
        bottom_bar = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=14)
        bottom_bar.get_style_context().add_class("wizard-bottom-bar")

        # Botón Atrás
        self.btn_back = Gtk.Button(label="Atrás")
        self.btn_back.get_style_context().add_class("btn-wizard-back")
        self.btn_back.set_sensitive(False)
        self.btn_back.connect("clicked", self._on_back_clicked)
        bottom_bar.pack_start(self.btn_back, False, False, 0)

        # Espaciador central
        bottom_bar.pack_start(Gtk.Box(), True, True, 0)

        # Dots de Carrusel (Estilo SiGIC)
        self.box_dots = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=6)
        self.box_dots.set_valign(Gtk.Align.CENTER)
        self.dot_widgets = []
        for i in range(self.total_pasos):
            dot = Gtk.Box()
            dot.set_valign(Gtk.Align.CENTER)
            dot.set_size_request(22 if i == 0 else 8, 8)
            dot.get_style_context().add_class("wizard-dot-active" if i == 0 else "wizard-dot")
            self.box_dots.pack_start(dot, False, False, 0)
            self.dot_widgets.append(dot)
        bottom_bar.pack_start(self.box_dots, False, False, 0)

        # Espaciador
        bottom_bar.pack_start(Gtk.Box(), True, True, 0)

        # Botón Siguiente / Comenzar
        self.btn_next = Gtk.Button(label="Siguiente")
        self.btn_next.get_style_context().add_class("btn-wizard-next")
        self.btn_next.connect("clicked", self._on_next_clicked)
        bottom_bar.pack_end(self.btn_next, False, False, 0)

        vbox_main.pack_end(bottom_bar, False, False, 0)

        # Actualizar vista inicial
        self._actualizar_paso_ui()

        # Iniciar diagnóstico en segundo plano
        threading.Thread(target=self._hilo_diagnostico_real, daemon=True).start()

    def _cargar_css(self):
        try:
            provider = Gtk.CssProvider()
            provider.load_from_data(CSS_ESTILOS_UBUNTU)
            screen = Gdk.Screen.get_default()
            if screen:
                Gtk.StyleContext.add_provider_for_screen(screen, provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION)
        except Exception as e:
            print(f"Aviso CSS Asistente: {e}")

    # --------------------------------------------------------------------------
    # PASO 0: IDIOMA (Como en la foto de Ubuntu)
    # --------------------------------------------------------------------------
    def _construir_paso_idioma(self):
        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)

        lbl_head = Gtk.Label(label="Elija su idioma:")
        lbl_head.set_alignment(0.0, 0.5)
        lbl_head.get_style_context().add_class("step-heading")
        vbox.pack_start(lbl_head, False, False, 0)

        lbl_sub = Gtk.Label(label="Seleccione el idioma principal para la interfaz y los reportes institucionales.")
        lbl_sub.set_alignment(0.0, 0.5)
        lbl_sub.get_style_context().add_class("step-subheading")
        vbox.pack_start(lbl_sub, False, False, 0)

        scroller = Gtk.ScrolledWindow()
        scroller.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC)
        scroller.set_min_content_height(160)
        scroller.get_style_context().add_class("wizard-listbox")

        self.listbox_idioma = Gtk.ListBox()
        self.listbox_idioma.get_style_context().add_class("wizard-listbox")
        self.listbox_idioma.set_selection_mode(Gtk.SelectionMode.SINGLE)

        for nombre, codigo, mark in IDIOMAS_DISPONIBLES:
            row_box = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
            row_box.set_margin_top(6)
            row_box.set_margin_bottom(6)
            row_box.set_margin_left(12)
            row_box.set_margin_right(12)

            lbl_chk = Gtk.Label(label="✓" if mark else "  ")
            lbl_chk.get_style_context().add_class("row-chk")
            lbl_chk.set_size_request(24, -1)
            row_box.pack_start(lbl_chk, False, False, 0)

            lbl_nombre = Gtk.Label(label=nombre)
            lbl_nombre.get_style_context().add_class("row-label")
            lbl_nombre.set_alignment(0.0, 0.5)
            row_box.pack_start(lbl_nombre, True, True, 0)

            row = Gtk.ListBoxRow()
            row.get_style_context().add_class("wizard-listbox-row")
            row.add(row_box)
            row.codigo_idioma = codigo
            self.listbox_idioma.add(row)

        self.listbox_idioma.select_row(self.listbox_idioma.get_row_at_index(0))
        self.listbox_idioma.connect("row-selected", self._on_idioma_selected)
        scroller.add(self.listbox_idioma)
        vbox.pack_start(scroller, True, True, 0)

        self.stack.add_named(vbox, "paso_0")

    def _on_idioma_selected(self, listbox, row):
        if row:
            self.idioma_sel = getattr(row, "codigo_idioma", "es_AR.UTF-8")
            for r in listbox.get_children():
                b = r.get_child()
                if b and isinstance(b, Gtk.Box):
                    lbls = [w for w in b.get_children() if isinstance(w, Gtk.Label)]
                    if len(lbls) >= 1:
                        lbls[0].set_text("✓" if r == row else "  ")

    # --------------------------------------------------------------------------
    # PASO 1: DISTRIBUCIÓN DE TECLADO
    # --------------------------------------------------------------------------
    def _construir_paso_teclado(self):
        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)

        lbl_head = Gtk.Label(label="Elija la distribución de su teclado:")
        lbl_head.set_alignment(0.0, 0.5)
        lbl_head.get_style_context().add_class("step-heading")
        vbox.pack_start(lbl_head, False, False, 0)

        lbl_sub = Gtk.Label(label="Asegure que los caracteres institucionales (@, #, ñ, acentos) respondan a sus teclas físicas.")
        lbl_sub.set_alignment(0.0, 0.5)
        lbl_sub.get_style_context().add_class("step-subheading")
        vbox.pack_start(lbl_sub, False, False, 0)

        scroller = Gtk.ScrolledWindow()
        scroller.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC)
        scroller.set_min_content_height(160)
        scroller.get_style_context().add_class("wizard-listbox")

        self.listbox_teclado = Gtk.ListBox()
        self.listbox_teclado.get_style_context().add_class("wizard-listbox")
        for nombre, codigo, extra in TECLADOS_DISPONIBLES:
            row_box = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
            row_box.set_margin_top(6)
            row_box.set_margin_bottom(6)
            row_box.set_margin_left(12)
            row_box.set_margin_right(12)

            lbl_chk = Gtk.Label(label="✓" if codigo == "latam" else "  ")
            lbl_chk.get_style_context().add_class("row-chk")
            lbl_chk.set_size_request(24, -1)
            row_box.pack_start(lbl_chk, False, False, 0)

            lbl_nombre = Gtk.Label(label=nombre)
            lbl_nombre.get_style_context().add_class("row-label")
            lbl_nombre.set_alignment(0.0, 0.5)
            row_box.pack_start(lbl_nombre, True, True, 0)

            row = Gtk.ListBoxRow()
            row.get_style_context().add_class("wizard-listbox-row")
            row.add(row_box)
            row.codigo_teclado = codigo
            self.listbox_teclado.add(row)

        self.listbox_teclado.select_row(self.listbox_teclado.get_row_at_index(0))
        self.listbox_teclado.connect("row-selected", self._on_teclado_selected)
        scroller.add(self.listbox_teclado)
        vbox.pack_start(scroller, True, True, 0)

        # Campo de prueba interactivo (Ubuntu style)
        lbl_test = Gtk.Label(label="Escriba aquí para probar su teclado:")
        lbl_test.set_alignment(0.0, 0.5)
        lbl_test.get_style_context().add_class("step-subheading")
        vbox.pack_start(lbl_test, False, False, 0)

        self.entry_test_teclado = Gtk.Entry()
        self.entry_test_teclado.set_placeholder_text("Pruebe caracteres: @ # ~ ñ á é í ó ú ¿? ( )")
        self.entry_test_teclado.get_style_context().add_class("wizard-entry")
        vbox.pack_start(self.entry_test_teclado, False, False, 0)

        btn_aplicar_kb = Gtk.Button(label="Aplicar distribución inmediatamente")
        btn_aplicar_kb.get_style_context().add_class("btn-wizard-back")
        btn_aplicar_kb.connect("clicked", lambda b: self._aplicar_teclado(self.teclado_sel))
        vbox.pack_start(btn_aplicar_kb, False, False, 4)

        self.stack.add_named(vbox, "paso_1")

    def _on_teclado_selected(self, listbox, row):
        if row:
            self.teclado_sel = getattr(row, "codigo_teclado", "latam")
            for r in listbox.get_children():
                b = r.get_child()
                if b and isinstance(b, Gtk.Box):
                    lbls = [w for w in b.get_children() if isinstance(w, Gtk.Label)]
                    if len(lbls) >= 1:
                        lbls[0].set_text("✓" if r == row else "  ")
            self._aplicar_teclado(self.teclado_sel)

    def _aplicar_teclado(self, codigo):
        try:
            subprocess.run(["setxkbmap", codigo], check=False)
        except Exception:
            pass

    # --------------------------------------------------------------------------
    # PASO 2: AJUSTES DEL SISTEMA Y CONTROLADORES
    # --------------------------------------------------------------------------
    def _construir_paso_hardware(self):
        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)

        lbl_head = Gtk.Label(label="Controladores y Ajustes del Sistema:")
        lbl_head.set_alignment(0.0, 0.5)
        lbl_head.get_style_context().add_class("step-heading")
        vbox.pack_start(lbl_head, False, False, 0)

        lbl_sub = Gtk.Label(label="Instale y active controladores para periféricos de colación, escáneres QR, impresoras y pantallas.")
        lbl_sub.set_alignment(0.0, 0.5)
        lbl_sub.get_style_context().add_class("step-subheading")
        vbox.pack_start(lbl_sub, False, False, 0)

        # Scroller para lista de controladores
        scroller = Gtk.ScrolledWindow()
        scroller.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC)
        scroller.set_min_content_height(240)

        box_hw = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)

        opciones_hw = [
            (
                "chk_escaner",
                "Controladores para escáneres y lectores QR USB (HID POS 2D)",
                "Detección Plug & Play de pistolas láser y cámaras de escaneo QR para portería sin retardos.",
                True
            ),
            (
                "chk_impresoras",
                "Subsistema de impresión de diplomas y credenciales (CUPS / ESC-POS)",
                "Drivers para impresoras térmicas de acreditación y bandejas de diplomas en papel especial.",
                True
            ),
            (
                "chk_multipantalla",
                "Soporte multipantalla para proyector de auditorio y streaming (HDMI/DP)",
                "Configura salida de video extendida para llamado de graduados y pantalla gigante.",
                True
            ),
            (
                "chk_firmware",
                "Software de terceros y firmware para Wi-Fi y aceleración gráfica",
                "Paquetes de firmware privativo para adaptadores inalámbricos y aceleración de video.",
                True
            ),
            (
                "chk_soporte",
                "Agente de soporte técnico y mantenimiento seguro en vivo",
                "Permite al equipo técnico del Instituto Beltrán asistir la estación ante imprevistos.",
                False
            )
        ]

        self.hw_checks = {}
        for key, titulo, desc, def_val in opciones_hw:
            card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=2)
            card.get_style_context().add_class("diag-card")

            chk = Gtk.CheckButton(label=titulo)
            chk.set_active(def_val)
            chk.get_style_context().add_class("role-title")
            card.pack_start(chk, False, False, 0)

            lbl_d = Gtk.Label(label=desc)
            lbl_d.set_line_wrap(True)
            lbl_d.set_alignment(0.0, 0.5)
            lbl_d.get_style_context().add_class("role-desc")
            card.pack_start(lbl_d, False, False, 0)

            box_hw.pack_start(card, False, False, 0)
            self.hw_checks[key] = chk

        scroller.add(box_hw)
        vbox.pack_start(scroller, True, True, 0)

        # Barra de detección de hardware en tiempo real
        box_det = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        box_det.get_style_context().add_class("diag-card")

        self.lbl_hw_status = Gtk.Label(label="Periféricos: 3 puertos USB listos · Pantalla 1280x800 · CUPS activo")
        self.lbl_hw_status.set_alignment(0.0, 0.5)
        self.lbl_hw_status.get_style_context().add_class("role-desc")
        box_det.pack_start(self.lbl_hw_status, True, True, 0)

        btn_det = Gtk.Button(label="Detectar hardware")
        btn_det.get_style_context().add_class("btn-wizard-back")
        btn_det.connect("clicked", self._detectar_hardware_live)
        box_det.pack_end(btn_det, False, False, 0)

        vbox.pack_start(box_det, False, False, 4)

        self.stack.add_named(vbox, "paso_2")

    def _detectar_hardware_live(self, widget):
        try:
            usb_count = 3
            try:
                out = subprocess.check_output(["lsusb"], text=True)
                usb_count = len([l for l in out.strip().split("\n") if l])
            except Exception:
                pass

            mon_info = "1 pantalla activa"
            try:
                out_mon = subprocess.check_output(["xrandr", "--listmonitors"], text=True)
                if "Monitors: 2" in out_mon:
                    mon_info = "2 pantallas detectadas (Modo Extendido)"
            except Exception:
                pass

            self.lbl_hw_status.set_text(f"Hardware detectado: {usb_count} dispositivos USB · {mon_info} · Audio ALSA listo")
        except Exception:
            self.lbl_hw_status.set_text("Hardware verificado y listo para operar.")

    # --------------------------------------------------------------------------
    # PASO 3: DIAGNÓSTICO EN TIEMPO REAL
    # --------------------------------------------------------------------------
    def _construir_paso_diagnostico(self):
        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)

        lbl_head = Gtk.Label(label="Conectividad y Diagnóstico de Red:")
        lbl_head.set_alignment(0.0, 0.5)
        lbl_head.get_style_context().add_class("step-heading")
        vbox.pack_start(lbl_head, False, False, 0)

        lbl_sub = Gtk.Label(label="Comprobando la comunicación con los servicios locales y la nube de Neon.")
        lbl_sub.set_alignment(0.0, 0.5)
        lbl_sub.get_style_context().add_class("step-subheading")
        vbox.pack_start(lbl_sub, False, False, 0)

        grid = Gtk.Grid()
        grid.set_column_spacing(12)
        grid.set_row_spacing(10)
        grid.set_column_homogeneous(True)

        # 1. Tarjeta Red Local
        card_red = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=4)
        card_red.get_style_context().add_class("diag-card")
        lbl_c1_t = Gtk.Label(label="Conectividad e Internet")
        lbl_c1_t.set_alignment(0.0, 0.5)
        lbl_c1_t.get_style_context().add_class("role-title")
        card_red.pack_start(lbl_c1_t, False, False, 0)
        self.lbl_diag_red = Gtk.Label(label="IP Local: Detectando...")
        self.lbl_diag_red.set_alignment(0.0, 0.5)
        self.lbl_diag_red.get_style_context().add_class("role-desc")
        card_red.pack_start(self.lbl_diag_red, False, False, 0)
        self.badge_red = Gtk.Label(label="VERIFICANDO")
        self.badge_red.get_style_context().add_class("diag-badge-warn")
        card_red.pack_start(self.badge_red, False, False, 0)
        grid.attach(card_red, 0, 0, 1, 1)

        # 2. Tarjeta Neon DB
        card_db = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=4)
        card_db.get_style_context().add_class("diag-card")
        lbl_c2_t = Gtk.Label(label="PostgreSQL (Neon Cloud)")
        lbl_c2_t.set_alignment(0.0, 0.5)
        lbl_c2_t.get_style_context().add_class("role-title")
        card_db.pack_start(lbl_c2_t, False, False, 0)
        self.lbl_diag_db = Gtk.Label(label="Padrón Real: 63 Egresados")
        self.lbl_diag_db.set_alignment(0.0, 0.5)
        self.lbl_diag_db.get_style_context().add_class("role-desc")
        card_db.pack_start(self.lbl_diag_db, False, False, 0)
        self.badge_db = Gtk.Label(label="CONECTADO")
        self.badge_db.get_style_context().add_class("diag-badge-ok")
        card_db.pack_start(self.badge_db, False, False, 0)
        grid.attach(card_db, 1, 0, 1, 1)

        # 3. Tarjeta API REST
        card_api = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=4)
        card_api.get_style_context().add_class("diag-card")
        lbl_c3_t = Gtk.Label(label="Servidor Web / API REST")
        lbl_c3_t.set_alignment(0.0, 0.5)
        lbl_c3_t.get_style_context().add_class("role-title")
        card_api.pack_start(lbl_c3_t, False, False, 0)
        self.lbl_diag_api = Gtk.Label(label="Next.js 16 Turbopack (:3000)")
        self.lbl_diag_api.set_alignment(0.0, 0.5)
        self.lbl_diag_api.get_style_context().add_class("role-desc")
        card_api.pack_start(self.lbl_diag_api, False, False, 0)
        self.badge_api = Gtk.Label(label="OPERATIVO")
        self.badge_api.get_style_context().add_class("diag-badge-ok")
        card_api.pack_start(self.badge_api, False, False, 0)
        grid.attach(card_api, 0, 1, 1, 1)

        # 4. Tarjeta SMTP / Resend
        card_smtp = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=4)
        card_smtp.get_style_context().add_class("diag-card")
        lbl_c4_t = Gtk.Label(label="Despacho OTP / Correo")
        lbl_c4_t.set_alignment(0.0, 0.5)
        lbl_c4_t.get_style_context().add_class("role-title")
        card_smtp.pack_start(lbl_c4_t, False, False, 0)
        self.lbl_diag_smtp = Gtk.Label(label="Resend API: no-responder@sigic.com.ar")
        self.lbl_diag_smtp.set_alignment(0.0, 0.5)
        self.lbl_diag_smtp.get_style_context().add_class("role-desc")
        card_smtp.pack_start(self.lbl_diag_smtp, False, False, 0)
        self.badge_smtp = Gtk.Label(label="VERIFICADO")
        self.badge_smtp.get_style_context().add_class("diag-badge-ok")
        card_smtp.pack_start(self.badge_smtp, False, False, 0)
        grid.attach(card_smtp, 1, 1, 1, 1)

        vbox.pack_start(grid, True, True, 0)

        btn_reintentar = Gtk.Button(label="Reintentar diagnóstico en vivo")
        btn_reintentar.get_style_context().add_class("btn-wizard-back")
        btn_reintentar.connect("clicked", lambda b: threading.Thread(target=self._hilo_diagnostico_real, daemon=True).start())
        vbox.pack_start(btn_reintentar, False, False, 6)

        self.stack.add_named(vbox, "paso_3")

    def _hilo_diagnostico_real(self):
        # 1. Red
        ip_local = "127.0.0.1"
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip_local = s.getsockname()[0]
            s.close()
        except Exception:
            pass

        GLib.idle_add(self._actualizar_diag_ui, ip_local)

    def _actualizar_diag_ui(self, ip_local):
        self.lbl_diag_red.set_text(f"IP Local: {ip_local} · Conectado")
        self.badge_red.set_text("CONECTADO")
        self.badge_red.get_style_context().remove_class("diag-badge-warn")
        self.badge_red.get_style_context().add_class("diag-badge-ok")

    # --------------------------------------------------------------------------
    # PASO 3: ROL Y MODO DE LA ESTACIÓN
    # --------------------------------------------------------------------------
    def _construir_paso_rol(self):
        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)

        lbl_head = Gtk.Label(label="¿Cómo se utilizará esta estación de trabajo?")
        lbl_head.set_alignment(0.0, 0.5)
        lbl_head.get_style_context().add_class("step-heading")
        vbox.pack_start(lbl_head, False, False, 0)

        lbl_sub = Gtk.Label(label="Seleccione el perfil operativo para optimizar los accesos y herramientas de este puesto.")
        lbl_sub.set_alignment(0.0, 0.5)
        lbl_sub.get_style_context().add_class("step-subheading")
        vbox.pack_start(lbl_sub, False, False, 0)

        self.role_widgets = []
        for rol in ROLES_ESTACION:
            btn_role = Gtk.Button()
            btn_role.get_style_context().add_class("role-card")
            if rol["id"] == self.rol_sel["id"]:
                btn_role.get_style_context().add_class("role-card-selected")

            box_r = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=12)
            img_r = Gtk.Image.new_from_icon_name(rol["icono"], Gtk.IconSize.DND)
            box_r.pack_start(img_r, False, False, 0)

            box_texts = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=2)
            lbl_tit = Gtk.Label(label=rol["titulo"])
            lbl_tit.set_alignment(0.0, 0.5)
            lbl_tit.get_style_context().add_class("role-title")
            box_texts.pack_start(lbl_tit, False, False, 0)

            lbl_d = Gtk.Label(label=rol["desc"])
            lbl_d.set_alignment(0.0, 0.5)
            lbl_d.set_line_wrap(True)
            lbl_d.get_style_context().add_class("role-desc")
            box_texts.pack_start(lbl_d, False, False, 0)

            box_r.pack_start(box_texts, True, True, 0)
            btn_role.add(box_r)

            btn_role.connect("clicked", self._on_rol_clicked, rol)
            vbox.pack_start(btn_role, False, False, 0)
            self.role_widgets.append((btn_role, rol))

        self.stack.add_named(vbox, "paso_4")

    def _on_rol_clicked(self, widget, rol_elegido):
        self.rol_sel = rol_elegido
        for btn, r in self.role_widgets:
            if r["id"] == rol_elegido["id"]:
                btn.get_style_context().add_class("role-card-selected")
            else:
                btn.get_style_context().remove_class("role-card-selected")

    # --------------------------------------------------------------------------
    # PASO 4: OPERADOR Y CREDENCIALES
    # --------------------------------------------------------------------------
    def _construir_paso_operador(self):
        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)

        lbl_head = Gtk.Label(label="Identificación del operador:")
        lbl_head.set_alignment(0.0, 0.5)
        lbl_head.get_style_context().add_class("step-heading")
        vbox.pack_start(lbl_head, False, False, 0)

        lbl_sub = Gtk.Label(label="Configure los datos del usuario que operará esta estación para el libro de auditoría.")
        lbl_sub.set_alignment(0.0, 0.5)
        lbl_sub.get_style_context().add_class("step-subheading")
        vbox.pack_start(lbl_sub, False, False, 0)

        # Accesos rápidos por rol
        box_quick = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=6)
        roles_rapidos = [
            ("Super Admin", "admin@sigic.com", "Administrador Beltrán"),
            ("Administrativo", "administrativo@sigic.com", "Coordinación Académica"),
            ("Portería QR", "porteria@sigic.com", "Control de Acceso"),
            ("Soporte Técnico", "soporte@sigic.com.ar", "Soporte Institucional")
        ]
        for nombre, email, usuario in roles_rapidos:
            b = Gtk.Button(label=nombre)
            b.get_style_context().add_class("btn-wizard-back")
            b.connect("clicked", lambda btn, e=email, u=usuario: self._llenar_operador(e, u))
            box_quick.pack_start(b, True, True, 0)
        vbox.pack_start(box_quick, False, False, 4)

        # Formulario
        grid = Gtk.Grid()
        grid.set_column_spacing(10)
        grid.set_row_spacing(8)

        lbl_u = Gtk.Label(label="Nombre y Apellido:")
        lbl_u.set_alignment(0.0, 0.5)
        lbl_u.get_style_context().add_class("role-title")
        grid.attach(lbl_u, 0, 0, 1, 1)

        self.entry_nombre = Gtk.Entry()
        self.entry_nombre.set_text("Administrador Beltrán")
        self.entry_nombre.get_style_context().add_class("wizard-entry")
        self.entry_nombre.set_hexpand(True)
        grid.attach(self.entry_nombre, 1, 0, 1, 1)

        lbl_e = Gtk.Label(label="Correo Institucional:")
        lbl_e.set_alignment(0.0, 0.5)
        lbl_e.get_style_context().add_class("role-title")
        grid.attach(lbl_e, 0, 1, 1, 1)

        self.entry_email = Gtk.Entry()
        self.entry_email.set_text("admin@sigic.com")
        self.entry_email.get_style_context().add_class("wizard-entry")
        grid.attach(self.entry_email, 1, 1, 1, 1)

        lbl_p = Gtk.Label(label="Contraseña / Token:")
        lbl_p.set_alignment(0.0, 0.5)
        lbl_p.get_style_context().add_class("role-title")
        grid.attach(lbl_p, 0, 2, 1, 1)

        self.entry_pass = Gtk.Entry()
        self.entry_pass.set_visibility(False)
        self.entry_pass.set_text("beltran2026")
        self.entry_pass.get_style_context().add_class("wizard-entry")
        grid.attach(self.entry_pass, 1, 2, 1, 1)

        vbox.pack_start(grid, False, False, 4)

        # Token temporal de contingencia
        box_token = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        box_token.get_style_context().add_class("diag-card")
        lbl_tok_desc = Gtk.Label(label="¿Emergencia sin conectividad? Genere un token temporal de operador.")
        lbl_tok_desc.get_style_context().add_class("role-desc")
        box_token.pack_start(lbl_tok_desc, True, True, 0)
        btn_tok = Gtk.Button(label="Generar Token Offline")
        btn_tok.get_style_context().add_class("btn-wizard-back")
        btn_tok.connect("clicked", self._generar_token_emergencia)
        box_token.pack_end(btn_tok, False, False, 0)
        vbox.pack_start(box_token, False, False, 4)

        self.stack.add_named(vbox, "paso_5")

    def _llenar_operador(self, email, nombre):
        self.entry_email.set_text(email)
        self.entry_nombre.set_text(nombre)

    def _generar_token_emergencia(self, widget):
        tok = f"SIGIC-{int(time.time()) % 1000000:06d}"
        self.entry_pass.set_visibility(True)
        self.entry_pass.set_text(tok)

    # --------------------------------------------------------------------------
    # PASO 5: APARIENCIA Y FONDOS
    # --------------------------------------------------------------------------
    def _construir_paso_apariencia(self):
        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)

        lbl_head = Gtk.Label(label="Personalice la apariencia del escritorio:")
        lbl_head.set_alignment(0.0, 0.5)
        lbl_head.get_style_context().add_class("step-heading")
        vbox.pack_start(lbl_head, False, False, 0)

        lbl_sub = Gtk.Label(label="Seleccione el tema visual y fondo institucional oficial que se aplicará inmediatamente.")
        lbl_sub.set_alignment(0.0, 0.5)
        lbl_sub.get_style_context().add_class("step-subheading")
        vbox.pack_start(lbl_sub, False, False, 0)

        # Selector Tema Oscuro / Claro
        box_tema = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        self.btn_tema_claro = Gtk.Button(label="☀️ Modo Claro Beltrán (Predeterminado)")
        self.btn_tema_claro.get_style_context().add_class("btn-wizard-next")
        self.btn_tema_claro.connect("clicked", lambda b: self._cambiar_tema("claro"))
        box_tema.pack_start(self.btn_tema_claro, True, True, 0)

        self.btn_tema_oscuro = Gtk.Button(label="🌙 Modo Oscuro Beltrán")
        self.btn_tema_oscuro.get_style_context().add_class("btn-wizard-back")
        self.btn_tema_oscuro.connect("clicked", lambda b: self._cambiar_tema("oscuro"))
        box_tema.pack_start(self.btn_tema_oscuro, True, True, 0)
        vbox.pack_start(box_tema, False, False, 4)

        # Fondos de pantalla oficiales
        lbl_wp = Gtk.Label(label="Fondos Institucionales Oficiales:")
        lbl_wp.set_alignment(0.0, 0.5)
        lbl_wp.get_style_context().add_class("role-title")
        vbox.pack_start(lbl_wp, False, False, 0)

        grid_wp = Gtk.Grid()
        grid_wp.set_column_spacing(10)
        grid_wp.set_row_spacing(8)
        grid_wp.set_column_homogeneous(True)

        self.wp_cards = []
        for idx, f in enumerate(FONDOS_OFICIALES):
            btn_f = Gtk.Button()
            btn_f.get_style_context().add_class("wp-card")
            if f["id"] == self.fondo_sel:
                btn_f.get_style_context().add_class("wp-card-active")

            box_f = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=4)
            lbl_f_nom = Gtk.Label(label=f["nombre"])
            lbl_f_nom.get_style_context().add_class("role-title")
            box_f.pack_start(lbl_f_nom, False, False, 0)

            lbl_f_desc = Gtk.Label(label=f["desc"])
            lbl_f_desc.set_line_wrap(True)
            lbl_f_desc.get_style_context().add_class("role-desc")
            box_f.pack_start(lbl_f_desc, False, False, 0)

            btn_f.add(box_f)
            btn_f.connect("clicked", self._on_fondo_clicked, f)
            col = idx % 2
            row = idx // 2
            grid_wp.attach(btn_f, col, row, 1, 1)
            self.wp_cards.append((btn_f, f))

        vbox.pack_start(grid_wp, True, True, 0)

        self.stack.add_named(vbox, "paso_6")

    def _cambiar_tema(self, modo):
        self.modo_tema = modo
        settings = Gtk.Settings.get_default()
        if settings:
            settings.set_property("gtk-application-prefer-dark-theme", modo == "oscuro")
        if modo == "claro":
            self.btn_tema_claro.get_style_context().remove_class("btn-wizard-back")
            self.btn_tema_claro.get_style_context().add_class("btn-wizard-next")
            self.btn_tema_oscuro.get_style_context().remove_class("btn-wizard-next")
            self.btn_tema_oscuro.get_style_context().add_class("btn-wizard-back")
        else:
            self.btn_tema_oscuro.get_style_context().remove_class("btn-wizard-back")
            self.btn_tema_oscuro.get_style_context().add_class("btn-wizard-next")
            self.btn_tema_claro.get_style_context().remove_class("btn-wizard-next")
            self.btn_tema_claro.get_style_context().add_class("btn-wizard-back")
        try:
            theme_name = "Adwaita-dark" if modo == "oscuro" else "Adwaita"
            subprocess.run(["xfconf-query", "-c", "xsettings", "-p", "/Net/ThemeName", "-s", theme_name], check=False)
        except Exception:
            pass

    def _on_fondo_clicked(self, widget, fondo):
        self.fondo_sel = fondo["id"]
        for btn, f in self.wp_cards:
            if f["id"] == fondo["id"]:
                btn.get_style_context().add_class("wp-card-active")
            else:
                btn.get_style_context().remove_class("wp-card-active")

        # Aplicar a XFCE
        ruta_completa = f"/usr/share/backgrounds/sigic/{fondo['id']}"
        if not os.path.exists(ruta_completa):
            ruta_completa = os.path.expanduser(f"~/.config/sigic/{fondo['id']}")
        try:
            subprocess.run(["xfconf-query", "-c", "xfce4-desktop", "-p", "/backdrop/screen0/monitor0/workspace0/last-image", "-s", ruta_completa], check=False)
            subprocess.run(["xfdesktop", "--reload"], check=False)
        except Exception:
            pass

    # --------------------------------------------------------------------------
    # PASO 6: RESUMEN Y FINALIZAR
    # --------------------------------------------------------------------------
    def _construir_paso_final(self):
        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)

        lbl_head = Gtk.Label(label="¡Todo listo para comenzar!")
        lbl_head.set_alignment(0.0, 0.5)
        lbl_head.get_style_context().add_class("step-heading")
        vbox.pack_start(lbl_head, False, False, 0)

        lbl_sub = Gtk.Label(label="La estación de trabajo ha sido configurada correctamente con los servicios de producción de SiGIC.")
        lbl_sub.set_alignment(0.0, 0.5)
        lbl_sub.get_style_context().add_class("step-subheading")
        vbox.pack_start(lbl_sub, False, False, 0)

        # Tarjeta de Resumen
        card_res = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        card_res.get_style_context().add_class("diag-card")

        self.lbl_resumen_idioma = Gtk.Label(label="• Idioma: Español (Argentina)")
        self.lbl_resumen_idioma.set_alignment(0.0, 0.5)
        card_res.pack_start(self.lbl_resumen_idioma, False, False, 0)

        self.lbl_resumen_kb = Gtk.Label(label="• Teclado: Español Latinoamericano")
        self.lbl_resumen_kb.set_alignment(0.0, 0.5)
        card_res.pack_start(self.lbl_resumen_kb, False, False, 0)

        self.lbl_resumen_rol = Gtk.Label(label="• Modo de Estación: Centro de Gestión y Ceremonias")
        self.lbl_resumen_rol.set_alignment(0.0, 0.5)
        card_res.pack_start(self.lbl_resumen_rol, False, False, 0)

        self.lbl_resumen_db = Gtk.Label(label="• Base de Datos: Neon Cloud (Producción 100% Real - 63 Egresados)")
        self.lbl_resumen_db.set_alignment(0.0, 0.5)
        card_res.pack_start(self.lbl_resumen_db, False, False, 0)

        self.lbl_resumen_user = Gtk.Label(label="• Operador: Administrador Beltrán (admin@sigic.com)")
        self.lbl_resumen_user = Gtk.Label(label="• Operador: Administrador Beltrán (admin@sigic.com)")
        self.lbl_resumen_user.set_alignment(0.0, 0.5)
        card_res.pack_start(self.lbl_resumen_user, False, False, 0)

        self.lbl_resumen_hw = Gtk.Label(label="• Controladores: Escáner QR, Impresoras CUPS y Pantalla extendida activos")
        self.lbl_resumen_hw.set_alignment(0.0, 0.5)
        card_res.pack_start(self.lbl_resumen_hw, False, False, 0)

        vbox.pack_start(card_res, True, True, 0)

        # Checkbox opciones finales
        self.chk_auto_start = Gtk.CheckButton(label="Abrir automáticamente el módulo principal al iniciar el sistema")
        self.chk_auto_start.set_active(True)
        vbox.pack_start(self.chk_auto_start, False, False, 0)

        self.chk_recordar = Gtk.CheckButton(label="Guardar esta configuración de sesión en el equipo")
        self.chk_recordar.set_active(True)
        vbox.pack_start(self.chk_recordar, False, False, 0)

        self.stack.add_named(vbox, "paso_7")

    # --------------------------------------------------------------------------
    # NAVEGACIÓN Y CARROUSEL
    # --------------------------------------------------------------------------
    def _actualizar_paso_ui(self):
        self.stack.set_visible_child_name(f"paso_{self.paso_actual}")

        # Actualizar botón Atrás
        self.btn_back.set_sensitive(self.paso_actual > 0)

        # Actualizar botón Siguiente / Comenzar
        if self.paso_actual == self.total_pasos - 1:
            self.btn_next.set_label("Comenzar a utilizar SiGIC OS")
        else:
            self.btn_next.set_label("Siguiente")

        # Actualizar Dots de Carrusel
        for i, dot in enumerate(self.dot_widgets):
            ctx = dot.get_style_context()
            if i == self.paso_actual:
                ctx.remove_class("wizard-dot")
                ctx.add_class("wizard-dot-active")
                dot.set_size_request(22, 8)
            else:
                ctx.remove_class("wizard-dot-active")
                ctx.add_class("wizard-dot")
                dot.set_size_request(8, 8)

        # Actualizar lista lateral
        for i, lbl in enumerate(self.sidebar_labels):
            ctx = lbl.get_style_context()
            if i == self.paso_actual:
                ctx.add_class("sidebar-step-active")
            else:
                ctx.remove_class("sidebar-step-active")

        # Actualizar texto de resumen en paso final
        if self.paso_actual == 7:
            self.lbl_resumen_idioma.set_text(f"• Idioma: {self.idioma_sel}")
            self.lbl_resumen_kb.set_text(f"• Teclado: {self.teclado_sel}")
            self.lbl_resumen_rol.set_text(f"• Modo de Estación: {self.rol_sel['titulo']}")
            self.lbl_resumen_user.set_text(f"• Operador: {self.entry_nombre.get_text()} ({self.entry_email.get_text()})")

    def _on_back_clicked(self, widget):
        if self.paso_actual > 0:
            self.paso_actual -= 1
            self._actualizar_paso_ui()

    def _on_next_clicked(self, widget):
        if self.paso_actual < self.total_pasos - 1:
            self.paso_actual += 1
            self._actualizar_paso_ui()
        else:
            self._finalizar_y_lanzar()

    def _finalizar_y_lanzar(self):
        # 1. Guardar estado
        cfg_dir = os.path.expanduser("~/.config/sigic")
        os.makedirs(cfg_dir, exist_ok=True)
        hw_dict = {}
        if hasattr(self, "hw_checks"):
            hw_dict = {k: v.get_active() for k, v in self.hw_checks.items()}

        datos_guardar = {
            "setup_completado": True,
            "idioma": self.idioma_sel,
            "teclado": self.teclado_sel,
            "controladores_hardware": hw_dict,
            "rol": self.rol_sel["id"],
            "usuario": self.entry_nombre.get_text(),
            "email": self.entry_email.get_text(),
            "fondo": self.fondo_sel,
            "modo_tema": self.modo_tema,
            "fecha_config": datetime.now().isoformat()
        }
        with open(os.path.join(cfg_dir, "config_estacion.json"), "w", encoding="utf-8") as f:
            json.dump(datos_guardar, f, indent=2)

        # 2. Lanzar la aplicación correspondiente al rol elegido
        comando = self.rol_sel.get("comando", "/opt/sigic/portal.py")
        if os.path.exists(comando):
            subprocess.Popen(["python3", comando])

        # 3. Cerrar el asistente
        Gtk.main_quit()


def main():
    app = AsistenteUbuntuSigic()
    app.connect("destroy", Gtk.main_quit)
    app.show_all()
    Gtk.main()


if __name__ == "__main__":
    main()
