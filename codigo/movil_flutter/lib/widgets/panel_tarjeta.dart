import 'package:flutter/material.dart';

class PanelTarjeta extends StatelessWidget {
  const PanelTarjeta({super.key, required this.contenido, this.colorBorde});

  final Widget contenido;
  final Color? colorBorde;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: colorBorde ?? const Color(0xFFE2EAF0)),
      ),
      child: Padding(padding: const EdgeInsets.all(14), child: contenido),
    );
  }
}
