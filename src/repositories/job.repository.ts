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
      SELECT j.*, jr.name as reporter_name, je.name as editor_name, fp_reporter.amount as total_payout_reporter,fp_editor.amount as total_payout_editor,  fp.payment_status as payout_status
      FROM jobs j
      LEFT JOIN users jr ON j.reporter_id = jr.id
      LEFT JOIN users je ON j.editor_id = je.id
      LEFT JOIN financial_payouts fp ON j.id = fp.job_id
      LEFT JOIN financial_payouts fp_reporter ON j.id = fp_reporter.job_id AND fp_reporter.payout_role = 'REPORTER'
      LEFT JOIN financial_payouts fp_editor ON j.id = fp_editor.job_id AND fp_editor.payout_role = 'EDITOR'
      ORDER BY j.id DESC
    `;
    const { rows } = await pool.query(query);

    return rows.map((row) => ({
      id: row.id,
      case_name: row.case_name,
      duration_minutes: row.duration_minutes,
      location_type: row.location_type,
      city: row.city,
      recording_text: row.recording_text,
      status: row.status,
      pic: {
        reporter: {
          id: row.reporter_id,
          name: row.reporter_name,
          payout: row.total_payout_reporter || 0,
          payout_status: row.payout_status,
        },
        editor: {
          id: row.editor_id,
          name: row.editor_name,
          payout: row.total_payout_editor || 0,
          payout_status: row.payout_status,
        },
      },
    }));
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
    recordingText: string,
  ): Promise<JobRow> {
    const { rows: jobRows } = await pool.query<JobRow>(
      "SELECT * FROM jobs WHERE id = $1",
      [jobId],
    );
    const job = jobRows[0];

    if (!job) throw new Error("Job not found");

    const { rows: updatedRows } = await pool.query<JobRow>(
      "UPDATE jobs SET status = $1 WHERE id = $2 RETURNING *",
      [newStatus, jobId],
    );
    const updatedJob = updatedRows[0];

    if (newStatus === "TRANSCRIBED") {
      const reporterAmount = job.duration_minutes * 2000;
      await pool.query(
        `INSERT INTO financial_payouts (job_id, user_id, payout_role, amount, payment_status)
         VALUES ($1, $2, 'REPORTER', $3, 'PENDING')
         ON CONFLICT (job_id, payout_role) DO UPDATE SET amount = $3`,
        [jobId, job.reporter_id, reporterAmount],
      );
      await pool.query(`UPDATE jobs SET recording_text = $1 WHERE id = $2`, [
        recordingText,
        jobId,
      ]);
    }

    if (newStatus === "REVIEWED") {
      const editorAmount = 50000;
      await pool.query(
        `INSERT INTO financial_payouts (job_id, user_id, payout_role, amount, payment_status)
         VALUES ($1, $2, 'EDITOR', $3, 'PENDING')
         ON CONFLICT (job_id, payout_role) DO UPDATE SET amount = $3`,
        [jobId, job.editor_id, editorAmount],
      );
    }

    if (newStatus === "COMPLETED") {
      await pool.query(
        `UPDATE financial_payouts SET payment_status = PAID WHERE job_id = $1`,
        [jobId, job.editor_id, job.reporter_id],
      );
    }

    return updatedJob;
  }
}
