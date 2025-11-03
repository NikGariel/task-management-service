import { test, expect } from "bun:test";
import { TaskStatus } from "../TaskStatus";

test("TaskStatus.fromString should parse valid statuses", () => {
  expect(TaskStatus.fromString("pending")).toEqual(TaskStatus.PENDING);
  expect(TaskStatus.fromString("in_progress")).toEqual(TaskStatus.IN_PROGRESS);
  expect(TaskStatus.fromString("in-progress")).toEqual(TaskStatus.IN_PROGRESS);
  expect(TaskStatus.fromString("completed")).toEqual(TaskStatus.COMPLETED);
  expect(TaskStatus.fromString("cancelled")).toEqual(TaskStatus.CANCELLED);
});

test("TaskStatus.fromString should be case insensitive", () => {
  expect(TaskStatus.fromString("PENDING")).toEqual(TaskStatus.PENDING);
  expect(TaskStatus.fromString("Completed")).toEqual(TaskStatus.COMPLETED);
});

test("TaskStatus.fromString should throw error for invalid status", () => {
  expect(() => TaskStatus.fromString("invalid")).toThrow("Invalid task status");
});

test("TaskStatus.equals should correctly compare statuses", () => {
  const status1 = TaskStatus.PENDING;
  const status2 = TaskStatus.PENDING;
  const status3 = TaskStatus.COMPLETED;

  expect(status1.equals(status2)).toBe(true);
  expect(status1.equals(status3)).toBe(false);
});

test("TaskStatus.getAll should return all statuses", () => {
  const allStatuses = TaskStatus.getAll();
  expect(allStatuses.length).toBe(4);
  expect(allStatuses).toContain(TaskStatus.PENDING);
  expect(allStatuses).toContain(TaskStatus.IN_PROGRESS);
  expect(allStatuses).toContain(TaskStatus.COMPLETED);
  expect(allStatuses).toContain(TaskStatus.CANCELLED);
});

test("TaskStatus should have correct value", () => {
  expect(TaskStatus.PENDING.value).toBe("pending");
  expect(TaskStatus.COMPLETED.value).toBe("completed");
  expect(TaskStatus.IN_PROGRESS.value).toBe("in_progress");
  expect(TaskStatus.CANCELLED.value).toBe("cancelled");
});

