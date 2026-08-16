class InvitadoEscaneado {
  const InvitadoEscaneado({
    required this.id,
    required this.nombre,
    required this.dni,
    required this.relacion,
    required this.presente,
    required this.discapacidad,
    this.fechaPresente,
  });

  final String id;
  final String nombre;
  final String dni;
  final String relacion;
  final bool presente;
  final bool discapacidad;
  final String? fechaPresente;

  InvitadoEscaneado copiarCon({
    bool? presente,
    String? fechaPresente,
  }) {
    return InvitadoEscaneado(
      id: id,
      nombre: nombre,
      dni: dni,
      relacion: relacion,
      presente: presente ?? this.presente,
      discapacidad: discapacidad,
      fechaPresente: fechaPresente ?? this.fechaPresente,
    );
  }

  factory InvitadoEscaneado.desdeMapa(Map<String, dynamic> mapa) {
    return InvitadoEscaneado(
      id: (mapa['id'] ?? '').toString(),
      nombre: (mapa['nombre'] ?? 'Invitado').toString(),
      dni: (mapa['dni'] ?? '').toString(),
      relacion: (mapa['relacion'] ?? '').toString(),
      presente: _aBool(mapa['presente']),
      discapacidad: _aBool(mapa['discapacidad']),
      fechaPresente: mapa['fecha_presente']?.toString(),
    );
  }
}

class GrupoEgresado {
  const GrupoEgresado({
    required this.nombre,
    required this.legajo,
    required this.carrera,
    required this.asientoId,
    required this.estado,
  });

  final String nombre;
  final String legajo;
  final String carrera;
  final String asientoId;
  final String estado;

  factory GrupoEgresado.desdeMapa(Map<String, dynamic> mapa) {
    return GrupoEgresado(
      nombre: (mapa['nombre'] ?? 'Graduado').toString(),
      legajo: (mapa['legajo'] ?? '').toString(),
      carrera: (mapa['carrera'] ?? '').toString(),
      asientoId: (mapa['asiento_id'] ?? '').toString(),
      estado: (mapa['estado'] ?? '').toString(),
    );
  }
}

class ResultadoEscaneo {
  const ResultadoEscaneo.individual({
    required this.titulo,
    required this.mensaje,
    required this.invitado,
    required this.egresadoNombre,
  })  : tipo = TipoResultadoEscaneo.individual,
        grupoEgresado = null,
        invitadosGrupo = const [];

  const ResultadoEscaneo.grupal({
    required this.titulo,
    required this.mensaje,
    required this.grupoEgresado,
    required this.invitadosGrupo,
  })  : tipo = TipoResultadoEscaneo.grupal,
        invitado = null,
        egresadoNombre = null;

  final TipoResultadoEscaneo tipo;
  final String titulo;
  final String mensaje;
  final InvitadoEscaneado? invitado;
  final String? egresadoNombre;
  final GrupoEgresado? grupoEgresado;
  final List<InvitadoEscaneado> invitadosGrupo;

  factory ResultadoEscaneo.desdeMapa(Map<String, dynamic> mapa) {
    final tipo = (mapa['tipo'] ?? '').toString();
    if (tipo == 'grupo') {
      return ResultadoEscaneo.grupal(
        titulo: (mapa['titulo'] ?? 'Grupo encontrado').toString(),
        mensaje: (mapa['mensaje'] ?? 'Grupo listo para acreditacion.').toString(),
        grupoEgresado: GrupoEgresado.desdeMapa(
          (mapa['egresado'] as Map?)?.cast<String, dynamic>() ?? <String, dynamic>{},
        ),
        invitadosGrupo: ((mapa['invitados'] as List?) ?? const [])
            .map((item) => InvitadoEscaneado.desdeMapa((item as Map).cast<String, dynamic>()))
            .toList(),
      );
    }

    final datos = (mapa['datos'] as Map?)?.cast<String, dynamic>() ?? <String, dynamic>{};
    return ResultadoEscaneo.individual(
      titulo: (mapa['titulo'] ?? 'Invitado encontrado').toString(),
      mensaje: (mapa['mensaje'] ?? 'Invitado listo para acreditacion.').toString(),
      invitado: InvitadoEscaneado.desdeMapa(datos),
      egresadoNombre: datos['egresadoNombre']?.toString() ?? '',
    );
  }

  ResultadoEscaneo marcarInvitadoPresente(String id) {
    if (tipo == TipoResultadoEscaneo.individual && invitado != null && invitado!.id == id) {
      return ResultadoEscaneo.individual(
        titulo: titulo,
        mensaje: mensaje,
        invitado: invitado!.copiarCon(
          presente: true,
          fechaPresente: DateTime.now().toIso8601String(),
        ),
        egresadoNombre: egresadoNombre ?? '',
      );
    }

    return ResultadoEscaneo.grupal(
      titulo: titulo,
      mensaje: mensaje,
      grupoEgresado: grupoEgresado!,
      invitadosGrupo: invitadosGrupo
          .map(
            (invitadoActual) => invitadoActual.id == id
                ? invitadoActual.copiarCon(
                    presente: true,
                    fechaPresente: DateTime.now().toIso8601String(),
                  )
                : invitadoActual,
          )
          .toList(),
    );
  }
}

enum TipoResultadoEscaneo {
  individual,
  grupal,
}

bool _aBool(dynamic valor) {
  return valor == true || valor == 1 || valor == '1' || valor == 'true' || valor == 't';
}
