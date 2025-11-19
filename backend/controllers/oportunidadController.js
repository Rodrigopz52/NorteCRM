import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

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
