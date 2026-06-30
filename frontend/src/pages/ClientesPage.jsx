import { useContext, useEffect, useState, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext.jsx";
import { useToast, useConfirm } from "../hooks/useNotifications.jsx";
import { PhoneIcon, EnvelopeIcon, ChatBubbleLeftEllipsisIcon, IdentificationIcon, ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";
import Paginacion from "../components/Paginacion.jsx";
import CustomMultiSelect from "../components/CustomMultiSelect.jsx";

// Helper function to format time elapsed
function formatTiempoHace(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return "Hoy";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  }
  const months = Math.floor(diffDays / 30);
  return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
}

function CustomSelect({ value, onChange, options, className }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-gray-200 bg-white px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-700 shadow-sm cursor-pointer"
      >
        <span className="truncate pr-2 text-left">{selectedOption?.label}</span>
        <ChevronDownIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-full bg-white border border-gray-100 rounded-xl shadow-lg py-1 animate-fadeIn max-h-60 overflow-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${
                value === opt.value ? "bg-gray-50 text-gray-900 font-medium" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="truncate">{opt.label}</span>
              {value === opt.value && <CheckIcon className="w-4 h-4 text-gray-600 flex-shrink-0 ml-2" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClientesPage() {
  const { token, usuario } = useContext(AuthContext);
  const { success, error, ToastContainer } = useToast();
  const { showConfirm, ConfirmContainer } = useConfirm();

  const [clientes, setClientes] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("ACTIVOS");
  const [busqueda, setBusqueda] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ id: null, nombre: "", empresa: "", telefono: "", dni: "", email: "", notas: "", temperatura: "FRIO", interes: "", usuarioId: "" });
  const [tareaModal, setTareaModal] = useState({ open: false, clienteId: null, descripcion: "", fechaLimite: "" });
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);

  // Paginación
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalClientes, setTotalClientes] = useState(0);
  const [totalConTareasPendientes, setTotalConTareasPendientes] = useState(0);
  const [clientesActivos, setClientesActivos] = useState(0);
  const [clientesInactivos, setClientesInactivos] = useState(0);
  const limit = 6;

  const fetchClientes = async () => {
    setLoading(true);
    try {
      // Retraso artificial para efecto premium
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const params = new URLSearchParams({ page: pagina, limit });
      if (filtroTipo.length > 0) params.append("tipo", filtroTipo.join(","));
      if (filtroEstado) params.append("estado", filtroEstado);
      if (busqueda.trim()) params.append("busqueda", busqueda.trim());

      const { data } = await axios.get(`http://localhost:3000/clientes?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClientes(data.data);
      setTotalPaginas(data.meta.totalPaginas);
      setTotalClientes(filtroEstado === "ACTIVOS" ? data.meta.totalActivos : data.meta.totalInactivos);
      setClientesActivos(data.meta.totalActivos);
      setClientesInactivos(data.meta.totalInactivos);
      setTotalConTareasPendientes(data.meta.totalConTareasPendientes || 0);
    } catch (err) {
      console.error("Error al cargar clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [pagina, filtroTipo, filtroEstado, busqueda]); // Refetch automático al cambiar params

  // Cerrar menú al hacer click afuera
  useEffect(() => {
    const handleCloseMenu = () => setMenuAbiertoId(null);
    window.addEventListener("click", handleCloseMenu);
    return () => window.removeEventListener("click", handleCloseMenu);
  }, []);

  // Si cambia el filtro o la búsqueda, volver a la página 1
  useEffect(() => {
    setPagina(1);
  }, [filtroTipo, filtroEstado, busqueda]);

  const crearCliente = async () => {
    try {
      if (!form.nombre || !form.dni) {
        error("El nombre y el DNI son obligatorios");
        return;
      }

      if (form.dni && (form.dni.length < 7 || form.dni.length > 8)) {
        error("El DNI debe tener 7 u 8 dígitos");
        return;
      }

      if (form.dni && !/^\d+$/.test(form.dni)) {
        error("El DNI debe contener solo números");
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
      setForm({ nombre: "", empresa: "", telefono: "", dni: "", email: "", notas: "", temperatura: "FRIO", interes: "", usuarioId: "" });
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
      if (tareaModal.id) {
        await axios.put(`http://localhost:3000/actividades/${tareaModal.id}`, {
          tipo: "TAREA",
          titulo: tareaModal.descripcion,
          descripcion: tareaModal.descripcion,
          fechaVencimiento: tareaModal.fechaLimite || new Date().toISOString(),
          clienteId: tareaModal.clienteId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        success("Tarea actualizada");
      } else {
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
      }
      setTareaModal({ id: null, open: false, clienteId: null, descripcion: "", fechaLimite: "" });
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
      success("Tarea completada");
      fetchClientes();
    } catch (err) {
      error("Error al completar la tarea");
    }
  };

  // Eliminado el filtro local ya que ahora se hace en el backend

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 overflow-x-hidden">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Clientes</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Gestión de inquilinos, compradores y propietarios</p>
        </div>
        <button
          onClick={() => setOpenForm(true)}
          className="w-full sm:w-auto bg-gray-900 hover:bg-black text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
        >
          + Nuevo contacto
        </button>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre, email, teléfono o DNI..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-gray-700 shadow-sm"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <CustomMultiSelect
            value={filtroTipo}
            onChange={setFiltroTipo}
            className="w-1/2 sm:w-48"
            placeholder="Todos los tipos"
            options={[
              { value: "INQUILINO", label: "Inquilinos" },
              { value: "PROPIETARIO", label: "Propietarios" },
              { value: "COMPRADOR", label: "Compradores" }
            ]}
          />
          <CustomSelect
            value={filtroEstado}
            onChange={setFiltroEstado}
            className="w-1/2 sm:w-44"
            options={[
              { value: "ACTIVOS", label: "Activos" },
              { value: "INACTIVOS", label: "Inactivos" }
            ]}
          />
        </div>
      </div>

      {/* CONTADOR DE CLIENTES Y TAREAS */}
      <div className="flex gap-2 text-sm text-gray-500 mb-4 ml-1 animate-fadeIn">
        <span>{totalClientes} {totalClientes === 1 ? 'contacto' : 'contactos'}</span>
        {totalConTareasPendientes > 0 && (
          <>
            <span>•</span>
            <span className="text-orange-500 font-semibold">{totalConTareasPendientes} con tarea pendiente</span>
          </>
        )}
      </div>

      {/* Grilla 2 Columnas - Tarjetas Horizontales */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-2 border-purple-600 border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-400">Cargando clientes...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {clientes.length > 0 ? (
          clientes.map(c => {
            let borderTypeColor = "border-l-gray-200";
            if (c.activo) {
              if (c.empresa === "INQUILINO") borderTypeColor = "border-l-emerald-500";
              else if (c.empresa === "PROPIETARIO") borderTypeColor = "border-l-purple-500";
              else if (c.empresa === "COMPRADOR") borderTypeColor = "border-l-amber-500";
            }

            return (
              <div
                key={c.id}
                className={`relative bg-white rounded-2xl shadow-sm border-y border-r border-l-4 ${borderTypeColor} ${c.activo ? 'border-gray-100' : 'border-gray-100 bg-gray-50 opacity-75'} p-4 transition-all hover:shadow-md duration-200 flex flex-col sm:flex-row gap-4`}
              >
                
                {/* Menú de 3 puntos (Kebab Dropdown) */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuAbiertoId(menuAbiertoId === c.id ? null : c.id);
                    }}
                    className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM14 10a2 2 0 11-4 0 2 2 0 014 0zM22 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </button>
                  {menuAbiertoId === c.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-20 animate-fadeIn"
                    >
                      <button
                        onClick={() => {
                          setMenuAbiertoId(null);
                          setForm(c);
                          setOpenForm(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          setMenuAbiertoId(null);
                          const act = c.actividades?.[0];
                          setTareaModal({
                            id: act ? act.id : null,
                            open: true,
                            clienteId: c.id,
                            descripcion: act ? act.titulo : "",
                            fechaLimite: act && act.fechaVencimiento ? new Date(act.fechaVencimiento).toISOString().split('T')[0] : ""
                          });
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {c.actividades && c.actividades.length > 0 ? "Editar tarea" : "Añadir tarea"}
                      </button>
                      {(usuario?.rol === "GERENTE" || usuario?.rol === "ADMINISTRADOR") && (
                        <button
                          onClick={() => {
                            setMenuAbiertoId(null);
                            toggleActivo(c.id, c.activo);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm font-medium flex items-center gap-2 border-t border-gray-50 mt-1 pt-1.5 transition-colors ${
                            c.activo ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          {c.activo ? 'Desactivar cliente' : 'Activar cliente'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Lado Izquierdo: Info & Contacto */}
                <div className="flex-1 flex flex-col pr-2 justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg" title={c.temperatura === 'CALIENTE' ? 'Caliente' : c.temperatura === 'TIBIO' ? 'Tibio' : 'Frío'}>
                        {c.temperatura === 'CALIENTE' ? '🔥' : c.temperatura === 'TIBIO' ? '☀️' : '❄️'}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 uppercase line-clamp-1 leading-tight">{c.nombre}</h3>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.empresa === 'INQUILINO' ? 'bg-green-50 text-green-700 border border-green-100' :
                          c.empresa === 'PROPIETARIO' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                          c.empresa === 'COMPRADOR' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          'bg-gray-50 text-gray-700 border border-gray-100'
                        }`}>
                        {c.empresa === 'INQUILINO' ? '🏠 INQUILINO' : c.empresa === 'PROPIETARIO' ? '🏘️ PROPIETARIO' : c.empresa === 'COMPRADOR' ? '💰 COMPRADOR' : 'Sin tipo'}
                      </span>
                      {!c.activo && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-800 uppercase">
                          Inactivo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-800 font-medium space-y-2 mt-4">
                    <div className="flex items-center gap-2">
                      <IdentificationIcon className="w-4 h-4 text-gray-900 flex-shrink-0" />
                      <span className="text-sm font-medium">DNI {c.dni || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4 text-gray-900 flex-shrink-0" />
                      <span className="text-sm font-medium">{c.telefono || <span className="italic text-gray-400 text-xs font-normal">Sin teléfono</span>}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <EnvelopeIcon className="w-4 h-4 text-gray-900 flex-shrink-0" />
                      <span className="text-sm font-medium truncate">{c.email || <span className="italic text-gray-400 text-xs font-normal">Sin email</span>}</span>
                    </div>
                  </div>
                </div>

                {/* Lado Derecho: Interés, Tarea & Botones de Comunicación */}
                <div className="flex-1 flex flex-col border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0 sm:pl-4 justify-between">
                  <div className="flex-1">
                    <div className="text-xs text-gray-700 mb-2">
                      <span className="font-bold text-gray-400 text-[9px] uppercase tracking-wider block mb-0.5">Interés</span>
                      <span className="line-clamp-2" title={c.interes || "Sin especificar"}>
                        {c.interes || <span className="italic text-gray-400 font-normal">Sin especificar</span>}
                      </span>
                    </div>
                    
                    {/* Tareas / Actividades */}
                    {c.actividades && c.actividades.length > 0 ? (() => {
                      const tarea = c.actividades[0];
                      const isVencida = new Date(tarea.fechaVencimiento) < new Date();
                      
                      const dateObj = new Date(tarea.fechaVencimiento);
                      const day = dateObj.getDate();
                      const month = dateObj.getMonth() + 1;
                      const year = dateObj.getFullYear();
                      const formattedDate = `${day}/${month}/${year}`;

                      const bgClass = isVencida ? "bg-red-50/70" : "bg-orange-50/70";
                      const textClass = isVencida ? "text-red-700" : "text-orange-700";
                      const borderClass = isVencida ? "border-red-100/80" : "border-orange-100/80";

                      return (
                        <div 
                          onClick={() => completarActividad(tarea.id)}
                          className={`flex items-start justify-between gap-1.5 mt-2 text-[10px] ${bgClass} ${textClass} border ${borderClass} px-2.5 py-2 rounded-xl font-medium cursor-pointer hover:bg-opacity-80 transition-all`}
                          title="Haz clic para marcar como completada"
                        >
                          <div className="flex gap-2 items-start">
                            <span className="mt-0.5 text-xs">{isVencida ? "⚠️" : "⏱️"}</span>
                            <div>
                              <p className="font-semibold text-gray-800 text-[11px] leading-tight">{tarea.titulo}</p>
                              <p className="text-[9px] mt-1 text-gray-500 font-medium">
                                {isVencida ? "Vencida" : "Vence"} {formattedDate}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              completarActividad(tarea.id);
                            }}
                            className="text-gray-400 hover:text-green-600 transition-colors p-1"
                            title="Completar"
                          >
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        </div>
                      );
                    })() : (
                      <button 
                        onClick={() => setTareaModal({ id: null, open: true, clienteId: c.id, descripcion: "", fechaLimite: "" })}
                        className="inline-flex items-center justify-center gap-1.5 mt-2 w-full text-[10px] text-gray-500 hover:text-purple-600 bg-gray-50 hover:bg-purple-50 px-3 py-2 rounded-xl border border-dashed border-gray-300 hover:border-purple-300 transition-colors font-medium"
                      >
                        <span>+</span> Añadir tarea
                      </button>
                    )}
                  </div>

                  {/* Botones de acción integrados horizontalmente al pie del lado derecho */}
                  <div className="flex gap-2 mt-4 pt-2.5 border-t border-gray-100">
                    {c.telefono ? (
                      <>
                        <a href={`tel:${c.telefono}`} className="flex-1 py-1.5 px-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 border border-gray-200/80 transition-colors">
                          <PhoneIcon className="w-3.5 h-3.5 text-gray-900" /> Llamar
                        </a>
                        <a href={`https://wa.me/${c.telefono.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-1.5 px-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 border border-gray-200/80 transition-colors">
                          <ChatBubbleLeftEllipsisIcon className="w-3.5 h-3.5 text-gray-900" /> WhatsApp
                        </a>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 py-1.5 px-2 bg-gray-50 text-gray-300 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 border border-gray-100 cursor-not-allowed">
                          <PhoneIcon className="w-3.5 h-3.5 text-gray-300" /> Llamar
                        </div>
                        <div className="flex-1 py-1.5 px-2 bg-gray-50 text-gray-300 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 border border-gray-100 cursor-not-allowed">
                          <ChatBubbleLeftEllipsisIcon className="w-3.5 h-3.5 text-gray-300" /> WhatsApp
                        </div>
                      </>
                    )}
                    {c.email ? (
                      <a href={`mailto:${c.email}`} className="flex-1 py-1.5 px-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 border border-gray-200/80 transition-colors">
                        <EnvelopeIcon className="w-3.5 h-3.5 text-gray-900" /> Email
                      </a>
                    ) : (
                      <div className="flex-1 py-1.5 px-2 bg-gray-50 text-gray-300 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 border border-gray-100 cursor-not-allowed">
                        <EnvelopeIcon className="w-3.5 h-3.5 text-gray-300" /> Email
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="text-gray-500 font-medium">No se encontraron clientes</p>
          </div>
        )}
      </div>
      )}

      {/* Controles de Paginación */}
      {!loading && clientes.length > 0 && (
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
                { field: "dni", label: "DNI *", type: "text", maxLength: 8, pattern: "\\d*" },
                { field: "email", label: "Email", type: "text" },
                { field: "interes", label: "Interés en... (Ej: Casa Moderna)", type: "text" },
                { field: "notas", label: "Notas", type: "textarea" }
              ].map(({ field, label, type, maxLength, pattern }) => (
                <div key={field} className="mt-4">
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
                        if (field === "telefono" || field === "dni") {
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
