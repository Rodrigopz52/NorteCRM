import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


import { parsearPaginacion, construirRespuestaPaginada } from "../utils/paginacion.js";

export const listarClientes = async (req, res) => {
  try {
    const usuario = req.usuario;
    const { page, limit, skip, take } = parsearPaginacion(req.query);
    const busqueda = req.query.busqueda?.trim() || "";
    const tipo = req.query.tipo || "";
    const estado = req.query.estado || "ACTIVOS";
    
    const filtroRol = usuario.rol === "VENDEDOR" ? { usuarioId: usuario.id } : {};
    const filtroTipo = tipo ? { empresa: tipo } : {};
    const filtroEstado = estado === "ACTIVOS" ? { activo: true } : estado === "INACTIVOS" ? { activo: false } : {};
    const filtroBusqueda = busqueda
      ? {
          OR: [
            { nombre: { contains: busqueda } },
            { email: { contains: busqueda } },
            { telefono: { contains: busqueda } }
          ]
        }
      : {};

    const whereStats = { ...filtroRol, ...filtroTipo, ...filtroBusqueda };
    const where = { ...whereStats, ...filtroEstado };

    const [clientes, total, totalActivos, totalInactivos] = await Promise.all([
      prisma.cliente.findMany({
        where,
        include:
          usuario.rol === "GERENTE" || usuario.rol === "ADMINISTRADOR"
            ? { usuario: { select: { id: true, nombre: true, apellido: true, email: true } } }
            : undefined,
        orderBy: { nombre: "asc" },
        skip,
        take
      }),
      prisma.cliente.count({ where }),
      prisma.cliente.count({ where: { ...whereStats, activo: true } }),
      prisma.cliente.count({ where: { ...whereStats, activo: false } })
    ]);

    const baseResponse = construirRespuestaPaginada(clientes, total, page, limit);
    baseResponse.meta.totalActivos = totalActivos;
    baseResponse.meta.totalInactivos = totalInactivos;
    
    return res.json(baseResponse);

  } catch (error) {
    console.error(error);
    if (error.status) return res.status(error.status).json({ error: error.message });
    res.status(500).json({ error: "Error al obtener clientes" });
  }
};

export const crearCliente = async (req, res) => {
  try {
    const usuario = req.usuario;
    const { nombre, empresa, telefono, email, notas, temperatura, interes, usuarioId } = req.body;

    const cliente = await prisma.cliente.create({
      data: {
        nombre,
        empresa,
        telefono,
        email,
        notas,
        temperatura: temperatura || "FRIO",
        interes,
        usuarioId: usuarioId ? Number(usuarioId) : usuario.id
      }
    });

    res.json({ mensaje: "Cliente creado", cliente });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear cliente" });
  }
};

export const editarCliente = async (req, res) => {
  try {
    const usuario = req.usuario;
    const { id } = req.params;
    const { nombre, empresa, telefono, email, notas, temperatura, interes, usuarioId } = req.body;

    const cliente = await prisma.cliente.findUnique({ where: { id: Number(id) } });

    if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });

    // El gerente y administrador pueden editar cualquier cliente, el vendedor solo sus propios clientes
    if (usuario.rol === "VENDEDOR" && cliente.usuarioId !== usuario.id) {
      return res.status(403).json({ error: "No tienes permiso para editar este cliente" });
    }

    const actualizado = await prisma.cliente.update({
      where: { id: Number(id) },
      data: {
        nombre,
        empresa,
        telefono,
        email,
        notas,
        temperatura,
        interes,
        ...(usuarioId ? { usuarioId: Number(usuarioId) } : {})
      }
    });

    res.json(actualizado);

  } catch (error) {
    console.error("Error al editar cliente:", error);
    res.status(500).json({ error: "Error al editar cliente: " + error.message });
  }
};


export const toggleActivoCliente = async (req, res) => {
  try {
    const usuario = req.usuario;

    if (usuario.rol !== "GERENTE" && usuario.rol !== "ADMINISTRADOR") {
      return res.status(403).json({ error: "Solo el gerente o administrador pueden cambiar el estado del cliente" });
    }

    const { id } = req.params;

    const cliente = await prisma.cliente.findUnique({
      where: { id: Number(id) }
    });

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    const actualizado = await prisma.cliente.update({
      where: { id: Number(id) },
      data: { activo: !cliente.activo }
    });

    res.json({
      mensaje: `Cliente ${actualizado.activo ? 'activado' : 'desactivado'} exitosamente`,
      cliente: actualizado
    });

  } catch (error) {
    console.error("Error al cambiar estado de cliente:", error);
    res.status(500).json({ error: "Error al cambiar estado de cliente" });
  }
};
