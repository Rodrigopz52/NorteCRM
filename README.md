# 🏢 NorteCRM - Sistema de Gestión Inmobiliaria

CRM especializado para inmobiliarias con gestión de propiedades, clientes (inquilinos/propietarios/compradores), tablero Kanban de propiedades, seguimiento de tareas y dashboard con métricas en tiempo real.

![Version](https://img.shields.io/badge/version-1.0.0-purple)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![Node](https://img.shields.io/badge/Node.js-Express-green)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Roles y Permisos](#-roles-y-permisos)
- [Contribuir](#-contribuir)

---

## ✨ Características

### 🔐 Autenticación y Roles
- Login con JWT tokens
- **3 roles**: GERENTE, ADMINISTRADOR y VENDEDOR
- Rutas protegidas según rol
- Control de permisos granular

### 👥 Gestión de Clientes
- CRUD completo de clientes
- **3 tipos de clientes**:
  - 🏠 **INQUILINO** - Clientes que buscan alquilar
  - 🏘️ **PROPIETARIO** - Dueños de propiedades
  - 💰 **COMPRADOR** - Clientes que buscan comprar
- Filtrado por tipo de cliente
- Campos: nombre, tipo, teléfono, email, notas
- Asignación automática a vendedores

### 🏠 Gestión de Propiedades (Kanban)
- Tablero Kanban con **5 etapas**:
  - 📞 **CONTACTO** - Primer contacto con el cliente
  - 🤝 **NEGOCIACION** - En proceso de negociación
  - 🏠 **EN_ALQUILER** - Propiedad en alquiler
  - 🏡 **EN_VENTA** - Propiedad en venta
  - ❌ **NO_CONCRETADO** - Oportunidad perdida
- **Drag & Drop** para cambiar etapas
- **Estados de propiedad**: Disponible, Reservada, Alquilada, Vendida
- **Tipos de propiedad**: Casa, Departamento, Local, Terreno, Oficina
- Campo de **valor** (precio en pesos argentinos)
- Badges visuales de tipo de cliente
- Filtros por tipo, estado y cliente
- Notas y seguimiento detallado
- **Sistema automático de fechaCierre**: cuando una propiedad cambia a "Alquilada" o "Vendida", se registra automáticamente la fecha para reportes precisos

### ✅ Gestión de Tareas
- CRUD completo de actividades
- **4 tipos de actividades**:
  - 📞 LLAMADA
  - 👥 REUNION
  - 📧 EMAIL
  - ✔️ TAREA
- Vinculadas a propiedades y clientes
- Fechas de vencimiento
- Estado completada/pendiente
- Descripción expandible con indicador visual 📝
- Edición inline con permisos por rol
- Filtros por estado y búsqueda

### 📊 Dashboard Inteligente
**Para VENDEDOR:**
- 📈 Métricas personales del mes
- 💰 Ingreso generado (alquileres + ventas)
- 📊 Gráfico de línea con evolución mensual (últimos 6 meses)
- 🎯 Gráfico de torta con distribución de propiedades por estado
- 📅 Recordatorio de tareas del día
- 🔔 Alertas de oportunidades estancadas

**Para GERENTE/ADMINISTRADOR:**
- 📈 Métricas del equipo completo
- 🏆 Ranking de vendedores del mes (monto y cantidad)
- 💰 Ingreso total del equipo
- 📊 Gráfico de línea con evolución mensual del equipo
- 🎯 Distribución de propiedades por estado del equipo
- 🔔 Actividades vencidas del equipo
- 📅 Visitas programadas de la semana

**Características del Dashboard:**
- Diseño compacto sin scroll
- Gráficos responsivos con Recharts
- Colores distintivos por estado
- Tooltips informativos
- Actualización en tiempo real

### 👤 Gestión de Usuarios (Solo GERENTE)
- CRUD de usuarios
- Activar/Desactivar usuarios
- Reseteo de contraseñas
- Asignación de roles
- Vista de usuarios activos/inactivos

**Modo Solo Lectura (ADMINISTRADOR):**
- El rol ADMINISTRADOR puede ver todos los clientes, propiedades y dashboard
- NO puede crear, editar ni eliminar usuarios
- Ideal para supervisores que necesitan visibilidad sin permisos de administración

---

## 🛠 Stack Tecnológico

### Frontend
- **React 18.3.1** - Library UI moderna
- **Vite 5.4.2** - Build tool ultra rápido
- **React Router DOM 6** - Navegación SPA
- **Axios** - Cliente HTTP
- **TailwindCSS 3.4.1** - Framework CSS utility-first
- **Heroicons** - Iconos SVG optimizados
- **Recharts** - Gráficos interactivos (LineChart, PieChart)
- **@hello-pangea/dnd 16.6.1** - Drag and Drop (fork mantenido de react-beautiful-dnd)

### Backend
- **Node.js** + **Express 4.21.1** - Servidor HTTP
- **Prisma 6.19.0** - ORM moderno type-safe
- **SQLite** - Base de datos embebida (archivo: `nortecrm.db`)
- **JWT (jsonwebtoken)** - Autenticación stateless
- **bcrypt** - Hash de contraseñas
- **CORS** - Configuración cross-origin
- **Swagger UI Express** - Documentación API interactiva

---

## 📁 Estructura del Proyecto

```
NorteCRM/
├── backend/
│   ├── controllers/
│   │   ├── authController.js          # Login y autenticación
│   │   ├── clienteController.js       # CRUD clientes
│   │   ├── oportunidadController.js   # CRUD propiedades
│   │   ├── actividadController.js     # CRUD tareas
│   │   ├── usuarioController.js       # CRUD usuarios
│   │   └── reportesController.js      # Dashboard y métricas
│   ├── middleware/
│   │   ├── authMiddleware.js          # Verificación JWT
│   │   └── rolMiddleware.js           # Validación de roles
│   ├── prisma/
│   │   ├── schema.prisma              # Modelo de datos
│   │   ├── seed.js                    # Datos iniciales
│   │   ├── nortecrm.db               # Base de datos SQLite
│   │   └── migrations/                # Historial de migraciones
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── clienteRoutes.js
│   │   ├── oportunidadRoutes.js
│   │   ├── actividadRoutes.js
│   │   ├── usuarioRoutes.js
│   │   └── reportesRoutes.js
│   ├── index.js                       # Servidor principal
│   ├── swagger.js                     # Configuración Swagger
│   ├── package.json
│   └── .env                           # Variables de entorno
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx             # Navegación principal
    │   │   ├── Toast.jsx              # Notificaciones
    │   │   └── ConfirmModal.jsx       # Modal de confirmación
    │   ├── context/
    │   │   └── AuthContext.jsx        # Contexto de autenticación
    │   ├── hooks/
    │   │   └── useNotifications.jsx   # Hook para notificaciones
    │   ├── pages/
    │   │   ├── LoginPage.jsx          # Página de login
    │   │   ├── ClientesPage.jsx       # Gestión de clientes
    │   │   ├── OportunidadesPage.jsx  # Kanban de propiedades
    │   │   ├── ActividadesPage.jsx    # Gestión de tareas
    │   │   ├── UsuariosPage.jsx       # Gestión de usuarios
    │   │   └── DashboardPage.jsx      # Dashboard con métricas
    │   ├── App.jsx                    # Rutas y layout
    │   ├── main.jsx                   # Entry point
    │   └── index.css                  # Estilos globales
    ├── tailwind.config.js             # Configuración Tailwind
    ├── vite.config.js                 # Configuración Vite
    ├── postcss.config.js              # PostCSS
    └── package.json
```

---

## 🚀 Instalación

### Prerrequisitos
- **Node.js 18+** (recomendado 20+)
- **npm** o **yarn**
- **Git**

### 1️⃣ Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/NorteCRM.git
cd NorteCRM
```

### 2️⃣ Configurar Backend
```bash
cd backend
npm install

# Configurar variables de entorno
# Copiar el archivo de ejemplo y editarlo con tus valores
cp .env.example .env
# Editar .env y cambiar JWT_SECRET por una clave segura

# Para generar una clave JWT segura (opcional):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Ejecutar migraciones y crear base de datos
npx prisma migrate dev

# Poblar con datos de prueba (usuarios iniciales)
npx prisma db seed
```

**⚠️ IMPORTANTE**: El archivo `.env` contiene información sensible y **NO debe subirse a Git**. Ya está incluido en `.gitignore`.

**Variables de entorno requeridas** (ver `backend/.env.example`):
- `DATABASE_URL`: Ruta a la base de datos SQLite
- `JWT_SECRET`: Clave secreta para firmar tokens (cambiarla en producción)
- `PORT`: Puerto del servidor (default: 3000)

### 3️⃣ Configurar Frontend
```bash
cd ../frontend
npm install
```

---

## 💻 Uso

### Iniciar el Backend (puerto 3000)
```bash
cd backend
node index.js
```

### Iniciar el Frontend (puerto 5173)
```bash
cd frontend
npm run dev
```

### Acceder a la aplicación
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/docs

### 👤 Credenciales de Prueba

| Rol | Email | Contraseña | Permisos |
|-----|-------|-----------|----------|
| **GERENTE** | gerente@crm.com | 123456 | Acceso completo a todo |
| **ADMINISTRADOR** | admin@crm.com | 123456 | Todo excepto gestión de usuarios |
| **VENDEDOR** | vendedor@crm.com | 123456 | Solo sus propios clientes/propiedades |

---

## 🔐 Roles y Permisos

| Funcionalidad | GERENTE | ADMINISTRADOR | VENDEDOR |
|--------------|---------|---------------|----------|
| **Clientes** | | | |
| Ver todos los clientes | ✅ | ✅ | ❌ (solo asignados) |
| Crear clientes | ✅ | ✅ | ✅ |
| Editar clientes | ✅ | ✅ | ✅ (solo propios) |
| Eliminar clientes | ✅ | ✅ | ❌ |
| **Propiedades** | | | |
| Ver todas las propiedades | ✅ | ✅ | ❌ (solo propias) |
| Crear propiedades | ✅ | ✅ | ✅ |
| Editar propiedades | ✅ | ✅ | ✅ (solo propias) |
| Cambiar etapa (Kanban) | ✅ | ✅ | ✅ (solo propias) |
| Eliminar propiedades | ✅ | ✅ | ✅ (solo propias) |
| **Tareas** | | | |
| Ver todas las tareas | ✅ | ✅ | ❌ (solo propias) |
| Crear tareas | ✅ | ✅ | ✅ |
| Editar tareas | ✅ | ✅ | ✅ (solo propias) |
| Completar tareas | ✅ | ✅ | ✅ (solo propias) |
| Eliminar tareas | ✅ | ✅ | ✅ (solo propias) |
| **Dashboard** | | | |
| Ver dashboard | ✅ (equipo) | ✅ (equipo) | ✅ (personal) |
| Ver métricas del equipo | ✅ | ✅ | ❌ |
| Ver ranking de vendedores | ✅ | ✅ | ❌ |
| **Usuarios** | | | |
| Ver usuarios | ✅ | ✅ (solo lectura) | ❌ |
| Crear usuarios | ✅ | ❌ | ❌ |
| Editar usuarios | ✅ | ❌ | ❌ |
| Activar/Desactivar usuarios | ✅ | ❌ | ❌ |
| Resetear contraseñas | ✅ | ❌ | ❌ |

---

## 🎨 Diseño y UX

### Paleta de Colores
- **Primario**: Violeta (`#9333ea` - purple-600)
- **Secundario**: Gris (`#6b7280` - gray-500)
- **Fondo**: Degradado gris claro (`from-gray-50 to-gray-100`)
- **Éxito**: Verde (`#22c55e`)
- **Advertencia**: Amarillo (`#eab308`)
- **Alerta**: Naranja (`#f97316`)
- **Error**: Rojo (`#ef4444`)
- **Info**: Azul (`#3b82f6`)

### Principios de Diseño
- ✅ **Minimalista**: Enfoque en funcionalidad sin elementos superfluos
- ✅ **Compacto**: Dashboard sin scroll, información visible de un vistazo
- ✅ **Responsive**: Adaptado para móvil, tablet y desktop
- ✅ **Consistente**: Mismo lenguaje visual en todo el sistema
- ✅ **Accesible**: Alto contraste, textos legibles, iconos descriptivos
- ✅ **Feedback visual**: Notificaciones toast, estados hover, transiciones suaves

---

## 🤝 Contribuir

Este proyecto fue desarrollado por **Rodrigo Paz** y **Duclos Ezequiel** como parte de un portfolio profesional. 

### Para colaborar:

1. **Fork** el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Haz commit de tus cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un **Pull Request**

### Convenciones de Commits
Usamos [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Cambios de formato (no afectan código)
- `refactor:` Refactorización de código
- `test:` Agregar o modificar tests
- `chore:` Tareas de mantenimiento

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

---

## 👨‍💻 Autores

**Desarrollado por:**
- **Rodrigo Paz** - Full Stack Developer
- **Duclos Ezequiel** - Full Stack Developer

---

## 🙏 Agradecimientos

- **TailwindCSS** - Por el increíble sistema de diseño utility-first
- **Prisma** - Por el ORM más developer-friendly
- **Recharts** - Por los gráficos minimalistas y responsivos
- **@hello-pangea/dnd** - Por mantener vivo el drag & drop
- **Vite** - Por la velocidad de desarrollo
- **La comunidad de React** - Por los recursos y apoyo constante

---

**⭐ Si este proyecto te resulta útil, dale una estrella en GitHub!**

*Desarrollado con 💜 por Rodrigo Paz y Duclos Ezequiel*
