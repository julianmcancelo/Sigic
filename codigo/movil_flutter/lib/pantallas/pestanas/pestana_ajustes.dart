import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../modelos/ceremonia.dart';
import '../../modelos/estadisticas_acceso.dart';
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

  Ceremonia? _ceremoniaAdmin;
  EstadisticasAcceso? _estadisticasAdmin;
  bool _cargandoAdmin = false;

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
      if (usuario.esAdministrativo) {
        await _cargarDatosAdmin();
      }
      if (mounted) {
        setState(() {});
      }
    }
  }

  Future<void> _cargarDatosAdmin() async {
    if (!mounted) return;
    setState(() => _cargandoAdmin = true);
    try {
      final resultados = await Future.wait([
        widget.servicioApi.obtenerCeremoniaActiva(),
        widget.servicioApi.obtenerEstadisticas(),
      ]);
      if (!mounted) return;
      setState(() {
        _ceremoniaAdmin = resultados[0] as Ceremonia?;
        _estadisticasAdmin = resultados[1] as EstadisticasAcceso?;
      });
    } catch (_) {
      // Ignorar errores temporales de conexión en background
    } finally {
      if (mounted) {
        setState(() => _cargandoAdmin = false);
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
      if (_usuario != null && _usuario!.esAdministrativo) {
        await _cargarDatosAdmin();
      }
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
      await _cargarDatos();
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
      await _cargarDatos();
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

  Future<void> _abrirEscanerLoginQR() async {
    final codigo = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _ModalEscanerLoginQR(),
    );

    if (codigo != null && codigo.trim().isNotEmpty) {
      await _procesarLoginConQR(codigo.trim());
    }
  }

  Future<void> _procesarLoginConQR(String codigo) async {
    setState(() => _iniciandoSesion = true);
    try {
      if (codigo.startsWith('sigic-config:')) {
        final url = codigo.substring('sigic-config:'.length).trim();
        if (widget.servicioApi.esDireccionLocal(url)) {
          throw Exception(
            'El código contiene localhost. Usá la IP de la computadora.',
          );
        }
        await widget.servicioApi.guardarApiUrl(url);
        _controladorApi.text = url;
        _mostrarSnack('Servidor configurado correctamente.');
        return;
      }

      var token = codigo;
      if (codigo.startsWith('sigic-login:')) {
        token = codigo.substring('sigic-login:'.length).trim();
      }

      final usuario = await widget.servicioApi.iniciarSesionConToken(token);
      if (!mounted) return;
      setState(() {
        _usuario = usuario;
      });
      widget.alCambiarSesion();
      await _cargarDatos();
      _mostrarSnack('Sesión iniciada correctamente como ${usuario.nombre}.');
    } catch (error) {
      _mostrarSnack(error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _iniciandoSesion = false);
    }
  }

  Future<void> _mostrarSelectorCeremoniasAdmin() async {
    try {
      final ceremonias = await widget.servicioApi.obtenerCeremoniasAutorizadas();
      if (!mounted) return;
      if (ceremonias.isEmpty) {
        _mostrarSnack('No hay ceremonias autorizadas registradas en el servidor.');
        return;
      }

      await showModalBottomSheet<void>(
        context: context,
        backgroundColor: Colors.white,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        builder: (context) {
          final formatterFecha = DateFormat('dd/MM/yyyy', 'es_AR');
          return Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Seleccionar Ceremonia Activa',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'Elegí la ceremonia que querés activar y supervisar:',
                  style: TextStyle(
                    fontSize: 12.5,
                    color: Colors.grey.shade600,
                  ),
                ),
                const SizedBox(height: 14),
                Flexible(
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: ceremonias.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final item = ceremonias[index];
                      return InkWell(
                        onTap: () async {
                          Navigator.pop(context);
                          if (!item.activa) {
                            try {
                              await widget.servicioApi.activarCeremonia(item.id);
                              if (!mounted) return;
                              _mostrarSnack('Ceremonia activa cambiada a: ${item.nombre}');
                              widget.alCambiarSesion();
                              await _cargarDatosAdmin();
                            } catch (e) {
                              _mostrarSnack(e.toString().replaceFirst('Exception: ', ''));
                            }
                          }
                        },
                        borderRadius: BorderRadius.circular(14),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            color: item.activa
                                ? TemaSigic.azulPrincipal.withValues(alpha: 0.08)
                                : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: item.activa
                                  ? TemaSigic.azulPrincipal
                                  : const Color(0xFFE2E8F0),
                              width: item.activa ? 1.5 : 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                item.activa ? Icons.check_circle : Icons.school_outlined,
                                color: item.activa ? TemaSigic.azulPrincipal : const Color(0xFF64748B),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.nombre,
                                      style: TextStyle(
                                        fontWeight: item.activa ? FontWeight.w800 : FontWeight.w600,
                                        fontSize: 13.5,
                                        color: item.activa ? TemaSigic.azulPrincipal : const Color(0xFF1E293B),
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${item.lugar} · ${item.fecha != null ? formatterFecha.format(item.fecha!) : 'Fecha a definir'}',
                                      style: TextStyle(
                                        fontSize: 11.5,
                                        color: Colors.grey.shade600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (item.activa)
                                const _PildoraEstado(
                                  etiqueta: 'ACTIVA',
                                  color: Color(0xFF0A7F5F),
                                ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        },
      );
    } catch (e) {
      _mostrarSnack(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _compartirReporteAforo() async {
    final ceremonia = _ceremoniaAdmin;
    final stats = _estadisticasAdmin;
    final formatterFecha = DateFormat('dd/MM/yyyy HH:mm', 'es_AR');
    final ahora = formatterFecha.format(DateTime.now());

    final buffer = StringBuffer();
    buffer.writeln('====================================');
    buffer.writeln('SiGIC - REPORTE DE AFORO EN VIVO');
    buffer.writeln('====================================');
    buffer.writeln('Fecha y hora: $ahora');
    buffer.writeln('Ceremonia: ${ceremonia?.nombre ?? 'No especificada'}');
    buffer.writeln('Lugar: ${ceremonia?.lugar ?? 'Sede Beltrán'}');
    buffer.writeln('------------------------------------');
    if (stats != null) {
      buffer.writeln('Total Presentes: ${stats.presentes} / ${stats.totalInvitados} (${stats.porcentajeAsistencia}%)');
      buffer.writeln('Egresados Registrados: ${stats.totalEgresados}');
      buffer.writeln('Ausentes Estimados: ${stats.ausentes}');
    } else {
      buffer.writeln('Datos de aforo no disponibles en este momento.');
    }
    buffer.writeln('------------------------------------');
    buffer.writeln('Operador: ${_usuario?.nombre ?? 'Administrativo'}');
    buffer.writeln('Instituto Tecnológico Beltrán');
    buffer.writeln('Tecnicatura Superior en Analista de Sistemas');
    buffer.writeln('====================================');

    await Clipboard.setData(ClipboardData(text: buffer.toString()));
    _mostrarSnack('Reporte de aforo copiado al portapapeles.');
  }

  Future<void> _cerrarSesion() async {
    await widget.servicioApi.cerrarSesionDispositivo();
    if (!mounted) {
      return;
    }
    setState(() {
      _usuario = null;
      _ceremoniaAdmin = null;
      _estadisticasAdmin = null;
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

            if (_usuario != null && _usuario!.esAdministrativo) ...[
              const _TituloSeccion(
                titulo: 'PANEL ADMINISTRATIVO',
                detalle: 'Supervisión en tiempo real y control general del evento.',
              ),
              _TarjetaPanelAdministrativo(
                ceremonia: _ceremoniaAdmin,
                estadisticas: _estadisticasAdmin,
                cargando: _cargandoAdmin,
                alCambiarCeremonia: _mostrarSelectorCeremoniasAdmin,
                alCompartirReporte: _compartirReporteAforo,
                alActualizar: _cargarDatosAdmin,
              ),
              const SizedBox(height: 16),
            ],

            if (_usuario == null) ...[
              const _TituloSeccion(
                titulo: 'INICIAR SESIÓN',
                detalle: 'Ingresá con tu cuenta para operar en portería o administración.',
              ),
              PanelTarjeta(
                contenido: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: double.infinity,
                      height: 46,
                      child: OutlinedButton.icon(
                        onPressed: _iniciandoSesion ? null : _abrirEscanerLoginQR,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF0284C7),
                          side: const BorderSide(color: Color(0xFF0284C7), width: 1.5),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        icon: const Icon(Icons.qr_code_scanner_rounded, size: 20),
                        label: const Text(
                          'Escanear QR de Operador o Administrativo',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                    const _SeparadorConTexto('o ingresá con tus credenciales'),
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
                      const SizedBox(height: 12),
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

class _TarjetaPanelAdministrativo extends StatelessWidget {
  const _TarjetaPanelAdministrativo({
    required this.ceremonia,
    required this.estadisticas,
    required this.cargando,
    required this.alCambiarCeremonia,
    required this.alCompartirReporte,
    required this.alActualizar,
  });

  final Ceremonia? ceremonia;
  final EstadisticasAcceso? estadisticas;
  final bool cargando;
  final VoidCallback alCambiarCeremonia;
  final VoidCallback alCompartirReporte;
  final VoidCallback alActualizar;

  @override
  Widget build(BuildContext context) {
    final formatterFecha = DateFormat('dd/MM/yyyy', 'es_AR');
    final presentes = estadisticas?.presentes ?? 0;
    final total = estadisticas?.totalInvitados ?? 0;
    final egresados = estadisticas?.totalEgresados ?? 0;
    final ausentes = estadisticas?.ausentes ?? 0;
    final porcentaje = estadisticas?.porcentajeAsistencia ??
        (total > 0 ? ((presentes / total) * 100).round() : 0);

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0A1422),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: const Color(0xFF0284C7).withValues(alpha: 0.35),
          width: 1.2,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1F075985),
            blurRadius: 16,
            offset: Offset(0, 6),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF0284C7).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.admin_panel_settings_rounded,
                  color: Color(0xFF38BDF8),
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Supervisión de Ceremonia',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      ceremonia != null
                          ? '${ceremonia!.nombre} · ${formatterFecha.format(ceremonia!.fecha)}'
                          : 'Cargando datos de ceremonia...',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.65),
                        fontSize: 11.5,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(
                  Icons.refresh,
                  color: Color(0xFF7DD3FC),
                  size: 18,
                ),
                tooltip: 'Actualizar aforo',
                onPressed: cargando ? null : alActualizar,
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(color: Colors.white12, height: 1),
          const SizedBox(height: 14),
          if (cargando)
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Color(0xFF38BDF8),
                ),
              ),
            )
          else ...[
            Row(
              children: [
                Expanded(
                  child: _CajaMetricaAdmin(
                    etiqueta: 'ACREDITADOS',
                    valor: '$presentes',
                    subtitulo: 'de $total esperados',
                    color: const Color(0xFF38BDF8),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _CajaMetricaAdmin(
                    etiqueta: 'AFORO OCUPADO',
                    valor: '$porcentaje%',
                    subtitulo: 'ingreso registrado',
                    color: const Color(0xFF34D399),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _CajaMetricaAdmin(
                    etiqueta: 'EGRESADOS',
                    valor: '$egresados',
                    subtitulo: 'titulados en padrón',
                    color: const Color(0xFFA78BFA),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _CajaMetricaAdmin(
                    etiqueta: 'PENDIENTES',
                    valor: '$ausentes',
                    subtitulo: 'aún no acreditados',
                    color: const Color(0xFFFBBF24),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: total > 0 ? (presentes / total).clamp(0.0, 1.0) : 0.0,
                minHeight: 6,
                backgroundColor: Colors.white10,
                valueColor: const AlwaysStoppedAnimation<Color>(
                  Color(0xFF38BDF8),
                ),
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: alCambiarCeremonia,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: const BorderSide(color: Colors.white24),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    icon: const Icon(Icons.swap_horiz, size: 16),
                    label: const Text(
                      'Cambiar Ceremonia',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: alCompartirReporte,
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF0284C7),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    icon: const Icon(Icons.copy_rounded, size: 16),
                    label: const Text(
                      'Copiar Reporte',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _CajaMetricaAdmin extends StatelessWidget {
  const _CajaMetricaAdmin({
    required this.etiqueta,
    required this.valor,
    required this.subtitulo,
    required this.color,
  });

  final String etiqueta;
  final String valor;
  final String subtitulo;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF07111E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            etiqueta,
            style: TextStyle(
              color: color,
              fontSize: 9.5,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            valor,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 19,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 1),
          Text(
            subtitulo,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.5),
              fontSize: 10.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _ModalEscanerLoginQR extends StatefulWidget {
  const _ModalEscanerLoginQR();

  @override
  State<_ModalEscanerLoginQR> createState() => _ModalEscanerLoginQRState();
}

class _ModalEscanerLoginQRState extends State<_ModalEscanerLoginQR> {
  final MobileScannerController _controlador = MobileScannerController(
    facing: CameraFacing.back,
    detectionSpeed: DetectionSpeed.noDuplicates,
    formats: const [BarcodeFormat.qrCode],
  );
  bool _linterna = false;
  bool _detectado = false;

  @override
  void dispose() {
    _controlador.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture captura) {
    if (_detectado) return;
    for (final barcode in captura.barcodes) {
      final valor = barcode.rawValue;
      if (valor != null && valor.trim().isNotEmpty) {
        _detectado = true;
        Navigator.of(context).pop(valor.trim());
        break;
      }
    }
  }

  Future<void> _alternarLinterna() async {
    try {
      await _controlador.toggleTorch();
      if (mounted) {
        setState(() => _linterna = !_linterna);
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.72,
      decoration: const BoxDecoration(
        color: Color(0xFF0F172A),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          Container(
            margin: const EdgeInsets.only(top: 10, bottom: 8),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'Escanear QR de Acceso',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Apuntá al código de operador o administrativo',
                        style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: _alternarLinterna,
                  icon: Icon(
                    _linterna ? Icons.flash_on : Icons.flash_off,
                    color: _linterna ? const Color(0xFFF59E0B) : Colors.white70,
                  ),
                  tooltip: 'Linterna',
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close, color: Colors.white70),
                  tooltip: 'Cerrar',
                ),
              ],
            ),
          ),
          const Divider(color: Colors.white12, height: 1),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    MobileScanner(
                      controller: _controlador,
                      onDetect: _onDetect,
                    ),
                    Container(
                      width: 230,
                      height: 230,
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: const Color(0xFF38BDF8),
                          width: 2.5,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF38BDF8).withValues(
                              alpha: 0.25,
                            ),
                            blurRadius: 16,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Text(
              'Enfocá el código QR generado en el panel web de SiGIC',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFF64748B),
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

