import 'package:flutter/material.dart';

class TemaSigic {
  static const Color azulPrincipal = Color(0xFF0E6BA8);
  static const Color azulBrillante = Color(0xFF27A7E7);
  static const Color fondoClaro = Color(0xFFF4F8FC);
  static const Color fondoOscuro = Color(0xFF07111B);
  static const Color exito = Color(0xFF10B981);
  static const Color error = Color(0xFFEF4444);

  static ThemeData get temaClaro {
    final esquema = ColorScheme.fromSeed(
      seedColor: azulPrincipal,
      brightness: Brightness.light,
      primary: azulPrincipal,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: esquema,
      scaffoldBackgroundColor: fondoClaro,
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 3,
        shadowColor: Colors.black12,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: Color(0xFFD5E4F1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: Color(0xFFD5E4F1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: azulPrincipal, width: 1.5),
        ),
      ),
    );
  }

  static ThemeData get temaOscuro {
    final esquema = ColorScheme.fromSeed(
      seedColor: azulBrillante,
      brightness: Brightness.dark,
      primary: azulBrillante,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: esquema,
      scaffoldBackgroundColor: fondoOscuro,
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
      ),
      cardTheme: CardThemeData(
        color: const Color(0xFF0E1B2A),
        elevation: 2,
        shadowColor: Colors.black26,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF102033),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: Color(0xFF1D334A)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: Color(0xFF1D334A)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: azulBrillante, width: 1.5),
        ),
      ),
    );
  }
}
