import { Queue } from "bullmq";
import { RedisConnection } from "./redisConnection";

const redis = RedisConnection.getInstance();

export const paymentsQueue = new Queue("payments", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});

export const dbQueue = new Queue("db", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});

export const failedTransactionsQueue = new Queue("failedTransactions", {
  connection: redis,
});

export const lockAccount = async (account: string) => {
    const lockKey = `lock:${account}`;
    const acquired = await redis.setnx(lockKey, "locked"); // 120s expiry
    if (acquired) {
        await redis.expire(lockKey, 120);
    }
    return acquired ? true : false;
}

export const unlockAccount = async (account: string) => {
    await redis.del(`lock:${account}`);
}