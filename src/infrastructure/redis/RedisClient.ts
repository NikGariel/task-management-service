import Redis from "ioredis";

export class RedisClient {
  private client: Redis;

  constructor() {
    const redisUrl =
      process.env.REDIS_URL || "redis://localhost:6379";
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
          return Math.min(times * 50, 2000);
      },
    });

    this.client.on("error", (err: Error) => {
      console.error("Redis Client Error:", err);
    });

    this.client.on("connect", () => {
      console.log("Redis Client Connected");
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async close(): Promise<void> {
    await this.client.quit();
  }
}

