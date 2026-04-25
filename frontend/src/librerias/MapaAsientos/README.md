# @jcancelo/mapa-asientos-sigic

Libreria profesional para la visualizacion y gestion de mapas de asientos en entornos institucionales. Desarrollada por Julian Cancelo para el Instituto Tecnologico Beltran.

---

## Introduccion

El componente **MapaAsientos** ofrece una solucion robusta para la representacion de anfiteatros y salas de eventos. Su arquitectura permite una integracion fluida en cualquier proyecto de React, delegando la logica de negocio al consumidor mediante un sistema de propiedades bien definido.

---

## Instalacion

Para integrar esta libreria en su flujo de trabajo, ejecute el siguiente comando en su terminal:

```bash
npm install @jcancelo/mapa-asientos-sigic
```

### Importacion de Estilos
Para que los componentes se visualicen correctamente, debe importar el archivo CSS en el punto de entrada de su aplicacion (ej. `main.js` o `App.js`):

```javascript
import '@jcancelo/mapa-asientos-sigic/dist/style.css';
```

---

## Guia de Uso

### Implementacion Basica

```javascript
import { MapaAsientos } from '@jcancelo/mapa-asientos-sigic';

const Ejemplo = () => {
  const estructura = {
    baja: { filas: 8, asientos: 16 }
  };

  const roles = {
    'baja-A-1': 'autoridad',
    'baja-A-2': 'autoridad',
    'baja-C-5': 'egresado'
  };

  return (
    <MapaAsientos 
      estructura={estructura}
      mapaRoles={roles}
      alHacerClick={(id) => console.log(id)}
    />
  );
};
```

---

## Especificaciones Tecnicas

### Propiedades (API)

| Propiedad | Tipo | Por Defecto | Descripcion |
| :--- | :--- | :--- | :--- |
| **estructura** | Object | `{}` | Definicion de filas y asientos por nivel. |
| **mapaRoles** | Object | `{}` | Asignacion de roles a IDs de asiento especificos. |
| **seleccionados** | Array | `[]` | Coleccion de IDs de asientos marcados como activos. |
| **alHacerClick** | Function | `null` | Metodo disparado al interactuar con un asiento. |
| **zoom** | Number | `1` | Factor de escala para la visualizacion del mapa. |
| **nivelActivo** | String | `'baja'` | Identificador del nivel de sala a renderizar. |

### Roles Soportados
La libreria interpreta los siguientes identificadores de rol para aplicar estilos especificos:
*   `autoridad`
*   `egresado`
*   `discapacitado`
*   `reservado`
*   `disponible` (por defecto)
*   `bloqueado`

---

## Contexto Institucional

Este componente forma parte del proyecto de modernizacion digital del **Instituto Tecnologico Beltran (2026)**. Su desarrollo se centra en la eficiencia, la escalabilidad y la estandarizacion de interfaces para eventos academicos.

## Licencia

Este proyecto se distribuye bajo la licencia MIT.

---
Julian Cancelo - Desarrollo y Arquitectura
Instituto Tecnologico Beltran
