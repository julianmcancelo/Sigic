import 'package:flutter/material.dart';

import '../modelos/usuario_sesion.dart';
import '../servicios/servicio_api.dart';

/// Modal interactivo con la guía paso a paso de inicio de sesión para el personal de SiGIC.
class ModalGuiaInicioSesion extends StatelessWidget {
  const ModalGuiaInicioSesion({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF0284C7).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.menu_book_rounded,
                  color: Color(0xFF0284C7),
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Guía de Inicio de Sesión',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    SizedBox(height: 1),
                    Text(
                      'Métodos y opciones para ingresar al sistema SiGIC',
                      style: TextStyle(
                        fontSize: 11.5,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.close),
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Divider(),
          Flexible(
            child: ListView(
              shrinkWrap: true,
              children: const [
                _PasoGuiaLogin(
                  numero: '1',
                  icono: Icons.qr_code_scanner_rounded,
                  colorIcono: Color(0xFF0284C7),
                  titulo: 'Pase QR Instantáneo (Recomendado)',
                  descripcion:
                      'En la computadora donde está abierto el sistema SiGIC, hacé clic en el botón "Pase QR" en la barra superior junto a tu nombre de operador. Luego en esta app pulsá "Escanear Pase QR" y apuntá la cámara para ingresar al instante sin escribir contraseñas.',
                ),
                SizedBox(height: 10),
                _PasoGuiaLogin(
                  numero: '2',
                  icono: Icons.badge_outlined,
                  colorIcono: Color(0xFF0A7F5F),
                  titulo: 'Ingreso con Correo y Contraseña',
                  descripcion:
                      'Podés iniciar sesión con tu correo electrónico institucional (ej. usuario@itbeltran.com.ar) y la contraseña establecida al registrar tu usuario.',
                ),
                SizedBox(height: 10),
                _PasoGuiaLogin(
                  numero: '3',
                  icono: Icons.admin_panel_settings_outlined,
                  colorIcono: Color(0xFF7C3AED),
                  titulo: 'Roles de Portería y Administración',
                  descripcion:
                      'Si tu cuenta es de Portería o Seguridad, tendrás acceso al escáner de credenciales de graduados. Si tu cuenta es Administrativa o de Soporte, además tendrás disponible el panel de control de aforo y selección de ceremonias.',
                ),
                SizedBox(height: 10),
                _PasoGuiaLogin(
                  numero: '4',
                  icono: Icons.wifi_tethering_rounded,
                  colorIcono: Color(0xFFD97706),
                  titulo: 'Configuración en Red Local',
                  descripcion:
                      'Si estás en el anfiteatro o predio sin internet externa, podés conectar la app al servidor local tocando en "Servidor / Red" y escaneando el código QR de red de SiGIC.',
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: FilledButton(
              onPressed: () => Navigator.of(context).pop(),
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF0F172A),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Entendido, volver'),
            ),
          ),
        ],
      ),
    );
  }
}

class _PasoGuiaLogin extends StatelessWidget {
  const _PasoGuiaLogin({
    required this.numero,
    required this.icono,
    required this.colorIcono,
    required this.titulo,
    required this.descripcion,
  });

  final String numero;
  final IconData icono;
  final Color colorIcono;
  final String titulo;
  final String descripcion;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: colorIcono.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icono, color: colorIcono, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  titulo,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  descripcion,
                  style: const TextStyle(
                    fontSize: 11.5,
                    color: Color(0xFF475569),
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Modal de bienvenida y confirmación que se despliega al autenticarse exitosamente.
class ModalBienvenidaSesion extends StatelessWidget {
  const ModalBienvenidaSesion({
    super.key,
    required this.usuario,
    required this.alContinuar,
  });

  final UsuarioSesion usuario;
  final VoidCallback alContinuar;

  @override
  Widget build(BuildContext context) {
    final esAdmin = usuario.esAdministrativo;

    return Container(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 28),
      decoration: const BoxDecoration(
        color: Color(0xFF0F172A),
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF0A7F5F).withValues(alpha: 0.2),
              border: Border.all(color: const Color(0xFF10B981), width: 2),
            ),
            child: const Icon(
              Icons.check_rounded,
              color: Color(0xFF34D399),
              size: 32,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            '¡Sesión Iniciada con Éxito!',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            usuario.nombre,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF7DD3FC),
              fontWeight: FontWeight.w800,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            usuario.email,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF94A3B8),
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white10),
            ),
            child: Row(
              children: [
                Icon(
                  esAdmin ? Icons.admin_panel_settings : Icons.shield_outlined,
                  color: esAdmin
                      ? const Color(0xFF38BDF8)
                      : const Color(0xFF34D399),
                  size: 26,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Rol Asignado: ${usuario.rol}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        esAdmin
                            ? 'Tenés habilitada la supervisión de aforo, control de ceremonias y reportes en vivo.'
                            : 'Terminal autorizada para acreditación rápida y control de ingreso mediante QR.',
                        style: const TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 11.5,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 46,
            child: FilledButton(
              onPressed: alContinuar,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF0284C7),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text(
                'Comenzar a Operar',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Diálogo amigable de alerta y recuperación ante errores de autenticación.
void mostrarDialogoErrorLogin(
  BuildContext context,
  String mensaje,
  VoidCallback alEscanearQR,
) {
  showDialog<void>(
    context: context,
    builder: (context) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: const [
          Icon(
            Icons.error_outline_rounded,
            color: Color(0xFFEF4444),
            size: 24,
          ),
          SizedBox(width: 10),
          Text(
            'Error al Iniciar Sesión',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
          ),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            mensaje,
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF334155),
              height: 1.4,
            ),
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Icon(
                  Icons.lightbulb_outline_rounded,
                  color: Color(0xFF0284C7),
                  size: 18,
                ),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Sugerencia: Podés escanear tu Pase QR generado desde la barra superior de SiGIC Web para ingresar sin ingresar contraseñas.',
                    style: TextStyle(
                      fontSize: 11.5,
                      color: Color(0xFF475569),
                      height: 1.35,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Reintentar'),
        ),
        FilledButton.icon(
          onPressed: () {
            Navigator.of(context).pop();
            alEscanearQR();
          },
          icon: const Icon(Icons.qr_code_scanner_rounded, size: 16),
          label: const Text('Escanear QR'),
        ),
      ],
    ),
  );
}

/// Modal de diagnóstico de servidor y conmutación de entornos de red.
class ModalConfiguracionServidor extends StatefulWidget {
  const ModalConfiguracionServidor({
    super.key,
    required this.servicioApi,
    required this.alGuardar,
    required this.alEscanearQR,
  });

  final ServicioApi servicioApi;
  final ValueChanged<String> alGuardar;
  final VoidCallback alEscanearQR;

  @override
  State<ModalConfiguracionServidor> createState() =>
      _ModalConfiguracionServidorState();
}

class _ModalConfiguracionServidorState
    extends State<ModalConfiguracionServidor> {
  final TextEditingController _controlador = TextEditingController();
  bool _probando = false;
  bool? _conexionExitosa;
  int? _latenciaMs;
  String _entornoSeleccionado = 'produccion';

  @override
  void initState() {
    super.initState();
    _cargarUrl();
  }

  @override
  void dispose() {
    _controlador.dispose();
    super.dispose();
  }

  Future<void> _cargarUrl() async {
    final url = await widget.servicioApi.obtenerApiUrl();
    if (!mounted) return;
    setState(() {
      _controlador.text = url;
      _entornoSeleccionado = widget.servicioApi.esEntornoDemo(url)
          ? 'demo'
          : widget.servicioApi.esEntornoProduccion(url)
          ? 'produccion'
          : 'personalizado';
    });
    _probarConexion();
  }

  Future<void> _probarConexion() async {
    setState(() {
      _probando = true;
      _conexionExitosa = null;
      _latenciaMs = null;
    });

    final stopwatch = Stopwatch()..start();
    final ok = await widget.servicioApi.probarConexion(_controlador.text.trim());
    stopwatch.stop();

    if (!mounted) return;
    setState(() {
      _probando = false;
      _conexionExitosa = ok;
      if (ok) {
        _latenciaMs = stopwatch.elapsedMilliseconds;
      }
    });
  }

  void _seleccionarPreset(String preset) {
    setState(() {
      _entornoSeleccionado = preset;
      if (preset == 'produccion') {
        _controlador.text = ServicioApi.urlBasePorDefecto;
      } else if (preset == 'demo') {
        _controlador.text = 'http://192.168.0.18:3000/api';
      }
    });
    _probarConexion();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        20,
        16,
        20,
        MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Configuración de Servidor & Red',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0F172A),
                ),
              ),
              IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.close),
              ),
            ],
          ),
          const Text(
            'Seleccioná el entorno o ingresá la dirección del servidor SiGIC:',
            style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _BotonPreset(
                  etiqueta: 'Producción',
                  seleccionado: _entornoSeleccionado == 'produccion',
                  alTocar: () => _seleccionarPreset('produccion'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _BotonPreset(
                  etiqueta: 'Red Local (LAN)',
                  seleccionado: _entornoSeleccionado == 'demo',
                  alTocar: () => _seleccionarPreset('demo'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _BotonPreset(
                  etiqueta: 'Personalizado',
                  seleccionado: _entornoSeleccionado == 'personalizado',
                  alTocar: () =>
                      setState(() => _entornoSeleccionado = 'personalizado'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _controlador,
            enabled: _entornoSeleccionado == 'personalizado',
            decoration: const InputDecoration(
              labelText: 'Dirección URL de la API',
              hintText: 'https://ejemplo.com/api',
              prefixIcon: Icon(Icons.dns_rounded, size: 20),
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: _conexionExitosa == true
                  ? const Color(0xFFECFDF5)
                  : _conexionExitosa == false
                  ? const Color(0xFFFEF2F2)
                  : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: _conexionExitosa == true
                    ? const Color(0xFFA7F3D0)
                    : _conexionExitosa == false
                    ? const Color(0xFFFECACA)
                    : const Color(0xFFE2E8F0),
              ),
            ),
            child: Row(
              children: [
                if (_probando) ...[
                  const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  const SizedBox(width: 10),
                  const Text(
                    'Comprobando conexión con el servidor...',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ] else if (_conexionExitosa == true) ...[
                  const Icon(
                    Icons.check_circle_rounded,
                    color: Color(0xFF059669),
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Servidor conectado correctamente ${_latenciaMs != null ? '· $_latenciaMs ms' : ''}',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF065F46),
                      ),
                    ),
                  ),
                ] else ...[
                  const Icon(
                    Icons.error_outline_rounded,
                    color: Color(0xFFDC2626),
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'No se pudo conectar con esta dirección.',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF991B1B),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _probando ? null : _probarConexion,
                  icon: const Icon(Icons.refresh_rounded, size: 16),
                  label: const Text('Probar'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.of(context).pop();
                    widget.alEscanearQR();
                  },
                  icon: const Icon(Icons.qr_code_scanner_rounded, size: 16),
                  label: const Text('QR de Red'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: FilledButton(
                  onPressed: () {
                    widget.alGuardar(_controlador.text.trim());
                    Navigator.of(context).pop();
                  },
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF0284C7),
                  ),
                  child: const Text('Guardar'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BotonPreset extends StatelessWidget {
  const _BotonPreset({
    required this.etiqueta,
    required this.seleccionado,
    required this.alTocar,
  });

  final String etiqueta;
  final bool seleccionado;
  final VoidCallback alTocar;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: alTocar,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: seleccionado
              ? const Color(0xFF0284C7)
              : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          etiqueta,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: seleccionado ? Colors.white : const Color(0xFF475569),
          ),
        ),
      ),
    );
  }
}


/// Modal de inicio de sesion manual para personal de porteria y administracion.
class ModalLoginManual extends StatefulWidget {
  const ModalLoginManual({
    super.key,
    required this.servicioApi,
    required this.alIniciarExito,
  });

  final ServicioApi servicioApi;
  final void Function(UsuarioSesion usuario) alIniciarExito;

  @override
  State<ModalLoginManual> createState() => _ModalLoginManualState();
}

class _ModalLoginManualState extends State<ModalLoginManual> {
  final TextEditingController _controladorCorreo = TextEditingController();
  final TextEditingController _controladorClave = TextEditingController();
  bool _ocultarClave = true;
  bool _cargando = false;
  String? _error;

  @override
  void dispose() {
    _controladorCorreo.dispose();
    _controladorClave.dispose();
    super.dispose();
  }

  Future<void> _ejecutarLogin() async {
    final correo = _controladorCorreo.text.trim();
    final clave = _controladorClave.text.trim();

    if (correo.isEmpty || clave.isEmpty) {
      setState(() {
        _error = 'Completa el correo y la contraseña para continuar.';
      });
      return;
    }

    setState(() {
      _cargando = true;
      _error = null;
    });

    try {
      final usuario = await widget.servicioApi.iniciarSesionConCredenciales(
        email: correo,
        contrasena: clave,
      );
      if (!mounted) return;
      Navigator.of(context).pop();
      widget.alIniciarExito(usuario);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => _cargando = false);
      }
    }
  }

  Future<void> _ejecutarLoginDemo() async {
    setState(() {
      _cargando = true;
      _error = null;
    });

    try {
      final usuario = await widget.servicioApi.iniciarSesionDemo();
      if (!mounted) return;
      Navigator.of(context).pop();
      widget.alIniciarExito(usuario);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => _cargando = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0284C7).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.lock_person_rounded,
                      color: Color(0xFF0284C7),
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Ingreso de Personal',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        SizedBox(height: 1),
                        Text(
                          'Portería y Administración SiGIC',
                          style: TextStyle(
                            fontSize: 11.5,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (_error != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFECACA)),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.error_outline_rounded,
                        color: Color(0xFFDC2626),
                        size: 18,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _error!,
                          style: const TextStyle(
                            fontSize: 11.5,
                            color: Color(0xFF991B1B),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],
              TextField(
                controller: _controladorCorreo,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                decoration: InputDecoration(
                  labelText: 'Correo electrónico',
                  hintText: 'ejemplo@itbeltran.com.ar',
                  prefixIcon: const Icon(Icons.email_outlined, size: 20),
                  suffixIcon: _controladorCorreo.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 18),
                          onPressed: () => setState(() => _controladorCorreo.clear()),
                        )
                      : null,
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                ),
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _controladorClave,
                obscureText: _ocultarClave,
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _ejecutarLogin(),
                decoration: InputDecoration(
                  labelText: 'Contraseña',
                  prefixIcon: const Icon(Icons.key_outlined, size: 20),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _ocultarClave
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                      size: 20,
                    ),
                    onPressed: () => setState(() => _ocultarClave = !_ocultarClave),
                  ),
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              FilledButton(
                onPressed: _cargando ? null : _ejecutarLogin,
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF0284C7),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: _cargando
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        'Iniciar Sesión',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
              ),
              const SizedBox(height: 10),
              OutlinedButton(
                onPressed: _cargando ? null : _ejecutarLoginDemo,
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 13),
                  side: const BorderSide(color: Color(0xFFCBD5E1)),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: const Text(
                  'Ingreso de Demostración (Operador Demo)',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF475569),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
