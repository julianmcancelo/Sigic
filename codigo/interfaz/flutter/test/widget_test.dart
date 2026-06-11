import 'package:flutter_test/flutter_test.dart';
import 'package:sigic_porteria/main.dart';

void main() {
  testWidgets('La pantalla de login se muestra correctamente', (WidgetTester tester) async {
    await tester.pumpWidget(const AplicacionSigic());

    expect(find.text('SiGIC Seguridad - Login'), findsOneWidget);
    expect(find.text('Acceso de personal de seguridad'), findsOneWidget);
  });
}
