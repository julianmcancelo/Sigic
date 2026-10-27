import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../modelos/ceremonia.dart';
import '../../modelos/ceremonia_autorizada.dart';
import '../../modelos/grupo_asistencia.dart';
import '../../modelos/usuario_sesion.dart';
import '../../nucleo/tema/tema_sigic.dart';
import '../../servicios/servicio_api.dart';
import '../../servicios/servicio_feedback.dart';
import '../../servicios/servicio_offline.dart';

class PestanaAdministracion extends StatefulWidget {
  const PestanaAdministracion({
    super.key,
    required this.servicioApi,
    required this.revisionSesion,
  });

  final ServicioApi servicioApi;
  final int revisionSesion;

  @override
  State<PestanaAdministracion> createState() => _PestanaAdministracionState();
}

class _PestanaAdministracionState extends State<PestanaAdministracion> {
  List<GrupoAsistencia> _grupos = const [];
  Ceremonia? _ceremonia;
  List<CeremoniaAutorizada> _ceremoniasAutorizadas = const [];
  UsuarioSesion? _usuario;
  bool _cargando = true;
  String? _error;
  String _filtro = 'todos';
  String _busqueda = '';
  int _pendientesSync = 0;
  final TextEditingController _controladorBusqueda = TextEditingController();

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  @override
  void didUpdateWidget(covariant PestanaAdministracion oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.revisionSesion != widget.revisionSesion) {
      _cargar();
    }
  }

  @override
  void dispose() {
    _controladorBusqueda.dispose();
    super.dispose();
  }

  Future<void> _cargar() async {
    if (mounted) {
      setState(() {
        _cargando = true;
        _error = null;
      });
    }
    try {
      final gruposFuture = widget.servicioApi.obtenerAsistencia();
      final cerActivaFuture = widget.servicioApi.obtenerCeremoniaActiva();
      final cerAutorizadasFuture = widget.servicioApi.obtenerCeremoniasAutorizadas();
      final usuarioFuture = widget.servicioApi.obtenerUsuarioLocal();

      final resultados = await Future.wait([
        gruposFuture,
        cerActivaFuture,
        cerAutorizadasFuture,
        usuarioFuture,
      ]);

      if (!mounted) return;

      final grupos = resultados[0] as List<GrupoAsistencia>;
      final cerActiva = resultados[1] as Ceremonia?;
      final cerAutorizadas = resultados[2] as List<CeremoniaAutorizada>;
      final usuario = resultados[3] as UsuarioSesion?;

      final offline = ServicioOffline();
      final pendientesIniciales = await offline.cantidadPendientes();
      if (pendientesIniciales > 0) {
        final sync = await offline.sincronizarCola(widget.servicioApi);
        if (sync > 0 && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Se sincronizaron $sync registros pendientes.'),
              backgroundColor: TemaSigic.exito,
            ),
          );
        }
      }
      final pendientesRestantes = await offline.cantidadPendientes();

      if (grupos.isNotEmpty) {
        await offline.guardarPadronLocal(grupos);
      }

      setState(() {
        _grupos = grupos;
        _ceremonia = cerActiva;
        _ceremoniasAutorizadas = cerAutorizadas;
        _usuario = usuario;
        _pendientesSync = pendientesRestantes;
        _cargando = false;
      });
    } catch (e) {
      final offline = ServicioOffline();
      final enCache = await offline.obtenerPadronLocal();
      final pendientes = await offline.cantidadPendientes();

      if (!mounted) return;

      if (enCache.isNotEmpty) {
        setState(() {
          _grupos = enCache;
          _pendientesSync = pendientes;
          _error = 'Modo contingencia offline: mostrando padron en cache local.';
          _cargando = false;
        });
      } else {
        setState(() {
          _error = e.toString().replaceAll('Exception: ', '');
          _cargando = false;
        });
      }
    }
  }

  Future<void> _cambiarCeremonia(CeremoniaAutorizada ceremonia) async {
    try {
      Navigator.pop(context);
      setState(() => _cargando = true);
      await widget.servicioApi.activarCeremonia(ceremonia.id);
      await ServicioFeedback.accesoPermitido();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Ceremonia activa cambiada a: ${ceremonia.nombre}'),
          backgroundColor: TemaSigic.azulPrincipal,
        ),
      );
      await _cargar();
    } catch (e) {
      if (!mounted) return;
      setState(() => _cargando = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error al cambiar ceremonia: ${e.toString().replaceAll('Exception: ', '')}'),
          backgroundColor: TemaSigic.error,
        ),
      );
    }
  }

  void _abrirSelectorCeremonia() {
    if (_ceremoniasAutorizadas.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No hay otras ceremonias disponibles en el sistema.'),
        ),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 44,
                    height: 5,
                    decoration: BoxDecoration(
                      color: const Color(0xFFCBD5E1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Cambiar Ceremonia Activa',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Seleccione la colación sobre la cual desea operar en tiempo real.',
                  style: TextStyle(fontSize: 12.5, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 16),
                ConstrainedBox(
                  constraints: BoxConstraints(
                    maxHeight: MediaQuery.of(context).size.height * 0.45,
                  ),
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: _ceremoniasAutorizadas.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final item = _ceremoniasAutorizadas[index];
                      final esActiva = _ceremonia?.id == item.id || item.activa;
                      final fechaStr = item.fecha != null
                          ? DateFormat('dd/MM/yyyy HH:mm').format(item.fecha!)
                          : 'Fecha a confirmar';

                      return ListTile(
                        onTap: esActiva ? null : () => _cambiarCeremonia(item),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                          side: BorderSide(
                            color: esActiva
                                ? TemaSigic.azulBrillante
                                : const Color(0xFFE2EAF0),
                          ),
                        ),
                        tileColor: esActiva
                            ? TemaSigic.azulBrillante.withValues(alpha: 0.08)
                            : Colors.white,
                        leading: CircleAvatar(
                          backgroundColor: esActiva
                              ? TemaSigic.azulPrincipal
                              : const Color(0xFFF1F5F9),
                          child: Icon(
                            Icons.event_seat_rounded,
                            size: 18,
                            color: esActiva ? Colors.white : const Color(0xFF64748B),
                          ),
                        ),
                        title: Text(
                          item.nombre,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: esActiva ? FontWeight.w800 : FontWeight.w600,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        subtitle: Text(
                          '${item.lugar} · $fechaStr',
                          style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                        ),
                        trailing: esActiva
                            ? Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: TemaSigic.azulPrincipal,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Text(
                                  'ACTIVA',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.white,
                                  ),
                                ),
                              )
                            : const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8)),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _acreditarGraduadoDirecto(GrupoAsistencia grupo) async {
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Confirmar Acreditación'),
        content: Text(
          '¿Desea registrar el ingreso administrativo para el graduado ${grupo.nombre} (DNI ${grupo.dni})?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: TemaSigic.exito),
            child: const Text('Acreditar Ingreso'),
          ),
        ],
      ),
    );

    if (confirmar != true) return;

    try {
      await widget.servicioApi.acreditarGraduado(grupo.id);
      await ServicioFeedback.accesoPermitido();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Graduado ${grupo.nombre} acreditado exitosamente.'),
          backgroundColor: TemaSigic.exito,
        ),
      );
      await _cargar();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
          backgroundColor: TemaSigic.error,
        ),
      );
    }
  }

  Future<void> _acreditarGrupoCompleto(GrupoAsistencia grupo) async {
    final invitadosPendientes = grupo.invitados.where((i) => !i.presente).toList();
    final mensaje = grupo.presente
        ? 'Se acreditaran ${invitadosPendientes.length} acompanantes pendientes de ${grupo.nombre}.'
        : 'Se acreditara al graduado ${grupo.nombre} y a sus ${invitadosPendientes.length} acompanantes pendientes.';

    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Acreditación Grupal Completa'),
        content: Text(mensaje),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: TemaSigic.azulPrincipal),
            child: const Text('Acreditar Todos'),
          ),
        ],
      ),
    );

    if (confirmar != true) return;

    try {
      if (!grupo.presente) {
        await widget.servicioApi.acreditarGraduado(grupo.id);
      }
      if (invitadosPendientes.isNotEmpty) {
        final ids = invitadosPendientes.map((i) => i.id).toList();
        await widget.servicioApi.acreditarInvitadosMasivo(ids);
      }
      await ServicioFeedback.accesoPermitido();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Grupo de ${grupo.nombre} acreditado exitosamente.'),
          backgroundColor: TemaSigic.exito,
        ),
      );
      await _cargar();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
          backgroundColor: TemaSigic.error,
        ),
      );
    }
  }

  void _verDetalleGraduado(GrupoAsistencia grupo) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 44,
                    height: 5,
                    decoration: BoxDecoration(
                      color: const Color(0xFFCBD5E1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            grupo.nombre,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Tecnicatura Superior en Analista de Sistemas',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF0284C7),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: grupo.presente
                            ? const Color(0xFFDCFCE7)
                            : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: grupo.presente
                              ? const Color(0xFF86EFAC)
                              : const Color(0xFFCBD5E1),
                        ),
                      ),
                      child: Text(
                        grupo.presente ? 'PRESENTE' : 'PENDIENTE',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: grupo.presente
                              ? const Color(0xFF15803D)
                              : const Color(0xFF64748B),
                        ),
                      ),
                    ),
                  ],
                ),
                const Divider(height: 24),
                _construirFilaInfo('DNI', grupo.dni),
                _construirFilaInfo('Legajo', grupo.legajo.isNotEmpty ? grupo.legajo : 'Sin registrar'),
                _construirFilaInfo('Butaca Asignada', grupo.asientoId.isNotEmpty ? grupo.asientoId : 'Sin butaca asignada'),
                if (grupo.formulaJuramento != null && grupo.formulaJuramento!.isNotEmpty)
                  _construirFilaInfo('Juramento', grupo.formulaJuramento!),
                const SizedBox(height: 16),
                Text(
                  'Acompañantes Registrados (${grupo.invitados.length})',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 8),
                if (grupo.invitados.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Text(
                      'No tiene acompañantes registrados para esta ceremonia.',
                      style: TextStyle(fontSize: 12.5, color: Color(0xFF64748B)),
                    ),
                  )
                else
                  ...grupo.invitados.map(
                    (inv) => Container(
                      margin: const EdgeInsets.only(bottom: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFE2EAF0)),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            inv.presente ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                            size: 16,
                            color: inv.presente ? const Color(0xFF10B981) : const Color(0xFF94A3B8),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  inv.nombre,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF1E293B),
                                  ),
                                ),
                                Text(
                                  'DNI ${inv.dni} · ${inv.relacion}',
                                  style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            inv.presente ? 'Acreditado' : 'Pendiente',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: inv.presente ? const Color(0xFF15803D) : const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    if (!grupo.presente)
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            Navigator.pop(context);
                            _acreditarGraduadoDirecto(grupo);
                          },
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFF0284C7)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('Acreditar Solo Egresado'),
                        ),
                      ),
                    if (!grupo.presente && grupo.invitados.any((i) => !i.presente))
                      const SizedBox(width: 10),
                    if (grupo.invitados.any((i) => !i.presente))
                      Expanded(
                        child: FilledButton(
                          onPressed: () {
                            Navigator.pop(context);
                            _acreditarGrupoCompleto(grupo);
                          },
                          style: FilledButton.styleFrom(
                            backgroundColor: const Color(0xFF0284C7),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('Acreditar Todo'),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _construirFilaInfo(String etiqueta, String valor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(
              etiqueta,
              style: const TextStyle(fontSize: 12.5, color: Color(0xFF64748B), fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(
            child: Text(
              valor,
              style: const TextStyle(fontSize: 12.5, color: Color(0xFF0F172A), fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }

  List<GrupoAsistencia> get _gruposFiltrados {
    return _grupos.where((grupo) {
      if (_filtro == 'presentes' && !grupo.presente) return false;
      if (_filtro == 'ausentes' && grupo.presente) return false;
      if (_filtro == 'con_invitados' && grupo.invitados.isEmpty) return false;

      if (_busqueda.isEmpty) return true;
      final q = _busqueda.toLowerCase();
      final matchNombre = grupo.nombre.toLowerCase().contains(q);
      final matchDni = grupo.dni.toLowerCase().contains(q);
      final matchLegajo = grupo.legajo.toLowerCase().contains(q);
      final matchAsiento = grupo.asientoId.toLowerCase().contains(q);
      final matchInvitado = grupo.invitados.any((i) => i.nombre.toLowerCase().contains(q) || i.dni.contains(q));
      return matchNombre || matchDni || matchLegajo || matchAsiento || matchInvitado;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final egresadosPresentes = _grupos.where((g) => g.presente).length;
    final totalEgresados = _grupos.length;
    final totalInvitados = _grupos.fold<int>(0, (sum, g) => sum + g.invitados.length);
    final invitadosPresentes = _grupos.fold<int>(0, (sum, g) => sum + g.invitadosPresentes);
    final totalPersonas = totalEgresados + totalInvitados;
    final totalPresentes = egresadosPresentes + invitadosPresentes;
    final porcentajeGlobal = totalPersonas > 0 ? ((totalPresentes / totalPersonas) * 100).round() : 0;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _cargar,
          color: TemaSigic.azulPrincipal,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: _construirHeaderInstitucional(),
              ),
              if (_error != null)
                SliverToBoxAdapter(
                  child: Container(
                    margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFFECACA)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.info_outline_rounded, color: Color(0xFFDC2626), size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _error!,
                            style: const TextStyle(fontSize: 12.5, color: Color(0xFF991B1B), fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: _construirBentoGridKpis(
                    totalPersonas: totalPersonas,
                    totalPresentes: totalPresentes,
                    porcentajeGlobal: porcentajeGlobal,
                    totalEgresados: totalEgresados,
                    egresadosPresentes: egresadosPresentes,
                    totalInvitados: totalInvitados,
                    invitadosPresentes: invitadosPresentes,
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _construirBarraBusquedaYFiltros(),
                ),
              ),
              if (_cargando && _grupos.isEmpty)
                const SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: CircularProgressIndicator(),
                  ),
                )
              else if (_gruposFiltrados.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.search_off_rounded, size: 48, color: Colors.grey.shade400),
                        const SizedBox(height: 12),
                        const Text(
                          'No se encontraron graduados con los filtros aplicados',
                          style: TextStyle(fontSize: 13.5, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final grupo = _gruposFiltrados[index];
                        return _construirTarjetaGraduado(grupo);
                      },
                      childCount: _gruposFiltrados.length,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _construirHeaderInstitucional() {
    final nombreCeremonia = _ceremonia?.nombre ?? 'Sin ceremonia activa';
    final fechaCeremonia = _ceremonia != null
        ? DateFormat('dd/MM/yyyy HH:mm').format(_ceremonia!.fecha)
        : 'Fecha no definida';

    return Container(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 20),
      decoration: const BoxDecoration(
        color: Color(0xFF0F172A),
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(26)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0284C7).withValues(alpha: 0.25),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFF0284C7)),
                        ),
                        child: const Text(
                          'SIGIC · GESTIÓN INSTITUCIONAL',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF38BDF8),
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Administración',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
              IconButton.filledTonal(
                onPressed: _cargar,
                icon: const Icon(Icons.refresh_rounded, color: Colors.white),
                style: IconButton.styleFrom(
                  backgroundColor: Colors.white.withValues(alpha: 0.12),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          InkWell(
            onTap: _abrirSelectorCeremonia,
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: const Color(0xFF0284C7),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.school_rounded, color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          nombreCeremonia,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${_ceremonia?.lugar ?? 'Auditorio ITB'} · $fechaCeremonia',
                          style: TextStyle(
                            fontSize: 11.5,
                            color: Colors.white.withValues(alpha: 0.7),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Cambiar',
                          style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        SizedBox(width: 3),
                        Icon(Icons.unfold_more_rounded, size: 14, color: Colors.white),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (_pendientesSync > 0)
            Container(
              margin: const EdgeInsets.only(top: 10),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFF59E0B).withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFF59E0B)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.sync_problem_rounded, size: 16, color: Color(0xFFFBBF24)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '$_pendientesSync acreditaciones en cola pendientes de sincronización.',
                      style: const TextStyle(fontSize: 11.5, color: Color(0xFFFDE68A), fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _construirBentoGridKpis({
    required int totalPersonas,
    required int totalPresentes,
    required int porcentajeGlobal,
    required int totalEgresados,
    required int egresadosPresentes,
    required int totalInvitados,
    required int invitadosPresentes,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              flex: 5,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2EAF0)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Aforo General',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF64748B),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE0F2FE),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '$porcentajeGlobal%',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0369A1),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    RichText(
                      text: TextSpan(
                        children: [
                          TextSpan(
                            text: '$totalPresentes ',
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          TextSpan(
                            text: '/ $totalPersonas',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF94A3B8),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: LinearProgressIndicator(
                        value: totalPersonas > 0 ? (totalPresentes / totalPersonas) : 0,
                        backgroundColor: const Color(0xFFF1F5F9),
                        valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF0284C7)),
                        minHeight: 6,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 4,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2EAF0)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Graduados',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(height: 8),
                    RichText(
                      text: TextSpan(
                        children: [
                          TextSpan(
                            text: '$egresadosPresentes ',
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          TextSpan(
                            text: '/ $totalEgresados',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF94A3B8),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: LinearProgressIndicator(
                        value: totalEgresados > 0 ? (egresadosPresentes / totalEgresados) : 0,
                        backgroundColor: const Color(0xFFF1F5F9),
                        valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF10B981)),
                        minHeight: 6,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE2EAF0)),
          ),
          child: Row(
            children: [
              Expanded(
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.people_alt_outlined, size: 20, color: Color(0xFF0284C7)),
                    ),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Acompañantes',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                        ),
                        Text(
                          '$invitadosPresentes / $totalInvitados presentes',
                          style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Container(width: 1, height: 32, color: const Color(0xFFE2EAF0)),
              Expanded(
                child: Row(
                  children: [
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.badge_outlined, size: 20, color: Color(0xFF10B981)),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Operador Activo',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                          ),
                          Text(
                            _usuario?.nombre ?? 'Administrador',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _construirBarraBusquedaYFiltros() {
    return Column(
      children: [
        TextField(
          controller: _controladorBusqueda,
          onChanged: (val) => setState(() => _busqueda = val),
          decoration: InputDecoration(
            hintText: 'Buscar por egresado, DNI, butaca o acompañante...',
            hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
            prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF64748B), size: 20),
            suffixIcon: _busqueda.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear_rounded, size: 18),
                    onPressed: () {
                      _controladorBusqueda.clear();
                      setState(() => _busqueda = '');
                    },
                  )
                : null,
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: Color(0xFFE2EAF0)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: Color(0xFF0284C7), width: 1.5),
            ),
          ),
        ),
        const SizedBox(height: 10),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _construirChipFiltro('todos', 'Todos (${_grupos.length})'),
              const SizedBox(width: 8),
              _construirChipFiltro('presentes', 'Presentes (${_grupos.where((g) => g.presente).length})'),
              const SizedBox(width: 8),
              _construirChipFiltro('ausentes', 'Pendientes (${_grupos.where((g) => !g.presente).length})'),
              const SizedBox(width: 8),
              _construirChipFiltro('con_invitados', 'Con Acompañantes'),
            ],
          ),
        ),
        const SizedBox(height: 8),
      ],
    );
  }

  Widget _construirChipFiltro(String valor, String etiqueta) {
    final seleccionado = _filtro == valor;
    return ChoiceChip(
      selected: seleccionado,
      label: Text(
        etiqueta,
        style: TextStyle(
          fontSize: 12,
          fontWeight: seleccionado ? FontWeight.w800 : FontWeight.w600,
          color: seleccionado ? Colors.white : const Color(0xFF475569),
        ),
      ),
      selectedColor: const Color(0xFF0F172A),
      backgroundColor: Colors.white,
      side: BorderSide(
        color: seleccionado ? const Color(0xFF0F172A) : const Color(0xFFE2EAF0),
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      showCheckmark: false,
      onSelected: (_) => setState(() => _filtro = valor),
    );
  }

  Widget _construirTarjetaGraduado(GrupoAsistencia grupo) {
    final tieneInvitados = grupo.invitados.isNotEmpty;
    final todosAcreditados = grupo.presente && grupo.invitados.every((i) => i.presente);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: grupo.presente ? const Color(0xFF86EFAC).withValues(alpha: 0.7) : const Color(0xFFE2EAF0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _verDetalleGraduado(grupo),
          borderRadius: BorderRadius.circular(18),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: grupo.presente ? const Color(0xFFDCFCE7) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        grupo.presente ? Icons.check_circle_rounded : Icons.person_rounded,
                        color: grupo.presente ? const Color(0xFF16A34A) : const Color(0xFF64748B),
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            grupo.nombre,
                            style: const TextStyle(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'DNI ${grupo.dni} · Legajo: ${grupo.legajo.isNotEmpty ? grupo.legajo : 'S/L'}',
                            style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Tecnicatura Superior en Analista de Sistemas',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF0284C7),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        if (grupo.asientoId.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE0F2FE),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFFBAE6FD)),
                            ),
                            child: Text(
                              grupo.asientoId,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF0369A1),
                              ),
                            ),
                          ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: grupo.presente ? const Color(0xFFDCFCE7) : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            grupo.presente ? 'PRESENTE' : 'PENDIENTE',
                            style: TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.w800,
                              color: grupo.presente ? const Color(0xFF15803D) : const Color(0xFF64748B),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                if (tieneInvitados) ...[
                  const Divider(height: 18),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.group_outlined, size: 16, color: Color(0xFF64748B)),
                          const SizedBox(width: 6),
                          Text(
                            '${grupo.invitadosPresentes} de ${grupo.invitados.length} acompañantes acreditados',
                            style: const TextStyle(fontSize: 11.5, color: Color(0xFF475569), fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                      if (!todosAcreditados)
                        TextButton(
                          onPressed: () => _acreditarGrupoCompleto(grupo),
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: const Text(
                            'Acreditar Todo',
                            style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: Color(0xFF0284C7)),
                          ),
                        ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
