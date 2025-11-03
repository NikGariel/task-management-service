import { z } from "zod";
import { CreateTaskDTO } from "../dto/CreateTaskDTO";
import { UpdateTaskDTO } from "../dto/UpdateTaskDTO";
import { TaskStatus } from "../../domain/value-objects/TaskStatus";
import { ValidationException } from "../exceptions/ApplicationException";

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  description: z.string().max(1000, "Description is too long").optional(),
  dueDate: z
    .string()
    .datetime({ message: "Invalid date format. Use ISO 8601 format." })
    .optional(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  dueDate: z
    .string()
    .datetime({ message: "Invalid date format. Use ISO 8601 format." })
    .optional()
    .nullable(),
  status: z
    .enum(["pending", "in_progress", "completed", "cancelled"])
    .optional(),
});

export class TaskValidator {
  static validateCreate(data: unknown): CreateTaskDTO {
    const result = CreateTaskSchema.safeParse(data);
    
    if (!result.success) {
      const issues = result.error.issues || [];
      throw new ValidationException(
        "Validation failed",
        issues.map((err: z.ZodIssue) => ({
          path: err.path.join("."),
          message: err.message,
        }))
      );
    }
    
    return result.data;
  }

  static validateUpdate(data: unknown): UpdateTaskDTO {
    const result = UpdateTaskSchema.safeParse(data);
    
    if (!result.success) {
      const issues = result.error.issues || [];
      throw new ValidationException(
        "Validation failed",
        issues.map((err: z.ZodIssue) => ({
          path: err.path.join("."),
          message: err.message,
        }))
      );
    }
    
    return result.data;
  }

  static validateStatus(status: string): TaskStatus {
    return TaskStatus.fromString(status);
  }
}
