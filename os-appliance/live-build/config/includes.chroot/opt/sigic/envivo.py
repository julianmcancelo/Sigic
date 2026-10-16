#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC — Monitor de Ceremonia en Vivo y Llamador de Escenario (Edición Compacta)
Control interactivo de llamado al estrado, entrega de diplomas en tiempo real
y bitácora de eventos conectada a sigic_db.py.
Instituto Tecnológico Beltrán
"""

import os
import sys
from datetime import datetime

sys.path.insert(0, "/opt/sigic")
import sigic_db

try:
    import gi
    gi.require_version('Gtk', '3.0')
    gi.require_version('Gdk', '3.0')
    from gi.repository import Gtk, Gdk, GdkPixbuf, GLib
except Exception as err:
    print(f"Error cargando librerías GTK3: {err}")
    sys.exit(1)


class EnVivoWindow(Gtk.Window):
    def __init__(self):
        super().__init__(title="Monitor de Ceremonia en Vivo — SiGIC")
        self.set_default_size(980, 550)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.get_style_context().add_class("sigic-window")

        header = Gtk.HeaderBar()
        header.set_show_close_button(True)
        header.set_decoration_layout(":minimize,maximize,close")
        header.props.title = "Monitor de Ceremonia en Vivo y Estrado"
        header.props.subtitle = "Llamador de Escenario, Entrega de Diplomas y Bitácora en Tiempo Real"
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

        btn_sig = Gtk.Button(label="Llamar Siguiente en Fila →")
        btn_sig.get_style_context().add_class("btn-primary")
        btn_sig.connect("clicked", self.on_llamar_siguiente)
        header.pack_start(btn_sig)

        self.lbl_reloj = Gtk.Label()
        self.lbl_reloj.set_markup(f"<span foreground='#34d399' weight='heavy' size='10000'>● EN VIVO {datetime.now().strftime('%H:%M:%S')}</span>")
        header.pack_end(self.lbl_reloj)

        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
        vbox.set_margin_top(8)
        vbox.set_margin_bottom(8)
        vbox.set_margin_start(12)
        vbox.set_margin_end(12)
        self.add(vbox)

        # KPIs compactos
        kpi_row = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=8)
        kpi_row.set_homogeneous(True)
        self.lbl_k_acr, b1 = self._crear_kpi("ACREDITADOS EN SALA", "0", "Presentes en anfiteatro", "#38bdf8")
        self.lbl_k_dip, b2 = self._crear_kpi("DIPLOMAS ENTREGADOS", "0", "Pasaron por escenario", "#34d399")
        self.lbl_k_esp, b3 = self._crear_kpi("EN FILA DE LLAMADO", "0", "Pendientes de subir", "#fbbf24")
        self.lbl_k_inv, b4 = self._crear_kpi("ACOMPAÑANTES EN SALA", "0", "Familiares ubicados", "#c084fc")
        for b in (b1, b2, b3, b4):
            kpi_row.pack_start(b, True, True, 0)
        vbox.pack_start(kpi_row, False, False, 0)

        # Tarjeta destacada: Graduado Actualmente en el Escenario
        stage_card = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=12)
        stage_card.get_style_context().add_class("hero-banner")

        info_stage = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=2)
        lbl_tag = Gtk.Label(xalign=0)
        lbl_tag.set_markup("<span foreground='#38bdf8' weight='heavy' size='8500'>ACTUALMENTE EN EL ESCENARIO PRINCIPAL</span>")
        info_stage.pack_start(lbl_tag, False, False, 0)

        self.lbl_stage_nombre = Gtk.Label(xalign=0)
        self.lbl_stage_nombre.set_markup("<span foreground='#ffffff' weight='heavy' size='14000'>Seleccioná un graduado o pulsá «Llamar Siguiente»</span>")
        info_stage.pack_start(self.lbl_stage_nombre, False, False, 0)

        self.lbl_stage_sub = Gtk.Label(xalign=0)
        self.lbl_stage_sub.set_markup("<span foreground='#94a3b8' size='9200'>Carrera · Butaca · Persona que entrega el diploma</span>")
        info_stage.pack_start(self.lbl_stage_sub, False, False, 0)
        stage_card.pack_start(info_stage, True, True, 0)

        btns_stage = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=6)
        btns_stage.set_valign(Gtk.Align.CENTER)

        btn_llamar = Gtk.Button(label="Llamar Seleccionado")
        btn_llamar.get_style_context().add_class("btn-secondary")
        btn_llamar.connect("clicked", self.on_llamar_seleccionado)
        btns_stage.pack_start(btn_llamar, False, False, 0)

        btn_entregado = Gtk.Button(label="✓ Marcar Diploma Entregado")
        btn_entregado.get_style_context().add_class("btn-emerald")
        btn_entregado.connect("clicked", self.on_marcar_entregado)
        btns_stage.pack_start(btn_entregado, False, False, 0)

        stage_card.pack_end(btns_stage, False, False, 0)
        vbox.pack_start(stage_card, False, False, 0)

        # Mitad inferior: Izquierda Cola de Graduados | Derecha Bitácora en Vivo
        hbox = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        vbox.pack_start(hbox, True, True, 0)

        # Panel izquierdo: Lista de graduados para escenario
        left_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        left_box.get_style_context().add_class("card-panel")

        lbl_l = Gtk.Label(xalign=0)
        lbl_l.set_markup("<span foreground='#f8fafc' weight='heavy' size='10000'>Orden de Llamado al Estrado y Entrega de Diplomas</span>")
        left_box.pack_start(lbl_l, False, False, 0)

        self.store_cola = Gtk.ListStore(int, str, str, str, str, str)
        self.tree_cola = Gtk.TreeView(model=self.store_cola)
        cols = [
            ("Butaca", 1, 60),
            ("Graduado", 2, 185),
            ("Carrera", 3, 180),
            ("Entrega Diploma", 4, 150),
            ("Estado Estrado", 5, 115),
        ]
        for t, idx, w in cols:
            r = Gtk.CellRendererText()
            if idx == 1:
                r.set_property("foreground", "#38bdf8")
                r.set_property("weight", 700)
            elif idx == 2:
                r.set_property("weight", 700)
            elif idx == 5:
                r.set_property("foreground", "#34d399")
                r.set_property("weight", 700)
            c = Gtk.TreeViewColumn(t, r, text=idx)
            c.set_min_width(w)
            self.tree_cola.append_column(c)

        scr_c = Gtk.ScrolledWindow()
        scr_c.set_policy(Gtk.PolicyType.AUTOMATIC, Gtk.PolicyType.AUTOMATIC)
        scr_c.add(self.tree_cola)
        left_box.pack_start(scr_c, True, True, 0)
        hbox.pack_start(left_box, True, True, 0)

        # Panel derecho: Feed de eventos en tiempo real
        right_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        right_box.set_size_request(300, -1)
        right_box.get_style_context().add_class("card-panel")

        lbl_r = Gtk.Label(xalign=0)
        lbl_r.set_markup("<span foreground='#f8fafc' weight='heavy' size='10000'>Bitácora de Eventos en Vivo</span>")
        right_box.pack_start(lbl_r, False, False, 0)

        self.store_ev = Gtk.ListStore(str, str, str)
        tree_ev = Gtk.TreeView(model=self.store_ev)
        for idx, (t, w) in enumerate([("Hora", 62), ("Tipo", 78), ("Detalle", 150)]):
            r = Gtk.CellRendererText()
            if idx == 0:
                r.set_property("foreground", "#38bdf8")
            elif idx == 1:
                r.set_property("weight", 700)
                r.set_property("foreground", "#34d399")
            c = Gtk.TreeViewColumn(t, r, text=idx)
            c.set_min_width(w)
            tree_ev.append_column(c)

        scr_e = Gtk.ScrolledWindow()
        scr_e.set_policy(Gtk.PolicyType.AUTOMATIC, Gtk.PolicyType.AUTOMATIC)
        scr_e.add(tree_ev)
        right_box.pack_start(scr_e, True, True, 0)
        hbox.pack_start(right_box, False, False, 0)

        self.graduado_en_escenario_id = None
        self.refrescar_panel()
        GLib.timeout_add_seconds(1, self._tick_reloj)

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

    def _tick_reloj(self):
        self.lbl_reloj.set_markup(f"<span foreground='#34d399' weight='heavy' size='10000'>● EN VIVO {datetime.now().strftime('%H:%M:%S')}</span>")
        return True

    def refrescar_panel(self):
        resumen = sigic_db.obtener_resumen_global()
        graduados = sigic_db.listar_graduados()

        entregados = sum(1 for g in graduados if g.get("diploma_entregado"))
        en_fila = len(graduados) - entregados

        self.lbl_k_acr.set_markup(f"<span foreground='#38bdf8' weight='heavy' size='13500'>{resumen['acreditados']} / {resumen['total']}</span>")
        self.lbl_k_dip.set_markup(f"<span foreground='#34d399' weight='heavy' size='13500'>{entregados}</span>")
        self.lbl_k_esp.set_markup(f"<span foreground='#fbbf24' weight='heavy' size='13500'>{en_fila}</span>")
        self.lbl_k_inv.set_markup(f"<span foreground='#c084fc' weight='heavy' size='13500'>{resumen['total_invitados']}</span>")

        self.store_cola.clear()
        en_escenario_obj = None
        for g in graduados:
            if g.get("en_escenario"):
                est_txt = "EN ESCENARIO"
                en_escenario_obj = g
            elif g.get("diploma_entregado"):
                est_txt = "ENTREGADO ✓"
            elif g.get("acreditado"):
                est_txt = "EN BUTACA"
            else:
                est_txt = "PENDIENTE"

            self.store_cola.append([
                int(g.get("id", 0)),
                g.get("asiento", "-"),
                g.get("nombre", ""),
                g.get("carrera", ""),
                g.get("entregador", "Docente Titular"),
                est_txt,
            ])

        if not en_escenario_obj and graduados:
            en_escenario_obj = next((g for g in graduados if not g.get("diploma_entregado")), graduados[0])

        if en_escenario_obj:
            self.graduado_en_escenario_id = int(en_escenario_obj.get("id", 0))
            self.lbl_stage_nombre.set_markup(
                f"<span foreground='#ffffff' weight='heavy' size='14000'>{en_escenario_obj.get('nombre')}</span>"
            )
            self.lbl_stage_sub.set_markup(
                f"<span foreground='#38bdf8' weight='bold' size='9500'>{en_escenario_obj.get('carrera')}</span>   ·   "
                f"<span foreground='#34d399' weight='bold' size='9500'>Butaca {en_escenario_obj.get('asiento', '-')}</span>   ·   "
                f"<span foreground='#cbd5e1' size='9500'>Entrega: {en_escenario_obj.get('entregador', 'Autoridad Beltrán')}</span>"
            )

        self.store_ev.clear()
        for ev in sigic_db.listar_eventos()[:30]:
            self.store_ev.append([ev.get("hora", ""), ev.get("tipo", ""), ev.get("detalle", "")])

    def _obtener_id_seleccionado(self):
        sel = self.tree_cola.get_selection()
        model, treeiter = sel.get_selected()
        if treeiter:
            return model[treeiter][0]
        return self.graduado_en_escenario_id

    def on_llamar_seleccionado(self, button):
        gid = self._obtener_id_seleccionado()
        if not gid:
            return
        datos = sigic_db.cargar_datos()
        for g in datos.get("graduados", []):
            g["en_escenario"] = (int(g.get("id", 0)) == int(gid))
            if g["en_escenario"]:
                datos.setdefault("eventos_envivo", []).insert(0, {
                    "hora": datetime.now().strftime("%H:%M:%S"),
                    "tipo": "ESCENARIO",
                    "detalle": f"Subió al estrado: {g.get('nombre')} ({g.get('asiento', '-')})"
                })
        sigic_db.guardar_datos(datos)
        self.refrescar_panel()

    def on_marcar_entregado(self, button):
        gid = self._obtener_id_seleccionado()
        if not gid:
            return
        datos = sigic_db.cargar_datos()
        for g in datos.get("graduados", []):
            if int(g.get("id", 0)) == int(gid):
                g["diploma_entregado"] = True
                g["en_escenario"] = False
                datos.setdefault("eventos_envivo", []).insert(0, {
                    "hora": datetime.now().strftime("%H:%M:%S"),
                    "tipo": "DIPLOMA",
                    "detalle": f"Diploma entregado a {g.get('nombre')}"
                })
        sigic_db.guardar_datos(datos)
        self.on_llamar_siguiente(None)

    def on_llamar_siguiente(self, button):
        datos = sigic_db.cargar_datos()
        graduados = datos.get("graduados", [])
        siguiente = next((g for g in graduados if not g.get("diploma_entregado") and not g.get("en_escenario")), None)
        for g in graduados:
            g["en_escenario"] = False
        if siguiente:
            siguiente["en_escenario"] = True
            datos.setdefault("eventos_envivo", []).insert(0, {
                "hora": datetime.now().strftime("%H:%M:%S"),
                "tipo": "LLAMADO",
                "detalle": f"Llamado al escenario: {siguiente.get('nombre')} ({siguiente.get('asiento', '-')})"
            })
        sigic_db.guardar_datos(datos)
        self.refrescar_panel()


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
        provider.load_from_data(sigic_db.CSS_SUITE_OSCURA)
        screen = Gdk.Screen.get_default()
        if screen:
            Gtk.StyleContext.add_provider_for_screen(screen, provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION)
    except Exception as e:
        print(f"Aviso CSS: {e}")
    win = EnVivoWindow()
    win.connect("destroy", Gtk.main_quit)
    win.show_all()
    Gtk.main()



if __name__ == "__main__":
    main()
