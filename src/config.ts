import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().default("http://localhost:3000"),
  NODE_ENV: z.string().default("development"),
});

export const config = schema.parse(process.env);
export const isProd = config.NODE_ENV === "production";
