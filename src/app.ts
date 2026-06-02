import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import {
  initDatabase,
  seedInitialData,
  pool,
} from "./config/database";
import {
  createJob,
  getJobs,
  autoAssignReporter,
  assignEditorManually,
  updateJobStatus,
  uploadAudioForTranscription,
  getReporters,
} from "./controllers/job.controller";
import { createUser, getAllUsers } from "./controllers/user.controller";
import multer from "multer";

const app = express();

const upload = multer({ storage: multer.memoryStorage() });
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.post("/upload-audio", upload.single("audio"), uploadAudioForTranscription);
app.get("/api/users", getAllUsers);
app.post("/api/users", createUser);

app.post("/api/jobs", createJob);
app.get("/api/jobs", getJobs);
app.get("/api/jobs/:id/reporters", getReporters); 
app.post("/api/jobs/:id/assign-reporter", autoAssignReporter);
app.post("/api/jobs/:id/assign-editor", assignEditorManually);
app.patch("/api/jobs/:id/status", updateJobStatus);

if (process.env.NODE_ENV !== "production") {
  pool
    .connect()
    .then(async () => {
      await initDatabase();       // Only run once to create tables, comment out after first run
      await seedInitialData();   // Only run once to seed initial data, comment out after first run
      app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch((err) => console.error("Connection to DB failed:", err));
}

export default app;
