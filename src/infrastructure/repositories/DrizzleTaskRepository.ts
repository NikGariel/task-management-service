import { eq, count, desc } from "drizzle-orm";
import { TaskRepository, PaginationResult } from "../../domain/repositories/TaskRepository";
import { Task } from "../../domain/entities/Task";
import { TaskStatus } from "../../domain/value-objects/TaskStatus";
import { db } from "../database/connection";
import { tasks } from "../database/schema";

export class DrizzleTaskRepository implements TaskRepository {
  async save(task: Task): Promise<Task> {
    const taskData = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status.value,
      dueDate: task.dueDate?.value || null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };

    const existing = await db.select().from(tasks).where(eq(tasks.id, task.id)).limit(1);

    if (existing.length > 0) {
      await db.update(tasks).set(taskData).where(eq(tasks.id, task.id));
    } else {
      await db.insert(tasks).values(taskData);
    }

    return task;
  }

  async findById(id: string): Promise<Task | null> {
    const result = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return Task.fromPersistence(
      row.id,
      row.title,
      row.description,
      row.status,
      row.dueDate,
      row.createdAt,
      row.updatedAt
    );
  }

  async findAll(status?: TaskStatus): Promise<Task[]> {
    const result = status
      ? await db
          .select()
          .from(tasks)
          .where(eq(tasks.status, status.value))
      : await db.select().from(tasks);

    return result.map((row) =>
      Task.fromPersistence(
        row.id,
        row.title,
        row.description,
        row.status,
        row.dueDate,
        row.createdAt,
        row.updatedAt
      )
    );
  }

  async findPaginated(
    page: number,
    limit: number,
    status?: TaskStatus
  ): Promise<PaginationResult> {
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = status
      ? db.select({ count: count() }).from(tasks).where(eq(tasks.status, status.value))
      : db.select({ count: count() }).from(tasks);

    // Get paginated data (sorted by createdAt descending - newest first)
    const dataQuery = status
      ? db
          .select()
          .from(tasks)
          .where(eq(tasks.status, status.value))
          .orderBy(desc(tasks.createdAt))
          .limit(limit)
          .offset(offset)
      : db
          .select()
          .from(tasks)
          .orderBy(desc(tasks.createdAt))
          .limit(limit)
          .offset(offset);

    const [countResult, dataResult] = await Promise.all([
      countQuery,
      dataQuery,
    ]);

    const total = Number(countResult[0].count);

    const items = dataResult.map((row) =>
      Task.fromPersistence(
        row.id,
        row.title,
        row.description,
        row.status,
        row.dueDate,
        row.createdAt,
        row.updatedAt
      )
    );

    return {
      items,
      total,
    };
  }

  async delete(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }
}

