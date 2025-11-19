import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const dashboard = async (req, res) => {
  // Solo GERENTE o ADMINISTRADOR pueden ver todo
  if (req.usuario.rol !== "GERENTE" && req.usuario.rol !== "ADMINISTRADOR") {
    return res.status(403).json({ error: "Acceso denegado" });
  }

  // Todas las oportunidades
  const total = await prisma.oportunidad.count();

  // Vendidas/Alquiladas (cerradas)
  const ganadas = await prisma.oportunidad.count({
    where: { 
      OR: [
        { estado: "Alquilada" },
        { estado: "Vendida" }
      ],
      fechaCierre: { not: null }
    }
  });

  // No concretadas
  const perdidas = await prisma.oportunidad.count({
    where: { etapa: "NO_CONCRETADO" }
  });

  // Monto total ganado
  const montoGanado = await prisma.oportunidad.aggregate({
    _sum: { valor: true },
    where: { 
      OR: [
        { estado: "Alquilada" },
        { estado: "Vendida" }
      ],
      fechaCierre: { not: null }
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
          estado: true,
          valor: true,
          fechaCierre: true
        }
      }
    }
  });

  const rendimiento = vendedores.map(v => {
    const activas = v.oportunidades.filter(o => o.estado !== "Alquilada" && o.estado !== "Vendida" && o.etapa !== "NO_CONCRETADO").length;
    const ganadas = v.oportunidades.filter(o => (o.estado === "Alquilada" || o.estado === "Vendida") && o.fechaCierre).length;
    const perdidas = v.oportunidades.filter(o => o.etapa === "NO_CONCRETADO").length;
    const monto = v.oportunidades
      .filter(o => (o.estado === "Alquilada" || o.estado === "Vendida") && o.fechaCierre)
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
  console.log("🎯 Dashboard personalizado llamado para usuario:", req.usuario);
  
  const usuarioId = req.usuario.id;
  const rol = req.usuario.rol;
  
  console.log("📋 Usuario ID:", usuarioId, "Rol:", rol);
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const finDia = new Date();
  finDia.setHours(23, 59, 59, 999);
  
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);

  try {
    if (rol === "VENDEDOR") {
      console.log("📦 Consultando datos para VENDEDOR, usuarioId:", usuarioId);
      
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
      
      console.log("✅ Actividades hoy encontradas:", actividadesHoy.length);

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

      // OPORTUNIDADES CALIENTES (en NEGOCIACION)
      const oportunidadesCalientes = await prisma.oportunidad.findMany({
        where: {
          usuarioId,
          etapa: "NEGOCIACION"
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
          estado: { not: "Alquilada", not: "Vendida" },
          etapa: { not: "NO_CONCRETADO" }
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
          OR: [
            { estado: "Alquilada" },
            { estado: "Vendida" }
          ],
          fechaCierre: { gte: inicioMes, lte: finMes }
        }
      });

      const montoGanadoMes = oportunidadesGanadasMes.reduce((sum, opp) => sum + (opp.valor || 0), 0);
      const cantidadGanadas = oportunidadesGanadasMes.length;

      const oportunidadesActivasMes = await prisma.oportunidad.count({
        where: {
          usuarioId,
          estado: { notIn: ["Alquilada", "Vendida"] },
          etapa: { not: "NO_CONCRETADO" }
        }
      });

      // PROPIEDADES POR ESTADO (del vendedor)
      const propiedadesPorEstado = await prisma.oportunidad.groupBy({
        by: ['estado'],
        _count: { id: true },
        where: {
          usuarioId,
          estado: { not: null }
        }
      });

      const estadisticasEstado = {
        disponible: propiedadesPorEstado.find(e => e.estado === 'Disponible')?._count.id || 0,
        reservada: propiedadesPorEstado.find(e => e.estado === 'Reservada')?._count.id || 0,
        alquilada: propiedadesPorEstado.find(e => e.estado === 'Alquilada')?._count.id || 0,
        vendida: propiedadesPorEstado.find(e => e.estado === 'Vendida')?._count.id || 0
      };

      // VENTAS POR MES (últimos 6 meses del vendedor)
      const ventasPorMes = [];
      for (let i = 5; i >= 0; i--) {
        const mes = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        const finMesLoop = new Date(hoy.getFullYear(), hoy.getMonth() - i + 1, 0, 23, 59, 59, 999);
        
        const ventasDelMes = await prisma.oportunidad.findMany({
          where: {
            usuarioId,
            OR: [
              { estado: "Alquilada" },
              { estado: "Vendida" }
            ],
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

      console.log("✅ Datos completos para VENDEDOR:", {
        actividadesHoy: actividadesHoy.length,
        actividadesVencidas,
        oportunidadesCalientes: oportunidadesCalientes.length,
        oportunidadesEstancadas: oportunidadesEstancadas.length,
        resumenMes: { montoGanado: montoGanadoMes, cantidadGanadas, oportunidadesActivas: oportunidadesActivasMes }
      });

      return res.json({
        rol: "VENDEDOR",
        actividadesHoy,
        actividadesVencidas,
        visitasHoy,
        oportunidadesCalientes,
        oportunidadesEstancadas,
        propiedadesPorEstado: estadisticasEstado,
        ventasPorMes: ventasPorMes,
        resumenMes: {
          montoGanado: montoGanadoMes,
          cantidadGanadas,
          oportunidadesActivas: oportunidadesActivasMes
        }
      });

    } else {
      // GERENTE/ADMINISTRADOR: Vista general del equipo
      
      // RANKING DE VENDEDORES DEL MES
      const vendedores = await prisma.usuario.findMany({
        where: { rol: "VENDEDOR" },
        include: {
          oportunidades: {
            where: {
              OR: [
                { estado: "Alquilada" },
                { estado: "Vendida" }
              ],
              fechaCierre: { gte: inicioMes, lte: finMes }
            }
          }
        }
      });

      const ranking = vendedores.map(v => {
        const monto = v.oportunidades.reduce((sum, opp) => sum + (opp.valor || 0), 0);
        const cantidad = v.oportunidades.length;
        return {
          id: v.id,
          nombre: v.nombre,
          apellido: v.apellido,
          monto,
          cantidad
        };
      }).sort((a, b) => b.monto - a.monto);

      // OPORTUNIDADES ESTANCADAS DEL EQUIPO
      const todasOportunidades = await prisma.oportunidad.findMany({
        where: {
          estado: { notIn: ["Alquilada", "Vendida"] },
          etapa: { not: "NO_CONCRETADO" }
        },
        include: {
          cliente: true,
          usuario: true,
          actividades: {
            orderBy: { fechaVencimiento: 'desc' },
            take: 1
          }
        }
      });

      const hace15Dias = new Date();
      hace15Dias.setDate(hace15Dias.getDate() - 15);

      const estancadasEquipo = todasOportunidades.filter(opp => {
        if (opp.actividades.length === 0) return true;
        const ultimaActividad = new Date(opp.actividades[0].fechaVencimiento);
        return ultimaActividad < hace15Dias;
      }).slice(0, 10);

      // ACTIVIDADES VENCIDAS DEL EQUIPO
      const actividadesVencidasEquipo = await prisma.actividad.count({
        where: {
          completada: false,
          fechaVencimiento: { lt: hoy }
        }
      });

      // VISITAS DE LA SEMANA
      const finSemana = new Date(hoy);
      finSemana.setDate(finSemana.getDate() + 7);
      finSemana.setHours(23, 59, 59, 999);
      
      const visitasSemana = await prisma.actividad.count({
        where: {
          tipo: "REUNION",
          completada: false,
          fechaVencimiento: {
            gte: hoy,
            lte: finSemana
          }
        }
      });

      // RESUMEN DEL EQUIPO DEL MES
      const todasGanadasMes = await prisma.oportunidad.findMany({
        where: {
          OR: [
            { estado: "Alquilada" },
            { estado: "Vendida" }
          ],
          fechaCierre: { gte: inicioMes, lte: finMes }
        }
      });

      const montoTotalMes = todasGanadasMes.reduce((sum, opp) => sum + (opp.valor || 0), 0);

      // PROPIEDADES POR ESTADO
      const propiedadesPorEstado = await prisma.oportunidad.groupBy({
        by: ['estado'],
        _count: { id: true },
        where: {
          estado: { not: null }
        }
      });

      const estadisticasEstado = {
        disponible: propiedadesPorEstado.find(e => e.estado === 'Disponible')?._count.id || 0,
        reservada: propiedadesPorEstado.find(e => e.estado === 'Reservada')?._count.id || 0,
        alquilada: propiedadesPorEstado.find(e => e.estado === 'Alquilada')?._count.id || 0,
        vendida: propiedadesPorEstado.find(e => e.estado === 'Vendida')?._count.id || 0
      };

      // VENTAS POR MES (últimos 6 meses)
      const ventasPorMes = [];
      for (let i = 5; i >= 0; i--) {
        const mes = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        const finMesLoop = new Date(hoy.getFullYear(), hoy.getMonth() - i + 1, 0, 23, 59, 59, 999);
        
        const ventasDelMes = await prisma.oportunidad.findMany({
          where: {
            OR: [
              { estado: "Alquilada" },
              { estado: "Vendida" }
            ],
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
        rol: req.usuario.rol, // GERENTE o ADMINISTRADOR
        rankingVendedores: ranking,
        oportunidadesEstancadas: estancadasEquipo,
        actividadesVencidas: actividadesVencidasEquipo,
        visitasSemana,
        propiedadesPorEstado: estadisticasEstado,
        ventasPorMes: ventasPorMes,
        resumenMes: {
          montoTotal: montoTotalMes,
          cantidadGanadas: todasGanadasMes.length,
          oportunidadesActivas: todasOportunidades.length
        }
      });
    }
  } catch (error) {
    console.error("❌ Error en dashboard personalizado:", error);
    res.status(500).json({ error: "Error al obtener dashboard personalizado", detalle: error.message });
  }
};
