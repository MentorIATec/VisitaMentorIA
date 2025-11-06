# Configurar y Probar SSO con Azure AD

## Paso 1: Configurar Azure AD

### 1.1. Crear App Registration en Azure Portal

1. Ve a [Azure Portal](https://portal.azure.com)
2. Azure Active Directory → **App registrations** → **New registration**
3. Configuración:
   - **Name**: `VisitaMentorIA` (o el nombre que prefieras)
   - **Supported account types**: "Accounts in this organizational directory only" (o según tu necesidad)
   - **Redirect URI**: 
     - Type: `Web`
     - URI: `https://visita-mentor-ia.vercel.app/api/auth/callback/azure-ad`

### 1.2. Obtener Credenciales

1. **Application (client) ID** → Copiar → `AZURE_AD_CLIENT_ID`
2. **Certificates & secrets** → **New client secret** → Copiar el valor → `AZURE_AD_CLIENT_SECRET`
3. **Directory (tenant) ID** → Copiar → `AZURE_AD_TENANT_ID` (opcional)

### 1.3. Configurar Dominios Permitidos (Opcional)

Si quieres restringir a dominios específicos (@tec.mx):
- **Token configuration** → **Optional claims** → Agregar `email`
- Configurar `AZURE_AD_DOMAIN_ALLOWLIST` con `tec.mx,itesm.mx`

## Paso 2: Configurar Variables en Vercel

Ve a **Settings** → **Environment Variables** y agrega:

### Variables Requeridas para SSO:

| Variable | Valor | Entornos |
|----------|-------|----------|
| `SSO_ENABLED` | `1` o `true` | Production, Preview |
| `NEXT_PUBLIC_SSO_ENABLED` | `true` | Production, Preview |
| `AZURE_AD_CLIENT_ID` | Tu Client ID de Azure | Production, Preview |
| `AZURE_AD_CLIENT_SECRET` | Tu Client Secret de Azure | Production, Preview |
| `AZURE_AD_TENANT_ID` | Tu Tenant ID (opcional) | Production, Preview |

**⚠️ IMPORTANTE:** 
- `SSO_ENABLED` se usa en el backend (server-side)
- `NEXT_PUBLIC_SSO_ENABLED` se usa en el frontend (client-side)
- **Ambas deben estar configuradas** para que SSO funcione completamente

## Paso 3: Verificar Redirect URIs en Azure AD

Asegúrate de tener configuradas las URIs correctas:

- **Production**: `https://visita-mentor-ia.vercel.app/api/auth/callback/azure-ad`
- **Preview** (si aplica): `https://tu-proyecto-*-*.vercel.app/api/auth/callback/azure-ad`

## Paso 4: Probar SSO

### 4.1. En Producción

1. Ve a https://visita-mentor-ia.vercel.app/
2. Deberías ver el botón **"Continuar con Microsoft"**
3. Haz clic en el botón
4. Serás redirigido a Microsoft para iniciar sesión
5. Después del login, serás redirigido de vuelta a la aplicación

### 4.2. Flujo Esperado

**Primera vez (sin matrícula vinculada):**
1. Login con Microsoft → Redirige a `/register?link=1`
2. Pantalla de vinculación de matrícula
3. Ingresa matrícula válida → Se vincula → Continúa con registro

**Ya vinculado:**
1. Login con Microsoft → Va directamente a `/register`
2. No pide matrícula (ya está vinculada)

## Paso 5: Troubleshooting

### El botón SSO no aparece

- Verifica que `NEXT_PUBLIC_SSO_ENABLED=true` esté configurado en Vercel
- Verifica que el deployment haya incluido esta variable
- Haz un redeploy después de agregar la variable

### Error "redirect_uri_mismatch"

- Verifica que la Redirect URI en Azure AD coincida exactamente con tu dominio
- Incluye el protocolo `https://` y la ruta completa `/api/auth/callback/azure-ad`

### Error de autenticación

- Verifica que `AZURE_AD_CLIENT_ID` y `AZURE_AD_CLIENT_SECRET` sean correctos
- Verifica que el Client Secret no haya expirado (crea uno nuevo si es necesario)
- Revisa los logs de Vercel para ver errores específicos

### Usuario no puede vincular matrícula

- Verifica que la tabla `users_map` existe (migración `0010_create_users_map.sql`)
- Verifica que el endpoint `/api/users-map/link` funciona
- Revisa los logs del servidor

## Comandos Útiles para Debugging

```bash
# Verificar variables de entorno en Vercel (desde logs)
# Los logs mostrarán si las variables están configuradas

# Verificar que el build incluye NEXT_PUBLIC_SSO_ENABLED
# Revisa el código compilado en .next/static
```

## Notas de Seguridad

- **Nunca** commitees `AZURE_AD_CLIENT_SECRET` al repositorio
- Rota el Client Secret periódicamente
- Usa diferentes App Registrations para Preview y Production si es posible
- Configura dominios permitidos si quieres restringir acceso

