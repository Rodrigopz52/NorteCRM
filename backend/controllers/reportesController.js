import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const dashboard = async (req, res) => {
  // Solo GERENTE o ADMINISTRADOR pueden ver todo
  if (req.usuario.rol !== "GERENTE" && req.usuario.rol !== "ADMINISTRADOR") {
    return res.status(403).json({ error: "Acceso denegado" });
  }

  // Todas las propiedades (activas)
  const total = await prisma.oportunidad.count({
    where: { activo: true }
  });

  // Vendidas/Alquiladas (cerradas)
  const ganadas = await prisma.oportunidad.count({
    where: { 
      activo: true,
      etapa: { in: ["VENDIDA", "ALQUILADA"] }
    }
  });

  // Archivadas o dadas de baja (borrado lógico)
  const perdidas = await prisma.oportunidad.count({
    where: { activo: false }
  });

  // Monto total ganado (VENDIDAS o ALQUILADAS)
  const montoGanado = await prisma.oportunidad.aggregate({
    _sum: { valor: true },
    where: { 
      activo: true,
      etapa: { in: ["VENDIDA", "ALQUILADA"] }
    }
  });

  const monto = montoGanado._sum.valor || 0;

  // Rendimiento por vendedor
  const vendedores = await prisma.usuario.findMany({
    where: { rol: "VENDEDOR" },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      oportunidades: {
        select: {
          etapa: true,
          activo: true,
          valor: true,
          fechaCierre: true
        }
      }
    }
  });

  const rendimiento = vendedores.map(v => {
    const activas = v.oportunidades.filter(o => o.activo && o.etapa !== "VENDIDA" && o.etapa !== "ALQUILADA").length;
    const ganadas = v.oportunidades.filter(o => o.activo && (o.etapa === "VENDIDA" || o.etapa === "ALQUILADA")).length;
    const perdidas = v.oportunidades.filter(o => !o.activo).length;
    const monto = v.oportunidades
      .filter(o => o.activo && (o.etapa === "VENDIDA" || o.etapa === "ALQUILADA"))
      .reduce((sum, o) => sum + (o.valor || 0), 0);

    return {
      id: v.id,
      nombre: v.nombre,
      apellido: v.apellido,
      activas,
      ganadas,
      perdidas,
      monto
    };
  });

  res.json({
    total,
    ganadas,
    perdidas,
    monto,
    vendedores: rendimiento
  });
};

export const dashboardPersonalizado = async (req, res) => {
  const usuarioId = req.usuario.id;
  const rol = req.usuario.rol;
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const finDia = new Date();
  finDia.setHours(23, 59, 59, 999);
  
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);

  try {
    if (rol === "VENDEDOR") {
      // ACTIVIDADES DEL DÍA
      const actividadesHoy = await prisma.actividad.findMany({
        where: {
          usuarioId,
          completada: false,
          fechaVencimiento: {
            gte: hoy,
            lte: finDia
          }
        },
        include: {
          oportunidad: {
            include: { cliente: true }
          }
        },
        orderBy: { fechaVencimiento: 'asc' }
      });

      // ACTIVIDADES VENCIDAS
      const actividadesVencidas = await prisma.actividad.count({
        where: {
          usuarioId,
          completada: false,
          fechaVencimiento: { lt: hoy }
        }
      });

      // VISITAS DE HOY
      const visitasHoy = await prisma.actividad.count({
        where: {
          usuarioId,
          tipo: "REUNION",
          completada: false,
          fechaVencimiento: {
            gte: hoy,
            lte: finDia
          }
        }
      });

      // OPORTUNIDADES CALIENTES (Reservadas)
      const oportunidadesCalientes = await prisma.oportunidad.findMany({
        where: {
          usuarioId,
          activo: true,
          etapa: "RESERVADA"
        },
        include: { cliente: true },
        orderBy: { valor: 'desc' },
        take: 5
      });

      // OPORTUNIDADES ESTANCADAS (sin actividades en los últimos 7 días)
      const hace7Dias = new Date();
      hace7Dias.setDate(hace7Dias.getDate() - 7);
      
      const todasMisOportunidades = await prisma.oportunidad.findMany({
        where: {
          usuarioId,
          activo: true,
          etapa: { in: ["DISPONIBLE"] }
        },
        include: {
          cliente: true,
          actividades: {
            orderBy: { fechaVencimiento: 'desc' },
            take: 1
          }
        }
      });

      const oportunidadesEstancadas = todasMisOportunidades.filter(opp => {
        if (opp.actividades.length === 0) return true;
        const ultimaActividad = new Date(opp.actividades[0].fechaVencimiento);
        return ultimaActividad < hace7Dias;
      }).slice(0, 5);

      // RESUMEN DEL MES
      const oportunidadesGanadasMes = await prisma.oportunidad.findMany({
        where: {
          usuarioId,
          activo: true,
          etapa: { in: ["VENDIDA", "ALQUILADA"] },
          fechaCierre: { gte: inicioMes, lte: finMes }
        }
      });

      const montoGanadoMes = oportunidadesGanadasMes.reduce((sum, opp) => sum + (opp.valor || 0), 0);
      const cantidadGanadas = oportunidadesGanadasMes.length;

      const oportunidadesActivasMes = await prisma.oportunidad.count({
        where: {
          usuarioId,
          activo: true,
          etapa: { in: ["DISPONIBLE", "RESERVADA"] }
        }
      });

      // PROPIEDADES POR ESTADO (del vendedor)
      const propiedadesPorEstado = await prisma.oportunidad.groupBy({
        by: ['etapa'],
        _count: { id: true },
        where: {
          usuarioId,
          activo: true
        }
      });

      const estadisticasEstado = {
        disponible: propiedadesPorEstado.find(e => e.etapa === 'DISPONIBLE')?._count.id || 0,
        reservada: propiedadesPorEstado.find(e => e.etapa === 'RESERVADA')?._count.id || 0,
        alquilada: propiedadesPorEstado.find(e => e.etapa === 'ALQUILADA')?._count.id || 0,
        vendida: propiedadesPorEstado.find(e => e.etapa === 'VENDIDA')?._count.id || 0
      };

      // VENTAS POR MES (últimos 6 meses del vendedor)
      const ventasPorMes = [];
      for (let i = 5; i >= 0; i--) {
        const mes = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        const finMesLoop = new Date(hoy.getFullYear(), hoy.getMonth() - i + 1, 0, 23, 59, 59, 999);
        
        const ventasDelMes = await prisma.oportunidad.findMany({
          where: {
            usuarioId,
            activo: true,
            etapa: { in: ["VENDIDA", "ALQUILADA"] },
            fechaCierre: { gte: mes, lte: finMesLoop }
          }
        });

        const monto = ventasDelMes.reduce((sum, opp) => sum + (opp.valor || 0), 0);
        
        ventasPorMes.push({
          mes: mes.toLocaleDateString('es-ES', { month: 'short' }),
          monto: monto,
          cantidad: ventasDelMes.length
        });
      }

      return res.json({
        resumenMes: {
          monto: montoGanadoMes,
          ganadas: cantidadGanadas,
          activas: oportunidadesActivasMes
        },
        actividadesHoy,
        estadisticas: {
          vencidas: actividadesVencidas,
          visitasHoy
        },
        alertas: {
          calientes: oportunidadesCalientes,
          estancadas: oportunidadesEstancadas
        },
        graficoVentas: ventasPorMes,
        estadisticasEstado
      });

    } else {
      // DASHBOARD GERENTE
      const metricasGrales = await prisma.$transaction([
        prisma.oportunidad.count({ where: { activo: true } }),
        prisma.cliente.count({ where: { activo: true } }),
        prisma.usuario.count({ where: { activo: true, rol: "VENDEDOR" } }),
        prisma.oportunidad.aggregate({
          _sum: { valor: true },
          where: { 
            activo: true,
            etapa: { in: ["VENDIDA", "ALQUILADA"] },
            fechaCierre: { gte: inicioMes, lte: finMes }
          }
        })
      ]);

      const [totalPropiedades, totalClientes, totalVendedores, montoMesObj] = metricasGrales;

      // PROPIEDADES POR ESTADO (Global)
      const propiedadesPorEstadoGlobal = await prisma.oportunidad.groupBy({
        by: ['etapa'],
        _count: { id: true },
        where: { activo: true }
      });

      const estadisticasEstado = {
        disponible: propiedadesPorEstadoGlobal.find(e => e.etapa === 'DISPONIBLE')?._count.id || 0,
        reservada: propiedadesPorEstadoGlobal.find(e => e.etapa === 'RESERVADA')?._count.id || 0,
        alquilada: propiedadesPorEstadoGlobal.find(e => e.etapa === 'ALQUILADA')?._count.id || 0,
        vendida: propiedadesPorEstadoGlobal.find(e => e.etapa === 'VENDIDA')?._count.id || 0
      };

      // VENDEDORES TOP DEL MES
      const vendedores = await prisma.usuario.findMany({
        where: { activo: true, rol: "VENDEDOR" },
        include: {
          oportunidades: {
            where: {
              activo: true,
              etapa: { in: ["VENDIDA", "ALQUILADA"] },
              fechaCierre: { gte: inicioMes, lte: finMes }
            }
          }
        }
      });

      const rankingVendedores = vendedores.map(v => ({
        id: v.id,
        nombre: `${v.nombre} ${v.apellido}`,
        ventas: v.oportunidades.length,
        monto: v.oportunidades.reduce((sum, op) => sum + (op.valor || 0), 0)
      })).sort((a, b) => b.monto - a.monto).slice(0, 5);

      // VENTAS DE LA EMPRESA POR MES (últimos 6 meses)
      const ventasEmpresaPorMes = [];
      for (let i = 5; i >= 0; i--) {
        const mes = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        const finMesLoop = new Date(hoy.getFullYear(), hoy.getMonth() - i + 1, 0, 23, 59, 59, 999);
        
        const ventasDelMes = await prisma.oportunidad.findMany({
          where: {
            activo: true,
            etapa: { in: ["VENDIDA", "ALQUILADA"] },
            fechaCierre: { gte: mes, lte: finMesLoop }
          }
        });

        const monto = ventasDelMes.reduce((sum, opp) => sum + (opp.valor || 0), 0);
        
        ventasEmpresaPorMes.push({
          mes: mes.toLocaleDateString('es-ES', { month: 'short' }),
          monto: monto,
          cantidad: ventasDelMes.length
        });
      }

      return res.json({
        resumenMes: {
          monto: montoMesObj._sum.valor || 0,
          propiedadesActivas: totalPropiedades,
          clientesActivos: totalClientes,
          vendedoresActivos: totalVendedores
        },
        estadisticasEstado,
        rankingVendedores,
        graficoVentas: ventasEmpresaPorMes
      });
    }
  } catch (error) {
    console.error("Error en dashboard personalizado:", error);
    res.status(500).json({ error: "Error al cargar el dashboard" });
  }
};
