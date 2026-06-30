import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log("Limpiando datos viejos (opcional, solo limpiamos actividades y tareas por seguridad)...");
  // Opcional: await prisma.actividad.deleteMany();
  // Opcional: await prisma.tarea.deleteMany();
  
  const password = await bcrypt.hash("123456", 10);

  console.log("Creando usuarios ficticios...");
  const vendedores = [];
  const nombres = ["Carlos", "Maria", "Lucia", "Jorge", "Ana"];
  for (let i = 0; i < nombres.length; i++) {
    const u = await prisma.usuario.upsert({
      where: { email: `${nombres[i].toLowerCase()}@crm.com` },
      update: {},
      create: {
        nombre: nombres[i],
        apellido: "Vendedor",
        email: `${nombres[i].toLowerCase()}@crm.com`,
        password: password,
        rol: "VENDEDOR"
      }
    });
    vendedores.push(u);
  }

  console.log("Creando clientes ficticios...");
  const clientes = [];
  for (let i = 1; i <= 20; i++) {
    const c = await prisma.cliente.create({
      data: {
        nombre: `Cliente Ficticio ${i}`,
        email: `cliente${i}@correo.com`,
        telefono: `38150000${i}`,
        temperatura: i % 2 === 0 ? "CALIENTE" : "TIBIO",
        etapaLead: i % 3 === 0 ? "CERRADO" : "NEGOCIACION",
        usuarioId: vendedores[i % vendedores.length].id,
      }
    });
    clientes.push(c);
  }

  console.log("Creando propiedades ficticias (Oportunidades)...");
  const mesesAtras = new Date();
  mesesAtras.setMonth(mesesAtras.getMonth() - 5);
  
  const etapas = ["DISPONIBLE", "RESERVADA", "VENDIDA", "ALQUILADA"];
  const tipos = ["Casa", "Departamento", "Terreno", "Local"];
  const operaciones = ["Venta", "Alquiler"];
  
  // Nombres de calles para variar
  const calles = ["Av. Aconquija", "San Martín", "Muñecas", "Laprida", "Av. Perón", "Av. Mate de Luna"];

  for (let i = 1; i <= 40; i++) {
    const creadoEn = randomDate(mesesAtras, new Date());
     // Probabilidad de cierre const isClosed = Math.random() > 0.5;
    const etapa = isClosed ? (Math.random() > 0.5 ? "VENDIDA" : "ALQUILADA") : (Math.random() > 0.7 ? "RESERVADA" : "DISPONIBLE");
    
    let fechaCierre = null;
    if (etapa === "VENDIDA" || etapa === "ALQUILADA") {
      fechaCierre = randomDate(creadoEn, new Date());
    }

    const operacion = etapa === "VENDIDA" ? "Venta" : (etapa === "ALQUILADA" ? "Alquiler" : operaciones[Math.floor(Math.random() * operaciones.length)]);
    const valorBase = operacion === "Venta" ? 50000 : 200;
    const valor = valorBase + Math.floor(Math.random() * 10) * (operacion === "Venta" ? 10000 : 50);

    await prisma.oportunidad.create({
      data: {
        titulo: `${tipos[Math.floor(Math.random() * tipos.length)]} en ${calles[Math.floor(Math.random() * calles.length)]} ${Math.floor(Math.random() * 1000)}`,
        direccion: "Tucumán",
        habitaciones: Math.floor(Math.random() * 4) + 1,
        banos: Math.floor(Math.random() * 3) + 1,
        metrosCuadrados: Math.floor(Math.random() * 200) + 40,
        operacion,
        valor,
        etapa,
        creadoEn,
        fechaCierre,
        clienteId: clientes[Math.floor(Math.random() * clientes.length)].id,
        usuarioId: vendedores[Math.floor(Math.random() * vendedores.length)].id,
        imagenUrl: "https://res.cloudinary.com/dtdseqzpv/image/upload/v1781535838/nortecrm_propiedades/fwzcavaffgtabd4mhgc8.jpg"
      }
    });
  }

  console.log("¡Datos ficticios generados con éxito!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
