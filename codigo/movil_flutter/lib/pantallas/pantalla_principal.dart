import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../servicios/servicio_almacenamiento.dart';
import '../servicios/servicio_api.dart';
import '../servicios/servicio_shorebird.dart';
import '../servicios/servicio_release.dart';
import 'pantalla_inicio_sistema.dart';
import 'pestanas/pestana_asistencia.dart';
import 'pestanas/pestana_ajustes.dart';
import 'pestanas/pestana_escaner.dart';

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
  int _revisionSesion = 0;
  bool _inicializandoSistema = true;
  String _estadoInicio = 'Verificando actualizaciones seguras...';
  Timer? _timerHeartbeat;

  @override
  void initState() {
    super.initState();
    final almacenamiento = ServicioAlmacenamiento();
    _servicioApi = ServicioApi(almacenamiento);
    _servicioShorebird = ServicioShorebird();
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

  Future<void> _inicializarShorebird() async {
    final inicio = DateTime.now();
    final mensaje = await _servicioShorebird.buscarYDescargarActualizacion();
    final transcurrido = DateTime.now().difference(inicio);
    // Evita un parpadeo de la pantalla de inicio sin demorar el trabajo en puerta.
    final espera = const Duration(milliseconds: 450) - transcurrido;
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
      return PantallaInicioSistema(estado: _estadoInicio);
    }

    final pantallas = [
      PestanaEscaner(
        servicioApi: _servicioApi,
        mensajeShorebird: _mensajeShorebird,
        revisionSesion: _revisionSesion,
      ),
      PestanaAsistencia(
        servicioApi: _servicioApi,
        revisionSesion: _revisionSesion,
      ),
      PestanaAjustes(
        servicioApi: _servicioApi,
        servicioShorebird: _servicioShorebird,
        alCambiarSesion: () {
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
              setState(() {
                _indiceActual = indice;
              });
            },
            destinations: const [
              NavigationDestination(
                icon: Icon(Icons.qr_code_scanner_outlined),
                selectedIcon: Icon(Icons.qr_code_scanner),
                label: 'Escanear',
              ),
              NavigationDestination(
                icon: Icon(Icons.groups_2),
                selectedIcon: Icon(Icons.groups_2),
                label: 'Asistencia',
              ),
              NavigationDestination(
                icon: Icon(Icons.settings_outlined),
                selectedIcon: Icon(Icons.settings),
                label: 'Ajustes',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
