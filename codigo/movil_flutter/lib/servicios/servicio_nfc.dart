import 'package:flutter/services.dart';

class ServicioNfc {
  static const MethodChannel _canal = MethodChannel(
    'com.sigic.movil_flutter/nfc',
  );

  Future<Map<String, bool>> consultarDisponibilidad() async {
    try {
      final res = await _canal.invokeMethod<Map<dynamic, dynamic>>(
        'disponible',
      );
      return {
        'soportado': res?['soportado'] == true,
        'activo': res?['activo'] == true,
      };
    } catch (_) {
      return {'soportado': false, 'activo': false};
    }
  }

  Future<Map<String, dynamic>> grabarUrlEnTag(String url) async {
    try {
      final res = await _canal.invokeMethod<Map<dynamic, dynamic>>(
        'grabarUrl',
        {'url': url},
      );
      return (res ?? {}).map((k, v) => MapEntry(k.toString(), v));
    } on PlatformException catch (e) {
      throw Exception(e.message ?? 'No se pudo grabar el Tag NFC.');
    }
  }

  Future<Map<String, dynamic>> leerTagFisico() async {
    try {
      final res = await _canal.invokeMethod<Map<dynamic, dynamic>>('leerTag');
      return (res ?? {}).map((k, v) => MapEntry(k.toString(), v));
    } on PlatformException catch (e) {
      throw Exception(e.message ?? 'No se pudo leer el Tag NFC.');
    }
  }

  Future<void> cancelarOperacion() async {
    try {
      await _canal.invokeMethod<void>('cancelar');
    } catch (_) {}
  }
}
