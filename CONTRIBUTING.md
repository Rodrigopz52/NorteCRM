# 🤝 Guía de Contribución - NorteCRM

Gracias por tu interés en contribuir a NorteCRM. Este documento te guiará en el proceso.

## 📋 Antes de Empezar

1. **Fork** el repositorio
2. **Clone** tu fork: `git clone https://github.com/tu-usuario/NorteCRM.git`
3. Configura el remote upstream: `git remote add upstream https://github.com/rodrigo-paz/NorteCRM.git`
4. Lee el README.md completo

## 🔧 Configuración del Entorno de Desarrollo

```bash
# Backend
cd backend
npm install
echo 'DATABASE_URL="file:./nortecrm.db"' > .env
echo 'JWT_SECRET="dev_secret_key"' >> .env
npx prisma migrate dev
npx prisma db seed

# Frontend
cd ../frontend
npm install
```

## 🌳 Flujo de Trabajo con Git

### 1. Actualizar tu Fork
```bash
git checkout main
git fetch upstream
git merge upstream/main
```

### 2. Crear una Rama para tu Feature
```bash
git checkout -b feature/nombre-descriptivo
# o
git checkout -b fix/descripcion-del-bug
```

### 3. Hacer Commits
Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: agregar filtro de fecha en dashboard"
git commit -m "fix: corregir error en validación de clientes"
git commit -m "docs: actualizar README con nuevas funcionalidades"
git commit -m "style: formatear código en clienteController"
git commit -m "refactor: mejorar lógica de permisos"
git commit -m "chore: actualizar dependencias"
```

### 4. Push y Pull Request
```bash
git push origin feature/nombre-descriptivo
```

Luego abre un Pull Request en GitHub con:
- **Título descriptivo** siguiendo Conventional Commits
- **Descripción detallada** de los cambios
- **Screenshots** si hay cambios visuales
- **Referencias** a issues relacionados (#123)

## 📝 Estándares de Código

### JavaScript/React
- Usar `const` y `let`, no `var`
- Preferir arrow functions
- Componentes funcionales con hooks
- Destructuring cuando sea posible
- Nombres descriptivos (camelCase para variables, PascalCase para componentes)

### Ejemplo de componente:
```jsx
import { useState } from "react";

export default function MiComponente({ data, onAction }) {
  const [estado, setEstado] = useState(false);

  const handleClick = () => {
    setEstado(!estado);
    onAction();
  };

  return (
    <div className="p-4 bg-white rounded-lg">
      <button onClick={handleClick}>
        {estado ? "Activo" : "Inactivo"}
      </button>
    </div>
  );
}
```

### Backend
- Async/await para operaciones asíncronas
- Try-catch para manejo de errores
- Comentarios solo cuando sea necesario
- Validación de datos de entrada

### Ejemplo de controller:
```javascript
export const crearRecurso = async (req, res) => {
  try {
    const { campo1, campo2 } = req.body;
    
    if (!campo1 || !campo2) {
      return res.status(400).json({ error: "Campos requeridos" });
    }

    const recurso = await prisma.recurso.create({
      data: { campo1, campo2, usuarioId: req.usuario.id }
    });

    res.json(recurso);
  } catch (error) {
    console.error("Error al crear recurso:", error);
    res.status(500).json({ error: "Error al crear recurso" });
  }
};
```

## 🎨 Guías de Diseño

- Usar clases de TailwindCSS consistentes con el resto del proyecto
- Color primario: `purple-600`
- Espaciado: `p-2`, `p-3`, `gap-2` (compacto)
- Bordes redondeados: `rounded-lg`
- Sombras: `shadow-md`
- Transiciones: `transition-all`

## 🧪 Testing (Próximamente)

Cuando se implementen tests:
```bash
npm test
npm run test:watch
npm run test:coverage
```

## 📚 Áreas que Necesitan Contribuciones

### 🔴 Alta Prioridad
- [ ] Tests unitarios e integración
- [ ] Validación de formularios más robusta
- [ ] Manejo de errores mejorado
- [ ] Documentación de API en Swagger

### 🟡 Media Prioridad
- [ ] Optimización de queries de base de datos
- [ ] Paginación en listas grandes
- [ ] Búsqueda avanzada
- [ ] Exportación de reportes

### 🟢 Baja Prioridad
- [ ] Modo oscuro
- [ ] Multi-idioma
- [ ] Animaciones adicionales
- [ ] PWA (Progressive Web App)

## 🐛 Reportar Bugs

Usa el siguiente template para reportar bugs:

```markdown
### Descripción del Bug
[Descripción clara y concisa]

### Pasos para Reproducir
1. Ir a '...'
2. Click en '...'
3. Scroll hasta '...'
4. Ver error

### Comportamiento Esperado
[Qué debería pasar]

### Comportamiento Actual
[Qué pasa actualmente]

### Screenshots
[Si aplica]

### Entorno
- OS: [ej. macOS 13.0]
- Navegador: [ej. Chrome 120]
- Versión de Node: [ej. 20.10.0]
```

## 💡 Proponer Nuevas Funcionalidades

Usa el siguiente template para proponer features:

```markdown
### Resumen de la Funcionalidad
[Descripción breve]

### Problema que Resuelve
[Qué problema del usuario resuelve]

### Solución Propuesta
[Cómo se implementaría]

### Alternativas Consideradas
[Otras opciones que pensaste]

### Impacto
- [ ] Requiere cambios en base de datos
- [ ] Requiere cambios en API
- [ ] Requiere cambios en frontend
- [ ] Rompe retrocompatibilidad
```

## 📞 Contacto

- **Issues de GitHub**: Para bugs y features
- **Discusiones**: Para preguntas generales
- **Email**: contacto@nortecrm.com (para temas sensibles)

## 📜 Código de Conducta

- Se respetuoso con otros contribuidores
- Sé constructivo en las revisiones de código
- No toleramos acoso ni discriminación
- Mantén las discusiones profesionales

## 🎉 Reconocimientos

Todos los contribuidores serán mencionados en el README.md

¡Gracias por contribuir a NorteCRM! 💜
