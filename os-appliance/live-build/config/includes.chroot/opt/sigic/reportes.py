#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC — Panel de Reportes, Estadísticas y Exportación de Actas (Edición Compacta)
Métricas dinámicas por carrera y exportación real de CSV y Acta Oficial HTML/PDF.
Instituto Tecnológico Beltrán
"""

import os
import sys
import subprocess
from datetime import datetime

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


class ReportesWindow(Gtk.Window):
    def __init__(self):
        super().__init__(title="Panel de Reportes y Estadísticas — SiGIC")
        self.set_default_size(960, 540)
        self.set_position(Gtk.WindowPosition.CENTER)
        self.get_style_context().add_class("sigic-window")

        header = Gtk.HeaderBar()
        header.set_show_close_button(True)
        header.set_decoration_layout(":minimize,maximize,close")
        header.props.title = "Panel de Reportes, Estadísticas y Auditoría"
        header.props.subtitle = "Métricas Reales por Carrera y Exportación Oficial CSV / Acta HTML"
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

        btn_csv = Gtk.Button(label="Exportar Padrón y Métricas CSV")
        btn_csv.get_style_context().add_class("btn-primary")
        btn_csv.connect("clicked", self.on_exportar_csv)
        header.pack_start(btn_csv)

        btn_acta = Gtk.Button(label="Generar Acta Oficial Imprimible")
        btn_acta.get_style_context().add_class("btn-emerald")
        btn_acta.connect("clicked", self.on_exportar_acta)
        header.pack_end(btn_acta)

        vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
        vbox.set_margin_top(8)
        vbox.set_margin_bottom(8)
        vbox.set_margin_start(12)
        vbox.set_margin_end(12)
        self.add(vbox)

        # KPIs compactos
        kpi_row = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=8)
        kpi_row.set_homogeneous(True)
        self.lbl_k_tot, b1 = self._crear_kpi("TOTAL PADRÓN", "0", "Alumnos registrados", "#38bdf8")
        self.lbl_k_cnf, b2 = self._crear_kpi("ASISTENCIA CONFIRMADA", "0%", "Confirmados + Aceptados", "#34d399")
        self.lbl_k_acr, b3 = self._crear_kpi("ACREDITADOS QR", "0", "Validados en puerta", "#fbbf24")
        self.lbl_k_ocu, b4 = self._crear_kpi("OCUPACIÓN SALA", "0", "Butacas asignadas", "#c084fc")
        for b in (b1, b2, b3, b4):
            kpi_row.pack_start(b, True, True, 0)
        vbox.pack_start(kpi_row, False, False, 0)

        # Panel central: Izquierda Barras por Carrera | Derecha Tabla Detallada de Auditoría
        hbox = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        vbox.pack_start(hbox, True, True, 0)

        # Barras de distribución por carrera
        left_card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
        left_card.set_size_request(380, -1)
        left_card.get_style_context().add_class("card-panel")

        lbl_l = Gtk.Label(xalign=0)
        lbl_l.set_markup("<span foreground='#f8fafc' weight='heavy' size='10200'>Distribución y Asistencia por Carrera</span>")
        left_card.pack_start(lbl_l, False, False, 0)

        self.box_carreras = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
        left_card.pack_start(self.box_carreras, True, True, 2)
        hbox.pack_start(left_card, False, False, 0)

        # Tabla resumen de auditoría por estado y carrera
        right_card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        right_card.get_style_context().add_class("card-panel")

        lbl_r = Gtk.Label(xalign=0)
        lbl_r.set_markup("<span foreground='#f8fafc' weight='heavy' size='10200'>Desglose Operativo del Padrón y Diplomas</span>")
        right_card.pack_start(lbl_r, False, False, 0)

        self.store_rep = Gtk.ListStore(str, str, str, str, str, str)
        tree = Gtk.TreeView(model=self.store_rep)
        for idx, (t, w) in enumerate([
            ("Graduado", 160),
            ("DNI", 80),
            ("Carrera", 150),
            ("Estado", 95),
            ("Butaca", 60),
            ("Acreditación", 95),
        ]):
            r = Gtk.CellRendererText()
            if idx == 0:
                r.set_property("weight", 700)
            elif idx == 3:
                r.set_property("foreground", "#38bdf8")
                r.set_property("weight", 700)
            elif idx == 5:
                r.set_property("foreground", "#34d399")
                r.set_property("weight", 700)
            c = Gtk.TreeViewColumn(t, r, text=idx)
            c.set_min_width(w)
            tree.append_column(c)

        scr = Gtk.ScrolledWindow()
        scr.set_policy(Gtk.PolicyType.AUTOMATIC, Gtk.PolicyType.AUTOMATIC)
        scr.add(tree)
        right_card.pack_start(scr, True, True, 0)
        hbox.pack_start(right_card, True, True, 0)

        self.refrescar_metricas()

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

    def refrescar_metricas(self):
        res = sigic_db.obtener_resumen_global()
        graduados = sigic_db.listar_graduados()

        self.lbl_k_tot.set_markup(f"<span foreground='#38bdf8' weight='heavy' size='13500'>{res['total']} Egresados</span>")
        self.lbl_k_cnf.set_markup(f"<span foreground='#34d399' weight='heavy' size='13500'>{res['porcentaje_confirmados']}% ({res['confirmados']})</span>")
        self.lbl_k_acr.set_markup(f"<span foreground='#fbbf24' weight='heavy' size='13500'>{res['acreditados']} Presentes</span>")
        self.lbl_k_ocu.set_markup(f"<span foreground='#c084fc' weight='heavy' size='13500'>{res['butacas_ocupadas']} Butacas</span>")

        for ch in self.box_carreras.get_children():
            self.box_carreras.remove(ch)

        conteo = {}
        for g in graduados:
            c = g.get("carrera", "Sin especificar")
            conteo[c] = conteo.get(c, 0) + 1

        total = max(len(graduados), 1)
        for carrera, cant in conteo.items():
            pct = int(round((cant / total) * 100))
            row = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=3)
            top = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL)
            l_nom = Gtk.Label(xalign=0)
            l_nom.set_markup(f"<span foreground='#e2e8f0' weight='bold' size='9000'>{carrera}</span>")
            l_val = Gtk.Label(xalign=1)
            l_val.set_markup(f"<span foreground='#38bdf8' weight='heavy' size='9000'>{cant} alumnos ({pct}%)</span>")
            top.pack_start(l_nom, True, True, 0)
            top.pack_end(l_val, False, False, 0)
            row.pack_start(top, False, False, 0)

            pb = Gtk.ProgressBar()
            pb.set_fraction(cant / total)
            row.pack_start(pb, False, False, 0)
            self.box_carreras.pack_start(row, False, False, 0)

        self.box_carreras.show_all()

        self.store_rep.clear()
        for g in graduados:
            self.store_rep.append([
                g.get("nombre", ""),
                g.get("dni", ""),
                g.get("carrera", ""),
                g.get("estado", "PENDIENTE"),
                g.get("asiento", "-"),
                "ACREDITADO ✓" if g.get("acreditado") else "PENDIENTE",
            ])

    def on_exportar_csv(self, button):
        graduados = sigic_db.listar_graduados()
        escritorio = os.path.expanduser("~/Desktop")
        os.makedirs(escritorio, exist_ok=True)
        ruta = os.path.join(escritorio, "reporte_oficial_sigic_beltran.csv")
        with open(ruta, "w", encoding="utf-8") as f:
            f.write("nombre,dni,legajo,carrera,correo,estado,asiento,acreditado,entregador\n")
            for g in graduados:
                f.write(
                    f"\"{g.get('nombre','')}\",{g.get('dni','')},{g.get('legajo','')},"
                    f"\"{g.get('carrera','')}\",{g.get('correo','')},{g.get('estado','')},"
                    f"{g.get('asiento','')},{'SI' if g.get('acreditado') else 'NO'},\"{g.get('entregador','')}\"\n"
                )
        self._msg("Reporte CSV Exportado", f"Archivo guardado en:\n{ruta}")

    def on_exportar_acta(self, button):
        res = sigic_db.obtener_resumen_global()
        graduados = sigic_db.listar_graduados()
        cer = res["ceremonia"]
        escritorio = os.path.expanduser("~/Desktop")
        os.makedirs(escritorio, exist_ok=True)
        ruta = os.path.join(escritorio, "Acta_Oficial_Colacion_Beltran.html")

        filas_html = "".join(
            f"<tr><td>{g.get('legajo')}</td><td><b>{g.get('nombre')}</b></td><td>{g.get('dni')}</td>"
            f"<td>{g.get('carrera')}</td><td>{g.get('asiento','-')}</td><td>{g.get('estado')}</td>"
            f"<td>{'ACREDITADO' if g.get('acreditado') else 'EN ESPERA'}</td></tr>"
            for g in graduados
        )

        html = f"""<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>Acta Oficial — SiGIC Beltrán</title>
<style>
body {{ font-family: sans-serif; margin: 28px; color: #0f172a; }}
h1 {{ margin-bottom: 4px; color: #0369a1; }}
table {{ width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }}
th, td {{ border: 1px solid #cbd5e1; padding: 7px 10px; text-align: left; }}
th {{ background: #0f172a; color: #fff; }}
</style></head><body>
<h1>ACTA OFICIAL DE COLACIÓN — INSTITUTO TECNOLÓGICO BELTRÁN</h1>
<p><b>Acto:</b> {cer.get('nombre')} &nbsp;|&nbsp; <b>Fecha:</b> {cer.get('fecha')} {cer.get('hora')} &nbsp;|&nbsp; <b>Sede:</b> {cer.get('lugar')}</p>
<p><b>Graduados en Padrón:</b> {res['total']} &nbsp;|&nbsp; <b>Confirmados:</b> {res['confirmados']} &nbsp;|&nbsp; <b>Acreditados:</b> {res['acreditados']}</p>
<table><thead><tr><th>Legajo</th><th>Graduado</th><th>DNI</th><th>Carrera</th><th>Butaca</th><th>Estado</th><th>Portería</th></tr></thead>
<tbody>{filas_html}</tbody></table>
<p style="margin-top:24px;font-size:12px;color:#64748b;">Emitido por SiGIC — Sistema de Gestión Institucional de Colaciones ({datetime.now().strftime('%d/%m/%Y %H:%M')})</p>
</body></html>"""
        with open(ruta, "w", encoding="utf-8") as f:
            f.write(html)
        try:
            subprocess.Popen(["xdg-open", ruta])
        except Exception:
            pass
        self._msg("Acta Oficial Generada", f"Acta institucional generada en:\n{ruta}")

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
        provider.load_from_data(sigic_db.CSS_SUITE_OSCURA)
        screen = Gdk.Screen.get_default()
        if screen:
            Gtk.StyleContext.add_provider_for_screen(screen, provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION)
    except Exception as e:
        print(f"Aviso CSS: {e}")
    win = ReportesWindow()
    win.connect("destroy", Gtk.main_quit)
    win.show_all()
    Gtk.main()



if __name__ == "__main__":
    main()
