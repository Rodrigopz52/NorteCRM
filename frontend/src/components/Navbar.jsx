import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { UserCircleIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Navbar() {
  const { logout, usuario } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="flex justify-between items-center px-4 sm:px-6 py-2">
        {/* Logo y Navegación - Lado Izquierdo */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-purple-600">NorteCRM</h1>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-1">
            <NavLink href="/clientes">Clientes</NavLink>
            <NavLink href="/propiedades">Propiedades</NavLink>
            <NavLink href="/tareas">Tareas</NavLink>
            <NavLink href="/dashboard">Dashboard</NavLink>
            {(usuario?.rol === "GERENTE" || usuario?.rol === "ADMINISTRADOR") && (
              <NavLink href="/usuarios">Usuarios</NavLink>
            )}
          </div>
        </div>

        {/* Usuario y Logout - Lado Derecho */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <UserCircleIcon className="w-4 h-4" />
            <span className="font-medium">{usuario?.nombre} {usuario?.apellido}</span>
          </div>
          <button 
            onClick={logout} 
            className="text-red-600 hover:text-red-700 font-medium hover:bg-red-50 px-2.5 py-1 rounded transition-colors text-xs"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-gray-600 hover:text-purple-600 transition-colors"
        >
          {menuOpen ? (
            <XMarkIcon className="w-6 h-6" />
          ) : (
            <Bars3Icon className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-2">
            <MobileNavLink href="/clientes" onClick={() => setMenuOpen(false)}>
              Clientes
            </MobileNavLink>
            <MobileNavLink href="/propiedades" onClick={() => setMenuOpen(false)}>
              Propiedades
            </MobileNavLink>
            <MobileNavLink href="/tareas" onClick={() => setMenuOpen(false)}>
              Tareas
            </MobileNavLink>
            <MobileNavLink href="/dashboard" onClick={() => setMenuOpen(false)}>
              Dashboard
            </MobileNavLink>
            {(usuario?.rol === "GERENTE" || usuario?.rol === "ADMINISTRADOR") && (
              <MobileNavLink href="/usuarios" onClick={() => setMenuOpen(false)}>
                Usuarios
              </MobileNavLink>
            )}
            
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 py-2">
                <UserCircleIcon className="w-5 h-5" />
                <span className="font-medium">{usuario?.nombre} {usuario?.apellido}</span>
              </div>
              <button 
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="w-full text-left text-red-600 hover:text-red-700 font-medium hover:bg-red-50 px-3 py-2 rounded transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, children }) {
  const isActive = window.location.pathname === href;
  
  return (
    <a 
      href={href}
      className={`px-3 py-1.5 rounded-lg font-medium transition-all text-xs ${
        isActive 
          ? 'bg-purple-600 text-white shadow-md' 
          : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
      }`}
    >
      {children}
    </a>
  );
}

function MobileNavLink({ href, children, onClick }) {
  const isActive = window.location.pathname === href;
  
  return (
    <a 
      href={href}
      onClick={onClick}
      className={`block px-4 py-2.5 rounded-lg font-medium transition-all ${
        isActive 
          ? 'bg-purple-600 text-white shadow-md' 
          : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
      }`}
    >
      {children}
    </a>
  );
}

