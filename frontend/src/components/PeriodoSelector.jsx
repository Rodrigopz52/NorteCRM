import React, { useState, useEffect, useRef } from "react";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";

export default function PeriodoSelector({ periodo, onChange, fechaInicio, setFechaInicio, fechaFin, setFechaFin }) {
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
        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-xs text-gray-700 shadow-sm font-semibold transition-all"
      >
        <CalendarDaysIcon className="w-3.5 h-3.5 text-gray-500" />
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
