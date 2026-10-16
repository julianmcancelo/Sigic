#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC — Gestión Nativa de Ceremonias de Colación (Edición Compacta)
Consulta, creación, edición, activación y eliminación de actos institucionales
con persistencia compartida en sigic_db.py.
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


class DialogoCeremonia(Gtk.Dialog):
    """Diálogo compacto para crear o editar un acto de colación."""
    def __init__(self, parent, ceremonia=None):
        es_ed = ceremonia is not None
        super().__init__(
            title="Editar Ceremonia" if es_ed else "Nueva Ceremonia — SiGIC Beltrán",
            transient_for=parent,
            flags=0
        )
        self.set_default_size(430, 310)
        self.set_resizable(False)
        self.ceremonia_base = ceremonia

        box = self.get_content_area()
        box.set_spacing(8)
        box.set_margin_top(12)
        box.set_margin_bottom(10)
        box.set_margin_start(14)
        box.set_margin_end(14)

        lbl_tit = Gtk.Label(xalign=0)
        lbl_tit.set_markup(
            f"<span foreground='#f8fafc' weight='heavy' size='11500'>{'Editar Acto de Colación' if es_ed else 'Programar Acto de Colación'}</span>\n"
            "<span foreground='#38bdf8' size='9000'>Configurá fecha, hora, sede y aforo del anfiteatro.</span>"
        )
        box.pack_start(lbl_tit, False, False, 0)

        grid = Gtk.Grid()
        grid.set_column_spacing(10)
        grid.set_row_spacing(8)
        box.pack_start(grid, True, True, 2)

        self.ent_nombre = Gtk.Entry()
        self.ent_nombre.set_placeholder_text("Ej: Colación Beltrán 2026 — Tecnicaturas")
        self.ent_fecha = Gtk.Entry()
        self.ent_fecha.set_placeholder_text("Ej: 28 de Noviembre de 2026")
        self.ent_hora = Gtk.Entry()
        self.ent_hora.set_placeholder_text("Ej: 18:00 hs")
        self.ent_lugar = Gtk.Entry()
        self.ent_lugar.set_placeholder_text("Ej: Anfiteatro Central Beltrán")
        self.ent_aforo = Gtk.Entry()
        self.ent_aforo.set_text("200")

        if es_ed:
            self.ent_nombre.set_text(ceremonia.get("nombre", ""))
            self.ent_fecha.set_text(ceremonia.get("fecha", ""))
            self.ent_hora.set_text(ceremonia.get("hora", ""))
            self.ent_lugar.set_text(ceremonia.get("lugar", ""))
            self.ent_aforo.set_text(str(ceremonia.get("aforo", 200)))

        for i, (etiqueta, widget) in enumerate([
            ("Nombre del Acto *", self.ent_nombre),
            ("Fecha *", self.ent_fecha),
            ("Horario *", self.ent_hora),
            ("Sede / Anfiteatro *", self.ent_lugar),
            ("Aforo de Butacas", self.ent_aforo),
        ]):
            lbl = Gtk.Label(xalign=0)
            lbl.set_markup(f"<span foreground='#cbd5e1' weight='bold' size='9200'>{etiqueta}</span>")
            grid.attach(lbl, 0, i, 1, 1)
            widget.set_hexpand(True)
            grid.attach(widget, 1, i, 1, 1)

        btn_c = self.add_button("Cancelar", Gtk.ResponseType.CANCEL)
        btn_c.get_style_context().add_class("btn-secondary")
        btn_ok = self.add_button("Guardar Ceremonia", Gtk.ResponseType.OK)
        btn_ok.get_style_context().add_class("btn-primary")
        self.show_all()

    def obtener_datos(self):
        try:
            aforo = int(self.ent_aforo.get_text().strip())
        except ValueError:
            aforo = 200
        d = {
            "nombre": self.ent_nombre.get_text().strip(),
            "fecha": self.ent_fecha.get_text().strip() or "A confirmar",
            "hora": self.ent_hora.get_text().strip() or "18:00 hs",
            "lugar": self.ent_lugar.get_text().strip() or "Anfiteatro Central Beltrán",
            "aforo": aforo,
        }
        if self.ceremonia_base:
            d["id"] = self.ceremonia_base.get("id")
            d["activa"] = self.ceremonia_base.get("activa", False)
        return d


class CeremoniasSigic(Gtk.Window):
    def __init__(self):
        super().__init__(title="Ceremonias de Colación — SiGIC")
        self.set_default_size(900, 520)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.get_style_context().add_class("sigic-window")

        header = Gtk.HeaderBar()
        header.set_show_close_button(True)
        header.set_decoration_layout(":minimize,maximize,close")
        header.props.title = "Ceremonias de Colación"
        header.props.subtitle = "Programación, Edición y Activación de Actos Académicos"
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

        btn_nueva = Gtk.Button(label="+ Nueva Ceremonia")
        btn_nueva.get_style_context().add_class("btn-primary")
        btn_nueva.connect("clicked", self.on_abrir_nueva_ceremonia)
        header.pack_start(btn_nueva)

        btn_act = Gtk.Button(label="Actualizar")
        btn_act.get_style_context().add_class("btn-secondary")
        btn_act.connect("clicked", lambda b: self.renderizar())
        header.pack_end(btn_act)

        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
        vbox.set_margin_top(10)
        vbox.set_margin_bottom(10)
        vbox.set_margin_start(14)
        vbox.set_margin_end(14)
        self.add(vbox)

        lbl_info = Gtk.Label(xalign=0)
        lbl_info.set_markup(
            "<span foreground='#f8fafc' weight='heavy' size='11000'>Actos Institucionales Registrados</span>   "
            "<span foreground='#94a3b8' size='9000'>·  La ceremonia activa determina el padrón, el anfiteatro y las credenciales QR vigentes.</span>"
        )
        vbox.pack_start(lbl_info, False, False, 0)

        scroll = Gtk.ScrolledWindow()
        scroll.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC)
        self.box_cards = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
        scroll.add(self.box_cards)
        vbox.pack_start(scroll, True, True, 0)

        self.renderizar()

    def renderizar(self):
        for child in self.box_cards.get_children():
            self.box_cards.remove(child)

        items = sigic_db.listar_ceremonias()
        total_padron = len(sigic_db.listar_graduados())

        for c in items:
            card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
            card.get_style_context().add_class("card-panel")

            es_activa = c.get("activa", False)

            box_h = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=8)
            lbl_tit = Gtk.Label(xalign=0)
            color_tit = "#38bdf8" if es_activa else "#ffffff"
            lbl_tit.set_markup(f"<span foreground='{color_tit}' weight='heavy' size='11200'>{c.get('nombre', 'Acto de Colación')}</span>")
            box_h.pack_start(lbl_tit, True, True, 0)

            if es_activa:
                badge = Gtk.Label(label="● CEREMONIA ACTIVA")
                badge.get_style_context().add_class("pill-ok")
                box_h.pack_start(badge, False, False, 0)
            else:
                btn_activar = Gtk.Button(label="Activar como Principal")
                btn_activar.get_style_context().add_class("btn-emerald")
                btn_activar.connect("clicked", self.on_activar_ceremonia, c)
                box_h.pack_start(btn_activar, False, False, 0)

            btn_ed = Gtk.Button(label="Editar")
            btn_ed.get_style_context().add_class("btn-secondary")
            btn_ed.connect("clicked", self.on_editar_ceremonia, c)
            box_h.pack_start(btn_ed, False, False, 0)

            if not es_activa:
                btn_del = Gtk.Button(label="Eliminar")
                btn_del.get_style_context().add_class("btn-danger")
                btn_del.connect("clicked", self.on_eliminar_ceremonia, c)
                box_h.pack_start(btn_del, False, False, 0)

            card.pack_start(box_h, False, False, 0)

            lbl_det = Gtk.Label(xalign=0)
            graduados = total_padron if es_activa else c.get("graduados", 0)
            lbl_det.set_markup(
                f"<span foreground='#94a3b8' size='9200'>Fecha y Hora:</span> <span foreground='#38bdf8' weight='bold' size='9200'>{c.get('fecha')} · {c.get('hora')}</span>   |   "
                f"<span foreground='#94a3b8' size='9200'>Sede:</span> <span foreground='#f8fafc' weight='bold' size='9200'>{c.get('lugar')}</span>   |   "
                f"<span foreground='#94a3b8' size='9200'>Padrón:</span> <span foreground='#34d399' weight='bold' size='9200'>{graduados} graduados</span>   |   "
                f"<span foreground='#94a3b8' size='9200'>Aforo:</span> <span foreground='#c084fc' weight='bold' size='9200'>{c.get('aforo', 200)} butacas</span>"
            )
            card.pack_start(lbl_det, False, False, 0)
            self.box_cards.pack_start(card, False, False, 0)

        self.box_cards.show_all()

    def on_abrir_nueva_ceremonia(self, button):
        dlg = DialogoCeremonia(self, None)
        if dlg.run() == Gtk.ResponseType.OK:
            datos = dlg.obtener_datos()
            dlg.destroy()
            if datos["nombre"]:
                sigic_db.crear_ceremonia(datos)
                self.renderizar()
        else:
            dlg.destroy()

    def on_editar_ceremonia(self, button, ceremonia):
        dlg = DialogoCeremonia(self, ceremonia)
        if dlg.run() == Gtk.ResponseType.OK:
            datos = dlg.obtener_datos()
            dlg.destroy()
            if datos["nombre"]:
                db = sigic_db.cargar_datos()
                for c in db.get("ceremonias", []):
                    if int(c.get("id", 0)) == int(ceremonia.get("id", 0)):
                        c.update(datos)
                sigic_db.guardar_datos(db)
                self.renderizar()
        else:
            dlg.destroy()

    def on_eliminar_ceremonia(self, button, ceremonia):
        db = sigic_db.cargar_datos()
        db["ceremonias"] = [c for c in db.get("ceremonias", []) if int(c.get("id", 0)) != int(ceremonia.get("id", 0))]
        sigic_db.guardar_datos(db)
        self.renderizar()

    def on_activar_ceremonia(self, button, ceremonia):
        sigic_db.activar_ceremonia(ceremonia.get("id"))
        self.renderizar()


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
    win = CeremoniasSigic()
    win.connect("destroy", Gtk.main_quit)
    win.show_all()
    Gtk.main()



if __name__ == "__main__":
    main()
