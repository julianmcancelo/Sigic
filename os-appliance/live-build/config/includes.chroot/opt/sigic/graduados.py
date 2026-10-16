#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC — Gestión de Padrón de Graduados, Acompañantes, Entregadores y Credencial Digital QR
Conectado en tiempo real a sigic_db.py
Instituto Tecnológico Beltrán — Práctica Profesionalizante 2026
"""

import gi
gi.require_version('Gtk', '3.0')
from gi.repository import Gtk, Gdk, GdkPixbuf, Pango
import os
import csv
import sigic_db


def cargar_svg_pixbuf(svg_str, size=165):
    loader = GdkPixbuf.PixbufLoader.new_with_type('svg')
    loader.set_size(size, size)
    loader.write(svg_str.encode('utf-8'))
    loader.close()
    return loader.get_pixbuf()


class DialogoGraduado(Gtk.Dialog):
    """Formulario modal para alta o edición de un graduado."""
    def __init__(self, parent, datos_existentes=None):
        titulo = "Editar Ficha del Graduado" if datos_existentes else "Registrar Nuevo Graduado en Padrón"
        super().__init__(title=titulo, transient_for=parent, flags=0)
        self.add_buttons(
            "Cancelar", Gtk.ResponseType.CANCEL,
            "Guardar Graduado", Gtk.ResponseType.OK
        )
        self.set_default_size(540, 470)
        self.set_border_width(14)

        btn_ok = self.get_widget_for_response(Gtk.ResponseType.OK)
        if btn_ok:
            btn_ok.get_style_context().add_class("btn-primary")

        box = self.get_content_area()
        box.set_spacing(10)

        lbl_head = Gtk.Label(xalign=0)
        lbl_head.set_markup(
            f"<span font='13' weight='bold' foreground='#f8fafc'>{titulo}</span>\n"
            "<span font='9.5' foreground='#94a3b8'>Complete los datos académicos, contacto, butaca y estado de confirmación.</span>"
        )
        box.pack_start(lbl_head, False, False, 4)

        grid = Gtk.Grid(column_spacing=12, row_spacing=10)
        box.pack_start(grid, True, True, 4)

        d = datos_existentes or {}

        self.ent_dni = Gtk.Entry()
        self.ent_dni.set_placeholder_text("Ej: 42123456")
        self.ent_dni.set_text(d.get("dni", ""))

        self.ent_nombre = Gtk.Entry()
        self.ent_nombre.set_placeholder_text("Ej: Apellido, Nombre Completo")
        self.ent_nombre.set_text(d.get("nombre", ""))
        self.ent_nombre.set_hexpand(True)

        self.ent_legajo = Gtk.Entry()
        self.ent_legajo.set_placeholder_text("Ej: BEL-2026-115")
        self.ent_legajo.set_text(d.get("legajo", ""))

        self.ent_correo = Gtk.Entry()
        self.ent_correo.set_placeholder_text("graduado@ibeltran.edu.ar")
        self.ent_correo.set_text(d.get("correo", ""))

        self.ent_telefono = Gtk.Entry()
        self.ent_telefono.set_placeholder_text("11-4000-0000")
        self.ent_telefono.set_text(d.get("telefono", ""))

        self.cmb_carrera = Gtk.ComboBoxText()
        carrera_actual = d.get("carrera", sigic_db.CARRERAS_BELTRAN[0])
        idx_c = 0
        for i, c in enumerate(sigic_db.CARRERAS_BELTRAN):
            self.cmb_carrera.append_text(c)
            if c == carrera_actual:
                idx_c = i
        self.cmb_carrera.set_active(idx_c)

        self.ent_promedio = Gtk.Entry()
        self.ent_promedio.set_placeholder_text("Ej: 8.75")
        self.ent_promedio.set_text(str(d.get("promedio", "8.50")))

        self.cmb_estado = Gtk.ComboBoxText()
        estados = ["PENDIENTE", "INVITADO", "ACEPTADO", "CONFIRMADO", "RECHAZADO"]
        est_actual = d.get("estado", "CONFIRMADO")
        idx_e = 0
        for i, est in enumerate(estados):
            self.cmb_estado.append_text(est)
            if est == est_actual:
                idx_e = i
        self.cmb_estado.set_active(idx_e)

        self.ent_butaca = Gtk.Entry()
        self.ent_butaca.set_placeholder_text("Ej: A5 o Sin asignar")
        self.ent_butaca.set_text(d.get("butaca", "Sin asignar"))

        self.cmb_entregador = Gtk.ComboBoxText()
        profs = [p.get("nombre") for p in sigic_db.cargar_db().get("profesores", [])]
        opciones_ent = ["Sin asignar"] + profs + ["Familiar / Acompañante Directo"]
        ent_actual = d.get("entregador", "Sin asignar")
        if ent_actual not in opciones_ent:
            opciones_ent.append(ent_actual)
        idx_ent = 0
        for i, op in enumerate(opciones_ent):
            self.cmb_entregador.append_text(op)
            if op == ent_actual:
                idx_ent = i
        self.cmb_entregador.set_active(idx_ent)

        campos = [
            ("DNI / Documento (*):", self.ent_dni),
            ("Apellido y Nombre (*):", self.ent_nombre),
            ("Legajo Institucional:", self.ent_legajo),
            ("Correo Electrónico:", self.ent_correo),
            ("Teléfono Móvil:", self.ent_telefono),
            ("Carrera / Tecnicatura:", self.cmb_carrera),
            ("Promedio Académico:", self.ent_promedio),
            ("Estado de Asistencia:", self.cmb_estado),
            ("Butaca Asignada:", self.ent_butaca),
            ("Entregador de Diploma:", self.cmb_entregador),
        ]

        for idx, (etiqueta, widget) in enumerate(campos):
            lbl = Gtk.Label(label=etiqueta, xalign=0)
            lbl.get_style_context().add_class("field-label")
            grid.attach(lbl, 0, idx, 1, 1)
            grid.attach(widget, 1, idx, 1, 1)

        self.show_all()

    def obtener_datos(self):
        return {
            "dni": self.ent_dni.get_text().strip(),
            "nombre": self.ent_nombre.get_text().strip(),
            "legajo": self.ent_legajo.get_text().strip(),
            "correo": self.ent_correo.get_text().strip(),
            "telefono": self.ent_telefono.get_text().strip(),
            "carrera": self.cmb_carrera.get_active_text() or sigic_db.CARRERAS_BELTRAN[0],
            "promedio": self.ent_promedio.get_text().strip() or "8.00",
            "estado": self.cmb_estado.get_active_text() or "PENDIENTE",
            "butaca": self.ent_butaca.get_text().strip() or "Sin asignar",
            "entregador": self.cmb_entregador.get_active_text() or "Sin asignar",
        }


class DialogoInvitadosEntregador(Gtk.Dialog):
    """Modal para gestionar acompañantes (alta/baja con DNI y parentesco) y entregador de diploma."""
    def __init__(self, parent, graduado):
        super().__init__(
            title=f"Grupo Familiar y Entregador — {graduado.get('nombre', '')}",
            transient_for=parent,
            flags=0
        )
        self.add_buttons("Guardar y Cerrar", Gtk.ResponseType.OK)
        self.set_default_size(640, 480)
        self.set_border_width(14)
        self.graduado = graduado
        self.invitados = list(graduado.get("invitados", []))

        btn_ok = self.get_widget_for_response(Gtk.ResponseType.OK)
        if btn_ok:
            btn_ok.get_style_context().add_class("btn-primary")

        box = self.get_content_area()
        box.set_spacing(10)

        head = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=3)
        lbl_t = Gtk.Label(xalign=0)
        lbl_t.set_markup(
            f"<span font='13' weight='bold' foreground='#f8fafc'>Acompañantes y Entregador de Diploma</span>\n"
            f"<span font='9.5' foreground='#38bdf8'>Graduado/a: {graduado.get('nombre')} · DNI {graduado.get('dni')} · Butaca {graduado.get('butaca', 'S/A')}</span>"
        )
        head.pack_start(lbl_t, False, False, 0)
        box.pack_start(head, False, False, 0)

        # Selector de entregador
        card_ent = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        card_ent.get_style_context().add_class("panel-card")
        lbl_e = Gtk.Label(label="Docente / Familiar que entrega el Diploma:", xalign=0)
        lbl_e.get_style_context().add_class("field-label")
        self.cmb_ent = Gtk.ComboBoxText()
        profs = [p.get("nombre") for p in sigic_db.cargar_db().get("profesores", [])]
        opciones = ["Sin asignar"] + profs + ["Familiar / Acompañante en Escenario"]
        actual_ent = graduado.get("entregador", "Sin asignar")
        if actual_ent not in opciones:
            opciones.append(actual_ent)
        for i, op in enumerate(opciones):
            self.cmb_ent.append_text(op)
            if op == actual_ent:
                self.cmb_ent.set_active(i)
        card_ent.pack_start(lbl_e, False, False, 0)
        card_ent.pack_start(self.cmb_ent, True, True, 0)
        box.pack_start(card_ent, False, False, 0)

        # Formulario para agregar acompañante
        card_add = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=8)
        card_add.get_style_context().add_class("panel-card")
        self.ent_inv_nom = Gtk.Entry()
        self.ent_inv_nom.set_placeholder_text("Apellido y Nombre del Acompañante...")
        self.ent_inv_nom.set_hexpand(True)
        self.ent_inv_dni = Gtk.Entry()
        self.ent_inv_dni.set_placeholder_text("DNI")
        self.ent_inv_dni.set_width_chars(11)
        self.cmb_parentesco = Gtk.ComboBoxText()
        for p in ["Padre / Madre", "Pareja / Cónyuge", "Hermano/a", "Hijo/a", "Abuelo/a", "Familiar / Invitado"]:
            self.cmb_parentesco.append_text(p)
        self.cmb_parentesco.set_active(0)

        btn_add = Gtk.Button(label="+ Agregar Acompañante")
        btn_add.get_style_context().add_class("btn-emerald")
        btn_add.connect("clicked", self.on_agregar_invitado)

        card_add.pack_start(self.ent_inv_nom, True, True, 0)
        card_add.pack_start(self.ent_inv_dni, False, False, 0)
        card_add.pack_start(self.cmb_parentesco, False, False, 0)
        card_add.pack_start(btn_add, False, False, 0)
        box.pack_start(card_add, False, False, 0)

        # Tabla de acompañantes registrados
        self.store = Gtk.ListStore(str, str, str, str)
        self.tree = Gtk.TreeView(model=self.store)
        for i, (tit, w) in enumerate([("Nombre del Acompañante", 250), ("DNI", 110), ("Vínculo", 130), ("Estado Ingreso", 110)]):
            r = Gtk.CellRendererText()
            if i == 0:
                r.set_property("weight", Pango.Weight.BOLD)
            col = Gtk.TreeViewColumn(tit, r, text=i)
            col.set_min_width(w)
            self.tree.append_column(col)

        scroll = Gtk.ScrolledWindow()
        scroll.set_vexpand(True)
        scroll.add(self.tree)
        box.pack_start(scroll, True, True, 0)

        bar_bot = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=8)
        self.lbl_cupo = Gtk.Label(xalign=0)
        btn_del = Gtk.Button(label="Quitar Acompañante Seleccionado")
        btn_del.get_style_context().add_class("btn-danger")
        btn_del.connect("clicked", self.on_quitar_invitado)
        bar_bot.pack_start(self.lbl_cupo, True, True, 0)
        bar_bot.pack_end(btn_del, False, False, 0)
        box.pack_start(bar_bot, False, False, 0)

        self.refrescar_tabla()
        self.show_all()

    def refrescar_tabla(self):
        self.store.clear()
        for inv in self.invitados:
            est = "PRESENTE" if inv.get("presente") else "HABILITADO"
            self.store.append([
                inv.get("nombre", ""),
                inv.get("dni", "—"),
                inv.get("parentesco", "Familiar"),
                est
            ])
        self.lbl_cupo.set_markup(
            f"<span font='9.5' foreground='#94a3b8'>Acompañantes registrados en el pase grupal: <b>{len(self.invitados)}</b></span>"
        )

    def on_agregar_invitado(self, _btn):
        nom = self.ent_inv_nom.get_text().strip()
        dni = self.ent_inv_dni.get_text().strip()
        par = self.cmb_parentesco.get_active_text() or "Familiar"
        if not nom:
            return
        self.invitados.append({
            "nombre": nom,
            "dni": dni or "S/D",
            "parentesco": par,
            "presente": False
        })
        self.ent_inv_nom.set_text("")
        self.ent_inv_dni.set_text("")
        self.refrescar_tabla()

    def on_quitar_invitado(self, _btn):
        sel = self.tree.get_selection()
        model, treeiter = sel.get_selected()
        if treeiter:
            path = model.get_path(treeiter)
            idx = path.get_indices()[0]
            if 0 <= idx < len(self.invitados):
                self.invitados.pop(idx)
                self.refrescar_tabla()


class DialogoCredencialQR(Gtk.Dialog):
    """Réplica nativa GTK3 del ModalCredencial.jsx con código QR real escaneable."""
    def __init__(self, parent, graduado):
        super().__init__(
            title=f"Credencial Digital & Pase Grupal — {graduado.get('nombre', '')}",
            transient_for=parent,
            flags=0
        )
        self.set_default_size(690, 440)
        self.set_border_width(14)
        self.graduado = graduado

        box = self.get_content_area()
        box.set_spacing(12)

        # Cabecera modal
        head = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        lbl_h = Gtk.Label(xalign=0)
        lbl_h.set_markup(
            "<span font='8.5' weight='bold' foreground='#34d399'>PADRÓN OFICIAL HABILITADO · PASE GRUPAL QR</span>\n"
            "<span font='14' weight='bold' foreground='#f8fafc'>Credencial Digital e Ingreso a Colación</span>"
        )
        head.pack_start(lbl_h, True, True, 0)
        box.pack_start(head, False, False, 0)

        # Tarjeta de credencial (2 columnas: datos a la izquierda, QR escaneable a la derecha)
        card = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=18)
        card.get_style_context().add_class("panel-card-active")

        col_izq = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
        col_izq.set_hexpand(True)

        cer = sigic_db.obtener_resumen_global()["ceremonia_activa"]
        lbl_inst = Gtk.Label(xalign=0)
        lbl_inst.set_markup(
            f"<span font='10' weight='bold' foreground='#38bdf8'>SiGIC · INSTITUTO TECNOLÓGICO BELTRÁN</span>\n"
            f"<span font='8.5' foreground='#94a3b8'>{cer.get('nombre', 'Ceremonia de Graduación')}</span>"
        )
        col_izq.pack_start(lbl_inst, False, False, 0)

        lbl_nom = Gtk.Label(xalign=0)
        lbl_nom.set_markup(
            f"<span font='8' weight='bold' foreground='#64748b'>GRADUADO/A TITULAR</span>\n"
            f"<span font='16' weight='bold' foreground='#ffffff'>{graduado.get('nombre', '').upper()}</span>\n"
            f"<span font='10' weight='bold' foreground='#38bdf8'>{graduado.get('carrera', '')}</span>"
        )
        col_izq.pack_start(lbl_nom, False, False, 2)

        token_val = graduado.get("otp_codigo") or graduado.get("legajo") or graduado.get("dni")
        lbl_meta = Gtk.Label(xalign=0)
        lbl_meta.set_markup(
            f"<span font='9.5' foreground='#cbd5e1'>"
            f"<b>Legajo:</b> {graduado.get('legajo', '—')}    ·    "
            f"<b>Documento DNI:</b> {graduado.get('dni', '—')}    ·    "
            f"<b>Token OTP:</b> <span foreground='#34d399'>{token_val}</span>"
            f"</span>"
        )
        col_izq.pack_start(lbl_meta, False, False, 2)

        invs = graduado.get("invitados", [])
        invs_txt = ", ".join([i.get("nombre", "") for i in invs]) if invs else "Sin acompañantes adicionales registrados"
        lbl_ubic = Gtk.Label(xalign=0)
        lbl_ubic.set_line_wrap(True)
        lbl_ubic.set_max_width_chars(52)
        lbl_ubic.set_markup(
            f"<span font='9.5' weight='bold' foreground='#fbbf24'>UBICACIÓN Y GRUPO HABILITADO EN ANFITEATRO:</span>\n"
            f"<span font='10' foreground='#f8fafc'>• Butaca Graduado: <b>{graduado.get('butaca', 'General')}</b>   |   "
            f"Entregador: <b>{graduado.get('entregador', 'Sin asignar')}</b></span>\n"
            f"<span font='9' foreground='#94a3b8'>• Acompañantes ({len(invs)}): {invs_txt}</span>"
        )
        col_izq.pack_start(lbl_ubic, False, False, 4)

        lbl_pie = Gtk.Label(xalign=0)
        lbl_pie.set_markup(
            f"<span font='8.5' foreground='#64748b'>Fecha: {cer.get('fecha', '28 Nov 2026')} ({cer.get('hora', '18:00 hs')}) · {cer.get('lugar', 'Anfiteatro Central')}</span>"
        )
        col_izq.pack_end(lbl_pie, False, False, 0)

        # Columna derecha: QR Code SVG real
        col_der = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        col_der.set_valign(Gtk.Align.CENTER)

        qr_payload = sigic_db.obtener_payload_qr_graduado(graduado)
        qr_svg = sigic_db.generar_qr_svg(qr_payload, size=170, fg="#0f172a", bg="#ffffff")

        qr_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=4)
        qr_box.get_style_context().add_class("qr-frame-white")
        img_qr = Gtk.Image.new_from_pixbuf(cargar_svg_pixbuf(qr_svg, 170))
        qr_box.pack_start(img_qr, False, False, 0)
        col_der.pack_start(qr_box, False, False, 0)

        lbl_qr_cap = Gtk.Label()
        lbl_qr_cap.set_justify(Gtk.Justification.CENTER)
        lbl_qr_cap.set_markup(
            "<span font='8.5' weight='bold' foreground='#34d399'>PASE GRUPAL ESCANEABLE</span>\n"
            "<span font='7.5' foreground='#94a3b8'>Válido para App Móvil Portería\ny Lector Óptico USB</span>"
        )
        col_der.pack_start(lbl_qr_cap, False, False, 0)

        card.pack_start(col_izq, True, True, 0)
        card.pack_end(col_der, False, False, 0)
        box.pack_start(card, True, True, 0)

        # Botonera inferior de acciones reales
        actions = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=8)
        self.lbl_msg = Gtk.Label(xalign=0)
        actions.pack_start(self.lbl_msg, True, True, 0)

        btn_mail = Gtk.Button(label="Enviar Credencial por Email")
        btn_mail.get_style_context().add_class("btn-secondary")
        btn_mail.connect("clicked", self.on_enviar_email)
        actions.pack_start(btn_mail, False, False, 0)

        btn_export = Gtk.Button(label="Exportar Credencial Imprimible (HTML/PDF)")
        btn_export.get_style_context().add_class("btn-emerald")
        btn_export.connect("clicked", self.on_exportar_credencial, qr_svg)
        actions.pack_start(btn_export, False, False, 0)

        btn_close = Gtk.Button(label="Cerrar")
        btn_close.get_style_context().add_class("btn-primary")
        btn_close.connect("clicked", lambda _b: self.response(Gtk.ResponseType.OK))
        actions.pack_start(btn_close, False, False, 0)

        box.pack_start(actions, False, False, 0)
        self.show_all()

    def on_enviar_email(self, _btn):
        ok, token = sigic_db.despachar_invitacion(self.graduado.get("dni"), es_credencial=True)
        if ok:
            self.lbl_msg.set_markup(
                f"<span font='9.5' weight='bold' foreground='#34d399'>Credencial QR enviada a {self.graduado.get('correo')}</span>"
            )

    def on_exportar_credencial(self, _btn, qr_svg):
        desktop = os.path.expanduser("~/Desktop")
        if not os.path.exists(desktop):
            desktop = os.path.expanduser("~")
        dni = self.graduado.get("dni", "graduado")
        ruta = os.path.join(desktop, f"Credencial_SiGIC_{dni}.html")
        cer = sigic_db.obtener_resumen_global()["ceremonia_activa"]
        invs = self.graduado.get("invitados", [])
        invs_li = "".join([f"<li><b>{i.get('nombre')}</b> (DNI {i.get('dni')})</li>" for i in invs]) or "<li>Sin acompañantes registrados</li>"
        html = f"""<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>Credencial SiGIC - {self.graduado.get('nombre')}</title>
<style>
body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #0f172a; padding: 30px; }}
.card {{ max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 28px; display: flex; justify-content: space-between; gap: 24px; border-left: 10px solid #0284c7; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }}
.tag {{ background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; }}
h1 {{ margin: 8px 0 4px 0; font-size: 26px; text-transform: uppercase; }}
.meta {{ font-size: 13px; color: #334155; margin: 10px 0; }}
.seat {{ background: #0284c7; color: #fff; padding: 6px 12px; border-radius: 8px; font-weight: bold; display: inline-block; margin-top: 8px; }}
.qr-box {{ text-align: center; border: 2px solid #e2e8f0; border-radius: 18px; padding: 14px; }}
</style></head><body>
<div class="card">
  <div>
    <span class="tag">SiGIC · Padrón Oficial Habilitado</span>
    <h1>{self.graduado.get('nombre')}</h1>
    <div style="color:#0284c7;font-weight:bold;">{self.graduado.get('carrera')}</div>
    <div class="meta"><b>DNI:</b> {self.graduado.get('dni')} · <b>Legajo:</b> {self.graduado.get('legajo')} · <b>Token:</b> {self.graduado.get('otp_codigo') or self.graduado.get('legajo')}</div>
    <div class="seat">BUTACA ASIGNADA: {self.graduado.get('butaca', 'General')}</div>
    <div class="meta"><b>Entregador de Diploma:</b> {self.graduado.get('entregador', 'Sin asignar')}</div>
    <div class="meta"><b>Acompañantes habilitados ({len(invs)}):</b><ul>{invs_li}</ul></div>
    <div style="font-size:11px;color:#64748b;margin-top:12px;">{cer.get('nombre')} · {cer.get('fecha')} · {cer.get('lugar')}</div>
  </div>
  <div class="qr-box">
    {qr_svg}
    <div style="font-size:11px;font-weight:bold;color:#059669;margin-top:8px;">PASE GRUPAL QR</div>
  </div>
</div>
</body></html>"""
        with open(ruta, "w", encoding="utf-8") as f:
            f.write(html)
        self.lbl_msg.set_markup(
            f"<span font='9.5' weight='bold' foreground='#38bdf8'>Guardada en: {ruta}</span>"
        )


class VentanaGraduados(Gtk.Window):
    def __init__(self):
        super().__init__(title="SiGIC — Gestión de Padrón de Graduados")
        self.set_default_size(980, 560)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.get_style_context().add_class("sigic-window")

        self.aplicar_estilos()
        self.crear_headerbar()

        root = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
        root.set_margin_top(8)
        root.set_margin_bottom(8)
        root.set_margin_start(12)
        root.set_margin_end(12)
        self.add(root)

        # === BARRA DE MÉTRICAS (KPIs) ===
        kpi_grid = Gtk.Grid(column_spacing=8, row_spacing=6, column_homogeneous=True)
        root.pack_start(kpi_grid, False, False, 0)

        self.lbl_kpi_total = Gtk.Label(xalign=0)
        self.lbl_kpi_conf = Gtk.Label(xalign=0)
        self.lbl_kpi_inv = Gtk.Label(xalign=0)
        self.lbl_kpi_butacas = Gtk.Label(xalign=0)

        kpis = [
            ("TOTAL EN PADRÓN", self.lbl_kpi_total, "Egresados registrados", "kpi-cyan"),
            ("CONFIRMADOS", self.lbl_kpi_conf, "Asistencia confirmada", "kpi-emerald"),
            ("ACOMPAÑANTES", self.lbl_kpi_inv, "Invitados en grupos", "kpi-violet"),
            ("BUTACAS ASIGNADAS", self.lbl_kpi_butacas, "Ubicaciones listas", "kpi-amber"),
        ]

        for idx, (tit, lbl_val, sub, cls) in enumerate(kpis):
            box_k = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=3)
            box_k.get_style_context().add_class("kpi-box")
            box_k.get_style_context().add_class(cls)
            l_t = Gtk.Label(xalign=0)
            l_t.set_markup(f"<span font='8.5' weight='bold' foreground='#94a3b8'>{tit}</span>")
            l_s = Gtk.Label(xalign=0)
            l_s.set_markup(f"<span font='8.5' foreground='#64748b'>{sub}</span>")
            box_k.pack_start(l_t, False, False, 0)
            box_k.pack_start(lbl_val, False, False, 0)
            box_k.pack_start(l_s, False, False, 0)
            kpi_grid.attach(box_k, idx, 0, 1, 1)

        # === BARRA DE HERRAMIENTAS Y ACCIONES ===
        toolbar = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=8)
        toolbar.get_style_context().add_class("panel-card")
        root.pack_start(toolbar, False, False, 0)

        self.entry_buscar = Gtk.Entry()
        self.entry_buscar.set_placeholder_text("Buscar por DNI, Apellido, Legajo o Carrera...")
        self.entry_buscar.get_style_context().add_class("search-field")
        self.entry_buscar.set_width_chars(28)
        self.entry_buscar.connect("changed", lambda _e: self.refrescar_vista())
        toolbar.pack_start(self.entry_buscar, True, True, 0)

        self.cmb_filtro_carrera = Gtk.ComboBoxText()
        self.cmb_filtro_carrera.append_text("Todas las Carreras")
        for c in sigic_db.CARRERAS_BELTRAN:
            self.cmb_filtro_carrera.append_text(c)
        self.cmb_filtro_carrera.set_active(0)
        self.cmb_filtro_carrera.connect("changed", lambda _c: self.refrescar_vista())
        toolbar.pack_start(self.cmb_filtro_carrera, False, False, 0)

        btn_nuevo = Gtk.Button(label="+ Nuevo Graduado")
        btn_nuevo.get_style_context().add_class("btn-primary")
        btn_nuevo.connect("clicked", self.on_nuevo_graduado)
        toolbar.pack_start(btn_nuevo, False, False, 0)

        btn_editar = Gtk.Button(label="Editar Ficha")
        btn_editar.get_style_context().add_class("btn-secondary")
        btn_editar.connect("clicked", self.on_editar_graduado)
        toolbar.pack_start(btn_editar, False, False, 0)

        btn_grupo = Gtk.Button(label="Acompañantes / Entregador")
        btn_grupo.get_style_context().add_class("btn-secondary")
        btn_grupo.connect("clicked", self.on_gestionar_grupo)
        toolbar.pack_start(btn_grupo, False, False, 0)

        btn_qr = Gtk.Button(label="Credencial QR")
        btn_qr.get_style_context().add_class("btn-emerald")
        btn_qr.connect("clicked", self.on_ver_credencial_qr)
        toolbar.pack_start(btn_qr, False, False, 0)

        btn_importar = Gtk.Button(label="Importar CSV")
        btn_importar.get_style_context().add_class("btn-secondary")
        btn_importar.connect("clicked", self.on_importar_csv)
        toolbar.pack_start(btn_importar, False, False, 0)

        # === TABLA PRINCIPAL DE GRADUADOS ===
        table_card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=0)
        table_card.get_style_context().add_class("panel-card")
        root.pack_start(table_card, True, True, 0)

        # Columnas: DNI, Apellido y Nombre, Legajo, Carrera, Estado, Butaca, Acompañantes, Entregador, Token OTP
        self.store = Gtk.ListStore(str, str, str, str, str, str, str, str, str)
        self.tree = Gtk.TreeView(model=self.store)
        self.tree.set_headers_visible(True)
        self.tree.connect("row-activated", lambda _t, _p, _c: self.on_ver_credencial_qr(None))

        columnas = [
            ("DNI", 0, 85),
            ("Apellido y Nombre", 1, 195),
            ("Legajo", 2, 105),
            ("Carrera / Tecnicatura", 3, 235),
            ("Estado", 4, 100),
            ("Butaca", 5, 70),
            ("Grupo", 6, 75),
            ("Entregador Diploma", 7, 155),
            ("Token OTP", 8, 85),
        ]

        for titulo, idx, min_w in columnas:
            renderer = Gtk.CellRendererText()
            if idx == 1:
                renderer.set_property("weight", Pango.Weight.BOLD)
            col = Gtk.TreeViewColumn(titulo, renderer, text=idx)
            col.set_min_width(min_w)
            col.set_resizable(True)
            col.set_sort_column_id(idx)
            self.tree.append_column(col)

        scroll = Gtk.ScrolledWindow()
        scroll.set_policy(Gtk.PolicyType.AUTOMATIC, Gtk.PolicyType.AUTOMATIC)
        scroll.set_vexpand(True)
        scroll.add(self.tree)
        table_card.pack_start(scroll, True, True, 0)

        # === PIE DE VENTANA ===
        footer = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        footer.get_style_context().add_class("footer-panel")
        root.pack_start(footer, False, False, 0)

        self.lbl_status = Gtk.Label(xalign=0)
        footer.pack_start(self.lbl_status, True, True, 0)

        btn_plantilla = Gtk.Button(label="Descargar Plantilla CSV")
        btn_plantilla.get_style_context().add_class("btn-secondary")
        btn_plantilla.connect("clicked", self.on_descargar_plantilla)
        footer.pack_end(btn_plantilla, False, False, 0)

        btn_demo = Gtk.Button(label="Restaurar Cohorte Modelo")
        btn_demo.get_style_context().add_class("btn-secondary")
        btn_demo.connect("clicked", self.on_restaurar_cohorte)
        footer.pack_end(btn_demo, False, False, 0)

        btn_vaciar = Gtk.Button(label="Vaciar Padrón")
        btn_vaciar.get_style_context().add_class("btn-danger")
        btn_vaciar.connect("clicked", self.on_vaciar_padron)
        footer.pack_end(btn_vaciar, False, False, 0)

        btn_eliminar = Gtk.Button(label="Eliminar Seleccionado")
        btn_eliminar.get_style_context().add_class("btn-danger")
        btn_eliminar.connect("clicked", self.on_eliminar_seleccionado)
        footer.pack_end(btn_eliminar, False, False, 0)

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
        hb.set_title("Gestión de Padrón de Graduados, Acompañantes y Credenciales QR")
        hb.set_subtitle("SiGIC · Alta Individual, Importación Excel/CSV, Entregadores y Pase Grupal QR")
        hb.get_style_context().add_class("sigic-headerbar")
        self.set_titlebar(hb)

    def obtener_graduado_seleccionado(self):
        sel = self.tree.get_selection()
        model, treeiter = sel.get_selected()
        if not treeiter:
            grads = sigic_db.listar_graduados()
            return grads[0] if grads else None
        dni = model[treeiter][0]
        return sigic_db.obtener_graduado_por_dni(dni)

    def refrescar_vista(self):
        graduados = sigic_db.listar_graduados()
        filtro_texto = self.entry_buscar.get_text().strip().lower()
        filtro_carrera = self.cmb_filtro_carrera.get_active_text()

        self.store.clear()
        visibles = 0

        for g in graduados:
            if filtro_carrera and filtro_carrera != "Todas las Carreras":
                if g.get("carrera") != filtro_carrera:
                    continue
            if filtro_texto:
                blob = f"{g.get('dni','')} {g.get('nombre','')} {g.get('legajo','')} {g.get('carrera','')} {g.get('correo','')}".lower()
                if filtro_texto not in blob:
                    continue

            invs = g.get("invitados", [])
            self.store.append([
                g.get("dni", ""),
                g.get("nombre", ""),
                g.get("legajo", ""),
                g.get("carrera", ""),
                g.get("estado", "PENDIENTE"),
                g.get("butaca", "Sin asignar"),
                f"{len(invs)} acomp.",
                g.get("entregador", "Sin asignar"),
                g.get("otp_codigo", "—") or "—"
            ])
            visibles += 1

        res = sigic_db.obtener_resumen_global()
        self.lbl_kpi_total.set_markup(f"<span font='18' weight='bold' foreground='#38bdf8'>{res['total_graduados']}</span>")
        self.lbl_kpi_conf.set_markup(f"<span font='18' weight='bold' foreground='#34d399'>{res['confirmados']}</span>")
        self.lbl_kpi_inv.set_markup(f"<span font='18' weight='bold' foreground='#c084fc'>{res['acompanantes']}</span>")
        self.lbl_kpi_butacas.set_markup(f"<span font='18' weight='bold' foreground='#fbbf24'>{res['butacas_graduados']}</span>")

        self.lbl_status.set_markup(
            f"<span font='9.5' foreground='#94a3b8'>Mostrando <b>{visibles}</b> de <b>{len(graduados)}</b> graduados (doble clic sobre una fila para abrir su Credencial QR).</span>"
        )

    def on_nuevo_graduado(self, _btn):
        dlg = DialogoGraduado(self)
        resp = dlg.run()
        if resp == Gtk.ResponseType.OK:
            nuevo = dlg.obtener_datos()
            if nuevo["dni"] and nuevo["nombre"]:
                sigic_db.guardar_graduado(nuevo)
                self.refrescar_vista()
        dlg.destroy()

    def on_editar_graduado(self, _btn):
        g = self.obtener_graduado_seleccionado()
        if not g:
            return
        dlg = DialogoGraduado(self, datos_existentes=g)
        resp = dlg.run()
        if resp == Gtk.ResponseType.OK:
            actualizado = dlg.obtener_datos()
            if actualizado["dni"] and actualizado["nombre"]:
                sigic_db.guardar_graduado(actualizado, dni_original=g.get("dni"))
                self.refrescar_vista()
        dlg.destroy()

    def on_gestionar_grupo(self, _btn):
        g = self.obtener_graduado_seleccionado()
        if not g:
            return
        dlg = DialogoInvitadosEntregador(self, g)
        resp = dlg.run()
        if resp == Gtk.ResponseType.OK:
            g["invitados"] = dlg.invitados
            g["entregador"] = dlg.cmb_ent.get_active_text() or "Sin asignar"
            sigic_db.guardar_graduado(g, dni_original=g.get("dni"))
            self.refrescar_vista()
        dlg.destroy()

    def on_ver_credencial_qr(self, _btn):
        g = self.obtener_graduado_seleccionado()
        if not g:
            return
        dlg = DialogoCredencialQR(self, g)
        dlg.run()
        dlg.destroy()
        self.refrescar_vista()

    def on_eliminar_seleccionado(self, _btn):
        sel = self.tree.get_selection()
        model, treeiter = sel.get_selected()
        if not treeiter:
            return
        dni = model[treeiter][0]
        sigic_db.eliminar_graduado(dni)
        self.refrescar_vista()

    def on_vaciar_padron(self, _btn):
        sigic_db.vaciar_padron()
        self.refrescar_vista()

    def on_restaurar_cohorte(self, _btn):
        sigic_db.restaurar_cohorte_modelo()
        self.refrescar_vista()

    def on_descargar_plantilla(self, _btn):
        desktop = os.path.expanduser("~/Desktop")
        if not os.path.exists(desktop):
            desktop = os.path.expanduser("~")
        ruta = os.path.join(desktop, "plantilla_padron_sigic.csv")
        with open(ruta, "w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["dni", "nombre", "legajo", "correo", "telefono", "carrera", "promedio", "estado", "butaca", "entregador"])
            writer.writerow([
                "45111222", "Sánchez, Mariano Nicolás", "BEL-2026-201",
                "mariano.sanchez@ibeltran.edu.ar", "11-5000-1234",
                "Tecnicatura Superior en Desarrollo de Software", "9.10", "CONFIRMADO", "C3", "Ing. Roberto Gómez"
            ])
        self.lbl_status.set_markup(
            f"<span font='9.5' foreground='#34d399'><b>Plantilla exportada en:</b> {ruta}</span>"
        )

    def on_importar_csv(self, _btn):
        dlg = Gtk.FileChooserDialog(
            title="Seleccionar archivo CSV de Padrón de Graduados",
            parent=self,
            action=Gtk.FileChooserAction.OPEN
        )
        dlg.add_buttons(
            Gtk.STOCK_CANCEL, Gtk.ResponseType.CANCEL,
            Gtk.STOCK_OPEN, Gtk.ResponseType.OK
        )
        filtro = Gtk.FileFilter()
        filtro.set_name("Archivos CSV / Planillas (*.csv)")
        filtro.add_pattern("*.csv")
        filtro.add_pattern("*.txt")
        dlg.add_filter(filtro)

        if dlg.run() == Gtk.ResponseType.OK:
            ruta = dlg.get_filename()
            importados = 0
            try:
                with open(ruta, "r", encoding="utf-8-sig") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        dni = (row.get("dni") or row.get("DNI") or "").strip()
                        nom = (row.get("nombre") or row.get("Nombre") or "").strip()
                        if dni and nom:
                            sigic_db.guardar_graduado({
                                "dni": dni,
                                "nombre": nom,
                                "legajo": (row.get("legajo") or f"BEL-2026-{importados+150}").strip(),
                                "correo": (row.get("correo") or "").strip(),
                                "telefono": (row.get("telefono") or "").strip(),
                                "carrera": (row.get("carrera") or sigic_db.CARRERAS_BELTRAN[0]).strip(),
                                "promedio": (row.get("promedio") or "8.00").strip(),
                                "estado": (row.get("estado") or "PENDIENTE").strip().upper(),
                                "butaca": (row.get("butaca") or "Sin asignar").strip(),
                                "entregador": (row.get("entregador") or "Sin asignar").strip(),
                            })
                            importados += 1
                self.refrescar_vista()
                self.lbl_status.set_markup(
                    f"<span font='9.5' foreground='#34d399'><b>Importación exitosa:</b> {importados} graduados incorporados al padrón.</span>"
                )
            except Exception as e:
                self.lbl_status.set_markup(
                    f"<span font='9.5' foreground='#f43f5e'>Error al importar CSV: {e}</span>"
                )
        dlg.destroy()


if __name__ == "__main__":
    win = VentanaGraduados()
    win.connect("destroy", Gtk.main_quit)
    win.show_all()
    Gtk.main()
