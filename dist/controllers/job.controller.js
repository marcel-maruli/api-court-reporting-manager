"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAudioForTranscription = exports.updateJobStatus = exports.assignEditorManually = exports.autoAssignReporter = exports.getJobs = exports.createJob = void 0;
const zod_1 = require("zod");
const job_repository_1 = require("../repositories/job.repository");
const job_schema_1 = require("../schemas/job.schema");
const openai_1 = __importStar(require("openai"));
const openai = new openai_1.default({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY,
});
const jobRepo = new job_repository_1.JobRepository();
const VALID_STATUS_TRANSITIONS = {
    NEW: ["ASSIGNED"],
    ASSIGNED: ["TRANSCRIBED"],
    TRANSCRIBED: ["REVIEWED"],
    REVIEWED: ["COMPLETED"],
    COMPLETED: [],
};
const createJob = async (req, res) => {
    try {
        const data = job_schema_1.CreateJobSchema.parse(req.body);
        const job = await jobRepo.create(data);
        res.status(201).json({ success: true, data: job });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            res.status(400).json({ success: false, errors: error.issues });
            return;
        }
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
exports.createJob = createJob;
const getJobs = async (req, res) => {
    try {
        const jobs = await jobRepo.findAll();
        res.status(200).json({ success: true, data: jobs });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
exports.getJobs = getJobs;
const autoAssignReporter = async (req, res) => {
    try {
        const { id } = req.params;
        const reporter = await jobRepo.findAvailableReporter(Number(id));
        if (!reporter) {
            res.status(404).json({
                success: false,
                message: "No available reporters found for this location or criteria at the moment",
            });
            return;
        }
        const updatedJob = await jobRepo.assignReporter(Number(id), reporter.id);
        res.status(200).json({
            success: true,
            message: `Successfully assigned reporter ${reporter.name} to the job`,
            data: updatedJob,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
exports.autoAssignReporter = autoAssignReporter;
const assignEditorManually = async (req, res) => {
    try {
        const { id } = req.params;
        const { editorId } = req.body;
        const updatedJob = await jobRepo.assignEditor(Number(id), Number(editorId));
        res.status(200).json({ success: true, data: updatedJob });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
exports.assignEditorManually = assignEditorManually;
const updateJobStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = job_schema_1.UpdateStatusSchema.parse(req.body);
        const currentJob = await jobRepo.findById(Number(id));
        if (!currentJob) {
            res
                .status(404)
                .json({ success: false, message: "Job assignment not found" });
            return;
        }
        const allowedTransitions = VALID_STATUS_TRANSITIONS[currentJob.status];
        if (!allowedTransitions.includes(status)) {
            res.status(400).json({
                success: false,
                message: `Illegal status transition from ${currentJob.status} to ${status}`,
            });
            return;
        }
        const updatedJob = await jobRepo.updateStatusAndCalculatePayment(Number(id), status);
        res.status(200).json({ success: true, data: updatedJob });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            res.status(400).json({ success: false, errors: error.issues });
            return;
        }
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
exports.updateJobStatus = updateJobStatus;
const uploadAudioForTranscription = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Tidak ada file yang diunggah" });
        }
        const audioFile = await (0, openai_1.toFile)(req.file.buffer, req.file.originalname, {
            type: req.file.mimetype,
        });
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-large-v3",
        });
        res.json({ transcription: transcription.text });
    }
    catch (error) {
        console.error("OpenAI Error:", error);
        res.status(500).json({ error: error.message || "Gagal memproses audio" });
    }
};
exports.uploadAudioForTranscription = uploadAudioForTranscription;
