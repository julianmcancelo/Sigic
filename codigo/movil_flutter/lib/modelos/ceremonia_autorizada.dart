class CeremoniaAutorizada {
  const CeremoniaAutorizada({
    required this.id,
    required this.nombre,
    required this.fecha,
    required this.lugar,
    required this.activa,
  });

  final String id;
  final String nombre;
  final DateTime? fecha;
  final String lugar;
  final bool activa;

  factory CeremoniaAutorizada.desdeMapa(Map<String, dynamic> mapa) {
    return CeremoniaAutorizada(
      id: (mapa['id'] ?? '').toString(),
      nombre: (mapa['nombre'] ?? 'Ceremonia').toString(),
      fecha: DateTime.tryParse((mapa['fecha'] ?? '').toString()),
      lugar: (mapa['lugar'] ?? 'Sede a confirmar').toString(),
      activa: _aBool(mapa['activa']),
    );
  }
}

bool _aBool(dynamic valor) {
  return valor == true || valor == 1 || valor == '1' || valor == 'true' || valor == 't';
}
