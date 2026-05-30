import { Request, Response } from "express";
import { UserRepository } from "../repositories/user.repository";
import { CreateUserSchema } from "../schemas/user.schema";
import { ZodError } from "zod";

const userRepository = new UserRepository();

export const getAllUsers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const users = await userRepository.findAll();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const createUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const validatedData = CreateUserSchema.parse(req.body);

    const createPayload = {
      name: (validatedData as any).name ?? "",
      role: (validatedData as any).role ?? "REPORTER",
      city: (validatedData as any).city ?? "",
      ...validatedData,
    };

    const newUser = await userRepository.create(createPayload);

    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: "Validasi gagal",
        errors: error.issues.map((err) => ({
          field: err.path[0],
          message: err.message,
        })),
      });
      return;
    }

    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
