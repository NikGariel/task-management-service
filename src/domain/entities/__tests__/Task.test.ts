import { test, expect } from "bun:test";
import { Task } from "../Task";
import { TaskStatus } from "../../value-objects/TaskStatus";
import { DueDate } from "../../value-objects/DueDate";

test("Task.create should create a new task", () => {
  const id = crypto.randomUUID();
  const title = "Test Task";
  const description = "Test Description";
  const createdAt = new Date();
  const updatedAt = new Date();

  const task = Task.create(
    id,
    title,
    description,
    TaskStatus.PENDING,
    null,
    createdAt,
    updatedAt
  );

  expect(task.id).toBe(id);
  expect(task.title).toBe(title);
  expect(task.description).toBe(description);
  expect(task.status).toEqual(TaskStatus.PENDING);
  expect(task.dueDate).toBeNull();
  expect(task.createdAt).toEqual(createdAt);
  expect(task.updatedAt).toEqual(updatedAt);
});

test("Task.fromPersistence should recreate task from database row", () => {
  const id = crypto.randomUUID();
  const title = "Test Task";
  const description = "Test Description";
  const status = "pending";
  const dueDate = new Date("2024-12-31T23:59:59Z");
  const createdAt = new Date();
  const updatedAt = new Date();

  const task = Task.fromPersistence(
    id,
    title,
    description,
    status,
    dueDate,
    createdAt,
    updatedAt
  );

  expect(task.id).toBe(id);
  expect(task.title).toBe(title);
  expect(task.description).toBe(description);
  expect(task.status).toEqual(TaskStatus.PENDING);
  expect(task.dueDate?.value).toEqual(dueDate);
});

test("Task.complete should change status to completed", () => {
  const task = Task.create(
    crypto.randomUUID(),
    "Test Task",
    null,
    TaskStatus.PENDING,
    null,
    new Date(),
    new Date()
  );

  const completedTask = task.complete();

  expect(completedTask.status).toEqual(TaskStatus.COMPLETED);
  expect(completedTask.id).toBe(task.id);
  expect(completedTask.title).toBe(task.title);
});

test("Task.update should update task fields", () => {
  const task = Task.create(
    crypto.randomUUID(),
    "Original Title",
    "Original Description",
    TaskStatus.PENDING,
    null,
    new Date(),
    new Date()
  );

  const newTitle = "Updated Title";
  const newDescription = "Updated Description";
  const newStatus = TaskStatus.IN_PROGRESS;

  const updatedTask = task.update(newTitle, newDescription, newStatus);

  expect(updatedTask.title).toBe(newTitle);
  expect(updatedTask.description).toBe(newDescription);
  expect(updatedTask.status).toEqual(newStatus);
  expect(updatedTask.id).toBe(task.id);
  expect(updatedTask.createdAt).toEqual(task.createdAt);
});

test("Task.update should preserve original values when undefined", () => {
  const task = Task.create(
    crypto.randomUUID(),
    "Original Title",
    "Original Description",
    TaskStatus.PENDING,
    null,
    new Date(),
    new Date()
  );

  const updatedTask = task.update(undefined, undefined, undefined);

  expect(updatedTask.title).toBe("Original Title");
  expect(updatedTask.description).toBe("Original Description");
  expect(updatedTask.status).toEqual(TaskStatus.PENDING);
});

test("Task.isDueWithinHours should return true for tasks due within hours", () => {
  const now = new Date();
  const dueDate = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours from now
  const task = Task.create(
    crypto.randomUUID(),
    "Test Task",
    null,
    TaskStatus.PENDING,
    DueDate.create(dueDate),
    new Date(),
    new Date()
  );

  expect(task.isDueWithinHours(24)).toBe(true);
  expect(task.isDueWithinHours(10)).toBe(false);
});

test("Task.isDueWithinHours should return false when no due date", () => {
  const task = Task.create(
    crypto.randomUUID(),
    "Test Task",
    null,
    TaskStatus.PENDING,
    null,
    new Date(),
    new Date()
  );

  expect(task.isDueWithinHours(24)).toBe(false);
});

test("Task.update should allow setting dueDate to null", () => {
  const dueDate = DueDate.create(new Date("2024-12-31T23:59:59Z"));
  const task = Task.create(
    crypto.randomUUID(),
    "Test Task",
    null,
    TaskStatus.PENDING,
    dueDate,
    new Date(),
    new Date()
  );

  const updatedTask = task.update(undefined, undefined, undefined, null);

  expect(updatedTask.dueDate).toBeNull();
});

