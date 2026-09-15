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
      is_active: true
    });
  } else {
    // Actualizar contraseña y asegurar rol admin y activo
    await db('users').where({ username: 'wilyos' }).update({
      password_hash: wilyosHash,
      name: 'Wilyos (Admin)',
      role: 'admin',
      is_active: true
    });
  }

  // Asegurar que admin inicial también tenga is_active si existe
  await db('users').where({ username: 'admin' }).update({ is_active: true });

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
      table.string('due_date', 50).nullable();
      table.integer('position').notNullable().defaultTo(0);
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });

    console.log('🌱 Insertando tareas de ejemplo iniciales...');
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await db('tasks').insert([
      {
        title: 'Configurar proyecto en Railway 🚀',
        description: 'Conectar el repositorio de GitHub y verificar el despliegue automático con un clic.',
        status: 'todo',
        priority: 'high',
        category: 'Despliegue',
        due_date: tomorrow,
        position: 0
      },
      {
        title: 'Explorar vista Kanban y Drag & Drop 🎴',
        description: 'Arrastra esta tarjeta entre columnas para cambiar su estado dinámicamente.',
        status: 'in_progress',
        priority: 'medium',
        category: 'Tutorial',
        due_date: nextWeek,
        position: 0
      },
      {
        title: 'Crear primera tarea personalizada ✨',
        description: 'Usa el botón "+ Nueva Tarea" o el botón rápido en cualquier columna.',
        status: 'todo',
        priority: 'low',
        category: 'Personal',
        due_date: nextWeek,
        position: 1
      },
      {
        title: 'Instalación de dependencias del servidor 📦',
        description: 'Instalado Express, Knex, drivers de BD y configurado el entorno.',
        status: 'completed',
        priority: 'urgent',
        category: 'Sistema',
        due_date: now.toISOString().split('T')[0],
        position: 0
      }
    ]);
  }
}

module.exports = { db, initDb };
