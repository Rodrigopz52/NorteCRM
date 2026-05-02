import { PrismaClient } from "@prisma/client";
import { parsearPaginacion, construirRespuestaPaginada } from "../utils/paginacion.js";

const prisma = new PrismaClient();

export const listarOportunidades = async (req, res) => {
  try {
    const usuario = req.usuario;
    const { page, limit, skip, take } = parsearPaginacion(req.query, 50); // default 50: máximo razonable para Kanban
    const busqueda = req.query.busqueda?.trim() || "";
    const tipo = req.query.tipo || "";
    const operacion = req.query.operacion || "";
    const etapa = req.query.etapa || "";
    const tipoCliente = req.query.tipoCliente || "";
    const filtroEstadoActivo = req.query.estadoActivo || "ACTIVOS";

    const filtroRol = usuario.rol === "VENDEDOR" ? { usuarioId: usuario.id } : {};
    const filtroTipo = tipo ? { tipo } : {};
    const filtroOperacion = operacion ? { operacion } : {};
    const filtroEtapa = etapa ? { etapa } : {};
    const filtroActivo = filtroEstadoActivo === "ACTIVOS" ? { activo: true } : filtroEstadoActivo === "INACTIVOS" ? { activo: false } : {};
    const filtroTipoCliente = tipoCliente ? { cliente: { empresa: tipoCliente } } : {};
    const filtroBusqueda = busqueda
      ? {
          OR: [
            { titulo: { contains: busqueda } },
            { direccion: { contains: busqueda } },
            { notas: { contains: busqueda } },
            { cliente: { nombre: { contains: busqueda } } }
          ]
        }
      : {};

    const whereStats = {
      ...filtroRol,
      ...filtroTipo,
      ...filtroOperacion,
      ...filtroEtapa,
      ...filtroTipoCliente,
      ...filtroBusqueda
    };

    const where = { ...whereStats, ...filtroActivo };

    const [oportunidades, total, totalActivos, totalInactivos] = await Promise.all([
      prisma.oportunidad.findMany({
        where,
        include: {
          cliente: true,
          usuario: {
            select: { id: true, nombre: true, apellido: true, email: true }
          },
          actividades: {
            where: { activo: true },
            orderBy: [
              { completada: "asc" },
              { fechaVencimiento: "asc" }
            ]
          }
        },
        orderBy: { creadoEn: "desc" },
        skip,
        take
      }),
      prisma.oportunidad.count({ where }),
      prisma.oportunidad.count({ where: { ...whereStats, activo: true } }),
      prisma.oportunidad.count({ where: { ...whereStats, activo: false } })
    ]);

    const baseResponse = construirRespuestaPaginada(oportunidades, total, page, limit);
    baseResponse.meta.totalActivos = totalActivos;
    baseResponse.meta.totalInactivos = totalInactivos;

    return res.json(baseResponse);

  } catch (error) {
    console.error(error);
    if (error.status) return res.status(error.status).json({ error: error.message });
    res.status(500).json({ error: "Error al obtener oportunidades" });
  }
};

// Crear oportunidad (Propiedad)
export const crearOportunidad = async (req, res) => {
  const usuario = req.usuario;
  const { 
    titulo, direccion, habitaciones, banos, garages, metrosCuadrados, 
    operacion, imagenUrl, notas, tipo, estado, valor, etapa, clienteId 
  } = req.body;

  const op = await prisma.oportunidad.create({
    data: {
      titulo,
      direccion: direccion || null,
      habitaciones: habitaciones ? Number(habitaciones) : null,
      banos: banos ? Number(banos) : null,
      garages: garages ? Number(garages) : null,
      metrosCuadrados: metrosCuadrados ? Number(metrosCuadrados) : null,
      operacion: operacion || null,
      imagenUrl: imagenUrl || null,
      notas: notas || null,
      tipo: tipo || null,
      estado: estado || null,
      valor: valor ? Number(valor) : null,
      etapa: etapa || "DISPONIBLE",
      clienteId,
      usuarioId: usuario.id
    }
  });

  res.json(op);
};

// Editar oportunidad
export const editarOportunidad = async (req, res) => {
  const { id } = req.params;
  const { 
    titulo, direccion, habitaciones, banos, garages, metrosCuadrados, 
    operacion, imagenUrl, notas, tipo, estado, valor, clienteId, etapa 
  } = req.body;

  // Obtener la oportunidad actual para verificar cambios de estado
  const oppActual = await prisma.oportunidad.findUnique({
    where: { id: Number(id) }
  });

  // Determinar si debemos actualizar fechaCierre
  let fechaCierre = oppActual.fechaCierre;
  
  if (etapa && etapa !== oppActual.etapa) {
    // Si la etapa cambió a Alquilada o Vendida y no tiene fechaCierre
    if ((etapa === "ALQUILADA" || etapa === "VENDIDA") && !oppActual.fechaCierre) {
      fechaCierre = new Date();
    }
    // Si vuelve a otro estado, resetear fechaCierre
    else if (etapa !== "ALQUILADA" && etapa !== "VENDIDA") {
      fechaCierre = null;
    }
  }

  const op = await prisma.oportunidad.update({
    where: { id: Number(id) },
    data: { 
      titulo,
      direccion: direccion || null,
      habitaciones: habitaciones ? Number(habitaciones) : null,
      banos: banos ? Number(banos) : null,
      garages: garages ? Number(garages) : null,
      metrosCuadrados: metrosCuadrados ? Number(metrosCuadrados) : null,
      operacion: operacion || null,
      imagenUrl: imagenUrl || null,
      notas: notas || null, 
      tipo: tipo || null, 
      estado: estado || null, 
      valor: valor ? Number(valor) : null, 
      clienteId,
      etapa: etapa || oppActual.etapa,
      fechaCierre
    }
  });

  res.json(op);
};

export const toggleActivoOportunidad = async (req, res) => {
  try {
    const { id } = req.params;
    
    const oppActual = await prisma.oportunidad.findUnique({
      where: { id: Number(id) }
    });

    if (!oppActual) return res.status(404).json({ error: "Propiedad no encontrada" });

    const actualizado = await prisma.oportunidad.update({
      where: { id: Number(id) },
      data: { activo: !oppActual.activo }
    });

    res.json({
      mensaje: `Propiedad ${actualizado.activo ? 'activada' : 'desactivada'} exitosamente`,
      oportunidad: actualizado
    });
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    res.status(500).json({ error: "Error al cambiar estado de propiedad" });
  }
};

export const cambiarEtapa = async (req, res) => {
  const { id } = req.params;
  const { etapa } = req.body;

  const op = await prisma.oportunidad.update({
    where: { id: Number(id) },
    data: { etapa }
  });

  res.json(op);
};
