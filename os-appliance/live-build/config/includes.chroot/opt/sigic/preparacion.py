#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC — Preparación de Sala, Anfiteatro Interactivo y Cuerpo Docente (Edición Compacta)
Mapa interactivo clicable de butacas (A1..F12), asignación manual o inteligente,
reserva de autoridades, bloqueo y CRUD completo de Profesores Entregadores.
Instituto Tecnológico Beltrán
"""

import os
import sys

sys.path.insert(0, "/opt/sigic")
import sigic_db

try:
    import gi
    gi.require_version('Gtk', '3.0')
    gi.require_version('Gdk', '3.0')
    from gi.repository import Gtk, Gdk, GdkPixbuf
except Exception as err:
    print(f"Error cargando librerías GTK3: {err}")
    sys.exit(1)

CSS_EXTRA = b"""
button.seat-btn {
    border-radius: 5px;
    font-size: 10px;
    font-weight: 800;
    padding: 3px 5px;
    min-width: 38px;
    min-height: 24px;
    background-image: none;
}
button.seat-libre {
    background-color: #0f243c;
    color: #93c5fd;
    border: 1px solid #1e3a5f;
}
button.seat-libre:hover {
    background-color: #0284c7;
    color: #ffffff;
    border-color: #38bdf8;
}
button.seat-graduado {
    background-color: #064e3b;
    color: #6ee7b7;
    border: 1px solid #10b981;
}
button.seat-graduado:hover {
    background-color: #059669;
    color: #ffffff;
}
button.seat-autoridad {
    background-color: #3b0764;
    color: #d8b4fe;
    border: 1px solid #a855f7;
}
button.seat-autoridad:hover {
    background-color: #7e22ce;
    color: #ffffff;
}
button.seat-bloqueada {
    background-color: #450a0a;
    color: #fca5a5;
    border: 1px solid #ef4444;
}
"""


class DialogoButaca(Gtk.Dialog):
    """Diálogo compacto para asignar, reservar o liberar una butaca del anfiteatro."""
    def __init__(self, parent, codigo, info_actual):
        super().__init__(title=f"Butaca {codigo} — Anfiteatro Beltrán", transient_for=parent, flags=0)
        self.set_default_size(420, 290)
        self.set_resizable(False)
        self.codigo = codigo

        box = self.get_content_area()
        box.set_spacing(8)
        box.set_margin_top(12)
        box.set_margin_bottom(10)
        box.set_margin_start(14)
        box.set_margin_end(14)

        estado_act = info_actual.get("estado", "LIBRE")
        ocupante_act = info_actual.get("ocupante", "")

        lbl_h = Gtk.Label(xalign=0)
        lbl_h.set_markup(
            f"<span foreground='#f8fafc' weight='heavy' size='11500'>Configurar Butaca {codigo}</span>\n"
            f"<span foreground='#38bdf8' size='9000'>Estado actual: <b>{estado_act}</b>"
            f"{(' · ' + ocupante_act) if ocupante_act else ''}</span>"
        )
        box.pack_start(lbl_h, False, False, 0)

        grid = Gtk.Grid()
        grid.set_column_spacing(10)
        grid.set_row_spacing(8)
        box.pack_start(grid, True, True, 2)

        lbl_est = Gtk.Label(xalign=0)
        lbl_est.set_markup("<span foreground='#cbd5e1' weight='bold' size='9200'>Acción / Estado:</span>")
        grid.attach(lbl_est, 0, 0, 1, 1)

        self.cmb_estado = Gtk.ComboBoxText()
        for op in ["GRADUADO", "AUTORIDAD", "BLOQUEADA", "LIBRE"]:
            self.cmb_estado.append_text(op)
        idx_map = {"GRADUADO": 0, "AUTORIDAD": 1, "BLOQUEADA": 2, "LIBRE": 3}
        self.cmb_estado.set_active(idx_map.get(estado_act, 0))
        self.cmb_estado.set_hexpand(True)
        grid.attach(self.cmb_estado, 1, 0, 1, 1)

        lbl_g = Gtk.Label(xalign=0)
        lbl_g.set_markup("<span foreground='#cbd5e1' weight='bold' size='9200'>Asignar Graduado:</span>")
        grid.attach(lbl_g, 0, 1, 1, 1)

        self.cmb_grad = Gtk.ComboBoxText()
        self.cmb_grad.append_text("-- Seleccionar del Padrón --")
        self.graduados = sigic_db.listar_graduados()
        active_g = 0
        for idx, g in enumerate(self.graduados, start=1):
            label = f"{g.get('nombre')} ({g.get('dni')})"
            self.cmb_grad.append_text(label)
            if g.get("asiento") == codigo or g.get("nombre") == ocupante_act:
                active_g = idx
        self.cmb_grad.set_active(active_g)
        self.cmb_grad.set_hexpand(True)
        grid.attach(self.cmb_grad, 1, 1, 1, 1)

        lbl_aut = Gtk.Label(xalign=0)
        lbl_aut.set_markup("<span foreground='#cbd5e1' weight='bold' size='9200'>Nombre Autoridad / Nota:</span>")
        grid.attach(lbl_aut, 0, 2, 1, 1)

        self.ent_nota = Gtk.Entry()
        self.ent_nota.set_placeholder_text("Ej: Rectorado / Invitado Especial / Pasillo Técnico")
        if estado_act in ("AUTORIDAD", "BLOQUEADA"):
            self.ent_nota.set_text(ocupante_act)
        self.ent_nota.set_hexpand(True)
        grid.attach(self.ent_nota, 1, 2, 1, 1)

        btn_cancel = self.add_button("Cancelar", Gtk.ResponseType.CANCEL)
        btn_cancel.get_style_context().add_class("btn-secondary")
        btn_ok = self.add_button("Aplicar a Butaca", Gtk.ResponseType.OK)
        btn_ok.get_style_context().add_class("btn-primary")
        self.show_all()

    def aplicar(self):
        est = self.cmb_estado.get_active_text() or "LIBRE"
        idx_g = self.cmb_grad.get_active()
        nota = self.ent_nota.get_text().strip()

        if est == "LIBRE":
            sigic_db.asignar_butaca(self.codigo, "LIBRE", "", None)
        elif est == "GRADUADO":
            if idx_g > 0 and idx_g <= len(self.graduados):
                g = self.graduados[idx_g - 1]
                sigic_db.asignar_butaca(self.codigo, "GRADUADO", g.get("nombre", ""), g.get("id"))
            else:
                sigic_db.asignar_butaca(self.codigo, "GRADUADO", nota or "Graduado Asignado", None)
        elif est == "AUTORIDAD":
            sigic_db.asignar_butaca(self.codigo, "AUTORIDAD", nota or "Autoridad Institucional", None)
        elif est == "BLOQUEADA":
            sigic_db.asignar_butaca(self.codigo, "BLOQUEADA", nota or "Bloqueada", None)


class DialogoProfesor(Gtk.Dialog):
    """Diálogo compacto para alta o edición de docente entregador."""
    def __init__(self, parent, profesor=None):
        es_ed = profesor is not None
        super().__init__(
            title="Editar Docente" if es_ed else "Alta de Docente Entregador",
            transient_for=parent,
            flags=0
        )
        self.set_default_size(400, 250)
        self.set_resizable(False)
        self.profesor_base = profesor

        box = self.get_content_area()
        box.set_spacing(8)
        box.set_margin_top(12)
        box.set_margin_bottom(10)
        box.set_margin_start(14)
        box.set_margin_end(14)

        lbl = Gtk.Label(xalign=0)
        lbl.set_markup(
            f"<span foreground='#f8fafc' weight='heavy' size='11500'>{'Editar Docente' if es_ed else 'Registrar Docente / Autoridad'}</span>\n"
            "<span foreground='#38bdf8' size='9000'>Disponible para entrega de diplomas en el escenario.</span>"
        )
        box.pack_start(lbl, False, False, 0)

        grid = Gtk.Grid()
        grid.set_column_spacing(10)
        grid.set_row_spacing(8)
        box.pack_start(grid, True, True, 2)

        self.ent_nombre = Gtk.Entry()
        self.ent_nombre.set_placeholder_text("Ej: Ing. Roberto Gómez")
        self.ent_cargo = Gtk.Entry()
        self.ent_cargo.set_placeholder_text("Ej: Director de Carrera / Docente Titular")
        self.ent_dep = Gtk.Entry()
        self.ent_dep.set_placeholder_text("Ej: Departamento de Sistemas")

        if es_ed:
            self.ent_nombre.set_text(profesor.get("nombre", ""))
            self.ent_cargo.set_text(profesor.get("cargo", ""))
            self.ent_dep.set_text(profesor.get("departamento", ""))

        for i, (et, w) in enumerate([
            ("Nombre y Título *", self.ent_nombre),
            ("Cargo Académico", self.ent_cargo),
            ("Departamento", self.ent_dep),
        ]):
            l = Gtk.Label(xalign=0)
            l.set_markup(f"<span foreground='#cbd5e1' weight='bold' size='9200'>{et}</span>")
            grid.attach(l, 0, i, 1, 1)
            w.set_hexpand(True)
            grid.attach(w, 1, i, 1, 1)

        btn_c = self.add_button("Cancelar", Gtk.ResponseType.CANCEL)
        btn_c.get_style_context().add_class("btn-secondary")
        btn_ok = self.add_button("Guardar Docente", Gtk.ResponseType.OK)
        btn_ok.get_style_context().add_class("btn-primary")
        self.show_all()

    def obtener_datos(self):
        d = {
            "nombre": self.ent_nombre.get_text().strip(),
            "cargo": self.ent_cargo.get_text().strip() or "Docente Titular",
            "departamento": self.ent_dep.get_text().strip() or "Instituto Beltrán",
        }
        if self.profesor_base and "id" in self.profesor_base:
            d["id"] = self.profesor_base["id"]
        return d


class PreparacionWindow(Gtk.Window):
    def __init__(self):
        super().__init__(title="Preparación de Sala, Anfiteatro y Cuerpo Docente — SiGIC")
        self.set_default_size(980, 560)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.get_style_context().add_class("sigic-window")

        header = Gtk.HeaderBar()
        header.set_show_close_button(True)
        header.set_decoration_layout(":minimize,maximize,close")
        header.props.title = "Preparación de Sala y Anfiteatro Interactivo"
        header.props.subtitle = "Mapa de Butacas Clicable y Cuerpo Docente Entregador"
        header.get_style_context().add_class("sigic-headerbar")
        self.set_titlebar(header)

        for r in ["/opt/sigic/logo.png", "/usr/share/pixmaps/sigic.png"]:
            if os.path.exists(r):
                try:
                    self.set_icon_from_file(r)
                    pix = GdkPixbuf.Pixbuf.new_from_file_at_scale(r, 20, 20, True)
                    img = Gtk.Image.new_from_pixbuf(pix)
                    img.set_margin_start(4)
                    header.pack_start(img)
                    break
                except Exception:
                    pass

        btn_auto = Gtk.Button(label="Asignación Automática Inteligente")
        btn_auto.get_style_context().add_class("btn-emerald")
        btn_auto.connect("clicked", self.on_auto_asignar)
        header.pack_start(btn_auto)

        btn_doc = Gtk.Button(label="+ Agregar Docente")
        btn_doc.get_style_context().add_class("btn-primary")
        btn_doc.connect("clicked", self.on_nuevo_profesor)
        header.pack_end(btn_doc)

        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
        vbox.set_margin_top(8)
        vbox.set_margin_bottom(8)
        vbox.set_margin_start(12)
        vbox.set_margin_end(12)
        self.add(vbox)

        # KPIs compactos arriba
        kpi_row = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=8)
        kpi_row.set_homogeneous(True)
        self.lbl_k_tot, b1 = self._crear_kpi("CAPACIDAD MAPA", "72", "Filas A..F (12 col)", "#38bdf8")
        self.lbl_k_ocu, b2 = self._crear_kpi("BUTACAS OCUPADAS", "0", "Graduados + Autoridades", "#34d399")
        self.lbl_k_lib, b3 = self._crear_kpi("BUTACAS LIBRES", "0", "Disponibles para asignar", "#fbbf24")
        self.lbl_k_doc, b4 = self._crear_kpi("CUERPO DOCENTE", "0", "Profesores entregadores", "#c084fc")
        for b in (b1, b2, b3, b4):
            kpi_row.pack_start(b, True, True, 0)
        vbox.pack_start(kpi_row, False, False, 0)

        # Notebook compacto
        self.notebook = Gtk.Notebook()
        vbox.pack_start(self.notebook, True, True, 0)

        # TAB 1: Mapa de Butacas
        tab_mapa = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
        tab_mapa.set_margin_top(8)
        tab_mapa.set_margin_bottom(6)
        tab_mapa.set_margin_start(10)
        tab_mapa.set_margin_end(10)

        stage_bar = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=8)
        stage_bar.get_style_context().add_class("card-panel")
        lbl_stage = Gtk.Label()
        lbl_stage.set_markup(
            "<span foreground='#38bdf8' weight='heavy' size='10000'>[ ESCENARIO PRINCIPAL Y ESTRADO DE AUTORIDADES — ANFITEATRO BELTRÁN ]</span>"
        )
        stage_bar.pack_start(lbl_stage, True, True, 0)

        btn_reset_seats = Gtk.Button(label="Reorganizar / Autocompletar Padrón")
        btn_reset_seats.get_style_context().add_class("btn-secondary")
        btn_reset_seats.connect("clicked", self.on_auto_asignar)
        stage_bar.pack_end(btn_reset_seats, False, False, 0)
        tab_mapa.pack_start(stage_bar, False, False, 0)

        self.grid_seats = Gtk.Grid()
        self.grid_seats.set_column_spacing(5)
        self.grid_seats.set_row_spacing(5)
        self.grid_seats.set_halign(Gtk.Align.CENTER)
        self.grid_seats.set_valign(Gtk.Align.CENTER)

        scroll_mapa = Gtk.ScrolledWindow()
        scroll_mapa.set_policy(Gtk.PolicyType.AUTOMATIC, Gtk.PolicyType.AUTOMATIC)
        scroll_mapa.add(self.grid_seats)
        tab_mapa.pack_start(scroll_mapa, True, True, 0)

        # Leyenda + Detalle de selección
        leg_row = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=14)
        leg_row.get_style_context().add_class("card-panel")
        for col_hex, txt in [
            ("#34d399", "■ Graduado Asignado"),
            ("#c084fc", "■ Reserva Autoridad"),
            ("#93c5fd", "■ Butaca Libre (Clic para asignar)"),
            ("#f87171", "■ Bloqueada / Pasillo"),
        ]:
            l = Gtk.Label()
            l.set_markup(f"<span foreground='{col_hex}' weight='bold' size='9000'>{txt}</span>")
            leg_row.pack_start(l, False, False, 0)

        self.lbl_seat_sel = Gtk.Label(xalign=1)
        self.lbl_seat_sel.set_markup("<span foreground='#38bdf8' size='9000'>Hacé clic en cualquier butaca para asignarla o liberarla</span>")
        leg_row.pack_end(self.lbl_seat_sel, True, True, 0)
        tab_mapa.pack_start(leg_row, False, False, 0)

        self.notebook.append_page(tab_mapa, Gtk.Label(label="1. Plano Interactivo de Butacas (A1..F12)"))

        # TAB 2: Cuerpo Docente
        tab_doc = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
        tab_doc.set_margin_top(8)
        tab_doc.set_margin_bottom(6)
        tab_doc.set_margin_start(10)
        tab_doc.set_margin_end(10)

        bar_doc = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=6)
        lbl_d_info = Gtk.Label(xalign=0)
        lbl_d_info.set_markup(
            "<span foreground='#f8fafc' weight='heavy' size='10200'>Nómina de Docentes y Autoridades Entregadoras de Diploma</span>"
        )
        bar_doc.pack_start(lbl_d_info, True, True, 0)

        btn_add_d = Gtk.Button(label="+ Nuevo Docente")
        btn_add_d.get_style_context().add_class("btn-primary")
        btn_add_d.connect("clicked", self.on_nuevo_profesor)
        bar_doc.pack_start(btn_add_d, False, False, 0)

        btn_ed_d = Gtk.Button(label="Editar Seleccionado")
        btn_ed_d.get_style_context().add_class("btn-secondary")
        btn_ed_d.connect("clicked", self.on_editar_profesor)
        bar_doc.pack_start(btn_ed_d, False, False, 0)

        btn_del_d = Gtk.Button(label="Eliminar")
        btn_del_d.get_style_context().add_class("btn-danger")
        btn_del_d.connect("clicked", self.on_eliminar_profesor)
        bar_doc.pack_start(btn_del_d, False, False, 0)

        tab_doc.pack_start(bar_doc, False, False, 0)

        self.store_doc = Gtk.ListStore(int, str, str, str)
        self.tree_doc = Gtk.TreeView(model=self.store_doc)
        self.tree_doc.set_headers_visible(True)
        for idx, (t, w) in enumerate([("ID", 50), ("Docente / Autoridad Académica", 280), ("Cargo Institucional", 240), ("Departamento / Área", 260)]):
            r = Gtk.CellRendererText()
            if idx == 1:
                r.set_property("weight", 700)
                r.set_property("foreground", "#38bdf8")
            c = Gtk.TreeViewColumn(t, r, text=idx)
            c.set_min_width(w)
            self.tree_doc.append_column(c)

        scr_doc = Gtk.ScrolledWindow()
        scr_doc.set_policy(Gtk.PolicyType.AUTOMATIC, Gtk.PolicyType.AUTOMATIC)
        scr_doc.add(self.tree_doc)
        tab_doc.pack_start(scr_doc, True, True, 0)

        self.notebook.append_page(tab_doc, Gtk.Label(label="2. Profesores y Entregadores de Diploma"))

        self.refrescar_todo()

    def _crear_kpi(self, tit, val, sub, col):
        box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=2)
        box.get_style_context().add_class("kpi-card")
        l1 = Gtk.Label(xalign=0)
        l1.set_markup(f"<span foreground='#94a3b8' weight='bold' size='8000'>{tit}</span>")
        l2 = Gtk.Label(xalign=0)
        l2.set_markup(f"<span foreground='{col}' weight='heavy' size='13500'>{val}</span>")
        l3 = Gtk.Label(xalign=0)
        l3.set_markup(f"<span foreground='#64748b' size='8000'>{sub}</span>")
        box.pack_start(l1, False, False, 0)
        box.pack_start(l2, False, False, 0)
        box.pack_start(l3, False, False, 0)
        return l2, box

    def refrescar_todo(self):
        for child in self.grid_seats.get_children():
            self.grid_seats.remove(child)

        butacas = sigic_db.obtener_butacas()
        filas = ["A", "B", "C", "D", "E", "F"]
        ocupadas = 0
        libres = 0

        for r_idx, fila in enumerate(filas):
            lbl_f = Gtk.Label()
            lbl_f.set_markup(f"<span foreground='#94a3b8' weight='heavy' size='9500'>Fila {fila}</span>")
            self.grid_seats.attach(lbl_f, 0, r_idx, 1, 1)

            for c_num in range(1, 13):
                codigo = f"{fila}{c_num}"
                info = butacas.get(codigo, {"estado": "LIBRE", "ocupante": ""})
                est = info.get("estado", "LIBRE")
                ocup = info.get("ocupante", "")

                if est in ("GRADUADO", "AUTORIDAD"):
                    ocupadas += 1
                elif est == "LIBRE":
                    libres += 1

                btn = Gtk.Button(label=codigo)
                ctx = btn.get_style_context()
                ctx.add_class("seat-btn")
                if est == "GRADUADO":
                    ctx.add_class("seat-graduado")
                elif est == "AUTORIDAD":
                    ctx.add_class("seat-autoridad")
                elif est == "BLOQUEADA":
                    ctx.add_class("seat-bloqueada")
                else:
                    ctx.add_class("seat-libre")

                btn.set_tooltip_text(f"Butaca {codigo} — {est}" + (f": {ocup}" if ocup else ""))
                btn.connect("clicked", self.on_click_butaca, codigo, info)

                # Pasillo central entre columna 6 y 7
                col_pos = c_num if c_num <= 6 else c_num + 1
                self.grid_seats.attach(btn, col_pos, r_idx, 1, 1)

            lbl_pas = Gtk.Label()
            lbl_pas.set_markup("<span foreground='#334155' size='8000'>  ║  </span>")
            self.grid_seats.attach(lbl_pas, 7, r_idx, 1, 1)

        self.grid_seats.show_all()

        # Profesores
        self.store_doc.clear()
        profes = sigic_db.listar_profesores()
        for p in profes:
            self.store_doc.append([
                int(p.get("id", 0)),
                p.get("nombre", ""),
                p.get("cargo", ""),
                p.get("departamento", ""),
            ])

        self.lbl_k_ocu.set_markup(f"<span foreground='#34d399' weight='heavy' size='13500'>{ocupadas}</span>")
        self.lbl_k_lib.set_markup(f"<span foreground='#fbbf24' weight='heavy' size='13500'>{libres}</span>")
        self.lbl_k_doc.set_markup(f"<span foreground='#c084fc' weight='heavy' size='13500'>{len(profes)}</span>")

    def on_click_butaca(self, button, codigo, info):
        ocup = info.get("ocupante", "Sin ocupante")
        self.lbl_seat_sel.set_markup(
            f"<span foreground='#38bdf8' weight='bold' size='9000'>Butaca {codigo}: {info.get('estado')} · {ocup}</span>"
        )
        dlg = DialogoButaca(self, codigo, info)
        if dlg.run() == Gtk.ResponseType.OK:
            dlg.aplicar()
            dlg.destroy()
            self.refrescar_todo()
        else:
            dlg.destroy()

    def on_auto_asignar(self, button):
        n = sigic_db.asignar_butacas_automaticamente()
        self.refrescar_todo()
        self._msg("Asignación Automática Completada", f"Se asignaron y sincronizaron {n} butacas del anfiteatro con el padrón de graduados.")

    def on_nuevo_profesor(self, button):
        dlg = DialogoProfesor(self, None)
        if dlg.run() == Gtk.ResponseType.OK:
            datos = dlg.obtener_datos()
            dlg.destroy()
            if datos["nombre"]:
                sigic_db.guardar_profesor(datos)
                self.refrescar_todo()
        else:
            dlg.destroy()

    def on_editar_profesor(self, button):
        sel = self.tree_doc.get_selection()
        model, treeiter = sel.get_selected()
        if not treeiter:
            return
        pid = model[treeiter][0]
        prof = next((p for p in sigic_db.listar_profesores() if int(p.get("id", 0)) == pid), None)
        if not prof:
            return
        dlg = DialogoProfesor(self, prof)
        if dlg.run() == Gtk.ResponseType.OK:
            datos = dlg.obtener_datos()
            dlg.destroy()
            if datos["nombre"]:
                sigic_db.guardar_profesor(datos)
                self.refrescar_todo()
        else:
            dlg.destroy()

    def on_eliminar_profesor(self, button):
        sel = self.tree_doc.get_selection()
        model, treeiter = sel.get_selected()
        if not treeiter:
            return
        pid = model[treeiter][0]
        sigic_db.eliminar_profesor(pid)
        self.refrescar_todo()

    def _msg(self, tit, sec):
        dlg = Gtk.MessageDialog(transient_for=self, flags=0, message_type=Gtk.MessageType.INFO, buttons=Gtk.ButtonsType.OK, text=tit)
        dlg.format_secondary_text(sec)
        dlg.run()
        dlg.destroy()


def main():
    try:
        import gi
        gi.require_version('Gtk', '3.0')
        gi.require_version('Gdk', '3.0')
        from gi.repository import Gtk, Gdk
        settings = Gtk.Settings.get_default()
        if settings:
            settings.set_property("gtk-application-prefer-dark-theme", True)
        provider = Gtk.CssProvider()
        provider.load_from_data(sigic_db.CSS_SUITE_OSCURA + b"\n" + CSS_EXTRA)
        screen = Gdk.Screen.get_default()
        if screen:
            Gtk.StyleContext.add_provider_for_screen(screen, provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION)
    except Exception as e:
        print(f"Aviso CSS: {e}")
    win = PreparacionWindow()
    win.connect("destroy", Gtk.main_quit)
    win.show_all()
    Gtk.main()



if __name__ == "__main__":
    main()
