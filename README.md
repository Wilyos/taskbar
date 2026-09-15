# ⚡ Taskbar - To-Do List & Tablero Kanban Moderno (Listo para Railway)

Una aplicación web moderna, rápida y estilizada para gestionar tareas y proyectos con doble vista: **Tablero Kanban con Drag & Drop** y **Lista Clásica** con filtros avanzados. Diseñada con Node.js, Express y soporte para **SQLite** (local y sin configuración) y **PostgreSQL** (en Railway o producción).

---

## 🌟 Características Principales

- 🎴 **Tablero Kanban Interactivo**: Columnas *Por Hacer*, *En Progreso* y *Completadas*, con arrastrar y soltar (Drag & Drop nativo) fluido.
- 📋 **Vista de Lista Detallada**: Checkbox rápido para completar tareas, badges de prioridad y fechas de vencimiento.
- 🎨 **Diseño Moderno & Glassmorphism**: Modo oscuro por defecto con soporte de modo claro, micro-animaciones y tipografía estilizada.
- 📊 **Métricas de Productividad en Tiempo Real**: Contador de tareas y barra de porcentaje de avance global.
- 🔍 **Búsqueda y Filtros**: Búsqueda instantánea en vivo, filtrado por nivel de prioridad y categorías.
- 🚀 **100% Preparado para Railway**: Incluye `railway.json`, `Procfile`, `Dockerfile`, healthcheck en `/api/health` y autodetección de base de datos.

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
   *Nota: La base de datos SQLite se creará y sembrará automáticamente en `./data/todos.db`.*

---

## ☁️ Guía Paso a Paso para Desplegar en Railway

Railway permite desplegar esta aplicación en cuestión de minutos y con soporte de base de datos persistente.

### Opción A: Despliegue con GitHub (Recomendado)

1. **Sube este proyecto a un repositorio de GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Taskbar Railway app"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/taskbar.git
   git push -u origin main
   ```

2. **Crea tu proyecto en Railway:**
   - Inicia sesión en [railway.com](https://railway.com/).
   - Haz clic en **"New Project"** -> **"Deploy from GitHub repo"**.
   - Selecciona tu repositorio recién subido.

3. **(Opcional y Recomendado) Agregar Base de Datos PostgreSQL:**
   - Dentro de tu proyecto en Railway, haz clic en **"+ New"** -> **"Database"** -> **"Add PostgreSQL"**.
   - Enlace de variables: Railway inyecta automáticamente la variable `DATABASE_URL` al servicio de tu aplicación.
   - ¡Listo! La app detectará automáticamente `DATABASE_URL` y usará PostgreSQL en lugar de SQLite.

4. **(Alternativa con SQLite y Volumen Persistente en Railway):**
   - Si prefieres no usar PostgreSQL, en la configuración del servicio en Railway ve a la pestaña **Volumes** y monta un volumen en `/app/data`. De esta forma tu archivo SQLite persistirá entre reinicios.

5. **Generar Dominio Público:**
   - En el servicio de tu app en Railway, ve a **Settings** -> **Networking** -> **Generate Domain**.
   - ¡Tu aplicación ya estará en línea en `https://tu-app.up.railway.app`!

---

### Opción B: Despliegue con Railway CLI

1. Instalar la CLI de Railway si no la tienes:
   ```bash
   npm install -g @railway/cli
   ```

2. Iniciar sesión y vincular:
   ```bash
   railway login
   railway init
   ```

3. Desplegar:
   ```bash
   railway up
   ```

---

## 📡 Endpoints de la API REST

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/health` | Healthcheck para Railway y monitorización |
| `GET` | `/api/tasks` | Listado de tareas (filtros `search`, `priority`, `category`) |
| `GET` | `/api/tasks/stats` | Estadísticas (total, completadas, porcentaje) |
| `GET` | `/api/tasks/categories` | Lista de categorías únicas creadas |
| `POST` | `/api/tasks` | Crear nueva tarea |
| `PUT` | `/api/tasks/:id` | Editar tarea existente |
| `PATCH` | `/api/tasks/:id/status` | Cambiar estado y posición (arrastre en Kanban) |
| `DELETE` | `/api/tasks/:id` | Eliminar tarea |

---

## 📄 Licencia

MIT © 2026.
