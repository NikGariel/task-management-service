import { test, expect, mock, beforeEach } from "bun:test";
import { TaskController } from "../TaskController";
import { TaskService } from "../../../../application/services/TaskService";
import { TaskResponseDTO } from "../../../../application/dto/TaskResponseDTO";
import { NotFoundException, ValidationException } from "../../../../application/exceptions/ApplicationException";

let taskService: TaskService;
let taskController: TaskController;

beforeEach(() => {
  taskService = {
    createTask: mock(() => Promise.resolve({} as TaskResponseDTO)),
    getTaskById: mock(() => Promise.resolve({} as TaskResponseDTO)),
    getAllTasks: mock(() => Promise.resolve([])),
    updateTask: mock(() => Promise.resolve({} as TaskResponseDTO)),
    deleteTask: mock(() => Promise.resolve()),
  } as unknown as TaskService;

  taskController = new TaskController(taskService);
});

test("POST /tasks should create a task successfully", async () => {
  const taskDTO: TaskResponseDTO = {
    id: "test-id",
    title: "Test Task",
    description: "Test Description",
    status: "pending",
    dueDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  (taskService.createTask as ReturnType<typeof mock>).mockResolvedValue(taskDTO);

  const app = taskController.routes();
  const response = await app.handle(
    new Request("http://localhost:3000/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Task",
        description: "Test Description",
      }),
    })
  );

  expect(response.status).toBe(201);
  const data = await response.json();
  expect(data.title).toBe("Test Task");
  expect(taskService.createTask).toHaveBeenCalledTimes(1);
});

test("POST /tasks should return 400 for invalid data", async () => {
  (taskService.createTask as ReturnType<typeof mock>).mockImplementation(() => {
    throw new ValidationException("Validation failed");
  });

  const app = taskController.routes();
  const response = await app.handle(
    new Request("http://localhost:3000/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "", // Invalid: empty title
      }),
    })
  );

  expect(response.status).toBe(400);
});

test("GET /tasks should return all tasks", async () => {
  const tasks: TaskResponseDTO[] = [
    {
      id: "id1",
      title: "Task 1",
      description: null,
      status: "pending",
      dueDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "id2",
      title: "Task 2",
      description: null,
      status: "completed",
      dueDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  (taskService.getAllTasks as ReturnType<typeof mock>).mockResolvedValue(tasks);

  const app = taskController.routes();
  const response = await app.handle(
    new Request("http://localhost:3000/tasks", {
      method: "GET",
    })
  );

  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data).toHaveLength(2);
  expect(taskService.getAllTasks).toHaveBeenCalledWith(undefined);
});

test("GET /tasks?status=pending should filter tasks by status", async () => {
  const tasks: TaskResponseDTO[] = [
    {
      id: "id1",
      title: "Task 1",
      description: null,
      status: "pending",
      dueDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  (taskService.getAllTasks as ReturnType<typeof mock>).mockResolvedValue(tasks);

  const app = taskController.routes();
  const response = await app.handle(
    new Request("http://localhost:3000/tasks?status=pending", {
      method: "GET",
    })
  );

  expect(response.status).toBe(200);
  expect(taskService.getAllTasks).toHaveBeenCalledWith("pending");
});

test("GET /tasks/:id should return task by id", async () => {
  const task: TaskResponseDTO = {
    id: "test-id",
    title: "Test Task",
    description: null,
    status: "pending",
    dueDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  (taskService.getTaskById as ReturnType<typeof mock>).mockResolvedValue(task);

  const app = taskController.routes();
  const response = await app.handle(
    new Request("http://localhost:3000/tasks/test-id", {
      method: "GET",
    })
  );

  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.id).toBe("test-id");
  expect(taskService.getTaskById).toHaveBeenCalledWith("test-id");
});

test("GET /tasks/:id should return 404 when task not found", async () => {
  (taskService.getTaskById as ReturnType<typeof mock>).mockImplementation(() => {
    throw new NotFoundException("Task", "non-existent");
  });

  const app = taskController.routes();
  const response = await app.handle(
    new Request("http://localhost:3000/tasks/non-existent", {
      method: "GET",
    })
  );

  expect(response.status).toBe(404);
  const data = await response.json();
  expect(data.error).toBeDefined();
});

test("PUT /tasks/:id should update task successfully", async () => {
  const updatedTask: TaskResponseDTO = {
    id: "test-id",
    title: "Updated Title",
    description: "Updated Description",
    status: "completed",
    dueDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  (taskService.updateTask as ReturnType<typeof mock>).mockResolvedValue(updatedTask);

  const app = taskController.routes();
  const response = await app.handle(
    new Request("http://localhost:3000/tasks/test-id", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Updated Title",
        status: "completed",
      }),
    })
  );

  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.title).toBe("Updated Title");
  expect(data.status).toBe("completed");
  expect(taskService.updateTask).toHaveBeenCalledTimes(1);
});

test("PUT /tasks/:id should return 404 when task not found", async () => {
  (taskService.updateTask as ReturnType<typeof mock>).mockImplementation(() => {
    throw new NotFoundException("Task", "non-existent");
  });

  const app = taskController.routes();
  const response = await app.handle(
    new Request("http://localhost:3000/tasks/non-existent", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Title" }),
    })
  );

  expect(response.status).toBe(404);
});

test("DELETE /tasks/:id should delete task successfully", async () => {
  const app = taskController.routes();
  const response = await app.handle(
    new Request("http://localhost:3000/tasks/test-id", {
      method: "DELETE",
    })
  );

  expect(response.status).toBe(204);
  expect(taskService.deleteTask).toHaveBeenCalledWith("test-id");
});

test("DELETE /tasks/:id should return 404 when task not found", async () => {
  (taskService.deleteTask as ReturnType<typeof mock>).mockImplementation(() => {
    throw new NotFoundException("Task", "non-existent");
  });

  const app = taskController.routes();
  const response = await app.handle(
    new Request("http://localhost:3000/tasks/non-existent", {
      method: "DELETE",
    })
  );

  expect(response.status).toBe(404);
});

