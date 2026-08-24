import 'package:flutter/material.dart';

import '../../modelos/grupo_asistencia.dart';
import '../../nucleo/tema/tema_sigic.dart';
import '../../servicios/servicio_api.dart';
import '../../widgets/panel_tarjeta.dart';

class PestanaAsistencia extends StatefulWidget {
  const PestanaAsistencia({
    super.key,
    required this.servicioApi,
    required this.revisionSesion,
  });

  final ServicioApi servicioApi;
  final int revisionSesion;

  @override
  State<PestanaAsistencia> createState() => _PestanaAsistenciaState();
}

class _PestanaAsistenciaState extends State<PestanaAsistencia> {
  List<GrupoAsistencia> _grupos = const [];
  bool _cargando = true;
  String? _error;
  String _filtro = 'todos';
  String _busqueda = '';

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  @override
  void didUpdateWidget(covariant PestanaAsistencia oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.revisionSesion != widget.revisionSesion) {
      _cargar();
    }
  }

  Future<void> _cargar() async {
    if (mounted) {
      setState(() {
        _cargando = true;
        _error = null;
      });
    }
    try {
      final grupos = await widget.servicioApi.obtenerAsistencia();
      if (!mounted) {
        return;
      }
      setState(() {
        _grupos = grupos;
        _cargando = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.toString().replaceFirst('Exception: ', '');
        _cargando = false;
      });
    }
  }

  Future<void> _acreditarGraduado(String id) async {
    try {
      await widget.servicioApi.acreditarGraduado(id);
      await _cargar();
    } catch (error) {
      _mostrarError(error);
    }
  }

  Future<void> _acreditarInvitado(String id) async {
    try {
      await widget.servicioApi.acreditarInvitado(id);
      await _cargar();
    } catch (error) {
      _mostrarError(error);
    }
  }

  void _mostrarError(Object error) {
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
    );
  }

  List<GrupoAsistencia> get _gruposVisibles {
    final termino = _busqueda.trim().toLowerCase();
    return _grupos.where((grupo) {
      final coincideFiltro = switch (_filtro) {
        'pendientes' =>
          !grupo.presente || grupo.invitados.any((item) => !item.presente),
        'completos' =>
          grupo.presente && grupo.invitados.every((item) => item.presente),
        _ => true,
      };
      final coincideBusqueda =
          termino.isEmpty ||
          grupo.nombre.toLowerCase().contains(termino) ||
          grupo.dni.contains(termino) ||
          grupo.legajo.toLowerCase().contains(termino) ||
          grupo.invitados.any(
            (item) =>
                item.nombre.toLowerCase().contains(termino) ||
                item.dni.contains(termino),
          );
      return coincideFiltro && coincideBusqueda;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final presentes = _grupos.fold<int>(
      0,
      (total, grupo) => total + grupo.personasPresentes,
    );
    final total = _grupos.fold<int>(
      0,
      (cantidad, grupo) => cantidad + grupo.totalPersonas,
    );
    final grupos = _gruposVisibles;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Asistencia'),
        actions: [
          IconButton(
            onPressed: _cargando ? null : _cargar,
            icon: const Icon(Icons.system_update_alt),
            tooltip: 'Actualizar listado',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _cargar,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0A1422),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.groups_2,
                    color: Color(0xFF7DD3FC),
                    size: 28,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Control de ingresos',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          '$presentes de $total personas acreditadas',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: .7),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              onChanged: (valor) => setState(() => _busqueda = valor),
              decoration: const InputDecoration(
                labelText: 'Buscar graduado, invitado, DNI o legajo',
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _FiltroAsistencia(
                  etiqueta: 'Todos',
                  activo: _filtro == 'todos',
                  alPresionar: () => setState(() => _filtro = 'todos'),
                ),
                _FiltroAsistencia(
                  etiqueta: 'Pendientes',
                  activo: _filtro == 'pendientes',
                  alPresionar: () => setState(() => _filtro = 'pendientes'),
                ),
                _FiltroAsistencia(
                  etiqueta: 'Completos',
                  activo: _filtro == 'completos',
                  alPresionar: () => setState(() => _filtro = 'completos'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (_cargando)
              const Padding(
                padding: EdgeInsets.all(32),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_error != null)
              PanelTarjeta(
                contenido: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'No se pudo cargar la asistencia',
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 6),
                    Text(_error!),
                    const SizedBox(height: 12),
                    OutlinedButton(
                      onPressed: _cargar,
                      child: const Text('Reintentar'),
                    ),
                  ],
                ),
              )
            else if (grupos.isEmpty)
              const PanelTarjeta(
                contenido: Text(
                  'No hay registros que coincidan con los filtros.',
                ),
              )
            else
              ...grupos.map(
                (grupo) => _GrupoAsistenciaTarjeta(
                  grupo: grupo,
                  alAcreditarGraduado: () => _acreditarGraduado(grupo.id),
                  alAcreditarInvitado: _acreditarInvitado,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _FiltroAsistencia extends StatelessWidget {
  const _FiltroAsistencia({
    required this.etiqueta,
    required this.activo,
    required this.alPresionar,
  });
  final String etiqueta;
  final bool activo;
  final VoidCallback alPresionar;

  @override
  Widget build(BuildContext context) => ChoiceChip(
    label: Text(etiqueta),
    selected: activo,
    onSelected: (_) => alPresionar(),
    selectedColor: const Color(0xFFE1F4FA),
    labelStyle: TextStyle(
      fontWeight: FontWeight.w800,
      color: activo ? TemaSigic.azulPrincipal : const Color(0xFF3F5668),
    ),
  );
}

class _GrupoAsistenciaTarjeta extends StatelessWidget {
  const _GrupoAsistenciaTarjeta({
    required this.grupo,
    required this.alAcreditarGraduado,
    required this.alAcreditarInvitado,
  });
  final GrupoAsistencia grupo;
  final VoidCallback alAcreditarGraduado;
  final ValueChanged<String> alAcreditarInvitado;

  @override
  Widget build(BuildContext context) => PanelTarjeta(
    contenido: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 38,
              height: 38,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: TemaSigic.azulPrincipal.withValues(alpha: .1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.how_to_reg,
                color: TemaSigic.azulPrincipal,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    grupo.nombre,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 16,
                    ),
                  ),
                  Text(
                    'DNI ${grupo.dni} · ${grupo.carrera.isEmpty ? 'Sin carrera' : grupo.carrera}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF5C7386),
                    ),
                  ),
                ],
              ),
            ),
            _EstadoAsistencia(presente: grupo.presente),
          ],
        ),
        const SizedBox(height: 12),
        Text(
          '${grupo.personasPresentes}/${grupo.totalPersonas} personas acreditadas · ${grupo.asientoId.isEmpty ? 'Butaca sin asignar' : 'Butaca ${grupo.asientoId}'}',
          style: const TextStyle(fontSize: 12, color: Color(0xFF5C7386)),
        ),
        if (!grupo.presente) ...[
          const SizedBox(height: 10),
          SizedBox(
            height: 42,
            child: FilledButton.icon(
              onPressed: alAcreditarGraduado,
              icon: const Icon(Icons.how_to_reg),
              label: const Text('Acreditar graduado'),
            ),
          ),
        ],
        if (grupo.invitados.isNotEmpty) ...[
          const SizedBox(height: 13),
          const Divider(),
          const SizedBox(height: 5),
          ...grupo.invitados.map(
            (invitado) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 5),
              child: Row(
                children: [
                  Icon(
                    invitado.presente ? Icons.check_circle : Icons.groups_2,
                    size: 17,
                    color: invitado.presente
                        ? TemaSigic.exito
                        : const Color(0xFF8496A6),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          invitado.nombre,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          '${invitado.relacion} · DNI ${invitado.dni}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 11,
                            color: Color(0xFF5C7386),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (!invitado.presente)
                    TextButton(
                      onPressed: () => alAcreditarInvitado(invitado.id),
                      child: const Text('Ingresar'),
                    ),
                ],
              ),
            ),
          ),
        ],
      ],
    ),
  );
}

class _EstadoAsistencia extends StatelessWidget {
  const _EstadoAsistencia({required this.presente});
  final bool presente;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
    decoration: BoxDecoration(
      color: (presente ? TemaSigic.exito : const Color(0xFFB4530A)).withValues(
        alpha: .11,
      ),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Text(
      presente ? 'PRESENTE' : 'PENDIENTE',
      style: TextStyle(
        fontWeight: FontWeight.w900,
        fontSize: 9.5,
        color: presente ? const Color(0xFF0A7F5F) : const Color(0xFFB4530A),
      ),
    ),
  );
}
