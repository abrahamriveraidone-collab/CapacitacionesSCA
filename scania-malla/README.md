# Scania — Malla de Capacitación de Almacenes

Plataforma web de capacitación técnica para almaceneros de Scania Perú.

---

## 🚀 Instalación paso a paso

### Tiempo estimado: 30–60 minutos

---

## PASO 1 — Crear cuenta en Supabase (gratis)

1. Ve a https://supabase.com y crea una cuenta gratuita
2. Haz clic en **"New project"**
3. Ponle nombre: `scania-malla`
4. Elige una contraseña segura para la base de datos
5. Selecciona región: **South America (São Paulo)**
6. Espera ~2 minutos mientras se crea el proyecto

---

## PASO 2 — Crear la base de datos

1. En Supabase, ve al menú izquierdo → **SQL Editor**
2. Haz clic en **"New query"**
3. Abre el archivo `supabase/schema.sql` de esta carpeta
4. Copia todo el contenido y pégalo en el editor de Supabase
5. Haz clic en **"Run"** (botón verde)
6. Verás el mensaje "Success" — tu base de datos está lista

---

## PASO 3 — Obtener las claves de Supabase

1. En Supabase, ve a **Project Settings** → **API**
2. Copia:
   - **Project URL** → empieza con `https://`
   - **anon public key** → empieza con `eyJ`

---

## PASO 4 — Configurar las variables de entorno

1. En la carpeta del proyecto, busca el archivo `.env.example`
2. **Crea una copia** y llámala `.env` (sin el `.example`)
3. Abre `.env` con cualquier editor de texto (Notepad, VS Code, etc.)
4. Rellena tus datos:

```
VITE_SUPABASE_URL=https://tuproyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ADMIN_USER=Admin123
VITE_ADMIN_PASS=123456
```

5. Guarda el archivo

---

## PASO 5 — Instalar y ejecutar localmente

Necesitas tener **Node.js** instalado (descárgalo en https://nodejs.org).

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

Abre tu navegador en: **http://localhost:3000**

¡La plataforma está funcionando localmente! 🎉

---

## PASO 6 — Publicar en Netlify (gratis)

### Opción A — Subir carpeta directamente

1. Ejecuta en la terminal:
   ```bash
   npm run build
   ```
2. Se creará una carpeta llamada `dist/`
3. Ve a https://netlify.com y crea una cuenta gratuita
4. En el dashboard, arrastra la carpeta `dist/` al área de deploy
5. ¡Listo! Netlify te dará una URL como `https://scania-malla.netlify.app`

### Opción B — Conectar con GitHub (recomendado para actualizaciones automáticas)

1. Sube el proyecto a GitHub (ver instrucciones en el README de GitHub)
2. En Netlify → **"New site from Git"**
3. Conecta tu repositorio de GitHub
4. Configura:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. En Netlify → **Site settings → Environment variables**, agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_USER`
   - `VITE_ADMIN_PASS`
6. Haz clic en **Deploy site**

---

## 📋 Información de acceso

### Almaceneros (plataforma pública)
- Acceden con su **código de usuario** (ej: `AFL9FU`)
- Los códigos se crean desde el Panel Admin

### Administrador
- URL: `[tu-url]/admin/login`
- Usuario: `Admin123`
- Contraseña: `123456`

---

## 🏗️ Estructura del proyecto

```
scania-malla/
├── src/
│   ├── pages/
│   │   ├── Gate.jsx          ← Pantalla de código de usuario
│   │   ├── Home.jsx          ← Plataforma almacenero
│   │   ├── Module.jsx        ← Detalle de módulo
│   │   ├── Quiz.jsx          ← Examen interactivo
│   │   ├── AdminLogin.jsx    ← Login administrador
│   │   └── Admin.jsx         ← Panel admin completo
│   ├── lib/
│   │   └── supabase.js       ← Cliente y funciones de base de datos
│   ├── App.jsx               ← Rutas
│   ├── main.jsx
│   └── index.css             ← Estilos globales (paleta Scania)
├── supabase/
│   └── schema.sql            ← Base de datos completa
├── .env.example              ← Plantilla de variables de entorno
├── netlify.toml              ← Configuración de deploy
├── package.json
└── README.md                 ← Este archivo
```

---

## 🔧 Tecnologías utilizadas

| Tecnología | Uso | Costo |
|---|---|---|
| React + Vite | Frontend | Gratis |
| React Router | Navegación | Gratis |
| Supabase | Base de datos + Storage + Auth | Gratis hasta 500 MB DB / 1 GB Storage |
| Netlify | Hosting | Gratis |

---

## ❓ Preguntas frecuentes

**¿Cómo cambio la contraseña del admin?**
Edita el archivo `.env` y cambia `VITE_ADMIN_PASS`. Si está en Netlify, actualiza la variable de entorno en Site settings.

**¿Cómo agrego un nuevo almacenero?**
Panel Admin → Almaceneros → "+ Nuevo almacenero". El código que asignes será el acceso del almacenero.

**¿Dónde se guardan los PDFs?**
En Supabase Storage, bucket `material-pdfs`. Puedes verlos en Supabase → Storage.

**¿Qué pasa si supero el límite gratuito de Supabase?**
Puedes actualizar al plan Pro (~$25/mes) que da 8 GB de base de datos y 100 GB de Storage.

**¿La plataforma funciona en celular?**
Sí, es responsive. Funciona en PC, tablet y celular.

---

## 📞 Soporte

Para problemas de configuración, revisa primero:
1. Que el archivo `.env` esté correctamente configurado
2. Que ejecutaste el `schema.sql` completo en Supabase
3. Que las variables de entorno en Netlify estén configuradas

---

*Scania — Malla de Capacitación de Almacenes · v1.0*
