import rateLimit from "express-rate-limit";

const base = { standardHeaders: true, legacyHeaders: false } as const;

// login/signup: brute-force protection, keyed by IP
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { message: "Too many attempts. Please try again in a few minutes." },
});

// submissions: spam protection, keyed by user (runs after authenticate)
export const submissionLimiter = rateLimit({
  ...base,
  windowMs: 10 * 60 * 1000,
  limit: 5,
  keyGenerator: (req) => req.user!.id,
  message: { message: "You are submitting too fast. Please wait a few minutes." },
});
