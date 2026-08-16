import 'dart:convert';

import 'package:http/http.dart' as http;

import '../modelos/ceremonia.dart';
import '../modelos/ceremonia_autorizada.dart';
import '../modelos/estadisticas_acceso.dart';
import '../modelos/resultado_escaneo.dart';
import '../modelos/usuario_sesion.dart';
import 'servicio_almacenamiento.dart';

class ServicioApi {
  ServicioApi(this._almacenamiento);

  static const String urlBasePorDefecto = 'https://sigic-one.vercel.app/api';

  final ServicioAlmacenamiento _almacenamiento;

  bool esDireccionLocal(String url) {
    return RegExp(r':\/\/(localhost|127\.0\.0\.1)(:|\/|$)', caseSensitive: false).hasMatch(_normalizarApiUrl(url));
  }

  Future<String> obtenerApiUrl() async {
    return await _almacenamiento.obtenerApiUrl() ?? urlBasePorDefecto;
  }

  Future<void> guardarApiUrl(String url) async {
    await _almacenamiento.guardarApiUrl(_normalizarApiUrl(url));
  }

  Future<bool> probarConexion(String url) async {
    try {
      final objetivo = Uri.parse('${_normalizarApiUrl(url)}/estado');
      final respuesta = await http.get(objetivo);
      if (!_esExitosa(respuesta.statusCode)) {
        return false;
      }
      final json = _decodificarRespuesta(respuesta);
      return json['ok'] == true && json['servicio'] == 'sigic';
    } catch (_) {
      return false;
    }
  }

  Future<UsuarioSesion> iniciarSesionConCredenciales({
    required String email,
    required String contrasena,
  }) async {
    final baseUrl = await obtenerApiUrl();
    final respuesta = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': contrasena}),
    );
    final json = _decodificarRespuesta(respuesta);
    if (!_esExitosa(respuesta.statusCode)) {
      throw Exception((json['error'] ?? 'Credenciales invalidas').toString());
    }

    final token = (json['token'] ?? '').toString();
    await _almacenamiento.guardarToken(token);
    return obtenerSesionActual();
  }

  Future<UsuarioSesion> iniciarSesionConToken(String token) async {
    await _almacenamiento.guardarToken(token);
    try {
      return await obtenerSesionActual();
    } catch (_) {
      await cerrarSesion();
      rethrow;
    }
  }

  Future<UsuarioSesion> obtenerSesionActual() async {
    final datos = await _request('/auth/sesion');
    final usuario = UsuarioSesion.desdeMapa(
      (datos['usuario'] as Map?)?.cast<String, dynamic>() ?? <String, dynamic>{},
    );
    const rolesPermitidos = {'SUPER_ADMIN', 'ADMIN', 'ADMINISTRATIVO', 'PORTERIA'};
    if (!rolesPermitidos.contains(usuario.rol.toUpperCase())) {
      await cerrarSesion();
      throw Exception('Esta cuenta no tiene permisos para utilizar SiGIC Accesos.');
    }
    await _almacenamiento.guardarUsuario(usuario);
    return usuario;
  }

  Future<UsuarioSesion?> obtenerUsuarioGuardado() {
    return _almacenamiento.obtenerUsuario();
  }

  Future<String?> obtenerTokenGuardado() {
    return _almacenamiento.obtenerToken();
  }

  Future<void> cerrarSesion() async {
    await _almacenamiento.limpiarSesion();
  }

  Future<void> cerrarSesionDispositivo() async {
    final token = await _almacenamiento.obtenerToken();
    if (token != null && token.isNotEmpty) {
      try {
        await _request('/dispositivos/desvincular', metodo: 'POST', cuerpo: {
          'dispositivoId': 'flutter-sigic',
        });
      } catch (_) {
        // El cierre local debe continuar aunque el servidor no responda.
      }
    }
    await cerrarSesion();
  }

  Future<Ceremonia?> obtenerCeremoniaActiva() async {
    try {
      final datos = await _request('/ceremonias/activa');
      return Ceremonia.desdeMapa(datos);
    } catch (_) {
      return null;
    }
  }

  Future<List<CeremoniaAutorizada>> obtenerCeremoniasAutorizadas() async {
    final datos = await _request('/ceremonias/autorizadas');
    if (datos is! List<dynamic>) {
      return [];
    }
    final lista = datos;
    return lista
        .map((item) => CeremoniaAutorizada.desdeMapa((item as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<EstadisticasAcceso> obtenerEstadisticas() async {
    final datos = await _request('/stats');
    return EstadisticasAcceso.desdeMapa(datos);
  }

  Future<ResultadoEscaneo> buscarInvitadoOGrupo(String codigo) async {
    final datos = await _request('/invitados/buscar/$codigo');
    return ResultadoEscaneo.desdeMapa(datos);
  }

  Future<void> acreditarInvitado(String id) async {
    await _request('/invitados/$id/presente', metodo: 'PUT');
  }

  Future<void> acreditarInvitadosMasivo(List<String> ids) async {
    await _request('/invitados/presente-masivo', metodo: 'PUT', cuerpo: {'ids': ids});
  }

  Future<dynamic> _request(
    String ruta, {
    String metodo = 'GET',
    Map<String, dynamic>? cuerpo,
  }) async {
    final baseUrl = await obtenerApiUrl();
    final token = await _almacenamiento.obtenerToken();
    final encabezados = <String, String>{
      'Content-Type': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };

    final uri = Uri.parse('$baseUrl$ruta');
    late final http.Response respuesta;
    switch (metodo) {
      case 'POST':
        respuesta = await http.post(uri, headers: encabezados, body: jsonEncode(cuerpo ?? {}));
        break;
      case 'PUT':
        respuesta = await http.put(uri, headers: encabezados, body: jsonEncode(cuerpo ?? {}));
        break;
      default:
        respuesta = await http.get(uri, headers: encabezados);
    }

    final json = _decodificarRespuesta(respuesta);
    if (!_esExitosa(respuesta.statusCode)) {
      if (respuesta.statusCode == 401) {
        await cerrarSesion();
      }
      throw Exception((json['error'] ?? 'Error en la peticion al servidor').toString());
    }
    return json;
  }

  dynamic _decodificarRespuesta(http.Response respuesta) {
    if (respuesta.body.isEmpty) {
      return <String, dynamic>{};
    }
    final decodificado = jsonDecode(respuesta.body);
    if (decodificado is Map<String, dynamic>) {
      return decodificado;
    }
    return decodificado;
  }

  bool _esExitosa(int codigo) => codigo >= 200 && codigo < 300;

  String _normalizarApiUrl(String url) {
    var valor = url.trim();
    if (!valor.startsWith('http://') && !valor.startsWith('https://')) {
      valor = 'https://$valor';
    }
    valor = valor.replaceAll(RegExp(r'/$'), '');
    if (!valor.endsWith('/api')) {
      valor = '$valor/api';
    }
    return valor;
  }
}
