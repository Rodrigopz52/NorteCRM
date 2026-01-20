import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export const listarClientes = async (req, res) => {
  try {
    const usuario = req.usuario;

    if (usuario.rol === "GERENTE" || usuario.rol === "ADMINISTRADOR") {
      const clientes = await prisma.cliente.findMany({
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true
            }
          }
        },
        orderBy: { nombre: 'asc' }
      });
      return res.json(clientes);
    }

    const clientes = await prisma.cliente.findMany({
      where: { usuarioId: usuario.id },
      orderBy: { nombre: 'asc' }
    });

    return res.json(clientes);

  } catch (error) {
    console.error(error);
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
    const { id } = req.params;
    const { id: usuarioId, rol } = req.usuario;

    const clienteId = Number(id);
    if (Number.isNaN(clienteId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId }
    });

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    if (rol === "VENDEDOR" && cliente.usuarioId !== usuarioId) {
      return res.status(403).json({ error: "No tienes permiso para eliminar este cliente" });
    }

    await prisma.$transaction(async (tx) => {

      const oportunidades = await tx.oportunidad.findMany({
        where: { clienteId },
        select: { id: true }
      });

      if (oportunidades.length > 0) {
        const oportunidadIds = oportunidades.map(o => o.id);
        await tx.actividad.deleteMany({
          where: { oportunidadId: { in: oportunidadIds } }
        });
      }

      await tx.oportunidad.deleteMany({
        where: { clienteId }
      });

      await tx.cliente.delete({
        where: { id: clienteId }
      });
    });

    return res.json({ mensaje: "Cliente eliminado correctamente" });

  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    return res.status(500).json({ error: "Error al eliminar cliente" });
  }
};
