# 🚀 Guía de Configuración y Despliegue en GitHub

Esta guía explica cómo configurar el proyecto localmente y el flujo de trabajo con Git/GitHub.

---

## 📦 Configuración Inicial del Repositorio

### Paso 1: Inicializar Git en el Proyecto

```bash
cd /Users/Desktop/NorteCRM
git init
git add .
git commit -m "feat: initial commit - NorteCRM v1.0.0"
```

### Paso 2: Crear Repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre del repositorio: **NorteCRM**
3. Descripción: **Sistema de Gestión Inmobiliaria - CRM especializado con Kanban, Dashboard y métricas en tiempo real**
4. **Público** o **Privado** (según preferencia)
5. **NO** marcar "Initialize this repository with a README" (ya existe uno)
6. Click en **Create repository**

### Paso 3: Conectar Repositorio Local con GitHub

Después de crear el repositorio en GitHub:

```bash
# Agregar el remote (HTTPS)
git remote add origin https://github.com/TU-USUARIO/NorteCRM.git

# O con SSH (recomendado)
git remote add origin git@github.com:TU-USUARIO/NorteCRM.git

# Renombrar rama principal a main
git branch -M main

# Push inicial
git push -u origin main
```

### Paso 4: Verificar Subida Exitosa

```bash
# Ver el estado
git status

# Ver los archivos rastreados
git ls-files
```

---

## 👥 Configuración para Colaboradores

### Agregar Colaboradores al Proyecto

1. Ve al repositorio en GitHub
2. **Settings** → **Collaborators** → **Add people**
3. Buscar por username o email
4. Click en **Add collaborator**
5. El colaborador recibirá una invitación por email

### Clonar y Configurar el Proyecto

```bash
# Clonar repositorio
git clone https://github.com/OWNER/NorteCRM.git
cd NorteCRM

# Backend: Configurar variables de entorno
cd backend
cp .env.example .env

# Editar .env y cambiar JWT_SECRET por una clave segura
# Generar clave: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Instalar dependencias y configurar base de datos
npm install
npx prisma migrate dev
npx prisma db seed

# Frontend: Instalar dependencias
cd ../frontend
npm install
```

**⚠️ IMPORTANTE**: El archivo `.env` contiene información sensible y **NO está en el repositorio**. Cada colaborador debe crear su propio `.env` basado en `.env.example`.

---

## 🔄 Flujo de Trabajo con Git

### Realizar Cambios en el Proyecto

```bash
# 1. Asegurarse de estar actualizado
git pull origin main

# 2. Crear una rama para tu feature
git checkout -b feature/nombre-descriptivo

# 3. Hacer tus cambios y commits
git add .
git commit -m "feat: descripción del cambio"

# 4. Subir tu rama
git push origin feature/nombre-descriptivo

# 5. Crear un Pull Request en GitHub
```

### Revisar Cambios de Otros Colaboradores

```bash
# Actualizar ramas remotas
git fetch

# Cambiar a la rama del colaborador
git checkout nombre-de-rama

# Probar los cambios localmente
npm run dev

# Aprobar Pull Request en GitHub si todo funciona correctamente
```

---

## 🔒 Protección de Rama Principal (Recomendado)

1. Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Marcar:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1)
   - ✅ Dismiss stale pull request approvals
4. Save changes

Esto garantiza que todos los cambios pasen por revisión mediante Pull Requests antes de llegar a producción.

---

## 🔐 Variables de Entorno

El archivo `.env` **NO se sube a GitHub** (protegido por `.gitignore`).

Cada colaborador debe crear su propio archivo `.env` basado en `.env.example`:

```bash
# En backend/.env
DATABASE_URL="file:./nortecrm.db"
JWT_SECRET="CLAVE_SUPER_SECRETA_UNICA_PARA_PRODUCCION"
PORT=3000
```

---

## ✅ Checklist de Configuración

- [ ] Git inicializado
- [ ] Repositorio creado en GitHub
- [ ] Remote configurado correctamente
- [ ] Primera subida completada (`git push`)
- [ ] Colaboradores agregados (si aplica)
- [ ] README.md visible en GitHub
- [ ] `.gitignore` funcionando (node_modules excluidos)
- [ ] Variables de entorno configuradas localmente
- [ ] Base de datos inicializada con migraciones
- [ ] Proyecto corre correctamente en local

---

## 🛠 Comandos Git Útiles

```bash
# Ver estado actual
git status

# Ver historial de commits
git log --oneline

# Ver ramas
git branch -a

# Actualizar desde GitHub
git pull origin main

# Ver diferencias
git diff

# Deshacer último commit (mantiene cambios)
git reset --soft HEAD~1

# Ver remotes configurados
git remote -v
```

---

## 🆘 Solución de Problemas

### "fatal: remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/TU-USUARIO/NorteCRM.git
```

### Conflictos al hacer pull
```bash
git stash              # Guardar cambios locales
git pull origin main   # Actualizar
git stash pop          # Recuperar cambios
# Resolver conflictos manualmente
git add .
git commit -m "fix: resolver conflictos"
```

### Olvidé crear una rama nueva
```bash
git stash
git checkout -b feature/mi-nueva-rama
git stash pop
```

---

## 📚 Recursos

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Prisma Documentation](https://www.prisma.io/docs)

---

*Desarrollado por Rodrigo Paz y Duclos Ezequiel*
