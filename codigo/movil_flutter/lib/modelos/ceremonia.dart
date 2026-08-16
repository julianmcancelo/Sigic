class Ceremonia {
  const Ceremonia({
    required this.id,
    required this.nombre,
    required this.fecha,
    required this.lugar,
    required this.maximoInvitados,
  });

  final String id;
  final String nombre;
  final DateTime fecha;
  final String lugar;
  final int maximoInvitados;

  factory Ceremonia.desdeMapa(Map<String, dynamic> mapa) {
    final maximo = mapa['max_invitados'] ?? mapa['maximoInvitados'] ?? 0;
    return Ceremonia(
      id: (mapa['id'] ?? '').toString(),
      nombre: (mapa['nombre'] ?? 'Ceremonia').toString(),
      fecha: DateTime.tryParse((mapa['fecha'] ?? '').toString()) ?? DateTime.now(),
      lugar: (mapa['lugar'] ?? 'Sede Beltran').toString(),
      maximoInvitados: maximo is int ? maximo : int.tryParse(maximo.toString()) ?? 0,
    );
  }
}
