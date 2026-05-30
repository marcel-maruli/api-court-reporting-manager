import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DB_HOST,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
});

export const initDatabase = async (): Promise<void> => {
  const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('REPORTER', 'EDITOR')),
        city VARCHAR(100) NOT NULL,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
      
    CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        case_name VARCHAR(255) NOT NULL,
        duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
        location_type VARCHAR(20) NOT NULL CHECK (location_type IN ('PHYSICAL', 'REMOTE')),
        city VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'NEW' 
            CHECK (status IN ('NEW', 'ASSIGNED', 'TRANSCRIBED', 'REVIEWED', 'COMPLETED')),
        reporter_id INT REFERENCES users(id) ON DELETE SET NULL,
        editor_id INT REFERENCES users(id) ON DELETE SET NULL,
        recording_text VARCHAR(5000) NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS financial_payouts (
        id SERIAL PRIMARY KEY,
        job_id INT REFERENCES jobs(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        payout_role VARCHAR(20) NOT NULL CHECK (payout_role IN ('REPORTER', 'EDITOR')),
        amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00, 
        payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_job_role_payout UNIQUE (job_id, payout_role)
    );
  `;

  try {
    // Jalankan kueri pembuatan tabel
    await pool.query(createUsersTableQuery);
    console.log("✅ Database initialization successful (Tables are ready).");
  } catch (error) {
    console.error("❌ Failed to initialize database tables:", error);
    process.exit(1);
  }
};

export const seedInitialData = async (): Promise<void> => {
  try {
    const checkUsers = await pool.query("SELECT id FROM users LIMIT 1");
    if (checkUsers.rows.length === 0) {
      await pool.query(`
        INSERT INTO users (name, role, city, is_available) VALUES
        ('John Doe', 'REPORTER', 'New York', true),
        ('Jane Smith', 'REPORTER', 'Los Angeles', true),
        ('Michael Brown', 'REPORTER', 'New York', false),
        ('Alice Johnson', 'EDITOR', 'New York', true),
        ('David Miller', 'EDITOR', 'Los Angeles', true);
      `);
      console.log('🌱 Seed data for "users" successfully inserted.');
    }

    const checkJobs = await pool.query("SELECT id FROM jobs LIMIT 1");
    if (checkJobs.rows.length === 0) {
      const reporters = await pool.query(
        "SELECT id FROM users WHERE role = 'REPORTER' ORDER BY id ASC",
      );
      const editors = await pool.query(
        "SELECT id FROM users WHERE role = 'EDITOR' ORDER BY id ASC",
      );

      const reporter1 = reporters.rows[0].id;
      const reporter2 = reporters.rows[1].id;
      const editor1 = editors.rows[0].id;

      await pool.query(`
        INSERT INTO jobs (case_name, duration_minutes, location_type, city, status, reporter_id, editor_id, recording_text) VALUES
        ('Corporate Dispute PT A vs Corp B', 45, 'PHYSICAL', 'New York', 'NEW', null, null, null),
        ('Music Copyright Infringement Hearing', 60, 'PHYSICAL', 'New York', 'ASSIGNED', ${reporter1}, null, null),
        ('Anti-Corruption Criminal Case Trial', 120, 'REMOTE', 'Los Angeles', 'TRANSCRIBED', ${reporter2}, null, null),
        ('Expert Witness Examination - Civil Lawsuit', 90, 'PHYSICAL', 'New York', 'REVIEWED', ${reporter1}, ${editor1}, null),
        ('International Commercial Arbitration Hearing', 150, 'REMOTE', 'New York', 'COMPLETED', ${reporter1}, ${editor1}, null);
      `);
      console.log('🌱 Seed data for "jobs" successfully inserted.');
    }

    const checkPayouts = await pool.query(
      "SELECT id FROM financial_payouts LIMIT 1",
    );
    if (checkPayouts.rows.length === 0) {
      const jobTranscribed = await pool.query(
        "SELECT id, reporter_id FROM jobs WHERE status = 'TRANSCRIBED' LIMIT 1",
      );
      const jobReviewed = await pool.query(
        "SELECT id, reporter_id, editor_id FROM jobs WHERE status = 'REVIEWED' LIMIT 1",
      );
      const jobCompleted = await pool.query(
        "SELECT id, reporter_id, editor_id FROM jobs WHERE status = 'COMPLETED' LIMIT 1",
      );

      if (jobTranscribed.rows.length > 0) {
        const j = jobTranscribed.rows[0];
        await pool.query(`
          INSERT INTO financial_payouts (job_id, user_id, payout_role, amount, payment_status)
          VALUES (${j.id}, ${j.reporter_id}, 'REPORTER', 240000.00, 'PENDING');
        `);
      }

      if (jobReviewed.rows.length > 0) {
        const j = jobReviewed.rows[0];
        await pool.query(`
          INSERT INTO financial_payouts (job_id, user_id, payout_role, amount, payment_status) VALUES
          (${j.id}, ${j.reporter_id}, 'REPORTER', 180000.00, 'PENDING'),
          (${j.id}, ${j.editor_id}, 'EDITOR', 50000.00, 'PENDING'); 
        `);
      }

      if (jobCompleted.rows.length > 0) {
        const j = jobCompleted.rows[0];
        await pool.query(`
          INSERT INTO financial_payouts (job_id, user_id, payout_role, amount, payment_status) VALUES
          (${j.id}, ${j.reporter_id}, 'REPORTER', 300000.00, 'PAID'),
          (${j.id}, ${j.editor_id}, 'EDITOR', 50000.00, 'PAID');
        `);
      }

      console.log(
        '🌱 Seed data for "financial_payouts" successfully inserted.',
      );
    }
  } catch (error) {
    console.error("❌ Failed to insert seed data:", error);
  }
};
