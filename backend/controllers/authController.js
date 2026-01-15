import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export const login = async (req, res) => {
  const { email, password } = req.body;

  // Validación de entrada
  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son requeridos" });
  }

  // Validación de JWT_SECRET
  if (!JWT_SECRET) {
    console.error("JWT_SECRET no está configurado");
    return res.status(500).json({ error: "Error de configuración del servidor" });
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario) {
      return res.status(404).json({ error: "Credenciales inválidas" });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    if (!usuario.activo) {
      return res.status(403).json({ error: "Usuario inactivo. Contacte al administrador." });
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
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};
