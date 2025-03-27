import { Redis } from "ioredis";

export class RedisConnection {
    private static instance: Redis;

    private constructor() {
    }

    public static getInstance(): Redis {
        if (!RedisConnection.instance) {
            RedisConnection.instance = new Redis({
                host: process.env.REDIS_HOST,
                port: parseInt(process.env.REDIS_PORT || "6379"),
                password: process.env.REDIS_PASSWORD,
            });
        }
        return RedisConnection.instance;
    }

}