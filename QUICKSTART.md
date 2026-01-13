# 🚀 Quick Start Guide

## Inicio Rápido (5 minutos)

### 1. Instalar dependencias

```bash
npm install
```

### 2. Verificar que el backend esté corriendo

Asegúrate de que el backend API esté ejecutándose en:
```
http://localhost:8000
```

Prueba accediendo a:
```
http://localhost:8000/api/v1/health/check
```

Deberías ver:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "AI Maker FabLab API Core",
    "version": "1.0.0",
    "environment": "dev"
  }
}
```

### 3. Iniciar el frontend

```bash
npm run dev
```

El frontend estará disponible en:
```
http://localhost:3000
```

### 4. Probar el sistema

#### A. Página de inicio (público)
Navega a: `http://localhost:3000`

Verás la landing page con las características del sistema.

#### B. Registro de usuario
1. Click en "Registrarse"
2. Completa el formulario:
   - Nombre: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
3. Click en "Crear Cuenta"

Serás automáticamente autenticado y redirigido al dashboard.

#### C. Dashboard (protegido)
Deberías ver:
- Sidebar con navegación
- Tu nombre y email
- Estadísticas del sistema
- Información de tu perfil

#### D. Logout
Click en "🚪 Cerrar Sesión" en el sidebar.

Serás redirigido a la página de login.

#### E. Login
1. Usa las credenciales que creaste:
   - Email: `test@example.com`
   - Password: `password123`
2. Click en "Iniciar Sesión"

Volverás al dashboard.

---

## 📝 Comandos Disponibles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Preview de build
npm run preview

# Linting
npm run lint
```

---

## 🔧 Troubleshooting

### Error: "Failed to fetch"

**Problema**: El frontend no puede comunicarse con el backend.

**Solución**:
1. Verifica que el backend esté corriendo en `http://localhost:8000`
2. Revisa la configuración del proxy en `vite.config.ts`
3. Asegúrate de que CORS esté habilitado en el backend

### Error: "UNAUTHORIZED"

**Problema**: Token JWT inválido o expirado.

**Solución**:
1. Abre las DevTools del navegador (F12)
2. Ve a "Application" → "Local Storage"
3. Elimina la key `aimaker_jwt_token`
4. Recarga la página
5. Vuelve a hacer login

### Error: "Cannot find module '@core/...'"

**Problema**: Path aliases no configurados correctamente.

**Solución**:
1. Verifica `tsconfig.json`:
```json
"paths": {
  "@core/*": ["./core/src/*"],
  "@apps/*": ["./apps/*"]
}
```

2. Verifica `vite.config.ts`:
```typescript
resolve: {
  alias: {
    '@core': path.resolve(__dirname, './core/src'),
    '@apps': path.resolve(__dirname, './apps'),
  },
}
```

3. Reinicia el servidor de desarrollo

---

## 🎯 Próximos Pasos

1. **Explora el código**:
   - Lee `core/src/api/http.client.ts` para ver cómo funcionan las peticiones HTTP
   - Revisa `core/src/auth/auth.store.ts` para entender el manejo de autenticación
   - Examina `apps/` para ver cómo están estructuradas las apps

2. **Modifica una app**:
   - Cambia los estilos de `apps/home/HomeApp.css`
   - Añade una nueva vista en `apps/dashboard/views/`
   - Personaliza el `AuthApp` con tu branding

3. **Añade una nueva app**:
   - Crea `apps/nueva-app/NuevaApp.tsx`
   - Regístrala en `core/src/router/router.tsx`
   - ¡Listo!

4. **Integra con más endpoints**:
   - Añade nuevos tipos en `core/src/api/api.types.ts`
   - Úsalos con `httpClient` en tus apps

---

## 📚 Recursos Adicionales

- [README.md](./README.md) - Documentación completa
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura y diagramas
- [API_MANIFEST](./API_MANIFEST.json) - Contrato del backend (si está disponible)

---

## ✅ Checklist de Verificación

Marca estos items para confirmar que todo funciona:

- [ ] Backend corriendo en `http://localhost:8000`
- [ ] Health check responde correctamente
- [ ] Frontend corriendo en `http://localhost:3000`
- [ ] Puedes ver la landing page
- [ ] Puedes registrarte
- [ ] Eres redirigido al dashboard después del registro
- [ ] Ves tu información en el dashboard
- [ ] Puedes navegar a tu perfil
- [ ] Puedes hacer logout
- [ ] Puedes hacer login nuevamente
- [ ] El token JWT persiste después de recargar la página

Si todos los items están marcados, ¡el sistema está funcionando correctamente! 🎉

---

## 🆘 Soporte

Si encuentras problemas:
1. Revisa la consola del navegador (F12)
2. Revisa la consola del terminal donde corre el frontend
3. Revisa los logs del backend
4. Consulta la documentación en `README.md` y `ARCHITECTURE.md`
