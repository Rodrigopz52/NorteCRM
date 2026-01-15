import { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext.jsx";
import { useToast } from "../hooks/useNotifications.jsx";
import { LockClosedIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const { error, ToastContainer } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      error("Por favor completa todos los campos");
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:3000/auth/login", { email, password });
      login(res.data.token, res.data.usuario);
    } catch (err) {
      const mensajeError = err.response?.data?.error || "Error al intentar iniciar sesión";
      error(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-50 via-gray-50 to-purple-100 px-4 py-8">
      <ToastContainer />
      <div className="w-full max-w-md">
        <div className="text-center mb-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-purple-600 mb-2">NorteCRM</h1>
          <p className="text-sm sm:text-base text-gray-600">Sistema de gestión inmobiliaria</p>
        </div>
        
        <form onSubmit={handleLogin} className="bg-white p-5 sm:p-6 rounded-xl shadow-2xl border border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold mb-5 text-gray-800 text-center">Iniciar Sesión</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-2.5 pl-10 rounded-lg transition-all outline-none text-sm" 
                  placeholder="tu@email.com"
                  type="text"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-2.5 pl-10 rounded-lg transition-all outline-none text-sm" 
                  placeholder="••••••••" 
                  type="password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-2.5 rounded-lg font-semibold mt-5 shadow-md hover:shadow-lg transition-all text-sm"
          >
            {loading ? "Ingresando..." : "Entrar"}
          </button>

          <div className="mt-5 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center mb-2 font-semibold">Credenciales de prueba:</p>
            <p className="text-xs text-gray-500 text-center">Gerente: gerente@crm.com / 123456</p>
            <p className="text-xs text-gray-500 text-center">Admin: admin@crm.com / 123456</p>
            <p className="text-xs text-gray-500 text-center">Vendedor: vendedor@crm.com / 123456</p>
          </div>
        </form>
      </div>
    </div>
  );
}
