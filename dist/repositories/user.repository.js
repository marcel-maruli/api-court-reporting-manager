"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const database_1 = require("../config/database");
class UserRepository {
    async findAll() {
        const query = 'SELECT id, name, role, city, is_available, created_at FROM users ORDER BY id ASC';
        const { rows } = await database_1.pool.query(query);
        return rows;
    }
    async findById(id) {
        const query = 'SELECT id, name, role, city, is_available, created_at FROM users WHERE id = $1';
        const { rows } = await database_1.pool.query(query, [id]);
        return rows.length ? rows[0] : null;
    }
    async findAllReporters() {
        const query = "SELECT id, name, city, is_available FROM users WHERE role = 'REPORTER'";
        const { rows } = await database_1.pool.query(query);
        return rows;
    }
    async findAllEditors() {
        const query = "SELECT id, name, city, is_available FROM users WHERE role = 'EDITOR'";
        const { rows } = await database_1.pool.query(query);
        return rows;
    }
    async updateAvailability(id, isAvailable) {
        const query = `
      UPDATE users 
      SET is_available = $1 
      WHERE id = $2 
      RETURNING id, name, role, city, is_available
    `;
        const { rows } = await database_1.pool.query(query, [isAvailable, id]);
        return rows.length ? rows[0] : null;
    }
    async create(data) {
        const query = `
      INSERT INTO users (name, role, city, is_available) 
      VALUES ($1, $2, $3, true) 
      RETURNING id, name, role, city, is_available, created_at
    `;
        const values = [data.name, data.role, data.city];
        const { rows } = await database_1.pool.query(query, values);
        return rows[0];
    }
}
exports.UserRepository = UserRepository;
