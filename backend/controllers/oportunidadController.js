import { PrismaClient } from "@prisma/client";
import { parsearPaginacion, construirRespuestaPaginada } from "../utils/paginacion.js";

const prisma = new PrismaClient();

export const listarOportunidades = async (req, res) => {
  try {
    const usuario = req.usuario;
    const { page, limit, skip, take } = parsearPaginacion(req.query, 50); // default 50: máximo razonable para Kanban
    const busqueda = req.query.busqueda?.trim() || "";
    const tipo = req.query.tipo || "";
    const estado = req.query.estado || "";
    const etapa = req.query.etapa || "";
    const tipoCliente = req.query.tipoCliente || "";

    const filtroRol = usuario.rol === "VENDEDOR" ? { usuarioId: usuario.id } : {};
    const filtroTipo = tipo ? { tipo } : {};
    const filtroEstado = estado ? { estado } : {};
    const filtroEtapa = etapa ? { etapa } : {};
    const filtroTipoCliente = tipoCliente ? { cliente: { empresa: tipoCliente } } : {};
    const filtroBusqueda = busqueda
      ? {
          OR: [
            { titulo: { contains: busqueda } },
            { notas: { contains: busqueda } },
            { cliente: { nombre: { contains: busqueda } } }
          ]
        }
      : {};

    const where = {
      ...filtroRol,
      ...filtroTipo,
      ...filtroEstado,
      ...filtroEtapa,
      ...filtroTipoCliente,
      ...filtroBusqueda
    };

    const [oportunidades, total] = await Promise.all([
      prisma.oportunidad.findMany({
        where,
        include: {
          cliente: true,
          usuario: {
            select: { id: true, nombre: true, apellido: true, email: true }
          },
          actividades: {
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
      prisma.oportunidad.count({ where })
    ]);

    return res.json(construirRespuestaPaginada(oportunidades, total, page, limit));

  } catch (error) {
    console.error(error);
    if (error.status) return res.status(error.status).json({ error: error.message });
    res.status(500).json({ error: "Error al obtener oportunidades" });
  }
};

// Crear oportunidad
export const crearOportunidad = async (req, res) => {
  const usuario = req.usuario;
  const { titulo, notas, tipo, estado, valor, etapa, clienteId } = req.body;

  const op = await prisma.oportunidad.create({
    data: {
      titulo,
      notas: notas || null,
      tipo: tipo || null,
      estado: estado || null,
      valor,
      etapa,
      clienteId,
      usuarioId: usuario.id
    }
  });

  res.json(op);
};

// Editar oportunidad
export const editarOportunidad = async (req, res) => {
  const { id } = req.params;
  const { titulo, notas, tipo, estado, valor, clienteId } = req.body;

  // Obtener la oportunidad actual para verificar cambios de estado
  const oppActual = await prisma.oportunidad.findUnique({
    where: { id: Number(id) }
  });

  // Determinar si debemos actualizar fechaCierre
  let fechaCierre = oppActual.fechaCierre;
  
  if (estado && estado !== oppActual.estado) {
    // Si el estado cambió a Alquilada o Vendida y no tiene fechaCierre
    if ((estado === "Alquilada" || estado === "Vendida") && !oppActual.fechaCierre) {
      fechaCierre = new Date();
    }
    // Si vuelve a otro estado (no Alquilada ni Vendida), resetear fechaCierre
    else if (estado !== "Alquilada" && estado !== "Vendida") {
      fechaCierre = null;
    }
  }

  const op = await prisma.oportunidad.update({
    where: { id: Number(id) },
    data: { 
      titulo, 
      notas: notas || null, 
      tipo: tipo || null, 
      estado: estado || null, 
      valor, 
      clienteId,
      fechaCierre
    }
  });

  res.json(op);
};

// Eliminar oportunidad
export const eliminarOportunidad = async (req, res) => {
  const { id } = req.params;

  await prisma.oportunidad.delete({
    where: { id: Number(id) }
  });

  res.json({ mensaje: "Oportunidad eliminada" });
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
