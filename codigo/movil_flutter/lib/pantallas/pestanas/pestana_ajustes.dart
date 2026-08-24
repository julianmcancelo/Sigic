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
    final conectado = _conexionActiva == true;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ajustes'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: _PildoraEstado(
              etiqueta: conectado ? 'EN LÍNEA' : 'SIN VERIFICAR',
              color: conectado
                  ? const Color(0xFF0A7F5F)
                  : const Color(0xFF64798C),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
          children: [
            Container(
              margin: const EdgeInsets.only(bottom: 18),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0A1422),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  Container(
                    width: 46,
                    height: 46,
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Image.asset('assets/imagenes/splash-icono.png'),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _usuario?.nombre ?? 'Dispositivo sin sesión',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          _usuario == null
                              ? 'Configurá el entorno y accedé para operar.'
                              : '${_usuario!.rol} · ${_entorno.toUpperCase()}',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.68),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    conectado ? Icons.settings : Icons.tune,
                    color: conectado
                        ? const Color(0xFF6EE7B7)
                        : const Color(0xFFB8C8D2),
                  ),
                ],
              ),
            ),
            const _TituloSeccion(
              titulo: 'ENTORNO DE TRABAJO',
              detalle: 'Elegí dónde opera este dispositivo.',
            ),
            PanelTarjeta(
              contenido: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _BotonEntorno(
                        etiqueta: 'Demo',
                        icono: Icons.science_outlined,
                        seleccionado: _entorno == 'demo',
                        alPresionar: () => _cambiarEntorno('demo'),
                      ),
                      _BotonEntorno(
                        etiqueta: 'Producción',
                        icono: Icons.apartment,
                        seleccionado: _entorno == 'produccion',
                        alPresionar: () => _cambiarEntorno('produccion'),
                      ),
                      _BotonEntorno(
                        etiqueta: 'Servidor',
                        icono: Icons.tune,
                        seleccionado: _entorno == 'personalizado',
                        alPresionar: () => _cambiarEntorno('personalizado'),
                      ),
                    ],
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
                  OutlinedButton.icon(
                    onPressed: _probandoConexion ? null : _verificarConexion,
                    icon: Icon(
                      _probandoConexion
                          ? Icons.system_update_alt
                          : Icons.system_update_alt,
                    ),
                    label: Text(
                      _probandoConexion
                          ? 'Verificando conexión...'
                          : 'Comprobar conexión',
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
                    _MensajeConexion(activa: _conexionActiva!),
                  ],
                ],
              ),
            ),
            const _TituloSeccion(
              titulo: 'SESIÓN DE OPERADOR',
              detalle: 'La cuenta define qué ceremonias podés acreditar.',
            ),
            PanelTarjeta(
              contenido: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_usuario == null) ...[
                    if (_entorno == 'demo') ...[
                      FilledButton.icon(
                        onPressed: _iniciandoSesion ? null : _iniciarDemo,
                        icon: const Icon(Icons.play_arrow_rounded),
                        label: Text(
                          _iniciandoSesion
                              ? 'Conectando demo...'
                              : 'Entrar a la demo',
                        ),
                      ),
                      const _SeparadorConTexto('o iniciá con tus credenciales'),
                    ],
                    TextField(
                      controller: _controladorCorreo,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: 'Correo electrónico',
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _controladorContrasena,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: 'Contraseña',
                      ),
                    ),
                    const SizedBox(height: 12),
                    FilledButton.icon(
                      onPressed: _iniciandoSesion ? null : _iniciarSesion,
                      icon: const Icon(Icons.play_arrow_rounded),
                      label: Text(
                        _iniciandoSesion
                            ? 'Iniciando sesión...'
                            : 'Iniciar sesión',
                      ),
                    ),
                  ] else ...[
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(
                        backgroundColor: const Color(0xFFE1F4FA),
                        foregroundColor: const Color(0xFF075985),
                        child: Text(
                          _usuario!.nombre.substring(0, 1).toUpperCase(),
                        ),
                      ),
                      title: Text(
                        _usuario!.nombre,
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                      subtitle: Text(_usuario!.email),
                      trailing: _PildoraEstado(
                        etiqueta: _usuario!.rol.toUpperCase(),
                        color: const Color(0xFF075985),
                      ),
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                      onPressed: _cerrarSesion,
                      icon: const Icon(Icons.tune),
                      label: const Text('Cerrar sesión en este dispositivo'),
                    ),
                  ],
                ],
              ),
            ),
            const _TituloSeccion(
              titulo: 'ACTUALIZACIONES',
              detalle:
                  'El sistema se actualiza de forma segura en segundo plano.',
            ),
            PanelTarjeta(
              contenido: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.system_update_alt,
                        color: Color(0xFF075985),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Shorebird · parche ${_parcheActual?.toString() ?? 'base'}',
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Las mejoras se descargan en segundo plano y quedan listas al reiniciar la aplicación.',
                    style: TextStyle(color: Color(0xFF5C7386), height: 1.35),
                  ),
                  const SizedBox(height: 14),
                  FilledButton.tonalIcon(
                    onPressed: _buscarActualizacion,
                    icon: const Icon(Icons.system_update_alt),
                    label: const Text('Buscar actualización ahora'),
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

class _TituloSeccion extends StatelessWidget {
  const _TituloSeccion({required this.titulo, required this.detalle});
  final String titulo;
  final String detalle;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(2, 2, 2, 9),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          titulo,
          style: const TextStyle(
            fontSize: 10.5,
            letterSpacing: 1,
            fontWeight: FontWeight.w900,
            color: Color(0xFF64798C),
          ),
        ),
        const SizedBox(height: 3),
        Text(
          detalle,
          style: const TextStyle(fontSize: 12, color: Color(0xFF5C7386)),
        ),
      ],
    ),
  );
}

class _PildoraEstado extends StatelessWidget {
  const _PildoraEstado({required this.etiqueta, required this.color});
  final String etiqueta;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
    decoration: BoxDecoration(
      color: color.withValues(alpha: .11),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Text(
      etiqueta,
      style: TextStyle(
        fontSize: 10,
        letterSpacing: .5,
        fontWeight: FontWeight.w900,
        color: color,
      ),
    ),
  );
}

class _BotonEntorno extends StatelessWidget {
  const _BotonEntorno({
    required this.etiqueta,
    required this.icono,
    required this.seleccionado,
    required this.alPresionar,
  });
  final String etiqueta;
  final IconData icono;
  final bool seleccionado;
  final VoidCallback alPresionar;

  @override
  Widget build(BuildContext context) => ChoiceChip(
    selected: seleccionado,
    onSelected: (_) => alPresionar(),
    avatar: Icon(
      icono,
      size: 17,
      color: seleccionado ? const Color(0xFF075985) : const Color(0xFF5C7386),
    ),
    label: Text(etiqueta),
    labelStyle: TextStyle(
      fontWeight: FontWeight.w800,
      color: seleccionado ? const Color(0xFF075985) : const Color(0xFF3F5668),
    ),
    selectedColor: const Color(0xFFE1F4FA),
    side: BorderSide(
      color: seleccionado ? const Color(0xFF075985) : const Color(0xFFE2EAF0),
    ),
  );
}

class _MensajeConexion extends StatelessWidget {
  const _MensajeConexion({required this.activa});
  final bool activa;

  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(10),
    decoration: BoxDecoration(
      color: (activa ? const Color(0xFF10B981) : const Color(0xFFEF4444))
          .withValues(alpha: .10),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Row(
      children: [
        Icon(
          activa ? Icons.check_circle : Icons.error,
          size: 18,
          color: activa ? const Color(0xFF0A7F5F) : const Color(0xFFB91C1C),
        ),
        const SizedBox(width: 8),
        Text(
          activa
              ? 'Conexión verificada y lista para operar.'
              : 'No se pudo validar la conexión.',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            color: activa ? const Color(0xFF0A7F5F) : const Color(0xFFB91C1C),
          ),
        ),
      ],
    ),
  );
}

class _SeparadorConTexto extends StatelessWidget {
  const _SeparadorConTexto(this.texto);
  final String texto;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 14),
    child: Row(
      children: [
        const Expanded(child: Divider()),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: Text(
            texto,
            style: const TextStyle(color: Color(0xFF64798C), fontSize: 12),
          ),
        ),
        const Expanded(child: Divider()),
      ],
    ),
  );
}
