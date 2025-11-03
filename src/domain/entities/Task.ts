import { TaskStatus } from "../value-objects/TaskStatus";
import { DueDate } from "../value-objects/DueDate";

export class Task {
  private constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly status: TaskStatus,
    public readonly dueDate: DueDate | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    id: string,
    title: string,
    description: string | null,
    status: TaskStatus,
    dueDate: DueDate | null,
    createdAt: Date,
    updatedAt: Date
  ): Task {
    return new Task(id, title, description, status, dueDate, createdAt, updatedAt);
  }

  static fromPersistence(
    id: string,
    title: string,
    description: string | null,
    status: string,
    dueDate: Date | null,
    createdAt: Date,
    updatedAt: Date
  ): Task {
    return new Task(
      id,
      title,
      description,
      TaskStatus.fromString(status),
      dueDate ? DueDate.fromDate(dueDate) : null,
      createdAt,
      updatedAt
    );
  }

  complete(): Task {
    return new Task(
      this.id,
      this.title,
      this.description,
      TaskStatus.COMPLETED,
      this.dueDate,
      this.createdAt,
      new Date()
    );
  }

  update(
    title?: string,
    description?: string | null,
    status?: TaskStatus,
    dueDate?: DueDate | null
  ): Task {
    return new Task(
      this.id,
      title ?? this.title,
      description !== undefined ? description : this.description,
      status ?? this.status,
      dueDate !== undefined ? dueDate : this.dueDate,
      this.createdAt,
      new Date()
    );
  }

  isDueWithinHours(hours: number): boolean {
    if (!this.dueDate) {
      return false;
    }
    const now = new Date();
    const dueTime = this.dueDate.value.getTime();
    const hoursInMs = hours * 60 * 60 * 1000;
    return dueTime - now.getTime() <= hoursInMs && dueTime > now.getTime();
  }
}

