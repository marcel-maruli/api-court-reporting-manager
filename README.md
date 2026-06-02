# Court Reporting Manager API

A robust backend API designed to manage court reporting workflows, including job assignments, automated AI-powered transcriptions, and financial payout tracking for Reporters and Editors.

## 🚀 Key Features

- **Job Lifecycle Management:** Handle the full workflow from `NEW` status through `ASSIGNED`, `TRANSCRIBED`, `REVIEWED`, to `COMPLETED`.
- **AI-Powered Transcription:** Integrated with OpenAI/Groq API using the `whisper-large-v3` model to automatically transcribe uploaded audio files.
- **Automated Payouts:** Trigger-based payment logic that calculates earnings and updates payment statuses automatically based on job completion status.
- **Smart Assignments:** Automated filtering for available Reporters, with location-based matching for physical hearings.
- **Data Integrity:** Robust database schema with `UNIQUE` constraints for financial records to prevent duplication.

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL (via `pg` pool)
- **Validation:** Zod
- **AI Integration:** OpenAI SDK (configured for Groq)
- **File Handling:** Multer

## 📋 Installation Guide

### 1. Clone the Repository

```bash
git clone [https://github.com/marcel-maruli/api-court-reporting-manager.git](https://github.com/marcel-maruli/api-court-reporting-manager.git)
cd api-court-reporting-manager
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a .env file in the root directory and add the following configuration:

```bash
GROQ_API_KEY=your_groq_api_key_here
DB_HOST=your_postgresql_connection_string_here
PORT=3000
```

### 4. Run the Application

```bash
npm run dev
```

### 5. Project Structure

```bash
/config: Database configuration and initialization scripts.
/controllers: Request handlers for jobs, users, and transcription processes.
/repositories: Data access layer handling all SQL queries.
/schemas: Zod validation schemas for request bodies.
/interfaces: TypeScript definitions and models.
```

### 6. API Endpoints

| Method | Endpoint             | Description                              |
| ------ | -------------------- | ---------------------------------------- |
| POST   | /upload-audio        | Upload audio and get text transcription  |
| GET    | /api/jobs            | Retrieve all jobs with payout data       |
| POST   | /api/jobs            | Create a new job                         |
| PATCH  | /api/jobs/:id/status | Update status (triggers financial logic) |
| GET    | /api/users           | List all users                           |
| POST   | /api/users           | Create a new reporter/editor             |
