import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext.jsx";
import { useToast } from "../hooks/useNotifications.jsx";
import { LockClosedIcon, EnvelopeIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import logo from "../assets/logo.png";

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
    } catch {
      error("Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <ToastContainer />
      
      {/* SECCIÓN IZQUIERDA: IMAGEN Y PRESENTACIÓN (Solo Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-purple-900 items-center justify-center">
        {/* Capa de imagen de fondo */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-30" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80')" }}
        />
        {/* Capa de gradiente overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-purple-900/90 via-purple-800/80 to-transparent" />
        
        {/* Elementos decorativos (Blobs) */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-[80px] opacity-40 animate-pulse" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-fuchsia-500 rounded-full mix-blend-screen filter blur-[80px] opacity-40 animate-pulse" style={{ animationDelay: "2s" }} />

        {/* Contenido principal izquierdo */}
        <div className="relative z-20 text-white px-16 max-w-2xl flex flex-col justify-center">
          <img src={logo} alt="NorteCRM Logo" className="h-56 lg:h-64 w-auto object-contain mb-8" />
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight tracking-tight">
            Gestión inmobiliaria<br/>a otro nivel.
          </h1>
          <p className="text-lg text-purple-100 font-light leading-relaxed max-w-lg mb-8">
            NorteCRM te brinda las herramientas necesarias para potenciar tus ventas, administrar tu cartera de propiedades y organizar tus tareas diarias con absoluta eficiencia.
          </p>
          <div className="flex items-center gap-4 text-sm font-medium text-purple-200">

          </div>
        </div>
      </div>

      {/* SECCIÓN DERECHA: FORMULARIO */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 relative">
        {/* Decoración sutil en móvil */}
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-purple-50 to-white -z-10 lg:hidden" />

        <div className="w-full max-w-md animate-scale-in">
          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Bienvenido de vuelta</h2>
            <p className="text-gray-500 mt-2">Ingresa tus credenciales para acceder al sistema.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative group">
                <EnvelopeIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                <input 
                  className="w-full border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 py-3 pl-11 pr-4 rounded-xl transition-all outline-none text-gray-800 text-sm font-medium placeholder-gray-400 shadow-sm" 
                  placeholder="ejemplo@demo.com"
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  Contraseña
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative group">
                <LockClosedIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                <input 
                  className="w-full border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 py-3 pl-11 pr-4 rounded-xl transition-all outline-none text-gray-800 text-sm font-medium placeholder-gray-400 shadow-sm" 
                  placeholder="••••••••" 
                  type="password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-xl shadow-gray-900/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Verificando...
                </span>
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}
