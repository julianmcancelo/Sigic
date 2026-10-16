#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC — Gestión Nativa de Ceremonias de Colación
Aplicación nativa GTK3 para consultar, crear y activar actos institucionales.
Instituto Tecnológico Beltrán
"""

import os
import sys
import json
import urllib.request
import urllib.error
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
    background-color: #f8fafc;
}

headerbar.sigic-headerbar {
    background-color: #ffffff;
    border-bottom: 1px solid #cbd5e1;
}

.card-ceremonia {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    padding: 16px;
}

.card-ceremonia.activa {
    border: 2px solid #0284c7;
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
    padding: 7px 14px;
    border-width: 0px;
}

button.btn-primary:hover {
    background-image: none;
    background-color: #0369a1;
}

button.btn-secondary {
    background-image: none;
    background-color: #ffffff;
    color: #334155;
    font-size: 12px;
    font-weight: bold;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 7px 14px;
}

button.btn-secondary:hover {
    background-image: none;
    background-color: #f1f5f9;
}
"""

CEREMONIAS_DEMO = [
    {
        "id": 1,
        "nombre": "Colación Beltrán 2026 — Tecnicaturas",
        "fecha": "28 de Noviembre de 2026",
        "hora": "18:00 hs",
        "lugar": "Anfiteatro Central — Instituto Beltrán",
        "activa": True,
        "graduados": 48,
        "aforo": 200
    },
    {
        "id": 2,
        "nombre": "Colación Beltrán 2026 — Ingeniería y Posgrados",
        "fecha": "05 de Diciembre de 2026",
        "hora": "19:00 hs",
        "lugar": "Aula Magna Beltrán",
        "activa": False,
        "graduados": 35,
        "aforo": 150
    }
]


class DialogoNuevaCeremonia(Gtk.Dialog):
    """Diálogo emergente para crear un nuevo acto de colación."""
    def __init__(self, parent):
        super().__init__(title="Nueva Ceremonia — SiGIC Beltrán", transient_for=parent, flags=0)
        self.set_default_size(460, 360)
        self.set_resizable(False)

        box_content = self.get_content_area()
        box_content.set_spacing(10)
        box_content.set_margin_top(16)
        box_content.set_margin_bottom(16)
        box_content.set_margin_start(20)
        box_content.set_margin_end(20)

        lbl_tit = Gtk.Label(xalign=0)
        lbl_tit.set_markup("<span foreground='#0f172a' weight='heavy' size='13000'>Programar Acto de Colación</span>\n<small><span foreground='#64748b'>Configurá la fecha, sede y aforo de la nueva colación.</span></small>")
        box_content.pack_start(lbl_tit, False, False, 4)

        grid = Gtk.Grid()
        grid.set_column_spacing(12)
        grid.set_row_spacing(10)
        box_content.pack_start(grid, True, True, 0)

        self.ent_nombre = Gtk.Entry()
        self.ent_nombre.set_placeholder_text("Ej: Colación Beltrán 2026")

        self.ent_fecha = Gtk.Entry()
        self.ent_fecha.set_placeholder_text("Ej: 28 de Noviembre de 2026")

        self.ent_hora = Gtk.Entry()
        self.ent_hora.set_placeholder_text("Ej: 18:00 hs")

        self.ent_lugar = Gtk.Entry()
        self.ent_lugar.set_placeholder_text("Ej: Anfiteatro Central Beltrán")

        self.ent_aforo = Gtk.Entry()
        self.ent_aforo.set_text("200")

        filas = [
            ("Nombre del Acto *", self.ent_nombre),
            ("Fecha *", self.ent_fecha),
            ("Hora *", self.ent_hora),
            ("Lugar / Sede *", self.ent_lugar),
            ("Aforo de Butacas", self.ent_aforo)
        ]

        for i, (etiqueta, widget) in enumerate(filas):
            lbl = Gtk.Label(label=etiqueta, xalign=0)
            grid.attach(lbl, 0, i, 1, 1)
            widget.set_hexpand(True)
            grid.attach(widget, 1, i, 1, 1)

        self.add_button("Cancelar", Gtk.ResponseType.CANCEL)
        btn_crear = self.add_button("Crear Ceremonia", Gtk.ResponseType.OK)
        btn_crear.get_style_context().add_class("btn-primary")
        self.show_all()

    def obtener_datos(self):
        try:
            aforo = int(self.ent_aforo.get_text().strip())
        except ValueError:
            aforo = 200
        return {
            "nombre": self.ent_nombre.get_text().strip(),
            "fecha": self.ent_fecha.get_text().strip(),
            "hora": self.ent_hora.get_text().strip(),
            "lugar": self.ent_lugar.get_text().strip(),
            "aforo": aforo,
            "activa": False
        }


class CeremoniasSigic(Gtk.Window):
    def __init__(self):
        super().__init__(title="Ceremonias de Colación — SiGIC")
        self.set_default_size(840, 560)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.get_style_context().add_class("sigic-window")

        self.ceremonias = []

        # HeaderBar institucional
        header = Gtk.HeaderBar()
        header.set_show_close_button(True)
        header.props.title = "Ceremonias de Colación"
        header.props.subtitle = "Instituto Tecnológico Beltrán"
        header.get_style_context().add_class("sigic-headerbar")
        self.set_titlebar(header)

        btn_nueva = Gtk.Button()
        lbl_nc = Gtk.Label()
        lbl_nc.set_markup("<span foreground='#ffffff' weight='heavy'>+ Nueva Ceremonia</span>")
        btn_nueva.add(lbl_nc)
        btn_nueva.get_style_context().add_class("btn-primary")
        btn_nueva.connect("clicked", self.on_abrir_nueva_ceremonia)
        header.pack_start(btn_nueva)

        btn_act = Gtk.Button()
        lbl_a = Gtk.Label()
        lbl_a.set_markup("<span foreground='#334155' weight='bold'>Actualizar</span>")
        btn_act.add(lbl_a)
        btn_act.get_style_context().add_class("btn-secondary")
        btn_act.connect("clicked", lambda b: self.cargar_ceremonias())
        header.pack_end(btn_act)

        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=14)
        vbox.set_margin_top(14)
        vbox.set_margin_bottom(14)
        vbox.set_margin_start(18)
        vbox.set_margin_end(18)
        self.add(vbox)

        # Encabezado informativo
        box_top = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=12)
        lbl_info = Gtk.Label(xalign=0)
        lbl_info.set_markup("<span foreground='#0f172a' weight='heavy' size='12000'>Actos Institucionales Registrados</span>\n<small><span foreground='#64748b'>Visualizá, programá y activá las ceremonias de graduación del Beltrán.</span></small>")
        box_top.pack_start(lbl_info, True, True, 0)
        vbox.pack_start(box_top, False, False, 0)

        # Contenedor scrolleable para las tarjetas
        scroll = Gtk.ScrolledWindow()
        scroll.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC)
        self.box_cards = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=12)
        scroll.add(self.box_cards)
        vbox.pack_start(scroll, True, True, 0)

        self.cargar_ceremonias()

    def cargar_ceremonias(self):
        threading.Thread(target=self._hilo_carga, daemon=True).start()

    def _hilo_carga(self):
        url = "http://localhost:3000/api/ceremonias"
        items = []
        try:
            req = urllib.request.Request(url, timeout=3)
            with urllib.request.urlopen(req) as resp:
                res = json.loads(resp.read().decode())
                items = res.get("ceremonias") or []
        except Exception:
            pass

        if not items:
            items = list(CEREMONIAS_DEMO)

        self.ceremonias = items
        GLib.idle_add(self._renderizar_ceremonias, items)

    def _renderizar_ceremonias(self, items):
        for child in self.box_cards.get_children():
            self.box_cards.remove(child)

        for c in items:
            card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
            card.get_style_context().add_class("card-ceremonia")

            es_activa = c.get("activa", False)
            if es_activa:
                card.get_style_context().add_class("activa")

            # Fila superior de la tarjeta: Título + Badge de Estado / Botón Activar
            box_h = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
            lbl_tit = Gtk.Label(xalign=0)
            lbl_tit.set_markup(f"<span foreground='#0f172a' weight='heavy' size='11500'>{c.get('nombre', 'Acto de Colación')}</span>")
            box_h.pack_start(lbl_tit, True, True, 0)

            if es_activa:
                badge = Gtk.Label()
                badge.set_markup("<span foreground='#0284c7' weight='heavy'>● CEREMONIA ACTIVA</span>")
                box_h.pack_start(badge, False, False, 0)
            else:
                btn_activar = Gtk.Button()
                lbl_ac = Gtk.Label()
                lbl_ac.set_markup("<span foreground='#0284c7' weight='bold'>Activar como Principal</span>")
                btn_activar.add(lbl_ac)
                btn_activar.get_style_context().add_class("btn-secondary")
                btn_activar.connect("clicked", self.on_activar_ceremonia, c)
                box_h.pack_start(btn_activar, False, False, 0)

            card.pack_start(box_h, False, False, 0)

            # Detalles
            lbl_det = Gtk.Label(xalign=0)
            fecha = c.get("fecha", "A definir")
            hora = c.get("hora", "")
            lugar = c.get("lugar", "Instituto Beltrán")
            graduados = c.get("graduados", 0)
            aforo = c.get("aforo", 200)

            lbl_det.set_markup(
                f"<small><span foreground='#475569'>Fecha y Hora:</span> <span weight='bold'>{fecha} {hora}</span>  •  "
                f"<span foreground='#475569'>Lugar:</span> <span weight='bold'>{lugar}</span>\n"
                f"<span foreground='#475569'>Graduados Inscriptos:</span> <span weight='bold'>{graduados}</span>  •  "
                f"<span foreground='#475569'>Capacidad del Anfiteatro:</span> <span weight='bold'>{aforo} butacas</span></small>"
            )
            card.pack_start(lbl_det, False, False, 0)

            self.box_cards.pack_start(card, False, False, 0)

        self.box_cards.show_all()

    def on_abrir_nueva_ceremonia(self, button):
        dlg = DialogoNuevaCeremonia(self)
        resp = dlg.run()
        if resp == Gtk.ResponseType.OK:
            datos = dlg.obtener_datos()
            dlg.destroy()
            if not datos["nombre"]:
                self.mostrar_alerta("Campo Requerido", "Debe ingresar el nombre del acto de colación.")
                return
            threading.Thread(target=self._hilo_guardar_ceremonia, args=(datos,), daemon=True).start()
        else:
            dlg.destroy()

    def _hilo_guardar_ceremonia(self, datos):
        url = "http://localhost:3000/api/ceremonias"
        try:
            payload = json.dumps(datos).encode("utf-8")
            req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
            urllib.request.urlopen(req, timeout=4)
        except Exception as err:
            print(f"Aviso API al crear ceremonia: {err}")

        datos["id"] = len(self.ceremonias) + 1
        datos["graduados"] = 0
        self.ceremonias.append(datos)
        GLib.idle_add(self._renderizar_ceremonias, self.ceremonias)
        GLib.idle_add(self.mostrar_alerta, "Ceremonia Programada", f"Se ha registrado el acto «{datos['nombre']}».")

    def on_activar_ceremonia(self, button, ceremonia):
        cid = ceremonia.get("id")
        for c in self.ceremonias:
            c["activa"] = (c.get("id") == cid)
        self._renderizar_ceremonias(self.ceremonias)

        def _hilo_act():
            try:
                url = f"http://localhost:3000/api/ceremonias/{cid}/activar"
                req = urllib.request.Request(url, method="PUT")
                urllib.request.urlopen(req, timeout=3)
            except Exception:
                pass
        threading.Thread(target=_hilo_act, daemon=True).start()
        self.mostrar_alerta("Ceremonia Activada", f"«{ceremonia.get('nombre')}» es ahora la ceremonia activa del sistema.")

    def mostrar_alerta(self, titulo, mensaje):
        dlg = Gtk.MessageDialog(
            transient_for=self,
            flags=0,
            message_type=Gtk.MessageType.INFO,
            buttons=Gtk.ButtonsType.OK,
            text=titulo
        )
        dlg.format_secondary_text(mensaje)
        dlg.run()
        dlg.destroy()


def aplicar_estilos():
    try:
        css_provider = Gtk.CssProvider()
        css_provider.load_from_data(CSS_ESTILOS)
        screen = Gdk.Screen.get_default()
        if screen:
            Gtk.StyleContext.add_provider_for_screen(screen, css_provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION)
    except Exception as e:
        print(f"Aviso CSS: {e}")

def main():
    win = CeremoniasSigic()
    aplicar_estilos()
    win.connect("destroy", Gtk.main_quit)
    win.show_all()
    Gtk.main()

if __name__ == "__main__":
    main()
