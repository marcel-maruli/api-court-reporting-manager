"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = exports.getAllUsers = void 0;
const user_repository_1 = require("../repositories/user.repository");
const user_schema_1 = require("../schemas/user.schema");
const zod_1 = require("zod");
const userRepository = new user_repository_1.UserRepository();
const getAllUsers = async (req, res) => {
    try {
        const users = await userRepository.findAll();
        res.status(200).json({ success: true, data: users });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
exports.getAllUsers = getAllUsers;
const createUser = async (req, res) => {
    try {
        const validatedData = user_schema_1.CreateUserSchema.parse(req.body);
        const createPayload = {
            name: validatedData.name ?? "",
            role: validatedData.role ?? "REPORTER",
            city: validatedData.city ?? "",
            ...validatedData,
        };
        const newUser = await userRepository.create(createPayload);
        res.status(201).json({ success: true, data: newUser });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
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
exports.createUser = createUser;
