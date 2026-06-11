import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:lucide_icons/lucide_icons.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Definí la variable global mutable para la URL de la API del servidor
String apiBase = 'http://192.168.1.100:3001/api';

// Token de sesión emitido por el backend al iniciar sesión. Sin este token,
// el servidor rechaza las operaciones de portería (escaneo e ingreso).
String? tokenSesion;

// Cabeceras comunes para hablar con la API (incluye el token si hay sesión)
Map<String, String> cabecerasApi() {
  return {
    'Content-Type': 'application/json',
    if (tokenSesion != null) 'Authorization': 'Bearer $tokenSesion',
  };
}

void main() async {
  // Me aseguro de inicializar los bindings de Flutter antes de usar SharedPreferences
  WidgetsFlutterBinding.ensureInitialized();

  // Cargo la configuración de la IP guardada previamente si es que existe
  final prefs = await SharedPreferences.getInstance();
  final urlGuardada = prefs.getString('api_base');
  if (urlGuardada != null && urlGuardada.isNotEmpty) {
    apiBase = urlGuardada;
  }

  runApp(const AplicacionSigic());
}

class UsuarioSigic {
  const UsuarioSigic({required this.usuario, required this.contrasena, required this.rol});

  final String usuario;
  final String contrasena;
  final String rol;
}

const List<UsuarioSigic> usuariosDemo = [
  UsuarioSigic(usuario: 'seguridad1', contrasena: '1234', rol: 'Puerta Norte'),
  UsuarioSigic(usuario: 'seguridad2', contrasena: '1234', rol: 'Puerta Sur'),
  UsuarioSigic(usuario: 'jefe_seguridad', contrasena: 'admin123', rol: 'Supervisor'),
];

class AplicacionSigic extends StatelessWidget {
  const AplicacionSigic({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Portería SiGIC',
      debugShowCheckedModeBanner: false,
      // Acá le metemos un tema oscuro bien moderno, tirando a azul oscuro profundo
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0A0E1A),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0EA5E9),
          brightness: Brightness.dark,
        ),
      ),
      home: const PantallaLogin(),
    );
  }
}

class PantallaLogin extends StatefulWidget {
  const PantallaLogin({super.key});

  @override
  State<PantallaLogin> createState() => _PantallaLoginState();
}

class _PantallaLoginState extends State<PantallaLogin> {
  // Mis controladores para el texto de los campos de entrada
  final TextEditingController _controlUsuario = TextEditingController();
  final TextEditingController _controlContrasena = TextEditingController();
  final TextEditingController _controlOtp = TextEditingController();
  final MobileScannerController _controlQrLogin = MobileScannerController();

  // Arrancamos con el método tradicional de usuario y contraseña
  String _metodo = 'credenciales';
  String? _otpParaUsuario;
  String? _codigoOtp;
  String? _usuarioOtpSeleccionado;

  // Un método premium en primera persona para que el usuario configure dinámicamente el backend
  Future<void> _abrirConfiguracionServidor() async {
    final controller = TextEditingController(text: apiBase);
    final prefs = await SharedPreferences.getInstance();

    if (!mounted) return;

    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (contexto) {
        return AlertDialog(
          backgroundColor: const Color(0xFF0F172A),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
            side: BorderSide(
              color: const Color(0xFF38BDF8).withOpacity(0.2),
              width: 1.5,
            ),
          ),
          title: Row(
            children: const [
              Icon(LucideIcons.server, color: Color(0xFF0EA5E9)),
              SizedBox(width: 10),
              Text(
                'Servidor API',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Ingresá la URL base del servidor (ej. http://192.168.1.100:3001/api):',
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: controller,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'URL de la API',
                  labelStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
                  prefixIcon: const Icon(LucideIcons.link, color: Color(0xFF0EA5E9)),
                  filled: true,
                  fillColor: const Color(0xFF070B14),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: Color(0xFF334155), width: 1),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: Color(0xFF0EA5E9), width: 1.5),
                  ),
                ),
              ),
            ],
          ),
          actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(contexto),
              child: const Text(
                'CANCELAR',
                style: TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.bold),
              ),
            ),
            ElevatedButton(
              onPressed: () async {
                final nuevaUrl = controller.text.trim();
                if (nuevaUrl.isEmpty) {
                  _mostrarMensaje('La URL no puede estar vacía.', color: Colors.orangeAccent);
                  return;
                }
                setState(() {
                  apiBase = nuevaUrl;
                });
                await prefs.setString('api_base', nuevaUrl);
                if (contexto.mounted) {
                  Navigator.pop(contexto);
                }
                _mostrarMensaje('¡Servidor configurado correctamente!', color: Colors.green);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0EA5E9),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'GUARDAR',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ],
        );
      },
    );
  }


  @override
  void dispose() {
    // A limpiar todo para que no queden pérdidas de memoria
    _controlUsuario.dispose();
    _controlContrasena.dispose();
    _controlOtp.dispose();
    _controlQrLogin.dispose();
    super.dispose();
  }

  // Una vez que pasa la validación, mandamos al guardia a la pantalla principal
  void _entrarALaApp(UsuarioSigic usuario, String via) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => PantallaPorteria(usuario: usuario, viaLogin: via)),
    );
  }

  // Muestro un cartelito flotante abajo bien facha
  void _mostrarMensaje(String texto, {Color? color}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          texto,
          style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white),
        ),
        backgroundColor: color ?? const Color(0xFF0EA5E9),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  // Login real contra el backend: valida email y contraseña en el servidor
  // y guarda el token de sesión que autoriza las operaciones de portería.
  Future<void> _iniciarConCredenciales() async {
    final emailIngresado = _controlUsuario.text.trim().toLowerCase();
    final contrasenaIngresada = _controlContrasena.text;

    if (emailIngresado.isEmpty || contrasenaIngresada.isEmpty) {
      _mostrarMensaje('Completá el email y la contraseña.', color: Colors.orangeAccent);
      return;
    }

    try {
      final respuesta = await http.post(
        Uri.parse('$apiBase/auth/login'),
        headers: cabecerasApi(),
        body: jsonEncode({'email': emailIngresado, 'password': contrasenaIngresada}),
      );

      final datos = jsonDecode(respuesta.body) as Map<String, dynamic>;

      if (respuesta.statusCode != 200) {
        _mostrarMensaje(
          datos['error']?.toString() ?? 'Usuario o contraseña incorrectos.',
          color: Colors.redAccent,
        );
        return;
      }

      tokenSesion = datos['token'] as String?;

      final infoUsuario = datos['usuario'] as Map<String, dynamic>? ?? {};
      final usuario = UsuarioSigic(
        usuario: infoUsuario['nombre']?.toString() ?? emailIngresado,
        contrasena: '',
        rol: infoUsuario['rol']?.toString() ?? 'PORTERIA',
      );

      if (!mounted) return;
      _entrarALaApp(usuario, 'Usuario y contraseña');
    } catch (_) {
      _mostrarMensaje('Sin conexión al servidor. Revisá la URL de la API.', color: Colors.orange);
    }
  }

  // Armo el código temporal OTP de mentira para poder probarlo al toque
  void _generarOtpDemo() {
    if (_usuarioOtpSeleccionado == null) {
      _mostrarMensaje('Elegí un usuario primero de la lista.', color: Colors.orangeAccent);
      return;
    }

    final codigo = (Random().nextInt(900000) + 100000).toString();
    setState(() {
      _otpParaUsuario = _usuarioOtpSeleccionado;
      _codigoOtp = codigo;
    });

    _mostrarMensaje('OTP generado para $_otpParaUsuario: $codigo', color: const Color(0xFF0EA5E9));
  }

  // Compruebo que el OTP coincida con el generado anteriormente
  void _iniciarConOtp() {
    if (_usuarioOtpSeleccionado == null || _codigoOtp == null || _otpParaUsuario == null) {
      _mostrarMensaje('Tenés que generar un OTP de prueba primero.', color: Colors.orangeAccent);
      return;
    }

    if (_usuarioOtpSeleccionado != _otpParaUsuario) {
      _mostrarMensaje('Este código pertenece a otro usuario.', color: Colors.redAccent);
      return;
    }

    if (_controlOtp.text.trim() != _codigoOtp) {
      _mostrarMensaje('El código OTP ingresado es inválido.', color: Colors.redAccent);
      return;
    }

    final usuario = usuariosDemo.firstWhere((u) => u.usuario == _usuarioOtpSeleccionado);
    _mostrarMensaje(
      'Modo demostración: el servidor rechazará los escaneos sin un login real.',
      color: Colors.orangeAccent,
    );
    _entrarALaApp(usuario, 'OTP demo');
  }

  // Valido el código del código QR
  void _iniciarConQr(String contenido) {
    final normalizado = contenido.trim();
    if (!normalizado.startsWith('SIGIC-LOGIN:')) {
      _mostrarMensaje('El código QR escaneado no sirve para loguearse.', color: Colors.redAccent);
      return;
    }

    final usuarioQr = normalizado.replaceFirst('SIGIC-LOGIN:', '').trim().toLowerCase();
    final usuario = usuariosDemo.where((u) => u.usuario == usuarioQr).firstOrNull;

    if (usuario == null) {
      _mostrarMensaje('No pudimos encontrar al usuario del QR en el sistema.', color: Colors.redAccent);
      return;
    }

    _mostrarMensaje(
      'Modo demostración: el servidor rechazará los escaneos sin un login real.',
      color: Colors.orangeAccent,
    );
    _entrarALaApp(usuario, 'QR');
  }

  // Helper para armar los inputs del formulario y que queden bien pulidos
  InputDecoration _decoracionCampo({
    required String etiqueta,
    required IconData icono,
    Widget? sufijo,
  }) {
    return InputDecoration(
      labelText: etiqueta,
      labelStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
      prefixIcon: Icon(icono, color: const Color(0xFF0EA5E9)),
      suffixIcon: sufijo,
      filled: true,
      fillColor: const Color(0xFF0F172A),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFF334155), width: 1),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFF0EA5E9), width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Colors.redAccent, width: 1),
      ),
    );
  }

  // Helper para crear botones primarios facheros con degradados modernos
  Widget _botonGradiente({
    required VoidCallback alPresionar,
    required IconData icono,
    required String texto,
  }) {
    return Container(
      width: double.infinity,
      height: 52,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: const LinearGradient(
          colors: [Color(0xFF0EA5E9), Color(0xFF2563EB)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0EA5E9).withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ElevatedButton.icon(
        onPressed: alPresionar,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        icon: Icon(icono, color: Colors.white),
        label: Text(
          texto,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.8,
          ),
        ),
      ),
    );
  }

  // Selector personalizado de métodos de login (tipo cápsula flotante)
  Widget _construirSelectorMetodos() {
    final metodos = <String, String>{
      'credenciales': 'Usuario',
      'qr': 'Código QR',
      'otp': 'Acceso OTP',
    };

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF334155), width: 1),
      ),
      padding: const EdgeInsets.all(4),
      child: Row(
        children: metodos.entries.map((entrada) {
          final seleccionado = _metodo == entrada.key;
          return Expanded(
            child: GestureDetector(
              onTap: () {
                setState(() {
                  _metodo = entrada.key;
                });
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  gradient: seleccionado
                      ? const LinearGradient(
                          colors: [Color(0xFF0EA5E9), Color(0xFF2563EB)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        )
                      : null,
                ),
                child: Center(
                  child: Text(
                    entrada.value,
                    style: TextStyle(
                      color: seleccionado ? Colors.white : const Color(0xFF94A3B8),
                      fontWeight: seleccionado ? FontWeight.bold : FontWeight.normal,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  // Formulario clásico de toda la vida
  Widget _bloqueCredenciales() {
    return Column(
      children: [
        TextField(
          controller: _controlUsuario,
          style: const TextStyle(color: Colors.white),
          decoration: _decoracionCampo(
            etiqueta: 'Email del Sistema',
            icono: LucideIcons.user,
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _controlContrasena,
          obscureText: true,
          style: const TextStyle(color: Colors.white),
          decoration: _decoracionCampo(
            etiqueta: 'Contraseña de Acceso',
            icono: LucideIcons.lock,
          ),
        ),
        const SizedBox(height: 24),
        _botonGradiente(
          alPresionar: _iniciarConCredenciales,
          icono: LucideIcons.logIn,
          texto: 'INICIAR SESIÓN',
        ),
      ],
    );
  }

  // El scanner QR con el marco tecnológico de neón
  Widget _bloqueQr() {
    return Column(
      children: [
        const Text(
          'Mostrá el código QR de login frente a la cámara:',
          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 16),
        Container(
          height: 260,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0xFF334155), width: 1.5),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.4),
                blurRadius: 15,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(22),
            child: Stack(
              children: [
                MobileScanner(
                  controller: _controlQrLogin,
                  onDetect: (captura) {
                    final codigo = captura.barcodes.firstOrNull?.rawValue;
                    if (codigo != null) {
                      _controlQrLogin.stop();
                      _iniciarConQr(codigo);
                      Timer(const Duration(seconds: 2), () {
                        if (mounted && _metodo == 'qr') _controlQrLogin.start();
                      });
                    }
                  },
                ),
                // Un borde de color cyan para enfocar la cámara
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: const Color(0xFF0EA5E9).withOpacity(0.5),
                        width: 4,
                      ),
                      borderRadius: BorderRadius.circular(22),
                    ),
                  ),
                ),
                // Línea facha de escaneo para darle toque moderno
                Align(
                  alignment: Alignment.center,
                  child: Container(
                    width: double.infinity,
                    height: 2,
                    color: const Color(0xFF0EA5E9),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Formato esperado: SIGIC-LOGIN:<usuario>',
          style: TextStyle(color: Color(0xFF64748B), fontSize: 11),
        ),
      ],
    );
  }

  // Panel para iniciar sesión con un código temporal
  Widget _bloqueOtp() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '1. Elegí el usuario para generar el código temporal:',
          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          value: _usuarioOtpSeleccionado,
          dropdownColor: const Color(0xFF0F172A),
          decoration: _decoracionCampo(
            etiqueta: 'Usuario Seleccionado',
            icono: LucideIcons.userCheck,
          ),
          items: usuariosDemo
              .map((u) => DropdownMenuItem<String>(
                    value: u.usuario,
                    child: Text(
                      '${u.usuario} (${u.rol})',
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                    ),
                  ))
              .toList(),
          onChanged: (valor) => setState(() => _usuarioOtpSeleccionado = valor),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: OutlinedButton.icon(
            onPressed: _generarOtpDemo,
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFF38BDF8), width: 1.5),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            icon: const Icon(LucideIcons.keyRound, color: Color(0xFF38BDF8), size: 18),
            label: const Text(
              'GENERAR CÓDIGO OTP DEMO',
              style: TextStyle(
                color: Color(0xFF38BDF8),
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),
        const Text(
          '2. Ingresá el código OTP que se generó:',
          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _controlOtp,
          keyboardType: TextInputType.number,
          style: const TextStyle(color: Colors.white),
          decoration: _decoracionCampo(
            etiqueta: 'Código de 6 dígitos',
            icono: LucideIcons.shieldCheck,
          ),
        ),
        const SizedBox(height: 20),
        _botonGradiente(
          alPresionar: _iniciarConOtp,
          icono: LucideIcons.logIn,
          texto: 'VALIDAR CÓDIGO E INGRESAR',
        ),
      ],
    );
  }

  // Panel expansible facha para loguearnos de un solo toque sin escribir (Consola de pruebas)
  Widget _construirPanelDemo() {
    return Theme(
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        title: Row(
          children: const [
            Icon(LucideIcons.terminal, color: Color(0xFF38BDF8), size: 16),
            SizedBox(width: 8),
            Text(
              'Consola de Acceso Rápido (Demo)',
              style: TextStyle(
                color: Color(0xFF38BDF8),
                fontSize: 13,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF1E293B), width: 1),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Hacé tap en cualquier perfil para cargar los campos automáticamente:',
                  style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: usuariosDemo.map((u) {
                    return ActionChip(
                      backgroundColor: const Color(0xFF1E293B),
                      side: BorderSide(
                        color: const Color(0xFF38BDF8).withOpacity(0.3),
                        width: 1,
                      ),
                      label: Text(
                        '${u.usuario} (${u.rol})',
                        style: const TextStyle(
                          color: Color(0xFF38BDF8),
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      onPressed: () {
                        setState(() {
                          _controlUsuario.text = u.usuario;
                          _controlContrasena.text = u.contrasena;
                          _usuarioOtpSeleccionado = u.usuario;
                          _metodo = 'credenciales';
                        });
                        _mostrarMensaje(
                          'Datos de demo cargados para: ${u.usuario}',
                          color: const Color(0xFF0EA5E9),
                        );
                      },
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.settings, color: Color(0xFF0EA5E9)),
            tooltip: 'Configurar Servidor',
            onPressed: _abrirConfiguracionServidor,
          ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Color(0xFF0A0E1A),
              Color(0xFF0F172A),
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 450),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // El Logo Oficial en formato redondo y flotante
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [Color(0xFF0EA5E9), Color(0xFF2563EB)],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF0EA5E9).withOpacity(0.3),
                            blurRadius: 20,
                            spreadRadius: 2,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: CircleAvatar(
                        radius: 44,
                        backgroundColor: const Color(0xFF0F172A),
                        child: ClipOval(
                          child: Image.asset(
                            'assets/icon.png',
                            width: 76,
                            height: 76,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return const Icon(
                                LucideIcons.shieldAlert,
                                size: 36,
                                color: Color(0xFF0EA5E9),
                              );
                            },
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'SiGIC',
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2.0,
                        color: Colors.white,
                      ),
                    ),
                    const Text(
                      'SISTEMA DE CONTROL DE PORTERÍA',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                        color: Color(0xFF0EA5E9),
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Tarjeta Principal Glassmorphic
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B).withOpacity(0.65),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: const Color(0xFF38BDF8).withOpacity(0.15),
                          width: 1.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.3),
                            blurRadius: 25,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Ingreso de Personal',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Elegí el método deseado para validar tu ingreso:',
                            style: TextStyle(
                              fontSize: 12,
                              color: Color(0xFF94A3B8),
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Selector tipo pastilla animada
                          _construirSelectorMetodos(),
                          const SizedBox(height: 24),

                          // Formulario según el método seleccionado con transiciones suaves
                          AnimatedSwitcher(
                            duration: const Duration(milliseconds: 250),
                            child: _metodo == 'credenciales'
                                ? _bloqueCredenciales()
                                : _metodo == 'qr'
                                    ? _bloqueQr()
                                    : _bloqueOtp(),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // La consola oculta para iniciar sesión rápido
                    _construirPanelDemo(),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class PantallaPorteria extends StatefulWidget {
  const PantallaPorteria({super.key, required this.usuario, required this.viaLogin});

  final UsuarioSigic usuario;
  final String viaLogin;

  @override
  State<PantallaPorteria> createState() => _PantallaPorteriaState();
}

class _PantallaPorteriaState extends State<PantallaPorteria> {
  bool escaneando = true;
  bool cargando = false;
  final TextEditingController _controlManual = TextEditingController();
  final MobileScannerController _controlEscaner = MobileScannerController();

  @override
  void dispose() {
    _controlManual.dispose();
    _controlEscaner.dispose();
    super.dispose();
  }

  Future<void> _validarIngreso(String codigo) async {
    if (cargando || codigo.trim().isEmpty) return;

    setState(() => cargando = true);
    _controlEscaner.stop();

    try {
      final respuesta = await http.get(
        Uri.parse('$apiBase/invitados/buscar/$codigo'),
        headers: cabecerasApi(),
      );

      if (respuesta.statusCode == 200) {
        final datos = jsonDecode(respuesta.body);
        if (datos['tipo'] == 'individual') {
          await _confirmarPresente(datos['datos']['id'], datos['datos']['nombre']);
        } else {
          _mostrarDialogoGrupo(datos);
        }
      } else {
        final datosError = jsonDecode(respuesta.body);
        _mostrarEstado('Error', datosError['error'] ?? 'No válido', Colors.red);
      }
    } catch (_) {
      _mostrarEstado('Error', 'Sin conexión al servidor', Colors.orange);
    } finally {
      setState(() => cargando = false);
      if (escaneando) _controlEscaner.start();
    }
  }

  Future<void> _confirmarPresente(String id, String nombre) async {
    final respuesta = await http.put(
      Uri.parse('$apiBase/invitados/$id/presente'),
      headers: cabecerasApi(),
    );
    if (respuesta.statusCode == 200) {
      _mostrarEstado('Acceso OK', nombre, Colors.green);
    } else {
      final datosError = jsonDecode(respuesta.body);
      _mostrarEstado('Error', datosError['error'] ?? 'No se pudo confirmar el ingreso', Colors.red);
    }
  }

  void _mostrarDialogoGrupo(Map<String, dynamic> datos) {
    showDialog<void>(
      context: context,
      builder: (contexto) => AlertDialog(
        title: Text('Grupo: ${datos['egresado']['nombre']}'),
        content: const Text('¿Validar a todos los invitados?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(contexto), child: const Text('NO')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(contexto);
              final ids = (datos['invitados'] as List).map((invitado) => invitado['id']).toList();
              _confirmarPresenteMasivo(ids);
            },
            child: const Text('SÍ, TODOS'),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmarPresenteMasivo(List<dynamic> ids) async {
    setState(() => cargando = true);
    try {
      final respuesta = await http.put(
        Uri.parse('$apiBase/invitados/presente-masivo'),
        headers: cabecerasApi(),
        body: jsonEncode({'ids': ids}),
      );
      if (respuesta.statusCode == 200) {
        _mostrarEstado('Éxito', 'Ingreso grupal completado', Colors.green);
      }
    } finally {
      setState(() => cargando = false);
    }
  }

  void _mostrarEstado(String titulo, String mensaje, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$titulo: $mensaje', style: const TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _cerrarSesion() async {
    tokenSesion = null;
    await _controlEscaner.stop();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const PantallaLogin()),
      (ruta) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('PORTERÍA SiGIC', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.2)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        actions: [
          IconButton(
            tooltip: 'Cerrar sesión',
            onPressed: _cerrarSesion,
            icon: const Icon(LucideIcons.logOut),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                'Sesión: ${widget.usuario.usuario} | Rol: ${widget.usuario.rol} | Vía: ${widget.viaLogin}',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: SegmentedButton<bool>(
              segments: const [
                ButtonSegment(value: true, label: Text('Escáner QR'), icon: Icon(LucideIcons.qrCode)),
                ButtonSegment(value: false, label: Text('Manual'), icon: Icon(LucideIcons.edit)),
              ],
              selected: {escaneando},
              onSelectionChanged: (seleccion) => setState(() => escaneando = seleccion.first),
            ),
          ),
          Expanded(
            child: escaneando
                ? Stack(
                    children: [
                      MobileScanner(
                        controller: _controlEscaner,
                        onDetect: (captura) {
                          final valor = captura.barcodes.firstOrNull?.rawValue;
                          if (valor != null) _validarIngreso(valor);
                        },
                      ),
                      Center(
                        child: Container(
                          width: 250,
                          height: 250,
                          decoration: BoxDecoration(
                            border: Border.all(color: const Color(0xFF0EA5E9), width: 2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                      ),
                    ],
                  )
                : Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(LucideIcons.layoutGrid, size: 64, color: Color(0xFF0EA5E9)),
                        const SizedBox(height: 24),
                        TextField(
                          controller: _controlManual,
                          decoration: InputDecoration(
                            labelText: 'Código o DNI',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(15)),
                            filled: true,
                            fillColor: const Color(0xFF1E293B),
                          ),
                          textCapitalization: TextCapitalization.characters,
                          onSubmitted: _validarIngreso,
                        ),
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          height: 55,
                          child: ElevatedButton(
                            onPressed: () => _validarIngreso(_controlManual.text),
                            child: const Text('VERIFICAR INGRESO'),
                          ),
                        ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
      floatingActionButton: cargando
          ? const FloatingActionButton(onPressed: null, child: CircularProgressIndicator())
          : null,
    );
  }
}
