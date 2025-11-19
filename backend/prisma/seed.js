import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passGerente = await bcrypt.hash("123456", 10);
  const passVendedor = await bcrypt.hash("123456", 10);
  const passAdmin = await bcrypt.hash("123456", 10);

  await prisma.usuario.upsert({
    where: { email: "gerente@crm.com" },
    update: {},
    create: {
      nombre: "Gerente",
      apellido: "CRM",
      email: "gerente@crm.com",
      password: passGerente,
      rol: "GERENTE"
    }
  });

  await prisma.usuario.upsert({
    where: { email: "admin@crm.com" },
    update: {},
    create: {
      nombre: "Admin",
      apellido: "CRM",
      email: "admin@crm.com",
      password: passAdmin,
      rol: "ADMINISTRADOR"
    }
  });

  await prisma.usuario.upsert({
    where: { email: "vendedor@crm.com" },
    update: {},
    create: {
      nombre: "Vendedor",
      apellido: "CRM",
      email: "vendedor@crm.com",
      password: passVendedor,
      rol: "VENDEDOR"
    }
  });

  console.log("✅ Usuarios iniciales creados:");
  console.log("   - Gerente: gerente@crm.com / 123456");
  console.log("   - Admin: admin@crm.com / 123456");
  console.log("   - Vendedor: vendedor@crm.com / 123456");
}

main().finally(() => prisma.$disconnect());
