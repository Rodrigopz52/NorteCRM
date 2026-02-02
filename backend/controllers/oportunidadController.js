import prisma from "../prismaClient.js";

export const listarOportunidades = async (req, res) => {
  const usuario = req.usuario;

  const opciones = (usuario.rol === "GERENTE" || usuario.rol === "ADMINISTRADOR")
    ? {}
    : { where: { usuarioId: usuario.id } };

  const data = await prisma.oportunidad.findMany({
    ...opciones,
    include: { 
      cliente: true,
      usuario: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true
        }
      },
      actividades: {
        orderBy: [
          { completada: 'asc' },
          { fechaVencimiento: 'asc' }
        ]
      }
    }
  });

  res.json(data);
};


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


export const editarOportunidad = async (req, res) => {
  const { id } = req.params;
  const { titulo, notas, tipo, estado, valor, clienteId } = req.body;
  const usuario = req.usuario;

  const oportunidadId = Number(id);
  if (Number.isNaN(oportunidadId)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    const oppActual = await prisma.oportunidad.findUnique({
      where: { id: oportunidadId }
    });

    if (!oppActual) {
      return res.status(404).json({ error: "Oportunidad no encontrada" });
    }

    if (usuario.rol === "VENDEDOR" && oppActual.usuarioId !== usuario.id) {
      return res.status(403).json({ error: "No tienes permiso para modificar esta oportunidad" });
    }

    let fechaCierre = oppActual.fechaCierre;
    
    if (estado && estado !== oppActual.estado) {

      if ((estado === "Alquilada" || estado === "Vendida") && !oppActual.fechaCierre) {
        fechaCierre = new Date();
      }

      else if (estado !== "Alquilada" && estado !== "Vendida") {
        fechaCierre = null;
      }
    }

    const op = await prisma.oportunidad.update({
      where: { id: oportunidadId },
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

    return res.json(op);
  } catch (error) {
    console.error("Error en editarOportunidad:", error);
    return res.status(500).json({ error: "Error al editar la oportunidad" });
  }
};


export const eliminarOportunidad = async (req, res) => {
  const { id } = req.params;
  const usuario = req.usuario;

  const oportunidadId = Number(id);
  if (Number.isNaN(oportunidadId)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    const oportunidad = await prisma.oportunidad.findUnique({
      where: { id: oportunidadId }
    });

    if (!oportunidad) {
      return res.status(404).json({ error: "Oportunidad no encontrada" });
    }

    if (usuario.rol === "VENDEDOR" && oportunidad.usuarioId !== usuario.id) {
      return res.status(403).json({ error: "No tienes permiso para eliminar esta oportunidad" });
    }

    await prisma.oportunidad.delete({
      where: { id: oportunidadId }
    });

    return res.json({ mensaje: "Oportunidad eliminada" });
  } catch (error) {
    console.error("Error en eliminarOportunidad:", error);
    return res.status(500).json({ error: "Error al eliminar la oportunidad" });
  }
};


export const cambiarEtapa = async (req, res) => {
  const { id } = req.params;
  const { etapa } = req.body;
  const usuario = req.usuario;

  const oportunidadId = Number(id);
  if (Number.isNaN(oportunidadId)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  if (!etapa) {
    return res.status(400).json({ error: "La etapa es requerida" });
  }

  const etapasValidas = ["CONTACTO", "NEGOCIACION", "EN_ALQUILER", "EN_VENTA", "NO_CONCRETADO"];
  if (!etapasValidas.includes(etapa)) {
    return res.status(400).json({ error: "Etapa inválida" });
  }

  try {
    const oportunidad = await prisma.oportunidad.findUnique({
      where: { id: oportunidadId }
    });

    if (!oportunidad) {
      return res.status(404).json({ error: "Oportunidad no encontrada" });
    }

    if (usuario.rol === "VENDEDOR" && oportunidad.usuarioId !== usuario.id) {
      return res.status(403).json({ error: "No tienes permiso para modificar esta oportunidad" });
    }

    const op = await prisma.oportunidad.update({
      where: { id: oportunidadId },
      data: { etapa }
    });

    return res.json(op);
  } catch (error) {
    console.error("Error en cambiarEtapa:", error);
   return res.status(500).json({ error: "Error al cambiar la etapa" });
  }
};
