import { NotificationService } from "../../application/services/NotificationService";
import { RedisClient } from "../redis/RedisClient";
import { appendFile } from "fs/promises";
import { join } from "path";

const NOTIFICATIONS_FILE = join(process.cwd(), "notifications.log");

export class RedisNotificationService implements NotificationService {
  constructor(private readonly redisClient: RedisClient) {
    this.initializeWorker();
  }

  async scheduleNotification(taskId: string, dueDate: Date): Promise<void> {
    const notificationKey = `notification:${taskId}`;
    const notificationData = {
      taskId,
      dueDate: dueDate.toISOString(),
      scheduledAt: new Date().toISOString(),
    };

    // Store notification data in Redis
    await this.redisClient
      .getClient()
      .setex(
        notificationKey,
        86400, // 24 hours TTL
        JSON.stringify(notificationData)
      );

    // Add to queue for processing
    await this.redisClient
      .getClient()
      .lpush("notification:queue", JSON.stringify(notificationData));
  }

  private initializeWorker(): void {
    // Worker to process notifications from queue
    setInterval(async () => {
      try {
        const notificationData = await this.redisClient
          .getClient()
          .rpop("notification:queue");

        if (notificationData) {
          const data = JSON.parse(notificationData);
          await this.processNotification(data);
        }
      } catch (error) {
        console.error("Error processing notification:", error);
      }
    }, 5000); // Check every 5 seconds
  }

  private async processNotification(data: {
    taskId: string;
    dueDate: string;
    scheduledAt: string;
  }): Promise<void> {
    const dueDate = new Date(data.dueDate);
    const now = new Date();
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDue <= 24 && hoursUntilDue > 0) {
      const message = `[${new Date().toISOString()}] Notification: Task ${data.taskId} is due in ${hoursUntilDue.toFixed(2)} hours (Due: ${dueDate.toISOString()})\n`;
      
      try {
        await appendFile(NOTIFICATIONS_FILE, message, "utf-8");
        console.log(`Notification logged: Task ${data.taskId} due in ${hoursUntilDue.toFixed(2)} hours`);
      } catch (error) {
        console.error("Error writing notification to file:", error);
      }
    }
  }
}

