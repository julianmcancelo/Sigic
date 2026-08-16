import 'package:flutter/material.dart';

import '../servicios/servicio_almacenamiento.dart';
import '../servicios/servicio_api.dart';
import '../servicios/servicio_shorebird.dart';
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

  int _indiceActual = 0;
  String? _mensajeShorebird;
  int _revisionSesion = 0;

  @override
  void initState() {
    super.initState();
    final almacenamiento = ServicioAlmacenamiento();
    _servicioApi = ServicioApi(almacenamiento);
    _servicioShorebird = ServicioShorebird();
    _inicializarShorebird();
  }

  Future<void> _inicializarShorebird() async {
    final mensaje = await _servicioShorebird.buscarYDescargarActualizacion();
    if (!mounted || mensaje == null) {
      return;
    }
    setState(() {
      _mensajeShorebird = mensaje;
    });
  }

  @override
  Widget build(BuildContext context) {
    final pantallas = [
      PestanaEscaner(
        servicioApi: _servicioApi,
        mensajeShorebird: _mensajeShorebird,
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

    return Scaffold(
      body: IndexedStack(
        index: _indiceActual,
        children: pantallas,
      ),
      bottomNavigationBar: NavigationBar(
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
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings),
            label: 'Ajustes',
          ),
        ],
      ),
    );
  }
}
