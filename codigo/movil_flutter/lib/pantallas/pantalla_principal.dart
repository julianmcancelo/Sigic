import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../servicios/servicio_almacenamiento.dart';
import '../servicios/servicio_api.dart';
import '../servicios/servicio_shorebird.dart';
import '../servicios/servicio_release.dart';
import 'pantalla_inicio_sistema.dart';
import '../widgets/modales_autenticacion.dart';
import 'pestanas/pestana_asistencia.dart';
import 'pestanas/pestana_administracion.dart';
import 'pestanas/pestana_ajustes.dart';
import 'pestanas/pestana_escaner.dart';
import 'pestanas/pestana_seguridad_nfc.dart';

class PantallaPrincipal extends StatefulWidget {
  const PantallaPrincipal({super.key});

  @override
  State<PantallaPrincipal> createState() => _PantallaPrincipalState();
}

class _PantallaPrincipalState extends State<PantallaPrincipal> {
  late final ServicioApi _servicioApi;
  late final ServicioShorebird _servicioShorebird;
  final ServicioRelease _servicioRelease = ServicioRelease();

  int _indiceActual = 0;
  String? _mensajeShorebird;
  ReleaseDisponible? _releasePendiente;
  int _revisionSesion = 0;
  bool _inicializandoSistema = true;
  bool _tieneSesion = false;
  bool _esAutoridadSeguridad = false;
  bool _buscandoActualizaciones = false;
  String _estadoInicio = 'Verificando actualizaciones seguras...';
  Timer? _timerHeartbeat;

  @override
  void initState() {
    super.initState();
    final almacenamiento = ServicioAlmacenamiento();
    _servicioApi = ServicioApi(almacenamiento);
    _servicioShorebird = ServicioShorebird();
    _verificarSesion();
    _inicializarShorebird();
    _iniciarHeartbeat();
  }

  @override
  void dispose() {
    _timerHeartbeat?.cancel();
    super.dispose();
  }

  void _iniciarHeartbeat() {
    _timerHeartbeat = Timer.periodic(const Duration(seconds: 45), (_) {
      _servicioApi.pingDispositivo();
    });
  }

  Future<void> _verificarSesion() async {
    final token = await _servicioApi.obtenerTokenGuardado();
    final usr = await _servicioApi.obtenerUsuarioLocal();
    final mail = (usr?.email ?? '').toLowerCase().trim();
    final rol = (usr?.rol ?? '').toUpperCase().trim();
    final esAutoridad =
        mail == 'juliancancelo@gmail.com' ||
        mail == 'jcancelo.dev@gmail.com' ||
        mail == 'julianmcancelo@gmail.com' ||
        rol == 'SUPER_ADMIN' ||
        rol == 'ADMIN' ||
        rol == 'SOPORTE' ||
        rol == 'ADMINISTRATIVO';

    if (mounted) {
      setState(() {
        _tieneSesion = token != null && token.isNotEmpty;
        _esAutoridadSeguridad = _tieneSesion && esAutoridad;
      });
    }
  }

  void _mostrarAvisoAccesoRequerido() {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(
          children: [
            Icon(Icons.lock_outline_rounded, color: Colors.white, size: 20),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'Acceso restringido: Debes identificarte en Porteria para acceder a Asistencia, Administracion, Seguridad NFC o Ajustes.',
                style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
        action: SnackBarAction(
          label: 'Ingresar',
          textColor: const Color(0xFF38BDF8),
          onPressed: _abrirModalLoginDesdePrincipal,
        ),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 4),
        backgroundColor: const Color(0xFF0F172A),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }

  Future<void> _abrirModalLoginDesdePrincipal() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ModalLoginManual(
        servicioApi: _servicioApi,
        alIniciarExito: (usuario) {
          _verificarSesion();
          setState(() {
            _revisionSesion++;
          });
          showModalBottomSheet<void>(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (context) => ModalBienvenidaSesion(
              usuario: usuario,
              alContinuar: () => Navigator.of(context).pop(),
            ),
          );
        },
      ),
    );
  }

  Future<void> _buscarActualizacionesEnSplash() async {
    setState(() {
      _buscandoActualizaciones = true;
      _estadoInicio = 'Consultando parches en Shorebird y servidores...';
    });
    try {
      final mensaje = await _servicioShorebird.buscarYDescargarActualizacion();
      final release = await _servicioRelease.buscarNuevaRelease();
      if (!mounted) return;
      setState(() {
        _buscandoActualizaciones = false;
        _mensajeShorebird = mensaje;
        _releasePendiente = release;
        _estadoInicio =
            mensaje ??
            (release != null
                ? 'Nueva version ${release.version} disponible.'
                : 'Sistema al dia. No hay actualizaciones pendientes.');
      });
      if (release != null) {
        await _avisarNuevaRelease();
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _buscandoActualizaciones = false;
        _estadoInicio = 'No se pudo verificar actualizaciones de red.';
      });
    }
  }

  Future<void> _inicializarShorebird() async {
    final inicio = DateTime.now();
    final mensaje = await _servicioShorebird.buscarYDescargarActualizacion();
    final transcurrido = DateTime.now().difference(inicio);
    final espera = const Duration(milliseconds: 1200) - transcurrido;
    if (espera > Duration.zero) {
      await Future<void>.delayed(espera);
    }
    if (!mounted) {
      return;
    }
    setState(() {
      _mensajeShorebird = mensaje;
      _estadoInicio = mensaje ?? 'Sistema verificado. Iniciando operaciones...';
      _inicializandoSistema = false;
    });
    _servicioApi.registrarDispositivo();
    _avisarNuevaRelease();
  }

  Future<void> _avisarNuevaRelease() async {
    final release = await _servicioRelease.buscarNuevaRelease();
    if (!mounted || release == null) return;
    setState(() {
      _releasePendiente = release;
    });
    await showDialog<void>(
      context: context,
      barrierDismissible: !release.required,
      builder: (context) => AlertDialog(
        title: const Text('Nueva version disponible'),
        content: Text(
          'SiGIC ${release.version} esta disponible. ${release.notes}',
        ),
        actions: [
          if (!release.required)
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Mas tarde'),
            ),
          FilledButton(
            onPressed: () async {
              final url = Uri.tryParse(release.apkUrl);
              if (url != null) {
                await launchUrl(url, mode: LaunchMode.externalApplication);
              }
            },
            child: const Text('Descargar APK'),
          ),
        ],
      ),
    );
  }

  DateTime? _ultimoToqueAtras;

  void _manejarRetroceso() {
    if (_indiceActual != 0) {
      setState(() {
        _indiceActual = 0;
      });
      return;
    }

    final ahora = DateTime.now();
    if (_ultimoToqueAtras == null ||
        ahora.difference(_ultimoToqueAtras!) > const Duration(seconds: 2)) {
      _ultimoToqueAtras = ahora;
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Presiona de nuevo para salir de la app'),
          duration: Duration(seconds: 2),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    SystemNavigator.pop();
  }

  @override
  Widget build(BuildContext context) {
    if (_inicializandoSistema) {
      return PantallaInicioSistema(
        estado: _estadoInicio,
        alBuscarActualizaciones: _buscarActualizacionesEnSplash,
        alContinuar: () => setState(() => _inicializandoSistema = false),
        buscando: _buscandoActualizaciones,
      );
    }

    final pantallas = [
      PestanaEscaner(
        servicioApi: _servicioApi,
        mensajeShorebird: _mensajeShorebird,
        revisionSesion: _revisionSesion,
        alCambiarSesion: () {
          _verificarSesion();
          setState(() {
            _revisionSesion++;
          });
        },
      ),
      PestanaAsistencia(
        servicioApi: _servicioApi,
        revisionSesion: _revisionSesion,
      ),
      PestanaAdministracion(
        servicioApi: _servicioApi,
        revisionSesion: _revisionSesion,
      ),
      PestanaSeguridadNfc(
        servicioApi: _servicioApi,
        revisionSesion: _revisionSesion,
        alCambiarSesion: () {
          _verificarSesion();
          setState(() {
            _revisionSesion++;
          });
        },
      ),
      PestanaAjustes(
        servicioApi: _servicioApi,
        servicioShorebird: _servicioShorebird,
        alCambiarSesion: () {
          _verificarSesion();
          setState(() {
            _revisionSesion++;
            _indiceActual = 0;
          });
        },
      ),
    ];

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _manejarRetroceso();
      },
      child: Scaffold(
        body: IndexedStack(index: _indiceActual, children: pantallas),
        bottomNavigationBar: DecoratedBox(
          decoration: const BoxDecoration(
            border: Border(top: BorderSide(color: Color(0xFFE2EAF0))),
          ),
          child: NavigationBar(
            labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
            selectedIndex: _indiceActual,
            onDestinationSelected: (indice) {
              // Permitimos acceder a Seguridad NFC incluso para desbloquear con Tag NFC o PIN Maestro
              if (indice != 0 && indice != 3 && !_tieneSesion) {
                _mostrarAvisoAccesoRequerido();
                return;
              }
              setState(() {
                _indiceActual = indice;
              });
            },
            destinations: [
              const NavigationDestination(
                icon: Icon(Icons.qr_code_scanner_outlined),
                selectedIcon: Icon(Icons.qr_code_scanner),
                label: 'Escanear',
              ),
              NavigationDestination(
                icon: Icon(
                  _tieneSesion
                      ? Icons.groups_2_outlined
                      : Icons.lock_outline_rounded,
                ),
                selectedIcon: Icon(
                  _tieneSesion ? Icons.groups_2 : Icons.lock_rounded,
                ),
                label: _tieneSesion ? 'Asistencia' : 'Protegido',
              ),
              NavigationDestination(
                icon: Icon(
                  _tieneSesion
                      ? Icons.admin_panel_settings_outlined
                      : Icons.lock_outline_rounded,
                ),
                selectedIcon: Icon(
                  _tieneSesion
                      ? Icons.admin_panel_settings
                      : Icons.lock_rounded,
                ),
                label: _tieneSesion ? 'Admin' : 'Protegido',
              ),
              NavigationDestination(
                icon: Icon(
                  _esAutoridadSeguridad
                      ? Icons.nfc_rounded
                      : Icons.shield_outlined,
                ),
                selectedIcon: const Icon(Icons.nfc_rounded),
                label: 'NFC & Llave',
              ),
              NavigationDestination(
                icon: Badge(
                  isLabelVisible: _releasePendiente != null,
                  backgroundColor: const Color(0xFFEF4444),
                  smallSize: 8,
                  child: Icon(
                    _tieneSesion
                        ? Icons.settings_outlined
                        : Icons.lock_outline_rounded,
                  ),
                ),
                selectedIcon: Badge(
                  isLabelVisible: _releasePendiente != null,
                  backgroundColor: const Color(0xFFEF4444),
                  smallSize: 8,
                  child: Icon(
                    _tieneSesion ? Icons.settings : Icons.lock_rounded,
                  ),
                ),
                label: _tieneSesion ? 'Ajustes' : 'Acceso',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
