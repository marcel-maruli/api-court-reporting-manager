import express, { Request, Response } from "express";
import { ZodError } from "zod";
import { JobRepository } from "../repositories/job.repository";
import { CreateJobSchema, UpdateStatusSchema } from "../schemas/job.schema";
import OpenAI, { toFile } from "openai";

const openai = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

const jobRepo = new JobRepository();

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW: ["ASSIGNED"],
  ASSIGNED: ["TRANSCRIBED"],
  TRANSCRIBED: ["REVIEWED"],
  REVIEWED: ["COMPLETED"],
  COMPLETED: [],
};

export const createJob = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const data = CreateJobSchema.parse(req.body);
    const job = await jobRepo.create(data);
    res.status(201).json({ success: true, data: job });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, errors: error.issues });
      return;
    }
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getJobs = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const jobs = await jobRepo.findAll();
    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error",error: error instanceof Error ? error.message : error });
  }
};

export const getReporters = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const reporters = await jobRepo.findAvailableReporter(Number(req.params.id));
    if (!reporters) {
      res.status(404).json({ success: false, message: "No available reporters found" });
      return;
    }
    res.status(200).json({ success: true, data: reporters });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error: error instanceof Error ? error.message : error });
  }
};

export const assignReporterManually = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { reporterId } = req.body;
    const updatedJob = await jobRepo.assignReporter(Number(id), Number(reporterId));
    res.status(200).json({ success: true, data: updatedJob });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const assignEditorManually = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { editorId } = req.body;
    const updatedJob = await jobRepo.assignEditor(Number(id), Number(editorId));
    res.status(200).json({ success: true, data: updatedJob });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateJobStatus = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { status } = UpdateStatusSchema.parse(req.body);

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

    const updatedJob = await jobRepo.updateStatusAndCalculatePayment(
      Number(id),
      status,
    );
    res.status(200).json({ success: true, data: updatedJob });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, errors: error.issues });
      return;
    }
    console.log(error)
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const uploadAudioForTranscription = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const audioFile = await toFile(req.file.buffer, req.file.originalname, {
      type: req.file.mimetype,
    });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3",
    });

    res.json({ transcription: transcription.text });
  } catch (error: any) {
    console.error("OpenAI Error:", error);
    res.status(500).json({ error: error.message || "Failed to process audio" });
  }
};
