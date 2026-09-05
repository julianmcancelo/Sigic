import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../modelos/ceremonia.dart';
import '../modelos/ceremonia_autorizada.dart';
import '../modelos/estadisticas_acceso.dart';
import '../modelos/grupo_asistencia.dart';
import '../modelos/resultado_escaneo.dart';
import '../modelos/usuario_sesion.dart';
import 'servicio_almacenamiento.dart';

class ServicioApi {
  ServicioApi(this._almacenamiento);

  static const String urlBasePorDefecto = 'https://sigic-one.vercel.app/api';
  static const String urlBaseDemo = 'https://demo.sigic.com.ar/api';

  final ServicioAlmacenamiento _almacenamiento;

  bool esDireccionLocal(String url) {
    return RegExp(
      r':\/\/(localhost|127\.0\.0\.1)(:|\/|$)',
      caseSensitive: false,
    ).hasMatch(_normalizarApiUrl(url));
  }

  Future<String> obtenerApiUrl() async {
    return _normalizarApiUrl(await _almacenamiento.obtenerApiUrl() ?? urlBasePorDefecto);
  }

  Future<void> guardarApiUrl(String url) async {
    final nueva = _normalizarApiUrl(url);
    final anterior = await _almacenamiento.obtenerApiUrl() ?? urlBasePorDefecto;
    if (nueva != anterior) await _almacenamiento.limpiarSesion();
    await _almacenamiento.guardarApiUrl(nueva);
  }

  Future<UsuarioSesion?> obtenerUsuarioLocal() async {
    return _almacenamiento.obtenerUsuario();
  }

  Future<void> usarEntornoDemo() => guardarApiUrl(urlBaseDemo);

  Future<void> usarEntornoProduccion() => guardarApiUrl(urlBasePorDefecto);

  bool esEntornoDemo(String url) => _normalizarApiUrl(url) == urlBaseDemo;

  bool esEntornoProduccion(String url) =>
      _normalizarApiUrl(url) == urlBasePorDefecto;

  Future<UsuarioSesion> iniciarSesionDemo() async {
    await usarEntornoDemo();
    return iniciarSesionConCredenciales(
      email: 'admin@demo.com',
      contrasena: 'Demo1234',
    );
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
      (datos['usuario'] as Map?)?.cast<String, dynamic>() ??
          <String, dynamic>{},
    );
    const rolesPermitidos = {
      'ADMINISTRATIVO',
      'PORTERIA',
    };
    if (!rolesPermitidos.contains(usuario.rol.toUpperCase())) {
      await cerrarSesion();
      throw Exception(
        'Esta cuenta no tiene permisos para utilizar SiGIC Accesos.',
      );
    }
    await _almacenamiento.guardarUsuario(usuario);
    await registrarDispositivo();
    return usuario;
  }

  Future<UsuarioSesion?> obtenerUsuarioGuardado() {
    return _almacenamiento.obtenerUsuario();
  }

  Future<String?> obtenerTokenGuardado() {
    return _almacenamiento.obtenerToken();
  }

  Future<void> registrarDispositivo() async {
    final token = await _almacenamiento.obtenerToken();
    if (token == null || token.isEmpty) return;

    try {
      final devId = await _almacenamiento.obtenerODispositivoId();
      final sistema = Platform.isAndroid ? 'Android' : (Platform.isIOS ? 'iOS' : Platform.operatingSystem);
      final versionSO = Platform.operatingSystemVersion;

      await _request(
        '/dispositivos/registrar',
        metodo: 'POST',
        cuerpo: {
          'dispositivoId': devId,
          'marca': Platform.isAndroid ? 'Android Device' : 'Apple Device',
          'fabricante': Platform.isAndroid ? 'Google/Android' : 'Apple',
          'modelo': versionSO.length > 60 ? versionSO.substring(0, 60) : versionSO,
          'nombreDispositivo': 'SiGIC Accesos Mobile ($sistema)',
          'sistema': sistema,
          'versionSistema': versionSO,
          'tipoDispositivo': 'Telefono',
          'versionApp': '1.0.5+6',
          'esDispositivoReal': true,
        },
      );
    } catch (_) {
      // Registrar silenciosamente en background
    }
  }

  Future<void> pingDispositivo() async {
    await registrarDispositivo();
  }

  Future<void> cerrarSesion() async {
    await _almacenamiento.limpiarSesion();
  }

  Future<void> cerrarSesionDispositivo() async {
    final token = await _almacenamiento.obtenerToken();
    if (token != null && token.isNotEmpty) {
      try {
        final devId = await _almacenamiento.obtenerODispositivoId();
        await _request(
          '/dispositivos/desvincular',
          metodo: 'POST',
          cuerpo: {'dispositivoId': devId},
        );
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
        .map(
          (item) => CeremoniaAutorizada.desdeMapa(
            (item as Map).cast<String, dynamic>(),
          ),
        )
        .toList();
  }

  Future<Map<String, dynamic>> activarCeremonia(String id) async {
    final respuesta = await _request('/ceremonias/$id/activar', metodo: 'PUT');
    return (respuesta as Map).cast<String, dynamic>();
  }

  Future<EstadisticasAcceso> obtenerEstadisticas() async {
    final datos = await _request('/stats');
    return EstadisticasAcceso.desdeMapa(datos);
  }

  Future<List<GrupoAsistencia>> obtenerAsistencia() async {
    final datos = await _request('/asistencia');
    if (datos is! List<dynamic>) return [];
    return datos
        .map(
          (item) =>
              GrupoAsistencia.desdeMapa((item as Map).cast<String, dynamic>()),
        )
        .toList();
  }

  Future<ResultadoEscaneo> buscarInvitadoOGrupo(String codigo) async {
    final codigoLimpio = codigo.trim();
    try {
      final datos = await _request(
        '/invitados/buscar',
        metodo: 'POST',
        cuerpo: {'codigo': codigoLimpio},
      );
      return ResultadoEscaneo.desdeMapa(
        (datos as Map).cast<String, dynamic>(),
      );
    } catch (_) {
      final codigoNormalizado = Uri.encodeComponent(codigoLimpio);
      final datos = await _request('/invitados/buscar/$codigoNormalizado');
      return ResultadoEscaneo.desdeMapa(
        (datos as Map).cast<String, dynamic>(),
      );
    }
  }

  Future<Map<String, dynamic>> acreditarInvitado(String id) async {
    final respuesta = await _request('/invitados/$id/presente', metodo: 'PUT');
    return (respuesta as Map).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>> acreditarGraduado(String id) async {
    final respuesta = await _request('/egresados/$id/presente', metodo: 'PUT');
    return (respuesta as Map).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>> acreditarInvitadosMasivo(
    List<String> ids,
  ) async {
    final respuesta = await _request(
      '/invitados/presente-masivo',
      metodo: 'PUT',
      cuerpo: {'ids': ids},
    );
    return (respuesta as Map).cast<String, dynamic>();
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
    const timeout = Duration(seconds: 8);
    late final http.Response respuesta;
    switch (metodo) {
      case 'POST':
        respuesta = await http.post(
          uri,
          headers: encabezados,
          body: jsonEncode(cuerpo ?? {}),
        ).timeout(timeout);
        break;
      case 'PUT':
        respuesta = await http.put(
          uri,
          headers: encabezados,
          body: jsonEncode(cuerpo ?? {}),
        ).timeout(timeout);
        break;
      default:
        respuesta = await http.get(uri, headers: encabezados).timeout(timeout);
    }

    final json = _decodificarRespuesta(respuesta);
    if (!_esExitosa(respuesta.statusCode)) {
      if (respuesta.statusCode == 401) {
        await cerrarSesion();
      }
      throw Exception(
        (json['error'] ?? 'Error en la peticion al servidor').toString(),
      );
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
    final uri = Uri.tryParse(valor);
    if (uri == null || uri.scheme != 'https' || uri.host.isEmpty || uri.userInfo.isNotEmpty || uri.hasQuery || uri.hasFragment) {
      throw Exception('Ingresá una dirección HTTPS válida para el servidor.');
    }
    valor = valor.replaceAll(RegExp(r'/$'), '');
    if (!valor.endsWith('/api')) {
      valor = '$valor/api';
    }
    return valor;
  }
}
