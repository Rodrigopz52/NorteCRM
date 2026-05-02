import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext.jsx";
import { useToast, useConfirm } from "../hooks/useNotifications.jsx";
import Paginacion from "../components/Paginacion.jsx";
import { 
  MapPinIcon,
  UserIcon,
  HomeModernIcon,
  ClockIcon,
  ExclamationCircleIcon,
  PlusIcon
} from "@heroicons/react/24/outline";

export default function PropiedadesPage() {
  const { token, usuario } = useContext(AuthContext);
  const { success, error, ToastContainer } = useToast();
  const { showConfirm, ConfirmContainer } = useConfirm();

  const [propiedades, setPropiedades] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [showActividades, setShowActividades] = useState(false);
  
  const [formActividad, setFormActividad] = useState({
    tipo: "LLAMADA", titulo: "", descripcion: "", fechaVencimiento: ""
  });

  const [form, setForm] = useState({ 
    id: null, titulo: "", direccion: "", habitaciones: "", banos: "", 
    garages: "", metrosCuadrados: "", operacion: "", imagenUrl: "", 
    notas: "", tipo: "", valor: "", clienteId: "", etapa: "" 
  });

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroEtapa, setFiltroEtapa] = useState("Todos");
  const [filtroOperacion, setFiltroOperacion] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");

  // Paginación
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalPropiedades, setTotalPropiedades] = useState(0);
  const limit = 12;

  const fetchPropiedades = async () => {
    try {
      const params = new URLSearchParams({ page: pagina, limit });
      if (filtroTipo !== "Todos") params.append("tipo", filtroTipo);
      if (filtroEtapa !== "Todos") params.append("etapa", filtroEtapa);
      if (filtroOperacion !== "Todos") params.append("operacion", filtroOperacion);
      if (busqueda.trim()) params.append("busqueda", busqueda.trim());
      params.append("estadoActivo", "ACTIVOS");

      const { data } = await axios.get(`http://localhost:3000/propiedades?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPropiedades(data.data);
      setTotalPaginas(data.meta.totalPaginas);
      setTotalPropiedades(data.meta.total);

      const cl = await axios.get("http://localhost:3000/clientes?limit=100&estado=ACTIVOS", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClientes(cl.data.data);
    } catch (err) {
      console.error("Error al cargar propiedades:", err);
    }
  };

  useEffect(() => { fetchPropiedades(); }, [pagina, filtroTipo, filtroEtapa, filtroOperacion, busqueda]);

  useEffect(() => { setPagina(1); }, [filtroTipo, filtroEtapa, filtroOperacion, busqueda]);

  const guardarPropiedad = async () => {
    if (!form.titulo || !form.clienteId) {
      error("Completa el título y selecciona un cliente/propietario");
      return;
    }

    if (Number(form.habitaciones) < 0 || Number(form.banos) < 0 || Number(form.garages) < 0 || Number(form.metrosCuadrados) < 0 || Number(form.valor) < 0) {
      error("Las características físicas y el valor no pueden ser negativos");
      return;
    }

    try {
      const payload = {
        titulo: form.titulo,
        direccion: form.direccion,
        habitaciones: form.habitaciones,
        banos: form.banos,
        garages: form.garages,
        metrosCuadrados: form.metrosCuadrados,
        operacion: form.operacion,
        imagenUrl: form.imagenUrl,
        notas: form.notas,
        tipo: form.tipo,
        valor: form.valor,
        etapa: form.etapa || "DISPONIBLE",
        clienteId: Number(form.clienteId)
      };

      if (form.id) {
        await axios.put(`http://localhost:3000/propiedades/${form.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        success("Propiedad actualizada");
      } else {
        await axios.post("http://localhost:3000/propiedades", payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        success("Propiedad creada");
      }

      setOpenForm(false);
      fetchPropiedades();
      if (showActividades) {
        // Actualizamos localmente para no cerrar el modal de golpe
        setSelectedOpp({ ...selectedOpp, ...payload });
      }
    } catch (err) {
      error(err.response?.data?.error || "Error al guardar");
    }
  };

  const toggleActivo = async (id) => {
    try {
      const confirmed = await showConfirm({
        title: "¿Archivar propiedad?",
        message: "La propiedad se ocultará del listado público, pero no se borrará físicamente.",
        type: "warning"
      });
      if (!confirmed) return;

      await axios.put(`http://localhost:3000/propiedades/${id}/toggle-activo`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      success("Propiedad archivada exitosamente");
      fetchPropiedades();
      setShowActividades(false);
    } catch (err) {
      error(err.response?.data?.error || "Error al archivar");
    }
  };

  const crearActividadRapida = async () => {
    if (!formActividad.titulo || !formActividad.fechaVencimiento) {
      error("Completa el título y la fecha");
      return;
    }
    try {
      await axios.post("http://localhost:3000/tareas", {
          ...formActividad, oportunidadId: selectedOpp.id
        }, { headers: { Authorization: `Bearer ${token}` } }
      );
      setFormActividad({ tipo: "LLAMADA", titulo: "", descripcion: "", fechaVencimiento: "" });
      success("Tarea agregada");
      fetchPropiedades();
      
      // Actualizamos la vista del modal
      const { data } = await axios.get(`http://localhost:3000/propiedades?estadoActivo=ACTIVOS&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const actualizada = data.data.find(p => p.id === selectedOpp.id);
      if(actualizada) setSelectedOpp(actualizada);

    } catch (err) {
      error("Error al crear tarea");
    }
  };

  const toggleActividadCompletada = async (actividadId, completada) => {
    try {
      await axios.put(`http://localhost:3000/tareas/${actividadId}/completar`, 
        { completada: !completada },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPropiedades();
      const { data } = await axios.get(`http://localhost:3000/propiedades?estadoActivo=ACTIVOS&limit=100`, { headers: { Authorization: `Bearer ${token}` } });
      const actualizada = data.data.find(p => p.id === selectedOpp.id);
      if(actualizada) setSelectedOpp(actualizada);
    } catch (error) {
      console.error(error);
    }
  };

  const cancelarActividad = async (actividadId) => {
    try {
      const confirmed = await showConfirm({
        title: "¿Cancelar tarea?", message: "Pasará a inactiva y no se listará.", type: "danger"
      });
      if (!confirmed) return;

      await axios.delete(`http://localhost:3000/tareas/${actividadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      success("Tarea cancelada");
      fetchPropiedades();
      
      const { data } = await axios.get(`http://localhost:3000/propiedades?estadoActivo=ACTIVOS&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const actualizada = data.data.find(p => p.id === selectedOpp.id);
      if(actualizada) setSelectedOpp(actualizada);
    } catch (err) {
      error("Error al cancelar");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FE] p-4 sm:p-6 lg:px-8 font-sans">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Propiedades</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">{totalPropiedades} propiedades en total</p>
        </div>
        <button
          onClick={() => {
            setForm({ 
              id: null, titulo: "", direccion: "", habitaciones: "", banos: "", 
              garages: "", metrosCuadrados: "", operacion: "Venta", imagenUrl: "", 
              notas: "", tipo: "Casa", valor: "", clienteId: "", etapa: "DISPONIBLE" 
            });
            setOpenForm(true);
          }}
          className="w-full sm:w-auto bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_4px_14px_0_rgba(139,92,246,0.39)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.23)] hover:-translate-y-0.5 transition-all duration-200"
        >
          + Nueva propiedad
        </button>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col lg:flex-row gap-3 mb-8">
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="lg:w-48 bg-white border border-gray-200 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 p-2.5 rounded-xl transition-all outline-none text-sm font-medium text-gray-700 shadow-sm hover:border-gray-300 cursor-pointer"
        >
          <option value="Todos">Todos los tipos</option>
          <option value="Casa">Casa</option>
          <option value="Dpto">Departamento</option>
          <option value="Terreno">Terreno</option>
          <option value="Oficina">Oficina</option>
        </select>

        <select
          value={filtroEtapa}
          onChange={(e) => setFiltroEtapa(e.target.value)}
          className="lg:w-48 bg-white border border-gray-200 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 p-2.5 rounded-xl transition-all outline-none text-sm font-medium text-gray-700 shadow-sm hover:border-gray-300 cursor-pointer"
        >
          <option value="Todos">Todos los estados</option>
          <option value="DISPONIBLE">Disponible</option>
          <option value="RESERVADA">Reservada</option>
          <option value="VENDIDA">Vendida</option>
          <option value="ALQUILADA">Alquilada</option>
        </select>

        <select
          value={filtroOperacion}
          onChange={(e) => setFiltroOperacion(e.target.value)}
          className="lg:w-48 bg-white border border-gray-200 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 p-2.5 rounded-xl transition-all outline-none text-sm font-medium text-gray-700 shadow-sm hover:border-gray-300 cursor-pointer"
        >
          <option value="Todos">Operación</option>
          <option value="Venta">Venta</option>
          <option value="Alquiler">Alquiler</option>
        </select>

        <div className="relative flex-1">
          <input
            type="text"
            placeholder="🔍 Buscar propiedades..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-white border border-gray-200 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 py-2.5 pl-10 pr-4 rounded-xl transition-all outline-none text-sm font-medium shadow-sm hover:border-gray-300 placeholder-gray-400"
          />
        </div>
      </div>

      {/* GRID DE PROPIEDADES */}
      {propiedades.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <HomeModernIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No se encontraron propiedades</h3>
          <p className="text-gray-500">Prueba cambiando los filtros o agrega una nueva propiedad.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {propiedades.map(p => {
              const actsPendientes = p.actividades?.filter(a => !a.completada).length || 0;
              const actsVencidas = p.actividades?.filter(a => new Date(a.fechaVencimiento) < new Date() && !a.completada).length || 0;

              return (
                <div 
                  key={p.id} 
                  className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer group flex flex-col"
                  onClick={() => {
                    setSelectedOpp(p);
                    setForm({
                      id: p.id, titulo: p.titulo, direccion: p.direccion || "", 
                      habitaciones: p.habitaciones || "", banos: p.banos || "", 
                      garages: p.garages || "", metrosCuadrados: p.metrosCuadrados || "", 
                      operacion: p.operacion || "", imagenUrl: p.imagenUrl || "", 
                      notas: p.notas || "", tipo: p.tipo || "", valor: p.valor || "", 
                      clienteId: p.clienteId, etapa: p.etapa
                    });
                    setShowActividades(true);
                  }}
                >
                  {/* IMAGE HEADER */}
                  <div className="relative h-56 w-full bg-gray-100 overflow-hidden">
                    <img 
                      src={p.imagenUrl || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"} 
                      alt={p.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Operacion Badge */}
                    {p.operacion && (
                      <div className="absolute top-3 right-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg backdrop-blur-md border ${
                          p.operacion === 'Venta' ? 'bg-[#9333EA]/90 border-purple-400/30' : 'bg-[#10B981]/90 border-emerald-400/30'
                        }`}>
                          {p.operacion}
                        </span>
                      </div>
                    )}
                    
                    {/* Etapa Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md border ${
                        p.etapa === 'DISPONIBLE' ? 'bg-blue-500/80 border-blue-400/30' : 
                        p.etapa === 'RESERVADA' ? 'bg-amber-500/80 border-amber-400/30' : 
                        p.etapa === 'VENDIDA' ? 'bg-purple-800/80 border-purple-600/30' : 'bg-emerald-800/80 border-emerald-600/30'
                      }`}>
                        {p.etapa}
                      </span>
                    </div>

                    {/* Precio */}
                    {p.valor && (
                      <div className="absolute bottom-4 left-4">
                        <p className="text-white text-2xl font-bold tracking-tight drop-shadow-md">
                          $ {p.valor.toLocaleString('es-AR')}
                        </p>
                      </div>
                    )}

                    {/* Indicators for tasks */}
                    {(actsPendientes > 0 || actsVencidas > 0) && (
                      <div className="absolute bottom-4 right-4 flex gap-1">
                        {actsVencidas > 0 && (
                          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-lg border border-white">
                            <ExclamationCircleIcon className="w-4 h-4 text-white" />
                          </div>
                        )}
                        {actsPendientes > 0 && actsVencidas === 0 && (
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg border border-white">
                            <ClockIcon className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* BODY */}
                  <div className="p-5 flex-1 flex flex-col bg-white">
                    <h3 className="font-extrabold text-gray-900 text-[17px] line-clamp-1 mb-1.5 group-hover:text-[#8B5CF6] transition-colors">
                      {p.titulo}
                    </h3>
                    <div className="flex items-center text-gray-500 text-sm mb-5 font-medium">
                      <MapPinIcon className="w-4 h-4 mr-1.5 flex-shrink-0 text-gray-400" />
                      <span className="truncate">{p.direccion || "Ubicación a confirmar"}</span>
                    </div>

                    {/* SPECS GRID */}
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[13px] text-gray-600 font-medium mb-5 mt-auto">
                      <div className="flex items-center gap-2">
                        <span className="text-lg opacity-80">🛏️</span>
                        <span className="truncate">{p.habitaciones ?? 0} hab.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg opacity-80">🚿</span>
                        <span className="truncate">{p.banos ?? 0} baños</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg opacity-80">📐</span>
                        <span className="truncate">{p.metrosCuadrados ?? 0} m²</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg opacity-80">🚗</span>
                        <span className="truncate">{p.garages ?? 0} garages</span>
                      </div>
                    </div>

                    {/* FOOTER */}
                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center mt-auto">
                      <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded-md text-xs font-bold border border-blue-100">
                        <HomeModernIcon className="w-3.5 h-3.5" />
                        {p.tipo || "Propiedad"}
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs font-semibold bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                        <UserIcon className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[100px]">{p.usuario?.nombre || "Sin Asignar"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8">
            <Paginacion
              page={pagina}
              totalPages={totalPaginas}
              total={totalPropiedades}
              limit={limit}
              onPageChange={setPagina}
            />
          </div>
        </>
      )}

      {/* MODALES REUTILIZADOS - FORMULARIO EDICION / DETALLES */}
      {(openForm || showActividades) && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1000px] max-h-[90vh] overflow-hidden flex flex-col border border-gray-100">
            
            {/* Header del Modal */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-2xl font-extrabold text-gray-900">
                {form.id ? "Detalles de la propiedad" : "Publicar nueva propiedad"}
              </h3>
              <button 
                onClick={() => {
                  setOpenForm(false);
                  setShowActividades(false);
                  setSelectedOpp(null);
                }}
                className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 p-2 rounded-full transition-colors border border-transparent hover:border-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* COLUMNA IZQUIERDA: FORMULARIO */}
                <div className="space-y-5">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Información Principal</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Título de publicación *</label>
                        <input
                          className="w-full border border-gray-200 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 p-2.5 rounded-lg transition-all outline-none text-sm"
                          placeholder="Ej: Hermosa Casa con Piscina"
                          value={form.titulo}
                          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dirección exacta</label>
                        <input
                          className="w-full border border-gray-200 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 p-2.5 rounded-lg transition-all outline-none text-sm"
                          placeholder="Ej: Av. Libertador 1234, Piso 5"
                          value={form.direccion}
                          onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Precio (USD) *</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                            <input
                              type="number"
                              min="0"
                              className="w-full border border-gray-200 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 p-2.5 pl-7 rounded-lg transition-all outline-none text-sm"
                              placeholder="250000"
                              value={form.valor}
                              onChange={(e) => setForm({ ...form, valor: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Propietario *</label>
                          <select
                            className="w-full border border-gray-200 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 p-2.5 rounded-lg transition-all outline-none text-sm bg-white"
                            value={form.clienteId}
                            onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
                          >
                            <option value="">Seleccionar...</option>
                            {clientes.map(c => <option value={c.id} key={c.id}>{c.nombre}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Operación</label>
                          <select
                            className="w-full border border-gray-200 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 p-2.5 rounded-lg transition-all outline-none text-sm bg-white"
                            value={form.operacion}
                            onChange={(e) => setForm({ ...form, operacion: e.target.value })}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Venta">Venta</option>
                            <option value="Alquiler">Alquiler</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipo</label>
                          <select
                            className="w-full border border-gray-200 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 p-2.5 rounded-lg transition-all outline-none text-sm bg-white"
                            value={form.tipo}
                            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                          >
                            <option value="Casa">Casa</option>
                            <option value="Dpto">Departamento</option>
                            <option value="Terreno">Terreno</option>
                            <option value="Oficina">Oficina</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Etapa</label>
                          <select
                            className="w-full border border-gray-200 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 p-2.5 rounded-lg transition-all outline-none text-sm bg-white"
                            value={form.etapa}
                            onChange={(e) => setForm({ ...form, etapa: e.target.value })}
                          >
                            <option value="DISPONIBLE">Disponible</option>
                            <option value="RESERVADA">Reservada</option>
                            <option value="VENDIDA">Vendida</option>
                            <option value="ALQUILADA">Alquilada</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Características Físicas</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1 text-center">🛏️ Habitaciones</label>
                        <input type="number" min="0" className="w-full border border-gray-200 p-2 rounded-lg text-center outline-none focus:border-[#8B5CF6]" value={form.habitaciones} onChange={e=>setForm({...form, habitaciones: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1 text-center">🚿 Baños</label>
                        <input type="number" min="0" className="w-full border border-gray-200 p-2 rounded-lg text-center outline-none focus:border-[#8B5CF6]" value={form.banos} onChange={e=>setForm({...form, banos: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1 text-center">🚗 Garages</label>
                        <input type="number" min="0" className="w-full border border-gray-200 p-2 rounded-lg text-center outline-none focus:border-[#8B5CF6]" value={form.garages} onChange={e=>setForm({...form, garages: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1 text-center">📐 Metros (m²)</label>
                        <input type="number" min="0" className="w-full border border-gray-200 p-2 rounded-lg text-center outline-none focus:border-[#8B5CF6]" value={form.metrosCuadrados} onChange={e=>setForm({...form, metrosCuadrados: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Multimedia</h4>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">URL de portada</label>
                    <input
                      className="w-full border border-gray-200 focus:border-[#8B5CF6] p-2.5 rounded-lg transition-all outline-none text-sm"
                      placeholder="https://ejemplo.com/foto.jpg"
                      value={form.imagenUrl}
                      onChange={(e) => setForm({ ...form, imagenUrl: e.target.value })}
                    />
                    {form.imagenUrl && (
                      <div className="mt-3 h-24 w-full rounded-lg overflow-hidden border border-gray-200">
                        <img src={form.imagenUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={guardarPropiedad} className="flex-1 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white py-3 rounded-xl font-bold shadow-md transition-colors">
                      {form.id ? "Guardar Cambios" : "Publicar propiedad"}
                    </button>
                    {form.id && usuario?.rol === "GERENTE" && (
                      <button onClick={() => toggleActivo(form.id)} className="bg-red-50 hover:bg-red-100 text-red-600 px-6 rounded-xl font-bold border border-red-200 transition-colors">
                        Archivar
                      </button>
                    )}
                  </div>
                </div>

                {/* COLUMNA DERECHA: TAREAS E HISTORIAL (Solo visible al editar) */}
                {form.id ? (
                  <div className="flex flex-col h-full bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <h4 className="font-extrabold text-gray-900 text-lg mb-4 flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-[#8B5CF6]" />
                      Agenda y tareas
                    </h4>

                    {/* FORMULARIO NUEVA TAREA */}
                    <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm mb-5">
                      <p className="font-bold text-xs text-purple-700 uppercase tracking-wider mb-3">Agregar Gestión</p>
                      <div className="space-y-3">
                        <select
                          className="w-full border border-gray-200 focus:border-[#8B5CF6] p-2 rounded-lg text-sm outline-none"
                          value={formActividad.tipo}
                          onChange={(e) => setFormActividad({ ...formActividad, tipo: e.target.value })}
                        >
                          <option value="LLAMADA">📞 Llamada</option>
                          <option value="REUNION">📅 Visita/Reunión</option>
                          <option value="EMAIL">✉️ Email</option>
                          <option value="TAREA">📋 Trámite/Tarea</option>
                        </select>
                        <input
                          className="w-full border border-gray-200 focus:border-[#8B5CF6] p-2 rounded-lg text-sm outline-none"
                          placeholder="Descripción breve..."
                          value={formActividad.titulo}
                          onChange={(e) => setFormActividad({ ...formActividad, titulo: e.target.value })}
                        />
                        <div className="flex gap-2">
                          <input
                            type="datetime-local"
                            className="flex-1 border border-gray-200 focus:border-[#8B5CF6] p-2 rounded-lg text-sm outline-none"
                            value={formActividad.fechaVencimiento}
                            onChange={(e) => setFormActividad({ ...formActividad, fechaVencimiento: e.target.value })}
                          />
                          <button onClick={crearActividadRapida} className="bg-purple-600 hover:bg-purple-700 text-white px-4 rounded-lg font-bold">
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* LISTA DE TAREAS */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {selectedOpp?.actividades?.length === 0 ? (
                        <div className="text-center py-10">
                          <p className="text-gray-400 text-4xl mb-2">📅</p>
                          <p className="text-sm font-medium text-gray-500">No hay tareas programadas</p>
                        </div>
                      ) : (
                        selectedOpp?.actividades?.map(act => (
                          <div key={act.id} className={`p-3 rounded-xl border transition-all ${act.completada ? 'bg-gray-100 border-gray-200 opacity-70' : 'bg-white border-gray-200 shadow-sm border-l-4 border-l-purple-500'}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 flex-1">
                                <input
                                  type="checkbox"
                                  checked={act.completada}
                                  onChange={() => toggleActividadCompletada(act.id, act.completada)}
                                  className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                                />
                                <div className="flex-1">
                                  <p className={`text-sm font-bold ${act.completada ? 'line-through text-gray-500' : 'text-gray-900'}`}>{act.titulo}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">{act.tipo}</span>
                                    <span className={`text-[10px] font-bold ${new Date(act.fechaVencimiento) < new Date() && !act.completada ? 'text-red-600' : 'text-gray-500'}`}>
                                      {new Date(act.fechaVencimiento).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button onClick={() => cancelarActividad(act.id)} className="text-gray-400 hover:text-red-500 p-1" title="Cancelar tarea">✕</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 to-indigo-50 p-8 rounded-2xl border border-purple-100 items-center justify-center text-center">
                    <HomeModernIcon className="w-20 h-20 text-purple-200 mb-4" />
                    <h4 className="text-xl font-bold text-purple-900 mb-2">Agrega la propiedad al CRM</h4>
                    <p className="text-sm text-purple-700/80 font-medium">Una vez guardada, podrás asignar tareas, programar visitas y hacer seguimiento de las ventas desde aquí.</p>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
      <ConfirmContainer />
    </div>
  );
}
