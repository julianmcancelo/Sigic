import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../modelos/ceremonia.dart';
import '../../modelos/ceremonia_autorizada.dart';
import '../../modelos/estadisticas_acceso.dart';
import '../../modelos/resultado_escaneo.dart';
import '../../modelos/usuario_sesion.dart';
import '../../nucleo/tema/tema_sigic.dart';
import '../../servicios/servicio_api.dart';
import '../../widgets/panel_tarjeta.dart';

class PestanaEscaner extends StatefulWidget {
  const PestanaEscaner({
    super.key,
    required this.servicioApi,
    required this.revisionSesion,
    this.mensajeShorebird,
  });

  final ServicioApi servicioApi;
  final int revisionSesion;
  final String? mensajeShorebird;

  @override
  State<PestanaEscaner> createState() => _PestanaEscanerState();
}

class _PestanaEscanerState extends State<PestanaEscaner> {
  UsuarioSesion? _usuario;
  Ceremonia? _ceremonia;
  List<CeremoniaAutorizada> _ceremoniasAutorizadas = const [];
  EstadisticasAcceso? _estadisticas;
  String? _token;
  String? _error;
  String _mensajeSesion = 'Comprobando credenciales...';
  EstadoSesion _estadoSesion = EstadoSesion.comprobando;
  bool _cargando = true;
  bool _cargandoEscaneo = false;
  bool _mostrandoCamara = false;
  bool _escaneoBloqueado = false;
  ResultadoEscaneo? _resultado;
  DateTime? _ultimaActualizacion;
  Timer? _relojActualizacion;
  final TextEditingController _controladorCodigoManual =
      TextEditingController();

  final MobileScannerController _controladorCamara = MobileScannerController(
    facing: CameraFacing.back,
    detectionSpeed: DetectionSpeed.noDuplicates,
    formats: const [BarcodeFormat.qrCode],
  );

  @override
  void initState() {
    super.initState();
    _cargarPantalla();
    _relojActualizacion = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void didUpdateWidget(covariant PestanaEscaner oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.revisionSesion != widget.revisionSesion) {
      _cargarPantalla();
    }
  }

  @override
  void dispose() {
    _relojActualizacion?.cancel();
    _controladorCodigoManual.dispose();
    _controladorCamara.dispose();
    super.dispose();
  }

  String get _textoUltimaActualizacion {
    final ultima = _ultimaActualizacion;
    if (ultima == null) return '';
    final segundos = DateTime.now().difference(ultima).inSeconds;
    if (segundos < 2) return 'actualizado ahora mismo';
    if (segundos < 60) return 'actualizado hace $segundos s';
    final minutos = segundos ~/ 60;
    return 'actualizado hace $minutos min';
  }

  Future<void> _cargarPantalla() async {
    setState(() {
      _cargando = true;
      _error = null;
      _estadoSesion = EstadoSesion.comprobando;
      _mensajeSesion = 'Comprobando credenciales...';
    });

    try {
      final token = await widget.servicioApi.obtenerTokenGuardado();
      final usuario = await widget.servicioApi.obtenerUsuarioGuardado();

      Ceremonia? ceremonia;
      List<CeremoniaAutorizada> ceremoniasAutorizadas = const [];
      EstadisticasAcceso? estadisticas;
      UsuarioSesion? usuarioValidado = usuario;
      EstadoSesion estadoSesion = EstadoSesion.invitado;
      String mensajeSesion = 'Sin sesion de porteria';

      if (token != null) {
        try {
          usuarioValidado = await widget.servicioApi.obtenerSesionActual();
          estadoSesion = EstadoSesion.autenticado;
          mensajeSesion = 'Sesion verificada y protegida';
          ceremonia = await widget.servicioApi.obtenerCeremoniaActiva();
          ceremoniasAutorizadas = await widget.servicioApi
              .obtenerCeremoniasAutorizadas();
          estadisticas = await widget.servicioApi.obtenerEstadisticas();
        } catch (error) {
          if (usuario != null) {
            estadoSesion = EstadoSesion.sinConexion;
            mensajeSesion = 'Sin conexion. Sesion pendiente de validar';
          } else {
            estadoSesion = EstadoSesion.expirada;
            mensajeSesion = 'La sesion vencio. Inicia sesion nuevamente';
          }
        }
      }

      if (!mounted) {
        return;
      }

      setState(() {
        _token = token;
        _usuario = usuarioValidado;
        _ceremonia = ceremonia;
        _ceremoniasAutorizadas = ceremoniasAutorizadas;
        _estadisticas = estadisticas;
        _estadoSesion = estadoSesion;
        _mensajeSesion = mensajeSesion;
        _cargando = false;
        _mostrandoCamara = !kIsWeb && token == null;
        _ultimaActualizacion = DateTime.now();
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.toString();
        _estadoSesion = EstadoSesion.sinConexion;
        _mensajeSesion = 'No fue posible verificar la aplicacion';
        _cargando = false;
      });
    }
  }

  Future<void> _procesarCodigo(String codigo) async {
    if (_escaneoBloqueado || _cargandoEscaneo || _resultado != null) {
      return;
    }

    setState(() {
      _escaneoBloqueado = true;
      _cargandoEscaneo = true;
      _error = null;
    });

    try {
      if (codigo.startsWith('sigic-config:')) {
        final url = codigo.substring('sigic-config:'.length).trim();
        if (widget.servicioApi.esDireccionLocal(url)) {
          throw Exception(
            'El QR contiene localhost. Genera otro QR usando la IP de la computadora.',
          );
        }
        await widget.servicioApi.guardarApiUrl(url);
        await _mostrarMensaje(
          'Configuracion',
          'Servidor configurado correctamente.',
        );
        await _cargarPantalla();
        _cerrarCamara();
        return;
      }

      if (codigo.startsWith('sigic-login:')) {
        final token = codigo.substring('sigic-login:'.length).trim();
        await widget.servicioApi.iniciarSesionConToken(token);
        await _mostrarMensaje(
          'Acceso confirmado',
          'La sesion se inicio correctamente.',
        );
        await _cargarPantalla();
        _cerrarCamara();
        return;
      }

      final resultado = await widget.servicioApi.buscarInvitadoOGrupo(codigo);
      if (!mounted) {
        return;
      }
      setState(() {
        _resultado = resultado;
      });
    } catch (error) {
      await _mostrarMensaje(
        'Error',
        error.toString().replaceFirst('Exception: ', ''),
      );
    } finally {
      if (mounted) {
        setState(() {
          _cargandoEscaneo = false;
          _escaneoBloqueado = false;
        });
      }
    }
  }

  Future<void> _acreditarInvitado(String id) async {
    setState(() {
      _cargandoEscaneo = true;
    });
    try {
      final respuesta = await widget.servicioApi.acreditarInvitado(id);
      await _cargarPantalla();
      if (!mounted) {
        return;
      }
      final actualizado = _resultado?.marcarInvitadoPresente(id);
      setState(() {
        _resultado = actualizado;
      });
      final yaAcreditado = respuesta['yaAcreditado'] == true;
      final mensaje = (respuesta['mensaje'] ?? 'La acreditacion se realizo con exito.')
          .toString();

      if (actualizado?.tipo == TipoResultadoEscaneo.individual) {
        // Escaneo continuo: mostramos confirmacion breve y volvemos a la
        // camara automaticamente, sin salir de la pantalla de escaneo.
        if (mounted) {
          ScaffoldMessenger.of(context)
            ..hideCurrentSnackBar()
            ..showSnackBar(
              SnackBar(
                content: Text(
                  yaAcreditado ? 'Invitado ya acreditado' : mensaje,
                ),
                backgroundColor: yaAcreditado
                    ? const Color(0xFFB4530A)
                    : TemaSigic.exito,
              ),
            );
        }
        await Future.delayed(const Duration(milliseconds: 700));
        if (mounted && _resultado?.tipo == TipoResultadoEscaneo.individual) {
          setState(() {
            _resultado = null;
          });
        }
      } else {
        await _mostrarMensaje(
          yaAcreditado ? 'Invitado ya acreditado' : 'Ingreso registrado',
          mensaje,
        );
      }
    } catch (error) {
      await _mostrarMensaje(
        'Error',
        error.toString().replaceFirst('Exception: ', ''),
      );
    } finally {
      if (mounted) {
        setState(() {
          _cargandoEscaneo = false;
        });
      }
    }
  }

  Future<void> _acreditarPendientes() async {
    final resultado = _resultado;
    if (resultado == null || resultado.tipo != TipoResultadoEscaneo.grupal) {
      return;
    }
    final ids = resultado.invitadosGrupo
        .where((item) => !item.presente)
        .map((item) => item.id)
        .toList();
    if (ids.isEmpty) {
      await _mostrarMensaje('Informacion', 'No hay invitados pendientes.');
      return;
    }
    setState(() {
      _cargandoEscaneo = true;
    });
    try {
      final respuesta = await widget.servicioApi.acreditarInvitadosMasivo(ids);
      await _cargarPantalla();
      if (!mounted) {
        return;
      }
      var actualizado = resultado;
      for (final id in ids) {
        actualizado = actualizado.marcarInvitadoPresente(id);
      }
      setState(() {
        _resultado = actualizado;
      });
      final acreditados =
          int.tryParse('${respuesta['cantidad_ingresos']}') ?? ids.length;
      final omitidos = int.tryParse('${respuesta['cantidad_omitidos']}') ?? 0;
      final detalleOmitidos = omitidos > 0
          ? ' $omitidos ya estaban acreditados.'
          : '';
      if (mounted) {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            SnackBar(
              content: Text('$acreditados acreditados.$detalleOmitidos'),
              backgroundColor: TemaSigic.exito,
            ),
          );
      }
    } catch (error) {
      await _mostrarMensaje(
        'Error',
        error.toString().replaceFirst('Exception: ', ''),
      );
    } finally {
      if (mounted) {
        setState(() {
          _cargandoEscaneo = false;
        });
      }
    }
  }

  void _abrirCamara() {
    setState(() {
      _resultado = null;
      _controladorCodigoManual.clear();
      _mostrandoCamara = true;
    });
  }

  void _cerrarCamara() {
    if (!mounted) {
      return;
    }
    setState(() {
      _mostrandoCamara = false;
      _resultado = null;
    });
  }

  void _cerrarTarjetaFlotante() {
    setState(() {
      _resultado = null;
    });
  }

  Future<void> _mostrarMensaje(String titulo, String mensaje) async {
    if (!mounted) {
      return;
    }
    await showDialog<void>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(titulo),
          content: Text(mensaje),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Aceptar'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_cargando) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      body: SafeArea(
        top: !_mostrandoCamara,
        bottom: false,
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 250),
          child: _mostrandoCamara
              ? _construirVistaCamaraConTarjeta(context)
              : _construirVistaInicio(context),
        ),
      ),
    );
  }

  // ─── INICIO ────────────────────────────────────────────────────

  Widget _construirVistaInicio(BuildContext context) {
    final tema = Theme.of(context);
    final formatterFecha = DateFormat('dd MMM yyyy - HH:mm', 'es_AR');
    final colorSesion = switch (_estadoSesion) {
      EstadoSesion.autenticado => TemaSigic.exito,
      EstadoSesion.comprobando => TemaSigic.azulBrillante,
      EstadoSesion.sinConexion => const Color(0xFFF59E0B),
      EstadoSesion.expirada => TemaSigic.error,
      EstadoSesion.invitado => TemaSigic.error,
    };

    return RefreshIndicator(
      key: const ValueKey('inicio'),
      onRefresh: _cargarPantalla,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
        children: [
          if (widget.mensajeShorebird != null)
            PanelTarjeta(
              colorBorde: TemaSigic.azulBrillante.withValues(alpha: 0.25),
              contenido: ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(
                  Icons.system_update_alt,
                  color: TemaSigic.azulPrincipal,
                ),
                title: const Text('Shorebird'),
                subtitle: Text(widget.mensajeShorebird!),
              ),
            ),

          // Cabecera: logo + saludo + estado de sesion + rol
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(13),
                  border: Border.all(color: const Color(0xFFE2EAF0)),
                  image: const DecorationImage(
                    image: AssetImage('assets/imagenes/logo-glow.png'),
                    fit: BoxFit.contain,
                  ),
                ),
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _usuario == null
                          ? 'Acceso de porteria'
                          : 'Hola, ${_usuario!.nombre.split(' ').first}',
                      style: tema.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.4,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Container(
                          width: 7,
                          height: 7,
                          margin: const EdgeInsets.only(right: 6),
                          decoration: BoxDecoration(
                            color: colorSesion,
                            shape: BoxShape.circle,
                          ),
                        ),
                        Flexible(
                          child: Text(
                            _mensajeSesion,
                            style: tema.textTheme.bodySmall?.copyWith(
                              color: const Color(0xFF4A6275),
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (_usuario != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: TemaSigic.azulPrincipal.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _usuario!.rol,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 10.5,
                      letterSpacing: 0.6,
                      color: TemaSigic.azulPrincipal,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 14),

          // Tarjeta principal: ceremonia activa con contador en vivo
          if (_ceremonia != null && _estadisticas != null)
            _TarjetaCeremoniaActiva(
              ceremonia: _ceremonia!,
              estadisticas: _estadisticas!,
              formatterFecha: formatterFecha,
              textoActualizacion: _textoUltimaActualizacion,
            )
          else if (_ceremonia != null)
            PanelTarjeta(
              contenido: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Ceremonia activa',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _ceremonia!.nombre,
                    style: tema.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(formatterFecha.format(_ceremonia!.fecha)),
                  const SizedBox(height: 4),
                  Text(_ceremonia!.lugar),
                ],
              ),
            ),

          if (_estadisticas != null) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _TarjetaEstadistica(
                    valor: '${_estadisticas!.ausentes}',
                    etiqueta: 'PENDIENTES',
                    color: const Color(0xFFB4530A),
                  ),
                ),
                const SizedBox(width: 9),
                Expanded(
                  child: _TarjetaEstadistica(
                    valor: '${_estadisticas!.totalEgresados}',
                    etiqueta: 'EGRESADOS',
                    color: TemaSigic.azulPrincipal,
                  ),
                ),
                const SizedBox(width: 9),
                Expanded(
                  child: _TarjetaEstadistica(
                    valor: '${_estadisticas!.porcentajeAsistencia}%',
                    etiqueta: 'ASISTENCIA',
                    color: const Color(0xFF0A7F5F),
                  ),
                ),
              ],
            ),
          ],

          const SizedBox(height: 12),

          // Boton principal: abrir escaner
          Material(
            color: const Color(0xFF0A1422),
            borderRadius: BorderRadius.circular(22),
            child: InkWell(
              onTap: _abrirCamara,
              borderRadius: BorderRadius.circular(22),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                child: Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: TemaSigic.azulBrillante.withValues(
                          alpha: 0.18,
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(
                        Icons.qr_code_scanner,
                        color: Color(0xFF7DD3FC),
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _token == null
                                ? 'Escanear QR de acceso'
                                : 'Escanear QR',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              fontSize: 18,
                              letterSpacing: -0.3,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _token == null
                                ? 'Configuracion o inicio de sesion'
                                : 'Invitado individual o grupo completo',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.7),
                              fontSize: 12.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      Icons.chevron_right,
                      color: Colors.white.withValues(alpha: 0.55),
                      size: 26,
                    ),
                  ],
                ),
              ),
            ),
          ),

          if (_ceremoniasAutorizadas.isNotEmpty) ...[
            const SizedBox(height: 18),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Ceremonias habilitadas',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5),
                  ),
                  Text(
                    '${_ceremoniasAutorizadas.length}',
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF5C7386),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            ..._ceremoniasAutorizadas.map(
              (ceremoniaAutorizada) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: ceremoniaAutorizada.activa
                          ? TemaSigic.azulPrincipal.withValues(alpha: 0.28)
                          : const Color(0xFFE2EAF0),
                    ),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 13,
                      vertical: 2,
                    ),
                    leading: Icon(
                      Icons.school,
                      color: ceremoniaAutorizada.activa
                          ? TemaSigic.azulPrincipal
                          : const Color(0xFF8496A6),
                    ),
                    title: Text(
                      ceremoniaAutorizada.nombre,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    subtitle: Text(
                      '${ceremoniaAutorizada.fecha == null ? 'Fecha a confirmar' : DateFormat('dd/MM/yyyy', 'es_AR').format(ceremoniaAutorizada.fecha!)} · ${ceremoniaAutorizada.lugar}',
                    ),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 9,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: ceremoniaAutorizada.activa
                            ? const Color(0xFF10B981).withValues(alpha: 0.13)
                            : const Color(0xFFEEF3F7),
                        borderRadius: BorderRadius.circular(7),
                      ),
                      child: Text(
                        ceremoniaAutorizada.activa ? 'ACTIVA' : 'HABILITADA',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 10.5,
                          color: ceremoniaAutorizada.activa
                              ? const Color(0xFF0A7F5F)
                              : const Color(0xFF5C7386),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],

          if (_error != null) ...[
            const SizedBox(height: 10),
            PanelTarjeta(
              colorBorde: TemaSigic.error.withValues(alpha: 0.28),
              contenido: Text(
                _error!,
                style: const TextStyle(color: TemaSigic.error),
              ),
            ),
          ],
          if (_estadoSesion == EstadoSesion.sinConexion ||
              _estadoSesion == EstadoSesion.expirada) ...[
            const SizedBox(height: 10),
            PanelTarjeta(
              colorBorde:
                  (_estadoSesion == EstadoSesion.sinConexion
                          ? const Color(0xFFF59E0B)
                          : TemaSigic.error)
                      .withValues(alpha: 0.28),
              contenido: Text(
                _estadoSesion == EstadoSesion.sinConexion
                    ? 'La app conserva la sesion local, pero no pudo revalidarla con el servidor.'
                    : 'La sesion actual ya no es valida. Volve a iniciar sesion desde Ajustes o con un QR de acceso.',
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ─── CAMARA + TARJETA FLOTANTE ─────────────────────────────────

  Widget _construirVistaCamaraConTarjeta(BuildContext context) {
    return Stack(
      key: const ValueKey('camara'),
      children: [
        Positioned.fill(
          child: kIsWeb
              ? _construirVistaEscaneoWeb(context)
              : _construirVistaCamara(context),
        ),
        if (_resultado != null)
          Positioned.fill(
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () {},
              child: Align(
                alignment: Alignment.bottomCenter,
                child: _construirTarjetaFlotante(context, _resultado!),
              ),
            ),
          ),
      ],
    );
  }

  Widget _construirTarjetaFlotante(
    BuildContext context,
    ResultadoEscaneo resultado,
  ) {
    return ConstrainedBox(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.68,
      ),
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.only(top: 40),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(28),
            topRight: Radius.circular(28),
          ),
          boxShadow: [
            BoxShadow(
              color: Color(0x59000000),
              blurRadius: 30,
              offset: Offset(0, -12),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(18, 10, 18, 18),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 38,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFD5E0E9),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                Flexible(
                  child: SingleChildScrollView(
                    child:
                        resultado.tipo == TipoResultadoEscaneo.individual &&
                            resultado.invitado != null
                        ? _TarjetaFlotanteInvitado(
                            invitado: resultado.invitado!,
                            egresadoNombre: resultado.egresadoNombre ?? '',
                            cargando: _cargandoEscaneo,
                            alAcreditar: () =>
                                _acreditarInvitado(resultado.invitado!.id),
                            alCerrar: _cerrarTarjetaFlotante,
                          )
                        : resultado.tipo == TipoResultadoEscaneo.grupal &&
                              resultado.grupoEgresado != null
                        ? _TarjetaFlotanteGrupo(
                            resultado: resultado,
                            cargando: _cargandoEscaneo,
                            alAcreditarInvitado: _acreditarInvitado,
                            alAcreditarPendientes: _acreditarPendientes,
                            alCerrar: _cerrarTarjetaFlotante,
                          )
                        : const SizedBox.shrink(),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _construirVistaCamara(BuildContext context) {
    final tema = Theme.of(context);
    final estadisticas = _estadisticas;
    final enVivo = _token != null && _ceremonia != null;

    return Stack(
      children: [
        Positioned.fill(
          child: MobileScanner(
            controller: _controladorCamara,
            onDetect: (captura) {
              final codigo = captura.barcodes.isEmpty
                  ? null
                  : captura.barcodes.first.rawValue;
              if (codigo != null) {
                _procesarCodigo(codigo);
              }
            },
          ),
        ),
        Positioned.fill(
          child: DecoratedBox(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xC70A1422),
                  Color(0x4D101C2D),
                  Color(0x99071019),
                ],
              ),
            ),
            child: SafeArea(
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        IconButton.filled(
                          style: IconButton.styleFrom(
                            backgroundColor: Colors.white.withValues(
                              alpha: 0.14,
                            ),
                            foregroundColor: Colors.white,
                          ),
                          onPressed: _cerrarCamara,
                          icon: const Icon(Icons.arrow_back_rounded),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                enVivo
                                    ? 'Acreditando en vivo'
                                    : _token == null
                                    ? 'Escanear QR de acceso'
                                    : 'Escanear acreditacion',
                                style: tema.textTheme.titleMedium?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                enVivo
                                    ? _ceremonia!.nombre
                                    : _token == null
                                    ? 'Apunta al QR de configuracion o inicio de sesion.'
                                    : 'Alinea el codigo dentro del marco para acreditar rapido.',
                                style: tema.textTheme.bodySmall?.copyWith(
                                  color: Colors.white.withValues(alpha: 0.8),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        if (enVivo && estadisticas != null) ...[
                          const SizedBox(width: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 11,
                              vertical: 7,
                            ),
                            decoration: BoxDecoration(
                              color: TemaSigic.exito.withValues(alpha: 0.22),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: TemaSigic.exito.withValues(alpha: 0.45),
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 7,
                                  height: 7,
                                  margin: const EdgeInsets.only(right: 6),
                                  decoration: const BoxDecoration(
                                    color: TemaSigic.exito,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                Text(
                                  '${estadisticas.presentes}/${estadisticas.totalInvitados}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const Spacer(),
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                        width: 292,
                        height: 292,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(40),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.16),
                            width: 1.4,
                          ),
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x66000000),
                              blurRadius: 28,
                              spreadRadius: 4,
                            ),
                          ],
                        ),
                      ),
                      SizedBox(
                        width: 274,
                        height: 274,
                        child: CustomPaint(painter: _MarcoEscanerPainter()),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 28),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 18,
                      vertical: 14,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.12),
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: TemaSigic.azulBrillante.withValues(
                              alpha: 0.22,
                            ),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Icon(
                            enVivo ? Icons.autorenew : Icons.center_focus_strong,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            enVivo
                                ? 'La camara sigue activa: cada escaneo suma sin salir de esta pantalla.'
                                : _token == null
                                ? 'Este escaner acepta QR de configuracion y de acceso seguro.'
                                : 'El sistema reconocera invitados individuales o grupos completos.',
                            style: tema.textTheme.bodyMedium?.copyWith(
                              color: Colors.white,
                              height: 1.3,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),
                  if (_cargandoEscaneo && _resultado == null)
                    const CircularProgressIndicator(color: Colors.white),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _construirVistaEscaneoWeb(BuildContext context) {
    final tema = Theme.of(context);
    return Container(
      color: TemaSigic.fondoClaro,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        children: [
          PanelTarjeta(
            colorBorde: TemaSigic.azulBrillante.withValues(alpha: 0.24),
            contenido: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    IconButton.filledTonal(
                      onPressed: _cerrarCamara,
                      icon: const Icon(Icons.close),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Escaneo desde navegador',
                        style: tema.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Theme.of(
                      context,
                    ).colorScheme.surfaceContainerHighest.withValues(
                      alpha: 0.35,
                    ),
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: Column(
                    children: [
                      const Icon(
                        Icons.qr_code_2,
                        size: 72,
                        color: TemaSigic.azulPrincipal,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'En web la camara puede no iniciar segun el navegador o los permisos. Para no dejar la pantalla gris, esta vista permite procesar el codigo manualmente.',
                        style: tema.textTheme.bodyMedium,
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                TextField(
                  controller: _controladorCodigoManual,
                  minLines: 2,
                  maxLines: 4,
                  textInputAction: TextInputAction.done,
                  decoration: const InputDecoration(
                    labelText: 'Codigo QR o texto del escaneo',
                    hintText:
                        'Pega aqui sigic-config:, sigic-login: o el codigo del invitado',
                    alignLabelWithHint: true,
                  ),
                ),
                const SizedBox(height: 14),
                FilledButton.icon(
                  onPressed: _cargandoEscaneo
                      ? null
                      : () {
                          final codigo = _controladorCodigoManual.text.trim();
                          if (codigo.isEmpty) {
                            _mostrarMensaje(
                              'Falta un codigo',
                              'Ingresa o pega un codigo antes de continuar.',
                            );
                            return;
                          }
                          _procesarCodigo(codigo);
                        },
                  icon: const Icon(Icons.play_arrow),
                  label: Text(
                    _cargandoEscaneo ? 'Procesando...' : 'Procesar codigo',
                  ),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    backgroundColor: TemaSigic.azulPrincipal,
                    foregroundColor: Colors.white,
                  ),
                ),
                const SizedBox(height: 10),
                OutlinedButton.icon(
                  onPressed: _cargandoEscaneo ? null : _cargarPantalla,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Actualizar estado'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

enum EstadoSesion { comprobando, autenticado, invitado, sinConexion, expirada }

class _MarcoEscanerPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    const colorEsquina = Color(0xFF7DD3FC);
    final pintura = Paint()
      ..color = colorEsquina
      ..style = PaintingStyle.stroke
      ..strokeWidth = 5
      ..strokeCap = StrokeCap.round;

    const largoEsquina = 34.0;
    const radio = 26.0;
    final rect = Offset.zero & size;

    final ruta = Path()
      ..moveTo(rect.left, rect.top + largoEsquina)
      ..lineTo(rect.left, rect.top + radio)
      ..quadraticBezierTo(rect.left, rect.top, rect.left + radio, rect.top)
      ..lineTo(rect.left + largoEsquina, rect.top)
      ..moveTo(rect.right - largoEsquina, rect.top)
      ..lineTo(rect.right - radio, rect.top)
      ..quadraticBezierTo(rect.right, rect.top, rect.right, rect.top + radio)
      ..lineTo(rect.right, rect.top + largoEsquina)
      ..moveTo(rect.right, rect.bottom - largoEsquina)
      ..lineTo(rect.right, rect.bottom - radio)
      ..quadraticBezierTo(
        rect.right,
        rect.bottom,
        rect.right - radio,
        rect.bottom,
      )
      ..lineTo(rect.right - largoEsquina, rect.bottom)
      ..moveTo(rect.left + largoEsquina, rect.bottom)
      ..lineTo(rect.left + radio, rect.bottom)
      ..quadraticBezierTo(
        rect.left,
        rect.bottom,
        rect.left,
        rect.bottom - radio,
      )
      ..lineTo(rect.left, rect.bottom - largoEsquina);

    canvas.drawPath(ruta, pintura);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Tarjeta hero de la ceremonia activa (pantalla de inicio, direccion 2d).
class _TarjetaCeremoniaActiva extends StatelessWidget {
  const _TarjetaCeremoniaActiva({
    required this.ceremonia,
    required this.estadisticas,
    required this.formatterFecha,
    required this.textoActualizacion,
  });

  final Ceremonia ceremonia;
  final EstadisticasAcceso estadisticas;
  final DateFormat formatterFecha;
  final String textoActualizacion;

  @override
  Widget build(BuildContext context) {
    final total = estadisticas.totalInvitados;
    final porcentaje = total > 0
        ? (estadisticas.presentes / total).clamp(0.0, 1.0)
        : 0.0;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: TemaSigic.azulPrincipal,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 6,
                height: 6,
                margin: const EdgeInsets.only(right: 7),
                decoration: const BoxDecoration(
                  color: Color(0xFF7DD3FC),
                  shape: BoxShape.circle,
                ),
              ),
              const Text(
                'CEREMONIA ACTIVA',
                style: TextStyle(
                  color: Colors.white70,
                  fontWeight: FontWeight.w800,
                  fontSize: 10.5,
                  letterSpacing: 1.1,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            ceremonia.nombre,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
              fontSize: 21,
              letterSpacing: -0.4,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${formatterFecha.format(ceremonia.fecha)} · ${ceremonia.lugar}',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.82),
              fontSize: 12.5,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text.rich(
                TextSpan(
                  children: [
                    TextSpan(
                      text: '${estadisticas.presentes}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 32,
                        letterSpacing: -1,
                      ),
                    ),
                    TextSpan(
                      text: ' / $total',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.7),
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              Text(
                '${estadisticas.porcentajeAsistencia}%',
                style: const TextStyle(
                  color: Color(0xFF7DD3FC),
                  fontWeight: FontWeight.w800,
                  fontFamily: 'monospace',
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: porcentaje,
              minHeight: 8,
              backgroundColor: Colors.white.withValues(alpha: 0.22),
              valueColor: const AlwaysStoppedAnimation(Color(0xFF7DD3FC)),
            ),
          ),
          const SizedBox(height: 7),
          Text(
            'Acreditados en sala'
            '${textoActualizacion.isEmpty ? '' : ' · $textoActualizacion'}',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.72),
              fontWeight: FontWeight.w600,
              fontSize: 11.5,
            ),
          ),
        ],
      ),
    );
  }
}

/// Mini tarjeta de metrica (fila de 3, pantalla de inicio).
class _TarjetaEstadistica extends StatelessWidget {
  const _TarjetaEstadistica({
    required this.valor,
    required this.etiqueta,
    required this.color,
  });

  final String valor;
  final String etiqueta;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2EAF0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            valor,
            style: TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 22,
              letterSpacing: -0.7,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            etiqueta,
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 10,
              letterSpacing: 0.3,
              color: Color(0xFF5C7386),
            ),
          ),
        ],
      ),
    );
  }
}

/// Tarjeta flotante de invitado individual, se muestra sobre la camara
/// activa (direccion 2a: escaneo continuo).
class _TarjetaFlotanteInvitado extends StatelessWidget {
  const _TarjetaFlotanteInvitado({
    required this.invitado,
    required this.egresadoNombre,
    required this.cargando,
    required this.alAcreditar,
    required this.alCerrar,
  });

  final InvitadoEscaneado invitado;
  final String egresadoNombre;
  final bool cargando;
  final VoidCallback alAcreditar;
  final VoidCallback alCerrar;

  @override
  Widget build(BuildContext context) {
    final puedeAcreditar = !invitado.presente && !cargando;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'INVITADO',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 10.5,
                      letterSpacing: 1,
                      color: Color(0xFF64798C),
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    invitado.nombre,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 22,
                      letterSpacing: -0.4,
                      color: Color(0xFF102A43),
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: TemaSigic.azulBrillante.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(
                invitado.presente ? Icons.check_circle : Icons.how_to_reg,
                color: invitado.presente ? TemaSigic.exito : TemaSigic.azulPrincipal,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 7,
          runSpacing: 7,
          children: [
            _chip('DNI ${invitado.dni}'),
            _chip(invitado.relacion),
            if (invitado.discapacidad)
              _chip('Accesibilidad', color: const Color(0xFFB4530A)),
          ],
        ),
        if (egresadoNombre.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text.rich(
            TextSpan(
              text: 'Egresado: ',
              style: const TextStyle(color: Color(0xFF4A6275), fontSize: 13),
              children: [
                TextSpan(
                  text: egresadoNombre,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF102A43),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 16),
        SizedBox(
          height: 54,
          child: FilledButton.icon(
            onPressed: puedeAcreditar ? alAcreditar : null,
            icon: cargando
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(Icons.check_circle),
            label: Text(
              invitado.presente ? 'Ya acreditado' : 'Registrar ingreso',
            ),
            style: FilledButton.styleFrom(
              backgroundColor: TemaSigic.exito,
              disabledBackgroundColor: invitado.presente
                  ? TemaSigic.exito.withValues(alpha: 0.55)
                  : null,
            ),
          ),
        ),
        const SizedBox(height: 10),
        Center(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.autorenew, size: 15, color: Color(0xFF64798C)),
              const SizedBox(width: 6),
              const Text(
                'La camara sigue activa · proximo escaneo automatico',
                style: TextStyle(fontSize: 11.5, color: Color(0xFF64798C)),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
        Align(
          alignment: Alignment.center,
          child: TextButton(
            onPressed: alCerrar,
            child: const Text('Cerrar'),
          ),
        ),
      ],
    );
  }

  Widget _chip(String texto, {Color? color}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color != null
            ? color.withValues(alpha: 0.13)
            : const Color(0xFFEEF3F7),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        texto,
        style: TextStyle(
          fontWeight: FontWeight.w700,
          fontSize: 12,
          color: color ?? const Color(0xFF102A43),
        ),
      ),
    );
  }
}

/// Tarjeta flotante de grupo, se muestra sobre la camara activa.
class _TarjetaFlotanteGrupo extends StatelessWidget {
  const _TarjetaFlotanteGrupo({
    required this.resultado,
    required this.cargando,
    required this.alAcreditarInvitado,
    required this.alAcreditarPendientes,
    required this.alCerrar,
  });

  final ResultadoEscaneo resultado;
  final bool cargando;
  final ValueChanged<String> alAcreditarInvitado;
  final VoidCallback alAcreditarPendientes;
  final VoidCallback alCerrar;

  @override
  Widget build(BuildContext context) {
    final grupo = resultado.grupoEgresado!;
    final invitadosPendientes = resultado.invitadosGrupo
        .where((item) => !item.presente)
        .length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: TemaSigic.azulPrincipal,
            borderRadius: BorderRadius.circular(18),
          ),
          child: Row(
            children: [
              Container(
                width: 46,
                height: 46,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Text(
                  grupo.nombre.isEmpty ? '?' : grupo.nombre[0].toUpperCase(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 17,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      grupo.nombre,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 17,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Legajo ${grupo.legajo} · ${grupo.carrera.isEmpty ? 'N/C' : grupo.carrera}',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.78),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              if (grupo.asientoId.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 7,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: [
                      const Text(
                        'BUTACA',
                        style: TextStyle(
                          color: Colors.white70,
                          fontWeight: FontWeight.w700,
                          fontSize: 8.5,
                        ),
                      ),
                      Text(
                        grupo.asientoId,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontFamily: 'monospace',
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Invitados en grupo',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5),
            ),
            TextButton(onPressed: alCerrar, child: const Text('Cerrar')),
          ],
        ),
        const SizedBox(height: 6),
        ...resultado.invitadosGrupo.map(
          (invitado) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: invitado.presente
                    ? const Color(0xFFEDF2F6)
                    : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: invitado.presente
                      ? const Color(0xFFE2EAF0)
                      : TemaSigic.azulPrincipal,
                  width: invitado.presente ? 1 : 1.4,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            invitado.nombre,
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            'DNI ${invitado.dni} · ${invitado.relacion}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF5C7386),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    invitado.presente
                        ? const Icon(Icons.check_circle, color: TemaSigic.exito)
                        : SizedBox(
                            height: 38,
                            child: FilledButton(
                              onPressed: cargando
                                  ? null
                                  : () => alAcreditarInvitado(invitado.id),
                              style: FilledButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                ),
                              ),
                              child: const Text('Ingresar'),
                            ),
                          ),
                  ],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 6),
        SizedBox(
          height: 52,
          child: FilledButton.icon(
            onPressed: cargando || invitadosPendientes == 0
                ? null
                : alAcreditarPendientes,
            icon: const Icon(Icons.groups_2),
            label: Text('Acreditar $invitadosPendientes pendientes'),
          ),
        ),
      ],
    );
  }
}
