import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext.jsx";
import { useToast, useConfirm } from "../hooks/useNotifications.jsx";
import { PhoneIcon, EnvelopeIcon, ChatBubbleLeftEllipsisIcon } from "@heroicons/react/24/outline";
import Paginacion from "../components/Paginacion.jsx";

export default function ClientesPage() {
  const { token, usuario } = useContext(AuthContext);
  const { success, error, ToastContainer } = useToast();
  const { showConfirm, ConfirmContainer } = useConfirm();

  const [clientes, setClientes] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroEstado, setFiltroEstado] = useState("ACTIVOS");
  const [busqueda, setBusqueda] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({ id: null, nombre: "", empresa: "", telefono: "", dni: "", email: "", notas: "", temperatura: "FRIO", interes: "", usuarioId: "" });
  const [tareaModal, setTareaModal] = useState({ open: false, clienteId: null, descripcion: "", fechaLimite: "" });

  // Paginación
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalClientes, setTotalClientes] = useState(0);
  const [clientesActivos, setClientesActivos] = useState(0);
  const [clientesInactivos, setClientesInactivos] = useState(0);
  const limit = 6;

  const fetchClientes = async () => {
    try {
      const params = new URLSearchParams({ page: pagina, limit });
      if (filtroTipo !== "Todos") params.append("tipo", filtroTipo);
      if (filtroEstado) params.append("estado", filtroEstado);
      if (busqueda.trim()) params.append("busqueda", busqueda.trim());

      const { data } = await axios.get(`http://localhost:3000/clientes?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClientes(data.data);
      setTotalPaginas(data.meta.totalPaginas);
      setTotalClientes(data.meta.totalActivos + data.meta.totalInactivos);
      setClientesActivos(data.meta.totalActivos);
      setClientesInactivos(data.meta.totalInactivos);
    } catch (err) {
      console.error("Error al cargar clientes:", err);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [pagina, filtroTipo, filtroEstado, busqueda]); // Refetch automático al cambiar params

  // Si cambia el filtro o la búsqueda, volver a la página 1
  useEffect(() => {
    setPagina(1);
  }, [filtroTipo, filtroEstado, busqueda]);

  const crearCliente = async () => {
    try {
      if (!form.nombre) {
        error("El nombre es obligatorio");
        return;
      }

      if (form.telefono) {
        if (!/^\d+$/.test(form.telefono)) {
          error("El teléfono debe contener solo números");
          return;
        }
        if (form.telefono.length > 11) {
          error("El teléfono no puede tener más de 11 dígitos");
          return;
        }
      }

      if (form.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
          error("El email no tiene un formato válido");
          return;
        }
      }

      if (form.id) {
        await axios.put(`http://localhost:3000/clientes/${form.id}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        success("Cliente actualizado correctamente");
      } else {
        await axios.post("http://localhost:3000/clientes", form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        success("Cliente creado exitosamente");
      }

      setOpenForm(false);
      setForm({ nombre: "", empresa: "", telefono: "", email: "", notas: "" });
      fetchClientes();
    } catch (err) {
      console.error("Error al guardar cliente:", err);
      error(err.response?.data?.error || "Error al guardar el cliente");
    }
  };

  const toggleActivo = async (id, activoActual) => {
    try {
      const confirmed = await showConfirm({
        title: `¿Seguro que deseas ${activoActual ? 'desactivar' : 'activar'} este cliente?`,
        message: activoActual
          ? "El cliente no se eliminará físicamente, pero se ocultará de las listas principales."
          : "El cliente volverá a estar visible en el listado activo.",
        type: activoActual ? "warning" : "info"
      });

      if (!confirmed) return;

      const response = await axios.put(`http://localhost:3000/clientes/${id}/toggle-activo`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      success(response.data.mensaje);
      fetchClientes();
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      error(err.response?.data?.error || "Error al cambiar el estado del cliente");
    }
  };

  const guardarActividad = async () => {
    if (!tareaModal.descripcion.trim()) {
      error("La descripción de la tarea es obligatoria");
      return;
    }
    try {
      await axios.post("http://localhost:3000/actividades", {
        tipo: "TAREA",
        titulo: tareaModal.descripcion,
        descripcion: tareaModal.descripcion,
        fechaVencimiento: tareaModal.fechaLimite || new Date().toISOString(),
        clienteId: tareaModal.clienteId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      success("Tarea guardada");
      setTareaModal({ open: false, clienteId: null, descripcion: "", fechaLimite: "" });
      fetchClientes();
    } catch (err) {
      error("Error al guardar tarea");
    }
  };

  const completarActividad = async (actividadId) => {
    try {
      await axios.put(`http://localhost:3000/actividades/${actividadId}/completar`, {
        completada: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      success("Tarea completada 🎉");
      fetchClientes();
    } catch (err) {
      error("Error al completar la tarea");
    }
  };

  // Eliminado el filtro local ya que ahora se hace en el backend

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Clientes</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Gestión de inquilinos, compradores y propietarios</p>
        </div>
        <button
          onClick={() => setOpenForm(true)}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
        >
          + Nuevo contacto
        </button>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="bg-white rounded-lg shadow-sm p-3 mb-3 border border-gray-200">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
          {/* Filtro por tipo */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-semibold text-gray-700">Filtrar:</span>
            <div className="flex flex-wrap gap-1.5">
              {["Todos", "INQUILINO", "PROPIETARIO", "COMPRADOR"].map(tipo => (
                <button
                  key={tipo}
                  onClick={() => setFiltroTipo(tipo)}
                  className={`px-2.5 py-1.5 rounded-lg font-medium text-xs transition-all ${filtroTipo === tipo
                    ? "bg-purple-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {tipo === "INQUILINO" ? "🏠 Inquilino" : tipo === "PROPIETARIO" ? "🏘️ Propietario" : tipo === "COMPRADOR" ? "💰 Comprador" : "Todos"}
                </button>
              ))}
            </div>

            <select
              className="sm:ml-2 border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 p-2 rounded-lg transition-all outline-none text-sm"
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
            >
              <option value="ACTIVOS">Activos</option>
              <option value="INACTIVOS">Inactivos</option>
              <option value="TODOS">Todos</option>
            </select>
          </div>

          {/* Buscador */}
          <div className="flex items-center gap-2 lg:ml-auto w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-initial">
              <input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                className="w-full lg:w-72 border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 p-2 rounded-lg transition-all outline-none text-sm"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grilla 2 Columnas - Tarjetas Horizontales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {clientes.length > 0 ? (
          clientes.map(c => (
            <div
              key={c.id}
              className={`bg-white rounded-xl shadow-sm border ${c.activo ? 'border-gray-200 hover:shadow-md hover:border-purple-300' : 'border-gray-200 bg-gray-50 opacity-75'} p-4 transition-all flex flex-col sm:flex-row gap-4`}
            >
              {/* Lado Izquierdo: Info & Contacto */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg" title={c.temperatura === 'CALIENTE' ? 'Caliente' : c.temperatura === 'TIBIO' ? 'Tibio' : 'Frío'}>
                    {c.temperatura === 'CALIENTE' ? '🔥' : c.temperatura === 'TIBIO' ? '☀️' : '❄️'}
                  </span>
                  <h3 className="text-base font-bold text-gray-800 line-clamp-1">{c.nombre}</h3>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${c.empresa === 'INQUILINO' ? 'bg-green-100 text-green-700 border border-green-200' :
                      c.empresa === 'PROPIETARIO' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                        c.empresa === 'COMPRADOR' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                          'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                    {c.empresa || "Sin tipo"}
                  </span>
                  {!c.activo && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 uppercase">
                      Inactivo
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-700 font-medium space-y-2 mt-auto bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
                  {c.dni && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 bg-gray-200 px-1.5 rounded">DNI</span>
                      <span>{c.dni}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="w-4 h-4 text-purple-500" />
                    {c.telefono || <span className="italic text-gray-400 text-xs font-normal">Sin teléfono</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <EnvelopeIcon className="w-4 h-4 text-purple-500" />
                    <span className="truncate">{c.email || <span className="italic text-gray-400 text-xs font-normal">Sin email</span>}</span>
                  </div>
                </div>
              </div>

              {/* Lado Derecho: Interés, Tarea & Acciones */}
              <div className="flex-1 flex flex-col border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0 sm:pl-4">
                <div className="flex-1">
                  {c.interes && (
                    <div className="text-xs text-gray-700 mb-2">
                      <span className="font-bold text-gray-400 text-[9px] uppercase tracking-wider block mb-0.5">Busca</span>
                      <span className="line-clamp-2" title={c.interes}>{c.interes}</span>
                    </div>
                  )}
                  {/* Tareas / Actividades */}
                  {c.actividades && c.actividades.length > 0 ? (
                    <div 
                      onClick={() => completarActividad(c.actividades[0].id)}
                      className="inline-flex items-start gap-1.5 mt-1 text-[10px] bg-orange-50 text-orange-700 border border-orange-100 px-2 py-1.5 rounded font-medium cursor-pointer hover:bg-orange-100 transition-colors"
                      title="Haz clic para marcar como completada"
                    >
                      <span className="mt-0.5">⏱️</span>
                      <span className="line-clamp-2">
                        Pendiente: {c.actividades[0].titulo}
                        {c.actividades[0].fechaVencimiento && ` - Vence: ${new Date(c.actividades[0].fechaVencimiento).toLocaleDateString()}`}
                      </span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setTareaModal({ open: true, clienteId: c.id, descripcion: "", fechaLimite: "" })}
                      className="inline-flex items-center gap-1 mt-1 text-[10px] text-gray-500 hover:text-purple-600 bg-gray-50 hover:bg-purple-50 px-2 py-1 rounded border border-dashed border-gray-300 hover:border-purple-300 transition-colors"
                    >
                      <span>+</span> Añadir tarea
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    {c.telefono ? (
                      <>
                        <a href={`tel:${c.telefono}`} title="Llamar" className="text-gray-500 hover:text-green-600 transition-colors p-1.5 bg-gray-100 hover:bg-green-100 rounded-lg">
                          <PhoneIcon className="w-5 h-5" />
                        </a>
                        <a href={`https://wa.me/${c.telefono.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="text-gray-500 hover:text-green-600 transition-colors p-1.5 bg-gray-100 hover:bg-green-100 rounded-lg">
                          <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
                        </a>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-300 p-1.5 bg-gray-50 rounded-lg"><PhoneIcon className="w-5 h-5" /></span>
                        <span className="text-gray-300 p-1.5 bg-gray-50 rounded-lg"><ChatBubbleLeftEllipsisIcon className="w-5 h-5" /></span>
                      </>
                    )}
                    {c.email ? (
                      <a href={`mailto:${c.email}`} title="Enviar Email" className="text-gray-500 hover:text-blue-600 transition-colors p-1.5 bg-gray-100 hover:bg-blue-100 rounded-lg ml-1">
                        <EnvelopeIcon className="w-5 h-5" />
                      </a>
                    ) : (
                      <span className="text-gray-300 p-1.5 bg-gray-50 rounded-lg ml-1"><EnvelopeIcon className="w-5 h-5" /></span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setForm(c);
                        setOpenForm(true);
                      }}
                      className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded font-bold transition-colors text-xs"
                    >
                      Editar
                    </button>
                    {usuario?.rol === "GERENTE" && (
                      <button
                        onClick={() => toggleActivo(c.id, c.activo)}
                        className={`font-bold transition-colors text-xs px-2 py-1 rounded ${c.activo ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                        title={c.activo ? 'Desactivar cliente' : 'Activar cliente'}
                      >
                        {c.activo ? 'Baja' : 'Alta'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="text-gray-500 font-medium">No se encontraron clientes</p>
          </div>
        )}
      </div>

      {/* Controles de Paginación */}
      {clientes.length > 0 && (
        <Paginacion
          page={pagina}
          totalPages={totalPaginas}
          total={totalClientes}
          limit={limit}
          onPageChange={setPagina}
        />
      )}

      {openForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center backdrop-blur-sm z-50 p-4">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">
              {form.id ? "Editar contacto" : "Nuevo contacto"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  placeholder="Nombre *"
                  className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo *
                </label>
                <select
                  className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                  value={form.empresa}
                  onChange={e => setForm({ ...form, empresa: e.target.value })}
                >
                  <option value="">Seleccionar tipo...</option>
                  <option value="INQUILINO">🏠 Inquilino</option>
                  <option value="PROPIETARIO">🏘️ Propietario</option>
                  <option value="COMPRADOR">💰 Comprador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperatura
                </label>
                <select
                  className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                  value={form.temperatura}
                  onChange={e => setForm({ ...form, temperatura: e.target.value })}
                >
                  <option value="FRIO">❄️ Frío (Sin contacto reciente)</option>
                  <option value="TIBIO">☀️ Tibio (En proceso)</option>
                  <option value="CALIENTE">🔥 Caliente (Negociación avanzada)</option>
                </select>
              </div>

              {[
                { field: "telefono", label: "Teléfono", type: "tel", maxLength: 11, pattern: "\\d*" },
                { field: "dni", label: "DNI/Documento", type: "text", maxLength: 8, pattern: "\\d*" },
                { field: "email", label: "Email", type: "text" },
                { field: "interes", label: "Interés en... (Ej: Casa Moderna)", type: "text" },
                { field: "notas", label: "Notas", type: "textarea" }
              ].map(({ field, label, type, maxLength, pattern }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                  </label>
                  {type === "textarea" ? (
                    <textarea
                      placeholder={label}
                      className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none resize-none"
                      rows="3"
                      value={form[field]}
                      onChange={e => setForm({ ...form, [field]: e.target.value })}
                    />
                  ) : (
                    <input
                      type={type}
                      placeholder={label}
                      className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                      value={form[field]}
                      maxLength={maxLength}
                      pattern={pattern}
                      onChange={e => {
                        if (field === "telefono") {
                          const value = e.target.value.replace(/\D/g, "");
                          setForm({ ...form, [field]: value });
                        } else {
                          setForm({ ...form, [field]: e.target.value });
                        }
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                className="text-gray-600 hover:text-gray-800 px-4 py-2 font-medium transition-colors"
                onClick={() => setOpenForm(false)}
              >
                Cancelar
              </button>
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                onClick={crearCliente}
              >
                {form.id ? "Actualizar" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nueva Tarea (Actividad) */}
      {tareaModal.open && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center backdrop-blur-sm z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm border border-gray-200">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Nueva Tarea</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={tareaModal.descripcion}
                  onChange={e => setTareaModal({ ...tareaModal, descripcion: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  placeholder="Ej: Llamar para coordinar visita..."
                  rows="3"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Fecha Límite (Opcional)</label>
                <input
                  type="date"
                  value={tareaModal.fechaLimite}
                  onChange={e => setTareaModal({ ...tareaModal, fechaLimite: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setTareaModal({ open: false, clienteId: null, descripcion: "", fechaLimite: "" })}
                className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarActividad}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                Guardar Tarea
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
      <ConfirmContainer />
    </div>
  );
}
