# Court Reporting Manager API

A robust backend API for managing court reporting workflows, including job assignments, AI-powered transcription, and automated financial payout tracking for Reporters and Editors.

## 🚀 Live API

You can test the API using Postman, Insomnia, or any HTTP client:

**Base URL**

```text
https://api-court-reporting-manager-esfx.vercel.app/
```

---

## 📸 Sample Response

![Postman API Response](./assets/api-response-screenshot.png)

---

## ✨ Features

### Job Lifecycle Management

Manage court reporting jobs through the complete workflow:

```text
NEW
 ↓
ASSIGNED
 ↓
TRANSCRIBED
 ↓
REVIEWED
 ↓
COMPLETED
```

### AI-Powered Transcription

- Upload court hearing audio recordings
- Automatic transcription using Groq/OpenAI integration
- Powered by `whisper-large-v3`

### Automated Payout System

- Trigger-based payment calculation
- Automatic earnings updates when jobs are completed
- Prevents duplicate payout records using database constraints

### Smart Reporter Assignment

- Automatically identifies available reporters
- Supports location-based matching for physical hearings
- Handles both physical and virtual assignments

### Data Integrity

- PostgreSQL relational database
- Unique constraints for financial records
- Request validation using Zod schemas

---

## 🛠️ Tech Stack

| Category       | Technology                       |
| -------------- | -------------------------------- |
| Runtime        | Node.js                          |
| Framework      | Express.js                       |
| Language       | TypeScript                       |
| Database       | PostgreSQL (`pg`)                |
| Validation     | Zod                              |
| AI Integration | OpenAI SDK (configured for Groq) |
| File Uploads   | Multer                           |

---

# 📦 Installation

## 1. Clone the Repository

```bash
git clone https://github.com/marcel-maruli/api-court-reporting-manager.git

cd api-court-reporting-manager
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
DB_HOST=posgresql_database_url_here
PORT=3000
```

## 4. Start the Development Server

```bash
npm run dev
```

---

# 📂 Project Structure

```text
├── config/         # Database configuration and initialization
├── controllers/    # Request handlers
├── repositories/   # SQL queries and data access layer
├── schemas/        # Zod validation schemas
├── interfaces/     # TypeScript interfaces and models
├── middleware/     # Express middleware
├── routes/         # API routes
└── uploads/        # Uploaded audio files
```

---

# 📖 API Documentation

## Jobs

### Create a New Job

**Endpoint**

```http
POST /api/jobs
```

**Request Body**

```json
{
  "case_name": "Corporate Dispute PT A vs Corp B",
  "duration_minutes": 45,
  "location_type": "PHYSICAL",
  "city": "New York"
}
```

**Response — 201 Created**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "case_name": "Corporate Dispute PT A vs Corp B",
    "status": "NEW",
    "created_at": "2026-06-02T12:00:00.000Z"
  }
}
```

---

### Get All Jobs

**Endpoint**

```http
GET /api/jobs
```

**Description**

Returns all jobs along with payout and assignment information.

---

### Update Job Status

**Endpoint**

```http
PATCH /api/jobs/:id/status
```

**Request Body**

```json
{
  "status": "TRANSCRIBED",
  "recordingText": "This is the transcript content..."
}
```

**Response — 200 OK**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "TRANSCRIBED",
    "recording_text": "This is the transcript content..."
  }
}
```

---

## Audio Transcription

### Upload Audio for Transcription

**Endpoint**

```http
POST /upload-audio
```

**Content Type**

```text
multipart/form-data
```

**Form Data**

| Field | Type | Required |
| ----- | ---- | -------- |
| audio | File | Yes      |

**Response — 200 OK**

```json
{
  "transcription": "The court will now come to order."
}
```

---

## Users

### Create a User

**Endpoint**

```http
POST /api/users
```

**Description**

Creates a new Reporter or Editor.

---

### Get All Users

**Endpoint**

```http
GET /api/users
```

**Description**

Returns all registered users.

---

# 🔄 Job Status Flow

```text
NEW
 └── ASSIGNED
      └── TRANSCRIBED
            └── REVIEWED
                  └── COMPLETED
```

### Business Logic

- When a job is created, its status is `NEW`.
- Assigned reporters move the job to `ASSIGNED`.
- Audio transcription updates the status to `TRANSCRIBED`.
- Editors review transcripts and update the status to `REVIEWED`.
- Completing the workflow triggers automated payout calculations.

---

# 🔒 Validation & Error Handling

The API uses **Zod** for request validation.

Example validation response:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "case_name",
      "message": "Case name is required"
    }
  ]
}
```

# 👨‍💻 Author

**Marcel Maruli**

GitHub: https://github.com/marcel-maruli
