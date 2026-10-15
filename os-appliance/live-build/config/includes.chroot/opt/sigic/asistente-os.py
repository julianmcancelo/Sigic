#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC OS — Asistente Nativo de Primer Inicio y Acceso
Aplicación de sistema desarrollada en Python 3 + GTK 3 para Debian GNU/Linux / XFCE.
Configura la cuenta de usuario de Linux, inicializa la plataforma y lanza la sesión.
"""

import os
import sys
import json
import time
import urllib.request
import urllib.error
import subprocess
import threading
from datetime import datetime

try:
    import gi
    gi.require_version('Gtk', '3.0')
    gi.require_version('Gdk', '3.0')
    from gi.repository import Gtk, Gdk, GdkPixbuf, GLib
except Exception as err:
    print(f"Error importando módulos de GTK 3: {err}")
    sys.exit(1)

CSS_ESTILOS = b"""
* {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

window.asistente-bg {
    background: #eef2f6;
}

.top-bar {
    background: rgba(255, 255, 255, 0.92);
    border-bottom: 1px solid #cbd5e1;
    padding: 10px 24px;
}

.top-title {
    font-size: 14px;
    font-weight: 800;
    color: #0f172a;
}

.top-pill {
    background: rgba(2, 132, 199, 0.12);
    color: #0284c7;
    font-size: 11px;
    font-weight: 800;
    border-radius: 6px;
    padding: 3px 8px;
}

.top-clock {
    font-size: 13px;
    font-weight: 700;
    color: #334155;
}

.main-card {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.sidebar {
    background: linear-gradient(180deg, #091a2e 0%, #03080e 100%);
    border-top-left-radius: 19px;
    border-bottom-left-radius: 19px;
    padding: 32px 28px;
}

.sidebar-title {
    font-size: 24px;
    font-weight: 900;
    color: #ffffff;
}

.sidebar-sub {
    font-size: 12px;
    font-weight: 700;
    color: #38bdf8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.sidebar-desc {
    font-size: 13px;
    line-height: 1.45;
    color: #94a3b8;
}

.feature-item {
    font-size: 12.5px;
    font-weight: 600;
    color: #e2e8f0;
}

.sidebar-footer {
    font-size: 11px;
    color: #64748b;
    font-weight: 500;
}

.form-container {
    padding: 28px 36px;
}

.tab-btn {
    background: #f1f5f9;
    color: #64748b;
    font-size: 13px;
    font-weight: 700;
    border-radius: 10px;
    padding: 8px 16px;
    border: 1px solid #cbd5e1;
}

.tab-btn.active {
    background: #ffffff;
    color: #0284c7;
    border: 1px solid #0284c7;
    box-shadow: 0 2px 6px rgba(2, 132, 199, 0.15);
}

.input-label {
    font-size: 12px;
    font-weight: 700;
    color: #334155;
    margin-bottom: 2px;
}

.input-field {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 9px;
    padding: 8px 12px;
    font-size: 13px;
    color: #0f172a;
}

.input-field:focus {
    border-color: #0284c7;
    box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.2);
}

.btn-primary {
    background: #0284c7;
    color: #ffffff;
    font-size: 14px;
    font-weight: 800;
    border-radius: 10px;
    padding: 11px 20px;
    border: none;
}

.btn-primary:hover {
    background: #0369a1;
}

.btn-pill {
    background: #f1f5f9;
    color: #334155;
    font-size: 11.5px;
    font-weight: 700;
    border-radius: 8px;
    padding: 5px 10px;
    border: 1px solid #cbd5e1;
}

.btn-pill:hover {
    background: #e2e8f0;
    color: #0f172a;
}

.error-banner {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 9px;
    padding: 9px 14px;
    color: #991b1b;
    font-size: 12.5px;
    font-weight: 600;
}

.status-label {
    font-size: 13px;
    font-weight: 700;
    color: #0284c7;
}

.footer-system {
    font-size: 11px;
    color: #64748b;
    font-weight: 500;
    text-align: center;
    padding: 10px;
}
"""

class AsistenteSigicOS(Gtk.Window):
    def __init__(self):
        super().__init__(title="SiGIC OS — Asistente de Inicio y Acceso")
        self.set_default_size(980, 680)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.set_resizable(False)
        self.get_style_context().add_class("asistente-bg")

        # Layout vertical principal
        vbox_root = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=0)
        self.add(vbox_root)

        # 1. Barra superior
        topbar = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=12)
        topbar.get_style_context().add_class("top-bar")

        logo_top_path = "/opt/sigic/logo.png"
        if os.path.exists(logo_top_path):
            try:
                pixbuf_top = GdkPixbuf.Pixbuf.new_from_file_at_scale(logo_top_path, -1, 24, True)
                img_top = Gtk.Image.new_from_pixbuf(pixbuf_top)
                topbar.pack_start(img_top, False, False, 0)
            except Exception:
                pass

        lbl_brand = Gtk.Label(label="SiGIC OS")
        lbl_brand.get_style_context().add_class("top-title")
        topbar.pack_start(lbl_brand, False, False, 0)

        lbl_inst_pill = Gtk.Label(label="INSTITUTO BELTRÁN")
        lbl_inst_pill.get_style_context().add_class("top-pill")
        topbar.pack_start(lbl_inst_pill, False, False, 0)

        # Espaciador
        topbar.pack_start(Gtk.Box(), True, True, 0)

        # Indicador de estado y reloj
        self.lbl_top_status = Gtk.Label(label="● Sistema operativo listo")
        self.lbl_top_status.set_markup("<span foreground='#10b981'>●</span> <small><span foreground='#475569' weight='bold'>Sistema operativo listo</span></small>")
        topbar.pack_start(self.lbl_top_status, False, False, 0)

        self.lbl_clock = Gtk.Label()
        self.lbl_clock.get_style_context().add_class("top-clock")
        self.actualizar_reloj()
        topbar.pack_start(self.lbl_clock, False, False, 6)

        vbox_root.pack_start(topbar, False, False, 0)

        # 2. Contenedor central flotante
        box_center = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=0)
        box_center.set_margin_top(16)
        box_center.set_margin_bottom(12)
        box_center.set_margin_start(24)
        box_center.set_margin_end(24)

        card = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=0)
        card.get_style_context().add_class("main-card")

        # 2A. Columna lateral institucional (Izquierda)
        sidebar = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=16)
        sidebar.set_size_request(320, -1)
        sidebar.get_style_context().add_class("sidebar")

        if os.path.exists(logo_top_path):
            try:
                pixbuf_side = GdkPixbuf.Pixbuf.new_from_file_at_scale(logo_top_path, -1, 46, True)
                img_side = Gtk.Image.new_from_pixbuf(pixbuf_side)
                img_side.set_alignment(0, 0.5)
                sidebar.pack_start(img_side, False, False, 0)
            except Exception:
                pass

        box_side_titles = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=4)
        lbl_s_title = Gtk.Label(label="SiGIC OS", xalign=0)
        lbl_s_title.get_style_context().add_class("sidebar-title")
        lbl_s_sub = Gtk.Label(label="Plataforma de Colaciones", xalign=0)
        lbl_s_sub.get_style_context().add_class("sidebar-sub")
        box_side_titles.pack_start(lbl_s_title, False, False, 0)
        box_side_titles.pack_start(lbl_s_sub, False, False, 0)
        sidebar.pack_start(box_side_titles, False, False, 0)

        lbl_s_desc = Gtk.Label(
            label="Plataforma oficial para la coordinación integral de colaciones, acreditación digital y gestión de egresados.",
            xalign=0
        )
        lbl_s_desc.set_line_wrap(True)
        lbl_s_desc.get_style_context().add_class("sidebar-desc")
        sidebar.pack_start(lbl_s_desc, False, False, 0)

        # Características
        features = [
            "Acreditación móvil mediante código QR",
            "Asignación visual de butacas en tiempo real",
            "Gestión integral de graduados y diplomas"
        ]
        box_feats = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        for f in features:
            lbl_f = Gtk.Label(xalign=0)
            lbl_f.set_markup(f"<span foreground='#00e5ff'>✓</span>  <span class='feature-item'>{f}</span>")
            box_feats.pack_start(lbl_f, False, False, 0)
        sidebar.pack_start(box_feats, False, False, 8)

        # Espacio flexible
        sidebar.pack_start(Gtk.Box(), True, True, 0)

        lbl_s_foot = Gtk.Label(
            label="Instituto Tecnológico Beltrán\nPráctica Profesionalizante 2026",
            xalign=0
        )
        lbl_s_foot.get_style_context().add_class("sidebar-footer")
        sidebar.pack_start(lbl_s_foot, False, False, 0)

        card.pack_start(sidebar, False, False, 0)

        # 2B. Columna derecha: Formularios y pestañas
        self.right_panel = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=14)
        self.right_panel.get_style_context().add_class("form-container")

        # Pestañas Superiores
        box_tabs = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=8)
        self.btn_tab_setup = Gtk.Button(label="Configurar por primera vez")
        self.btn_tab_setup.get_style_context().add_class("tab-btn")
        self.btn_tab_setup.get_style_context().add_class("active")
        self.btn_tab_setup.connect("clicked", lambda b: self.cambiar_modo("setup"))

        self.btn_tab_login = Gtk.Button(label="Ya tengo una cuenta registrada")
        self.btn_tab_login.get_style_context().add_class("tab-btn")
        self.btn_tab_login.connect("clicked", lambda b: self.cambiar_modo("login"))

        box_tabs.pack_start(self.btn_tab_setup, True, True, 0)
        box_tabs.pack_start(self.btn_tab_login, True, True, 0)
        self.right_panel.pack_start(box_tabs, False, False, 0)

        # Banner de Error
        self.box_error = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=8)
        self.box_error.get_style_context().add_class("error-banner")
        self.lbl_error = Gtk.Label(xalign=0)
        self.lbl_error.set_line_wrap(True)
        self.box_error.pack_start(self.lbl_error, True, True, 0)
        self.box_error.set_no_show_all(True)
        self.box_error.hide()
        self.right_panel.pack_start(self.box_error, False, False, 0)

        # Contenedor dinámico de formularios (Stack)
        self.stack = Gtk.Stack()
        self.stack.set_transition_type(Gtk.StackTransitionType.CROSSFADE)
        self.stack.set_transition_duration(200)

        # === VISTA 1: SETUP ===
        box_setup = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)

        # Nombre
        lbl_n = Gtk.Label(label="Nombre y apellido institucional", xalign=0)
        lbl_n.get_style_context().add_class("input-label")
        self.ent_setup_nombre = Gtk.Entry(text="Administrador Beltrán")
        self.ent_setup_nombre.get_style_context().add_class("input-field")
        box_setup.pack_start(lbl_n, False, False, 0)
        box_setup.pack_start(self.ent_setup_nombre, False, False, 0)

        # Email
        lbl_e = Gtk.Label(label="Correo electrónico de contacto", xalign=0)
        lbl_e.get_style_context().add_class("input-label")
        self.ent_setup_email = Gtk.Entry(text="admin@sigic.com")
        self.ent_setup_email.get_style_context().add_class("input-field")
        box_setup.pack_start(lbl_e, False, False, 0)
        box_setup.pack_start(self.ent_setup_email, False, False, 0)

        # Password
        lbl_p = Gtk.Label(label="Contraseña para este equipo y plataforma", xalign=0)
        lbl_p.get_style_context().add_class("input-label")
        self.ent_setup_pass = Gtk.Entry(text="ColacionBeltran2026!")
        self.ent_setup_pass.set_visibility(False)
        self.ent_setup_pass.get_style_context().add_class("input-field")
        box_setup.pack_start(lbl_p, False, False, 0)
        box_setup.pack_start(self.ent_setup_pass, False, False, 0)

        # Clave activación
        lbl_k = Gtk.Label(label="Clave de activación institucional", xalign=0)
        lbl_k.get_style_context().add_class("input-label")
        self.ent_setup_key = Gtk.Entry(text="35230531")
        self.ent_setup_key.get_style_context().add_class("input-field")
        box_setup.pack_start(lbl_k, False, False, 0)
        box_setup.pack_start(self.ent_setup_key, False, False, 0)

        # Primer evento
        lbl_c = Gtk.Label(label="Nombre del primer acto de colación", xalign=0)
        lbl_c.get_style_context().add_class("input-label")
        self.ent_setup_ceremonia = Gtk.Entry(text="Colación Beltrán 2026")
        self.ent_setup_ceremonia.get_style_context().add_class("input-field")
        box_setup.pack_start(lbl_c, False, False, 0)
        box_setup.pack_start(self.ent_setup_ceremonia, False, False, 0)

        # Botón Setup
        self.btn_submit_setup = Gtk.Button(label="Completar configuración e ingresar al sistema")
        self.btn_submit_setup.get_style_context().add_class("btn-primary")
        self.btn_submit_setup.connect("clicked", lambda b: self.ejecutar_accion("primer_inicio"))
        box_setup.pack_start(self.btn_submit_setup, False, False, 6)

        self.stack.add_named(box_setup, "setup")

        # === VISTA 2: LOGIN ===
        box_login = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=12)

        lbl_le = Gtk.Label(label="Correo institucional", xalign=0)
        lbl_le.get_style_context().add_class("input-label")
        self.ent_login_email = Gtk.Entry(text="admin@sigic.com")
        self.ent_login_email.get_style_context().add_class("input-field")
        box_login.pack_start(lbl_le, False, False, 0)
        box_login.pack_start(self.ent_login_email, False, False, 0)

        lbl_lp = Gtk.Label(label="Contraseña", xalign=0)
        lbl_lp.get_style_context().add_class("input-label")
        self.ent_login_pass = Gtk.Entry(text="ColacionBeltran2026!")
        self.ent_login_pass.set_visibility(False)
        self.ent_login_pass.get_style_context().add_class("input-field")
        box_login.pack_start(lbl_lp, False, False, 0)
        box_login.pack_start(self.ent_login_pass, False, False, 0)

        self.btn_submit_login = Gtk.Button(label="Iniciar Sesión en SiGIC OS")
        self.btn_submit_login.get_style_context().add_class("btn-primary")
        self.btn_submit_login.connect("clicked", lambda b: self.ejecutar_accion("login"))
        box_login.pack_start(self.btn_submit_login, False, False, 6)

        # Accesos rápidos demo
        box_demos = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=6)
        lbl_demo = Gtk.Label(label="Acceso de prueba:")
        lbl_demo.get_style_context().add_class("input-label")
        box_demos.pack_start(lbl_demo, False, False, 0)

        btn_d_admin = Gtk.Button(label="Administrador")
        btn_d_admin.get_style_context().add_class("btn-pill")
        btn_d_admin.connect("clicked", lambda b: self.aplicar_demo("admin"))
        box_demos.pack_start(btn_d_admin, False, False, 0)

        btn_d_soporte = Gtk.Button(label="Soporte Técnico")
        btn_d_soporte.get_style_context().add_class("btn-pill")
        btn_d_soporte.connect("clicked", lambda b: self.aplicar_demo("soporte"))
        box_demos.pack_start(btn_d_soporte, False, False, 0)

        btn_d_port = Gtk.Button(label="Portería")
        btn_d_port.get_style_context().add_class("btn-pill")
        btn_d_port.connect("clicked", lambda b: self.aplicar_demo("porteria"))
        box_demos.pack_start(btn_d_port, False, False, 0)

        box_login.pack_start(box_demos, False, False, 4)
        self.stack.add_named(box_login, "login")

        self.right_panel.pack_start(self.stack, True, True, 0)

        # Estado de carga / Progreso
        self.box_progreso = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        self.spinner = Gtk.Spinner()
        self.lbl_progreso = Gtk.Label(xalign=0)
        self.lbl_progreso.get_style_context().add_class("status-label")
        self.box_progreso.pack_start(self.spinner, False, False, 0)
        self.box_progreso.pack_start(self.lbl_progreso, True, True, 0)
        self.box_progreso.set_no_show_all(True)
        self.box_progreso.hide()
        self.right_panel.pack_start(self.box_progreso, False, False, 0)

        card.pack_start(self.right_panel, True, True, 0)
        box_center.pack_start(card, True, True, 0)
        vbox_root.pack_start(box_center, True, True, 0)

        # 3. Footer inferior
        lbl_sys_foot = Gtk.Label(
            label="Instituto Tecnológico Beltrán · Práctica Profesionalizante 2026 · Cancelo Julián · Alfonso Alan Alexis · Contreras Villalba Sol Heilin · Frassia Matías · Santillán Luis Gabriel"
        )
        lbl_sys_foot.get_style_context().add_class("footer-system")
        vbox_root.pack_start(lbl_sys_foot, False, False, 0)

        # Iniciar timers y verificación en segundo plano
        GLib.timeout_add(1000, self.actualizar_reloj)
        threading.Thread(target=self.verificar_inicializacion_background, daemon=True).start()

    def actualizar_reloj(self):
        ahora = datetime.now()
        self.lbl_clock.set_text(ahora.strftime("%H:%M"))
        return True

    def cambiar_modo(self, modo):
        self.box_error.hide()
        if modo == "setup":
            self.btn_tab_setup.get_style_context().add_class("active")
            self.btn_tab_login.get_style_context().remove_class("active")
            self.stack.set_visible_child_name("setup")
        else:
            self.btn_tab_setup.get_style_context().remove_class("active")
            self.btn_tab_login.get_style_context().add_class("active")
            self.stack.set_visible_child_name("login")

    def aplicar_demo(self, rol):
        if rol == "admin":
            self.ent_login_email.set_text("admin@sigic.com")
            self.ent_login_pass.set_text("ColacionBeltran2026!")
        elif rol == "soporte":
            self.ent_login_email.set_text("soporte@sigic.com.ar")
            self.ent_login_pass.set_text("Soporte2026!")
        elif rol == "porteria":
            self.ent_login_email.set_text("porteria@sigic.com")
            self.ent_login_pass.set_text("Porteria2026!")

    def mostrar_error(self, mensaje):
        self.box_progreso.hide()
        self.spinner.stop()
        self.btn_submit_setup.set_sensitive(True)
        self.btn_submit_login.set_sensitive(True)
        self.lbl_error.set_text(mensaje)
        self.box_error.show()

    def verificar_inicializacion_background(self):
        # Consulta si el sistema ya fue inicializado previamente
        url = "http://localhost:3000/api/sistema/acceso-os"
        for _ in range(15):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "SiGIC-OS-Assistant"})
                with urllib.request.urlopen(req, timeout=3) as res:
                    data = json.loads(res.read().decode())
                    if data.get("ok") and data.get("inicializado"):
                        GLib.idle_add(self.cambiar_modo, "login")
                        return
            except Exception:
                time.sleep(1.5)

    def ejecutar_accion(self, tipo):
        self.box_error.hide()
        self.btn_submit_setup.set_sensitive(False)
        self.btn_submit_login.set_sensitive(False)
        self.box_progreso.show()
        self.spinner.start()

        if tipo == "primer_inicio":
            payload = {
                "tipo": "primer_inicio",
                "nombre": self.ent_setup_nombre.get_text().strip(),
                "email": self.ent_setup_email.get_text().strip(),
                "password": self.ent_setup_pass.get_text(),
                "setupKey": self.ent_setup_key.get_text().strip(),
                "nombreEvento": self.ent_setup_ceremonia.get_text().strip()
            }
        else:
            payload = {
                "tipo": "login",
                "email": self.ent_login_email.get_text().strip(),
                "password": self.ent_login_pass.get_text()
            }

        threading.Thread(target=self._hilo_peticion, args=(payload,), daemon=True).start()

    def _hilo_peticion(self, payload):
        url = "http://localhost:3000/api/sistema/acceso-os"
        data_bytes = json.dumps(payload).encode("utf-8")
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "SiGIC-OS-Assistant"
        }

        # Intento de conexión con reintentos automáticos
        max_intentos = 6
        respuesta_json = None
        ultimo_error = ""

        for intento in range(1, max_intentos + 1):
            GLib.idle_add(
                self.lbl_progreso.set_text,
                f"Conectando con el sistema operativo local... (intento {intento}/{max_intentos})" if intento > 1 else "Guardando datos en el equipo..."
            )
            try:
                req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")
                with urllib.request.urlopen(req, timeout=5) as resp:
                    resp_data = resp.read().decode("utf-8")
                    respuesta_json = json.loads(resp_data)
                    break
            except urllib.error.HTTPError as he:
                try:
                    err_data = json.loads(he.read().decode("utf-8"))
                    ultimo_error = err_data.get("error", f"Error del servidor ({he.code})")
                except Exception:
                    ultimo_error = f"Error de comunicación ({he.code})"
                break
            except Exception as e:
                ultimo_error = "El servicio del sistema aún se está iniciando. Reintentando..."
                time.sleep(1.5)

        if not respuesta_json or not respuesta_json.get("ok"):
            err_msg = ultimo_error or "No se pudo completar la operación. Por favor verifique los datos ingresados."
            GLib.idle_add(self.mostrar_error, err_msg)
            return

        # Éxito: Configurar usuario nativo de Linux si aplica
        nombre = payload.get("nombre") or "SiGIC Beltrán"
        email = payload.get("email") or "admin@sigic.com"
        password = payload.get("password") or ""

        if sys.platform == "linux":
            try:
                subprocess.run(
                    ["sudo", "/usr/local/bin/sigic-configurar-usuario", nombre, email, password],
                    timeout=5,
                    check=False
                )
            except Exception as e:
                print(f"Aviso configurando usuario Linux: {e}")

        GLib.idle_add(self.lbl_progreso.set_text, "¡Todo listo! Abriendo tu panel institucional...")
        time.sleep(0.8)

        token = respuesta_json.get("token", "")
        target_url = f"http://localhost:3000/?admin_token={token}"

        # Lanzar Chromium a pantalla completa en la plataforma
        try:
            subprocess.Popen([
                "chromium",
                "--no-first-run",
                "--no-default-browser-check",
                "--noerrdialogs",
                "--disable-infobars",
                "--disable-session-crashed-bubble",
                "--password-store=basic",
                "--lang=es-AR",
                "--start-fullscreen",
                f"--app={target_url}"
            ])
        except Exception as e:
            print(f"Error lanzando Chromium: {e}")

        time.sleep(0.5)
        GLib.idle_add(Gtk.main_quit)

def aplicar_estilos():
    css_provider = Gtk.CssProvider()
    css_provider.load_from_data(CSS_ESTILOS)
    screen = Gdk.Screen.get_default()
    if screen:
        Gtk.StyleContext.add_provider_for_screen(
            screen,
            css_provider,
            Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
        )

def main():
    aplicar_estilos()
    win = AsistenteSigicOS()
    win.connect("destroy", Gtk.main_quit)
    win.show_all()
    Gtk.main()

if __name__ == "__main__":
    main()
