import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'nucleo/tema/tema_sigic.dart';
import 'nucleo/tema/controlador_tema.dart';
import 'pantallas/pantalla_principal.dart';

class AplicacionSigic extends StatelessWidget {
  const AplicacionSigic({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: modoTemaSigic,
      builder: (context, modoTema, _) => MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'SiGIC Accesos',
        locale: const Locale('es', 'AR'),
        supportedLocales: const [Locale('es', 'AR'), Locale('es')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        theme: TemaSigic.temaClaro,
        darkTheme: TemaSigic.temaOscuro,
        themeMode: modoTema,
        home: const PantallaPrincipal(),
      ),
    );
  }
}
