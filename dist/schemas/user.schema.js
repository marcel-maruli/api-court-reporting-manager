"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserSchema = void 0;
const zod_1 = require("zod");
exports.CreateUserSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: "Format email tidak valid" }),
    age: zod_1.z.number().min(18, { message: "Umur minimal harus 18 tahun" }),
});
