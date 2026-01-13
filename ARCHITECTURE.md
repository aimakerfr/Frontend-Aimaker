# 🏗️ ARQUITECTURA FRONTEND CORE MODULAR

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         NAVEGADOR                                │
│                         localhost:3000                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND CORE                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     App.tsx (Root)                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   AppRouter (Core)                        │  │
│  │  • Única fuente que conoce todas las apps                │  │
│  │  • Orquesta rutas y protección                           │  │
│  │  • Inyecta apps según path                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ├─────────┬─────────┬─────────┐    │
│                              ▼         ▼         ▼         ▼    │
│                        ┌─────────────────────────────────────┐  │
│                        │      SERVICIOS CORE                 │  │
│                        │                                     │  │
│                        │  ┌─────────────────────────────┐   │  │
│                        │  │    Auth Store               │   │  │
│                        │  │  • Estado global de auth    │   │  │
│                        │  │  • Patrón observador        │   │  │
│                        │  │  • Suscriptores reactivos   │   │  │
│                        │  └─────────────────────────────┘   │  │
│                        │              │                     │  │
│                        │              ▼                     │  │
│                        │  ┌─────────────────────────────┐   │  │
│                        │  │    HTTP Client              │   │  │
│                        │  │  • Único punto de API calls │   │  │
│                        │  │  • Inyección JWT automática │   │  │
│                        │  │  • Manejo de errores        │   │  │
│                        │  └─────────────────────────────┘   │  │
│                        └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Proxy /api → localhost:8000
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Ya existe)                       │
│                    http://localhost:8000                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   API_MANIFEST (v1.0.0)                   │  │
│  │  • Única fuente de verdad                                 │  │
│  │  • Define endpoints, auth, tipos                          │  │
│  │  • Contrato frontend-backend                             │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                      APPS MODULARES                              │
│                    (Completamente desacopladas)                  │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   AuthApp    │    │   HomeApp    │    │ DashboardApp │     │
│  ├──────────────┤    ├──────────────┤    ├──────────────┤     │
│  │ /auth/*      │    │ /            │    │ /dashboard/* │     │
│  │              │    │              │    │              │     │
│  │ • LoginView  │    │ • Landing    │    │ • Overview   │     │
│  │ • Register   │    │ • Features   │    │ • Profile    │     │
│  │              │    │ • Public     │    │ • Protected  │     │
│  │ 🔓 Public    │    │ 🔓 Public    │    │ 🔒 Protected │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│         │                    │                    │             │
│         └────────────────────┴────────────────────┘             │
│                              │                                   │
│                  Todas importan solo de @core/*                 │
│                  NO se conocen entre ellas                      │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Datos

### Autenticación (Login)

```
1. Usuario → LoginView (AuthApp)
2. LoginView → useAuth() hook
3. useAuth() → authStore.login()
4. authStore → httpClient.post('/auth/login')
5. httpClient → Backend API
6. Backend → Response { user, token }
7. httpClient → authStore (guarda token en localStorage)
8. authStore → Notifica suscriptores
9. useAuth() → Re-render con isAuthenticated = true
10. AppRouter → Redirige a /dashboard
11. DashboardApp → Se renderiza (ruta protegida)
```

### Petición Protegida

```
1. DashboardApp → httpClient.get('/auth/me')
2. httpClient → Lee token de localStorage
3. httpClient → Añade header: "Authorization: Bearer {token}"
4. httpClient → Backend API
5. Backend → Valida JWT
6. Backend → Response { user data }
7. httpClient → Retorna data
8. DashboardApp → Renderiza con datos
```

## 🎯 Principios de Desacoplamiento

### ❌ NUNCA HACER

```typescript
// ❌ Apps NO deben importarse entre sí
import { LoginView } from '@apps/auth/views/LoginView';

// ❌ Apps NO deben conocer otras apps
import DashboardApp from '@apps/dashboard/DashboardApp';

// ❌ Lógica de routing en apps
<Route path="/other-app" element={<OtherApp />} />

// ❌ HTTP calls sin http.client
fetch('/api/v1/endpoint', { ... });

// ❌ Manejo directo de tokens
localStorage.setItem('token', token);
```

### ✅ SIEMPRE HACER

```typescript
// ✅ Apps solo importan del core
import { useAuth } from '@core/auth/useAuth';
import { httpClient } from '@core/api/http.client';
import { API_ENDPOINTS } from '@core/api/api.types';

// ✅ Routing solo en el core/router
// core/src/router/router.tsx
import AuthApp from '@apps/auth/AuthApp';
<Route path="/auth/*" element={<AuthApp />} />

// ✅ Todas las llamadas HTTP via cliente
const data = await httpClient.get(API_ENDPOINTS.auth.me);

// ✅ Tokens manejados por auth.store
await authStore.login({ email, password });
```

## 📦 Reemplazo de Apps

Para reemplazar una app completamente:

```typescript
// ANTES: AuthApp antigua
import AuthApp from '@apps/auth/AuthApp';

// DESPUÉS: Nueva implementación
import AuthAppV2 from '@apps/auth-v2/AuthAppV2';

// En router.tsx:
<Route path="/auth/*" element={<AuthAppV2 />} />

// ¡Listo! Sin tocar nada más
```

## 🔐 Storage Strategy

```
localStorage:
  ├─ aimaker_jwt_token → Token JWT
  └─ (futuro) user_preferences, theme, etc.

authStore (memoria):
  ├─ isAuthenticated → boolean
  ├─ user → User | null
  ├─ isLoading → boolean
  └─ error → string | null
```

## 🎨 Estilo de Apps

Cada app tiene sus propios estilos:

```
apps/
├── auth/
│   ├── AuthApp.tsx
│   └── AuthApp.css    ← Estilos de AuthApp
├── home/
│   ├── HomeApp.tsx
│   └── HomeApp.css    ← Estilos de HomeApp
└── dashboard/
    ├── DashboardApp.tsx
    └── DashboardApp.css ← Estilos de DashboardApp
```

**No hay conflictos** porque cada app maneja su propio scope.

## 🚀 Escalabilidad

### Añadir una app en 3 pasos:

1. **Crear la app**:
```bash
apps/nueva-app/
├── NuevaApp.tsx
└── NuevaApp.css
```

2. **Registrar en router**:
```typescript
import NuevaApp from '@apps/nueva-app/NuevaApp';
<Route path="/nueva-app/*" element={<NuevaApp />} />
```

3. **¡Listo!** Sin tocar otras apps.

### Migración a Micro-Frontends

Si en el futuro necesitas Module Federation:

```javascript
// Cada app puede ser un remote
new ModuleFederationPlugin({
  name: 'authApp',
  filename: 'remoteEntry.js',
  exposes: {
    './AuthApp': './apps/auth/AuthApp',
  },
});
```

El core ya está preparado porque **las apps no se conocen entre sí**.

## 🎯 Ventajas de Esta Arquitectura

1. ✅ **Apps independientes**: Pueden desarrollarse en paralelo
2. ✅ **Fácil testing**: Cada app se prueba aisladamente
3. ✅ **Reemplazo sin riesgo**: Cambiar una app no afecta otras
4. ✅ **Equipos autónomos**: Cada equipo puede tener su app
5. ✅ **Code splitting natural**: Vite divide automáticamente
6. ✅ **Escalable**: Preparado para micro-frontends
7. ✅ **Mantenible**: Cambios localizados, no globales
8. ✅ **Type-safe**: TypeScript en todo el proyecto

## 📊 Métricas de Calidad

- **Desacoplamiento**: 100% (apps no se importan)
- **Cohesión**: Alta (cada app es autocontenida)
- **Reutilización**: Core reutilizable en todas las apps
- **Testabilidad**: Alta (cada módulo es testeable)
- **Mantenibilidad**: Alta (cambios localizados)
