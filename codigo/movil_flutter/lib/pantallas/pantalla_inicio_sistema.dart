import 'package:flutter/material.dart';

import '../nucleo/tema/tema_sigic.dart';

class PantallaInicioSistema extends StatelessWidget {
  const PantallaInicioSistema({super.key, required this.estado});

  final String estado;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF08131E),
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF102C3D), Color(0xFF08131E)],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.12),
                        ),
                      ),
                      child: const Text(
                        'SiGIC  /  CONTROL DE ACCESOS',
                        style: TextStyle(
                          color: Color(0xFF9FDDEA),
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.1,
                        ),
                      ),
                    ),
                    const Spacer(),
                    const Text(
                      'v1.0.5',
                      style: TextStyle(
                        color: Color(0xFF718A97),
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                SizedBox(
                  width: 112,
                  height: 112,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Image.asset('assets/imagenes/logo-glow.png'),
                      Image.asset(
                        'assets/imagenes/splash-icono.png',
                        width: 48,
                        height: 48,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 22),
                const Text(
                  'SiGIC Accesos',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 30,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.7,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Control de accesos para ceremonias institucionales.',
                  style: TextStyle(color: Color(0xFFB8C8D2), fontSize: 15),
                ),
                const Spacer(),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.075),
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.11),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const SizedBox(
                            width: 17,
                            height: 17,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.2,
                              color: TemaSigic.azulBrillante,
                            ),
                          ),
                          const SizedBox(width: 11),
                          Expanded(
                            child: Text(
                              estado,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const LinearProgressIndicator(
                        minHeight: 4,
                        backgroundColor: Color(0xFF294653),
                        valueColor: AlwaysStoppedAnimation(
                          TemaSigic.azulBrillante,
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Las actualizaciones se verifican de forma segura. Si no hay conexion, podras continuar con las funciones disponibles.',
                        style: TextStyle(
                          color: Color(0xFFAEC0CA),
                          fontSize: 11,
                          height: 1.35,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                const Center(
                  child: Text(
                    'Actualizaciones seguras con Shorebird',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Color(0xFF718A97), fontSize: 10),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
