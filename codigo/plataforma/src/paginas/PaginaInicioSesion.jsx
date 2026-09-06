// Importamos el formulario con la logica del login.
import { FormularioInicioSesion } from '../componentes/FormularioInicioSesion'
// Importamos el layout que centra la pantalla.
import { LayoutAutenticacion } from '../layouts/LayoutAutenticacion'

export function PaginaInicioSesion({ onInicioSesionExitoso, onVolver, onIrAEgresado, onIrAManual }) {
  return (
    <LayoutAutenticacion onVolver={onVolver}>
      <FormularioInicioSesion
        onInicioSesionExitoso={onInicioSesionExitoso}
        onIrAEgresado={onIrAEgresado}
        onIrAManual={onIrAManual}
      />
    </LayoutAutenticacion>
  )
}

