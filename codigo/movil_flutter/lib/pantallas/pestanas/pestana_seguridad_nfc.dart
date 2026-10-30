import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../modelos/usuario_sesion.dart';
import '../../nucleo/tema/tema_sigic.dart';
import '../../servicios/servicio_api.dart';
import '../../servicios/servicio_feedback.dart';
import '../../servicios/servicio_nfc.dart';

class PestanaSeguridadNfc extends StatefulWidget {
  const PestanaSeguridadNfc({
    super.key,
    required this.servicioApi,
    required this.revisionSesion,
    required this.alCambiarSesion,
  });

  final ServicioApi servicioApi;
  final int revisionSesion;
  final VoidCallback alCambiarSesion;

  @override
  State<PestanaSeguridadNfc> createState() => _PestanaSeguridadNfcState();
}

class _PestanaSeguridadNfcState extends State<PestanaSeguridadNfc> {
  final ServicioNfc _servicioNfc = ServicioNfc();

  final TextEditingController _ctrlPin = TextEditingController(
    text: '04051990',
  );
  final TextEditingController _ctrlPropietario = TextEditingController(
    text: 'Cancelo Julian',
  );
  final TextEditingController _ctrlCorreo = TextEditingController(
    text: 'juliancancelo@gmail.com',
  );
  final TextEditingController _ctrlDias = TextEditingController(text: '365');

  String _rolSeleccionado = 'SUPER_ADMIN';
  bool _cargando = true;
  bool _operando = false;
  bool _esperandoNfcFisico = false;
  String _mensajeEstadoNfc = '';

  bool _nfcSoportado = false;
  bool _nfcActivo = false;
  String _apiUrlActual = '';
  bool _grabarParaProduccion = true; // true: https://app.sigic.com.ar, false: LAN

  static const List<Map<String, String>> _equipoOficialPresets = [
    {
      'apodo': 'Julian',
      'nombre': 'Cancelo Julian',
      'correo': 'juliancancelo@gmail.com',
      'rol': 'SUPER_ADMIN',
    },
    {
      'apodo': 'Sol',
      'nombre': 'Contreras Villalba Sol Heilin',
      'correo': 'sol.contreras@sigic.com.ar',
      'rol': 'SUPER_ADMIN',
    },
    {
      'apodo': 'Alan',
      'nombre': 'Alfonso Alan Alexis',
      'correo': 'alan.alfonso@sigic.com.ar',
      'rol': 'SUPER_ADMIN',
    },
    {
      'apodo': 'Gaby',
      'nombre': 'Santillan Luis Gabriel',
      'correo': 'gabriel.santillan@sigic.com.ar',
      'rol': 'SUPER_ADMIN',
    },
    {
      'apodo': 'Mati',
      'nombre': 'Frassia Matias',
      'correo': 'matias.frassia@sigic.com.ar',
      'rol': 'SUPER_ADMIN',
    },
  ];

  Map<String, dynamic>? _estadoLicencia;
  List<Map<String, dynamic>> _gafetesEmitidos = const [];
  UsuarioSesion? _usuarioActual;

  @override
  void initState() {
    super.initState();
    _cargarTodo();
  }

  @override
  void didUpdateWidget(covariant PestanaSeguridadNfc oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.revisionSesion != widget.revisionSesion) {
      _cargarTodo();
    }
  }

  @override
  void dispose() {
    _servicioNfc.cancelarOperacion();
    _ctrlPin.dispose();
    _ctrlPropietario.dispose();
    _ctrlCorreo.dispose();
    _ctrlDias.dispose();
    super.dispose();
  }

  bool _esCuentaJulian(UsuarioSesion? u) {
    if (u == null) return false;
    final mail = u.email.toLowerCase().trim();
    return mail == 'juliancancelo@gmail.com' ||
        mail == 'jcancelo.dev@gmail.com' ||
        mail == 'julianmcancelo@gmail.com' ||
        u.rol.toUpperCase() == 'SUPER_ADMIN' ||
        u.rol.toUpperCase() == 'SOPORTE';
  }

  Future<void> _cargarTodo() async {
    if (mounted) {
      setState(() => _cargando = true);
    }
    try {
      final apiUrl = await widget.servicioApi.obtenerApiUrl();
      final disp = await _servicioNfc.consultarDisponibilidad();
      final usr = await widget.servicioApi.obtenerUsuarioLocal();
      final lic = await widget.servicioApi.obtenerEstadoLicenciaSeguridad();
      final integ = await widget.servicioApi.obtenerIntegridadYAlertasSeguridad();

      final listaGafetes = <Map<String, dynamic>>[];
      final rawGafetes = integ['gafetesNfc'];
      if (rawGafetes is List) {
        for (final item in rawGafetes) {
          if (item is Map) {
            listaGafetes.add(item.cast<String, dynamic>());
          }
        }
      }

      if (!mounted) return;
      setState(() {
        _apiUrlActual = apiUrl;
        _nfcSoportado = disp['soportado'] == true;
        _nfcActivo = disp['activo'] == true;
        _usuarioActual = usr;
        _estadoLicencia = lic;
        _gafetesEmitidos = listaGafetes;
        _cargando = false;
      });
    } catch (e) {
      final apiUrl = await widget.servicioApi.obtenerApiUrl().catchError((_) => '');
      if (!mounted) return;
      setState(() {
        _apiUrlActual = apiUrl;
        _cargando = false;
      });
    }
  }

  void _mostrarAviso(String texto, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(texto),
        backgroundColor: error ? TemaSigic.error : TemaSigic.exito,
      ),
    );
  }

  Future<void> _conmutarBloqueoPlataforma(bool bloquear) async {
    setState(() => _operando = true);
    try {
      final res = await widget.servicioApi.conmutarBloqueoSeguridad(
        bloquear: bloquear,
        codigoTotp: _ctrlPin.text.trim(),
      );
      await ServicioFeedback.accesoPermitido();
      _mostrarAviso(
        (res['mensaje'] ?? 'Estado de seguridad actualizado.').toString(),
      );
      await _cargarTodo();
    } catch (e) {
      await ServicioFeedback.accesoDenegado();
      _mostrarAviso(
        e.toString().replaceFirst('Exception: ', ''),
        error: true,
      );
    } finally {
      if (mounted) setState(() => _operando = false);
    }
  }

  Future<void> _emitirYGrabarEnUnSoloPaso({required bool grabarEnChip}) async {
    final propietario = _ctrlPropietario.text.trim();
    final correo = _ctrlCorreo.text.trim();
    final dias = int.tryParse(_ctrlDias.text.trim()) ?? 365;

    if (propietario.isEmpty || correo.isEmpty) {
      _mostrarAviso('Completa el nombre y el correo a autorizar.', error: true);
      return;
    }

    setState(() {
      _operando = true;
      _esperandoNfcFisico = false;
      _mensajeEstadoNfc = 'Generando certificado Ed25519 en el servidor...';
    });

    try {
      final urlDestino = _grabarParaProduccion
          ? 'https://app.sigic.com.ar'
          : _apiUrlActual.replaceAll(RegExp(r'/api$'), '');
      final res = await widget.servicioApi.emitirGafeteNfcAutorizacion(
        propietario: propietario,
        correo: correo,
        rol: _rolSeleccionado,
        diasValidez: dias,
        origenUrl: urlDestino,
        codigoTotp: _ctrlPin.text.trim(),
      );

      final gafete = (res['gafete'] as Map?)?.cast<String, dynamic>();
      final urlNfc = (gafete?['url_nfc'] ?? '').toString();

      if (urlNfc.isEmpty) {
        throw Exception('El servidor no devolvio la URL firmada del Tag NFC.');
      }

      if (!grabarEnChip) {
        await Clipboard.setData(ClipboardData(text: urlNfc));
        await ServicioFeedback.accesoPermitido();
        _mostrarAviso(
          'Gafete NFC emitido para $propietario y copiado al portapapeles.',
        );
        await _cargarTodo();
        return;
      }

      // Grabar fisicamente en el chip NFC apoyando la tarjeta detras del telefono
      setState(() {
        _esperandoNfcFisico = true;
        _mensajeEstadoNfc =
            'Acerca ahora la tarjeta o llavero NFC detras de tu celular para grabarlo...';
      });

      final grabacion = await _servicioNfc.grabarUrlEnTag(urlNfc);
      final uidFisico = (grabacion['uidFisico'] ?? 'TAG').toString();

      await ServicioFeedback.accesoPermitido();
      _mostrarAviso(
        'Tag NFC ($uidFisico) grabado exitosamente para $propietario.',
      );
      await _cargarTodo();
    } catch (e) {
      await ServicioFeedback.accesoDenegado();
      _mostrarAviso(
        e.toString().replaceFirst('Exception: ', ''),
        error: true,
      );
    } finally {
      if (mounted) {
        setState(() {
          _operando = false;
          _esperandoNfcFisico = false;
          _mensajeEstadoNfc = '';
        });
      }
    }
  }

  Future<void> _grabarGafeteExistenteEnTag(Map<String, dynamic> gafete) async {
    final urlNfc = (gafete['url_nfc'] ?? '').toString();
    final propietario = (gafete['propietario'] ?? 'Usuario').toString();
    if (urlNfc.isEmpty) return;

    setState(() {
      _operando = true;
      _esperandoNfcFisico = true;
      _mensajeEstadoNfc =
          'Acerca la tarjeta o llavero NFC detras del celular para grabar el acceso de $propietario...';
    });

    try {
      final grabacion = await _servicioNfc.grabarUrlEnTag(urlNfc);
      final uidFisico = (grabacion['uidFisico'] ?? 'TAG').toString();
      await ServicioFeedback.accesoPermitido();
      _mostrarAviso(
        'Tag NFC ($uidFisico) grabado para $propietario.',
      );
    } catch (e) {
      await ServicioFeedback.accesoDenegado();
      _mostrarAviso(
        e.toString().replaceFirst('Exception: ', ''),
        error: true,
      );
    } finally {
      if (mounted) {
        setState(() {
          _operando = false;
          _esperandoNfcFisico = false;
          _mensajeEstadoNfc = '';
        });
      }
    }
  }

  Future<void> _escanearTagNfcYDesbloquear() async {
    setState(() {
      _operando = true;
      _esperandoNfcFisico = true;
      _mensajeEstadoNfc =
          'Acerca tu tarjeta o llavero NFC al celular para verificar la firma Ed25519 y autorizar...';
    });

    try {
      final lectura = await _servicioNfc.leerTagFisico();
      final contenido = (lectura['contenido'] ?? '').toString();
      if (contenido.isEmpty || !contenido.contains('SIGIC-NFC-v1.')) {
        throw Exception(
          'El Tag NFC leido no contiene una firma SIGIC-NFC-v1 valida.',
        );
      }

      final res = await widget.servicioApi.autorizarDispositivoConTagNfc(
        contenido,
        bloquear: false,
      );
      await ServicioFeedback.accesoPermitido();
      widget.alCambiarSesion();
      _mostrarAviso(
        (res['mensaje'] ?? 'Celular y plataforma autorizados por NFC.')
            .toString(),
      );
      await _cargarTodo();
    } catch (e) {
      await ServicioFeedback.accesoDenegado();
      _mostrarAviso(
        e.toString().replaceFirst('Exception: ', ''),
        error: true,
      );
    } finally {
      if (mounted) {
        setState(() {
          _operando = false;
          _esperandoNfcFisico = false;
          _mensajeEstadoNfc = '';
        });
      }
    }
  }

  Future<void> _cambiarEstadoGafete(String uidLlave, bool activo) async {
    try {
      final res = await widget.servicioApi.revocarGafeteNfcAutorizacion(
        uidLlave: uidLlave,
        activo: activo,
      );
      _mostrarAviso((res['mensaje'] ?? 'Estado actualizado.').toString());
      await _cargarTodo();
    } catch (e) {
      _mostrarAviso(
        e.toString().replaceFirst('Exception: ', ''),
        error: true,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final esJulian = _esCuentaJulian(_usuarioActual);
    final bloqueado = _estadoLicencia?['bloqueado'] == true;
    final codigoTotpActual =
        (_estadoLicencia?['codigoTotpActualDemo'] ?? '').toString();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Seguridad, Bloqueo & NFC'),
        actions: [
          IconButton(
            onPressed: _cargando ? null : _cargarTodo,
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Actualizar estado',
          ),
        ],
      ),
      body: _cargando
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _cargarTodo,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                children: [
                  // Banner de Autoridad Criptografica
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF081624), Color(0xFF0D2B45)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                esJulian
                                    ? 'AUTORIDAD: CANCELO JULIAN'
                                    : 'MODO CUSTODIA CRIPTOGRAFICA',
                                style: const TextStyle(
                                  color: Color(0xFF38BDF8),
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: bloqueado
                                    ? const Color(0xFFEF4444).withValues(alpha: 0.2)
                                    : const Color(0xFF10B981).withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                bloqueado ? 'SISTEMA BLOQUEADO' : 'LICENCIA ACTIVA',
                                style: TextStyle(
                                  color: bloqueado
                                      ? const Color(0xFFFCA5A5)
                                      : const Color(0xFF6EE7B7),
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'Grabador NFC Directo & Control Maestro',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16.5,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Tecnicatura Superior en Analista de Sistemas · Antena NFC del telefono: ${_nfcActivo ? 'ACTIVA' : (_nfcSoportado ? 'APAGADA' : 'NO DETECTADA')}',
                          style: const TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.14),
                            ),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.dns_rounded,
                                color: Color(0xFF38BDF8),
                                size: 16,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Servidor: $_apiUrlActual',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (!_apiUrlActual.contains('192.168.0.18'))
                                TextButton(
                                  onPressed: () async {
                                    await widget.servicioApi.guardarApiUrl(
                                      'http://192.168.0.18:3000/api',
                                      conservarSesion: true,
                                    );
                                    _mostrarAviso(
                                      'Conectado a servidor LAN de pruebas (192.168.0.18:3000)',
                                    );
                                    await _cargarTodo();
                                  },
                                  style: TextButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 4,
                                    ),
                                    minimumSize: Size.zero,
                                    tapTargetSize:
                                        MaterialTapTargetSize.shrinkWrap,
                                    backgroundColor: const Color(0xFF0284C7),
                                    foregroundColor: Colors.white,
                                  ),
                                  child: const Text(
                                    'Usar LAN Local',
                                    style: TextStyle(
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                )
                              else
                                TextButton(
                                  onPressed: () async {
                                    await widget.servicioApi
                                        .usarEntornoProduccion();
                                    _mostrarAviso(
                                      'Conectado a servidor de Produccion',
                                    );
                                    await _cargarTodo();
                                  },
                                  style: TextButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 4,
                                    ),
                                    minimumSize: Size.zero,
                                    tapTargetSize:
                                        MaterialTapTargetSize.shrinkWrap,
                                    backgroundColor: Colors.white24,
                                    foregroundColor: Colors.white,
                                  ),
                                  child: const Text(
                                    'Prod',
                                    style: TextStyle(
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  if (_esperandoNfcFisico) ...[
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE0F2FE),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFF38BDF8)),
                      ),
                      child: Row(
                        children: [
                          const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(strokeWidth: 2.5),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Text(
                              _mensajeEstadoNfc,
                              style: const TextStyle(
                                color: Color(0xFF0C4A6E),
                                fontSize: 12.5,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          TextButton(
                            onPressed: () {
                              _servicioNfc.cancelarOperacion();
                              setState(() {
                                _esperandoNfcFisico = false;
                                _operando = false;
                              });
                            },
                            child: const Text('Cancelar'),
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 14),

                  // 1. Control Maestro de Bloqueo / Desbloqueo (PIN 04051990 o Lectura NFC)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                '1. Control de Bloqueo & PIN Maestro',
                                style: TextStyle(
                                  fontSize: 14.5,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              if (codigoTotpActual.isNotEmpty)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    'TOTP: $codigoTotpActual',
                                    style: const TextStyle(
                                      fontFamily: 'monospace',
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Bloquea o desbloquea la plataforma web y movil al instante con tu Codigo Maestro (04051990) o apoyando tu tarjeta NFC.',
                            style: TextStyle(
                              fontSize: 12,
                              color: Color(0xFF64748B),
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _ctrlPin,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Codigo Maestro (04051990) o TOTP',
                              prefixIcon: Icon(Icons.key_rounded),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: FilledButton.icon(
                                  onPressed: _operando
                                      ? null
                                      : () => _conmutarBloqueoPlataforma(true),
                                  style: FilledButton.styleFrom(
                                    backgroundColor: const Color(0xFFDC2626),
                                  ),
                                  icon: const Icon(Icons.lock_rounded, size: 18),
                                  label: const Text('Bloquear'),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: FilledButton.icon(
                                  onPressed: _operando
                                      ? null
                                      : () => _conmutarBloqueoPlataforma(false),
                                  style: FilledButton.styleFrom(
                                    backgroundColor: const Color(0xFF059669),
                                  ),
                                  icon: const Icon(
                                    Icons.lock_open_rounded,
                                    size: 18,
                                  ),
                                  label: const Text('Desbloquear'),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          OutlinedButton.icon(
                            onPressed: _operando
                                ? null
                                : _escanearTagNfcYDesbloquear,
                            icon: const Icon(Icons.nfc_rounded, size: 18),
                            label: const Text(
                              'Leer Tarjeta NFC para Autorizar / Desbloquear',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 14),

                  // 2. Generar y Grabar Tag NFC directo desde el celular
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            '2. Generar y Grabar Tag NFC en 1 Paso',
                            style: TextStyle(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Toca un integrante del equipo (Julian, Sol, Alan, Gaby o Mati) para cargar sus datos al instante y grabar su llavero o tarjeta NFC:',
                            style: TextStyle(
                              fontSize: 12,
                              color: Color(0xFF64748B),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: _equipoOficialPresets.map((m) {
                              final apodo = m['apodo']!;
                              final correo = m['correo']!;
                              final nombre = m['nombre']!;
                              final activoChip =
                                  _ctrlCorreo.text.trim().toLowerCase() ==
                                  correo.toLowerCase();
                              return ActionChip(
                                backgroundColor: activoChip
                                    ? const Color(0xFF0284C7)
                                    : const Color(0xFFF1F5F9),
                                side: BorderSide(
                                  color: activoChip
                                      ? const Color(0xFF0284C7)
                                      : const Color(0xFFCBD5E1),
                                ),
                                label: Text(
                                  apodo,
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w800,
                                    color: activoChip
                                        ? Colors.white
                                        : const Color(0xFF1E293B),
                                  ),
                                ),
                                onPressed: () {
                                  setState(() {
                                    _ctrlPropietario.text = nombre;
                                    _ctrlCorreo.text = correo;
                                    _rolSeleccionado = 'SUPER_ADMIN';
                                    _ctrlDias.text = '1095';
                                  });
                                },
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: const Color(0xFFE2E8F0),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.dns_rounded,
                                  size: 16,
                                  color: Color(0xFF0284C7),
                                ),
                                const SizedBox(width: 8),
                                const Expanded(
                                  child: Text(
                                    'Dominio del Chip NFC:',
                                    style: TextStyle(
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                                ChoiceChip(
                                  label: const Text(
                                    'sigic.com.ar',
                                    style: TextStyle(fontSize: 10.5),
                                  ),
                                  selected: _grabarParaProduccion,
                                  onSelected: (_) => setState(
                                    () => _grabarParaProduccion = true,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                ChoiceChip(
                                  label: const Text(
                                    'LAN Local',
                                    style: TextStyle(fontSize: 10.5),
                                  ),
                                  selected: !_grabarParaProduccion,
                                  onSelected: (_) => setState(
                                    () => _grabarParaProduccion = false,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _ctrlPropietario,
                            decoration: const InputDecoration(
                              labelText: 'Persona o Celular a Autorizar',
                              prefixIcon: Icon(Icons.person_outline_rounded),
                            ),
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: _ctrlCorreo,
                            keyboardType: TextInputType.emailAddress,
                            decoration: const InputDecoration(
                              labelText: 'Correo de la Cuenta',
                              prefixIcon: Icon(Icons.alternate_email_rounded),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Expanded(
                                flex: 2,
                                child: DropdownButtonFormField<String>(
                                  // ignore: deprecated_member_use
                                  value: _rolSeleccionado,
                                  decoration: const InputDecoration(
                                    labelText: 'Rol que Otorga',
                                  ),
                                  items: const [
                                    DropdownMenuItem(
                                      value: 'SUPER_ADMIN',
                                      child: Text('Super Admin'),
                                    ),
                                    DropdownMenuItem(
                                      value: 'ADMINISTRATIVO',
                                      child: Text('Administrativo'),
                                    ),
                                    DropdownMenuItem(
                                      value: 'PORTERIA',
                                      child: Text('Porteria'),
                                    ),
                                  ],
                                  onChanged: (val) {
                                    if (val != null) {
                                      setState(() => _rolSeleccionado = val);
                                    }
                                  },
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: TextField(
                                  controller: _ctrlDias,
                                  keyboardType: TextInputType.number,
                                  decoration: const InputDecoration(
                                    labelText: 'Dias',
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          FilledButton.icon(
                            onPressed: _operando
                                ? null
                                : () => _emitirYGrabarEnUnSoloPaso(
                                      grabarEnChip: true,
                                    ),
                            icon: const Icon(Icons.nfc_rounded),
                            label: const Text(
                              'Generar y Grabar en Tag NFC Ahora',
                            ),
                          ),
                          const SizedBox(height: 8),
                          OutlinedButton.icon(
                            onPressed: _operando
                                ? null
                                : () => _emitirYGrabarEnUnSoloPaso(
                                      grabarEnChip: false,
                                    ),
                            icon: const Icon(Icons.copy_rounded, size: 18),
                            label: const Text(
                              'Solo Generar y Copiar Enlace Firmado',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 14),

                  // 3. Lista de Tags NFC emitidos (Re-grabar o Revocar)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '3. Tags NFC y Personas Autorizadas (${_gafetesEmitidos.length})',
                            style: const TextStyle(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 8),
                          if (_gafetesEmitidos.isEmpty)
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 12),
                              child: Text(
                                'Todavia no hay Tags NFC emitidos.',
                                style: TextStyle(
                                  fontSize: 12.5,
                                  color: Color(0xFF64748B),
                                ),
                              ),
                            )
                          else
                            ..._gafetesEmitidos.map((g) {
                              final uid = (g['uid_llave'] ?? '').toString();
                              final prop = (g['propietario'] ?? '').toString();
                              final mail = (g['correo'] ?? '').toString();
                              final rol = (g['rol'] ?? '').toString();
                              final activo = g['activo'] != false;
                              final usos =
                                  (g['dispositivos_vinculados'] ?? 0).toString();

                              return Container(
                                margin: const EdgeInsets.only(top: 10),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: const Color(0xFFE2E8F0),
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            '$prop ($rol)',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w800,
                                              fontSize: 13,
                                            ),
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: activo
                                                ? const Color(0xFFD1FAE5)
                                                : const Color(0xFFFEE2E2),
                                            borderRadius:
                                                BorderRadius.circular(8),
                                          ),
                                          child: Text(
                                            activo ? 'ACTIVO' : 'REVOCADO',
                                            style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w800,
                                              color: activo
                                                  ? const Color(0xFF065F46)
                                                  : const Color(0xFF991B1B),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '$mail · ID: $uid · Usos: $usos',
                                      style: const TextStyle(
                                        fontSize: 11.5,
                                        color: Color(0xFF64748B),
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: OutlinedButton.icon(
                                            onPressed: _operando
                                                ? null
                                                : () =>
                                                    _grabarGafeteExistenteEnTag(
                                                      g,
                                                    ),
                                            icon: const Icon(
                                              Icons.nfc_rounded,
                                              size: 16,
                                            ),
                                            label: const Text(
                                              'Grabar en Tag',
                                              style: TextStyle(fontSize: 12),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: OutlinedButton(
                                            onPressed: _operando
                                                ? null
                                                : () => _cambiarEstadoGafete(
                                                      uid,
                                                      !activo,
                                                    ),
                                            style: OutlinedButton.styleFrom(
                                              foregroundColor: activo
                                                  ? const Color(0xFFDC2626)
                                                  : const Color(0xFF059669),
                                            ),
                                            child: Text(
                                              activo ? 'Revocar' : 'Reactivar',
                                              style:
                                                  const TextStyle(fontSize: 12),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              );
                            }),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
