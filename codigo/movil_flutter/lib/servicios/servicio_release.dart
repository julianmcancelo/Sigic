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
  // Esta es la release base de Shorebird. Los parches OTA no cambian este número.
  static const versionInstalada = '1.0.6+7';
  static const _url = 'https://demo.sigic.com.ar/descargas/sigic-release.json';

  Future<ReleaseDisponible?> buscarNuevaRelease() async {
    try {
      final respuesta = await http
          .get(Uri.parse(_url))
          .timeout(const Duration(seconds: 5));
      if (respuesta.statusCode != 200) return null;
      final datos = jsonDecode(respuesta.body) as Map<String, dynamic>;
      final version = datos['version']?.toString() ?? '';
      if (!_esPosterior(version, versionInstalada)) return null;
      return ReleaseDisponible(
        version: version,
        apkUrl: datos['apkUrl']?.toString() ?? '',
        required: datos['required'] == true,
        notes:
            datos['notes']?.toString() ?? 'Hay una nueva version disponible.',
      );
    } catch (_) {
      return null;
    }
  }

  bool _esPosterior(String nueva, String actual) {
    List<int> partes(String valor) => valor
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
