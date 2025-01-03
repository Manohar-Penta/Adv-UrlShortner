import { createClient } from "redis";

const client = createClient({ url: process.env.REDIS_CLIENT_URL as string });

client.on("error", (error) => {
  console.error("---------------------------------------------------------");
  console.error(error);
});

client.on("connect", () => {
  console.error("---------------------------------------------------------");
  console.log("Redis client Connected..");
});

client.on("end", () => {
  console.error("---------------------------------------------------------");
  console.log("client connection ended");
});

if (!client.isOpen)
  client.connect().catch((err) => {
    console.log("cannot connect to the redis client..");
  });

export { client as redisClient };
