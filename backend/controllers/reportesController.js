import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
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
  let usuarioId = req.usuario.id;
  let rol = req.usuario.rol;

  // Si es gerente o administrador y se solicita ver el dashboard de un usuario específico
  if ((rol === "GERENTE" || rol === "ADMINISTRADOR") && req.query.usuarioId) {
    usuarioId = parseInt(req.query.usuarioId, 10);
    rol = "VENDEDOR"; // Forzar la vista de vendedor para que retorne el reporte individual
  }
  
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
      // DASHBOARD GERENTE (legacy - mantener compatibilidad)
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

// ============================================================
// NUEVO: Dashboard Gerencial con filtros de período
// ============================================================
export const dashboardGerencial = async (req, res) => {
  if (req.usuario.rol !== "GERENTE" && req.usuario.rol !== "ADMINISTRADOR") {
    return res.status(403).json({ error: "Acceso denegado" });
  }

  try {
    const { periodo = "mes", compararAnterior = "true", fechaInicio, fechaFin } = req.query;
    const ahora = new Date();

    // Calcular rangos de fechas
    const calcularRango = (p, offset = 0) => {
      const hoy = new Date(ahora);
      let desde, hasta;

      if (p === "semana") {
        const diaSemana = hoy.getDay(); // 0=Dom, 1=Lun...
        const lunes = new Date(hoy);
        lunes.setDate(hoy.getDate() - ((diaSemana + 6) % 7) + offset * 7);
        lunes.setHours(0, 0, 0, 0);
        const domingo = new Date(lunes);
        domingo.setDate(lunes.getDate() + 6);
        domingo.setHours(23, 59, 59, 999);
        desde = lunes;
        hasta = domingo;
      } else if (p === "trimestre") {
        const mesActual = hoy.getMonth();
        const inicioTrimestre = Math.floor(mesActual / 3) * 3 + offset * 3;
        const anio = hoy.getFullYear() + (inicioTrimestre < 0 ? -1 : inicioTrimestre > 11 ? 1 : 0);
        const mesNorm = ((inicioTrimestre % 12) + 12) % 12;
        desde = new Date(anio, mesNorm, 1, 0, 0, 0, 0);
        hasta = new Date(anio, mesNorm + 3, 0, 23, 59, 59, 999);
      } else if (p === "anio") {
        const anio = hoy.getFullYear() + offset;
        desde = new Date(anio, 0, 1, 0, 0, 0, 0);
        hasta = new Date(anio, 11, 31, 23, 59, 59, 999);
      } else {
        // mes (default)
        const anio = hoy.getFullYear();
        const mes = hoy.getMonth() + offset;
        const anioReal = anio + Math.floor(mes / 12);
        const mesReal = ((mes % 12) + 12) % 12;
        desde = new Date(anioReal, mesReal, 1, 0, 0, 0, 0);
        hasta = new Date(anioReal, mesReal + 1, 0, 23, 59, 59, 999);
      }

      return { desde, hasta };
    };

    let desde, hasta, desdeAnt, hastaAnt;

    if (fechaInicio && fechaFin) {
      const [y1, m1, d1] = fechaInicio.split("-").map(Number);
      desde = new Date(y1, m1 - 1, d1, 0, 0, 0, 0);

      const [y2, m2, d2] = fechaFin.split("-").map(Number);
      hasta = new Date(y2, m2 - 1, d2, 23, 59, 59, 999);

      // Calcular rango anterior equivalente en duración
      const diffMs = hasta.getTime() - desde.getTime();
      desdeAnt = new Date(desde.getTime() - diffMs - 1);
      desdeAnt.setHours(0, 0, 0, 0);
      hastaAnt = new Date(desde.getTime() - 1);
      hastaAnt.setHours(23, 59, 59, 999);
    } else {
      const rangoAct = calcularRango(periodo, 0);
      desde = rangoAct.desde;
      hasta = rangoAct.hasta;

      const rangoAnt = calcularRango(periodo, -1);
      desdeAnt = rangoAnt.desde;
      hastaAnt = rangoAnt.hasta;
    }

    const hoyInicio = new Date(ahora);
    hoyInicio.setHours(0, 0, 0, 0);
    const hoyFin = new Date(ahora);
    hoyFin.setHours(23, 59, 59, 999);

    // ── KPIs ACTUALES ──────────────────────────────────────────
    const [opsCerradasAct, opsAnteriores, totalLeads] = await Promise.all([
      prisma.oportunidad.findMany({
        where: { activo: true, etapa: { in: ["VENDIDA", "ALQUILADA"] }, fechaCierre: { gte: desde, lte: hasta } },
        select: { valor: true, fechaCierre: true, creadoEn: true }
      }),
      prisma.oportunidad.findMany({
        where: { activo: true, etapa: { in: ["VENDIDA", "ALQUILADA"] }, fechaCierre: { gte: desdeAnt, lte: hastaAnt } },
        select: { valor: true, fechaCierre: true, creadoEn: true }
      }),
      prisma.cliente.count({ where: { activo: true, creadoEn: { gte: desde, lte: hasta } } })
    ]);

    const ingresosAct = opsCerradasAct.reduce((s, o) => s + (o.valor || 0), 0);
    const ingresosAnt = opsAnteriores.reduce((s, o) => s + (o.valor || 0), 0);
    const variacionIngresos = ingresosAnt > 0 ? ((ingresosAct - ingresosAnt) / ingresosAnt) * 100 : 0;

    // Props disponibles
    const propsDisponiblesAct = await prisma.oportunidad.count({ where: { activo: true, etapa: "DISPONIBLE" } });
    const propsDisponiblesAnt = await prisma.oportunidad.count({
      where: { activo: true, etapa: "DISPONIBLE", creadoEn: { lte: hastaAnt } }
    });
    const variacionProps = propsDisponiblesAnt > 0 ? ((propsDisponiblesAct - propsDisponiblesAnt) / propsDisponiblesAnt) * 100 : 0;

    // Tasa de conversión
    const leadsAnt = await prisma.cliente.count({ where: { activo: true, creadoEn: { gte: desdeAnt, lte: hastaAnt } } });
    const tasaAct = totalLeads > 0 ? (opsCerradasAct.length / totalLeads) * 100 : 0;
    const tasaAnt = leadsAnt > 0 ? (opsAnteriores.length / leadsAnt) * 100 : 0;
    const variacionTasa = tasaAnt > 0 ? ((tasaAct - tasaAnt) / tasaAnt) * 100 : 0;

    // Días promedio a cierre
    const calcDiasPromedio = (ops) => {
      const opsConFecha = ops.filter(o => o.fechaCierre && o.creadoEn);
      if (opsConFecha.length === 0) return 0;
      const total = opsConFecha.reduce((s, o) => {
        return s + (new Date(o.fechaCierre) - new Date(o.creadoEn)) / (1000 * 60 * 60 * 24);
      }, 0);
      return Math.round(total / opsConFecha.length);
    };
    const diasAct = calcDiasPromedio(opsCerradasAct);
    const diasAnt = calcDiasPromedio(opsAnteriores);
    const variacionDias = diasAnt > 0 ? ((diasAct - diasAnt) / diasAnt) * 100 : 0;

    // ── GRÁFICO DE INGRESOS (últimos 6 períodos) ──────────────
    const graficoPuntos = 6;
    const graficoIngresos = [];
    for (let i = graficoPuntos - 1; i >= 0; i--) {
      const { desde: d1, hasta: h1 } = calcularRango(periodo, -i);
      const { desde: d2, hasta: h2 } = calcularRango(periodo, -(i + graficoPuntos));

      const [ventasAct, ventasAnt] = await Promise.all([
        prisma.oportunidad.findMany({
          where: { activo: true, etapa: { in: ["VENDIDA", "ALQUILADA"] }, fechaCierre: { gte: d1, lte: h1 } },
          select: { valor: true }
        }),
        prisma.oportunidad.findMany({
          where: { activo: true, etapa: { in: ["VENDIDA", "ALQUILADA"] }, fechaCierre: { gte: d2, lte: h2 } },
          select: { valor: true }
        })
      ]);

      let label;
      if (periodo === "semana") label = i === 0 ? "Esta sem." : `Sem -${i}`;
      else if (periodo === "trimestre") label = i === 0 ? "Este trim." : `Trim -${i}`;
      else if (periodo === "anio") label = d1.getFullYear().toString();
      else label = d1.toLocaleDateString('es-ES', { month: 'short' });

      graficoIngresos.push({
        label,
        actual: ventasAct.reduce((s, o) => s + (o.valor || 0), 0),
        anterior: ventasAnt.reduce((s, o) => s + (o.valor || 0), 0)
      });
    }

    // ── PROPIEDADES POR ESTADO ────────────────────────────────
    const estadosGrupos = await prisma.oportunidad.groupBy({
      by: ['etapa'],
      _count: { id: true },
      where: { activo: true }
    });
    
    const propiedadesNoConcretadas = await prisma.oportunidad.count({
      where: { activo: false }
    });

    const propiedadesPorEstado = {
      disponible: estadosGrupos.find(e => e.etapa === 'DISPONIBLE')?._count.id || 0,
      reservada: estadosGrupos.find(e => e.etapa === 'RESERVADA')?._count.id || 0,
      vendida: estadosGrupos.find(e => e.etapa === 'VENDIDA')?._count.id || 0,
      alquilada: estadosGrupos.find(e => e.etapa === 'ALQUILADA')?._count.id || 0,
      no_concretadas: propiedadesNoConcretadas,
      total: 0
    };
    propiedadesPorEstado.total = propiedadesPorEstado.disponible + propiedadesPorEstado.reservada + propiedadesPorEstado.vendida + propiedadesPorEstado.alquilada + propiedadesPorEstado.no_concretadas;

    // ── EMBUDO DE VENTAS ──────────────────────────────────────
    const etapasEmbudo = ["LEAD", "CONTACTADO", "VISITA", "NEGOCIACION", "CERRADO"];
    const embudoGrupos = await prisma.cliente.groupBy({
      by: ['etapaLead'],
      _count: { id: true },
      where: { activo: true }
    });

    const embudoMap = {};
    etapasEmbudo.forEach(e => {
      embudoMap[e] = embudoGrupos.find(g => g.etapaLead === e)?._count.id || 0;
    });

    // Acumulativo: cada etapa incluye todos los de etapas posteriores
    const leads = etapasEmbudo.reduce((s, e) => s + embudoMap[e], 0);
    const contactados = embudoMap.CONTACTADO + embudoMap.VISITA + embudoMap.NEGOCIACION + embudoMap.CERRADO;
    const visitas = embudoMap.VISITA + embudoMap.NEGOCIACION + embudoMap.CERRADO;
    const reservas = embudoMap.NEGOCIACION + embudoMap.CERRADO;
    const cerradas = embudoMap.CERRADO;

    const pct = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;

    const embudo = [
      { etapa: "Leads", cantidad: leads, porcentaje: 100, conversion: null },
      { etapa: "Contactados", cantidad: contactados, porcentaje: pct(contactados, leads), conversion: pct(contactados, leads) },
      { etapa: "Visitas", cantidad: visitas, porcentaje: pct(visitas, leads), conversion: pct(visitas, contactados) },
      { etapa: "En negociación", cantidad: reservas, porcentaje: pct(reservas, leads), conversion: pct(reservas, visitas) },
      { etapa: "Cerradas", cantidad: cerradas, porcentaje: pct(cerradas, leads), conversion: pct(cerradas, reservas) }
    ];

    // ── VISITAS DE HOY ────────────────────────────────────────
    const visitasHoyRaw = await prisma.actividad.findMany({
      where: {
        tipo: "REUNION",
        completada: false,
        activo: true,
        fechaVencimiento: { gte: hoyInicio, lte: hoyFin }
      },
      include: {
        oportunidad: { include: { cliente: true } },
        cliente: true,
        usuario: { select: { nombre: true, apellido: true } }
      },
      orderBy: { fechaVencimiento: 'asc' },
      take: 8
    });

    const visitasHoy = visitasHoyRaw.map(v => ({
      id: v.id,
      hora: new Date(v.fechaVencimiento).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      cliente: v.cliente?.nombre || v.oportunidad?.cliente?.nombre || 'Sin cliente',
      propiedad: v.oportunidad?.titulo || v.titulo,
      asesor: `${v.usuario.nombre} ${v.usuario.apellido}`,
      asesorIniciales: `${v.usuario.nombre[0]}${v.usuario.apellido[0]}`.toUpperCase()
    }));

    // ── RANKING DE ASESORES (con meta histórica) ──────────────
    const vendedores = await prisma.usuario.findMany({
      where: { activo: true, rol: "VENDEDOR" },
      select: { id: true, nombre: true, apellido: true }
    });

    const rankingAsesores = await Promise.all(vendedores.map(async (v) => {
      // Ventas en el período actual
      const ventasPeriodo = await prisma.oportunidad.findMany({
        where: {
          usuarioId: v.id,
          activo: true,
          etapa: { in: ["VENDIDA", "ALQUILADA"] },
          fechaCierre: { gte: desde, lte: hasta }
        },
        select: { valor: true }
      });
      const montoPeriodo = ventasPeriodo.reduce((s, o) => s + (o.valor || 0), 0);
      const cantidadPeriodo = ventasPeriodo.length;

      // Meta = promedio mensual histórico (últimos 6 meses, excluyendo período actual)
      let sumaMeses = 0;
      let mesesConDatos = 0;
      for (let i = 1; i <= 6; i++) {
        const { desde: dHist, hasta: hHist } = calcularRango("mes", -i);
        const ventasMes = await prisma.oportunidad.findMany({
          where: {
            usuarioId: v.id,
            activo: true,
            etapa: { in: ["VENDIDA", "ALQUILADA"] },
            fechaCierre: { gte: dHist, lte: hHist }
          },
          select: { valor: true }
        });
        const montoMes = ventasMes.reduce((s, o) => s + (o.valor || 0), 0);
        if (montoMes > 0) {
          sumaMeses += montoMes;
          mesesConDatos++;
        }
      }
      const meta = mesesConDatos > 0 ? sumaMeses / mesesConDatos : 0;
      let metaPorcentaje = 0;
      if (meta > 0) {
        metaPorcentaje = Math.min(Math.round((montoPeriodo / meta) * 100), 200);
      } else if (montoPeriodo > 0) {
        metaPorcentaje = 100; // Si no hay histórico pero vendió algo, llega al 100%
      }
      return {
        id: v.id,
        nombre: `${v.nombre} ${v.apellido}`,
        propiedades: cantidadPeriodo,
        monto: montoPeriodo,
        meta: Math.round(meta),
        metaPorcentaje
      };
    }));

    rankingAsesores.sort((a, b) => {
      if (b.metaPorcentaje !== a.metaPorcentaje) {
        return b.metaPorcentaje - a.metaPorcentaje;
      }
      return b.monto - a.monto;
    });

    // ── TAREAS VENCIDAS ───────────────────────────────────────
    const tareasVencidasRaw = await prisma.actividad.findMany({
      where: {
        completada: false,
        activo: true,
        fechaVencimiento: { lt: hoyInicio }
      },
      include: {
        usuario: { select: { nombre: true, apellido: true } },
        oportunidad: { include: { cliente: true } },
        cliente: true
      }
    });

    tareasVencidasRaw.sort((a, b) => {
      return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime();
    });

    const tareasVencidasTop = tareasVencidasRaw.slice(0, 20);
    
    const formatearFechaCorto = (d) => d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });

    const tareasVencidas = tareasVencidasTop.map(t => {
      const diasVencida = Math.floor((ahora - new Date(t.fechaVencimiento)) / (1000 * 60 * 60 * 24));
      return {
        id: t.id,
        titulo: t.titulo,
        diasVencida,
        fechaOriginal: formatearFechaCorto(new Date(t.fechaVencimiento)),
        prioridad: t.prioridad,
        asesor: `${t.usuario.nombre} ${t.usuario.apellido}`,
        asesorIniciales: `${t.usuario.nombre[0]}${t.usuario.apellido[0]}`.toUpperCase(),
        cliente: t.cliente?.nombre || t.oportunidad?.cliente?.nombre || null
      };
    });

    // ── INSIGHTS AUTOMÁTICOS ──────────────────────────────────
    const insights = [];
    if (Math.abs(variacionIngresos) >= 5) {
      insights.push({
        tipo: variacionIngresos > 0 ? "success" : "warning",
        mensaje: variacionIngresos > 0
          ? `Las ventas subieron un ${Math.abs(variacionIngresos).toFixed(1)}% respecto al período anterior`
          : `Las ventas bajaron un ${Math.abs(variacionIngresos).toFixed(1)}% respecto al período anterior`
      });
    }
    if (Math.abs(variacionTasa) >= 5) {
      insights.push({
        tipo: variacionTasa > 0 ? "success" : "warning",
        mensaje: variacionTasa > 0
          ? `La tasa de conversión mejoró un ${Math.abs(variacionTasa).toFixed(1)}%`
          : `La tasa de conversión cayó un ${Math.abs(variacionTasa).toFixed(1)}%`
      });
    }
    if (tareasVencidas.length >= 3) {
      insights.push({
        tipo: "warning",
        mensaje: `${tareasVencidas.length} tareas llevan más de un día sin completarse`
      });
    }

    // ── ETIQUETA DEL PERÍODO ──────────────────────────────────
    const formatearFecha = (d) => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    const labelPeriodo = (fechaInicio && fechaFin)
      ? `${formatearFecha(desde)} - ${formatearFecha(hasta)}`
      : (periodo === "semana" ? "Esta semana"
         : periodo === "trimestre" ? "Este trimestre"
         : periodo === "anio" ? `Año ${ahora.getFullYear()}`
         : `${desde.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`);

    return res.json({
      periodo: {
        tipo: periodo,
        desde: desde.toISOString(),
        hasta: hasta.toISOString(),
        label: labelPeriodo
      },
      kpis: {
        ingresos: { actual: ingresosAct, anterior: ingresosAnt, variacion: parseFloat(variacionIngresos.toFixed(1)) },
        propiedadesDisponibles: { actual: propsDisponiblesAct, anterior: propsDisponiblesAnt, variacion: parseFloat(variacionProps.toFixed(1)) },
        tasaConversion: { actual: parseFloat(tasaAct.toFixed(1)), anterior: parseFloat(tasaAnt.toFixed(1)), variacion: parseFloat(variacionTasa.toFixed(1)) },
        diasPromedioCierre: { actual: diasAct, anterior: diasAnt, variacion: parseFloat(variacionDias.toFixed(1)) }
      },
      graficoIngresos,
      propiedadesPorEstado,
      embudo,
      visitasHoy,
      rankingAsesores,
      tareasVencidas,
      insights
    });

  } catch (error) {
    console.error("Error en dashboard gerencial:", error);
    res.status(500).json({ error: "Error al cargar el dashboard gerencial" });
  }
};

export const exportarExcelDetallado = async (req, res) => {
  if (req.usuario.rol !== "GERENTE" && req.usuario.rol !== "ADMINISTRADOR") {
    return res.status(403).json({ error: "Acceso denegado" });
  }

  try {
    const wb = XLSX.utils.book_new();

    // 1. Propiedades Activas
    const activas = await prisma.oportunidad.findMany({
      where: { activo: true, etapa: { in: ["DISPONIBLE", "RESERVADA"] } },
      include: { usuario: true, cliente: true }
    });

    const activasData = [
      ["ID", "Título", "Dirección", "Tipo", "Operación", "Etapa", "Valor ($)", "Vendedor", "Cliente", "Fecha Creación"],
      ...activas.map(o => [
        o.id, o.titulo, o.direccion, o.tipo, o.operacion, o.etapa, o.valor, 
        o.usuario ? `${o.usuario.nombre} ${o.usuario.apellido}` : "Sin asignar",
        o.cliente ? o.cliente.nombre : "Sin cliente",
        o.creadoEn.toLocaleDateString('es-ES')
      ])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(activasData), "Propiedades Activas");

    // 2. Operaciones Cerradas (Vendidas y Alquiladas)
    const cerradas = await prisma.oportunidad.findMany({
      where: { activo: true, etapa: { in: ["VENDIDA", "ALQUILADA"] } },
      include: { usuario: true, cliente: true }
    });

    const cerradasData = [
      ["ID", "Título", "Tipo", "Operación", "Valor Cierre ($)", "Fecha Cierre", "Vendedor", "Cliente", "Fecha Creación"],
      ...cerradas.map(o => [
        o.id, o.titulo, o.tipo, o.operacion, o.valor, 
        o.fechaCierre ? o.fechaCierre.toLocaleDateString('es-ES') : "N/A",
        o.usuario ? `${o.usuario.nombre} ${o.usuario.apellido}` : "Sin asignar",
        o.cliente ? o.cliente.nombre : "Sin cliente",
        o.creadoEn.toLocaleDateString('es-ES')
      ])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cerradasData), "Operaciones Cerradas");

    // 3. Clientes Activos
    const clientes = await prisma.cliente.findMany({
      where: { activo: true },
      include: { usuario: true }
    });

    const clientesData = [
      ["ID", "Nombre", "Email", "Teléfono", "Etapa Lead", "Temperatura", "Vendedor Asignado", "Fecha Ingreso"],
      ...clientes.map(c => [
        c.id, c.nombre, c.email, c.telefono, c.etapaLead, c.temperatura,
        c.usuario ? `${c.usuario.nombre} ${c.usuario.apellido}` : "Sin asignar",
        c.creadoEn.toLocaleDateString('es-ES')
      ])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(clientesData), "Clientes Activos");

    // Generar buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader('Content-Disposition', 'attachment; filename="NorteCRM_Reporte_Operativo.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);

  } catch (error) {
    console.error("Error al exportar Excel:", error);
    res.status(500).json({ error: "Error al exportar Excel" });
  }
};
