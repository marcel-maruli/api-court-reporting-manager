import { pool } from "../config/database";
import { JobRow } from "../interfaces/job.interface";

export class JobRepository {
  async create(data: any): Promise<JobRow> {
    const query = `
      INSERT INTO jobs (case_name, duration_minutes, location_type, city)
      VALUES ($1, $2, $3, $4) RETURNING *
    `;
    const { rows } = await pool.query<JobRow>(query, [
      data.case_name,
      data.duration_minutes,
      data.location_type,
      data.city,
    ]);
    return rows[0];
  }

  async findAll(): Promise<any[]> {
    const query = `
      SELECT j.*, jr.name as reporter_name, je.name as editor_name
      FROM jobs j
      LEFT JOIN users jr ON j.reporter_id = jr.id
      LEFT JOIN users je ON j.editor_id = je.id
      ORDER BY j.id DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async findById(id: number): Promise<JobRow | null> {
    const { rows } = await pool.query<JobRow>(
      "SELECT * FROM jobs WHERE id = $1",
      [id],
    );
    return rows.length ? rows[0] : null;
  }

  async findAvailableReporter(jobId: number): Promise<any> {
    const jobResult = await this.findById(jobId);
    if (!jobResult) return null;

    let query = `
    SELECT id, name, city, is_available FROM users 
    WHERE role = 'REPORTER' AND is_available = true
  `;
    const values: any[] = [];

    if (jobResult.location_type === "PHYSICAL") {
      query += ` ORDER BY (CASE WHEN city = $1 THEN 0 ELSE 1 END) LIMIT 1`;
      values.push(jobResult.city);
    } else {
      query += ` LIMIT 1`;
    }

    const { rows } = await pool.query(query, values);
    return rows.length ? rows[0] : null;
  }
  async assignReporter(jobId: number, reporterId: number): Promise<JobRow> {
    const query = `UPDATE jobs SET reporter_id = $1, status = 'ASSIGNED' WHERE id = $2 RETURNING *`;
    const { rows } = await pool.query<JobRow>(query, [reporterId, jobId]);
    return rows[0];
  }

  async assignEditor(jobId: number, editorId: number): Promise<JobRow> {
    const query = `UPDATE jobs SET editor_id = $1 WHERE id = $2 RETURNING *`;
    const { rows } = await pool.query<JobRow>(query, [editorId, jobId]);
    return rows[0];
  }

  async updateStatusAndCalculatePayment(
    jobId: number,
    newStatus: string,
  ): Promise<JobRow> {
    const job = await this.findById(jobId);
    if (!job) throw new Error("Job tidak ditemukan");

    let reporterPayout = Number(job.reporter_payout);
    let editorPayout = Number(job.editor_payout);

    if (
      newStatus === "TRANSCRIBED" ||
      newStatus === "REVIEWED" ||
      newStatus === "COMPLETED"
    ) {
      reporterPayout = job.duration_minutes * 2000;
    }
    if (newStatus === "REVIEWED" || newStatus === "COMPLETED") {
      editorPayout = 50000;
    }

    const totalPayout = reporterPayout + editorPayout;

    const query = `
      UPDATE jobs 
      SET status = $1, reporter_payout = $2, editor_payout = $3, total_payout = $4
      WHERE id = $5 RETURNING *
    `;
    const { rows } = await pool.query<JobRow>(query, [
      newStatus,
      reporterPayout,
      editorPayout,
      totalPayout,
      jobId,
    ]);
    return rows[0];
  }
}
