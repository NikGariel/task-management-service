import { test, expect, mock, beforeEach } from "bun:test";
import { TaskService } from "../TaskService";
import { TaskRepository } from "../../../domain/repositories/TaskRepository";
import { NotificationService } from "../NotificationService";
import { Task } from "../../../domain/entities/Task";
import { TaskStatus } from "../../../domain/value-objects/TaskStatus";
import { DueDate } from "../../../domain/value-objects/DueDate";
import { NotFoundException } from "../../exceptions/ApplicationException";

let taskRepository: TaskRepository;
let notificationService: NotificationService;
let taskService: TaskService;

beforeEach(() => {
  const saveMock = mock(() => Promise.resolve({} as Task));
  const findByIdMock = mock(() => Promise.resolve(null));
  const findAllMock = mock(() => Promise.resolve([]));
  const deleteMock = mock(() => Promise.resolve());

  taskRepository = {
    save: saveMock,
    findById: findByIdMock,
    findAll: findAllMock,
    delete: deleteMock,
  } as unknown as TaskRepository;

  const scheduleNotificationMock = mock(() => Promise.resolve());

  notificationService = {
    scheduleNotification: scheduleNotificationMock,
  } as unknown as NotificationService;

  taskService = new TaskService(taskRepository, notificationService);
});

  test("createTask should create a new task", async () => {
    const dto = {
      title: "Test Task",
      description: "Test Description",
    };

    const createdTask = Task.create(
      "test-id",
      dto.title,
      dto.description,
      TaskStatus.PENDING,
      null,
      new Date(),
      new Date()
    );

    (taskRepository.save as ReturnType<typeof mock>).mockResolvedValue(createdTask);

    const result = await taskService.createTask(dto);

    expect(result.title).toBe(dto.title);
    expect(result.description).toBe(dto.description);
    expect(result.status).toBe("pending");
    expect(taskRepository.save).toHaveBeenCalledTimes(1);
  });

  test("createTask should schedule notification when due date is within 24 hours", async () => {
    const now = new Date();
    const dueDate = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours from now

    const dto = {
      title: "Test Task",
      dueDate: dueDate.toISOString(),
    };

    const createdTask = Task.create(
      "test-id",
      dto.title,
      null,
      TaskStatus.PENDING,
      DueDate.create(dueDate),
      new Date(),
      new Date()
    );

    (taskRepository.save as ReturnType<typeof mock>).mockResolvedValue(createdTask);

    await taskService.createTask(dto);

    expect(notificationService.scheduleNotification).toHaveBeenCalledTimes(1);
    expect(notificationService.scheduleNotification).toHaveBeenCalledWith(
      "test-id",
      dueDate
    );
  });

  test("createTask should not schedule notification when due date is beyond 24 hours", async () => {
    const now = new Date();
    const dueDate = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours from now

    const dto = {
      title: "Test Task",
      dueDate: dueDate.toISOString(),
    };

    const createdTask = Task.create(
      "test-id",
      dto.title,
      null,
      TaskStatus.PENDING,
      DueDate.create(dueDate),
      new Date(),
      new Date()
    );

    (taskRepository.save as ReturnType<typeof mock>).mockResolvedValue(createdTask);

    await taskService.createTask(dto);

    expect(notificationService.scheduleNotification).not.toHaveBeenCalled();
  });

  test("getTaskById should return task when found", async () => {
    const task = Task.create(
      "test-id",
      "Test Task",
      null,
      TaskStatus.PENDING,
      null,
      new Date(),
      new Date()
    );

    (taskRepository.findById as ReturnType<typeof mock>).mockResolvedValue(task);

    const result = await taskService.getTaskById("test-id");

    expect(result.id).toBe("test-id");
    expect(result.title).toBe("Test Task");
    expect(taskRepository.findById).toHaveBeenCalledWith("test-id");
  });

  test("getTaskById should throw NotFoundException when task not found", async () => {
    (taskRepository.findById as ReturnType<typeof mock>).mockResolvedValue(null);

    await expect(taskService.getTaskById("non-existent")).rejects.toThrow(NotFoundException);
  });

  test("getAllTasks should return all tasks", async () => {
    const tasks = [
      Task.create("id1", "Task 1", null, TaskStatus.PENDING, null, new Date(), new Date()),
      Task.create("id2", "Task 2", null, TaskStatus.COMPLETED, null, new Date(), new Date()),
    ];

    (taskRepository.findAll as ReturnType<typeof mock>).mockResolvedValue(tasks);

    const result = await taskService.getAllTasks();

    expect(result).toHaveLength(2);
    expect(taskRepository.findAll).toHaveBeenCalledWith(undefined);
  });

  test("getAllTasks should filter by status", async () => {
    const tasks = [
      Task.create("id1", "Task 1", null, TaskStatus.PENDING, null, new Date(), new Date()),
    ];

    (taskRepository.findAll as ReturnType<typeof mock>).mockResolvedValue(tasks);

    await taskService.getAllTasks("pending");

    expect(taskRepository.findAll).toHaveBeenCalledWith(TaskStatus.PENDING);
  });

  test("updateTask should update existing task", async () => {
    const existingTask = Task.create(
      "test-id",
      "Original Title",
      "Original Description",
      TaskStatus.PENDING,
      null,
      new Date(),
      new Date()
    );

    const updatedTask = existingTask.update(
      "Updated Title",
      "Updated Description",
      TaskStatus.COMPLETED
    );

    (taskRepository.findById as ReturnType<typeof mock>).mockResolvedValue(existingTask);
    (taskRepository.save as ReturnType<typeof mock>).mockResolvedValue(updatedTask);

    const dto = {
      title: "Updated Title",
      description: "Updated Description",
      status: "completed",
    };

    const result = await taskService.updateTask("test-id", dto);

    expect(result.title).toBe("Updated Title");
    expect(result.status).toBe("completed");
    expect(taskRepository.findById).toHaveBeenCalledWith("test-id");
    expect(taskRepository.save).toHaveBeenCalledTimes(1);
  });

  test("updateTask should throw NotFoundException when task not found", async () => {
    (taskRepository.findById as ReturnType<typeof mock>).mockResolvedValue(null);

    const dto = { title: "Updated Title" };

    await expect(taskService.updateTask("non-existent", dto)).rejects.toThrow(
      NotFoundException
    );
  });

  test("deleteTask should delete existing task", async () => {
    const task = Task.create(
      "test-id",
      "Test Task",
      null,
      TaskStatus.PENDING,
      null,
      new Date(),
      new Date()
    );

    (taskRepository.findById as ReturnType<typeof mock>).mockResolvedValue(task);

    await taskService.deleteTask("test-id");

    expect(taskRepository.findById).toHaveBeenCalledWith("test-id");
    expect(taskRepository.delete).toHaveBeenCalledWith("test-id");
  });

  test("deleteTask should throw NotFoundException when task not found", async () => {
    (taskRepository.findById as ReturnType<typeof mock>).mockResolvedValue(null);

    await expect(taskService.deleteTask("non-existent")).rejects.toThrow(NotFoundException);
  });

