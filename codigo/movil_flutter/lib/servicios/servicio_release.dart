import 'dart:convert';

import 'package:http/http.dart' as http;

class ReleaseDisponible {
  const ReleaseDisponible({
    required this.version,
    required this.apkUrl,
    required this.required,
    required this.notes,
  });
  final String version;
  final String apkUrl;
  final bool required;
  final String notes;
}

class ServicioRelease {
  // Versión base de la aplicación Flutter
  static const versionInstalada = '1.0.8+9';
  static const _githubApiUrl =
      'https://api.github.com/repos/julianmcancelo/Sigic/releases/latest';

  Future<ReleaseDisponible?> buscarNuevaRelease() async {
    try {
      final respuesta = await http
          .get(
            Uri.parse(_githubApiUrl),
            headers: {'Accept': 'application/vnd.github+json'},
          )
          .timeout(const Duration(seconds: 5));

      if (respuesta.statusCode == 200) {
        final datos = jsonDecode(respuesta.body) as Map<String, dynamic>;
        final tagName = datos['tag_name']?.toString() ?? '';
        final cleanVersion = tagName.replaceAll(RegExp(r'^movil-v?|^v'), '');
        final assets = datos['assets'] as List<dynamic>? ?? [];
        String apkUrl = '';
        for (final asset in assets) {
          final nombre = asset['name']?.toString().toLowerCase() ?? '';
          if (nombre.endsWith('.apk')) {
            apkUrl = asset['browser_download_url']?.toString() ?? '';
            break;
          }
        }

        if (apkUrl.isNotEmpty && _esPosterior(cleanVersion, versionInstalada)) {
          return ReleaseDisponible(
            version: cleanVersion,
            apkUrl: apkUrl,
            required: false,
            notes:
                datos['body']?.toString() ??
                'Hay una nueva versión disponible en GitHub Releases.',
          );
        }
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  bool _esPosterior(String nueva, String actual) {
    List<int> partes(String valor) =>
        valor
            .split(RegExp(r'[.+]'))
            .map((parte) => int.tryParse(parte) ?? 0)
            .toList();
    final izquierda = partes(nueva), derecha = partes(actual);
    for (var i = 0; i < 4; i++) {
      final a = i < izquierda.length ? izquierda[i] : 0,
          b = i < derecha.length ? derecha[i] : 0;
      if (a != b) return a > b;
    }
    return false;
  }
}
