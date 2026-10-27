import 'package:flutter/material.dart';

import '../nucleo/tema/tema_sigic.dart';

class PantallaInicioSistema extends StatefulWidget {
  const PantallaInicioSistema({
    super.key,
    required this.estado,
    this.alBuscarActualizaciones,
    this.alContinuar,
    this.buscando = false,
  });

  final String estado;
  final Future<void> Function()? alBuscarActualizaciones;
  final VoidCallback? alContinuar;
  final bool buscando;

  @override
  State<PantallaInicioSistema> createState() => _PantallaInicioSistemaState();
}

class _PantallaInicioSistemaState extends State<PantallaInicioSistema>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controladorAnimacion;
  late final Animation<double> _animacionResplandor;
  late final Animation<double> _animacionEscala;

  @override
  void initState() {
    super.initState();
    _controladorAnimacion = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat(reverse: true);

    _animacionResplandor = Tween<double>(begin: 0.35, end: 0.90).animate(
      CurvedAnimation(
        parent: _controladorAnimacion,
        curve: Curves.easeInOutSine,
      ),
    );

    _animacionEscala = Tween<double>(begin: 0.98, end: 1.02).animate(
      CurvedAnimation(
        parent: _controladorAnimacion,
        curve: Curves.easeInOutSine,
      ),
    );
  }

  @override
  void dispose() {
    _controladorAnimacion.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF040D17),
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(0.0, -0.2),
            radius: 1.2,
            colors: [
              Color(0xFF0F2B48),
              Color(0xFF071829),
              Color(0xFF030A12),
            ],
            stops: [0.0, 0.55, 1.0],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Encabezado Institucional ITB
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 9,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.12),
                              ),
                            ),
                            child: const Text(
                              'INSTITUTO TECNOLÓGICO BELTRÁN',
                              style: TextStyle(
                                color: Color(0xFF7DD3FC),
                                fontSize: 9.5,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.8,
                              ),
                            ),
                          ),
                          const SizedBox(height: 5),
                          const Text(
                            'Tecnicatura Superior en Analista de Sistemas',
                            style: TextStyle(
                              color: Color(0xFF94A3B8),
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0284C7).withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: const Color(0xFF0284C7).withValues(alpha: 0.35),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: const BoxDecoration(
                              color: Color(0xFF10B981),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Text(
                            'v1.0.9 (Build 10)',
                            style: TextStyle(
                              color: Color(0xFFE0F2FE),
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const Spacer(flex: 3),

                // Centro: Logotipo animado y jerarquía institucional
                Center(
                  child: Column(
                    children: [
                      AnimatedBuilder(
                        animation: _controladorAnimacion,
                        builder: (context, _) => Transform.scale(
                          scale: _animacionEscala.value,
                          child: SizedBox(
                            width: 130,
                            height: 130,
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                Opacity(
                                  opacity: _animacionResplandor.value,
                                  child: Image.asset(
                                    'assets/imagenes/logo-glow.png',
                                    width: 130,
                                    height: 130,
                                    fit: BoxFit.contain,
                                  ),
                                ),
                                Container(
                                  width: 80,
                                  height: 80,
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(22),
                                    boxShadow: [
                                      BoxShadow(
                                        color: const Color(0xFF0284C7)
                                            .withValues(alpha: 0.28),
                                        blurRadius: 26,
                                        spreadRadius: 2,
                                        offset: const Offset(0, 8),
                                      ),
                                    ],
                                  ),
                                  child: Image.asset(
                                    'assets/imagenes/logo-oficial.png',
                                    fit: BoxFit.contain,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 22),
                      const Text(
                        'SiGIC',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 36,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Sistema de Gestión Institucional de Colaciones',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Color(0xFFBAE6FD),
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 11,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.10),
                          ),
                        ),
                        child: const Text(
                          'Módulo de Portería & Control de Accesos',
                          style: TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const Spacer(flex: 4),

                // Tarjeta de Estado y Diagnóstico de Inicio
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0A1828).withValues(alpha: 0.85),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: const Color(0xFF38BDF8).withValues(alpha: 0.18),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.35),
                        blurRadius: 18,
                        offset: const Offset(0, 6),
                      ),
                    ],
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
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              widget.estado,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const LinearProgressIndicator(
                        minHeight: 3,
                        backgroundColor: Color(0xFF132B42),
                        valueColor: AlwaysStoppedAnimation(
                          TemaSigic.azulBrillante,
                        ),
                      ),
                      const SizedBox(height: 12),
                      // Fila de 3 etapas de inicialización
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _EtapaInicio(
                            etiqueta: 'Entorno',
                            activa: true,
                          ),
                          _EtapaInicio(
                            etiqueta: 'Shorebird OTA',
                            activa: true,
                          ),
                          _EtapaInicio(
                            etiqueta: 'Caché Local',
                            activa: true,
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      const Divider(color: Colors.white10, height: 1),
                      const SizedBox(height: 8),
                      const Text(
                        'En caso de contingencia de red, el sistema opera con el padrón local en caché y sincronización diferida.',
                        style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 10.5,
                          height: 1.35,
                        ),
                      ),
                      if (widget.alBuscarActualizaciones != null || widget.alContinuar != null) ...[
                        const SizedBox(height: 14),
                        Row(
                          children: [
                            if (widget.alBuscarActualizaciones != null)
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: widget.buscando ? null : widget.alBuscarActualizaciones,
                                  style: OutlinedButton.styleFrom(
                                    side: const BorderSide(color: Color(0xFF38BDF8), width: 1.2),
                                    foregroundColor: const Color(0xFFE0F2FE),
                                    padding: const EdgeInsets.symmetric(vertical: 10),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                  icon: widget.buscando
                                      ? const SizedBox(
                                          width: 14,
                                          height: 14,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Color(0xFF38BDF8),
                                          ),
                                        )
                                      : const Icon(Icons.sync_rounded, size: 16, color: Color(0xFF38BDF8)),
                                  label: Text(
                                    widget.buscando ? 'Buscando...' : 'Buscar Actualizaciones',
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                                  ),
                                ),
                              ),
                            if (widget.alContinuar != null) ...[
                              const SizedBox(width: 8),
                              FilledButton.icon(
                                onPressed: widget.alContinuar,
                                style: FilledButton.styleFrom(
                                  backgroundColor: const Color(0xFF0284C7),
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                icon: const Icon(Icons.arrow_forward_rounded, size: 16),
                                label: const Text(
                                  'Ingresar',
                                  style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 14),

                // Pie Institucional
                const Center(
                  child: Text(
                    'Instituto Tecnológico Beltrán · Avellaneda, Buenos Aires\nDistribución Segura vía Shorebird CodePush',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Color(0xFF64748B),
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                      height: 1.4,
                    ),
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

class _EtapaInicio extends StatelessWidget {
  const _EtapaInicio({
    required this.etiqueta,
    required this.activa,
  });

  final String etiqueta;
  final bool activa;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 5,
          height: 5,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: activa ? const Color(0xFF38BDF8) : const Color(0xFF64748B),
          ),
        ),
        const SizedBox(width: 5),
        Text(
          etiqueta,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: activa ? const Color(0xFFBAE6FD) : const Color(0xFF64748B),
          ),
        ),
      ],
    );
  }
}
