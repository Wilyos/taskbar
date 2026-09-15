# ⚡ Taskbar - To-Do List & Tablero Kanban Moderno (Negro & Verde)

Una aplicación web moderna, rápida y estilizada para gestionar tareas y proyectos con doble vista: **Tablero Kanban con Drag & Drop** y **Lista Clásica** con filtros avanzados.

Incluye **sistema de autenticación (Login/Registro con JWT y bcrypt)** con **Administrador Maestro (`wilyos`)** y **sistema de aprobación de cuentas**, además de una paleta estética **Negro Profundo y Verde Neón/Esmeralda**.

Diseñada con Node.js, Express y soporte para **SQLite** (local y sin configuración) y **PostgreSQL** (en Railway o producción).

---

## 🌟 Características Principales

- 👑 **Administrador Maestro y Gestión de Permisos**:
  - Cuenta maestra predeterminada: **`wilyos`** / **`W1597475+`** (Rol: `admin`).
  - Las cuentas que se registren nuevas quedan en estado **Pendiente** (`is_active = false`).
  - **Un usuario sin activar solo puede visualizar tareas**, exactamente igual que un visitante no autenticado. No puede crear, mover, editar ni borrar nada hasta ser activado.
  - El administrador maestro `wilyos` dispone del botón y panel **"👥 Usuarios"** para activar o desactivar el acceso de escritura de cualquier cuenta en tiempo real.
- 🎨 **Paleta Negro Profundo y Verde Neón/Esmeralda**:
  - Estética oscura de alto contraste con resplandores neón (*glow*), glassmorphism y modo claro esmeralda alternativo.
- 🎴 **Tablero Kanban Interactivo**: Columnas *Por Hacer*, *En Progreso* y *Completadas*, con arrastrar y soltar (Drag & Drop nativo) fluido.
- 📋 **Vista de Lista Detallada**: Checkbox rápido para completar tareas, badges de prioridad y fechas de vencimiento.
- 📊 **Métricas de Productividad en Tiempo Real**: Contador de tareas y barra de porcentaje de avance global.
- 🔍 **Búsqueda y Filtros**: Búsqueda instantánea en vivo, filtrado por nivel de prioridad y categorías.
- 🚀 **100% Preparado para Railway**: Incluye `railway.json`, `Procfile`, `Dockerfile`, healthcheck en `/api/health` y autodetección de base de datos (`DATABASE_URL`).

---

## 🛠️ Requisitos Previos

- [Node.js](https://nodejs.org/) v18 o superior instalado.

---

## 💻 Ejecución Local

1. **Clonar o entrar en la carpeta del proyecto:**
   ```bash
   cd e:\dev\sistemasNfc\taskbar
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar en modo desarrollo o producción:**
   ```bash
   # Modo normal:
   npm start

   # Modo desarrollo (con recarga automática):
   npm run dev
   ```

4. **Abrir en el navegador:**
   Accede a [http://localhost:3000](http://localhost:3000).  
   - **Administrador Maestro:** `wilyos`
   - **Contraseña:** `W1597475+`

---

## ☁️ Despliegue en Railway

1. **Sube este proyecto a un repositorio de GitHub:**
   ```bash
   git init
   git add .
   git commit -m "feat: Taskbar con admin wilyos y control de activacion"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/taskbar.git
   git push -u origin main
   ```

2. **Crea tu proyecto en Railway:**
   - Inicia sesión en [railway.com](https://railway.com/).
   - Haz clic en **"New Project"** -> **"Deploy from GitHub repo"**.
   - Selecciona tu repositorio.

3. **(Opcional pero Recomendado) Agregar Base de Datos PostgreSQL:**
   - Dentro de tu proyecto en Railway, haz clic en **"+ New"** -> **"Database"** -> **"Add PostgreSQL"**.
   - Railway inyecta automáticamente la variable `DATABASE_URL` al servicio de tu aplicación.
   - La app detectará automáticamente `DATABASE_URL` y usará PostgreSQL en lugar de SQLite.

4. **Generar Dominio Público:**
   - En el servicio de tu app en Railway, ve a **Settings** -> **Networking** -> **Generate Domain**.
   - ¡Tu aplicación estará en línea!

---

## 📡 Endpoints de la API REST

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/health` | Público | Healthcheck para Railway y monitorización |
| `POST` | `/api/auth/login` | Público | Iniciar sesión y obtener JWT |
| `POST` | `/api/auth/register` | Público | Registrar usuario (creado como pendiente) |
| `GET` | `/api/auth/me` | Protegido | Obtener perfil del usuario autenticado |
| `GET` | `/api/users` | 👑 Solo Admin (`wilyos`) | Listado de todas las cuentas registradas |
| `PATCH` | `/api/users/:id/status` | 👑 Solo Admin (`wilyos`) | Activar o desactivar cuenta de usuario |
| `GET` | `/api/tasks` | Público | Listado de tareas (filtros `search`, etc.) |
| `GET` | `/api/tasks/stats` | Público | Estadísticas globales de tareas |
| `POST` | `/api/tasks` | 🔐 Cuenta Activa | Crear nueva tarea |
| `PUT` | `/api/tasks/:id` | 🔐 Cuenta Activa | Editar tarea existente |
| `PATCH` | `/api/tasks/:id/status` | 🔐 Cuenta Activa | Cambiar estado/mover tarjeta Kanban |
| `DELETE` | `/api/tasks/:id` | 🔐 Cuenta Activa | Eliminar tarea |
