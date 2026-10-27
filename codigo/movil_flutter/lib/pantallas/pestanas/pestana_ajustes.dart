import 'package:flutter/material.dart';

import 'package:url_launcher/url_launcher.dart';

import '../../modelos/usuario_sesion.dart';
import '../../servicios/servicio_api.dart';
import '../../servicios/servicio_shorebird.dart';
import '../../servicios/servicio_release.dart';
import '../../widgets/panel_tarjeta.dart';
import '../../nucleo/tema/controlador_tema.dart';
import '../../nucleo/tema/tema_sigic.dart';

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

  final ServicioRelease _servicioRelease = ServicioRelease();
  ReleaseDisponible? _releaseDisponible;
  bool _buscandoActualizacion = false;
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
      _conexionActiva = null;
    });
    if (widget.servicioApi.esDireccionLocal(_controladorApi.text)) {
      setState(() {
        _conexionActiva = false;
      });
      _mostrarSnack(
        'En el teléfono no podés usar localhost. Usá la IP de la computadora.',
      );
      return;
    }
    final ok = await widget.servicioApi.probarConexion(_controladorApi.text);
    if (!mounted) {
      return;
    }
    setState(() {
      _conexionActiva = ok;
    });
    if (ok) {
      await widget.servicioApi.guardarApiUrl(_controladorApi.text);
      _mostrarSnack('Conexión con el servidor verificada correctamente.');
    } else {
      _mostrarSnack('No se pudo establecer conexión con el servidor.');
    }
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
    setState(() => _buscandoActualizacion = true);
    try {
      final mensajeShorebird = await widget.servicioShorebird
          .buscarYDescargarActualizacion();
      final release = await _servicioRelease.buscarNuevaRelease();
      if (!mounted) return;
      setState(() {
        _releaseDisponible = release;
      });

      if (release != null) {
        _mostrarSnack(
          '¡Nueva versión SiGIC ${release.version} disponible en GitHub!',
        );
      } else if (mensajeShorebird != null) {
        _mostrarSnack(mensajeShorebird);
      } else {
        _mostrarSnack('La aplicación está en su versión más reciente.');
      }
    } finally {
      if (mounted) setState(() => _buscandoActualizacion = false);
    }
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
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            tooltip: 'Verificar conexión',
            onPressed: _verificarConexion,
          ),
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
            // Tarjeta de perfil unificada y destacada
            Container(
              margin: const EdgeInsets.only(bottom: 18),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0A1422),
                borderRadius: BorderRadius.circular(22),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x1F075985),
                    blurRadius: 16,
                    offset: Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: TemaSigic.azulBrillante.withValues(alpha: 0.18),
                        child: Text(
                          _usuario != null && _usuario!.nombre.isNotEmpty
                              ? _usuario!.nombre[0].toUpperCase()
                              : '?',
                          style: const TextStyle(
                            color: Color(0xFF7DD3FC),
                            fontWeight: FontWeight.w900,
                            fontSize: 18,
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
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
                                fontSize: 16.5,
                                letterSpacing: -0.3,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _usuario == null
                                  ? 'Iniciá sesión para comenzar a acreditar'
                                  : '${_usuario!.email} · ${_usuario!.rol}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.68),
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                      _PildoraEstado(
                        etiqueta: _entorno.toUpperCase(),
                        color: _entorno == 'produccion'
                            ? const Color(0xFF0A7F5F)
                            : const Color(0xFFB4530A),
                      ),
                    ],
                  ),
                  if (_usuario != null) ...[
                    const SizedBox(height: 14),
                    const Divider(color: Colors.white12, height: 1),
                    const SizedBox(height: 10),
                    InkWell(
                      onTap: _cerrarSesion,
                      borderRadius: BorderRadius.circular(10),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.logout,
                              size: 15,
                              color: Colors.red.shade300,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Cerrar sesión en este dispositivo',
                              style: TextStyle(
                                color: Colors.red.shade300,
                                fontWeight: FontWeight.w700,
                                fontSize: 12.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),

            if (_usuario == null) ...[
              const _TituloSeccion(
                titulo: 'INICIAR SESIÓN',
                detalle: 'Ingresá con tu cuenta para operar en portería.',
              ),
              PanelTarjeta(
                contenido: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
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
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      height: 44,
                      child: FilledButton(
                        onPressed: _iniciandoSesion ? null : _iniciarSesion,
                        style: FilledButton.styleFrom(
                          backgroundColor: TemaSigic.azulPrincipal,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text(
                          _iniciandoSesion
                              ? 'Iniciando sesión...'
                              : 'Iniciar sesión',
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],

            const _TituloSeccion(
              titulo: 'APARIENCIA',
              detalle: 'Ajustá el tema visual de la aplicación.',
            ),
            PanelTarjeta(
              contenido: ValueListenableBuilder<ThemeMode>(
                valueListenable: modoTemaSigic,
                builder: (context, modo, _) =>
                    DropdownButtonFormField<ThemeMode>(
                  // ignore: deprecated_member_use
                  value: modo,
                  decoration: const InputDecoration(
                    labelText: 'Tema de la aplicación',
                  ),
                  items: const [
                    DropdownMenuItem(
                      value: ThemeMode.light,
                      child: Text('Claro'),
                    ),
                    DropdownMenuItem(
                      value: ThemeMode.dark,
                      child: Text('Oscuro'),
                    ),
                    DropdownMenuItem(
                      value: ThemeMode.system,
                      child: Text('Según el sistema'),
                    ),
                  ],
                  onChanged: (valor) {
                    if (valor != null) modoTemaSigic.value = valor;
                  },
                ),
              ),
            ),
            const SizedBox(height: 12),

            const _TituloSeccion(
              titulo: 'ACTUALIZACIONES & SHOREBIRD',
              detalle:
                  'Distribución y parches seguros en segundo plano vía Shorebird OTA.',
            ),
            PanelTarjeta(
              contenido: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF075985).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.cloud_sync_outlined,
                          color: Color(0xFF0284C7),
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _parcheActual != null
                                  ? 'Shorebird · Parche #$_parcheActual activo'
                                  : 'Shorebird · Versión base activa',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 2),
                            const Text(
                              'Canal de distribución: Oficial ITB',
                              style: TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 11.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      _PildoraEstado(
                        etiqueta: _parcheActual != null ? 'PARCHEADO' : 'BASE',
                        color: _parcheActual != null
                            ? const Color(0xFF0284C7)
                            : const Color(0xFF64748B),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Las actualizaciones se reciben de forma transparente sin reinstalar el instalador, quedando operativas al iniciar la app.',
                    style: TextStyle(
                      color: Color(0xFF5C7386),
                      fontSize: 12,
                      height: 1.35,
                    ),
                  ),
                  if (_releaseDisponible != null) ...[
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0A7F5F).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: const Color(0xFF0A7F5F).withValues(alpha: 0.3),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(
                                Icons.new_releases,
                                color: Color(0xFF0A7F5F),
                                size: 18,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Versión ${_releaseDisponible!.version} disponible',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF0A7F5F),
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            _releaseDisponible!.notes,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF334155),
                            ),
                          ),
                          const SizedBox(height: 10),
                          FilledButton.icon(
                            onPressed: () async {
                              final uri = Uri.tryParse(_releaseDisponible!.apkUrl);
                              if (uri != null) {
                                await launchUrl(uri, mode: LaunchMode.externalApplication);
                              }
                            },
                            style: FilledButton.styleFrom(
                              backgroundColor: const Color(0xFF0A7F5F),
                              visualDensity: VisualDensity.compact,
                            ),
                            icon: const Icon(Icons.download, size: 16),
                            label: const Text('Descargar APK e instalar'),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.tonalIcon(
                      onPressed: _buscandoActualizacion ? null : _buscarActualizacion,
                      icon: _buscandoActualizacion
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.sync, size: 18),
                      label: Text(
                        _buscandoActualizacion
                            ? 'Comprobando parches en Shorebird...'
                            : 'Buscar parches y actualizaciones ahora',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            const _TituloSeccion(
              titulo: 'ACERCA DE',
              detalle: 'Información institucional y equipo de desarrollo.',
            ),
            PanelTarjeta(
              contenido: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x10000000),
                              blurRadius: 8,
                              offset: Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Image.asset(
                          'assets/imagenes/logo-oficial.png',
                          fit: BoxFit.contain,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'SiGIC Móvil',
                              style: TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 16,
                                letterSpacing: -0.2,
                              ),
                            ),
                            const SizedBox(height: 1),
                            Text(
                              'Sistema de Gestión Institucional de Colaciones',
                              style: TextStyle(
                                color: Colors.grey.shade600,
                                fontSize: 11.5,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text(
                      'INSTITUTO TECNOLÓGICO BELTRÁN\nTecnicatura Superior en Analista de Sistemas · Ciclo 2026',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF334155),
                        height: 1.35,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    'Equipo de Proyecto',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _FilaIntegrante(
                          nombre: 'Cancelo Julian',
                          rol: 'Líder de Proyecto & Fullstack · Analista de Sistemas',
                          esLider: true,
                        ),
                        Divider(height: 14, color: Color(0xFFE2E8F0)),
                        _FilaIntegrante(
                          nombre: 'Alfonso Alan Alexis',
                          rol: 'Analista de Sistemas',
                        ),
                        SizedBox(height: 6),
                        _FilaIntegrante(
                          nombre: 'Contreras Villalba Sol Heilin',
                          rol: 'Analista de Sistemas',
                        ),
                        SizedBox(height: 6),
                        _FilaIntegrante(
                          nombre: 'Frassia Matias',
                          rol: 'Analista de Sistemas',
                        ),
                        SizedBox(height: 6),
                        _FilaIntegrante(
                          nombre: 'Santillan Luis Gabriel',
                          rol: 'Analista de Sistemas',
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Center(
                    child: Text(
                      'Versión 1.0.9 (Build 10) · Avellaneda, Buenos Aires',
                      style: TextStyle(
                        fontSize: 10,
                        color: Color(0xFF94A3B8),
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.w600,
                      ),
                    ),
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

class _FilaIntegrante extends StatelessWidget {
  const _FilaIntegrante({
    required this.nombre,
    required this.rol,
    this.esLider = false,
  });

  final String nombre;
  final String rol;
  final bool esLider;

  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Container(
        margin: const EdgeInsets.only(top: 4),
        width: 6,
        height: 6,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: esLider ? const Color(0xFF003865) : const Color(0xFF64748B),
        ),
      ),
      const SizedBox(width: 8),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              nombre,
              style: TextStyle(
                fontSize: 12,
                fontWeight: esLider ? FontWeight.w800 : FontWeight.w700,
                color: esLider
                    ? const Color(0xFF003865)
                    : const Color(0xFF1E293B),
              ),
            ),
            Text(
              rol,
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: esLider ? FontWeight.w600 : FontWeight.w500,
                color: esLider
                    ? const Color(0xFF0284C7)
                    : const Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
    ],
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

