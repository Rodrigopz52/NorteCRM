import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { enviarEmail } from "../utils/mailer.js";
import { parsearPaginacion, construirRespuestaPaginada } from "../utils/paginacion.js";

const prisma = new PrismaClient();

// Listar todos los usuarios (GERENTE y ADMINISTRADOR)
export const listarUsuarios = async (req, res) => {
  try {
    if (req.usuario.rol !== "GERENTE" && req.usuario.rol !== "ADMINISTRADOR") {
      return res.status(403).json({ error: "Solo el gerente o administrador pueden ver usuarios" });
    }

    const { page, limit, skip, take } = parsearPaginacion(req.query);
    const busqueda = req.query.busqueda?.trim() || "";
    const rol = req.query.rol || "";

    const filtroRol = rol ? { rol } : {};
    const filtroBusqueda = busqueda
      ? {
          OR: [
            { nombre: { contains: busqueda } },
            { apellido: { contains: busqueda } },
            { email: { contains: busqueda } },
            { dni: { contains: busqueda } }
          ]
        }
      : {};

    const where = { ...filtroRol, ...filtroBusqueda };

    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
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
        orderBy: { nombre: "asc" },
        skip,
        take
      }),
      prisma.usuario.count({ where })
    ]);

    res.json(construirRespuestaPaginada(usuarios, total, page, limit));
  } catch (error) {
    console.error(error);
    if (error.status) return res.status(error.status).json({ error: error.message });
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

// Crear nuevo usuario/vendedor (solo GERENTE, ADMINISTRADOR no puede)
export const crearUsuario = async (req, res) => {
  try {
    if (req.usuario.rol !== "GERENTE") {
      return res.status(403).json({ error: "Solo el gerente puede crear usuarios" });
    }

    const { nombre, apellido, email, rol, dni } = req.body;

    if (!nombre || !apellido || !email) {
      return res.status(400).json({ error: "Faltan campos obligatorios (nombre, apellido, email)" });
    }

    // Verificar que el email no exista
    const existente = await prisma.usuario.findUnique({
      where: { email }
    });

    if (existente) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // Para la primera vez, autogeneramos un password muy fuerte pero que no se usará (el usuario elegirá el suyo) 
    const randomPassword = crypto.randomBytes(20).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    
    // Generamos el token de primer acceso (Welcome)
    const resetToken = crypto.randomBytes(32).toString("hex");
    // Le daremos más tiempo al de creación original (ej: 48 hs) 
    const tokenExp = new Date(Date.now() + 48 * 3600000); 

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        email,
        dni: dni || null,
        password: hashedPassword,
        rol: rol || "VENDEDOR",
        activo: true,
        resetPasswordToken: resetToken,
        resetPasswordExpires: tokenExp
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

    // Enviar correo de bienvenida con el enlace de creación de contraseña
    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #9333ea;">¡Bienvenido a NorteCRM!</h2>
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Se te ha invitado a unirte y trabajar en NorteCRM con el rol de <strong>${usuario.rol}</strong>.</p>
        <p>Haz clic en el siguiente botón para establecer tu contraseña y acceder por primera vez:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #9333ea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px; margin-bottom: 20px;">
          Activar mi cuenta y Crear Contraseña
        </a>
        <p style="color: #555; text-align: justify">Este enlace de activación <strong>caduca en 48 horas</strong> por motivos de seguridad.</p>
        <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="text-align: center; color: #888; font-size: 12px;">El equipo de NorteCRM</p>
      </div>
    `;

    await enviarEmail(usuario.email, "¡Bienvenido a NorteCRM! Creada tu nueva cuenta", html);

    res.json({ 
      mensaje: "Usuario creado exitosamente. Se ha enviado un correo con instrucciones.", 
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
