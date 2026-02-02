import prisma from "../prismaClient.js";

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

export const editarActividad = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, titulo, descripcion, fechaVencimiento, oportunidadId } = req.body;
    const { id: usuarioId, rol } = req.usuario;

    const actividadId = Number(id);
    if (Number.isNaN(actividadId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    if (fechaVencimiento !== undefined && fechaVencimiento !== null) {
      const fecha = new Date(fechaVencimiento);
      if (Number.isNaN(fecha.getTime())) {
        return res.status(400).json({ error: "Fecha de vencimiento inválida" });
      }
    }

    let oportunidadIdNumber = null;
    if (oportunidadId !== undefined) {
      oportunidadIdNumber = Number(oportunidadId);
      if (Number.isNaN(oportunidadIdNumber)) {
        return res.status(400).json({ error: "ID de oportunidad inválido" });
      }
    }

    const actividad = await prisma.actividad.findUnique({
      where: { id: actividadId }
    });

    if (!actividad) {
      return res.status(404).json({ error: "Actividad no encontrada" });
    }

    if (rol === "VENDEDOR" && actividad.usuarioId !== usuarioId) {
      return res.status(403).json({ error: "No puedes editar esta actividad" });
    }

    if (oportunidadIdNumber !== null && oportunidadIdNumber !== actividad.oportunidadId) {
      const oportunidad = await prisma.oportunidad.findUnique({
        where: { id: oportunidadIdNumber }
      });

      if (!oportunidad) {
        return res.status(404).json({ error: "Oportunidad no encontrada" });
      }

      if (rol === "VENDEDOR" && oportunidad.usuarioId !== usuarioId) {
        return res.status(403).json({ error: "No tienes permiso para esta oportunidad" });
      }
    }

    const dataToUpdate = {};

    if (tipo !== undefined) dataToUpdate.tipo = tipo;
    if (titulo !== undefined) dataToUpdate.titulo = titulo;
    if (descripcion !== undefined) dataToUpdate.descripcion = descripcion;
    if (fechaVencimiento !== undefined && fechaVencimiento !== null) {
      dataToUpdate.fechaVencimiento = new Date(fechaVencimiento);
    }
    if (oportunidadIdNumber !== null) dataToUpdate.oportunidadId = oportunidadIdNumber;

    const actividadActualizada = await prisma.actividad.update({
      where: { id: actividadId },
      data: dataToUpdate,
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

    return res.json(actividadActualizada);
  } catch (error) {
    console.error("Error al editar actividad:", error);
    return res.status(500).json({ error: "Error al editar actividad: " + error.message });
  }
};


export const completarActividad = async (req, res) => {
  try {
    const { id } = req.params;
    const { completada } = req.body;
    const { id: usuarioId, rol } = req.usuario;

    const actividadId = Number(id);
    if (Number.isNaN(actividadId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    if (typeof completada !== 'boolean') {
      return res.status(400).json({ error: "El campo completada debe ser true o false" });
    }

    const actividad = await prisma.actividad.findUnique({
      where: { id: actividadId }
    });

    if (!actividad) {
      return res.status(404).json({ error: "Actividad no encontrada" });
    }

    if (rol === "VENDEDOR" && actividad.usuarioId !== usuarioId) {
      return res.status(403).json({ error: "No puedes modificar esta actividad" });
    }

    const actividadActualizada = await prisma.actividad.update({
      where: { id: actividadId },
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

   return res.json(actividadActualizada);
  } catch (error) {
    console.error("Error al actualizar actividad:", error);
   return res.status(500).json({ error: "Error al actualizar actividad" });
  }
};


export const eliminarActividad = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: usuarioId, rol } = req.usuario;

    const actividadId = Number(id);
    if (Number.isNaN(actividadId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const actividad = await prisma.actividad.findUnique({
      where: { id: actividadId }
    });

    if (!actividad) {
      return res.status(404).json({ error: "Actividad no encontrada" });
    }

    if (rol === "VENDEDOR" && actividad.usuarioId !== usuarioId) {
      return res.status(403).json({ error: "No puedes eliminar esta actividad" });
    }

    await prisma.actividad.delete({
      where: { id: actividadId }
    });

    return res.json({ mensaje: "Actividad eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar actividad:", error);
    return res.status(500).json({ error: "Error al eliminar actividad" });
  }
};
