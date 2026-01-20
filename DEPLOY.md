# Frontend - Instrucciones de Deploy

## Problema: Error 404 en producción al recargar rutas

**Causa**: Apache/Nginx no está configurado para manejar el enrutamiento del lado del cliente (SPA).

## Solución

### 1. Build del proyecto
```bash
cd Frontend-Aimaker-1
npm run build
```

### 2. El archivo `.htaccess` se copiará automáticamente a `dist/`

### 3. Subir a producción
Sube todo el contenido de la carpeta `dist/` a tu servidor:
```bash
# Ejemplo con rsync
rsync -avz dist/ usuario@servidor:/ruta/al/sitio/

# O con FTP/SFTP, sube todo el contenido de dist/
```

### 4. Verificar configuración de Apache

Asegúrate de que Apache tenga habilitado `mod_rewrite`:
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

Y que el archivo `.htaccess` se esté respetando (en tu VirtualHost):
```apache
<Directory /ruta/al/sitio>
    AllowOverride All
    Require all granted
</Directory>
```

### 5. Para Nginx (alternativa)

Si usas Nginx, añade esto a tu configuración:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## Verificación

Después del deploy:
- Accede a `https://tu-dominio.com/dashboard` directamente
- Recarga la página con F5
- No debería aparecer el error 404

## Variables de entorno

Asegúrate de configurar en producción:
```bash
VITE_API_URL=https://api.tu-dominio.com
```
