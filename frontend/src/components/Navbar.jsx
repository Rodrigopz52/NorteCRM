import { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { 
  UserCircleIcon,
  Bars3Icon, 
  XMarkIcon,
  Squares2X2Icon,
  UserGroupIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  UserPlusIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";
import logo from "../assets/logo.png";

const getInitials = (nombre, apellido) => {
  const n = nombre ? nombre.charAt(0).toUpperCase() : "";
  const a = apellido ? apellido.charAt(0).toUpperCase() : "";
  return `${n}${a}`;
};

export default function Navbar() {
  const { logout, usuario } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="flex justify-between items-center px-4 sm:px-6 py-2">
        {/* Logo y Navegación - Lado Izquierdo */}
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="flex items-center">
            <img src={logo} alt="NorteCRM" className="h-10 w-auto object-contain" />
          </a>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-1">
            <NavLink href="/dashboard" icon={Squares2X2Icon}>Dashboard</NavLink>
            <NavLink href="/clientes" icon={UserGroupIcon}>Clientes</NavLink>
            <NavLink href="/propiedades" icon={HomeIcon}>Propiedades</NavLink>
            <NavLink href="/tareas" icon={ClipboardDocumentListIcon}>Tareas</NavLink>
            {(usuario?.rol === "GERENTE" || usuario?.rol === "ADMINISTRADOR") && (
              <NavLink href="/usuarios" icon={UserPlusIcon}>Usuarios</NavLink>
            )}
          </div>
        </div>

        {/* Usuario y Logout - Lado Derecho */}
        <div className="hidden md:flex items-center relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 hover:bg-gray-100 p-1.5 pr-2 rounded-xl transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
              {getInitials(usuario?.nombre, usuario?.apellido)}
            </div>
            <span className="font-semibold text-gray-800 text-sm">{usuario?.nombre} {usuario?.apellido}</span>
            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 mt-1 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-900">{usuario?.nombre} {usuario?.apellido}</p>
                <p className="text-xs text-gray-500 truncate">{usuario?.email}</p>
              </div>
              <div className="px-2 pt-2">
                <button 
                  onClick={() => { setProfileOpen(false); logout(); }} 
                  className="w-full flex items-center gap-2 text-left text-red-600 hover:bg-red-50 hover:text-red-700 font-medium px-2 py-2 rounded-lg transition-colors text-sm"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-gray-600 hover:text-gray-800 transition-colors"
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
            <MobileNavLink href="/dashboard" icon={Squares2X2Icon} onClick={() => setMenuOpen(false)}>
              Dashboard
            </MobileNavLink>
            <MobileNavLink href="/clientes" icon={UserGroupIcon} onClick={() => setMenuOpen(false)}>
              Clientes
            </MobileNavLink>
            <MobileNavLink href="/propiedades" icon={HomeIcon} onClick={() => setMenuOpen(false)}>
              Propiedades
            </MobileNavLink>
            <MobileNavLink href="/tareas" icon={ClipboardDocumentListIcon} onClick={() => setMenuOpen(false)}>
              Tareas
            </MobileNavLink>
            {(usuario?.rol === "GERENTE" || usuario?.rol === "ADMINISTRADOR") && (
              <MobileNavLink href="/usuarios" icon={UserPlusIcon} onClick={() => setMenuOpen(false)}>
                Usuarios
              </MobileNavLink>
            )}
            
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 py-2">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                  {getInitials(usuario?.nombre, usuario?.apellido)}
                </div>
                <span className="font-medium">{usuario?.nombre} {usuario?.apellido}</span>
              </div>
              <button 
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 text-left text-red-600 hover:text-red-700 font-medium hover:bg-red-50 px-3 py-2 rounded transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, icon: Icon, children }) {
  const isActive = window.location.pathname === href;
  
  return (
    <a 
      href={href}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all text-sm ${
        isActive 
          ? 'bg-purple-600 text-white shadow-md' 
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </a>
  );
}

function MobileNavLink({ href, icon: Icon, children, onClick }) {
  const isActive = window.location.pathname === href;
  
  return (
    <a 
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
        isActive 
          ? 'bg-purple-600 text-white shadow-md' 
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      }`}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </a>
  );
}

