import { useEffect, useState, useContext } from "react";
import api from "../api/api.js";
import { AuthContext } from "../context/AuthContext.jsx";
import { 
  ChartBarIcon, 
  TrophyIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FireIcon,
  BellAlertIcon,
  UserGroupIcon,
  CalendarDaysIcon
} from "@heroicons/react/24/outline";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Navbar from "../components/Navbar.jsx";

export default function DashboardPage() {
  const { token, usuario } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get("/reportes/dashboard-personalizado", {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("✅ Dashboard data recibida:", data);
      setData(data);
    } catch (error) {
      console.error("❌ Error cargando dashboard:", error);
      console.error("❌ Respuesta:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error al cargar el dashboard</h2>
            <p className="text-gray-600 mb-4">No se pudieron obtener los datos. Revisa la consola.</p>
            <button 
              onClick={load}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-4 space-y-2 overflow-x-hidden">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              ¡Hola, {usuario?.nombre}! 👋
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="text-xs text-gray-500 bg-white px-2.5 py-1.5 rounded-lg shadow">
            Rol: <span className="font-bold text-purple-600">{data?.rol}</span>
          </div>
        </div>

        {data?.rol === "VENDEDOR" ? (
          <DashboardVendedor data={data} />
        ) : (
          <DashboardGerente data={data} />
        )}

      </div>
    </>
  );
}

// ============================================
// DASHBOARD PARA VENDEDOR
// ============================================
function DashboardVendedor({ data }) {
  return (
    <>
      {/* RESUMEN DEL MES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <StatCard
          icon={CurrencyDollarIcon}
          title="Ingreso de este mes"
          value={`$${data.resumenMes.montoGanado.toLocaleString()}`}
          subtitle={`${data.resumenMes.cantidadGanadas} propiedades`}
          color="purple"
        />
        <StatCard
          icon={ChartBarIcon}
          title="Propiedades activas"
          value={data.resumenMes.oportunidadesActivas}
          subtitle="En proceso"
          color="blue"
        />
        <StatCard
          icon={CalendarDaysIcon}
          title="Visitas de hoy"
          value={data.visitasHoy}
          subtitle={data.visitasHoy > 0 ? "Programadas" : "Sin visitas hoy"}
          color={data.visitasHoy > 0 ? "green" : "gray"}
        />
      </div>

      {/* GRÁFICOS: VENTAS POR MES Y PROPIEDADES POR ESTADO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
        
        {/* VENTAS POR MES */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-2.5">
          <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-1">Mis ventas/alquileres concretados</h3>
          <div className="h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.ventasPorMes} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" style={{ fontSize: '12px' }} />
                <YAxis 
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => value === 0 ? '' : `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="monto" stroke="#9333ea" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PROPIEDADES POR ESTADO */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-2.5">
          <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-1">Mis propiedades por estado</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Disponible', value: data.propiedadesPorEstado.disponible, color: '#22c55e' },
                  { name: 'Reservada', value: data.propiedadesPorEstado.reservada, color: '#eab308' },
                  { name: 'Alquilada', value: data.propiedadesPorEstado.alquilada, color: '#3b82f6' },
                  { name: 'Vendida', value: data.propiedadesPorEstado.vendida, color: '#f97316' }
                ]}
                cx="50%"
                cy="38%"
                labelLine={false}
                label={({ percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
                outerRadius={65}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: 'Disponible', value: data.propiedadesPorEstado.disponible, color: '#22c55e' },
                  { name: 'Reservada', value: data.propiedadesPorEstado.reservada, color: '#eab308' },
                  { name: 'Alquilada', value: data.propiedadesPorEstado.alquilada, color: '#3b82f6' },
                  { name: 'Vendida', value: data.propiedadesPorEstado.vendida, color: '#f97316' }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ACTIVIDADES DE HOY */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-2.5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="w-4 h-4 text-purple-600" />
            <div>
              <h3 className="text-sm font-bold text-gray-800">Recordatorio</h3>
              <p className="text-xs text-gray-600">{data.actividadesHoy.length} programadas</p>
            </div>
          </div>
        </div>
        <div className="p-2.5 space-y-1.5 max-h-36 overflow-y-auto">
            {data.actividadesHoy.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No tienes tareas programadas para hoy</p>
              </div>
            ) : (
              data.actividadesHoy.map(act => (
                <ActividadCard key={act.id} actividad={act} />
              ))
            )}
        </div>
      </div>

      {/* ALERTAS: OPORTUNIDADES ESTANCADAS */}
      {data.oportunidadesEstancadas.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2 sm:gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-bold text-red-800 mb-2 sm:mb-3">
                Tareas sin actividad reciente
              </h3>
              <div className="space-y-2">
                {data.oportunidadesEstancadas.map(opp => {
                  const diasEstancada = opp.actividades.length === 0 
                    ? "Sin tareas"
                    : `Última tarea: ${new Date(opp.actividades[0].fechaVencimiento).toLocaleDateString()}`;
                  
                  return (
                    <div key={opp.id} className="bg-white p-3 rounded-lg border border-red-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-800">{opp.titulo}</p>
                          <p className="text-sm text-gray-600">{opp.cliente.nombre}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-red-600 font-medium">{diasEstancada}</p>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${etapaColor(opp.etapa)}`}>
                            {opp.etapa}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================
// DASHBOARD PARA GERENTE
// ============================================
function DashboardGerente({ data }) {
  return (
    <>
      {/* RESUMEN DEL EQUIPO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          icon={CurrencyDollarIcon}
          title="Ingreso de este mes (Equipo)"
          value={`$${data.resumenMes.montoTotal.toLocaleString()}`}
          subtitle={`${data.resumenMes.cantidadGanadas} propiedades`}
          color="purple"
        />
        <StatCard
          icon={ChartBarIcon}
          title="Propiedades activas"
          value={data.resumenMes.oportunidadesActivas}
          subtitle="Del equipo completo"
          color="blue"
        />
        <StatCard
          icon={CalendarDaysIcon}
          title="Visitas de la semana"
          value={data.visitasSemana}
          subtitle={data.visitasSemana > 0 ? "Próximos 7 días" : "Sin visitas programadas"}
          color={data.visitasSemana > 0 ? "green" : "gray"}
        />
      </div>

      {/* GRÁFICOS: VENTAS POR MES Y PROPIEDADES POR ESTADO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* VENTAS POR MES */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-5">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Ingreso por mes</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.ventasPorMes} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" style={{ fontSize: '12px' }} />
                <YAxis 
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="monto" stroke="#9333ea" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PROPIEDADES POR ESTADO */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-5">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Propiedades por estado</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Disponible', value: data.propiedadesPorEstado.disponible, color: '#22c55e' },
                  { name: 'Reservada', value: data.propiedadesPorEstado.reservada, color: '#eab308' },
                  { name: 'Alquilada', value: data.propiedadesPorEstado.alquilada, color: '#3b82f6' },
                  { name: 'Vendida', value: data.propiedadesPorEstado.vendida, color: '#f97316' }
                ]}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={({ percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
                outerRadius={85}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: 'Disponible', value: data.propiedadesPorEstado.disponible, color: '#22c55e' },
                  { name: 'Reservada', value: data.propiedadesPorEstado.reservada, color: '#eab308' },
                  { name: 'Alquilada', value: data.propiedadesPorEstado.alquilada, color: '#3b82f6' },
                  { name: 'Vendida', value: data.propiedadesPorEstado.vendida, color: '#f97316' }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend 
                verticalAlign="bottom" 
                height={26}
                iconType="circle"
                wrapperStyle={{ fontSize: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ACTIVIDADES DE HOY */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        
        {/* RANKING DE VENDEDORES */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200">
          <div className="p-4 sm:p-5 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-white">
            <div className="flex items-center gap-2 sm:gap-3">
              <TrophyIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800">Ranking de asesores</h3>
                <p className="text-xs sm:text-sm text-gray-600">Top del mes</p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-5 space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
            {data.rankingVendedores.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <TrophyIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No hay datos de vendedores aún</p>
              </div>
            ) : (
              data.rankingVendedores.map((vendedor, index) => (
                <div 
                  key={vendedor.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    index === 0 
                      ? "bg-yellow-50 border-yellow-300" 
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-base sm:text-lg ${
                    index === 0 ? "bg-yellow-400 text-white" :
                    index === 1 ? "bg-gray-300 text-white" :
                    index === 2 ? "bg-orange-300 text-white" :
                    "bg-gray-200 text-gray-600"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm sm:text-base text-gray-800 truncate">
                      {vendedor.nombre} {vendedor.apellido}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {vendedor.cantidad} propiedades
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base sm:text-lg font-bold text-purple-600">
                      ${(vendedor.monto / 1000).toFixed(0)}k
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* OPORTUNIDADES ESTANCADAS DEL EQUIPO */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-white">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="text-xl font-bold text-gray-800">Tareas por vencer</h3>
                <p className="text-sm text-gray-600">Tareas estancadas (+15 días)</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
            {data.oportunidadesEstancadas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No hay tareas estancadas</p>
              </div>
            ) : (
              data.oportunidadesEstancadas.map(opp => {
                const diasEstancada = opp.actividades.length === 0 
                  ? "Sin tareas"
                  : `Última: ${new Date(opp.actividades[0].fechaVencimiento).toLocaleDateString()}`;
                
                return (
                  <div key={opp.id} className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{opp.titulo}</p>
                        <p className="text-sm text-gray-600">{opp.cliente.nombre}</p>
                        <p className="text-xs text-purple-600 font-medium mt-1">
                          Vendedor: {opp.usuario.nombre} {opp.usuario.apellido}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-red-600 font-medium">{diasEstancada}</p>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${etapaColor(opp.etapa)}`}>
                          {opp.etapa}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </>
  );
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

function StatCard({ icon: Icon, title, value, subtitle, color }) {
  const colorClasses = {
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    red: "bg-red-50 text-red-600 border-red-200",
    gray: "bg-gray-50 text-gray-600 border-gray-200",
  };

  return (
    <div className="bg-white p-2 sm:p-3 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all">
      <div className="flex items-start gap-2">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-lg sm:text-xl font-bold text-gray-800">{value}</p>
          <p className="text-gray-800 text-xs font-medium mt-0.5">{title}</p>
          <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function ActividadCard({ actividad }) {
  const tiposIconos = {
    LLAMADA: "📞",
    REUNION: "📅",
    EMAIL: "✉️",
    TAREA: "📋"
  };

  const hora = new Date(actividad.fechaVencimiento).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-purple-50 p-2 rounded-lg border border-purple-200 hover:border-purple-400 transition-all">
      <div className="flex items-start gap-2">
        <span className="text-lg">{tiposIconos[actividad.tipo]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="px-1.5 py-0.5 bg-purple-200 text-purple-700 rounded text-xs font-bold">
              {actividad.tipo}
            </span>
            <span className="text-purple-600 font-bold text-xs">{hora}</span>
          </div>
          <p className="font-semibold text-xs sm:text-sm text-gray-800 truncate">{actividad.titulo}</p>
          <p className="text-xs text-gray-600 mt-0.5 truncate">
            {actividad.oportunidad.titulo} • {actividad.oportunidad.cliente.nombre}
          </p>
        </div>
      </div>
    </div>
  );
}

function OportunidadCard({ oportunidad }) {
  return (
    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-2 rounded-lg border border-orange-200 hover:border-orange-400 transition-all">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 text-xs sm:text-sm truncate">{oportunidad.titulo}</p>
          <p className="text-xs text-gray-600 mt-0.5 truncate">{oportunidad.cliente.nombre}</p>
          <span className={`inline-block mt-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${etapaColor(oportunidad.etapa)}`}>
            {oportunidad.etapa}
          </span>
        </div>
        <div className="text-right flex-shrink-0">
          {oportunidad.valor && (
            <p className="text-sm sm:text-base font-bold text-purple-600">
              ${(oportunidad.valor / 1000).toFixed(0)}k
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function etapaColor(etapa) {
  const colores = {
    CONTACTO: "bg-blue-100 text-blue-700 border border-blue-300",
    PROPUESTA: "bg-yellow-100 text-yellow-700 border border-yellow-300",
    NEGOCIACION: "bg-orange-100 text-orange-700 border border-orange-300",
    GANADO: "bg-green-100 text-green-700 border border-green-300",
    PERDIDO: "bg-red-100 text-red-700 border border-red-300"
  };
  return colores[etapa] || "bg-gray-100 text-gray-700";
}
