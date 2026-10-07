import 'package:flutter/services.dart';

class ServicioFeedback {
  /// Feedback al escanear correctamente y acreditar acceso (tono positivo / verde)
  static Future<void> accesoPermitido() async {
    try {
      await HapticFeedback.mediumImpact();
      await SystemSound.play(SystemSoundType.click);
    } catch (_) {}
  }

  /// Feedback cuando la persona ya ingresó o no está habilitada (tono alerta / rojo)
  static Future<void> accesoDenegado() async {
    try {
      await HapticFeedback.heavyImpact();
      await Future<void>.delayed(const Duration(milliseconds: 140));
      await HapticFeedback.heavyImpact();
      await SystemSound.play(SystemSoundType.alert);
    } catch (_) {}
  }

  /// Feedback para toques o acciones secundarias
  static Future<void> toqueLigero() async {
    try {
      await HapticFeedback.lightImpact();
    } catch (_) {}
  }
}
