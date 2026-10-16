#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC — Control de Acreditación QR, Vinculación App Móvil de Portería y Seguridad
Réplica nativa GTK3 de ControlIngreso.jsx + GestionPorteria.jsx conectada a sigic_db.py
Instituto Tecnológico Beltrán — Práctica Profesionalizante 2026
"""

import gi
gi.require_version('Gtk', '3.0')
from gi.repository import Gtk, Gdk, GdkPixbuf, Pango
import sigic_db


def cargar_svg_pixbuf(svg_str, size=145):
    loader = GdkPixbuf.PixbufLoader.new_with_type('svg')
    loader.set_size(size, size)
    loader.write(svg_str.encode('utf-8'))
    loader.close()
    return loader.get_pixbuf()


class VentanaAcreditacion(Gtk.Window):
    def __init__(self):
        super().__init__(title="SiGIC — Acreditación QR y Portería Móvil")
        self.set_default_size(980, 560)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.get_style_context().add_class("sigic-window")

        self.ip_lan = sigic_db.obtener_ip_lan()
        self.url_api = f"http://{self.ip_lan}:3000/api"
        self.url_apk = f"http://{self.ip_lan}:3000/descargas/SIGIC-Porteria-1.0.5.apk"

        self.aplicar_estilos()
        self.crear_headerbar()

        root = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        root.set_margin_top(8)
        root.set_margin_bottom(8)
        root.set_margin_start(12)
        root.set_margin_end(12)
        self.add(root)

        # === FILA COMPACTA DE KPIs ===
        kpi_grid = Gtk.Grid(column_spacing=8, row_spacing=6, column_homogeneous=True)
        root.pack_start(kpi_grid, False, False, 0)

        self.lbl_kpi_acred = Gtk.Label(xalign=0)
        self.lbl_kpi_pend = Gtk.Label(xalign=0)
        self.lbl_kpi_acomp = Gtk.Label(xalign=0)
        self.lbl_kpi_movil = Gtk.Label(xalign=0)

        kpis = [
            ("GRADUADOS EN SALA", self.lbl_kpi_acred, "Ingresos validados", "kpi-emerald"),
            ("PENDIENTES PUERTA", self.lbl_kpi_pend, "Aguardando arribo", "kpi-amber"),
            ("ACOMPAÑANTES", self.lbl_kpi_acomp, "Familiares ingresados", "kpi-cyan"),
            ("MÓVILES EN LÍNEA", self.lbl_kpi_movil, "Celulares de portería", "kpi-violet"),
        ]
        for idx, (tit, lbl_val, sub, cls) in enumerate(kpis):
            box_k = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=1)
            box_k.get_style_context().add_class("kpi-box")
            box_k.get_style_context().add_class(cls)
            l_t = Gtk.Label(xalign=0)
            l_t.set_markup(f"<span font='8' weight='bold' foreground='#94a3b8'>{tit}</span>")
            l_s = Gtk.Label(xalign=0)
            l_s.set_markup(f"<span font='8' foreground='#64748b'>{sub}</span>")
            box_k.pack_start(l_t, False, False, 0)
            box_k.pack_start(lbl_val, False, False, 0)
            box_k.pack_start(l_s, False, False, 0)
            kpi_grid.attach(box_k, idx, 0, 1, 1)

        # === NOTEBOOK DE 3 SECCIONES OPERATIVAS ===
        self.notebook = Gtk.Notebook()
        root.pack_start(self.notebook, True, True, 0)

        self.notebook.append_page(
            self.construir_tab_escaner(),
            Gtk.Label(label="1. Escáner QR y Acreditación en Puerta")
        )
        self.notebook.append_page(
            self.construir_tab_conexion_movil(),
            Gtk.Label(label="2. Conexión App Móvil Portería (QR)")
        )
        self.notebook.append_page(
            self.construir_tab_personal_dispositivos(),
            Gtk.Label(label="3. Personal de Portería y Terminales")
        )

        # === PIE DE VENTANA ===
        footer = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=8)
        footer.get_style_context().add_class("footer-panel")
        root.pack_start(footer, False, False, 0)

        self.lbl_footer = Gtk.Label(xalign=0)
        footer.pack_start(self.lbl_footer, True, True, 0)

        btn_ir_movil = Gtk.Button(label="Vincular Celular QR")
        btn_ir_movil.get_style_context().add_class("btn-secondary")
        btn_ir_movil.connect("clicked", lambda _b: self.notebook.set_current_page(1))
        footer.pack_end(btn_ir_movil, False, False, 0)

        self.refrescar_todo()
        self.entry_scan.grab_focus()

    def aplicar_estilos(self):
        provider = Gtk.CssProvider()
        provider.load_from_data(sigic_db.CSS_SUITE_OSCURA)
        Gtk.StyleContext.add_provider_for_screen(
            Gdk.Screen.get_default(), provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
        )

    def crear_headerbar(self):
        hb = Gtk.HeaderBar()
        hb.set_show_close_button(True)
        hb.set_title("Control de Acreditación QR y Portería Móvil")
        hb.set_subtitle("SiGIC · Validación en Puerta, Enlace QR para App Móvil y Gestión de Operadores")
        hb.get_style_context().add_class("sigic-headerbar")
        self.set_titlebar(hb)

    # ------------------------------------------------------------------
    # PESTAÑA 1: ESCÁNER QR Y ACREDITACIÓN EN PUERTA
    # ------------------------------------------------------------------
    def construir_tab_escaner(self):
        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
        vbox.set_margin_top(8)

        # Panel de lectura QR / pistola USB + resultado inmediato
        top_split = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=8)
        vbox.pack_start(top_split, False, False, 0)

        scan_card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        scan_card.get_style_context().add_class("panel-card-active")
        scan_card.set_hexpand(True)

        lbl_sc = Gtk.Label(xalign=0)
        lbl_sc.set_markup(
            "<span font='10.5' weight='bold' foreground='#f8fafc'>LECTOR ÓPTICO QR / PISTOLA USB / BÚSQUEDA MANUAL</span>\n"
            "<span font='8.5' foreground='#38bdf8'>Escanee el QR del pase grupal o ingrese DNI, Legajo, Token OTP o Apellido:</span>"
        )
        scan_card.pack_start(lbl_sc, False, False, 0)

        hbox_in = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=6)
        self.entry_scan = Gtk.Entry()
        self.entry_scan.set_placeholder_text('DNI, Legajo (BEL-2026-104), Token OTP o JSON QR...')
        self.entry_scan.set_hexpand(True)
        self.entry_scan.connect("activate", self.on_acreditar_input)
        hbox_in.pack_start(self.entry_scan, True, True, 0)

        btn_val = Gtk.Button(label="Acreditar Grupo")
        btn_val.get_style_context().add_class("btn-emerald")
        btn_val.connect("clicked", self.on_acreditar_input)
        hbox_in.pack_start(btn_val, False, False, 0)

        btn_sel = Gtk.Button(label="Acreditar Seleccionado")
        btn_sel.get_style_context().add_class("btn-primary")
        btn_sel.connect("clicked", self.on_acreditar_seleccionado)
        hbox_in.pack_start(btn_sel, False, False, 0)

        btn_rev = Gtk.Button(label="Revertir")
        btn_rev.get_style_context().add_class("btn-danger")
        btn_rev.connect("clicked", self.on_revertir_seleccionado)
        hbox_in.pack_start(btn_rev, False, False, 0)

        scan_card.pack_start(hbox_in, False, False, 0)

        # Filtro rápido de tabla
        hbox_fil = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=6)
        lbl_f = Gtk.Label(label="Filtrar padrón:", xalign=0)
        lbl_f.get_style_context().add_class("field-label")
        self.cmb_filtro_acred = Gtk.ComboBoxText()
        for op in ["Todos los Graduados", "Pendientes de Ingreso", "Acreditados en Sala"]:
            self.cmb_filtro_acred.append_text(op)
        self.cmb_filtro_acred.set_active(0)
        self.cmb_filtro_acred.connect("changed", lambda _c: self.refrescar_todo())
        hbox_fil.pack_start(lbl_f, False, False, 0)
        hbox_fil.pack_start(self.cmb_filtro_acred, False, False, 0)
        scan_card.pack_start(hbox_fil, False, False, 0)

        top_split.pack_start(scan_card, True, True, 0)

        # Banner de resultado de acreditación
        self.banner_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=3)
        self.banner_box.get_style_context().add_class("banner-ok")
        self.banner_box.set_size_request(360, -1)

        self.lbl_res_titulo = Gtk.Label(xalign=0)
        self.lbl_res_titulo.set_markup(
            "<span font='10.5' weight='bold' foreground='#34d399'>TERMINAL DE PORTERÍA EN LÍNEA</span>"
        )
        self.lbl_res_detalle = Gtk.Label(xalign=0)
        self.lbl_res_detalle.set_line_wrap(True)
        self.lbl_res_detalle.set_max_width_chars(44)
        self.lbl_res_detalle.set_markup(
            "<span font='9' foreground='#e2e8f0'>Listo para validar credenciales QR o documentos en tiempo real.</span>"
        )
        self.banner_box.pack_start(self.lbl_res_titulo, False, False, 0)
        self.banner_box.pack_start(self.lbl_res_detalle, False, False, 0)
        top_split.pack_start(self.banner_box, False, False, 0)

        # Tabla de graduados y estado de ingreso
        table_card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=0)
        table_card.get_style_context().add_class("panel-card")
        vbox.pack_start(table_card, True, True, 0)

        # DNI, Nombre, Legajo, Carrera, Butaca, Grupo, Estado Ingreso, Hora, Token OTP
        self.store = Gtk.ListStore(str, str, str, str, str, str, str, str, str)
        self.tree = Gtk.TreeView(model=self.store)
        self.tree.connect("row-activated", lambda _t, _p, _c: self.on_acreditar_seleccionado(None))

        cols = [
            ("DNI", 0, 80),
            ("Apellido y Nombre", 1, 190),
            ("Legajo", 2, 100),
            ("Carrera", 3, 210),
            ("Butaca", 4, 65),
            ("Acomp.", 5, 70),
            ("Estado Puerta", 6, 105),
            ("Hora", 7, 75),
            ("Token OTP", 8, 80),
        ]
        for tit, idx, mw in cols:
            r = Gtk.CellRendererText()
            if idx in (1, 6):
                r.set_property("weight", Pango.Weight.BOLD)
            col = Gtk.TreeViewColumn(tit, r, text=idx)
            col.set_min_width(mw)
            col.set_resizable(True)
            col.set_sort_column_id(idx)
            self.tree.append_column(col)

        scroll = Gtk.ScrolledWindow()
        scroll.set_vexpand(True)
        scroll.add(self.tree)
        table_card.pack_start(scroll, True, True, 0)

        return vbox

    # ------------------------------------------------------------------
    # PESTAÑA 2: CONEXIÓN APP MÓVIL PORTERÍA (QR) — Idéntica a ControlIngreso.jsx + GestionPorteria.jsx
    # ------------------------------------------------------------------
    def construir_tab_conexion_movil(self):
        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
        vbox.set_margin_top(8)

        # Barra superior de configuración de IP LAN / Servidor API
        cfg_bar = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=8)
        cfg_bar.get_style_context().add_class("panel-card")

        lbl_ip = Gtk.Label(label="Dirección Servidor API Local / Red Wi-Fi:", xalign=0)
        lbl_ip.get_style_context().add_class("field-label")
        self.ent_url_api = Gtk.Entry()
        self.ent_url_api.set_text(self.url_api)
        self.ent_url_api.set_hexpand(True)

        btn_upd_qr = Gtk.Button(label="Actualizar Códigos QR de Enlace")
        btn_upd_qr.get_style_context().add_class("btn-primary")
        btn_upd_qr.connect("clicked", self.on_actualizar_qrs_moviles)

        cfg_bar.pack_start(lbl_ip, False, False, 0)
        cfg_bar.pack_start(self.ent_url_api, True, True, 0)
        cfg_bar.pack_start(btn_upd_qr, False, False, 0)
        vbox.pack_start(cfg_bar, False, False, 0)

        # 3 Tarjetas con QRs Reales (Paso 1: APK, Paso 2: sigic-config:, Paso 3: sigic-login:)
        grid_qrs = Gtk.Grid(column_spacing=10, row_spacing=8, column_homogeneous=True)
        grid_qrs.set_vexpand(True)
        vbox.pack_start(grid_qrs, True, True, 0)

        # --- TARJETA 1: DESCARGAR APK ---
        c1 = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        c1.get_style_context().add_class("panel-card")
        l1 = Gtk.Label()
        l1.set_justify(Gtk.Justification.CENTER)
        l1.set_markup(
            "<span font='8.5' weight='bold' foreground='#38bdf8'>PASO 1 · INSTALACIÓN ANDROID</span>\n"
            "<span font='11' weight='bold' foreground='#ffffff'>Descargar App SiGIC Accesos</span>"
        )
        c1.pack_start(l1, False, False, 0)

        qr_box1 = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=0)
        qr_box1.set_halign(Gtk.Align.CENTER)
        qr_box1.get_style_context().add_class("qr-frame-white")
        self.img_qr_apk = Gtk.Image()
        qr_box1.pack_start(self.img_qr_apk, False, False, 0)
        c1.pack_start(qr_box1, False, False, 2)

        l1_sub = Gtk.Label()
        l1_sub.set_justify(Gtk.Justification.CENTER)
        l1_sub.set_line_wrap(True)
        l1_sub.set_max_width_chars(30)
        l1_sub.set_markup(
            "<span font='8.5' foreground='#94a3b8'>Escanee con la cámara del celular para descargar <b>SIGIC-Porteria-1.0.5.apk</b></span>"
        )
        c1.pack_start(l1_sub, False, False, 0)
        grid_qrs.attach(c1, 0, 0, 1, 1)

        # --- TARJETA 2: CONECTAR SERVIDOR API (sigic-config:) ---
        c2 = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        c2.get_style_context().add_class("panel-card-active")
        l2 = Gtk.Label()
        l2.set_justify(Gtk.Justification.CENTER)
        l2.set_markup(
            "<span font='8.5' weight='bold' foreground='#34d399'>PASO 2 · ENLACE DE RED WI-FI</span>\n"
            "<span font='11' weight='bold' foreground='#ffffff'>Conectar Servidor API</span>"
        )
        c2.pack_start(l2, False, False, 0)

        qr_box2 = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=0)
        qr_box2.set_halign(Gtk.Align.CENTER)
        qr_box2.get_style_context().add_class("qr-frame-white")
        self.img_qr_srv = Gtk.Image()
        qr_box2.pack_start(self.img_qr_srv, False, False, 0)
        c2.pack_start(qr_box2, False, False, 2)

        self.lbl_qr_srv_url = Gtk.Label()
        self.lbl_qr_srv_url.set_justify(Gtk.Justification.CENTER)
        self.lbl_qr_srv_url.set_line_wrap(True)
        self.lbl_qr_srv_url.set_max_width_chars(30)
        c2.pack_start(self.lbl_qr_srv_url, False, False, 0)
        grid_qrs.attach(c2, 1, 0, 1, 1)

        # --- TARJETA 3: PASE QR DE OPERADOR (sigic-login:) ---
        c3 = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        c3.get_style_context().add_class("panel-card")
        l3 = Gtk.Label()
        l3.set_justify(Gtk.Justification.CENTER)
        l3.set_markup(
            "<span font='8.5' weight='bold' foreground='#c084fc'>PASO 3 · ACCESO SIN CONTRASEÑA</span>\n"
            "<span font='11' weight='bold' foreground='#ffffff'>Pase QR de Operador</span>"
        )
        c3.pack_start(l3, False, False, 0)

        self.cmb_op_qr = Gtk.ComboBoxText()
        self.cmb_op_qr.connect("changed", self.on_cambiar_operador_qr)
        c3.pack_start(self.cmb_op_qr, False, False, 0)

        qr_box3 = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=0)
        qr_box3.set_halign(Gtk.Align.CENTER)
        qr_box3.get_style_context().add_class("qr-frame-white")
        self.img_qr_login = Gtk.Image()
        qr_box3.pack_start(self.img_qr_login, False, False, 0)
        c3.pack_start(qr_box3, False, False, 2)

        self.lbl_qr_token = Gtk.Label()
        self.lbl_qr_token.set_justify(Gtk.Justification.CENTER)
        c3.pack_start(self.lbl_qr_token, False, False, 0)
        grid_qrs.attach(c3, 2, 0, 1, 1)

        return vbox

    # ------------------------------------------------------------------
    # PESTAÑA 3: PERSONAL DE PORTERÍA Y TERMINALES MÓVILES VINCULADAS
    # ------------------------------------------------------------------
    def construir_tab_personal_dispositivos(self):
        hbox = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=8)
        hbox.set_margin_top(8)

        # Mitad izquierda: Operadores y Permisos
        col_ops = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        col_ops.get_style_context().add_class("panel-card")
        col_ops.set_hexpand(True)

        lbl_op_h = Gtk.Label(xalign=0)
        lbl_op_h.set_markup(
            "<span font='10.5' weight='bold' foreground='#f8fafc'>PERSONAL Y PERMISOS DE PORTERÍA</span>\n"
            "<span font='8.5' foreground='#94a3b8'>Cuentas habilitadas para escaneo QR en la ceremonia activa</span>"
        )
        col_ops.pack_start(lbl_op_h, False, False, 0)

        # Alta rápida de operador
        bar_new_op = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=4)
        self.ent_op_nom = Gtk.Entry()
        self.ent_op_nom.set_placeholder_text("Nombre Operador...")
        self.ent_op_nom.set_hexpand(True)
        self.ent_op_mail = Gtk.Entry()
        self.ent_op_mail.set_placeholder_text("correo@ibeltran.com.ar")
        self.cmb_op_rol = Gtk.ComboBoxText()
        self.cmb_op_rol.append_text("PORTERIA")
        self.cmb_op_rol.append_text("ADMINISTRATIVO")
        self.cmb_op_rol.set_active(0)
        btn_add_op = Gtk.Button(label="+ Registrar")
        btn_add_op.get_style_context().add_class("btn-primary")
        btn_add_op.connect("clicked", self.on_crear_operador)

        bar_new_op.pack_start(self.ent_op_nom, True, True, 0)
        bar_new_op.pack_start(self.ent_op_mail, False, False, 0)
        bar_new_op.pack_start(self.cmb_op_rol, False, False, 0)
        bar_new_op.pack_start(btn_add_op, False, False, 0)
        col_ops.pack_start(bar_new_op, False, False, 0)

        # Tabla operadores: ID, Nombre, Email, Rol, Acceso Ceremonia, Estado
        self.store_ops = Gtk.ListStore(int, str, str, str, str, str)
        self.tree_ops = Gtk.TreeView(model=self.store_ops)
        for i, (tit, mw) in enumerate([("ID", 35), ("Operador", 145), ("Correo", 130), ("Rol", 85), ("Permiso", 85), ("Cuenta", 70)]):
            r = Gtk.CellRendererText()
            if i == 1:
                r.set_property("weight", Pango.Weight.BOLD)
            c = Gtk.TreeViewColumn(tit, r, text=i)
            c.set_min_width(mw)
            self.tree_ops.append_column(c)

        scr_ops = Gtk.ScrolledWindow()
        scr_ops.set_vexpand(True)
        scr_ops.add(self.tree_ops)
        col_ops.pack_start(scr_ops, True, True, 0)

        act_ops = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=6)
        btn_tog_auth = Gtk.Button(label="Alternar Permiso Ceremonia")
        btn_tog_auth.get_style_context().add_class("btn-emerald")
        btn_tog_auth.connect("clicked", self.on_toggle_permiso_op)
        btn_tog_act = Gtk.Button(label="Bloquear / Activar")
        btn_tog_act.get_style_context().add_class("btn-secondary")
        btn_tog_act.connect("clicked", self.on_toggle_activo_op)
        btn_del_op = Gtk.Button(label="Eliminar")
        btn_del_op.get_style_context().add_class("btn-danger")
        btn_del_op.connect("clicked", self.on_eliminar_op)
        act_ops.pack_start(btn_tog_auth, False, False, 0)
        act_ops.pack_start(btn_tog_act, False, False, 0)
        act_ops.pack_end(btn_del_op, False, False, 0)
        col_ops.pack_start(act_ops, False, False, 0)

        hbox.pack_start(col_ops, True, True, 0)

        # Mitad derecha: Terminales Móviles Vinculadas
        col_dev = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        col_dev.get_style_context().add_class("panel-card")
        col_dev.set_hexpand(True)

        lbl_dv_h = Gtk.Label(xalign=0)
        lbl_dv_h.set_markup(
            "<span font='10.5' weight='bold' foreground='#f8fafc'>DISPOSITIVOS MÓVILES VINCULADOS</span>\n"
            "<span font='8.5' foreground='#94a3b8'>Teléfonos conectados a SiGIC Accesos en tiempo real</span>"
        )
        col_dev.pack_start(lbl_dv_h, False, False, 0)

        bar_new_dv = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=4)
        self.ent_dv_nom = Gtk.Entry()
        self.ent_dv_nom.set_placeholder_text("Ej: Samsung S23 · Puerta Norte")
        self.ent_dv_nom.set_hexpand(True)
        self.ent_dv_mod = Gtk.Entry()
        self.ent_dv_mod.set_placeholder_text("Modelo (SM-S911B)")
        self.ent_dv_mod.set_width_chars(13)
        btn_add_dv = Gtk.Button(label="+ Vincular Terminal")
        btn_add_dv.get_style_context().add_class("btn-emerald")
        btn_add_dv.connect("clicked", self.on_vincular_dispositivo)
        bar_new_dv.pack_start(self.ent_dv_nom, True, True, 0)
        bar_new_dv.pack_start(self.ent_dv_mod, False, False, 0)
        bar_new_dv.pack_start(btn_add_dv, False, False, 0)
        col_dev.pack_start(bar_new_dv, False, False, 0)

        # Tabla dispositivos: ID, Terminal, Operador, IP, Estado
        self.store_devs = Gtk.ListStore(str, str, str, str, str)
        self.tree_devs = Gtk.TreeView(model=self.store_devs)
        for i, (tit, mw) in enumerate([("ID Terminal", 110), ("Equipo Móvil", 155), ("Operador", 130), ("IP Red", 95), ("Estado", 85)]):
            r = Gtk.CellRendererText()
            if i == 1:
                r.set_property("weight", Pango.Weight.BOLD)
            c = Gtk.TreeViewColumn(tit, r, text=i)
            c.set_min_width(mw)
            self.tree_devs.append_column(c)

        scr_devs = Gtk.ScrolledWindow()
        scr_devs.set_vexpand(True)
        scr_devs.add(self.tree_devs)
        col_dev.pack_start(scr_devs, True, True, 0)

        act_devs = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=6)
        btn_disc = Gtk.Button(label="Cerrar Sesión Remota del Dispositivo")
        btn_disc.get_style_context().add_class("btn-danger")
        btn_disc.connect("clicked", self.on_desvincular_dispositivo)
        act_devs.pack_end(btn_disc, False, False, 0)
        col_dev.pack_start(act_devs, False, False, 0)

        hbox.pack_start(col_dev, True, True, 0)
        return hbox

    # ------------------------------------------------------------------
    # LÓGICA DE ACTUALIZACIÓN Y EVENTOS
    # ------------------------------------------------------------------
    def refrescar_todo(self):
        grads = sigic_db.listar_graduados()
        filtro = self.cmb_filtro_acred.get_active_text() if hasattr(self, "cmb_filtro_acred") else "Todos los Graduados"

        self.store.clear()
        for g in grads:
            ac = g.get("acreditado", False)
            if filtro == "Pendientes de Ingreso" and ac:
                continue
            if filtro == "Acreditados en Sala" and not ac:
                continue
            invs = g.get("invitados", [])
            invs_pres = sum(1 for i in invs if i.get("presente"))
            self.store.append([
                g.get("dni", ""),
                g.get("nombre", ""),
                g.get("legajo", ""),
                g.get("carrera", ""),
                g.get("butaca", "Sin asignar"),
                f"{invs_pres}/{len(invs)} pres.",
                "PRESENTE" if ac else "PENDIENTE",
                g.get("hora_ingreso", "—") or "—",
                g.get("otp_codigo", "—") or "—"
            ])

        # Operadores
        ops = sigic_db.listar_operadores_porteria()
        self.store_ops.clear()
        self.cmb_op_qr.remove_all()
        for op in ops:
            self.store_ops.append([
                op.get("id", 0),
                op.get("nombre", ""),
                op.get("email", ""),
                op.get("rol", "PORTERIA"),
                "AUTORIZADO" if op.get("autorizado") else "SIN ACCESO",
                "ACTIVA" if op.get("activo") else "BLOQUEADA"
            ])
            self.cmb_op_qr.append_text(f"{op.get('nombre')} ({op.get('token')})")
        if ops:
            self.cmb_op_qr.set_active(0)

        # Dispositivos
        devs = sigic_db.listar_dispositivos_moviles()
        self.store_devs.clear()
        for d in devs:
            self.store_devs.append([
                d.get("dispositivoId", ""),
                d.get("nombreDispositivo", ""),
                d.get("usuarioNombre", ""),
                d.get("ipUltimoAcceso", ""),
                "EN LÍNEA" if d.get("enLinea") else "DESCONECTADO"
            ])

        # KPIs
        res = sigic_db.obtener_resumen_global()
        pend = max(0, res["total_graduados"] - res["acreditados"])
        self.lbl_kpi_acred.set_markup(f"<span font='15' weight='bold' foreground='#34d399'>{res['acreditados']} / {res['total_graduados']}</span>")
        self.lbl_kpi_pend.set_markup(f"<span font='15' weight='bold' foreground='#fbbf24'>{pend}</span>")
        self.lbl_kpi_acomp.set_markup(f"<span font='15' weight='bold' foreground='#38bdf8'>{res['acompanantes_presentes']} / {res['acompanantes']}</span>")
        self.lbl_kpi_movil.set_markup(f"<span font='15' weight='bold' foreground='#c084fc'>{res['dispositivos_online']} activos</span>")

        self.lbl_footer.set_markup(
            f"<span font='9' foreground='#94a3b8'>Ceremonia activa: <b>{res['ceremonia_activa'].get('nombre')}</b> · Servidor API móvil: <b>{self.url_api}</b></span>"
        )
        self.renderizar_qrs_moviles()

    def renderizar_qrs_moviles(self):
        svg_apk = sigic_db.generar_qr_svg(self.url_apk, size=140)
        self.img_qr_apk.set_from_pixbuf(cargar_svg_pixbuf(svg_apk, 140))

        payload_srv = f"sigic-config:{self.url_api}"
        svg_srv = sigic_db.generar_qr_svg(payload_srv, size=140)
        self.img_qr_srv.set_from_pixbuf(cargar_svg_pixbuf(svg_srv, 140))
        self.lbl_qr_srv_url.set_markup(
            f"<span font='8.5' foreground='#34d399'><b>{payload_srv}</b></span>"
        )

        self.on_cambiar_operador_qr(self.cmb_op_qr)

    def on_actualizar_qrs_moviles(self, _btn):
        nueva = self.ent_url_api.get_text().strip()
        if nueva:
            self.url_api = nueva
            base = nueva.replace("/api", "")
            self.url_apk = f"{base}/descargas/SIGIC-Porteria-1.0.5.apk"
            self.renderizar_qrs_moviles()

    def on_cambiar_operador_qr(self, cmb):
        ops = sigic_db.listar_operadores_porteria()
        idx = cmb.get_active()
        if idx is not None and 0 <= idx < len(ops):
            op = ops[idx]
            tk = op.get("token", "PORTERIA-TK01")
            payload = f"sigic-login:{tk}"
            svg_log = sigic_db.generar_qr_svg(payload, size=130)
            self.img_qr_login.set_from_pixbuf(cargar_svg_pixbuf(svg_log, 130))
            self.lbl_qr_token.set_markup(
                f"<span font='8' foreground='#cbd5e1'>Token: <b>{tk}</b></span>"
            )

    def mostrar_banner(self, estado, g):
        ctx = self.banner_box.get_style_context()
        for c in ("banner-ok", "banner-warn", "banner-err"):
            ctx.remove_class(c)

        if estado == "AUTORIZADO_NUEVO" and g:
            ctx.add_class("banner-ok")
            invs = len(g.get("invitados", []))
            self.lbl_res_titulo.set_markup(
                "<span font='10.5' weight='bold' foreground='#34d399'>INGRESO GRUPAL AUTORIZADO</span>"
            )
            self.lbl_res_detalle.set_markup(
                f"<span font='9.5' weight='bold' foreground='#ffffff'>{g['nombre']} (DNI {g['dni']})</span>\n"
                f"<span font='8.5' foreground='#a7f3d0'>Butaca: <b>{g.get('butaca', 'S/A')}</b> · Acompañantes: <b>{invs}</b> · Hora: {g.get('hora_ingreso')}</span>"
            )
        elif estado == "YA_ACREDITADO" and g:
            ctx.add_class("banner-warn")
            self.lbl_res_titulo.set_markup(
                "<span font='10.5' weight='bold' foreground='#fbbf24'>ATENCIÓN: CREDENCIAL YA UTILIZADA</span>"
            )
            self.lbl_res_detalle.set_markup(
                f"<span font='9.5' weight='bold' foreground='#ffffff'>{g['nombre']}</span>\n"
                f"<span font='8.5' foreground='#fde68a'>Ya registró ingreso a las {g.get('hora_ingreso')} (Butaca {g.get('butaca')}).</span>"
            )
        else:
            ctx.add_class("banner-err")
            self.lbl_res_titulo.set_markup(
                "<span font='10.5' weight='bold' foreground='#fb7185'>CÓDIGO O DNI NO ENCONTRADO</span>"
            )
            self.lbl_res_detalle.set_markup(
                "<span font='8.5' foreground='#fecdd3'>Verifique el código QR, Token OTP o número de documento.</span>"
            )

    def on_acreditar_input(self, _widget):
        q = self.entry_scan.get_text().strip()
        if not q:
            return
        est, g = sigic_db.acreditar_graduado(q)
        self.mostrar_banner(est, g)
        self.entry_scan.set_text("")
        self.refrescar_todo()

    def on_acreditar_seleccionado(self, _btn):
        sel = self.tree.get_selection()
        model, it = sel.get_selected()
        if not it:
            return
        dni = model[it][0]
        est, g = sigic_db.acreditar_graduado(dni)
        self.mostrar_banner(est, g)
        self.refrescar_todo()

    def on_revertir_seleccionado(self, _btn):
        sel = self.tree.get_selection()
        model, it = sel.get_selected()
        if not it:
            return
        dni = model[it][0]
        sigic_db.cambiar_acreditacion(dni, False)
        self.refrescar_todo()

    def on_crear_operador(self, _btn):
        nom = self.ent_op_nom.get_text().strip()
        mail = self.ent_op_mail.get_text().strip()
        rol = self.cmb_op_rol.get_active_text() or "PORTERIA"
        if nom and mail:
            sigic_db.crear_operador_porteria(nom, mail, rol)
            self.ent_op_nom.set_text("")
            self.ent_op_mail.set_text("")
            self.refrescar_todo()

    def on_toggle_permiso_op(self, _btn):
        sel = self.tree_ops.get_selection()
        m, it = sel.get_selected()
        if it:
            sigic_db.alternar_autorizacion_operador(m[it][0])
            self.refrescar_todo()

    def on_toggle_activo_op(self, _btn):
        sel = self.tree_ops.get_selection()
        m, it = sel.get_selected()
        if it:
            sigic_db.alternar_activo_operador(m[it][0])
            self.refrescar_todo()

    def on_eliminar_op(self, _btn):
        sel = self.tree_ops.get_selection()
        m, it = sel.get_selected()
        if it:
            sigic_db.eliminar_operador_porteria(m[it][0])
            self.refrescar_todo()

    def on_vincular_dispositivo(self, _btn):
        nom = self.ent_dv_nom.get_text().strip()
        mod = self.ent_dv_mod.get_text().strip()
        if nom:
            ops = sigic_db.listar_operadores_porteria()
            op_nom = ops[0].get("nombre") if ops else "Operador Portería"
            sigic_db.vincular_dispositivo_movil(nom, mod or "Android QR", op_nom)
            self.ent_dv_nom.set_text("")
            self.ent_dv_mod.set_text("")
            self.refrescar_todo()

    def on_desvincular_dispositivo(self, _btn):
        sel = self.tree_devs.get_selection()
        m, it = sel.get_selected()
        if it:
            sigic_db.desvincular_dispositivo_movil(m[it][0])
            self.refrescar_todo()


if __name__ == "__main__":
    win = VentanaAcreditacion()
    win.connect("destroy", Gtk.main_quit)
    win.show_all()
    Gtk.main()
