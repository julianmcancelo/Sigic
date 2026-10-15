#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC — Panel Nativo de Configuración, Apariencia y Mantenimiento
Aplicación nativa GTK3 para Debian GNU/Linux / XFCE.
Permite cambiar fondos de pantalla oficiales en tiempo real, configurar aspecto y gestionar servicios.
"""

import os
import sys
import json
import urllib.request
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

.card-white {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 14px;
    padding: 18px;
}

.wallpaper-card {
    background-color: #ffffff;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px;
}

.wallpaper-card:hover {
    border-color: #0284c7;
}

.wallpaper-card.selected {
    border-color: #0284c7;
    background-color: #f0f9ff;
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

.badge-ok {
    background-color: #ecfdf5;
    color: #059669;
    border: 1px solid #a7f3d0;
    border-radius: 6px;
    padding: 3px 8px;
    font-size: 11px;
    font-weight: bold;
}
"""

class PanelAjustesSigic(Gtk.Window):
    def __init__(self):
        super().__init__(title="Configuración de SiGIC")
        self.set_default_size(780, 560)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.set_resizable(False)
        self.get_style_context().add_class("sigic-window")

        # HeaderBar institucional
        header = Gtk.HeaderBar()
        header.set_show_close_button(True)
        header.props.title = "Configuración de SiGIC"
        header.props.subtitle = "Apariencia, Fondos Oficiales y Servicios"
        header.get_style_context().add_class("sigic-headerbar")
        self.set_titlebar(header)

        # Notebook / Pestañas principales
        notebook = Gtk.Notebook()
        notebook.set_tab_pos(Gtk.PositionType.TOP)
        notebook.set_margin_start(16)
        notebook.set_margin_end(16)
        notebook.set_margin_top(12)
        notebook.set_margin_bottom(12)
        self.add(notebook)

        # Pestaña 1: Fondos y Apariencia
        tab_fondos = self.crear_pestana_fondos()
        lbl_t1 = Gtk.Label()
        lbl_t1.set_markup("<span weight='bold'>Fondos y Apariencia</span>")
        notebook.append_page(tab_fondos, lbl_t1)

        # Pestaña 2: Servicios y Mantenimiento
        tab_servicios = self.crear_pestana_servicios()
        lbl_t2 = Gtk.Label()
        lbl_t2.set_markup("<span weight='bold'>Servicios y Mantenimiento</span>")
        notebook.append_page(tab_servicios, lbl_t2)

        # Pestaña 3: Sistema y Diagnóstico
        tab_sistema = self.crear_pestana_sistema()
        lbl_t3 = Gtk.Label()
        lbl_t3.set_markup("<span weight='bold'>Información del Sistema</span>")
        notebook.append_page(tab_sistema, lbl_t3)

    def crear_pestana_fondos(self):
        box_root = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=14)
        box_root.set_margin_top(14)
        box_root.set_margin_bottom(14)
        box_root.set_margin_start(16)
        box_root.set_margin_end(16)

        lbl_desc = Gtk.Label(xalign=0)
        lbl_desc.set_markup("<span foreground='#0f172a' weight='heavy' size='12000'>Fondos de Pantalla Oficiales de SiGIC</span>\n<small><span foreground='#64748b'>Seleccioná una imagen para aplicarla inmediatamente al escritorio del sistema.</span></small>")
        box_root.pack_start(lbl_desc, False, False, 0)

        # Lista de fondos disponibles
        grid_fondos = Gtk.Grid()
        grid_fondos.set_column_spacing(16)
        grid_fondos.set_row_spacing(16)
        grid_fondos.set_column_homogeneous(True)

        fondos = [
            ("Azul Beltrán Oficial", "Fondo oscuro con resplandor cian y logo central", "/usr/share/backgrounds/sigic/fondo.png"),
            ("Navy Medianoche", "Tono azul profundo sobrio de alta concentración", "/usr/share/backgrounds/sigic/fondo-navy.png"),
            ("Cobalto Ceremonial", "Estilo ceremonial institucional Beltrán", "/usr/share/backgrounds/sigic/fondo-cobalto.png"),
            ("Claro Pearl", "Estilo claro para auditorios y proyectores", "/usr/share/backgrounds/sigic/fondo-pearl.png"),
        ]

        self.cards_fondos = []
        for i, (nombre, detalle, ruta) in enumerate(fondos):
            card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
            card.get_style_context().add_class("wallpaper-card")

            lbl_nom = Gtk.Label(xalign=0)
            lbl_nom.set_markup(f"<span foreground='#0f172a' weight='heavy'>{nombre}</span>")
            lbl_det = Gtk.Label(xalign=0)
            lbl_det.set_markup(f"<small><span foreground='#64748b'>{detalle}</span></small>")
            lbl_det.set_line_wrap(True)

            btn_aplicar = Gtk.Button()
            lbl_b = Gtk.Label()
            lbl_b.set_markup("<span foreground='#ffffff' weight='heavy'>Aplicar Fondo</span>")
            btn_aplicar.add(lbl_b)
            btn_aplicar.get_style_context().add_class("btn-primary")
            btn_aplicar.connect("clicked", lambda b, r=ruta: self.aplicar_fondo_pantalla(r))

            card.pack_start(lbl_nom, False, False, 0)
            card.pack_start(lbl_det, True, True, 0)
            card.pack_start(btn_aplicar, False, False, 4)

            col = i % 2
            row = i // 2
            grid_fondos.attach(card, col, row, 1, 1)

        box_root.pack_start(grid_fondos, True, True, 0)

        # Mensaje de estado de fondo
        self.lbl_estado_fondo = Gtk.Label(xalign=0)
        self.lbl_estado_fondo.set_markup("<small><span foreground='#10b981' weight='bold'>● Escritorio listo</span></small>")
        box_root.pack_start(self.lbl_estado_fondo, False, False, 0)

        return box_root

    def aplicar_fondo_pantalla(self, ruta_imagen):
        if not os.path.exists(ruta_imagen):
            # Si no existe la variante, usar la oficial
            ruta_imagen = "/usr/share/backgrounds/sigic/fondo.png"

        try:
            # 1. Obtener todas las propiedades de pantalla de xfconf-query
            res = subprocess.run(
                ["xfconf-query", "-c", "xfce4-desktop", "-l"],
                capture_output=True,
                text=True,
                check=False
            )
            for linea in res.stdout.splitlines():
                if linea.endswith("last-image"):
                    subprocess.run(
                        ["xfconf-query", "-c", "xfce4-desktop", "-p", linea, "-s", ruta_imagen],
                        check=False
                    )
            # 2. Recargar xfdesktop
            subprocess.run(["xfdesktop", "--reload"], check=False)
            self.lbl_estado_fondo.set_markup(f"<small><span foreground='#0284c7' weight='heavy'>✓ Fondo actualizado: {os.path.basename(ruta_imagen)}</span></small>")
        except Exception as e:
            self.lbl_estado_fondo.set_markup(f"<small><span foreground='#dc2626' weight='bold'>Aviso: {e}</span></small>")

    def crear_pestana_servicios(self):
        box_root = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=16)
        box_root.set_margin_top(14)
        box_root.set_margin_bottom(14)
        box_root.set_margin_start(16)
        box_root.set_margin_end(16)

        # Tarjeta 1: Modo Mantenimiento
        card_maint = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        card_maint.get_style_context().add_class("card-white")

        box_maint_top = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=12)
        lbl_maint_t = Gtk.Label(xalign=0)
        lbl_maint_t.set_markup("<span foreground='#0f172a' weight='heavy' size='11000'>Modo Mantenimiento del Sistema</span>\n<small><span foreground='#64748b'>Al activarse, la plataforma web muestra un aviso de mantenimiento y restringe el acceso.</span></small>")
        box_maint_top.pack_start(lbl_maint_t, True, True, 0)

        self.sw_mantenimiento = Gtk.Switch()
        self.sw_mantenimiento.set_valign(Gtk.Align.CENTER)
        self.sw_mantenimiento.connect("notify::active", self.on_cambiar_mantenimiento)
        box_maint_top.pack_start(self.sw_mantenimiento, False, False, 0)
        card_maint.pack_start(box_maint_top, False, False, 0)

        box_root.pack_start(card_maint, False, False, 0)

        # Tarjeta 2: Estado de Servicios
        card_serv = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=12)
        card_serv.get_style_context().add_class("card-white")

        lbl_serv_t = Gtk.Label(xalign=0)
        lbl_serv_t.set_markup("<span foreground='#0f172a' weight='heavy' size='11000'>Servicios del Sistema</span>")
        card_serv.pack_start(lbl_serv_t, False, False, 0)

        # Fila Plataforma Web
        fila_web = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=12)
        lbl_w1 = Gtk.Label(xalign=0)
        lbl_w1.set_markup("<span foreground='#1e293b' weight='bold'>Plataforma Web (Next.js)</span>\n<small><span foreground='#64748b'>http://localhost:3000</span></small>")
        fila_web.pack_start(lbl_w1, True, True, 0)

        self.badge_web = Gtk.Label()
        self.badge_web.set_markup("<span foreground='#059669' weight='bold'>● ACTIVO</span>")
        fila_web.pack_start(self.badge_web, False, False, 0)
        card_serv.pack_start(fila_web, False, False, 4)

        # Fila PostgreSQL
        fila_db = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=12)
        lbl_d1 = Gtk.Label(xalign=0)
        lbl_d1.set_markup("<span foreground='#1e293b' weight='bold'>Base de Datos (PostgreSQL)</span>\n<small><span foreground='#64748b'>Puerto local 5432 / Datos persistentes</span></small>")
        fila_db.pack_start(lbl_d1, True, True, 0)

        self.badge_db = Gtk.Label()
        self.badge_db.set_markup("<span foreground='#059669' weight='bold'>● CONECTADO</span>")
        fila_db.pack_start(self.badge_db, False, False, 0)
        card_serv.pack_start(fila_db, False, False, 4)

        box_root.pack_start(card_serv, False, False, 0)

        # Botón para abrir la plataforma en el navegador
        box_actions = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        btn_abrir_plat = Gtk.Button()
        lbl_plat = Gtk.Label()
        lbl_plat.set_markup("<span foreground='#ffffff' weight='heavy'>Abrir Plataforma en Navegador</span>")
        btn_abrir_plat.add(lbl_plat)
        btn_abrir_plat.get_style_context().add_class("btn-primary")
        btn_abrir_plat.connect("clicked", lambda b: subprocess.Popen(["chromium", "--start-maximized", "http://localhost:3000/"]))
        box_actions.pack_start(btn_abrir_plat, False, False, 0)

        box_root.pack_start(box_actions, False, False, 0)

        # Consultar estado de mantenimiento en background
        threading.Thread(target=self.consultar_estado_servicios, daemon=True).start()

        return box_root

    def on_cambiar_mantenimiento(self, switch, gparam):
        activo = switch.get_active()
        threading.Thread(target=self._actualizar_mantenimiento_db, args=(activo,), daemon=True).start()

    def _actualizar_mantenimiento_db(self, activo):
        try:
            url = "http://localhost:3000/api/configuracion"
            payload = json.dumps({"clave": "modo_mantenimiento", "valor": "true" if activo else "false"}).encode("utf-8")
            req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
            with urllib.request.urlopen(req, timeout=3) as _:
                pass
        except Exception:
            pass

    def consultar_estado_servicios(self):
        try:
            req = urllib.request.Request("http://localhost:3000/api/configuracion", timeout=3)
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode())
                maint = data.get("modo_mantenimiento") == "true" or data.get("modo_mantenimiento") is True
                GLib.idle_add(self.sw_mantenimiento.set_active, maint)
                GLib.idle_add(self.badge_web.set_markup, "<span foreground='#059669' weight='bold'>● ACTIVO</span>")
        except Exception:
            GLib.idle_add(self.badge_web.set_markup, "<span foreground='#dc2626' weight='bold'>● DETENIDO</span>")

    def crear_pestana_sistema(self):
        box_root = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=14)
        box_root.set_margin_top(14)
        box_root.set_margin_bottom(14)
        box_root.set_margin_start(16)
        box_root.set_margin_end(16)

        card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=12)
        card.get_style_context().add_class("card-white")

        lbl_t = Gtk.Label(xalign=0)
        lbl_t.set_markup("<span foreground='#0f172a' weight='heavy' size='11000'>Especificaciones del Appliance</span>")
        card.pack_start(lbl_t, False, False, 0)

        grid = Gtk.Grid()
        grid.set_row_spacing(8)
        grid.set_column_spacing(18)

        datos = [
            ("Sistema:", "SiGIC"),
            ("Base Linux:", "Debian GNU/Linux 12 (Bookworm)"),
            ("Entorno de escritorio:", "XFCE 4.18 Desktop"),
            ("Institución:", "Instituto Tecnológico Beltrán"),
            ("Proyecto:", "Práctica Profesionalizante 2026"),
            ("Equipo:", "Cancelo J. · Alfonso A. · Contreras S. · Frassia M. · Santillán L.")
        ]

        for fila, (k, v) in enumerate(datos):
            lbl_k = Gtk.Label(xalign=0)
            lbl_k.set_markup(f"<span foreground='#64748b' weight='bold'>{k}</span>")
            lbl_v = Gtk.Label(xalign=0)
            lbl_v.set_markup(f"<span foreground='#0f172a' weight='bold'>{v}</span>")
            grid.attach(lbl_k, 0, fila, 1, 1)
            grid.attach(lbl_v, 1, fila, 1, 1)

        card.pack_start(grid, False, False, 4)
        box_root.pack_start(card, False, False, 0)

        return box_root

def aplicar_estilos():
    try:
        css_provider = Gtk.CssProvider()
        css_provider.load_from_data(CSS_ESTILOS)
        screen = Gdk.Screen.get_default()
        if screen:
            Gtk.StyleContext.add_provider_for_screen(
                screen,
                css_provider,
                Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
            )
    except Exception as err:
        print(f"Aviso CSS: {err}")

def main():
    win = PanelAjustesSigic()
    aplicar_estilos()
    win.connect("destroy", Gtk.main_quit)
    win.show_all()
    Gtk.main()

if __name__ == "__main__":
    main()
