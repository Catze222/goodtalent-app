# 🔧 Configuración Supabase para GOOD Talent

## ⚠️ CONFIGURACIÓN CRÍTICA PARA INVITACIONES

### 🌐 **Supabase Dashboard → Authentication → URL Configuration**

**DEBE configurarse exactamente así para que las invitaciones funcionen:**

#### **Site URL:**
```
https://goodtalent-app-frontend.vercel.app
```
*(Reemplaza con tu dominio exacto de Vercel)*

#### **Redirect URLs (agregar ambas):**
```
https://goodtalent-app-frontend.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

#### **Additional Redirect URLs (opcional pero recomendado):**
```
https://goodtalent-app-frontend.vercel.app/*
http://localhost:3000/*
```

### 🔗 **¿Cómo encontrar tu dominio de Vercel?**

1. Ve a tu proyecto en Vercel Dashboard
2. Copia la URL exacta (ej: `https://good-talent-abc123.vercel.app`)
3. Úsala en la configuración arriba

### 🚨 **Síntomas de configuración incorrecta:**

- ❌ Email de invitación contiene `localhost` en lugar de tu dominio
- ❌ Link de invitación lleva a "404" o "página no encontrada"
- ❌ Muestra "Link inválido" aunque el email llegó
- ❌ Usuario se redirige al dashboard sin establecer contraseña

### ✅ **Configuración correcta:**

- ✅ Email contiene tu dominio de Vercel en el link
- ✅ Link lleva a `/auth/callback` en tu dominio
- ✅ Muestra pantalla para establecer contraseña
- ✅ Después de establecer contraseña va al dashboard

---

## 📧 **Configuración de Email (opcional)**

### **Template personalizado:**
Si quieres personalizar el email de invitación, descomenta en `supabase/config.toml`:

```toml
[auth.email.template.invite]
subject = "Has sido invitado a GOOD Talent"
content_path = "./supabase/templates/invite.html"
```

---

## 🔒 **Variables de Entorno Necesarias**

### **Frontend (.env.local):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://irvgruylufihzoveycph.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Vercel Dashboard → Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  
SUPABASE_SERVICE_ROLE_KEY
```

---

## 🔧 **Configuración de Autenticación**

### **Authentication Settings que DEBEN estar habilitados:**

- ✅ **Enable sign up**: ON
- ✅ **Enable email confirmations**: OFF (para invitaciones)
- ✅ **Allow manual linking**: ON (crítico para invitaciones)
- ✅ **Double confirm email changes**: Opcional

---

## 🐛 **Debugging**

### **Logs útiles:**

1. **Frontend Console:** Busca logs con 🔍 en `/auth/callback`
2. **Vercel Functions:** Logs de `/api/invite-user`
3. **Supabase Dashboard:** Auth → Users → Recent activity

### **Comandos de testing:**

```sql
-- Verificar usuarios recién invitados
SELECT email, created_at, email_confirmed_at, last_sign_in_at 
FROM auth.users 
WHERE last_sign_in_at IS NULL 
ORDER BY created_at DESC;

-- Verificar permisos de super admin
SELECT create_super_admin('USER_ID_AQUI');
```

---

## 🔄 **Flujo esperado:**

1. 📧 **Invitación enviada** → Email llega con link correcto
2. 🖱️ **Usuario hace click** → Va a `tu-dominio.vercel.app/auth/callback`
3. 🔍 **Detección automática** → Reconoce que es invitación
4. 🔑 **Pantalla de contraseña** → Usuario establece contraseña
5. 🏠 **Redirect a dashboard** → Login completo

---

**💡 Tip:** Si los cambios no surten efecto inmediato, espera 1-2 minutos para que Supabase propague la configuración.
