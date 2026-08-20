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
  String _entorno = 'produccion';

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
      _entorno = widget.servicioApi.esEntornoDemo(apiUrl)
          ? 'demo'
          : widget.servicioApi.esEntornoProduccion(apiUrl)
          ? 'produccion'
          : 'personalizado';
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
      _mostrarSnack(
        'En el telefono no podes usar localhost. Usa la IP de la computadora.',
      );
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

  Future<void> _cambiarEntorno(String entorno) async {
    await widget.servicioApi.cerrarSesion();
    if (entorno == 'demo') {
      await widget.servicioApi.usarEntornoDemo();
      _controladorApi.text = ServicioApi.urlBaseDemo;
    } else if (entorno == 'produccion') {
      await widget.servicioApi.usarEntornoProduccion();
      _controladorApi.text = ServicioApi.urlBasePorDefecto;
    }
    if (!mounted) return;
    setState(() {
      _entorno = entorno;
      _usuario = null;
      _conexionActiva = null;
    });
    widget.alCambiarSesion();
    if (entorno != 'personalizado') await _verificarConexion();
  }

  Future<void> _iniciarDemo() async {
    setState(() => _iniciandoSesion = true);
    try {
      final usuario = await widget.servicioApi.iniciarSesionDemo();
      if (!mounted) return;
      setState(() {
        _usuario = usuario;
        _entorno = 'demo';
        _controladorApi.text = ServicioApi.urlBaseDemo;
        _conexionActiva = true;
      });
      widget.alCambiarSesion();
      _mostrarSnack('Demo conectada. Estas trabajando con datos ficticios.');
    } catch (error) {
      _mostrarSnack(error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _iniciandoSesion = false);
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
    final mensaje = await widget.servicioShorebird
        .buscarYDescargarActualizacion();
    _mostrarSnack(mensaje ?? 'No hay actualizaciones nuevas por ahora.');
  }

  void _mostrarSnack(String mensaje) {
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(mensaje)));
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
                  Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Entorno de trabajo',
                          style: TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                      if (_entorno == 'demo')
                        const Chip(
                          avatar: Icon(Icons.science_outlined, size: 16),
                          label: Text('DEMO'),
                        ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(
                        value: 'demo',
                        icon: Icon(Icons.science_outlined),
                        label: Text('Demo'),
                      ),
                      ButtonSegment(
                        value: 'produccion',
                        icon: Icon(Icons.apartment),
                        label: Text('Produccion'),
                      ),
                      ButtonSegment(
                        value: 'personalizado',
                        icon: Icon(Icons.tune),
                        label: Text('Otro'),
                      ),
                    ],
                    selected: {_entorno},
                    onSelectionChanged: (seleccion) =>
                        _cambiarEntorno(seleccion.first),
                  ),
                  if (_entorno == 'demo') ...[
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.amber.withValues(alpha: .12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text(
                        'Entorno aislado · Todos los registros son ficticios y no afectan produccion.',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                  const SizedBox(height: 14),
                  TextField(
                    controller: _controladorApi,
                    readOnly: _entorno != 'personalizado',
                    decoration: InputDecoration(
                      labelText: 'URL de la API',
                      hintText: ServicioApi.urlBasePorDefecto,
                    ),
                  ),
                  const SizedBox(height: 12),
                  FilledButton.tonal(
                    onPressed: _probandoConexion ? null : _verificarConexion,
                    child: Text(
                      _probandoConexion ? 'Verificando...' : 'Probar conexion',
                    ),
                  ),
                  if (widget.servicioApi.esDireccionLocal(
                    _controladorApi.text,
                  )) ...[
                    const SizedBox(height: 10),
                    const Text(
                      'En celulares, reemplaza localhost por la IP de la computadora.',
                      style: TextStyle(
                        color: Colors.orange,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                  if (_conexionActiva != null) ...[
                    const SizedBox(height: 10),
                    Text(
                      _conexionActiva!
                          ? 'Conexion correcta'
                          : 'No se pudo conectar',
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
                  const Text(
                    'Sesion de seguridad',
                    style: TextStyle(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 14),
                  if (_usuario == null) ...[
                    if (_entorno == 'demo') ...[
                      FilledButton.icon(
                        onPressed: _iniciandoSesion ? null : _iniciarDemo,
                        icon: const Icon(Icons.play_arrow_rounded),
                        label: Text(
                          _iniciandoSesion
                              ? 'Conectando...'
                              : 'Entrar a la demo',
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 12),
                        child: Row(
                          children: [
                            Expanded(child: Divider()),
                            Padding(
                              padding: EdgeInsets.symmetric(horizontal: 10),
                              child: Text('o usar credenciales'),
                            ),
                            Expanded(child: Divider()),
                          ],
                        ),
                      ),
                    ],
                    TextField(
                      controller: _controladorCorreo,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: 'Correo electronico',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _controladorContrasena,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: 'Contrasena',
                      ),
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: _iniciandoSesion ? null : _iniciarSesion,
                      child: Text(
                        _iniciandoSesion ? 'Iniciando...' : 'Iniciar sesion',
                      ),
                    ),
                  ] else ...[
                    Text(
                      _usuario!.nombre,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
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
                  const Text(
                    'Shorebird',
                    style: TextStyle(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Parche actual: ${_parcheActual?.toString() ?? 'sin parche'}',
                  ),
                  const SizedBox(height: 12),
                  FilledButton.tonalIcon(
                    onPressed: _buscarActualizacion,
                    icon: const Icon(Icons.system_update_alt),
                    label: const Text('Buscar actualizacion OTA'),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Las actualizaciones se descargan en segundo plano y se aplican al reiniciar la aplicacion.',
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
