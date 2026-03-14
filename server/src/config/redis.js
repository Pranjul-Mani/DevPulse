import Redis from "ioredis";

let redis = null;

export const getRedis = () => {
  if (!redis) {
    redis = new Redis(process.env.UPSTASH_REDIS_URL, {
      password: process.env.UPSTASH_REDIS_TOKEN,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: process.env.NODE_ENV === "production" ? {} : undefined,
    });
  }
  return redis;
};

export default getRedis;
