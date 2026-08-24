class EstadisticasAcceso {
  const EstadisticasAcceso({
    required this.presentes,
    required this.totalInvitados,
    this.ausentes = 0,
    this.totalEgresados = 0,
    this.porcentajeAsistencia = 0,
  });

  final int presentes;
  final int totalInvitados;
  final int ausentes;
  final int totalEgresados;
  final int porcentajeAsistencia;

  factory EstadisticasAcceso.desdeMapa(Map<String, dynamic> mapa) {
    int aEntero(dynamic valor) {
      if (valor is int) return valor;
      return int.tryParse(valor?.toString() ?? '') ?? 0;
    }

    final presentes = aEntero(mapa['presentes']);
    final totalInvitados = aEntero(mapa['totalInvitados']);
    final ausentes = mapa.containsKey('ausentes')
        ? aEntero(mapa['ausentes'])
        : (totalInvitados - presentes).clamp(0, totalInvitados);

    return EstadisticasAcceso(
      presentes: presentes,
      totalInvitados: totalInvitados,
      ausentes: ausentes,
      totalEgresados: aEntero(mapa['totalEgresados']),
      porcentajeAsistencia: aEntero(mapa['porcentajeAsistencia']),
    );
  }
}
