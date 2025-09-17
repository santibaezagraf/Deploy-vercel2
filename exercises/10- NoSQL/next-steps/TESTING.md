# Suite de Pruebas Unitarias - Ejercicio 10 NoSQL

## Resumen

Este proyecto implementa un conjunto completo de pruebas unitarias que cubre todas las funcionalidades requeridas en el ejercicio 10, extendiendo las pruebas del ejercicio 9 con:

- ✅ **Funciones de autenticación**
- ✅ **Operaciones CRUD de la base de datos**
- ✅ **Middleware de autorización**
- ✅ **Validación de datos**
- ✅ **Mocking de la conexión a la base de datos**
- ✅ **Casos de autorización (acceso permitido/denegado)**

## Estructura de Pruebas

### 1. Pruebas de Autenticación (`src/hooks/useAuth.test.ts`)
- **Login**: Credenciales válidas e inválidas
- **Registro**: Datos válidos y manejo de duplicados
- **Logout**: Proceso de cierre de sesión
- **Verificación de tokens**: Validación JWT
- **Manejo de errores**: Red, timeouts, respuestas HTTP

### 2. Pruebas CRUD de Base de Datos (`src/models/database.test.ts`)
Utiliza **MongoDB Memory Server** para pruebas en aislamiento:
- **User Model**: CRUD completo, validaciones, índices únicos
- **Review Model**: Creación, búsqueda, votaciones, eliminación
- **Favorite Model**: Favoritos únicos, búsquedas por usuario
- **Relaciones**: Integridad referencial entre modelos

### 3. Pruebas de Middleware de Autorización (`src/middleware.test.ts`)
- **Acceso Permitido**: Tokens válidos, roles de admin
- **Acceso Denegado**: Sin token, tokens inválidos/expirados
- **Casos Edge**: Tokens mal formados, secretos faltantes
- **Rutas Protegidas**: Dashboard, perfil, APIs protegidas

### 4. Pruebas de Validación de Datos (`src/lib/validation.test.ts`)
- **Validación de Usuario**: Email, username, password
- **Validación de Reseñas**: BookId, rating, comentarios
- **Validación de Login**: Credenciales de acceso
- **Validación de Favoritos**: Datos de libro requeridos
- **Casos Edge**: Null, undefined, strings vacíos

### 5. Pruebas de Integración de APIs (`src/app/api/integration.test.ts`)
- **Authentication APIs**: Login, registro, verificación
- **Reviews APIs**: CRUD completo de reseñas
- **Favorites APIs**: Agregar/remover favoritos
- **User APIs**: Obtener datos de usuario
- **Voting APIs**: Sistema de votaciones
- **Manejo de Errores**: 401, 400, 404, errores de red

### 6. Pruebas de Componentes React (`src/app/components/components.test.tsx`)
- **Formularios**: Login, reseñas, interacciones de usuario
- **Botones de Favoritos**: Estados, toggle, persistencia
- **Accesibilidad**: ARIA labels, navegación por teclado
- **Manejo de Errores**: APIs fallidas, validaciones

## Utilidades de Testing (`src/test/testUtils.ts`)

### Setup de Base de Datos
```typescript
import { setupTestDB, cleanupTestDB, teardownTestDB } from '@/test/testUtils';

beforeEach(async () => {
    await setupTestDB();
});

afterEach(async () => {
    await cleanupTestDB();
});
```

### Mocking de APIs
```typescript
import { mockAPIResponse, createTestData } from '@/test/testUtils';

// Simular respuesta exitosa
(fetch as any).mockResolvedValueOnce(
    mockAPIResponse.success(createTestData.user())
);

// Simular error de autorización
(fetch as any).mockResolvedValueOnce(
    mockAPIResponse.unauthorized()
);
```

### Datos de Prueba
```typescript
import { createTestData } from '@/test/testUtils';

const testUser = createTestData.user();
const testReview = createTestData.review({ rating: 5 });
const testFavorite = createTestData.favorite();
```

## Comandos de Testing

### Ejecutar todas las pruebas
```bash
npm test
npm run test:run  # Sin modo watch
```

### Ejecutar pruebas específicas
```bash
npm run test:auth         # Pruebas de autenticación
npm run test:db          # Pruebas de base de datos
npm run test:middleware  # Pruebas de middleware
npm run test:validation  # Pruebas de validación
npm run test:components  # Pruebas de componentes
npm run test:integration # Pruebas de integración
```

### Coverage y UI
```bash
npm run test:coverage    # Reporte de cobertura
npm run test:ui         # Interfaz visual
```

## Configuración

### Vitest Config (`vitest.config.ts`)
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

### Setup Global (`src/test/setup.ts`)
- Configuración de Testing Library
- Variables de entorno para testing
- Cleanup automático después de cada prueba
- Serializers para ObjectIds de MongoDB

## Mocking Strategies

### 1. **MongoDB Memory Server**
- Base de datos en memoria real para pruebas de integración
- Aislamiento completo entre pruebas
- Testing de índices, validaciones y relaciones

### 2. **Fetch Mocking**
- Simulación de APIs externas y internas
- Control total sobre respuestas HTTP
- Testing de manejo de errores de red

### 3. **Next.js Router Mocking**
- Simulación de navegación
- Testing de redirects y rutas protegidas

### 4. **JWT Mocking**
- Tokens válidos e inválidos simulados
- Testing de expiración y malformación

## Casos de Autorización Cubiertos

### ✅ Acceso Permitido
- Usuario autenticado con token válido
- Admin con permisos especiales
- Tokens frescos y bien formados

### ✅ Acceso Denegado
- Sin token de autenticación
- Token expirado o inválido
- Token mal formado
- Usuario sin permisos

## Cobertura de Testing

- **Autenticación**: 100% funciones críticas
- **Base de Datos**: Todos los modelos y operaciones
- **Middleware**: Todos los casos de autorización
- **Validación**: Todos los esquemas y casos edge
- **APIs**: Endpoints principales y manejo de errores
- **Componentes**: Interacciones de usuario críticas

## Beneficios Logrados

1. **Confiabilidad**: Detección temprana de bugs
2. **Mantenibilidad**: Refactoring seguro
3. **Documentación**: Las pruebas documentan el comportamiento
4. **Regresión**: Prevención de bugs ya resueltos
5. **Calidad**: Forzar mejores prácticas de desarrollo
6. **Debugging**: Aislamiento rápido de problemas

## Integración CI/CD

Las pruebas están listas para integración en pipelines de CI/CD:

```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: npm run test:run
  
- name: Generate Coverage
  run: npm run test:coverage
```

Esta suite de pruebas garantiza la calidad y confiabilidad del sistema de reseñas de libros con autenticación y base de datos NoSQL.