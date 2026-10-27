# SiGIC OS — Suite de Personalización y Optimización para Windows 10
> **Instituto Tecnológico Beltrán (ITB)**  
> **Tecnicatura Superior en Analista de Sistemas**  
> *Edición Avanzada inspirada en la arquitectura modular de AtlasOS y ReviOS*

---

## 1. ¿Qué es esta Suite?

Esta suite transforma cualquier instalación de **Windows 10 (64-bit)** en un sistema de ultra bajo consumo de recursos, optimizado para latencia cero, despojado de bloatware de Microsoft (*debloat*) y totalmente personalizado con la identidad institucional de Beltrán y SiGIC.

### Capacidades Avanzadas Integradas:
- **Perfiles Modulares**: 
  - *AtlasOS Extremo*: Máximo rendimiento para servidores locales, quioscos y acreditación en vivo.
  - *Estación de Oficina*: Rendimiento optimizado manteniendo servicios de impresión y Bluetooth.
- **Ajustes de Kernel y Red (Low Latency TCP/IP)**: Desactiva el estrangulamiento de red de Windows (`NetworkThrottlingIndex = 0xFFFFFFFF`) y activa el procesamiento inmediato de paquetes (`TCPNoDelay = 1`).
- **Modo Acto de Colación / Presentación**: Bloquea con 1 clic la suspensión de monitor, protector de pantalla y notificaciones para presentaciones sin interrupciones.
- **Menú Contextual Institucional en el Escritorio**: Clic derecho en el escritorio con accesos directos a SiGIC, fondos, liberación de memoria y modo ceremonia.
- **Liberador de Memoria RAM en Vivo**: Purga las listas de espera (*Standby List*) y conjuntos de trabajo para recuperar RAM al instante sin reiniciar.
- **Identidad Institucional Completa**: Tema oscuro forzado y los 10 fondos de pantalla oficiales de Beltrán en alta resolución.
- **Despliegue Desatendido**: Archivo `autounattend.xml` listo para formateos automáticos sin interacción humana.

---

## 2. Herramientas y Scripts Incluidos

```
personalizacion_windows10/
├── Panel-Control-SiGIC.bat        # Panel de Control interactivo central (TUI con perfiles)
├── INICIAR-OPTIMIZACION.bat       # Lanzador rapido directo con elevacion UAC
├── Optimizar-SiGIC-OS.ps1         # Motor maestro de optimizacion y debloat
├── Modo-Ceremonia.bat             # Alternador del Modo Presentacion / Colacion
├── Modo-Ceremonia.ps1             # Logica de gestion energetica y notificaciones
├── Liberar-RAM.bat                # Utilidad de purga de memoria RAM en vivo
├── Liberar-RAM.ps1                # Invocacion nativa psapi.dll y Garbage Collector
├── CAMBIAR-FONDO.bat              # Selector interactivo de los 10 temas Beltran
├── Instalar-Menu-Contextual.ps1   # Registrador del menu 'Herramientas SiGIC' (Clic derecho)
├── Desinstalar-Menu-Contextual.ps1# Desinstalador limpio del menu contextual
├── Restaurar-Defaults.bat         # Revertir a valores predeterminados de Windows
├── Restaurar-Defaults.ps1         # Reasigna planes de energia y telemetria estandar
├── autounattend.xml               # Archivo de respuestas para instalacion desatendida en USB
├── LEEME_INSTRUCCIONES.md         # Documentacion tecnica de la suite
└── recursos/
    ├── fondo_default.jpg          # Fondo institucional activo (Beltran Oficial)
    ├── wallpapers/                # Coleccion completa de los 10 fondos
    └── programas/                 # Instaladores opcionales fuera de linea
```

---

## 3. Modo de Uso en Equipos Existentes

1. Hacé doble clic en **`Panel-Control-SiGIC.bat`** (se abrirá automáticamente con permisos de Administrador).
2. Podés elegir entre:
   - `[1]` Aplicar Perfil AtlasOS Extremo.
   - `[2]` Aplicar Perfil Estación de Oficina.
   - `[3]` Activar / Alternar Modo Ceremonia (para el día del evento).
   - `[4]` Cambiar Fondo Institucional (entre los 10 temas).
   - `[5]` Liberar Memoria RAM en Vivo.
   - `[6]` Instalar el Menú Contextual en el Escritorio.
   - `[8]` Ver Diagnóstico de CPU, RAM y Procesos en Tiempo Real.
   - `[9]` Restaurar los valores originales si fuera necesario.

---

## 4. Instalación 100% Desatendida desde Pendrive USB

Para instalar Windows 10 en cualquier PC sin tocar el teclado ni responder preguntas:

1. Creá tu pendrive booteable con tu ISO oficial de Windows 10 usando **Rufus** o **Ventoy**.
2. Copiá **`autounattend.xml`** en la raíz de tu pendrive USB (`E:\autounattend.xml`).
3. Copiá la carpeta **`personalizacion_windows10\`** también a la raíz de tu pendrive (`E:\personalizacion_windows10\`).
4. Booteá el equipo desde el pendrive:
   - Se omitirán todas las pantallas de configuración y comprobaciones de hardware.
   - Creará el usuario `Administrador`.
   - Ejecutará automáticamente la suite completa y entregará el escritorio ya listo, optimizado y con el fondo Beltrán colocado.
