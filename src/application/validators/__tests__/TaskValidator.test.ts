import { test, expect } from "bun:test";
import { TaskValidator } from "../TaskValidator";
import { ValidationException } from "../../exceptions/ApplicationException";

test("TaskValidator.validateCreate should validate correct task data", () => {
  const validData = {
    title: "Test Task",
    description: "Test Description",
    dueDate: "2024-12-31T23:59:59Z",
  };

  const result = TaskValidator.validateCreate(validData);

  expect(result.title).toBe(validData.title);
  expect(result.description).toBe(validData.description);
  expect(result.dueDate).toBe(validData.dueDate);
});

test("TaskValidator.validateCreate should accept minimal required fields", () => {
  const validData = {
    title: "Test Task",
  };

  const result = TaskValidator.validateCreate(validData);

  expect(result.title).toBe(validData.title);
  expect(result.description).toBeUndefined();
  expect(result.dueDate).toBeUndefined();
});

test("TaskValidator.validateCreate should throw ValidationException for missing title", () => {
  const invalidData = {
    description: "Test Description",
  };

  expect(() => TaskValidator.validateCreate(invalidData)).toThrow(ValidationException);
});

test("TaskValidator.validateCreate should throw ValidationException for empty title", () => {
  const invalidData = {
    title: "",
  };

  expect(() => TaskValidator.validateCreate(invalidData)).toThrow(ValidationException);
});

test("TaskValidator.validateCreate should throw ValidationException for too long title", () => {
  const invalidData = {
    title: "a".repeat(256), // 256 characters
  };

  expect(() => TaskValidator.validateCreate(invalidData)).toThrow(ValidationException);
});

test("TaskValidator.validateCreate should throw ValidationException for too long description", () => {
  const invalidData = {
    title: "Test Task",
    description: "a".repeat(1001), // 1001 characters
  };

  expect(() => TaskValidator.validateCreate(invalidData)).toThrow(ValidationException);
});

test("TaskValidator.validateCreate should throw ValidationException for invalid date format", () => {
  const invalidData = {
    title: "Test Task",
    dueDate: "invalid-date",
  };

  expect(() => TaskValidator.validateCreate(invalidData)).toThrow(ValidationException);
});

test("TaskValidator.validateUpdate should validate correct update data", () => {
  const validData = {
    title: "Updated Title",
    status: "completed",
  };

  const result = TaskValidator.validateUpdate(validData);

  expect(result.title).toBe(validData.title);
  expect(result.status).toBe(validData.status);
});

test("TaskValidator.validateUpdate should accept partial updates", () => {
  const validData = {
    status: "in_progress",
  };

  const result = TaskValidator.validateUpdate(validData);

  expect(result.status).toBe(validData.status);
  expect(result.title).toBeUndefined();
});

test("TaskValidator.validateUpdate should allow null description", () => {
  const validData = {
    title: "Test Task",
    description: null,
  };

  const result = TaskValidator.validateUpdate(validData);

  expect(result.title).toBe(validData.title);
  expect(result.description).toBeNull();
});

test("TaskValidator.validateUpdate should throw ValidationException for invalid status", () => {
  const invalidData = {
    status: "invalid_status",
  };

  expect(() => TaskValidator.validateUpdate(invalidData)).toThrow(ValidationException);
});

test("TaskValidator.validateStatus should parse valid status strings", () => {
  const status1 = TaskValidator.validateStatus("pending");
  const status2 = TaskValidator.validateStatus("completed");
  const status3 = TaskValidator.validateStatus("in_progress");

  expect(status1.value).toBe("pending");
  expect(status2.value).toBe("completed");
  expect(status3.value).toBe("in_progress");
});

test("TaskValidator.validateStatus should throw error for invalid status", () => {
  expect(() => TaskValidator.validateStatus("invalid")).toThrow("Invalid task status");
});

