import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { TaskController } from "./infrastructure/http/controllers/TaskController";
import { TaskService } from "./application/services/TaskService";
import { DrizzleTaskRepository } from "./infrastructure/repositories/DrizzleTaskRepository";
import { RedisNotificationService } from "./infrastructure/services/RedisNotificationService";
import { RedisClient } from "./infrastructure/redis/RedisClient";
import { errorHandler } from "./infrastructure/http/middleware/ErrorHandler";

// Initialize infrastructure
const redisClient = new RedisClient();
const notificationService = new RedisNotificationService(redisClient);
const taskRepository = new DrizzleTaskRepository();

// Initialize application layer
const taskService = new TaskService(taskRepository, notificationService);

// Initialize HTTP layer
const taskController = new TaskController(taskService);

// Create Elysia app
const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "Task Management API",
          version: "1.0.0",
          description: "A clean architecture task management API",
        },
        tags: [
          {
            name: "Tasks",
            description: "Task management endpoints",
          },
        ],
      },
    })
  )
  .use(errorHandler)
  .use(taskController.routes())
  .get("/health", () => ({ status: "ok" }))
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
console.log(`📚 Swagger docs available at http://localhost:3000/swagger`);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await redisClient.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await redisClient.close();
  process.exit(0);
});
