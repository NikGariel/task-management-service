export interface NotificationService {
  scheduleNotification(taskId: string, dueDate: Date): Promise<void>;
}

