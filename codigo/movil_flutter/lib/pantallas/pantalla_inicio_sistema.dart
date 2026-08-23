import 'package:flutter/material.dart';

import '../nucleo/tema/tema_sigic.dart';

class PantallaInicioSistema extends StatelessWidget {
  const PantallaInicioSistema({super.key, required this.estado});

  final String estado;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF071923),
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF102C3D), Color(0xFF071923)],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
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
                    'OPERACIONES  |  CONTROL DE ACCESOS',
                    style: TextStyle(
                      color: Color(0xFF9FDDEA),
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.1,
                    ),
                  ),
                ),
                const Spacer(),
                Container(
                  width: 78,
                  height: 78,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(22),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x4D2DD4E8),
                        blurRadius: 30,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: Image.asset('assets/imagenes/logo-oficial.png'),
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
                  'Preparando una jornada de acreditacion segura.',
                  style: TextStyle(color: Color(0xFFB8C8D2), fontSize: 15),
                ),
                const Spacer(),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.07),
                    borderRadius: BorderRadius.circular(18),
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
                        minHeight: 3,
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
                    'SiGIC Movil v1.0.4  |  Actualizaciones seguras con Shorebird',
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
