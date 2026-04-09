import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


import { parsearPaginacion, construirRespuestaPaginada } from "../utils/paginacion.js";

export const listarClientes = async (req, res) => {
  try {
    const usuario = req.usuario;
    const { page, limit, skip, take } = parsearPaginacion(req.query);
    const busqueda = req.query.busqueda?.trim() || "";
    const tipo = req.query.tipo || "";
    
    const filtroRol = usuario.rol === "VENDEDOR" ? { usuarioId: usuario.id } : {};
    const filtroTipo = tipo ? { empresa: tipo } : {};
    const filtroBusqueda = busqueda
      ? {
          OR: [
            { nombre: { contains: busqueda } },
            { email: { contains: busqueda } },
            { telefono: { contains: busqueda } }
          ]
        }
      : {};

    const where = { ...filtroRol, ...filtroTipo, ...filtroBusqueda };

    const [clientes, total] = await Promise.all([
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
      prisma.cliente.count({ where })
    ]);

    return res.json(construirRespuestaPaginada(clientes, total, page, limit));

  } catch (error) {
    console.error(error);
    if (error.status) return res.status(error.status).json({ error: error.message });
    res.status(500).json({ error: "Error al obtener clientes" });
  }
};

export const crearCliente = async (req, res) => {
  try {
    const usuario = req.usuario;
    const { nombre, empresa, telefono, email, notas } = req.body;

    const cliente = await prisma.cliente.create({
      data: {
        nombre,
        empresa,
        telefono,
        email,
        notas,
        usuarioId: usuario.id
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
    const { nombre, empresa, telefono, email, notas } = req.body;

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
        notas
      }
    });

    res.json(actualizado);

  } catch (error) {
    console.error("Error al editar cliente:", error);
    res.status(500).json({ error: "Error al editar cliente: " + error.message });
  }
};


export const eliminarCliente = async (req, res) => {
  try {
    const usuario = req.usuario;

    if (usuario.rol !== "GERENTE" && usuario.rol !== "ADMINISTRADOR") {
      return res.status(403).json({ error: "Solo el gerente o administrador pueden eliminar clientes" });
    }

    const { id } = req.params;

    // Verificar si el cliente tiene oportunidades o tareas asociadas
    const oportunidadesCount = await prisma.oportunidad.count({
      where: { clienteId: Number(id) }
    });

    const tareasCount = await prisma.tarea.count({
      where: { clienteId: Number(id) }
    });

    // Eliminar todas las relaciones antes de eliminar el cliente
    if (tareasCount > 0) {
      await prisma.tarea.deleteMany({ where: { clienteId: Number(id) } });
    }

    if (oportunidadesCount > 0) {
      await prisma.oportunidad.deleteMany({ where: { clienteId: Number(id) } });
    }

    // Luego eliminar el cliente
    await prisma.cliente.delete({ where: { id: Number(id) } });

    res.json({
      mensaje: "Cliente eliminado exitosamente",
      info: oportunidadesCount > 0
        ? `Se eliminaron ${oportunidadesCount} oportunidad(es) asociada(s)`
        : null
    });

  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    res.status(500).json({ error: "Error al eliminar cliente: " + error.message });
  }
};
