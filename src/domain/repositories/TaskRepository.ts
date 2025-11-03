import { Task } from "../entities/Task";
import { TaskStatus } from "../value-objects/TaskStatus";

export interface PaginationResult {
  items: Task[];
  total: number;
}

export interface TaskRepository {
  save(task: Task): Promise<Task>;
  findById(id: string): Promise<Task | null>;
  findAll(status?: TaskStatus): Promise<Task[]>;
  findPaginated(
    page: number,
    limit: number,
    status?: TaskStatus
  ): Promise<PaginationResult>;
  delete(id: string): Promise<void>;
}

