import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando carga de datos artificiales...');

  // 1. Crear o encontrar contraseñas
  const passwordHash = await bcrypt.hash('123456', 10);

  // 2. Crear Usuarios
  console.log('Creando usuarios...');
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      nombre: 'Carlos',
      apellido: 'Admin',
      email: 'admin@demo.com',
      dni: '11111111',
      password: passwordHash,
      rol: 'ADMINISTRADOR',
      activo: true,
    },
  });

  const gerente = await prisma.usuario.upsert({
    where: { email: 'gerente@demo.com' },
    update: {},
    create: {
      nombre: 'Laura',
      apellido: 'Gerente',
      email: 'gerente@demo.com',
      dni: '22222222',
      password: passwordHash,
      rol: 'GERENTE',
      activo: true,
    },
  });

  const vendedor1 = await prisma.usuario.upsert({
    where: { email: 'vendedor1@demo.com' },
    update: {},
    create: {
      nombre: 'Martín',
      apellido: 'Pérez',
      email: 'vendedor1@demo.com',
      dni: '33333333',
      password: passwordHash,
      rol: 'VENDEDOR',
      activo: true,
    },
  });

  const vendedor2 = await prisma.usuario.upsert({
    where: { email: 'vendedor2@demo.com' },
    update: {},
    create: {
      nombre: 'Sofía',
      apellido: 'Gómez',
      email: 'vendedor2@demo.com',
      dni: '44444444',
      password: passwordHash,
      rol: 'VENDEDOR',
      activo: true,
    },
  });

  const vendedores = [vendedor1, vendedor2];

  // 3. Crear Clientes
  console.log('Creando clientes...');
  const nombresClientes = ['Juan López', 'María Silva', 'Pedro Gimenez', 'Lucía Torres', 'Diego Maradona', 'Lionel Messi', 'Marta Minujin', 'Ricardo Darín', 'Susana Giménez', 'Charly García', 'Fito Páez', 'Gustavo Cerati'];
  const clientesCreados = [];
  
  for (let i = 0; i < nombresClientes.length; i++) {
    const v = vendedores[i % vendedores.length];
    const n = nombresClientes[i].split(' ');
    
    const etapaLead = ['LEAD', 'CONTACTADO', 'VISITA', 'NEGOCIACION', 'CERRADO'][Math.floor(Math.random() * 5)];
    const temperatura = ['FRIO', 'TIBIO', 'CALIENTE'][Math.floor(Math.random() * 3)];
    
    const c = await prisma.cliente.create({
      data: {
        nombre: nombresClientes[i],
        email: `cliente${i}@demo.com`,
        telefono: `+54 9 11 ${Math.floor(10000000 + Math.random() * 90000000)}`,
        temperatura,
        etapaLead,
        usuarioId: v.id,
      }
    });
    clientesCreados.push(c);
  }

  // 4. Crear Propiedades (Oportunidades)
  console.log('Creando propiedades (oportunidades)...');
  const tiposPropiedad = ['Casa', 'Departamento', 'Oficina', 'Terreno'];
  const operaciones = ['Venta', 'Alquiler'];
  const etapas = ['DISPONIBLE', 'RESERVADA', 'VENDIDA', 'ALQUILADA'];
  
  const oportunidadesCreadas = [];
  
  for (let i = 0; i < 25; i++) {
    const c = clientesCreados[Math.floor(Math.random() * clientesCreados.length)];
    const v = vendedores[Math.floor(Math.random() * vendedores.length)];
    const tipo = tiposPropiedad[Math.floor(Math.random() * tiposPropiedad.length)];
    const operacion = operaciones[Math.floor(Math.random() * operaciones.length)];
    const esNoConcretada = Math.random() > 0.8; // 20% no concretadas
    
    let etapa = etapas[Math.floor(Math.random() * etapas.length)];
    if (operacion === 'Venta' && etapa === 'ALQUILADA') etapa = 'VENDIDA';
    if (operacion === 'Alquiler' && etapa === 'VENDIDA') etapa = 'ALQUILADA';
    
    let titulo = `${tipo} en ${['Palermo', 'Belgrano', 'Caballito', 'Recoleta', 'Puerto Madero', 'San Telmo'][Math.floor(Math.random() * 6)]}`;
    
    // Fechas aleatorias históricas para que el gráfico tenga líneas (hasta 1 año atrás)
    const hoy = new Date();
    const creadoEn = new Date(hoy);
    creadoEn.setDate(hoy.getDate() - Math.floor(Math.random() * 365));
    
    let fechaCierre = null;
    if (etapa === 'VENDIDA' || etapa === 'ALQUILADA') {
      fechaCierre = new Date(creadoEn);
      fechaCierre.setDate(creadoEn.getDate() + 10 + Math.floor(Math.random() * 60)); // Cierre 10-70 días después
      if (fechaCierre > hoy) fechaCierre = new Date(hoy); // Asegurar que no sea futuro
    }

    const op = await prisma.oportunidad.create({
      data: {
        titulo,
        direccion: `Av. Falsa ${100 + Math.floor(Math.random() * 900)}`,
        habitaciones: tipo === 'Terreno' ? 0 : 1 + Math.floor(Math.random() * 4),
        banos: tipo === 'Terreno' ? 0 : 1 + Math.floor(Math.random() * 3),
        metrosCuadrados: 30 + Math.floor(Math.random() * 200),
        operacion,
        tipo,
        etapa: esNoConcretada ? 'DISPONIBLE' : etapa,
        activo: !esNoConcretada,
        valor: operacion === 'Venta' ? 50000 + Math.floor(Math.random() * 300000) : 300 + Math.floor(Math.random() * 1500),
        clienteId: c.id,
        usuarioId: v.id,
        fechaCierre,
        creadoEn,
      }
    });
    oportunidadesCreadas.push(op);
  }

  // 5. Crear Actividades (Llamadas, Reuniones, etc.)
  console.log('Creando actividades (tareas)...');
  const tiposActividad = ['LLAMADA', 'REUNION', 'EMAIL', 'TAREA'];
  const prioridades = ['BAJA', 'MEDIA', 'ALTA'];
  const estadosAct = ['PENDIENTE', 'EN_PROCESO', 'COMPLETADA'];
  
  for (let i = 0; i < 40; i++) {
    const v = vendedores[Math.floor(Math.random() * vendedores.length)];
    const c = clientesCreados[Math.floor(Math.random() * clientesCreados.length)];
    const op = oportunidadesCreadas[Math.floor(Math.random() * oportunidadesCreadas.length)];
    
    const tipo = tiposActividad[Math.floor(Math.random() * tiposActividad.length)];
    const estado = estadosAct[Math.floor(Math.random() * estadosAct.length)];
    const completada = estado === 'COMPLETADA';
    
    // Fechas entre -5 días y +10 días
    const hoy = new Date();
    const diasOffset = -5 + Math.floor(Math.random() * 15);
    const fechaVencimiento = new Date(hoy);
    fechaVencimiento.setDate(hoy.getDate() + diasOffset);
    
    await prisma.actividad.create({
      data: {
        tipo,
        titulo: `${tipo} con ${c.nombre}`,
        descripcion: `Detalles de la ${tipo.toLowerCase()} sobre la propiedad.`,
        estado,
        completada,
        fechaVencimiento,
        fechaCompletada: completada ? new Date() : null,
        prioridad: prioridades[Math.floor(Math.random() * prioridades.length)],
        usuarioId: v.id,
        clienteId: c.id,
        oportunidadId: op.id,
      }
    });
  }

  console.log('¡Datos artificiales creados con éxito!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
