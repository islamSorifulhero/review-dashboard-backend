import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { config } from "./config";
import authRoutes from "./routes/auth";
import submissionRoutes from "./routes/submissions";
import { errorHandler, notFound } from "./middleware/error";

export const app = express();
app.set("trust proxy", 1); // correct client IPs behind a proxy (needed for rate limiting in production)
app.use(helmet());
app.use(cors({ origin: config.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/submissions", submissionRoutes);

app.use(notFound);
app.use(errorHandler);
