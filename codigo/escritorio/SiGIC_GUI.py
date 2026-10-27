import os
import sys
import subprocess
import threading
import webbrowser
import time
import re
import socket
import requests
import customtkinter as ctk
from PIL import Image

# Configuración visual: Modo Claro con estética Windows 11 Fluent Design
ctk.set_appearance_mode("light")
ctk.set_default_color_theme("blue")

# Expresión regular para limpiar códigos ANSI de la consola
ANSI_REGEX = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')

def resolver_recurso(nombre_archivo, base_dir=None):
    """Resuelve la ruta de un recurso tanto empaquetado con PyInstaller como en ejecución directa."""
    if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
        ruta_bundle = os.path.join(sys._MEIPASS, nombre_archivo)
        if os.path.exists(ruta_bundle):
            return ruta_bundle

    if base_dir:
        posibles = [
            os.path.join(base_dir, nombre_archivo),
            os.path.join(base_dir, "public", nombre_archivo),
            os.path.join(base_dir, "codigo", "plataforma", "public", nombre_archivo),
            os.path.join(base_dir, "03_CODIGO_FUENTE_LIMPIO", "plataforma_web", "public", nombre_archivo),
        ]
        for p in posibles:
            if os.path.exists(p):
                return p

    ruta_local = os.path.join(os.path.dirname(os.path.abspath(__file__)), nombre_archivo)
    if os.path.exists(ruta_local):
        return ruta_local

    return None


class SigicApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("SiGIC — Centro de Control y Evaluación Institucional")
        self.geometry("980x660")
        self.minsize(900, 590)

        # Configurar color de fondo de la ventana principal (Windows 11 Light Canvas)
        self.configure(fg_color="#f1f5f9")

        # Forzar ventana al frente al inicio
        self.lift()
        self.attributes('-topmost', True)
        self.after(500, lambda: self.attributes('-topmost', False))
        self.focus_force()

        # Asegurar Node.js en PATH de Windows si está en ubicaciones estándar
        rutas_node = [
            r"C:\Program Files\nodejs",
            r"C:\Program Files (x86)\nodejs",
            os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "node", "nodejs")
        ]
        for rn in rutas_node:
            if os.path.exists(rn) and rn.lower() not in os.environ.get("PATH", "").lower():
                os.environ["PATH"] = rn + ";" + os.environ.get("PATH", "")

        # Protocolo de cierre seguro
        self.protocol("WM_DELETE_WINDOW", self._al_cerrar_ventana)

        # Ubicación base del proyecto
        if getattr(sys, 'frozen', False):
            self.base_dir = os.path.dirname(os.path.abspath(sys.executable))
        else:
            dir_actual = os.path.dirname(os.path.abspath(__file__))
            if os.path.basename(dir_actual).lower() == "escritorio":
                self.base_dir = os.path.dirname(os.path.dirname(dir_actual))
            else:
                self.base_dir = dir_actual

        # Rutas de carpetas
        self.web_dir = os.path.join(self.base_dir, "03_CODIGO_FUENTE_LIMPIO", "plataforma_web")
        if not os.path.exists(self.web_dir):
            self.web_dir = os.path.join(self.base_dir, "codigo", "plataforma")

        self.doc_dir = os.path.join(self.base_dir, "01_DOCUMENTACION_OFICIAL")
        self.apk_dir = os.path.join(self.base_dir, "02_APP_MOVIL_PORTERIA_ANDROID")

        # Control del servidor local y base de datos
        self.server_proc = None
        self.server_running = False
        self.usar_local_pg_activo = False

        # Configurar icono de la aplicación
        icon_path = resolver_recurso("icon.ico", self.base_dir)
        if not icon_path:
            icon_candidato = os.path.join(self.web_dir, "src-tauri", "icons", "icon.ico")
            if os.path.exists(icon_candidato):
                icon_path = icon_candidato

        if icon_path and os.path.exists(icon_path):
            try:
                self.iconbitmap(icon_path)
            except Exception:
                pass

        self._crear_interfaz()
        self.after(2500, self._iniciar_monitoreo_estado)

    def _crear_interfaz(self):
        # Contenedor principal sin barras de scroll
        self.main_container = ctk.CTkFrame(self, fg_color="#f1f5f9", corner_radius=0)
        self.main_container.pack(fill="both", expand=True, padx=16, pady=(12, 8))

        # -------------------------------------------------------------
        # 1. ENCABEZADO INSTITUCIONAL CON LOGO BELTRÁN Y ESTADO EN VIVO
        # -------------------------------------------------------------
        header_card = ctk.CTkFrame(
            self.main_container,
            fg_color="#ffffff",
            corner_radius=12,
            border_width=1,
            border_color="#e2e8f0"
        )
        header_card.pack(fill="x", pady=(0, 10))

        header_inner = ctk.CTkFrame(header_card, fg_color="transparent")
        header_inner.pack(fill="x", padx=16, pady=10)

        # Cargar Logo Oficial Beltrán
        logo_path = resolver_recurso("logo-oficial.png", self.base_dir)
        if not logo_path:
            logo_path = resolver_recurso("logo.png", self.base_dir)

        self.logo_image = None
        if logo_path and os.path.exists(logo_path):
            try:
                pil_img = Image.open(logo_path)
                self.logo_image = ctk.CTkImage(light_image=pil_img, dark_image=pil_img, size=(46, 46))
            except Exception as e:
                print("Error cargando logo:", e)

        # Layout del encabezado (Logo a la izquierda, Títulos al centro, Estados a la derecha)
        if self.logo_image:
            lbl_logo = ctk.CTkLabel(header_inner, image=self.logo_image, text="")
            lbl_logo.pack(side="left", padx=(0, 14))

        textos_frame = ctk.CTkFrame(header_inner, fg_color="transparent")
        textos_frame.pack(side="left", fill="both", expand=True)

        badge_frame = ctk.CTkFrame(textos_frame, fg_color="transparent")
        badge_frame.pack(anchor="w", pady=(0, 2))

        badge = ctk.CTkLabel(
            badge_frame,
            text="INSTITUTO TECNOLÓGICO BELTRÁN · PROYECTO FINAL TSAS",
            font=ctk.CTkFont(family="Segoe UI", size=9, weight="bold"),
            text_color="#0369a1",
            fg_color="#e0f2fe",
            corner_radius=6,
            padx=8,
            pady=2
        )
        badge.pack(side="left")

        title = ctk.CTkLabel(
            textos_frame,
            text="SiGIC — Sistema de Gestión Institucional de Colaciones",
            font=ctk.CTkFont(family="Segoe UI", size=17, weight="bold"),
            text_color="#0f172a"
        )
        title.pack(anchor="w")

        subtitle = ctk.CTkLabel(
            textos_frame,
            text="Centro de Lanzamiento, Demostración y Evaluación · Tecnicatura Superior en Analista de Sistemas",
            font=ctk.CTkFont(family="Segoe UI", size=11),
            text_color="#64748b"
        )
        subtitle.pack(anchor="w", pady=(1, 0))

        # Indicadores de Estado en el Encabezado (a la derecha)
        status_box = ctk.CTkFrame(header_inner, fg_color="transparent")
        status_box.pack(side="right", padx=(10, 0), pady=1)

        f_cloud = ctk.CTkFrame(status_box, fg_color="#f0fdf4", corner_radius=6, border_width=1, border_color="#bbf7d0")
        f_cloud.pack(anchor="e", pady=1)
        self.lbl_cloud = ctk.CTkLabel(
            f_cloud,
            text="● Plataforma Online",
            font=ctk.CTkFont(family="Segoe UI", size=9, weight="bold"),
            text_color="#15803d",
            padx=8,
            pady=2
        )
        self.lbl_cloud.pack()

        f_db = ctk.CTkFrame(status_box, fg_color="#f0f9ff", corner_radius=6, border_width=1, border_color="#bae6fd")
        f_db.pack(anchor="e", pady=1)
        self.lbl_db = ctk.CTkLabel(
            f_db,
            text="● Base de Datos Conectada",
            font=ctk.CTkFont(family="Segoe UI", size=9, weight="bold"),
            text_color="#0369a1",
            padx=8,
            pady=2
        )
        self.lbl_db.pack()

        self.f_local = ctk.CTkFrame(status_box, fg_color="#f8fafc", corner_radius=6, border_width=1, border_color="#e2e8f0")
        self.f_local.pack(anchor="e", pady=1)
        self.lbl_local = ctk.CTkLabel(
            self.f_local,
            text="○ Servidor Local: Detenido",
            font=ctk.CTkFont(family="Segoe UI", size=9, weight="bold"),
            text_color="#64748b",
            padx=8,
            pady=2
        )
        self.lbl_local.pack()

        # -------------------------------------------------------------
        # 2. SISTEMA DE SOLAPAS (TABVIEW DEDICADO POR MÓDULO)
        # -------------------------------------------------------------
        self.tabview = ctk.CTkTabview(
            self.main_container,
            fg_color="#ffffff",
            corner_radius=12,
            border_width=1,
            border_color="#e2e8f0",
            segmented_button_fg_color="#f1f5f9",
            segmented_button_selected_color="#0284c7",
            segmented_button_selected_hover_color="#0369a1",
            segmented_button_unselected_color="#ffffff",
            segmented_button_unselected_hover_color="#e2e8f0",
            text_color="#0f172a"
        )
        self.tabview.pack(fill="both", expand=True, padx=0, pady=(0, 8))

        # Crear las Solapas Dedicadas
        tab_cloud = self.tabview.add("Plataforma Cloud")
        tab_local = self.tabview.add("Servidor Local")
        tab_doc = self.tabview.add("Documentación & DER")
        tab_apk = self.tabview.add("App Móvil Android")
        tab_console = self.tabview.add("Consola de Diagnóstico")
        tab_about = self.tabview.add("Acerca de & Equipo")

        self.tabview._segmented_button.configure(
            font=ctk.CTkFont(family="Segoe UI", size=11, weight="bold"),
            height=32
        )

        # -------------------------------------------------------------
        # SOLAPA 1: PLATAFORMA EN LA WEB
        # -------------------------------------------------------------
        p1 = ctk.CTkFrame(tab_cloud, fg_color="transparent")
        p1.pack(fill="both", expand=True, padx=16, pady=12)

        tag_c1 = ctk.CTkLabel(
            p1,
            text="SISTEMA EN LA WEB · LISTO PARA USAR",
            font=ctk.CTkFont(family="Segoe UI", size=9, weight="bold"),
            text_color="#0284c7",
            fg_color="#e0f2fe",
            corner_radius=5,
            padx=8,
            pady=2
        )
        tag_c1.pack(anchor="w", pady=(0, 6))

        ctk.CTkLabel(
            p1,
            text="Plataforma SiGIC en Vivo",
            font=ctk.CTkFont(family="Segoe UI", size=17, weight="bold"),
            text_color="#0f172a"
        ).pack(anchor="w")

        ctk.CTkLabel(
            p1,
            text="Todo el sistema ya está publicado y disponible en internet. Desde acá podés entrar directo a gestionar las ceremonias, cargar alumnos o probar el portal que ven los egresados.",
            font=ctk.CTkFont(family="Segoe UI", size=11),
            text_color="#64748b",
            wraplength=820,
            justify="left"
        ).pack(anchor="w", pady=(4, 14))

        # Cuadro de accesos directos
        specs_box = ctk.CTkFrame(p1, fg_color="#f8fafc", corner_radius=10, border_width=1, border_color="#e2e8f0")
        specs_box.pack(fill="x", pady=(0, 16), padx=2)

        items_specs = [
            ("Panel de Administración:", "app.sigic.com.ar — Para crear ceremonias, subir el padrón y asignar butacas."),
            ("Portal de Autogestión:", "graduados.sigic.com.ar — Donde el egresado confirma asistencia y descarga su QR."),
            ("Sitio Institucional:", "www.sigic.com.ar — Portada informativa y manual de usuario integrado."),
            ("Base de Datos:", "Sincronizada en vivo, accesible desde cualquier lugar sin instalaciones previas."),
        ]
        for titular, detalle in items_specs:
            row_f = ctk.CTkFrame(specs_box, fg_color="transparent")
            row_f.pack(fill="x", padx=14, pady=3)
            ctk.CTkLabel(row_f, text=titular, font=ctk.CTkFont(family="Segoe UI", size=10, weight="bold"), text_color="#334155", width=220, anchor="w").pack(side="left")
            ctk.CTkLabel(row_f, text=detalle, font=ctk.CTkFont(family="Segoe UI", size=10), text_color="#64748b", anchor="w").pack(side="left", fill="x", expand=True)

        # Botones de acción Cloud
        btn_row_c = ctk.CTkFrame(p1, fg_color="transparent")
        btn_row_c.pack(fill="x", pady=(6, 0))

        btn_cloud_admin = ctk.CTkButton(
            btn_row_c,
            text="Abrir Panel Administrativo (app.sigic.com.ar) ↗",
            font=ctk.CTkFont(family="Segoe UI", size=12, weight="bold"),
            fg_color="#0284c7",
            hover_color="#0369a1",
            text_color="#ffffff",
            corner_radius=8,
            height=38,
            command=lambda: webbrowser.open("https://app.sigic.com.ar")
        )
        btn_cloud_admin.pack(side="left", fill="x", expand=True, padx=(0, 8))

        btn_cloud_grad = ctk.CTkButton(
            btn_row_c,
            text="Abrir Portal de Egresados (graduados.sigic.com.ar) ↗",
            font=ctk.CTkFont(family="Segoe UI", size=12, weight="bold"),
            fg_color="#f1f5f9",
            hover_color="#e2e8f0",
            text_color="#0f172a",
            border_width=1,
            border_color="#cbd5e1",
            corner_radius=8,
            height=38,
            command=lambda: webbrowser.open("https://graduados.sigic.com.ar")
        )
        btn_cloud_grad.pack(side="left", fill="x", expand=True, padx=(8, 0))

        # -------------------------------------------------------------
        # SOLAPA 2: SERVIDOR LOCAL
        # -------------------------------------------------------------
        p2 = ctk.CTkFrame(tab_local, fg_color="transparent")
        p2.pack(fill="both", expand=True, padx=16, pady=12)

        tag_c2 = ctk.CTkLabel(
            p2,
            text="MODO LOCAL / PRUEBAS SIN INTERNET",
            font=ctk.CTkFont(family="Segoe UI", size=9, weight="bold"),
            text_color="#15803d",
            fg_color="#dcfce7",
            corner_radius=5,
            padx=8,
            pady=2
        )
        tag_c2.pack(anchor="w", pady=(0, 6))

        ctk.CTkLabel(
            p2,
            text="Servidor Web en tu Computadora",
            font=ctk.CTkFont(family="Segoe UI", size=17, weight="bold"),
            text_color="#0f172a"
        ).pack(anchor="w")

        ctk.CTkLabel(
            p2,
            text="Si querés probar o mostrar cambios directamente desde el código en esta máquina, podés iniciar el servidor con un solo clic, sin necesidad de comandos raros.",
            font=ctk.CTkFont(family="Segoe UI", size=11),
            text_color="#64748b",
            wraplength=820,
            justify="left"
        ).pack(anchor="w", pady=(4, 12))

        # Selector de Base de Datos y Parámetros
        db_box = ctk.CTkFrame(p2, fg_color="#f8fafc", corner_radius=10, border_width=1, border_color="#e2e8f0")
        db_box.pack(fill="x", pady=(0, 16), padx=2)

        db_sel_header = ctk.CTkFrame(db_box, fg_color="transparent")
        db_sel_header.pack(fill="x", padx=14, pady=(10, 6))

        ctk.CTkLabel(
            db_sel_header,
            text="Dónde guardar los datos:",
            font=ctk.CTkFont(family="Segoe UI", size=11, weight="bold"),
            text_color="#1e293b"
        ).pack(side="left")

        self.seg_db_mode = ctk.CTkSegmentedButton(
            db_sel_header,
            values=["Base en la Nube", "Base Local (Offline)"],
            font=ctk.CTkFont(family="Segoe UI", size=10, weight="bold"),
            selected_color="#0284c7",
            selected_hover_color="#0369a1",
            height=28,
            command=self._cambiar_modo_db
        )
        self.seg_db_mode.set("Base en la Nube")
        self.seg_db_mode.pack(side="right")

        ctk.CTkLabel(
            db_box,
            text="• Base en la Nube: Usa los datos reales compartidos por internet.\n• Base Local (Offline): Usa una base de datos propia en tu compu, ideal si no tenés conexión o querés probar de cero.",
            font=ctk.CTkFont(family="Segoe UI", size=10),
            text_color="#64748b",
            justify="left"
        ).pack(anchor="w", padx=14, pady=(0, 10))

        # Botones de control del Servidor Local
        btn_row_l = ctk.CTkFrame(p2, fg_color="transparent")
        btn_row_l.pack(fill="x", pady=(6, 0))

        self.btn_toggle_server = ctk.CTkButton(
            btn_row_l,
            text="Iniciar Servidor Local",
            font=ctk.CTkFont(family="Segoe UI", size=12, weight="bold"),
            fg_color="#059669",
            hover_color="#047857",
            text_color="#ffffff",
            corner_radius=8,
            height=38,
            command=self._toggle_server
        )
        self.btn_toggle_server.pack(side="left", fill="x", expand=True, padx=(0, 8))

        self.btn_open_local = ctk.CTkButton(
            btn_row_l,
            text="Abrir localhost:3000",
            font=ctk.CTkFont(family="Segoe UI", size=12, weight="bold"),
            fg_color="#f1f5f9",
            hover_color="#e2e8f0",
            text_color="#334155",
            border_width=1,
            border_color="#cbd5e1",
            corner_radius=8,
            height=38,
            command=lambda: webbrowser.open("http://localhost:3000")
        )
        self.btn_open_local.pack(side="left", fill="x", expand=True, padx=(8, 0))

        # -------------------------------------------------------------
        # SOLAPA 3: DOCUMENTACIÓN Y DIAGRAMAS
        # -------------------------------------------------------------
        p3 = ctk.CTkFrame(tab_doc, fg_color="transparent")
        p3.pack(fill="both", expand=True, padx=16, pady=12)

        tag_c3 = ctk.CTkLabel(
            p3,
            text="GUÍAS Y RECURSOS DEL SISTEMA",
            font=ctk.CTkFont(family="Segoe UI", size=9, weight="bold"),
            text_color="#4338ca",
            fg_color="#ede9fe",
            corner_radius=5,
            padx=8,
            pady=2
        )
        tag_c3.pack(anchor="w", pady=(0, 6))

        ctk.CTkLabel(
            p3,
            text="Manuales y Estructura de Datos",
            font=ctk.CTkFont(family="Segoe UI", size=17, weight="bold"),
            text_color="#0f172a"
        ).pack(anchor="w")

        ctk.CTkLabel(
            p3,
            text="Material para consultar cómo funciona el sistema, cómo preparar la lista de alumnos en Excel y cómo se organizan las tablas de datos.",
            font=ctk.CTkFont(family="Segoe UI", size=11),
            text_color="#64748b",
            wraplength=820,
            justify="left"
        ).pack(anchor="w", pady=(4, 12))

        # Grilla de 3 Recursos
        doc_grid = ctk.CTkFrame(p3, fg_color="transparent")
        doc_grid.pack(fill="both", expand=True, pady=(0, 10))
        doc_grid.grid_columnconfigure(0, weight=1)
        doc_grid.grid_columnconfigure(1, weight=1)

        # Recurso 1: Manual Oficial HTML
        card_man = ctk.CTkFrame(doc_grid, fg_color="#f8fafc", corner_radius=10, border_width=1, border_color="#e2e8f0")
        card_man.grid(row=0, column=0, padx=4, pady=4, sticky="nsew")
        ctk.CTkLabel(card_man, text="Manual Técnico y Operativo", font=ctk.CTkFont(family="Segoe UI", size=13, weight="bold"), text_color="#1e293b").pack(anchor="w", padx=12, pady=(10, 2))
        ctk.CTkLabel(card_man, text="Manual integral ilustrado con capturas de pantalla de los paneles, arquitectura y credenciales por defecto.", font=ctk.CTkFont(family="Segoe UI", size=10), text_color="#64748b", wraplength=380, justify="left").pack(anchor="w", padx=12, pady=(0, 10))
        btn_manual = ctk.CTkButton(
            card_man,
            text="Ver Manual Oficial (HTML)",
            font=ctk.CTkFont(family="Segoe UI", size=11, weight="bold"),
            fg_color="#4f46e5",
            hover_color="#4338ca",
            height=32,
            corner_radius=7,
            command=self._abrir_manual
        )
        btn_manual.pack(fill="x", padx=12, pady=(0, 10))

        # Recurso 2: Plantilla Excel de Egresados
        card_exc = ctk.CTkFrame(doc_grid, fg_color="#f8fafc", corner_radius=10, border_width=1, border_color="#e2e8f0")
        card_exc.grid(row=0, column=1, padx=4, pady=4, sticky="nsew")
        ctk.CTkLabel(card_exc, text="Padrón Modelo de Egresados (Excel)", font=ctk.CTkFont(family="Segoe UI", size=13, weight="bold"), text_color="#1e293b").pack(anchor="w", padx=12, pady=(10, 2))
        ctk.CTkLabel(card_exc, text="Planilla estructurada (.xlsx) según el estándar institucional para importación masiva directa de graduados.", font=ctk.CTkFont(family="Segoe UI", size=10), text_color="#64748b", wraplength=380, justify="left").pack(anchor="w", padx=12, pady=(0, 10))
        btn_excel = ctk.CTkButton(
            card_exc,
            text="Plantilla Excel Egresados",
            font=ctk.CTkFont(family="Segoe UI", size=11, weight="bold"),
            fg_color="#f1f5f9",
            hover_color="#e2e8f0",
            text_color="#334155",
            border_width=1,
            border_color="#cbd5e1",
            height=32,
            corner_radius=7,
            command=self._abrir_excel
        )
        btn_excel.pack(fill="x", padx=12, pady=(0, 10))

        # Recurso 3: Esquema Relacional DER (Ancho completo)
        card_der = ctk.CTkFrame(p3, fg_color="#0f172a", corner_radius=10, border_width=1, border_color="#0284c7")
        card_der.pack(fill="x", padx=4, pady=(4, 0))

        der_row = ctk.CTkFrame(card_der, fg_color="transparent")
        der_row.pack(fill="x", padx=14, pady=10)

        der_textos = ctk.CTkFrame(der_row, fg_color="transparent")
        der_textos.pack(side="left", fill="both", expand=True)

        ctk.CTkLabel(der_textos, text="Diagrama Interactivo de Tablas", font=ctk.CTkFont(family="Segoe UI", size=13, weight="bold"), text_color="#ffffff").pack(anchor="w")
        ctk.CTkLabel(der_textos, text="Visor interactivo en el navegador que muestra cómo se conectan los egresados, ceremonias, butacas e invitados en el sistema.", font=ctk.CTkFont(family="Segoe UI", size=10), text_color="#94a3b8", wraplength=520, justify="left").pack(anchor="w", pady=(2, 0))

        btn_esquema = ctk.CTkButton(
            der_row,
            text="Ver Diagrama ↗",
            font=ctk.CTkFont(family="Segoe UI", size=11, weight="bold"),
            fg_color="#0284c7",
            hover_color="#0369a1",
            text_color="#ffffff",
            height=34,
            corner_radius=7,
            command=self._abrir_esquema_animado
        )
        btn_esquema.pack(side="right", padx=(10, 0))

        # -------------------------------------------------------------
        # SOLAPA 4: APP MÓVIL (PORTERÍA ANDROID)
        # -------------------------------------------------------------
        p4 = ctk.CTkFrame(tab_apk, fg_color="transparent")
        p4.pack(fill="both", expand=True, padx=16, pady=12)

        tag_c4 = ctk.CTkLabel(
            p4,
            text="CONTROL DE INGRESO PARA EL EVENTO",
            font=ctk.CTkFont(family="Segoe UI", size=9, weight="bold"),
            text_color="#b45309",
            fg_color="#fef3c7",
            corner_radius=5,
            padx=8,
            pady=2
        )
        tag_c4.pack(anchor="w", pady=(0, 6))

        ctk.CTkLabel(
            p4,
            text="App Móvil de Portería (Android)",
            font=ctk.CTkFont(family="Segoe UI", size=17, weight="bold"),
            text_color="#0f172a"
        ).pack(anchor="w")

        ctk.CTkLabel(
            p4,
            text="Aplicación para celulares Android pensada para el personal de la entrada. Permite escanear las credenciales QR de los graduados y acompañantes en el momento para verificar su ingreso.",
            font=ctk.CTkFont(family="Segoe UI", size=11),
            text_color="#64748b",
            wraplength=820,
            justify="left"
        ).pack(anchor="w", pady=(4, 14))

        apk_specs_box = ctk.CTkFrame(p4, fg_color="#f8fafc", corner_radius=10, border_width=1, border_color="#e2e8f0")
        apk_specs_box.pack(fill="x", pady=(0, 16), padx=2)

        items_apk = [
            ("Uso principal:", "Escanear credenciales QR en la entrada del auditorio el día del acto."),
            ("Instalador:", "Archivo SIGIC-Porteria-1.0.8.apk listo para instalar en celulares Android."),
            ("Control de acceso:", "Verifica de inmediato si la entrada es válida y evita pases duplicados."),
        ]
        for titular, detalle in items_apk:
            row_f = ctk.CTkFrame(apk_specs_box, fg_color="transparent")
            row_f.pack(fill="x", padx=14, pady=3)
            ctk.CTkLabel(row_f, text=titular, font=ctk.CTkFont(family="Segoe UI", size=10, weight="bold"), text_color="#334155", width=180, anchor="w").pack(side="left")
            ctk.CTkLabel(row_f, text=detalle, font=ctk.CTkFont(family="Segoe UI", size=10), text_color="#64748b", anchor="w").pack(side="left", fill="x", expand=True)

        btn_row_a = ctk.CTkFrame(p4, fg_color="transparent")
        btn_row_a.pack(fill="x", pady=(6, 0))

        btn_apk = ctk.CTkButton(
            btn_row_a,
            text="Abrir Carpeta con el APK Instalador",
            font=ctk.CTkFont(family="Segoe UI", size=12, weight="bold"),
            fg_color="#d97706",
            hover_color="#b45309",
            text_color="#ffffff",
            corner_radius=8,
            height=38,
            command=self._abrir_apk_dir
        )
        btn_apk.pack(side="left", fill="x", expand=True, padx=(0, 8))

        btn_guia_apk = ctk.CTkButton(
            btn_row_a,
            text="Guía de Instalación (TXT)",
            font=ctk.CTkFont(family="Segoe UI", size=12, weight="bold"),
            fg_color="#f1f5f9",
            hover_color="#e2e8f0",
            text_color="#334155",
            border_width=1,
            border_color="#cbd5e1",
            corner_radius=8,
            height=38,
            command=self._abrir_guia_apk
        )
        btn_guia_apk.pack(side="left", fill="x", expand=True, padx=(8, 0))

        # -------------------------------------------------------------
        # SOLAPA 5: CONSOLA DE DIAGNÓSTICO Y EVENTOS
        # -------------------------------------------------------------
        p5 = ctk.CTkFrame(tab_console, fg_color="transparent")
        p5.pack(fill="both", expand=True, padx=16, pady=12)

        term_top = ctk.CTkFrame(p5, fg_color="transparent")
        term_top.pack(fill="x", pady=(0, 8))

        ctk.CTkLabel(
            term_top,
            text="Registro de Actividad:",
            font=ctk.CTkFont(family="Segoe UI", size=13, weight="bold"),
            text_color="#1e293b"
        ).pack(side="left")

        btn_clear = ctk.CTkButton(
            term_top,
            text="Limpiar Registro",
            font=ctk.CTkFont(family="Segoe UI", size=10, weight="bold"),
            fg_color="#f1f5f9",
            hover_color="#e2e8f0",
            text_color="#64748b",
            border_width=1,
            border_color="#cbd5e1",
            corner_radius=6,
            height=28,
            width=110,
            command=self._limpiar_log
        )
        btn_clear.pack(side="right")

        self.txt_log = ctk.CTkTextbox(
            p5,
            height=240,
            font=ctk.CTkFont(family="Consolas", size=10),
            fg_color="#0f172a",
            text_color="#e2e8f0",
            corner_radius=8,
            border_width=0
        )
        self.txt_log.pack(fill="both", expand=True, pady=(0, 4))

        self._log("SiGIC Control GUI inicializado en modo nativo con arquitectura de solapas dedicadas.")
        self._log(f"Directorio de ejecución: {self.base_dir}")

        # -------------------------------------------------------------
        # SOLAPA 6: ACERCA DE & EQUIPO DE DESARROLLO
        # -------------------------------------------------------------
        p6 = ctk.CTkScrollableFrame(tab_about, fg_color="transparent")
        p6.pack(fill="both", expand=True, padx=16, pady=12)

        tag_c6 = ctk.CTkLabel(
            p6,
            text="PROYECTO FINAL DE CARRERA",
            font=ctk.CTkFont(family="Segoe UI", size=9, weight="bold"),
            text_color="#0284c7",
            fg_color="#e0f2fe",
            corner_radius=5,
            padx=8,
            pady=2
        )
        tag_c6.pack(anchor="w", pady=(0, 6))

        ctk.CTkLabel(
            p6,
            text="SiGIC — Sistema de Gestión Institucional de Colaciones",
            font=ctk.CTkFont(family="Segoe UI", size=16, weight="bold"),
            text_color="#0f172a"
        ).pack(anchor="w")

        ctk.CTkLabel(
            p6,
            text="Plataforma creada para hacer más simple y organizada la realización de los actos de colación: desde invitar a los alumnos, elegir sus asientos en el auditorio y generar sus credenciales digitales, hasta el control en la puerta.",
            font=ctk.CTkFont(family="Segoe UI", size=11),
            text_color="#64748b",
            wraplength=820,
            justify="left"
        ).pack(anchor="w", pady=(4, 12))

        # Cuadro institucional
        inst_box = ctk.CTkFrame(p6, fg_color="#f8fafc", corner_radius=10, border_width=1, border_color="#e2e8f0")
        inst_box.pack(fill="x", pady=(0, 14), padx=2)

        items_inst = [
            ("Institución:", "Instituto Tecnológico Beltrán (ITB)"),
            ("Carrera:", "Tecnicatura Superior en Analista de Sistemas"),
            ("Materia:", "Práctica Profesionalizante III (2026)"),
            ("Sede:", "Av. Belgrano 1191, Avellaneda"),
        ]
        for titular, detalle in items_inst:
            row_f = ctk.CTkFrame(inst_box, fg_color="transparent")
            row_f.pack(fill="x", padx=14, pady=3)
            ctk.CTkLabel(row_f, text=titular, font=ctk.CTkFont(family="Segoe UI", size=10, weight="bold"), text_color="#334155", width=180, anchor="w").pack(side="left")
            ctk.CTkLabel(row_f, text=detalle, font=ctk.CTkFont(family="Segoe UI", size=10), text_color="#64748b", anchor="w").pack(side="left", fill="x", expand=True)

        # Encabezado del Equipo
        ctk.CTkLabel(
            p6,
            text="Integrantes del Equipo de Desarrollo",
            font=ctk.CTkFont(family="Segoe UI", size=13, weight="bold"),
            text_color="#0f172a"
        ).pack(anchor="w", pady=(0, 8))

        equipo_box = ctk.CTkFrame(p6, fg_color="#ffffff", corner_radius=10, border_width=1, border_color="#e2e8f0")
        equipo_box.pack(fill="x", pady=(0, 14), padx=2)

        integrantes = [
            ("Cancelo Julian", "Analista de Sistemas", "#334155"),
            ("Alfonso Alan Alexis", "Analista de Sistemas", "#334155"),
            ("Contreras Villalba Sol Heilin", "Analista de Sistemas", "#334155"),
            ("Frassia Matias", "Analista de Sistemas", "#334155"),
            ("Santillan Luis Gabriel", "Analista de Sistemas", "#334155"),
        ]

        for idx, (nombre, rol, color_badge) in enumerate(integrantes):
            row_i = ctk.CTkFrame(equipo_box, fg_color="#f8fafc" if idx % 2 == 0 else "#ffffff")
            row_i.pack(fill="x", padx=4, pady=2)
            
            ctk.CTkLabel(
                row_i,
                text=nombre,
                font=ctk.CTkFont(family="Segoe UI", size=11, weight="bold"),
                text_color="#0f172a",
                width=220,
                anchor="w",
                padx=12
            ).pack(side="left", pady=6)

            badge = ctk.CTkLabel(
                row_i,
                text=rol,
                font=ctk.CTkFont(family="Segoe UI", size=10, weight="normal"),
                text_color="#475569",
                fg_color="#e2e8f0",
                corner_radius=6,
                padx=10,
                pady=2
            )
            badge.pack(side="left", pady=6)

        # Enlaces de interés
        btn_row_about = ctk.CTkFrame(p6, fg_color="transparent")
        btn_row_about.pack(fill="x", pady=(4, 8))

        ctk.CTkButton(
            btn_row_about,
            text="Repositorio GitHub Oficial ↗",
            font=ctk.CTkFont(family="Segoe UI", size=11, weight="bold"),
            fg_color="#0f172a",
            hover_color="#1e293b",
            text_color="#ffffff",
            corner_radius=8,
            height=34,
            command=lambda: webbrowser.open("https://github.com/julianmcancelo/Sigic")
        ).pack(side="left", padx=(0, 10))

        ctk.CTkButton(
            btn_row_about,
            text="Portal Institucional SiGIC ↗",
            font=ctk.CTkFont(family="Segoe UI", size=11, weight="bold"),
            fg_color="#0284c7",
            hover_color="#0369a1",
            text_color="#ffffff",
            corner_radius=8,
            height=34,
            command=lambda: webbrowser.open("https://www.sigic.com.ar")
        ).pack(side="left")

        # -------------------------------------------------------------
        # FOOTER INSTITUCIONAL
        # -------------------------------------------------------------
        footer = ctk.CTkLabel(
            self.main_container,
            text="SiGIC © 2026 · Instituto Tecnológico Beltrán · Tecnicatura Superior en Analista de Sistemas",
            font=ctk.CTkFont(family="Segoe UI", size=10),
            text_color="#94a3b8"
        )
        footer.pack(pady=(2, 0))

    def _limpiar_log(self):
        self.txt_log.configure(state="normal")
        self.txt_log.delete("1.0", "end")
        self.txt_log.configure(state="disabled")
        self._log("Registro limpiado.")

    def _log(self, mensaje):
        # Limpiar códigos ANSI y caracteres mal codificados
        limpio = ANSI_REGEX.sub('', str(mensaje)).strip()
        limpio = limpio.replace("â€”", "—").replace("âœ“", "✓").replace("âš", "⚠").replace("â†’", "→")
        
        timestamp = time.strftime("%H:%M:%S")
        self.txt_log.configure(state="normal")
        self.txt_log.insert("end", f"[{timestamp}] {limpio}\n")
        self.txt_log.see("end")
        self.txt_log.configure(state="disabled")

    def _is_port_open(self, puerto):
        """Verifica de forma no bloqueante si un puerto TCP está abierto."""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.3)
                return s.connect_ex(('127.0.0.1', puerto)) == 0
        except Exception:
            return False

    def _liberar_puerto(self, puerto=3000):
        """Libera cualquier proceso huérfano que esté ocupando el puerto indicado."""
        if not self._is_port_open(puerto):
            return
        try:
            self._log(f"Puerto {puerto} en uso. Liberando proceso previo...")
            cmd = f'powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort {puerto} -ErrorAction SilentlyContinue | ForEach-Object {{ Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }}"'
            subprocess.run(cmd, shell=True, capture_output=True, timeout=2.5)
            time.sleep(0.4)
        except Exception as e:
            self._log(f"Aviso al liberar puerto {puerto}: {e}")

    def _cambiar_modo_db(self, valor):
        if "Local" in valor:
            self.lbl_db.configure(text="● Base Local (Offline)", text_color="#7c3aed")
            self._log("Modo de Base de Datos: Base local en esta máquina (Offline).")
        else:
            self.lbl_db.configure(text="● Base de Datos Conectada", text_color="#0369a1")
            self._log("Modo de Base de Datos: Base compartida en la nube.")

    def _obtener_pgsql_dir(self):
        candidatos = [
            os.path.join(self.base_dir, "herramientas", "pgsql"),
            os.path.join(self.base_dir, "pgsql"),
            os.path.join(os.path.dirname(self.base_dir), "herramientas", "pgsql")
        ]
        for c in candidatos:
            if os.path.exists(os.path.join(c, "bin", "pg_ctl.exe")):
                return c
        return None

    def _iniciar_postgres_portable(self):
        if self._is_port_open(5433):
            self._log("PostgreSQL 16 Portable ya se encuentra activo en puerto 5433.")
            self.usar_local_pg_activo = True
            return True

        pgsql_dir = self._obtener_pgsql_dir()
        if not pgsql_dir:
            self._log("Aviso: No se encontró la carpeta de PostgreSQL Portable (herramientas/pgsql).")
            return False
        pg_ctl = os.path.join(pgsql_dir, "bin", "pg_ctl.exe")
        data_dir = os.path.join(pgsql_dir, "data")
        log_file = os.path.join(pgsql_dir, "logfile.log")
        self._log("Iniciando motor PostgreSQL 16 Portable en puerto 5433...")
        try:
            subprocess.run(f'"{pg_ctl}" -D "{data_dir}" -l "{log_file}" -o "-p 5433" start', shell=True, capture_output=True, timeout=8.0)
            for _ in range(15):
                if self._is_port_open(5433):
                    self._log("PostgreSQL 16 Portable activo y respondiendo en puerto 5433.")
                    self.usar_local_pg_activo = True
                    return True
                time.sleep(0.4)
            self._log("PostgreSQL Portable iniciado (esperando peticiones en puerto 5433).")
            self.usar_local_pg_activo = True
            return True
        except Exception as e:
            self._log(f"Error al iniciar PostgreSQL portable: {e}")
            return False

    def _detener_postgres_portable(self):
        pgsql_dir = self._obtener_pgsql_dir()
        if pgsql_dir:
            pg_ctl = os.path.join(pgsql_dir, "bin", "pg_ctl.exe")
            data_dir = os.path.join(pgsql_dir, "data")
            if os.path.exists(pg_ctl) and os.path.exists(data_dir):
                try:
                    subprocess.run(f'"{pg_ctl}" -D "{data_dir}" stop', shell=True, capture_output=True, timeout=5.0)
                    self._log("Motor PostgreSQL Portable detenido.")
                except Exception:
                    pass
        self.usar_local_pg_activo = False

    def _toggle_server(self):
        if not self.server_running:
            self.btn_toggle_server.configure(text="Iniciando...", state="disabled")
            self.lbl_local.configure(text="● Local: Preparando...", text_color="#b45309")
            self.f_local.configure(fg_color="#fef3c7", border_color="#fde68a")
            self._log("Iniciando secuencia de arranque local...")
            t = threading.Thread(target=self._start_server_thread, daemon=True)
            t.start()
        else:
            self._log("Deteniendo servidor local...")
            self.btn_toggle_server.configure(text="Deteniendo...", state="disabled")
            t = threading.Thread(target=self._stop_server_thread, daemon=True)
            t.start()

    def _stop_server_thread(self):
        try:
            self._detener_servidor_proceso()
            self._liberar_puerto(3000)
            if self.usar_local_pg_activo:
                self._detener_postgres_portable()
            self.server_running = False
            self.after(0, self._reset_ui_server_stopped)
            self.after(0, self._log, "Servidor local detenido correctamente.")
        except Exception as e:
            self.server_running = False
            self.after(0, self._reset_ui_server_stopped)
            self.after(0, self._log, f"Aviso al detener servidor: {e}")

    def _reset_ui_server_stopped(self):
        self.btn_toggle_server.configure(text="Iniciar Servidor Local", fg_color="#059669", state="normal")
        self.f_local.configure(fg_color="#f8fafc", border_color="#e2e8f0")
        self.lbl_local.configure(text="○ Local: Detenido", text_color="#64748b")
        self.btn_open_local.configure(text="Abrir localhost:3000", fg_color="#f1f5f9", text_color="#334155")

    def _detener_servidor_proceso(self):
        if self.server_proc:
            try:
                subprocess.run(f"taskkill /PID {self.server_proc.pid} /T /F", shell=True, capture_output=True)
            except Exception as e:
                self._log(f"Aviso al cerrar proceso: {e}")
            self.server_proc = None

    def _al_cerrar_ventana(self):
        if self.server_running:
            self._detener_servidor_proceso()
        if self.usar_local_pg_activo:
            self._detener_postgres_portable()
        self._liberar_puerto(3000)
        self.destroy()

    def _esperar_servidor_y_abrir(self):
        """Monitorea de forma no invasiva la disponibilidad del puerto 3000 y abre el navegador."""
        time.sleep(0.8)
        for _ in range(60):
            if not self.server_running:
                return
            if self._is_port_open(3000):
                self.after(0, self._log, "Plataforma lista en http://localhost:3000. Abriendo navegador...")
                self.after(0, lambda: self.lbl_local.configure(text="● Local: Activo (3000)", text_color="#15803d"))
                self.after(0, lambda: self.f_local.configure(fg_color="#f0fdf4", border_color="#bbf7d0"))
                self.after(0, lambda: self.btn_open_local.configure(text="Abrir Navegador (3000)", fg_color="#0284c7", text_color="#ffffff"))
                webbrowser.open("http://localhost:3000")
                return
            time.sleep(0.5)
        if self.server_running:
            self.after(0, self._log, "Servidor en ejecución. Si el navegador no abre automáticamente, hacé clic en 'Abrir localhost:3000'.")

    def _start_server_thread(self):
        try:
            self._liberar_puerto(3000)

            env = os.environ.copy()
            usar_local_pg = "Local" in self.seg_db_mode.get() if hasattr(self, 'seg_db_mode') else False
            if usar_local_pg:
                self._iniciar_postgres_portable()
                env["DATABASE_URL"] = "postgresql://postgres@127.0.0.1:5433/sigic"
                env["DB_SSL_INSECURE"] = "1"
                self.after(0, self._log, "Conectando servidor local a la base de datos local (puerto 5433).")

            build_id_path = os.path.join(self.web_dir, ".next", "BUILD_ID")
            if os.path.exists(build_id_path):
                cmd = "npm start"
                self.after(0, self._log, "Iniciando plataforma SiGIC en modo producción optimizado (npm start)...")
            else:
                cmd = "npm run dev"
                self.after(0, self._log, "Lanzando servidor Next.js Turbopack...")

            self.server_proc = subprocess.Popen(
                cmd,
                shell=True,
                cwd=self.web_dir,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding="utf-8",
                errors="replace",
                bufsize=1,
                env=env
            )
            self.server_running = True
            self.after(0, lambda: self.btn_toggle_server.configure(text="⏹ Detener Servidor", fg_color="#dc2626", state="normal"))
            self.after(0, lambda: self.f_local.configure(fg_color="#fef3c7", border_color="#fde68a"))
            self.after(0, lambda: self.lbl_local.configure(text="⏳ Local: Iniciando (3000)...", text_color="#b45309"))

            # Monitorear puerto 3000 para abrir navegador
            threading.Thread(target=self._esperar_servidor_y_abrir, daemon=True).start()

            for line in self.server_proc.stdout:
                if line and line.strip():
                    self.after(0, self._log, line.strip())

            self.server_running = False
            self.after(0, self._reset_ui_server_stopped)
        except Exception as ex:
            self.server_running = False
            self.after(0, self._log, f"Error al ejecutar servidor: {ex}")
            self.after(0, self._reset_ui_server_stopped)

    def _iniciar_monitoreo_estado(self):
        def loop_monitoreo():
            while True:
                try:
                    r = requests.get("http://localhost:3000", timeout=1.5)
                    if r.status_code == 200:
                        self.after(0, self._actualizar_estado_local_online)
                    else:
                        if not self.server_running:
                            self.after(0, self._actualizar_estado_local_offline)
                except Exception:
                    if not self.server_running:
                        self.after(0, self._actualizar_estado_local_offline)
                time.sleep(3)

        t = threading.Thread(target=loop_monitoreo, daemon=True)
        t.start()

    def _actualizar_estado_local_online(self):
        self.f_local.configure(fg_color="#f0fdf4", border_color="#bbf7d0")
        self.lbl_local.configure(text="● Local: Activo (3000)", text_color="#15803d")

    def _actualizar_estado_local_offline(self):
        self.f_local.configure(fg_color="#f8fafc", border_color="#e2e8f0")
        self.lbl_local.configure(text="○ Local: Detenido", text_color="#64748b")

    def _abrir_manual(self):
        rutas = [
            os.path.join(self.doc_dir, "Manual_Usuario_y_Operativo_SiGIC.html"),
            os.path.join(self.base_dir, "00_INSTRUCCIONES_Y_LEEME.html"),
        ]
        for r in rutas:
            if os.path.exists(r):
                webbrowser.open(f"file:///{os.path.abspath(r)}")
                self._log(f"Abierto manual institucional: {os.path.basename(r)}")
                return
        webbrowser.open("https://app.sigic.com.ar/manual")

    def _abrir_excel(self):
        r = os.path.join(self.doc_dir, "Plantilla_Padron_Egresados_Modelo.xlsx")
        if os.path.exists(r):
            os.startfile(r)
            self._log("Abierta plantilla Excel modelo.")
        else:
            self._log("Plantilla Excel no encontrada.")

    def _abrir_esquema_animado(self):
        rutas = [
            os.path.join(self.base_dir, "docs", "ESQUEMA_INTERACTIVO_BD.html"),
            os.path.join(self.base_dir, "01_DOCUMENTACION_OFICIAL", "ESQUEMA_INTERACTIVO_BD.html"),
            os.path.join(self.web_dir, "public", "esquema", "index.html"),
        ]
        for r in rutas:
            if os.path.exists(r):
                webbrowser.open(f"file:///{os.path.abspath(r)}")
                self._log("Abierto Visor del Esquema Relacional Animado (PostgreSQL 16).")
                return
        webbrowser.open("https://app.sigic.com.ar/esquema")

    def _abrir_apk_dir(self):
        if os.path.exists(self.apk_dir):
            os.startfile(self.apk_dir)
            self._log("Abierta carpeta de la aplicación Android.")
        else:
            self._log("Carpeta de APK no encontrada.")

    def _abrir_guia_apk(self):
        r = os.path.join(self.apk_dir, "GUIA_INSTALACION_APP_MOVIL.txt")
        if os.path.exists(r):
            os.startfile(r)
            self._log("Abierta guía de instalación de la app móvil.")
        else:
            self._log("Guía de instalación no encontrada.")

if __name__ == "__main__":
    app = SigicApp()
    app.mainloop()
