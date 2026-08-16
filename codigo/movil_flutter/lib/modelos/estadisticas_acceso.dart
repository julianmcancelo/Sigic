class EstadisticasAcceso {
  const EstadisticasAcceso({
    required this.presentes,
    required this.totalInvitados,
  });

  final int presentes;
  final int totalInvitados;

  factory EstadisticasAcceso.desdeMapa(Map<String, dynamic> mapa) {
    final presentes = mapa['presentes'];
    final totalInvitados = mapa['totalInvitados'];
    return EstadisticasAcceso(
      presentes: presentes is int ? presentes : int.tryParse(presentes.toString()) ?? 0,
      totalInvitados: totalInvitados is int ? totalInvitados : int.tryParse(totalInvitados.toString()) ?? 0,
    );
  }
}
