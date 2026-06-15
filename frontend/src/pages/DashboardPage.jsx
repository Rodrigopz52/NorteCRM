import { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext.jsx";
import PeriodoSelector from "../components/PeriodoSelector.jsx";
import {
  CurrencyDollarIcon,
  HomeModernIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";
import {
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import Navbar from "../components/Navbar.jsx";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ─── COLORES GLOBALES ────────────────────────────────────────
const COLORES_ESTADO = {
  disponible: "#6366f1",
  reservada: "#f59e0b",
  vendida: "#10b981",
  alquilada: "#3b82f6",
  no_concretadas: "#9ca3af"
};

// ─── HELPERS ────────────────────────────────────────────────
const fmt = (n) => {
  if (!n && n !== 0) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
};

// ─── COMPONENTES BASE ────────────────────────────────────────

function Badge({ variacion, invertido = false }) {
  if (variacion === null || variacion === undefined) return null;
  const positivo = invertido ? variacion < 0 : variacion > 0;
  const neutral = variacion === 0;
  const abs = Math.abs(variacion).toFixed(1);
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full
      ${neutral ? "bg-gray-100 text-gray-500" : positivo ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}
    >
      {!neutral && (positivo ? "↗" : "↘")} {abs}%
    </span>
  );
}

function KpiCard({ icon: Icon, color, titulo, valor, subtitulo, variacion, invertido }) {
  const bgMap = {
    purple: "bg-purple-50 text-purple-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600"
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`p-2.5 rounded-xl flex-shrink-0 ${bgMap[color] || bgMap.purple}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-2xl font-bold text-gray-900 leading-tight">{valor}</p>
          <Badge variacion={variacion} invertido={invertido} />
        </div>
        <p className="text-sm font-semibold text-gray-700 mt-0.5">{titulo}</p>
        <p className="text-xs text-gray-400 mt-0.5">{subtitulo}</p>
      </div>
    </div>
  );
}

function SectionCard({ titulo, subtitulo, children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-800">{titulo}</h3>
        {subtitulo && <p className="text-xs text-gray-400 mt-0.5">{subtitulo}</p>}
      </div>
      {children}
    </div>
  );
}



// ─── BOTONES DE EXPORTACIÓN ──────────────────────────────────
function ExportButtons({ data, periodo, dashboardRef }) {
  const [exportandoPDF, setExportandoPDF] = useState(false);

  const exportarExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();

    // Hoja 1: KPIs
    const kpisData = [
      ["Métrica", "Período Actual", "Período Anterior", "Variación %"],
      ["Ingresos ($)", data.kpis.ingresos.actual, data.kpis.ingresos.anterior, data.kpis.ingresos.variacion],
      ["Propiedades Disponibles", data.kpis.propiedadesDisponibles.actual, data.kpis.propiedadesDisponibles.anterior, data.kpis.propiedadesDisponibles.variacion],
      ["Tasa de Conversión (%)", data.kpis.tasaConversion.actual, data.kpis.tasaConversion.anterior, data.kpis.tasaConversion.variacion],
      ["Días Promedio a Cierre", data.kpis.diasPromedioCierre.actual, data.kpis.diasPromedioCierre.anterior, data.kpis.diasPromedioCierre.variacion]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(kpisData), "KPIs");

    // Hoja 2: Ranking Asesores
    const rankData = [
      ["Asesor", "Propiedades", "Monto ($)", "Meta ($)", "% Meta"],
      ...(data.rankingAsesores || []).map(r => [r.nombre, r.propiedades, r.monto, r.meta, r.metaPorcentaje])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rankData), "Ranking Asesores");

    // Hoja 3: Embudo de Ventas
    const embudoData = [
      ["Etapa", "Cantidad", "% del Total", "% Conversión desde anterior"],
      ...(data.embudo || []).map(e => [e.etapa, e.cantidad, e.porcentaje, e.conversion || 100])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(embudoData), "Embudo de Ventas");

    // Hoja 4: Evolución de Ingresos
    const ingresosData = [
      ["Período", "Actual ($)", "Anterior ($)"],
      ...(data.graficoIngresos || []).map(g => [g.label, g.actual, g.anterior])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ingresosData), "Evolución Ingresos");

    XLSX.writeFile(wb, `dashboard_${periodo}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportarPDF = async () => {
    if (!dashboardRef.current) return;
    setExportandoPDF(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: "#f9fafb"
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.85);
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`dashboard_${periodo}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error("Error exportando PDF:", e);
    } finally {
      setExportandoPDF(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportarExcel}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
      >
        <ArrowDownTrayIcon className="w-3.5 h-3.5" />
        Excel
      </button>
      <button
        onClick={exportarPDF}
        disabled={exportandoPDF}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
      >
        <DocumentTextIcon className="w-3.5 h-3.5" />
        {exportandoPDF ? "Generando..." : "PDF"}
      </button>
    </div>
  );
}

// ─── GRÁFICO DE INGRESOS ─────────────────────────────────────
function IngresoChart({ data, periodoLabel }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-bold text-gray-700 mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name === "actual" ? "Actual" : (periodoLabel ? capitalize(periodoLabel) : "Anterior")}: {fmt(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorAnterior" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" style={{ fontSize: "11px" }} tick={{ fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis style={{ fontSize: "11px" }} tick={{ fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => v === 0 ? '' : fmt(v)} width={55} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="anterior" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" fill="url(#colorAnterior)" name="anterior" dot={false} />
        <Area type="monotone" dataKey="actual" stroke="#f43f5e" strokeWidth={2.5} fill="url(#colorActual)" name="actual" dot={false} activeDot={{ r: 4, fill: "#f43f5e" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── DONUT PROPIEDADES POR ESTADO ───────────────────────────
function DonutEstado({ data }) {
  const items = [
    { key: "disponible", label: "Disponible", color: COLORES_ESTADO.disponible, value: data.disponible },
    { key: "reservada", label: "Reservada", color: COLORES_ESTADO.reservada, value: data.reservada },
    { key: "vendida", label: "Vendida", color: COLORES_ESTADO.vendida, value: data.vendida },
    { key: "alquilada", label: "Alquilada", color: COLORES_ESTADO.alquilada, value: data.alquilada },
    { key: "no_concretadas", label: "No Concretadas", color: COLORES_ESTADO.no_concretadas, value: data.no_concretadas }
  ].filter(i => i.value > 0);

  return (
    <div className="flex items-center gap-6">
      <div className="flex-shrink-0" style={{ width: 190, height: 190 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={items}
              cx="50%" cy="50%"
              innerRadius={62} outerRadius={85}
              paddingAngle={2}
              dataKey="value"
            >
              {items.map((entry) => (
                <Cell key={entry.key} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [value, name]} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 space-y-3">
        {[
          { key: "disponible", label: "Disponible", color: COLORES_ESTADO.disponible },
          { key: "reservada", label: "Reservada", color: COLORES_ESTADO.reservada },
          { key: "vendida", label: "Vendida", color: COLORES_ESTADO.vendida },
          { key: "alquilada", label: "Alquilada", color: COLORES_ESTADO.alquilada },
          { key: "no_concretadas", label: "No Concretadas", color: COLORES_ESTADO.no_concretadas }
        ].map(item => (
          <div key={item.key} className="flex items-center justify-between text-sm gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-gray-600 font-medium truncate">{item.label}</span>
            </div>
            <span className="font-bold text-gray-900 flex-shrink-0">{data[item.key] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── EMBUDO DE VENTAS ────────────────────────────────────────
function EmbudoVentas({ embudo }) {
  const max = embudo[0]?.cantidad || 1;
  const colores = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#f43f5e"];

  return (
    <div className="space-y-3">
      {embudo.map((etapa, idx) => (
        <div key={etapa.etapa} className="group">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-700">{etapa.etapa}</span>
              {etapa.conversion !== null && (
                <span className="text-[10px] text-gray-400 font-medium">{etapa.conversion}% paso</span>
              )}
            </div>
            <span className="text-sm font-bold text-gray-900">{etapa.cantidad}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max((etapa.cantidad / max) * 100, 2)}%`,
                backgroundColor: colores[idx] || "#6366f1"
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── VISITAS DE HOY ──────────────────────────────────────────
function VisitasHoyPanel({ visitas }) {
  if (!visitas || visitas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <CalendarDaysIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No hay visitas programadas hoy</p>
      </div>
    );
  }

  const coloresBg = ["bg-purple-100 text-purple-700", "bg-blue-100 text-blue-700", "bg-green-100 text-green-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700"];

  return (
    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
      {visitas.map((v, idx) => (
        <div key={v.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
          <span className="text-xs font-bold text-gray-500 w-10 flex-shrink-0">{v.hora}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{v.cliente}</p>
            <p className="text-xs text-gray-400 truncate">{v.propiedad}</p>
          </div>
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${coloresBg[idx % coloresBg.length]}`}>
            {v.asesorIniciales}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── RANKING ASESORES ─────────────────────────────────────────
function RankingAsesoresPanel({ asesores }) {
  if (!asesores || asesores.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <TrophyIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Sin datos de asesores aún</p>
      </div>
    );
  }

  const medallas = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
      {asesores.map((a, idx) => (
        <div key={a.id} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">{medallas[idx] || `${idx + 1}.`}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{a.nombre}</p>
                <p className="text-xs text-gray-400">{a.propiedades} prop{a.propiedades !== 1 ? 's' : ''} · {fmt(a.monto)}</p>
              </div>
            </div>
            <span className="text-sm font-bold text-gray-700">{a.metaPorcentaje}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${a.metaPorcentaje >= 100 ? 'bg-emerald-500' : a.metaPorcentaje >= 60 ? 'bg-blue-500' : 'bg-gray-400'}`}
              style={{ width: `${Math.min(a.metaPorcentaje, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── TAREAS VENCIDAS ──────────────────────────────────────────
function TareasVencidasPanel({ tareas }) {
  const coloresBg = ["bg-purple-100 text-purple-700", "bg-blue-100 text-blue-700", "bg-amber-100 text-amber-700"];

  return (
    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
      {tareas.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">✅ No hay tareas vencidas</p>
        </div>
      ) : (
        <>
          {tareas.map((t, idx) => (
            <div key={t.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold tracking-wider ${t.prioridad === 'ALTA' ? 'bg-red-100 text-red-700' : t.prioridad === 'MEDIA' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{t.prioridad}</span>
                  <p className="text-sm font-medium text-gray-800 truncate">{t.titulo}</p>
                </div>
                <p className="text-xs text-red-500 font-medium">Venció el {t.fechaOriginal} (hace {t.diasVencida} {t.diasVencida === 1 ? 'día' : 'días'})</p>
              </div>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${coloresBg[idx % coloresBg.length]}`} title={t.asesor}>
                {t.asesorIniciales}
              </span>
            </div>
          ))}
          <a href="/tareas" className="flex items-center justify-between pt-2 text-xs text-gray-400 hover:text-purple-600 font-medium transition-colors">
            Ver todas las tareas <span>→</span>
          </a>
        </>
      )}
    </div>
  );
}

// ─── INSIGHTS ─────────────────────────────────────────────────
function InsightsBanner({ insights }) {
  if (!insights || insights.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {insights.map((ins, idx) => (
        <div key={idx} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${
          ins.tipo === "success"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-amber-50 text-amber-700 border-amber-200"
        }`}>
          <span>{ins.tipo === "success" ? "✅" : "⚠️"}</span>
          {ins.mensaje}
        </div>
      ))}
    </div>
  );
}

// ─── DASHBOARD GERENTE NUEVO ─────────────────────────────────
function DashboardGerente({ data, periodo, setPeriodo, dashboardRef, token, periodoLabel }) {
  return (
    <div ref={dashboardRef} className="space-y-5">
      {/* INSIGHTS */}
      {data.insights?.length > 0 && <InsightsBanner insights={data.insights} />}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={CurrencyDollarIcon}
          color="purple"
          titulo="Ingresos del período"
          valor={fmt(data.kpis.ingresos.actual)}
          subtitulo={`vs. ${fmt(data.kpis.ingresos.anterior)} ${periodoLabel}`}
          variacion={data.kpis.ingresos.variacion}
        />
        <KpiCard
          icon={HomeModernIcon}
          color="blue"
          titulo="Propiedades disponibles"
          valor={data.kpis.propiedadesDisponibles.actual}
          subtitulo={`Total: ${data.propiedadesPorEstado.total} en cartera`}
          variacion={data.kpis.propiedadesDisponibles.variacion}
        />
        <KpiCard
          icon={ArrowTrendingUpIcon}
          color="green"
          titulo="Tasa de conversión"
          valor={`${data.kpis.tasaConversion.actual}%`}
          subtitulo="lead → cierre"
          variacion={data.kpis.tasaConversion.variacion}
        />
        <KpiCard
          icon={ClockIcon}
          color="amber"
          titulo="Días promedio a cierre"
          valor={data.kpis.diasPromedioCierre.actual || "—"}
          subtitulo="menos es mejor"
          variacion={data.kpis.diasPromedioCierre.variacion}
          invertido={true}
        />
      </div>

      {/* GRÁFICOS PRINCIPALES */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <SectionCard
          titulo="Evolución de ingresos"
          subtitulo={`Actual vs. período anterior`}
          className="lg:col-span-3"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-6 h-0.5 bg-rose-500 rounded" />
              <span>Actual</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <div className="w-6 h-0.5 border-t-2 border-dashed border-gray-400" />
              <span>{periodoLabel}</span>
            </div>
          </div>
          <IngresoChart data={data.graficoIngresos} periodoLabel={periodoLabel} />
        </SectionCard>

        <SectionCard
          titulo="Propiedades por estado"
          subtitulo={`${data.propiedadesPorEstado.total} en cartera`}
          className="lg:col-span-2 flex flex-col"
        >
          <div className="flex-1 flex items-center justify-center">
            <DonutEstado data={data.propiedadesPorEstado} />
          </div>
        </SectionCard>
      </div>

      {/* EMBUDO + VISITAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard titulo="Embudo de ventas" subtitulo="Recorrido del lead hasta el cierre">
          <EmbudoVentas embudo={data.embudo} />
        </SectionCard>

        <SectionCard
          titulo="Visitas de hoy"
          subtitulo={`${data.visitasHoy?.length || 0} agendadas`}
        >
          <VisitasHoyPanel visitas={data.visitasHoy} />
        </SectionCard>
      </div>

      {/* RANKING + TAREAS VENCIDAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard titulo="Ranking de asesores" subtitulo="Avance sobre la meta del período">
          <RankingAsesoresPanel asesores={data.rankingAsesores} />
        </SectionCard>

        <SectionCard titulo="⚠️ Tareas vencidas" subtitulo={`${data.tareasVencidas?.length || 0} requieren atención`}>
          <TareasVencidasPanel tareas={data.tareasVencidas || []} />
        </SectionCard>
      </div>
    </div>
  );
}

// ─── DASHBOARD VENDEDOR ──────────────────────────────────────
export function DashboardVendedor({ data }) {
  const propiedadesEstado = {
    disponible: data.estadisticasEstado?.disponible || 0,
    reservada: data.estadisticasEstado?.reservada || 0,
    vendida: data.estadisticasEstado?.vendida || 0,
    alquilada: data.estadisticasEstado?.alquilada || 0,
    total: (data.estadisticasEstado?.disponible || 0) + (data.estadisticasEstado?.reservada || 0) + (data.estadisticasEstado?.vendida || 0) + (data.estadisticasEstado?.alquilada || 0)
  };

  const actividadesHoy = data.actividadesHoy || [];
  const visitasHoy = data.estadisticas?.visitasHoy || 0;
  const tareasVencidas = data.estadisticas?.vencidas || 0;

  const tipoEmoji = { LLAMADA: "📞", REUNION: "📅", EMAIL: "✉️", TAREA: "📋" };

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={CurrencyDollarIcon}
          color="purple"
          titulo="Ingreso del mes"
          valor={fmt(data.resumenMes?.monto || 0)}
          subtitulo={`${data.resumenMes?.ganadas || 0} propiedad${data.resumenMes?.ganadas !== 1 ? 'es' : ''} cerrada${data.resumenMes?.ganadas !== 1 ? 's' : ''}`}
        />
        <KpiCard
          icon={HomeModernIcon}
          color="blue"
          titulo="En proceso"
          valor={data.resumenMes?.activas || 0}
          subtitulo="Disponibles y reservadas"
        />
        <KpiCard
          icon={CalendarDaysIcon}
          color="green"
          titulo="Visitas de hoy"
          valor={visitasHoy}
          subtitulo={visitasHoy > 0 ? "Reuniones agendadas" : "Sin reuniones hoy"}
        />
        <KpiCard
          icon={ExclamationTriangleIcon}
          color="amber"
          titulo="Tareas vencidas"
          valor={tareasVencidas}
          subtitulo={tareasVencidas > 0 ? "Requieren atención" : "Todo al día ✓"}
        />
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <SectionCard titulo="Mis ventas del período" subtitulo="Últimos 6 meses" className="lg:col-span-3">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.graficoVentas || []} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVendedor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" style={{ fontSize: "11px" }} tick={{ fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis style={{ fontSize: "11px" }} tick={{ fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => v === 0 ? "" : fmt(v)} width={55} />
                <Tooltip formatter={v => [fmt(v), "Monto"]} />
                <Area type="monotone" dataKey="monto" stroke="#9333ea" strokeWidth={2.5} fill="url(#colorVendedor)" dot={false} activeDot={{ r: 4, fill: "#9333ea" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard titulo="Mis propiedades" subtitulo={`${propiedadesEstado.total} en total`} className="lg:col-span-2">
          <DonutEstado data={propiedadesEstado} />
        </SectionCard>
      </div>

      {/* ACTIVIDADES DE HOY */}
      <SectionCard
        titulo="Mis tareas de hoy"
        subtitulo={actividadesHoy.length > 0 ? `${actividadesHoy.length} programada${actividadesHoy.length !== 1 ? 's' : ''}` : "Sin tareas para hoy"}
      >
        {actividadesHoy.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CalendarDaysIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No tenés tareas programadas para hoy 🎉</p>
          </div>
        ) : (
          <div className="space-y-2">
            {actividadesHoy.map(act => (
              <div key={act.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-colors">
                <span className="text-lg flex-shrink-0">{tipoEmoji[act.tipo] || "📋"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{act.titulo}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className="font-medium text-purple-600">
                      {new Date(act.fechaVencimiento).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {act.oportunidad && ` · ${act.oportunidad.cliente?.nombre}`}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                  act.tipo === "LLAMADA" ? "bg-blue-50 text-blue-600" :
                  act.tipo === "REUNION" ? "bg-purple-50 text-purple-600" :
                  act.tipo === "EMAIL" ? "bg-green-50 text-green-600" :
                  "bg-gray-100 text-gray-500"
                }`}>{act.tipo}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────
export default function DashboardPage() {
  const { token, usuario } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("mes");
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const dashboardRef = useRef(null);
  const esGerente = usuario?.rol === "GERENTE" || usuario?.rol === "ADMINISTRADOR";

  const periodoLabel = (() => {
    if (periodo === "semana") return "sem. pasada";
    if (periodo === "mes") return "mes pasado";
    if (periodo === "trimestre") return "trim. pasado";
    if (periodo === "anio") return "año pasado";
    return "período previo";
  })();

  const cargar = async (p = periodo, start = fechaInicio, end = fechaFin) => {
    setLoading(true);
    try {
      let endpoint = esGerente
        ? `http://localhost:3000/reportes/dashboard-gerencial?periodo=${p}`
        : "http://localhost:3000/reportes/dashboard-personalizado";
      
      if (esGerente && start && end) {
        // Adjust timezone shift by formatting to date string YYYY-MM-DD
        const y1 = start.getFullYear();
        const m1 = String(start.getMonth() + 1).padStart(2, '0');
        const d1 = String(start.getDate()).padStart(2, '0');
        const y2 = end.getFullYear();
        const m2 = String(end.getMonth() + 1).padStart(2, '0');
        const d2 = String(end.getDate()).padStart(2, '0');
        endpoint += `&fechaInicio=${y1}-${m1}-${d1}&fechaFin=${y2}-${m2}-${d2}`;
      }

      const { data: d } = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(d);
    } catch (e) {
      console.error("Error cargando dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(periodo, fechaInicio, fechaFin); }, [periodo, fechaInicio, fechaFin]);

  const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const fechaHoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-screen-xl mx-auto p-4 sm:p-6">

          {/* HEADER */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                ¡Hola, {usuario?.nombre}! 👋
              </h1>
              <p className="text-sm text-gray-400 mt-0.5 capitalize">{fechaHoy}</p>
            </div>

            {esGerente && (
              <div className="flex items-center gap-3 flex-wrap">
                <PeriodoSelector
                  periodo={periodo}
                  onChange={setPeriodo}
                  fechaInicio={fechaInicio}
                  setFechaInicio={setFechaInicio}
                  fechaFin={fechaFin}
                  setFechaFin={setFechaFin}
                />
                {data && (
                  <ExportButtons data={data} periodo={periodo} dashboardRef={dashboardRef} />
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border-2 border-purple-600 border-t-transparent animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-400">Cargando dashboard...</p>
              </div>
            </div>
          ) : !data ? (
            <div className="flex items-center justify-center py-32">
              <div className="text-center">
                <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Error al cargar los datos</p>
                <button onClick={() => cargar(periodo, fechaInicio, fechaFin)} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                  Reintentar
                </button>
              </div>
            </div>
          ) : esGerente ? (
            <DashboardGerente
              data={data}
              periodo={periodo}
              setPeriodo={setPeriodo}
              dashboardRef={dashboardRef}
              token={token}
              periodoLabel={periodoLabel}
            />
          ) : (
            <DashboardVendedor data={data} />
          )}
        </div>
      </div>
    </>
  );
}
