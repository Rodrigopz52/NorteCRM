import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext.jsx";
import { UserGroupIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useToast, useConfirm } from "../hooks/useNotifications.jsx";
import Paginacion from "../components/Paginacion.jsx";

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
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [metricasGlobales, setMetricasGlobales] = useState({ totalClientes: 0, totalPropiedades: 0, totalTareas: 0 });
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
      setTotalUsuarios(data.meta.totalActivos + data.meta.totalInactivos);
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
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Usuarios</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">
            {esAdministrador ? "Vista de usuarios del sistema (solo lectura)" : "Administra vendedores y usuarios del sistema"}
          </p>
        </div>
        {!esAdministrador && (
          <button
            onClick={() => {
              setForm({ id: null, nombre: "", apellido: "", email: "", rol: "VENDEDOR", dni: "" });
              setOpenForm(true);
            }}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
          >
            + Nuevo usuario
          </button>
        )}
      </div>

      {/* RESUMEN Y FILTROS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
        <button
          onClick={() => {
            setFiltroRol("");
            setBusqueda("");
            setFiltroEstado("TODOS");
          }}
          className={`p-2 sm:p-3 rounded-lg shadow-sm border text-left flex items-center gap-2 transition-all ${
            filtroEstado === "TODOS" ? "bg-purple-50 border-purple-500" : "bg-white border-gray-200 hover:border-purple-400 hover:shadow-md"
          }`}
        >
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600 flex-shrink-0">
            <UserGroupIcon className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-lg sm:text-xl font-bold ${filtroEstado === "TODOS" ? "text-purple-800" : "text-gray-800"}`}>{totalUsuarios}</p>
            <p className={`text-xs font-medium ${filtroEstado === "TODOS" ? "text-purple-700" : "text-gray-500"}`}>Total usuarios</p>
          </div>
        </button>

        <button
          onClick={() => setFiltroEstado("ACTIVOS")}
          className={`p-2 sm:p-3 rounded-lg shadow-sm border text-left flex items-center gap-2 transition-all ${
            filtroEstado === "ACTIVOS" ? "bg-green-50 border-green-500" : "bg-white border-gray-200 hover:border-green-400 hover:shadow-md"
          }`}
        >
          <div className="p-2 rounded-lg bg-green-50 text-green-600 flex-shrink-0">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-lg sm:text-xl font-bold ${filtroEstado === "ACTIVOS" ? "text-green-800" : "text-gray-800"}`}>{usuariosActivos}</p>
            <p className={`text-xs font-medium ${filtroEstado === "ACTIVOS" ? "text-green-700" : "text-gray-500"}`}>Activos</p>
          </div>
        </button>

        <button
          onClick={() => setFiltroEstado("INACTIVOS")}
          className={`p-2 sm:p-3 rounded-lg shadow-sm border text-left flex items-center gap-2 transition-all ${
            filtroEstado === "INACTIVOS" ? "bg-red-50 border-red-500" : "bg-white border-gray-200 hover:border-red-400 hover:shadow-md"
          }`}
        >
          <div className="p-2 rounded-lg bg-red-50 text-red-600 flex-shrink-0">
            <XCircleIcon className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-lg sm:text-xl font-bold ${filtroEstado === "INACTIVOS" ? "text-red-800" : "text-gray-800"}`}>{usuariosInactivos}</p>
            <p className={`text-xs font-medium ${filtroEstado === "INACTIVOS" ? "text-red-700" : "text-gray-500"}`}>Inactivos</p>
          </div>
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="bg-white rounded-lg shadow-sm p-3 mb-3 border border-gray-200">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              className="sm:w-44 border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 p-2 rounded-lg transition-all outline-none text-sm"
              value={filtroRol}
              onChange={e => setFiltroRol(e.target.value)}
            >
              <option value="">Todos los roles</option>
              <option value="GERENTE">Gerente</option>
              <option value="VENDEDOR">Vendedor</option>
              <option value="ADMINISTRADOR">Administrador</option>
            </select>
            <select
              className="sm:w-36 border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 p-2 rounded-lg transition-all outline-none text-sm"
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
            >
              <option value="TODOS">Todos</option>
              <option value="ACTIVOS">Activos</option>
              <option value="INACTIVOS">Inactivos</option>
            </select>
          </div>
          {/* Buscador */}
          <div className="flex items-center gap-2 lg:ml-auto w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-initial">
              <input
                type="text"
                placeholder="Buscar por nombre, email o DNI..."
                className="w-full lg:w-72 border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 p-2 rounded-lg transition-all outline-none text-sm"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* LISTA DE USUARIOS (GRID MASONRY/ITEMS-START) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6 items-start">
        {usuarios.map(u => (
          <div key={u.id} className={`bg-white rounded-xl shadow-sm border p-5 flex flex-col hover:shadow-md transition-shadow ${!u.activo ? 'opacity-70 grayscale-[30%]' : 'border-gray-200'}`}>
            
            {/* Header: Avatar, Info, Status */}
            <div className="flex gap-4 items-start mb-4">
              {/* Avatar con iniciales */}
              <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {u.nombre.charAt(0)}{u.apellido.charAt(0)}
              </div>
              
              {/* Nombre y DNI */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">{u.nombre} {u.apellido}</h3>
                <p className="text-gray-500 text-sm mt-0.5">DNI: {u.dni || "Sin DNI"}</p>
                
                {/* Badges de Rol y Estado */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                    u.rol === "GERENTE" 
                      ? "bg-purple-100 text-purple-700" 
                      : u.rol === "ADMINISTRADOR"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-50 text-green-700 border border-green-200"
                  }`}>
                    {u.rol}
                  </span>
                  
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                    u.activo ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Datos de contacto */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <span className="truncate">{u.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <span className="truncate">{u.telefono || "+54 11 0000-0000"}</span>
              </div>
            </div>

            {/* Tarjeta de rendimiento / Métricas globales */}
            {u.rol === "VENDEDOR" ? (
              <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-100">
                <p className="text-xs font-bold text-gray-500 mb-2">Rendimiento indiv.</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Clientes</p>
                    <p className="font-bold text-gray-800">{u._count?.clientes || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Propiedades</p>
                    <p className="font-bold text-gray-800">{u._count?.oportunidades || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Tareas asig.</p>
                    <p className="font-bold text-green-600">{u._count?.actividades || 0}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-100">
                <p className="text-xs font-bold text-gray-500 mb-2">Métricas globales CRM</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Clientes</p>
                    <p className="font-bold text-gray-800">{metricasGlobales.totalClientes}</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Propiedades</p>
                    <p className="font-bold text-gray-800">{metricasGlobales.totalPropiedades}</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Tareas activ.</p>
                    <p className="font-bold text-green-600">{metricasGlobales.totalTareas}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
              {esAdministrador ? (
                <span className="text-gray-400 text-xs italic">Vista de solo lectura</span>
              ) : (
                <div className="flex flex-wrap gap-4 w-full justify-between sm:justify-start">
                  {u.rol === "VENDEDOR" && (
                    <button
                      onClick={() => alert("Métricas detalladas próximamente...")}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-semibold transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      Ver métricas
                    </button>
                  )}
                  <button
                    onClick={() => {
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
                    className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm font-semibold transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Editar
                  </button>
                  {u.id !== usuario.id && (
                    <button
                      onClick={() => toggleActivo(u.id)}
                      className={`flex items-center gap-1 text-sm font-semibold transition-colors ${
                        u.activo ? 'text-red-600 hover:text-red-800 ml-auto sm:ml-0' : 'text-green-600 hover:text-green-800 ml-auto sm:ml-0'
                      }`}
                    >
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

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
