import { z } from "zod";

export const normalizeRepoUrl = (url: string) =>
  url.trim().toLowerCase().replace(/\/+$/, "").replace(/\.git$/, "");

const githubRepo = /^https:\/\/github\.com\/[a-z0-9_.-]+\/[a-z0-9_.-]+$/;

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/\d/, "Password must contain a number"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const submissionSchema = z.object({
  projectName: z.string().trim().min(3, "Project name must be at least 3 characters").max(80),
  repoUrl: z
    .string()
    .trim()
    .transform(normalizeRepoUrl)
    .pipe(z.string().regex(githubRepo, "Must be a GitHub repo URL like https://github.com/owner/repo")),
  liveUrl: z
    .union([
      z.literal("").transform(() => undefined),
      z
        .string()
        .trim()
        .url("Must be a valid URL")
        .refine((u) => /^https?:\/\//i.test(u), "Must start with http:// or https://"),
    ])
    .optional(),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(1000),
});

export const listQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  feedback: z.string().trim().max(500).optional(),
});
