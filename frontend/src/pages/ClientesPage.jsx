import { useContext, useEffect, useState } from "react";
import api from "../api/api.js";
import { AuthContext } from "../context/AuthContext.jsx";
import { useToast, useConfirm } from "../hooks/useNotifications.jsx";

export default function ClientesPage() {
  const { token, usuario } = useContext(AuthContext);
  const { success, error, ToastContainer } = useToast();
  const { showConfirm, ConfirmContainer } = useConfirm();
  
  const [clientes, setClientes] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({ nombre: "", empresa: "", telefono: "", email: "", notas: "" });

  const fetchClientes = async () => {
    const { data } = await api.get("/clientes", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setClientes(data);
  };

  useEffect(() => { fetchClientes(); }, []);

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
      await api.put(`/clientes/${form.id}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      success("Cliente actualizado correctamente");
    } else {
      await api.post("/clientes", form, {
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

  const eliminar = async (id) => {
    try {
      const { data: oportunidades } = await api.get("/propiedades", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const oportunidadesDelCliente = oportunidades.filter(op => op.clienteId === id);
      
      let title = "¿Seguro que deseas eliminar este cliente?";
      let message = "Esta acción no se puede deshacer.";
      
      if (oportunidadesDelCliente.length > 0) {
        title = "⚠️ Cliente con propiedades asociadas";
        message = `Este cliente tiene ${oportunidadesDelCliente.length} oportunidad(es) asociada(s).\n\nAl eliminar el cliente, también se eliminarán todas sus propiedades.\n\n¿Deseas continuar?`;
      }
      
      const confirmed = await showConfirm({
        title,
        message,
        type: "danger"
      });

      if (!confirmed) return;
      
      const response = await api.delete(`/clientes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.info) {
        success(`${response.data.mensaje} - ${response.data.info}`);
      } else {
        success(response.data.mensaje);
      }
      
      fetchClientes();
    } catch (err) {
      console.error("Error al eliminar cliente:", err);
      error(err.response?.data?.error || "Error al eliminar el cliente");
    }
  };

  const clientesFiltrados = clientes.filter(c => {
    // Filtro por tipo
    const pasaTipo = filtroTipo === "Todos" || c.empresa === filtroTipo;
    
    // Filtro por búsqueda (nombre, email o teléfono)
    const terminoBusqueda = busqueda.toLowerCase().trim();
    const pasaBusqueda = !terminoBusqueda || 
      c.nombre?.toLowerCase().includes(terminoBusqueda) ||
      c.email?.toLowerCase().includes(terminoBusqueda) ||
      c.telefono?.includes(terminoBusqueda);
    
    return pasaTipo && pasaBusqueda;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Clientes</h2>
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
                  className={`px-2.5 py-1.5 rounded-lg font-medium text-xs transition-all ${
                    filtroTipo === tipo
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tipo === "INQUILINO" ? "🏠 Inquilino" : tipo === "PROPIETARIO" ? "🏘️ Propietario" : tipo === "COMPRADOR" ? "💰 Comprador" : "Todos"}
                </button>
              ))}
              <span className="flex items-center text-xs text-gray-500 px-2">
                ({clientesFiltrados.length})
              </span>
            </div>
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

      {/* Tabla para desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">Nombre</th>
              <th className="px-3 py-2 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">Tipo</th>
              <th className="px-3 py-2 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">Email</th>
              <th className="px-3 py-2 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">Teléfono</th>
              {usuario?.rol === "GERENTE" && (
                <th className="px-3 py-2 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">Agente</th>
              )}
              <th className="px-3 py-2 text-left text-xs font-bold text-purple-900 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {clientesFiltrados.map(c => (
              <tr key={c.id} className="hover:bg-purple-50/50 transition-colors">
                <td className="px-3 py-2 text-sm text-gray-800 font-medium">{c.nombre}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    c.empresa === 'INQUILINO' ? 'bg-green-100 text-green-700 border border-green-200' :
                    c.empresa === 'PROPIETARIO' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                    c.empresa === 'COMPRADOR' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                    'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}>
                    {c.empresa || "-"}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm text-gray-600">{c.email || "-"}</td>
                <td className="px-3 py-2 text-sm text-gray-600">{c.telefono || "-"}</td>
                {usuario?.rol === "GERENTE" && (
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                      {c.usuario?.nombre || "Sin asignar"}
                    </span>
                  </td>
                )}
                <td className="px-3 py-2">
                  <button
                    onClick={() => {
                      setForm(c);
                      setOpenForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-bold hover:underline mr-3 transition-colors text-xs"
                  >
                    Editar
                  </button>
                  {usuario?.rol === "GERENTE" && (
                    <button
                      onClick={() => eliminar(c.id)}
                      className="text-red-600 hover:text-red-800 font-bold hover:underline transition-colors text-xs"
                    >
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards para móvil */}
      <div className="md:hidden space-y-2">
        {clientesFiltrados.map(c => (
          <div key={c.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-3">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-800 mb-1">{c.nombre}</h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  c.empresa === 'INQUILINO' ? 'bg-green-100 text-green-700 border border-green-200' :
                  c.empresa === 'PROPIETARIO' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                  c.empresa === 'COMPRADOR' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                  'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  {c.empresa || "-"}
                </span>
              </div>
            </div>
            
            <div className="space-y-1 mb-2">
              <div className="flex items-center text-xs">
                <span className="text-gray-500 w-16">Email:</span>
                <span className="text-gray-800 truncate">{c.email || "-"}</span>
              </div>
              <div className="flex items-center text-xs">
                <span className="text-gray-500 w-16">Teléfono:</span>
                <span className="text-gray-800">{c.telefono || "-"}</span>
              </div>
              {usuario?.rol === "GERENTE" && (
                <div className="flex items-center text-xs">
                  <span className="text-gray-500 w-16">Agente:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                    {c.usuario?.nombre || "Sin asignar"}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => {
                  setForm(c);
                  setOpenForm(true);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg font-medium text-xs transition-colors"
              >
                Editar
              </button>
              {usuario?.rol === "GERENTE" && (
                <button
                  onClick={() => eliminar(c.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-lg font-medium text-xs transition-colors"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

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

              {[
                { field: "telefono", label: "Teléfono", type: "tel", maxLength: 11, pattern: "\\d*" },
                { field: "email", label: "Email", type: "text" },
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

      <ToastContainer />
      <ConfirmContainer />
    </div>
  );
}
