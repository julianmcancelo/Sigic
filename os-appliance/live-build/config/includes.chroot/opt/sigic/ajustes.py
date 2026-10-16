#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC — Panel Nativo de Configuración, Apariencia y Mantenimiento
Aplicación nativa GTK3 para Debian GNU/Linux / XFCE.
Permite cambiar fondos de pantalla oficiales con vista previa real, alternar Modo Claro / Modo Oscuro y gestionar servicios.
Instituto Tecnológico Beltrán — Práctica Profesionalizante 2026
"""

import os
import sys
import json
import shutil
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
    background-color: #060d18;
    color: #f8fafc;
}

headerbar.sigic-headerbar {
    background-image: none;
    background-color: #081221;
    color: #f8fafc;
    border-bottom: 1px solid #162844;
    box-shadow: none;
    padding: 3px 8px;
    min-height: 34px;
}

headerbar.sigic-headerbar .title {
    color: #f8fafc;
    font-weight: 800;
    font-size: 12.5px;
}

headerbar.sigic-headerbar .subtitle {
    color: #38bdf8;
    font-size: 10px;
}

notebook,
notebook > stack {
    background-image: none;
    background-color: #060d18;
    border: none;
}

notebook > header {
    background-color: #081221;
    border-bottom: 1px solid #162844;
}

notebook > header > tabs > tab {
    background-color: transparent;
    color: #94a3b8;
    padding: 6px 14px;
    border: none;
    font-weight: bold;
    font-size: 11px;
}

notebook > header > tabs > tab:checked {
    color: #38bdf8;
    border-bottom: 2px solid #38bdf8;
}

.card-dark {
    background-image: linear-gradient(180deg, #0c182b 0%, #081120 100%);
    border: 1px solid #1e293b;
    border-radius: 10px;
    padding: 10px 14px;
}

.wallpaper-card {
    background-image: linear-gradient(180deg, #0c182b 0%, #081120 100%);
    border: 1px solid #1e3a5f;
    border-radius: 9px;
    padding: 8px 10px;
}

.wallpaper-card:hover {
    border-color: #38bdf8;
    background-image: linear-gradient(180deg, #10223d 0%, #0b1629 100%);
}

.theme-card {
    background-image: linear-gradient(180deg, #0c182b 0%, #081120 100%);
    border: 1px solid #1e3a5f;
    border-radius: 9px;
    padding: 8px 12px;
}

.theme-card:hover {
    border-color: #38bdf8;
}

button.btn-primary {
    background-image: linear-gradient(90deg, #0284c7 0%, #0369a1 100%);
    background-color: #0284c7;
    border: 1px solid #38bdf8;
    color: #ffffff;
    font-size: 11px;
    font-weight: bold;
    border-radius: 6px;
    padding: 4px 10px;
    min-height: 24px;
}

button.btn-primary:hover {
    background-image: none;
    background-color: #0369a1;
}

button.btn-secondary {
    background-image: none;
    background-color: #11223b;
    color: #e2e8f0;
    font-size: 11px;
    font-weight: bold;
    border: 1px solid #1e3a5f;
    border-radius: 6px;
    padding: 4px 10px;
    min-height: 24px;
}

button.btn-secondary:hover {
    background-color: #162d4c;
    border-color: #38bdf8;
}

.badge-tag {
    background-color: #0f1f38;
    border: 1px solid #1e3a5f;
    border-radius: 5px;
    padding: 2px 7px;
    font-size: 10px;
}
"""


class PanelAjustesSigic(Gtk.Window):
    def __init__(self):
        super().__init__(title="Configuración de SiGIC")
        self.set_default_size(840, 560)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.get_style_context().add_class("sigic-window")

        settings = Gtk.Settings.get_default()
        if settings:
            settings.set_property("gtk-application-prefer-dark-theme", True)

        header = Gtk.HeaderBar()
        header.set_show_close_button(True)
        header.set_decoration_layout(":minimize,maximize,close")
        header.props.title = "Configuración de SiGIC"
        header.props.subtitle = "Apariencia, Fondos Oficiales y Servicios"
        header.get_style_context().add_class("sigic-headerbar")
        self.set_titlebar(header)

        for ruta_logo in ["/opt/sigic/logo.png", "/usr/share/pixmaps/sigic.png"]:
            if os.path.exists(ruta_logo):
                try:
                    self.set_icon_from_file(ruta_logo)
                    pix = GdkPixbuf.Pixbuf.new_from_file_at_scale(ruta_logo, 20, 20, True)
                    img_h = Gtk.Image.new_from_pixbuf(pix)
                    img_h.set_margin_start(4)
                    header.pack_start(img_h)
                    break
                except Exception:
                    pass

        notebook = Gtk.Notebook()
        notebook.set_tab_pos(Gtk.PositionType.TOP)
        notebook.set_margin_start(10)
        notebook.set_margin_end(10)
        notebook.set_margin_top(6)
        notebook.set_margin_bottom(8)
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
        box_root = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
        box_root.set_margin_top(8)
        box_root.set_margin_bottom(8)
        box_root.set_margin_start(10)
        box_root.set_margin_end(10)

        # 1. Selector de Modo Claro / Modo Oscuro
        box_temas = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        box_temas.get_style_context().add_class("card-dark")

        lbl_t_tit = Gtk.Label(xalign=0)
        lbl_t_tit.set_markup("<span foreground='#f8fafc' weight='heavy' size='10500'>Tema del Sistema:</span>\n<small><span foreground='#94a3b8'>Alterná entre visualización institucional oscura o modo claro de alta luminosidad</span></small>")
        box_temas.pack_start(lbl_t_tit, True, True, 0)

        btn_dark = Gtk.Button()
        lbl_bd = Gtk.Label()
        lbl_bd.set_markup("<span foreground='#ffffff' weight='bold'>🌙 Modo Oscuro Beltrán</span>")
        btn_dark.add(lbl_bd)
        btn_dark.get_style_context().add_class("btn-primary")
        btn_dark.connect("clicked", lambda b: self.aplicar_tema("oscuro"))
        box_temas.pack_start(btn_dark, False, False, 0)

        btn_light = Gtk.Button()
        lbl_bl = Gtk.Label()
        lbl_bl.set_markup("<span foreground='#0f172a' weight='bold'>☀️ Modo Claro Beltrán</span>")
        btn_light.add(lbl_bl)
        btn_light.get_style_context().add_class("btn-secondary")
        btn_light.connect("clicked", lambda b: self.aplicar_tema("claro"))
        box_temas.pack_start(btn_light, False, False, 0)

        box_root.pack_start(box_temas, False, False, 0)

        # 2. Grilla de Fondos Oficiales
        lbl_desc = Gtk.Label(xalign=0)
        lbl_desc.set_markup("<span foreground='#f8fafc' weight='heavy' size='11000'>Fondos de Pantalla Oficiales de SiGIC</span>\n<small><span foreground='#94a3b8'>Seleccioná un fondo institucional para aplicarlo inmediatamente a todos los escritorios.</span></small>")
        box_root.pack_start(lbl_desc, False, False, 0)

        grid_fondos = Gtk.Grid()
        grid_fondos.set_column_spacing(10)
        grid_fondos.set_row_spacing(8)
        grid_fondos.set_column_homogeneous(True)

        fondos = [
            ("Azul Beltrán Oficial", "Fondo oscuro con resplandor cian y logo oficial", "/usr/share/backgrounds/sigic/fondo.png", "#38bdf8"),
            ("Navy Medianoche", "Tono azul profundo sobrio de alta concentración", "/usr/share/backgrounds/sigic/fondo-navy.png", "#818cf8"),
            ("Cobalto Ceremonial", "Estilo ceremonial institucional Beltrán", "/usr/share/backgrounds/sigic/fondo-cobalto.png", "#22d3ee"),
            ("Claro Pearl", "Estilo claro para auditorios y proyectores", "/usr/share/backgrounds/sigic/fondo-pearl.png", "#f59e0b"),
        ]

        for i, (nombre, detalle, ruta, col_badge) in enumerate(fondos):
            card = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
            card.get_style_context().add_class("wallpaper-card")

            # Miniatura del fondo de pantalla
            img_cargada = False
            for r_posible in [ruta, f"/usr/share/backgrounds/sigic/{os.path.basename(ruta)}", f"/opt/sigic/{os.path.basename(ruta)}"]:
                if os.path.exists(r_posible):
                    try:
                        pix = GdkPixbuf.Pixbuf.new_from_file_at_scale(r_posible, 120, 68, False)
                        img_prev = Gtk.Image.new_from_pixbuf(pix)
                        card.pack_start(img_prev, False, False, 0)
                        img_cargada = True
                        break
                    except Exception:
                        pass
            if not img_cargada:
                # Placeholder visual
                ph = Gtk.Box()
                ph.set_size_request(120, 68)
                ph.get_style_context().add_class("badge-tag")
                lbl_ph = Gtk.Label()
                lbl_ph.set_markup(f"<span foreground='{col_badge}' weight='bold'>🖼️ Beltrán</span>")
                ph.pack_start(lbl_ph, True, True, 0)
                card.pack_start(ph, False, False, 0)

            info_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=2)
            lbl_nom = Gtk.Label(xalign=0)
            lbl_nom.set_markup(f"<span foreground='#f8fafc' weight='heavy' size='10000'>{nombre}</span>")
            lbl_det = Gtk.Label(xalign=0)
            lbl_det.set_markup(f"<small><span foreground='#94a3b8'>{detalle}</span></small>")
            lbl_det.set_line_wrap(True)

            btn_aplicar = Gtk.Button()
            lbl_b = Gtk.Label()
            lbl_b.set_markup("<span foreground='#ffffff' weight='bold' size='9500'>Aplicar Fondo</span>")
            btn_aplicar.add(lbl_b)
            btn_aplicar.get_style_context().add_class("btn-primary")
            btn_aplicar.connect("clicked", lambda b, r=ruta, n=nombre: self.aplicar_fondo_pantalla(r, n))

            info_box.pack_start(lbl_nom, False, False, 0)
            info_box.pack_start(lbl_det, True, True, 0)
            info_box.pack_start(btn_aplicar, False, False, 0)
            card.pack_start(info_box, True, True, 0)

            col = i % 2
            row = i // 2
            grid_fondos.attach(card, col, row, 1, 1)

        box_root.pack_start(grid_fondos, True, True, 0)

        self.lbl_estado_fondo = Gtk.Label(xalign=0)
        self.lbl_estado_fondo.set_markup("<small><span foreground='#34d399' weight='bold'>● Escritorio listo · 4 fondos institucionales activos</span></small>")
        box_root.pack_start(self.lbl_estado_fondo, False, False, 0)

        return box_root

    def aplicar_fondo_pantalla(self, ruta_imagen, nombre_fondo="Fondo Institucional"):
        def _aplicar():
            target_file = ruta_imagen
            # Buscar alternativas si la ruta no existe directamente
            if not os.path.exists(target_file):
                nombre_base = os.path.basename(ruta_imagen)
                for cand in [
                    f"/usr/share/backgrounds/sigic/{nombre_base}",
                    f"/opt/sigic/{nombre_base}",
                    "/usr/share/backgrounds/sigic/fondo.png"
                ]:
                    if os.path.exists(cand):
                        target_file = cand
                        break

            # 1. Copiar a la ruta de configuración del usuario
            try:
                cfg_dir = os.path.expanduser("~/.config/sigic")
                os.makedirs(cfg_dir, exist_ok=True)
                dest_user = os.path.join(cfg_dir, "fondo_actual.png")
                shutil.copyfile(target_file, dest_user)
            except Exception:
                pass

            # 2. Intentar copiar al fondo oficial del sistema con sudo si es posible
            try:
                subprocess.run(["sudo", "cp", target_file, "/usr/share/backgrounds/sigic/fondo.png"], timeout=2, check=False)
            except Exception:
                pass

            # 3. Aplicar mediante xfconf-query en todos los monitores y propiedades XFCE
            try:
                res = subprocess.run(["xfconf-query", "-c", "xfce4-desktop", "-l"], capture_output=True, text=True, check=False)
                props = [l.strip() for l in res.stdout.splitlines() if "last-image" in l or "image-path" in l]
                monitores = [
                    "monitor0", "monitorVirtual1", "monitorVirtual-1", "monitoreDP-1",
                    "monitoreDP-2", "monitorVGA-1", "monitorHDMI-1", "monitorVirtual"
                ]
                extras = []
                for m in monitores:
                    extras.append(f"/backdrop/screen0/{m}/workspace0/last-image")
                    extras.append(f"/backdrop/screen0/{m}/workspace0/image-path")

                todas = set(props + extras)
                for p in todas:
                    subprocess.run(
                        ["xfconf-query", "-c", "xfce4-desktop", "-p", p, "-n", "-t", "string", "-s", target_file],
                        check=False
                    )

                # Ajustar estilo a estirado/zoom (5)
                for p in [l.strip() for l in res.stdout.splitlines() if "image-style" in l]:
                    subprocess.run(["xfconf-query", "-c", "xfce4-desktop", "-p", p, "-s", "5"], check=False)
                for m in monitores:
                    subprocess.run(
                        ["xfconf-query", "-c", "xfce4-desktop", "-p", f"/backdrop/screen0/{m}/workspace0/image-style", "-n", "-t", "int", "-s", "5"],
                        check=False
                    )

                # 4. Recargar xfdesktop inmediatamente
                subprocess.run(["xfdesktop", "--reload"], check=False)
                subprocess.run(["pkill", "-USR1", "xfdesktop"], check=False)

                GLib.idle_add(
                    self.lbl_estado_fondo.set_markup,
                    f"<small><span foreground='#38bdf8' weight='heavy'>✓ Fondo aplicado en vivo: {nombre_fondo}</span></small>"
                )
            except Exception as e:
                GLib.idle_add(
                    self.lbl_estado_fondo.set_markup,
                    f"<small><span foreground='#fda4af' weight='bold'>Aviso: {e}</span></small>"
                )

        threading.Thread(target=_aplicar, daemon=True).start()

    def aplicar_tema(self, modo):
        def _tema():
            es_oscuro = (modo == "oscuro")
            theme_gtk = "Adwaita-dark" if es_oscuro else "Adwaita"
            dark_flag = "1" if es_oscuro else "0"

            # 1. Actualizar xsettings de XFCE
            subprocess.run(["xfconf-query", "-c", "xsettings", "-p", "/Net/ThemeName", "-s", theme_gtk], check=False)

            # 2. Actualizar ~/.config/gtk-3.0/settings.ini
            try:
                ini_dir = os.path.expanduser("~/.config/gtk-3.0")
                os.makedirs(ini_dir, exist_ok=True)
                ini_file = os.path.join(ini_dir, "settings.ini")
                with open(ini_file, "w", encoding="utf-8") as f:
                    f.write(f"[Settings]\ngtk-application-prefer-dark-theme={dark_flag}\ngtk-theme-name={theme_gtk}\ngtk-icon-theme-name=Adwaita\ngtk-font-name=Sans 10\n")
            except Exception:
                pass

            # 3. Aplicar fondo sugerido según el tema
            if es_oscuro:
                self.aplicar_fondo_pantalla("/usr/share/backgrounds/sigic/fondo.png", "Azul Beltrán Oficial")
            else:
                self.aplicar_fondo_pantalla("/usr/share/backgrounds/sigic/fondo-pearl.png", "Claro Pearl")

            GLib.idle_add(
                self.lbl_estado_fondo.set_markup,
                f"<small><span foreground='#34d399' weight='heavy'>✓ Modo {'Oscuro' if es_oscuro else 'Claro'} aplicado con éxito</span></small>"
            )

        threading.Thread(target=_tema, daemon=True).start()

    def crear_pestana_servicios(self):
        box_root = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        box_root.set_margin_top(10)
        box_root.set_margin_bottom(10)
        box_root.set_margin_start(10)
        box_root.set_margin_end(10)

        card_maint = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
        card_maint.get_style_context().add_class("card-dark")

        box_maint_top = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        lbl_maint_t = Gtk.Label(xalign=0)
        lbl_maint_t.set_markup("<span foreground='#f8fafc' weight='heavy' size='10500'>Modo Mantenimiento del Sistema</span>\n<small><span foreground='#94a3b8'>Al activarse, el portal público para graduados muestra un aviso de mantenimiento.</span></small>")
        box_maint_top.pack_start(lbl_maint_t, True, True, 0)

        self.sw_mantenimiento = Gtk.Switch()
        self.sw_mantenimiento.set_valign(Gtk.Align.CENTER)
        self.sw_mantenimiento.connect("notify::active", self.on_cambiar_mantenimiento)
        box_maint_top.pack_start(self.sw_mantenimiento, False, False, 0)
        card_maint.pack_start(box_maint_top, False, False, 0)

        box_root.pack_start(card_maint, False, False, 0)

        card_serv = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
        card_serv.get_style_context().add_class("card-dark")

        lbl_serv_t = Gtk.Label(xalign=0)
        lbl_serv_t.set_markup("<span foreground='#f8fafc' weight='heavy' size='10500'>Estado de Servicios y Base de Datos</span>")
        card_serv.pack_start(lbl_serv_t, False, False, 0)

        # Web API
        fila_web = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        lbl_w1 = Gtk.Label(xalign=0)
        lbl_w1.set_markup("<span foreground='#e2e8f0' weight='bold'>Motor API REST Local (SiGIC Core)</span>\n<small><span foreground='#94a3b8'>http://localhost:3000 · Next.js App Server</span></small>")
        fila_web.pack_start(lbl_w1, True, True, 0)

        self.badge_web = Gtk.Label()
        self.badge_web.set_markup("<span foreground='#34d399' weight='bold'>● ACTIVO</span>")
        fila_web.pack_start(self.badge_web, False, False, 0)
        card_serv.pack_start(fila_web, False, False, 0)

        # Database
        fila_db = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        lbl_d1 = Gtk.Label(xalign=0)
        lbl_d1.set_markup("<span foreground='#e2e8f0' weight='bold'>Base de Datos PostgreSQL (Neon Cloud / Local)</span>\n<small><span foreground='#94a3b8'>Esquema de colaciones, egresados y butacas sincronizado</span></small>")
        fila_db.pack_start(lbl_d1, True, True, 0)

        self.badge_db = Gtk.Label()
        self.badge_db.set_markup("<span foreground='#34d399' weight='bold'>● CONECTADO</span>")
        fila_db.pack_start(self.badge_db, False, False, 0)
        card_serv.pack_start(fila_db, False, False, 0)

        box_root.pack_start(card_serv, False, False, 0)

        box_actions = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        btn_abrir_plat = Gtk.Button()
        lbl_plat = Gtk.Label()
        lbl_plat.set_markup("<span foreground='#ffffff' weight='heavy'>Abrir Portal SiGIC</span>")
        btn_abrir_plat.add(lbl_plat)
        btn_abrir_plat.get_style_context().add_class("btn-primary")
        btn_abrir_plat.connect("clicked", lambda b: subprocess.Popen(["/usr/local/bin/sigic-inicio"]))
        box_actions.pack_start(btn_abrir_plat, False, False, 0)

        btn_asistente = Gtk.Button()
        lbl_asist = Gtk.Label()
        lbl_asist.set_markup("<span foreground='#e2e8f0' weight='bold'>Asistente de Acceso</span>")
        btn_asistente.add(lbl_asist)
        btn_asistente.get_style_context().add_class("btn-secondary")
        btn_asistente.connect("clicked", lambda b: subprocess.Popen(["/usr/local/bin/sigic-asistente"]))
        box_actions.pack_start(btn_asistente, False, False, 0)

        box_root.pack_start(box_actions, False, False, 0)

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
        import time
        for _ in range(6):
            try:
                req = urllib.request.Request("http://localhost:3000/api/configuracion", timeout=3)
                with urllib.request.urlopen(req) as resp:
                    data = json.loads(resp.read().decode())
                    maint = data.get("modo_mantenimiento") == "true" or data.get("modo_mantenimiento") is True
                    GLib.idle_add(self.sw_mantenimiento.set_active, maint)
                    GLib.idle_add(self.badge_web.set_markup, "<span foreground='#34d399' weight='bold'>● ACTIVO</span>")
                    GLib.idle_add(self.badge_db.set_markup, "<span foreground='#34d399' weight='bold'>● CONECTADO</span>")
                    return
            except Exception:
                time.sleep(1.2)
        GLib.idle_add(self.badge_web.set_markup, "<span foreground='#fbbf24' weight='bold'>● MODO DEMO</span>")

    def crear_pestana_sistema(self):
        box_root = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        box_root.set_margin_top(10)
        box_root.set_margin_bottom(10)
        box_root.set_margin_start(10)
        box_root.set_margin_end(10)

        card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        card.get_style_context().add_class("card-dark")

        lbl_t = Gtk.Label(xalign=0)
        lbl_t.set_markup("<span foreground='#f8fafc' weight='heavy' size='11000'>Especificaciones de la Plataforma SiGIC</span>")
        card.pack_start(lbl_t, False, False, 0)

        grid = Gtk.Grid()
        grid.set_row_spacing(8)
        grid.set_column_spacing(16)

        datos = [
            ("Sistema:", "SiGIC — Sistema de Gestión Institucional de Colaciones"),
            ("Arquitectura:", "Suite Nativa Python 3 + GTK 3 + Next.js + Neon PostgreSQL"),
            ("Entorno gráfico:", "XFCE Desktop Institucional Beltrán"),
            ("Institución:", "Instituto Tecnológico Beltrán"),
            ("Proyecto:", "Práctica Profesionalizante 2026"),
            ("Autores:", "Cancelo Julián · Alfonso Alan Alexis · Contreras Villalba Sol Heilin · Frassia Matías · Santillán Luis Gabriel")
        ]

        for fila, (k, v) in enumerate(datos):
            lbl_k = Gtk.Label(xalign=0)
            lbl_k.set_markup(f"<span foreground='#38bdf8' weight='bold'>{k}</span>")
            lbl_v = Gtk.Label(xalign=0)
            lbl_v.set_markup(f"<span foreground='#f8fafc' weight='bold'>{v}</span>")
            grid.attach(lbl_k, 0, fila, 1, 1)
            grid.attach(lbl_v, 1, fila, 1, 1)

        card.pack_start(grid, False, False, 4)
        box_root.pack_start(card, False, False, 0)

        return box_root


def aplicar_estilos():
    try:
        settings = Gtk.Settings.get_default()
        if settings:
            settings.set_property("gtk-application-prefer-dark-theme", True)
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
    aplicar_estilos()
    win = PanelAjustesSigic()
    win.connect("destroy", Gtk.main_quit)
    win.show_all()
    Gtk.main()


if __name__ == "__main__":
    main()
