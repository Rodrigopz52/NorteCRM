import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Listar todos los usuarios (GERENTE y ADMINISTRADOR)
export const listarUsuarios = async (req, res) => {
  try {
    if (req.usuario.rol !== "GERENTE" && req.usuario.rol !== "ADMINISTRADOR") {
      return res.status(403).json({ error: "Solo el gerente o administrador pueden ver usuarios" });
    }

    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        dni: true,
        rol: true,
        activo: true,
        creadoEn: true
      },
      orderBy: { nombre: 'asc' }
    });

    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

// Crear nuevo usuario/vendedor (solo GERENTE, ADMINISTRADOR no puede)
export const crearUsuario = async (req, res) => {
  try {
    if (req.usuario.rol !== "GERENTE") {
      return res.status(403).json({ error: "Solo el gerente puede crear usuarios" });
    }

    const { nombre, apellido, email, password, rol, dni } = req.body;

    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    // Verificar que el email no exista
    const existente = await prisma.usuario.findUnique({
      where: { email }
    });

    if (existente) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        email,
        dni: dni || null,
        password: hashedPassword,
        rol: rol || "VENDEDOR",
        activo: true
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        dni: true,
        rol: true,
        activo: true,
        creadoEn: true
      }
    });

    res.json({ 
      mensaje: "Usuario creado exitosamente", 
      usuario 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear usuario" });
  }
};

// Editar usuario (solo GERENTE, ADMINISTRADOR no puede)
export const editarUsuario = async (req, res) => {
  try {
    if (req.usuario.rol !== "GERENTE") {
      return res.status(403).json({ error: "Solo el gerente puede editar usuarios" });
    }

    const { id } = req.params;
    const { nombre, apellido, email, dni } = req.body;

    const usuario = await prisma.usuario.update({
      where: { id: Number(id) },
      data: {
        nombre,
        apellido,
        email,
        dni: dni !== undefined ? (dni || null) : undefined
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        dni: true,
        rol: true,
        activo: true,
        creadoEn: true
      }
    });

    res.json({ 
      mensaje: "Usuario actualizado", 
      usuario 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al editar usuario" });
  }
};

// Toggle activo/inactivo (solo GERENTE, ADMINISTRADOR no puede)
export const toggleActivo = async (req, res) => {
  try {
    if (req.usuario.rol !== "GERENTE") {
      return res.status(403).json({ error: "Solo el gerente puede cambiar el estado" });
    }

    const { id } = req.params;

    // No permitir desactivar al propio gerente
    if (Number(id) === req.usuario.id) {
      return res.status(400).json({ error: "No puedes desactivarte a ti mismo" });
    }

    const usuarioActual = await prisma.usuario.findUnique({
      where: { id: Number(id) }
    });

    const usuario = await prisma.usuario.update({
      where: { id: Number(id) },
      data: {
        activo: !usuarioActual.activo
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        dni: true,
        rol: true,
        activo: true,
        creadoEn: true
      }
    });

    res.json({ 
      mensaje: `Usuario ${usuario.activo ? 'activado' : 'desactivado'}`, 
      usuario 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cambiar estado" });
  }
};

// Resetear contraseña (solo GERENTE, ADMINISTRADOR no puede)
export const resetearPassword = async (req, res) => {
  try {
    if (req.usuario.rol !== "GERENTE") {
      return res.status(403).json({ error: "Solo el gerente puede resetear contraseñas" });
    }

    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "La contraseña es requerida" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.usuario.update({
      where: { id: Number(id) },
      data: { password: hashedPassword }
    });

    res.json({ mensaje: "Contraseña actualizada exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al resetear contraseña" });
  }
};
