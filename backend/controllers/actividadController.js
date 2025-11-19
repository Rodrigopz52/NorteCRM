import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Obtener actividades (Vendedor: solo suyas, Gerente/Administrador: todas)
export const obtenerActividades = async (req, res) => {
  try {
    const { rol, id: usuarioId } = req.usuario;

    const where = rol === "VENDEDOR" ? { usuarioId } : {};

    const actividades = await prisma.actividad.findMany({
      where,
      include: {
        oportunidad: {
          include: {
            cliente: true
          }
        },
        usuario: {
          select: {
            nombre: true,
            apellido: true,
            email: true
          }
        }
      },
      orderBy: [
        { completada: 'asc' },
        { fechaVencimiento: 'asc' }
      ]
    });

    res.json(actividades);
  } catch (error) {
    console.error("Error al obtener actividades:", error);
    res.status(500).json({ error: "Error al obtener actividades" });
  }
};

// Crear actividad
export const crearActividad = async (req, res) => {
  try {
    const { tipo, titulo, descripcion, fechaVencimiento, oportunidadId } = req.body;
    const { id: usuarioId, rol } = req.usuario;

    // Verificar que la oportunidad existe y pertenece al usuario (si es vendedor)
    const oportunidad = await prisma.oportunidad.findUnique({
      where: { id: Number(oportunidadId) }
    });

    if (!oportunidad) {
      return res.status(404).json({ error: "Oportunidad no encontrada" });
    }

    if (rol === "VENDEDOR" && oportunidad.usuarioId !== usuarioId) {
      return res.status(403).json({ error: "No tienes permiso para esta oportunidad" });
    }

    const actividad = await prisma.actividad.create({
      data: {
        tipo,
        titulo,
        descripcion,
        fechaVencimiento: new Date(fechaVencimiento),
        oportunidadId: Number(oportunidadId),
        usuarioId
      },
      include: {
        oportunidad: {
          include: {
            cliente: true
          }
        }
      }
    });

    res.status(201).json(actividad);
  } catch (error) {
    console.error("Error al crear actividad:", error);
    res.status(500).json({ error: "Error al crear actividad: " + error.message });
  }
};

// Editar actividad
export const editarActividad = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, titulo, descripcion, fechaVencimiento, oportunidadId } = req.body;
    const { id: usuarioId, rol } = req.usuario;

    const actividad = await prisma.actividad.findUnique({
      where: { id: Number(id) }
    });

    if (!actividad) {
      return res.status(404).json({ error: "Actividad no encontrada" });
    }

    // Vendedor solo puede editar sus propias actividades
    if (rol === "VENDEDOR" && actividad.usuarioId !== usuarioId) {
      return res.status(403).json({ error: "No puedes editar esta actividad" });
    }

    // Verificar que la nueva oportunidad existe (si se cambió)
    if (oportunidadId && oportunidadId !== actividad.oportunidadId) {
      const oportunidad = await prisma.oportunidad.findUnique({
        where: { id: Number(oportunidadId) }
      });

      if (!oportunidad) {
        return res.status(404).json({ error: "Oportunidad no encontrada" });
      }

      if (rol === "VENDEDOR" && oportunidad.usuarioId !== usuarioId) {
        return res.status(403).json({ error: "No tienes permiso para esta oportunidad" });
      }
    }

    const actividadActualizada = await prisma.actividad.update({
      where: { id: Number(id) },
      data: {
        tipo,
        titulo,
        descripcion,
        fechaVencimiento: new Date(fechaVencimiento),
        oportunidadId: Number(oportunidadId)
      },
      include: {
        oportunidad: {
          include: {
            cliente: true
          }
        },
        usuario: {
          select: {
            nombre: true,
            apellido: true,
            email: true
          }
        }
      }
    });

    res.json(actividadActualizada);
  } catch (error) {
    console.error("Error al editar actividad:", error);
    res.status(500).json({ error: "Error al editar actividad: " + error.message });
  }
};

// Marcar actividad como completada
export const completarActividad = async (req, res) => {
  try {
    const { id } = req.params;
    const { completada } = req.body;
    const { id: usuarioId, rol } = req.usuario;

    const actividad = await prisma.actividad.findUnique({
      where: { id: Number(id) }
    });

    if (!actividad) {
      return res.status(404).json({ error: "Actividad no encontrada" });
    }

    // Vendedor solo puede completar sus propias actividades
    if (rol === "VENDEDOR" && actividad.usuarioId !== usuarioId) {
      return res.status(403).json({ error: "No puedes modificar esta actividad" });
    }

    const actividadActualizada = await prisma.actividad.update({
      where: { id: Number(id) },
      data: {
        completada,
        fechaCompletada: completada ? new Date() : null
      },
      include: {
        oportunidad: {
          include: {
            cliente: true
          }
        }
      }
    });

    res.json(actividadActualizada);
  } catch (error) {
    console.error("Error al actualizar actividad:", error);
    res.status(500).json({ error: "Error al actualizar actividad" });
  }
};

// Eliminar actividad
export const eliminarActividad = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: usuarioId, rol } = req.usuario;

    const actividad = await prisma.actividad.findUnique({
      where: { id: Number(id) }
    });

    if (!actividad) {
      return res.status(404).json({ error: "Actividad no encontrada" });
    }

    if (rol === "VENDEDOR" && actividad.usuarioId !== usuarioId) {
      return res.status(403).json({ error: "No puedes eliminar esta actividad" });
    }

    await prisma.actividad.delete({
      where: { id: Number(id) }
    });

    res.json({ mensaje: "Actividad eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar actividad:", error);
    res.status(500).json({ error: "Error al eliminar actividad" });
  }
};
