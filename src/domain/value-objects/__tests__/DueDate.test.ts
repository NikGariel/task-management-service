import { test, expect } from "bun:test";
import { DueDate } from "../DueDate";

test("DueDate.create should create valid DueDate from Date", () => {
  const date = new Date("2024-12-31T23:59:59Z");
  const dueDate = DueDate.create(date);

  expect(dueDate.value).toEqual(date);
});

test("DueDate.fromString should parse valid ISO date string", () => {
  const dateString = "2024-12-31T23:59:59Z";
  const dueDate = DueDate.fromString(dateString);

  // Compare dates by timestamp since toISOString might add milliseconds
  const expectedDate = new Date(dateString);
  expect(dueDate.value.getTime()).toBe(expectedDate.getTime());
});

test("DueDate.fromString should throw error for invalid date", () => {
  expect(() => DueDate.fromString("invalid-date")).toThrow("Invalid date string");
});

test("DueDate.isInPast should correctly identify past dates", () => {
  const pastDate = new Date("2020-01-01");
  const dueDate = DueDate.create(pastDate);

  expect(dueDate.isInPast()).toBe(true);
});

test("DueDate.isInPast should correctly identify future dates", () => {
  const futureDate = new Date("2099-12-31");
  const dueDate = DueDate.create(futureDate);

  expect(dueDate.isInPast()).toBe(false);
});

test("DueDate.isWithinHours should correctly check if date is within hours", () => {
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
  const dueDate = DueDate.create(inOneHour);

  expect(dueDate.isWithinHours(24)).toBe(true);
  expect(dueDate.isWithinHours(1)).toBe(true);
  expect(dueDate.isWithinHours(0.5)).toBe(true);
});

test("DueDate.isWithinHours should return false for dates beyond the time window", () => {
  const now = new Date();
  const inThreeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours from now
  const dueDate = DueDate.create(inThreeHours);

  expect(dueDate.isWithinHours(1)).toBe(false); // 3 hours > 1 hour window
  expect(dueDate.isWithinHours(2)).toBe(false); // 3 hours > 2 hour window
  expect(dueDate.isWithinHours(4)).toBe(true); // 3 hours <= 4 hour window
});

test("DueDate.equals should correctly compare dates", () => {
  const date1 = new Date("2024-12-31T23:59:59Z");
  const date2 = new Date("2024-12-31T23:59:59Z");
  const date3 = new Date("2025-01-01T00:00:00Z");

  const dueDate1 = DueDate.create(date1);
  const dueDate2 = DueDate.create(date2);
  const dueDate3 = DueDate.create(date3);

  expect(dueDate1.equals(dueDate2)).toBe(true);
  expect(dueDate1.equals(dueDate3)).toBe(false);
});

