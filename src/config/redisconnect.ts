import { createClient } from "redis";
import RedisStore from "connect-redis";

const client = await createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT as string),
  },
})
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

export const redisStore = new RedisStore({
  client: client,
  prefix: "bkartisan:",
})

export default client;
