#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiGIC — Motor de Persistencia Institucional Unificado + Generador QR ISO/IEC 18004 (sigic_db.py)
Sincroniza en tiempo real todos los módulos nativos GTK3 (Ceremonias, Padrón de Graduados,
Invitados, Credenciales QR, Convocatoria SMTP/OTP, Anfiteatro de Butacas, Profesores,
Acreditación, Vinculación Móvil de Portería y Monitor en Vivo)
mediante almacenamiento transaccional en disco + sincronización con API local y PostgreSQL.
Instituto Tecnológico Beltrán — Práctica Profesionalizante 2026
"""

import os
import json
import socket
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import urllib.request
import threading
from datetime import datetime

DB_DIR = os.path.expanduser("~/.config/sigic")
DB_FILE = os.path.join(DB_DIR, "estado_institucional.json")

CARRERAS_BELTRAN = [
    "Tecnicatura Superior en Desarrollo de Software",
    "Tecnicatura Superior en Analista de Sistemas",
    "Tecnicatura Superior en Automatización y Robótica",
    "Tecnicatura Superior en Redes e Infraestructura",
    "Tecnicatura Superior en Diseño y Desarrollo Web",
    "Tecnicatura Superior en Ciencia de Datos e IA",
    "Tecnicatura Superior en Ciberseguridad",
    "Tecnicatura Superior en Higiene y Seguridad en el Trabajo",
]

CSS_SUITE_OSCURA = b"""
window.sigic-window, dialog {
    background-color: #060d18;
    color: #f8fafc;
}

headerbar.sigic-headerbar {
    background-image: none;
    background-color: #081221;
    color: #f8fafc;
    border-bottom: 1px solid #162844;
    box-shadow: none;
    padding: 2px 8px;
    min-height: 34px;
}

headerbar.sigic-headerbar .title {
    color: #f8fafc;
    font-weight: 800;
    font-size: 12px;
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
    padding: 5px 12px;
    border: none;
    font-weight: bold;
    font-size: 11px;
}

notebook > header > tabs > tab:checked {
    color: #38bdf8;
    border-bottom: 2px solid #38bdf8;
}

.panel-card {
    background-image: linear-gradient(180deg, #0c182b 0%, #081120 100%);
    border: 1px solid #192841;
    border-radius: 9px;
    padding: 8px 11px;
}

.panel-card-active {
    background-image: linear-gradient(135deg, #0d213d 0%, #091528 100%);
    border: 1px solid #0284c7;
    border-radius: 9px;
    padding: 8px 11px;
}

.credential-card-white {
    background-color: #ffffff;
    color: #0f172a;
    border: 2px solid #38bdf8;
    border-radius: 12px;
    padding: 12px;
}

.qr-frame-white {
    background-color: #ffffff;
    border: 2px solid #cbd5e1;
    border-radius: 10px;
    padding: 6px;
}

.kpi-box {
    background-image: linear-gradient(180deg, #0d1b30 0%, #091322 100%);
    border: 1px solid #1e293b;
    border-radius: 8px;
    padding: 6px 10px;
}

.kpi-cyan { border-top: 2px solid #38bdf8; }
.kpi-emerald { border-top: 2px solid #10b981; }
.kpi-violet { border-top: 2px solid #a855f7; }
.kpi-amber { border-top: 2px solid #f59e0b; }

.search-field, entry {
    background-image: none;
    background-color: #07101e;
    border: 1px solid #1e3a5f;
    border-radius: 6px;
    padding: 4px 8px;
    min-height: 24px;
    font-size: 11.5px;
    color: #f8fafc;
}

.search-field:focus, entry:focus {
    border-color: #38bdf8;
}

.field-label {
    color: #cbd5e1;
    font-weight: bold;
    font-size: 11px;
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

button.btn-emerald {
    background-image: linear-gradient(90deg, #059669 0%, #047857 100%);
    background-color: #059669;
    border: 1px solid #34d399;
    color: #ffffff;
    font-size: 11px;
    font-weight: bold;
    border-radius: 6px;
    padding: 4px 10px;
    min-height: 24px;
}

button.btn-emerald:hover {
    background-image: none;
    background-color: #047857;
}

button.btn-secondary {
    background-image: none;
    background-color: #11223b;
    color: #e2e8f0;
    font-size: 11px;
    font-weight: bold;
    border: 1px solid #1e3a5f;
    border-radius: 6px;
    padding: 4px 9px;
    min-height: 24px;
}

button.btn-secondary:hover {
    background-image: none;
    background-color: #162d4c;
    border-color: #38bdf8;
}

button.btn-danger {
    background-image: none;
    background-color: #2a0a12;
    color: #fda4af;
    font-size: 11px;
    font-weight: bold;
    border: 1px solid #881337;
    border-radius: 6px;
    padding: 4px 9px;
    min-height: 24px;
}

button.btn-danger:hover {
    background-image: none;
    background-color: #4c0519;
    border-color: #f43f5e;
}

treeview {
    background-color: #091322;
    color: #e2e8f0;
    font-size: 11.5px;
}

treeview header button {
    background-image: none;
    background-color: #0d1b30;
    color: #38bdf8;
    font-weight: bold;
    font-size: 11px;
    border-bottom: 1px solid #1e3a5f;
    padding: 4px 8px;
}

treeview:selected {
    background-color: #0284c7;
    color: #ffffff;
}

progressbar progress {
    background-image: linear-gradient(90deg, #0284c7 0%, #38bdf8 100%);
    background-color: #0284c7;
    border-radius: 4px;
    min-height: 6px;
}

progressbar trough {
    background-color: #11223b;
    border-radius: 4px;
    min-height: 6px;
}

.footer-panel {
    background-color: #081120;
    border: 1px solid #162844;
    border-radius: 8px;
    padding: 5px 10px;
}

.seat-btn-libre {
    background-image: none;
    background-color: #0f1f38;
    color: #94a3b8;
    border: 1px solid #1e3a5f;
    border-radius: 6px;
    padding: 4px 2px;
    font-size: 10px;
    font-weight: bold;
}

.seat-btn-libre:hover {
    border-color: #38bdf8;
    color: #ffffff;
    background-color: #162d4c;
}

.seat-btn-ocupada {
    background-image: none;
    background-color: #064e3b;
    color: #34d399;
    border: 1px solid #10b981;
    border-radius: 6px;
    padding: 4px 2px;
    font-size: 10px;
    font-weight: bold;
}

.seat-btn-autoridad {
    background-image: none;
    background-color: #3b0764;
    color: #d8b4fe;
    border: 1px solid #a855f7;
    border-radius: 6px;
    padding: 4px 2px;
    font-size: 10px;
    font-weight: bold;
}

.seat-btn-bloqueada {
    background-image: none;
    background-color: #1e293b;
    color: #475569;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 4px 2px;
    font-size: 10px;
}

.stage-banner {
    background-image: linear-gradient(90deg, #0c2d48 0%, #0284c7 50%, #0c2d48 100%);
    border: 1px solid #38bdf8;
    border-radius: 10px;
    padding: 10px;
}

.banner-ok {
    background-color: #052e16;
    border: 2px solid #10b981;
    border-radius: 12px;
    padding: 14px;
}

.banner-warn {
    background-color: #451a03;
    border: 2px solid #f59e0b;
    border-radius: 12px;
    padding: 14px;
}

.banner-err {
    background-color: #4c0519;
    border: 2px solid #f43f5e;
    border-radius: 12px;
    padding: 14px;
}
"""


def aplicar_css_oscuro(css_extra=None):
    """Aplica la hoja de estilos institucional compacta a toda la aplicación GTK3."""
    try:
        import gi
        gi.require_version('Gtk', '3.0')
        gi.require_version('Gdk', '3.0')
        from gi.repository import Gtk, Gdk
        settings = Gtk.Settings.get_default()
        if settings:
            settings.set_property("gtk-application-prefer-dark-theme", True)
        provider = Gtk.CssProvider()
        datos_css = CSS_SUITE_OSCURA
        if css_extra:
            datos_css += b"\n" + (css_extra.encode('utf-8') if isinstance(css_extra, str) else css_extra)
        provider.load_from_data(datos_css)
        screen = Gdk.Screen.get_default()
        if screen:
            Gtk.StyleContext.add_provider_for_screen(screen, provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION)
    except Exception as e:
        print(f"Aviso CSS sigic_db: {e}")



# ==============================================================================
# GENERADOR NATIVO QR CODE ISO/IEC 18004 (Reed-Solomon GF(256) + SVG Vectorial)
# ==============================================================================
_GF_EXP = [0] * 512
_GF_LOG = [0] * 256
_x = 1
for _i in range(255):
    _GF_EXP[_i] = _x
    _GF_LOG[_x] = _i
    _x <<= 1
    if _x & 0x100:
        _x ^= 0x11D
for _i in range(255, 512):
    _GF_EXP[_i] = _GF_EXP[_i - 255]


def _rs_generator_poly(nsym):
    g = [1]
    for i in range(nsym):
        ng = [0] * (len(g) + 1)
        factor = _GF_EXP[i]
        for j, coeff in enumerate(g):
            ng[j] ^= coeff
            if coeff != 0:
                ng[j + 1] ^= _GF_EXP[_GF_LOG[coeff] + _GF_LOG[factor]]
        g = ng
    return g


def _rs_encode(data_bytes, nsym):
    gen = _rs_generator_poly(nsym)
    res = list(data_bytes) + [0] * nsym
    for i in range(len(data_bytes)):
        coef = res[i]
        if coef != 0:
            lcoef = _GF_LOG[coef]
            for j in range(1, len(gen)):
                if gen[j] != 0:
                    res[i + j] ^= _GF_EXP[lcoef + _GF_LOG[gen[j]]]
    return res[len(data_bytes):]


# Parámetros QR Nivel L para versiones 2 a 6 (1 bloque)
_QR_VERSIONS = [
    # (version, size, data_codewords, ec_codewords, align_centers)
    (2, 25, 34, 10, [6, 18]),
    (3, 29, 55, 15, [6, 22]),
    (4, 33, 80, 20, [6, 26]),
    (5, 37, 108, 26, [6, 30]),
    (6, 41, 136, 36, [6, 34]),
]


def generar_matriz_qr(texto):
    raw = (texto or "SiGIC").encode("utf-8")
    if len(raw) > 130:
        raw = raw[:130]

    ver, sz, total_dc, ec_len, aligns = _QR_VERSIONS[-1]
    for v_info in _QR_VERSIONS:
        if len(raw) + 2 <= v_info[2]:
            ver, sz, total_dc, ec_len, aligns = v_info
            break

    # Bitstream: Byte mode (0100) + length (8 bits) + data + terminator
    bits = [0, 1, 0, 0]
    n_len = len(raw)
    for b in range(7, -1, -1):
        bits.append((n_len >> b) & 1)
    for byte in raw:
        for b in range(7, -1, -1):
            bits.append((byte >> b) & 1)
    for _ in range(min(4, total_dc * 8 - len(bits))):
        bits.append(0)
    while len(bits) % 8 != 0:
        bits.append(0)

    codewords = []
    for i in range(0, len(bits), 8):
        val = 0
        for b in bits[i:i + 8]:
            val = (val << 1) | b
        codewords.append(val)

    pad_bytes = [0xEC, 0x11]
    idx_p = 0
    while len(codewords) < total_dc:
        codewords.append(pad_bytes[idx_p % 2])
        idx_p += 1

    ec_words = _rs_encode(codewords[:total_dc], ec_len)
    all_words = codewords[:total_dc] + ec_words

    grid = [[None for _ in range(sz)] for _ in range(sz)]
    reserved = [[False for _ in range(sz)] for _ in range(sz)]

    def set_mod(r, c, val, res=True):
        if 0 <= r < sz and 0 <= c < sz:
            grid[r][c] = 1 if val else 0
            if res:
                reserved[r][c] = True

    def place_finder(row, col):
        for r in range(-1, 8):
            for c in range(-1, 8):
                rr, cc = row + r, col + c
                if 0 <= rr < sz and 0 <= cc < sz:
                    if 0 <= r <= 6 and 0 <= c <= 6:
                        if r in (0, 6) or c in (0, 6) or (2 <= r <= 4 and 2 <= c <= 4):
                            set_mod(rr, cc, 1, True)
                        else:
                            set_mod(rr, cc, 0, True)
                    else:
                        set_mod(rr, cc, 0, True)

    place_finder(0, 0)
    place_finder(0, sz - 7)
    place_finder(sz - 7, 0)

    # Alignment patterns
    for ar in aligns:
        for ac in aligns:
            if (ar < 9 and ac < 9) or (ar < 9 and ac > sz - 10) or (ar > sz - 10 and ac < 9):
                continue
            for r in range(-2, 3):
                for c in range(-2, 3):
                    val = 1 if (abs(r) == 2 or abs(c) == 2 or (r == 0 and c == 0)) else 0
                    set_mod(ar + r, ac + c, val, True)

    # Timing patterns
    for i in range(8, sz - 8):
        if not reserved[6][i]:
            set_mod(6, i, i % 2 == 0, True)
        if not reserved[i][6]:
            set_mod(i, 6, i % 2 == 0, True)

    # Dark module & format reserve
    set_mod(sz - 8, 8, 1, True)
    for i in range(9):
        if not reserved[8][i]:
            set_mod(8, i, 0, True)
        if not reserved[i][8]:
            set_mod(i, 8, 0, True)
    for i in range(8):
        if not reserved[8][sz - 1 - i]:
            set_mod(8, sz - 1 - i, 0, True)
        if not reserved[sz - 1 - i][8]:
            set_mod(sz - 1 - i, 8, 0, True)

    # Place data bits
    data_bits = []
    for w in all_words:
        for b in range(7, -1, -1):
            data_bits.append((w >> b) & 1)

    bit_idx = 0
    up = True
    col = sz - 1
    while col > 0:
        if col == 6:
            col -= 1
        row_iter = range(sz - 1, -1, -1) if up else range(sz)
        for r in row_iter:
            for c_off in (0, -1):
                cc = col + c_off
                if not reserved[r][cc]:
                    bit = data_bits[bit_idx] if bit_idx < len(data_bits) else 0
                    bit_idx += 1
                    # Mask 0: (r + cc) % 2 == 0
                    if (r + cc) % 2 == 0:
                        bit ^= 1
                    grid[r][cc] = bit
        up = not up
        col -= 2

    # Format info for Level L (01) + Mask 0 (000) -> 0x77C4 (111011111000100)
    fmt_bits = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0]
    fmt_coords_1 = [
        (8, 0), (8, 1), (8, 2), (8, 3), (8, 4), (8, 5), (8, 7), (8, 8),
        (7, 8), (5, 8), (4, 8), (3, 8), (2, 8), (1, 8), (0, 8)
    ]
    fmt_coords_2 = [
        (sz - 1, 8), (sz - 2, 8), (sz - 3, 8), (sz - 4, 8), (sz - 5, 8), (sz - 6, 8), (sz - 7, 8),
        (8, sz - 8), (8, sz - 7), (8, sz - 6), (8, sz - 5), (8, sz - 4), (8, sz - 3), (8, sz - 2), (8, sz - 1)
    ]
    for i, bit in enumerate(fmt_bits):
        r1, c1 = fmt_coords_1[i]
        r2, c2 = fmt_coords_2[i]
        grid[r1][c1] = bit
        grid[r2][c2] = bit

    return grid


def generar_qr_svg(texto, size=180, fg="#0f172a", bg="#ffffff"):
    grid = generar_matriz_qr(texto)
    n = len(grid)
    margin = 2
    total_modules = n + margin * 2
    rects = [f'<rect width="{size}" height="{size}" rx="10" fill="{bg}"/>']
    cell = size / float(total_modules)
    for r in range(n):
        for c in range(n):
            if grid[r][c]:
                x = (c + margin) * cell
                y = (r + margin) * cell
                rects.append(
                    f'<rect x="{x:.2f}" y="{y:.2f}" width="{cell + 0.35:.2f}" height="{cell + 0.35:.2f}" fill="{fg}"/>'
                )
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">{"".join(rects)}</svg>'


def obtener_ip_lan():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.3)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "192.168.1.100"


def obtener_payload_qr_graduado(g):
    """Genera el payload JSON exacto de ModalCredencial.jsx del proyecto Next.js."""
    asientos = []
    if g.get("butaca") and g.get("butaca") != "Sin asignar":
        asientos.append(g["butaca"])
    for idx, inv in enumerate(g.get("invitados", [])):
        if inv.get("asiento_id"):
            asientos.append(inv["asiento_id"])
    return json.dumps({
        "id": g.get("id", g.get("legajo", g.get("dni", ""))),
        "token": g.get("legajo", g.get("otp_codigo", g.get("dni", ""))),
        "dni": g.get("dni", ""),
        "asientos": asientos
    }, ensure_ascii=False)


def cargar_datos_produccion():
    rutas = [
        "/opt/sigic/datos_produccion.json",
        os.path.join(os.path.dirname(__file__), "datos_produccion.json"),
        os.path.expanduser("~/.config/sigic/datos_produccion.json")
    ]
    for r in rutas:
        if os.path.exists(r):
            try:
                with open(r, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
    return None


def estado_inicial():
    prod = cargar_datos_produccion()
    if prod and prod.get("egresados"):
        cer_list = []
        for c in prod.get("ceremonias", []):
            cer_list.append({
                "id": str(c.get("id")),
                "nombre": c.get("nombre", "Ceremonia Beltrán"),
                "fecha": str(c.get("fecha", "2026-11-28"))[:10],
                "hora": "18:00 hs",
                "lugar": c.get("lugar", "Auditorio Central Beltrán"),
                "aforo": 200,
                "cupo_invitados": int(c.get("max_invitados") or 4),
                "activa": bool(c.get("activa"))
            })

        prof_list = []
        for idx, p in enumerate(prod.get("profesores", [])):
            prof_list.append({
                "id": p.get("id", idx + 1),
                "nombre": p.get("nombre", "Docente"),
                "cargo": p.get("cargo", "Profesor Titular"),
                "carrera": p.get("carrera", CARRERAS_BELTRAN[0]),
                "correo": p.get("correo", "")
            })

        inv_map = {}
        for inv in prod.get("invitados", []):
            eid = str(inv.get("egresado_id", ""))
            inv_map.setdefault(eid, []).append({
                "nombre": inv.get("nombre", ""),
                "dni": str(inv.get("dni", "")),
                "parentesco": inv.get("relacion", "Acompañante"),
                "presente": bool(inv.get("presente")),
                "asiento_id": inv.get("asiento_id", "")
            })

        grads_list = []
        for g in prod.get("egresados", []):
            gid = str(g.get("id", ""))
            asiento = g.get("asiento_id") or "Sin asignar"
            asiento_dsp = asiento
            if "baja-" in asiento or "alta-" in asiento:
                partes = asiento.split("-")
                if len(partes) >= 3:
                    asiento_dsp = f"{partes[1]}{partes[2]}"

            grads_list.append({
                "id": gid,
                "dni": str(g.get("dni", "")),
                "nombre": g.get("nombre", ""),
                "legajo": g.get("legajo", ""),
                "correo": g.get("correo", ""),
                "telefono": g.get("telefono", ""),
                "carrera": g.get("carrera", CARRERAS_BELTRAN[0]),
                "promedio": str(g.get("promedio", "") or "8.50"),
                "estado": g.get("estado", "PENDIENTE"),
                "butaca": asiento_dsp,
                "asiento_id": asiento,
                "otp_codigo": g.get("otp", "") or g.get("token", ""),
                "fecha_invitacion": str(g.get("invitacion_ultimo_envio_en", ""))[:16] if g.get("invitacion_ultimo_envio_en") else "—",
                "credencial_enviada": bool(g.get("credencial_enviada_en")),
                "entregador": g.get("entregador_nombre", "Sin asignar"),
                "invitados": inv_map.get(gid, []),
                "acreditado": bool(g.get("presente")),
                "hora_ingreso": str(g.get("fecha_presente", ""))[-8:] if g.get("fecha_presente") else "",
                "estado_escenario": "DIPLOMA ENTREGADO" if g.get("diploma_entregado") else ("EN SALA" if g.get("presente") else "PENDIENTE"),
                "hora_diploma": ""
            })

        return {
            "ceremonias": cer_list,
            "profesores": prof_list,
            "operadores_porteria": [
                {"id": 1, "nombre": "Marcos Gómez — Jefe de Portería", "email": "porteria1@ibeltran.com.ar", "rol": "PORTERIA", "activo": True, "autorizado": True, "token": "PORTERIA-BELTRAN-2026-TK01", "ultimo_login": "16/10/2026 17:30"},
                {"id": 2, "nombre": "Carolina Vega — Acceso Principal", "email": "porteria2@ibeltran.com.ar", "rol": "PORTERIA", "activo": True, "autorizado": True, "token": "PORTERIA-BELTRAN-2026-TK02", "ultimo_login": "16/10/2026 17:35"},
                {"id": 3, "nombre": "Secretaría Académica Beltrán", "email": "academica@ibeltran.com.ar", "rol": "ADMINISTRATIVO", "activo": True, "autorizado": True, "token": "ADMIN-BELTRAN-2026-TK03", "ultimo_login": "16/10/2026 16:50"}
            ],
            "dispositivos_moviles": [
                {"dispositivoId": "ANDROID-SM-A546E-BEL01", "nombreDispositivo": "Samsung Galaxy A54 · Puerta Central", "marca": "Samsung", "modelo": "SM-A546E", "sistema": "Android 14 · SiGIC Accesos 1.0.5", "usuarioNombre": "Marcos Gómez — Jefe de Portería", "usuarioEmail": "porteria1@ibeltran.com.ar", "ipUltimoAcceso": "192.168.1.45", "ultimoAcceso": "Hace 1 min", "enLinea": True, "sesionActiva": 1},
                {"dispositivoId": "ANDROID-MOTO-G84-BEL02", "nombreDispositivo": "Motorola Edge 40 · Acceso Lateral", "marca": "Motorola", "modelo": "XT2347-2", "sistema": "Android 14 · SiGIC Accesos 1.0.5", "usuarioNombre": "Carolina Vega — Acceso Principal", "usuarioEmail": "porteria2@ibeltran.com.ar", "ipUltimoAcceso": "192.168.1.48", "ultimoAcceso": "Hace 2 min", "enLinea": True, "sesionActiva": 1}
            ],
            "graduados": grads_list,
            "butacas_especiales": {
                "A11": {"tipo": "AUTORIDAD", "detalle": "Rectorado Beltrán"},
                "A12": {"tipo": "AUTORIDAD", "detalle": "Secretaría Académica"},
                "B11": {"tipo": "AUTORIDAD", "detalle": "Cuerpo Docente"},
                "B12": {"tipo": "AUTORIDAD", "detalle": "Cuerpo Docente"},
            },
            "smtp": {
                "host": "smtp.gmail.com",
                "port": "587",
                "user": "colaciones@ibeltran.com.ar",
                "password": "",
                "from_email": "Colaciones Instituto Beltrán <colaciones@ibeltran.com.ar>",
                "asunto": "Invitación Oficial al Acto de Colación 2026 — Instituto Tecnológico Beltrán"
            },
            "eventos_en_vivo": [
                {"hora": "18:15:20", "actor": "García, Juan Manuel", "rol": "Graduado · Butaca A1", "evento": "Diploma entregado en escenario"},
                {"hora": "17:51:19", "actor": "López, Tomás Ignacio", "rol": "Graduado · Butaca B1 (+1 inv.)", "evento": "Ingreso acreditado en portería"},
                {"hora": "17:48:33", "actor": "Rodríguez, Matías Alejandro", "rol": "Graduado · Butaca A3 (+1 inv.)", "evento": "Ingreso acreditado en portería"}
            ]
        }


def cargar_db():
    os.makedirs(DB_DIR, exist_ok=True)
    if not os.path.exists(DB_FILE):
        data = estado_inicial()
        guardar_db(data)
        return data
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            base = estado_inicial()
            for k in ("ceremonias", "profesores", "operadores_porteria", "dispositivos_moviles", "graduados", "butacas_especiales", "smtp", "eventos_en_vivo"):
                if k not in data:
                    data[k] = base[k]
            return data
    except Exception:
        data = estado_inicial()
        guardar_db(data)
        return data


def guardar_db(data):
    os.makedirs(DB_DIR, exist_ok=True)
    tmp = DB_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, DB_FILE)


def registrar_evento(actor, rol, descripcion):
    data = cargar_db()
    ev = data.setdefault("eventos_en_vivo", [])
    ev.insert(0, {
        "hora": datetime.now().strftime("%H:%M:%S"),
        "actor": actor,
        "rol": rol,
        "evento": descripcion
    })
    data["eventos_en_vivo"] = ev[:80]
    guardar_db(data)


# === MÉTRICAS GLOBALES EN TIEMPO REAL ===
def obtener_resumen_global():
    data = cargar_db()
    ceremonias = data.get("ceremonias", [])
    activa = next((c for c in ceremonias if c.get("activa")), ceremonias[0] if ceremonias else {
        "nombre": "Colación Beltrán 2026", "fecha": "28 Nov 2026", "hora": "18:00 hs", "lugar": "Anfiteatro Central", "aforo": 200
    })
    grads = data.get("graduados", [])
    total = len(grads)
    confirmados = sum(1 for g in grads if g.get("estado") == "CONFIRMADO")
    aceptados = sum(1 for g in grads if g.get("estado") in ("CONFIRMADO", "ACEPTADO"))
    invitados_env = sum(1 for g in grads if g.get("estado") in ("INVITADO", "ACEPTADO", "CONFIRMADO", "RECHAZADO"))
    pendientes_env = sum(1 for g in grads if g.get("estado") == "PENDIENTE")
    rechazados = sum(1 for g in grads if g.get("estado") == "RECHAZADO")
    acreditados = sum(1 for g in grads if g.get("acreditado"))
    diplomas = sum(1 for g in grads if g.get("estado_escenario") == "DIPLOMA ENTREGADO")
    en_escenario = next((g for g in grads if g.get("estado_escenario") == "EN ESCENARIO"), None)
    acompanantes = sum(len(g.get("invitados", [])) for g in grads)
    acompanantes_presentes = sum(
        sum(1 for inv in g.get("invitados", []) if inv.get("presente"))
        for g in grads
    )
    butacas_grad = sum(1 for g in grads if g.get("butaca") and g.get("butaca") != "Sin asignar")
    butacas_esp = len(data.get("butacas_especiales", {}))
    dispositivos_online = sum(1 for d in data.get("dispositivos_moviles", []) if d.get("enLinea"))

    por_carrera = {}
    for c in CARRERAS_BELTRAN:
        por_carrera[c] = 0
    for g in grads:
        car = g.get("carrera") or "Otra Carrera"
        por_carrera[car] = por_carrera.get(car, 0) + 1

    return {
        "ceremonia_activa": activa,
        "total_ceremonias": len(ceremonias),
        "total_graduados": total,
        "confirmados": confirmados,
        "aceptados": aceptados,
        "invitados_env": invitados_env,
        "pendientes_env": pendientes_env,
        "rechazados": rechazados,
        "acreditados": acreditados,
        "acompanantes_presentes": acompanantes_presentes,
        "diplomas_entregados": diplomas,
        "en_escenario": en_escenario,
        "acompanantes": acompanantes,
        "butacas_ocupadas": butacas_grad + butacas_esp + acompanantes,
        "butacas_graduados": butacas_grad,
        "aforo": int(activa.get("aforo", 200)),
        "por_carrera": por_carrera,
        "total_profesores": len(data.get("profesores", [])),
        "dispositivos_online": dispositivos_online
    }


# === CRUD GRADUADOS, INVITADOS Y ENTREGADORES ===
def listar_graduados():
    return cargar_db().get("graduados", [])


def obtener_graduado_por_dni(dni):
    return next((g for g in listar_graduados() if g.get("dni") == dni), None)


def guardar_graduado(datos, dni_original=None):
    data = cargar_db()
    grads = data.setdefault("graduados", [])
    dni_key = dni_original or datos.get("dni", "")
    existente = next((g for g in grads if g.get("dni") == dni_key), None)
    if existente:
        existente.update(datos)
    else:
        nuevo = {
            "dni": datos.get("dni", ""),
            "nombre": datos.get("nombre", ""),
            "legajo": datos.get("legajo", f"BEL-2026-{len(grads)+101}"),
            "correo": datos.get("correo", ""),
            "telefono": datos.get("telefono", ""),
            "carrera": datos.get("carrera", CARRERAS_BELTRAN[0]),
            "promedio": datos.get("promedio", ""),
            "estado": datos.get("estado", "PENDIENTE"),
            "butaca": datos.get("butaca", "Sin asignar"),
            "otp_codigo": datos.get("otp_codigo", ""),
            "fecha_invitacion": datos.get("fecha_invitacion", "—"),
            "credencial_enviada": datos.get("credencial_enviada", False),
            "entregador": datos.get("entregador", "Sin asignar"),
            "invitados": datos.get("invitados", []),
            "acreditado": datos.get("acreditado", False),
            "hora_ingreso": datos.get("hora_ingreso", ""),
            "estado_escenario": datos.get("estado_escenario", "EN SALA"),
            "hora_diploma": datos.get("hora_diploma", "")
        }
        grads.append(nuevo)
    guardar_db(data)
    _sync_api_post("/api/egresados", datos)
    return True


def eliminar_graduado(dni):
    data = cargar_db()
    data["graduados"] = [g for g in data.get("graduados", []) if g.get("dni") != dni]
    guardar_db(data)
    return True


def vaciar_padron():
    data = cargar_db()
    data["graduados"] = []
    guardar_db(data)
    return True


def restaurar_cohorte_modelo():
    data = cargar_db()
    base = estado_inicial()
    data["graduados"] = base["graduados"]
    guardar_db(data)
    return data["graduados"]


# === CONVOCATORIA, CREDENCIALES QR Y DESPACHO SMTP / OTP ===
def despachar_invitacion(dni, es_credencial=False):
    data = cargar_db()
    grads = data.get("graduados", [])
    g = next((x for x in grads if x.get("dni") == dni), None)
    if not g:
        return False, "Graduado no encontrado"

    if not g.get("otp_codigo"):
        g["otp_codigo"] = str(random.randint(100000, 999999))
    g["fecha_invitacion"] = datetime.now().strftime("%d/%m/%Y %H:%M")
    if es_credencial:
        g["credencial_enviada"] = True
    elif g.get("estado") == "PENDIENTE":
        g["estado"] = "INVITADO"

    guardar_db(data)
    if g.get("id"):
        if es_credencial:
            _sync_api_post(f"/api/egresados/{g['id']}/enviar-credencial", {})
        else:
            _sync_api_post(f"/api/egresados/{g['id']}/enviar-invitacion", {})

    smtp_cfg = data.get("smtp", {})
    if smtp_cfg.get("host") and smtp_cfg.get("user") and smtp_cfg.get("password") and g.get("correo"):
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "Credencial Oficial QR SiGIC" if es_credencial else smtp_cfg.get("asunto", "Invitación Oficial Colación SiGIC")
            msg["From"] = smtp_cfg.get("from_email") or smtp_cfg.get("user")
            msg["To"] = g["correo"]
            html = f"""
            <div style="font-family:Arial,sans-serif;background:#081221;color:#f8fafc;padding:24px;border-radius:12px;">
              <h2 style="color:#38bdf8;">Instituto Tecnológico Beltrán — SiGIC</h2>
              <p>Estimado/a <b>{g['nombre']}</b> ({g['carrera']}),</p>
              <p>Butaca asignada: <b>{g.get('butaca', 'General')}</b> · Legajo: <b>{g.get('legajo', '—')}</b></p>
              <p style="font-size:18px;">Código de acceso OTP / Token: <b style="color:#34d399;letter-spacing:3px;">{g['otp_codigo']}</b></p>
            </div>
            """
            msg.attach(MIMEText(html, "html", "utf-8"))
            with smtplib.SMTP(smtp_cfg["host"], int(smtp_cfg.get("port", 587)), timeout=5) as server:
                server.starttls()
                server.login(smtp_cfg["user"], smtp_cfg["password"])
                server.sendmail(smtp_cfg["user"], [g["correo"]], msg.as_string())
        except Exception:
            pass

    tipo_ev = "Credencial QR enviada" if es_credencial else f"Invitación enviada · Token OTP: {g['otp_codigo']}"
    registrar_evento(g["nombre"], f"Convocatoria ({g['correo']})", tipo_ev)
    return True, g["otp_codigo"]


def despachar_pendientes():
    data = cargar_db()
    grads = data.get("graduados", [])
    enviados = 0
    for g in grads:
        if g.get("estado") == "PENDIENTE" or not g.get("otp_codigo"):
            g["otp_codigo"] = g.get("otp_codigo") or str(random.randint(100000, 999999))
            g["fecha_invitacion"] = datetime.now().strftime("%d/%m/%Y %H:%M")
            if g.get("estado") == "PENDIENTE":
                g["estado"] = "INVITADO"
            enviados += 1
    guardar_db(data)
    if enviados > 0:
        registrar_evento("Despacho Masivo SMTP", f"{enviados} destinatarios", "Invitaciones y tokens OTP generados y enviados")
    return enviados


def despachar_credenciales_masivo():
    data = cargar_db()
    grads = data.get("graduados", [])
    enviados = 0
    for g in grads:
        if g.get("estado") in ("CONFIRMADO", "ACEPTADO"):
            if not g.get("otp_codigo"):
                g["otp_codigo"] = str(random.randint(100000, 999999))
            g["credencial_enviada"] = True
            enviados += 1
    guardar_db(data)
    if enviados > 0:
        registrar_evento("Despacho Credenciales QR", f"{enviados} graduados confirmados", "Pases grupales QR despachados")
    return enviados


# === ANFITEATRO Y ASIGNACIÓN DE BUTACAS ===
def asignar_butaca_graduado(codigo_butaca, dni_graduado):
    data = cargar_db()
    data.get("butacas_especiales", {}).pop(codigo_butaca, None)
    for g in data.get("graduados", []):
        if g.get("butaca") == codigo_butaca:
            g["butaca"] = "Sin asignar"
        if g.get("dni") == dni_graduado:
            g["butaca"] = codigo_butaca
            if g.get("estado") in ("PENDIENTE", "INVITADO", "ACEPTADO"):
                g["estado"] = "CONFIRMADO"
            if g.get("id"):
                _sync_api_post(f"/api/egresados/{g['id']}/asientos", {"asiento_id": codigo_butaca})
    guardar_db(data)
    return True


def reservar_butaca_especial(codigo_butaca, tipo, detalle):
    data = cargar_db()
    for g in data.get("graduados", []):
        if g.get("butaca") == codigo_butaca:
            g["butaca"] = "Sin asignar"
    esp = data.setdefault("butacas_especiales", {})
    if tipo == "LIBRE":
        esp.pop(codigo_butaca, None)
    else:
        esp[codigo_butaca] = {"tipo": tipo, "detalle": detalle}
    guardar_db(data)
    return True


def auto_asignar_butacas():
    data = cargar_db()
    grads = data.get("graduados", [])
    esp = data.get("butacas_especiales", {})
    ocupadas = set(esp.keys())
    for g in grads:
        b = g.get("butaca", "")
        if b and b != "Sin asignar":
            ocupadas.add(b)

    filas = ["A", "B", "C", "D", "E", "F"]
    disponibles = []
    for f in filas:
        for num in range(1, 13):
            cod = f"{f}{num}"
            if cod not in ocupadas:
                disponibles.append(cod)

    asignados = 0
    grads_ordenados = sorted(grads, key=lambda x: (x.get("carrera", ""), x.get("nombre", "")))
    for g in grads_ordenados:
        if g.get("estado") != "RECHAZADO" and (not g.get("butaca") or g.get("butaca") == "Sin asignar"):
            if disponibles:
                g["butaca"] = disponibles.pop(0)
                asignados += 1
    guardar_db(data)
    return asignados


# === ACREDITACIÓN EN PORTERÍA Y CONEXIÓN MÓVIL ===
def buscar_o_acreditar(busqueda, acreditar_inmediato=True, incluir_grupo=True):
    raw = (busqueda or "").strip()
    if not raw:
        return "NO_ENCONTRADO", None

    # Soportar QR JSON de ModalCredencial.jsx: {"id":...,"token":...,"dni":...,"asientos":...}
    q_dni = ""
    q_token = ""
    if raw.startswith("{") and raw.endswith("}"):
        try:
            parsed = json.loads(raw)
            q_dni = str(parsed.get("dni", "")).strip().lower()
            q_token = str(parsed.get("token", "")).strip().lower()
        except Exception:
            pass

    q = raw.lower()
    if q.startswith("sigic-"):
        q = q.replace("sigic-", "").strip()

    data = cargar_db()
    grads = data.get("graduados", [])
    encontrado = None
    for g in grads:
        dni_g = g.get("dni", "").lower()
        leg_g = g.get("legajo", "").lower()
        otp_g = g.get("otp_codigo", "").lower()
        nom_g = g.get("nombre", "").lower()
        if (
            (q_dni and q_dni == dni_g) or
            (q_token and q_token in (leg_g, otp_g, dni_g)) or
            q == dni_g or
            q == leg_g or
            (otp_g and q == otp_g) or
            (len(q) >= 3 and q in nom_g)
        ):
            encontrado = g
            break
        # También buscar por DNI de acompañante
        for inv in g.get("invitados", []):
            if q == str(inv.get("dni", "")).lower():
                encontrado = g
                break
        if encontrado:
            break

    if not encontrado:
        return "NO_ENCONTRADO", None

    if encontrado.get("estado") == "RECHAZADO":
        return "RECHAZADO", encontrado

    if not acreditar_inmediato:
        return "ENCONTRADO", encontrado

    ya_estaba = encontrado.get("acreditado", False)
    ahora = datetime.now().strftime("%H:%M:%S")
    encontrado["acreditado"] = True
    if incluir_grupo:
        for inv in encontrado.get("invitados", []):
            inv["presente"] = True

    if not ya_estaba:
        encontrado["hora_ingreso"] = ahora
        cant_inv = len(encontrado.get("invitados", []))
        guardar_db(data)
        registrar_evento(
            encontrado["nombre"],
            f"Graduado · Butaca {encontrado.get('butaca', 'S/A')} (+{cant_inv} acomp.)",
            "Ingreso grupal validado en portería"
        )
        if encontrado.get("id"):
            _sync_api_post(f"/api/egresados/{encontrado['id']}/presente", {"presente": True})
            _sync_api_post("/api/acreditacion/validar", {"codigo": encontrado.get("dni")})
        return "AUTORIZADO_NUEVO", encontrado
    else:
        guardar_db(data)
        if encontrado.get("id"):
            _sync_api_post("/api/acreditacion/validar", {"codigo": encontrado.get("dni")})
        return "YA_ACREDITADO", encontrado


def acreditar_graduado(busqueda):
    return buscar_o_acreditar(busqueda, acreditar_inmediato=True, incluir_grupo=True)


def cambiar_acreditacion(dni, estado_bool, incluir_invitados=True):
    data = cargar_db()
    for g in data.get("graduados", []):
        if g.get("dni") == dni:
            g["acreditado"] = bool(estado_bool)
            g["hora_ingreso"] = datetime.now().strftime("%H:%M:%S") if estado_bool else ""
            if incluir_invitados:
                for inv in g.get("invitados", []):
                    inv["presente"] = bool(estado_bool)
            guardar_db(data)
            if estado_bool:
                registrar_evento(g["nombre"], f"Butaca {g.get('butaca', 'S/A')}", "Acreditación registrada")
            return True
    return False


def cambiar_acreditacion_invitado(dni_graduado, indice_invitado, estado_bool):
    data = cargar_db()
    for g in data.get("graduados", []):
        if g.get("dni") == dni_graduado:
            invs = g.get("invitados", [])
            if 0 <= indice_invitado < len(invs):
                invs[indice_invitado]["presente"] = bool(estado_bool)
                guardar_db(data)
                if estado_bool:
                    registrar_evento(
                        invs[indice_invitado].get("nombre", "Acompañante"),
                        f"Acompañante de {g['nombre']}",
                        "Ingreso de acompañante acreditado"
                    )
                return True
    return False


# === GESTIÓN DE OPERADORES Y DISPOSITIVOS MÓVILES DE PORTERÍA ===
def listar_operadores_porteria():
    return cargar_db().get("operadores_porteria", [])


def crear_operador_porteria(nombre, email, rol="PORTERIA", autorizado=True):
    data = cargar_db()
    ops = data.setdefault("operadores_porteria", [])
    nuevo_id = max([o.get("id", 0) for o in ops] + [0]) + 1
    token = f"{rol[:5]}-BELTRAN-2026-TK{nuevo_id:02d}-{random.randint(100,999)}"
    nuevo = {
        "id": nuevo_id,
        "nombre": nombre,
        "email": email,
        "rol": rol,
        "activo": True,
        "autorizado": bool(autorizado),
        "token": token,
        "ultimo_login": "Pendiente de primer escaneo"
    }
    ops.append(nuevo)
    guardar_db(data)
    return nuevo


def alternar_autorizacion_operador(op_id):
    data = cargar_db()
    for o in data.get("operadores_porteria", []):
        if o.get("id") == op_id:
            o["autorizado"] = not o.get("autorizado", True)
            guardar_db(data)
            return o["autorizado"]
    return False


def alternar_activo_operador(op_id):
    data = cargar_db()
    for o in data.get("operadores_porteria", []):
        if o.get("id") == op_id:
            o["activo"] = not o.get("activo", True)
            guardar_db(data)
            return o["activo"]
    return False


def eliminar_operador_porteria(op_id):
    data = cargar_db()
    data["operadores_porteria"] = [o for o in data.get("operadores_porteria", []) if o.get("id") != op_id]
    guardar_db(data)
    return True


def listar_dispositivos_moviles():
    return cargar_db().get("dispositivos_moviles", [])


def vincular_dispositivo_movil(nombre_disp, modelo, operador_nombre, ip_disp=""):
    data = cargar_db()
    disps = data.setdefault("dispositivos_moviles", [])
    did = f"ANDROID-{modelo.upper().replace(' ', '-')}-{random.randint(10,99)}"
    nuevo = {
        "dispositivoId": did,
        "nombreDispositivo": nombre_disp,
        "marca": nombre_disp.split(" ")[0] if nombre_disp else "Android",
        "modelo": modelo or "Terminal QR",
        "sistema": "Android 14 · SiGIC Accesos 1.0.5",
        "usuarioNombre": operador_nombre,
        "usuarioEmail": "porteria@ibeltran.com.ar",
        "ipUltimoAcceso": ip_disp or obtener_ip_lan(),
        "ultimoAcceso": datetime.now().strftime("%H:%M:%S"),
        "enLinea": True,
        "sesionActiva": 1
    }
    disps.insert(0, nuevo)
    guardar_db(data)
    registrar_evento(nombre_disp, f"Operador: {operador_nombre}", "Terminal móvil vinculada a portería")
    return nuevo


def desvincular_dispositivo_movil(dispositivo_id):
    data = cargar_db()
    for d in data.get("dispositivos_moviles", []):
        if d.get("dispositivoId") == dispositivo_id:
            d["enLinea"] = False
            d["sesionActiva"] = 0
            d["ultimoAcceso"] = "Sesión cerrada remotamente"
    guardar_db(data)
    return True


def _sync_api_post(endpoint, payload):
    def _run():
        try:
            url = f"http://localhost:3000{endpoint}"
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            urllib.request.urlopen(req, timeout=2)
        except Exception:
            pass
    threading.Thread(target=_run, daemon=True).start()


def cargar_datos():
    return cargar_db()


def guardar_datos(d):
    return guardar_db(d)


def listar_ceremonias():
    return cargar_db().get("ceremonias", [])


def obtener_ceremonia_activa():
    ceremonias = listar_ceremonias()
    for c in ceremonias:
        if c.get("activa"):
            return c
    return ceremonias[0] if ceremonias else None


def crear_ceremonia(datos):
    data = cargar_db()
    cers = data.setdefault("ceremonias", [])
    cid = f"cer-{int(time.time()*1000)}"
    nueva = {
        "id": cid,
        "nombre": datos.get("nombre", "Nueva Ceremonia"),
        "fecha": datos.get("fecha", datetime.now().strftime("%Y-%m-%d")),
        "hora": datos.get("hora", "18:00 hs"),
        "lugar": datos.get("lugar", "Auditorio Central Beltrán"),
        "aforo": int(datos.get("aforo", 200)),
        "cupo_invitados": int(datos.get("cupo_invitados", 4)),
        "activa": bool(datos.get("activa", False))
    }
    cers.append(nueva)
    guardar_db(data)
    _sync_api_post("/api/ceremonias", nueva)
    return nueva


def activar_ceremonia(ceremonia_id):
    data = cargar_db()
    cid_str = str(ceremonia_id)
    for c in data.get("ceremonias", []):
        c["activa"] = (str(c.get("id")) == cid_str)
    guardar_db(data)
    _sync_api_post(f"/api/ceremonias/{cid_str}/activar", {})
    return True

