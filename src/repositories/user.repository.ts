import { pool } from '../config/database';
import { UserRow } from '../interfaces/user.interface';

export class UserRepository {
  
  async findAll(): Promise<UserRow[]> {
    const query = 'SELECT id, name, role, city, is_available, created_at FROM users ORDER BY id ASC';
    const { rows } = await pool.query<UserRow>(query);
    return rows;
  }

  async findById(id: number): Promise<UserRow | null> {
    const query = 'SELECT id, name, role, city, is_available, created_at FROM users WHERE id = $1';
    const { rows } = await pool.query<UserRow>(query, [id]);
    return rows.length ? rows[0] : null;
  }

  async findAllReporters(): Promise<UserRow[]> {
    const query = "SELECT id, name, city, is_available FROM users WHERE role = 'REPORTER'";
    const { rows } = await pool.query<UserRow>(query);
    return rows;
  }

  async findAllEditors(): Promise<UserRow[]> {
    const query = "SELECT id, name, city, is_available FROM users WHERE role = 'EDITOR'";
    const { rows } = await pool.query<UserRow>(query);
    return rows;
  }

  async updateAvailability(id: number, isAvailable: boolean): Promise<UserRow | null> {
    const query = `
      UPDATE users 
      SET is_available = $1 
      WHERE id = $2 
      RETURNING id, name, role, city, is_available
    `;
    const { rows } = await pool.query<UserRow>(query, [isAvailable, id]);
    return rows.length ? rows[0] : null;
  }

  async create(data: { name: string; role: 'REPORTER' | 'EDITOR'; city: string }): Promise<UserRow> {
    const query = `
      INSERT INTO users (name, role, city, is_available) 
      VALUES ($1, $2, $3, true) 
      RETURNING id, name, role, city, is_available, created_at
    `;
    const values = [data.name, data.role, data.city];
    const { rows } = await pool.query<UserRow>(query, values);
    return rows[0];
  }
}