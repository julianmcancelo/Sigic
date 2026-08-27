/**
 * Módulo de Acreditación Offline-First para SiGIC.
 * Permite validar códigos QR y registrar accesos sin conexión a internet,
 * sincronizando automáticamente en lote al recuperar la red.
 */

export interface EgresadoManifiesto {
  id: string;
  nombre: string;
  dni: string;
  legajo?: string;
  carrera: string;
  token: string;
  asiento_id?: string;
  presente: boolean;
  fecha_presente?: string;
  invitados: InvitadoManifiesto[];
}

export interface InvitadoManifiesto {
  id: string;
  egresado_id: string;
  nombre: string;
  dni?: string;
  asiento_id?: string;
  presente: boolean;
  fecha_presente?: string;
  menor_en_brazos?: boolean;
}

export interface ManifiestoCeremonia {
  ceremoniaId: string;
  ceremoniaNombre: string;
  fechaDescarga: string;
  egresados: EgresadoManifiesto[];
}

export interface AccionAcreditacionPendiente {
  id: string;
  egresadoId: string;
  invitadoIds: string[];
  acreditarEgresado: boolean;
  timestamp: string;
  operador?: string;
}

const STORAGE_MANIFIESTO_KEY = 'sigic_manifiesto_offline';
const STORAGE_COLA_KEY = 'sigic_cola_acreditacion_offline';

/**
 * Guarda el manifiesto completo de la ceremonia en el almacenamiento local.
 */
export function guardarManifiestoOffline(manifiesto: ManifiestoCeremonia): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_MANIFIESTO_KEY, JSON.stringify(manifiesto));
  } catch (error) {
    console.error('Error al guardar manifiesto offline:', error);
  }
}

/**
 * Obtiene el manifiesto guardado localmente.
 */
export function obtenerManifiestoOffline(): ManifiestoCeremonia | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_MANIFIESTO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Busca un egresado o invitado en el manifiesto offline por QR, Token, DNI o ID.
 */
export function buscarEnManifiestoOffline(codigo: string): any | null {
  const manifiesto = obtenerManifiestoOffline();
  if (!manifiesto || !manifiesto.egresados) return null;

  const limpio = codigo.trim().toUpperCase();

  // 1. Búsqueda directa en egresados (Token, DNI, Legajo, ID)
  for (const egresado of manifiesto.egresados) {
    if (
      egresado.token?.toUpperCase() === limpio ||
      egresado.dni === limpio ||
      egresado.legajo?.toUpperCase() === limpio ||
      egresado.id.toUpperCase() === limpio
    ) {
      return {
        tipo: 'grupo',
        egresado,
        invitados: egresado.invitados || [],
        ceremonia: {
          id: manifiesto.ceremoniaId,
          nombre: manifiesto.ceremoniaNombre,
          activa: true,
        },
        origenOffline: true,
      };
    }

    // 2. Búsqueda en invitados de cada egresado
    if (egresado.invitados) {
      for (const invitado of egresado.invitados) {
        if (invitado.id.toUpperCase() === limpio || invitado.dni === limpio) {
          return {
            tipo: 'individual',
            datos: invitado,
            invitado,
            egresado,
            egresadoNombre: egresado.nombre,
            invitadosGrupo: egresado.invitados,
            ceremonia: {
              id: manifiesto.ceremoniaId,
              nombre: manifiesto.ceremoniaNombre,
              activa: true,
            },
            origenOffline: true,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Encola una acreditación para ser enviada al servidor cuando haya conexión.
 */
export function encolarAcreditacionOffline(
  egresadoId: string,
  invitadoIds: string[] = [],
  acreditarEgresado: boolean = true,
  operador?: string
): AccionAcreditacionPendiente {
  const accion: AccionAcreditacionPendiente = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    egresadoId,
    invitadoIds,
    acreditarEgresado,
    timestamp: new Date().toISOString(),
    operador,
  };

  if (typeof window !== 'undefined') {
    try {
      const colaActual = obtenerColaAcreditacionOffline();
      colaActual.push(accion);
      localStorage.setItem(STORAGE_COLA_KEY, JSON.stringify(colaActual));

      // Actualizar estado en el manifiesto offline local para feedback visual inmediato
      const manifiesto = obtenerManifiestoOffline();
      if (manifiesto) {
        const egresado = manifiesto.egresados.find((e) => e.id === egresadoId);
        if (egresado) {
          if (acreditarEgresado) {
            egresado.presente = true;
            egresado.fecha_presente = accion.timestamp;
          }
          if (egresado.invitados) {
            egresado.invitados.forEach((inv) => {
              if (invitadoIds.includes(inv.id)) {
                inv.presente = true;
                inv.fecha_presente = accion.timestamp;
              }
            });
          }
          guardarManifiestoOffline(manifiesto);
        }
      }
    } catch (error) {
      console.error('Error al encolar acreditación offline:', error);
    }
  }

  return accion;
}

/**
 * Obtiene la lista de acreditaciones pendientes de sincronización.
 */
export function obtenerColaAcreditacionOffline(): AccionAcreditacionPendiente[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_COLA_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Limpia la cola de acreditaciones procesadas.
 */
export function limpiarColaAcreditacionOffline(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_COLA_KEY);
  } catch (error) {
    console.error('Error al limpiar cola offline:', error);
  }
}
