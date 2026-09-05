/**
 * Tipos y modelos de dominio de SiGIC
 */

export type EstadoEgresado = 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO';

export type EstadoAsignacionButacas = 'SIN_SOLICITUD' | 'PENDIENTE_REVISION' | 'CONFIRMADA';

export type RolUsuario = 'ADMINISTRATIVO' | 'PORTERIA';

export type TipoEntregador = 'PROFESOR' | 'FAMILIAR';

export interface Graduado {
  id: string;
  ceremonia_id: string;
  ceremonia_nombre?: string;
  ceremonia_fecha?: string;
  ceremonia_lugar?: string;
  ceremonia_activa?: number | boolean;
  token: string;
  nombre: string;
  legajo: string;
  dni: string;
  correo?: string | null;
  carrera?: string | null;
  anio_inscripcion?: number | null;
  otp?: string | null;
  otp_expira?: string | null;
  asiento_id?: string | null;
  asiento_solicitado_id?: string | null;
  estado_asignacion_butacas: EstadoAsignacionButacas;
  entregador_nombre?: string | null;
  entregador_asiento_id?: string | null;
  telefono?: string | null;
  invitacion_enviada?: boolean;
  invitacion_ultimo_envio_en?: string | null;
  invitacion_envios_count?: number;
  credencial_enviada_en?: string | null;
  credencial_envios_count?: number;
  google_wallet_object_id?: string | null;
  google_wallet_actualizado_en?: string | null;
  identidad_corrobada_en?: string | null;
  estado_flujo?: string;
  perfil_finalizado_en?: string | null;
  aviso_edicion_enviado_en?: string | null;
  estado: EstadoEgresado;
  promedio?: number | null;
  creado_en?: string;
  asientos?: string[];
  invitados?: Invitado[];
}

export interface Invitado {
  id: string;
  egresado_id: string;
  nombre: string;
  dni: string;
  telefono?: string | null;
  correo?: string | null;
  relacion?: string | null;
  asiento_id?: string | null;
  asiento_solicitado_id?: string | null;
  discapacidad?: number | boolean;
  presente?: boolean;
  fecha_presente?: string | null;
  creado_en?: string;
}

export interface Ceremonia {
  id: string;
  nombre: string;
  fecha: string;
  lugar?: string | null;
  max_invitados: number;
  max_entregadores: number;
  activa: number | boolean;
  fecha_limite_respuesta?: string | null;
  fecha_limite_grupo?: string | null;
  fecha_cierre_butacas?: string | null;
}

export interface Profesor {
  id: string;
  nombre: string;
  dni?: string | null;
  materia?: string | null;
}

export interface Entregador {
  id: string;
  egresado_id: string;
  tipo: TipoEntregador;
  profesor_id?: string | null;
  invitado_id?: string | null;
  nombre: string;
  orden: number;
  creado_en?: string;
}

export interface AjusteSistema {
  valor: string;
  descripcion?: string;
  actualizado_en?: string;
}

export interface RespuestaPaseWallet {
  ok: boolean;
  url?: string;
  objectId?: string;
  noConfigurado?: boolean;
  error?: string;
  detalle?: string;
}
