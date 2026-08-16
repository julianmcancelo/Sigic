import 'package:shorebird_code_push/shorebird_code_push.dart';

class ServicioShorebird {
  final ShorebirdUpdater _actualizador = ShorebirdUpdater();

  Future<String?> buscarYDescargarActualizacion() async {
    try {
      final estado = await _actualizador.checkForUpdate();
      if (estado == UpdateStatus.outdated) {
        await _actualizador.update();
        return 'Actualizacion descargada. Se aplicara al reiniciar la aplicacion.';
      }
      if (estado == UpdateStatus.restartRequired) {
        return 'Hay una actualizacion lista para aplicarse al reiniciar.';
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<int?> obtenerParcheActual() async {
    try {
      final parche = await _actualizador.readCurrentPatch();
      return parche?.number;
    } catch (_) {
      return null;
    }
  }
}
