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
  CheckCircleIcon,
  ClockIcon,
  PlusIcon
} from "@heroicons/react/24/outline";

export default function ActividadesPage() {
  const { token, usuario } = useContext(AuthContext);
  const { success, error, ToastContainer } = useToast();
  const { showConfirm, ConfirmContainer } = useConfirm();
  
  const [actividades, setActividades] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [filtro, setFiltro] = useState("TODAS"); // TODAS, PENDIENTES, COMPLETADAS, VENCIDAS
  const [form, setForm] = useState({
    id: null,
    tipo: "LLAMADA",
    titulo: "",
    descripcion: "",
    fechaVencimiento: "",
    oportunidadId: ""
  });

  const tiposIconos = {
    LLAMADA: PhoneIcon,
    REUNION: CalendarIcon,
    EMAIL: EnvelopeIcon,
    TAREA: ClipboardDocumentListIcon
  };

  const tiposColores = {
    LLAMADA: "bg-blue-100 text-blue-700 border-blue-300",
    REUNION: "bg-purple-100 text-purple-700 border-purple-300",
    EMAIL: "bg-green-100 text-green-700 border-green-300",
    TAREA: "bg-orange-100 text-orange-700 border-orange-300"
  };

  const load = async () => {
    try {
      const { data } = await axios.get("http://localhost:3000/tareas", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActividades(data);

      const opps = await axios.get("http://localhost:3000/propiedades", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOportunidades(opps.data);
    } catch (error) {
      console.error("Error al cargar tareas:", error);
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
        // EDITAR
        await axios.put(
          `http://localhost:3000/tareas/${form.id}`,
          {
            tipo: form.tipo,
            titulo: form.titulo,
            descripcion: form.descripcion,
            fechaVencimiento: form.fechaVencimiento,
            oportunidadId: Number(form.oportunidadId)
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        success("Actividad actualizada exitosamente");
      } else {
        // CREAR
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
        oportunidadId: ""
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

  const eliminarActividad = async (id) => {
    try {
      const confirmed = await showConfirm({
        title: "¿Seguro que deseas eliminar esta actividad?",
        message: "Esta acción no se puede deshacer.",
        type: "danger"
      });

      if (!confirmed) return;

      await axios.delete(`http://localhost:3000/tareas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      success("Actividad eliminada correctamente");
      load();
    } catch (err) {
      console.error("Error al eliminar actividad:", err);
      error(err.response?.data?.error || "Error al eliminar la actividad");
    }
  };

  const actividadesFiltradas = actividades.filter(act => {
    const hoy = new Date();
    const vencimiento = new Date(act.fechaVencimiento);
    const vencida = vencimiento < hoy && !act.completada;

    if (filtro === "PENDIENTES") return !act.completada;
    if (filtro === "COMPLETADAS") return act.completada;
    if (filtro === "VENCIDAS") return vencida;
    return true; // TODAS
  });

  const contadores = {
    total: actividades.length,
    pendientes: actividades.filter(a => !a.completada).length,
    completadas: actividades.filter(a => a.completada).length,
    vencidas: actividades.filter(a => {
      const hoy = new Date();
      const vencimiento = new Date(a.fechaVencimiento);
      return vencimiento < hoy && !a.completada;
    }).length
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
        
        {/* ENCABEZADO */}
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Tareas</h2>
          </div>
          <button
            onClick={() => setOpenForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
          >
            <PlusIcon className="w-4 h-4" />
            Nueva tarea
          </button>
        </div>

        {/* FILTROS Y CONTADORES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          <button
            onClick={() => setFiltro("TODAS")}
            className={`p-2 rounded-lg border transition-all ${
              filtro === "TODAS"
                ? "bg-purple-50 border-purple-500"
                : "bg-white border-gray-200 hover:border-purple-300"
            }`}
          >
            <p className="text-lg font-bold text-gray-800">{contadores.total}</p>
            <p className="text-xs text-gray-600">Todas</p>
          </button>

          <button
            onClick={() => setFiltro("PENDIENTES")}
            className={`p-2 rounded-lg border transition-all ${
              filtro === "PENDIENTES"
                ? "bg-blue-50 border-blue-500"
                : "bg-white border-gray-200 hover:border-blue-300"
            }`}
          >
            <p className="text-lg font-bold text-blue-600">{contadores.pendientes}</p>
            <p className="text-xs text-gray-600">Pendientes</p>
          </button>

          <button
            onClick={() => setFiltro("COMPLETADAS")}
            className={`p-2 rounded-lg border transition-all ${
              filtro === "COMPLETADAS"
                ? "bg-green-50 border-green-500"
                : "bg-white border-gray-200 hover:border-green-300"
            }`}
          >
            <p className="text-lg font-bold text-green-600">{contadores.completadas}</p>
            <p className="text-xs text-gray-600">Completadas</p>
          </button>

          <button
            onClick={() => setFiltro("VENCIDAS")}
            className={`p-2 rounded-lg border transition-all ${
              filtro === "VENCIDAS"
                ? "bg-red-50 border-red-500"
                : "bg-white border-gray-200 hover:border-red-300"
            }`}
          >
            <p className="text-lg font-bold text-red-600">{contadores.vencidas}</p>
            <p className="text-xs text-gray-600">Vencidas</p>
          </button>
        </div>

        {/* LISTA DE ACTIVIDADES */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {actividadesFiltradas.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <ClipboardDocumentListIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No hay tareas {filtro.toLowerCase()}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {actividadesFiltradas.map(act => {
                const IconoTipo = tiposIconos[act.tipo];
                const hoy = new Date();
                const vencimiento = new Date(act.fechaVencimiento);
                const vencida = vencimiento < hoy && !act.completada;

                return (
                  <div
                    key={act.id}
                    className={`p-3 hover:bg-gray-50 transition-colors ${
                      act.completada ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      
                      {/* CHECKBOX */}
                      <button
                        onClick={() => toggleCompletada(act.id, act.completada)}
                        className="mt-0.5"
                      >
                        {act.completada ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full hover:border-purple-500 transition-colors" />
                        )}
                      </button>

                      {/* CONTENIDO */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold border ${tiposColores[act.tipo]} flex items-center gap-1`}>
                              <IconoTipo className="w-3 h-3" />
                              {act.tipo}
                            </span>
                            <h3 className={`font-semibold text-sm ${act.completada ? "line-through text-gray-500" : "text-gray-800"}`}>
                              {act.titulo}
                            </h3>
                            {act.descripcion && (
                              <span className="text-gray-400 text-xs" title="Tiene descripción">
                                📝
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setForm({
                                  id: act.id,
                                  tipo: act.tipo,
                                  titulo: act.titulo,
                                  descripcion: act.descripcion || "",
                                  fechaVencimiento: act.fechaVencimiento.slice(0, 16),
                                  oportunidadId: act.oportunidadId
                                });
                                setOpenForm(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-xs font-bold"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => eliminarActividad(act.id)}
                              className="text-red-500 hover:text-red-700 text-xs font-bold"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>

                        {act.descripcion && (
                          <div className="bg-gray-50 border-l-2 border-purple-300 px-2 py-1.5 mb-1.5 rounded">
                            <p className="text-xs text-gray-700 italic">{act.descripcion}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            {new Date(act.fechaVencimiento).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {vencida && <span className="text-red-600 font-medium ml-1">(Vencida)</span>}
                          </span>

                          <span>•</span>

                          <span>
                            {act.oportunidad?.titulo} - Cliente: {act.oportunidad?.cliente?.nombre}
                            {usuario?.rol === "GERENTE" && (
                              <span className="ml-3">
                                Asesor: <span className="text-purple-600 font-semibold">{act.usuario?.nombre} {act.usuario?.apellido}</span>
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL CREAR/EDITAR ACTIVIDAD */}
        {openForm && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">
                {form.id ? "Editar tarea" : "Nueva tarea"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo *
                  </label>
                  <select
                    className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    <option value="LLAMADA">📞 Coordinar visita</option>
                    <option value="REUNION">📅 Mostrar la propiedad</option>
                    <option value="EMAIL">✉️ Enviar documentación</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título *
                  </label>
                  <input
                    className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                    placeholder="Ej: Llamar para seguimiento"
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none resize-none"
                    placeholder="Detalles adicionales..."
                    rows="3"
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha y hora *
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                    value={form.fechaVencimiento}
                    onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Propiedad *
                  </label>
                  <select
                    className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
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

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => {
                    setOpenForm(false);
                    setForm({
                      id: null,
                      tipo: "LLAMADA",
                      titulo: "",
                      descripcion: "",
                      fechaVencimiento: "",
                      oportunidadId: ""
                    });
                  }}
                  className="text-gray-600 hover:text-gray-800 px-4 py-2 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarActividad}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                >
                  {form.id ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contenedores de Notificaciones */}
        <ToastContainer />
        <ConfirmContainer />
      </div>
    </>
  );
}
