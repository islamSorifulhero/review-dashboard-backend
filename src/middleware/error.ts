import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../lib/errors";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: "Validation failed", fieldErrors: err.flatten().fieldErrors });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message, fieldErrors: err.fieldErrors });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    const target = String(err.meta?.target ?? "");
    if (target.includes("repoUrl")) {
      return res.status(409).json({
        message: "This repository has already been submitted",
        fieldErrors: { repoUrl: ["This repository has already been submitted"] },
      });
    }
    if (target.includes("email")) {
      return res.status(409).json({
        message: "An account with this email already exists",
        fieldErrors: { email: ["An account with this email already exists"] },
      });
    }
    return res.status(409).json({ message: "Duplicate record" });
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong on our side" });
}
