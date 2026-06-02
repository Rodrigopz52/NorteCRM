import { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext.jsx";
import { useToast, useConfirm } from "../hooks/useNotifications.jsx";
import Navbar from "../components/Navbar.jsx";
import {
  PhoneIcon,
  CalendarIcon,
  EnvelopeIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  HomeIcon,
  UserIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CalendarDaysIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";

// ─── SELECTOR DE PERÍODO ─────────────────────────────────────
function PeriodoSelector({ periodo, onChange, fechaInicio, setFechaInicio, fechaFin, setFechaFin }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Date picker navigation states
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [hoveredDate, setHoveredDate] = useState(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Shortcut ranges
  const applyShortcut = (type) => {
    const today = new Date();
    let start = null;
    let end = null;

    if (type === "hoy") {
      start = new Date(today);
      end = new Date(today);
    } else if (type === "7dias") {
      end = new Date(today);
      start = new Date(today);
      start.setDate(end.getDate() - 6);
    } else if (type === "30dias") {
      end = new Date(today);
      start = new Date(today);
      start.setDate(end.getDate() - 29);
    } else if (type === "mes") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (type === "mes_pasado") {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (type === "anio") {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
    } else if (type === "limpiar") {
      setFechaInicio(null);
      setFechaFin(null);
      onChange("mes");
      setIsOpen(false);
      return;
    }

    if (start && end) {
      setFechaInicio(start);
      setFechaFin(end);
      onChange(type === "mes" ? "mes" : type === "anio" ? "anio" : "personalizado");
    }
    setIsOpen(false);
  };

  // Calendar days grid generator
  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];

    // Find weekday of 1st day (Monday = 0 ... Sunday = 6)
    let startDayOfWeek = date.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    // Prefix days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        month: month === 0 ? 11 : month - 1,
        year: month === 0 ? year - 1 : year,
        isCurrentMonth: false
      });
    }

    // Current month days
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({
        day: i,
        month: month,
        year: year,
        isCurrentMonth: true
      });
    }

    // Suffix days to pad grid to multiple of 7
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        month: month === 11 ? 0 : month + 1,
        year: month === 11 ? year + 1 : year,
        isCurrentMonth: false
      });
    }

    return days;
  };

  const days = getDaysInMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDayClick = (cell) => {
    const clickedDate = new Date(cell.year, cell.month, cell.day);
    if (!fechaInicio || (fechaInicio && fechaFin)) {
      setFechaInicio(clickedDate);
      setFechaFin(null);
    } else {
      if (clickedDate < fechaInicio) {
        setFechaInicio(clickedDate);
      } else {
        setFechaFin(clickedDate);
        onChange("personalizado");
        setIsOpen(false);
      }
    }
  };

  const formatButtonText = () => {
    if (fechaInicio && fechaFin) {
      const f1 = fechaInicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      const f2 = fechaFin.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      return `${f1} - ${f2}`;
    }

    if (periodo === "semana") return "Semana";
    if (periodo === "mes") return "Periodo";
    if (periodo === "trimestre") return "Trimestre";
    if (periodo === "anio") return "Año";
    return "Periodo";
  };

  const nombreMeses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];

  return (
    <div className="relative font-sans" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-xs text-gray-700 shadow-sm font-semibold transition-all cursor-pointer h-[42px]"
      >
        <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
        <span>{formatButtonText()}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100 min-w-[500px]">
          {/* ATAJOS */}
          <div className="w-full md:w-44 p-4 flex-shrink-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">ATAJOS</p>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => applyShortcut("hoy")} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-md font-semibold transition-colors">Hoy</button>
              <button onClick={() => applyShortcut("7dias")} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-md font-semibold transition-colors">Últimos 7 días</button>
              <button onClick={() => applyShortcut("30dias")} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-md font-semibold transition-colors">Últimos 30 días</button>
              <button onClick={() => applyShortcut("mes")} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-md font-semibold transition-colors">Este mes</button>
              <button onClick={() => applyShortcut("mes_pasado")} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-md font-semibold transition-colors">Mes pasado</button>
              <button onClick={() => applyShortcut("anio")} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-md font-semibold transition-colors">Este año</button>
              <div className="my-2 border-t border-gray-100" />
              <button onClick={() => applyShortcut("limpiar")} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-50 rounded-md font-semibold transition-colors">Limpiar</button>
            </div>
          </div>

          {/* CALENDAR */}
          <div className="p-4 flex-1">
            <div className="flex items-center justify-between mb-3 px-1">
              <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <p className="text-sm font-bold text-gray-800 capitalize">
                {nombreMeses[currentMonth]} {currentYear}
              </p>
              <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-1 justify-items-center">
              {['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'].map(d => (
                <span key={d} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider w-8 text-center">{d}</span>
              ))}

              {days.map((cell, idx) => {
                const cellDate = new Date(cell.year, cell.month, cell.day);

                const isStart = fechaInicio && cellDate.getTime() === fechaInicio.getTime();
                const isEnd = fechaFin && cellDate.getTime() === fechaFin.getTime();
                const isInRange = fechaInicio && fechaFin && (cellDate >= fechaInicio && cellDate <= fechaFin);
                const isHoveredRange = fechaInicio && !fechaFin && hoveredDate && (cellDate >= fechaInicio && cellDate <= hoveredDate);

                return (
                  <div
                    key={idx}
                    className={`h-8 w-8 flex items-center justify-center relative cursor-pointer my-0.5
                      ${(isInRange || isHoveredRange) ? "bg-indigo-50 text-indigo-700" : ""}
                      ${isStart ? "rounded-l-full bg-indigo-50" : ""}
                      ${isEnd ? "rounded-r-full bg-indigo-50" : ""}
                    `}
                    onClick={() => handleDayClick(cell)}
                    onMouseEnter={() => {
                      if (fechaInicio && !fechaFin) {
                        setHoveredDate(cellDate);
                      }
                    }}
                  >
                    <span className={`h-7 w-7 flex items-center justify-center text-xs font-semibold rounded-full transition-all
                      ${isStart || isEnd ? "bg-indigo-600 text-white shadow-sm" : ""}
                      ${!cell.isCurrentMonth ? "text-gray-300" : "text-gray-700 hover:bg-gray-100"}
                    `}>
                      {cell.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TareasPage() {
  const { token, usuario } = useContext(AuthContext);
  const { success, error, ToastContainer } = useToast();
  const { showConfirm, ConfirmContainer } = useConfirm();

  const [actividades, setActividades] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  
  // Filtros
  const [filtro, setFiltro] = useState("PENDIENTES"); 
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [vista, setVista] = useState("GRILLA"); // "GRILLA", "LISTA", "CALENDARIO"
  const [periodo, setPeriodo] = useState("mes");
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);

  const [form, setForm] = useState({
    id: null,
    tipo: "LLAMADA",
    titulo: "",
    descripcion: "",
    fechaVencimiento: "",
    oportunidadId: "",
    prioridad: "MEDIA" // Agregado prioridad
  });

  const tiposIconos = {
    LLAMADA: PhoneIcon,
    REUNION: CalendarIcon,
    EMAIL: EnvelopeIcon,
    TAREA: ClipboardDocumentListIcon
  };

  const tiposColoresText = {
    LLAMADA: "text-blue-600",
    REUNION: "text-purple-600",
    EMAIL: "text-green-600",
    TAREA: "text-orange-600"
  };

  const tiposBordes = {
    LLAMADA: "border-blue-400",
    REUNION: "border-purple-400",
    EMAIL: "border-green-400",
    TAREA: "border-orange-400"
  };

  const load = async (start = fechaInicio, end = fechaFin) => {
    try {
      let url = "http://localhost:3000/tareas?estadoActivo=TODOS";
      if (start && end) {
        const y1 = start.getFullYear();
        const m1 = String(start.getMonth() + 1).padStart(2, '0');
        const d1 = String(start.getDate()).padStart(2, '0');
        const y2 = end.getFullYear();
        const m2 = String(end.getMonth() + 1).padStart(2, '0');
        const d2 = String(end.getDate()).padStart(2, '0');
        url += `&fechaInicio=${y1}-${m1}-${d1}&fechaFin=${y2}-${m2}-${d2}`;
      }

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActividades(data);

      const opps = await axios.get("http://localhost:3000/propiedades?limit=100", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOportunidades(opps.data.data || opps.data);
    } catch (error) {
      console.error("Error al cargar actividades:", error);
    }
  };

  useEffect(() => {
    load(fechaInicio, fechaFin);
  }, [fechaInicio, fechaFin]);

  const guardarActividad = async () => {
    if (!form.titulo || !form.oportunidadId || !form.fechaVencimiento) {
      error("Completa todos los campos obligatorios");
      return;
    }

    try {
      if (form.id) {
        await axios.put(
          `http://localhost:3000/tareas/${form.id}`,
          {
            tipo: form.tipo,
            titulo: form.titulo,
            descripcion: form.descripcion,
            fechaVencimiento: form.fechaVencimiento,
            oportunidadId: Number(form.oportunidadId),
            prioridad: form.prioridad
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        success("Actividad actualizada exitosamente");
      } else {
        await axios.post(
          "http://localhost:3000/tareas",
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        success("Actividad creada exitosamente");
      }

      setForm({
        id: null,
        tipo: "LLAMADA",
        titulo: "",
        descripcion: "",
        fechaVencimiento: "",
        oportunidadId: "",
        prioridad: "MEDIA"
      });
      setOpenForm(false);
      load();
    } catch (err) {
      console.error("Error al guardar actividad:", err);
      error(err.response?.data?.error || "Error al guardar la actividad");
    }
  };

  const toggleCompletada = async (id, completada) => {
    try {
      await axios.put(
        `http://localhost:3000/tareas/${id}/completar`,
        { completada: !completada },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      load();
    } catch (error) {
      console.error("Error al actualizar actividad:", error);
    }
  };

  const cancelarActividad = async (id) => {
    try {
      const confirmed = await showConfirm({
        title: "¿Seguro que deseas cancelar esta tarea?",
        message: "Pasará a estar inactiva y dejará de ser contabilizada.",
        type: "danger"
      });

      if (!confirmed) return;

      await axios.delete(`http://localhost:3000/tareas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      success("Tarea cancelada correctamente");
      load();
    } catch (err) {
      console.error("Error al cancelar actividad:", err);
      error(err.response?.data?.error || "Error al cancelar la actividad");
    }
  };

  const actividadesFiltradas = actividades.filter(act => {
    const hoy = new Date();
    const vencimiento = new Date(act.fechaVencimiento);
    const vencida = vencimiento < hoy && !act.completada;

    // Filtros de barra
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const tituloMatch = act.titulo?.toLowerCase().includes(q);
      const descMatch = act.descripcion?.toLowerCase().includes(q);
      if (!tituloMatch && !descMatch) return false;
    }
    
    if (filtroTipo !== "TODOS" && act.tipo !== filtroTipo) return false;

    // Filtros por estado (botones)
    if (filtro === "CANCELADAS") return !act.activo;
    if (!act.activo) return false;

    if (filtro === "PENDIENTES") return !act.completada;
    if (filtro === "COMPLETADAS") return act.completada;
    if (filtro === "VENCIDAS") return vencida;
    return true; 
  });

  const contadores = {
    total: actividades.filter(a => a.activo).length,
    pendientes: actividades.filter(a => a.activo && !a.completada).length,
    completadas: actividades.filter(a => a.activo && a.completada).length,
    vencidas: actividades.filter(a => {
      if (!a.activo) return false;
      const hoy = new Date();
      const vencimiento = new Date(a.fechaVencimiento);
      return vencimiento < hoy && !a.completada;
    }).length,
    canceladas: actividades.filter(a => !a.activo).length
  };

  const formatPrioridad = (prioridad) => {
    if (!prioridad) return null;
    const props = {
      ALTA: { color: "bg-red-50 text-red-600 border-red-200", text: "Alta" },
      MEDIA: { color: "bg-yellow-50 text-yellow-600 border-yellow-200", text: "Media" },
      BAJA: { color: "bg-green-50 text-green-600 border-green-200", text: "Baja" }
    };
    return props[prioridad] || props.MEDIA;
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">

        {/* ENCABEZADO */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Tareas</h2>
            <p className="text-sm text-gray-500 font-medium mt-1">Organiza tu agenda y seguimiento de ventas</p>
          </div>
          <button
            onClick={() => setOpenForm(true)}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
          >
            + Nueva tarea
          </button>
        </div>

        {/* BARRA DE FILTROS, BÚSQUEDA Y VISTAS */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6">
          {/* Buscador */}
          <div className="relative flex-1 w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 h-5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Buscar tareas por título o descripción..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-gray-700 shadow-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Controles del filtro y Vistas */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Select Tipo */}
            <select
              className="flex-1 sm:flex-none sm:w-44 border border-gray-200 bg-white px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-700 shadow-sm cursor-pointer"
              value={filtroTipo}
              onChange={e => setFiltroTipo(e.target.value)}
            >
              <option value="TODOS">Todos los tipos</option>
              <option value="LLAMADA">Llamada</option>
              <option value="REUNION">Reunión</option>
              <option value="EMAIL">Email</option>
            </select>

            {/* Selector de Periodo */}
            <PeriodoSelector
              periodo={periodo}
              onChange={setPeriodo}
              fechaInicio={fechaInicio}
              setFechaInicio={setFechaInicio}
              fechaFin={fechaFin}
              setFechaFin={setFechaFin}
            />

            {/* Select Estado */}
            <select
              className="flex-1 sm:flex-none sm:w-44 border border-gray-200 bg-white px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-700 shadow-sm cursor-pointer"
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
            >
              <option value="PENDIENTES">Pendientes</option>
              <option value="COMPLETADAS">Completadas</option>
              <option value="VENCIDAS">Vencidas</option>
              <option value="CANCELADAS">Canceladas</option>
            </select>

            {/* Selector de vistas */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200 h-[42px] flex-shrink-0">
              <button 
                onClick={() => setVista("LISTA")}
                className={`p-1.5 rounded-md transition-all ${vista === "LISTA" ? "bg-white text-purple-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                title="Vista de lista"
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setVista("GRILLA")}
                className={`p-1.5 rounded-md transition-all ${vista === "GRILLA" ? "bg-white text-purple-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                title="Vista de tarjetas (Grilla)"
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
            </div>
          </div>

        </div>

        {/* CONTENIDO DE TAREAS */}
        {actividadesFiltradas.length === 0 ? (
          <div className="p-16 text-center text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-200">
            <ClipboardDocumentListIcon className="w-20 h-20 mx-auto mb-4 opacity-30 text-purple-500" />
            <p className="text-xl font-semibold text-gray-700">No hay tareas para mostrar</p>
            <p className="text-sm mt-2">Intenta cambiar los filtros o crea una nueva tarea.</p>
          </div>
        ) : (
          <div className="mb-10">
            {(() => {
              const getGroupLabel = (dateString) => {
                const hoy = new Date();
                hoy.setHours(0,0,0,0);
                const d = new Date(dateString);
                d.setHours(0,0,0,0);
                
                const diffTime = d - hoy;
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 0) return "HOY";
                if (diffDays === 1) return "MAÑANA";
                if (diffDays === -1) return "AYER";
                if (diffDays > 1 && diffDays <= 7) return "ESTA SEMANA";
                if (diffDays > 7) return "MÁS ADELANTE";
                if (diffDays < -1) return "ANTERIORES";
                return "OTROS";
              };

              const priorityWeight = { ALTA: 3, MEDIA: 2, BAJA: 1 };

              const sortedActividades = [...actividadesFiltradas].sort((a, b) => {
                const dateA = new Date(a.fechaVencimiento);
                const dateB = new Date(b.fechaVencimiento);
                
                const dayA = new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate()).getTime();
                const dayB = new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate()).getTime();
                
                if (dayA !== dayB) return dayA - dayB; // Orden por día
                
                const wA = priorityWeight[a.prioridad] || 0;
                const wB = priorityWeight[b.prioridad] || 0;
                if (wA !== wB) return wB - wA; // Orden por prioridad (Alta primero)
                
                return dateA.getTime() - dateB.getTime(); // Orden por hora
              });

              const groupedActivities = sortedActividades.reduce((acc, act) => {
                const label = getGroupLabel(act.fechaVencimiento);
                if (!acc[label]) acc[label] = [];
                acc[label].push(act);
                return acc;
              }, {});

              return Object.entries(groupedActivities).map(([label, acts]) => (
                <div key={label} className="mb-8">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    {label} <span className="bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full text-[10px]">{acts.length}</span>
                  </h4>
                  <div className={`${vista === "GRILLA" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-4"}`}>
                    {acts.map(act => {
              const IconoTipo = tiposIconos[act.tipo] || ClipboardDocumentListIcon;
              const colorClase = tiposColoresText[act.tipo] || "text-gray-500";
              const bordeClase = tiposBordes[act.tipo] || "border-gray-400";
              const hoy = new Date();
              const vencimiento = new Date(act.fechaVencimiento);
              const vencida = vencimiento < hoy && !act.completada;
              const propPrioridad = formatPrioridad(act.prioridad);

              const leftBorderClase = act.prioridad === 'ALTA' ? 'border-l-red-500' : act.prioridad === 'BAJA' ? 'border-l-green-500' : 'border-l-yellow-500';

              return (
                <div
                  key={act.id}
                  className={`bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 ${leftBorderClase} ${act.completada ? "opacity-60 bg-gray-50/50" : "hover:shadow-md transition-shadow"} p-4 sm:p-5 flex gap-4 items-start`}
                >
                  {/* CHECKBOX */}
                  <button
                    onClick={() => toggleCompletada(act.id, act.completada)}
                    className="mt-0.5 flex-shrink-0 focus:outline-none"
                  >
                    {act.completada ? (
                       <div className="w-5 h-5 rounded flex items-center justify-center bg-green-500 border border-green-500 transition-colors">
                         <CheckIcon className="w-3.5 h-3.5 text-white stroke-[3]" />
                       </div>
                    ) : (
                       <div className={`w-5 h-5 rounded border-2 border-gray-300 hover:bg-gray-50 flex items-center justify-center transition-colors`}>
                       </div>
                    )}
                  </button>

                  {/* CONTENIDO PRINCIPAL */}
                  <div className="flex-1 min-w-0">
                    
                    {/* TOP: Titulo, Prioridad y Menu */}
                    <div className="flex justify-between items-start mb-1 gap-4">
                      <h3 className={`text-base sm:text-lg font-semibold leading-tight ${act.completada ? "line-through text-gray-500" : "text-gray-900"}`}>
                        {act.titulo}
                        {!act.activo && <span className="ml-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border bg-gray-100 text-gray-600 border-gray-300 align-middle">CANCELADA</span>}
                      </h3>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {propPrioridad && act.activo && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${propPrioridad.color}`}>
                            {propPrioridad.text}
                          </span>
                        )}
                        
                        {/* Acciones */}
                        <div className="flex items-center gap-1 text-gray-400">
                          <button
                            onClick={() => {
                              setForm({
                                id: act.id,
                                tipo: act.tipo,
                                titulo: act.titulo,
                                descripcion: act.descripcion || "",
                                fechaVencimiento: act.fechaVencimiento.slice(0, 16),
                                oportunidadId: act.oportunidadId,
                                prioridad: act.prioridad || "MEDIA"
                              });
                              setOpenForm(true);
                            }}
                            className="hover:text-blue-600 transition-colors"
                            title="Editar"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          {act.activo && (
                            <button
                              onClick={() => cancelarActividad(act.id)}
                              className="hover:text-red-600 transition-colors"
                              title="Cancelar tarea"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* MEDIO: Descripción */}
                    {act.descripcion && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {act.descripcion}
                      </p>
                    )}
                    {!act.descripcion && <div className="mb-3"></div>}

                    {/* BOTTOM: Metadata */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        {new Date(act.fechaVencimiento).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </span>
                      
                      <span className="flex items-center gap-1.5">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        {new Date(act.fechaVencimiento).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        {act.usuario?.nombre || 'Duclos'}
                      </span>

                      {act.oportunidad && (
                        <span className="flex items-center gap-1.5">
                          <HomeIcon className="w-4 h-4 text-gray-400" />
                          <span className="truncate max-w-[150px] sm:max-w-xs">{act.oportunidad.cliente?.nombre || 'Cliente'} - {act.oportunidad.titulo}</span>
                        </span>
                      )}

                      {/* Estado */}
                      <span className="flex items-center gap-1.5 ml-auto sm:ml-0 sm:border-l sm:pl-4 border-gray-200">
                        <span className={`w-2 h-2 rounded-full ${act.completada ? 'bg-green-500' : vencida ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                        {act.completada ? 'Completada' : vencida ? 'Vencida' : 'Pendiente'}
                      </span>
                    </div>

                  </div>
                </div>
              );
            })}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {/* MODAL CREAR/EDITAR ACTIVIDAD */}
        {openForm && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">
                {form.id ? "✏️ Editar Tarea" : "✨ Nueva Tarea"}
              </h3>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                      Tipo *
                    </label>
                    <select
                      className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-2.5 rounded-xl transition-all outline-none text-sm font-medium"
                      value={form.tipo}
                      onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    >
                      <option value="LLAMADA">📞 Llamada / Contacto</option>
                      <option value="REUNION">📅 Visita / Reunión</option>
                      <option value="EMAIL">✉️ Enviar correo</option>
                      <option value="TAREA">📝 Tarea general</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                      Prioridad *
                    </label>
                    <select
                      className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-2.5 rounded-xl transition-all outline-none text-sm font-medium"
                      value={form.prioridad}
                      onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
                    >
                      <option value="BAJA">🟢 Baja</option>
                      <option value="MEDIA">🟡 Media</option>
                      <option value="ALTA">🔴 Alta</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Título *
                  </label>
                  <input
                    className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-2.5 rounded-xl transition-all outline-none text-sm"
                    placeholder="Ej: Llamar al cliente para confirmar..."
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Descripción <span className="font-normal text-gray-400">(opcional)</span>
                  </label>
                  <textarea
                    className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 rounded-xl transition-all outline-none resize-none text-sm"
                    placeholder="Detalles, recordatorios o notas de la actividad..."
                    rows="3"
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                      Fecha y Hora *
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-2.5 rounded-xl transition-all outline-none text-sm font-medium"
                      value={form.fechaVencimiento}
                      onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                      Relacionado con (Propiedad) *
                    </label>
                    <select
                      className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-2.5 rounded-xl transition-all outline-none text-sm font-medium"
                      value={form.oportunidadId}
                      onChange={(e) => setForm({ ...form, oportunidadId: e.target.value })}
                    >
                      <option value="">Seleccionar propiedad...</option>
                      {oportunidades.map(opp => (
                        <option value={opp.id} key={opp.id}>
                          {opp.titulo} - {opp.cliente?.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setOpenForm(false);
                    setForm({
                      id: null,
                      tipo: "LLAMADA",
                      titulo: "",
                      descripcion: "",
                      fechaVencimiento: "",
                      oportunidadId: "",
                      prioridad: "MEDIA"
                    });
                  }}
                  className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarActividad}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                >
                  {form.id ? "Guardar Cambios" : "Crear Tarea"}
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastContainer />
        <ConfirmContainer />
      </div>
    </>
  );
}
