export class TaskStatus {
  public static readonly PENDING = new TaskStatus("pending");
  public static readonly IN_PROGRESS = new TaskStatus("in_progress");
  public static readonly COMPLETED = new TaskStatus("completed");
  public static readonly CANCELLED = new TaskStatus("cancelled");

  private constructor(public readonly value: string) {}

  static fromString(status: string): TaskStatus {
    switch (status.toLowerCase()) {
      case "pending":
        return TaskStatus.PENDING;
      case "in_progress":
      case "in-progress":
        return TaskStatus.IN_PROGRESS;
      case "completed":
        return TaskStatus.COMPLETED;
      case "cancelled":
        return TaskStatus.CANCELLED;
      default:
        throw new Error(`Invalid task status: ${status}`);
    }
  }

  static getAll(): TaskStatus[] {
    return [
      TaskStatus.PENDING,
      TaskStatus.IN_PROGRESS,
      TaskStatus.COMPLETED,
      TaskStatus.CANCELLED,
    ];
  }

  equals(other: TaskStatus): boolean {
    return this.value === other.value;
  }
}

