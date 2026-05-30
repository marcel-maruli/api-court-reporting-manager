"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateStatusSchema = exports.AssignUserSchema = exports.CreateJobSchema = void 0;
const zod_1 = require("zod");
exports.CreateJobSchema = zod_1.z.object({
    case_name: zod_1.z.string().min(3),
    duration_minutes: zod_1.z.number().positive(),
    location_type: zod_1.z.enum(['PHYSICAL', 'REMOTE']),
    city: zod_1.z.string().min(2),
});
exports.AssignUserSchema = zod_1.z.object({
    userId: zod_1.z.number().positive(),
});
exports.UpdateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['NEW', 'ASSIGNED', 'TRANSCRIBED', 'REVIEWED', 'COMPLETED']),
});
