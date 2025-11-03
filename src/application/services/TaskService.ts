import { Task } from "../../domain/entities/Task";
import { TaskRepository } from "../../domain/repositories/TaskRepository";
import { TaskStatus } from "../../domain/value-objects/TaskStatus";
import { DueDate } from "../../domain/value-objects/DueDate";
import { CreateTaskDTO } from "../dto/CreateTaskDTO";
import { UpdateTaskDTO } from "../dto/UpdateTaskDTO";
import { TaskResponseDTO } from "../dto/TaskResponseDTO";
import { PagedResponseDTO } from "../dto/PagedResponseDTO";
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT, MIN_PAGE } from "../dto/PaginationParams";
import { NotificationService } from "./NotificationService";
import { NotFoundException, ValidationException } from "../exceptions/ApplicationException";

export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly notificationService: NotificationService
  ) {}

  async createTask(dto: CreateTaskDTO): Promise<TaskResponseDTO> {
    const dueDate = dto.dueDate ? DueDate.fromString(dto.dueDate) : null;
    const task = Task.create(
      crypto.randomUUID(),
      dto.title,
      dto.description || null,
      TaskStatus.PENDING,
      dueDate,
      new Date(),
      new Date()
    );

    const savedTask = await this.taskRepository.save(task);

    // Schedule notification if due date is within 24 hours
    if (dueDate && task.isDueWithinHours(24)) {
      await this.notificationService.scheduleNotification(
        savedTask.id,
        dueDate.value
      );
    }

    return this.toDTO(savedTask);
  }

  async getTaskById(id: string): Promise<TaskResponseDTO> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundException("Task", id);
    }
    return this.toDTO(task);
  }

  async getAllTasks(status?: string): Promise<TaskResponseDTO[]> {
    const taskStatus = status ? TaskStatus.fromString(status) : undefined;
    const tasks = await this.taskRepository.findAll(taskStatus);
    return tasks.map((task) => this.toDTO(task));
  }

  async getTasksPaginated(
    page: number = DEFAULT_PAGE,
    limit: number = DEFAULT_LIMIT,
    status?: string
  ): Promise<PagedResponseDTO<TaskResponseDTO>> {
    // Validate pagination parameters
    if (page < MIN_PAGE) {
      throw new ValidationException(`Page must be at least ${MIN_PAGE}`, {
        page: `Page must be at least ${MIN_PAGE}`,
      });
    }

    if (limit < 1) {
      throw new ValidationException("Limit must be at least 1", {
        limit: "Limit must be at least 1",
      });
    }

    if (limit > MAX_LIMIT) {
      throw new ValidationException(`Limit cannot exceed ${MAX_LIMIT}`, {
        limit: `Limit cannot exceed ${MAX_LIMIT}`,
      });
    }

    const taskStatus = status ? TaskStatus.fromString(status) : undefined;
    const result = await this.taskRepository.findPaginated(page, limit, taskStatus);

    const totalPages = Math.ceil(result.total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > MIN_PAGE;

    return {
      data: result.items.map((task) => this.toDTO(task)),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
        hasNext,
        hasPrevious,
      },
    };
  }

  async updateTask(
    id: string,
    dto: UpdateTaskDTO
  ): Promise<TaskResponseDTO> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundException("Task", id);
    }

    const status = dto.status ? TaskStatus.fromString(dto.status) : undefined;
    const dueDate = dto.dueDate
      ? DueDate.fromString(dto.dueDate)
      : dto.dueDate === null
        ? null
        : undefined;

    const updatedTask = task.update(dto.title, dto.description, status, dueDate);
    const savedTask = await this.taskRepository.save(updatedTask);

    // Schedule notification if due date is within 24 hours
    if (
      dueDate !== undefined &&
      dueDate !== null &&
      updatedTask.isDueWithinHours(24)
    ) {
      await this.notificationService.scheduleNotification(
        savedTask.id,
        dueDate.value
      );
    }

    return this.toDTO(savedTask);
  }

  async deleteTask(id: string): Promise<void> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundException("Task", id);
    }
    await this.taskRepository.delete(id);
  }

  private toDTO(task: Task): TaskResponseDTO {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status.value,
      dueDate: task.dueDate?.value.toISOString() || null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }
}

