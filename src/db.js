const fs = require('fs');
const path = require('path');
const knex = require('knex');
require('dotenv').config();

let db;

if (process.env.DATABASE_URL) {
  // Railway o producción con PostgreSQL
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
  // Entorno local o Railway con SQLite
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
  const hasTable = await db.schema.hasTable('tasks');
  if (!hasTable) {
    console.log('🛠 Creando tabla "tasks"...');
    await db.schema.createTable('tasks', (table) => {
      table.increments('id').primary();
      table.string('title', 255).notNullable();
      table.text('description').nullable();
      table.string('status', 50).notNullable().defaultTo('todo'); // 'todo', 'in_progress', 'completed'
      table.string('priority', 50).notNullable().defaultTo('medium'); // 'low', 'medium', 'high', 'urgent'
      table.string('category', 100).notNullable().defaultTo('General');
      table.string('due_date', 50).nullable();
      table.integer('position').notNullable().defaultTo(0);
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });

    // Semillas iniciales para dar vida al tablero de inmediato
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
