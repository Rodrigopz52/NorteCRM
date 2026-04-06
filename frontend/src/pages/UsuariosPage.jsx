import { useContext, useEffect, useState } from "react";
import api from "../api/api.js";
import { AuthContext } from "../context/AuthContext.jsx";
import { UserGroupIcon, CheckCircleIcon, XCircleIcon, KeyIcon } from "@heroicons/react/24/outline";
import { useToast, useConfirm } from "../hooks/useNotifications.jsx";
import { useNavigate } from "react-router-dom";

export default function UsuariosPage() {
  const { token, usuario } = useContext(AuthContext);
  const { success, error, ToastContainer } = useToast();
  const navigate = useNavigate();
  const { showConfirm, ConfirmContainer } = useConfirm();
  const [usuarios, setUsuarios] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [openResetPassword, setOpenResetPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({ 
    id: null, 
    nombre: "", 
    apellido: "", 
    dni: "",
    email: "", 
    password: "",
    rol: "VENDEDOR" 
  });
  const [passwordForm, setPasswordForm] = useState({ password: "", confirmPassword: "" });

  const fetchUsuarios = async () => {
    try {
      const { data } = await api.get("/usuarios", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    }
  };

  useEffect(() => { 
    if (usuario?.rol === "GERENTE" || usuario?.rol === "ADMINISTRADOR") {
      fetchUsuarios(); 
    }
  }, []);

  const crearOEditarUsuario = async () => {
    try {
      if (!form.nombre || !form.apellido || !form.email) {
        error("Nombre, apellido y email son obligatorios");
        return;
      }

      if (!form.id && !form.password) {
        error("La contraseña es obligatoria para nuevos usuarios");
        return;
      }

      if (form.id) {
        // EDITAR
        await api.put(`/usuarios/${form.id}`, {
          nombre: form.nombre,
          apellido: form.apellido,
          email: form.email,
          dni: form.dni?.trim() || null
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        success("Usuario actualizado correctamente");
      } else {
        // CREAR
        await api.post("/usuarios", {
          nombre: form.nombre,
          apellido: form.apellido,
          email: form.email,
          dni: form.dni?.trim() || null,
          password: form.password,
          rol: form.rol
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        success("Usuario creado exitosamente");
      }

      setOpenForm(false);
      setForm({ id: null, nombre: "", apellido: "", dni: "", email: "", password: "", rol: "VENDEDOR" });
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

      await api.put(`/usuarios/${id}/toggle-activo`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      success("Estado actualizado correctamente");
      fetchUsuarios();
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      error(err.response?.data?.error || "Error al cambiar el estado");
    }
  };

  const resetearPassword = async () => {
    try {
      if (!passwordForm.password || !passwordForm.confirmPassword) {
        error("Ambos campos son obligatorios");
        return;
      }

      if (passwordForm.password !== passwordForm.confirmPassword) {
        error("Las contraseñas no coinciden");
        return;
      }

      if (passwordForm.password.length < 6) {
        error("La contraseña debe tener al menos 6 caracteres");
        return;
      }

      await api.put(
        `/usuarios/${selectedUser.id}/resetear-password`, 
        { password: passwordForm.password },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      success(`Contraseña actualizada para ${selectedUser.nombre}`);
      setOpenResetPassword(false);
      setSelectedUser(null);
      setPasswordForm({ password: "", confirmPassword: "" });
    } catch (err) {
      console.error("Error al resetear contraseña:", err);
      error(err.response?.data?.error || "Error al actualizar la contraseña");
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

  const usuariosActivos = usuarios.filter(u => u.activo).length;
  const usuariosInactivos = usuarios.filter(u => !u.activo).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 overflow-x-hidden">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Gestión de usuarios</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
            {esAdministrador ? "Vista de usuarios del sistema (solo lectura)" : "Administra vendedores y usuarios del sistema"}
          </p>
        </div>
        {!esAdministrador && (
          <button
            onClick={() => {
              setForm({ id: null, nombre: "", apellido: "", email: "", password: "", rol: "VENDEDOR" });
              setOpenForm(true);
            }}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            <UserGroupIcon className="w-4 h-4" />
            + Nuevo usuario
          </button>
        )}
      </div>

      {/* RESUMEN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
        <div className="bg-white p-2 sm:p-3 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <UserGroupIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-gray-800">{usuarios.length}</p>
              <p className="text-gray-500 text-xs font-medium">Total usuarios</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-2 sm:p-3 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-50 text-green-600">
              <CheckCircleIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-gray-800">{usuariosActivos}</p>
              <p className="text-gray-500 text-xs font-medium">Activos</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-2 sm:p-3 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-50 text-red-600">
              <XCircleIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-gray-800">{usuariosInactivos}</p>
              <p className="text-gray-500 text-xs font-medium">Inactivos</p>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-200">
        <table className="w-full text-left min-w-[760px]">
          <thead className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
            <tr>
              <th className="p-3 sm:p-4 font-semibold text-gray-700 text-sm">Nombre</th>
              <th className="p-3 sm:p-4 font-semibold text-gray-700 text-sm">DNI</th>
              <th className="p-3 sm:p-4 font-semibold text-gray-700 text-sm">Email</th>
              <th className="p-3 sm:p-4 font-semibold text-gray-700 text-sm">Rol</th>
              <th className="p-3 sm:p-4 font-semibold text-gray-700 text-center text-sm">Estado</th>
              <th className="p-3 sm:p-4 font-semibold text-gray-700 text-sm">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id} className={`border-b border-gray-100 transition-colors ${
                u.activo ? 'hover:bg-purple-50' : 'bg-gray-50 opacity-60'
              }`}>
                <td className="p-3 sm:p-4">
                  <div>
                    <p className="font-medium text-sm sm:text-base text-gray-800">{u.nombre} {u.apellido}</p>
                    <p className="text-xs text-gray-500">
                      Desde {new Date(u.creadoEn).toLocaleDateString()}
                    </p>
                  </div>
                </td>
                <td className="p-3 sm:p-4 text-sm text-gray-600">{u.dni || "-"}</td>
                <td className="p-3 sm:p-4 text-sm text-gray-600">{u.email}</td>
                <td className="p-3 sm:p-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                    u.rol === "GERENTE" 
                      ? "bg-yellow-100 text-yellow-800" 
                      : u.rol === "ADMINISTRADOR"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    {u.rol}
                  </span>
                </td>
                <td className="p-3 sm:p-4 text-center">
                  {u.activo ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                      ✅ Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                      ❌ Inactivo
                    </span>
                  )}
                </td>
                <td className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                      {(usuario?.rol === "GERENTE" || usuario?.rol === "ADMINISTRADOR") && u.rol === "VENDEDOR" && (
                       <button
                         onClick={() => navigate(`/dashboard?vendedorId=${u.id}`)}
                          className="text-emerald-600 hover:text-emerald-800 font-bold hover:underline transition-colors text-xs sm:text-sm"
                       > 
                       Ver métricas
                       </button>
                      )}

                    {!esAdministrador && (
                    <>
                   <button   
                        onClick={() => {
                          setForm({
                            id: u.id,
                            nombre: u.nombre,
                            apellido: u.apellido,
                            dni: u.dni || "",
                            email: u.email,
                            password: "",
                            rol: u.rol
                          });
                          setOpenForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-bold hover:underline transition-colors text-xs sm:text-sm"
                      >
                        Editar
                      </button>

                      {u.id !== usuario.id && (
                        <button
                          onClick={() => toggleActivo(u.id)}
                          className={`font-bold hover:underline transition-colors text-xs sm:text-sm ${
                            u.activo ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                          }`}
                        >
                          {u.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setOpenResetPassword(true);
                        }}
                        className="text-purple-600 hover:text-purple-800 font-bold hover:underline transition-colors flex items-center gap-1 text-xs sm:text-sm"
                      >
                        <KeyIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        Resetear
                      </button>
                         </>
                       )} 
                      
                        {esAdministrador && u.rol !== "VENDEDOR" && (
                         <span className="text-gray-400 text-xs sm:text-sm italic">Solo lectura</span>
                      )}
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {usuarios.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <UserGroupIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No hay usuarios registrados</p>
          </div>
        )}
      </div>

      {/* MODAL CREAR/EDITAR */}
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
                DNI 
               </label>
               <input
                 className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                 value={form.dni}
                 onChange={(e) => setForm({ ...form, dni: e.target.value.replace(/\D/g, "") })}
                 placeholder="40123456"
                 maxLength={8}
                 />
                <p className="text-xs text-gray-500 mt-1">
                Opcional. Solo números, 7 u 8 dígitos.
                </p>
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

              {!form.id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña Temporal *
                  </label>
                  <input
                    type="password"
                    className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    El usuario podrá cambiarla después
                  </p>
                </div>
              )}

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
                {form.id ? "Actualizar" : "Crear Usuario"}
              </button>
              <button
                onClick={() => {
                  setOpenForm(false);
                  setForm({ id: null, nombre: "", apellido: "", email: "", dni: "", password: "", rol: "VENDEDOR" });
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RESETEAR CONTRASEÑA */}
      {openResetPassword && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center backdrop-blur-sm z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
            <h3 className="text-2xl font-bold mb-2 text-gray-800">
              Resetear Contraseña
            </h3>
            <p className="text-gray-600 mb-6">
              Usuario: <span className="font-semibold">{selectedUser.nombre} {selectedUser.apellido}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña *
                </label>
                <input
                  type="password"
                  className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-lg transition-all outline-none"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Repite la contraseña"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={resetearPassword}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
              >
                Actualizar Contraseña
              </button>
              <button
                onClick={() => {
                  setOpenResetPassword(false);
                  setSelectedUser(null);
                  setPasswordForm({ password: "", confirmPassword: "" });
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
