// Importamos el formulario con la logica del login.
import { FormularioInicioSesion } from '../componentes/FormularioInicioSesion'
// Importamos el layout que centra la pantalla.
import { LayoutAutenticacion } from '../layouts/LayoutAutenticacion'

export function PaginaInicioSesion({ onInicioSesionExitoso, onVolver }) {
  return (
    // Esta pagina solo compone piezas:
    // layout por fuera y formulario por dentro.
    <LayoutAutenticacion onVolver={onVolver}>
      <FormularioInicioSesion
        onInicioSesionExitoso={onInicioSesionExitoso}
      />
    </LayoutAutenticacion>
  )
}

