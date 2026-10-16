#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC — Convocatoria, Despacho de Invitaciones, Tokens OTP y Emisión de Credenciales QR
Réplica nativa GTK3 de GestionConvocatoria.jsx + DespachoCredenciales.jsx conectada a sigic_db.py
Instituto Tecnológico Beltrán — Práctica Profesionalizante 2026
"""

import gi
gi.require_version('Gtk', '3.0')
from gi.repository import Gtk, Gdk, Pango
import sigic_db


class DialogoSMTP(Gtk.Dialog):
    """Configuración del servidor SMTP para despacho de invitaciones y credenciales."""
    def __init__(self, parent):
        super().__init__(title="Configuración de Servidor de Correo SMTP", transient_for=parent, flags=0)
        self.add_buttons("Cancelar", Gtk.ResponseType.CANCEL, "Guardar SMTP", Gtk.ResponseType.OK)
        self.set_default_size(480, 320)
        self.set_border_width(12)

        btn_ok = self.get_widget_for_response(Gtk.ResponseType.OK)
        if btn_ok:
            btn_ok.get_style_context().add_class("btn-primary")

        box = self.get_content_area()
        box.set_spacing(8)

        cfg = sigic_db.cargar_db().get("smtp", {})
        grid = Gtk.Grid(column_spacing=10, row_spacing=8)
        box.pack_start(grid, True, True, 0)

        self.ent_host = Gtk.Entry(text=cfg.get("host", "smtp.gmail.com"))
        self.ent_host.set_hexpand(True)
        self.ent_port = Gtk.Entry(text=str(cfg.get("port", "587")))
        self.ent_user = Gtk.Entry(text=cfg.get("user", "colaciones@ibeltran.com.ar"))
        self.ent_pass = Gtk.Entry(text=cfg.get("password", ""))
        self.ent_pass.set_visibility(False)
        self.ent_from = Gtk.Entry(text=cfg.get("from_email", "Colaciones Instituto Beltrán <colaciones@ibeltran.com.ar>"))
        self.ent_asunto = Gtk.Entry(text=cfg.get("asunto", "Invitación Oficial al Acto de Colación 2026"))

        campos = [
            ("Servidor SMTP Host:", self.ent_host),
            ("Puerto TLS/SSL:", self.ent_port),
            ("Usuario SMTP:", self.ent_user),
            ("Contraseña / App Key:", self.ent_pass),
            ("Remitente Visible:", self.ent_from),
            ("Asunto Institucional:", self.ent_asunto),
        ]
        for i, (et, w) in enumerate(campos):
            l = Gtk.Label(label=et, xalign=0)
            l.get_style_context().add_class("field-label")
            grid.attach(l, 0, i, 1, 1)
            grid.attach(w, 1, i, 1, 1)

        self.show_all()

    def guardar(self):
        data = sigic_db.cargar_db()
        data["smtp"] = {
            "host": self.ent_host.get_text().strip(),
            "port": self.ent_port.get_text().strip(),
            "user": self.ent_user.get_text().strip(),
            "password": self.ent_pass.get_text().strip(),
            "from_email": self.ent_from.get_text().strip(),
            "asunto": self.ent_asunto.get_text().strip(),
        }
        sigic_db.guardar_db(data)


class VentanaConvocatoria(Gtk.Window):
    def __init__(self):
        super().__init__(title="SiGIC — Convocatoria, Tokens OTP y Despacho de Credenciales")
        self.set_default_size(980, 560)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.get_style_context().add_class("sigic-window")

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

        self.lbl_kpi_env = Gtk.Label(xalign=0)
        self.lbl_kpi_pend = Gtk.Label(xalign=0)
        self.lbl_kpi_conf = Gtk.Label(xalign=0)
        self.lbl_kpi_cred = Gtk.Label(xalign=0)

        kpis = [
            ("INVITACIONES ENVIADAS", self.lbl_kpi_env, "Con código OTP activo", "kpi-cyan"),
            ("POR INVITAR", self.lbl_kpi_pend, "Pendientes de despacho", "kpi-amber"),
            ("CONFIRMADOS", self.lbl_kpi_conf, "Asistencia confirmada", "kpi-emerald"),
            ("CREDENCIALES QR", self.lbl_kpi_cred, "Pases grupales emitidos", "kpi-violet"),
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

        # === BARRA DE SEGMENTACIÓN Y ACCIONES DE DESPACHO ===
        toolbar = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=6)
        toolbar.get_style_context().add_class("panel-card")
        root.pack_start(toolbar, False, False, 0)

        self.entry_buscar = Gtk.Entry()
        self.entry_buscar.set_placeholder_text("Buscar por Nombre, DNI, Correo o Token OTP...")
        self.entry_buscar.set_hexpand(True)
        self.entry_buscar.connect("changed", lambda _e: self.refrescar_vista())
        toolbar.pack_start(self.entry_buscar, True, True, 0)

        self.cmb_segmento = Gtk.ComboBoxText()
        for seg in ["Todos los Graduados", "Por Invitar (Pendientes)", "Sin Respuesta (Invitados)", "Confirmados / Aceptados", "Credenciales QR Enviadas"]:
            self.cmb_segmento.append_text(seg)
        self.cmb_segmento.set_active(0)
        self.cmb_segmento.connect("changed", lambda _c: self.refrescar_vista())
        toolbar.pack_start(self.cmb_segmento, False, False, 0)

        btn_env_uno = Gtk.Button(label="Enviar Invitación / OTP")
        btn_env_uno.get_style_context().add_class("btn-primary")
        btn_env_uno.connect("clicked", self.on_enviar_individual)
        toolbar.pack_start(btn_env_uno, False, False, 0)

        btn_env_todos = Gtk.Button(label="Despachar Pendientes")
        btn_env_todos.get_style_context().add_class("btn-emerald")
        btn_env_todos.connect("clicked", self.on_despachar_pendientes)
        toolbar.pack_start(btn_env_todos, False, False, 0)

        btn_cred_masivo = Gtk.Button(label="Emitir Credenciales QR a Confirmados")
        btn_cred_masivo.get_style_context().add_class("btn-secondary")
        btn_cred_masivo.connect("clicked", self.on_despachar_credenciales_masivo)
        toolbar.pack_start(btn_cred_masivo, False, False, 0)

        # === TABLA DE CONVOCATORIA ===
        table_card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=0)
        table_card.get_style_context().add_class("panel-card")
        root.pack_start(table_card, True, True, 0)

        # DNI, Nombre, Correo, Carrera, Estado, Token OTP, Último Despacho, Credencial QR, Butaca
        self.store = Gtk.ListStore(str, str, str, str, str, str, str, str, str)
        self.tree = Gtk.TreeView(model=self.store)

        cols = [
            ("DNI", 0, 78),
            ("Graduado/a", 1, 175),
            ("Correo Institucional", 2, 185),
            ("Carrera", 3, 180),
            ("Estado", 4, 95),
            ("Token OTP", 5, 78),
            ("Fecha Envío", 6, 105),
            ("Pase QR", 7, 80),
            ("Butaca", 8, 60),
        ]
        for tit, idx, mw in cols:
            r = Gtk.CellRendererText()
            if idx in (1, 4, 5):
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

        # === PIE DE ACCIONES RÁPIDAS (CONFIRMACIÓN MANUAL / OTP / SMTP) ===
        footer = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=6)
        footer.get_style_context().add_class("footer-panel")
        root.pack_start(footer, False, False, 0)

        self.lbl_status = Gtk.Label(xalign=0)
        footer.pack_start(self.lbl_status, True, True, 0)

        btn_smtp = Gtk.Button(label="Configurar SMTP")
        btn_smtp.get_style_context().add_class("btn-secondary")
        btn_smtp.connect("clicked", self.on_configurar_smtp)
        footer.pack_end(btn_smtp, False, False, 0)

        btn_rechazar = Gtk.Button(label="Marcar Rechazado")
        btn_rechazar.get_style_context().add_class("btn-danger")
        btn_rechazar.connect("clicked", lambda _b: self.on_cambiar_estado_sel("RECHAZADO"))
        footer.pack_end(btn_rechazar, False, False, 0)

        btn_confirmar = Gtk.Button(label="Confirmar Asistencia Manual / OTP")
        btn_confirmar.get_style_context().add_class("btn-emerald")
        btn_confirmar.connect("clicked", lambda _b: self.on_cambiar_estado_sel("CONFIRMADO"))
        footer.pack_end(btn_confirmar, False, False, 0)

        self.refrescar_vista()

    def aplicar_estilos(self):
        provider = Gtk.CssProvider()
        provider.load_from_data(sigic_db.CSS_SUITE_OSCURA)
        Gtk.StyleContext.add_provider_for_screen(
            Gdk.Screen.get_default(), provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
        )

    def crear_headerbar(self):
        hb = Gtk.HeaderBar()
        hb.set_show_close_button(True)
        hb.set_title("Convocatoria, Despacho de Invitaciones OTP y Credenciales QR")
        hb.set_subtitle("SiGIC · Notificaciones por Correo, Validación de Asistencia y Emisión Masiva")
        hb.get_style_context().add_class("sigic-headerbar")
        self.set_titlebar(hb)

    def obtener_dni_sel(self):
        sel = self.tree.get_selection()
        m, it = sel.get_selected()
        if it:
            return m[it][0]
        grads = sigic_db.listar_graduados()
        return grads[0]["dni"] if grads else None

    def refrescar_vista(self):
        grads = sigic_db.listar_graduados()
        q = self.entry_buscar.get_text().strip().lower()
        seg = self.cmb_segmento.get_active_text()

        self.store.clear()
        vis = 0
        cred_count = 0

        for g in grads:
            if g.get("credencial_enviada"):
                cred_count += 1
            est = g.get("estado", "PENDIENTE")
            if seg == "Por Invitar (Pendientes)" and est != "PENDIENTE":
                continue
            if seg == "Sin Respuesta (Invitados)" and est != "INVITADO":
                continue
            if seg == "Confirmados / Aceptados" and est not in ("CONFIRMADO", "ACEPTADO"):
                continue
            if seg == "Credenciales QR Enviadas" and not g.get("credencial_enviada"):
                continue
            if q:
                blob = f"{g.get('dni','')} {g.get('nombre','')} {g.get('correo','')} {g.get('otp_codigo','')}".lower()
                if q not in blob:
                    continue

            self.store.append([
                g.get("dni", ""),
                g.get("nombre", ""),
                g.get("correo", "—"),
                g.get("carrera", ""),
                est,
                g.get("otp_codigo", "—") or "—",
                g.get("fecha_invitacion", "—") or "—",
                "EMITIDA" if g.get("credencial_enviada") else "PENDIENTE",
                g.get("butaca", "Sin asignar"),
            ])
            vis += 1

        res = sigic_db.obtener_resumen_global()
        self.lbl_kpi_env.set_markup(f"<span font='15' weight='bold' foreground='#38bdf8'>{res['invitados_env']} / {res['total_graduados']}</span>")
        self.lbl_kpi_pend.set_markup(f"<span font='15' weight='bold' foreground='#fbbf24'>{res['pendientes_env']}</span>")
        self.lbl_kpi_conf.set_markup(f"<span font='15' weight='bold' foreground='#34d399'>{res['aceptados']}</span>")
        self.lbl_kpi_cred.set_markup(f"<span font='15' weight='bold' foreground='#c084fc'>{cred_count} enviadas</span>")

        smtp_host = sigic_db.cargar_db().get("smtp", {}).get("host", "smtp.gmail.com")
        self.lbl_status.set_markup(
            f"<span font='9' foreground='#94a3b8'>Mostrando <b>{vis}</b> graduados · Servidor SMTP: <b>{smtp_host}</b></span>"
        )

    def on_enviar_individual(self, _btn):
        dni = self.obtener_dni_sel()
        if not dni:
            return
        ok, otp = sigic_db.despachar_invitacion(dni)
        self.refrescar_vista()
        if ok:
            self.lbl_status.set_markup(
                f"<span font='9' weight='bold' foreground='#34d399'>Invitación enviada a DNI {dni} · Token OTP generado: {otp}</span>"
            )

    def on_despachar_pendientes(self, _btn):
        n = sigic_db.despachar_pendientes()
        self.refrescar_vista()
        self.lbl_status.set_markup(
            f"<span font='9' weight='bold' foreground='#34d399'>Despacho masivo completado: {n} invitaciones y tokens OTP enviados.</span>"
        )

    def on_despachar_credenciales_masivo(self, _btn):
        n = sigic_db.despachar_credenciales_masivo()
        self.refrescar_vista()
        self.lbl_status.set_markup(
            f"<span font='9' weight='bold' foreground='#38bdf8'>Se emitieron y despacharon {n} Credenciales Digitales QR.</span>"
        )

    def on_cambiar_estado_sel(self, nuevo_estado):
        dni = self.obtener_dni_sel()
        if not dni:
            return
        g = sigic_db.obtener_graduado_por_dni(dni)
        if g:
            g["estado"] = nuevo_estado
            sigic_db.guardar_graduado(g, dni_original=dni)
            self.refrescar_vista()
            self.lbl_status.set_markup(
                f"<span font='9' weight='bold' foreground='#34d399'>Estado de {g['nombre']} actualizado a {nuevo_estado}.</span>"
            )

    def on_configurar_smtp(self, _btn):
        dlg = DialogoSMTP(self)
        if dlg.run() == Gtk.ResponseType.OK:
            dlg.guardar()
            self.refrescar_vista()
        dlg.destroy()


if __name__ == "__main__":
    win = VentanaConvocatoria()
    win.connect("destroy", Gtk.main_quit)
    win.show_all()
    Gtk.main()
