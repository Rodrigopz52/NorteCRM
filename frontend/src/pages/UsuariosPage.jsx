import { useContext, useEffect, useState, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext.jsx";
import { UserGroupIcon, CheckCircleIcon, XCircleIcon, ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useToast, useConfirm } from "../hooks/useNotifications.jsx";
import Paginacion from "../components/Paginacion.jsx";

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

export default function UsuariosPage() {
  const { token, usuario } = useContext(AuthContext);
  const { success, error, ToastContainer } = useToast();
  const { showConfirm, ConfirmContainer } = useConfirm();
  const [usuarios, setUsuarios] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({ 
    id: null, 
    nombre: "", 
    apellido: "", 
    email: "", 
    rol: "VENDEDOR",
    dni: ""
  });

  // Paginación y filtros
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [usuariosActivos, setUsuariosActivos] = useState(0);
  const [usuariosInactivos, setUsuariosInactivos] = useState(0);
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("ACTIVOS");
  const [metricasGlobales, setMetricasGlobales] = useState({ totalClientes: 0, totalPropiedades: 0, totalTareas: 0 });
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);
  const limit = 10;

  const fetchUsuarios = async () => {
    try {
      const params = new URLSearchParams({ page: pagina, limit });
      if (busqueda.trim()) params.append("busqueda", busqueda.trim());
      if (filtroRol) params.append("rol", filtroRol);
      if (filtroEstado) params.append("estado", filtroEstado);

      const { data } = await axios.get(`http://localhost:3000/usuarios?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(data.data);
      setTotalPaginas(data.meta.totalPaginas);
      setTotalUsuarios(filtroEstado === "ACTIVOS" ? data.meta.totalActivos : data.meta.totalInactivos);
      setUsuariosActivos(data.meta.totalActivos);
      setUsuariosInactivos(data.meta.totalInactivos);
      if (data.meta.metricasGlobales) {
        setMetricasGlobales(data.meta.metricasGlobales);
      }
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    }
  };

  useEffect(() => { 
    if (usuario?.rol === "GERENTE" || usuario?.rol === "ADMINISTRADOR") {
      fetchUsuarios(); 
    }
  }, [pagina, busqueda, filtroRol, filtroEstado]);

  // Resetear página al cambiar filtros
  useEffect(() => { setPagina(1); }, [busqueda, filtroRol, filtroEstado]);

  // Cerrar menú al hacer click afuera
  useEffect(() => {
    const handleCloseMenu = () => setMenuAbiertoId(null);
    window.addEventListener("click", handleCloseMenu);
    return () => window.removeEventListener("click", handleCloseMenu);
  }, []);

  const crearOEditarUsuario = async () => {
    try {
      if (!form.nombre || !form.apellido || !form.email) {
        error("Nombre, apellido y email son obligatorios");
        return;
      }

      if (form.id) {
        // EDITAR
        await axios.put(`http://localhost:3000/usuarios/${form.id}`, {
          nombre: form.nombre,
          apellido: form.apellido,
          email: form.email,
          dni: form.dni || null
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        success("Usuario actualizado correctamente");
      } else {
        // CREAR
        await axios.post("http://localhost:3000/usuarios", form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        success("Usuario creado exitosamente");
      }

      setOpenForm(false);
      setForm({ id: null, nombre: "", apellido: "", email: "", rol: "VENDEDOR", dni: "" });
      fetchUsuarios();
    } catch (err) {
      console.error("Error al guardar usuario:", err);
      error(err.response?.data?.error || "Error al guardar el usuario");
    }
  };

  const toggleActivo = async (id) => {
    try {
      const confirmed = await showConfirm({
        title: "¿Cambiar el estado de este usuario?",
        message: "Esta acción cambiará el estado activo/inactivo del usuario.",
        type: "warning"
      });

      if (!confirmed) return;

      await axios.put(`http://localhost:3000/usuarios/${id}/toggle-activo`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      success("Estado actualizado correctamente");
      fetchUsuarios();
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      error(err.response?.data?.error || "Error al cambiar el estado");
    }
  };

  if (usuario?.rol !== "GERENTE" && usuario?.rol !== "ADMINISTRADOR") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Acceso Denegado</h2>
          <p className="text-gray-600 mt-2">Solo el gerente o administrador pueden acceder a esta página</p>
        </div>
      </div>
    );
  }

  const esAdministrador = usuario?.rol === "ADMINISTRADOR";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 overflow-x-hidden">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Usuarios</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Administra vendedores y usuarios del sistema
          </p>
        </div>
        <button
          onClick={() => {
            setForm({ id: null, nombre: "", apellido: "", email: "", rol: "VENDEDOR", dni: "" });
            setOpenForm(true);
          }}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
        >
          + Nuevo usuario
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-gray-700 shadow-sm"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <CustomSelect
            value={filtroEstado}
            onChange={setFiltroEstado}
            className="w-1/2 sm:w-44"
            options={[
              { value: "ACTIVOS", label: "Activos" },
              { value: "INACTIVOS", label: "Inactivos" }
            ]}
          />
          <CustomSelect
            value={filtroRol}
            onChange={setFiltroRol}
            className="w-1/2 sm:w-48"
            options={[
              { value: "", label: "Todos los roles" },
              { value: "GERENTE", label: "Gerente" },
              { value: "VENDEDOR", label: "Vendedor" },
              { value: "ADMINISTRADOR", label: "Administrador" }
            ]}
          />
        </div>
      </div>

      {/* CANTIDAD DE USUARIOS */}
      <div className="text-sm font-medium text-gray-500 mb-4 ml-1">
        {totalUsuarios} {totalUsuarios === 1 ? 'usuario' : 'usuarios'}
      </div>

      {/* LISTA DE USUARIOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6 items-start">
        {usuarios.map(u => {
          let avatarBg = "bg-emerald-600";
          if (u.rol === "GERENTE") avatarBg = "bg-purple-600";
          else if (u.rol === "ADMINISTRADOR") avatarBg = "bg-blue-600";

          return (
            <div key={u.id} className={`relative bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-all duration-200 ${!u.activo ? 'opacity-70 grayscale-[20%]' : ''}`}>
              
              {/* Menú de 3 puntos (Kebab Dropdown) */}
              <div className="absolute top-6 right-6">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuAbiertoId(menuAbiertoId === u.id ? null : u.id);
                  }}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM14 10a2 2 0 11-4 0 2 2 0 014 0zM22 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </button>
                {menuAbiertoId === u.id && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-20 animate-fadeIn"
                  >
                    {u.rol === "VENDEDOR" && (
                      <button
                        onClick={() => {
                          setMenuAbiertoId(null);
                          alert("Métricas detalladas próximamente...");
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Ver métricas
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setMenuAbiertoId(null);
                        setForm({
                          id: u.id,
                          nombre: u.nombre,
                          apellido: u.apellido,
                          email: u.email,
                          rol: u.rol,
                          dni: u.dni || ""
                        });
                        setOpenForm(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      Editar
                    </button>
                    {u.id !== usuario.id && !(usuario.rol === "ADMINISTRADOR" && u.rol === "GERENTE") && (
                      <button
                        onClick={() => {
                          setMenuAbiertoId(null);
                          toggleActivo(u.id);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm font-medium flex items-center gap-2 border-t border-gray-50 mt-1 pt-1.5 transition-colors ${
                          u.activo ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Header: Avatar e Información del Usuario */}
              <div className="flex gap-4 items-start mb-5 pr-8">
                <div className={`w-12 h-12 rounded-full ${avatarBg} flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm`}>
                  {u.nombre.charAt(0)}{u.apellido.charAt(0)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-base leading-tight truncate">{u.nombre} {u.apellido}</h3>
                  <p className="text-gray-400 text-xs font-medium mt-1">DNI {u.dni || "—"}</p>
                  
                  {/* Badges de Rol y Estado */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider ${
                      u.rol === "GERENTE" 
                        ? "bg-purple-50 text-purple-600" 
                        : u.rol === "ADMINISTRADOR"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-green-50 text-green-600"
                    }`}>
                      {u.rol}
                    </span>
                    
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                      u.activo ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-gray-500 border border-gray-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      {u.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Datos de contacto */}
              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <span className="truncate font-medium">{u.email}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <span className="truncate font-medium">{u.telefono || "+54 11 0000-0000"}</span>
                </div>
              </div>

              {/* Tarjeta de rendimiento / Métricas globales */}
              {u.rol === "VENDEDOR" ? (
                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100/80 mt-auto">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="font-bold text-gray-800 text-lg leading-none">{u._count?.clientes || 0}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1.5">Clientes</p>
                    </div>
                    <div className="border-l border-gray-200/60">
                      <p className="font-bold text-gray-800 text-lg leading-none">{u._count?.oportunidades || 0}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1.5">Props.</p>
                    </div>
                    <div className="border-l border-gray-200/60">
                      <p className="font-bold text-gray-800 text-lg leading-none">{u._count?.actividades || 0}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1.5">Tareas</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100/80 mt-auto">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="font-bold text-gray-800 text-lg leading-none">{metricasGlobales.totalClientes}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1.5">Clientes</p>
                    </div>
                    <div className="border-l border-gray-200/60">
                      <p className="font-bold text-gray-800 text-lg leading-none">{metricasGlobales.totalPropiedades}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1.5">Props.</p>
                    </div>
                    <div className="border-l border-gray-200/60">
                      <p className="font-bold text-gray-800 text-lg leading-none">{metricasGlobales.totalTareas}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1.5">Tareas</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          );
        })}

        {usuarios.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
            <UserGroupIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No hay usuarios registrados</p>
          </div>
        )}
      </div>

      {/* PAGINACIÓN */}
      <Paginacion
        page={pagina}
        totalPages={totalPaginas}
        total={totalUsuarios}
        limit={limit}
        onPageChange={setPagina}
      />
      {openForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center backdrop-blur-sm z-50 p-4">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">
              {form.id ? "Editar Usuario" : "Nuevo Usuario"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Juan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido *
                </label>
                <input
                  className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                  value={form.apellido}
                  onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                  placeholder="Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="juan@crm.com"
                />
              </div>



              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DNI <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                  value={form.dni}
                  onChange={(e) => {
                    const soloNumeros = e.target.value.replace(/\D/g, "").slice(0, 8);
                    setForm({ ...form, dni: soloNumeros });
                  }}
                  placeholder="Ej: 12345678"
                  inputMode="numeric"
                  maxLength={8}
                />
                {form.dni && form.dni.length < 7 && (
                  <p className="text-xs text-amber-500 mt-1">7 u 8 dígitos</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol *
                </label>
                <select
                  className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value })}
                  disabled={form.id} // No se puede cambiar el rol al editar
                >
                  <option value="VENDEDOR">Vendedor</option>
                  <option value="GERENTE">Gerente</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
                {form.id && (
                  <p className="text-xs text-gray-500 mt-1">
                    El rol no se puede modificar
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={crearOEditarUsuario}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
              >
                {form.id ? "Actualizar" : "Guardar"}
              </button>
              <button
                onClick={() => {
                  setOpenForm(false);
                  setForm({ id: null, nombre: "", apellido: "", email: "", rol: "VENDEDOR", dni: "" });
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-all"
              >
                Cancelar
              </button>
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
