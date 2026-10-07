import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

import '../modelos/grupo_asistencia.dart';

class ElementoColaSync {
  const ElementoColaSync({
    required this.id,
    required this.tipo, // 'egresado' | 'invitado'
    required this.timestamp,
  });

  final String id;
  final String tipo;
  final int timestamp;

  Map<String, dynamic> aMapa() => {
    'id': id,
    'tipo': tipo,
    'timestamp': timestamp,
  };

  factory ElementoColaSync.desdeMapa(Map<String, dynamic> mapa) =>
      ElementoColaSync(
        id: mapa['id']?.toString() ?? '',
        tipo: mapa['tipo']?.toString() ?? 'invitado',
        timestamp: mapa['timestamp'] is int ? mapa['timestamp'] as int : 0,
      );
}

class ServicioOffline {
  static const String clavePadronCache = 'sigic_offline_padron';
  static const String claveColaSync = 'sigic_offline_cola_sync';

  Future<SharedPreferences> get _prefs async =>
      SharedPreferences.getInstance();

  /// Guarda una copia del padrón de asistencia para permitir búsquedas y validación offline
  Future<void> guardarPadronLocal(List<GrupoAsistencia> grupos) async {
    final prefs = await _prefs;
    final listaSerializada = grupos.map((g) => g.aMapa()).toList();
    await prefs.setString(clavePadronCache, jsonEncode(listaSerializada));
  }

  /// Recupera el padrón guardado en la memoria del dispositivo
  Future<List<GrupoAsistencia>> obtenerPadronLocal() async {
    final prefs = await _prefs;
    final texto = prefs.getString(clavePadronCache);
    if (texto == null || texto.isEmpty) return const [];
    try {
      final lista = jsonDecode(texto) as List<dynamic>;
      return lista
          .map((item) => GrupoAsistencia.desdeMapa(item as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return const [];
    }
  }

  /// Encola una acreditación realizada sin conexión
  Future<void> encolarAcreditacion({
    required String id,
    required String tipo,
  }) async {
    final prefs = await _prefs;
    final cola = await obtenerColaPendiente();
    cola.add(
      ElementoColaSync(
        id: id,
        tipo: tipo,
        timestamp: DateTime.now().millisecondsSinceEpoch,
      ),
    );
    await prefs.setString(
      claveColaSync,
      jsonEncode(cola.map((e) => e.aMapa()).toList()),
    );
  }

  /// Obtiene la cola de acreditaciones pendientes
  Future<List<ElementoColaSync>> obtenerColaPendiente() async {
    final prefs = await _prefs;
    final texto = prefs.getString(claveColaSync);
    if (texto == null || texto.isEmpty) return [];
    try {
      final lista = jsonDecode(texto) as List<dynamic>;
      return lista
          .map((item) => ElementoColaSync.desdeMapa(item as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }

  /// Limpia la cola de sincronización una vez procesada
  Future<void> limpiarCola() async {
    final prefs = await _prefs;
    await prefs.remove(claveColaSync);
  }

  /// Retorna la cantidad de operaciones pendientes de sincronizar
  Future<int> cantidadPendientes() async {
    final cola = await obtenerColaPendiente();
    return cola.length;
  }
}
