import 'package:flutter/material.dart';

class PanelTarjeta extends StatelessWidget {
  const PanelTarjeta({
    super.key,
    required this.contenido,
    this.colorBorde,
  });

  final Widget contenido;
  final Color? colorBorde;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: BorderSide(color: colorBorde ?? Colors.transparent),
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: contenido,
      ),
    );
  }
}
