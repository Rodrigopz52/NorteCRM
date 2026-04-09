import nodemailer from "nodemailer";

// Configuración del transporter usando variables de entorno
const transporter = nodemailer.createTransport({
  service: "gmail", // Puedes cambiarlo a otro proveedor si lo necesitas
  auth: {
    user: process.env.EMAIL_USER, // Tu correo de gmail ej: tucorreo@gmail.com
    pass: process.env.EMAIL_PASS  // Tu "Contraseña de Aplicación" de Google (16 caracteres)
  }
});

// Verifica que el transportador funciona correctamente al iniciar el servidor
transporter.verify((error, success) => {
  if (error) {
    console.warn("⚠️ Advertencia: No se pudo conectar al servicio de email. Revisa tus variables EMAIL_USER y EMAIL_PASS en .env");
  } else {
    console.log("✅ Servicio de email conectado y listo");
  }
});

/**
 * Función genérica para enviar emails
 * @param {string} to - Email del destinatario
 * @param {string} subject - Asunto del correo
 * @param {string} html - Contenido HTML del correo
 */
export const enviarEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"NorteCRM" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email enviado a ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("❌ Error enviando email:", error);
    return false;
  }
};
