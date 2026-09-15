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

  async create({ username, password, name, role = 'user' }) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [id] = await db('users').insert({
      username: username.toLowerCase().trim(),
      password_hash,
      name: name.trim(),
      role,
      created_at: new Date()
    });

    const insertedId = typeof id === 'object' && id !== null ? id.id : id;
    return await this.findById(insertedId || id);
  },

  async comparePassword(plainPassword, passwordHash) {
    return await bcrypt.compare(plainPassword, passwordHash);
  }
};

module.exports = userModel;
