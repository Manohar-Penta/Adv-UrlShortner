import { redisClient } from "../lib/redisClient";

export async function getRedisData(key: string) {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
}
