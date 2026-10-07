import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../modelos/estadisticas_acceso.dart';
import '../../nucleo/tema/tema_sigic.dart';

class VisorCamaraWidget extends StatefulWidget {
  const VisorCamaraWidget({
    super.key,
    required this.controlador,
    required this.alDetectarCodigo,
    required this.alCerrar,
    this.estadisticas,
    this.token,
    this.enVivo = false,
  });

  final MobileScannerController controlador;
  final ValueChanged<String> alDetectarCodigo;
  final VoidCallback alCerrar;
  final EstadisticasAcceso? estadisticas;
  final String? token;
  final bool enVivo;

  @override
  State<VisorCamaraWidget> createState() => _VisorCamaraWidgetState();
}

class _VisorCamaraWidgetState extends State<VisorCamaraWidget> {
  bool _linternaEncendida = false;

  Future<void> _alternarLinterna() async {
    try {
      await widget.controlador.toggleTorch();
      setState(() {
        _linternaEncendida = !_linternaEncendida;
      });
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final estadisticas = widget.estadisticas;

    return Stack(
      children: [
        MobileScanner(
          controller: widget.controlador,
          onDetect: (captura) {
            final codigos = captura.barcodes;
            for (final codigo in codigos) {
              final valor = codigo.rawValue;
              if (valor != null && valor.trim().isNotEmpty) {
                widget.alDetectarCodigo(valor.trim());
                break;
              }
            }
          },
        ),
        SafeArea(
          child: Column(
            children: [
              // Barra superior: Cerrar, Linterna, Estadisticas
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    CircleAvatar(
                      backgroundColor: Colors.black.withValues(alpha: 0.55),
                      child: IconButton(
                        icon: const Icon(Icons.arrow_back, color: Colors.white),
                        onPressed: widget.alCerrar,
                      ),
                    ),
                    Row(
                      children: [
                        // Botón de Linterna
                        CircleAvatar(
                          backgroundColor: _linternaEncendida
                              ? const Color(0xFFF59E0B)
                              : Colors.black.withValues(alpha: 0.55),
                          child: IconButton(
                            icon: Icon(
                              _linternaEncendida ? Icons.flash_on : Icons.flash_off,
                              color: Colors.white,
                              size: 20,
                            ),
                            onPressed: _alternarLinterna,
                            tooltip: 'Linterna',
                          ),
                        ),
                        if (estadisticas != null) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 7,
                            ),
                            decoration: BoxDecoration(
                              color: TemaSigic.exito.withValues(alpha: 0.25),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: TemaSigic.exito.withValues(alpha: 0.5),
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 7,
                                  height: 7,
                                  margin: const EdgeInsets.only(right: 6),
                                  decoration: const BoxDecoration(
                                    color: TemaSigic.exito,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                Text(
                                  '${estadisticas.presentes}/${estadisticas.totalInvitados}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              const Spacer(),
              // Marco de encuadre
              Stack(
                alignment: Alignment.center,
                children: [
                  Container(
                    width: 292,
                    height: 292,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(40),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.16),
                        width: 1.4,
                      ),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x66000000),
                          blurRadius: 28,
                          spreadRadius: 4,
                        ),
                      ],
                    ),
                  ),
                  SizedBox(
                    width: 274,
                    height: 274,
                    child: CustomPaint(painter: _MarcoEscanerPainter()),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              // Cartel inferior informativo
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 28),
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 14,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.15),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: TemaSigic.azulBrillante.withValues(alpha: 0.25),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Icon(
                        widget.enVivo
                            ? Icons.autorenew
                            : Icons.center_focus_strong,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        widget.enVivo
                            ? 'Apunta la credencial QR para escanear y validar el ingreso al instante.'
                            : 'Enfoca la credencial digital del graduado o invitado.',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          height: 1.35,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),
            ],
          ),
        ),
      ],
    );
  }
}

class _MarcoEscanerPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    const longitud = 28.0;
    const radio = 18.0;
    final pincel = Paint()
      ..color = const Color(0xFF38BDF8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.5
      ..strokeCap = StrokeCap.round;

    final esquinas = [
      Path()
        ..moveTo(0, longitud)
        ..lineTo(0, radio)
        ..quadraticBezierTo(0, 0, radio, 0)
        ..lineTo(longitud, 0),
      Path()
        ..moveTo(size.width - longitud, 0)
        ..lineTo(size.width - radio, 0)
        ..quadraticBezierTo(size.width, 0, size.width, radio)
        ..lineTo(size.width, longitud),
      Path()
        ..moveTo(0, size.height - longitud)
        ..lineTo(0, size.height - radio)
        ..quadraticBezierTo(0, size.height, radio, size.height)
        ..lineTo(longitud, size.height),
      Path()
        ..moveTo(size.width - longitud, size.height)
        ..lineTo(size.width - radio, size.height)
        ..quadraticBezierTo(size.width, size.height, size.width, size.height - radio)
        ..lineTo(size.width, size.height - longitud),
    ];

    for (final esquina in esquinas) {
      canvas.drawPath(esquina, pincel);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
