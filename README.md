# ⚡ Taskbar - To-Do List & Tablero Kanban Moderno (Negro & Verde)

Una aplicación web moderna, rápida y estilizada para gestionar tareas y proyectos con doble vista: **Tablero Kanban con Drag & Drop** y **Lista Clásica** con filtros avanzados.

Incluye **sistema de autenticación (Login/Registro con JWT y bcrypt)** que protege la modificación de tareas (solo usuarios logueados pueden crear, mover, editar o completar tareas), y una elegante paleta **Negro Profundo y Verde Neón/Esmeralda**.

Diseñada con Node.js, Express y soporte para **SQLite** (local y sin configuración) y **PostgreSQL** (en Railway o producción).

---

## 🌟 Características Principales

- 🔐 **Autenticación y Seguridad (JWT + bcryptjs)**:
  - Visualización pública de tareas y métricas.
  - Creación, edición, arrastre (Kanban), checkboxes y eliminación protegidos con inicio de sesión.
  - Usuario demo inicial creado automáticamente: `admin` / `admin123`.
  - Posibilidad de crear y registrar nuevas cuentas desde la interfaz.
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
   - **Usuario por defecto:** `admin`
   - **Contraseña:** `admin123`

---

## ☁️ Despliegue en Railway

1. **Sube este proyecto a un repositorio de GitHub:**
   ```bash
   git init
   git add .
   git commit -m "feat: Taskbar con login y tema negro con verde"
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
| `POST` | `/api/auth/register` | Público | Registrar un nuevo usuario |
| `GET` | `/api/auth/me` | Protegido | Obtener perfil del usuario autenticado |
| `GET` | `/api/tasks` | Público | Listado de tareas (filtros `search`, `priority`, etc.) |
| `GET` | `/api/tasks/stats` | Público | Estadísticas globales de tareas |
| `POST` | `/api/tasks` | 🔐 Protegido | Crear nueva tarea |
| `PUT` | `/api/tasks/:id` | 🔐 Protegido | Editar tarea existente |
| `PATCH` | `/api/tasks/:id/status` | 🔐 Protegido | Cambiar estado y posición (arrastre en Kanban) |
| `DELETE` | `/api/tasks/:id` | 🔐 Protegido | Eliminar tarea |
