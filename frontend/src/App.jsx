import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import ClientesPage from "./pages/ClientesPage.jsx";
import PropiedadesPage from "./pages/PropiedadesPage.jsx";
import TareasPage from "./pages/TareasPage.jsx";
import UsuariosPage from "./pages/UsuariosPage.jsx";
import Navbar from "./components/Navbar.jsx";
import { useContext } from "react";
import { AuthContext, AuthProvider } from "./context/AuthContext.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";

function PrivateRoute({ children }) {
  const { token } = useContext(AuthContext);
  return token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      {/* El Provider DEBE estar dentro del Router para poder usar useNavigate */}
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route
            path="/clientes"
            element={
              <PrivateRoute>
                <Navbar />
                <ClientesPage />
              </PrivateRoute>
            }
          />
           
        <Route path="/oportunidades" element={<Navigate to="/propiedades" replace />} />
        <Route
          path="/propiedades"
          element={
            <PrivateRoute>
              <Navbar />
              <PropiedadesPage />
            </PrivateRoute>
          }
        />

        <Route path="/actividades" element={<Navigate to="/tareas" replace />} />
        <Route
          path="/tareas"
          element={
            <PrivateRoute>
              <TareasPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />  
            </PrivateRoute>
          }
        />

        <Route
          path="/usuarios"
          element={
            <PrivateRoute>
              <Navbar />
              <UsuariosPage />
            </PrivateRoute>
          }
        />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}


