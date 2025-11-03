import { Elysia } from "elysia";
import { z } from "zod";
import { TaskService } from "../../../application/services/TaskService";
import { TaskValidator } from "../../../application/validators/TaskValidator";
import { DEFAULT_PAGE, DEFAULT_LIMIT } from "../../../application/dto/PaginationParams";
import {
  ApplicationException,
  NotFoundException,
  ValidationException,
} from "../../../application/exceptions/ApplicationException";

export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  routes() {
    return new Elysia()
      .post(
        "/tasks",
        async ({ body, set }) => {
          try {
            const validated = TaskValidator.validateCreate(body);
            const task = await this.taskService.createTask(validated);
            set.status = 201;
            return task;
          } catch (error) {
            if (error instanceof z.ZodError) {
              set.status = 400;
              return {
                error: "Validation error",
                details: error.message,
              };
            }
            if (error instanceof ValidationException) {
              set.status = error.statusCode;
              return { error: error.message, details: error.errors };
            }
            if (error instanceof ApplicationException) {
              set.status = error.statusCode;
              return { error: error.message };
            }
            set.status = 400;
            return { error: error instanceof Error ? error.message : "Validation error" };
          }
        },
        {
          detail: {
            tags: ["Tasks"],
            summary: "Create a new task",
          },
        }
      )
      .get(
        "/tasks",
        async ({ query, set }) => {
          try {
            const queryParams = query as {
              status?: string;
              page?: string;
              limit?: string;
            };

            // Always use pagination (default values if not provided)
            const page = queryParams.page
              ? parseInt(queryParams.page, 10)
              : DEFAULT_PAGE;
            const limit = queryParams.limit
              ? parseInt(queryParams.limit, 10)
              : DEFAULT_LIMIT;

            // Validate numeric values
            if (queryParams.page && (isNaN(page) || page < 1)) {
              set.status = 400;
              return { error: "Page must be a positive integer" };
            }

            if (queryParams.limit && (isNaN(limit) || limit < 1)) {
              set.status = 400;
              return { error: "Limit must be a positive integer" };
            }

            const result = await this.taskService.getTasksPaginated(
              page,
              limit,
              queryParams.status
            );
            set.status = 200;
            return result;
          } catch (error) {
            if (error instanceof ValidationException) {
              set.status = error.statusCode;
              return { error: error.message, details: error.errors };
            }
            if (error instanceof ApplicationException) {
              set.status = error.statusCode;
              return { error: error.message };
            }
            if (error instanceof Error) {
              set.status = 500;
              return { error: error.message };
            }
            throw error;
          }
        },
        {
          detail: {
            tags: ["Tasks"],
            summary: "Get all tasks",
            description:
              "Get all tasks with optional status filter. Supports pagination via page and limit query parameters.",
            parameters: [
              {
                name: "status",
                in: "query",
                schema: {
                  type: "string",
                  enum: ["pending", "in_progress", "completed", "cancelled"],
                },
                description: "Filter tasks by status",
              },
              {
                name: "page",
                in: "query",
                schema: {
                  type: "integer",
                  minimum: 1,
                  default: 1,
                },
                description: "Page number (used with limit for pagination)",
              },
              {
                name: "limit",
                in: "query",
                schema: {
                  type: "integer",
                  minimum: 1,
                  maximum: 100,
                  default: 10,
                },
                description: "Number of items per page (used with page for pagination)",
              },
            ],
          },
        }
      )
      .get(
        "/tasks/:id",
        async ({ params, set }) => {
          try {
            const task = await this.taskService.getTaskById(params.id);
            set.status = 200;
            return task;
          } catch (error) {
            if (error instanceof NotFoundException) {
              set.status = error.statusCode;
              return { error: error.message };
            }
            if (error instanceof ApplicationException) {
              set.status = error.statusCode;
              return { error: error.message };
            }
            set.status = 500;
            return { error: "Internal server error" };
          }
        },
        {
          detail: {
            tags: ["Tasks"],
            summary: "Get task by ID",
          },
        }
      )
      .put(
        "/tasks/:id",
        async ({ params, body, set }) => {
          try {
            const validated = TaskValidator.validateUpdate(body);
            const task = await this.taskService.updateTask(params.id, validated);
            set.status = 200;
            return task;
          } catch (error) {
            if (error instanceof NotFoundException) {
              set.status = error.statusCode;
              return { error: error.message };
            }
            if (error instanceof ValidationException) {
              set.status = error.statusCode;
              return { error: error.message, details: error.errors };
            }
            if (error instanceof ApplicationException) {
              set.status = error.statusCode;
              return { error: error.message };
            }
            set.status = 500;
            return { error: "Internal server error" };
          }
        },
        {
          detail: {
            tags: ["Tasks"],
            summary: "Update task",
          },
        }
      )
      .delete(
        "/tasks/:id",
        async ({ params, set }) => {
          try {
            await this.taskService.deleteTask(params.id);
            set.status = 204;
            return;
          } catch (error) {
            if (error instanceof NotFoundException) {
              set.status = error.statusCode;
              return { error: error.message };
            }
            if (error instanceof ApplicationException) {
              set.status = error.statusCode;
              return { error: error.message };
            }
            set.status = 500;
            return { error: "Internal server error" };
          }
        },
        {
          detail: {
            tags: ["Tasks"],
            summary: "Delete task",
          },
        }
      );
  }
}

