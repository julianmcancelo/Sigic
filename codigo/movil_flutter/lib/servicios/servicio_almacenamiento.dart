import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../modelos/usuario_sesion.dart';

class ServicioAlmacenamiento {
  static const String claveApiUrl = 'sigic_api_url';
  static const String claveToken = 'sigic_token';
  static const String claveUsuario = 'sigic_usuario';

  Future<SharedPreferences> get _preferencias async => SharedPreferences.getInstance();

  Future<String?> obtenerApiUrl() async {
    final preferencias = await _preferencias;
    return preferencias.getString(claveApiUrl);
  }

  Future<void> guardarApiUrl(String url) async {
    final preferencias = await _preferencias;
    await preferencias.setString(claveApiUrl, url);
  }

  Future<String?> obtenerToken() async {
    final preferencias = await _preferencias;
    return preferencias.getString(claveToken);
  }

  Future<void> guardarToken(String token) async {
    final preferencias = await _preferencias;
    await preferencias.setString(claveToken, token);
  }

  Future<UsuarioSesion?> obtenerUsuario() async {
    final preferencias = await _preferencias;
    final texto = preferencias.getString(claveUsuario);
    if (texto == null || texto.isEmpty) {
      return null;
    }
    return UsuarioSesion.desdeMapa(jsonDecode(texto) as Map<String, dynamic>);
  }

  Future<void> guardarUsuario(UsuarioSesion usuario) async {
    final preferencias = await _preferencias;
    await preferencias.setString(claveUsuario, jsonEncode(usuario.aMapa()));
  }

  Future<void> limpiarSesion() async {
    final preferencias = await _preferencias;
    await preferencias.remove(claveToken);
    await preferencias.remove(claveUsuario);
  }
}
