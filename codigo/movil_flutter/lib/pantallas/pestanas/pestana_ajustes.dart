import 'package:flutter/material.dart';

import '../../modelos/usuario_sesion.dart';
import '../../servicios/servicio_api.dart';
import '../../servicios/servicio_shorebird.dart';
import '../../widgets/panel_tarjeta.dart';

class PestanaAjustes extends StatefulWidget {
  const PestanaAjustes({
    super.key,
    required this.servicioApi,
    required this.servicioShorebird,
    required this.alCambiarSesion,
  });

  final ServicioApi servicioApi;
  final ServicioShorebird servicioShorebird;
  final VoidCallback alCambiarSesion;

  @override
  State<PestanaAjustes> createState() => _PestanaAjustesState();
}

class _PestanaAjustesState extends State<PestanaAjustes> {
  final TextEditingController _controladorApi = TextEditingController();
  final TextEditingController _controladorCorreo = TextEditingController();
  final TextEditingController _controladorContrasena = TextEditingController();

  bool _probandoConexion = false;
  bool _iniciandoSesion = false;
  bool? _conexionActiva;
  UsuarioSesion? _usuario;
  int? _parcheActual;

  @override
  void initState() {
    super.initState();
    _cargarDatos();
  }

  @override
  void dispose() {
    _controladorApi.dispose();
    _controladorCorreo.dispose();
    _controladorContrasena.dispose();
    super.dispose();
  }

  Future<void> _cargarDatos() async {
    final apiUrl = await widget.servicioApi.obtenerApiUrl();
    final usuario = await widget.servicioApi.obtenerUsuarioGuardado();
    final parche = await widget.servicioShorebird.obtenerParcheActual();
    if (!mounted) {
      return;
    }
    setState(() {
      _controladorApi.text = apiUrl;
      _usuario = usuario;
      _parcheActual = parche;
    });
    if (usuario != null) {
      _conexionActiva = await widget.servicioApi.probarConexion(apiUrl);
      if (mounted) {
        setState(() {});
      }
    }
  }

  Future<void> _verificarConexion() async {
    setState(() {
      _probandoConexion = true;
      _conexionActiva = null;
    });
    if (widget.servicioApi.esDireccionLocal(_controladorApi.text)) {
      setState(() {
        _probandoConexion = false;
        _conexionActiva = false;
      });
      _mostrarSnack('En el telefono no podes usar localhost. Usa la IP de la computadora.');
      return;
    }
    final ok = await widget.servicioApi.probarConexion(_controladorApi.text);
    if (!mounted) {
      return;
    }
    setState(() {
      _probandoConexion = false;
      _conexionActiva = ok;
    });
    if (ok) {
      await widget.servicioApi.guardarApiUrl(_controladorApi.text);
    }
  }

  Future<void> _iniciarSesion() async {
    setState(() {
      _iniciandoSesion = true;
    });
    try {
      await widget.servicioApi.guardarApiUrl(_controladorApi.text);
      final usuario = await widget.servicioApi.iniciarSesionConCredenciales(
        email: _controladorCorreo.text.trim(),
        contrasena: _controladorContrasena.text,
      );
      if (!mounted) {
        return;
      }
      setState(() {
        _usuario = usuario;
      });
      widget.alCambiarSesion();
      _mostrarSnack('Sesion iniciada correctamente.');
    } catch (error) {
      _mostrarSnack(error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) {
        setState(() {
          _iniciandoSesion = false;
        });
      }
    }
  }

  Future<void> _cerrarSesion() async {
    await widget.servicioApi.cerrarSesionDispositivo();
    if (!mounted) {
      return;
    }
    setState(() {
      _usuario = null;
      _controladorCorreo.clear();
      _controladorContrasena.clear();
      _conexionActiva = null;
    });
    widget.alCambiarSesion();
  }

  Future<void> _buscarActualizacion() async {
    final mensaje = await widget.servicioShorebird.buscarYDescargarActualizacion();
    _mostrarSnack(mensaje ?? 'No hay actualizaciones nuevas por ahora.');
  }

  void _mostrarSnack(String mensaje) {
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(mensaje)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ajustes')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          children: [
            PanelTarjeta(
              contenido: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Servidor institucional', style: TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _controladorApi,
                    decoration: const InputDecoration(
                      labelText: 'URL de la API',
                      hintText: 'https://sigic-one.vercel.app/api',
                    ),
                  ),
                  const SizedBox(height: 12),
                  FilledButton.tonal(
                    onPressed: _probandoConexion ? null : _verificarConexion,
                    child: Text(_probandoConexion ? 'Verificando...' : 'Probar conexion'),
                  ),
                  if (widget.servicioApi.esDireccionLocal(_controladorApi.text)) ...[
                    const SizedBox(height: 10),
                    const Text(
                      'En celulares, reemplaza localhost por la IP de la computadora.',
                      style: TextStyle(color: Colors.orange, fontWeight: FontWeight.w700),
                    ),
                  ],
                  if (_conexionActiva != null) ...[
                    const SizedBox(height: 10),
                    Text(
                      _conexionActiva! ? 'Conexion correcta' : 'No se pudo conectar',
                      style: TextStyle(
                        color: _conexionActiva! ? Colors.green : Colors.red,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            PanelTarjeta(
              contenido: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Sesion de seguridad', style: TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 14),
                  if (_usuario == null) ...[
                    TextField(
                      controller: _controladorCorreo,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(labelText: 'Correo electronico'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _controladorContrasena,
                      obscureText: true,
                      decoration: const InputDecoration(labelText: 'Contrasena'),
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: _iniciandoSesion ? null : _iniciarSesion,
                      child: Text(_iniciandoSesion ? 'Iniciando...' : 'Iniciar sesion'),
                    ),
                  ] else ...[
                    Text(_usuario!.nombre, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                    const SizedBox(height: 6),
                    Text(_usuario!.email),
                    Text('Rol: ${_usuario!.rol}'),
                    const SizedBox(height: 12),
                    OutlinedButton(
                      onPressed: _cerrarSesion,
                      child: const Text('Cerrar sesion'),
                    ),
                  ],
                ],
              ),
            ),
            PanelTarjeta(
              contenido: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Shorebird', style: TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 10),
                  Text('Parche actual: ${_parcheActual?.toString() ?? 'sin parche'}'),
                  const SizedBox(height: 12),
                  FilledButton.tonalIcon(
                    onPressed: _buscarActualizacion,
                    icon: const Icon(Icons.system_update_alt),
                    label: const Text('Buscar actualizacion OTA'),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Para activar Shorebird por completo en este proyecto: instalar la CLI, ejecutar shorebird init y publicar releases con shorebird release android/ios.',
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
