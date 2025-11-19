# 🔐 Checklist de Seguridad - NorteCRM

## ✅ Verificación Completada (18 Nov 2025)

### Variables de Entorno
- ✅ **JWT_SECRET** movido a `.env` (ya no está hardcoded)
- ✅ Archivo `.env` creado en `backend/.env`
- ✅ Archivo `.env.example` creado como plantilla
- ✅ `.env` incluido en `.gitignore`
- ✅ `dotenv` instalado y configurado en `backend/index.js`
- ✅ `authController.js` usa `process.env.JWT_SECRET`
- ✅ `authMiddleware.js` usa `process.env.JWT_SECRET`

### Archivos Protegidos (en .gitignore)
```
✅ .env
✅ .env.local
✅ .env.development.local
✅ .env.test.local
✅ .env.production.local
✅ node_modules/
✅ backend/dev.db (base de datos de desarrollo)
```

### Credenciales de Prueba
⚠️ **NOTA**: Las credenciales en `backend/prisma/seed.js` son solo para desarrollo/testing:
- `gerente@crm.com` / `123456`
- `admin@crm.com` / `123456`
- `vendedor@crm.com` / `123456`

**En producción se deben:**
1. Cambiar todas las contraseñas
2. Cambiar el `JWT_SECRET` por uno generado con:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. Considerar usar variables de entorno más robustas

### Base de Datos
- ✅ Base de datos SQLite (`backend/nortecrm.db`) NO está en `.gitignore` para facilitar desarrollo compartido
- ⚠️ En producción usar PostgreSQL o MySQL con credenciales seguras

### Tokens y Claves Expuestas
- ✅ NO hay API keys hardcoded
- ✅ NO hay tokens de servicios externos
- ✅ NO hay credenciales de bases de datos en código

## 🚨 ANTES DE SUBIR A PRODUCCIÓN

1. **Cambiar JWT_SECRET** en el archivo `.env` del servidor de producción
2. **Cambiar contraseñas** de todos los usuarios en seed.js o crear usuarios nuevos
3. **Usar base de datos segura** (PostgreSQL/MySQL con usuario y password robustos)
4. **Habilitar HTTPS** en el servidor
5. **Configurar CORS** restrictivo (no permitir `*` en producción)
6. **Implementar rate limiting** para prevenir ataques de fuerza bruta
7. **Revisar logs** y no exponer información sensible

## 📝 Para Nuevos Colaboradores

Al clonar el proyecto, cada colaborador debe:

1. Copiar `.env.example` a `.env`
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Generar su propio `JWT_SECRET` (opcional para desarrollo local):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. Pegar el valor generado en `backend/.env`:
   ```
   JWT_SECRET=tu_clave_generada_aqui
   ```

4. **NUNCA** subir el archivo `.env` a Git

---

**Desarrollado por**: Rodrigo Paz y Duclos Ezequiel  
**Fecha de verificación**: 18 de Noviembre de 2025
