const fs = require('fs');
const path = require('path');
const knex = require('knex');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let db;

if (process.env.DATABASE_URL) {
  console.log('🔗 Conectando a PostgreSQL mediante DATABASE_URL...');
  db = knex({
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
    },
    pool: { min: 2, max: 10 }
  });
} else {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'todos.db');
  console.log(`📁 Conectando a SQLite local en ${dbPath}...`);

  db = knex({
    client: 'sqlite3',
    connection: {
      filename: dbPath
    },
    useNullAsDefault: true
  });
}

async function initDb() {
  // 1. Tabla de Usuarios
  const hasUsersTable = await db.schema.hasTable('users');
  if (!hasUsersTable) {
    console.log('🛠 Creando tabla "users"...');
    await db.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('username', 80).notNullable().unique();
      table.string('password_hash', 255).notNullable();
      table.string('name', 120).notNullable();
      table.string('role', 50).notNullable().defaultTo('user');
      table.string('area', 50).notNullable().defaultTo('desarrollo');
      table.boolean('is_active').notNullable().defaultTo(false);
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
  } else {
    // Si la tabla ya existe, verificar si tiene la columna is_active
    const hasIsActive = await db.schema.hasColumn('users', 'is_active');
    if (!hasIsActive) {
      console.log('🛠 Agregando columna "is_active" a la tabla users...');
      await db.schema.table('users', (table) => {
        table.boolean('is_active').notNullable().defaultTo(false);
      });
    }

    // Verificar si la tabla users tiene la columna area
    const hasArea = await db.schema.hasColumn('users', 'area');
    if (!hasArea) {
      console.log('🛠 Agregando columna "area" a la tabla users...');
      await db.schema.table('users', (table) => {
        table.string('area', 50).notNullable().defaultTo('desarrollo');
      });
    }
  }

  // 2. Administrador Maestro wilyos (W1597475+)
  console.log('👑 Verificando cuenta de administrador maestro...');
  const salt = await bcrypt.genSalt(10);
  const wilyosHash = await bcrypt.hash('W1597475+', salt);

  const existingWilyos = await db('users').where({ username: 'wilyos' }).first();
  if (!existingWilyos) {
    console.log('👤 Creando administrador maestro...');
    await db('users').insert({
      username: 'wilyos',
      password_hash: wilyosHash,
      name: 'Wilyos (Admin)',
      role: 'admin',
      area: 'todas',
      is_active: true
    });
  } else {
    // Actualizar contraseña y asegurar rol admin, area todas y activo
    await db('users').where({ username: 'wilyos' }).update({
      password_hash: wilyosHash,
      name: 'Wilyos (Admin)',
      role: 'admin',
      area: 'todas',
      is_active: true
    });
  }

  // Asegurar que admin inicial también tenga is_active y area todas si existe
  await db('users').where({ username: 'admin' }).update({ is_active: true, area: 'todas' });

  // 3. Tabla de Tareas
  const hasTasksTable = await db.schema.hasTable('tasks');
  if (!hasTasksTable) {
    console.log('🛠 Creando tabla "tasks"...');
    await db.schema.createTable('tasks', (table) => {
      table.increments('id').primary();
      table.string('title', 255).notNullable();
      table.text('description').nullable();
      table.string('status', 50).notNullable().defaultTo('todo');
      table.string('priority', 50).notNullable().defaultTo('medium');
      table.string('category', 100).notNullable().defaultTo('General');
      table.string('area', 50).notNullable().defaultTo('desarrollo');
      table.string('due_date', 50).nullable();
      table.integer('position').notNullable().defaultTo(0);
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
  } else {
    // Si la tabla ya existe, verificar si tiene la columna area
    const hasTaskArea = await db.schema.hasColumn('tasks', 'area');
    if (!hasTaskArea) {
      console.log('🛠 Agregando columna "area" a la tabla tasks...');
      await db.schema.table('tasks', (table) => {
        table.string('area', 50).notNullable().defaultTo('desarrollo');
      });
    }
  }

  // Verificar si hay tareas en el sistema; si no, insertar iniciales
  const totalTasks = await db('tasks').count('id as count').first();
  const taskCount = totalTasks ? parseInt(totalTasks.count, 10) : 0;

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  if (taskCount === 0) {
    console.log('🌱 Insertando tareas de ejemplo iniciales para Desarrollo...');
    await db('tasks').insert([
      {
        title: 'Configurar proyecto en Railway 🚀',
        description: 'Conectar el repositorio de GitHub y verificar el despliegue automático con un clic.',
        status: 'todo',
        priority: 'high',
        category: 'Despliegue',
        area: 'desarrollo',
        due_date: tomorrow,
        position: 0
      },
      {
        title: 'Explorar vista Kanban y Drag & Drop 🎴',
        description: 'Arrastra esta tarjeta entre columnas para cambiar su estado dinámicamente.',
        status: 'in_progress',
        priority: 'medium',
        category: 'Tutorial',
        area: 'desarrollo',
        due_date: nextWeek,
        position: 0
      },
      {
        title: 'Instalación de dependencias del servidor 📦',
        description: 'Instalado Express, Knex, drivers de BD y configurado el entorno.',
        status: 'completed',
        priority: 'urgent',
        category: 'Sistema',
        area: 'desarrollo',
        due_date: now.toISOString().split('T')[0],
        position: 0
      }
    ]);
  }

  // Verificar si hay tareas para el área de Diseño
  const designTasks = await db('tasks').where({ area: 'diseno' }).count('id as count').first();
  const designCount = designTasks ? parseInt(designTasks.count, 10) : 0;

  if (designCount === 0) {
    console.log('🎨 Insertando tareas de ejemplo iniciales para Diseño...');
    await db('tasks').insert([
      {
        title: 'Diseño de interfaz y Wireframes en Figma 🎨',
        description: 'Crear propuestas visuales para las pantallas clave de la nueva plataforma.',
        status: 'in_progress',
        priority: 'high',
        category: 'UI/UX',
        area: 'diseno',
        due_date: tomorrow,
        position: 0
      },
      {
        title: 'Definir paleta de colores y tokens de diseño ✨',
        description: 'Estandarizar tipografías, degradados, contrastes y guía de estilos del sistema.',
        status: 'todo',
        priority: 'medium',
        category: 'Branding',
        area: 'diseno',
        due_date: nextWeek,
        position: 0
      },
      {
        title: 'Exportar activos e iconos SVG para desarrollo 📐',
        description: 'Organizar paquetes de iconografía vectorial optimizados para la web.',
        status: 'completed',
        priority: 'low',
        category: 'Recursos',
        area: 'diseno',
        due_date: now.toISOString().split('T')[0],
        position: 0
      }
    ]);
  }
}

module.exports = { db, initDb };
