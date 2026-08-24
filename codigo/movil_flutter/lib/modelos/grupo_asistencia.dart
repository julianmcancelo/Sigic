import 'resultado_escaneo.dart';

class GrupoAsistencia {
  const GrupoAsistencia({
    required this.id,
    required this.nombre,
    required this.dni,
    required this.legajo,
    required this.carrera,
    required this.asientoId,
    required this.presente,
    required this.invitados,
  });

  final String id;
  final String nombre;
  final String dni;
  final String legajo;
  final String carrera;
  final String asientoId;
  final bool presente;
  final List<InvitadoEscaneado> invitados;

  int get invitadosPresentes => invitados.where((item) => item.presente).length;
  int get personasPresentes => invitadosPresentes + (presente ? 1 : 0);
  int get totalPersonas => invitados.length + 1;

  factory GrupoAsistencia.desdeMapa(Map<String, dynamic> mapa) {
    final invitadosRaw = mapa['invitados'];
    final invitados = invitadosRaw is List
        ? invitadosRaw
              .whereType<Map>()
              .map(
                (item) =>
                    InvitadoEscaneado.desdeMapa(item.cast<String, dynamic>()),
              )
              .toList()
        : const <InvitadoEscaneado>[];

    return GrupoAsistencia(
      id: (mapa['id'] ?? '').toString(),
      nombre: (mapa['nombre'] ?? 'Graduado').toString(),
      dni: (mapa['dni'] ?? '').toString(),
      legajo: (mapa['legajo'] ?? '').toString(),
      carrera: (mapa['carrera'] ?? '').toString(),
      asientoId: (mapa['asiento_id'] ?? '').toString(),
      presente: mapa['presente'] == true || mapa['presente'] == 1,
      invitados: invitados,
    );
  }
}
