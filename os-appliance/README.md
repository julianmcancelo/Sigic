# SiGIC OS Appliance — Imagen Booteable Kiosco / Standalone

Este directorio contiene todo el herramental para crear un **Sistema Operativo completo ("Appliance") booteable** para SiGIC.

Al encender la computadora o servidor desde esta imagen o pendrive:
1. El sistema operativo arranca automáticamente sin requerir intervención humana.
2. Inicia el motor Docker con **PostgreSQL 16** y la plataforma **SiGIC** en segundo plano como servicio del sistema (`sigic.service`).
3. El servidor gráfico arranca en **modo kiosco a pantalla completa** apuntando directamente a `http://localhost:3000` con Chromium embebido.
4. Si se conecta a una red local, la plataforma queda automáticamente accesible para los demás dispositivos (teléfonos para escaneo QR de portería, computadoras administrativas, terminales de egresados).

---

## 📁 Archivos Incluidos

- **[`user-data`](file:///d:/Sigic/os-appliance/user-data)**: Receta Cloud-Init / Autoinstall que configura el hostname (`sigic-box`), instala Docker, Openbox, Chromium, clona SiGIC y activa el servicio.
- **[`sigic.service`](file:///d:/Sigic/os-appliance/sigic.service)**: Servicio de arranque nativo de Linux (`systemd`) que mantiene a SiGIC corriendo siempre.
- **[`setup-kiosk.sh`](file:///d:/Sigic/os-appliance/setup-kiosk.sh)**: Script que configura el auto-login gráfico con `nodm` y lanza el navegador en modo quiosco maximizado sin cursor ni barras de herramientas.
- **[`build-iso.sh`](file:///d:/Sigic/os-appliance/build-iso.sh)**: Script automatizado que toma la base de Ubuntu Server 24.04 LTS e inyecta la configuración para generar `sigic-os-24.04-autoinstall.iso`.

---

## 🛠️ Cómo compilar la ISO (en cualquier máquina con Linux o VM)

```bash
cd os-appliance
chmod +x build-iso.sh setup-kiosk.sh
sudo ./build-iso.sh
```

Al terminar, se creará el archivo **`sigic-os-24.04-autoinstall.iso`**.

---

## 💾 Cómo grabarlo en un Pendrive

Podés usar cualquier herramienta popular desde Windows o Linux:
- **[Rufus](https://rufus.ie/)** (Windows): Seleccioná tu pendrive, elegí `sigic-os-24.04-autoinstall.iso` y grabalo en modo DD o ISO estándar.
- **[BalenaEtcher](https://etcher.balena.io/)** (Windows / Mac / Linux): Seleccioná el archivo, elegí el pendrive y hacé clic en *Flash!*.
- **[Ventoy](https://www.ventoy.net/)**: Solo copiás el archivo `.iso` dentro de la partición de tu pendrive.

---

## 💻 Datos de acceso por defecto de la máquina

- **Usuario del sistema**: `sigic`
- **Contraseña del sistema**: `sigic2026`
- **URL web local**: `http://localhost:3000`
- **SSH habilitado**: Puerto 22 (`ssh sigic@<IP-DE-LA-MAQUINA>`)
