const { db } = require('../db');
const bcrypt = require('bcryptjs');

const userModel = {
  async findByUsername(username) {
    return await db('users').where({ username: username.toLowerCase().trim() }).first();
  },

  async findByEmail(email) {
    if (!email) return null;
    return await db('users').where({ email: email.toLowerCase().trim() }).first();
  },

  async findById(id) {
    const user = await db('users').where({ id }).first();
    if (!user) return null;
    const { password_hash, reset_token, reset_token_expires, ...userWithoutSensitive } = user;
    return userWithoutSensitive;
  },

  async getAll() {
    return await db('users')
      .select('id', 'username', 'name', 'email', 'role', 'area', 'is_active', 'created_at')
      .orderBy('id', 'asc');
  },

  async getActiveBasic(area) {
    let query = db('users')
      .select('id', 'username', 'name', 'area')
      .where('is_active', true);

    if (area && area !== 'all' && area !== 'todas') {
      query = query.where((builder) => {
        builder.where('area', area).orWhere('area', 'todas');
      });
    }

    return await query.orderBy('name', 'asc');
  },

  async create({ username, password, name, role = 'user', area = 'desarrollo', email = null, is_active = false }) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const safeArea = ['desarrollo', 'diseno'].includes(area) ? area : 'desarrollo';
    const cleanEmail = email ? email.toLowerCase().trim() : null;

    const [id] = await db('users').insert({
      username: username.toLowerCase().trim(),
      password_hash,
      name: name.trim(),
      role,
      area: safeArea,
      email: cleanEmail,
      is_active: !!is_active,
      created_at: new Date()
    });

    const insertedId = typeof id === 'object' && id !== null ? id.id : id;
    return await this.findById(insertedId || id);
  },

  async setEmail(id, email) {
    const cleanEmail = email ? email.toLowerCase().trim() : null;
    if (cleanEmail) {
      const existing = await db('users')
        .where({ email: cleanEmail })
        .whereNot({ id })
        .first();
      if (existing) {
        throw new Error('Este correo electrónico ya está asociado a otra cuenta.');
      }
    }

    await db('users').where({ id }).update({ email: cleanEmail });
    return await this.findById(id);
  },

  async setResetToken(id, tokenHash, expiresAt) {
    await db('users').where({ id }).update({
      reset_token: tokenHash,
      reset_token_expires: expiresAt
    });
  },

  async findByValidResetToken(tokenHash) {
    const now = Date.now();
    return await db('users')
      .where({ reset_token: tokenHash })
      .where('reset_token_expires', '>', now)
      .first();
  },

  async updatePasswordAndClearReset(id, newPassword) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);
    await db('users').where({ id }).update({
      password_hash,
      reset_token: null,
      reset_token_expires: null
    });
    return await this.findById(id);
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

  async setArea(id, area) {
    const user = await db('users').where({ id }).first();
    if (!user) return null;

    if (!['desarrollo', 'diseno', 'todas'].includes(area)) {
      throw new Error('Área inválida. Debe ser "desarrollo" o "diseno".');
    }

    await db('users').where({ id }).update({ area });
    return await this.findById(id);
  },

  async setRole(id, role) {
    const user = await db('users').where({ id }).first();
    if (!user) return null;

    // Roles: 'admin' (ve todo), 'desarrollo' (solo Desarrollo Web), 'diseno' (solo Diseño)
    if (!['admin', 'desarrollo', 'diseno'].includes(role)) {
      throw new Error('Rol inválido. Debe ser "admin", "desarrollo" o "diseno".');
    }
    if (user.username === 'wilyos' && role !== 'admin') {
      throw new Error('No es posible quitar el rol de administrador al administrador maestro wilyos.');
    }

    const updates = role === 'admin'
      ? { role: 'admin', area: 'todas', is_active: true }
      : { role: 'user', area: role };

    await db('users').where({ id }).update(updates);
    return await this.findById(id);
  },

  async comparePassword(plainPassword, passwordHash) {
    return await bcrypt.compare(plainPassword, passwordHash);
  }
};

module.exports = userModel;
