"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const database_1 = require("./config/database");
const job_controller_1 = require("./controllers/job.controller");
const user_controller_1 = require("./controllers/user.controller");
const multer_1 = __importDefault(require("multer"));
const app = (0, express_1.default)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const PORT = 3000;
app.use(express_1.default.json());
app.post("/upload-audio", upload.single("audio"), job_controller_1.uploadAudioForTranscription);
app.get("/api/users", user_controller_1.getAllUsers);
app.post("/api/users", user_controller_1.createUser);
app.post("/api/jobs", job_controller_1.createJob);
app.get("/api/jobs", job_controller_1.getJobs);
app.post("/api/jobs/:id/assign-reporter", job_controller_1.autoAssignReporter);
app.post("/api/jobs/:id/assign-editor", job_controller_1.assignEditorManually);
app.patch("/api/jobs/:id/status", job_controller_1.updateJobStatus);
database_1.pool
    .connect()
    .then(async () => {
    // await initDatabase(); Only run once to create tables, comment out after first run
    // await seedInitialData();  Only run once to seed initial data, comment out after first run
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
})
    .catch((err) => console.error("Connection to DB failed:", err));
