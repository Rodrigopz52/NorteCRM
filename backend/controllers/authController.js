import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { enviarEmail } from "../utils/mailer.js";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

   
    const token = jwt.sign(
      {
        id: usuario.id,
        rol: usuario.rol
      },
      JWT_SECRET,
      { expiresIn: "8h" } 
    );

    res.json({
      mensaje: "Login correcto",
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

export const olvidePassword = async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "El email es requerido" });
  }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      // Devolver 200 aunque no exista evita enumeración de usuarios en sistemas seguros
      return res.json({ mensaje: "Si el correo está registrado, recibirás un enlace de recuperación." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExp = new Date(Date.now() + 3600000); // Vence en 1 hora

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: tokenExp
      }
    });

    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #9333ea;">Restablecer Contraseña</h2>
        <p>Has solicitado restablecer tu contraseña en NorteCRM.</p>
        <p>Haz clic en el siguiente botón para crear una nueva:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #9333ea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px; margin-bottom: 20px;">
          Restablecer Contraseña
        </a>
        <p style="color: #555; text-align: justify">Si no solicitaste este cambio, puedes ignorar este correo. El enlace de recuperación <strong>caducará en 1 hora</strong> y tu contraseña seguirá siendo la misma.</p>
        <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="text-align: center; color: #888; font-size: 12px;">El equipo de NorteCRM</p>
      </div>
    `;

    await enviarEmail(usuario.email, "Recuperar contraseña - NorteCRM", html);

    res.json({ mensaje: "Si el correo está registrado, recibirás un enlace de recuperación." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor al solicitar restablecimiento" });
  }
};

export const resetearPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: "Token y contraseña son requeridos" });
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { resetPasswordToken: token }
    });

    // Validar si el usuario existe y si el token ha vencido
    if (!usuario || !usuario.resetPasswordExpires || usuario.resetPasswordExpires < new Date()) {
      return res.status(400).json({ error: "El token es inválido o ha expirado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    res.json({ mensaje: "Contraseña actualizada exitosamente, ahora puedes iniciar sesión." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error procesando el restablecimiento de contraseña" });
  }
};
