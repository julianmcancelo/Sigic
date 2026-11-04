import { Users, MapPin, QrCode } from 'lucide-react'

// Accesos rápidos del panel de administración
// El campo "pantalla" es el nombre que se le pasa a onNavegar() en App.jsx
export const accesosRapidos = [
  {
    titulo: 'Gestionar invitados',
    icono: Users,
    pantalla: 'gestion-invitados',
  },
  {
    titulo: 'Mapa de asientos',
    icono: MapPin,
    pantalla: null, // pendiente de implementar
  },
  {
    titulo: 'Configuración',
    icono: Users,
    pantalla: 'gestion-invitados',
  },
  {
    titulo: 'Códigos QR',
    icono: QrCode,
    pantalla: 'gestion-invitados', // por ahora va al mismo panel
  },
]
