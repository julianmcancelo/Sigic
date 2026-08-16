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
  final TextEditingController _controladorCodigoManual = TextEditingController();

  final MobileScannerController _controladorCamara = MobileScannerController(
    facing: CameraFacing.back,
    detectionSpeed: DetectionSpeed.noDuplicates,
    formats: const [BarcodeFormat.qrCode],
  );

  @override
  void initState() {
    super.initState();
    _cargarPantalla();
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
    _controladorCodigoManual.dispose();
    _controladorCamara.dispose();
    super.dispose();
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
          ceremoniasAutorizadas = await widget.servicioApi.obtenerCeremoniasAutorizadas();
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
    if (_escaneoBloqueado || _cargandoEscaneo) {
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
          throw Exception('El QR contiene localhost. Genera otro QR usando la IP de la computadora.');
        }
        await widget.servicioApi.guardarApiUrl(url);
        await _mostrarMensaje('Configuracion', 'Servidor configurado correctamente.');
        await _cargarPantalla();
        _cerrarCamara();
        return;
      }

      if (codigo.startsWith('sigic-login:')) {
        final token = codigo.substring('sigic-login:'.length).trim();
        await widget.servicioApi.iniciarSesionConToken(token);
        await _mostrarMensaje('Acceso confirmado', 'La sesion se inicio correctamente.');
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
        _mostrandoCamara = false;
      });
    } catch (error) {
      await _mostrarMensaje('Error', error.toString().replaceFirst('Exception: ', ''));
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
      await widget.servicioApi.acreditarInvitado(id);
      await _cargarPantalla();
      if (!mounted) {
        return;
      }
      setState(() {
        _resultado = _resultado?.marcarInvitadoPresente(id);
      });
      await _mostrarMensaje('Ingreso registrado', 'La acreditacion se realizo con exito.');
    } catch (error) {
      await _mostrarMensaje('Error', error.toString().replaceFirst('Exception: ', ''));
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
    final ids = resultado.invitadosGrupo.where((item) => !item.presente).map((item) => item.id).toList();
    if (ids.isEmpty) {
      await _mostrarMensaje('Informacion', 'No hay invitados pendientes.');
      return;
    }
    setState(() {
      _cargandoEscaneo = true;
    });
    try {
      await widget.servicioApi.acreditarInvitadosMasivo(ids);
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
      await _mostrarMensaje('Ingreso masivo', 'Se acreditaron ${ids.length} invitados.');
    } catch (error) {
      await _mostrarMensaje('Error', error.toString().replaceFirst('Exception: ', ''));
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
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('SiGIC Accesos'),
      ),
      body: SafeArea(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 250),
          child: _mostrandoCamara
              ? _construirVistaCamara(context)
              : _resultado != null
                  ? _construirVistaResultado(context, _resultado!)
                  : _construirVistaInicio(context),
        ),
      ),
    );
  }

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
      onRefresh: _cargarPantalla,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          if (widget.mensajeShorebird != null)
            PanelTarjeta(
              colorBorde: TemaSigic.azulBrillante.withValues(alpha: 0.25),
              contenido: ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.system_update_alt, color: TemaSigic.azulPrincipal),
                title: const Text('Shorebird'),
                subtitle: Text(widget.mensajeShorebird!),
              ),
            ),
          PanelTarjeta(
            contenido: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _usuario == null ? 'Acceso de porteria' : 'Hola, ${_usuario!.nombre.split(' ').first}',
                        style: tema.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            margin: const EdgeInsets.only(right: 8),
                            decoration: BoxDecoration(color: colorSesion, shape: BoxShape.circle),
                          ),
                          Expanded(
                            child: Text(
                              _mensajeSesion,
                              style: tema.textTheme.bodyMedium,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    image: const DecorationImage(
                      image: AssetImage('assets/imagenes/logo-oficial.png'),
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (_ceremonia != null)
            PanelTarjeta(
              contenido: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Ceremonia activa', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 10),
                  Text(_ceremonia!.nombre, style: tema.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 6),
                  Text(formatterFecha.format(_ceremonia!.fecha)),
                  const SizedBox(height: 4),
                  Text(_ceremonia!.lugar),
                ],
              ),
            ),
          if (_ceremoniasAutorizadas.isNotEmpty)
            PanelTarjeta(
              contenido: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Ceremonias habilitadas', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 10),
                  ..._ceremoniasAutorizadas.map(
                    (ceremoniaAutorizada) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          color: ceremoniaAutorizada.activa
                              ? TemaSigic.azulPrincipal.withValues(alpha: 0.08)
                              : Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.35),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: ceremoniaAutorizada.activa
                                ? TemaSigic.azulPrincipal.withValues(alpha: 0.25)
                                : Colors.transparent,
                          ),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                          leading: Icon(
                            Icons.school,
                            color: ceremoniaAutorizada.activa ? TemaSigic.azulPrincipal : null,
                          ),
                          title: Text(ceremoniaAutorizada.nombre),
                          subtitle: Text(
                            '${ceremoniaAutorizada.fecha == null ? 'Fecha a confirmar' : DateFormat('dd/MM/yyyy', 'es_AR').format(ceremoniaAutorizada.fecha!)} · ${ceremoniaAutorizada.lugar}',
                          ),
                          trailing: ceremoniaAutorizada.activa
                              ? const Chip(label: Text('Activa'))
                              : const Chip(label: Text('Habilitada')),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          if (_estadisticas != null)
            PanelTarjeta(
              contenido: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Acreditados en sala', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 10),
                  Text(
                    '${_estadisticas!.presentes} / ${_estadisticas!.totalInvitados}',
                    style: tema.textTheme.displaySmall?.copyWith(fontWeight: FontWeight.w900),
                  ),
                ],
              ),
            ),
          if (_error != null)
            PanelTarjeta(
              colorBorde: TemaSigic.error.withValues(alpha: 0.28),
              contenido: Text(
                _error!,
                style: const TextStyle(color: TemaSigic.error),
              ),
            ),
          if (_estadoSesion == EstadoSesion.sinConexion || _estadoSesion == EstadoSesion.expirada)
            PanelTarjeta(
              colorBorde: (_estadoSesion == EstadoSesion.sinConexion ? const Color(0xFFF59E0B) : TemaSigic.error)
                  .withValues(alpha: 0.28),
              contenido: Text(
                _estadoSesion == EstadoSesion.sinConexion
                    ? 'La app conserva la sesion local, pero no pudo revalidarla con el servidor.'
                    : 'La sesion actual ya no es valida. Volve a iniciar sesion desde Ajustes o con un QR de acceso.',
              ),
            ),
          const SizedBox(height: 8),
          FilledButton.icon(
            onPressed: _abrirCamara,
            icon: const Icon(Icons.qr_code_scanner),
            label: Text(_token == null ? 'Escanear QR de acceso' : 'Abrir escaner QR'),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 20),
              backgroundColor: TemaSigic.azulPrincipal,
              foregroundColor: Colors.white,
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _cargarPantalla,
            icon: const Icon(Icons.refresh),
            label: const Text('Actualizar estado'),
          ),
        ],
      ),
    );
  }

  Widget _construirVistaCamara(BuildContext context) {
    if (kIsWeb) {
      return _construirVistaEscaneoWeb(context);
    }

    final tema = Theme.of(context);
    return Stack(
      children: [
        Positioned.fill(
          child: MobileScanner(
            controller: _controladorCamara,
            onDetect: (captura) {
              final codigo = captura.barcodes.isEmpty ? null : captura.barcodes.first.rawValue;
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
                  Color(0xA30A1422),
                  Color(0x66101C2D),
                  Color(0xB8071019),
                ],
              ),
            ),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 18, 18, 8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x33000000),
                          blurRadius: 20,
                          offset: Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        IconButton.filled(
                          style: IconButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: TemaSigic.azulPrincipal,
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
                                _token == null ? 'Escanear QR de acceso' : 'Escanear acreditacion',
                                style: tema.textTheme.titleMedium?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _token == null
                                    ? 'Apunta al QR de configuracion o inicio de sesion.'
                                    : 'Alinea el codigo dentro del marco para acreditar rapido.',
                                style: tema.textTheme.bodySmall?.copyWith(
                                  color: Colors.white.withValues(alpha: 0.85),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
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
                      child: CustomPaint(
                        painter: _MarcoEscanerPainter(),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 28),
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: TemaSigic.azulBrillante.withValues(alpha: 0.22),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(Icons.center_focus_strong, color: Colors.white),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _token == null
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
                if (_cargandoEscaneo)
                  const CircularProgressIndicator(color: Colors.white),
                const SizedBox(height: 48),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _construirVistaEscaneoWeb(BuildContext context) {
    final tema = Theme.of(context);
    return ListView(
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
                      style: tema.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.35),
                  borderRadius: BorderRadius.circular(22),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.qr_code_2, size: 72, color: TemaSigic.azulPrincipal),
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
                  hintText: 'Pega aqui sigic-config:, sigic-login: o el codigo del invitado',
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
                          _mostrarMensaje('Falta un codigo', 'Ingresa o pega un codigo antes de continuar.');
                          return;
                        }
                        _procesarCodigo(codigo);
                      },
                icon: const Icon(Icons.play_arrow),
                label: Text(_cargandoEscaneo ? 'Procesando...' : 'Procesar codigo'),
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
    );
  }

  Widget _construirVistaResultado(BuildContext context, ResultadoEscaneo resultado) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
      children: [
        PanelTarjeta(
          contenido: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(resultado.titulo, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              Text(resultado.mensaje),
            ],
          ),
        ),
        if (resultado.tipo == TipoResultadoEscaneo.individual && resultado.invitado != null)
          _TarjetaInvitadoIndividual(
            invitado: resultado.invitado!,
            egresadoNombre: resultado.egresadoNombre ?? '',
            cargando: _cargandoEscaneo,
            alAcreditar: () => _acreditarInvitado(resultado.invitado!.id),
          ),
        if (resultado.tipo == TipoResultadoEscaneo.grupal && resultado.grupoEgresado != null)
          _TarjetaGrupo(
            resultado: resultado,
            cargando: _cargandoEscaneo,
            alAcreditarInvitado: _acreditarInvitado,
            alAcreditarPendientes: _acreditarPendientes,
          ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: _abrirCamara,
          icon: const Icon(Icons.qr_code_scanner),
          label: const Text('Escanear siguiente'),
        ),
        TextButton.icon(
          onPressed: () => setState(() {
            _resultado = null;
          }),
          icon: const Icon(Icons.home_outlined),
          label: const Text('Volver al inicio'),
        ),
      ],
    );
  }
}

enum EstadoSesion {
  comprobando,
  autenticado,
  invitado,
  sinConexion,
  expirada,
}

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
      ..quadraticBezierTo(rect.right, rect.bottom, rect.right - radio, rect.bottom)
      ..lineTo(rect.right - largoEsquina, rect.bottom)
      ..moveTo(rect.left + largoEsquina, rect.bottom)
      ..lineTo(rect.left + radio, rect.bottom)
      ..quadraticBezierTo(rect.left, rect.bottom, rect.left, rect.bottom - radio)
      ..lineTo(rect.left, rect.bottom - largoEsquina);

    canvas.drawPath(ruta, pintura);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _TarjetaInvitadoIndividual extends StatelessWidget {
  const _TarjetaInvitadoIndividual({
    required this.invitado,
    required this.egresadoNombre,
    required this.cargando,
    required this.alAcreditar,
  });

  final InvitadoEscaneado invitado;
  final String egresadoNombre;
  final bool cargando;
  final VoidCallback alAcreditar;

  @override
  Widget build(BuildContext context) {
    final puedeAcreditar = !invitado.presente && !cargando;
    return PanelTarjeta(
      contenido: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(invitado.nombre, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Text('DNI: ${invitado.dni}'),
          Text('Relacion: ${invitado.relacion}'),
          if (egresadoNombre.isNotEmpty) Text('Egresado: $egresadoNombre'),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: puedeAcreditar ? alAcreditar : null,
            child: Text(invitado.presente ? 'Ya acreditado' : 'Registrar ingreso'),
          ),
        ],
      ),
    );
  }
}

class _TarjetaGrupo extends StatelessWidget {
  const _TarjetaGrupo({
    required this.resultado,
    required this.cargando,
    required this.alAcreditarInvitado,
    required this.alAcreditarPendientes,
  });

  final ResultadoEscaneo resultado;
  final bool cargando;
  final ValueChanged<String> alAcreditarInvitado;
  final VoidCallback alAcreditarPendientes;

  @override
  Widget build(BuildContext context) {
    final grupo = resultado.grupoEgresado!;
    final invitadosPendientes = resultado.invitadosGrupo.where((item) => !item.presente).length;

    return PanelTarjeta(
      contenido: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Graduado', style: Theme.of(context).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Text(grupo.nombre, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 8),
          Text('Legajo: ${grupo.legajo}'),
          Text('Carrera: ${grupo.carrera.isEmpty ? 'N/C' : grupo.carrera}'),
          Text('Asiento: ${grupo.asientoId.isEmpty ? 'Sin asiento' : grupo.asientoId}'),
          const SizedBox(height: 18),
          Text('Invitados en grupo', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 10),
          ...resultado.invitadosGrupo.map(
            (invitado) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(invitado.nombre, style: const TextStyle(fontWeight: FontWeight.w700)),
                            const SizedBox(height: 4),
                            Text('DNI: ${invitado.dni}'),
                            Text('Relacion: ${invitado.relacion}'),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      invitado.presente
                          ? const Chip(
                              label: Text('Ingreso'),
                              avatar: Icon(Icons.check_circle, color: TemaSigic.exito),
                            )
                          : FilledButton(
                              onPressed: cargando ? null : () => alAcreditarInvitado(invitado.id),
                              child: const Text('Ingresar'),
                            ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          FilledButton.icon(
            onPressed: cargando || invitadosPendientes == 0 ? null : alAcreditarPendientes,
            icon: const Icon(Icons.groups_2),
            label: Text('Acreditar pendientes ($invitadosPendientes)'),
          ),
        ],
      ),
    );
  }
}
