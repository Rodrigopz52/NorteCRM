import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext.jsx";
import { useToast, useConfirm } from "../hooks/useNotifications.jsx";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  PhoneIcon, 
  CalendarIcon, 
  EnvelopeIcon, 
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/outline";

const etapas = ["CONTACTO", "NEGOCIACION", "EN_ALQUILER", "EN_VENTA", "NO_CONCRETADO"];

export default function OportunidadesPage() {
  const { token, usuario } = useContext(AuthContext);
  const { success, error, ToastContainer } = useToast();
  const { showConfirm, ConfirmContainer } = useConfirm();

  const [opps, setOpps] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({ id: null, titulo: "", notas: "", tipo: "", estado: "", valor: "", clienteId: "" });
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [showActividades, setShowActividades] = useState(false);
  const [formActividad, setFormActividad] = useState({
    tipo: "LLAMADA",
    titulo: "",
    descripcion: "",
    fechaVencimiento: ""
  });
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroCliente, setFiltroCliente] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");

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
    const { data } = await axios.get("http://localhost:3000/oportunidades", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setOpps(data);

    const cl = await axios.get("http://localhost:3000/clientes", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setClientes(cl.data);
  };

  useEffect(() => { load(); }, []);

  const crearOportunidad = async () => {
    if (!form.titulo || !form.clienteId) {
      error("Completa el título y el cliente");
      return;
    }

    try {
      if (form.id) {
        // EDITAR oportunidad existente
        await axios.put(
          `http://localhost:3000/oportunidades/${form.id}`,
          {
            titulo: form.titulo,
            notas: form.notas || null,
            tipo: form.tipo || null,
            estado: form.estado || null,
            valor: form.valor ? parseFloat(form.valor) : null,
            clienteId: Number(form.clienteId)
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        success("Oportunidad actualizada correctamente");
      } else {
        // CREAR nueva oportunidad
        await axios.post(
          "http://localhost:3000/oportunidades",
          {
            titulo: form.titulo,
            notas: form.notas || null,
            tipo: form.tipo || null,
            estado: form.estado || null,
            valor: form.valor ? parseFloat(form.valor) : null,
            etapa: "CONTACTO",
            clienteId: Number(form.clienteId)
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        success("Oportunidad creada exitosamente");
      }

      setForm({ id: null, titulo: "", notas: "", tipo: "", estado: "", valor: "", clienteId: "" });
      setOpenForm(false);
      load();
    } catch (err) {
      console.error("Error al guardar oportunidad:", err);
      error(err.response?.data?.error || "Error al guardar la oportunidad");
    }
  };

    const eliminarOportunidad = async (id) => {
    try {
      const confirmed = await showConfirm({
        title: "¿Seguro que deseas eliminar esta oportunidad?",
        message: "Esta acción no se puede deshacer.",
        type: "danger"
      });

      if (!confirmed) return;

      await axios.delete(`http://localhost:3000/oportunidades/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      success("Oportunidad eliminada correctamente");
      load();
    } catch (err) {
      console.error("Error al eliminar oportunidad:", err);
      error(err.response?.data?.error || "Error al eliminar la oportunidad");
    }
  };

  const crearActividadRapida = async () => {
    if (!formActividad.titulo || !formActividad.fechaVencimiento) {
      error("Completa el título y la fecha");
      return;
    }

    try {
      await axios.post(
        "http://localhost:3000/actividades",
        {
          ...formActividad,
          oportunidadId: selectedOpp.id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFormActividad({
        tipo: "LLAMADA",
        titulo: "",
        descripcion: "",
        fechaVencimiento: ""
      });
      
      success("Actividad creada exitosamente");
      load();
    } catch (err) {
      console.error("Error al crear actividad:", err);
      error(err.response?.data?.error || "Error al crear la actividad");
    }
  };

  const toggleActividadCompletada = async (actividadId, completada) => {
    try {
      await axios.put(
        `http://localhost:3000/actividades/${actividadId}/completar`,
        { completada: !completada },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      load();
    } catch (error) {
      console.error("Error al actualizar actividad:", error);
    }
  };

  const eliminarActividad = async (actividadId) => {
    try {
      const confirmed = await showConfirm({
        title: "¿Seguro que deseas eliminar esta actividad?",
        message: "Esta acción no se puede deshacer.",
        type: "danger"
      });

      if (!confirmed) return;

      await axios.delete(`http://localhost:3000/actividades/${actividadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      success("Actividad eliminada correctamente");
      load();
    } catch (err) {
      console.error("Error al eliminar actividad:", err);
      error(err.response?.data?.error || "Error al eliminar la actividad");
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const id = result.draggableId.replace("op-", "");
    const nuevaEtapa = result.destination.droppableId;

    await axios.put(
      `http://localhost:3000/oportunidades/${id}/etapa`,
      { etapa: nuevaEtapa },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    load();
  };

  // FILTRADO Y BÚSQUEDA
  const oppsFiltradas = opps.filter(opp => {
    // Filtro por tipo
    const cumpleTipo = filtroTipo === "Todos" || opp.tipo === filtroTipo;
    
    // Filtro por estado
    const cumpleEstado = filtroEstado === "Todos" || opp.estado === filtroEstado;
    
    // Filtro por tipo de cliente
    const cumpleTipoCliente = filtroCliente === "Todos" || opp.cliente?.empresa === filtroCliente;
    
    // Búsqueda por título, dirección o cliente
    const terminoBusqueda = busqueda.toLowerCase();
    const cumpleBusqueda = busqueda === "" || 
      opp.titulo.toLowerCase().includes(terminoBusqueda) ||
      (opp.notas && opp.notas.toLowerCase().includes(terminoBusqueda)) ||
      (opp.cliente?.nombre && opp.cliente.nombre.toLowerCase().includes(terminoBusqueda));
    
    return cumpleTipo && cumpleEstado && cumpleTipoCliente && cumpleBusqueda;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 overflow-x-hidden">

      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Propiedades</h2>
        <button
          onClick={() => {
            setForm({ id: null, titulo: "", notas: "", tipo: "", estado: "", valor: "", clienteId: "" });
            setOpenForm(true);
          }}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
        >
          + Nueva propiedad
        </button>
      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="bg-white rounded-lg shadow-sm p-3 mb-3 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2">
          {/* FILTRO TIPO */}
          <div className="lg:w-48">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de Propiedad:</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 p-2 rounded-lg transition-all outline-none text-sm"
            >
              <option value="Todos">📋 Todos</option>
              <option value="Casa">🏠 Casa</option>
              <option value="Dpto">🏢 Departamento</option>
              <option value="Terreno">🌳 Terreno</option>
              <option value="Oficina">💼 Oficina</option>
            </select>
          </div>

          {/* FILTRO ESTADO */}
          <div className="lg:w-48">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Estado:</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 p-2 rounded-lg transition-all outline-none text-sm"
            >
              <option value="Todos">📋 Todos</option>
              <option value="Disponible">✅ Disponible</option>
              <option value="Reservada">⏳ Reservada</option>
              <option value="Alquilada">🏠 Alquilada</option>
              <option value="Vendida">🎉 Vendida</option>
            </select>
          </div>

          {/* FILTRO TIPO DE CLIENTE */}
          <div className="lg:w-48">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de Cliente:</label>
            <select
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              className="w-full border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 p-2 rounded-lg transition-all outline-none text-sm"
            >
              <option value="Todos">📋 Todos</option>
              <option value="INQUILINO">🏠 Inquilino</option>
              <option value="PROPIETARIO">🏘️ Propietario</option>
              <option value="COMPRADOR">💰 Comprador</option>
            </select>
          </div>

          {/* BÚSQUEDA */}
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Búsqueda:</label>
            <input
              type="text"
              placeholder="🔍 Buscar por título, dirección o cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 p-2 rounded-lg transition-all outline-none text-sm"
            />
          </div>

          {/* CONTADOR DE RESULTADOS */}
          <div className="lg:w-40 lg:pt-5">
            <p className="text-xs text-gray-600 text-center lg:text-left">
              <span className="font-bold text-purple-600">{oppsFiltradas.length}</span> de {opps.length}
            </p>
          </div>
        </div>
      </div>

      {/* TABLERO KANBAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
        <DragDropContext onDragEnd={onDragEnd}>
          {etapas.map(etapa => (
            <Droppable droppableId={etapa} key={etapa}>
              {(provided, snapshot) => (
                <div
                  className={`rounded-lg p-2 min-h-[300px] sm:min-h-[400px] lg:min-h-[75vh] transition-colors ${
                    snapshot.isDraggingOver ? 'bg-purple-50 border-2 border-purple-300' : 'bg-white border border-gray-200'
                  }`}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <h3 className="font-bold mb-2 uppercase text-xs tracking-wider text-gray-600 pb-1.5 border-b border-purple-200">
                    {etapa} ({oppsFiltradas.filter(o => o.etapa === etapa).length})
                  </h3>

                  {oppsFiltradas.filter(o => o.etapa === etapa).map((o, index) => {
                    const actividadesPendientes = o.actividades?.filter(a => !a.completada).length || 0;
                    const actividadesVencidas = o.actividades?.filter(a => {
                      const hoy = new Date();
                      const vencimiento = new Date(a.fechaVencimiento);
                      return vencimiento < hoy && !a.completada;
                    }).length || 0;

                    return (
                    <Draggable draggableId={`op-${o.id}`} index={index} key={o.id}>
                      {(provided, snapshot) => (
                        <div
                          className={`bg-white p-2 rounded-lg mb-2 cursor-pointer border transition-all ${
                            snapshot.isDragging 
                              ? 'shadow-2xl border-purple-400 rotate-2' 
                              : 'shadow-sm border-gray-200 hover:shadow-md hover:border-purple-300'
                          }`}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={(e) => {
                            if (!snapshot.isDragging) {
                              setSelectedOpp(o);
                              setShowActividades(true);
                              setForm({
                                id: o.id,
                                titulo: o.titulo,
                                notas: o.notas || "",
                                tipo: o.tipo || "",
                                estado: o.estado || "",
                                valor: o.valor || "",
                                clienteId: o.clienteId
                              });
                            }
                          }}
                        >
                          {/* 1. Título */}
                          <h4 className="font-bold text-sm text-gray-900 mb-1">{o.titulo}</h4>
                          
                          {/* 2. Dirección */}
                          {o.notas && (
                            <p className="text-xs text-gray-700 font-semibold mb-1">📍 {o.notas}</p>
                          )}
                          
                          {/* 3. Cliente */}
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-xs text-gray-800 font-semibold">👤 {o.cliente?.nombre}</span>
                            {o.cliente?.empresa && (
                              <span className={`inline-flex items-center px-1 py-0.5 rounded text-[10px] font-medium ${
                                o.cliente.empresa === 'INQUILINO' ? 'bg-green-100 text-green-700' :
                                o.cliente.empresa === 'PROPIETARIO' ? 'bg-purple-100 text-purple-700' :
                                o.cliente.empresa === 'COMPRADOR' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {o.cliente.empresa}
                              </span>
                            )}
                          </div>
                          
                          {/* 4. Tipo de propiedad */}
                          {o.tipo && (
                            <div className="mb-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                {o.tipo === 'Casa' ? '🏠' : o.tipo === 'Dpto' ? '🏢' : o.tipo === 'Terreno' ? '🌳' : '💼'} {o.tipo === 'Dpto' ? 'Departamento' : o.tipo}
                              </span>
                            </div>
                          )}
                          
                          {/* 5. Estado de propiedad */}
                          {o.estado && (
                            <div className="mb-1.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                o.estado === 'Disponible' ? 'bg-green-100 text-green-700 border border-green-200' :
                                o.estado === 'Reservada' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                o.estado === 'Alquilada' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                'bg-red-100 text-red-700 border border-red-200'
                              }`}>
                                {o.estado === 'Disponible' ? '✅' : o.estado === 'Reservada' ? '⏳' : o.estado === 'Alquilada' ? '🏠' : '🎉'} {o.estado}
                              </span>
                            </div>
                          )}
                          
                          {/* 6. Asesor - MOSTRAR VENDEDOR SOLO PARA GERENTE */}
                          {usuario?.rol === "GERENTE" && o.usuario && (
                            <p className="text-xs text-gray-700 mb-1.5">
                              <span className="font-semibold">Asesor:</span> {o.usuario.nombre}
                            </p>
                          )}
                          
                          {/* 7. Precio */}
                          {o.valor && (
                            <div className="mt-1.5 pt-1.5 border-t border-gray-200">
                              <p className="text-base font-bold text-purple-600">
                                ${o.valor.toLocaleString()}
                              </p>
                            </div>
                          )}

                          {/* INDICADOR DE ACTIVIDADES */}
                          {(actividadesPendientes > 0 || actividadesVencidas > 0) && (
                            <div className="mt-1.5 pt-1.5 border-t border-gray-200 flex items-center gap-1 flex-wrap">
                              {actividadesVencidas > 0 && (
                                <span className="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded border border-red-300">
                                  <ExclamationCircleIcon className="w-3 h-3" />
                                  {actividadesVencidas}
                                </span>
                              )}
                              {actividadesPendientes > 0 && (
                                <span className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-300">
                                  <ClockIcon className="w-3 h-3" />
                                  {actividadesPendientes}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  )})}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </DragDropContext>
      </div>

      {/* MODAL */}
      {openForm && !showActividades && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">
              {form.id ? "Editar propiedad" : "Nueva propiedad"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                  placeholder="Ej: Casa en Palermo"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                  placeholder="Ej: Av. Santa Fe 1234"
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                >
                  <option value="">Seleccionar tipo...</option>
                  <option value="Casa">🏠 Casa</option>
                  <option value="Dpto">🏢 Departamento</option>
                  <option value="Terreno">🌳 Terreno</option>
                  <option value="Oficina">💼 Oficina</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                >
                  <option value="">Seleccionar estado...</option>
                  <option value="Disponible">✅ Disponible</option>
                  <option value="Reservada">⏳ Reservada</option>
                  <option value="Alquilada">🏠 Alquilada</option>
                  <option value="Vendida">🎉 Vendida</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio (USD)
                </label>
                <input
                  type="number"
                  className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                  placeholder="Ej: 250000"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <select
                  className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                  value={form.clienteId}
                  onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => (
                    <option value={c.id} key={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => {
                  setOpenForm(false);
                  setForm({ id: null, titulo: "", notas: "", tipo: "", estado: "", valor: "", clienteId: "" });
                }} 
                className="text-gray-600 hover:text-gray-800 px-4 py-2 font-medium transition-colors"
              >
                Cancelar
              </button>
              {form.id && (
                <button 
                  onClick={() => {
                    eliminarOportunidad(form.id);
                    setOpenForm(false);
                    setForm({ id: null, titulo: "", notas: "", tipo: "", estado: "", valor: "", clienteId: "" });
                  }} 
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                >
                  Eliminar
                </button>
              )}
              <button 
                onClick={crearOportunidad} 
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
              >
                {form.id ? "Actualizar" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXPANDIDO CON ACTIVIDADES */}
      {showActividades && selectedOpp && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl border border-gray-200 max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* HEADER */}
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{selectedOpp.titulo}</h3>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">Cliente: {selectedOpp.cliente?.nombre}</p>
                  {selectedOpp.valor && (
                    <p className="text-purple-600 font-bold text-base sm:text-lg mt-2">
                      ${selectedOpp.valor.toLocaleString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowActividades(false);
                    setSelectedOpp(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                
                {/* COLUMNA IZQUIERDA: DETALLES */}
                <div className="space-y-4">
                  <h4 className="font-bold text-lg text-gray-800 mb-4">Detalles de la propiedad</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título *
                    </label>
                    <input
                      className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                      value={form.titulo}
                      onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección
                    </label>
                    <input
                      className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                      placeholder="Ej: Av. Santa Fe 1234"
                      value={form.notas}
                      onChange={(e) => setForm({ ...form, notas: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo
                    </label>
                    <select
                      className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                      value={form.tipo}
                      onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    >
                      <option value="">Seleccionar tipo...</option>
                      <option value="Casa">🏠 Casa</option>
                      <option value="Dpto">🏢 Departamento</option>
                      <option value="Terreno">🌳 Terreno</option>
                      <option value="Oficina">💼 Oficina</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                      value={form.estado}
                      onChange={(e) => setForm({ ...form, estado: e.target.value })}
                    >
                      <option value="">Seleccionar estado...</option>
                      <option value="Disponible">✅ Disponible</option>
                      <option value="Reservada">⏳ Reservada</option>
                      <option value="Alquilada">🏠 Alquilada</option>
                      <option value="Vendida">🎉 Vendida</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor (USD)
                    </label>
                    <input
                      type="number"
                      className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                      value={form.valor}
                      onChange={(e) => setForm({ ...form, valor: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cliente *
                    </label>
                    <select
                      className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                      value={form.clienteId}
                      onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
                    >
                      {clientes.map(c => (
                        <option value={c.id} key={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={crearOportunidad}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                    >
                      Guardar Cambios
                    </button>
                    <button
                      onClick={() => {
                        eliminarOportunidad(selectedOpp.id);
                        setShowActividades(false);
                        setSelectedOpp(null);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {/* COLUMNA DERECHA: ACTIVIDADES */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-lg text-gray-800">Tareas</h4>
                    <span className="text-sm text-gray-500">
                      {selectedOpp.actividades?.length || 0} total
                    </span>
                  </div>

                  {/* FORMULARIO NUEVA ACTIVIDAD */}
                  <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200 space-y-3">
                    <p className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                      <PlusIcon className="w-4 h-4" />
                      Nueva tarea rápida
                    </p>

                    <select
                      className="w-full border-2 border-gray-200 focus:border-purple-500 p-2 rounded-lg text-sm outline-none"
                      value={formActividad.tipo}
                      onChange={(e) => setFormActividad({ ...formActividad, tipo: e.target.value })}
                    >
                      <option value="LLAMADA">📞 Llamada</option>
                      <option value="REUNION">📅 Reunión</option>
                      <option value="EMAIL">✉️ Email</option>
                      <option value="TAREA">📋 Tarea</option>
                    </select>

                    <input
                      className="w-full border-2 border-gray-200 focus:border-purple-500 p-2 rounded-lg text-sm outline-none"
                      placeholder="Título de la actividad"
                      value={formActividad.titulo}
                      onChange={(e) => setFormActividad({ ...formActividad, titulo: e.target.value })}
                    />

                    <input
                      type="datetime-local"
                      className="w-full border-2 border-gray-200 focus:border-purple-500 p-2 rounded-lg text-sm outline-none"
                      value={formActividad.fechaVencimiento}
                      onChange={(e) => setFormActividad({ ...formActividad, fechaVencimiento: e.target.value })}
                    />

                    <button
                      onClick={crearActividadRapida}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                      Agregar Actividad
                    </button>
                  </div>

                  {/* LISTA DE ACTIVIDADES */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {selectedOpp.actividades?.length === 0 ? (
                      <p className="text-center text-gray-500 text-sm py-8">
                        No hay tareas aún
                      </p>
                    ) : (
                      selectedOpp.actividades?.map(act => {
                        const IconoTipo = tiposIconos[act.tipo];
                        const hoy = new Date();
                        const vencimiento = new Date(act.fechaVencimiento);
                        const vencida = vencimiento < hoy && !act.completada;

                        return (
                          <div
                            key={act.id}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              act.completada
                                ? 'bg-gray-50 border-gray-200 opacity-60'
                                : vencida
                                ? 'bg-red-50 border-red-200'
                                : 'bg-white border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => toggleActividadCompletada(act.id, act.completada)}
                                className="mt-1"
                              >
                                {act.completada ? (
                                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                ) : (
                                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full hover:border-purple-500" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${tiposColores[act.tipo]}`}>
                                    <IconoTipo className="w-3 h-3 inline mr-1" />
                                    {act.tipo}
                                  </span>
                                </div>
                                <p className={`text-sm font-medium ${act.completada ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                  {act.titulo}
                                </p>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                  <ClockIcon className="w-3 h-3" />
                                  {new Date(act.fechaVencimiento).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                  {vencida && <span className="text-red-600 font-medium">(Vencida)</span>}
                                </p>
                              </div>

                              <button
                                onClick={() => eliminarActividad(act.id)}
                                className="text-red-500 hover:text-red-700 text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenedores de Notificaciones */}
      <ToastContainer />
      <ConfirmContainer />
    </div>
  );
}
