import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext.jsx";
import { useToast, useConfirm } from "../hooks/useNotifications.jsx";
import Navbar from "../components/Navbar.jsx";
import {
  PhoneIcon,
  CalendarIcon,
  EnvelopeIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  HomeIcon,
  UserIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CalendarDaysIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";

export default function TareasPage() {
  const { token, usuario } = useContext(AuthContext);
  const { success, error, ToastContainer } = useToast();
  const { showConfirm, ConfirmContainer } = useConfirm();

  const [actividades, setActividades] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  
  // Filtros
  const [filtro, setFiltro] = useState("PENDIENTES"); 
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [vista, setVista] = useState("GRILLA"); // "GRILLA", "LISTA", "CALENDARIO"

  const [form, setForm] = useState({
    id: null,
    tipo: "LLAMADA",
    titulo: "",
    descripcion: "",
    fechaVencimiento: "",
    oportunidadId: "",
    prioridad: "MEDIA" // Agregado prioridad
  });

  const tiposIconos = {
    LLAMADA: PhoneIcon,
    REUNION: CalendarIcon,
    EMAIL: EnvelopeIcon,
    TAREA: ClipboardDocumentListIcon
  };

  const tiposColoresText = {
    LLAMADA: "text-blue-600",
    REUNION: "text-purple-600",
    EMAIL: "text-green-600",
    TAREA: "text-orange-600"
  };

  const tiposBordes = {
    LLAMADA: "border-blue-400",
    REUNION: "border-purple-400",
    EMAIL: "border-green-400",
    TAREA: "border-orange-400"
  };

  const load = async () => {
    try {
      const { data } = await axios.get("http://localhost:3000/tareas?estadoActivo=TODOS", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActividades(data);

      const opps = await axios.get("http://localhost:3000/propiedades?limit=100", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOportunidades(opps.data.data || opps.data);
    } catch (error) {
      console.error("Error al cargar actividades:", error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const guardarActividad = async () => {
    if (!form.titulo || !form.oportunidadId || !form.fechaVencimiento) {
      error("Completa todos los campos obligatorios");
      return;
    }

    try {
      if (form.id) {
        await axios.put(
          `http://localhost:3000/tareas/${form.id}`,
          {
            tipo: form.tipo,
            titulo: form.titulo,
            descripcion: form.descripcion,
            fechaVencimiento: form.fechaVencimiento,
            oportunidadId: Number(form.oportunidadId),
            prioridad: form.prioridad
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        success("Actividad actualizada exitosamente");
      } else {
        await axios.post(
          "http://localhost:3000/tareas",
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        success("Actividad creada exitosamente");
      }

      setForm({
        id: null,
        tipo: "LLAMADA",
        titulo: "",
        descripcion: "",
        fechaVencimiento: "",
        oportunidadId: "",
        prioridad: "MEDIA"
      });
      setOpenForm(false);
      load();
    } catch (err) {
      console.error("Error al guardar actividad:", err);
      error(err.response?.data?.error || "Error al guardar la actividad");
    }
  };

  const toggleCompletada = async (id, completada) => {
    try {
      await axios.put(
        `http://localhost:3000/tareas/${id}/completar`,
        { completada: !completada },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      load();
    } catch (error) {
      console.error("Error al actualizar actividad:", error);
    }
  };

  const cancelarActividad = async (id) => {
    try {
      const confirmed = await showConfirm({
        title: "¿Seguro que deseas cancelar esta tarea?",
        message: "Pasará a estar inactiva y dejará de ser contabilizada.",
        type: "danger"
      });

      if (!confirmed) return;

      await axios.delete(`http://localhost:3000/tareas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      success("Tarea cancelada correctamente");
      load();
    } catch (err) {
      console.error("Error al cancelar actividad:", err);
      error(err.response?.data?.error || "Error al cancelar la actividad");
    }
  };

  const actividadesFiltradas = actividades.filter(act => {
    const hoy = new Date();
    const vencimiento = new Date(act.fechaVencimiento);
    const vencida = vencimiento < hoy && !act.completada;

    // Filtros de barra
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const tituloMatch = act.titulo?.toLowerCase().includes(q);
      const descMatch = act.descripcion?.toLowerCase().includes(q);
      if (!tituloMatch && !descMatch) return false;
    }
    
    if (filtroTipo !== "TODOS" && act.tipo !== filtroTipo) return false;

    // Filtros por estado (botones)
    if (filtro === "CANCELADAS") return !act.activo;
    if (!act.activo) return false;

    if (filtro === "PENDIENTES") return !act.completada;
    if (filtro === "COMPLETADAS") return act.completada;
    if (filtro === "VENCIDAS") return vencida;
    return true; 
  });

  const contadores = {
    total: actividades.filter(a => a.activo).length,
    pendientes: actividades.filter(a => a.activo && !a.completada).length,
    completadas: actividades.filter(a => a.activo && a.completada).length,
    vencidas: actividades.filter(a => {
      if (!a.activo) return false;
      const hoy = new Date();
      const vencimiento = new Date(a.fechaVencimiento);
      return vencimiento < hoy && !a.completada;
    }).length,
    canceladas: actividades.filter(a => !a.activo).length
  };

  const formatPrioridad = (prioridad) => {
    if (!prioridad) return null;
    const props = {
      ALTA: { color: "bg-red-50 text-red-600 border-red-200", text: "Alta" },
      MEDIA: { color: "bg-yellow-50 text-yellow-600 border-yellow-200", text: "Media" },
      BAJA: { color: "bg-green-50 text-green-600 border-green-200", text: "Baja" }
    };
    return props[prioridad] || props.MEDIA;
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">

        {/* ENCABEZADO */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Tareas</h2>
            <p className="text-sm text-gray-500 font-medium mt-1">Organiza tu agenda y seguimiento de ventas</p>
          </div>
          <button
            onClick={() => setOpenForm(true)}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
          >
            + Nueva tarea
          </button>
        </div>

        {/* BARRA DE FILTROS, BÚSQUEDA Y VISTAS */}
        <div className="bg-white rounded-xl shadow-sm p-3 mb-6 border border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Buscador */}
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar tareas por título o descripción..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 rounded-lg transition-all outline-none text-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Select Tipo */}
            <select
              className="w-full sm:w-auto border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 p-2 rounded-lg transition-all outline-none text-sm bg-white font-medium text-gray-700"
              value={filtroTipo}
              onChange={e => setFiltroTipo(e.target.value)}
            >
              <option value="TODOS">Todos los tipos</option>
              <option value="LLAMADA">Llamada</option>
              <option value="REUNION">Reunión</option>
              <option value="EMAIL">Email</option>
            </select>

            {/* Select Estado */}
            <select
              className="w-full sm:w-auto border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 p-2 rounded-lg transition-all outline-none text-sm bg-white font-medium text-gray-700"
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
            >
              <option value="PENDIENTES">Pendientes ({contadores.pendientes})</option>
              <option value="COMPLETADAS">Completadas ({contadores.completadas})</option>
              <option value="VENCIDAS">Vencidas ({contadores.vencidas})</option>
              <option value="CANCELADAS">Canceladas ({contadores.canceladas})</option>
            </select>
          </div>

          {/* Selector de vistas */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg self-end lg:self-auto border border-gray-200">
            <button 
              onClick={() => setVista("LISTA")}
              className={`p-1.5 rounded-md transition-all ${vista === "LISTA" ? "bg-white text-purple-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              title="Vista de lista"
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setVista("GRILLA")}
              className={`p-1.5 rounded-md transition-all ${vista === "GRILLA" ? "bg-white text-purple-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              title="Vista de tarjetas (Grilla)"
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setVista("CALENDARIO")}
              className={`p-1.5 rounded-md transition-all ${vista === "CALENDARIO" ? "bg-white text-purple-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              title="Vista de calendario (Próximamente)"
            >
              <CalendarDaysIcon className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* CONTENIDO DE TAREAS */}
        {actividadesFiltradas.length === 0 ? (
          <div className="p-16 text-center text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-200">
            <ClipboardDocumentListIcon className="w-20 h-20 mx-auto mb-4 opacity-30 text-purple-500" />
            <p className="text-xl font-semibold text-gray-700">No hay tareas para mostrar</p>
            <p className="text-sm mt-2">Intenta cambiar los filtros o crea una nueva tarea.</p>
          </div>
        ) : vista === "CALENDARIO" ? (
          <div className="p-16 text-center text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center">
             <CalendarDaysIcon className="w-16 h-16 text-gray-300 mb-4" />
             <p className="text-lg font-bold text-gray-700">Vista de Calendario</p>
             <p className="text-sm">Esta función estará disponible en la próxima actualización.</p>
             <button onClick={() => setVista("GRILLA")} className="mt-4 text-purple-600 font-semibold hover:underline">Volver a la Grilla</button>
          </div>
        ) : (
          <div className="mb-10">
            {(() => {
              const getGroupLabel = (dateString) => {
                const hoy = new Date();
                hoy.setHours(0,0,0,0);
                const d = new Date(dateString);
                d.setHours(0,0,0,0);
                
                const diffTime = d - hoy;
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 0) return "HOY";
                if (diffDays === 1) return "MAÑANA";
                if (diffDays === -1) return "AYER";
                if (diffDays > 1 && diffDays <= 7) return "ESTA SEMANA";
                if (diffDays > 7) return "MÁS ADELANTE";
                if (diffDays < -1) return "ANTERIORES";
                return "OTROS";
              };

              const priorityWeight = { ALTA: 3, MEDIA: 2, BAJA: 1 };

              const sortedActividades = [...actividadesFiltradas].sort((a, b) => {
                const dateA = new Date(a.fechaVencimiento);
                const dateB = new Date(b.fechaVencimiento);
                
                const dayA = new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate()).getTime();
                const dayB = new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate()).getTime();
                
                if (dayA !== dayB) return dayA - dayB; // Orden por día
                
                const wA = priorityWeight[a.prioridad] || 0;
                const wB = priorityWeight[b.prioridad] || 0;
                if (wA !== wB) return wB - wA; // Orden por prioridad (Alta primero)
                
                return dateA.getTime() - dateB.getTime(); // Orden por hora
              });

              const groupedActivities = sortedActividades.reduce((acc, act) => {
                const label = getGroupLabel(act.fechaVencimiento);
                if (!acc[label]) acc[label] = [];
                acc[label].push(act);
                return acc;
              }, {});

              return Object.entries(groupedActivities).map(([label, acts]) => (
                <div key={label} className="mb-8">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    {label} <span className="bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full text-[10px]">{acts.length}</span>
                  </h4>
                  <div className={`${vista === "GRILLA" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-4"}`}>
                    {acts.map(act => {
              const IconoTipo = tiposIconos[act.tipo] || ClipboardDocumentListIcon;
              const colorClase = tiposColoresText[act.tipo] || "text-gray-500";
              const bordeClase = tiposBordes[act.tipo] || "border-gray-400";
              const hoy = new Date();
              const vencimiento = new Date(act.fechaVencimiento);
              const vencida = vencimiento < hoy && !act.completada;
              const propPrioridad = formatPrioridad(act.prioridad);

              const leftBorderClase = act.prioridad === 'ALTA' ? 'border-l-red-500' : act.prioridad === 'BAJA' ? 'border-l-green-500' : 'border-l-yellow-500';

              return (
                <div
                  key={act.id}
                  className={`bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 ${leftBorderClase} ${act.completada ? "opacity-60 bg-gray-50/50" : "hover:shadow-md transition-shadow"} p-4 sm:p-5 flex gap-4 items-start`}
                >
                  {/* CHECKBOX */}
                  <button
                    onClick={() => toggleCompletada(act.id, act.completada)}
                    className="mt-0.5 flex-shrink-0 focus:outline-none"
                  >
                    {act.completada ? (
                       <div className="w-5 h-5 rounded flex items-center justify-center bg-green-500 border border-green-500 transition-colors">
                         <CheckIcon className="w-3.5 h-3.5 text-white stroke-[3]" />
                       </div>
                    ) : (
                       <div className={`w-5 h-5 rounded border-2 border-gray-300 hover:bg-gray-50 flex items-center justify-center transition-colors`}>
                       </div>
                    )}
                  </button>

                  {/* CONTENIDO PRINCIPAL */}
                  <div className="flex-1 min-w-0">
                    
                    {/* TOP: Titulo, Prioridad y Menu */}
                    <div className="flex justify-between items-start mb-1 gap-4">
                      <h3 className={`text-base sm:text-lg font-semibold leading-tight ${act.completada ? "line-through text-gray-500" : "text-gray-900"}`}>
                        {act.titulo}
                        {!act.activo && <span className="ml-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border bg-gray-100 text-gray-600 border-gray-300 align-middle">CANCELADA</span>}
                      </h3>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {propPrioridad && act.activo && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${propPrioridad.color}`}>
                            {propPrioridad.text}
                          </span>
                        )}
                        
                        {/* Acciones */}
                        <div className="flex items-center gap-1 text-gray-400">
                          <button
                            onClick={() => {
                              setForm({
                                id: act.id,
                                tipo: act.tipo,
                                titulo: act.titulo,
                                descripcion: act.descripcion || "",
                                fechaVencimiento: act.fechaVencimiento.slice(0, 16),
                                oportunidadId: act.oportunidadId,
                                prioridad: act.prioridad || "MEDIA"
                              });
                              setOpenForm(true);
                            }}
                            className="hover:text-blue-600 transition-colors"
                            title="Editar"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          {act.activo && (
                            <button
                              onClick={() => cancelarActividad(act.id)}
                              className="hover:text-red-600 transition-colors"
                              title="Cancelar tarea"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* MEDIO: Descripción */}
                    {act.descripcion && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {act.descripcion}
                      </p>
                    )}
                    {!act.descripcion && <div className="mb-3"></div>}

                    {/* BOTTOM: Metadata */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        {new Date(act.fechaVencimiento).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </span>
                      
                      <span className="flex items-center gap-1.5">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        {new Date(act.fechaVencimiento).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        {act.usuario?.nombre || 'Duclos'}
                      </span>

                      {act.oportunidad && (
                        <span className="flex items-center gap-1.5">
                          <HomeIcon className="w-4 h-4 text-gray-400" />
                          <span className="truncate max-w-[150px] sm:max-w-xs">{act.oportunidad.cliente?.nombre || 'Cliente'} - {act.oportunidad.titulo}</span>
                        </span>
                      )}

                      {/* Estado */}
                      <span className="flex items-center gap-1.5 ml-auto sm:ml-0 sm:border-l sm:pl-4 border-gray-200">
                        <span className={`w-2 h-2 rounded-full ${act.completada ? 'bg-green-500' : vencida ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                        {act.completada ? 'Completada' : vencida ? 'Vencida' : 'Pendiente'}
                      </span>
                    </div>

                  </div>
                </div>
              );
            })}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {/* MODAL CREAR/EDITAR ACTIVIDAD */}
        {openForm && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">
                {form.id ? "✏️ Editar Tarea" : "✨ Nueva Tarea"}
              </h3>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                      Tipo *
                    </label>
                    <select
                      className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-2.5 rounded-xl transition-all outline-none text-sm font-medium"
                      value={form.tipo}
                      onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    >
                      <option value="LLAMADA">📞 Llamada / Contacto</option>
                      <option value="REUNION">📅 Visita / Reunión</option>
                      <option value="EMAIL">✉️ Enviar correo</option>
                      <option value="TAREA">📝 Tarea general</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                      Prioridad *
                    </label>
                    <select
                      className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-2.5 rounded-xl transition-all outline-none text-sm font-medium"
                      value={form.prioridad}
                      onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
                    >
                      <option value="BAJA">🟢 Baja</option>
                      <option value="MEDIA">🟡 Media</option>
                      <option value="ALTA">🔴 Alta</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Título *
                  </label>
                  <input
                    className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-2.5 rounded-xl transition-all outline-none text-sm"
                    placeholder="Ej: Llamar al cliente para confirmar..."
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Descripción <span className="font-normal text-gray-400">(opcional)</span>
                  </label>
                  <textarea
                    className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-xl transition-all outline-none resize-none text-sm"
                    placeholder="Detalles, recordatorios o notas de la actividad..."
                    rows="3"
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                      Fecha y Hora *
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-2.5 rounded-xl transition-all outline-none text-sm font-medium"
                      value={form.fechaVencimiento}
                      onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                      Relacionado con (Propiedad) *
                    </label>
                    <select
                      className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-2.5 rounded-xl transition-all outline-none text-sm font-medium"
                      value={form.oportunidadId}
                      onChange={(e) => setForm({ ...form, oportunidadId: e.target.value })}
                    >
                      <option value="">Seleccionar propiedad...</option>
                      {oportunidades.map(opp => (
                        <option value={opp.id} key={opp.id}>
                          {opp.titulo} - {opp.cliente?.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setOpenForm(false);
                    setForm({
                      id: null,
                      tipo: "LLAMADA",
                      titulo: "",
                      descripcion: "",
                      fechaVencimiento: "",
                      oportunidadId: "",
                      prioridad: "MEDIA"
                    });
                  }}
                  className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarActividad}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                >
                  {form.id ? "Guardar Cambios" : "Crear Tarea"}
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastContainer />
        <ConfirmContainer />
      </div>
    </>
  );
}
