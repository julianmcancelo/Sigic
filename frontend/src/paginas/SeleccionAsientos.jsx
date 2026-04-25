import { MapaAsientos } from '@jcancelo/mapa-asientos-sigic';

export function SeleccionAsientos({
  ceremoniaId,
  nivel: nivelProp,
  setNivel: setNivelProp,
  zoom: zoomProp,
  setZoom: setZoomProp,
  estructura: estructuraProp,
  mapaRoles: mapaRolesProp,
  seleccionados: seleccionadosProp,
  setSeleccionados: setSeleccionadosProp,
  onSeleccionChange,
  maxSeleccion = 1,
  onConfirmar,
  estaCargando = false,
  onAsientoClick
}) {
  // ... (estados locales iguales)
  const [nivelLocal, setNivelLocal] = useState('baja');
  const [zoomLocal, setZoomLocal] = useState(1);
  const [estructuraLocal, setEstructuraLocal] = useState({
    baja: { filas: 8, asientos: 16 },
    alta: { filas: 6, asientos: 20 }
  });
  const [mapaRolesLocal, setMapaRolesLocal] = useState({});
  const [seleccionadosLocal, setSeleccionadosLocal] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Determinar qué valores usar (Prop o Local)
  const nivel = nivelProp || nivelLocal;
  const setNivel = setNivelProp || setNivelLocal;
  const zoom = zoomProp || zoomLocal;
  const setZoom = setZoomProp || setZoomLocal;
  const estructura = estructuraProp || estructuraLocal;
  const mapaRoles = mapaRolesProp || mapaRolesLocal;
  const seleccionados = seleccionadosProp || seleccionadosLocal;
  const setSeleccionados = setSeleccionadosProp || setSeleccionadosLocal;

  // Carga autónoma
  useEffect(() => {
    if ((!estructuraProp || !mapaRolesProp) && ceremoniaId) {
      setCargando(true);
      fetch(`${BASE}/configuracion/anfiteatro/estructura/${ceremoniaId}`)
        .then(res => res.json())
        .then(data => {
          if (data.estructura) setEstructuraLocal(data.estructura);
          if (data.mapaRoles) setMapaRolesLocal(data.mapaRoles);
        })
        .catch(err => console.error("Error cargando mapa:", err))
        .finally(() => setCargando(false));
    }
  }, [estructuraProp, mapaRolesProp, ceremoniaId]);

  useEffect(() => {
    if (onSeleccionChange) onSeleccionChange(seleccionados);
  }, [seleccionados]);

  const manejarClickAsiento = (id) => {
    if (onAsientoClick) {
      onAsientoClick(id);
      return;
    }

    const rol = mapaRoles[id] || 'disponible';
    if (rol !== 'disponible') return;

    if (seleccionados.includes(id)) {
      setSeleccionados(seleccionados.filter(s => s !== id));
    } else if (seleccionados.length < maxSeleccion) {
      setSeleccionados([...seleccionados, id]);
    }
  };

  if (cargando || !estructura) return <div className="p-20 text-center text-slate-400 font-bold animate-pulse">Cargando Mapa...</div>;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {!nivelProp && (
        <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
          {['baja', 'alta'].map(n => (
            <button
              key={n}
              onClick={() => setNivel(n)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${nivel === n ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400'}`}
            >
              {n === 'baja' ? 'Platea' : 'Pullman'}
            </button>
          ))}
        </div>
      )}

      {/* Uso de la librería MapaAsientos */}
      <MapaAsientos 
        estructura={estructura}
        mapaRoles={mapaRoles}
        seleccionados={seleccionados}
        alHacerClick={manejarClickAsiento}
        zoom={zoom}
        nivelActivo={nivel}
      />

      {/* Leyenda */}
      <div className="mt-8 flex flex-wrap justify-center gap-8 border-t border-slate-50 pt-8 w-full max-w-3xl">
        {LEYENDA.map(item => (
          <div key={item.rol} className="flex items-center gap-3 group/item">
            <div className={`w-4 h-4 rounded-lg ${item.color} shadow-sm group-hover/item:scale-110 transition-transform`}></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{item.label}</span>
          </div>
        ))}
      </div>

      {onConfirmar && !estaCargando && (
        <button
          onClick={() => onConfirmar(seleccionados)}
          disabled={seleccionados.length < maxSeleccion}
          className="mt-8 bg-sky-500 text-white px-12 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-sky-500/40 hover:bg-sky-600 transition-all active:scale-95 disabled:opacity-30"
        >
          Confirmar Reserva de {seleccionados.length} Ubicaciones
        </button>
      )}
    </div>
  );
}
