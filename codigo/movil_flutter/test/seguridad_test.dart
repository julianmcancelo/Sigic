import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:movil_flutter/servicios/servicio_almacenamiento.dart';
import 'package:movil_flutter/servicios/servicio_api.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  test('Descarta tokens anteriores y guarda los nuevos fuera de preferencias', () async {
    SharedPreferences.setMockInitialValues({'sigic_token': 'token-antiguo'});
    final almacenamiento = ServicioAlmacenamiento();
    expect(await almacenamiento.obtenerToken(), isNull);
    await almacenamiento.guardarToken('token-nuevo');
    expect(await almacenamiento.obtenerToken(), 'token-nuevo');
    expect((await SharedPreferences.getInstance()).getString('sigic_token'), isNull);
    await almacenamiento.limpiarSesion();
    expect(await almacenamiento.obtenerToken(), isNull);
  });

  test('Cambiar de servidor borra la sesión para no enviar credenciales a otro origen', () async {
    final almacenamiento = ServicioAlmacenamiento();
    final api = ServicioApi(almacenamiento);
    await almacenamiento.guardarToken('sesion-produccion');
    await api.guardarApiUrl('https://demo.sigic.com.ar');
    expect(await almacenamiento.obtenerToken(), isNull);
    expect(await api.obtenerApiUrl(), 'https://demo.sigic.com.ar/api');
  });

  test('Rechaza servidores HTTP y URLs con credenciales', () async {
    final api = ServicioApi(ServicioAlmacenamiento());
    await expectLater(api.guardarApiUrl('http://example.com'), throwsException);
    await expectLater(api.guardarApiUrl('https://usuario:clave@example.com'), throwsException);
    await api.guardarApiUrl('https://example.com');
    expect(await api.obtenerApiUrl(), 'https://example.com/api');
  });
}
