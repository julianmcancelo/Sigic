"""
SiGIC Control Center — Centro de Control Operativo
Aplicación nativa de Windows (solo librería estándar de Python).

Detalles nativos:
  - Tipografía Segoe UI Variable / Segoe UI y consola Cascadia Mono.
  - Color de acento real del sistema (leído del Registro de Windows).
  - Tema claro/oscuro siguiendo la preferencia del sistema.
  - Barra de título oscura nativa vía DWM (DwmSetWindowAttribute).
  - Conciencia de DPI para texto nítido en pantallas de alta densidad.
"""

import ctypes
import json
import os
import subprocess
import sys
import threading
import time
import tkinter as tk
import webbrowser
from dataclasses import dataclass, asdict
from tkinter import font as tkfont
from tkinter import ttk
from urllib import error, request

VERSION = "5.0.0"
NOMBRE = "SiGIC"
DESCRIPCION = "Centro de Control Operativo"

# ─────────────────────────────────────────────────────────────────
# Integración nativa con Windows
# ─────────────────────────────────────────────────────────────────

def activar_conciencia_dpi():
    """Texto nítido en monitores de alta densidad (Per-Monitor DPI)."""
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(1)
    except Exception:
        try:
            ctypes.windll.user32.SetProcessDPIAware()
        except Exception:
            pass


def sistema_usa_tema_oscuro() -> bool:
    """Lee la preferencia de tema de aplicaciones de Windows."""
    try:
        import winreg
        with winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize",
        ) as clave:
            valor, _ = winreg.QueryValueEx(clave, "AppsUseLightTheme")
            return valor == 0
    except Exception:
        return False


def color_acento_del_sistema() -> str:
    """Lee el color de acento elegido por el usuario en Windows."""
    try:
        import winreg
        with winreg.OpenKey(
            winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\DWM"
        ) as clave:
            abgr, _ = winreg.QueryValueEx(clave, "AccentColor")
            r = abgr & 0xFF
            g = (abgr >> 8) & 0xFF
            b = (abgr >> 16) & 0xFF
            return f"#{r:02x}{g:02x}{b:02x}"
    except Exception:
        return "#0067c0"  # Azul estándar de Windows 11


def aplicar_titulo_oscuro(ventana: tk.Tk, oscuro: bool):
    """Pinta la barra de título nativa en oscuro/claro (Windows 10 1809+)."""
    try:
        ventana.update_idletasks()
        hwnd = ctypes.windll.user32.GetParent(ventana.winfo_id())
        valor = ctypes.c_int(1 if oscuro else 0)
        for atributo in (20, 19):  # DWMWA_USE_IMMERSIVE_DARK_MODE (20; 19 en builds viejos)
            resultado = ctypes.windll.dwmapi.DwmSetWindowAttribute(
                hwnd, atributo, ctypes.byref(valor), ctypes.sizeof(valor)
            )
            if resultado == 0:
                break
    except Exception:
        pass


def mezclar(color_a: str, color_b: str, factor: float) -> str:
    """Mezcla dos colores hex (factor 0 = color_a, 1 = color_b)."""
    a = [int(color_a[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(color_b[i:i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(x + (y - x) * factor):02x}" for x, y in zip(a, b))


# ─────────────────────────────────────────────────────────────────
# Paletas estilo Windows 11 (Fluent)
# ─────────────────────────────────────────────────────────────────

def construir_paleta(oscuro: bool, acento: str) -> dict:
    if oscuro:
        return {
            "ventana": "#202020",        # Fondo Mica oscuro
            "panel": "#2b2b2b",          # Panel de navegación
            "tarjeta": "#2b2b2b",        # Tarjetas de contenido
            "borde": "#1d1d1d",
            "texto": "#ffffff",
            "texto_suave": "#9d9d9d",
            "entrada_bg": "#383838",
            "entrada_fg": "#ffffff",
            "boton_sec_bg": "#383838",
            "boton_sec_hover": "#454545",
            "boton_sec_fg": "#ffffff",
            "acento": acento,
            "acento_hover": mezclar(acento, "#ffffff", 0.12),
            "acento_presionado": mezclar(acento, "#000000", 0.18),
            "ok": "#6ccb5f",
            "error": "#ff99a4",
            "neutro": "#9d9d9d",
            "consola_bg": "#0c0c0c",     # Negro de la Terminal de Windows
            "consola_fg": "#cccccc",
        }
    return {
        "ventana": "#f3f3f3",            # Fondo Mica claro (app Configuración)
        "panel": "#f3f3f3",
        "tarjeta": "#ffffff",
        "borde": "#e5e5e5",
        "texto": "#1b1b1b",
        "texto_suave": "#5d5d5d",
        "entrada_bg": "#ffffff",
        "entrada_fg": "#1b1b1b",
        "boton_sec_bg": "#fbfbfb",
        "boton_sec_hover": "#f0f0f0",
        "boton_sec_fg": "#1b1b1b",
        "acento": acento,
        "acento_hover": mezclar(acento, "#ffffff", 0.15),
        "acento_presionado": mezclar(acento, "#000000", 0.15),
        "ok": "#0f7b0f",
        "error": "#c42b1c",
        "neutro": "#5d5d5d",
        "consola_bg": "#0c0c0c",
        "consola_fg": "#cccccc",
    }


def fuente_disponible(candidatas, reserva):
    instaladas = set(tkfont.families())
    for nombre in candidatas:
        if nombre in instaladas:
            return nombre
    return reserva


# ─────────────────────────────────────────────────────────────────
# Configuración persistente
# ─────────────────────────────────────────────────────────────────

@dataclass
class Configuracion:
    entorno: str = "local"
    backend_url: str = "http://localhost:3001"
    frontend_url: str = "http://localhost:5173"
    database_url: str = ""
    backend_port: str = "3001"
    frontend_api_path: str = "/api"
    tema: str = "sistema"  # sistema | claro | oscuro


PRESETS = {
    "local": {
        "backend_url": "http://localhost:3001",
        "frontend_url": "http://localhost:5173",
        "backend_port": "3001",
    },
    "vps": {
        "backend_url": "https://api.tu-dominio.com",
        "frontend_url": "https://app.tu-dominio.com",
        "backend_port": "3001",
    },
    "aws": {
        "backend_url": "https://api.tu-app.aws.com",
        "frontend_url": "https://tu-app.aws.com",
        "backend_port": "3001",
    },
    "firebase": {
        "backend_url": "https://us-central1-tu-proyecto.cloudfunctions.net",
        "frontend_url": "https://tu-proyecto.web.app",
        "backend_port": "3001",
    },
}


# ─────────────────────────────────────────────────────────────────
# Widgets estilo WinUI
# ─────────────────────────────────────────────────────────────────

class BotonFluent(tk.Button):
    """Botón plano estilo WinUI con efecto hover."""

    def __init__(self, master, primario=False, **kwargs):
        super().__init__(
            master,
            relief="flat",
            bd=0,
            cursor="hand2",
            padx=14,
            pady=7,
            **kwargs,
        )
        self.primario = primario
        self._colores = None
        self.bind("<Enter>", self._al_entrar)
        self.bind("<Leave>", self._al_salir)

    def pintar(self, paleta, fuente):
        self._colores = paleta
        if self.primario:
            self.configure(
                bg=paleta["acento"],
                fg="#ffffff",
                activebackground=paleta["acento_presionado"],
                activeforeground="#ffffff",
                font=fuente,
                disabledforeground=paleta["texto_suave"],
            )
        else:
            self.configure(
                bg=paleta["boton_sec_bg"],
                fg=paleta["boton_sec_fg"],
                activebackground=paleta["boton_sec_hover"],
                activeforeground=paleta["boton_sec_fg"],
                font=fuente,
                disabledforeground=paleta["texto_suave"],
            )

    def _al_entrar(self, _evento):
        if self._colores:
            self.configure(bg=self._colores["acento_hover" if self.primario else "boton_sec_hover"])

    def _al_salir(self, _evento):
        if self._colores:
            self.configure(bg=self._colores["acento" if self.primario else "boton_sec_bg"])


# ─────────────────────────────────────────────────────────────────
# Aplicación principal
# ─────────────────────────────────────────────────────────────────

class SiGICControlCenter(tk.Tk):
    def __init__(self):
        super().__init__()

        self.title(f"{NOMBRE} Control Center")
        self.geometry("1120x720")
        self.minsize(940, 620)

        # Lógica base (idéntica a versiones anteriores)
        self.procesos = {"api": None, "web": None}
        self.raiz = self.detectar_raiz()
        self.backend_dir = os.path.join(self.raiz, "codigo", "servidor")
        self.frontend_dir = os.path.join(self.raiz, "codigo", "interfaz", "web")
        self.config_path = os.path.join(self.raiz, "scripts", "sigic_control_config.json")

        self.config = self.cargar_configuracion()
        self.activo = False
        self.monitor_activo = True
        self.ultimo_estado = {"backend": None, "frontend": None, "db": None}

        # Tipografías del sistema
        familia_ui = fuente_disponible(["Segoe UI Variable Text", "Segoe UI Variable", "Segoe UI"], "Segoe UI")
        familia_mono = fuente_disponible(["Cascadia Mono", "Cascadia Code", "Consolas"], "Consolas")
        self.f_titulo = (familia_ui, 18, "bold")
        self.f_subtitulo = (familia_ui, 10)
        self.f_seccion = (familia_ui, 11, "bold")
        self.f_normal = (familia_ui, 10)
        self.f_boton = (familia_ui, 10)
        self.f_chico = (familia_ui, 9)
        self.f_estado = (familia_ui, 12, "bold")
        self.f_mono = (familia_mono, 10)

        # Tema y acento del sistema
        self.acento = color_acento_del_sistema()
        self.tema_oscuro = self.resolver_tema_oscuro()
        self.paleta = construir_paleta(self.tema_oscuro, self.acento)

        self.icono_cargado = None
        self.cargar_icono()

        self.construir_ui()
        self.aplicar_tema()
        aplicar_titulo_oscuro(self, self.tema_oscuro)

        self.cargar_database_url_desde_env_si_falta()
        self.aplicar_config_a_ui()

        self.log(f"{NOMBRE} Control Center listo — versión {VERSION}")
        self.log(f"Raíz del proyecto: {self.raiz}")

        threading.Thread(target=self.bucle_monitoreo, daemon=True).start()

    # ── Apariencia ────────────────────────────────────────────────

    def resolver_tema_oscuro(self) -> bool:
        if self.config.tema == "claro":
            return False
        if self.config.tema == "oscuro":
            return True
        return sistema_usa_tema_oscuro()

    def cargar_icono(self):
        for relativo in (("recursos", "logos", "LOGO.png"), ("recursos", "logos", "logo-oficial.png")):
            ruta = os.path.join(self.raiz, *relativo)
            if os.path.exists(ruta):
                try:
                    self.icono_cargado = tk.PhotoImage(file=ruta)
                    self.iconphoto(True, self.icono_cargado)
                    return
                except Exception:
                    continue

    def construir_ui(self):
        self.grid_rowconfigure(0, weight=1)
        self.grid_columnconfigure(1, weight=1)

        # ── Panel de navegación (izquierda, estilo Configuración) ──
        self.panel = tk.Frame(self, width=270)
        self.panel.grid(row=0, column=0, sticky="nsw")
        self.panel.grid_propagate(False)

        self.lbl_logo = tk.Label(self.panel, text=NOMBRE, font=self.f_titulo, anchor="w")
        self.lbl_logo.pack(fill="x", padx=22, pady=(24, 0))
        self.lbl_version = tk.Label(
            self.panel, text=f"{DESCRIPCION} · v{VERSION}", font=self.f_chico, anchor="w"
        )
        self.lbl_version.pack(fill="x", padx=22, pady=(2, 22))

        self.btn_infra = BotonFluent(self.panel, primario=True, text="Iniciar infraestructura", command=self.toggle_infra)
        self.btn_infra.pack(fill="x", padx=18, pady=(0, 8), ipady=4)

        self.btn_abrir = BotonFluent(self.panel, text="Abrir frontend", command=self.abrir_frontend)
        self.btn_abrir.pack(fill="x", padx=18, pady=(0, 8))

        self.btn_guardar = BotonFluent(self.panel, text="Guardar configuración", command=self.guardar_configuracion)
        self.btn_guardar.pack(fill="x", padx=18, pady=(0, 8))

        self.btn_setup = BotonFluent(self.panel, text="Forzar setup inicial", command=self.forzar_asistente_inicial)
        self.btn_setup.pack(fill="x", padx=18, pady=(0, 8))

        self.lbl_entorno = tk.Label(self.panel, text="ENTORNO", font=self.f_chico, anchor="w")
        self.lbl_entorno.pack(fill="x", padx=22, pady=(18, 4))
        self.combo_entorno = ttk.Combobox(self.panel, values=list(PRESETS.keys()), state="readonly", font=self.f_normal)
        self.combo_entorno.pack(fill="x", padx=18)
        self.combo_entorno.bind("<<ComboboxSelected>>", lambda e: self.cambiar_entorno(self.combo_entorno.get()))

        self.lbl_tema = tk.Label(self.panel, text="TEMA", font=self.f_chico, anchor="w")
        self.lbl_tema.pack(fill="x", padx=22, pady=(14, 4))
        self.combo_tema = ttk.Combobox(self.panel, values=["sistema", "claro", "oscuro"], state="readonly", font=self.f_normal)
        self.combo_tema.set(self.config.tema)
        self.combo_tema.pack(fill="x", padx=18)
        self.combo_tema.bind("<<ComboboxSelected>>", lambda e: self.cambiar_tema(self.combo_tema.get()))

        self.lbl_pie = tk.Label(self.panel, text="Instituto Tecnológico Beltrán", font=self.f_chico, anchor="w")
        self.lbl_pie.pack(side="bottom", fill="x", padx=22, pady=16)

        # ── Contenido (derecha) ──
        self.contenido = tk.Frame(self)
        self.contenido.grid(row=0, column=1, sticky="nsew", padx=(4, 22), pady=18)
        self.contenido.grid_columnconfigure(0, weight=1)
        self.contenido.grid_rowconfigure(3, weight=1)

        self.lbl_encabezado = tk.Label(self.contenido, text="Centro de control", font=self.f_titulo, anchor="w")
        self.lbl_encabezado.grid(row=0, column=0, sticky="ew", pady=(0, 12))

        # Tarjetas de estado
        self.fila_estado = tk.Frame(self.contenido)
        self.fila_estado.grid(row=1, column=0, sticky="ew", pady=(0, 14))
        for i in range(4):
            self.fila_estado.grid_columnconfigure(i, weight=1, uniform="estado")

        self.tarjetas_estado = []
        self.lbl_estado_general = self.crear_tarjeta_estado(0, "Estado global", "Standby")
        self.lbl_backend = self.crear_tarjeta_estado(1, "Backend", "—")
        self.lbl_frontend = self.crear_tarjeta_estado(2, "Frontend", "—")
        self.lbl_db = self.crear_tarjeta_estado(3, "PostgreSQL", "—")

        # Tarjeta de direcciones
        self.tarjeta_config = tk.Frame(self.contenido, highlightthickness=1)
        self.tarjeta_config.grid(row=2, column=0, sticky="ew", pady=(0, 14))
        self.tarjeta_config.grid_columnconfigure(1, weight=1)

        self.lbl_config_titulo = tk.Label(self.tarjeta_config, text="Direcciones del entorno", font=self.f_seccion, anchor="w")
        self.lbl_config_titulo.grid(row=0, column=0, columnspan=2, sticky="ew", padx=16, pady=(12, 8))

        self.etiquetas_campo = []
        self.entradas = []

        def fila_campo(indice, texto, oculto=False):
            etiqueta = tk.Label(self.tarjeta_config, text=texto, font=self.f_normal, anchor="w")
            etiqueta.grid(row=indice, column=0, sticky="w", padx=(16, 10), pady=4)
            entrada = tk.Entry(self.tarjeta_config, font=self.f_normal, relief="flat", show="•" if oculto else "")
            entrada.grid(row=indice, column=1, sticky="ew", padx=(0, 16), pady=4, ipady=5)
            self.etiquetas_campo.append(etiqueta)
            self.entradas.append(entrada)
            return entrada

        self.entry_backend_url = fila_campo(1, "URL del backend")
        self.entry_frontend_url = fila_campo(2, "URL del frontend")
        self.entry_database_url = fila_campo(3, "URL de la base de datos", oculto=True)
        self.tarjeta_config.grid_rowconfigure(4, minsize=10)

        # Consola
        self.tarjeta_consola = tk.Frame(self.contenido, highlightthickness=1)
        self.tarjeta_consola.grid(row=3, column=0, sticky="nsew")
        self.tarjeta_consola.grid_columnconfigure(0, weight=1)
        self.tarjeta_consola.grid_rowconfigure(1, weight=1)

        encabezado_consola = tk.Frame(self.tarjeta_consola)
        encabezado_consola.grid(row=0, column=0, sticky="ew")
        self.encabezado_consola = encabezado_consola

        self.lbl_consola = tk.Label(encabezado_consola, text="Registro de actividad", font=self.f_seccion, anchor="w")
        self.lbl_consola.pack(side="left", padx=16, pady=10)

        self.btn_probar = BotonFluent(encabezado_consola, text="Probar conexiones", command=self.probar_conexiones_manual)
        self.btn_probar.pack(side="right", padx=12, pady=6)

        marco_consola = tk.Frame(self.tarjeta_consola)
        marco_consola.grid(row=1, column=0, sticky="nsew", padx=1, pady=(0, 1))
        marco_consola.grid_columnconfigure(0, weight=1)
        marco_consola.grid_rowconfigure(0, weight=1)
        self.marco_consola = marco_consola

        self.console = tk.Text(marco_consola, font=self.f_mono, relief="flat", bd=0, wrap="word", state="disabled")
        self.console.grid(row=0, column=0, sticky="nsew")
        self.scroll_consola = ttk.Scrollbar(marco_consola, command=self.console.yview)
        self.scroll_consola.grid(row=0, column=1, sticky="ns")
        self.console.configure(yscrollcommand=self.scroll_consola.set)

    def crear_tarjeta_estado(self, columna, titulo, valor):
        tarjeta = tk.Frame(self.fila_estado, highlightthickness=1)
        tarjeta.grid(row=0, column=columna, sticky="ew", padx=(0 if columna == 0 else 8, 0))

        lbl_titulo = tk.Label(tarjeta, text=titulo, font=self.f_chico, anchor="w")
        lbl_titulo.pack(fill="x", padx=14, pady=(10, 0))

        lbl_valor = tk.Label(tarjeta, text=valor, font=self.f_estado, anchor="w")
        lbl_valor.pack(fill="x", padx=14, pady=(0, 10))

        self.tarjetas_estado.append((tarjeta, lbl_titulo, lbl_valor))
        return lbl_valor

    def aplicar_tema(self):
        p = self.paleta

        # Estilo ttk acorde al tema
        estilo = ttk.Style(self)
        try:
            estilo.theme_use("vista" if not self.tema_oscuro else "clam")
        except tk.TclError:
            pass
        if self.tema_oscuro:
            estilo.configure("TCombobox", fieldbackground=p["entrada_bg"], background=p["entrada_bg"], foreground=p["entrada_fg"], arrowcolor=p["texto"])
            estilo.map("TCombobox", fieldbackground=[("readonly", p["entrada_bg"])], foreground=[("readonly", p["entrada_fg"])])
            estilo.configure("Vertical.TScrollbar", background=p["panel"], troughcolor=p["consola_bg"], arrowcolor=p["texto_suave"])
        self.option_add("*TCombobox*Listbox.background", p["entrada_bg"])
        self.option_add("*TCombobox*Listbox.foreground", p["entrada_fg"])
        self.option_add("*TCombobox*Listbox.selectBackground", p["acento"])
        self.option_add("*TCombobox*Listbox.font", self.f_normal)

        self.configure(bg=p["ventana"])
        self.panel.configure(bg=p["panel"])
        self.contenido.configure(bg=p["ventana"])
        self.fila_estado.configure(bg=p["ventana"])

        for etiqueta in (self.lbl_logo, self.lbl_version, self.lbl_entorno, self.lbl_tema, self.lbl_pie):
            etiqueta.configure(bg=p["panel"], fg=p["texto_suave"])
        self.lbl_logo.configure(fg=p["texto"])
        self.lbl_encabezado.configure(bg=p["ventana"], fg=p["texto"])

        for boton in (self.btn_infra, self.btn_abrir, self.btn_guardar, self.btn_setup, self.btn_probar):
            boton.pintar(p, self.f_boton)

        for tarjeta, lbl_titulo, lbl_valor in self.tarjetas_estado:
            tarjeta.configure(bg=p["tarjeta"], highlightbackground=p["borde"], highlightcolor=p["borde"])
            lbl_titulo.configure(bg=p["tarjeta"], fg=p["texto_suave"])
            color_actual = lbl_valor.cget("fg")
            if color_actual not in (p["ok"], p["error"]):
                color_actual = p["neutro"]
            lbl_valor.configure(bg=p["tarjeta"], fg=color_actual)

        self.tarjeta_config.configure(bg=p["tarjeta"], highlightbackground=p["borde"], highlightcolor=p["borde"])
        self.lbl_config_titulo.configure(bg=p["tarjeta"], fg=p["texto"])
        for etiqueta in self.etiquetas_campo:
            etiqueta.configure(bg=p["tarjeta"], fg=p["texto_suave"])
        for entrada in self.entradas:
            entrada.configure(
                bg=p["entrada_bg"], fg=p["entrada_fg"],
                insertbackground=p["acento"],
                highlightthickness=1,
                highlightbackground=p["borde"], highlightcolor=p["acento"],
            )

        self.tarjeta_consola.configure(bg=p["tarjeta"], highlightbackground=p["borde"], highlightcolor=p["borde"])
        self.encabezado_consola.configure(bg=p["tarjeta"])
        self.lbl_consola.configure(bg=p["tarjeta"], fg=p["texto"])
        self.marco_consola.configure(bg=p["consola_bg"])
        self.console.configure(bg=p["consola_bg"], fg=p["consola_fg"], insertbackground=p["consola_fg"])

        # Colores por tipo de mensaje en la consola
        self.console.tag_configure("HORA", foreground="#6a9955")
        self.console.tag_configure("INFO", foreground=p["consola_fg"])
        self.console.tag_configure("OK", foreground="#4ec9b0")
        self.console.tag_configure("ERROR", foreground="#f48771")
        self.console.tag_configure("AUDIT", foreground="#9cdcfe")

    def cambiar_tema(self, eleccion):
        self.config.tema = eleccion
        self.tema_oscuro = self.resolver_tema_oscuro()
        self.paleta = construir_paleta(self.tema_oscuro, self.acento)
        self.aplicar_tema()
        aplicar_titulo_oscuro(self, self.tema_oscuro)

    # ── Lógica de fondo ───────────────────────────────────────────

    def detectar_raiz(self) -> str:
        if getattr(sys, "frozen", False):
            candidato = os.path.dirname(sys.executable)
        else:
            candidato = os.path.dirname(os.path.abspath(__file__))

        if os.path.exists(os.path.join(candidato, "codigo")):
            return candidato

        padre = os.path.dirname(candidato)
        if os.path.exists(os.path.join(padre, "codigo")):
            return padre

        return candidato

    def cargar_configuracion(self) -> Configuracion:
        os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
        rutas = [
            self.config_path,
            os.path.join(self.raiz, "tools", "sigic_control_config.json"),  # ubicación histórica
        ]
        for ruta in rutas:
            if os.path.exists(ruta):
                try:
                    with open(ruta, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    conocidos = {k: v for k, v in data.items() if k in Configuracion.__dataclass_fields__}
                    return Configuracion(**conocidos)
                except Exception:
                    continue
        return Configuracion()

    def leer_backend_env(self) -> dict:
        env_path = os.path.join(self.backend_dir, ".env")
        data = {}
        if not os.path.exists(env_path):
            return data
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for linea in f:
                    linea = linea.strip()
                    if not linea or linea.startswith("#") or "=" not in linea:
                        continue
                    clave, valor = linea.split("=", 1)
                    data[clave.strip()] = valor.strip().strip('"').strip("'")
        except Exception:
            return {}
        return data

    def cargar_database_url_desde_env_si_falta(self):
        if self.config.database_url.strip():
            return
        env_data = self.leer_backend_env()
        db_url = env_data.get("DATABASE_URL", "").strip()
        if db_url:
            self.config.database_url = db_url

    def guardar_configuracion(self):
        self.actualizar_config_desde_ui()
        with open(self.config_path, "w", encoding="utf-8") as f:
            json.dump(asdict(self.config), f, indent=2, ensure_ascii=False)
        self.log(f"Configuración guardada en {self.config_path}", "OK")

    def aplicar_config_a_ui(self):
        self.combo_entorno.set(self.config.entorno)
        self.entry_backend_url.delete(0, tk.END)
        self.entry_backend_url.insert(0, self.config.backend_url)
        self.entry_frontend_url.delete(0, tk.END)
        self.entry_frontend_url.insert(0, self.config.frontend_url)
        self.entry_database_url.delete(0, tk.END)
        self.entry_database_url.insert(0, self.config.database_url)

    def actualizar_config_desde_ui(self):
        self.config.entorno = self.combo_entorno.get().strip() or "local"
        self.config.backend_url = self.entry_backend_url.get().strip()
        self.config.frontend_url = self.entry_frontend_url.get().strip()
        self.config.database_url = self.entry_database_url.get().strip()

    def cambiar_entorno(self, eleccion):
        entorno = eleccion.strip()
        preset = PRESETS.get(entorno)
        if not preset:
            return
        self.entry_backend_url.delete(0, tk.END)
        self.entry_backend_url.insert(0, preset["backend_url"])
        self.entry_frontend_url.delete(0, tk.END)
        self.entry_frontend_url.insert(0, preset["frontend_url"])
        self.log(f"Entorno aplicado: {entorno}")

    def log(self, msg, tipo="INFO"):
        marca = time.strftime("%H:%M:%S")
        self.console.configure(state="normal")
        self.console.insert(tk.END, f"{marca}  ", "HORA")
        self.console.insert(tk.END, f"{msg}\n", tipo if tipo in ("OK", "ERROR", "AUDIT") else "INFO")
        self.console.see(tk.END)
        self.console.configure(state="disabled")

    def pintar_estado_general(self, texto, clase):
        color = {"ok": self.paleta["ok"], "error": self.paleta["error"]}.get(clase, self.paleta["neutro"])
        self.lbl_estado_general.configure(text=texto, fg=color)

    def toggle_infra(self):
        if self.activo:
            self.apagar_infra()
        else:
            self.encender_infra()

    def encender_infra(self):
        self.actualizar_config_desde_ui()
        self.activo = True
        self.pintar_estado_general("Operativo", "ok")
        self.btn_infra.configure(text="Detener infraestructura")
        self.btn_infra.primario = False
        self.btn_infra.pintar(self.paleta, self.f_boton)
        self.log("Iniciando backend y frontend…")

        try:
            env_backend = os.environ.copy()
            if self.config.database_url:
                env_backend["DATABASE_URL"] = self.config.database_url
            env_backend["PORT"] = self.config.backend_port

            self.procesos["api"] = subprocess.Popen(
                ["npm.cmd", "start"],
                cwd=self.backend_dir,
                shell=True,
                creationflags=0x08000000,
                env=env_backend,
            )
            self.log("Backend iniciado", "OK")

            env_front = os.environ.copy()
            env_front["VITE_API_BASE_URL"] = f"{self.config.backend_url.rstrip('/')}{self.config.frontend_api_path}"

            self.procesos["web"] = subprocess.Popen(
                ["npm.cmd", "run", "dev"],
                cwd=self.frontend_dir,
                shell=True,
                creationflags=0x08000000,
                env=env_front,
            )
            self.log("Frontend iniciado", "OK")

            time.sleep(4)
            api_proc = self.procesos.get("api")
            web_proc = self.procesos.get("web")
            if api_proc and api_proc.poll() is not None:
                self.log("El backend se detuvo al iniciar. Revisá DATABASE_URL y la conectividad.", "ERROR")
            if web_proc and web_proc.poll() is not None:
                self.log("El frontend se detuvo al iniciar. Revisá dependencias y build.", "ERROR")
        except Exception as e:
            self.log(f"Error al iniciar servicios: {e}", "ERROR")
            self.apagar_infra()

    def apagar_infra(self):
        self.log("Deteniendo procesos gestionados…")
        for clave in ["web", "api"]:
            proceso = self.procesos.get(clave)
            if proceso and proceso.poll() is None:
                try:
                    proceso.terminate()
                    proceso.wait(timeout=5)
                except Exception:
                    try:
                        proceso.kill()
                    except Exception:
                        pass
            self.procesos[clave] = None

        self.activo = False
        self.pintar_estado_general("Standby", "neutro")
        self.btn_infra.configure(text="Iniciar infraestructura")
        self.btn_infra.primario = True
        self.btn_infra.pintar(self.paleta, self.f_boton)

    def abrir_frontend(self):
        self.actualizar_config_desde_ui()
        webbrowser.open(self.config.frontend_url)

    def request_ok(self, url):
        try:
            req = request.Request(url, headers={"Bypass-Tunnel-Reminder": "true"})
            with request.urlopen(req, timeout=3) as resp:
                return 200 <= resp.status < 500
        except error.HTTPError:
            return True
        except Exception:
            return False

    def probar_db(self):
        comando = [
            "node",
            "-e",
            "const {query}=require('./db');query('SELECT 1 as ok').then(()=>{console.log('OK_DB');process.exit(0)}).catch((e)=>{console.error(e.message);process.exit(2)})",
        ]
        env = os.environ.copy()
        if self.config.database_url:
            env["DATABASE_URL"] = self.config.database_url

        try:
            p = subprocess.run(
                comando,
                cwd=self.backend_dir,
                capture_output=True,
                text=True,
                timeout=8,
                env=env,
                creationflags=0x08000000,
            )
            return p.returncode == 0
        except Exception:
            return False

    def actualizar_etiqueta_estado(self, etiqueta, ok):
        etiqueta.configure(
            text="Conectado" if ok else "Sin conexión",
            fg=self.paleta["ok"] if ok else self.paleta["error"],
        )

    def probar_conexiones_manual(self):
        self.actualizar_config_desde_ui()
        backend_ok = self.request_ok(f"{self.config.backend_url.rstrip('/')}/api/health")
        frontend_ok = self.request_ok(self.config.frontend_url)
        db_ok = self.probar_db()

        self.actualizar_etiqueta_estado(self.lbl_backend, backend_ok)
        self.actualizar_etiqueta_estado(self.lbl_frontend, frontend_ok)
        self.actualizar_etiqueta_estado(self.lbl_db, db_ok)

        self.log(f"Chequeo manual → backend={backend_ok}, frontend={frontend_ok}, db={db_ok}", "AUDIT")

    def forzar_asistente_inicial(self):
        self.actualizar_config_desde_ui()
        self.log("Forzando asistente inicial: limpiando datos y marcando setup_inicial_completado=0…", "AUDIT")
        env = os.environ.copy()
        if self.config.database_url:
            env["DATABASE_URL"] = self.config.database_url
        try:
            p = subprocess.run(
                ["npm.cmd", "run", "db:reset-datos"],
                cwd=self.backend_dir,
                env=env,
                capture_output=True,
                text=True,
                timeout=60,
                creationflags=0x08000000,
            )
            if p.returncode == 0:
                self.log("Asistente inicial forzado correctamente. Reiniciá la infraestructura y abrí el frontend.", "OK")
                try:
                    webbrowser.open(f"{self.config.frontend_url.rstrip('/')}/?asistente=1")
                except Exception:
                    pass
            else:
                self.log("No se pudo forzar el asistente inicial. " + (p.stderr.strip() or p.stdout.strip()), "ERROR")
        except Exception as e:
            self.log(f"Fallo al forzar el asistente inicial: {e}", "ERROR")

    def bucle_monitoreo(self):
        while self.monitor_activo:
            try:
                backend_ok = self.request_ok(f"{self.config.backend_url.rstrip('/')}/api/health")
                frontend_ok = self.request_ok(self.config.frontend_url)
                db_ok = self.probar_db()

                self.after(0, self.actualizar_etiqueta_estado, self.lbl_backend, backend_ok)
                self.after(0, self.actualizar_etiqueta_estado, self.lbl_frontend, frontend_ok)
                self.after(0, self.actualizar_etiqueta_estado, self.lbl_db, db_ok)

                estado_actual = {"backend": backend_ok, "frontend": frontend_ok, "db": db_ok}
                if estado_actual != self.ultimo_estado:
                    self.ultimo_estado = estado_actual
                    self.after(0, self.log, f"Cambio de estado → backend={backend_ok}, frontend={frontend_ok}, db={db_ok}", "AUDIT")
            except Exception as e:
                self.after(0, self.log, f"Error en monitor: {e}", "ERROR")

            time.sleep(5)

    def salir(self):
        self.monitor_activo = False
        if self.activo:
            self.apagar_infra()
        self.destroy()


if __name__ == "__main__":
    activar_conciencia_dpi()
    app = SiGICControlCenter()
    app.protocol("WM_DELETE_WINDOW", app.salir)
    app.mainloop()
