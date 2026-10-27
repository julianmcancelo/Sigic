# SiGIC OS — Suite de Personalización y Optimización para Windows 10
> **Instituto Tecnológico Beltrán (ITB)**  
> **Tecnicatura Superior en Analista de Sistemas**  
> *Inspirado en la arquitectura modular de AtlasOS y Playbooks desatendidos*

---

## 1. ¿Qué es esta Suite?

Esta suite permite transformar cualquier instalación estándar de **Windows 10 (64-bit)** en una versión de alto rendimiento, optimizada, despojada de bloatware de Microsoft (*debloat*) y totalmente personalizada con la identidad institucional de Beltrán y SiGIC.

### Características Principales:
- **Reducción de consumo de RAM y CPU**: Desactiva telemetría pesada, servicios de rastreo y procesos en segundo plano innecesarios.
- **Eliminación de Bloatware UWP**: Remueve de raíz juegos sugeridos, Cortana, Bing News, Xbox Overlays y aplicaciones basura de fábrica.
- **Identidad Institucional Completa**:
  - Tema oscuro forzado para el sistema y las aplicaciones.
  - Inyección de los **10 fondos de pantalla oficiales Beltrán** en alta resolución.
  - Configuración del Explorador para analistas de sistemas (muestra extensiones de archivo y archivos ocultos).
- **Runtimes y Software Esencial**:
  - Visual C++ All-In-One Redistributables (2005 al 2022).
  - 7-Zip y Google Chrome / navegador desatendido.
  - Centro de Control SiGIC en el Escritorio.

---

## 2. Modo 1: Aplicación Rápida en una PC con Windows 10 Existente

Si ya tienes una computadora con Windows 10 funcionando y quieres optimizarla y personalizarla:

1. Ingresá a la carpeta `personalizacion_windows10\`.
2. Hacé doble clic en **`INICIAR-OPTIMIZACION.bat`** (solicitará permisos de Administrador automáticamente).
3. El script ejecutará en consola todas las fases de optimización y aplicará el fondo y tema institucional en vivo.
4. Reiniciá el equipo para consolidar las directivas de servicios y energía.

---

## 3. Modo 2: Instalación 100% Desatendida desde Pendrive USB (Instalador Automático)

Si deseas formatear o instalar Windows 10 en cualquier PC sin tocar el teclado ni responder preguntas:

1. Creá tu pendrive booteable con tu ISO oficial de Windows 10 utilizando **Rufus** o **Ventoy**.
2. Copiá el archivo **`autounattend.xml`** directamente en la **raíz de tu pendrive USB** (ej: `E:\autounattend.xml`).
3. Copiá la carpeta completa **`personalizacion_windows10\`** también a la raíz de tu pendrive USB.
4. Conectá el pendrive a la máquina e iniciá el booteo:
   - Windows Setup detectará el archivo de respuestas.
   - Omitirá las pantallas de idioma, contrato EULA y comprobaciones de hardware (TPM/Secure Boot).
   - Creará automáticamente el usuario local `Administrador` sin contraseñas engorrosas.
   - Al finalizar el primer inicio, ejecutará automáticamente la suite de optimización y dejará el escritorio listo con el fondo Beltrán y las optimizaciones aplicadas.

---

## 4. Selector de Fondos de Pantalla Institucionales

Puedes alternar entre los 10 temas visuales de Beltrán en cualquier momento:

1. Ejecutá **`CAMBIAR-FONDO.bat`**.
2. Seleccioná el número correspondiente:
   - `[1]` Beltrán Oficial (Azul Institucional Activo)
   - `[2]` Original
   - `[3]` Aurora
   - `[4]` Carbon
   - `[5]` Ceremonial
   - `[6]` Cybergrid
   - `[7]` Emerald
   - `[8]` Sapphire
   - `[9]` Sunset
   - `[10]` Alabaster
3. El fondo cambiará de manera instantánea en tu pantalla.

---

## 5. Estructura de Archivos

```
personalizacion_windows10/
├── INICIAR-OPTIMIZACION.bat       # Lanzador con elevacion UAC para Windows 10 instalado
├── Optimizar-SiGIC-OS.ps1         # Script maestro de optimizacion, debloat y visual
├── autounattend.xml               # Archivo de respuestas para instalacion desatendida en USB
├── CAMBIAR-FONDO.bat              # Menu rapido para alternar los 10 temas de Beltran
├── LEEME_INSTRUCCIONES.md         # Documentacion y guia paso a paso
└── recursos/
    ├── fondo_default.jpg          # Fondo por defecto (Beltran Oficial)
    ├── wallpapers/                # 10 variantes de wallpapers institucionales
    └── programas/                 # Instaladores opcionales adicionales
```
