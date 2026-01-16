# AI Maker FabLab - Frontend Core Modular

## 🎯 Descripción

Frontend Core Modular desarrollado en **React + TypeScript + Vite**, siguiendo una arquitectura completamente desacoplada basada en el **API_MANIFEST** del backend.

## 🏗️ Arquitectura

### Principios Fundamentales

1. **API_MANIFEST Driven**: El manifest del backend es la única fuente de verdad
2. **Desacoplamiento Total**: Las apps NO se conocen entre sí
3. **Core como Orquestador**: Solo el CORE decide qué app renderizar
4. **HTTP Client Centralizado**: Todas las llamadas HTTP pasan por `http.client.ts`
5. **Auth Centralizada**: Autenticación manejada SOLO en el core
6. **Apps Reemplazables**: Cualquier app puede ser reemplazada sin afectar el sistema

### Estructura del Proyecto

```
frontend/
├── core/                          # Core del sistema
│   └── src/
│       ├── api/
│       │   ├── api.types.ts      # Tipos del API_MANIFEST
│       │   └── http.client.ts    # Cliente HTTP centralizado
│       ├── auth/
│       │   ├── auth.store.ts     # Store de autenticación
│       │   └── useAuth.ts        # Hook de React para auth
│       ├── router/
│       │   └── router.tsx        # Orquestador de rutas
│       ├── app/
│       │   ├── App.tsx           # Componente raíz
│       │   └── App.css           # Estilos del core
│       ├── main.tsx              # Entry point
│       └── index.css             # Estilos globales
│
├── apps/                          # Apps modulares (independientes)
│   ├── auth/                     # App de autenticación
│   │   ├── AuthApp.tsx
│   │   ├── AuthApp.css
│   │   └── views/
│   │       ├── LoginView.tsx
│   │       └── RegisterView.tsx
│   │
│   ├── home/                     # App de landing page
│   │   ├── HomeApp.tsx
│   │   └── HomeApp.css
│   │
│   └── dashboard/                # App de dashboard
│       ├── DashboardApp.tsx
│       ├── DashboardApp.css
│       ├── layout/
│       │   └── DashboardLayout.tsx
│       └── views/
│           ├── OverviewView.tsx
│           └── ProfileView.tsx
│
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 🚀 Instalación y Ejecución

### Requisitos Previos

- Node.js 18+
- Backend ejecutándose en `http://localhost:8000`

### Instalación

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build para producción
npm run build

# Preview de producción
npm run preview
```

La aplicación estará disponible en `http://localhost:3000`

## 🔑 Flujo de Autenticación

### 1. JWT Storage
- El token JWT se almacena en `localStorage` con la key `aimaker_jwt_token`
- El `http.client.ts` añade automáticamente el token a las peticiones

### 2. Auth Store
- Patrón de observador para reactividad
- Suscriptores notificados en cada cambio de estado
- Integración con React mediante el hook `useAuth`

### 3. Endpoints de Autenticación

```http
# Registro
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "********",
  "name": "User Name"
}

# Respuesta
{
  "user": { /* ... */ },
  "token": "<jwt>"
}

# Login
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "********"
}

# Respuesta
{
  "user": { /* ... */ },
  "token": "<jwt>"
}

# Obtener usuario actual
GET /api/v1/auth/me
Authorization: Bearer <token>

# Respuesta
{
  "id": 1,
  "email": "user@example.com",
  "name": "User Name",
  "roles": ["user"]
}

# Logout
POST /api/v1/auth/logout
Authorization: Bearer <token>
```

## 🧩 Apps Modulares

### Características de las Apps

- **Independientes**: No se importan entre sí
- **Autocontenidas**: Tienen sus propios estilos y lógica
- **Reemplazables**: Pueden ser intercambiadas sin modificar el core
- **Acceso al Core**: Solo importan desde `@core/*` para auth y API

### Auth App
- **Ruta**: `/auth/*`
- **Vistas**: Login, Register
- **Protección**: Solo accesible si NO estás autenticado

### Home App
- **Ruta**: `/`
- **Público**: Accesible sin autenticación
- **Propósito**: Landing page

### Dashboard App
- **Ruta**: `/dashboard/*`
- **Vistas**: Overview, Profile
- **Protección**: Solo accesible si ESTÁS autenticado

## 📡 HTTP Client

### Uso del Cliente HTTP

```typescript
import { httpClient } from '@core/api/http.client';
import { API_ENDPOINTS } from '@core/api/api.types';

// GET con autenticación
const user = await httpClient.get<User>(API_ENDPOINTS.auth.me);

// POST sin autenticación
const response = await httpClient.post<LoginResponse>(
  API_ENDPOINTS.auth.login,
  { email, password },
  false // requiresAuth = false
);

// POST con autenticación (por defecto)
await httpClient.post('/api/v1/some-endpoint', { data });
```

### Manejo de Errores

```typescript
import { HttpClientError } from '@core/api/http.client';

try {
  await httpClient.get('/api/v1/protected');
} catch (error) {
  if (error instanceof HttpClientError) {
    console.error(error.code);    // ERROR_CODE del manifest
    console.error(error.message); // Mensaje legible
    console.error(error.status);  // HTTP status code
  }
}
```

## 🎨 Path Aliases

Para facilitar las importaciones:

```typescript
// Importar desde el core
import { useAuth } from '@core/auth/useAuth';
import { httpClient } from '@core/api/http.client';

// Importar apps (solo desde el router)
import AuthApp from '@apps/auth/AuthApp';
```

## 🔒 Rutas Protegidas

### Protected Route
```tsx
<ProtectedRoute>
  <DashboardApp />
</ProtectedRoute>
```

- Si NO autenticado → Redirige a `/auth/login`
- Si autenticado → Renderiza la app

### Public Route
```tsx
<PublicRoute>
  <AuthApp />
</PublicRoute>
```

- Si autenticado → Redirige a `/dashboard`
- Si NO autenticado → Renderiza la app

## 📦 Añadir una Nueva App

### Paso 1: Crear la App
```tsx
// apps/nueva-app/NuevaApp.tsx
export default function NuevaApp() {
  return <div>Nueva App</div>;
}
```

### Paso 2: Registrarla en el Router
```tsx
// core/src/router/router.tsx
import NuevaApp from '@apps/nueva-app/NuevaApp';

// Añadir ruta
<Route path="/nueva-app/*" element={<NuevaApp />} />
```

### ¡Listo! La nueva app está integrada sin modificar nada más.

## 🛠️ Extensión del API

### Añadir Nuevos Endpoints

1. Actualizar `api.types.ts` con los nuevos tipos:

```typescript
export const API_ENDPOINTS = {
  // otros endpoints existentes
  projects: {
    list: '/projects',
    create: '/projects',
    detail: (id: number) => `/projects/${id}`,
  },
};
```

2. Usar en cualquier app:

```typescript
const projects = await httpClient.get(API_ENDPOINTS.projects.list);
```

## 📋 Checklist de Implementación

- ✅ Core con routing y auth
- ✅ HTTP Client con JWT automático
- ✅ Auth Store con patrón observador
- ✅ 3 Apps independientes (Auth, Home, Dashboard)
- ✅ Rutas protegidas y públicas
- ✅ Tipos TypeScript del manifest
- ✅ Path aliases configurados
- ✅ Proxy a backend configurado
- ✅ Estilos modulares por app
- ✅ Arquitectura desacoplada

## 🎯 Próximos Pasos

1. **Testing**: Añadir tests unitarios y de integración
2. **Error Boundary**: Manejar errores de React
3. **Loading States**: Estados de carga globales
4. **Toasts/Notifications**: Sistema de notificaciones
5. **Más Apps**: Añadir más módulos según necesidad
6. **Micro-Frontends**: Evolucionar a Module Federation si es necesario

## 🤝 Convenciones

- **Nombres de Apps**: PascalCase con sufijo "App" (ej: `AuthApp`, `DashboardApp`)
- **Vistas**: PascalCase con sufijo "View" (ej: `LoginView`, `ProfileView`)
- **Hooks**: camelCase con prefijo "use" (ej: `useAuth`)
- **Stores**: camelCase con sufijo ".store" (ej: `auth.store.ts`)
- **Tipos**: PascalCase para interfaces/types

## 📄 Licencia

Proyecto interno - AI Maker FabLab


## 🧰 Dev Containers (VS Code/JetBrains)

Este proyecto incluye una definición de Dev Container para un entorno de desarrollo reproducible.

- Carpeta: .devcontainer/
- Imagen base: mcr.microsoft.com/devcontainers/javascript-node:20-bookworm (Node 20)
- Puertos reenviados: 3001 (Vite dentro del contenedor) y 3300
- Variables: VITE_PORT=3001 por defecto (también se puede definir en .env)
- Post-create: npm install automático

Cómo usar (VS Code):
1. Instala la extensión “Dev Containers”.
2. Abre la carpeta del proyecto.
3. Pulsa “Reopen in Container”.
4. Una vez creado el contenedor, ejecuta: npm start (o sh scripts/vite_dev.sh).

Notas:
- Vite usa el puerto definido en .env (VITE_PORT) con fallback a 3001 (ver vite.config.ts).
- Los puertos 3001 y 3300 se reenvían automáticamente desde el contenedor.
- Para compilar producción: sh scripts/vite_build.sh (salida en ./dist).
