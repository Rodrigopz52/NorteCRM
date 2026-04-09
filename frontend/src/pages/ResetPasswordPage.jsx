import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { LockClosedIcon } from "@heroicons/react/24/outline";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setErrorMsg("El enlace de recuperación es inválido o no existe.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setErrorMsg("Por favor, completa ambos campos.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await axios.post("http://localhost:3000/auth/reset-password", { token, password });
      setSuccessMsg(res.data.mensaje || "Contraseña actualizada exitosamente.");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Hubo un error al restablecer la contraseña. Puede que el enlace esté expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-50 via-gray-50 to-purple-100 px-4 py-8">
      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-200">
        
        <div className="text-center mb-6">
          <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <LockClosedIcon className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Crea tu nueva contraseña</h2>
        </div>

        {successMsg && (
          <div className="text-center">
            <div className="p-4 mb-6 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              ✅ {successMsg}
            </div>
            <Link 
              to="/" 
              className="inline-block w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg font-semibold shadow-md transition-all text-sm"
            >
              Ir a Iniciar Sesión
            </Link>
          </div>
        )}

        {!successMsg && !token && (
          <div className="text-center">
            <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              ❌ {errorMsg}
            </div>
            <Link to="/" className="text-purple-600 font-medium hover:underline text-sm">
              Volver al Login
            </Link>
          </div>
        )}

        {!successMsg && token && (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                ❌ {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-2.5 pl-10 rounded-lg transition-all outline-none text-sm" 
                  placeholder="Mínimo 6 caracteres"
                  type="password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-2.5 pl-10 rounded-lg transition-all outline-none text-sm" 
                  placeholder="Repite la contraseña"
                  type="password"
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-2.5 rounded-lg font-semibold mt-2 shadow-md hover:shadow-lg transition-all text-sm"
            >
              {loading ? "Actualizando..." : "Restablecer Contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
