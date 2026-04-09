import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { EnvelopeIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Por favor, ingresa tu correo electrónico.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await axios.post("http://localhost:3000/auth/forgot-password", { email });
      setSuccessMsg(res.data.mensaje || "Revisa tu bandeja de entrada para continuar.");
      setEmail("");
    } catch (err) {
      setErrorMsg("Hubo un error al procesar tu solicitud. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-50 via-gray-50 to-purple-100 px-4 py-8">
      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-200">
        
        <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors mb-6 group">
          <ArrowLeftIcon className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Volver al Login
        </Link>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">Recuperar Contraseña</h2>
        <p className="text-gray-600 text-sm mb-6">
          Ingresa tu dirección de correo electrónico y te enviaremos un enlace para que puedas restablecerla.
        </p>

        {successMsg && (
          <div className="p-4 mb-6 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            ✅ {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            ❌ {errorMsg}
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-2.5 pl-10 rounded-lg transition-all outline-none text-sm" 
                  placeholder="tu@email.com"
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all text-sm"
            >
              {loading ? "Enviando enlace..." : "Enviar enlace de recuperación"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
