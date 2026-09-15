const { db } = require('../db');
const bcrypt = require('bcryptjs');

const userModel = {
  async findByUsername(username) {
    return await db('users').where({ username: username.toLowerCase().trim() }).first();
  },

  async findById(id) {
    const user = await db('users').where({ id }).first();
    if (!user) return null;
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async getAll() {
    return await db('users')
      .select('id', 'username', 'name', 'role', 'is_active', 'created_at')
      .orderBy('id', 'asc');
  },

  async create({ username, password, name, role = 'user', is_active = false }) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [id] = await db('users').insert({
      username: username.toLowerCase().trim(),
      password_hash,
      name: name.trim(),
      role,
      is_active: !!is_active,
      created_at: new Date()
    });

    const insertedId = typeof id === 'object' && id !== null ? id.id : id;
    return await this.findById(insertedId || id);
  },

  async setActiveStatus(id, isActive) {
    const user = await db('users').where({ id }).first();
    if (!user) return null;

    // Proteger al administrador principal wilyos de ser desactivado
    if (user.username === 'wilyos' && !isActive) {
      throw new Error('No es posible desactivar al administrador maestro wilyos.');
    }

    await db('users').where({ id }).update({
      is_active: !!isActive
    });

    return await this.findById(id);
  },

  async comparePassword(plainPassword, passwordHash) {
    return await bcrypt.compare(plainPassword, passwordHash);
  }
};

module.exports = userModel;
